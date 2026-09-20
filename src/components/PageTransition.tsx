import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

interface PageTransitionProps {
  children: React.ReactNode;
}

function disableSmoothScroll() {
  const html = document.documentElement;
  const previous = html.style.scrollBehavior;
  html.style.scrollBehavior = "auto";
  return () => {
    html.style.scrollBehavior = previous;
  };
}

function scrollWindowToTop() {
  const restore = disableSmoothScroll();
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  document.querySelectorAll("main").forEach((el) => {
    el.scrollTop = 0;
  });
  restore();
}

function scrollToHash(hash: string) {
  const id = decodeURIComponent(hash.replace(/^#/, ""));
  if (!id) return false;
  const target = document.getElementById(id);
  if (!target) return false;
  const restore = disableSmoothScroll();
  target.scrollIntoView();
  restore();
  return true;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const { pathname, hash } = useLocation();

  useLayoutEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    // Footer / bottom-nav clicks leave focus on the old control. The browser
    // then scrolls that (or its replacement) back into view after we reset.
    const focused = document.activeElement;
    if (focused instanceof HTMLElement && focused !== document.body) {
      focused.blur();
    }

    const apply = () => {
      if (hash && scrollToHash(hash)) return;
      scrollWindowToTop();
    };

    apply();
    let nestedRaf = 0;
    const raf = requestAnimationFrame(() => {
      apply();
      nestedRaf = requestAnimationFrame(apply);
    });

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(nestedRaf);
    };
  }, [pathname, hash]);

  return <div className="min-h-screen">{children}</div>;
}
