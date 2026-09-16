// Shared matching/ranking/snippet logic for DotStack search — used by
// /search today and, later, the Cmd/Ctrl+K quick-search modal (Phase 2B),
// so both read the exact same index and rank results identically. Pure,
// browser-safe JS: no DOM, no fetch — callers own the index and the UI.
//
// V1 is deliberately substring-based (docs/architecture.md §7): no
// tokenizer, no stemming, no fuzzy matching. Substring matching needs no
// word boundaries, which is what makes it work identically for Thai
// (no spaces between words) and English without any language-specific
// handling — not a compromise, the actually-correct approach at this
// content scale.

// Field priority for scoring, strongest first. A query term's
// contribution to a document's score is the weight of the STRONGEST
// field it appears in — see scoreDocument() below for the exact rule.
const FIELD_WEIGHTS = [
  ['title', 10],
  ['tags', 6],
  ['category', 4],
  ['description', 3],
  ['body', 1],
];

const SNIPPET_WINDOW = 70; // characters of context on each side of a match

function normalizeQuery(query) {
  return (query ?? '').trim().replace(/\s+/g, ' ');
}

// Multiple whitespace-separated terms, each matched independently and
// required to ALL appear somewhere in the document (logical AND) —
// terms don't need to be adjacent, and matching never assumes English-
// style word boundaries (plain substring, works the same for Thai).
export function queryTerms(query) {
  return normalizeQuery(query).toLowerCase().split(' ').filter(Boolean);
}

function fieldText(doc, field) {
  if (field === 'tags') return (doc.tags ?? []).join(' ');
  return doc[field] ?? '';
}

// Scoring rule: for each query term, find the strongest field (by the
// fixed priority above) it appears in as a case-insensitive substring;
// that field's weight is the term's contribution. A document's score is
// the sum of every term's best-field weight. If any term matches
// nowhere in the document, the document doesn't match at all (AND
// semantics) and this returns null. Deliberately simple — no TF-IDF, no
// length normalization — so a score can be reconstructed by hand from
// the FIELD_WEIGHTS list above.
export function scoreDocument(doc, terms) {
  if (terms.length === 0) return null;
  let score = 0;
  const matchedFields = new Set();

  for (const term of terms) {
    let matched = false;
    for (const [field, weight] of FIELD_WEIGHTS) {
      if (fieldText(doc, field).toLowerCase().includes(term)) {
        score += weight;
        matchedFields.add(field);
        matched = true;
        break; // strongest field only, per the rule above
      }
    }
    if (!matched) return null;
  }

  return { score, matchedFields };
}

// Runs a query against every document in the index, returns matches
// sorted strongest-first. Empty/whitespace-only query returns [].
export function search(index, query) {
  const terms = queryTerms(query);
  if (terms.length === 0) return [];

  const results = [];
  for (const doc of index) {
    const match = scoreDocument(doc, terms);
    if (!match) continue;
    results.push({ doc, score: match.score, matchedFields: match.matchedFields });
  }

  results.sort((a, b) => b.score - a.score);
  return results;
}

// Leftmost occurrence of any query term in `text`, with a fixed
// character window of context around it — character-based rather than
// word-based specifically so it stays safe for Thai, which has no word
// boundaries to break a window on.
function findSnippetWindow(text, terms) {
  const lower = text.toLowerCase();
  let bestIndex = -1;
  let bestLength = 0;
  for (const term of terms) {
    const i = lower.indexOf(term);
    if (i !== -1 && (bestIndex === -1 || i < bestIndex)) {
      bestIndex = i;
      bestLength = term.length;
    }
  }
  if (bestIndex === -1) return null;

  const start = Math.max(0, bestIndex - SNIPPET_WINDOW);
  const end = Math.min(text.length, bestIndex + bestLength + SNIPPET_WINDOW);
  return { text: text.slice(start, end), prefixEllipsis: start > 0, suffixEllipsis: end < text.length };
}

// Splits `text` into {text, highlight} segments covering every
// query-term occurrence. Callers build DOM nodes from this directly
// (a text node per segment, a <mark> for highlight:true) — this module
// never constructs an HTML string, so there's no injection surface
// regardless of what the query or the indexed content contains.
export function highlightSegments(text, terms) {
  if (!text || terms.length === 0) return [{ text, highlight: false }];
  const lower = text.toLowerCase();
  const ranges = [];
  for (const term of terms) {
    if (!term) continue;
    let from = 0;
    let i;
    while ((i = lower.indexOf(term, from)) !== -1) {
      ranges.push([i, i + term.length]);
      from = i + term.length;
    }
  }
  if (ranges.length === 0) return [{ text, highlight: false }];

  ranges.sort((a, b) => a[0] - b[0]);
  const merged = [ranges[0]];
  for (const [start, end] of ranges.slice(1)) {
    const last = merged[merged.length - 1];
    if (start <= last[1]) last[1] = Math.max(last[1], end);
    else merged.push([start, end]);
  }

  const segments = [];
  let cursor = 0;
  for (const [start, end] of merged) {
    if (start > cursor) segments.push({ text: text.slice(cursor, start), highlight: false });
    segments.push({ text: text.slice(start, end), highlight: true });
    cursor = end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), highlight: false });
  return segments;
}

// Picks what to show as a result's context line: a highlighted body
// snippet when the body itself is where a useful match is, otherwise
// the plain description (if any) as orienting context — not
// highlighted, since the query terms aren't necessarily present there
// when the actual match was in title/tags/category. Returns null if
// neither is available.
export function getResultContext(doc, terms, matchedFields) {
  if (matchedFields.has('body')) {
    const window = findSnippetWindow(doc.body, terms);
    if (window) {
      return {
        segments: highlightSegments(window.text, terms),
        prefixEllipsis: window.prefixEllipsis,
        suffixEllipsis: window.suffixEllipsis,
      };
    }
  }
  if (doc.description) {
    return { segments: [{ text: doc.description, highlight: false }], prefixEllipsis: false, suffixEllipsis: false };
  }
  return null;
}
