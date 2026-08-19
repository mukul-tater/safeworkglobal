import { useCallback } from "react";
import { useWorkerLanguage } from "@/modules/worker-registration";
import { appMessages, interpolate, type AppMessageKey } from "./messages";

export function useI18n() {
  const { locale, setLocale } = useWorkerLanguage();

  const t = useCallback(
    (key: AppMessageKey, params?: Record<string, string | number>) => {
      const template = appMessages[locale][key] ?? appMessages.en[key] ?? key;
      return interpolate(template, params);
    },
    [locale],
  );

  return { locale, setLocale, t };
}
