import type { FieldErrors } from "react-hook-form";

export const invalidFieldClass =
  "border-destructive focus:ring-destructive focus-visible:ring-destructive";

export function firstFormErrorMessage(errors: FieldErrors): string | undefined {
  for (const value of Object.values(errors)) {
    if (!value || typeof value !== "object") continue;
    if ("message" in value && typeof value.message === "string" && value.message) {
      return value.message;
    }
    const nested = firstFormErrorMessage(value as FieldErrors);
    if (nested) return nested;
  }
  return undefined;
}

/** Scroll the first invalid control into view after React paints the error state. */
export function revealInvalidField(name: string) {
  window.setTimeout(() => {
    const field = document.querySelector<HTMLElement>(`[data-field="${CSS.escape(name)}"]`);
    if (!field) return;
    field.scrollIntoView({ behavior: "smooth", block: "center" });
    const focusable = field.querySelector<HTMLElement>(
      "input, textarea, button, [role='combobox']",
    );
    focusable?.focus({ preventScroll: true });
  }, 50);
}
