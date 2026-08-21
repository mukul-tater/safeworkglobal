/**
 * Phone OTP is Firebase Phone Auth in production (worker, partner, employer).
 * Local/dev can skip SMS and accept 123456 or any 6-digit code.
 */

export type OtpChannel = 'firebase' | 'dev-bypass';

export const DEV_OTP_CODE = '123456';

const PROD_HOSTS = new Set([
  'safeworkglobal.com',
  'www.safeworkglobal.com',
]);

function hostname(): string {
  if (typeof window === 'undefined') return '';
  return window.location.hostname.toLowerCase();
}

function isProductionHost(): boolean {
  const host = hostname();
  if (!host) return false;
  if (PROD_HOSTS.has(host)) return true;
  return host.endsWith('.safeworkglobal.com');
}

/**
 * Dev-only: skip Firebase SMS. Never on production hosts, even if MODE is wrong.
 * Override: VITE_OTP_DEV_BYPASS=true|false
 */
export function isDevOtpBypassEnabled(): boolean {
  if (isProductionHost()) return false;
  const flag = String(import.meta.env.VITE_OTP_DEV_BYPASS || '').toLowerCase();
  if (flag === 'false' || flag === '0') return false;
  if (flag === 'true' || flag === '1') return true;
  return import.meta.env.DEV === true;
}

export function getOtpChannel(): OtpChannel {
  return isDevOtpBypassEnabled() ? 'dev-bypass' : 'firebase';
}

export function isOtpSixDigits(otp: string): boolean {
  return /^\d{6}$/.test(otp.replace(/\s/g, ''));
}

/** @deprecated Always false — UI uses Firebase Phone Auth (or local bypass). */
export function useBackendOtp(): boolean {
  return false;
}
