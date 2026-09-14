// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import { remarkWikilinks } from './src/lib/remark-wikilinks.js';

// https://astro.build/config
export default defineConfig({
  // Placeholder — dotstack.com is not secured yet (see ADR 0012).
  site: 'https://dotstack.com',
  markdown: {
    processor: unified({ remarkPlugins: [remarkWikilinks] }),
  },
});
