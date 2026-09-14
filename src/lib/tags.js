// Groups content collection entries by tag. Shared by /tags/ and
// /tags/[tag]/ so both pages agree on what a tag "contains".
export function groupByTag(entries) {
  const byTag = new Map();
  for (const entry of entries) {
    for (const tag of entry.data.tags) {
      const list = byTag.get(tag) ?? [];
      list.push(entry);
      byTag.set(tag, list);
    }
  }
  return byTag;
}
