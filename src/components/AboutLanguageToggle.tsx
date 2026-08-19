import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

interface LanguageToggleProps {
  className?: string;
  /** Compact header control: EN / हिं. */
  compact?: boolean;
  /** High-contrast on photo / dark hero headers. */
  variant?: "default" | "onDark";
}

export default function AboutLanguageToggle({
  className,
  compact,
  variant = "default",
}: LanguageToggleProps) {
  const { locale, setLocale, t } = useI18n();
  const onDark = variant === "onDark";
  const hi = locale === "hi";

  return (
    <div
      role="group"
      aria-label={t("lang.aria")}
      className={cn(
        "relative isolate grid grid-cols-2 overflow-hidden rounded-full border p-[3px] shrink-0",
        compact ? "h-8 w-[4.75rem]" : "h-9 w-[10.5rem]",
        onDark ? "bg-white/95 border-white" : "bg-muted/80 border-border",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute top-[3px] bottom-[3px] w-[calc(50%-3px)] rounded-full bg-primary transition-[left] duration-200 ease-out",
          hi ? "left-1/2" : "left-[3px]",
        )}
      />
      <button
        type="button"
        data-inline
        onClick={() => setLocale("en")}
        aria-label="English"
        aria-pressed={!hi}
        className={cn(
          "relative z-10 flex h-full min-h-0 min-w-0 items-center justify-center rounded-full p-0 font-semibold leading-none appearance-none",
          compact ? "text-[11px] tracking-wide" : "text-xs sm:text-sm",
          hi ? "text-muted-foreground" : "text-primary-foreground",
        )}
      >
        {compact ? "EN" : "English"}
      </button>
      <button
        type="button"
        data-inline
        onClick={() => setLocale("hi")}
        lang="hi"
        aria-label="हिंदी"
        aria-pressed={hi}
        className={cn(
          "relative z-10 flex h-full min-h-0 min-w-0 items-center justify-center rounded-full p-0 font-semibold leading-none appearance-none",
          compact ? "text-[11px]" : "text-xs sm:text-sm",
          hi ? "text-primary-foreground" : "text-muted-foreground",
        )}
      >
        {compact ? "हिं" : "हिंदी"}
      </button>
    </div>
  );
}
