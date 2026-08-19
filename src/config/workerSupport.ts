/** Worker-facing support contact — used for help links. */
export const WORKER_SUPPORT_EMAIL = "mukul@safeworkglobal.com";

export function getWorkerSupportMailtoUrl(subject = "SafeWork Global – Worker Help"): string {
  return `mailto:${WORKER_SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}
