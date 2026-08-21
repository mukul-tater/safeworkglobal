const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password12', 'password123', 'passw0rd',
  '123456', '1234567', '12345678', '123456789', '1234567890',
  'qwerty', 'qwerty123', 'abc123', 'abcd1234', '111111', '11111111',
  '000000', '654321', 'iloveyou', 'admin', 'welcome', 'welcome1',
  'monkey', 'dragon', 'master', 'login', 'letmein', 'football',
  'princess', 'sunshine', 'whatever', 'trustno1', 'hello123',
  'admin123', 'root123', 'pass123', 'user123', 'test1234',
]);

export const WEAK_PASSWORD_MESSAGE =
  'That password is too easy to guess. Use at least 8 characters, mix letters and numbers, and avoid common passwords.';

export function isWeakPasswordAuthError(message: string): boolean {
  return /weak|easy to guess|pwned|leaked password|not strong enough/i.test(message);
}

/** Sync checks before sending OTP so a weak password is not discovered on the SMS step. */
export function passwordSignupIssue(
  password: string,
  extras?: { email?: string; mobile?: string },
): string | null {
  if (password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  if (password.length > 72) {
    return 'Password is too long';
  }
  const lower = password.toLowerCase();
  if (COMMON_PASSWORDS.has(lower)) {
    return WEAK_PASSWORD_MESSAGE;
  }
  if (/^(.)\1+$/.test(password) || /^(0123456789|9876543210)/.test(password)) {
    return WEAK_PASSWORD_MESSAGE;
  }
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
    return 'Use letters and numbers in the password';
  }
  const mobile = (extras?.mobile || '').replace(/\D/g, '').slice(-10);
  if (mobile && password.includes(mobile)) {
    return 'Password should not include the mobile number';
  }
  const emailLocal = (extras?.email || '').split('@')[0]?.toLowerCase();
  if (emailLocal && emailLocal.length >= 4 && lower.includes(emailLocal)) {
    return 'Password should not include the email name';
  }
  return null;
}

async function sha1HexUpper(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const buf = await crypto.subtle.digest('SHA-1', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

/**
 * Have I Been Pwned k-anonymity check (same class of protection as Supabase Auth).
 * Returns true when the password appears in known leaks. Network failure → false.
 */
export async function isLeakedPassword(password: string): Promise<boolean> {
  if (!password || typeof crypto?.subtle?.digest !== 'function') return false;
  try {
    const hash = await sha1HexUpper(password);
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'Add-Padding': 'true' },
      signal: ctrl.signal,
    });
    window.clearTimeout(timer);
    if (!res.ok) return false;
    const body = await res.text();
    return body.split(/\r?\n/).some((line) => line.split(':')[0]?.trim().toUpperCase() === suffix);
  } catch {
    return false;
  }
}
