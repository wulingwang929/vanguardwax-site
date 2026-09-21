# Vanguard Wax 練習站 — 需求規格（PRD）

## 目標
以協凱貿易官網為題目，練習做一個雙語、可自己管理內容、SEO／AEO 完整、會自動產文的網站。
非商業練習站：全站 noindex、頁尾標示練習作品，詢價只用測試資料。

## 使用者
1. 海外與台灣的經銷商、汽車美容店：找產品、看規格、送出詢價。
2. 一般車主：看保養知識文章、找適合的產品。
3. 網站管理者（Henry）：在 /admin 改內容、審文章。

## 頁面
首頁、產品總覽、分類頁、產品頁、汽車保養文章列表與內頁、最新消息列表與內頁、公司簡介、購買資訊、
型錄、聯絡我們、詢價車、搜尋、404。中英文各一套，網址規則見 CLAUDE.md。

## 功能
- 語言切換：停在同一頁的另一種語言；缺英文內容時顯示中文並標示。
- 站內搜尋：Pagefind，中英文分開索引；型號寫成 RH5070 或 RH-5070 都要搜得到。
- 詢價車：存在瀏覽器，不用登入；送出到 Google Apps Script → 記進「詢價單」試算表 → Gmail 通知管理者、寄確認信給填表人。
- 後台：Sveltia CMS（/admin），能新增、修改產品、分類、文章、消息、文章主題，中英文切換編輯。
- 自動產文：每週一、四台北時間 09:00，GitHub Actions 依 topics 產生文章草稿並開 PR。

## 資料欄位
中英文分資料夾存放；標「共用」的欄位兩語言共用，不需翻譯。

### products（產品）
| 欄位 | 型別 | 說明 |
|---|---|---|
| sku | 文字，共用，必填 | 型號，例如 RH-5070；網址用小寫 rh-5070 |
| barcode | 文字，共用 | EAN-13 條碼，用於 JSON-LD gtin13 |
| name | 文字，必填 | 產品名 |
| category | 參照 categories，共用，必填 | |
| brand | 文字，共用 | 預設 VANGUARD |
| tagline | 文字，必填 | 一句話定義：是什麼、給誰用、解決什麼（40 字內） |
| description | 長文 | 產品說明 |
| features | 清單 | 特色 3–5 點 |
| usageSteps | 清單 | 使用步驟 |
| specs.capacity | 文字，共用 | 容量，例如 200g |
| specs.origin | 文字 | 產地 |
| specs.boxQty | 數字，共用 | 箱入數 |
| specs.dimensions | 文字，共用 | 包裝尺寸 |
| specs.ingredients | 文字 | 主要成分 |
| safety | 長文 | 注意事項 |
| images | 圖片清單，共用 | 第一張為主圖；檔名以型號開頭 |
| youtubeUrl | 網址，共用 | |
| faq | 清單（q、a） | 3–5 題 |
| relatedSkus | 型號清單，共用 | 2–4 個 |
| isNew / isFeatured | 布林，共用 | 新品／首頁主打 |
| order | 數字，共用 | 排序 |
| oldUrl | 文字，共用 | 舊站網址，僅供參考 |

### categories（分類）
slug（共用）、name、description、image（共用）、order（共用）。

### articles（汽車保養文章）
slug（共用）、title、excerpt（第一段 40–60 字直接回答）、body、cover（共用）、tags、faq、
relatedSkus（共用）、author、publishedAt、updatedAt、source（human／ai）。

### news（最新消息）
slug（共用）、title、body、date（共用）、cover（共用）。

### pages（公司簡介、購買資訊、型錄等）
slug（共用）、title、body、seoTitle、seoDescription。

### topics（文章主題）
keyword、intent（informational／comparison／how-to）、locale、priority（1 最高）、status（queued／drafted／published）。

## SEO／AEO
每頁 title、description、canonical、hreflang（zh-TW、en、x-default）、Open Graph；
JSON-LD：Organization、LocalBusiness、WebSite、BreadcrumbList、Product、Article、FAQPage、VideoObject；
sitemap 中英文對應；/llms.txt；全站 noindex（練習站）。

## 驗收標準
- 手機與桌機所有頁面正常，行動版 Lighthouse 效能 90 以上。
- 產品數、分類數、文章數與 data/inventory.xlsx 一致。
- 詢價送出後試算表多一列、兩封信都收到。
- 在 /admin 改內容，3 分鐘內網站更新。
- 手動執行產文 workflow，15 分鐘內出現 PR 與預覽網址。
