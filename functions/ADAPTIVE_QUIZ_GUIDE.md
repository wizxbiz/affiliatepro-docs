# 🎯 Adaptive Quiz System - คู่มือการใช้งาน

## 📋 ภาพรวมระบบ

**Adaptive Quiz System** เป็นระบบทดสอบอัจฉริยะที่ปรับระดับความยากอัตโนมัติตามความสามารถของผู้เรียน พร้อม AI ช่วยประเมินทักษะและให้คำแนะนำเฉพาะบุคคล

### ✨ จุดเด่น

- **🎯 ปรับระดับอัตโนมัติ**: เริ่มจากระดับง่าย ถ้าตอบถูกจะขึ้นระดับ ถ้าผิดจะลดระดับ
- **🧠 AI Assessment**: AI วิเคราะห์จุดแข็ง จุดอ่อน และให้คำแนะนำ
- **📊 Skill Level Tracking**: วัดทักษะแบบ 0-1000 คะแนน
- **⏱️ Dynamic Time Limit**: ระดับสูง เวลาน้อย ท้าทายกว่า
- **🎮 Gamification**: คะแนนแต้มต่างกันตามระดับ

---

## 🎮 การทำงานของระบบ

### 1. ระดับความยาก (Difficulty Levels)

| ระดับ | Icon | คะแนน/ข้อ | เวลา | Pass Rate | Skill Level |
|-------|------|-----------|------|-----------|-------------|
| **Beginner** 🌱 | เริ่มต้น | 10 แต้ม | 60s | 60% | 0-299 |
| **Intermediate** ⭐ | ปานกลาง | 20 แต้ม | 45s | 70% | 300-599 |
| **Advanced** 🔥 | ขั้นสูง | 30 แต้ม | 30s | 80% | 600-899 |
| **Expert** 👑 | ผู้เชี่ยวชาญ | 50 แต้ม | 20s | 90% | 900+ |

### 2. การปรับระดับอัตโนมัติ (Adaptive Algorithm)

```
เริ่มต้น: Beginner (🌱)
  ↓
ตอบถูก ≥70% (3 ข้อขึ้นไป)
  ↓
Intermediate (⭐)
  ↓
ตอบถูก ≥70% (3 ข้อขึ้นไป)
  ↓
Advanced (🔥)
  ↓
ตอบถูก ≥70% (3 ข้อขึ้นไป)
  ↓
Expert (👑)
```

**การลดระดับ**: ถ้าตอบถูก <40% จะลดระดับลงหนึ่งขั้น

### 3. เงื่อนไขการจบ Quiz

Quiz จะจบเมื่อ:
- ✅ **Confidence Score ≥85%** และตอบมาแล้ว ≥5 ข้อ
- ✅ ตอบครบ **20 ข้อ** (จำนวนสูงสุด)
- ✅ ระดับ **Expert** และตอบถูกติดกัน **5 ข้อ**

### 4. Confidence Score (ความมั่นใจ)

ระบบคำนวณความมั่นใจจาก:
- **จำนวนข้อที่ตอบ** (ยิ่งมาก ยิ่งมั่นใจ)
- **ความสม่ำเสมอ** (ถูกหรือผิดแบบคงที่)
- **Clarity** (ผลลัพธ์ชัดเจนหรือไม่)

---

## 📝 ตัวอย่างคำถาม

### 🌱 Beginner Level
```javascript
{
  question: "อุปกรณ์หลักในเครื่องฉีดพลาสติกที่ใช้หลอมพลาสติกคืออะไร?",
  options: ["Clamping Unit", "Barrel & Screw", "Mold", "Hydraulic System"],
  answer: "B",
  difficulty: "beginner",
  timeLimit: 60
}
```

### ⭐ Intermediate Level
```javascript
{
  question: "V/P Switchover ควรตั้งที่เท่าไหร่?",
  options: ["50-60%", "70-80%", "90-95%", "100%"],
  answer: "C",
  difficulty: "intermediate",
  timeLimit: 45
}
```

### 🔥 Advanced Level
```javascript
{
  question: "ในกรณีที่ทำ Gas-Assisted Injection Molding ก๊าซจะถูกฉีดเข้าไปในช่วงใด?",
  options: ["ก่อนฉีด", "พร้อมกับฉีด", "หลังฉีด แต่ก่อน Packing", "ในช่วง Packing"],
  answer: "C",
  difficulty: "advanced",
  timeLimit: 30
}
```

### 👑 Expert Level
```javascript
{
  question: "Cavity Pressure Curve แบบ Over-Pack จะมีลักษณะอย่างไร?",
  options: ["Peak ต่ำ ลดลงเรื่อยๆ", "Peak สูง Hold ขึ้นอีก", "Peak สูง คงที่", "Spike ขึ้นลงจังหวะ"],
  answer: "B",
  difficulty: "expert",
  timeLimit: 20
}
```

---

## 🤖 AI Assessment

หลังจบ Quiz, AI จะวิเคราะห์และประเมิน:

### 1. **ระดับทักษะปัจจุบัน**
   - Beginner / Intermediate / Advanced / Expert

### 2. **จุดแข็ง**
   - เก่งในด้านใด (เช่น "เข้าใจหลักการพื้นฐานดี")

### 3. **จุดที่ควรพัฒนา**
   - ควรฝึกเพิ่มเติมในเรื่องใด

### 4. **คำแนะนำเฉพาะตัว**
   - ควรเรียนรู้เพิ่มเติมอะไร

### 5. **เส้นทางการเรียนรู้ต่อไป**
   - Next Steps

**ตัวอย่าง AI Assessment**:
```
📊 คุณอยู่ในระดับ Intermediate (⭐)

จุดแข็ง:
- เข้าใจหลักการพื้นฐานของการฉีดพลาสติกดีมาก
- ตอบคำถามเกี่ยวกับ parameters ได้ถูกต้อง

จุดที่ควรพัฒนา:
- การวิเคราะห์ defects และ troubleshooting
- ความรู้เรื่อง advanced molding techniques

คำแนะนำ:
- ศึกษาเพิ่มเติมเรื่อง Gas-Assisted และ Multi-Component Molding
- ฝึกวิเคราะห์ Cavity Pressure Curves

เส้นทางต่อไป:
→ ทำแบบทดสอบ Advanced Level
→ อ่านเนื้อหา Scientific Molding
→ ศึกษา Case Studies จริง
```

---

## 🔧 Integration Code Examples

### 1. Start Adaptive Quiz
```javascript
// Postback Handler
if (action === "start_adaptive_quiz") {
  const session = await createAdaptiveSession(userId);
  const firstQuestion = selectAdaptiveQuestion(session, ADAPTIVE_QUIZ_QUESTIONS);

  const questionFlex = createAdaptiveQuestionFlex(firstQuestion, session);
  await lineClient.replyMessage(replyToken, questionFlex);
}
```

### 2. Answer Question
```javascript
if (action === "adaptive_answer") {
  const sessionId = params.get("session");
  const questionId = params.get("question");
  const userAnswer = params.get("choice");

  const session = await getAdaptiveSession(sessionId);
  const question = ADAPTIVE_QUIZ_QUESTIONS[questionId];

  // Verify answer
  const isCorrect = userAnswer === question.answer;

  // Update session
  const updatedSession = await updateAdaptiveSession(sessionId, {
    questionId,
    userAnswer,
    isCorrect,
    earnedPoints: isCorrect ? DIFFICULTY_LEVELS[session.currentDifficulty].pointsPerQuestion : 0,
    timeTaken: 15, // calculate actual time
  });

  // Check if should end
  const endCheck = shouldEndAdaptiveQuiz(updatedSession);

  if (endCheck.shouldEnd) {
    // Generate AI assessment
    const aiPrompt = generateAIAssessmentPrompt(updatedSession);
    const aiResponse = await callGeminiAPI(aiPrompt);

    // Complete session
    await completeAdaptiveSession(sessionId, aiResponse);

    // Show summary
    const summaryFlex = createAdaptiveSummaryFlex(updatedSession, aiResponse);
    await lineClient.replyMessage(replyToken, summaryFlex);
  } else {
    // Continue with next question
    const nextQuestion = selectAdaptiveQuestion(updatedSession, ADAPTIVE_QUIZ_QUESTIONS);
    const questionFlex = createAdaptiveQuestionFlex(nextQuestion, updatedSession);

    await lineClient.replyMessage(replyToken, questionFlex);
  }
}
```

---

## 📊 Firestore Collections

### 1. `adaptive_quiz_sessions`
```javascript
{
  sessionId: "adaptive_uf6b2600..._1765538492",
  userId: "Uf6b2600...",
  currentDifficulty: "intermediate",
  skillLevel: 450,
  questionsAsked: [
    {
      questionId: "adp_b1",
      isCorrect: true,
      earnedPoints: 10,
      timeTaken: 12
    },
    ...
  ],
  currentQuestionIndex: 5,
  correctCount: 4,
  wrongCount: 1,
  totalScore: 50,
  confidenceScore: 0.72,
  adaptHistory: [
    {
      timestamp: 1765538500000,
      from: "beginner",
      to: "intermediate",
      accuracy: 0.75,
      questionCount: 4
    }
  ],
  status: "active",
  startTime: Timestamp,
  aiAssessment: null
}
```

### 2. `adaptive_progress`
```javascript
{
  userId: "Uf6b2600...",
  sessionId: "adaptive_...",
  skillLevel: 450,
  difficulty: "intermediate",
  questionsAnswered: 8,
  accuracy: 75,
  totalScore: 120,
  confidenceScore: 0.85,
  adaptHistory: [...],
  aiAssessment: "คุณอยู่ในระดับ Intermediate...",
  completedAt: Timestamp
}
```

---

## 🎯 User Flow

```
User: /adaptive_quiz
  ↓
แสดงเมนู Adaptive Quiz Start
  ↓
User: กดปุ่ม "🚀 เริ่มทดสอบทักษะ"
  ↓
สร้าง session (Beginner level)
  ↓
แสดงคำถามข้อแรก (🌱 Beginner)
  ↓
User: ตอบ A/B/C/D
  ↓
ตรวจคำตอบ + อัพเดท session
  ↓
ตรวจสอบ: ควรปรับระดับหรือไม่?
  ├─ ใช่ → แสดงการแจ้งเตือนขึ้นระดับ
  └─ ไม่ → ไปต่อ
  ↓
ตรวจสอบ: ควรจบ quiz หรือไม่?
  ├─ ใช่ → ไปสู่ AI Assessment
  └─ ไม่ → แสดงคำถามถัดไป
  ↓
AI Assessment:
  - สร้าง prompt จากข้อมูล session
  - เรียก Gemini API
  - ได้คำประเมิน
  ↓
Complete session + บันทึก progress
  ↓
แสดง Summary Flex พร้อม AI Assessment
  ↓
User: ดูผลและคำแนะนำ
```

---

## 🚀 การ Deploy

1. เพิ่มไฟล์ทั้งหมดใน functions/
2. อัพเดท index.js เพิ่ม handlers
3. Deploy:
```bash
firebase deploy --only functions,firestore:indexes
```

4. ทดสอบด้วย:
```
/adaptive_quiz
```

---

## 📈 Next Steps

1. **เพิ่มคำถาม**: สร้างคำถามเพิ่มในแต่ละระดับ
2. **ปรับ Algorithm**: Fine-tune confidence threshold
3. **Dashboard**: สร้างหน้าแสดงประวัติทั้งหมด
4. **Leaderboard**: Ranking ตาม Skill Level
5. **Certificate**: ออก Certificate สำหรับ Expert Level

---

## 🔍 Tips

- เริ่มต้นง่ายๆ ให้ user มั่นใจก่อน
- ปรับระดับค่อยเป็นค่อยไป อย่าเร็วเกินไป
- AI Assessment ควรให้กำลังใจและชี้แนะชัดเจน
- Track progress ระยะยาวเพื่อดู improvement

---

สร้างโดย: Claude Sonnet 4.5 🤖
วันที่: 2025-12-12
