/** Shared Firebase phone-OTP checks for edge functions. */

export const DEFAULT_FIREBASE_API_KEY = 'AIzaSyB27N7cODGEhPFJdJm-CFAoedTeW2OeJh0';

export function normalizeIndianMobile(value: string): string | null {
  const digits = String(value || '').replace(/\D/g, '');
  const local = digits.length >= 10 ? digits.slice(-10) : digits;
  return /^[6-9]\d{9}$/.test(local) ? local : null;
}

export function allowDevOtpBypass(): boolean {
  const url = Deno.env.get('SUPABASE_URL') || '';
  return /localhost|127\.0\.0\.1/i.test(url);
}

export async function phoneFromFirebaseIdToken(idToken: string): Promise<string> {
  const apiKey = (
    Deno.env.get('FIREBASE_API_KEY') ||
    Deno.env.get('VITE_FIREBASE_API_KEY') ||
    DEFAULT_FIREBASE_API_KEY
  ).trim();
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    },
  );
  const body = (await response.json()) as {
    users?: { phoneNumber?: string }[];
    error?: { message?: string };
  };
  if (!response.ok) {
    throw new Error(body.error?.message || 'Invalid or expired verification. Request a new OTP.');
  }
  const phoneNumber = body.users?.[0]?.phoneNumber;
  if (!phoneNumber) {
    throw new Error('Phone number was not verified. Request a new OTP.');
  }
  return phoneNumber;
}

/** Verify a Firebase (or local-dev) ID token and return the 10-digit Indian mobile. */
export async function verifiedMobileFromIdToken(idToken: string, expectedMobile: string): Promise<string> {
  const mobile = normalizeIndianMobile(expectedMobile);
  if (!mobile) {
    throw new Error('Enter a valid 10-digit Indian mobile number.');
  }
  const token = String(idToken || '').trim();
  if (!token) {
    throw new Error('Verification is required.');
  }
  if (token.startsWith('dev-otp:')) {
    if (!allowDevOtpBypass()) {
      throw new Error('Invalid or expired verification. Request a new OTP.');
    }
    return mobile;
  }
  const tokenPhone = normalizeIndianMobile(await phoneFromFirebaseIdToken(token));
  if (!tokenPhone || tokenPhone !== mobile) {
    throw new Error('Verified phone does not match the number you entered.');
  }
  return mobile;
}
