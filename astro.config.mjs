// @ts-check
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Content import maps that every content sync regenerates in .astro/.
const generatedImportMaps = ['content-assets.mjs', 'content-modules.mjs'].map((file) =>
  fileURLToPath(new URL(`./.astro/${file}`, import.meta.url)),
);

export default defineConfig({
  // The only place the production domain is defined. Canonical, Open Graph,
  // sitemap and robots.txt URLs are all derived from it.
  site: 'https://pilatesegitmeni.com',
  trailingSlash: 'always',
  i18n: {
    defaultLocale: 'tr',
    locales: ['tr', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [
    // No sitemap i18n option: it pairs pages by identical paths, which misses
    // translated slugs. hreflang alternates are emitted in each page's <head>
    // instead, and only for translations that exist.
    sitemap(),
    // While / and /en/ show the temporary coming-soon page, the original
    // homepage is previewable at /dev/home/ and /en/dev/home/ under `astro dev`
    // only. A build never registers the route, so nothing of it reaches dist/.
    {
      name: 'dev-home-preview',
      hooks: {
        'astro:config:setup': ({ command, injectRoute }) => {
          if (command !== 'dev') return;
          for (const pattern of ['/dev/home', '/en/dev/home']) {
            injectRoute({ pattern, entrypoint: './src/dev/HomePreview.astro' });
          }
        },
      },
    },
  ],
  vite: {
    server: {
      watch: {
        // `astro check` and `astro build` rewrite the import maps without the
        // dev-only sample fixtures, and scripts/keep-dev-imports.mjs restores
        // them afterwards. A running dev server ignores both writes; it still
        // refreshes after its own, which Astro tracks without the watcher.
        ignored: (path) => generatedImportMaps.includes(path),
      },
    },
  },
});
