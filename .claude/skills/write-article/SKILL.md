---
name: write-article
description: 依 src/content/topics 的主題，寫一篇 VANGUARD 汽車保養文章草稿（中英文各一篇），只引用網站上真實存在的產品，寫完把主題狀態改成 drafted。用於每週自動產文，或使用者要求寫一篇新文章時。
---

# 產出汽車保養文章草稿

這是 VANGUARD 練習站的自動產文規則。產出的是**草稿**，會開 PR 給 Henry 審，不會直接上線。

## 步驟

### 1. 挑主題

- 讀 `src/content/topics/*.yml`，挑 `status: queued` 之中 `priority` 數字最小的一筆；同分就取 `keyword` 筆畫／字母順序在前的那一筆。
- 沒有 `queued` 的主題就停下來，什麼都不要寫，並說明「沒有排隊中的主題」。
- 讀 `src/content/articles/zh-tw/*.md` 的 `title` 與 `slug`，確認主題沒有寫過。題目重複就把該主題狀態改成 `drafted` 並挑下一筆。
- 主題的 `note` 欄位是寫作方向，要照著做。

### 2. 找可以引用的產品

- 只能引用 `src/content/products/zh-tw/*.yml` 裡真實存在的產品。
- 產品名、型號、容量、產地、成分、使用步驟、注意事項**一律照抄檔案內容**，不可改寫成別的數字或效果。
- **嚴禁**自己寫價格、折扣、庫存、認證、檢測數據、得獎、客戶名稱、使用者評價。檔案裡沒有的就不要寫。
- 找不到適合的產品就不要硬塞，文章可以只談方法。

### 3. 寫中文版

檔案：`src/content/articles/zh-tw/<slug>.md`

- `slug`：英文小寫加連字號，看得出主題，例如 `how-often-to-wax-a-car`。
- 第一段（也就是 `excerpt`）**40–60 字，直接回答標題的問題**，不要鋪陳。
- 全文 **1,200–2,000 字**（不含 frontmatter），用 `##`、`###` 分段，重點用清單。
- **3–5 個內部連結**，寫成 Markdown 連結，網址只能用下列格式：
  - 產品頁 `/products/<分類代稱>/<型號小寫>`（分類代稱要和該產品 `category` 欄位一致）
  - 分類頁 `/products/<分類代稱>`
  - 文章 `/car-care/<slug>`、消息 `/news/<slug>`
  - 其他頁 `/about`、`/where-to-buy`、`/catalog`、`/contact`、`/inquiry`
- 內文結尾放「實測筆記」佔位，原文照抄：

```markdown
## 實測筆記

> 待補：Henry 的實際使用經驗（施工環境、天氣、車色、實際感受）。發布前請補上或刪除這一段。
```

- FAQ **3–5 題**放在 frontmatter 的 `faq`，問題用真人會搜尋的問法，回答 2–4 句。
- 語氣：白話繁體中文，像有經驗的汽車美容店老闆在解釋，不要業配腔、不要誇大療效。
- 不要寫「本文由 AI 產生」之類的句子，來源記在 `source` 欄位就好。

#### frontmatter 欄位（型別見 src/content.config.ts）

```yaml
---
slug: how-often-to-wax-a-car
title: 汽車多久打一次蠟？
excerpt: 直接回答問題的 40–60 字。
tags:
  - 保養
faq:
  - q: 問題
    a: 回答
relatedSkus:
  - RH-5070
author: VANGUARD 編輯台
publishedAt: 2026-09-27
source: ai
---
```

- `publishedAt` 用今天日期（`date +%F` 的結果；台北時區）。
- `relatedSkus` 2–4 個，必須是文章裡真的提到的型號，且 `src/content/products/zh-tw/` 裡有對應檔案。
- `cover` 沒有合適圖片就不要填，不可以引用不存在的圖片路徑。

### 4. 寫英文版

檔案：`src/content/articles/en/<slug>.md`，`slug` 與中文版相同。

- 不是逐字翻譯，用英文母語者的寫法重寫同一個主題，長度可略短（800–1,500 字）。
- 產品名用 `src/content/products/en/<型號小寫>.yml` 的 `name`。
- 內部連結全部加 `/en` 前綴，例如 `/en/products/car-wax/rh-5070`。
- 「實測筆記」佔位改成：

```markdown
## Field notes

> To be added: Henry's hands-on experience (conditions, weather, paint colour, results). Fill this in or remove before publishing.
```

- `tags`、`faq`、`title`、`excerpt` 都要英文；`slug`、`relatedSkus`、`publishedAt`、`source` 與中文版一致。

### 5. 更新主題狀態

把該主題 yml 的 `status: queued` 改成 `status: drafted`，其他欄位不要動。

### 6. 最後檢查

- 兩個語言的檔案都存在，`slug` 相同。
- 內部連結指向的產品或分類檔案真的存在。
- 沒有出現價格、折扣、庫存、檢測數據、得獎、客戶名稱。
- 沒有出現舊網域 `vanguardwax.com` 或舊信箱 `globalservice@vanguardwax.com`。
- 中文版有「實測筆記」佔位、英文版有「Field notes」佔位。
- 主題狀態已改成 `drafted`。
