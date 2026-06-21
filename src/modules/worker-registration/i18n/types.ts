export type WorkerLocale = "en" | "hi";

export const WORKER_LOCALES: { value: WorkerLocale; label: string }[] = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिंदी" },
];

export const WORKER_LOCALE_STORAGE_KEY = "safework-worker-locale";

export type TranslationParams = Record<string, string | number>;
