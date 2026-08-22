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
  variant?: "default" | "onDark";
  /** Full-width picker with Language / भाषा label — use in menus and sidebars, not headers. */
  labeled?: boolean;
}

export default function AboutLanguageToggle({
  className,
  variant = "default",
  labeled = false,
}: LanguageToggleProps) {
  const { locale, setLocale, t } = useI18n();
  const onDark = variant === "onDark";

  const select = (
    <Select value={locale} onValueChange={(value) => setLocale(value as AppLocale)}>
      <SelectTrigger
        aria-label={t("lang.aria")}
        className={cn(
          "gap-1.5 font-semibold shadow-none",
          labeled
            ? "h-11 w-full px-3 text-sm"
            : onDark
              ? "h-9 w-[10.5rem] px-2.5 text-xs sm:text-sm"
              : "h-9 w-[9.5rem] px-2.5 text-xs sm:text-sm",
          onDark
            ? "rounded-full border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/15 hover:text-white focus:ring-white/40 focus:ring-offset-0 data-[state=open]:bg-white/20 [&>svg]:text-white [&>svg]:opacity-80"
            : "bg-muted/80 border-border",
          labeled && onDark && "rounded-md",
          !labeled && className,
        )}
      >
        {onDark ? <Globe className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden /> : null}
        <SelectValue placeholder={localeLabel(locale)} />
      </SelectTrigger>
      <SelectContent align={labeled ? "start" : "end"} className="min-w-[11.5rem]">
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

  if (!labeled) return select;

  return (
    <div className={cn("space-y-2", className)}>
      <p
        className={cn(
          "text-xs font-semibold",
          onDark ? "text-white/60" : "text-muted-foreground",
        )}
      >
        {t("lang.aria")}
      </p>
      {select}
    </div>
  );
}
