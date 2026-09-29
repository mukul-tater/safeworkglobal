/**
 * Delete a Firebase Auth user by Indian mobile so the number can be used again.
 * Requires a Firebase service account on the edge function:
 * FIREBASE_SERVICE_ACCOUNT_JSON, or FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY.
 */

type ServiceAccount = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

function normalizePrivateKey(value: string): string {
  return value.replace(/\\n/g, "\n").trim();
}

export function loadFirebaseServiceAccount(): ServiceAccount | null {
  const raw = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON")?.trim();
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as {
        project_id?: string;
        client_email?: string;
        private_key?: string;
      };
      if (parsed.project_id && parsed.client_email && parsed.private_key) {
        return {
          projectId: parsed.project_id,
          clientEmail: parsed.client_email,
          privateKey: normalizePrivateKey(parsed.private_key),
        };
      }
    } catch {
      return null;
    }
  }

  const projectId = Deno.env.get("FIREBASE_PROJECT_ID")?.trim();
  const clientEmail = Deno.env.get("FIREBASE_CLIENT_EMAIL")?.trim();
  const privateKey = Deno.env.get("FIREBASE_PRIVATE_KEY")?.trim();
  if (!projectId || !clientEmail || !privateKey) return null;
  return { projectId, clientEmail, privateKey: normalizePrivateKey(privateKey) };
}

/** 10-digit Indian mobile → E.164 (+91…). */
export function toIndianE164(value: string | null | undefined): string | null {
  const digits = String(value || "").replace(/\D/g, "");
  const local = digits.length >= 10 ? digits.slice(-10) : digits;
  return /^[6-9]\d{9}$/.test(local) ? `+91${local}` : null;
}

function base64url(data: Uint8Array | string): string {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function pemToPkcs8(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s/g, "");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function googleAccessToken(account: ServiceAccount): Promise<string> {
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToPkcs8(account.privateKey),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(JSON.stringify({
    iss: account.clientEmail,
    sub: account.clientEmail,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
    scope: "https://www.googleapis.com/auth/identitytoolkit https://www.googleapis.com/auth/firebase",
  }));
  const unsigned = `${header}.${payload}`;
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsigned),
  );
  const assertion = `${unsigned}.${base64url(new Uint8Array(signature))}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const body = (await response.json()) as { access_token?: string; error?: string; error_description?: string };
  if (!response.ok || !body.access_token) {
    throw new Error(body.error_description || body.error || "Could not authorize Firebase Admin.");
  }
  return body.access_token;
}

async function lookupLocalId(projectId: string, accessToken: string, phoneE164: string): Promise<string | null> {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:lookup`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phoneNumber: [phoneE164] }),
    },
  );
  const body = (await response.json()) as {
    users?: { localId?: string }[];
    error?: { message?: string };
  };
  if (!response.ok) {
    const message = body.error?.message || "";
    if (/USER_NOT_FOUND|not found/i.test(message)) return null;
    throw new Error(message || "Could not look up the Firebase phone user.");
  }
  return body.users?.[0]?.localId || null;
}

/**
 * Remove the Firebase Auth user that owns this phone.
 * Returns true when a user was deleted, false when none existed.
 */
export async function deleteFirebaseUserByPhone(phone: string): Promise<boolean> {
  const phoneE164 = toIndianE164(phone);
  if (!phoneE164) return false;

  const account = loadFirebaseServiceAccount();
  if (!account) {
    throw new Error("Firebase Admin is not configured. The mobile number was not removed.");
  }

  const accessToken = await googleAccessToken(account);
  const localId = await lookupLocalId(account.projectId, accessToken, phoneE164);
  if (!localId) return false;

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/projects/${account.projectId}/accounts:delete`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ localId }),
    },
  );
  if (response.ok) return true;

  const body = (await response.json().catch(() => ({}))) as { error?: { message?: string } };
  const message = body.error?.message || "";
  if (/USER_NOT_FOUND|not found/i.test(message)) return false;
  throw new Error(message || "Could not delete the Firebase phone user.");
}
