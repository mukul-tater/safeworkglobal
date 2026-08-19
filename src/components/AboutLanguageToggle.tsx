import { useWorkerLanguage } from "@/modules/worker-registration";
import { cn } from "@/lib/utils";

interface AboutLanguageToggleProps {
  className?: string;
  compact?: boolean;
}

export default function AboutLanguageToggle({ className, compact }: AboutLanguageToggleProps) {
  const { locale, setLocale } = useWorkerLanguage();

  return (
    <div
      role="group"
      aria-label="Language / भाषा"
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-card/80 p-0.5 text-xs font-semibold",
        compact && "scale-[0.97]",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setLocale("en")}
        aria-pressed={locale === "en"}
        className={cn(
          "rounded-full px-2.5 py-1.5 transition-colors",
          locale === "en"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        {compact ? "EN" : "English"}
      </button>
      <button
        type="button"
        onClick={() => setLocale("hi")}
        lang="hi"
        aria-pressed={locale === "hi"}
        className={cn(
          "rounded-full px-2.5 py-1.5 transition-colors",
          locale === "hi"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        हिंदी
      </button>
    </div>
  );
}
