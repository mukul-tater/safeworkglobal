import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe } from "lucide-react";
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
          compact ? "h-8 px-2 text-[11px]" : "h-9 px-2.5 text-xs sm:text-sm",
          compact
            ? onDark ? "w-[8.25rem]" : "w-[7.25rem]"
            : onDark ? "w-[10.5rem]" : "w-[9.5rem]",
          onDark
            ? "rounded-full border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/15 hover:text-white focus:ring-white/40 focus:ring-offset-0 data-[state=open]:bg-white/20 [&>svg]:text-white [&>svg]:opacity-80"
            : "bg-muted/80 border-border",
          className,
        )}
      >
        {onDark ? <Globe className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden /> : null}
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
