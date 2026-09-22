# 詢價單設定（Google Apps Script）

網站本身沒有後端。詢價表單直接送到 Google Apps Script 網頁應用程式，
由它寫進 Google 試算表、用部署者的 Gmail 寄信。全部免費，不用綁卡。

程式碼：`scripts/apps-script/inquiry.gs`

## 安裝
1. 到 Google 試算表新增空白試算表，命名「VANGUARD 練習站詢價」。
2. 選單「擴充功能 → Apps Script」，刪掉預設的 `function myFunction() {}`，貼上 `inquiry.gs` 全部內容，按儲存。
3. 上方函式選單選 `setup`，按「執行」→ 依畫面授權（試算表、寄信）。會自動建立「詢價單」工作表與標題列。
4. 右上「部署 → 新增部署作業」→ 類型選「網頁應用程式」：
   - 執行身分：我
   - 誰可以存取：所有人
5. 按「部署」，複製「網頁應用程式網址」（結尾是 `/exec`），填進 `src/data/site-config.ts` 的 `INQUIRY_ENDPOINT`。

## 之後改程式
改完 `inquiry.gs` 要到「部署 → 管理部署作業 → 編輯（鉛筆）→ 版本選『新版本』→ 部署」，網址不會變。
直接「新增部署作業」會產生新網址，網站設定也要跟著改。

## 限制（免費帳號）
- MailApp 每天約 100 封（每張詢價寄 2 封，約 50 張/天）。
- 同一個 Email 一小時最多 3 張；honeypot 有填、或開頁不到 3 秒就送出，會被擋下。
