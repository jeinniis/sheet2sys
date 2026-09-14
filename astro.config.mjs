// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import { remarkWikilinks } from './src/lib/remark-wikilinks.js';

// https://astro.build/config
export default defineConfig({
  site: 'https://sheet2sys.com',
  markdown: {
    processor: unified({ remarkPlugins: [remarkWikilinks] }),
  },
});
