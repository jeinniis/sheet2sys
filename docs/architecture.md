# DotStack Technical Architecture

Companion to [design-system.md](./design-system.md). This is architecture
only — no page rebuilds, no visual changes, no new routes beyond what's
already shipped. Where the existing codebase already got something right,
this document says KEEP and explains why, rather than replacing working
code for novelty.

## Status

All ten numbered decisions plus the routing decision below are
**approved**. §6 (Diagram) is the one exception — **on hold**, pending a
separate resolution of the authoring-source question; see that section.

**Phase 1 (foundation) is implemented**: content schema (§2/§4),
`content-graph.js` fixes (§5), wikilink production-build validation
(§10), the two approved design-system token changes.

**Phase 2A (search index + `/search`) is implemented**: `src/lib/search.js`
(matching/ranking/snippet/highlight, shared client-side logic),
`search-index.json.ts` (extraction), and the `/search` page rewrite — see
§7 for the as-built details, which supersede that section's earlier
candidate design in a few small ways (noted inline).

**Not yet implemented**: the diagram pipeline (on hold), the
`Cmd/Ctrl+K` quick-search modal (Phase 2B — must reuse `src/lib/search.js`
as-is), and any page/component redesign beyond the approved tokens and
the `/search` page itself.

---

## 1. Current architecture audit

**Framework**: Astro 7.3.2, static output (`output: 'static'`, the
default — confirmed by the build log, no adapter installed). Node ≥22.12
pinned in `package.json`. — **KEEP**

**Directory structure**: standard Astro layout
(`src/{pages,layouts,components,lib,content,styles}`), plus a `docs/`
tree carrying ADRs, a domain glossary (`CONTEXT.md`), and content-authoring
notes. This is already the "boring, obvious" shape the brief asks for.
— **KEEP**

**Routes** (all static, via file-based routing + `getStaticPaths` where
needed):

| Route | File | Status |
|---|---|---|
| `/` | `src/pages/index.astro` | KEEP |
| `/notes` | `src/pages/notes/index.astro` | KEEP |
| `/cases` | `src/pages/cases/index.astro` | KEEP |
| `/categories` | `src/pages/categories/index.astro` | KEEP |
| `/{category}/` | `src/pages/[category]/index.astro` | KEEP — category detail; see §8 |
| `/{category}/{slug}/` | `src/pages/[category]/[slug].astro` | KEEP — Note/Case detail; see §8 |
| `/tags` | `src/pages/tags/index.astro` | KEEP |
| `/tags/{tag}/` | `src/pages/tags/[tag]/index.astro` | KEEP |
| `/search` | `src/pages/search/index.astro` | MODIFY — see §7 |
| `/about` | `src/pages/about/index.astro` | MODIFY — placeholder bio text, content not architecture |
| `/search-index.json` | `src/pages/search-index.json.ts` | MODIFY — see §7 |

**Layouts**: `BaseLayout.astro` (shell: head, nav, footer) and
`EntryLayout.astro` (Note/Case detail chrome: breadcrumb, title, meta,
prose slot, tags, backlinks). Both are clean, single-purpose, no unused
flexibility. — **KEEP**, EntryLayout needs the Case-marker change from
the design system (§6 there) and a Diagram-aware prose treatment (§6
here), both additive.

**Components**: `ArticleItem`, `PageHeader`, `SearchField`,
`SectionHeader`, `Breadcrumbs`, `CategoryIcon` — six small,
single-purpose components, already following "rows not cards." No
componentization gap for what's built so far. — **KEEP**

**Content system**: Astro Content Collections, one collection
(`library`) via the `glob` loader over `src/content/library/**/*.md`,
Zod schema in `content.config.ts`. — **KEEP**, schema needs the changes
in §2.

**Global styles**: single `src/styles/global.css`, custom-property token
system already matching most of `design-system.md`. Two token values need
updating per Jane's approvals (`--content-width` 672px→760px, the
`.badge-accent` Case marker) — pure CSS, not covered further here since
it's a design-system change, not an architecture one.

**Markdown config**: `@astrojs/markdown-remark`'s `unified()` processor
with one custom remark plugin (`remarkWikilinks`). No MDX installed —
content is plain Markdown, deliberately (adding MDX would let Jane embed
components in content, which isn't needed for anything in this spec and
would be a real complexity jump — see §11). — **KEEP** the plain-MD
choice; **MODIFY** the plugin chain to add the diagram plugin (§6).

**Build-time scripts**: none as separate scripts — all build-time logic
currently lives inside `src/lib/content-graph.js`, invoked lazily from
page components during Astro's normal build. No `scripts/` directory, no
`prebuild` hook. — **KEEP this shape** (see §9 for why a separate
validation script is not recommended).

**Search**: `search-index.json.ts` emits `{title, url, category, tags}`
per entry; `/search` fetches it client-side and does a single
whole-query substring match against title/tag/category only. Works, but
doesn't yet cover description/body, doesn't distinguish Note/Case, and
doesn't highlight matched context. — **MODIFY**, see §7.

**Internal links**: `remark-wikilinks.js` + `content-graph.js` implement
`[[slug]]` / `[[slug|text]]`, resolved at build time, unresolved links
degrade to visible literal text rather than erroring. Well-designed for
what it does — but two real gaps found in this audit (§5): the slug
index isn't scoped to be collision-safe, and draft entries aren't
excluded from the resolvable graph. — **MODIFY**, not replace.

**Diagrams**: **MISSING entirely.** ADR 0004 already decided the
approach (SVG, committed as text, no client JS, no build-time render
step) but no directory, component, or plugin exists yet, and no content
file references one. §6 designs this fresh, consistent with the ADR.

**Deployment**: ADR 0006 commits to Cloudflare Pages. No adapter
installed (none needed for pure static output), no `wrangler.toml`, no
CI config (`.github/` doesn't exist). The implicit assumption is
Cloudflare Pages' git-integration auto-build (connect the repo in the
dashboard, it runs `npm run build` and publishes `dist/` on every push to
`main`) rather than a custom pipeline. That's the standard zero-config
path for a static Astro site and matches "boring" — nothing to add in
the repo itself. — **MISSING** only in the sense that the Cloudflare
Pages project hasn't been connected yet (a dashboard action, not a code
change); flagged again in §9.

---

## 2. Content architecture

**Decision: keep Astro Content Collections**, not a hand-rolled content
system. The brief's requirement list (title, slug, description, author,
category, tags, created, updated, draft, body) is exactly what a Zod
schema validates for free, with errors surfaced at build time before any
page renders — replacing this with custom parsing would mean
reimplementing validation Astro already gives KEEP. A database/CMS is
unnecessary: total content volume is in the dozens-to-low-hundreds of
files over years (ADR 0003's own ~10/month target), Jane is the only
author, and there is no requirement here (multi-user editing, workflow
state beyond draft/published, relational queries) that static files
can't satisfy.

### Revised schema

```
title:        string, required
description:  string, required           // change: was optional
type:         "note" | "case", required
category:     enum of the six slugs, required
tags:         string[], default []
created:      date, optional              // new — see decision below
updated:      date, required
draft:        boolean, default false
```

Fields the brief asks for that are **deliberately not frontmatter
fields**:

- **`slug`** — stays implicit (the filename, minus `.md`), as today.
  Making it an explicit frontmatter field would create a second source
  of truth that can silently disagree with the filename. The one thing
  that changes: slug uniqueness must now be enforced **globally**, not
  per-category (see §5) — the wikilink syntax has no category
  disambiguation, so two entries in different categories can't reuse the
  same slug even though their URLs wouldn't literally collide.
- **`author`** — stays out of frontmatter; every page renders a
  site-wide constant (`Jane`, from a new tiny `src/lib/site.js`) rather
  than a per-file value. DotStack has exactly one author by design
  (CONTEXT.md), so a per-file field is 100+ opportunities for a typo'd
  byline with zero benefit. If a second author is ever added, promoting
  this to a real field is a small, non-breaking follow-up (old files
  simply inherit the default). This is a judgment call, not a hard
  technical constraint — listed under **Decisions Jane needs to
  approve**.

`description` moves from optional to **required**: it's already used
pervasively (every list row, search results, the homepage) and both
existing sample entries already include one. Making it required just
turns a convention into a guarantee, at build time.

`created` is new and **optional**. It is not displayed anywhere by
default — ADR 0002 ("Updated, never Published") stays the reader-facing
rule. Its purpose is internal: real chronological ordering if ever needed
(an RSS feed, a "what did Jane write in her first six months" retrospective
Note) without reconstructing it lossily from git history later. Cheap to
add now, expensive to reconstruct later if skipped — also listed under
**Decisions Jane needs to approve**, since it does sit slightly against
the grain of ADR 0002's spirit even though it changes no UI.

`draft` behavior is unchanged: the private-branch workflow (ADR 0011)
is the real mechanism; `draft: true` in frontmatter remains the
belt-and-suspenders flag for content mid-edit on `main`. The one change
is that the *link graph* must now also respect it (§5) — today it
doesn't.

---

## 3. File organization

The existing convention is good and unchanged:

```
src/content/library/{category}/{slug}.md
```

`{category}` as a folder is organizational only (the real category comes
from frontmatter, per ADR 0010) — but keeping the folder aligned with the
frontmatter value is exactly the kind of thing that makes the repo
browsable by Jane without tooling, so it stays a documented convention
(already is, in `docs/content-authoring.md`).

New: diagrams get their own flat directory, siblings to `library/`:

```
src/content/diagrams/{diagram-slug}.svg
```

Flat rather than nested per-entry, because a diagram's identity is the
diagram, not the entry that happens to reference it first — nesting under
a Note's folder would force an awkward move if a diagram is later reused
by (or moved to) a different piece. See §6 for authoring syntax and
resolution.

Full recommended tree (existing files unmarked, new/changed marked):

```
src/
├── content/
│   ├── library/
│   │   └── {category}/{slug}.md          # Jane writes here
│   └── diagrams/                          # NEW — Jane drops .svg here
│       └── {diagram-slug}.svg
├── content.config.ts                      # MODIFY — schema (§2)
├── components/
│   ├── ArticleItem.astro
│   ├── Breadcrumbs.astro
│   ├── CategoryIcon.astro
│   ├── PageHeader.astro
│   ├── SearchField.astro
│   ├── SectionHeader.astro
│   └── SearchModal.astro                  # NEW, pending decision (§7)
├── layouts/
│   ├── BaseLayout.astro
│   └── EntryLayout.astro
├── lib/
│   ├── categories.js
│   ├── content-graph.js                   # MODIFY — draft filter, slug collisions, tag-casing warning (§5)
│   ├── diagrams.js                        # NEW — resolves diagram-slug → inlined SVG (§6)
│   ├── format.js
│   ├── remark-wikilinks.js                # MODIFY — throw on broken link in production build (§9/§10)
│   ├── remark-diagrams.js                 # NEW — resolves [[diagram:...]] at markdown-transform time (§6)
│   ├── search.js                          # NEW — shared match/snippet/highlight logic (§7)
│   ├── site.js                            # NEW — { author: 'Jane', ... } site-wide constant (§2)
│   └── tags.js
├── pages/
│   └── (unchanged — all routes already exist, see §8)
└── styles/
    └── global.css                         # MODIFY — design-system token updates only
```

Everything Jane touches day to day is two folders:
`src/content/library/` (write) and `src/content/diagrams/` (drop an
SVG). Everything else is "the system."

---

## 4. Content schemas

```ts
// content.config.ts
const library = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/library' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),                       // now required
    type: z.enum(['note', 'case']),
    category: z.enum(CATEGORY_SLUGS),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),           // already added
    created: z.coerce.date().optional(),             // new
    updated: z.coerce.date(),
    draft: z.boolean().default(false),
  }),
});
```

Note and Case intentionally **share one schema** (ADR 0003 already
settled this — the difference between them is structural, inside the
Markdown body, not a metadata difference). A Case's Problem / Constraints
/ What I Tried / etc. sections are Markdown `##` headings within the
body, not schema fields — enforcing them as required frontmatter would
force every Case into a rigid template even when "the underlying content
doesn't have it" (the brief's own instruction for the Case page).

---

## 5. Internal linking + Backlink pipeline

### Authoring syntax — keep exactly what exists

`[[slug]]` and `[[slug|display text]]`, resolved against the slug
(filename) of any entry in `src/content/library`. This already covers
Note→Note, Note→Case, Case→Note, Case→Case identically — the syntax
doesn't know or care about `type`, matching ADR 0010's stance that type
isn't a navigational dimension.

### Resolution process

1. At the start of a build, `content-graph.js` walks every `.md` file
   under `src/content/library` directly via `fs` (independent of Astro's
   async content-collection API — cheap at this scale, and lets the
   graph exist before any page component runs).
2. It builds one `Map<slug, {slug, category, title, type, url}>`
   (`bySlug`) and one `Map<targetSlug, sourceMeta[]>` (`backlinks`),
   scanning every file's raw body for `[[...]]` occurrences.
3. `remark-wikilinks.js` calls `resolveLink(slug)` per `[[...]]` found
   while Markdown is transformed to HTML, turning a match into a real
   `<a href>` or, if unresolved, leaving the literal `[[slug]]` text (in
   **dev** only, per §9's fail-vs-warn split — production build
   behavior changes, see §10).

### Two real gaps this audit found (both in `content-graph.js`)

1. **Draft entries aren't excluded from `bySlug`.** `buildIndex()` scans
   every `.md` file regardless of `data.draft`, but page generation
   *does* filter drafts (`getCollection('library', ({data}) => !data.draft)`).
   Net effect: a `[[link]]` to a draft entry currently resolves
   successfully to a URL that **no page exists for** — a real, silent
   dead link in production today. Fix: `buildIndex()` must skip
   `draft: true` files when populating `bySlug` (they can still be read
   for other purposes, just not be link *targets*).
2. **Slugs aren't collision-checked across categories.** `bySlug` is
   keyed by slug alone, globally, with no check for two different
   category folders producing the same key — Map insertion just
   silently lets the second file overwrite the first, silently
   corrupting both the link resolution and the backlink graph for
   whichever entry lost. Fix: `buildIndex()` throws (production) / warns
   loudly (dev) the moment it detects two files resolving to the same
   slug.

Both are cheap, contained fixes to one existing function — not a
redesign. **Implemented in Phase 1**, along with the two other
Phase-1-scoped fixes described in the foundation-implementation report:
duplicate source→target dedup (already existed, preserved) and a
tag spelling/casing consistency warning.

### Backlink pipeline

```
content (fs scan)
  → parse [[...]] per file, skip self-references and in-file duplicates
  → resolve each target against bySlug (draft-filtered, collision-checked)
  → accumulate backlinks: Map<targetSlug, sourceMeta[]>
  → EntryLayout reads getBacklinks(slug) when rendering that entry's page
  → rendered as the existing Backlinks section
```

- **When generated**: once per `astro build` process (memoized — see the
  existing `cached`/`NODE_ENV` guard, which already does the right
  thing: always fresh in dev, computed once in production build). Single
  source of truth: this in-memory graph, rebuilt from the filesystem
  every build — never persisted, never a database. Exactly what the
  brief asks for.
- **Duplicates**: a `seen` Set per source file already prevents the same
  source linking to the same target twice in one backlinks list — KEEP.
- **Draft effect**: with the fix above, a draft can still *link out* to
  public content (fine, normal authoring), but public content can no
  longer accidentally resolve a link *into* a draft, and drafts never
  appear as a backlink source on a public page (since draft pages don't
  get rendered/routed at all).
- **Slug changes**: renaming a file's slug immediately breaks every
  `[[old-slug]]` reference elsewhere — by design, this is the same
  tradeoff ADR 0002 already made about dates in URLs (stable identifiers
  matter more than cosmetic renames). The mechanism that catches this is
  the broken-link validation in §10, not silent degradation.
- **Nonexistent target**: unresolved `[[...]]` — see §10 for the
  dev-warn/production-fail behavior.

---

## 6. Diagram architecture — ON HOLD, not implemented

**This section is parked, not approved.** Everything below is the
candidate design that was on the table — kept here as a starting point,
not a decision — pending resolution of one open product question:

> The domain definition of Diagram calls it a visual explanation
> "created from code," stored as editable/searchable text. A raw,
> committed SVG satisfies "stored as text" technically, but an
> **exported** SVG (from Excalidraw, tldraw, draw.io) is not necessarily
> a *human-authorable* source in the sense the definition implies — it's
> a text file, but not one Jane would naturally hand-edit the way she'd
> edit a Mermaid/code-defined diagram.

Until that's resolved: **do not implement** `remark-diagrams.js`,
`lib/diagrams.js`, or any authoring syntax — none of it exists in the
codebase, and nothing below should be treated as final.

ADR 0004 already made one call that isn't in question (committed SVG
text, not client-rendered Mermaid, not a build-time headless-browser
render) — what's still open is specifically whether the *source of that
SVG* should be something Jane writes directly (closer to "created from
code") or something she exports from a drawing tool (closer to what's
sketched below). That's a separate question from ADR 0004's own choice
and needs its own resolution before implementation starts.

<details>
<summary>Candidate design (parked, not approved)</summary>

- **Source format**: raw SVG (it already *is* a text format — XML — so
  "text source" and "generated visual" are the same file; nothing is
  compiled). Authored by hand, or exported as SVG from whatever tool Jane
  draws in (Excalidraw, tldraw, draw.io all export clean SVG) and
  committed as-is.
- **Source location**: `src/content/diagrams/{diagram-slug}.svg` (§3).
- **Authoring syntax in Markdown**: reuse the existing `[[...]]` mental
  model rather than inventing a second one — a `diagram:` prefix
  disambiguates it from a content link:

  ```
  [[diagram:apps-script-trigger-flow|How the three trigger types relate]]
  ```

  The text after `|` becomes the figure's caption (optional — omit for
  no caption).
- **Build process**: a new remark plugin, `remark-diagrams.js`, sibling
  to `remark-wikilinks.js` and using the same `unist-util-visit` pattern
  already a dependency. On match, it reads the referenced `.svg` file
  via `fs` (through a small `lib/diagrams.js`, parallel to
  `content-graph.js`'s resolution helpers), and replaces the text node
  with an inline HTML node: the raw SVG wrapped in
  `<figure class="diagram-frame">...<figcaption>`. Inlining (not
  `<img src>`) is deliberate — it's what lets the design system's frame
  styling and `currentColor` theming apply to the diagram itself, and
  keeps the diagram's text (if any) selectable/searchable by the
  browser's own find-in-page, which an `<img>` wouldn't allow.
- **Markdown reference resolution**: same build pass as wikilinks,
  same fail/warn split (§10) — a `[[diagram:...]]` pointing at a file
  that does't exist, or a `.svg` file that fails to parse as valid XML,
  fails the production build. A diagram is load-bearing for a Case (the
  brief's own "primary proof of ability") — a silently-missing diagram
  is a worse failure mode than a silently-broken text link.
- **Accessibility / captions**: the optional `|caption` text becomes a
  real `<figcaption>`, not just decoration. Recommend (as authoring
  guidance in `docs/content-authoring.md`, not a build-time requirement)
  that every diagram SVG include a `<title>` element for screen readers —
  worth a build-time **warning** if absent, not a failure, since it's a
  quality nicety rather than a structural break.
- **Committed vs. generated**: 100% committed. Nothing about a diagram is
  generated during `astro build` — the build only reads and inlines
  already-final text. This is what keeps builds deterministic without
  adding a single new dependency (no Mermaid CLI, no headless browser,
  no image-processing library).

</details>

---

## 7. Search architecture — implemented (Phase 2A)

**As built** (this replaces the "what's missing" framing below, kept for
its reasoning): `search-index.json.ts` now emits `{title, description,
body, category, tags, type, url}` per entry, draft-excluded. Matching,
scoring, snippet, and highlight logic lives in `src/lib/search.js`,
consumed by `/search`'s client script — the same module the Phase 2B
modal must import rather than reimplement.

**Scoring, as implemented**: field priority `title(10) > tags(6) >
category(4) > description(3) > body(1)`; a document's score is the sum,
over every query term, of that term's single strongest matching field's
weight; any term matching nowhere disqualifies the document (AND
across terms). Documented in full in `search.js`'s own comments — that
file is the source of truth if this summary and the code ever disagree.

**Body extraction, as implemented**: the same `createMarkdownProcessor`
+ `remarkWikilinks` pipeline `astro.config.mjs` already uses, rendered
to HTML then reduced to plain text — fenced/indented code blocks
(`<pre>`) dropped entirely, every other tag unwrapped, a small fixed set
of entities decoded. `[[slug]]`/`[[slug|text]]` resolve to real
title/display text before extraction, same as the rendered page.

**Not built in Phase 2A**: the `Cmd/Ctrl+K` modal (Phase 2B).

### Background / original reasoning

`search-index.json.ts` used to emit only `{title, url, category, tags}`.
The brief required description, body, and a Note/Case distinction — all
three were gaps, not refinements, before this phase.

### Redesigned pipeline

```
content (getCollection, draft-excluded — already correct)
  → normalize each entry: strip Markdown to plain text (body),
    lowercase-cache nothing (done client-side, see below),
    carry {title, description, body, category, tags, type, url}
  → search-index.json.ts emits this as one static JSON array (unchanged
    delivery mechanism: fetched client-side, lazily, only on /search
    or when the Search modal opens)
  → src/lib/search.js: shared match + snippet-highlight logic, used
    identically by /search and the Search modal (no duplicated logic)
  → client renders results, distinguishing Note/Case (§6 of the design
    system), with the matched snippet highlighted
```

### Index generation

Body text is derived from the same Markdown source Astro already parses
— strip to plain text (remove Markdown syntax, resolve `[[...]]` to
their display text rather than raw brackets) at the same point
`search-index.json.ts` already runs. No second Markdown parser needed;
reuse `remark`'s existing AST-to-text pass.

### Index size

At ADR 0003's stated scale (~10 items/month), even at 500 entries with
full body text the index is roughly 1–2MB uncompressed, well under
300KB gzipped — trivial for a lazy client-side fetch. **Recommendation:
revisit this approach only if the index exceeds ~2MB gzipped or entry
count passes ~1000** — well beyond any realistic horizon for a
one-person library.

### Thai / English / mixed queries — the actual design problem

This is the one place a "just use a real search library" instinct
actively works *against* DotStack. Most JS search libraries (Lunr,
FlexSearch's default tokenizer, MiniSearch) tokenize by whitespace/word
boundary — which is meaningless for Thai, which has no spaces between
words. Using one of those off the shelf, unconfigured, would silently
under-match or mis-rank every Thai query.

The current approach — lowercase the query, `.includes()` substring
match against lowercased field text — sidesteps the tokenization problem
entirely, because substring matching doesn't need word boundaries to
begin with. It works identically well (or equally simply) for Thai and
English. **This is a case where the "boring" implementation is also the
functionally correct one for this content**, not just the simplest.

The one real gap: today's matcher treats the whole query as **one**
substring, so a two-word query (`"apps script"` typed as two words when
the content has them non-adjacent, or a mixed query like `"sheet
อัตโนมัติ"`) fails to match unless that exact phrase appears verbatim.
Fix: split the query on whitespace into terms, require **all** terms to
each appear somewhere in the concatenated searchable text (AND, not
phrase match) — each term still matched via plain substring, so Thai
terms and English terms are handled by the identical code path. This
lives in the new `src/lib/search.js`.

**Considered and rejected for V1**: Pagefind (the standard "boring"
choice for static-site search at a larger scale) — it adds a Rust/WASM
build step and its language-tokenization behavior for Thai isn't well
documented or obviously correct out of the box. At this content volume,
the hand-rolled index is simpler, fully transparent, and already correct
for Thai by construction. Named here as the natural next step if the
library ever outgrows substring search's lack of ranking/fuzziness.

### Highlighting matched context

`src/lib/search.js` also returns, per result, which field matched and a
short surrounding slice (character-window, not word-window — safe for
Thai since it doesn't depend on word boundaries) with the term wrapped
for the `--color-highlight-bg` token from the design system.

### Keyboard navigation / the modal question

The original brief and the approved design system both describe a
`Cmd/Ctrl+K` **Search modal**, distinct from the `/search` page. Building
that means one small script loaded globally (in `BaseLayout`, on every
page) to listen for the shortcut and mount a `<dialog>`-based modal — the
one place this architecture would add always-on JS to pages that are
otherwise fully static. Using the native `<dialog>` element gets
focus-trapping and `Escape`-to-close for free, no modal library needed.

This is a real scope/tradeoff decision, not a technical one — listed
under **Decisions Jane needs to approve**.

### Draft exclusion

Unchanged and already correct: `getCollection('library', ({data}) =>
!data.draft)` is the source for the index, same as every other public
listing.

---

## 8. Routing — canonical decision (approved, final)

`/{category}/{slug}/` is the one and only URL for a piece of content's
detail page; `/{category}/` is the one and only URL for a category's
detail page. `/notes` and `/cases` are discovery/filtering entry points —
listing views that filter by `type`, not a URL namespace for individual
content. There is no `/notes/[slug]`, `/cases/[slug]`, or
`/categories/[slug]` route, and none should be added — a piece or a
category has exactly one URL, full stop. This resolves the conflict
between the original sitemap sketch (which listed those as literal
routes) and ADR 0010: the sitemap's *intent* — "notes and cases are each
independently browsable, categories are each independently browsable" —
is fully satisfied by the listing pages already built; the literal
per-item paths were never a requirement on their own, only a means to
that end.

### Validated against the originally-sketched list

| Approved route | Reality | Verdict |
|---|---|---|
| `/` | exists | matches |
| `/notes` | exists (listing) | matches |
| `/notes/[slug]` | **does not exist as a literal path** — detail lives at `/{category}/{slug}/` | **intentional, not a gap** — ADR 0010 deliberately keeps `type` out of the URL. Adding a second, duplicate URL for the same content would fight that ADR and create a canonicalization problem (two URLs, one page) for no reader benefit — the brief's own instruction is "do not add routes unless technically required," and none of `/notes`, `/cases`, or search need the literal path to work |
| `/cases` | exists (listing) | matches |
| `/cases/[slug]` | same as above — detail is `/{category}/{slug}/` | same reasoning, not a gap |
| `/categories` | exists (listing) | matches |
| `/categories/[slug]` | **does not exist** — category detail already lives at `/{category}/` (ADR 0010 reuses the category slug directly as a top-level path) | same reasoning — `/categories/{slug}` would be a second URL for a page that already exists at `/{slug}/`; not adding it |
| `/tags/[slug]` | exists (`/tags/{tag}/`) | matches |
| `/search` | exists | matches |
| `/about` | exists | matches |

**Static path generation**: unchanged — `output: 'static'`,
`getStaticPaths()` per dynamic route, generated once at build time from
`getCollection()`. No server, no on-demand rendering, nothing to add
here; this is already the right shape for a Cloudflare-Pages-hosted,
one-person static library.

---

## 9. Build pipeline

Astro's own build already interleaves "validate," "render," and
"generate routes" into one pass rather than discrete sequential CLI
stages — the pipeline below describes what happens *within* one
`npm run build`, not a chain of separate scripts. Recommendation: **keep
it that way** — a separate `scripts/validate-content.mjs` run via a
`prebuild` hook would be a second moving part solving a problem the
existing single-command build can solve itself (see §11).

```
1. Jane writes/edits a .md file in src/content/library/{category}/,
   optionally referencing [[slug]] or [[diagram:slug]]
2. `npm run build` → Astro syncs content collections: every file's
   frontmatter is validated against the Zod schema (§4) — build fails
   immediately here on invalid category, missing required field, or
   wrong type. (Already true today — zero new work.)
3. content-graph.js does its one-time filesystem scan: builds the
   slug index (draft-filtered, collision-checked — §5) and the
   backlink map
4. Astro renders each page. For .md bodies, the remark chain runs:
   remark-wikilinks (resolves [[slug]], throws in production on an
   unresolved target — §10) then remark-diagrams (resolves
   [[diagram:slug]], throws in production on a missing/invalid file —
   §10)
5. EntryLayout pulls backlinks for the current slug from the graph
   built in step 3 and renders the Backlinks section
6. search-index.json.ts runs as a static route in this same pass,
   producing /search-index.json in the output
7. Astro finishes emitting static HTML/CSS/JS to dist/
8. Deploy: push to `main` → Cloudflare Pages' git integration (once
   connected in the dashboard — see §1) runs `npm run build` and
   publishes `dist/` automatically. No CI config needed in-repo for
   this; Cloudflare Pages' own build step *is* the CI for a project
   this size.
```

Two things worth naming explicitly:

- Steps 2 and 4 are both places the build can fail — schema violations
  are already fatal today (Astro does this natively); the new
  link/diagram validation in step 4 extends the *same* fail point rather
  than adding a new stage.
- Nothing here needs to know about "production vs. dev" except the
  throw/warn split in step 4 — everything else behaves identically in
  `astro dev` and `astro build`.

---

## 10. Validation / failure rules

| Condition | Dev (`astro dev`) | Production build (`astro build`) |
|---|---|---|
| Invalid `category` value | fails (Zod, already true) | fails |
| Missing required frontmatter field | fails (Zod, already true) | fails |
| Duplicate slug across any two entries | console warning, both files named | **fails**, both file paths named |
| Broken internal link (`[[slug]]` resolves to nothing) | visible literal `[[slug]]` text in the rendered page (today's behavior, kept for dev) | **fails**, file + line + the unresolved slug named |
| Link to a slug that exists but is a draft | same visible literal text in dev, with a distinct console warning naming it as a draft-link (so it doesn't read as a typo while Jane is actively writing) | **fails**, with a message distinguishing "this points to an unpublished draft" from a generic broken link |
| Missing `[[diagram:slug]]` target file | visible inline error marker in the page | **fails** |
| Invalid diagram SVG (fails to parse as XML) | visible inline error marker | **fails** |
| Diagram SVG has no `<title>` | console warning only | **warns only** — quality nicety, not structural |
| Duplicate tag spelling/casing (e.g. `Google-Sheets` vs. `google-sheets`) | console warning, both spellings + source files named | **warns only** — tags are deliberately open-ended (ADR 0003); a hard fail here would reintroduce the authoring friction ADR 0003 explicitly rejected |
| Draft content linking to public content | no check needed — always fine | always fine |

The guiding split: anything that would put a **structurally broken
page** in front of a reader (dead link, missing diagram, bad schema)
fails the production build outright. Anything that's a **quality signal
Jane should see but that doesn't break a page** (tag-casing drift,
missing SVG title) warns instead of blocking her from shipping. Dev
mode never hard-fails on content issues — Jane is mid-edit there, and a
visible-but-not-fatal marker is the right feedback loop while writing.

---

## 11. Dependencies required

| Addition | Problem it solves | Why native/Astro isn't enough | Maintenance cost |
|---|---|---|---|
| None (new code, zero new npm packages) | remark-diagrams.js, lib/diagrams.js, lib/search.js, lib/site.js are all plain JS using dependencies already installed (`unist-util-visit`, `gray-matter`, `fs`) | — | Same shape as the existing `remark-wikilinks.js`/`content-graph.js` — one person can read the whole thing in a sitting |

No new dependency is proposed anywhere in this architecture. Every
capability the brief asks for (diagrams, search, link validation) is
built by extending the same two small patterns already proven in this
codebase (a remark plugin + a filesystem-scanning lib module) rather
than reaching for a library. Two libraries were explicitly considered
and rejected, with reasons stated where relevant above:

- **Mermaid** (client or build-time) — rejected already, in ADR 0004;
  this architecture doesn't reopen it.
- **Pagefind** (or Lunr/FlexSearch/MiniSearch) for search — rejected for
  V1 in §7; substring matching is simpler *and* more correct for
  Thai/English mixed content at this scale, not just "good enough."

---

## 12. Implementation order

Ordered so every step leaves the site in a working, deployable state —
nothing here requires a big-bang cutover.

1. **Schema changes** (§2/§4): `description` required, add `created`
   (pending Jane's approval on both — see below). Update the two
   existing sample entries if `description` becomes required (already
   true for both, so this is a no-op check, not a rewrite).
2. **content-graph.js fixes** (§5): draft-exclusion in `bySlug`,
   slug-collision check, tag-casing warning. Small, isolated, testable
   against the existing 2-entry corpus immediately.
3. **Link validation** (§10): extend `remark-wikilinks.js` with the
   dev-warn/production-fail split.
4. **Diagram pipeline** (§6): `lib/diagrams.js`, `remark-diagrams.js`,
   register the plugin in `astro.config.mjs`, add the diagram frame
   markup/styles (design-system §5). Needs at least one real `.svg` to
   verify against — first Case that needs one is the natural forcing
   function.
5. **Search rewrite** (§7): extend `search-index.json.ts` with
   description/body/type, build `lib/search.js`, update `/search` to use
   it with snippet highlighting. Modal is a separate, later decision
   (see below) — the index/matching upgrade is useful regardless of
   whether a modal ships.
6. **`lib/site.js`** (§2): the author constant, wired into
   `EntryLayout`/`About` in place of any hardcoded "Jane" strings
   currently duplicated inline.
7. **Design-system token updates**: `--content-width`, Case marker
   styling — approved already, purely visual, no architectural
   dependency on anything above.
8. **Cloudflare Pages connection** (§1/§9): a dashboard action, not a
   code change — can happen any time before the first real deploy,
   independent of the rest of this order.

---

## Decisions — resolved

All five were resolved in one approval pass. Recorded here for history;
this replaces the "needs approval" framing above wherever it's referenced.

1. **`author` stays a hardcoded site-wide constant** (`src/lib/site.js`),
   not a frontmatter field. Approved. Implemented in Phase 1.

2. **`created` added as an optional, internal-only field**, not
   displayed by default — keeps ADR 0002's "Updated, never Published"
   reader-facing rule intact while making the data available if it's
   ever needed. Approved. Implemented in Phase 1.

3. **Both `/search` and the `Cmd/Ctrl+K` quick-search modal will be
   built**, sharing one search index and one matching module rather than
   duplicating logic — no "pick one" tradeoff, both ship. **Not yet
   implemented** — scoped to a later phase; see §7 for the design (index
   fields, Thai-safe substring matching, no new search dependency).

4. **Broken internal links and missing diagrams fail the production
   build.** Approved as stated. Link-validation half implemented in
   Phase 1 (`remark-wikilinks.js` now throws in production on an
   unresolved or Draft-target link, distinguishing the two in its
   message). The diagram half is moot for now since the diagram
   pipeline itself is on hold (§6) — the same throw/warn pattern will
   apply once that's unblocked.

5. **`description` is a required field.** Approved. Implemented in
   Phase 1 (`content.config.ts`).

Two more were resolved in the same pass, not originally listed as open
questions here but confirmed explicitly: **Content Collections + plain
Markdown stay** (no MDX, no CMS, no database — §2/§11 unchanged), and
**Draft content is excluded from every public surface** — routes, search
indexes, link targets, and backlink sources alike (§5, §7); this was
already the design intent, now stated as a hard requirement rather than
an inference. **Globally unique slugs are enforced** (§5) — implemented
in Phase 1 as a production-build failure, dev-time warning.
