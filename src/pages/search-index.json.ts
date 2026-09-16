import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import { getCategory } from '../lib/categories.js';
import { remarkWikilinks } from '../lib/remark-wikilinks.js';

// Static search index, built once at build time and fetched client-side by
// /search (and, later, the quick-search modal) — keeps every other page
// JS-free while still giving readers a way to find things as the library
// grows past what a 6-item nav can carry. See docs/architecture.md §7.

// Our own markdown → HTML pipeline (the same processor + remarkWikilinks
// config as astro.config.mjs) only ever produces a known, bounded set of
// tags from OUR OWN authored content — never arbitrary/untrusted input —
// so a couple of targeted regexes are a safe, defensible way to reduce it
// to plain searchable text without a second markdown/HTML parser
// dependency. This is a build-time step; nothing here touches the
// browser or renders from user input.
//
// Fenced/indented code blocks (<pre>) are dropped entirely rather than
// indexed — a code sample's raw syntax is mostly punctuation and
// variable names that would swamp ordinary prose matches without adding
// much a reader could usefully search for; the prose around a code
// block almost always already explains what it does in words. Inline
// code (`onEdit`, `A1:A20`) is kept — those read as real vocabulary in
// this content, not noise. This is the simplest defensible V1 choice,
// not a tokenizer-level decision; revisit only if a real case shows
// prose matches getting buried by code content.
function htmlToSearchText(html: string): string {
  const withoutCodeBlocks = html.replace(/<pre[\s\S]*?<\/pre>/g, ' ');
  const withoutTags = withoutCodeBlocks.replace(/<[^>]+>/g, ' ');
  return withoutTags
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export const GET: APIRoute = async () => {
  const entries = await getCollection('library', ({ data }) => !data.draft);
  const processor = await createMarkdownProcessor({ remarkPlugins: [remarkWikilinks] });

  const index = await Promise.all(
    entries.map(async (entry) => {
      const slug = entry.id.split('/').pop();
      const category = getCategory(entry.data.category);
      // Same remarkWikilinks pass the real page uses: [[slug]] becomes
      // the target's title, [[slug|text]] becomes the display text —
      // exactly what should be searchable, not literal bracket syntax.
      const { code: html } = await processor.render(entry.body ?? '');

      return {
        title: entry.data.title,
        description: entry.data.description,
        body: htmlToSearchText(html),
        category: category?.label ?? entry.data.category,
        tags: entry.data.tags,
        type: entry.data.type,
        url: `/${entry.data.category}/${slug}/`,
      };
    })
  );

  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json' },
  });
};
