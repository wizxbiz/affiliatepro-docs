# 📚 Injection Molding Learning System Guide
## ระบบเรียนรู้การฉีดพลาสติกแบบครบวงจร

**Version:** 1.0.0  
**Last Updated:** January 2025  
**Command:** `/เรียนรู้การฉีดพลาสติก` หรือ `/iml`

---

## 🎯 ภาพรวมระบบ

ระบบเรียนรู้การฉีดพลาสติกแบบ Progressive Learning ที่ผู้เรียนต้องเรียนตามลำดับ ไม่สามารถข้ามบทเรียนได้ เพื่อให้ได้รับความรู้อย่างเป็นระบบ

### ✨ คุณสมบัติหลัก

- 📖 **6 Levels** พร้อม **24 บทเรียน**
- 🔒 **Progressive Unlocking** - ต้องเรียนตามลำดับ
- 📝 **Quiz System** - ต้องผ่าน Quiz เพื่อปลดล็อค Level ถัดไป
- 🏆 **Badge System** - รับเหรียญตามความสำเร็จ
- 📊 **Progress Tracking** - บันทึกความก้าวหน้าอัตโนมัติ
- 🎨 **Flex Messages** - UI สวยงามบน LINE

---

## 📋 โครงสร้างหลักสูตร

### Level 0: 🌱 Introduction to Injection Molding (เริ่มต้น)
| บทเรียน | หัวข้อ | ข้อกำหนด |
|---------|--------|----------|
| L0_1 | พื้นฐานการฉีดพลาสติก | ไม่มี (เริ่มเลย) |
| L0_2 | ส่วนประกอบเครื่องฉีด | ผ่าน L0_1 |
| L0_3 | ประเภทพลาสติก | ผ่าน L0_2 |
| L0_4 | ความปลอดภัย | ผ่าน L0_3 |

**Quiz Q0:** ต้องได้ 70% ขึ้นไปเพื่อปลดล็อค Level 1

### Level 1: 🔧 Machine Operation (การใช้งานเครื่อง)
| บทเรียน | หัวข้อ | ข้อกำหนด |
|---------|--------|----------|
| L1_1 | การตั้งค่าเครื่องจักร | ผ่าน Quiz L0 |
| L1_2 | การปรับ Parameter | ผ่าน L1_1 |
| L1_3 | Clamping & Injection | ผ่าน L1_2 |
| L1_4 | การควบคุมอุณหภูมิ | ผ่าน L1_3 |

**Quiz Q1:** ต้องได้ 75% ขึ้นไปเพื่อปลดล็อค Level 2

### Level 2: 🧪 Material Knowledge (ความรู้วัสดุ)
| บทเรียน | หัวข้อ |
|---------|--------|
| L2_1 | คุณสมบัติ Thermoplastic |
| L2_2 | การเลือกวัสดุ |
| L2_3 | การอบแห้งวัสดุ |
| L2_4 | การผสมสี |

### Level 3: ⚙️ Injection Process (กระบวนการฉีด)
| บทเรียน | หัวข้อ |
|---------|--------|
| L3_1 | Injection Phase |
| L3_2 | Packing & Holding |
| L3_3 | Cooling Phase |
| L3_4 | Ejection Phase |

### Level 4: 🔍 Troubleshooting (แก้ปัญหา)
| บทเรียน | หัวข้อ |
|---------|--------|
| L4_1 | Short Shot & Flash |
| L4_2 | Sink Mark & Warpage |
| L4_3 | Burn Mark & Jetting |
| L4_4 | Weld Line & Flow Mark |

### Level 5: 🎓 Advanced Techniques (เทคนิคขั้นสูง)
| บทเรียน | หัวข้อ |
|---------|--------|
| L5_1 | Scientific Molding |
| L5_2 | Process Optimization |
| L5_3 | Quality Control |
| L5_4 | Industry 4.0 |

---

## 🎮 คำสั่งทั้งหมด

### คำสั่งหลัก
```
/เรียนรู้การฉีดพลาสติก    → เมนูหลัก
/iml                      → เมนูหลัก (ชื่อย่อ)
```

### คำสั่งเมนู
```
/iml หลักสูตร             → แสดงหลักสูตร 6 Levels
/iml curriculum           → แสดงหลักสูตร 6 Levels
/iml level 0              → รายละเอียด Level 0
/iml level 1              → รายละเอียด Level 1
...
/iml level 5              → รายละเอียด Level 5
```

### คำสั่งบทเรียน
```
/iml lesson L0_1          → เข้าเรียนบทเรียน L0_1
/iml lesson L1_2          → เข้าเรียนบทเรียน L1_2
/iml complete L0_1        → ยืนยันจบบทเรียน L0_1
```

### คำสั่ง Quiz
```
/iml startquiz Q0         → เริ่ม Quiz Level 0
/iml startquiz Q1         → เริ่ม Quiz Level 1
/iml answer Q0_0 A        → ตอบคำถามที่ 1 ข้อ A
/iml answer Q0_1 B        → ตอบคำถามที่ 2 ข้อ B
```

### คำสั่งดูความก้าวหน้า
```
/iml progress             → ดูความก้าวหน้า
/iml ความก้าวหน้า         → ดูความก้าวหน้า
/iml badges               → ดูเหรียญที่ได้รับ
/iml เหรียญ               → ดูเหรียญที่ได้รับ
```

### คำสั่งช่วยเหลือ
```
/iml help                 → วิธีใช้งาน
/iml วิธีใช้               → วิธีใช้งาน
```

---

## 🏆 ระบบเหรียญ (Badges)

| เหรียญ | ชื่อ | เงื่อนไข |
|--------|------|----------|
| 🌱 | First Step | เรียนบทแรกสำเร็จ |
| 📖 | Beginner | จบ Level 0 |
| 🔧 | Machine Operator | จบ Level 1 |
| 🧪 | Material Expert | จบ Level 2 |
| ⚙️ | Process Master | จบ Level 3 |
| 🔍 | Problem Solver | จบ Level 4 |
| 🎓 | Advanced Engineer | จบ Level 5 |
| ⭐ | Quiz Champion | ได้คะแนน Quiz 100% |
| 🔥 | Speed Learner | จบทั้งหมดใน 7 วัน |
| 👑 | Injection Master | จบทุกอย่าง + Quiz 100% |

---

## 🔐 ระบบ Progressive Unlocking

### กฎการปลดล็อค

1. **บทเรียนแรก (L0_1)** - เปิดให้ทุกคนเสมอ
2. **บทเรียนถัดไปใน Level เดียวกัน** - ต้องจบบทก่อนหน้า
3. **Level ถัดไป** - ต้องผ่าน Quiz ของ Level ปัจจุบัน

### ตัวอย่างการปลดล็อค

```
User A เพิ่งเริ่มเรียน:
✅ L0_1 - เปิดอยู่
🔒 L0_2 - ต้องจบ L0_1 ก่อน
🔒 L0_3 - ต้องจบ L0_2 ก่อน
🔒 L0_4 - ต้องจบ L0_3 ก่อน
🔒 Level 1 - ต้องผ่าน Quiz Q0 ก่อน

User B จบ L0 แล้ว:
✅ L0_1 - จบแล้ว
✅ L0_2 - จบแล้ว
✅ L0_3 - จบแล้ว
✅ L0_4 - จบแล้ว
✅ Quiz Q0 - ผ่าน 80%
✅ L1_1 - เปิดอยู่ (ปลดล็อคจาก Quiz)
🔒 L1_2 - ต้องจบ L1_1 ก่อน
```

---

## 📝 ระบบ Quiz

### เงื่อนไขการผ่าน

| Level | Quiz | คะแนนผ่าน | จำนวนข้อ |
|-------|------|----------|----------|
| 0 | Q0 | 70% (4/5 ข้อ) | 5 ข้อ |
| 1 | Q1 | 75% (4/5 ข้อ) | 5 ข้อ |
| 2 | Q2 | 75% | 5 ข้อ |
| 3 | Q3 | 80% | 5 ข้อ |
| 4 | Q4 | 80% | 5 ข้อ |
| 5 | Q5 | 85% (Final) | 5 ข้อ |

### การทำ Quiz

1. พิมพ์ `/iml startquiz Q0` เพื่อเริ่ม
2. ระบบแสดงคำถามทีละข้อ
3. กดปุ่ม A, B, C, หรือ D เพื่อตอบ
4. ตอบครบ 5 ข้อ → แสดงผลลัพธ์
5. ผ่าน → ปลดล็อค Level ถัดไป
6. ไม่ผ่าน → ทำใหม่ได้

---

## 🗂️ โครงสร้างไฟล์

```
functions/
├── injectionMoldingLearning.js  ← ระบบหลัก
│   ├── CURRICULUM               ← โครงสร้างหลักสูตร
│   ├── LEARNING_BADGES          ← เหรียญรางวัล
│   ├── LESSON_CONTENT           ← เนื้อหาบทเรียน
│   ├── QUIZ_DATABASE            ← คำถาม Quiz
│   ├── Progress Functions       ← จัดการความก้าวหน้า
│   ├── Flex Creators            ← สร้าง Flex Messages
│   └── Command Handler          ← จัดการคำสั่ง
└── index.js                     ← Import และเรียกใช้
```

---

## 🚀 การ Deploy

### 1. ตรวจสอบโค้ด
```bash
cd functions
npm run lint
```

### 2. Deploy
```bash
firebase deploy --only functions
```

### 3. ทดสอบ
- พิมพ์ `/เรียนรู้การฉีดพลาสติก` ใน LINE
- ควรเห็นเมนูหลักแบบ Flex Message

---

## 📊 โครงสร้างข้อมูลผู้เรียน (Firestore)

```javascript
// Collection: learningProgress
// Document: {userId}
{
  currentLevel: 0,
  completedLessons: ["L0_1", "L0_2"],
  quizScores: {
    "Q0": 80,
    "Q1": null
  },
  badges: ["first_step", "beginner"],
  totalXP: 250,
  streakDays: 3,
  lastAccessDate: "2025-01-17",
  startedAt: "2025-01-15T10:30:00Z",
  lastUpdated: "2025-01-17T14:20:00Z"
}
```

---

## 🔧 การปรับแต่ง

### เพิ่มบทเรียนใหม่

```javascript
// ใน LESSON_CONTENT object
'L2_1': {
  title: '🧪 คุณสมบัติ Thermoplastic',
  sections: [
    {
      title: '📚 บทนำ',
      content: 'เนื้อหาบทเรียน...'
    },
    // เพิ่ม sections ตามต้องการ
  ],
  keyPoints: [
    '✅ Point 1',
    '✅ Point 2'
  ],
  nextLesson: 'L2_2'
}
```

### เพิ่ม Quiz ใหม่

```javascript
// ใน QUIZ_DATABASE object
'Q2': {
  levelId: 2,
  title: 'แบบทดสอบความรู้วัสดุ',
  passingScore: 75,
  questions: [
    {
      id: 'Q2_0',
      question: 'คำถาม?',
      options: {
        A: 'ตัวเลือก A',
        B: 'ตัวเลือก B',
        C: 'ตัวเลือก C',
        D: 'ตัวเลือก D'
      },
      correctAnswer: 'A',
      explanation: 'คำอธิบาย'
    }
    // เพิ่มคำถามอื่นๆ
  ]
}
```

---

## 📱 ตัวอย่าง UI

### เมนูหลัก
```
┌─────────────────────────────────────┐
│  🏭 INJECTION MOLDING LEARNING      │
│  ระบบเรียนรู้การฉีดพลาสติก              │
├─────────────────────────────────────┤
│  📊 ความก้าวหน้า: 8%                  │
│  ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│                                     │
│  🎯 Level: 0 - เริ่มต้น               │
│  📚 บทเรียน: 2/24                    │
│  🏆 เหรียญ: 1                        │
├─────────────────────────────────────┤
│ [📖 หลักสูตร] [📊 ความก้าวหน้า]        │
│ [🏆 เหรียญ]   [❓ วิธีใช้]            │
└─────────────────────────────────────┘
```

### บทเรียน
```
┌─────────────────────────────────────┐
│  📖 L0_1: พื้นฐานการฉีดพลาสติก        │
├─────────────────────────────────────┤
│  📚 บทนำ                            │
│  การฉีดพลาสติก (Injection Molding)   │
│  เป็นกระบวนการขึ้นรูปพลาสติก...        │
│                                     │
│  ⭐ Key Points:                     │
│  ✅ Point 1                         │
│  ✅ Point 2                         │
├─────────────────────────────────────┤
│ [✅ เรียนจบ → บทถัดไป]               │
└─────────────────────────────────────┘
```

---

## 🐛 การแก้ปัญหา

### ปัญหา: ไม่เห็นเมนู Flex
- ตรวจสอบว่า LINE OA ได้รับ Message API access
- ตรวจสอบ Webhook URL ถูกต้อง

### ปัญหา: ข้อมูลไม่บันทึก
- ตรวจสอบ Firestore Rules อนุญาต write
- ตรวจสอบ userId ถูกต้อง

### ปัญหา: Quiz ไม่ทำงาน
- ตรวจสอบ quizSession ใน Firestore
- ตรวจสอบ format คำสั่ง `/iml answer Q0_0 A`

---

## 📞 Support

หากพบปัญหาหรือต้องการความช่วยเหลือ:
- 💬 พิมพ์ `/iml help` ใน LINE
- 📝 ดู Logs: Firebase Console → Functions → Logs

---

**Happy Learning! 🎓🏭**
