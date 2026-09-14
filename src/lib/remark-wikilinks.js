import { visit } from 'unist-util-visit';
import { resolveLink } from './content-graph.js';

// Turns [[slug]] or [[slug|display text]] into a real link, per ADR 0005.
// A link to a slug that doesn't exist is left as literal text (not swallowed)
// so a typo shows up as broken text in the rendered page instead of vanishing.
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
        const [, targetSlug, displayText] = match;
        const target = resolveLink(targetSlug);
        if (target) {
          parts.push({
            type: 'link',
            url: target.url,
            children: [{ type: 'text', value: displayText ?? target.title }],
          });
        } else {
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
