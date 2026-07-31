/**
 * Internal Auth login key for mobile-only signup.
 * Supabase email/password requires an email; workers verify via Firebase OTP then
 * sign in with mobile+password. This address is never a contact email — hide it in UI.
 */
export const WORKER_MOBILE_AUTH_EMAIL_DOMAIN = 'workers.safeworkglobal.app';

/** Auth email used when eMitra partner signs up with mobile only. */
export const PARTNER_MOBILE_AUTH_EMAIL_DOMAIN = 'partners.safeworkglobal.app';

export function workerAuthEmailFromMobile(mobile: string): string {
  const digits = mobile.replace(/\D/g, '').slice(-10);
  return `m${digits}@${WORKER_MOBILE_AUTH_EMAIL_DOMAIN}`;
}

/**
 * Resolve a login identifier (10-digit mobile or email) to a Supabase Auth email.
 * Prefer RPC `resolve_worker_auth_email` so contact emails map to the auth account;
 * this local helper is the offline fallback (mobile → synthetic, email → as typed).
 */
export function workerAuthEmailFromIdentifier(identifier: string): string | null {
  const raw = identifier.trim();
  if (!raw) return null;
  if (raw.includes('@')) return raw.toLowerCase();
  const digits = raw.replace(/\D/g, '');
  if (digits.length >= 10) return workerAuthEmailFromMobile(digits);
  return null;
}

export function partnerAuthEmailFromMobile(mobile: string): string {
  const digits = mobile.replace(/\D/g, '').slice(-10);
  return `emitra${digits}@${PARTNER_MOBILE_AUTH_EMAIL_DOMAIN}`;
}

/** True for synthetic worker mobile-login emails (or empty — treat as “no real email”). */
export function isWorkerMobileAuthEmail(email: string | null | undefined): boolean {
  if (!email) return true;
  return email.toLowerCase().endsWith(`@${WORKER_MOBILE_AUTH_EMAIL_DOMAIN}`);
}

export function isPartnerMobileAuthEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.toLowerCase().endsWith(`@${PARTNER_MOBILE_AUTH_EMAIL_DOMAIN}`);
}

/** Synthetic Supabase auth emails that must never be shown as contact email. */
export function isSyntheticAuthEmail(email: string | null | undefined): boolean {
  if (!email?.trim()) return false;
  const lower = email.trim().toLowerCase();
  return (
    lower.endsWith(`@${WORKER_MOBILE_AUTH_EMAIL_DOMAIN}`) ||
    lower.endsWith(`@${PARTNER_MOBILE_AUTH_EMAIL_DOMAIN}`)
  );
}

/** Real contact email only — null when missing or a mobile-auth placeholder. */
export function displayableEmail(email: string | null | undefined): string | null {
  if (!email?.trim() || isSyntheticAuthEmail(email)) return null;
  return email.trim();
}

export function formatIndianMobile(phone: string | null | undefined): string | null {
  if (!phone?.trim()) return null;
  const digits = phone.replace(/\D/g, '').slice(-10);
  if (digits.length !== 10) return phone.trim();
  return `+91 ${digits}`;
}
