import { SAFEWORK_CONTACT } from "@/config/workerSupport";
import {
  WHATSAPP_DOCUMENTS_PROMPT,
  WHATSAPP_ERROR_PROMPT,
  whatsappSupportUrl,
} from "@/lib/whatsappSupport";
import { cn } from "@/lib/utils";

export function WhatsAppSupportNote({
  kind,
  errorText,
  compact = false,
  className,
}: {
  kind: "error" | "documents";
  errorText?: string;
  /** Hide the Hindi line in tight spaces such as toasts. */
  compact?: boolean;
  className?: string;
}) {
  const prompt = kind === "error" ? WHATSAPP_ERROR_PROMPT : WHATSAPP_DOCUMENTS_PROMPT;
  const hindi =
    kind === "error"
      ? "कृपया यह त्रुटि WhatsApp पर भेजें।"
      : "दस्तावेज़ और विवरण इसी नंबर पर WhatsApp कर सकते हैं।";

  return (
    <p className={cn("text-sm leading-relaxed", className)}>
      {prompt}:{" "}
      <a
        href={whatsappSupportUrl(kind, errorText)}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold underline underline-offset-2"
      >
        {SAFEWORK_CONTACT.whatsappDisplay}
      </a>
      {!compact && <span className="mt-0.5 block text-xs opacity-80">{hindi}</span>}
    </p>
  );
}

export function WhatsAppDocumentsNote({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5", className)}>
      <WhatsAppSupportNote kind="documents" />
    </div>
  );
}
