// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://wpaiscanner.com',
  integrations: [mdx(), sitemap()],
  // Two posts carried different filenames before they moved to WordPress;
  // keep their old URLs pointing at the WordPress slugs that replaced them.
  redirects: {
    '/blog/getting-started-with-crawlwise':
      '/blog/getting-started-with-crawlwise-scan-fix-verify/',
    '/blog/reversible-fixes-explained':
      '/blog/reversible-by-design-fixes-that-never-touch-your-theme/',
  },
  build: {
    // Emit /docs/index.html rather than /docs.html so URLs stay clean.
    format: 'directory',
  },
});
