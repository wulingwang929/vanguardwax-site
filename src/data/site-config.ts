// 網站設定（不是金鑰；這些值會出現在公開網頁裡）

/** 詢價表單送出的 Google Apps Script 網頁應用程式網址（部署後貼上，結尾是 /exec） */
export const INQUIRY_ENDPOINT = 'https://script.google.com/macros/s/AKfycbyN_fd5wnVz9J-A3s9mlYhoN4zg5_AEYI9A6VvM3wXdClrrOpCTt8tIpJkDdTMrALhN/exec';

/** 填表最短秒數：少於這個時間送出視為機器人（Apps Script 也會再檢查一次） */
export const INQUIRY_MIN_SECONDS = 3;

/** GA4 評估 ID（見 docs/brand-facts.md）。只有在正式網址才會送資料 */
export const GA4_ID = 'G-Y47DESPSLR';

/** 正式網址的主機名稱；分支預覽網址不送 GA4 */
export const PRODUCTION_HOST = 'vanguardwaxvlad.vercel.app';
