// The six categories are fixed by ADR 0008 — do not add a seventh without
// a new ADR superseding it.
//
// `icon` is the inner markup of a 24x24 stroke-based SVG (currentColor),
// rendered via `set:html` wherever a category icon appears. Kept as plain
// line-art rather than emoji so weight/style stays consistent across OSes
// and themes.
export const CATEGORIES = [
  {
    slug: 'spreadsheet-automation',
    label: 'Spreadsheet & Automation',
    description: 'ทำให้งานที่ทำซ้ำทุกวันเดินได้เอง โดยเริ่มจากเครื่องมือที่มีอยู่แล้ว',
    icon: '<rect x="3" y="3" width="18" height="18" rx="1.5"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/>',
  },
  {
    slug: 'data-database',
    label: 'Data & Database',
    description: 'การจัดโครงสร้างข้อมูลให้ไม่พังเมื่อข้อมูลโตขึ้น',
    icon: '<ellipse cx="12" cy="5.5" rx="8" ry="3"/><path d="M4 5.5v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/><path d="M4 11.5v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
  },
  {
    slug: 'coding-fundamentals',
    label: 'Coding Fundamentals',
    description: 'พื้นฐานที่เข้าใจครั้งเดียวแล้วใช้ได้กับงานอื่นตลอดไป',
    icon: '<polyline points="8.5 6 3 12 8.5 18"/><polyline points="15.5 6 21 12 15.5 18"/>',
  },
  {
    slug: 'building-apps',
    label: 'Building Apps',
    description: 'การประกอบระบบที่มีคนใช้งานจริงขึ้นมาทั้งตัว',
    icon: '<polygon points="12 3 3 8 12 13 21 8 12 3"/><polyline points="3 12.5 12 17.5 21 12.5"/><polyline points="3 17 12 22 21 17"/>',
  },
  {
    slug: 'working-with-ai',
    label: 'Working with AI',
    description: 'การใช้ AI เป็นเครื่องมือสร้างของ',
    icon: '<path d="M12 2.5 13.6 9.9 21 11.5 13.6 13.1 12 20.5 10.4 13.1 3 11.5 10.4 9.9Z" fill="currentColor" stroke="none"/>',
  },
  {
    slug: 'thinker',
    label: 'Thinker',
    description: 'วิธีคิดและวิธีมองปัญหา รวมถึงการค้นพบว่าข้อจำกัดที่เคยเชื่อนั้นไม่มีอยู่จริง',
    icon: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6.5 6.5 0 0 0-4 11.6c.7.6 1 1.4 1 2.4h6c0-1 .3-1.8 1-2.4A6.5 6.5 0 0 0 12 3Z"/>',
  },
];

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug);

export function getCategory(slug) {
  return CATEGORIES.find((c) => c.slug === slug);
}
