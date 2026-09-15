import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

// Builds the [[wikilink]] graph by reading every content file directly off
// disk with plain fs + gray-matter, independently of Astro's content
// collections (which are async and validate schema, not link graphs).
// Cheap to redo per build at this library's scale (ADR 0003: ~10 pieces/month).

const CONTENT_DIR = path.resolve('src/content/library');

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { recursive: true })
    .filter((f) => typeof f === 'string' && f.endsWith('.md'))
    .map((f) => path.join(dir, f));
}

// Thai has no spaces between words, so a whitespace word-count badly
// undercounts Thai-heavy pieces. Counting non-whitespace characters and
// dividing by a combined-script reading rate is rougher but stays sane
// for both scripts without pulling in a real segmenter.
const CHARS_PER_MINUTE = 500;

function estimateReadingMinutes(content) {
  const chars = content.replace(/\s+/g, '').length;
  return Math.max(1, Math.round(chars / CHARS_PER_MINUTE));
}

function buildIndex() {
  const files = walk(CONTENT_DIR);
  const bySlug = new Map();
  const rawBySlug = new Map();
  const readingMinutesBySlug = new Map();

  for (const file of files) {
    const source = fs.readFileSync(file, 'utf-8');
    const { data, content } = matter(source);
    const slug = path.basename(file, '.md');
    bySlug.set(slug, {
      slug,
      category: data.category,
      title: data.title,
      type: data.type,
      url: `/${data.category}/${slug}/`,
    });
    rawBySlug.set(slug, content);
    readingMinutesBySlug.set(slug, estimateReadingMinutes(content));
  }

  const backlinks = new Map();
  const linkPattern = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;

  for (const [slug, content] of rawBySlug) {
    const sourceMeta = bySlug.get(slug);
    const seen = new Set();
    let match;
    linkPattern.lastIndex = 0;
    while ((match = linkPattern.exec(content))) {
      const targetSlug = match[1].trim();
      if (targetSlug === slug || seen.has(targetSlug)) continue;
      seen.add(targetSlug);
      if (!bySlug.has(targetSlug)) continue;
      const list = backlinks.get(targetSlug) ?? [];
      list.push(sourceMeta);
      backlinks.set(targetSlug, list);
    }
  }

  return { bySlug, backlinks, readingMinutesBySlug };
}

let cached = null;

// Content changes between dev-server file edits, so never cache in dev —
// only memoize for the lifetime of a single `astro build` process.
function getGraph() {
  if (!cached || process.env.NODE_ENV !== 'production') {
    cached = buildIndex();
  }
  return cached;
}

export function resolveLink(targetSlug) {
  return getGraph().bySlug.get(targetSlug.trim());
}

export function getBacklinks(slug) {
  return getGraph().backlinks.get(slug) ?? [];
}

export function getReadingMinutes(slug) {
  return getGraph().readingMinutesBySlug.get(slug) ?? 1;
}
