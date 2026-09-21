# Vanguard Wax 官網 — 專案規範

## 專案
以協凱貿易（Vanguard Wax）B2B 汽車美容用品官網為題目的非商業練習專案。詢價制，不做金流。
語言：zh-TW（預設，根網址）、en（/en）。需求見 docs/PRD.md；網址、Gmail、GA4、地址電話見 docs/brand-facts.md。
這不是正式官網：全站 noindex，頁尾標示「練習作品，非官方網站」，不得移除。舊網域與舊信箱不得出現在網站上。

## 現況（開工前必讀）
- GitHub repo：wulingwang929/vanguardwax-site（個人帳號下的私人 repo，由 Vercel 的舊 Astro 範本建立）。
- Vercel 專案已建立，正式網址 https://vanguardwaxvlad.vercel.app 。
- 目前部署失敗：舊範本把執行環境寫死成 Node 18，Vercel 已不支援。區塊 1 要把這個 repo clone 到本資料夾，
  用最新版 Astro 重建（純靜態、不要 adapter），推到 main 後確認正式網址能打開。
- 本資料夾已有：assets/（logo、情境照、品牌色、公司簡介）、data/（舊站資料）、docs/。重建時保留這些資料夾。

## 零元原則（最重要）
除了 Claude 訂閱，這個專案不能產生任何費用。不得使用任何需要付費、綁信用卡、或免費額度用完會扣款的服務。
部署在 Vercel Hobby 免費方案（限非商業用途），網址用 vercel.app 子網址，不買網域。

## 技術棧（已定案，勿更換）
- Astro 純靜態輸出（不用 adapter、網站本身沒有後端程式）＋ TypeScript ＋ Tailwind CSS
- Vercel Hobby 免費方案，連結個人帳號下的 GitHub repo 自動部署，PR 自動產生預覽網址
- Sveltia CMS（/admin，GitHub backend）、Pagefind 站內搜尋
- 詢價：Google Apps Script 網頁應用程式 → Google 試算表 → Gmail 寄信；honeypot 與填寫時間防機器人
- GA4（Search Console 選做）
- GitHub Actions ＋ claude-code-action（用 Claude 訂閱 token，不用 API key）自動產文

## 網址規則（英文版全部加 /en 前綴，代稱一律英文小寫加連字號）
/、/products、/products/分類代稱、/products/分類代稱/型號小寫、/car-care/代稱、/news/代稱、
/about、/where-to-buy、/catalog、/contact、/inquiry、/search

## 素材與資料
- 品牌色、logo 用法：assets/brand-colors.md；公司簡介：assets/company-profile.md（用「新網站用精簡版」）。
- 產品、分類、文章、消息：data/inventory.xlsx；產品圖片：data/images/（以型號命名）。
- 文章主題：data/topics.csv。

## 工作規則
1. 每個區塊先用三句話說計畫再動手；完成後跑 npm run build，commit、push，回報網址。
2. 使用者看得到的文字一律來自內容檔或翻譯檔，不得寫死在元件裡。
3. 每個頁面都要有 title、description、canonical、hreflang、JSON-LD，以及 noindex。
4. 金鑰與 token 不得寫進程式碼、git 或對話。
5. 產品規格、價格、認證只能來自 src/content，不得自行編造。
6. 用白話繁體中文向我說明；最後列出「需要你決定的事」，沒有就寫「無」。
7. 只有三種情況停下來問我：品牌視覺取捨、舊資料明顯有錯要不要照搬、某功能超時要砍哪一半。
   其他自己決定，並記進 docs/decisions.md。
