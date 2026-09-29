import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { useI18n } from "@/i18n";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

type NoticePhase = "hidden" | "offline" | "restored";

const RESTORED_VISIBLE_MS = 4000;

/**
 * Full-width notice when the device has no internet, plus a short confirmation
 * when the connection returns. The bar stays in normal flow so it doesn't cover
 * the header. --offline-banner-offset lets sticky headers sit just below it
 * once the page scrolls.
 */
export default function OfflineNotice() {
  const online = useOnlineStatus();
  const { t } = useI18n();
  const wasOffline = useRef(!online);
  const bannerRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<NoticePhase>(online ? "hidden" : "offline");
  const [stillOffline, setStillOffline] = useState(false);

  useEffect(() => {
    if (!online) {
      wasOffline.current = true;
      setPhase("offline");
      return;
    }
    if (wasOffline.current) {
      wasOffline.current = false;
      setStillOffline(false);
      setPhase("restored");
      return;
    }
    setPhase("hidden");
  }, [online]);

  useEffect(() => {
    if (phase !== "restored") return;
    const timer = window.setTimeout(() => setPhase("hidden"), RESTORED_VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useLayoutEffect(() => {
    const root = document.documentElement;
    const node = bannerRef.current;
    if (!node) {
      root.style.setProperty("--offline-banner-offset", "0px");
      return;
    }

    const apply = () => {
      root.style.setProperty("--offline-banner-offset", `${node.offsetHeight}px`);
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(node);
    return () => {
      observer.disconnect();
      root.style.setProperty("--offline-banner-offset", "0px");
    };
  }, [phase, stillOffline]);

  if (phase === "hidden") return null;

  const offline = phase === "offline";

  const retry = () => {
    if (navigator.onLine) {
      window.location.reload();
      return;
    }
    setStillOffline(true);
  };

  return (
    <div
      ref={bannerRef}
      role={offline ? "alert" : "status"}
      className={`sticky top-0 z-[80] px-4 py-2.5 text-sm shadow-md pt-[max(0.625rem,env(safe-area-inset-top))] ${
        offline ? "bg-foreground text-background" : "bg-success text-success-foreground"
      }`}
    >
      <div className="mx-auto flex max-w-3xl items-center justify-center gap-3">
        {offline ? (
          <WifiOff className="h-4 w-4 shrink-0" aria-hidden />
        ) : (
          <Wifi className="h-4 w-4 shrink-0" aria-hidden />
        )}
        <p className="text-center font-medium leading-snug">
          {offline
            ? stillOffline
              ? t("offline.still")
              : t("offline.message")
            : t("offline.back")}
        </p>
        {offline ? (
          <button
            type="button"
            onClick={retry}
            data-inline
            className="shrink-0 rounded-full border border-background/30 bg-background/10 px-3 py-1.5 text-xs font-semibold hover:bg-background/20"
          >
            {t("offline.retry")}
          </button>
        ) : null}
      </div>
    </div>
  );
}
