// 網站設定（不是金鑰；這些值會出現在公開網頁裡）

/** 詢價表單送出的 Google Apps Script 網頁應用程式網址（部署後貼上，結尾是 /exec） */
export const INQUIRY_ENDPOINT = 'https://script.google.com/macros/s/AKfycbyN_fd5wnVz9J-A3s9mlYhoN4zg5_AEYI9A6VvM3wXdClrrOpCTt8tIpJkDdTMrALhN/exec';

/** 填表最短秒數：少於這個時間送出視為機器人（Apps Script 也會再檢查一次） */
export const INQUIRY_MIN_SECONDS = 3;
