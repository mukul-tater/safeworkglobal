import type { WorkerLocale } from "@/modules/worker-registration/i18n/types";

export function pick(locale: WorkerLocale, en: string, hi: string) {
  return locale === "hi" ? hi : en;
}
