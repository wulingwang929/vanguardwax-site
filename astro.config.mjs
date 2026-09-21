// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://vanguardwaxvlad.vercel.app',
  output: 'static',
  trailingSlash: 'ignore',
  i18n: {
    locales: ['zh-tw', 'en'],
    defaultLocale: 'zh-tw',
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'zh-tw',
        locales: { 'zh-tw': 'zh-TW', en: 'en' },
      },
    }),
  ],
  vite: { plugins: [tailwindcss()] },
});
