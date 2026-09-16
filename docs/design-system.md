# DotStack Design System

A specification, not implementation. It formalizes and extends the token
system already sketched in `src/styles/global.css`, closing the gaps the
brief calls for (monospace pairing, full component behavior, content-state
distinction, responsive rules, accessibility) before any further page work.
Where the current CSS already made a decision that fits, this spec keeps it
and explains why, rather than replacing it for novelty.

Priority order for every decision below, in case two of these pull in
different directions:

1. Reading
2. Finding knowledge
3. Following connections
4. Understanding Jane's thinking
5. Seeing evidence from real systems

---

## 0. Direction, restated as constraints

"Documentation × Digital Garden × Developer Notes" — quiet, thoughtful,
technical, personal, credible, curious.

Concretely, that rules out:

- Cards as the default container. The canonical list unit in DotStack is a
  **row** (full-width, hairline bottom border, no fill, no shadow), not a
  bordered/shadowed box. Cards are reserved for exactly one case below
  (§5, Callout) — everything else is rows, text, or plain grids of rows.
- Any gradient used decoratively. Gradients don't appear anywhere in this
  system, including hover states.
- Blur/glassmorphism. Overlays (Search modal) use a flat scrim, not a
  blurred one.
- Border-radius as a personality trait. Radius is small and functional
  (inputs, badges, code blocks) — never a large "friendly SaaS" radius on
  a whole section or page.
- Motion that decorates rather than orients. Every transition in §7 exists
  to show *where something moved to or came from* (hover→link, panel
  open/close), never as an entrance effect on scroll or load.

---

## 1. Typography

### Families

| Role | Family | Why |
|---|---|---|
| Primary (body + headings) | **Noto Sans Thai** (400/600/700), already loaded | One family for Thai and Latin keeps the page visually calm — no seam where a Thai sentence switches font mid-line for an English tool name ("Apps Script", "API"). Noto's cross-script metrics are designed to align x-height and baseline across Thai/Latin, which a generic Thai webfont paired with a separate Latin font usually doesn't get right. |
| Monospace (code, metadata, technical labels) | **JetBrains Mono** (400/500) | Reads as "developer notes" without irony — it's the typeface of the tools Jane is actually writing about (Apps Script, SQL, JS). Tabular figures keep numbers in metadata rows (dates, counts) aligned. Alternative: IBM Plex Mono, if a quieter/more geometric mono is preferred later — swap is a one-line font-family change, doesn't touch the type scale. |

Do not add a third family (a separate "display" font for H1). One page
title style, defined once, is part of what keeps this from reading as a
template.

### Scale

Builds directly on the tokens already in `global.css` — this table is the
spec for what's there plus the one addition (H4) the brief asks for.

| Token | Size | Line-height | Weight | Used for |
|---|---|---|---|---|
| `--text-3xl` | 40px (2.5rem) | 1.25 | 700 | H1 — page title, one per page |
| `--text-2xl` | 28px (1.75rem) | 1.3 | 700 | *(reserved — not currently assigned; see note)* |
| `--text-xl` | 22px (1.375rem) | 1.3 | 700 | H2 — major section headings within a Note/Case |
| `--text-title` | 20px (1.25rem) | 1.35 | 600 | List-item titles (Note/Case rows), H3 |
| `--text-lg` | 18px (1.125rem) | 1.5 | 600 | H4, leads/description lines under a title |
| `--text-article` | 17px (1.0625rem) | 1.7 | 400 | Long-form article body copy |
| `--text-base` | 16px (1rem) | 1.7 | 400 | Default body (non-article UI text) |
| `--text-sm` | 15px (0.9375rem) | 1.5 | 400/600 | Nav links, tags, small labels |
| `--text-xs` | 13px (0.8125rem) | 1.5 | 400 | Metadata (dates, reading time, breadcrumbs) |

Note on H2/H3/H4 vs. the token names: the token scale is size-based, the
heading levels below map onto it semantically rather than 1:1 by number —
this keeps `--text-title` reusable for both "H3" and "a list-item title"
without two near-duplicate tokens.

- **H1** — `--text-3xl` / 700 / 1.25. One per page, always.
- **H2** — `--text-xl` / 700 / 1.3.
- **H3** — `--text-title` / 600 / 1.35.
- **H4** — `--text-lg` / 600 / 1.5. New: not yet styled in `global.css`.
  Used sparingly, for a sub-point inside a long Case section (e.g. a named
  step under "What I Tried"). If a Note needs H4 regularly, that's a
  signal the Note should probably split into two.
- **Body (article)** — `--text-article` / 400 / 1.7.
- **Body (UI)** — `--text-base` / 400 / 1.7.
- **Small** — `--text-sm`.
- **Metadata** — `--text-xs`, monospace, `--color-text-muted`.

### Line-height rationale (Thai readability)

1.7 for body is deliberately generous. Thai script stacks tone marks and
vowels above/below the consonant line with no inter-word spacing — tight
line-height (1.4–1.5, fine for Latin) causes ascenders/descenders from
adjacent lines to visually collide in Thai. 1.7 is the floor for
comfortable long-form Thai reading; headings can stay tighter (1.25–1.35)
because they're short enough that stacking collisions are rare.

### Weights

Exactly three, matching the two webfont weights already loaded plus
regular: **400** (body), **600** (UI emphasis — nav, tags, metadata labels,
H3/H4), **700** (H1/H2, brand wordmark). No 300 or 500 — a fourth weight
adds a webfont file for a distinction readers won't consciously register.

---

## 2. Color system

DotStack ships as **one fixed dark identity**, not a light/dark toggle.
This is a decision already made and implemented (`color-scheme: dark` is
hardcoded) — this spec formalizes it rather than reopening it. Rationale
worth keeping on record: a toggle is a SaaS-app affordance ("customize
your experience") that works against "quiet" and adds a second visual
system to keep consistent for a one-person, content-first site. Dark also
suits the "developer notes" register — closer to a terminal/editor than a
marketing page.

### Semantic tokens

| Token | Value | Role |
|---|---|---|
| `--color-bg` | `#191b1c` (Graphite) | Page background |
| `--color-surface` | `#212325` | Raised-but-not-a-card surfaces: hover fill on rows, the Search modal panel, code block background base |
| `--color-code-bg` | `#1d1f21` | Code block / inline-code background — distinct from `--color-surface` so code reads as a distinct material inside prose, not just "a hover state that happened to be sitting still" |
| `--color-border` | `#2b2e30` | Hairline dividers — row separators, table borders, input borders |
| `--color-border-strong` | `#3c3f42` | Emphasis borders — focused input outline fallback, ToC active-item rule, Callout left-rule |
| `--color-text` | `#fafaf7` (White) | Primary text, headings |
| `--color-text-secondary` | `#b5b8ba` | Descriptions, ledes, hero copy — content the reader needs, not decoration |
| `--color-text-muted` | `#8c9196` (Gray) | Metadata: dates, counts, breadcrumbs |
| `--color-text-faint` | `#6b6f73` | Disabled-adjacent, arrow glyphs, the least important text on a row |
| `--color-link` | `#6f87ff` | Inline/nav link text — lightened tint of brand Blue; brand Blue itself is ~3.5:1 on Graphite (fails AA for text), this tint is ~4.7:1 |
| `--color-link-strong` | `#4263eb` (Blue) | Non-text interactive accents where the tint isn't needed: active nav underline, focus ring on larger controls, ToC active marker |
| `--color-accent` | `#ffd43b` (Yellow) | Identity & the one interaction-state exception: focus rings (see §7). Otherwise reserved for brand moments (logo mark, the one "featured" numeral on the homepage) — never a UI action color |
| `--color-on-accent` | `#191b1c` | Text/icon color on top of a Yellow fill |
| `--color-selection-bg` | `#4263eb` at 35% opacity over `--color-bg` (`rgba(66,99,235,.35)`) | Text selection background |
| `--color-highlight-bg` | `#ffd43b` at 30% opacity (`rgba(255,212,59,.3)`) | Search result matched-term highlight (`<mark>` in snippets) |

Standing rule from the current CSS, carried forward: **Yellow = identity/
attention, Blue = interaction. Never both heavily in the same component.**
A Case badge, a tag pill, and a nav link are never yellow *and* blue at
once — pick the one that matches what the element is doing.

### Contrast check (WCAG AA, on `--color-bg` #191b1c)

| Pair | Ratio | Passes |
|---|---|---|
| `--color-text` on bg | 15.8:1 | AAA |
| `--color-text-secondary` on bg | 8.9:1 | AAA |
| `--color-text-muted` on bg | 5.1:1 | AA (body), fails AA-large only if used below 14px bold — keep metadata ≥13px regular, which passes |
| `--color-link` on bg | 4.7:1 | AA |
| `--color-accent` (Yellow) on bg, large text only | 11.9:1 | AAA |
| `--color-on-accent` on Yellow fill | 11.9:1 | AAA |

`--color-text-faint` (#6b6f73, ~3.3:1) is sub-AA by design and must never
carry text meaning alone — it's for decorative glyphs (arrows) that have a
text equivalent alongside them.

If light mode is ever revisited, that's a new decision (and arguably a new
ADR), not a mechanical token flip — Graphite-dark was chosen for identity
reasons in ADR-adjacent history, not just contrast math, so this spec
doesn't pre-define light-mode token values.

---

## 3. Spacing system

The existing 4px-base scale already covers this well; this section maps
each step to the specific uses the brief asks for.

| Token | Value | Use |
|---|---|---|
| `--space-1` | 4px | Icon-to-label gaps, tight inline spacing |
| `--space-2` | 8px | Tag/badge internal padding, metadata item gaps |
| `--space-3` | 12px | Paragraph-adjacent spacing inside a component (e.g. below a heading before body starts), heading bottom margin |
| `--space-4` | 16px | Paragraph bottom margin, list-item internal padding (vertical), page-edge gutter on mobile |
| `--space-5` | 24px | List-row padding, gap between a title and its metadata line |
| `--space-6` | 32px | Page-edge gutter on tablet/desktop, gap between grouped list items and the next heading |
| `--space-7` | 48px | Gap between distinct content sections *within* a page (e.g. Note body → Backlinks) |
| `--space-8` | 64px | Bottom padding of the page (`.wrap`) |
| `--space-9` | 80px | Gap between top-level page sections (homepage rails, Case section-to-section) |
| `--space-10` | 96px | Reserved for the single largest gap on the page — above the hero on the homepage only |

Navigation: header height is not on this scale (fixed at 64px, see §5) but
internal nav-link gaps use `--space-6` (32px) between items — enough to
read as separate destinations without the header feeling like a toolbar.

---

## 4. Layout

| Property | Value | Notes |
|---|---|---|
| Max page width | 1100px (`--page-width`, existing `68.75rem`) | Every page — including the header — shares this one width, so nothing shifts horizontally when navigating between page types |
| **Reading column width** | **760px** (`--content-width`, revise from current `42rem`/672px to `47.5rem`/760px) | The brief specifies 720–800px twice; 760px is the midpoint. This is a token change from what's currently in `global.css` (672px) — flag as a follow-up when implementation resumes, not a re-litigation of the layout approach itself (nested `.content-narrow` inside `.wrap`, which stays) |
| Desktop gutter | 32px (`--space-6`) each side, inside `.wrap` | |
| Tablet gutter | 32px (`--space-6`) | Same as desktop down to the point secondary nav collapses (see §8) |
| Mobile gutter | 16px (`--space-4`) | |
| Table of Contents width | 220px, fixed, right rail | Only rendered ≥1280px (see breakpoints) — below that, ToC is not a layout column at all (see §8) |
| Gap: reading column ↔ ToC | 48px (`--space-7`) | |

### Breakpoints

| Name | Range | Behavior |
|---|---|---|
| Mobile | < 640px | Single column, compact header, filters collapse to a control (§8) |
| Tablet | 640–1023px | Reading width preserved, secondary nav reduced, no ToC rail |
| Desktop | 1024–1279px | Full nav, no ToC rail (page isn't wide enough to fit reading column + ToC without cramping either) |
| Wide desktop | ≥ 1280px | ToC rail appears beside the reading column, for pages long enough to have one |

---

## 5. Core components

General rule across all of these: **rows and rules, not cards.** A
component gets a background fill only when it's genuinely a distinct
surface floating over content (Search modal, a Callout) — everything that
is "an item in a list" is a row with a bottom hairline border.

**Header** — 64px fixed height, `--color-bg` background (no fill
distinction from page — it's not a "floating toolbar"), single
`--color-border` hairline at the bottom. Does not elevate/shadow on
scroll; it's part of the page, not an overlay.

**Navigation** — wordmark ("DotStack") left, links right:
Notes / Cases / Categories / Search. Text links, `--text-sm`/600, spaced
by `--space-6`. Active route gets `--color-link-strong` underline (2px,
offset 4px) — not a filled pill, not a background tint. No hover-lift, no
icon-plus-label — text only.

**Search input** — single-line, `--color-surface` fill, 1px
`--color-border`, `--radius-sm` (6px). Leading search-glyph icon in
`--color-text-faint`. On focus: border becomes `--color-link-strong`,
2px `--color-accent` focus ring per the standing focus rule (§7). Trailing
`⌘K` hint in a `.kbd`-styled tag (monospace, `--text-xs`, faint border) —
hidden once the input has focus or content.

**Search modal** — opens on `Cmd/Ctrl+K`. Centered overlay, max-width
560px, `--color-surface` panel, 1px `--color-border`, `--radius-md`
(10px), **no blur** on the backdrop — flat scrim at `rgba(0,0,0,.5)`.
Results list below the input, same row treatment as any other list (hairline
dividers, no per-result card). Each result shows a small type marker
(Note/Case, see §6), title, and the matched snippet with the query term
wrapped in `--color-highlight-bg`. Closes on `Escape`, backdrop click, or
selecting a result.

**Category list item** — a row: icon (22px, `--color-text-secondary`,
inline SVG per the existing `CategoryIcon` approach) + label + one-line
description + a trailing count (`N notes · N cases`, `--text-xs` mono,
`--color-text-muted`) + trailing arrow. No per-category color — the six
categories are distinguished by icon and label only, never by a color
key (a color-per-category system would compete with the Note/Case state
color in §6 and the brand's two-accent rule).

**Note list item** — row: eyebrow line (`Category · Updated`, `--text-xs`
mono, muted) above title (`--text-title`/600), optional one-line
description below (`--text-sm`, secondary), optional tag chips at the
bottom of the row. No badge — Note is the unmarked default state (§6).

**Case list item** — identical row structure to Note, with one addition:
a small text-only `Case` marker before or beside the eyebrow line (§6).
Never a filled/colored badge — same visual weight as the category label
next to it, just distinguishable on close reading.

**Tag** — small pill: `--text-xs` monospace, `--color-text-muted`,
1px `--color-border`, `--radius-sm`, `--space-1 --space-2` padding. On
hover: border → `--color-border-strong`, text → `--color-text`. Never
filled with a background color — a page with a dozen tags should not read
as a dozen colored chips.

**Breadcrumb** — `--text-xs`, muted, `/` or `→` separator (reuse whichever
the codebase already picked for arrows elsewhere — consistency over a new
glyph). Current page segment is `--color-text`, non-interactive; ancestor
segments are `--color-link`.

**Metadata** (author, category, updated date, reading time, tags — the
block under a Note/Case title) — single row (wraps on mobile) of
`--text-xs` monospace items separated by `·`, all `--color-text-muted`
except tags which behave per the Tag spec above.

**Table of Contents** — right rail, ≥1280px only. Plain list, no border/
box. Entries at `--text-sm`, `--color-text-secondary`; the entry matching
current scroll position gets `--color-link-strong` text and a 2px left
rule in the same color, offset 12px from the text — not a filled
background highlight.

**Callout** — the one place a filled/bordered container is appropriate,
because a callout must visually interrupt the reading flow on purpose (an
aside, a warning, a "this failed" marker). Left border only (3px,
`--color-border-strong` default, or `--color-accent`/`--color-link-strong`
for an emphasized variant), `--color-surface` fill, `--radius-sm` on the
right corners only (flush left edge against the border). No icon by
default — an icon is optional and only for a small closed set of callout
kinds (note/warning), never decorative.

**Diagram container** — the diagram (an SVG, per the existing
committed-SVG approach) sits in a plain frame: 1px `--color-border`,
`--radius-sm`, `--color-code-bg` background (diagrams read as "generated
artifact," same material family as code), generous internal padding
(`--space-6`) so the diagram isn't flush against its own frame. Optional
caption below in `--text-xs` muted. No card shadow, no drop-shadow on the
SVG itself.

**Code block** — `--color-code-bg` background, 1px `--color-border`,
`--radius-sm`, monospace `--text-sm`, line-height 1.6. Optional language
label top-right corner (`--text-xs`, faint, mono). No line-number gutter
by default (adds visual noise for the short snippets this content mostly
uses) — acceptable to add for a specific long Case listing if needed.

**Inline code** — monospace, `--text-[current context size]` (inherits),
`--color-code-bg` background, `--space-1` horizontal padding,
`--radius-sm` at a smaller radius (4px) than block code, no border (the
background fill alone is enough distinction at inline scale).

**Backlink item** — identical row treatment to Note/Case list item, under
a small section label ("Backlinks" — plain `--text-sm`/600 label, not
styled as an H2, since it's structural furniture rather than authored
content). If the linking piece is a Case, it carries the same Case marker
as anywhere else it's listed.

**Internal link** (wikilink-resolved, in-body) — visually identical to
any other link (`--color-link`, underline on hover only, not
permanently underlined mid-paragraph — permanent underlines on every
internal link would make dense Note bodies visually noisy). What
distinguishes an internal link from an external one is a small trailing
mark: internal links get none (they're the norm inside a knowledge base);
external links get a small ↗ glyph, `--color-text-faint`, so readers know
before clicking that they're leaving DotStack.

**Footer** — plain text row, `--text-xs`, muted, `--color-border`
hairline top rule matching the header's bottom rule. Copyright + About
link only. No sitemap-style multi-column footer — that's the SaaS-footer
pattern this brief explicitly avoids.

---

## 6. Content states (Note / Case / Category / Tag)

The distinction must be **recognizable on a second look, not shouted on
the first.**

- **Note** — the unmarked default. No badge, no color. If nothing else
  marks a row, it's a Note.
- **Case** — a small text marker, not a badge-as-decoration: the word
  "Case", `--text-xs`, monospace, `--color-text-muted`, uppercase,
  letter-spaced — sitting inline with the eyebrow metadata line rather
  than as a separate colored chip floating above the title. It reads the
  same weight as "reading time" or "category" would. This is the one
  deliberate change from the badge already in the codebase
  (`.badge-accent`, filled yellow) — a filled accent badge on every Case
  row is exactly the "large colorful badge" the brief says to avoid, and
  it also collides with Yellow being reserved for identity/attention, not
  a per-item label. Flag as a component revision when implementation
  resumes.
- **Category** — never a color. Icon + label, used consistently
  everywhere a Category appears (list row, page header, breadcrumb
  segment). The icon is the recognition anchor, not a color key.
- **Tag** — the bordered pill from §5, always. A Tag never borrows the
  Case marker's typography (no uppercase/letter-spacing) — the two must
  stay visually distinct from each other since a tag *value* could
  theoretically collide with a category word.

No two of these states ever use the same visual device (color fill vs.
text marker vs. icon vs. bordered pill) — that's what keeps four states
distinguishable without a color-coding system.

---

## 7. Interaction

- **Hover** — on rows/links: text color shift only (`--color-text-secondary`
  → `--color-text`, or link → `--color-link-strong`), 170ms ease
  (`--transition`, already defined). Row background may lighten to
  `--color-surface` on list rows specifically (helps scanning a dense
  list) — never on inline text links, where a background hover would look
  like a highlighter. Arrow glyphs (list rows, category rows) may
  translate 4px on hover — the one motion effect on hover, already used
  in the current CSS.
- **Focus** — `2px solid --color-accent` outline, 2px offset, on every
  focusable element (the standing exception where Yellow marks an
  interactive state rather than identity — it's the *one* state that
  needs to be unmistakable regardless of what's under it). Never
  `outline: none` without a replacement.
- **Active/pressed** — no separate active style beyond what focus already
  provides for keyboard, and browser default (slight opacity/darken) for
  pointer — an explicit active style is unnecessary weight for a
  content site with almost no buttons.
- **Keyboard navigation** — logical tab order following visual order
  (header nav → page content → footer). `/` focuses the search input
  from anywhere *except* while focus is already inside a text input or
  the search modal itself (must check `document.activeElement` before
  capturing the key). `Cmd/Ctrl+K` opens the Search modal from anywhere,
  including inside other inputs. `Escape` closes the modal and returns
  focus to whatever opened it.
- **Internal links** — standard link behavior, no client-side
  interception/transition beyond Astro's default navigation — a
  full-navigation model matches "documentation," not an SPA-style
  page-transition effect that would need extra motion to justify itself.
- **Search** — typing in the modal filters results live (debounced
  ~120ms); arrow keys move selection through results, `Enter` opens the
  selected result. No loading spinner for the common case — the index is
  static and local, results should feel instant.
- **Table of Contents** — clicking an entry scrolls smoothly
  (`scroll-behavior: smooth`) to the heading; the active-entry indicator
  (§5) updates via scroll position, not click state alone, so it stays
  correct if the reader scrolls manually.
- **`prefers-reduced-motion`** — when set, disable the smooth-scroll
  behavior and the arrow-translate hover effect; color/opacity
  transitions may remain since they don't imply movement. Nothing in this
  system currently relies on motion to convey information that would be
  lost — reduced motion never hides content, only the easing.

---

## 8. Responsive rules

| Element | Desktop (≥1024) | Tablet (640–1023) | Mobile (<640) |
|---|---|---|---|
| Navigation | Full text links, all four items visible | Same four links, tighter gap (`--space-4` instead of `--space-6`) | Compact header: wordmark + a single menu control that reveals Notes/Cases/Categories/Search as a stacked list |
| Search | Inline input in header available on wide desktop only if the header has room; otherwise same as tablet | Search reachable via nav link + `Cmd/Ctrl+K` modal; no persistent inline input | Search modal only, opened via nav or `Cmd/Ctrl+K` — modal becomes full-screen (not a centered 560px panel) below 640px |
| Table of Contents | Rail beside content, ≥1280 only; 1024–1279 has no ToC (see §4) | Not shown as a rail. Collapses into a small "On this page" disclosure at the top of the article, closed by default | Same disclosure pattern as tablet |
| Filters (Category page All/Notes/Cases) | Inline segmented control at the top of the list | Same inline control | Collapses into a single "Filter" button that opens a small inline panel with the same three options — never a permanent sidebar above the content, per the brief |
| Reading layout | `.content-narrow` (760px) centered inside the 1100px page | Same reading width, page gutter shrinks to tablet gutter | Reading column is fluid to viewport width minus mobile gutters (no fixed 760px, since 760px would force horizontal scroll region rather than shrink) |
| Case diagrams | Full diagram width, up to the reading column width (760px) | Same, diagram scales down proportionally | Diagram scales to fit the mobile content width; if a diagram has dense horizontal content (wide flow), the frame (§5) becomes horizontally scrollable rather than shrinking labels below legible size |

---

## 9. Accessibility

- **Contrast** — every text/background pairing in §2 meets WCAG AA at
  minimum (table included); most exceed it. `--color-text-faint` is the
  one sub-AA token and is restricted to decorative glyphs with a
  redundant text label alongside.
- **Keyboard focus** — every interactive element gets the visible
  `--color-accent` focus ring from §7; never removed without a
  replacement. Focus order matches visual/DOM order — no `tabindex`
  values above 0.
- **Semantic heading hierarchy** — one H1 per page. Note/Case bodies use
  H2/H3/H4 in document order with no skipped levels (an H4 never appears
  without an ancestor H3 on the same page). The ToC (§5) is generated
  from this same heading structure, not a separately maintained list —
  keeps the two from drifting apart.
- **Thai line-height** — 1.7 body line-height (§1) is itself an
  accessibility decision, not just an aesthetic one — it's the difference
  between comfortable and strained reading for Thai script specifically.
- **Minimum touch targets** — every tappable element (nav links, tag
  pills, list rows, ToC entries, the Filter button) has a minimum 44×44px
  hit area on mobile, even where the visible text/icon is smaller —
  achieved via padding, not by inflating the visible element.
- **Code readability** — code blocks and inline code use the monospace
  family at a size never below `--text-sm` (15px) even inside dense Case
  content, and rely on weight/color (not just size) to distinguish from
  surrounding prose so they remain legible at default zoom and under
  moderate browser zoom (up to 200%) without horizontal scroll on the
  page itself (the code block's own internal scroll is fine and expected
  for long lines).
- **Screen-reader labels** — icon-only controls (mobile menu toggle,
  Filter button, search icon inside the input) get an `aria-label`
  describing the action, not the icon ("Open menu", not "Hamburger").
  The Category icon next to a category name is `aria-hidden` (the text
  label already carries the meaning — the icon is decorative
  reinforcement, not additional information). The Case marker (§6) is
  real text, not a background image, so it's read naturally by a screen
  reader without extra markup. Backlinks section is a labeled `<nav>` or
  has a heading ("Backlinks") that's programmatically associated, so a
  screen-reader user can skip to or past it as a landmark.

---

## Summary of changes from the current implementation

Everything above is additive/formalizing except these two, which are
worth flagging explicitly since they'd change existing shipped CSS:

1. `--content-width` should move from 672px (`42rem`) to 760px
   (`47.5rem`) to land inside the brief's 720–800px target.
2. The Case badge should change from a filled `--color-accent` pill
   (`.badge-accent`) to a plain monospace text marker inline with
   metadata (§6) — the current version is closer to the "large colorful
   badge" pattern the brief asks to avoid than the rest of the site's
   otherwise-restrained component language.

Nothing else here contradicts what's already built; most of it names and
extends decisions the current CSS's own comments already reflect.
