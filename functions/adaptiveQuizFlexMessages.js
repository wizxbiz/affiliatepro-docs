/**
 * 🎨 ADAPTIVE QUIZ FLEX MESSAGES
 * Flex Messages สำหรับระบบทดสอบแบบปรับระดับ
 */

const {DIFFICULTY_LEVELS} = require("./adaptiveQuizSystem");

// =====================================================
// 🎯 ADAPTIVE QUESTION FLEX
// =====================================================

function createAdaptiveQuestionFlex(question, session) {
  if (!question || !session) return null;

  const difficulty = DIFFICULTY_LEVELS[session.currentDifficulty];
  const currentNum = session.currentQuestionIndex + 1;
  const skillLevel = session.skillLevel || 0;
  const confidencePercent = Math.round((session.confidenceScore || 0) * 100);

  // Options
  const optionBoxes = question.options.map((opt, index) => {
    const choiceChar = String.fromCharCode(65 + index);
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
          backgroundColor: difficulty.color,
          cornerRadius: "14px",
          justifyContent: "center",
          flex: 0,
        },
        {
          type: "text",
          text: opt.replace(/^[A-D]\.\s*/, ""),
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
        data: `action=adaptive_answer&session=${session.sessionId}&question=${question.id}&choice=${choiceChar}`,
        displayText: `ตอบ ${choiceChar}`,
      },
    };
  });

  return {
    type: "flex",
    altText: `🎯 Adaptive Quiz - ข้อ ${currentNum}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          // Difficulty Badge
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: `${difficulty.icon} ${difficulty.name}`,
                weight: "bold",
                size: "sm",
                color: "#FFFFFF",
                flex: 0,
              },
              {
                type: "text",
                text: `ข้อ ${currentNum}`,
                weight: "bold",
                size: "sm",
                color: "#FFFFFF",
                align: "end",
              },
            ],
          },
          // Skill Level Progress
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: `Skill: ${skillLevel}/1000 | มั่นใจ: ${confidencePercent}%`,
                size: "xs",
                color: "#E0E0E0",
                margin: "sm",
              },
            ],
          },
        ],
        backgroundColor: difficulty.color,
        paddingAll: "18px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          // Question
          {
            type: "text",
            text: question.question,
            weight: "bold",
            size: "md",
            color: "#1F2937",
            wrap: true,
          },
          {type: "separator", margin: "lg", color: "#E5E7EB"},

          // Time Limit
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {type: "text", text: `⏱️ เวลา: ${question.timeLimit}s`, size: "xs", color: "#6B7280", flex: 0},
              {type: "text", text: `🎯 ${difficulty.pointsPerQuestion} แต้ม`, size: "xs", color: "#6B7280", align: "end"},
            ],
            margin: "md",
          },

          // Options
          ...optionBoxes,
        ],
        paddingAll: "20px",
      },
    },
  };
}

// =====================================================
// 📊 DIFFICULTY CHANGE NOTIFICATION
// =====================================================

function createDifficultyChangeNotification(fromDiff, toDiff, accuracy) {
  const from = DIFFICULTY_LEVELS[fromDiff];
  const to = DIFFICULTY_LEVELS[toDiff];
  const isLevelUp = to.minScore > from.minScore;

  return {
    type: "flex",
    altText: isLevelUp ? "🎉 ขึ้นระดับ!" : "📉 ปรับระดับ",
    contents: {
      type: "bubble",
      size: "kilo",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: isLevelUp ? "🎉 ขึ้นระดับ!" : "📊 ปรับระดับ",
            weight: "bold",
            size: "lg",
            color: isLevelUp ? "#10B981" : "#F59E0B",
            align: "center",
          },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {type: "text", text: `${from.icon} ${from.name}`, size: "md", color: "#666666", flex: 1, align: "center"},
              {type: "text", text: "→", size: "xl", color: "#999999", flex: 0, margin: "md"},
              {type: "text", text: `${to.icon} ${to.name}`, size: "md", color: to.color, flex: 1, align: "center", weight: "bold"},
            ],
            margin: "md",
          },
          {
            type: "text",
            text: `ความแม่นยำ: ${(accuracy * 100).toFixed(1)}%`,
            size: "xs",
            color: "#999999",
            align: "center",
            margin: "md",
          },
          {
            type: "text",
            text: isLevelUp ?
              "คุณทำได้ดีมาก! เตรียมพบคำถามที่ท้าทายกว่า" :
              "ไม่เป็นไร ลองทำคำถามที่เหมาะสมกว่านี้",
            size: "xs",
            color: "#666666",
            wrap: true,
            align: "center",
            margin: "sm",
          },
        ],
        paddingAll: "20px",
      },
    },
  };
}

// =====================================================
// 🏁 ADAPTIVE QUIZ SUMMARY WITH AI ASSESSMENT
// =====================================================

function createAdaptiveSummaryFlex(session, aiAssessment) {
  if (!session) return null;

  const totalQ = session.questionsAsked.length;
  const correctQ = session.correctCount;
  const accuracy = Math.round((correctQ / totalQ) * 100);
  const skillLevel = session.skillLevel || 0;
  const difficulty = DIFFICULTY_LEVELS[session.currentDifficulty];

  // Determine Skill Badge
  let skillBadge = "🌱 เริ่มต้น";
  let skillColor = "#10B981";

  if (skillLevel >= 900) {
    skillBadge = "👑 ผู้เชี่ยวชาญ";
    skillColor = "#8B5CF6";
  } else if (skillLevel >= 600) {
    skillBadge = "🔥 ขั้นสูง";
    skillColor = "#F59E0B";
  } else if (skillLevel >= 300) {
    skillBadge = "⭐ ปานกลาง";
    skillColor = "#3B82F6";
  }

  return {
    type: "flex",
    altText: `🎯 Adaptive Quiz Summary - Skill Level: ${skillLevel}`,
    contents: {
      type: "bubble",
      size: "giga",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {type: "text", text: "🎯 ผลการประเมินทักษะ", weight: "bold", size: "xl", color: "#FFFFFF", align: "center"},
          {type: "text", text: "Adaptive Skill Assessment", size: "xs", color: "#E0E0E0", align: "center", margin: "sm"},
        ],
        backgroundColor: skillColor,
        paddingAll: "20px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          // Skill Level Badge
          {
            type: "box",
            layout: "vertical",
            contents: [
              {type: "text", text: skillBadge, weight: "bold", size: "xxl", color: skillColor, align: "center"},
              {
                type: "text",
                text: `Skill Level: ${skillLevel}/1000`,
                size: "lg",
                color: "#666666",
                align: "center",
                margin: "sm",
              },
            ],
            paddingAll: "15px",
            backgroundColor: "#F9FAFB",
            cornerRadius: "lg",
          },

          {type: "separator", margin: "lg", color: "#E5E7EB"},

          // Stats
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {type: "text", text: "📝 จำนวนข้อ", size: "sm", color: "#6B7280", flex: 1},
                  {type: "text", text: `${totalQ} ข้อ`, size: "sm", color: "#111827", align: "end", weight: "bold"},
                ],
                margin: "sm",
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {type: "text", text: "✅ ตอบถูก", size: "sm", color: "#6B7280", flex: 1},
                  {type: "text", text: `${correctQ} ข้อ (${accuracy}%)`, size: "sm", color: "#10B981", align: "end", weight: "bold"},
                ],
                margin: "sm",
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {type: "text", text: "🎯 คะแนนรวม", size: "sm", color: "#6B7280", flex: 1},
                  {type: "text", text: `${session.totalScore} แต้ม`, size: "sm", color: "#111827", align: "end", weight: "bold"},
                ],
                margin: "sm",
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {type: "text", text: `${difficulty.icon} ระดับสุดท้าย`, size: "sm", color: "#6B7280", flex: 1},
                  {type: "text", text: difficulty.name, size: "sm", color: difficulty.color, align: "end", weight: "bold"},
                ],
                margin: "sm",
              },
            ],
            margin: "md",
          },

          {type: "separator", margin: "lg", color: "#E5E7EB"},

          // AI Assessment
          {
            type: "box",
            layout: "vertical",
            contents: [
              {type: "text", text: "🤖 การประเมินจาก AI", weight: "bold", size: "md", color: "#1F2937"},
              {
                type: "text",
                text: aiAssessment || "กำลังประเมินทักษะ...",
                size: "sm",
                color: "#4B5563",
                wrap: true,
                margin: "sm",
              },
            ],
            margin: "lg",
          },

          // Adapt History
          ...(session.adaptHistory && session.adaptHistory.length > 0 ? [
            {type: "separator", margin: "lg", color: "#E5E7EB"},
            {
              type: "box",
              layout: "vertical",
              contents: [
                {type: "text", text: "📈 ประวัติการปรับระดับ", weight: "bold", size: "sm", color: "#1F2937"},
                ...session.adaptHistory.map((h) => ({
                  type: "text",
                  text: `• ${DIFFICULTY_LEVELS[h.from].icon} → ${DIFFICULTY_LEVELS[h.to].icon} (${(h.accuracy * 100).toFixed(0)}%)`,
                  size: "xs",
                  color: "#6B7280",
                  margin: "xs",
                })),
              ],
              margin: "md",
            },
          ] : []),
        ],
        paddingAll: "20px",
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            action: {
              type: "postback",
              label: "🔄 ทำแบบทดสอบอีกครั้ง",
              data: "action=start_adaptive_quiz",
              displayText: "🔄 ทำแบบทดสอบอีกครั้ง",
            },
            style: "primary",
            color: skillColor,
            height: "sm",
          },
          {
            type: "button",
            action: {
              type: "message",
              label: "📊 ดูประวัติทั้งหมด",
              text: "/adaptive_history",
            },
            style: "link",
            height: "sm",
            margin: "sm",
          },
        ],
        paddingAll: "15px",
      },
    },
  };
}

// =====================================================
// 📋 ADAPTIVE QUIZ START MENU
// =====================================================

function createAdaptiveQuizStartFlex() {
  return {
    type: "flex",
    altText: "🎯 Adaptive Quiz - ทดสอบทักษะแบบปรับระดับ",
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {type: "text", text: "🎯 Adaptive Quiz", weight: "bold", size: "xl", color: "#FFFFFF", align: "center"},
          {type: "text", text: "ทดสอบทักษะแบบปรับระดับ", size: "sm", color: "#E0E0E0", align: "center", margin: "sm"},
        ],
        backgroundColor: "#8B5CF6",
        paddingAll: "20px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "ระบบจะปรับระดับคำถามตามความสามารถของคุณอัตโนมัติ",
            size: "sm",
            color: "#4B5563",
            wrap: true,
          },

          {type: "separator", margin: "lg", color: "#E5E7EB"},

          // Difficulty Levels
          {type: "text", text: "📊 ระดับความยาก", weight: "bold", size: "md", color: "#1F2937", margin: "md"},

          ...Object.entries(DIFFICULTY_LEVELS).map(([key, level]) => ({
            type: "box",
            layout: "horizontal",
            contents: [
              {type: "text", text: level.icon, size: "lg", flex: 0},
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {type: "text", text: level.name, weight: "bold", size: "sm", color: "#1F2937"},
                  {type: "text", text: `${level.pointsPerQuestion} แต้ม/ข้อ | ${level.timeLimit}s`, size: "xs", color: "#6B7280"},
                ],
                margin: "md",
              },
            ],
            paddingAll: "10px",
            backgroundColor: "#F9FAFB",
            cornerRadius: "md",
            margin: "sm",
          })),

          {type: "separator", margin: "lg", color: "#E5E7EB"},

          {
            type: "text",
            text: "✨ AI จะวิเคราะห์และประเมินทักษะของคุณเมื่อจบแบบทดสอบ",
            size: "xs",
            color: "#8B5CF6",
            wrap: true,
            align: "center",
            margin: "md",
          },
        ],
        paddingAll: "20px",
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            action: {
              type: "postback",
              label: "🚀 เริ่มทดสอบทักษะ",
              data: "action=start_adaptive_quiz",
              displayText: "🚀 เริ่มทดสอบทักษะ",
            },
            style: "primary",
            color: "#8B5CF6",
            height: "md",
          },
        ],
        paddingAll: "15px",
      },
    },
  };
}

module.exports = {
  createAdaptiveQuestionFlex,
  createDifficultyChangeNotification,
  createAdaptiveSummaryFlex,
  createAdaptiveQuizStartFlex,
};
