import { Mail } from "lucide-react";
import { getWorkerSupportMailtoUrl } from "@/config/workerSupport";

export default function WorkerWhatsAppButton() {
  return (
    <a
      href={getWorkerSupportMailtoUrl()}
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-primary text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all px-4 py-3 md:px-5"
      aria-label="Email support"
    >
      <Mail className="h-5 w-5 shrink-0" />
      <span className="text-sm font-semibold">Help</span>
    </a>
  );
}
