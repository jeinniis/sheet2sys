# ใช้ Astro เป็น static site framework

เว็บนี้ build ด้วย Astro เพราะ zero-JS by default (island architecture: component ที่ต้องการ
JavaScript จริงๆ ค่อยเลือกโหลดเป็นจุดๆ) ซึ่งตรงกับข้อกำหนดเรื่องความเร็วที่ ADR 0004 และ ADR 0005
วางไว้อยู่แล้ว — ผู้อ่านไม่โหลด JS โดยไม่จำเป็นแม้แต่ตัวเดียว Astro ยังมี content collections
ที่ validate frontmatter ตอน build ทำให้ของที่ frontmatter ผิด schema จะ build ไม่ผ่านแทนที่จะ
หลุดขึ้นเว็บแบบเงียบๆ

ทางเลือกที่ปฏิเสธ: 11ty ให้ผลลัพธ์ zero-JS เหมือนกัน แต่ต้องเขียน templating เองทั้งหมด
(Nunjucks/Liquid) และไม่มี schema validation ในตัว ส่วน custom build script ควบคุมได้ทุกอย่างจริง
แต่ต้องเขียน routing, pagination, RSS เองทั้งหมด ซึ่งเป็นของที่พังได้เพิ่มขึ้นโดยไม่จำเป็น
ในเมื่อ Astro ให้มาแล้วฟรีโดยไม่แลกกับ JS ฝั่งผู้อ่าน

## Consequences

- Content collections กำหนด schema ของ frontmatter แต่ละ type (Note, Case) ไว้ในโค้ด
  ทำให้ ADR 0011 (frontmatter schema) ผูกกับไฟล์ config ของ Astro โดยตรง
- Deploy ไป Cloudflare Pages (ADR 0006) ทำได้ตรงๆ เพราะ Astro มี adapter ให้
