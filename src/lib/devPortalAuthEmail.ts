import {
  PARTNER_MOBILE_AUTH_EMAIL_DOMAIN,
  workerAuthEmailFromMobile,
} from './workerAuthEmail.ts';

/** Three separate dev logins for one handset. Production signup does not use these. */
export type DevLoginPortal = 'worker' | 'emitra' | 'ssvn';

/**
 * Auth email for that portal's own user.
 * E-Mitra and SSVN are not `emitra{mobile}@…` — that address is treated as the
 * same mobile as the worker account, so it cannot be a second user.
 */
export function devPortalAuthEmail(portal: DevLoginPortal, mobile: string): string {
  const digits = mobile.replace(/\D/g, '').slice(-10);
  if (portal === 'worker') return workerAuthEmailFromMobile(digits);
  const kind = portal === 'emitra' ? 'emitra' : 'ssvn';
  return `dev.${kind}.${digits}@${PARTNER_MOBILE_AUTH_EMAIL_DOMAIN}`;
}

/**
 * Phone stored on that user. Worker keeps the real number.
 * E-Mitra and SSVN get their own 10-digit values so uniqueness still sees 3 accounts.
 * Sign-in on each portal still uses the number you typed.
 */
export function devStoredPhone(portal: DevLoginPortal, mobile: string): string {
  const digits = mobile.replace(/\D/g, '').slice(-10);
  if (portal === 'worker' || digits.length !== 10) return digits;
  const mark = portal === 'emitra' ? '6' : '7';
  let stored = `${mark}${digits.slice(1)}`;
  if (stored === digits) {
    stored = `${stored.slice(0, 9)}${stored.endsWith('0') ? '1' : '0'}`;
  }
  return stored;
}
