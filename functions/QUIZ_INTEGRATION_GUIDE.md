# 🎯 Enhanced Quiz System - Integration Guide

## 📚 ภาพรวมระบบ

ระบบแบบทดสอบที่พัฒนาขึ้นใหม่ประกอบด้วย 3 ส่วนหลัก:

1. **quizEnhancement.js** - ระบบ Core (Session, Scoring, Random, Dashboard)
2. **quizFlexMessages.js** - Flex Messages ที่ปรับปรุงแล้ว
3. **studentLearning.js** - ไฟล์เดิม (ใช้ต่อได้)

---

## 🚀 ฟีเจอร์ใหม่ทั้งหมด

### ✅ 1. ระบบตรวจคำตอบอัตโนมัติ
- ตรวจว่าถูก/ผิดทันที
- แสดงเฉลยและคำอธิบาย
- คำนวณคะแนนอัตโนมัติ

### ➡️ 2. คำถามถัดไปอัตโนมัติ
- ปุ่ม "➡️ ข้อถัดไป" หลังตอบแต่ละข้อ
- ไม่ต้องพิมพ์คำสั่งใหม่
- แสดง Progress Bar

### 🎲 3. การสุ่มคำถามที่ดีขึ้น
- สุ่มจากทุกบทเท่าๆ กัน (กรณี `/quiz all`)
- ไม่ซ้ำกับที่เคยทำล่าสุด
- ใช้ Fisher-Yates Algorithm

### 🏆 4. Gamification
- **Streak System**: ตอบถูกติดต่อกัน = คะแนนโบนัส
- **Combo Bonus**: Combo 3, 5, 10 ข้อ = โบนัสพิเศษ
- **Speed Bonus**: ตอบเร็ว = คะแนนเพิ่ม
- **Perfect Bonus**: ทำได้ 100% = +50 แต้ม

### 📊 5. Learning Dashboard
- สถิติการเรียนรู้ส่วนตัว
- คะแนนเฉลี่ย, จำนวนครั้งที่ทำ
- Streak สูงสุด, แบบทดสอบที่ทำได้เต็ม
- ประวัติ 10 ครั้งล่าสุด

### 💾 6. Session Management
- บันทึก Session ลง Firestore
- ติดตามสถานะ (active, completed, abandoned)
- เก็บประวัติการตอบทุกข้อ
- คำนวณเวลาที่ใช้

---

## 📁 โครงสร้างไฟล์

```
functions/
├── studentLearning.js          # ไฟล์เดิม (QUIZ_QUESTIONS, LESSONS)
├── quizEnhancement.js          # ระบบ Quiz ใหม่ ⭐ NEW
├── quizFlexMessages.js         # Flex Messages ใหม่ ⭐ NEW
└── QUIZ_INTEGRATION_GUIDE.md   # คู่มือนี้
```

---

## 🔧 การติดตั้งและใช้งาน

### Step 1: Import Modules

ในไฟล์ `index.js` หรือ `lineWebhook.js`:

```javascript
// Import ระบบเดิม
const studentLearning = require("./studentLearning");
const {QUIZ_QUESTIONS, LESSONS} = studentLearning;

// Import ระบบใหม่ ⭐
const quizEnhancement = require("./quizEnhancement");
const quizFlexMessages = require("./quizFlexMessages");

const {
  selectRandomQuestions,
  createQuizSession,
  getQuizSession,
  updateQuizSession,
  completeQuizSession,
  verifyAnswerAndCalculateScore,
  getUserLearningStats,
  createLearningDashboardFlex,
} = quizEnhancement;

const {
  createEnhancedQuizQuestionFlex,
  createEnhancedAnswerResultFlex,
  createEnhancedQuizSummaryFlex,
} = quizFlexMessages;
```

### Step 2: Handle `/quiz` Command

```javascript
// เริ่มแบบทดสอบใหม่
if (text.startsWith("/quiz")) {
  const args = text.split(" ");
  const lessonId = args[1] || "all"; // "lesson1", "lesson2", ..., "all"
  const questionCount = 10; // จำนวนข้อที่ต้องการ

  // สุ่มคำถาม
  const questionIds = selectRandomQuestions(lessonId, questionCount, [], QUIZ_QUESTIONS);

  // สร้าง Session
  const session = await createQuizSession(userId, lessonId, questionIds);

  // ดึงคำถามข้อแรก
  const firstQuestionId = questionIds[0];
  const firstQuestion = QUIZ_QUESTIONS[firstQuestionId];

  // สร้าง Flex Message
  const questionFlex = createEnhancedQuizQuestionFlex(firstQuestion, session);

  // ส่งให้ผู้ใช้
  await client.replyMessage(event.replyToken, questionFlex);
  return;
}
```

### Step 3: Handle `/answer` Command

```javascript
// ตอบคำถาม
if (text.startsWith("/answer")) {
  // Format: /answer {sessionId} {questionId} {userAnswer}
  const parts = text.split(" ");
  const sessionId = parts[1];
  const questionId = parts[2];
  const userAnswer = parts[3]; // A, B, C, D

  // ดึง Session
  const session = await getQuizSession(sessionId);
  if (!session) {
    await client.replyMessage(event.replyToken, {
      type: "text",
      text: "❌ Session หมดอายุแล้ว กรุณาเริ่มใหม่ด้วย /quiz",
    });
    return;
  }

  // ดึงคำถาม
  const question = QUIZ_QUESTIONS[questionId];

  // ตรวจคำตอบ + คำนวณคะแนน
  const verifyResult = verifyAnswerAndCalculateScore(
    questionId,
    userAnswer,
    session,
    null, // answerTime (optional)
    QUIZ_QUESTIONS
  );

  // บันทึกคำตอบลง Session
  const answerData = {
    questionId,
    userAnswer,
    isCorrect: verifyResult.isCorrect,
    earnedPoints: verifyResult.earnedPoints,
    streak: verifyResult.streak,
    maxStreak: verifyResult.maxStreak,
  };

  const updatedSession = await updateQuizSession(sessionId, answerData);

  // สร้าง Flex Message แสดงผล
  const resultFlex = createEnhancedAnswerResultFlex(
    question,
    userAnswer,
    verifyResult,
    updatedSession
  );

  await client.replyMessage(event.replyToken, resultFlex);
  return;
}
```

### Step 4: Handle `/next_question` Command

```javascript
// ข้อถัดไป
if (text.startsWith("/next_question")) {
  const sessionId = text.split(" ")[1];

  // ดึง Session
  const session = await getQuizSession(sessionId);
  if (!session) {
    await client.replyMessage(event.replyToken, {
      type: "text",
      text: "❌ Session หมดอายุแล้ว",
    });
    return;
  }

  // ตรวจสอบว่ามีข้อถัดไปหรือไม่
  const nextIndex = session.currentQuestionIndex;
  if (nextIndex >= session.questionIds.length) {
    // จบแล้ว -> แสดงผลสรุป
    const completedSession = await completeQuizSession(sessionId);
    const summaryFlex = createEnhancedQuizSummaryFlex(completedSession);
    await client.replyMessage(event.replyToken, summaryFlex);
    return;
  }

  // ดึงคำถามข้อถัดไป
  const nextQuestionId = session.questionIds[nextIndex];
  const nextQuestion = QUIZ_QUESTIONS[nextQuestionId];

  // สร้าง Flex Message
  const questionFlex = createEnhancedQuizQuestionFlex(nextQuestion, session);

  await client.replyMessage(event.replyToken, questionFlex);
  return;
}
```

### Step 5: Handle `/finish_quiz` Command

```javascript
// จบแบบทดสอบ
if (text.startsWith("/finish_quiz")) {
  const sessionId = text.split(" ")[1];

  // จบ Session
  const completedSession = await completeQuizSession(sessionId);

  // สร้างผลสรุป
  const summaryFlex = createEnhancedQuizSummaryFlex(completedSession);

  await client.replyMessage(event.replyToken, summaryFlex);
  return;
}
```

### Step 6: Handle `/quiz_dashboard` Command

```javascript
// Dashboard
if (text === "/quiz_dashboard") {
  // ดึงสถิติ
  const stats = await getUserLearningStats(userId);

  // สร้าง Dashboard Flex
  const dashboardFlex = createLearningDashboardFlex(stats);

  await client.replyMessage(event.replyToken, dashboardFlex);
  return;
}
```

---

## 🗄️ Firestore Collections

### 1. `quiz_sessions` Collection

```javascript
{
  sessionId: "quiz_U1234_1702345678901",
  userId: "U1234567890abcdef",
  lessonId: "lesson1", // หรือ "all"
  questionIds: ["q1_1", "q1_2", "q1_3", ...],
  currentQuestionIndex: 2,
  answers: [
    {questionId: "q1_1", userAnswer: "B", isCorrect: true, earnedPoints: 15, streak: 1},
    {questionId: "q1_2", userAnswer: "C", isCorrect: true, earnedPoints: 20, streak: 2},
  ],
  totalScore: 35,
  streak: 2,
  maxStreak: 2,
  startTime: Timestamp,
  endTime: null,
  status: "active", // active, completed, abandoned
  createdAt: Timestamp,
  updatedAt: Timestamp,
}
```

### 2. `student_progress` Collection

```javascript
{
  userId: "U1234567890abcdef",
  quizzesTaken: [
    {
      sessionId: "quiz_U1234_1702345678901",
      lessonId: "lesson1",
      correctAnswers: 8,
      totalQuestions: 10,
      percentage: 80,
      finalScore: 125,
      maxStreak: 5,
      completedAt: Timestamp,
    },
    ...
  ],
  totalQuizzes: 15,
  totalScore: 1850,
  averageScore: 82,
  perfectQuizzes: 3,
  lastQuizDate: Timestamp,
  updatedAt: Timestamp,
}
```

---

## 🎮 User Flow

### การทำแบบทดสอบ (User Journey)

```
1. User พิมพ์: /quiz lesson1
   └─> Bot: แสดงคำถามข้อที่ 1 (พร้อม Progress 1/10)

2. User: กดปุ่มเลือก A/B/C/D
   └─> Bot: แสดงผลว่าถูก/ผิด + เฉลย + คำอธิบาย + ปุ่ม "➡️ ข้อถัดไป"

3. User: กดปุ่ม "➡️ ข้อถัดไป"
   └─> Bot: แสดงคำถามข้อที่ 2 (พร้อม Progress 2/10, Streak ถ้ามี)

4. (ทำซ้ำจนครบ 10 ข้อ)

5. ข้อสุดท้าย: ปุ่ม "🏁 ดูผลสรุป"
   └─> Bot: แสดงผลสรุป (คะแนน, เปอร์เซ็นต์, Grade, โบนัส)

6. User: กดปุ่ม "📊 ดู Dashboard"
   └─> Bot: แสดง Dashboard (สถิติรวมทั้งหมด)
```

---

## 📊 ระบบคะแนน

### Base Points
- ตอบถูก = +10 คะแนน

### Streak Bonus
- Streak >= 2 ข้อ = x1.5 คะแนน
- ตอบผิด = รีเซ็ต Streak เป็น 0

### Combo Bonus
- Combo 3 ข้อ = +5
- Combo 5 ข้อ = +15
- Combo 10 ข้อ = +50

### Speed Bonus (ถ้าตอบถูก)
- ตอบใน < 10 วินาที = +20
- ตอบใน < 20 วินาที = +10
- ตอบใน < 30 วินาที = +5

### Perfect Bonus
- ทำได้ 100% = +50 คะแนนพิเศษ

### ตัวอย่างการคำนวณ

```
ข้อ 1: ถูก = 10 คะแนน (streak = 1)
ข้อ 2: ถูก = 10 + 5 (streak x1.5) = 15 คะแนน (streak = 2)
ข้อ 3: ถูก = 10 + 5 (streak x1.5) + 5 (combo 3) = 20 คะแนน (streak = 3)
ข้อ 4: ผิด = 0 คะแนน (streak reset = 0)
ข้อ 5: ถูก (< 15 วินาที) = 10 + 10 (speed) = 20 คะแนน (streak = 1)
...
ทำได้ 10/10 ถูกทั้งหมด = +50 คะแนน Perfect Bonus
```

---

## 🎯 การสุ่มคำถาม

### กรณี `/quiz lesson1`
```javascript
// สุ่ม 10 ข้อจาก lesson1 เท่านั้น
const questionIds = selectRandomQuestions("lesson1", 10, [], QUIZ_QUESTIONS);
// ผลลัพธ์: ["q1_3", "q1_1", "q1_2", ...] (สุ่มลำดับ)
```

### กรณี `/quiz all`
```javascript
// สุ่มจากทุกบท (lesson1-5) อย่างเท่าๆ กัน
const questionIds = selectRandomQuestions("all", 10, [], QUIZ_QUESTIONS);
// ผลลัพธ์: ["q2_1", "q4_3", "q1_2", "q5_1", ...] (กระจายทุกบท)
```

### Exclude Recent Questions
```javascript
// ไม่ให้สุ่มข้อที่เคยทำล่าสุด
const recentQuestionIds = ["q1_1", "q1_2"]; // ดึงจาก user history
const questionIds = selectRandomQuestions("all", 10, recentQuestionIds, QUIZ_QUESTIONS);
```

---

## 🏆 Achievements & Gamification

### Performance Levels
| คะแนนเฉลี่ย | Level | Badge |
|----------|--------|-------|
| 90-100 | 👑 เซียนระดับโลก | Gold |
| 80-89 | 🏆 เก่งมาก | Silver |
| 70-79 | ⭐ ดีมาก | Bronze |
| 60-69 | 📚 ปานกลาง | - |
| < 60 | 🌱 เริ่มต้น | - |

### Grade System
| เปอร์เซ็นต์ | Grade | สี |
|---------|-------|-----|
| 100% | S | Gold |
| 90-99% | A+ | Green |
| 80-89% | A | Blue |
| 70-79% | B | Purple |
| 60-69% | C | Orange |
| < 60% | D | Red |

---

## 🐛 Troubleshooting

### ปัญหา: Session หมดอายุ
**สาเหตุ**: Firestore session ถูกลบหรือหมดอายุ
**วิธีแก้**: ให้ผู้ใช้เริ่มแบบทดสอบใหม่ด้วย `/quiz`

### ปัญหา: คะแนนไม่ถูกต้อง
**สาเหตุ**: การคำนวณ streak หรือ bonus ผิดพลาด
**วิธีแก้**: ตรวจสอบ `verifyAnswerAndCalculateScore()` function

### ปัญหา: คำถามซ้ำกัน
**สาเหตุ**: `selectRandomQuestions()` ไม่ได้ exclude questions
**วิธีแก้**: ส่ง `excludeIds` parameter ให้ครบ

---

## 🚀 การ Deploy

```bash
# Deploy to Firebase
firebase deploy --only functions

# หรือ
npm run deploy:functions
```

---

## 📝 TODO: ฟีเจอร์ในอนาคต

- [ ] ระบบ Leaderboard (อันดับ Top 10)
- [ ] ระบบ Challenge เพื่อน
- [ ] ระบบ Daily Quest
- [ ] ระบบ Achievement Badges
- [ ] ระบบ Adaptive Learning (ปรับระดับความยาก)
- [ ] Export ผลการเรียนเป็น PDF
- [ ] Time Attack Mode (ทำให้เร็วที่สุด)
- [ ] Practice Mode (ไม่นับคะแนน)

---

## 📞 Support

หากมีปัญหาหรือข้อสงสัย กรุณาติดต่อ:
- Email: support@wit-ai.com
- LINE: @wit-ai
- GitHub Issues: https://github.com/wit-ai/issues

---

**สร้างโดย**: WiT AI Development Team
**เวอร์ชัน**: 3.0.0
**วันที่อัพเดท**: 12 ธันวาคม 2025

---

Happy Coding! 🎉
