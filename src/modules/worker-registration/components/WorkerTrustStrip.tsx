import { CheckCircle2, IndianRupee } from "lucide-react";
import { useWorkerLanguage } from "../context/WorkerLanguageContext";

export default function WorkerTrustStrip() {
  const { t } = useWorkerLanguage();

  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
      <div className="flex-1 flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-50 dark:bg-green-950/25 px-3 py-2.5">
        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
        <p className="text-xs sm:text-sm font-medium leading-snug">
          <span className="text-foreground">{t("trust.freeTitle")}</span>
          <span className="block text-muted-foreground text-xs mt-0.5 sm:mt-0 sm:inline sm:ml-1">
            {t("trust.freeSub")}
          </span>
        </p>
      </div>
      <div className="flex-1 flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2.5">
        <IndianRupee className="h-4 w-4 text-primary shrink-0" />
        <p className="text-xs sm:text-sm font-medium leading-snug">
          <span className="text-foreground">{t("trust.feeTitle")}</span>
          <span className="block text-muted-foreground text-xs mt-0.5 sm:mt-0 sm:inline sm:ml-1">
            {t("trust.feeSub")}
          </span>
        </p>
      </div>
    </div>
  );
}
