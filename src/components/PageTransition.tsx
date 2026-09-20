import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import { scrollToTop } from "@/lib/scrollToTop";

interface PageTransitionProps {
  children: React.ReactNode;
}

function scrollToHash(hash: string) {
  const id = decodeURIComponent(hash.replace(/^#/, ""));
  if (!id) return false;
  const target = document.getElementById(id);
  if (!target) return false;
  const html = document.documentElement;
  const previous = html.style.scrollBehavior;
  html.style.scrollBehavior = "auto";
  target.scrollIntoView();
  html.style.scrollBehavior = previous;
  return true;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const { pathname, search, hash } = useLocation();

  useLayoutEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    const apply = () => {
      if (hash && scrollToHash(hash)) return;
      scrollToTop();
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
  }, [pathname, search, hash]);

  return <div className="min-h-screen">{children}</div>;
}
