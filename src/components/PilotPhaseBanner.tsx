import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";

const STORAGE_KEY = "swg_pilot_banner_dismissed_v1";

/**
 * Slim site-wide banner that signals SafeWork Global is in pilot phase.
 * Sets honest expectations for the first wave of workers/employers:
 * verification and hiring are live, coverage is still expanding.
 * Dismissible per-browser.
 */
export default function PilotPhaseBanner() {
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    setHidden(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  if (hidden) return null;

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setHidden(true);
  };

  return (
    <div className="relative z-40 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-2 flex items-center justify-center gap-2 text-xs sm:text-sm">
        <Sparkles className="h-3.5 w-3.5 shrink-0" />
        <p className="text-center">
          <span className="font-semibold">Pilot phase:</span>{" "}
          Worker verification, applications &amp; interviews are live. More destinations and
          partner agencies are being added.
        </p>
        <button
          onClick={dismiss}
          aria-label="Dismiss pilot banner"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-primary-foreground/10"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}