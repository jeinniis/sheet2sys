# Draft เก็บใน branch แยกที่ไม่ push ขึ้น public repo

หลังจากย้าย repo ของเว็บนี้ขึ้น GitHub แบบ public แล้ว (`jeinniis/sheet2sys`) ของที่ยังเป็น
Draft (ตามนิยามใน CONTEXT.md — ยังไม่เผยแพร่ อยู่เฉพาะเครื่อง Jane) จะเขียนอยู่ใน branch ที่ไม่ push
ขึ้น `origin` จนกว่าจะพร้อมเผยแพร่ แล้วค่อย merge เข้า `main`

เหตุผล: repo เป็น public แล้ว ใครก็ตามดู git history ได้ ถ้า commit draft ลง `main` (หรือ branch
ไหนก็ตามที่ push ขึ้น origin) แม้จะลบไฟล์ทิ้งภายหลัง เนื้อหาก็ยังอยู่ใน git history สาธารณะตลอดไป
ขัดกับนิยาม Draft ที่ต้อง "อยู่เฉพาะในเครื่องของ Jane และคนนอกมองไม่เห็น" โดยตรง

ทางเลือกที่ปฏิเสธ: ใส่ `draft: true` ใน frontmatter แล้วให้ build script กรองไม่ generate หน้านั้น
วิธีนี้ป้องกันไม่ให้ของขึ้นเว็บได้จริง แต่ตัวไฟล์ Markdown ยังอยู่ใน public git history ทันทีที่ push
ใครก็ยังอ่านเนื้อหา draft ได้ตรงๆ จาก GitHub ซึ่งไม่ต่างจากเผยแพร่แล้ว

## Consequences

- Jane ต้องเขียน draft ใน local branch (หรือ repo แยกที่ไม่มี remote) แล้ว merge/cherry-pick เข้า
  `main` เองตอนของพร้อมเผยแพร่ ไม่มีระบบอัตโนมัติช่วยตรงนี้
- `draft: true` ใน frontmatter ยังมีประโยชน์อยู่ในกรณีที่ของอยู่บน `main` แล้วแต่ยังไม่อยากให้ build
  generate หน้า (เช่นระหว่างแก้ไขใหญ่) แต่ไม่ใช่กลไกหลักสำหรับซ่อนของที่ยังไม่เผยแพร่เลย
