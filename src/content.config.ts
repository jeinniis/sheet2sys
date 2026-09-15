import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { CATEGORY_SLUGS } from './lib/categories.js';

// Schema for both content types from ADR 0003 (Note, Case). They share one
// collection because ADR 0010 keeps `type` out of the URL — a piece's type
// is metadata, not a routing dimension.
const library = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/library' }),
  schema: z.object({
    title: z.string(),
    // One line shown in list/search views (homepage "recently updated",
    // /tags/, /search) so readers can tell entries apart without opening
    // each one. Optional so existing pieces don't need a schema migration.
    description: z.string().optional(),
    type: z.enum(['note', 'case']),
    category: z.enum(CATEGORY_SLUGS),
    tags: z.array(z.string()).default([]),
    // Manual curation for the homepage "แนะนำให้อ่าน" (Featured Knowledge)
    // rail — an editorial pick, not derived from views/recency. Optional so
    // the homepage still has something to show before any piece is flagged
    // (falls back to most-recently-updated).
    featured: z.boolean().default(false),
    // "Updated", never "Published" — ADR 0002.
    updated: z.coerce.date(),
    // Belt-and-suspenders per ADR 0011: the real draft boundary is the
    // unpushed branch, this flag only guards against `main` having a piece
    // mid-edit.
    draft: z.boolean().default(false),
  }),
});

export const collections = { library };
