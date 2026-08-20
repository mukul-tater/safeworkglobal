import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/i18n";
import { APP_LOCALES, localeLabel, type AppLocale } from "@/i18n/locales";
import { cn } from "@/lib/utils";

interface LanguageToggleProps {
  className?: string;
  compact?: boolean;
  variant?: "default" | "onDark";
}

export default function AboutLanguageToggle({
  className,
  compact,
  variant = "default",
}: LanguageToggleProps) {
  const { locale, setLocale, t } = useI18n();
  const onDark = variant === "onDark";

  return (
    <Select value={locale} onValueChange={(value) => setLocale(value as AppLocale)}>
      <SelectTrigger
        aria-label={t("lang.aria")}
        className={cn(
          "gap-1.5 font-semibold shadow-none",
          compact ? "h-8 w-[7.25rem] px-2 text-[11px]" : "h-9 w-[9.5rem] px-2.5 text-xs sm:text-sm",
          onDark
            ? "bg-white/95 border-white text-foreground hover:bg-white"
            : "bg-muted/80 border-border",
          className,
        )}
      >
        <SelectValue placeholder={localeLabel(locale)} />
      </SelectTrigger>
      <SelectContent align="end" className="min-w-[11.5rem]">
        <SelectGroup>
          <SelectLabel className="pl-2 pr-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            App Language
          </SelectLabel>
          {APP_LOCALES.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
