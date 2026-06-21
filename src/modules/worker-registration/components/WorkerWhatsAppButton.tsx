import { MessageCircle } from "lucide-react";
import { getWorkerWhatsAppUrl } from "@/config/workerSupport";
import { useWorkerLanguage } from "../context/WorkerLanguageContext";

export default function WorkerWhatsAppButton() {
  const { t } = useWorkerLanguage();

  return (
    <a
      href={getWorkerWhatsAppUrl(t("whatsapp.message"))}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-[#25D366] text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all px-4 py-3 md:px-5"
      aria-label={t("whatsapp.aria")}
    >
      <MessageCircle className="h-5 w-5 shrink-0" />
      <span className="text-sm font-semibold">{t("whatsapp.label")}</span>
    </a>
  );
}
