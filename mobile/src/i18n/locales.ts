export type AppLocale =
  | 'bn'
  | 'en'
  | 'or'
  | 'gu'
  | 'hi'
  | 'kn'
  | 'ml'
  | 'mr'
  | 'pa'
  | 'ta'
  | 'te'
  | 'ur';

/** Order matches the App Language picker (English names). */
export const APP_LOCALES: { value: AppLocale; label: string; native: string }[] = [
  { value: 'bn', label: 'Bengali', native: 'বাংলা' },
  { value: 'en', label: 'English', native: 'English' },
  { value: 'or', label: 'Odia', native: 'ଓଡ଼ିଆ' },
  { value: 'gu', label: 'Gujarati', native: 'ગુજરાતી' },
  { value: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { value: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { value: 'ml', label: 'Malayalam', native: 'മലയാളം' },
  { value: 'mr', label: 'Marathi', native: 'मराठी' },
  { value: 'pa', label: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { value: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { value: 'te', label: 'Telugu', native: 'తెలుగు' },
  { value: 'ur', label: 'Urdu', native: 'اردو' },
];

export const LOCALE_STORAGE_KEY = 'safework-app-locale';

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return APP_LOCALES.some((locale) => locale.value === value);
}

export function localeLabel(value: AppLocale): string {
  return APP_LOCALES.find((locale) => locale.value === value)?.label ?? 'English';
}

export function fillCatalog<K extends string>(
  english: Record<K, string>,
  overlay: Partial<Record<K, string>>,
): Record<K, string> {
  return { ...english, ...overlay };
}
