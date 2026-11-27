export const SUPPORTED_LOCALES = ['en', 'id', 'ar', 'ja', 'fr'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: SupportedLocale = 'id';
