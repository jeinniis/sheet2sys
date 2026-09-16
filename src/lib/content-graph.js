import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

// Builds the [[wikilink]] graph by reading every content file directly off
// disk with plain fs + gray-matter, independently of Astro's content
// collections (which are async and validate schema, not link graphs).
// Cheap to redo per build at this library's scale (ADR 0003: ~10 pieces/month).

const CONTENT_DIR = path.resolve('src/content/library');

// Same convention this module already used for its cache: `astro build`
// sets NODE_ENV=production, `astro dev` doesn't — so this is also the
// dev-warn/production-fail switch for every check below (see
// docs/architecture.md §10).
const isProd = () => process.env.NODE_ENV === 'production';

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { recursive: true })
    .filter((f) => typeof f === 'string' && f.endsWith('.md'))
    .map((f) => path.join(dir, f));
}

function relative(file) {
  return path.relative(process.cwd(), file);
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

function warnOrThrow(message) {
  if (isProd()) throw new Error(message);
  console.warn(`[content-graph] ${message}`);
}

function checkTagConsistency(files) {
  // Groups every tag spelling seen anywhere (draft or public — casing
  // drift is worth catching before a draft is even published) by its
  // lowercased form, then flags any lowercase group that contains more
  // than one distinct exact spelling. Deliberately simple: case-folding
  // only, no fuzzy/typo matching — tags stay an open vocabulary (ADR
  // 0003), this is a diagnostic, never a build failure.
  const byLowercase = new Map();
  for (const { file, tags } of files) {
    for (const tag of tags) {
      const key = tag.toLowerCase();
      if (!byLowercase.has(key)) byLowercase.set(key, new Map());
      const variants = byLowercase.get(key);
      if (!variants.has(tag)) variants.set(tag, []);
      variants.get(tag).push(relative(file));
    }
  }

  for (const variants of byLowercase.values()) {
    if (variants.size < 2) continue;
    const detail = [...variants.entries()]
      .map(([tag, sources]) => `"${tag}" (${sources.join(', ')})`)
      .join(' vs. ');
    console.warn(`[content-graph] Tag spelling/casing varies: ${detail}`);
  }
}

function buildIndex() {
  const files = walk(CONTENT_DIR);

  // Slugs must be globally unique (not just per-category) — the
  // [[slug]] syntax has no category to disambiguate with. Tracked across
  // every file, draft or public, since a filename collision is a
  // problem on disk regardless of publish state.
  const fileBySlug = new Map();
  const tagSources = [];

  const bySlug = new Map(); // resolvable link targets — public only
  const draftSlugs = new Set();
  const rawBySlug = new Map(); // public only — link-scanning source text
  const readingMinutesBySlug = new Map();

  for (const file of files) {
    const source = fs.readFileSync(file, 'utf-8');
    const { data, content } = matter(source);
    const slug = path.basename(file, '.md');

    const existing = fileBySlug.get(slug);
    if (existing) {
      warnOrThrow(
        `Duplicate slug "${slug}": ${relative(existing)} and ${relative(file)} both resolve to it. Slugs must be globally unique across all categories.`
      );
    } else {
      fileBySlug.set(slug, file);
    }

    tagSources.push({ file, tags: data.tags ?? [] });

    if (data.draft) {
      draftSlugs.add(slug);
      continue; // drafts are never link targets and never backlink sources
    }

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

  checkTagConsistency(tagSources);

  const backlinks = new Map();
  const linkPattern = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;

  for (const [slug, content] of rawBySlug) {
    const sourceMeta = bySlug.get(slug);
    const seenTargets = new Set();
    let match;
    linkPattern.lastIndex = 0;
    while ((match = linkPattern.exec(content))) {
      const targetSlug = match[1].trim();
      if (targetSlug === slug || seenTargets.has(targetSlug)) continue;
      seenTargets.add(targetSlug);

      if (!bySlug.has(targetSlug)) {
        // A slug that resolves to a Draft gets its own diagnostic —
        // that's normal mid-authoring state, not necessarily a typo —
        // while a slug that doesn't exist at all is generically broken.
        const reason = draftSlugs.has(targetSlug)
          ? `is a Draft and isn't published`
          : `doesn't exist`;
        warnOrThrow(`Broken internal link in ${relative(fileBySlug.get(slug))}: [[${targetSlug}]] ${reason}.`);
        continue;
      }

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
  if (!cached || !isProd()) {
    cached = buildIndex();
  }
  return cached;
}

// Forces the graph (and everything it validates — duplicate slugs,
// broken/Draft-target links, tag-casing drift) to build now, from
// whatever plain synchronous call site invokes it. Matters where it's
// called from: `astro:content`'s `render()` swallows exceptions thrown
// during markdown transform instead of failing the build (confirmed
// empirically while implementing this), so this must run from ordinary
// page/route frontmatter — see `getStaticPaths` in
// `src/pages/[category]/[slug].astro` — not from inside a remark plugin.
export function validateGraph() {
  getGraph();
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
