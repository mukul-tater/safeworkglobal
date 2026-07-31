/** Auth email used when worker signs up with mobile only (no email on signup form). */
export const WORKER_MOBILE_AUTH_EMAIL_DOMAIN = 'workers.safeworkglobal.app';

/** Auth email used when eMitra partner signs up with mobile only. */
export const PARTNER_MOBILE_AUTH_EMAIL_DOMAIN = 'partners.safeworkglobal.app';

export function workerAuthEmailFromMobile(mobile: string): string {
  const digits = mobile.replace(/\D/g, '').slice(-10);
  return `m${digits}@${WORKER_MOBILE_AUTH_EMAIL_DOMAIN}`;
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
