// 首頁輪播：沿用舊站首頁的 6 張橫幅與順序（assets/photos/banner-*.jpg，2000×880，圖上文字為英文）
import type { ImageMetadata } from 'astro';
import kyoei from '../assets/banners/kyoei.jpg';
import rh5015 from '../assets/banners/rh5015.jpg';
import superProtection from '../assets/banners/super-protection.jpg';
import ktv from '../assets/banners/ktv.jpg';
import rh5070 from '../assets/banners/rh5070.jpg';
import clay from '../assets/banners/clay.jpg';

export type BannerLink =
  | { type: 'product'; sku: string }
  | { type: 'path'; path: string; altKey: 'kyoei' | 'superProtection' | 'clay' };

export const banners: { image: ImageMetadata; link: BannerLink }[] = [
  { image: kyoei, link: { type: 'path', path: '/about', altKey: 'kyoei' } },
  { image: rh5015, link: { type: 'product', sku: 'RH-5015' } },
  { image: superProtection, link: { type: 'path', path: '/search?q=Super%20Protection', altKey: 'superProtection' } },
  { image: ktv, link: { type: 'product', sku: 'L0005' } },
  { image: rh5070, link: { type: 'product', sku: 'RH-5070' } },
  { image: clay, link: { type: 'path', path: '/products/clay-bar', altKey: 'clay' } },
];
