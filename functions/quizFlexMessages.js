/**
 * 🎨 Enhanced Quiz Flex Messages
 * Flex Messages สำหรับระบบแบบทดสอบที่พัฒนาขึ้น
 *
 * Features:
 * - ✅ Answer Result with Auto Next Button
 * - 🎯 Question with Session Context
 * - 📊 Enhanced Quiz Summary
 * - 🏆 Achievement Celebrations
 *
 * @version 3.0.0
 * @created 2025-12-12
 */

// =====================================================
// 📝 ENHANCED QUIZ QUESTION FLEX
// =====================================================

/**
 * สร้างคำถามพร้อม Session Context
 *
 * @param {Object} question - ข้อมูลคำถาม
 * @param {Object} session - ข้อมูล quiz session
 * @returns {Object} - LINE Flex Message
 */
function createEnhancedQuizQuestionFlex(question, session) {
  if (!question || !session) return null;

  const currentNum = session.currentQuestionIndex + 1;
  const totalNum = session.questionIds.length;
  const currentScore = session.totalScore || 0;
  const streak = session.streak || 0;

  // Streak Visualization
  const streakIcon = "🔥";
  let streakColor = "#EF4444"; // Red
  if (streak >= 3) streakColor = "#F59E0B"; // Orange
  if (streak >= 5) streakColor = "#10B981"; // Green

  // Options with action
  const optionBoxes = question.options.map((opt, index) => {
    const choiceChar = String.fromCharCode(65 + index); // A, B, C, D
    return {
      type: "box",
      layout: "horizontal",
      contents: [
        {
          type: "box",
          layout: "vertical",
          contents: [
            {type: "text", text: choiceChar, weight: "bold", size: "sm", color: "#FFFFFF", align: "center"},
          ],
          width: "28px",
          height: "28px",
          backgroundColor: "#7C3AED",
          cornerRadius: "14px",
          justifyContent: "center",
          flex: 0,
        },
        {
          type: "text",
          text: opt,
          size: "sm",
          color: "#333333",
          wrap: true,
          gravity: "center",
          flex: 1,
          margin: "md",
        },
      ],
      paddingAll: "14px",
      backgroundColor: "#F3F4F6",
      cornerRadius: "lg",
      margin: "sm",
      action: {
        type: "postback",
        label: `เลือก ${choiceChar}`,
        data: `action=answer&session=${session.sessionId}&question=${question.id}&choice=${choiceChar}`,
        displayText: `ตอบ ${choiceChar}`,
      },
    };
  });

  return {
    type: "flex",
    altText: `📝 คำถามข้อ ${currentNum}/${totalNum}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          // Progress Bar
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {type: "text", text: "📝 แบบทดสอบ", weight: "bold", size: "sm", color: "#C4B5FD", flex: 1},
              {type: "text", text: `${currentNum}/${totalNum}`, weight: "bold", size: "sm", color: "#FFFFFF", align: "end"},
            ],
          },

          // Title & Streak
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {type: "text", text: `ข้อที่ ${currentNum}`, weight: "bold", size: "xl", color: "#FFFFFF", flex: 1},
              ...(streak > 1 ? [{
                type: "text",
                text: `${streakIcon} ${streak}`,
                weight: "bold",
                size: "lg",
                color: streakColor,
                align: "end",
                flex: 0,
              }] : []),
            ],
            margin: "md",
          },

          // Score & Progress Bar
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {type: "text", text: `⭐ ${currentScore}`, size: "sm", color: "#FFD700", flex: 0},
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [],
                    width: `${Math.round((currentNum / totalNum) * 100)}%`,
                    height: "5px",
                    backgroundColor: "#FFFFFF",
                    cornerRadius: "sm",
                  },
                ],
                backgroundColor: "#9F7AEA",
                height: "5px",
                margin: "md",
                cornerRadius: "sm",
                flex: 1,
                offsetTop: "4px",
              },
            ],
            margin: "md",
          },
        ],
        backgroundColor: "#7C3AED",
        paddingAll: "22px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {type: "text", text: question.question, weight: "bold", size: "md", wrap: true, color: "#1F2937"},
          {type: "separator", margin: "lg", color: "#E5E7EB"},
          {type: "text", text: "เลือกคำตอบที่ถูกต้อง:", size: "xs", color: "#6B7280", margin: "lg"},
          ...optionBoxes,
        ],
        paddingAll: "22px",
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {type: "text", text: "💡 คิดให้ดีก่อนตอบนะครับ", size: "xs", color: "#9CA3AF", align: "center"},
        ],
        paddingAll: "12px",
      },
    },
  };
}

// =====================================================
// ✅ ENHANCED ANSWER RESULT FLEX (with Auto Next)
// =====================================================

/**
 * สร้างผลลัพธ์คำตอบพร้อมปุ่มข้อถัดไป
 *
 * @param {Object} question - ข้อมูลคำถาม
 * @param {string} userAnswer - คำตอบของผู้ใช้
 * @param {Object} verifyResult - ผลการตรวจ {isCorrect, earnedPoints, streak, bonusInfo}
 * @param {Object} session - ข้อมูล session
 * @returns {Object} - LINE Flex Message
 */
function createEnhancedAnswerResultFlex(question, userAnswer, verifyResult, session) {
  if (!question || !verifyResult || !session) return null;

  const {isCorrect, earnedPoints, streak, bonusInfo, correctAnswer} = verifyResult;
  const headerColor = isCorrect ? "#10B981" : "#DC2626";
  const headerEmoji = isCorrect ? (streak > 2 ? "🔥" : "🎉") : "😢";
  const headerText = isCorrect ?
    (streak > 2 ? `${headerEmoji} สุดยอด! Combo x${streak}!` : `${headerEmoji} ถูกต้อง!`) :
    `${headerEmoji} ผิดครับ ลองใหม่อีกครั้ง`;

  // Check if has next question
  const currentIndex = session.currentQuestionIndex;
  const totalQuestions = session.questionIds.length;
  const hasNext = currentIndex < totalQuestions;
  const nextQuestionId = hasNext ? session.questionIds[currentIndex] : null;

  return {
    type: "flex",
    altText: isCorrect ? `✅ ถูกต้อง! +${earnedPoints} คะแนน` : `❌ ผิด - เฉลย: ${correctAnswer}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {type: "text", text: headerText, weight: "bold", size: "xl", color: "#FFFFFF", align: "center"},
          ...(isCorrect ? [
            {
              type: "text",
              text: `+${earnedPoints} คะแนน`,
              size: "lg",
              color: "#BBF7D0",
              align: "center",
              margin: "sm",
              weight: "bold",
            },
          ] : []),
        ],
        backgroundColor: headerColor,
        paddingAll: "22px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          // Question (abbreviated)
          {type: "text", text: question.question, size: "xs", color: "#6B7280", wrap: true, maxLines: 2},
          {type: "separator", margin: "md", color: "#E5E7EB"},

          // User Answer
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {type: "text", text: "คำตอบของคุณ:", size: "sm", color: "#6B7280", flex: 1},
              {
                type: "text",
                text: userAnswer,
                weight: "bold",
                size: "md",
                color: isCorrect ? "#10B981" : "#DC2626",
                flex: 1,
                align: "end",
              },
            ],
            margin: "md",
          },

          // Correct Answer (if wrong)
          ...(!isCorrect ? [{
            type: "box",
            layout: "horizontal",
            contents: [
              {type: "text", text: "เฉลย:", size: "sm", color: "#6B7280", flex: 1},
              {
                type: "text",
                text: correctAnswer,
                weight: "bold",
                size: "md",
                color: "#10B981",
                flex: 1,
                align: "end",
              },
            ],
            margin: "sm",
          }] : []),

          {type: "separator", margin: "lg", color: "#E5E7EB"},

          // Explanation
          {type: "text", text: "💡 คำอธิบาย", weight: "bold", size: "md", color: "#1F2937", margin: "md"},
          {type: "text", text: question.explanation, size: "sm", color: "#4B5563", wrap: true, margin: "sm"},

          // Bonus Info (if correct)
          ...(isCorrect && bonusInfo.length > 0 ? [
            {type: "separator", margin: "lg", color: "#E5E7EB"},
            {type: "text", text: "🎁 โบนัส", weight: "bold", size: "sm", color: "#7C3AED", margin: "md"},
            {
              type: "box",
              layout: "vertical",
              contents: bonusInfo.map((bonus) => ({
                type: "text",
                text: `• ${bonus}`,
                size: "xs",
                color: "#059669",
                margin: "xs",
              })),
              margin: "sm",
            },
          ] : []),
        ],
        paddingAll: "20px",
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          // Next Question Button (if available)
          ...(hasNext ? [{
            type: "button",
            action: {
              type: "postback",
              label: `➡️ ข้อถัดไป (${currentIndex + 1}/${totalQuestions})`,
              data: `action=next_question&session=${session.sessionId}`,
              displayText: "➡️ ข้อถัดไป",
            },
            style: "primary",
            color: "#7C3AED",
            height: "md",
          }] : [
            // Show Result Button (last question) - Auto trigger summary
            {
              type: "button",
              action: {
                type: "postback",
                label: "🏁 ดูผลสรุป",
                data: `action=finish_quiz&session=${session.sessionId}`,
                displayText: "🏁 ดูผลสรุป",
              },
              style: "primary",
              color: "#10B981",
              height: "md",
            },
          ]),

          // AI Explanation Button
          {
            type: "button",
            action: {
              type: "message",
              label: "🤖 อธิบายเพิ่มเติมด้วย AI",
              text: `/explain_ai ${question.id}`,
            },
            style: "link",
            height: "sm",
            margin: "sm",
          },
        ],
        paddingAll: "18px",
      },
    },
  };
}

// =====================================================
// 🏁 ENHANCED QUIZ SUMMARY FLEX
// =====================================================

/**
 * สร้างผลสรุปแบบทดสอบที่ปรับปรุงแล้ว
 *
 * @param {Object} session - ข้อมูล session ที่จบแล้ว
 * @returns {Object} - LINE Flex Message
 */
function createEnhancedQuizSummaryFlex(session) {
  if (!session) return null;

  // Calculate summary from session data
  const totalQuestions = session.questionIds.length;
  const correctAnswers = session.answers.filter((a) => a.isCorrect).length;
  const percentage = Math.round((correctAnswers / totalQuestions) * 100);
  const finalScore = session.totalScore || 0;
  const maxStreak = session.maxStreak || 0;

  // Determine Grade & Level
  let grade; let gradeColor; let message; let icon; let achievement;

  if (percentage === 100) {
    grade = "S";
    gradeColor = "#FFD700";
    message = "🎊 สุดยอด! คะแนนเต็ม 100%!";
    icon = "👑";
    achievement = "Perfect Score Achievement Unlocked!";
  } else if (percentage >= 90) {
    grade = "A+";
    gradeColor = "#10B981";
    message = "🎉 ยอดเยี่ยมมาก! เก่งมากๆ";
    icon = "🏆";
    achievement = "Excellence Achievement!";
  } else if (percentage >= 80) {
    grade = "A";
    gradeColor = "#3B82F6";
    message = "👍 ดีมาก! คุณเข้าใจเนื้อหาได้ดี";
    icon = "⭐";
    achievement = "Great Job!";
  } else if (percentage >= 70) {
    grade = "B";
    gradeColor = "#8B5CF6";
    message = "📚 ดีครับ ลองทบทวนเพิ่มเติมนิด";
    icon = "📖";
    achievement = "Good Progress!";
  } else if (percentage >= 60) {
    grade = "C";
    gradeColor = "#F59E0B";
    message = "💪 พอใช้ได้ ควรทบทวนเนื้อหาเพิ่ม";
    icon = "📝";
    achievement = "Keep Trying!";
  } else {
    grade = "D";
    gradeColor = "#DC2626";
    message = "🔄 ลองอ่านบทเรียนอีกครั้งแล้วทำใหม่นะ";
    icon = "💪";
    achievement = "Never Give Up!";
  }

  return {
    type: "flex",
    altText: `🏁 ผลคะแนน: ${correctAnswers}/${totalQuestions} (${percentage}%) | +${finalScore} แต้ม`,
    contents: {
      type: "bubble",
      size: "giga",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {type: "text", text: "🏁 ผลการทดสอบ", weight: "bold", size: "lg", color: "#FFFFFF", align: "center"},
          {type: "text", text: "Quiz Result Summary", size: "xs", color: "#E0E0E0", align: "center", margin: "xs"},
        ],
        backgroundColor: gradeColor,
        paddingAll: "20px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          // Grade Display
          {
            type: "box",
            layout: "vertical",
            contents: [
              {type: "text", text: icon, size: "5xl", align: "center"},
              {type: "text", text: grade, weight: "bold", size: "4xl", color: gradeColor, align: "center", margin: "md"},
              {type: "text", text: message, size: "md", color: "#4B5563", align: "center", wrap: true, margin: "md"},
            ],
          },

          {type: "separator", margin: "xl", color: "#E5E7EB"},

          // Stats Grid
          {
            type: "box",
            layout: "vertical",
            contents: [
              // Score
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {type: "text", text: "คะแนน", size: "sm", color: "#6B7280", flex: 1},
                  {type: "text", text: `${correctAnswers}/${totalQuestions}`, weight: "bold", size: "xl", color: "#1F2937", align: "end", flex: 1},
                ],
              },
              // Percentage
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {type: "text", text: "เปอร์เซ็นต์", size: "sm", color: "#6B7280", flex: 1},
                  {type: "text", text: `${percentage}%`, weight: "bold", size: "xl", color: gradeColor, align: "end", flex: 1},
                ],
                margin: "md",
              },
              // Total Points
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {type: "text", text: "คะแนนรวม", size: "sm", color: "#6B7280", flex: 1},
                  {type: "text", text: `${finalScore} แต้ม`, weight: "bold", size: "xl", color: "#F59E0B", align: "end", flex: 1},
                ],
                margin: "md",
              },
              // Max Streak
              ...(maxStreak > 1 ? [{
                type: "box",
                layout: "horizontal",
                contents: [
                  {type: "text", text: "🔥 Streak สูงสุด", size: "sm", color: "#6B7280", flex: 1},
                  {type: "text", text: `${maxStreak} ข้อ`, weight: "bold", size: "lg", color: "#EF4444", align: "end", flex: 1},
                ],
                margin: "md",
              }] : []),
            ],
            margin: "lg",
          },

          {type: "separator", margin: "xl", color: "#E5E7EB"},

          // Achievement
          {
            type: "box",
            layout: "vertical",
            contents: [
              {type: "text", text: achievement, weight: "bold", size: "sm", color: gradeColor, align: "center"},
            ],
            backgroundColor: "#F9FAFB",
            cornerRadius: "lg",
            paddingAll: "12px",
            margin: "lg",
          },
        ],
        paddingAll: "24px",
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            action: {
              type: "message",
              label: "🔄 ทำแบบทดสอบอีกครั้ง",
              text: session.lessonId ? `/quiz ${session.lessonId}` : "/quiz all",
            },
            style: "primary",
            color: gradeColor,
            height: "md",
          },
          {
            type: "button",
            action: {
              type: "message",
              label: "📊 ดู Dashboard",
              text: "/quiz_dashboard",
            },
            style: "secondary",
            height: "sm",
            margin: "sm",
          },
          {
            type: "button",
            action: {
              type: "message",
              label: "🏠 กลับเมนูหลัก",
              text: "/student",
            },
            style: "link",
            height: "sm",
            margin: "sm",
          },
        ],
        paddingAll: "20px",
      },
    },
  };
}

// =====================================================
// 📤 EXPORTS
// =====================================================

module.exports = {
  createEnhancedQuizQuestionFlex,
  createEnhancedAnswerResultFlex,
  createEnhancedQuizSummaryFlex,
};
