// 內容結構：欄位定義見 docs/PRD.md「資料欄位」。
// 後台 public/admin/config.yml 必須和這裡一對一對應；改一邊就要改另一邊。
// 中英文分資料夾：src/content/<集合>/zh-tw/*、src/content/<集合>/en/*。
// 「共用」欄位在後台設成 i18n: duplicate，兩個語言的檔案會寫入相同的值。
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/** id 一律用「語言/檔名」，例如 zh-tw/rh-5070；不讓 frontmatter 的 slug 蓋掉 id */
const loader = (collection: string, ext: string) =>
  glob({
    base: `./src/content/${collection}`,
    pattern: `**/*.${ext}`,
    generateId: ({ entry }) => entry.replace(/\.[^.]+$/, ''),
  });

const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, '只能用英文小寫、數字和連字號');
const sku = z.string().regex(/^[A-Za-z0-9]+(-[A-Za-z0-9]+)*$/, '型號只能用英文、數字和連字號');
const faq = z.array(z.object({ q: z.string(), a: z.string() })).max(5).optional();
const date = z.coerce.date();

const products = defineCollection({
  loader: loader('products', 'yml'),
  schema: z.object({
    sku,
    barcode: z.string().regex(/^\d{13}$/, 'EAN-13 條碼必須是 13 位數字').optional(),
    name: z.string().min(1),
    category: slug,
    brand: z.string().default('VANGUARD'),
    tagline: z.string().min(1),
    description: z.string().optional(),
    features: z.array(z.string()).max(5).optional(),
    usageSteps: z.array(z.string()).optional(),
    specs: z
      .object({
        capacity: z.string().optional(),
        origin: z.string().optional(),
        boxQty: z.number().int().positive().optional(),
        dimensions: z.string().optional(),
        ingredients: z.string().optional(),
        /** 舊站其他規格（材質、重量、保存期限…），一行一項「標籤：值」 */
        other: z.array(z.string()).optional(),
      })
      .optional(),
    safety: z.string().optional(),
    images: z.array(z.string()).optional(),
    youtubeUrl: z.string().optional(),
    faq,
    relatedSkus: z.array(sku).max(4).optional(),
    isNew: z.boolean().default(false),
    isFeatured: z.boolean().default(false),
    order: z.number().default(999),
    oldUrl: z.string().optional(),
  }),
});

const categories = defineCollection({
  loader: loader('categories', 'yml'),
  schema: z.object({
    slug,
    name: z.string().min(1),
    description: z.string().optional(),
    image: z.string().optional(),
    order: z.number().default(999),
  }),
});

const articles = defineCollection({
  loader: loader('articles', 'md'),
  schema: z.object({
    slug,
    title: z.string().min(1),
    excerpt: z.string().min(1),
    cover: z.string().optional(),
    tags: z.array(z.string()).optional(),
    faq,
    relatedSkus: z.array(sku).max(4).optional(),
    author: z.string().optional(),
    publishedAt: date,
    updatedAt: date.optional(),
    source: z.enum(['human', 'ai']).default('human'),
  }),
});

const news = defineCollection({
  loader: loader('news', 'md'),
  schema: z.object({
    slug,
    title: z.string().min(1),
    date,
    cover: z.string().optional(),
  }),
});

const pages = defineCollection({
  loader: loader('pages', 'md'),
  schema: z.object({
    slug,
    title: z.string().min(1),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
  }),
});

// 文章主題本身就有 locale 欄位，所以不分語言資料夾
const topics = defineCollection({
  loader: loader('topics', 'yml'),
  schema: z.object({
    keyword: z.string().min(1),
    intent: z.enum(['informational', 'comparison', 'how-to']),
    locale: z.enum(['zh-TW', 'en']),
    priority: z.number().int().min(1),
    status: z.enum(['queued', 'drafted', 'published']).default('queued'),
    note: z.string().optional(),
  }),
});

export const collections = { products, categories, articles, news, pages, topics };
