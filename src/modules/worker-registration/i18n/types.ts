export type { AppLocale as WorkerLocale } from "@/i18n/locales";
export { APP_LOCALES as WORKER_LOCALES, isAppLocale as isWorkerLocale } from "@/i18n/locales";

export const WORKER_LOCALE_STORAGE_KEY = "safework-worker-locale";

export type TranslationParams = Record<string, string | number>;
