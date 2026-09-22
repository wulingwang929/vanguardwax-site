import { getCollection, type CollectionEntry } from 'astro:content';
import { defaultLocale, localizePath, type Locale } from '../i18n/utils';

type Localized = 'products' | 'categories' | 'articles' | 'news' | 'pages';

export type LocalizedEntry<C extends Localized> = CollectionEntry<C> & {
  /** 檔名（兩種語言共用），例如 rh-5070 */
  key: string;
  /** 缺這個語言的內容、改顯示中文 */
  isFallback: boolean;
};

const keyOf = (id: string) => id.slice(id.indexOf('/') + 1);
const localeOf = (id: string) => id.slice(0, id.indexOf('/'));

/**
 * 取得某語言的全部內容。以中文為主清單；英文缺檔時用中文代替並標示 isFallback。
 */
export async function getLocalized<C extends Localized>(collection: C, locale: Locale) {
  const all = (await getCollection(collection)) as CollectionEntry<C>[];
  const base = all.filter((e) => localeOf(e.id) === defaultLocale);
  const byKey = new Map(all.filter((e) => localeOf(e.id) === locale).map((e) => [keyOf(e.id), e]));
  return base.map((zh) => {
    const own = byKey.get(keyOf(zh.id));
    return { ...(own ?? zh), key: keyOf(zh.id), isFallback: !own } as LocalizedEntry<C>;
  });
}

export const skuSlug = (sku: string) => sku.toLowerCase();

export function productPath(p: { category: string; sku: string }, locale: Locale) {
  return localizePath(`/products/${p.category}/${skuSlug(p.sku)}`, locale);
}

export async function getSortedProducts(locale: Locale) {
  const products = await getLocalized('products', locale);
  return products.sort((a, b) => a.data.order - b.data.order || a.data.sku.localeCompare(b.data.sku));
}

export async function getSortedCategories(locale: Locale) {
  const categories = await getLocalized('categories', locale);
  return categories.sort((a, b) => a.data.order - b.data.order);
}

/** 相關產品：有指定 relatedSkus 就用；沒有就取同分類的其他產品 */
export function relatedProducts(
  product: LocalizedEntry<'products'>,
  all: LocalizedEntry<'products'>[],
  limit = 4,
) {
  const skus = product.data.relatedSkus ?? [];
  if (skus.length) {
    return skus
      .map((s) => all.find((p) => p.data.sku.toLowerCase() === s.toLowerCase()))
      .filter((p): p is LocalizedEntry<'products'> => !!p)
      .slice(0, limit);
  }
  return all.filter((p) => p.data.category === product.data.category && p.key !== product.key).slice(0, limit);
}

export async function getSortedArticles(locale: Locale) {
  const articles = await getLocalized('articles', locale);
  return articles.sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime());
}

export async function getSortedNews(locale: Locale) {
  const news = await getLocalized('news', locale);
  return news.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export async function getPage(slug: string, locale: Locale) {
  const pages = await getLocalized('pages', locale);
  const page = pages.find((p) => p.data.slug === slug);
  if (!page) throw new Error(`找不到頁面內容 src/content/pages/*/${slug}.md`);
  return page;
}

export function formatDate(date: Date, locale: Locale) {
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'zh-TW', {
    year: 'numeric',
    month: locale === 'en' ? 'short' : 'long',
    day: 'numeric',
    timeZone: 'Asia/Taipei',
  }).format(date);
}
