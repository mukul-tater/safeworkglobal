import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { SECTION_NAV } from "../types";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

export function SectionNavigation() {
  const { locale } = useI18n();

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="sticky top-16 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Link
            to="/country-insights"
            className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-primary py-3 pr-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Country Insights</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <nav
            className="flex gap-1 overflow-x-auto py-2 -mx-1 px-1 scrollbar-thin"
            aria-label="Page sections"
          >
            {SECTION_NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollTo(item.id)}
                className={cn(
                  "shrink-0 rounded-full border border-border bg-card px-3 py-2 text-xs font-medium text-foreground",
                  "min-h-10 hover:border-primary/40 hover:text-primary transition-colors",
                )}
              >
                {locale === "hi" ? item.hi : item.en}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
