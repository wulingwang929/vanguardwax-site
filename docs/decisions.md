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

## 區塊 2｜內容結構與後台（2026-09-22）
- **檔案格式**：products、categories、topics 用 `.yml`（純資料）；articles、news、pages 用 `.md`（frontmatter＋內文 body）。
- **中英文分資料夾**：`src/content/<集合>/zh-tw/`、`/en/`，同一筆內容兩個語言用同一個檔名。
  共用欄位在後台設 `i18n: duplicate`，存檔時兩個語言寫入相同的值；Astro schema 兩個語言用同一份。
- **內容 id 固定為「語言/檔名」**（自訂 `generateId`），避免 frontmatter 的 `slug` 欄位讓中英文 id 撞在一起。
- **topics 不分語言資料夾**：PRD 的主題本身有 `locale` 欄位（zh-TW／en），分資料夾會重複。另外保留 CSV 裡的
  `note` 欄位（寫作方向備註），自動產文時用得到。
- **分類參照用代稱字串**（例如 `car-wax`），後台用 relation 下拉選單；相關產品用型號字串，後台用 relation 多選。
- **建議性數量不設硬限制**：特色 3–5、FAQ 3–5、相關產品 2–4 只設上限（5、5、4），下限寫成提示，
  否則在後台新增一個測試產品也得先填滿；tagline「40 字內」也只寫提示，因為英文 40 字元太短。
- **英文缺內容時**：列表和產品頁用中文內容代替，頁面上方顯示「此內容尚無英文版」提示（`src/lib/content.ts`）。
- **圖片**：後台上傳到 `public/uploads/`，內容裡存 `/uploads/檔名`，網頁直接用 `<img>` 顯示（不經 Astro 壓縮）。
- **先匯入分類與文章主題**：9 個分類（來自 inventory.xlsx）和 10 個主題（來自 topics.csv），讓後台的分類下拉選單能用。
  產品、文章、消息、頁面留到匯入資料的區塊。
- **暫時的產品頁**：先做最簡單的 /products 和 /products/分類/型號（中英文），讓後台新增的產品看得到；版面之後重做。
- **Sveltia CMS** 從 unpkg CDN 載入最新版；`output.omit_empty_optional_fields: true` 讓沒填的選填欄位不寫進檔案。

## 區塊 3｜匯入舊站資料（2026-09-22）
- **匯入腳本** `scripts/import.mjs`（`node scripts/import.mjs`）：讀 inventory.xlsx 五個工作表＋data/images，
  產生中英文內容檔與 `public/uploads/` 圖片。可重跑：同一筆永遠寫同一個檔名；上次匯入、這次沒有的檔案依
  `scripts/import-manifest.json` 刪除；後台新增的內容不受影響，但匯入的那幾筆在後台改過會被蓋回去。
- **規格以舊站原文為準**（使用者決定）：試算表的產地／容量／尺寸欄位和舊站規格原文有 34 處不同
  （例如 RH-5011 容量欄位誤植「160m」、J1004 產地欄位「德國」但原文「台灣」、「德國原料、台灣分裝」被簡化成「德國」），
  一律用原文；原文沒有該行才用欄位。
- **新增 `specs.other`（其他規格）**：舊站規格有材質、重量、保存期限、電壓等 30 多種標籤，PRD 只有五個欄位；
  其餘照原文一行一項保存，網站顯示在「其他規格」。後台與 schema 同步加上。
- **「包裝尺寸」改稱「尺寸」**：舊站的尺寸多半是產品本身尺寸，不一定是包裝。
- **條碼**：J5001–J5004 各有兩個子型號、兩個條碼，不是單一 EAN-13，放進其他規格，不填 barcode（JSON-LD 不送 gtin13）。
- **箱入數**：純數字才填 boxQty；「12/24」這種小箱／大箱寫法放進其他規格；RH-5064 的值是欄名「箱入數(小/大)」誤植，不匯入。
- **tagline（一句話定義）暫用說明第一句**（中文 40 字、英文 110 字元內截斷）。舊站沒有這個欄位，之後改寫。
- **文章 excerpt 暫用內文第一段**（中文 60 字、英文 160 字元內）。**文章發布日期**：舊站沒有，固定用 2026-09-22。
- **消息日期**：舊站只有年份，從標題／內文找同年的完整日期；找不到（2017、2022 各一則）用該年 1 月 1 日。
- **英文內容**：產品名用改寫過的 name_en；說明用 description_en；使用方法、規格、注意事項、文章、消息、頁面用舊站英文原文（*_en_original）。
- **舊網域與舊信箱**：內文連結依舊網址對應到新網站的產品／分類／文章／消息／頁面網址，找不到對應的指向首頁；
  舊站圖片網址換成 `/uploads/` 本機圖（依 images 工作表與 assets/download.sh 對照）；舊站圖片沒有本機檔的 13 處直接移除
  （都是英文版插圖、型錄與代理品牌圖）。oldUrl 欄位只存舊網址的路徑（不含網域），仍可對照舊站。腳本最後會檢查內容裡沒有 vanguardwax.com。
- **圖片**：以型號命名（產品圖原檔已是 `型號-01.jpg`）；文章圖加 `article-`、消息圖加 `news-` 前綴，全部放在 `public/uploads/` 同一層，
  後台媒體庫看得到。寬度超過 1600px 的縮小、重新壓縮：143MB → 32MB。
- **pages 照工作表匯入 5 筆**（含內容重複的 company-profile／vanguard-story、沒有內文的 brand 與 where-to-buy）。
  舊公司簡介有「四十年」等 brand-facts 禁用寫法；頁面目前沒有上線，做 /about 時依 CLAUDE.md 改用 assets/company-profile.md 精簡版。
- **產品頁**：說明與注意事項用 marked 轉 Markdown 顯示。
- **例外：J1004 產地改為「德國」**（使用者確認）：產品名「德國進口」、試算表欄位與英文原文（Imported from Germany）都是德國，
  只有中文規格原文寫台灣。寫在 import.mjs 的 `SPEC_OVERRIDES`，重跑也會保留。
