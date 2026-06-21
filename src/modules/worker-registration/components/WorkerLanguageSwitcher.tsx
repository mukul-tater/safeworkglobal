import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Languages } from "lucide-react";
import { useWorkerLanguage } from "../context/WorkerLanguageContext";
import { WORKER_LOCALES, type WorkerLocale } from "../i18n/types";

export default function WorkerLanguageSwitcher() {
  const { locale, setLocale, t } = useWorkerLanguage();

  return (
    <Select value={locale} onValueChange={(value) => setLocale(value as WorkerLocale)}>
      <SelectTrigger
        className="h-9 w-[118px] gap-1.5 text-xs sm:text-sm"
        aria-label={t("lang.label")}
      >
        <Languages className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {WORKER_LOCALES.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
