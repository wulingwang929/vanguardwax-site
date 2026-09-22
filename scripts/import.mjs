#!/usr/bin/env node
// 匯入舊站資料：data/inventory.xlsx ＋ data/images/ → src/content/** 與 public/uploads/
//
// 用法：node scripts/import.mjs
//
// 可以重跑：同一筆資料永遠寫到同一個檔名（覆寫），上一次匯入產生、這次沒有的檔案會刪掉
// （記錄在 scripts/import-manifest.json）。在後台新增的內容不在清單裡，不會被動到；
// 但「匯入的那幾筆」如果在後台改過，重跑會被試算表的內容蓋回去。
//
// 內容裡的舊網域連結換成新網站的對應網址、舊站圖片換成 /uploads/ 的本機圖、舊信箱換成專案 Gmail。

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ExcelJS from 'exceljs';
import sharp from 'sharp';
import YAML from 'yaml';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const XLSX = path.join(ROOT, 'data/inventory.xlsx');
const IMAGES = path.join(ROOT, 'data/images');
const CONTENT = path.join(ROOT, 'src/content');
const UPLOADS = path.join(ROOT, 'public/uploads');
const MANIFEST = path.join(ROOT, 'scripts/import-manifest.json');

const NEW_SITE = 'https://vanguardwaxvlad.vercel.app';
const NEW_EMAIL = 'wulingwang929@gmail.com';
const OLD_EMAIL = /globalservice@vanguardwax\.com/gi;
// 舊站沒有文章發布日期；固定用第一次匯入的日期，重跑結果才會一樣
const IMPORT_DATE = '2026-09-22';
const MAX_IMAGE_WIDTH = 1600;
// 舊站原文明顯有錯、使用者確認要改的個別值（見 docs/decisions.md）
const SPEC_OVERRIDES = {
  // 產品名「德國進口」、欄位與英文原文都是德國，只有中文規格原文寫台灣
  J1004: { 'zh-tw': { origin: '德國' } },
};

const LOCALES = ['zh-tw', 'en'];
const log = { warnings: [], notes: [] };
const warn = (msg) => log.warnings.push(msg);
const note = (msg) => log.notes.push(msg);

// ───────────── 讀試算表 ─────────────
async function readWorkbook() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(XLSX);
  const sheets = {};
  wb.eachSheet((ws) => {
    const rows = [];
    ws.eachRow({ includeEmpty: false }, (row) => rows.push(row.values.slice(1).map(cellText)));
    const [header, ...body] = rows;
    sheets[ws.name] = body
      .map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? '').trim()])))
      .filter((r) => Object.values(r).some(Boolean));
  });
  return sheets;
}

function cellText(v) {
  if (v == null) return '';
  if (typeof v === 'object') {
    if (v.richText) return v.richText.map((t) => t.text).join('');
    if (v.text != null) return String(v.text);
    if (v.result != null) return String(v.result);
    if (v instanceof Date) return v.toISOString().slice(0, 10);
  }
  return String(v);
}

// ───────────── 小工具 ─────────────
const bullets = (text) =>
  (text || '')
    .split('\n')
    .map((l) => l.replace(/^\s*[-*•]\s*/, '').trim())
    .filter(Boolean);

/** 規格行「- 標籤：值」拆成 [標籤, 值] */
const splitSpec = (line) => {
  const m = line.match(/^([^：:]{1,20})[：:]\s*(.*)$/);
  return m ? [m[1].trim(), m[2].trim()] : [null, line];
};

const compact = (obj) => {
  if (Array.isArray(obj)) return obj.length ? obj : undefined;
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      const c = compact(v);
      if (c !== undefined && c !== '' && c !== null) out[k] = c;
    }
    return Object.keys(out).length ? out : undefined;
  }
  return obj;
};

/** 從說明取第一句當暫時的一句話定義（舊站沒有 tagline） */
function draftTagline(description, name, maxLen) {
  const first = bullets(description)[0] || name;
  const sentence = first.split(/(?<=[。！？!?.])\s*/)[0].replace(/[。．.]$/, '');
  if (sentence.length <= maxLen) return sentence;
  const cut = sentence.slice(0, maxLen);
  const lastBreak = Math.max(...['，', '、', ',', ' '].map((c) => cut.lastIndexOf(c)));
  return (lastBreak > maxLen * 0.5 ? cut.slice(0, lastBreak) : cut).trim();
}

/** 內文第一段純文字當摘要（舊站沒有 excerpt） */
function draftExcerpt(body, maxLen) {
  const paras = body
    .split(/\n{2,}/)
    .map((p) =>
      p
        .replace(/!\[[^\]]*]\([^)]*\)/g, '')
        .replace(/\[([^\]]*)]\([^)]*\)/g, '$1')
        .replace(/^#+\s*/gm, '')
        .replace(/[*_>`]/g, '')
        .replace(/^\s*[-•]\s*/gm, '')
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .filter((p) => p.length >= 15 && !/^\(.*\)$|^（.*）$/.test(p));
  const text = paras[0] || '';
  if (text.length <= maxLen) return text;
  const cut = text.slice(0, maxLen);
  const lastStop = Math.max(...['。', '！', '？', '. ', '! ', '? '].map((c) => cut.lastIndexOf(c)));
  return lastStop > maxLen * 0.4 ? cut.slice(0, lastStop + 1).trim() : `${cut.trim()}…`;
}

function yamlFile(data) {
  return YAML.stringify(data, { lineWidth: 0, defaultStringType: 'PLAIN', defaultKeyType: 'PLAIN' });
}
function mdFile(data, body) {
  return `---\n${yamlFile(data)}---\n\n${(body || '').trim()}\n`;
}

// ───────────── 圖片 ─────────────
const imageJobs = new Map(); // 來源檔 → uploads 檔名

function uploadName(localPath) {
  // data/images/products/VG-309-01.jpg → VG-309-01.jpg（產品圖本來就以型號命名）
  // data/images/articles/msg69-01.jpg → article-msg69-01.jpg；newss → news-
  const rel = localPath.replace(/^data\/images\//, '');
  const [dir, file] = [path.dirname(rel), path.basename(rel)];
  const prefix = { products: '', articles: 'article-', newss: 'news-' }[dir] ?? `${dir}-`;
  return prefix + file;
}

function useImage(localPath) {
  const name = uploadName(localPath);
  imageJobs.set(path.join(ROOT, localPath), name);
  return `/uploads/${name}`;
}

async function processImages(written) {
  await fs.mkdir(UPLOADS, { recursive: true });
  let converted = 0;
  let before = 0;
  let after = 0;
  for (const [src, name] of imageJobs) {
    const dest = path.join(UPLOADS, name);
    written.add(path.relative(ROOT, dest));
    const [s, d] = await Promise.all([fs.stat(src), fs.stat(dest).catch(() => null)]);
    before += s.size;
    if (d && d.mtimeMs >= s.mtimeMs) {
      after += d.size;
      continue; // 已經轉過，重跑不重做
    }
    const img = sharp(src, { failOn: 'none' }).rotate().resize({ width: MAX_IMAGE_WIDTH, withoutEnlargement: true });
    const ext = path.extname(name).toLowerCase();
    const out =
      ext === '.png'
        ? await img.png({ compressionLevel: 9, palette: true }).toBuffer()
        : ext === '.webp'
          ? await img.webp({ quality: 80 }).toBuffer()
          : await img.jpeg({ quality: 80, mozjpeg: true }).toBuffer();
    // 壓縮後反而比較大就用原檔
    const buf = out.length < s.size ? out : await fs.readFile(src);
    await fs.writeFile(dest, buf);
    after += buf.length;
    converted++;
  }
  return { count: imageJobs.size, converted, before, after };
}

// ───────────── 舊網域、舊信箱改寫 ─────────────
function buildRewriter(sheets, downloadMap) {
  const urlMap = new Map(); // 舊網址（去掉 query）→ 新路徑，依語言
  const imgMap = new Map(); // 舊圖片網址 → 本機檔
  const norm = (u) => {
    try {
      const x = new URL(u.trim().replace(/^http:/, 'https:'));
      return decodeURIComponent(x.hostname.replace(/^www\./, '') + x.pathname);
    } catch {
      return u.trim();
    }
  };
  const addPage = (oldZh, oldEn, newPath) => {
    if (oldZh) urlMap.set(norm(oldZh), { 'zh-tw': newPath, en: newPath });
    if (oldEn) urlMap.set(norm(oldEn), { 'zh-tw': newPath, en: newPath });
  };
  for (const p of sheets.products)
    addPage(p.old_url_zh, p.old_url_en, `/products/${p.category_slug}/${p.sku.toLowerCase()}`);
  for (const c of sheets.categories) addPage(c.old_url_zh, c.old_url_en, `/products/${c.slug}`);
  for (const a of sheets.articles) addPage(a.old_url_zh, a.old_url_en, `/car-care/${a.slug}`);
  for (const n of sheets.news) addPage(n.old_url_zh, n.old_url_en, `/news/${n.slug}`);
  const pagePath = { 'company-profile': '/about', 'vanguard-story': '/about', catalog: '/catalog', 'where-to-buy': '/where-to-buy' };
  for (const pg of sheets.pages) addPage(pg.old_url_zh, pg.old_url_en, pagePath[pg.key] ?? '/about');
  for (const i of sheets.images) imgMap.set(norm(i.source_url), i.local_path);
  for (const [u, local] of downloadMap) imgMap.set(norm(u), local);

  // 網址裡可能有成對括號，例如 BANNER(2000X880).jpg
  const OLD_URL = /https?:\/\/(?:www\.)?vanguardwax\.com(?:[^\s()\]"'<>]|\([^\s()]*\))*/gi;

  return function rewrite(text, locale, where) {
    if (!text) return text;
    let out = text.replace(OLD_EMAIL, NEW_EMAIL);
    // 已經是本機路徑的圖片：![](data/images/articles/x.jpg)
    out = out.replace(/\bdata\/images\/[^\s)\]"'<>]+/g, (p) => useImage(p));
    out = out.replace(OLD_URL, (u) => {
      const key = norm(u);
      const local = imgMap.get(key);
      if (local) return local.startsWith('data/images/') ? useImage(local) : useAsset(local);
      const page = urlMap.get(key);
      if (page) return NEW_SITE + (locale === 'en' ? `/en${page[locale]}` : page[locale]);
      if (/\.(jpe?g|png|gif|webp)$/i.test(key)) {
        warn(`${where}：舊站圖片沒有本機檔，已移除 → ${u}`);
        return '';
      }
      note(`${where}：舊站連結沒有對應頁面，改指向新網站首頁 → ${u}`);
      return NEW_SITE + (locale === 'en' ? '/en/' : '/');
    });
    // 圖片被移除後留下的空圖片語法
    out = out.replace(/!\[[^\]]*]\(\s*\)/g, '');
    // 裸的網域文字（例如「vanguardwax.com」）
    out = out.replace(/(?<![\w/.@-])(?:www\.)?vanguardwax\.com\b/gi, NEW_SITE.replace('https://', ''));
    return out;
  };
}

/** assets/ 底下的圖片（例如舊站公司照片）也複製到 uploads */
function useAsset(assetPath) {
  const name = `company-${path.basename(assetPath).replace(/^company-/, '')}`;
  imageJobs.set(path.join(ROOT, assetPath), name);
  return `/uploads/${name}`;
}

async function readDownloadMap() {
  // assets/download.sh 記錄了 assets/photos、logo 的來源網址
  const sh = await fs.readFile(path.join(ROOT, 'assets/download.sh'), 'utf8');
  const map = new Map();
  for (const m of sh.matchAll(/-o "([^"]+)" "([^"]+)"/g)) map.set(m[2], path.join('assets', m[1]));
  return map;
}

// ───────────── 各集合 ─────────────
const ORIGIN = /^(產地|origin|place of origin|county of origin|country of origin)$/i;
const CAPACITY = /^(容量|capacity|volume)$/i;
const SIZE = /^(尺寸|size)$/i;
const INGREDIENTS = /^(成分|成份|主要成份|主要成分|ingredients|main ingredients|composition)$/i;

/** 舊站規格原文裡的產地、容量、尺寸（第一個出現的值） */
function specValues(text) {
  const out = {};
  for (const line of bullets(text)) {
    const [label, value] = splitSpec(line);
    if (!label || !value) continue;
    if (ORIGIN.test(label)) out.origin ??= value;
    else if (CAPACITY.test(label)) out.capacity ??= value;
    else if (SIZE.test(label)) out.size ??= value;
  }
  return out;
}

const normalize = (s) =>
  (s || '').replace(/[\s　]/g, '').replace(/臺/g, '台').replace(/[*×X]/g, 'x').toLowerCase();

function parseSpecs(text, { hasCapacity, hasOrigin, hasDimensions }) {
  const ingredients = [];
  const other = [];
  for (const line of bullets(text)) {
    const [label, value] = splitSpec(line);
    if (label && INGREDIENTS.test(label)) ingredients.push(value);
    else if (label && ORIGIN.test(label) && hasOrigin) continue;
    else if (label && CAPACITY.test(label) && hasCapacity) continue;
    else if (label && SIZE.test(label) && hasDimensions) continue;
    else other.push(line);
  }
  return { ingredients: ingredients.join('；') || undefined, other };
}

function importProducts(rows, rewrite) {
  const files = [];
  for (const p of rows) {
    const key = p.sku.toLowerCase();
    const where = `產品 ${p.sku}`;
    const images = p.images.split(/\s*;\s*/).filter(Boolean).map((i) => useImage(`data/images/${i}`));

    // 條碼：只收 13 位數字；多個條碼（有子型號）改放進其他規格
    const barcodeOk = /^\d{13}$/.test(p.barcode);
    const barcodeLine = { 'zh-tw': `條碼：${p.barcode}`, en: `Barcode: ${p.barcode}` };
    if (p.barcode && !barcodeOk) note(`${where}：條碼不是單一 EAN-13（${p.barcode}），放進其他規格`);

    // 箱入數：只收純數字；「12/24」這類小箱/大箱寫法放進其他規格；欄名誤植的值不匯入
    let boxQty;
    const boxLine = { 'zh-tw': null, en: null };
    if (/^\d+$/.test(p.box_qty)) boxQty = Number(p.box_qty);
    else if (/^\d+\/\d+$/.test(p.box_qty)) {
      boxLine['zh-tw'] = `箱入數（小箱／大箱）：${p.box_qty}`;
      boxLine.en = `Units per carton (small/large): ${p.box_qty}`;
      note(`${where}：箱入數「${p.box_qty}」是小箱／大箱兩個數字，放進其他規格`);
    } else if (p.box_qty) warn(`${where}：箱入數欄位的值「${p.box_qty}」不是數量（像是欄名誤植），沒有匯入`);

    // 欄位和舊站規格原文不一致時，以原文為準（2026-09-22 決定，見 docs/decisions.md）
    const zhSpec = specValues(p.specs_zh);
    const enSpec = specValues(p.specs_en_original);
    const capacity = zhSpec.capacity ?? p.capacity;
    const dimensions = zhSpec.size ?? p.dimensions;
    const origin = { 'zh-tw': zhSpec.origin ?? p.origin_zh, en: enSpec.origin ?? p.origin_en };
    for (const locale of LOCALES) {
      const o = SPEC_OVERRIDES[p.sku]?.[locale]?.origin;
      if (o) origin[locale] = o;
    }
    for (const [label, col, text] of [
      ['容量', p.capacity, zhSpec.capacity],
      ['尺寸', p.dimensions, zhSpec.size],
      ['產地', p.origin_zh, zhSpec.origin],
      ['產地（英）', p.origin_en, enSpec.origin],
    ]) {
      if (col && text && normalize(col) !== normalize(text)) note(`${where}：${label}欄位「${col}」和舊站原文「${text}」不同，用原文`);
    }

    const shared = {
      sku: p.sku,
      ...(barcodeOk && { barcode: p.barcode }),
      category: p.category_slug,
      brand: p.brand || 'VANGUARD',
    };

    for (const locale of LOCALES) {
      const zh = locale === 'zh-tw';
      const name = zh ? p.name_zh : p.name_en;
      const description = rewrite(zh ? p.description_zh : p.description_en, locale, where);
      const specText = zh ? p.specs_zh : p.specs_en_original;
      const specs = parseSpecs(specText, {
        hasCapacity: !!capacity,
        hasOrigin: !!origin[locale],
        hasDimensions: !!dimensions,
      });
      const other = [...specs.other];
      if (p.shelf_life && !/保存期限|有效期限|shelf life|expir/i.test(specText)) {
        other.push(zh ? `保存期限：${p.shelf_life}` : `Shelf life: ${p.shelf_life.replace(/年$/, ' years')}`);
      }
      if (p.barcode && !barcodeOk) other.push(barcodeLine[locale]);
      if (boxLine[locale]) other.push(boxLine[locale]);

      const data = compact({
        ...shared,
        name,
        tagline: draftTagline(description, name, zh ? 40 : 110),
        description,
        usageSteps: bullets(rewrite(zh ? p.usage_zh : p.usage_en_original, locale, where)),
        specs: {
          capacity,
          origin: origin[locale],
          boxQty,
          dimensions,
          ingredients: specs.ingredients,
          other,
        },
        safety: rewrite(zh ? p.safety_zh : p.safety_en_original, locale, where),
        images,
        youtubeUrl: p.youtube_url,
        isNew: false,
        isFeatured: p.is_featured === 'Y',
        order: Number(p.order) || 999,
        oldUrl: oldPath(p.old_url_zh),
      });
      if (!zh && !p.specs_en_original) note(`${where}：沒有英文規格原文`);
      files.push([`products/${locale}/${key}.yml`, yamlFile(data)]);
    }
  }
  return files;
}

/** 舊站網址只留路徑，網域不寫進內容 */
function oldPath(url) {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    return decodeURIComponent(u.pathname);
  } catch {
    return url;
  }
}

function importCategories(rows) {
  return rows.flatMap((c) =>
    LOCALES.map((locale) => [
      `categories/${locale}/${c.slug}.yml`,
      yamlFile(compact({ slug: c.slug, name: locale === 'en' ? c.name_en : c.name_zh, order: Number(c.order) || 999 })),
    ]),
  );
}

const SECTION_EN = { 保養: 'Maintenance', 清潔: 'Cleaning', 展覽訊息: 'Trade shows' };

function importArticles(rows, rewrite) {
  return rows.flatMap((a) =>
    LOCALES.map((locale) => {
      const zh = locale === 'zh-tw';
      const where = `文章 ${a.slug}（${locale}）`;
      const body = rewrite(zh ? a.body_zh : a.body_en_original, locale, where);
      const tags = [...(a.tags_zh && zh ? a.tags_zh.split(/[,，、]/).map((t) => t.trim()) : []), zh ? a.section : SECTION_EN[a.section] ?? a.section];
      const data = compact({
        slug: a.slug,
        title: zh ? a.title_zh : a.title_en_original,
        excerpt: draftExcerpt(body, zh ? 60 : 160),
        cover: a.cover ? useImage(`data/images/${a.cover}`) : undefined,
        tags: tags.filter(Boolean),
        publishedAt: a.year ? `${a.year}-01-01` : IMPORT_DATE,
        source: 'human',
      });
      return [`articles/${locale}/${a.slug}.md`, mdFile(data, body)];
    }),
  );
}

/** 消息日期：舊站只有年份，從標題或內文找同年份的完整日期；找不到用該年 1 月 1 日 */
function newsDate(n) {
  const re = /(20\d{2})\s*[年./-]\s*(\d{1,2})\s*[月./-]\s*(\d{1,2})/g;
  for (const text of [n.title_zh, n.body_zh, n.title_en_original]) {
    for (const m of (text || '').matchAll(re)) {
      const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
      if (Math.abs(y - Number(n.year)) <= 1 && mo >= 1 && mo <= 12 && d >= 1 && d <= 31)
        return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }
  note(`消息 ${n.slug}：找不到完整日期，用 ${n.year}-01-01`);
  return `${n.year}-01-01`;
}

function importNews(rows, rewrite) {
  return rows.flatMap((n) => {
    const date = newsDate(n);
    return LOCALES.map((locale) => {
      const zh = locale === 'zh-tw';
      const body = rewrite(zh ? n.body_zh : n.body_en_original, locale, `消息 ${n.slug}（${locale}）`);
      const data = compact({
        slug: n.slug,
        title: zh ? n.title_zh : n.title_en_original,
        date,
        cover: n.cover ? useImage(`data/images/${n.cover}`) : undefined,
      });
      return [`news/${locale}/${n.slug}.md`, mdFile(data, body)];
    });
  });
}

function importPages(rows, rewrite) {
  return rows.flatMap((pg) =>
    LOCALES.map((locale) => {
      const zh = locale === 'zh-tw';
      const body = rewrite(zh ? pg.body_zh : pg.body_en_original, locale, `頁面 ${pg.key}（${locale}）`);
      if (!body) note(`頁面 ${pg.key}（${locale}）：舊站沒有內文`);
      return [`pages/${locale}/${pg.key}.md`, mdFile({ slug: pg.key, title: zh ? pg.title_zh : pg.title_en_original }, body)];
    }),
  );
}

// ───────────── 主程式 ─────────────
async function main() {
  const sheets = await readWorkbook();
  const rewrite = buildRewriter(sheets, await readDownloadMap());

  const files = [
    ...importProducts(sheets.products, rewrite),
    ...importCategories(sheets.categories),
    ...importArticles(sheets.articles, rewrite),
    ...importNews(sheets.news, rewrite),
    ...importPages(sheets.pages, rewrite),
  ];

  const written = new Set();
  for (const [rel, text] of files) {
    const abs = path.join(CONTENT, rel);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, text);
    written.add(path.relative(ROOT, abs));
  }
  const img = await processImages(written);

  // 刪掉上一次匯入產生、這次沒有的檔案
  const previous = JSON.parse(await fs.readFile(MANIFEST, 'utf8').catch(() => '[]'));
  const stale = previous.filter((f) => !written.has(f));
  for (const f of stale) await fs.rm(path.join(ROOT, f), { force: true });
  await fs.writeFile(MANIFEST, `${JSON.stringify([...written].sort(), null, 2)}\n`);

  // 舊網域、舊信箱最後檢查（oldUrl 只存路徑，所以整份內容都不該再出現）
  const leaks = [];
  for (const f of written) {
    if (!/\.(ya?ml|md)$/.test(f)) continue;
    const t = await fs.readFile(path.join(ROOT, f), 'utf8');
    if (/vanguardwax\.com/i.test(t)) leaks.push(f);
  }

  // ───── 報告：筆數比對 ─────
  const expected = {
    products: sheets.products.length,
    categories: sheets.categories.length,
    articles: sheets.articles.length,
    news: sheets.news.length,
    pages: sheets.pages.length,
  };
  const keysOf = { products: (r) => r.sku.toLowerCase(), categories: (r) => r.slug, articles: (r) => r.slug, news: (r) => r.slug, pages: (r) => r.key };
  console.log('\n集合          工作表   zh-tw   en    結果');
  let allOk = true;
  for (const [col, want] of Object.entries(expected)) {
    const sheetKeys = new Set(sheets[col].map(keysOf[col]));
    const counts = {};
    const diffs = [];
    for (const locale of LOCALES) {
      const dir = path.join(CONTENT, col, locale);
      const onDisk = (await fs.readdir(dir)).filter((f) => !f.startsWith('.')).map((f) => f.replace(/\.[^.]+$/, ''));
      counts[locale] = onDisk.length;
      for (const k of onDisk) if (!sheetKeys.has(k)) diffs.push(`${locale} 多出 ${k}（不在工作表）`);
      for (const k of sheetKeys) if (!onDisk.includes(k)) diffs.push(`${locale} 缺少 ${k}`);
    }
    if (sheetKeys.size !== want) diffs.push(`工作表有重複代稱（${want} 列、${sheetKeys.size} 個不同代稱）`);
    const ok = diffs.length === 0 && counts['zh-tw'] === want && counts.en === want;
    allOk &&= ok;
    console.log(`${col.padEnd(12)} ${String(want).padStart(6)} ${String(counts['zh-tw']).padStart(7)} ${String(counts.en).padStart(5)}    ${ok ? '✓ 一致' : '✗ 不一致'}`);
    for (const d of diffs) console.log(`    - ${d}`);
  }
  console.log(
    `\n圖片：${img.count} 張（這次新轉 ${img.converted} 張），${(img.before / 1e6).toFixed(1)}MB → ${(img.after / 1e6).toFixed(1)}MB`,
  );
  if (stale.length) console.log(`刪掉上次匯入、這次沒有的檔案 ${stale.length} 個`);
  console.log(leaks.length ? `✗ 仍含舊網域：\n  ${leaks.join('\n  ')}` : '✓ 內容裡沒有舊網域、舊信箱');
  if (log.warnings.length) console.log(`\n⚠ 需要注意（${log.warnings.length}）\n  ${log.warnings.join('\n  ')}`);
  if (log.notes.length) console.log(`\n說明（${log.notes.length}）\n  ${log.notes.join('\n  ')}`);
  if (!allOk || leaks.length) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
