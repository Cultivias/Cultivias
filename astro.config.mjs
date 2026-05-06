// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://cultivias.com',
  base: '/',
  integrations: [
    tailwind({ applyBaseStyles: false }),
  ],
  output: 'static',
  vite: {
    plugins: [
      {
        name: 'ignore-empty-md-imports',
        resolveId(id, importer) {
          if (id === '' && importer?.match(/\.(md|mdx)$/)) {
            return '\0virtual:empty-md-import';
          }
        },
        load(id) {
          if (id === '\0virtual:empty-md-import') return 'export default ""';
        },
      },
    ],
    build: {
      rollupOptions: {
        external: ['/pagefind/pagefind.js'],
      },
    },
  },
});
