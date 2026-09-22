#!/usr/bin/env node
// 建置前把 public/uploads 的圖片轉成小尺寸 webp（public/_img/，不進 git），給網頁用 srcset 載入。
// 後台新上傳的圖片下次建置會自動產生；已經產生過的會略過。
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'public/uploads');
const OUT = path.join(ROOT, 'public/_img');
export const WIDTHS = [400, 800];

await fs.mkdir(OUT, { recursive: true });
const files = (await fs.readdir(SRC)).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
let made = 0;
const queue = [...files];
async function worker() {
  for (let f = queue.shift(); f; f = queue.shift()) {
    const src = path.join(SRC, f);
    const base = f.replace(/\.[^.]+$/, '');
    for (const w of WIDTHS) {
      const dest = path.join(OUT, `${base}-${w}.webp`);
      if (await fs.stat(dest).catch(() => null)) continue;
      await sharp(src, { failOn: 'none' }).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: 72 }).toFile(dest);
      made++;
    }
  }
}
await Promise.all(Array.from({ length: 8 }, worker));
console.log(`[thumbs] ${files.length} 張圖片，新產生 ${made} 個縮圖`);
