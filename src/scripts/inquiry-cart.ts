// 詢價車：存在瀏覽器的 localStorage，不用登入。
export interface InquiryItem {
  sku: string;
  name: string;
  url: string;
  image?: string;
  qty: number;
}

const KEY = 'vanguard-inquiry-v1';

export function readCart(): InquiryItem[] {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function writeCart(items: InquiryItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* 無痕模式等情況存不了，就只在這一頁有效 */
  }
  updateBadges();
}

export function addToCart(item: Omit<InquiryItem, 'qty'>, qty = 1) {
  const items = readCart();
  const existing = items.find((i) => i.sku === item.sku);
  if (existing) existing.qty += qty;
  else items.push({ ...item, qty });
  writeCart(items);
}

export function updateBadges() {
  const count = readCart().length;
  document.querySelectorAll<HTMLElement>('[data-inquiry-count]').forEach((el) => {
    el.textContent = String(count);
    el.hidden = count === 0;
  });
}
