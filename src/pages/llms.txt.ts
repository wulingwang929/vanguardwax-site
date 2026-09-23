// /llms.txt：給 AI 問答工具看的網站導覽（純文字，格式參考 llmstxt.org）
import type { APIRoute } from 'astro';
import { getSortedArticles, getSortedCategories, getSortedNews, getSortedProducts, productPath } from '../lib/content';
import { localizePath, useTranslations, locales, type Locale } from '../i18n/utils';
import { SITE_URL, sameAs } from '../data/organization';

const abs = (path: string) => new URL(path, SITE_URL).href;

async function sectionsFor(locale: Locale) {
  const t = useTranslations(locale);
  const products = await getSortedProducts(locale);
  const categories = await getSortedCategories(locale);
  const articles = await getSortedArticles(locale);
  const news = await getSortedNews(locale);
  const link = (name: string, path: string, note?: string) => `- [${name}](${abs(path)})${note ? `: ${note}` : ''}`;

  const lines: string[] = [];
  lines.push(`## ${t.lang.label}（${t.lang.hreflang}）`, '');
  lines.push(
    link(t.nav.products, localizePath('/products', locale), t.products.description),
    link(t.nav.carCare, localizePath('/car-care', locale), t.carCare.description),
    link(t.nav.news, localizePath('/news', locale), t.news.description),
    link(t.nav.about, localizePath('/about', locale)),
    link(t.nav.whereToBuy, localizePath('/where-to-buy', locale)),
    link(t.nav.catalog, localizePath('/catalog', locale)),
    link(t.nav.contact, localizePath('/contact', locale)),
    link(t.nav.inquiry, localizePath('/inquiry', locale)),
    '',
  );

  for (const category of categories) {
    const items = products.filter((p) => p.data.category === category.data.slug);
    if (!items.length) continue;
    lines.push(`### ${category.data.name}`, '');
    lines.push(link(category.data.name, localizePath(`/products/${category.data.slug}`, locale), `${items.length} ${t.products.count}`));
    for (const p of items) {
      lines.push(link(`${p.data.sku} ${p.data.name}`, productPath(p.data, locale), p.data.tagline));
    }
    lines.push('');
  }

  lines.push(`### ${t.carCare.heading}`, '');
  for (const a of articles) lines.push(link(a.data.title, localizePath(`/car-care/${a.data.slug}`, locale), a.data.excerpt));
  lines.push('');

  lines.push(`### ${t.news.heading}`, '');
  for (const n of news) {
    lines.push(link(n.data.title, localizePath(`/news/${n.data.slug}`, locale), n.data.date.toISOString().slice(0, 10)));
  }
  lines.push('');
  return lines.join('\n');
}

export const GET: APIRoute = async () => {
  const zh = useTranslations('zh-tw');
  const en = useTranslations('en');
  const header = [
    '# VANGUARD / 協凱貿易有限公司（KYOEI TAIWAN CORP.）',
    '',
    `> ${zh.home.aboutBody}`,
    '',
    `> ${en.home.aboutBody}`,
    '',
    '## 重要說明 / Important notice',
    '',
    `- ${zh.footer.practiceNotice}：本站是以協凱貿易官網為題目的非商業練習專案，不是官方網站，內容可能與官方資料不一致。`,
    `- ${en.footer.practiceNotice}: this site is a non-commercial practice rebuild and is not the official website of KYOEI TAIWAN CORP.`,
    '- 全站 noindex / The whole site is marked noindex.',
    '- 本站不標示價格、庫存或折扣；採詢價制 / No prices, stock levels or discounts are published; products are quoted on inquiry.',
    '',
    '## 公司資料 / Company facts',
    '',
    `- 公司 / Company: ${zh.site.companyName}（${en.site.companyName}）`,
    `- 品牌 / Brand: ${zh.site.brandName}`,
    `- 創立 / Founded: 1978`,
    `- 標語 / Slogan: ${zh.site.tagline}（${en.site.tagline}）`,
    `- 地址 / Address: ${zh.footer.address}｜${en.footer.address}`,
    `- 電話 / Phone: ${en.footer.phone}`,
    `- Email: ${zh.footer.email}`,
    `- 營業時間 / Hours: ${en.footer.hours}`,
    `- 認證 / Certifications: ${en.about.certIso}`,
    `- 專利 / Patents: ${en.about.patentLabel} — ${en.about.patents}`,
    ...sameAs.map((url) => `- ${url}`),
    '',
    `## 網站地圖 / Sitemap`,
    '',
    `- [sitemap](${abs('/sitemap-index.xml')})`,
    '',
  ].join('\n');

  const body = [header, ...(await Promise.all(locales.map(sectionsFor)))].join('\n');
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Robots-Tag': 'noindex' },
  });
};
