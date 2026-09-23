import { SITE_URL } from '../data/organization';
import { localizePath, useTranslations, type Locale } from '../i18n/utils';

export const abs = (path: string) => new URL(path, SITE_URL).href;

/**
 * 頁面 title：標題夠短才加上品牌後綴；太長的標題直接截斷，
 * 避免搜尋結果被切掉（上限 70 字元）。
 */
export function pageTitle(base: string, locale: Locale) {
  const t = useTranslations(locale);
  const full = `${base}${t.common.titleSep}${t.site.titleSuffix}`;
  if (full.length <= 70) return full;
  return base.length <= 70 ? base : `${base.slice(0, 69).trimEnd()}…`;
}

export interface Crumb {
  name: string;
  /** 不含語言前綴的路徑，例如 /products */
  path: string;
}

/** 麵包屑（第一層固定是首頁） */
export function crumbs(locale: Locale, ...items: Crumb[]): Crumb[] {
  return [{ name: useTranslations(locale).common.breadcrumbHome, path: '/' }, ...items];
}

export function breadcrumbJsonLd(locale: Locale, items: Crumb[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: abs(localizePath(c.path, locale)),
    })),
  };
}

export function webPageJsonLd(
  type: string,
  locale: Locale,
  { name, description, path }: { name: string; description: string; path: string },
) {
  return {
    '@type': type,
    '@id': `${abs(localizePath(path, locale))}#webpage`,
    url: abs(localizePath(path, locale)),
    name,
    description,
    inLanguage: useTranslations(locale).lang.hreflang,
    isPartOf: { '@id': `${SITE_URL}/#website` },
  };
}

export function faqJsonLd(faq: { q: string; a: string }[] | undefined) {
  if (!faq?.length) return [];
  return [
    {
      '@type': 'FAQPage',
      mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ];
}

/** 純文字摘要（給 description 用） */
export function plainText(markdown: string, max = 150) {
  const text = markdown
    .replace(/!\[[^\]]*]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)]\([^)]*\)/g, '$1')
    .replace(/[#*_>`-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
