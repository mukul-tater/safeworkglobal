/** Instantly reset window + nested scroll panes. Ignores CSS `scroll-behavior: smooth`. */
export function scrollToTop() {
  const html = document.documentElement;
  const previous = html.style.scrollBehavior;
  html.style.scrollBehavior = "auto";

  const focused = document.activeElement;
  if (focused instanceof HTMLElement && focused !== document.body) {
    focused.blur();
  }

  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  html.scrollTop = 0;
  document.body.scrollTop = 0;
  document.getElementById("root")?.scrollTo(0, 0);
  document.querySelectorAll("main").forEach((el) => {
    el.scrollTop = 0;
  });

  html.style.scrollBehavior = previous;
}
