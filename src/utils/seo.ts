import { routing } from '@/i18n/routing';

const baseUrl = 'https://bem.stmik.tazkia.ac.id';

export function getAlternates(path: string, currentLocale: string) {
  const languages: Record<string, string> = {};
  
  routing.locales.forEach((locale) => {
    languages[locale] = `${baseUrl}/${locale}${path}`;
  });
  
  languages['x-default'] = `${baseUrl}/${routing.defaultLocale}${path}`;

  return {
    canonical: `${baseUrl}/${currentLocale}${path}`,
    languages,
  };
}
