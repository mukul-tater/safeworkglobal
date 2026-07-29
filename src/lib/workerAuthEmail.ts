/** Auth email used when worker signs up with mobile only (no email on signup form). */
export const WORKER_MOBILE_AUTH_EMAIL_DOMAIN = 'workers.safeworkglobal.app';

export function workerAuthEmailFromMobile(mobile: string): string {
  const digits = mobile.replace(/\D/g, '').slice(-10);
  return `m${digits}@${WORKER_MOBILE_AUTH_EMAIL_DOMAIN}`;
}

export function isWorkerMobileAuthEmail(email: string | null | undefined): boolean {
  if (!email) return true;
  return email.toLowerCase().endsWith(`@${WORKER_MOBILE_AUTH_EMAIL_DOMAIN}`);
}
