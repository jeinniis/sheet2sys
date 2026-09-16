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
    // each one. Required per docs/architecture.md §2 — it's used pervasively
    // enough that a guarantee beats a convention.
    description: z.string(),
    type: z.enum(['note', 'case']),
    category: z.enum(CATEGORY_SLUGS),
    tags: z.array(z.string()).default([]),
    // Manual curation for the homepage "แนะนำให้อ่าน" (Featured Knowledge)
    // rail — an editorial pick, not derived from views/recency. Optional so
    // the homepage still has something to show before any piece is flagged
    // (falls back to most-recently-updated).
    featured: z.boolean().default(false),
    // Internal only, never rendered by default — ADR 0002 keeps "Updated,
    // never Published" as the reader-facing rule. Exists so a true
    // chronological order is available later (RSS, a retrospective Note)
    // without reconstructing it lossily from git history.
    created: z.coerce.date().optional(),
    // "Updated", never "Published" — ADR 0002.
    updated: z.coerce.date(),
    // Belt-and-suspenders per ADR 0011: the real draft boundary is the
    // unpushed branch, this flag only guards against `main` having a piece
    // mid-edit.
    draft: z.boolean().default(false),
  }),
});

export const collections = { library };
