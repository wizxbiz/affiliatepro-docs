/**
 * 🎯 Enhanced Quiz System for Student Learning
 * ระบบแบบทดสอบที่พัฒนาขึ้น พร้อมฟีเจอร์ใหม่
 *
 * New Features:
 * - ✅ Answer Verification System (ตรวจคำตอบถูก/ผิด)
 * - ➡️ Auto Next Question (ข้อถัดไปอัตโนมัติ)
 * - 🎲 Improved Random Question Selection
 * - 📊 Performance Dashboard
 * - 💾 Quiz Session Management
 * - 🏆 Gamification with Streak & Combo
 *
 * @version 3.0.0
 * @created 2025-12-12
 */

const {getFirestore, FieldValue} = require("firebase-admin/firestore");

// =====================================================
// 📊 QUIZ SESSION MANAGEMENT
// =====================================================

/**
 * โครงสร้างข้อมูล Quiz Session
 */
const QUIZ_SESSION_STRUCTURE = {
  sessionId: null, // UUID ของ session
  userId: null, // LINE User ID
  lessonId: null, // บทที่กำลังทำ (null = all)
  questionIds: [], // รายการ ID คำถามที่สุ่มมา
  currentQuestionIndex: 0, // ข้อที่กำลังทำ (0-based)
  answers: [], // คำตอบทั้งหมด [{questionId, userAnswer, isCorrect, earnedPoints}]

  // Gamification
  totalScore: 0, // คะแนนรวม
  streak: 0, // ตอบถูกติดต่อกัน
  maxStreak: 0, // streak สูงสุด

  // Timing
  startTime: null, // เวลาเริ่ม
  endTime: null, // เวลาจบ
  timeSpent: 0, // เวลารวม (วินาที)

  // Status
  status: "active", // active, completed, abandoned
  createdAt: null,
  updatedAt: null,
};

/**
 * การคำนวณคะแนน
 */
const SCORING_CONFIG = {
  BASE_POINTS: 10, // คะแนนพื้นฐานต่อข้อ
  STREAK_MULTIPLIER: 1.5, // ตอบถูกติดต่อกัน x1.5
  COMBO_BONUS: {
    3: 5, // combo 3 ข้อ +5
    5: 15, // combo 5 ข้อ +15
    10: 50, // combo 10 ข้อ +50
  },
  PERFECT_BONUS: 50, // ทำได้เต็ม 100% +50
  SPEED_BONUS: {
    // ตอบเร็ว (เฉพาะข้อที่ถูก)
    veryFast: 20, // < 10 วินาที +20
    fast: 10, // < 20 วินาที +10
    normal: 5, // < 30 วินาที +5
  },
};

// =====================================================
// 🎲 IMPROVED RANDOM QUESTION SELECTOR
// =====================================================

/**
 * สุ่มคำถามแบบฉลาด (Smart Random)
 * - ไม่ซ้ำกับที่เคยทำล่าสุด
 * - สุ่มจากทุกบท (หากเลือก "all")
 * - จำนวนเท่ากันจากแต่ละบท
 *
 * @param {string} lessonId - "lesson1", "lesson2", ..., "all"
 * @param {number} count - จำนวนข้อที่ต้องการ
 * @param {Array} excludeIds - ID ที่ไม่ต้องการ (ไม่ให้ซ้ำ)
 * @param {Object} QUIZ_QUESTIONS - ข้อมูลคำถามทั้งหมด
 * @returns {Array} - Array ของ questionIds ที่สุ่มได้
 */
function selectRandomQuestions(lessonId, count, excludeIds = [], QUIZ_QUESTIONS) {
  // รวม ID ที่พร้อมใช้งาน โดยข้ามข้อที่ถูก exclude
  const questionsByLesson = Object.values(QUIZ_QUESTIONS).reduce((acc, q) => {
    if (excludeIds.includes(q.id)) return acc;
    if (!acc[q.lesson]) acc[q.lesson] = [];
    acc[q.lesson].push(q.id);
    return acc;
  }, {});

  // บทที่ใช้สุ่ม
  const lessons = lessonId === "all" ? Object.keys(questionsByLesson) : [lessonId];
  let picked = [];

  // แจกแจงจำนวนต่อบทแบบเท่าๆ กัน เหลือเท่าไหร่ค่อยเติมทีหลัง
  const basePerLesson = Math.floor(count / lessons.length);
  let remaining = count % lessons.length;

  lessons.forEach((lesson) => {
    const pool = shuffleArray(questionsByLesson[lesson] || []);
    const take = Math.min(pool.length, basePerLesson + (remaining > 0 ? 1 : 0));
    if (remaining > 0) remaining -= 1;
    picked.push(...pool.slice(0, take));
  });

  // ถ้ายังไม่ครบ ให้ดึงจาก pool รวมที่ยังเหลืออยู่
  if (picked.length < count) {
    const remainingPool = shuffleArray(
      lessons.flatMap((lesson) => questionsByLesson[lesson] || []).filter((id) => !picked.includes(id))
    );
    picked.push(...remainingPool.slice(0, count - picked.length));
  }

  // กันกรณีจำนวนคำถามในระบบมีไม่พอ
  return shuffleArray(Array.from(new Set(picked))).slice(0, count);
}

/**
 * Shuffle Array (Fisher-Yates Algorithm)
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// =====================================================
// 🎯 ANSWER VERIFICATION & SCORING
// =====================================================

/**
 * ตรวจคำตอบและคำนวณคะแนน
 *
 * @param {string} questionId - ID ของคำถาม
 * @param {string} userAnswer - คำตอบของผู้ใช้ (A, B, C, D)
 * @param {Object} currentSession - ข้อมูล session ปัจจุบัน
 * @param {number} answerTime - เวลาที่ใช้ตอบ (วินาที)
 * @param {Object} QUIZ_QUESTIONS - ข้อมูลคำถามทั้งหมด
 * @returns {Object} - {isCorrect, earnedPoints, streak, bonusInfo}
 */
function verifyAnswerAndCalculateScore(questionId, userAnswer, currentSession, answerTime, QUIZ_QUESTIONS) {
  const question = QUIZ_QUESTIONS[questionId];
  if (!question) {
    return {
      isCorrect: false,
      earnedPoints: 0,
      streak: 0,
      bonusInfo: [],
      error: "Question not found",
    };
  }

  const correctAnswer = question.answer;
  const isCorrect = userAnswer.toUpperCase() === correctAnswer.toUpperCase();

  let earnedPoints = 0;
  const bonusInfo = [];
  let newStreak = currentSession.streak;

  // แปลงเวลาเป็นวินาที (ถ้าส่งมาเป็น timestamp หรือ millisecond)
  const answerTimeSeconds = Number.isFinite(answerTime) ? Math.max(0, Math.round(answerTime / 1000)) : null;

  if (isCorrect) {
    // คะแนนพื้นฐาน
    earnedPoints = SCORING_CONFIG.BASE_POINTS;
    bonusInfo.push(`Base: +${SCORING_CONFIG.BASE_POINTS}`);

    // Streak
    newStreak = (currentSession.streak || 0) + 1;
    if (newStreak >= 2) {
      const streakBonus = Math.round(SCORING_CONFIG.BASE_POINTS * (SCORING_CONFIG.STREAK_MULTIPLIER - 1));
      earnedPoints += streakBonus;
      bonusInfo.push(`Streak x${newStreak}: +${streakBonus}`);
    }

    // Combo Bonus
    if (SCORING_CONFIG.COMBO_BONUS[newStreak]) {
      const comboBonus = SCORING_CONFIG.COMBO_BONUS[newStreak];
      earnedPoints += comboBonus;
      bonusInfo.push(`🔥 Combo ${newStreak}: +${comboBonus}`);
    }

    // Speed Bonus
    if (answerTimeSeconds !== null) {
      let speedBonus = 0;
      if (answerTimeSeconds < 10) {
        speedBonus = SCORING_CONFIG.SPEED_BONUS.veryFast;
        bonusInfo.push(`⚡ Very Fast: +${speedBonus}`);
      } else if (answerTimeSeconds < 20) {
        speedBonus = SCORING_CONFIG.SPEED_BONUS.fast;
        bonusInfo.push(`⚡ Fast: +${speedBonus}`);
      } else if (answerTimeSeconds < 30) {
        speedBonus = SCORING_CONFIG.SPEED_BONUS.normal;
        bonusInfo.push(`⚡ Quick: +${speedBonus}`);
      }
      earnedPoints += speedBonus;
    }

  } else {
    // ตอบผิด - รีเซ็ต streak
    newStreak = 0;
  }

  const answerData = {
    questionId,
    userAnswer,
    isCorrect,
    earnedPoints,
    streak: newStreak,
    maxStreak: Math.max(newStreak, currentSession.maxStreak || 0),
    answerTimeSeconds,
    answeredAt: Date.now(),
  };

  return {
    isCorrect,
    earnedPoints,
    streak: newStreak,
    maxStreak: Math.max(newStreak, currentSession.maxStreak || 0),
    bonusInfo,
    correctAnswer,
    answerData,
  };
}

// =====================================================
// 💾 FIRESTORE SESSION MANAGEMENT
// =====================================================

/**
 * สร้าง Quiz Session ใหม่
 */
async function createQuizSession(userId, lessonId, questionIds) {
  const db = getFirestore();
  // 🔧 Convert to lowercase to match command parsing (msgTextLower)
  const sessionId = `quiz_${userId.toLowerCase()}_${Date.now()}`;

  console.log(`🆔 [createQuizSession] Creating session with ID: "${sessionId}"`);
  console.log(`👤 [createQuizSession] UserId (original): "${userId}", (lowercase): "${userId.toLowerCase()}"`);

  const sessionData = {
    ...QUIZ_SESSION_STRUCTURE,
    sessionId,
    userId,
    lessonId,
    questionIds,
    currentQuestionIndex: 0,
    answers: [],
    totalScore: 0,
    streak: 0,
    maxStreak: 0,
    startTime: FieldValue.serverTimestamp(),
    status: "active",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await db.collection("quiz_sessions").doc(sessionId).set(sessionData);

  console.log(`✅ [createQuizSession] Session saved to Firestore with doc ID: "${sessionId}"`);

  // Verify it was created
  const verifyDoc = await db.collection("quiz_sessions").doc(sessionId).get();
  if (verifyDoc.exists) {
    console.log(`✅ [createQuizSession] VERIFIED: Session exists in Firestore`);
  } else {
    console.log(`❌ [createQuizSession] ERROR: Session NOT found after creation!`);
  }

  return sessionData;
}

/**
 * ดึงข้อมูล Quiz Session
 */
async function getQuizSession(sessionId) {
  const db = getFirestore();
  console.log(`🔍 [getQuizSession] Looking for sessionId: "${sessionId}"`);

  const sessionDoc = await db.collection("quiz_sessions").doc(sessionId).get();

  if (!sessionDoc.exists) {
    console.log(`❌ [getQuizSession] Session not found: "${sessionId}"`);

    // 🔍 Debug: List all sessions for this user
    const userId = sessionId.split("_")[1]; // Extract userId from sessionId
    if (userId) {
      console.log(`🔍 [DEBUG] Checking all sessions for userId: ${userId}`);
      try {
        const allSessions = await db.collection("quiz_sessions")
          .where("userId", "==", userId)
          .limit(5)
          .get();

        console.log(`📊 Found ${allSessions.size} sessions for this user:`);
        allSessions.forEach((doc) => {
          console.log(`  - ${doc.id} (status: ${doc.data().status})`);
        });
      } catch (debugError) {
        console.log(`⚠️ [DEBUG] Could not list sessions:`, debugError.message);
      }
    }

    return null;
  }

  console.log(`✅ [getQuizSession] Session found: ${sessionId}`);
  return {sessionId, ...sessionDoc.data()};
}

/**
 * อัพเดท Quiz Session หลังตอบคำถาม
 */
async function updateQuizSession(sessionId, answerData) {
  const db = getFirestore();
  const sessionRef = db.collection("quiz_sessions").doc(sessionId);
  const sessionDoc = await sessionRef.get();

  if (!sessionDoc.exists) {
    throw new Error("Session not found");
  }

  if (!answerData || !answerData.questionId) {
    throw new Error("Invalid answer data");
  }

  const session = sessionDoc.data();
  const newAnswers = [...(session.answers || []), answerData];
  const newTotalScore = (session.totalScore || 0) + (answerData.earnedPoints || 0);
  const newIndex = (session.currentQuestionIndex || 0) + 1;

  await sessionRef.update({
    answers: newAnswers,
    currentQuestionIndex: newIndex,
    totalScore: newTotalScore,
    streak: answerData.streak || 0,
    maxStreak: answerData.maxStreak || session.maxStreak || 0,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return {
    ...session,
    answers: newAnswers,
    currentQuestionIndex: newIndex,
    totalScore: newTotalScore,
    streak: answerData.streak,
    maxStreak: answerData.maxStreak,
  };
}

/**
 * จบ Quiz Session
 */
async function completeQuizSession(sessionId) {
  const db = getFirestore();
  const sessionRef = db.collection("quiz_sessions").doc(sessionId);
  const sessionDoc = await sessionRef.get();

  if (!sessionDoc.exists) {
    throw new Error("Session not found");
  }

  const session = sessionDoc.data();
  const correctAnswers = session.answers.filter((a) => a.isCorrect).length;
  const totalQuestions = session.questionIds.length;
  const percentage = Math.round((correctAnswers / totalQuestions) * 100);

  // Perfect Bonus
  let finalScore = session.totalScore;
  if (percentage === 100) {
    finalScore += SCORING_CONFIG.PERFECT_BONUS;
  }

  await sessionRef.update({
    status: "completed",
    endTime: FieldValue.serverTimestamp(),
    finalScore,
    percentage,
    updatedAt: FieldValue.serverTimestamp(),
  });

  // บันทึกลง user progress
  await saveQuizResultToUserProgress(session.userId, {
    sessionId,
    lessonId: session.lessonId,
    correctAnswers,
    totalQuestions,
    percentage,
    finalScore,
    maxStreak: session.maxStreak,
    completedAt: new Date(),
  });

  return {
    ...session,
    status: "completed",
    finalScore,
    percentage,
    correctAnswers,
    totalQuestions,
  };
}

/**
 * บันทึกผลลงใน User Progress
 */
async function saveQuizResultToUserProgress(userId, quizResult) {
  const db = getFirestore();
  const userRef = db.collection("student_progress").doc(userId);
  const userDoc = await userRef.get();

  const currentData = userDoc.exists ? userDoc.data() : {
    userId,
    quizzesTaken: [],
    totalQuizzes: 0,
    totalScore: 0,
    averageScore: 0,
    perfectQuizzes: 0,
    createdAt: FieldValue.serverTimestamp(),
  };

  const newQuizzes = [...(currentData.quizzesTaken || []), quizResult];
  const newTotalScore = (currentData.totalScore || 0) + quizResult.finalScore;
  const newTotalQuizzes = (currentData.totalQuizzes || 0) + 1;
  const newAverageScore = Math.round(newTotalScore / newTotalQuizzes);
  const newPerfectQuizzes = quizResult.percentage === 100 ?
    (currentData.perfectQuizzes || 0) + 1 : currentData.perfectQuizzes || 0;

  await userRef.set({
    ...currentData,
    quizzesTaken: newQuizzes,
    totalQuizzes: newTotalQuizzes,
    totalScore: newTotalScore,
    averageScore: newAverageScore,
    perfectQuizzes: newPerfectQuizzes,
    lastQuizDate: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }, {merge: true});

  console.log(`📊 Saved quiz result to user progress: ${userId}`);
}

// =====================================================
// 📊 PERFORMANCE DASHBOARD
// =====================================================

/**
 * ดึงข้อมูลสถิติการเรียนรู้
 */
async function getUserLearningStats(userId) {
  const db = getFirestore();
  const progressDoc = await db.collection("student_progress").doc(userId).get();

  if (!progressDoc.exists) {
    return {
      totalQuizzes: 0,
      totalScore: 0,
      averageScore: 0,
      perfectQuizzes: 0,
      bestStreak: 0,
      recentQuizzes: [],
      accuracy: 0,
    };
  }

  const data = progressDoc.data();
  const recentQuizzes = (data.quizzesTaken || []).slice(-10).reverse(); // 10 quiz ล่าสุด

  const bestStreak = Math.max(...(data.quizzesTaken || []).map((q) => q.maxStreak || 0), 0);
  const totals = (data.quizzesTaken || []).reduce((acc, quiz) => {
    acc.correct += quiz.correctAnswers || 0;
    acc.total += quiz.totalQuestions || 0;
    return acc;
  }, {correct: 0, total: 0});
  const accuracy = totals.total > 0 ? Math.round((totals.correct / totals.total) * 100) : 0;

  return {
    totalQuizzes: data.totalQuizzes || 0,
    totalScore: data.totalScore || 0,
    averageScore: data.averageScore || 0,
    perfectQuizzes: data.perfectQuizzes || 0,
    bestStreak,
    recentQuizzes,
    lastQuizDate: data.lastQuizDate,
    accuracy,
  };
}

/**
 * สร้าง Learning Performance Dashboard Flex
 */
function createLearningDashboardFlex(stats) {
  const {totalQuizzes, totalScore, averageScore, perfectQuizzes, bestStreak, recentQuizzes, accuracy} = stats;

  // คำนวณ Performance Level
  let performanceLevel = "เริ่มต้น";
  let performanceColor = "#9CA3AF";
  let performanceEmoji = "🌱";

  if (averageScore >= 90) {
    performanceLevel = "เซียนระดับโลก";
    performanceColor = "#10B981";
    performanceEmoji = "👑";
  } else if (averageScore >= 80) {
    performanceLevel = "เก่งมาก";
    performanceColor = "#3B82F6";
    performanceEmoji = "🏆";
  } else if (averageScore >= 70) {
    performanceLevel = "ดีมาก";
    performanceColor = "#8B5CF6";
    performanceEmoji = "⭐";
  } else if (averageScore >= 60) {
    performanceLevel = "ปานกลาง";
    performanceColor = "#F59E0B";
    performanceEmoji = "📚";
  }

  return {
    type: "flex",
    altText: `📊 Dashboard: ${totalQuizzes} แบบทดสอบ | คะแนนเฉลี่ย ${averageScore}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {type: "text", text: "📊 Learning Dashboard", weight: "bold", size: "xl", color: "#FFFFFF", align: "center"},
          {type: "text", text: "ประสิทธิภาพการเรียนรู้ของคุณ", size: "xs", color: "#E0E0E0", align: "center", margin: "sm"},
        ],
        backgroundColor: performanceColor,
        paddingAll: "20px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          // Performance Level
          {
            type: "box",
            layout: "vertical",
            contents: [
              {type: "text", text: performanceEmoji, size: "3xl", align: "center"},
              {type: "text", text: performanceLevel, weight: "bold", size: "xl", color: performanceColor, align: "center", margin: "sm"},
            ],
            backgroundColor: "#F9FAFB",
            cornerRadius: "lg",
            paddingAll: "15px",
          },

          {type: "separator", margin: "lg"},

          // Stats Grid
          {
            type: "box",
            layout: "vertical",
            contents: [
              // Row 1
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  createStatBox("📝", "แบบทดสอบทั้งหมด", totalQuizzes.toString(), "#3B82F6"),
                  createStatBox("⭐", "คะแนนเฉลี่ย", averageScore.toString(), "#F59E0B"),
                ],
                spacing: "md",
              },
              // Row 2
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  createStatBox("🥇", "ความแม่นยำ", `${accuracy}%`, "#10B981"),
                  createStatBox("🔥", "Streak สูงสุด", bestStreak.toString(), "#EF4444"),
                ],
                spacing: "md",
                margin: "md",
              },
              // Total Score
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {type: "text", text: "💯 คะแนนรวมทั้งหมด", size: "sm", color: "#666666", align: "center"},
                  {type: "text", text: totalScore.toString(), weight: "bold", size: "3xl", color: "#7C3AED", align: "center", margin: "sm"},
                ],
                backgroundColor: "#F3F4F6",
                cornerRadius: "lg",
                paddingAll: "15px",
                margin: "lg",
              },
            ],
          },

          {type: "separator", margin: "lg"},

          // Recent Quizzes
          {type: "text", text: "📅 แบบทดสอบล่าสุด", weight: "bold", size: "md", color: "#333333"},
          ...(recentQuizzes.length > 0 ? recentQuizzes.slice(0, 5).map((quiz) => createRecentQuizRow(quiz)) : [
            {type: "text", text: "ยังไม่มีข้อมูล", size: "sm", color: "#999999", align: "center", margin: "md"},
          ]),
        ],
        paddingAll: "20px",
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            action: {type: "message", label: "📝 ทำแบบทดสอบใหม่", text: "/quiz all"},
            style: "primary",
            color: performanceColor,
          },
          {
            type: "button",
            action: {type: "message", label: "🏠 กลับเมนูหลัก", text: "/student"},
            style: "link",
            margin: "sm",
          },
        ],
        paddingAll: "15px",
      },
    },
  };
}

/**
 * Helper: สร้าง Stat Box
 */
function createStatBox(emoji, label, value, color) {
  return {
    type: "box",
    layout: "vertical",
    contents: [
      {type: "text", text: emoji, size: "xl", align: "center"},
      {type: "text", text: label, size: "xs", color: "#666666", align: "center", wrap: true, margin: "sm"},
      {type: "text", text: value, weight: "bold", size: "xl", color: color, align: "center", margin: "xs"},
    ],
    backgroundColor: "#F9FAFB",
    cornerRadius: "md",
    paddingAll: "12px",
    flex: 1,
  };
}

/**
 * Helper: สร้าง Recent Quiz Row
 */
function createRecentQuizRow(quiz) {
  const gradeEmoji = quiz.percentage >= 80 ? "🏆" : quiz.percentage >= 60 ? "⭐" : "📖";
  const scoreColor = quiz.percentage >= 80 ? "#10B981" : quiz.percentage >= 60 ? "#3B82F6" : "#F59E0B";

  return {
    type: "box",
    layout: "horizontal",
    contents: [
      {type: "text", text: gradeEmoji, size: "md", flex: 0},
      {type: "text", text: `${quiz.correctAnswers}/${quiz.totalQuestions}`, size: "sm", color: "#333333", margin: "md", flex: 1},
      {type: "text", text: `${quiz.percentage}%`, weight: "bold", size: "sm", color: scoreColor, align: "end", flex: 1},
      {type: "text", text: `+${quiz.finalScore}`, size: "xs", color: "#999999", align: "end", flex: 1},
    ],
    paddingAll: "8px",
    backgroundColor: "#F9FAFB",
    cornerRadius: "sm",
    margin: "sm",
  };
}

// =====================================================
// 📤 EXPORTS
// =====================================================

module.exports = {
  // Constants
  QUIZ_SESSION_STRUCTURE,
  SCORING_CONFIG,

  // Random Selection
  selectRandomQuestions,
  shuffleArray,

  // Answer Verification
  verifyAnswerAndCalculateScore,

  // Session Management
  createQuizSession,
  getQuizSession,
  updateQuizSession,
  completeQuizSession,
  saveQuizResultToUserProgress,

  // Dashboard
  getUserLearningStats,
  createLearningDashboardFlex,
};
