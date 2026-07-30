import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Web Push implementation using the Web Push Protocol
async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<Response> {
  const encoder = new TextEncoder();
  
  // Generate ECDH key pair for encryption
  const localKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );

  // Import subscriber's public key
  const subscriberPublicKeyBytes = base64UrlDecode(subscription.p256dh);
  const subscriberPublicKey = await crypto.subtle.importKey(
    "raw",
    subscriberPublicKeyBytes,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  // Derive shared secret
  const sharedSecret = await crypto.subtle.deriveBits(
    { name: "ECDH", public: subscriberPublicKey },
    localKeyPair.privateKey,
    256
  );

  // Export local public key
  const localPublicKeyBytes = await crypto.subtle.exportKey("raw", localKeyPair.publicKey);

  // Auth secret
  const authSecret = base64UrlDecode(subscription.auth);

  // Derive encryption key using HKDF
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  // PRK = HKDF-Extract(auth_secret, ecdh_secret)
  const prkKey = await crypto.subtle.importKey(
    "raw",
    authSecret,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const prk = await crypto.subtle.sign("HMAC", prkKey, new Uint8Array(sharedSecret));

  // IKM for content encryption
  const keyInfoBytes = concatUint8Arrays(
    encoder.encode("WebPush: info\0"),
    subscriberPublicKeyBytes,
    new Uint8Array(localPublicKeyBytes)
  );
  
  const ikmKey = await crypto.subtle.importKey(
    "raw",
    prk,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const ikm = await crypto.subtle.sign("HMAC", ikmKey, concatUint8Arrays(keyInfoBytes, new Uint8Array([1])));

  // CEK and nonce
  const cekInfo = encoder.encode("Content-Encoding: aes128gcm\0");
  const nonceInfo = encoder.encode("Content-Encoding: nonce\0");

  const cekKey = await crypto.subtle.importKey(
    "raw",
    new Uint8Array(ikm).slice(0, 32),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const cekFull = await crypto.subtle.sign("HMAC", cekKey, concatUint8Arrays(salt, cekInfo, new Uint8Array([1])));
  const cek = new Uint8Array(cekFull).slice(0, 16);
  
  const nonceFull = await crypto.subtle.sign("HMAC", cekKey, concatUint8Arrays(salt, nonceInfo, new Uint8Array([1])));
  const nonce = new Uint8Array(nonceFull).slice(0, 12);

  // Encrypt payload
  const encryptionKey = await crypto.subtle.importKey(
    "raw",
    cek,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  const paddedPayload = concatUint8Arrays(encoder.encode(payload), new Uint8Array([2]));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonce },
    encryptionKey,
    paddedPayload
  );

  // Build encrypted content
  const recordSize = new Uint8Array(4);
  new DataView(recordSize.buffer).setUint32(0, 4096, false);
  
  const body = concatUint8Arrays(
    salt,
    recordSize,
    new Uint8Array([65]), // key length
    new Uint8Array(localPublicKeyBytes),
    new Uint8Array(encrypted)
  );

  // Create VAPID JWT
  const vapidJwt = await createVapidJwt(subscription.endpoint, vapidPublicKey, vapidPrivateKey);

  // Send push
  return fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Encoding": "aes128gcm",
      "TTL": "86400",
      "Authorization": `vapid t=${vapidJwt}, k=${vapidPublicKey}`,
    },
    body,
  });
}

async function createVapidJwt(endpoint: string, publicKey: string, privateKey: string): Promise<string> {
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;
  
  const header = { alg: "ES256", typ: "JWT" };
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
    sub: "mailto:notifications@safework.global",
  };

  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import private key
  const privateKeyBytes = base64UrlDecode(privateKey);
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    privateKeyBytes,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  return `${unsignedToken}.${base64UrlEncode(new Uint8Array(signature))}`;
}

function base64UrlEncode(data: string | Uint8Array): string {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(base64 + padding);
  return new Uint8Array([...binary].map((c) => c.charCodeAt(0)));
}

function concatUint8Arrays(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((acc, arr) => acc + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require authenticated caller
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const authClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: claims, error: authError } = await authClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (authError || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerId = claims.claims.sub as string;

    const { userId, title, message, url, notificationId } = await req.json();

    // Validate the recipient id is a real UUID before it is used in any filter.
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (typeof userId !== "string" || !UUID_RE.test(userId)) {
      return new Response(JSON.stringify({ error: "Invalid userId" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Caller may only push to themselves unless they are an admin or have an
    // existing employer<->worker relationship with the recipient.
    if (userId !== callerId) {
      const { data: isAdmin } = await authClient.rpc("has_role", { _user_id: callerId, _role: "admin" });
      if (!isAdmin) {
        const [asEmployer, asWorker] = await Promise.all([
          authClient
            .from("job_applications")
            .select("id")
            .eq("employer_id", callerId)
            .eq("worker_id", userId)
            .limit(1)
            .maybeSingle(),
          authClient
            .from("job_applications")
            .select("id")
            .eq("employer_id", userId)
            .eq("worker_id", callerId)
            .limit(1)
            .maybeSingle(),
        ]);
        if (!asEmployer.data && !asWorker.data) {
          return new Response(JSON.stringify({ error: "Forbidden" }), {
            status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    // Validate URL is internal (no external links)
    if (url && typeof url === "string" && !url.startsWith("/")) {
      return new Response(JSON.stringify({ error: "Invalid url: must be internal path" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.log("VAPID keys not configured, skipping push notification");
      return new Response(
        JSON.stringify({ success: false, message: "Push notifications not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user's push subscriptions
    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      throw error;
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No push subscriptions found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = JSON.stringify({
      title,
      message,
      url,
      id: notificationId,
    });

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          const response = await sendWebPush(
            { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
            payload,
            vapidPublicKey,
            vapidPrivateKey
          );

          if (!response.ok) {
            // Remove invalid subscription
            if (response.status === 404 || response.status === 410) {
              await supabase
                .from("push_subscriptions")
                .delete()
                .eq("id", sub.id);
            }
            throw new Error(`Push failed: ${response.status}`);
          }

          return { success: true };
        } catch (err) {
          console.error("Push error:", err);
          return { success: false, error: err.message };
        }
      })
    );

    const successCount = results.filter(
      (r) => r.status === "fulfilled" && r.value.success
    ).length;

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        total: subscriptions.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
