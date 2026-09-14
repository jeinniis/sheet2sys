import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getCategory } from '../lib/categories.js';

// Static search index, built once at build time and fetched client-side by
// /search — keeps every other page JS-free (ADR 0004/0005) while still
// giving readers a way to find things as the library grows past what a
// 6-item nav can carry.
export const GET: APIRoute = async () => {
  const entries = await getCollection('library', ({ data }) => !data.draft);

  const index = entries.map((entry) => {
    const slug = entry.id.split('/').pop();
    const category = getCategory(entry.data.category);
    return {
      title: entry.data.title,
      url: `/${entry.data.category}/${slug}/`,
      category: category?.label ?? entry.data.category,
      tags: entry.data.tags,
    };
  });

  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json' },
  });
};
