import { Mail } from "lucide-react";
import { getWorkerSupportMailtoUrl } from "@/config/workerSupport";

export default function WorkerWhatsAppButton() {
  return (
    <a
      href={getWorkerSupportMailtoUrl()}
      className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] right-4 z-40 flex items-center gap-2 rounded-full bg-primary text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all px-4 py-3 md:bottom-5 md:right-5 md:z-50 md:px-5"
      aria-label="Email support"
    >
      <Mail className="h-5 w-5 shrink-0" />
      <span className="text-sm font-semibold">Help</span>
    </a>
  );
}
