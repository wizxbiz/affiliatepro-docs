/**
 * 🎯 ADAPTIVE QUIZ SYSTEM
 * ระบบทดสอบที่ปรับระดับความยากอัตโนมัติ
 * - เริ่มจากระดับง่าย → กลาง → ยาก → Expert
 * - ปรับความยากตามผลการตอบ (ถูก = ยากขึ้น, ผิด = ง่ายลง)
 * - AI ประเมินทักษะและให้คำแนะนำ
 * - วัดระดับความเชี่ยวชาญจริง
 */

const {getFirestore, FieldValue} = require("firebase-admin/firestore");

// =====================================================
// 📊 DIFFICULTY LEVELS & SCORING
// =====================================================

const DIFFICULTY_LEVELS = {
  beginner: {
    name: "เริ่มต้น",
    minScore: 0,
    maxScore: 299,
    pointsPerQuestion: 10,
    timeLimit: 60, // วินาที
    passRate: 60, // %
    icon: "🌱",
    color: "#10B981",
  },
  intermediate: {
    name: "ปานกลาง",
    minScore: 300,
    maxScore: 599,
    pointsPerQuestion: 20,
    timeLimit: 45,
    passRate: 70,
    icon: "⭐",
    color: "#3B82F6",
  },
  advanced: {
    name: "ขั้นสูง",
    minScore: 600,
    maxScore: 899,
    pointsPerQuestion: 30,
    timeLimit: 30,
    passRate: 80,
    icon: "🔥",
    color: "#F59E0B",
  },
  expert: {
    name: "ผู้เชี่ยวชาญ",
    minScore: 900,
    maxScore: 9999,
    pointsPerQuestion: 50,
    timeLimit: 20,
    passRate: 90,
    icon: "👑",
    color: "#8B5CF6",
  },
};

// Adaptive Algorithm Configuration
const ADAPTIVE_CONFIG = {
  INITIAL_DIFFICULTY: "beginner",
  CORRECT_THRESHOLD: 0.7, // ถ้าตอบถูก 70% ขึ้นระดับ
  WRONG_THRESHOLD: 0.4, // ถ้าตอบถูกต่ำกว่า 40% ลดระดับ
  MIN_QUESTIONS_BEFORE_ADAPT: 3, // ต้องตอบอย่างน้อย 3 ข้อก่อนปรับระดับ
  MAX_QUESTIONS: 20, // จำนวนข้อสูงสุด
  CONFIDENCE_THRESHOLD: 0.85, // ความมั่นใจ 85% ถึงจะจบได้
};

// =====================================================
// 🎯 ADAPTIVE SESSION STRUCTURE
// =====================================================

const ADAPTIVE_SESSION_STRUCTURE = {
  sessionId: null,
  userId: null,
  currentDifficulty: "beginner",
  skillLevel: 0, // 0-1000
  questionsAsked: [],
  currentQuestionIndex: 0,
  correctCount: 0,
  wrongCount: 0,
  totalScore: 0,
  confidenceScore: 0, // 0-1
  adaptHistory: [], // บันทึกการปรับระดับ
  status: "active",
  startTime: null,
  endTime: null,
  aiAssessment: null,
};

// =====================================================
// 🧠 ADAPTIVE ALGORITHM
// =====================================================

/**
 * เลือกข้อถามตามระดับความยาก
 */
function selectAdaptiveQuestion(session, allQuestions) {
  const difficulty = session.currentDifficulty;
  const askedIds = session.questionsAsked.map((q) => q.questionId);

  // กรองคำถามตามระดับและที่ยังไม่เคยถาม
  const availableQuestions = Object.values(allQuestions).filter((q) => {
    return q.difficulty === difficulty && !askedIds.includes(q.id);
  });

  if (availableQuestions.length === 0) {
    // ถ้าไม่มีคำถามในระดับนี้แล้ว ให้ขึ้นระดับ
    return null;
  }

  // สุ่มคำถาม
  const randomIndex = Math.floor(Math.random() * availableQuestions.length);
  return availableQuestions[randomIndex];
}

/**
 * คำนวณว่าควรปรับระดับหรือไม่
 */
function shouldAdaptDifficulty(session) {
  const answeredCount = session.questionsAsked.length;

  // ต้องตอบอย่างน้อยตามที่กำหนด
  if (answeredCount < ADAPTIVE_CONFIG.MIN_QUESTIONS_BEFORE_ADAPT) {
    return {shouldAdapt: false, newDifficulty: session.currentDifficulty};
  }

  // คำนวณอัตราความถูกต้อง
  const accuracy = session.correctCount / answeredCount;

  const currentDiff = session.currentDifficulty;
  let newDifficulty = currentDiff;

  // 📈 ขึ้นระดับ: ถ้าตอบถูกมาก
  if (accuracy >= ADAPTIVE_CONFIG.CORRECT_THRESHOLD) {
    if (currentDiff === "beginner") newDifficulty = "intermediate";
    else if (currentDiff === "intermediate") newDifficulty = "advanced";
    else if (currentDiff === "advanced") newDifficulty = "expert";
  }

  // 📉 ลดระดับ: ถ้าตอบผิดมาก
  if (accuracy <= ADAPTIVE_CONFIG.WRONG_THRESHOLD) {
    if (currentDiff === "expert") newDifficulty = "advanced";
    else if (currentDiff === "advanced") newDifficulty = "intermediate";
    else if (currentDiff === "intermediate") newDifficulty = "beginner";
  }

  const shouldAdapt = newDifficulty !== currentDiff;

  return {shouldAdapt, newDifficulty, accuracy};
}

/**
 * คำนวณ Confidence Score (ความมั่นใจในการประเมินระดับ)
 */
function calculateConfidenceScore(session) {
  const answeredCount = session.questionsAsked.length;

  if (answeredCount < ADAPTIVE_CONFIG.MIN_QUESTIONS_BEFORE_ADAPT) {
    return 0;
  }

  // ยิ่งตอบมาก ยิ่งมั่นใจ
  const questionFactor = Math.min(answeredCount / ADAPTIVE_CONFIG.MAX_QUESTIONS, 1);

  // ยิ่งอัตราความถูกต้องคงที่ ยิ่งมั่นใจ
  const recentAnswers = session.questionsAsked.slice(-5);
  const recentCorrect = recentAnswers.filter((q) => q.isCorrect).length;
  const recentAccuracy = recentCorrect / recentAnswers.length;

  // ยิ่ง accuracy สูงหรือต่ำชัดเจน ยิ่งมั่นใจ
  const clarityFactor = Math.abs(recentAccuracy - 0.5) * 2; // 0-1

  return questionFactor * 0.6 + clarityFactor * 0.4;
}

/**
 * คำนวณ Skill Level (0-1000)
 */
function calculateSkillLevel(session) {
  const difficultyScores = {
    beginner: 200,
    intermediate: 500,
    advanced: 750,
    expert: 950,
  };

  const baseScore = difficultyScores[session.currentDifficulty];
  const accuracy = session.correctCount / (session.questionsAsked.length || 1);

  // ปรับตาม accuracy
  const adjustedScore = baseScore * accuracy;

  return Math.round(Math.min(adjustedScore, 1000));
}

/**
 * ตรวจสอบว่าควรจบ quiz หรือไม่
 */
function shouldEndAdaptiveQuiz(session) {
  const answeredCount = session.questionsAsked.length;
  const confidence = session.confidenceScore;

  // เงื่อนไขจบ:
  // 1. มั่นใจมากพอ (85%+) และตอบมาแล้วอย่างน้อย 5 ข้อ
  if (confidence >= ADAPTIVE_CONFIG.CONFIDENCE_THRESHOLD && answeredCount >= 5) {
    return {shouldEnd: true, reason: "high_confidence"};
  }

  // 2. ตอบครบจำนวนสูงสุด
  if (answeredCount >= ADAPTIVE_CONFIG.MAX_QUESTIONS) {
    return {shouldEnd: true, reason: "max_questions"};
  }

  // 3. ระดับ expert และถูกติดกัน 5 ข้อ
  if (session.currentDifficulty === "expert") {
    const last5 = session.questionsAsked.slice(-5);
    if (last5.length === 5 && last5.every((q) => q.isCorrect)) {
      return {shouldEnd: true, reason: "expert_mastery"};
    }
  }

  return {shouldEnd: false};
}

// =====================================================
// 💾 FIRESTORE SESSION MANAGEMENT
// =====================================================

/**
 * สร้าง Adaptive Quiz Session
 */
async function createAdaptiveSession(userId) {
  const db = getFirestore();
  const sessionId = `adaptive_${userId.toLowerCase()}_${Date.now()}`;

  const sessionData = {
    ...ADAPTIVE_SESSION_STRUCTURE,
    sessionId,
    userId,
    currentDifficulty: ADAPTIVE_CONFIG.INITIAL_DIFFICULTY,
    startTime: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
  };

  await db.collection("adaptive_quiz_sessions").doc(sessionId).set(sessionData);

  console.log(`✅ Created adaptive session: ${sessionId}`);
  return sessionData;
}

/**
 * ดึง Session
 */
async function getAdaptiveSession(sessionId) {
  const db = getFirestore();
  const doc = await db.collection("adaptive_quiz_sessions").doc(sessionId).get();

  if (!doc.exists) {
    console.log(`❌ Adaptive session not found: ${sessionId}`);
    return null;
  }

  return {sessionId, ...doc.data()};
}

/**
 * อัพเดท Session หลังตอบคำถาม
 */
async function updateAdaptiveSession(sessionId, questionData) {
  const db = getFirestore();
  const session = await getAdaptiveSession(sessionId);

  if (!session) throw new Error("Session not found");

  // อัพเดทข้อมูล
  const newCorrectCount = session.correctCount + (questionData.isCorrect ? 1 : 0);
  const newWrongCount = session.wrongCount + (questionData.isCorrect ? 0 : 1);
  const newQuestionsAsked = [...session.questionsAsked, questionData];
  const newIndex = session.currentQuestionIndex + 1;

  // คำนวณ metrics ใหม่
  const updatedSession = {
    ...session,
    questionsAsked: newQuestionsAsked,
    currentQuestionIndex: newIndex,
    correctCount: newCorrectCount,
    wrongCount: newWrongCount,
    totalScore: session.totalScore + (questionData.earnedPoints || 0),
  };

  // ตรวจสอบว่าควรปรับระดับหรือไม่
  const adaptResult = shouldAdaptDifficulty(updatedSession);

  if (adaptResult.shouldAdapt) {
    updatedSession.currentDifficulty = adaptResult.newDifficulty;
    updatedSession.adaptHistory.push({
      timestamp: Date.now(),
      from: session.currentDifficulty,
      to: adaptResult.newDifficulty,
      accuracy: adaptResult.accuracy,
      questionCount: newQuestionsAsked.length,
    });

    console.log(`📊 Adapted difficulty: ${session.currentDifficulty} → ${adaptResult.newDifficulty}`);
  }

  // คำนวณ confidence
  updatedSession.confidenceScore = calculateConfidenceScore(updatedSession);
  updatedSession.skillLevel = calculateSkillLevel(updatedSession);

  // บันทึกลง Firestore
  await db.collection("adaptive_quiz_sessions").doc(sessionId).update({
    questionsAsked: newQuestionsAsked,
    currentQuestionIndex: newIndex,
    correctCount: newCorrectCount,
    wrongCount: newWrongCount,
    totalScore: updatedSession.totalScore,
    currentDifficulty: updatedSession.currentDifficulty,
    adaptHistory: updatedSession.adaptHistory,
    confidenceScore: updatedSession.confidenceScore,
    skillLevel: updatedSession.skillLevel,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return updatedSession;
}

/**
 * จบ Adaptive Quiz พร้อม AI Assessment
 */
async function completeAdaptiveSession(sessionId, aiAssessment = null) {
  const db = getFirestore();
  const session = await getAdaptiveSession(sessionId);

  if (!session) throw new Error("Session not found");

  const finalSkillLevel = calculateSkillLevel(session);
  const finalDifficulty = session.currentDifficulty;

  await db.collection("adaptive_quiz_sessions").doc(sessionId).update({
    status: "completed",
    endTime: FieldValue.serverTimestamp(),
    skillLevel: finalSkillLevel,
    aiAssessment: aiAssessment || "ยังไม่ได้ประเมิน",
    updatedAt: FieldValue.serverTimestamp(),
  });

  console.log(`🏁 Completed adaptive session: ${sessionId}`);

  return {
    ...session,
    skillLevel: finalSkillLevel,
    finalDifficulty,
    aiAssessment,
  };
}

/**
 * บันทึกผลลงประวัติผู้เรียน
 */
async function saveAdaptiveResultToUserProgress(userId, result) {
  const db = getFirestore();

  const progressData = {
    userId,
    sessionId: result.sessionId,
    skillLevel: result.skillLevel,
    difficulty: result.finalDifficulty,
    questionsAnswered: result.questionsAsked.length,
    accuracy: (result.correctCount / result.questionsAsked.length) * 100,
    totalScore: result.totalScore,
    confidenceScore: result.confidenceScore,
    adaptHistory: result.adaptHistory,
    aiAssessment: result.aiAssessment,
    completedAt: FieldValue.serverTimestamp(),
  };

  await db.collection("adaptive_progress").add(progressData);

  console.log(`📊 Saved adaptive result for user: ${userId}`);
}

// =====================================================
// 🤖 AI SKILL ASSESSMENT
// =====================================================

/**
 * สร้าง prompt สำหรับ AI ประเมินทักษะ
 */
function generateAIAssessmentPrompt(session) {
  const accuracy = (session.correctCount / session.questionsAsked.length) * 100;
  const difficultyLevel = DIFFICULTY_LEVELS[session.currentDifficulty];

  return `
วิเคราะห์ทักษะของผู้เรียนจากผลการทดสอบแบบ Adaptive:

📊 **ข้อมูลการทดสอบ:**
- จำนวนข้อที่ตอบ: ${session.questionsAsked.length} ข้อ
- ตอบถูก: ${session.correctCount} ข้อ (${accuracy.toFixed(1)}%)
- คะแนนรวม: ${session.totalScore} แต้ม
- ระดับปัจจุบัน: ${difficultyLevel.icon} ${difficultyLevel.name}
- Skill Level: ${session.skillLevel}/1000
- Confidence Score: ${(session.confidenceScore * 100).toFixed(1)}%

📈 **ประวัติการปรับระดับ:**
${session.adaptHistory.length > 0 ?
    session.adaptHistory.map((h) => `- ${h.from} → ${h.to} (accuracy: ${(h.accuracy * 100).toFixed(1)}%)`).join("\n") :
    "ไม่มีการปรับระดับ"}

🎯 **คำถามที่ตอบ:**
${session.questionsAsked.slice(-5).map((q, i) => `${i + 1}. ${q.isCorrect ? "✅" : "❌"} ${q.questionId} (${q.timeTaken}s)`).join("\n")}

---

**ให้วิเคราะห์และประเมิน:**

1. **ระดับทักษะปัจจุบัน** (Beginner/Intermediate/Advanced/Expert)
2. **จุดแข็ง** (เก่งในด้านใด)
3. **จุดที่ควรพัฒนา** (ควรฝึกเพิ่มเติมในเรื่องใด)
4. **คำแนะนำเฉพาะตัว** (ควรเรียนรู้เพิ่มเติมอะไร)
5. **เส้นทางการเรียนรู้ต่อไป** (Next Steps)

ใช้ภาษาไทย เขียนให้กระชับ เป็นกันเอง กระตุ้นให้อยากเรียนรู้ต่อ
ความยาวประมาณ 150-200 คำ
`;
}

module.exports = {
  DIFFICULTY_LEVELS,
  ADAPTIVE_CONFIG,
  createAdaptiveSession,
  getAdaptiveSession,
  updateAdaptiveSession,
  completeAdaptiveSession,
  saveAdaptiveResultToUserProgress,
  selectAdaptiveQuestion,
  shouldEndAdaptiveQuiz,
  calculateSkillLevel,
  generateAIAssessmentPrompt,
};
