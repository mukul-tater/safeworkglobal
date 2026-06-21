/** Worker-facing support contact — used for WhatsApp FAB and help links. */
export const WORKER_SUPPORT_PHONE_DISPLAY = "+91 99500 85843";
export const WORKER_SUPPORT_PHONE_E164 = "919950085843";

const defaultWhatsAppMessage =
  "Namaste, mujhe SafeWorkGlobal par madad chahiye.";

export function getWorkerWhatsAppUrl(message = defaultWhatsAppMessage): string {
  return `https://wa.me/${WORKER_SUPPORT_PHONE_E164}?text=${encodeURIComponent(message)}`;
}
