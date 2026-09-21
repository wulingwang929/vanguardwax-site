import zhTw from './zh-tw.json';
import en from './en.json';

export const locales = ['zh-tw', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'zh-tw';

const dictionaries = { 'zh-tw': zhTw, en } satisfies Record<Locale, typeof zhTw>;

export function useTranslations(locale: Locale) {
  return dictionaries[locale];
}

export function getLocaleFromUrl(url: URL): Locale {
  const [, first] = url.pathname.split('/');
  return first === 'en' ? 'en' : defaultLocale;
}

/** 去掉語言前綴，得到兩種語言共用的路徑，例如 /en/about → /about */
export function stripLocale(pathname: string): string {
  const stripped = pathname.replace(/^\/en(?=\/|$)/, '');
  return stripped === '' ? '/' : stripped;
}

/** 同一頁在另一種語言的路徑 */
export function localizePath(pathname: string, locale: Locale): string {
  const base = stripLocale(pathname);
  if (locale === defaultLocale) return base;
  return base === '/' ? '/en/' : `/en${base}`;
}
