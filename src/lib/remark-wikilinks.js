import { visit } from 'unist-util-visit';
import { resolveLink } from './content-graph.js';

// Turns [[slug]] or [[slug|display text]] into a real link, per ADR 0005.
//
// Resolution failures (missing target, Draft target) are diagnosed and,
// in production, fail the build — but that validation happens eagerly in
// content-graph.js's `validateGraph()` (called from `getStaticPaths` in
// src/pages/[category]/[slug].astro), not here. astro:content's `render()`
// swallows exceptions thrown from inside a markdown transform (silently
// producing an empty page instead of failing the build) rather than
// propagating them — confirmed while building this, not documented
// behavior — so this plugin only ever needs to decide what to render,
// never whether to fail the build.
const WIKILINK = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

export function remarkWikilinks() {
  return (tree) => {
    visit(tree, 'text', (node, index, parent) => {
      if (!parent || index === null || index === undefined) return;
      WIKILINK.lastIndex = 0;
      if (!WIKILINK.test(node.value)) return;
      WIKILINK.lastIndex = 0;

      const parts = [];
      let lastIndex = 0;
      let match;
      while ((match = WIKILINK.exec(node.value))) {
        if (match.index > lastIndex) {
          parts.push({ type: 'text', value: node.value.slice(lastIndex, match.index) });
        }
        const [, rawTarget, displayText] = match;
        const targetSlug = rawTarget.trim();
        const target = resolveLink(targetSlug);

        if (target) {
          parts.push({
            type: 'link',
            url: target.url,
            children: [{ type: 'text', value: displayText ?? target.title }],
          });
        } else {
          // Left as visible literal text so a typo/unpublished-Draft
          // reference shows up on the page instead of vanishing. In
          // production this branch should be unreachable — validateGraph()
          // already failed the build if anything here doesn't resolve —
          // kept as a safe fallback rather than assuming that always holds.
          parts.push({ type: 'text', value: match[0] });
        }
        lastIndex = match.index + match[0].length;
      }
      if (lastIndex < node.value.length) {
        parts.push({ type: 'text', value: node.value.slice(lastIndex) });
      }

      parent.children.splice(index, 1, ...parts);
      return index + parts.length;
    });
  };
}
