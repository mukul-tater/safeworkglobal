import { toast } from "sonner";
import { SAFEWORK_CONTACT } from "@/config/workerSupport";
import { shouldOfferWhatsAppErrorHelp } from "@/lib/whatsappErrorAudience";

export const WHATSAPP_ERROR_PROMPT = "Please forward this error on WhatsApp";
export const WHATSAPP_DOCUMENTS_PROMPT =
  "You can also send your documents and details on WhatsApp";

function clip(text: string, max = 500) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max)}…`;
}

export function whatsappSupportUrl(kind: "error" | "documents", errorText?: string) {
  const body =
    kind === "error"
      ? `Hello SafeWork Global, please help. I got this error:\n\n${clip(errorText || "An error occurred on the portal.")}`
      : "Hello SafeWork Global, I want to share my documents and details.";
  return `${SAFEWORK_CONTACT.whatsappUrl}?text=${encodeURIComponent(body)}`;
}

type ErrorToastData = {
  description?: unknown;
  action?: unknown;
  duration?: number;
};

let installed = false;

/** Every sonner error toast asks the user to forward it on WhatsApp. */
export function installWhatsAppErrorToasts() {
  if (installed) return;
  installed = true;

  const original = toast.error.bind(toast) as (
    message: unknown,
    data?: ErrorToastData,
  ) => string | number;

  toast.error = ((message: unknown, data?: ErrorToastData) => {
    if (!shouldOfferWhatsAppErrorHelp()) return original(message, data);

    const messageText = typeof message === "string" ? message : "";
    const descriptionText = typeof data?.description === "string" ? data.description : "";
    if (
      messageText.includes(WHATSAPP_ERROR_PROMPT) ||
      descriptionText.includes(WHATSAPP_ERROR_PROMPT)
    ) {
      return original(message, data);
    }

    const detail = [messageText, descriptionText].filter(Boolean).join("\n");
    const description = descriptionText
      ? `${descriptionText} — ${WHATSAPP_ERROR_PROMPT}: ${SAFEWORK_CONTACT.whatsappDisplay}`
      : `${WHATSAPP_ERROR_PROMPT}: ${SAFEWORK_CONTACT.whatsappDisplay}`;

    return original(message, {
      ...data,
      duration: data?.duration ?? 12000,
      description: data?.description && typeof data.description !== "string" ? data.description : description,
      action:
        data?.action ??
        {
          label: "WhatsApp",
          onClick: () => {
            window.open(whatsappSupportUrl("error", detail), "_blank", "noopener,noreferrer");
          },
        },
    });
  }) as typeof toast.error;
}
