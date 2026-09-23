#!/usr/bin/env node
// 建置後檢查每一頁的 SEO 標籤與 JSON-LD。用法：node scripts/check-seo.mjs（需要先 npm run build）
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const SITE = 'https://vanguardwaxvlad.vercel.app';

/** 每種 JSON-LD 類型必須有的欄位 */
const REQUIRED = {
  Organization: ['name', 'url', 'address', 'sameAs'],
  WebSite: ['url', 'name', 'inLanguage'],
  BreadcrumbList: ['itemListElement'],
  Product: ['name', 'sku', 'brand', 'image', 'description', 'url'],
  Article: ['headline', 'description', 'datePublished', 'dateModified', 'author', 'publisher'],
  NewsArticle: ['headline', 'datePublished', 'publisher'],
  FAQPage: ['mainEntity'],
  VideoObject: ['name', 'description', 'thumbnailUrl'],
  LocalBusiness: ['name', 'address', 'telephone', 'openingHoursSpecification'],
};

const files = [];
async function walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (entry.name.endsWith('.html')) files.push(full);
  }
}
await walk(DIST);

const problems = [];
const typeCount = {};
let pages = 0;

for (const file of files.sort()) {
  const url = `/${path.relative(DIST, file).replace(/index\.html$/, '')}`;
  if (url.startsWith('/admin')) continue; // 後台頁面，不需要 SEO 標籤
  const html = await fs.readFile(file, 'utf8');
  const fail = (msg) => problems.push(`${url} — ${msg}`);
  pages++;

  const decode = (v) =>
    v?.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  const meta = (re) => decode(html.match(re)?.[1]);
  const title = meta(/<title>([^<]*)<\/title>/);
  const description = meta(/<meta name="description" content="([^"]*)"/);
  const canonical = meta(/<link rel="canonical" href="([^"]*)"/);
  const robots = meta(/<meta name="robots" content="([^"]*)"/);
  const og = ['og:type', 'og:title', 'og:description', 'og:url', 'og:image', 'og:locale'].filter(
    (p) => !html.includes(`property="${p}"`),
  );
  const twitter = ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image'].filter(
    (p) => !html.includes(`name="${p}"`),
  );
  const hreflangs = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)"/g)].map((m) => m[1]);

  if (!title) fail('沒有 title');
  else if (title.length > 70) fail(`title 太長（${title.length} 字）：${title}`);
  if (!description) fail('沒有 description');
  else if (description.length > 175) fail(`description 太長（${description.length} 字）`);
  if (!canonical?.startsWith(SITE)) fail(`canonical 不是正式網址：${canonical}`);
  if (!robots?.includes('noindex')) fail('沒有 noindex');
  if (og.length) fail(`缺 Open Graph：${og.join('、')}`);
  if (twitter.length) fail(`缺 Twitter Card：${twitter.join('、')}`);
  for (const need of ['zh-TW', 'en', 'x-default']) {
    if (!hreflangs.includes(need)) fail(`缺 hreflang ${need}`);
  }

  const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (!ld.length) {
    fail('沒有 JSON-LD');
    continue;
  }
  for (const [, raw] of ld) {
    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      fail(`JSON-LD 不是合法 JSON：${e.message}`);
      continue;
    }
    if (!data['@context']) fail('JSON-LD 缺 @context');
    for (const node of data['@graph'] ?? [data]) {
      const type = node['@type'];
      typeCount[type] = (typeCount[type] ?? 0) + 1;
      for (const key of REQUIRED[type] ?? []) {
        if (node[key] === undefined || node[key] === null || node[key] === '') fail(`${type} 缺 ${key}`);
      }
      if (type === 'BreadcrumbList') {
        node.itemListElement.forEach((item, i) => {
          if (item.position !== i + 1) fail('BreadcrumbList 的 position 不連續');
          if (!item.name || !item.item) fail('BreadcrumbList 缺 name 或 item');
        });
      }
      if (type === 'Product' && node.gtin13 && !/^\d{13}$/.test(node.gtin13)) fail(`gtin13 格式不對：${node.gtin13}`);
      if ((type === 'Article' || type === 'NewsArticle') && !/^\d{4}-\d{2}-\d{2}/.test(node.datePublished ?? '')) {
        fail('文章日期格式不對');
      }
    }
  }
}

console.log(`檢查了 ${pages} 個頁面`);
console.log('JSON-LD 類型統計：');
for (const [type, count] of Object.entries(typeCount).sort((a, b) => b[1] - a[1])) console.log(`  ${type}: ${count}`);
if (problems.length) {
  console.log(`\n✗ 發現 ${problems.length} 個問題：`);
  for (const p of problems.slice(0, 40)) console.log(`  ${p}`);
  if (problems.length > 40) console.log(`  …還有 ${problems.length - 40} 個`);
  process.exitCode = 1;
} else {
  console.log('\n✓ 每一頁的 title、description、canonical、hreflang、Open Graph、Twitter Card、noindex 與 JSON-LD 都齊全');
}
