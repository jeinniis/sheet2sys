// Shared across every page that lists entries (home, notes, tags, category)
// so "how we print a date" and "how we build an entry's URL" each have
// exactly one definition.

export function formatUpdated(date) {
  return new Intl.DateTimeFormat('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
}

export function entryUrl(entry) {
  const slug = entry.id.split('/').pop();
  return `/${entry.data.category}/${slug}/`;
}
