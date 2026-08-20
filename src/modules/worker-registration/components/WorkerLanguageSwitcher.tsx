import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
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
        className="h-9 w-[9.5rem] gap-1.5 text-xs sm:text-sm"
        aria-label={t("lang.label")}
      >
        <Languages className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end" className="min-w-[11.5rem]">
        <SelectLabel className="pl-2 pr-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          App Language
        </SelectLabel>
        {WORKER_LOCALES.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
