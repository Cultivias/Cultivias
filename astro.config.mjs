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
});
