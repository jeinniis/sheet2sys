// The six categories are fixed by ADR 0008 — do not add a seventh without
// a new ADR superseding it.
export const CATEGORIES = [
  {
    slug: 'spreadsheet-automation',
    label: 'Spreadsheet & Automation',
    description: 'ทำให้งานที่ทำซ้ำทุกวันเดินได้เอง โดยเริ่มจากเครื่องมือที่มีอยู่แล้ว',
  },
  {
    slug: 'data-database',
    label: 'Data & Database',
    description: 'การจัดโครงสร้างข้อมูลให้ไม่พังเมื่อข้อมูลโตขึ้น',
  },
  {
    slug: 'coding-fundamentals',
    label: 'Coding Fundamentals',
    description: 'พื้นฐานที่เข้าใจครั้งเดียวแล้วใช้ได้กับงานอื่นตลอดไป',
  },
  {
    slug: 'building-apps',
    label: 'Building Apps',
    description: 'การประกอบระบบที่มีคนใช้งานจริงขึ้นมาทั้งตัว',
  },
  {
    slug: 'working-with-ai',
    label: 'Working with AI',
    description: 'การใช้ AI เป็นเครื่องมือสร้างของ',
  },
  {
    slug: 'thinker',
    label: 'Thinker',
    description: 'วิธีคิดและวิธีมองปัญหา รวมถึงการค้นพบว่าข้อจำกัดที่เคยเชื่อนั้นไม่มีอยู่จริง',
  },
];

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug);

export function getCategory(slug) {
  return CATEGORIES.find((c) => c.slug === slug);
}
