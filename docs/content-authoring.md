# การเขียนของลงคลัง

## ที่อยู่ไฟล์

`src/content/library/{category}/{slug}.md` — โฟลเดอร์ category เป็น convention เพื่อความ
เป็นระเบียบเท่านั้น ตัว URL จริงมาจาก field `category` ใน frontmatter (ดู ADR 0010)

## Frontmatter

```yaml
---
title: "ชื่อของ"
description: "หนึ่งประโยคสรุปเนื้อหา" # optional — โชว์ในหน้าแรก, /tags/, /search/
type: note # หรือ case (ADR 0003)
category: spreadsheet-automation # หนึ่งใน 6 หมวดที่ src/lib/categories.js กำหนดไว้ (ADR 0008)
tags: [google-sheets, apps-script] # อิสระ ไม่จำกัด
updated: 2026-09-14 # แสดงเป็น "อัปเดตล่าสุด" ไม่ใช่วันเผยแพร่ (ADR 0002)
draft: false # optional, default false — ดู ADR 0011 ก่อนพึ่งพา flag นี้
---
```

`description` เป็น optional แต่ควรใส่ทุกครั้งถ้าเป็นไปได้ — หน้าแรกกับหน้า tag ใช้มันโชว์
ใต้ชื่อของแต่ละชิ้นเพื่อให้ผู้อ่านแยกของออกจากกันได้โดยไม่ต้องเปิดเข้าไปดู

## ลิงก์ข้ามของ ([[wikilink]])

เขียน `[[slug-ของอีกชิ้น]]` ในเนื้อหาเพื่อลิงก์ไปหาของอีกชิ้น โดย `slug` คือชื่อไฟล์ไม่รวม
`.md` ใส่ข้อความแสดงเองได้ด้วย `[[slug|ข้อความที่อยากให้แสดง]]`

ลิงก์ไปหา slug ที่ไม่มีจริงจะไม่ error ตอน build แต่จะเหลือเป็นข้อความ `[[...]]` เดิมในหน้าเว็บ
(เพื่อให้เห็นว่าพิมพ์ผิดหรือยังไม่ได้เขียนของนั้น) Backlink ที่ท้ายแต่ละหน้าคำนวณจากลิงก์พวกนี้
อัตโนมัติตอน build ไม่ต้องเขียนเอง (ADR 0005)

## Draft

ของที่ยังไม่พร้อมเผยแพร่ให้เขียนใน branch ที่ไม่ push ขึ้น `origin` (ADR 0011) อย่า commit
ลง `main` แล้ว push แม้จะตั้ง `draft: true` ไว้ก็ตาม
