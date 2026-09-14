---
title: "Apps Script Trigger สามแบบที่ต้องรู้ก่อนเขียนระบบอัตโนมัติ"
type: note
category: spreadsheet-automation
tags: [google-sheets, apps-script]
updated: 2026-09-14
---

Google Apps Script มี trigger สามแบบหลักที่ใช้เริ่มการทำงานอัตโนมัติ: simple trigger
(เช่น `onEdit`), installable trigger (ตั้งเวลาหรือผูกกับ event ที่ต้อง authorize),
และ time-driven trigger (รันตามตารางเวลา)

ตัวที่มักสับสนที่สุดคือ simple trigger `onEdit` ที่รันได้ไม่ครบสิทธิ์ (no authorization)
ทำให้เรียก service บางตัวไม่ได้ ถ้าต้องการสิทธิ์เต็มต้องสร้าง installable trigger แทน
