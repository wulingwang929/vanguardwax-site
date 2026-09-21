# 決策紀錄

## 區塊 1｜骨架與部署（2026-09-22）
- **Astro 7.3 + TypeScript strict + Tailwind 4（@tailwindcss/vite）+ @astrojs/sitemap**，`output: 'static'`，沒有 adapter。
- **TypeScript 用 6.x 而不是最新 7.x**：`@astrojs/check`（`npm run build` 會先跑型別檢查）目前只支援 TS 5–6。
- **Node 版本**：package.json `engines.node` 設 `24.x`，它會蓋掉 Vercel 後台的舊 Node 18 設定。
- **Vercel Framework Preset**：寫在 `vercel.json` 的 `"framework": "astro"`，不用進後台手動改。
- **noindex 三層**：每頁 `<meta name="robots" content="noindex, nofollow">`、`robots.txt` 全站 Disallow、
  `vercel.json` 對所有回應加 `X-Robots-Tag: noindex, nofollow` 標頭（圖片、PDF、sitemap 也涵蓋）。
- **i18n**：Astro 內建 i18n，`zh-tw` 為預設語言在根網址、`en` 在 `/en`。語言切換用 `src/i18n/utils.ts` 的
  `localizePath()` 換掉網址前綴，所以會停在同一頁的另一種語言。畫面文字全部放在 `src/i18n/zh-tw.json`、`en.json`。
- **hreflang** 用 `zh-TW`、`en`、`x-default`（指向中文版）；`<html lang>` 中文用 `zh-Hant-TW`。
- **JSON-LD**：全站共用 Organization + WebSite（`@graph`），公司資料寫在 `src/data/organization.ts`，
  來源是 docs/brand-facts.md；email 用專案 Gmail，不用舊信箱。各頁可再加自己的節點。
- **Logo**：頁首用 `assets/logo/logo-on-dark-bg.png`（深色頁首），由 Astro 轉成 webp；`public/logo.png` 給 JSON-LD 與 OG 用。
- **不上 GitHub 的資料**：`data/raw/`、`data/raw.tgz`（依指示），另外 `data/images/`（137MB 原圖）也不推，
  避免 repo 和 Vercel 每次建置變慢；之後要用的產品圖壓縮後放進 `src/`。
- **套件安裝腳本**：npm 11 預設擋下 esbuild、fsevents 的 install script，建置不受影響，所以沒有放行。
