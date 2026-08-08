/**
 * Internal Auth login key for mobile-only signup.
 * Supabase email/password requires an email; workers verify via phone OTP then
 * sign in with mobile+password. This address is never a contact email.
 */
export const WORKER_MOBILE_AUTH_EMAIL_DOMAIN = 'workers.safeworkglobal.app';
export const PARTNER_MOBILE_AUTH_EMAIL_DOMAIN = 'partners.safeworkglobal.app';

export function workerAuthEmailFromMobile(mobile: string): string {
  const digits = mobile.replace(/\D/g, '').slice(-10);
  return `m${digits}@${WORKER_MOBILE_AUTH_EMAIL_DOMAIN}`;
}

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

export function isWorkerMobileAuthEmail(email: string | null | undefined): boolean {
  if (!email) return true;
  return email.toLowerCase().endsWith(`@${WORKER_MOBILE_AUTH_EMAIL_DOMAIN}`);
}

export function isPartnerMobileAuthEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.toLowerCase().endsWith(`@${PARTNER_MOBILE_AUTH_EMAIL_DOMAIN}`);
}

export function isSyntheticAuthEmail(email: string | null | undefined): boolean {
  if (!email?.trim()) return false;
  const lower = email.trim().toLowerCase();
  return (
    lower.endsWith(`@${WORKER_MOBILE_AUTH_EMAIL_DOMAIN}`) ||
    lower.endsWith(`@${PARTNER_MOBILE_AUTH_EMAIL_DOMAIN}`)
  );
}

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

export function normalizeIndianMobileDigits(phone: string): string {
  return phone.replace(/\D/g, '').slice(-10);
}
