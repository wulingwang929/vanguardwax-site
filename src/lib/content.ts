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
