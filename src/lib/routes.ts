import { defaultLocale, locales, type Locale } from '../i18n/utils';

/** [...lang] 路由用：中文 lang 為 undefined（根網址），英文為 'en' */
export const langParam = (locale: Locale) => (locale === defaultLocale ? undefined : 'en');

export function localeStaticPaths() {
  return locales.map((locale) => ({ params: { lang: langParam(locale) }, props: { locale } }));
}
