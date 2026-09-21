// 公司資料：來源 docs/brand-facts.md
import type { Locale } from '../i18n/utils';

export const SITE_URL = 'https://vanguardwaxvlad.vercel.app';

export const sameAs = [
  'https://www.facebook.com/Vanguardwax/',
  'https://www.instagram.com/vanguardwax_us/',
  'https://x.com/vanguardwax',
  'https://line.me/R/ti/p/%40vanguard',
  'https://www.youtube.com/@vanguardwax-en',
  'https://vanguard-tw.en.alibaba.com/',
];

export function organizationJsonLd(locale: Locale) {
  const zh = locale === 'zh-tw';
  return {
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: zh ? '協凱貿易有限公司' : 'KYOEI TAIWAN CORP.',
    alternateName: zh ? 'KYOEI TAIWAN CORP.' : '協凱貿易有限公司',
    brand: { '@type': 'Brand', name: 'VANGUARD' },
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    foundingDate: '1978',
    telephone: '+886-2-8262-3168',
    email: 'wulingwang929@gmail.com',
    address: {
      '@type': 'PostalAddress',
      streetAddress: zh ? '中央路一段365巷30弄6號' : 'No. 6, Alley 30, Lane 365, Sec. 1, Zhongyang Rd.',
      addressLocality: zh ? '土城區' : 'Tucheng Dist.',
      addressRegion: zh ? '新北市' : 'New Taipei City',
      postalCode: '236',
      addressCountry: 'TW',
    },
    sameAs,
  };
}
