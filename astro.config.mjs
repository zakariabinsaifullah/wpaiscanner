// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://wpaiscanner.com',
  integrations: [mdx(), sitemap()],
  build: {
    // Emit /docs/index.html rather than /docs.html so URLs stay clean.
    format: 'directory',
  },
});
