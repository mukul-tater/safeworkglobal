import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  interpolate,
  workerTranslations,
  type TranslationKey,
} from "../i18n/translations";
import {
  WORKER_LOCALE_STORAGE_KEY,
  type TranslationParams,
  type WorkerLocale,
} from "../i18n/types";

interface WorkerLanguageContextValue {
  locale: WorkerLocale;
  setLocale: (locale: WorkerLocale) => void;
  t: (key: TranslationKey, params?: TranslationParams) => string;
}

const WorkerLanguageContext = createContext<WorkerLanguageContextValue | null>(null);

function readStoredLocale(): WorkerLocale {
  try {
    const stored = localStorage.getItem(WORKER_LOCALE_STORAGE_KEY);
    if (stored === "en" || stored === "hi") return stored;
  } catch {
    // ignore
  }
  return "en";
}

export function WorkerLanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<WorkerLocale>(readStoredLocale);

  const setLocale = useCallback((next: WorkerLocale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(WORKER_LOCALE_STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === "hi" ? "hi" : "en";
  }, [locale]);

  const t = useCallback(
    (key: TranslationKey, params?: TranslationParams) => {
      const template = workerTranslations[locale][key] ?? workerTranslations.en[key] ?? key;
      return interpolate(template, params);
    },
    [locale]
  );

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  );

  return (
    <WorkerLanguageContext.Provider value={value}>
      {children}
    </WorkerLanguageContext.Provider>
  );
}

export function useWorkerLanguage(): WorkerLanguageContextValue {
  const ctx = useContext(WorkerLanguageContext);
  if (!ctx) {
    throw new Error("useWorkerLanguage must be used within WorkerLanguageProvider");
  }
  return ctx;
}

export function useOptionalWorkerLanguage(): WorkerLanguageContextValue | null {
  return useContext(WorkerLanguageContext);
}
