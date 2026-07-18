/**
 * 🏭 INJECTION MOLDING LEARNING SYSTEM
 * ระบบเรียนรู้การฉีดพลาสติกแบบครบวงจร
 * 
 * Version: 1.0.0
 * Command: /เรียนรู้การฉีดพลาสติก
 * 
 * Features:
 * - Progressive Learning (ต้องผ่านบทก่อนหน้าก่อน)
 * - 6 Levels, 24 Lessons
 * - Quiz ท้ายบท
 * - Badge & Achievement System
 * - Progress Tracking
 */

const admin = require("firebase-admin");

// =====================================================
// 📚 CURRICULUM STRUCTURE - โครงสร้างหลักสูตร
// =====================================================

const CURRICULUM = {
  // Level 0: เตรียมความพร้อม
  level0: {
    id: 0,
    title: "🎯 Level 0: เตรียมความพร้อม",
    subtitle: "Mindset & Foundation",
    description: "ปรับ Mindset และเรียนรู้พื้นฐานที่จำเป็น",
    color: "#10B981",
    icon: "🌱",
    requiredLevel: null, // ไม่ต้องมี prerequisite
    lessons: [
      {
        id: "L0_1",
        title: "บทที่ 1: Mindset ช่างเทคนิคมืออาชีพ",
        duration: "15 นาที",
        type: "theory",
        unlockCondition: null // บทแรก ไม่ต้องปลดล็อค
      },
      {
        id: "L0_2",
        title: "บทที่ 2: หลัก 6M ในการฉีดพลาสติก",
        duration: "20 นาที",
        type: "theory",
        unlockCondition: "L0_1" // ต้องผ่าน L0_1 ก่อน
      },
      {
        id: "L0_3",
        title: "บทที่ 3: หลัก 3 สิ่งสำคัญ (ความร้อน แรงดัน เวลา)",
        duration: "20 นาที",
        type: "theory",
        unlockCondition: "L0_2"
      },
      {
        id: "L0_4",
        title: "บทที่ 4: ความปลอดภัยในการทำงาน",
        duration: "25 นาที",
        type: "theory",
        unlockCondition: "L0_3"
      }
    ],
    quiz: {
      id: "Q0",
      title: "แบบทดสอบ Level 0",
      passingScore: 70,
      questions: 5
    }
  },

  // Level 1: รู้จักเครื่องจักร
  level1: {
    id: 1,
    title: "🔧 Level 1: รู้จักเครื่องจักร",
    subtitle: "Machine Fundamentals",
    description: "เรียนรู้ส่วนประกอบและการทำงานของเครื่องฉีด",
    color: "#3B82F6",
    icon: "⚙️",
    requiredLevel: 0, // ต้องผ่าน Level 0 ก่อน
    lessons: [
      {
        id: "L1_1",
        title: "บทที่ 5: โครงสร้างเครื่องฉีดพลาสติก",
        duration: "30 นาที",
        type: "theory",
        unlockCondition: "Q0" // ต้องผ่าน Quiz Level 0
      },
      {
        id: "L1_2",
        title: "บทที่ 6: Injection Unit (ชุดฉีด)",
        duration: "25 นาที",
        type: "theory",
        unlockCondition: "L1_1"
      },
      {
        id: "L1_3",
        title: "บทที่ 7: Clamping Unit (ชุดปิด-เปิดแม่พิมพ์)",
        duration: "25 นาที",
        type: "theory",
        unlockCondition: "L1_2"
      },
      {
        id: "L1_4",
        title: "บทที่ 8: หน้าจอควบคุมและปุ่มต่างๆ",
        duration: "30 นาที",
        type: "practice",
        unlockCondition: "L1_3"
      }
    ],
    quiz: {
      id: "Q1",
      title: "แบบทดสอบ Level 1",
      passingScore: 70,
      questions: 5
    }
  },

  // Level 2: ความรู้วัสดุ
  level2: {
    id: 2,
    title: "🧪 Level 2: ความรู้วัสดุ",
    subtitle: "Material Knowledge",
    description: "เรียนรู้คุณสมบัติพลาสติกและการเตรียมวัตถุดิบ",
    color: "#8B5CF6",
    icon: "🔬",
    requiredLevel: 1,
    lessons: [
      {
        id: "L2_1",
        title: "บทที่ 9: ประเภทพลาสติก (Thermoplastic vs Thermoset)",
        duration: "25 นาที",
        type: "theory",
        unlockCondition: "Q1"
      },
      {
        id: "L2_2",
        title: "บทที่ 10: คุณสมบัติพลาสติกที่ใช้บ่อย (PP, ABS, PC, PA)",
        duration: "30 นาที",
        type: "theory",
        unlockCondition: "L2_1"
      },
      {
        id: "L2_3",
        title: "บทที่ 11: การอบเม็ดพลาสติก (Drying)",
        duration: "25 นาที",
        type: "practice",
        unlockCondition: "L2_2"
      },
      {
        id: "L2_4",
        title: "บทที่ 12: อุณหภูมิหลอมและการตั้งค่า Barrel",
        duration: "30 นาที",
        type: "practice",
        unlockCondition: "L2_3"
      }
    ],
    quiz: {
      id: "Q2",
      title: "แบบทดสอบ Level 2",
      passingScore: 70,
      questions: 5
    }
  },

  // Level 3: กระบวนการฉีด
  level3: {
    id: 3,
    title: "💉 Level 3: กระบวนการฉีด",
    subtitle: "Injection Process",
    description: "เรียนรู้ขั้นตอนการฉีดและพารามิเตอร์สำคัญ",
    color: "#F59E0B",
    icon: "🎯",
    requiredLevel: 2,
    lessons: [
      {
        id: "L3_1",
        title: "บทที่ 13: วงจรการฉีด (Injection Cycle)",
        duration: "30 นาที",
        type: "theory",
        unlockCondition: "Q2"
      },
      {
        id: "L3_2",
        title: "บทที่ 14: 4 ระยะการฉีด (Fill, Pack, Hold, Cool)",
        duration: "35 นาที",
        type: "theory",
        unlockCondition: "L3_1"
      },
      {
        id: "L3_3",
        title: "บทที่ 15: V-P Switchover และ Cushion",
        duration: "30 นาที",
        type: "practice",
        unlockCondition: "L3_2"
      },
      {
        id: "L3_4",
        title: "บทที่ 16: การตั้งค่าพารามิเตอร์เบื้องต้น",
        duration: "40 นาที",
        type: "practice",
        unlockCondition: "L3_3"
      }
    ],
    quiz: {
      id: "Q3",
      title: "แบบทดสอบ Level 3",
      passingScore: 70,
      questions: 5
    }
  },

  // Level 4: การแก้ปัญหา
  level4: {
    id: 4,
    title: "🔧 Level 4: การแก้ปัญหา",
    subtitle: "Troubleshooting",
    description: "เรียนรู้การวิเคราะห์และแก้ไขปัญหาชิ้นงาน",
    color: "#EF4444",
    icon: "🛠️",
    requiredLevel: 3,
    lessons: [
      {
        id: "L4_1",
        title: "บทที่ 17: หลักการวิเคราะห์ปัญหาด้วย 6M",
        duration: "25 นาที",
        type: "theory",
        unlockCondition: "Q3"
      },
      {
        id: "L4_2",
        title: "บทที่ 18: ปัญหา Short Shot & Flash",
        duration: "30 นาที",
        type: "practice",
        unlockCondition: "L4_1"
      },
      {
        id: "L4_3",
        title: "บทที่ 19: ปัญหา Sink Mark, Void & Warpage",
        duration: "35 นาที",
        type: "practice",
        unlockCondition: "L4_2"
      },
      {
        id: "L4_4",
        title: "บทที่ 20: ปัญหา Silver Streak, Burn Mark & Jetting",
        duration: "35 นาที",
        type: "practice",
        unlockCondition: "L4_3"
      }
    ],
    quiz: {
      id: "Q4",
      title: "แบบทดสอบ Level 4",
      passingScore: 70,
      questions: 5
    }
  },

  // Level 5: เทคนิคขั้นสูง
  level5: {
    id: 5,
    title: "🏆 Level 5: เทคนิคขั้นสูง",
    subtitle: "Advanced Techniques",
    description: "เทคนิคระดับมืออาชีพและ Scientific Molding",
    color: "#1F2937",
    icon: "⭐",
    requiredLevel: 4,
    lessons: [
      {
        id: "L5_1",
        title: "บทที่ 21: Scientific Molding เบื้องต้น",
        duration: "40 นาที",
        type: "theory",
        unlockCondition: "Q4"
      },
      {
        id: "L5_2",
        title: "บทที่ 22: Decoupled Molding (D-II, D-III)",
        duration: "45 นาที",
        type: "theory",
        unlockCondition: "L5_1"
      },
      {
        id: "L5_3",
        title: "บทที่ 23: Hot Runner System",
        duration: "35 นาที",
        type: "theory",
        unlockCondition: "L5_2"
      },
      {
        id: "L5_4",
        title: "บทที่ 24: Industry 4.0 ในการฉีดพลาสติก",
        duration: "30 นาที",
        type: "theory",
        unlockCondition: "L5_3"
      }
    ],
    quiz: {
      id: "Q5",
      title: "แบบทดสอบ Level 5 (Final)",
      passingScore: 80,
      questions: 10
    }
  }
};

// =====================================================
// 🏅 BADGES & ACHIEVEMENTS - เหรียญรางวัล
// =====================================================

const LEARNING_BADGES = {
  beginner: {
    id: "beginner",
    name: "🌱 ผู้เริ่มต้น",
    description: "เริ่มต้นการเรียนรู้",
    condition: "เข้าเรียนบทแรก"
  },
  level0_complete: {
    id: "level0_complete",
    name: "🎯 Mindset Ready",
    description: "ผ่าน Level 0",
    condition: "ผ่านแบบทดสอบ Level 0"
  },
  level1_complete: {
    id: "level1_complete",
    name: "⚙️ Machine Master",
    description: "ผ่าน Level 1",
    condition: "ผ่านแบบทดสอบ Level 1"
  },
  level2_complete: {
    id: "level2_complete",
    name: "🔬 Material Expert",
    description: "ผ่าน Level 2",
    condition: "ผ่านแบบทดสอบ Level 2"
  },
  level3_complete: {
    id: "level3_complete",
    name: "💉 Process Pro",
    description: "ผ่าน Level 3",
    condition: "ผ่านแบบทดสอบ Level 3"
  },
  level4_complete: {
    id: "level4_complete",
    name: "🛠️ Troubleshooter",
    description: "ผ่าน Level 4",
    condition: "ผ่านแบบทดสอบ Level 4"
  },
  level5_complete: {
    id: "level5_complete",
    name: "⭐ Advanced Technician",
    description: "ผ่าน Level 5",
    condition: "ผ่านแบบทดสอบ Level 5"
  },
  graduate: {
    id: "graduate",
    name: "🏆 Injection Molding Master",
    description: "จบหลักสูตรครบทุก Level",
    condition: "ผ่านทุก Level"
  },
  perfect_score: {
    id: "perfect_score",
    name: "💯 Perfect Score",
    description: "ได้คะแนนเต็มในแบบทดสอบ",
    condition: "ได้ 100% ในแบบทดสอบใดก็ได้"
  },
  fast_learner: {
    id: "fast_learner",
    name: "⚡ Fast Learner",
    description: "เรียนจบภายใน 7 วัน",
    condition: "จบหลักสูตรภายใน 7 วัน"
  }
};

// =====================================================
// 📊 PROGRESS TRACKING - ติดตามความก้าวหน้า
// =====================================================

/**
 * โครงสร้างข้อมูล Progress ของผู้เรียน
 */
const DEFAULT_PROGRESS = {
  odUserId: "",
  odName: "",
  startedAt: null,
  lastAccessedAt: null,
  currentLevel: 0,
  currentLesson: "L0_1",
  completedLessons: [],
  completedQuizzes: [],
  quizScores: {},
  badges: [],
  totalStudyTime: 0, // นาที
  streakDays: 0,
  lastStudyDate: null
};

/**
 * ดึงข้อมูล Progress ของผู้เรียนจาก Firebase
 */
async function getUserProgress(userId) {
  try {
    const db = admin.firestore();
    const doc = await db.collection("learning_progress").doc(userId).get();
    
    if (doc.exists) {
      return doc.data();
    }
    
    // สร้าง Progress ใหม่
    const newProgress = {
      ...DEFAULT_PROGRESS,
      odUserId: userId,
      startedAt: new Date().toISOString()
    };
    
    await db.collection("learning_progress").doc(userId).set(newProgress);
    return newProgress;
  } catch (error) {
    console.error("Error getting user progress:", error);
    return { ...DEFAULT_PROGRESS, odUserId: userId };
  }
}

/**
 * อัปเดต Progress ของผู้เรียน
 */
async function updateUserProgress(userId, updates) {
  try {
    const db = admin.firestore();
    await db.collection("learning_progress").doc(userId).update({
      ...updates,
      lastAccessedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error("Error updating user progress:", error);
    return false;
  }
}

/**
 * เช็คว่าบทเรียนถูกปลดล็อคหรือยัง
 */
function isLessonUnlocked(lessonId, progress) {
  // บทแรก (L0_1) ปลดล็อคเสมอ
  if (lessonId === "L0_1") return true;
  
  // ค้นหาบทเรียนและเงื่อนไข
  for (const levelKey of Object.keys(CURRICULUM)) {
    const level = CURRICULUM[levelKey];
    const lesson = level.lessons.find(l => l.id === lessonId);
    
    if (lesson) {
      if (!lesson.unlockCondition) return true;
      
      // เช็คว่าผ่านเงื่อนไขหรือยัง
      if (lesson.unlockCondition.startsWith("Q")) {
        // ต้องผ่าน Quiz
        return progress.completedQuizzes.includes(lesson.unlockCondition);
      } else {
        // ต้องผ่านบทเรียนก่อนหน้า
        return progress.completedLessons.includes(lesson.unlockCondition);
      }
    }
  }
  
  return false;
}

/**
 * เช็คว่า Level ถูกปลดล็อคหรือยัง
 */
function isLevelUnlocked(levelId, progress) {
  const level = CURRICULUM[`level${levelId}`];
  if (!level) return false;
  
  // Level 0 ปลดล็อคเสมอ
  if (level.requiredLevel === null) return true;
  
  // เช็คว่าผ่าน Quiz ของ Level ก่อนหน้า
  const prevQuizId = `Q${level.requiredLevel}`;
  return progress.completedQuizzes.includes(prevQuizId);
}

/**
 * คำนวณ % ความก้าวหน้าของ Level
 */
function getLevelProgress(levelId, progress) {
  const level = CURRICULUM[`level${levelId}`];
  if (!level) return 0;
  
  const totalLessons = level.lessons.length + 1; // รวม Quiz
  let completed = 0;
  
  level.lessons.forEach(lesson => {
    if (progress.completedLessons.includes(lesson.id)) {
      completed++;
    }
  });
  
  if (progress.completedQuizzes.includes(level.quiz.id)) {
    completed++;
  }
  
  return Math.round((completed / totalLessons) * 100);
}

/**
 * คำนวณ % ความก้าวหน้ารวม
 */
function getOverallProgress(progress) {
  const totalItems = Object.values(CURRICULUM).reduce((sum, level) => {
    return sum + level.lessons.length + 1; // +1 for quiz
  }, 0);
  
  const completed = progress.completedLessons.length + progress.completedQuizzes.length;
  
  return Math.round((completed / totalItems) * 100);
}

// =====================================================
// 🎨 FLEX MESSAGE TEMPLATES
// =====================================================

/**
 * สร้าง Flex Message เมนูหลัก
 */
function createMainMenuFlex(progress) {
  const overallProgress = getOverallProgress(progress);
  
  return {
    type: "flex",
    altText: "🏭 Injection Molding Learning - เรียนรู้การฉีดพลาสติก",
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {type: "text", text: "🏭 Injection Molding", weight: "bold", size: "xl", color: "#FFFFFF"},
                  {type: "text", text: "Learning System", size: "md", color: "#E0E0E0"}
                ],
                flex: 1
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {type: "text", text: `${overallProgress}%`, weight: "bold", size: "xl", color: "#FFFFFF", align: "end"},
                  {type: "text", text: "สำเร็จ", size: "xs", color: "#E0E0E0", align: "end"}
                ],
                flex: 0
              }
            ]
          },
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "box",
                layout: "vertical",
                contents: [],
                height: "6px",
                backgroundColor: "#FFFFFF40",
                cornerRadius: "3px",
                margin: "md"
              },
              {
                type: "box",
                layout: "vertical",
                contents: [],
                height: "6px",
                backgroundColor: "#FFFFFF",
                cornerRadius: "3px",
                position: "absolute",
                width: `${overallProgress}%`,
                offsetTop: "0px",
                offsetStart: "0px"
              }
            ],
            height: "6px",
            margin: "md"
          }
        ],
        backgroundColor: "#7C3AED",
        paddingAll: "20px"
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {type: "text", text: "📚 เลือกส่วนที่ต้องการ:", weight: "bold", size: "md", color: "#333333"},
          {type: "separator", margin: "md"},
          // ปุ่มเมนู
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "button",
                action: {type: "message", label: "📖 เริ่มเรียน / เรียนต่อ", text: "/iml curriculum"},
                style: "primary",
                color: "#7C3AED",
                height: "sm"
              },
              {
                type: "button",
                action: {type: "message", label: "📊 ดูความก้าวหน้า", text: "/iml progress"},
                style: "secondary",
                height: "sm"
              },
              {
                type: "button",
                action: {type: "message", label: "🏅 เหรียญรางวัล", text: "/iml badges"},
                style: "secondary",
                height: "sm"
              },
              {
                type: "button",
                action: {type: "message", label: "📝 ทำแบบทดสอบ", text: "/iml quiz"},
                style: "secondary",
                height: "sm"
              },
              {
                type: "button",
                action: {type: "message", label: "📖 คู่มือ & FAQ", text: "/iml help"},
                style: "secondary",
                height: "sm"
              }
            ],
            margin: "md",
            spacing: "sm"
          },
          {type: "separator", margin: "lg"},
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {type: "text", text: `🎖️ เหรียญ: ${progress.badges.length}`, size: "xs", color: "#666666", flex: 1},
              {type: "text", text: `📚 บทเรียน: ${progress.completedLessons.length}/24`, size: "xs", color: "#666666", flex: 1, align: "end"}
            ],
            margin: "md"
          }
        ],
        paddingAll: "15px"
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {type: "text", text: "💡 พิมพ์ /เรียนรู้การฉีดพลาสติก เพื่อกลับมาที่นี่", size: "xs", color: "#888888", align: "center", wrap: true}
        ],
        paddingAll: "10px"
      }
    }
  };
}

/**
 * สร้าง Flex Message แสดง Curriculum (6 Levels)
 */
function createCurriculumFlex(progress) {
  const levelBubbles = Object.keys(CURRICULUM).map(levelKey => {
    const level = CURRICULUM[levelKey];
    const isUnlocked = isLevelUnlocked(level.id, progress);
    const levelProgress = getLevelProgress(level.id, progress);
    const isCompleted = progress.completedQuizzes.includes(level.quiz.id);
    
    let statusIcon, statusText;
    if (isCompleted) {
      statusIcon = "✅";
      statusText = "เรียนจบแล้ว";
    } else if (isUnlocked) {
      statusIcon = "📖";
      statusText = "กำลังเรียน";
    } else {
      statusIcon = "🔒";
      statusText = "ยังไม่ปลดล็อค";
    }
    
    return {
      type: "bubble",
      size: "kilo",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {type: "text", text: level.icon, size: "xl", flex: 0},
              {type: "text", text: `Level ${level.id}`, weight: "bold", size: "md", color: "#FFFFFF", margin: "sm"}
            ]
          },
          {type: "text", text: level.subtitle, size: "xs", color: "#E0E0E0"}
        ],
        backgroundColor: isUnlocked ? level.color : "#9CA3AF",
        paddingAll: "15px"
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {type: "text", text: level.title.replace(/^[^\s]+\s/, ''), weight: "bold", size: "sm", wrap: true, color: "#333333"},
          {type: "text", text: level.description, size: "xs", color: "#666666", wrap: true, margin: "sm"},
          {type: "separator", margin: "md"},
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {type: "text", text: `${statusIcon} ${statusText}`, size: "xs", color: isCompleted ? "#10B981" : "#666666"},
              {type: "text", text: `${levelProgress}%`, size: "xs", color: "#666666", align: "end"}
            ],
            margin: "md"
          },
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "box",
                layout: "vertical",
                contents: [],
                height: "4px",
                backgroundColor: "#E0E0E0",
                cornerRadius: "2px"
              },
              {
                type: "box",
                layout: "vertical",
                contents: [],
                height: "4px",
                backgroundColor: level.color,
                cornerRadius: "2px",
                position: "absolute",
                width: `${levelProgress}%`
              }
            ],
            height: "4px",
            margin: "sm"
          },
          {type: "text", text: `📚 ${level.lessons.length} บทเรียน`, size: "xs", color: "#888888", margin: "md"}
        ],
        paddingAll: "12px"
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            action: {
              type: "message",
              label: isUnlocked ? "▶️ เข้าเรียน" : "🔒 ล็อคอยู่",
              text: isUnlocked ? `/iml level ${level.id}` : `/iml locked ${level.id}`
            },
            style: isUnlocked ? "primary" : "secondary",
            color: isUnlocked ? level.color : "#9CA3AF",
            height: "sm"
          }
        ],
        paddingAll: "10px"
      }
    };
  });
  
  return {
    type: "flex",
    altText: "📚 หลักสูตร Injection Molding Learning",
    contents: {
      type: "carousel",
      contents: levelBubbles
    }
  };
}

/**
 * สร้าง Flex Message แสดงบทเรียนใน Level
 */
function createLevelDetailFlex(levelId, progress) {
  const level = CURRICULUM[`level${levelId}`];
  if (!level) return null;
  
  const isLevelUnlockedStatus = isLevelUnlocked(levelId, progress);
  
  const lessonRows = level.lessons.map(lesson => {
    const isUnlocked = isLessonUnlocked(lesson.id, progress);
    const isCompleted = progress.completedLessons.includes(lesson.id);
    
    let icon;
    if (isCompleted) icon = "✅";
    else if (isUnlocked) icon = "📖";
    else icon = "🔒";
    
    return {
      type: "box",
      layout: "horizontal",
      contents: [
        {type: "text", text: icon, size: "sm", flex: 0},
        {
          type: "box",
          layout: "vertical",
          contents: [
            {type: "text", text: lesson.title, size: "xs", color: isUnlocked ? "#333333" : "#9CA3AF", wrap: true},
            {type: "text", text: `⏱️ ${lesson.duration} | ${lesson.type === 'practice' ? '🔧 ปฏิบัติ' : '📖 ทฤษฎี'}`, size: "xxs", color: "#888888"}
          ],
          margin: "sm",
          flex: 1
        },
        {
          type: "button",
          action: {
            type: "message",
            label: isCompleted ? "ทบทวน" : (isUnlocked ? "เรียน" : "🔒"),
            text: isUnlocked ? `/iml lesson ${lesson.id}` : `/iml locked lesson ${lesson.id}`
          },
          style: "secondary",
          height: "sm",
          flex: 0,
          gravity: "center"
        }
      ],
      margin: "md",
      paddingAll: "5px",
      backgroundColor: isCompleted ? "#F0FDF4" : (isUnlocked ? "#FFFFFF" : "#F3F4F6"),
      cornerRadius: "8px"
    };
  });
  
  // เพิ่ม Quiz
  const isQuizUnlocked = level.lessons.every(l => progress.completedLessons.includes(l.id));
  const isQuizCompleted = progress.completedQuizzes.includes(level.quiz.id);
  const quizScore = progress.quizScores[level.quiz.id];
  
  lessonRows.push({
    type: "separator",
    margin: "lg"
  });
  
  lessonRows.push({
    type: "box",
    layout: "horizontal",
    contents: [
      {type: "text", text: isQuizCompleted ? "✅" : (isQuizUnlocked ? "📝" : "🔒"), size: "sm", flex: 0},
      {
        type: "box",
        layout: "vertical",
        contents: [
          {type: "text", text: level.quiz.title, size: "xs", color: isQuizUnlocked ? "#7C3AED" : "#9CA3AF", weight: "bold"},
          {type: "text", text: quizScore ? `คะแนน: ${quizScore}%` : `ผ่าน ${level.quiz.passingScore}% | ${level.quiz.questions} ข้อ`, size: "xxs", color: "#888888"}
        ],
        margin: "sm",
        flex: 1
      },
      {
        type: "button",
        action: {
          type: "message",
          label: isQuizCompleted ? "ทำใหม่" : (isQuizUnlocked ? "ทำข้อสอบ" : "🔒"),
          text: isQuizUnlocked ? `/iml startquiz ${level.quiz.id}` : `/iml locked quiz`
        },
        style: isQuizUnlocked ? "primary" : "secondary",
        color: isQuizUnlocked ? "#7C3AED" : "#9CA3AF",
        height: "sm",
        flex: 0
      }
    ],
    margin: "md",
    paddingAll: "5px",
    backgroundColor: isQuizCompleted ? "#F5F3FF" : "#FFFFFF",
    cornerRadius: "8px"
  });
  
  return {
    type: "flex",
    altText: `📚 ${level.title}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {type: "text", text: level.icon, size: "xxl", flex: 0},
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {type: "text", text: level.title, weight: "bold", size: "lg", color: "#FFFFFF", wrap: true},
                  {type: "text", text: level.subtitle, size: "xs", color: "#E0E0E0"}
                ],
                margin: "md"
              }
            ]
          }
        ],
        backgroundColor: level.color,
        paddingAll: "20px"
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {type: "text", text: level.description, size: "sm", color: "#666666", wrap: true},
          {type: "separator", margin: "md"},
          {type: "text", text: "📚 บทเรียน:", weight: "bold", size: "sm", margin: "md"},
          ...lessonRows
        ],
        paddingAll: "15px"
      },
      footer: {
        type: "box",
        layout: "horizontal",
        contents: [
          {
            type: "button",
            action: {type: "message", label: "◀️ กลับ", text: "/iml curriculum"},
            style: "secondary",
            height: "sm",
            flex: 1
          },
          {
            type: "button",
            action: {type: "message", label: "🏠 เมนูหลัก", text: "/เรียนรู้การฉีดพลาสติก"},
            style: "secondary",
            height: "sm",
            flex: 1
          }
        ],
        spacing: "sm",
        paddingAll: "10px"
      }
    }
  };
}

/**
 * สร้าง Flex Message แสดงความก้าวหน้า
 */
function createProgressFlex(progress) {
  const overallProgress = getOverallProgress(progress);
  
  const levelProgressRows = Object.keys(CURRICULUM).map(levelKey => {
    const level = CURRICULUM[levelKey];
    const levelProgress = getLevelProgress(level.id, progress);
    const isCompleted = progress.completedQuizzes.includes(level.quiz.id);
    
    return {
      type: "box",
      layout: "horizontal",
      contents: [
        {type: "text", text: level.icon, size: "sm", flex: 0},
        {type: "text", text: `Level ${level.id}`, size: "xs", color: "#333333", flex: 1, margin: "sm"},
        {type: "text", text: isCompleted ? "✅" : `${levelProgress}%`, size: "xs", color: isCompleted ? "#10B981" : "#666666", align: "end", flex: 0}
      ],
      margin: "sm"
    };
  });
  
  return {
    type: "flex",
    altText: "📊 ความก้าวหน้าของคุณ",
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {type: "text", text: "📊 ความก้าวหน้าของคุณ", weight: "bold", size: "xl", color: "#FFFFFF"},
          {type: "text", text: "Injection Molding Learning", size: "xs", color: "#E0E0E0"}
        ],
        backgroundColor: "#7C3AED",
        paddingAll: "20px"
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          // Overall Progress
          {
            type: "box",
            layout: "vertical",
            contents: [
              {type: "text", text: `${overallProgress}%`, weight: "bold", size: "4xl", color: "#7C3AED", align: "center"},
              {type: "text", text: "ความก้าวหน้ารวม", size: "sm", color: "#666666", align: "center"}
            ],
            paddingAll: "15px",
            backgroundColor: "#F5F3FF",
            cornerRadius: "12px"
          },
          {type: "separator", margin: "lg"},
          // Stats
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {type: "text", text: `${progress.completedLessons.length}`, weight: "bold", size: "xl", color: "#333333", align: "center"},
                  {type: "text", text: "บทเรียน", size: "xs", color: "#666666", align: "center"}
                ],
                flex: 1
              },
              {type: "separator"},
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {type: "text", text: `${progress.completedQuizzes.length}`, weight: "bold", size: "xl", color: "#333333", align: "center"},
                  {type: "text", text: "แบบทดสอบ", size: "xs", color: "#666666", align: "center"}
                ],
                flex: 1
              },
              {type: "separator"},
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {type: "text", text: `${progress.badges.length}`, weight: "bold", size: "xl", color: "#333333", align: "center"},
                  {type: "text", text: "เหรียญ", size: "xs", color: "#666666", align: "center"}
                ],
                flex: 1
              }
            ],
            margin: "lg",
            paddingAll: "10px"
          },
          {type: "separator", margin: "lg"},
          // Level Progress
          {type: "text", text: "📚 ความก้าวหน้าแต่ละ Level:", weight: "bold", size: "sm", margin: "md"},
          ...levelProgressRows
        ],
        paddingAll: "15px"
      },
      footer: {
        type: "box",
        layout: "horizontal",
        contents: [
          {
            type: "button",
            action: {type: "message", label: "📖 เรียนต่อ", text: "/iml curriculum"},
            style: "primary",
            color: "#7C3AED",
            height: "sm",
            flex: 1
          },
          {
            type: "button",
            action: {type: "message", label: "🏠 เมนู", text: "/เรียนรู้การฉีดพลาสติก"},
            style: "secondary",
            height: "sm",
            flex: 1
          }
        ],
        spacing: "sm",
        paddingAll: "10px"
      }
    }
  };
}

/**
 * สร้าง Flex Message แสดงเหรียญรางวัล
 */
function createBadgesFlex(progress) {
  const earnedBadges = progress.badges || [];
  
  const badgeRows = Object.entries(LEARNING_BADGES).map(([key, badge]) => {
    const isEarned = earnedBadges.includes(key);
    
    return {
      type: "box",
      layout: "horizontal",
      contents: [
        {type: "text", text: isEarned ? badge.name : "🔒", size: "md", flex: 0, color: isEarned ? "#333333" : "#9CA3AF"},
        {
          type: "box",
          layout: "vertical",
          contents: [
            {type: "text", text: badge.description, size: "xs", color: isEarned ? "#333333" : "#9CA3AF"},
            {type: "text", text: badge.condition, size: "xxs", color: "#888888"}
          ],
          margin: "md",
          flex: 1
        }
      ],
      margin: "md",
      paddingAll: "8px",
      backgroundColor: isEarned ? "#FEF3C7" : "#F3F4F6",
      cornerRadius: "8px"
    };
  });
  
  return {
    type: "flex",
    altText: "🏅 เหรียญรางวัลของคุณ",
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {type: "text", text: "🏅 เหรียญรางวัล", weight: "bold", size: "xl", color: "#FFFFFF"},
          {type: "text", text: `ได้รับ ${earnedBadges.length}/${Object.keys(LEARNING_BADGES).length} เหรียญ`, size: "xs", color: "#E0E0E0"}
        ],
        backgroundColor: "#F59E0B",
        paddingAll: "20px"
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: badgeRows,
        paddingAll: "15px"
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            action: {type: "message", label: "🏠 กลับเมนูหลัก", text: "/เรียนรู้การฉีดพลาสติก"},
            style: "secondary",
            height: "sm"
          }
        ],
        paddingAll: "10px"
      }
    }
  };
}

/**
 * สร้าง Flex Message แจ้งเตือนว่าบท/Level ยังไม่ปลดล็อค
 */
function createLockedMessageFlex(type, id, progress) {
  let title, description, requirement;
  
  if (type === 'level') {
    const level = CURRICULUM[`level${id}`];
    title = `🔒 ${level.title}`;
    description = level.description;
    requirement = `ต้องผ่านแบบทดสอบ Level ${level.requiredLevel} ก่อน`;
  } else {
    // lesson
    title = `🔒 บทเรียนยังไม่ปลดล็อค`;
    description = "คุณต้องเรียนบทก่อนหน้าให้จบก่อน";
    requirement = "เรียนตามลำดับเพื่อปลดล็อค";
  }
  
  return {
    type: "flex",
    altText: title,
    contents: {
      type: "bubble",
      size: "kilo",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {type: "text", text: title, weight: "bold", size: "lg", color: "#FFFFFF", wrap: true}
        ],
        backgroundColor: "#9CA3AF",
        paddingAll: "15px"
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {type: "text", text: "⚠️ ยังไม่ปลดล็อค", weight: "bold", size: "md", color: "#EF4444", align: "center"},
          {type: "separator", margin: "md"},
          {type: "text", text: description, size: "sm", color: "#666666", wrap: true, margin: "md"},
          {
            type: "box",
            layout: "vertical",
            contents: [
              {type: "text", text: "📋 เงื่อนไข:", weight: "bold", size: "xs", color: "#333333"},
              {type: "text", text: requirement, size: "xs", color: "#666666", wrap: true}
            ],
            margin: "md",
            backgroundColor: "#FEF3C7",
            cornerRadius: "8px",
            paddingAll: "10px"
          }
        ],
        paddingAll: "15px"
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            action: {type: "message", label: "📖 ไปเรียนต่อ", text: "/iml curriculum"},
            style: "primary",
            color: "#7C3AED",
            height: "sm"
          }
        ],
        paddingAll: "10px"
      }
    }
  };
}

/**
 * สร้าง Flex Message คู่มือ/FAQ
 */
function createHelpFlex() {
  return {
    type: "flex",
    altText: "📖 คู่มือการใช้งาน",
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {type: "text", text: "📖 คู่มือการใช้งาน", weight: "bold", size: "xl", color: "#FFFFFF"},
          {type: "text", text: "Injection Molding Learning", size: "xs", color: "#E0E0E0"}
        ],
        backgroundColor: "#3B82F6",
        paddingAll: "20px"
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {type: "text", text: "🎯 วิธีการเรียน:", weight: "bold", size: "md", color: "#333333"},
          {type: "text", text: "1. เริ่มจาก Level 0 (Mindset)\n2. เรียนทุกบทในแต่ละ Level\n3. ทำแบบทดสอบให้ผ่าน 70%\n4. ปลดล็อค Level ถัดไป", size: "sm", color: "#666666", wrap: true, margin: "sm"},
          {type: "separator", margin: "lg"},
          {type: "text", text: "⌨️ คำสั่งที่ใช้ได้:", weight: "bold", size: "md", color: "#333333", margin: "md"},
          {type: "text", text: "/เรียนรู้การฉีดพลาสติก - เมนูหลัก\n/iml curriculum - ดูหลักสูตร\n/iml progress - ดูความก้าวหน้า\n/iml badges - ดูเหรียญรางวัล\n/iml level [0-5] - เข้า Level\n/iml quiz - ทำแบบทดสอบ", size: "xs", color: "#666666", wrap: true, margin: "sm"},
          {type: "separator", margin: "lg"},
          {type: "text", text: "❓ FAQ:", weight: "bold", size: "md", color: "#333333", margin: "md"},
          {type: "text", text: "Q: ทำไมข้ามบทไม่ได้?\nA: ระบบออกแบบให้เรียนตามลำดับ เพื่อให้เข้าใจพื้นฐานก่อน\n\nQ: สอบไม่ผ่านทำอย่างไร?\nA: กลับไปทบทวนบทเรียนแล้วสอบใหม่ได้", size: "xs", color: "#666666", wrap: true, margin: "sm"}
        ],
        paddingAll: "15px"
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            action: {type: "message", label: "🏠 กลับเมนูหลัก", text: "/เรียนรู้การฉีดพลาสติก"},
            style: "secondary",
            height: "sm"
          }
        ],
        paddingAll: "10px"
      }
    }
  };
}

// =====================================================
// 🎮 COMMAND HANDLER - จัดการคำสั่ง
// =====================================================

// =====================================================
// 📚 LESSON CONTENT DATABASE - เนื้อหาบทเรียน
// =====================================================

const LESSON_CONTENT = {
  // Level 0 - Mindset & Foundation
  L0_1: {
    title: "บทที่ 1: Mindset ช่างเทคนิคมืออาชีพ",
    icon: "🎯",
    color: "#10B981",
    duration: "15 นาที",
    objectives: [
      "เข้าใจบทบาทของช่างเทคนิคมืออาชีพ",
      "พัฒนาทัศนคติที่ดีต่อการเรียนรู้",
      "เข้าใจหลักความปลอดภัยเบื้องต้น"
    ],
    content: `🎯 **Mindset ช่างเทคนิคมืออาชีพ**

ช่างเทคนิคมืออาชีพไม่ใช่แค่คนที่ทำงานได้ แต่เป็นคนที่:

**1. มีความรับผิดชอบ**
• รับผิดชอบต่อคุณภาพงาน
• รับผิดชอบต่อความปลอดภัย
• รับผิดชอบต่อเวลา

**2. เรียนรู้ไม่หยุด**
• ถามเมื่อไม่รู้
• สังเกตและจดจำ
• ทดลองและปรับปรุง

**3. ทำงานเป็นระบบ**
• วางแผนก่อนลงมือ
• ทำตามขั้นตอน
• ตรวจสอบผลลัพธ์

**4. รักษาความปลอดภัย**
• สวมอุปกรณ์ป้องกัน
• ปฏิบัติตามกฎความปลอดภัย
• รายงานอันตรายทันที`,
    keyPoints: [
      "ช่างมืออาชีพ = ความรับผิดชอบ + เรียนรู้ต่อเนื่อง",
      "ความปลอดภัยมาก่อนเสมอ",
      "ถามเมื่อไม่รู้ ไม่ใช่ความผิด"
    ],
    nextLesson: "L0_2"
  },
  
  L0_2: {
    title: "บทที่ 2: หลัก 6M ในการฉีดพลาสติก",
    icon: "⚙️",
    color: "#10B981",
    duration: "20 นาที",
    objectives: [
      "เข้าใจองค์ประกอบ 6M",
      "รู้ความสำคัญของแต่ละ M",
      "เชื่อมโยง 6M กับคุณภาพชิ้นงาน"
    ],
    content: `⚙️ **หลัก 6M ในการฉีดพลาสติก**

6M คือปัจจัยหลักที่ส่งผลต่อคุณภาพการฉีด:

**1. Material (วัตถุดิบ) 🧪**
• ชนิดพลาสติก (PP, ABS, PC, PA...)
• ความชื้น, Lot การผลิต
• การเก็บรักษา

**2. Machine (เครื่องจักร) 🏭**
• ขนาดเครื่อง (Tonnage)
• ระบบ Hydraulic / Electric
• สภาพเครื่อง, การบำรุงรักษา

**3. Mold (แม่พิมพ์) 🔧**
• จำนวน Cavity
• ระบบ Runner (Cold/Hot)
• ระบบหล่อเย็น

**4. Method (วิธีการ) 📋**
• พารามิเตอร์การฉีด
• ขั้นตอนการทำงาน
• มาตรฐานการปฏิบัติงาน

**5. Man (บุคลากร) 👷**
• ทักษะ, ความชำนาญ
• ความรู้, การอบรม
• ทัศนคติ, ความรับผิดชอบ

**6. Management (การจัดการ) 📊**
• การวางแผนการผลิต
• การควบคุมคุณภาพ
• การบำรุงรักษา`,
    keyPoints: [
      "6M = Material, Machine, Mold, Method, Man, Management",
      "ปัญหาส่วนใหญ่เกิดจาก Material และ Method",
      "ต้องวิเคราะห์ทั้ง 6M เมื่อเกิดปัญหา"
    ],
    nextLesson: "L0_3"
  },
  
  L0_3: {
    title: "บทที่ 3: หลัก 3 สิ่งสำคัญ",
    icon: "🔥",
    color: "#10B981",
    duration: "20 นาที",
    objectives: [
      "เข้าใจหลัก 3 สิ่งสำคัญ",
      "รู้ความสัมพันธ์ระหว่าง Heat, Pressure, Time",
      "นำไปประยุกต์ใช้กับการตั้งค่า"
    ],
    content: `🔥 **หลัก 3 สิ่งสำคัญในการฉีดพลาสติก**

การฉีดพลาสติกต้องควบคุม 3 สิ่งนี้:

**1. ความร้อน (Heat) 🌡️**
• หลอมพลาสติกให้ไหลได้
• แต่ละพลาสติกต้องการอุณหภูมิต่างกัน
• ตั้ง Barrel Temp, Mold Temp

**2. แรงดัน (Pressure) 💪**
• ดันพลาสติกเข้าแม่พิมพ์
• อัดพลาสติกให้แน่น
• Injection Pressure, Holding Pressure

**3. เวลา (Time) ⏱️**
• ควบคุมแต่ละขั้นตอน
• Injection Time, Cooling Time
• Cycle Time รวม

**ความสัมพันธ์:**
• ความร้อน↑ = พลาสติกไหลง่าย = แรงดัน↓
• ความร้อน↓ = พลาสติกไหลยาก = แรงดัน↑
• เวลาเย็น↑ = ชิ้นงานแข็งตัวดี = Cycle Time↑`,
    keyPoints: [
      "3 สิ่งสำคัญ = Heat + Pressure + Time",
      "ทั้ง 3 สัมพันธ์กัน เปลี่ยนอันหนึ่งมีผลต่ออีกอัน",
      "ต้องหาจุดสมดุลที่เหมาะสม"
    ],
    nextLesson: "L0_4"
  },
  
  L0_4: {
    title: "บทที่ 4: ความปลอดภัยในการทำงาน",
    icon: "⚠️",
    color: "#10B981",
    duration: "25 นาที",
    objectives: [
      "รู้อันตรายในงานฉีดพลาสติก",
      "ปฏิบัติตามกฎความปลอดภัย",
      "ใช้อุปกรณ์ป้องกันได้ถูกต้อง"
    ],
    content: `⚠️ **ความปลอดภัยในการทำงานฉีดพลาสติก**

**อันตรายที่พบบ่อย:**

🔥 **1. ความร้อน**
• Barrel อุณหภูมิ 180-300°C
• พลาสติกหลอมเหลวร้อนมาก
• ✅ ห้ามสัมผัสโดยตรง, สวมถุงมือกันความร้อน

⚡ **2. ไฟฟ้า**
• แรงดันไฟฟ้าสูง
• ✅ ตรวจสอบสายไฟ, ห้ามสัมผัสมือเปียก

💪 **3. แรงกดแม่พิมพ์**
• แรงปิด 50-3000 ตัน!
• ✅ ห้ามเข้าใกล้ขณะเครื่องทำงาน
• ✅ ใช้ Safety Gate ทุกครั้ง

🧪 **4. สารเคมี**
• ควันจากพลาสติก
• ✅ ระบายอากาศดี, สวมหน้ากาก

**อุปกรณ์ป้องกันส่วนบุคคล (PPE):**
• 👓 แว่นตานิรภัย
• 🧤 ถุงมือกันความร้อน
• 👷 หมวกนิรภัย
• 👟 รองเท้านิรภัย
• 👂 ที่อุดหู (ถ้าเสียงดัง)`,
    keyPoints: [
      "Safety First! ความปลอดภัยมาก่อนเสมอ",
      "สวม PPE ทุกครั้งที่ทำงาน",
      "ห้ามเข้าใกล้แม่พิมพ์ขณะเครื่องทำงาน"
    ],
    nextLesson: null // จบ Level 0
  },
  
  // Level 1 - Machine Fundamentals
  L1_1: {
    title: "บทที่ 5: โครงสร้างเครื่องฉีดพลาสติก",
    icon: "🏭",
    color: "#3B82F6",
    duration: "30 นาที",
    objectives: [
      "รู้จักส่วนประกอบหลักของเครื่องฉีด",
      "เข้าใจหน้าที่ของแต่ละส่วน",
      "บอกชื่อชิ้นส่วนได้"
    ],
    content: `🏭 **โครงสร้างเครื่องฉีดพลาสติก**

เครื่องฉีดพลาสติกมี **3 ส่วนหลัก**:

**1. Injection Unit (ชุดฉีด) 💉**
• Hopper - ถังเก็บเม็ดพลาสติก
• Barrel - กระบอกฉีด มี Heater รอบ
• Screw - สกรูหมุนและดันพลาสติก
• Nozzle - หัวฉีด ต่อเข้าแม่พิมพ์

**2. Clamping Unit (ชุดปิด-เปิดแม่พิมพ์) 🔒**
• Fixed Platen - แผ่นยึดแม่พิมพ์ด้านหัวฉีด
• Moving Platen - แผ่นยึดแม่พิมพ์ด้านเคลื่อนที่
• Tie Bar - แกนยึด 4 แกน
• Clamping Mechanism - กลไกปิด-เปิด (Toggle/Hydraulic)
• Ejector - ระบบดีดชิ้นงาน

**3. Base Unit (ฐานเครื่อง) 🏗️**
• Control Panel - หน้าจอควบคุม
• Hydraulic Unit - ระบบไฮดรอลิก
• Cooling System - ระบบหล่อเย็น
• Electrical Cabinet - ตู้ไฟฟ้า`,
    keyPoints: [
      "เครื่องฉีดมี 3 ส่วน: Injection Unit, Clamping Unit, Base Unit",
      "Injection Unit = หลอมและฉีดพลาสติก",
      "Clamping Unit = ปิด-เปิดและยึดแม่พิมพ์"
    ],
    nextLesson: "L1_2"
  },
  
  L1_2: {
    title: "บทที่ 6: Injection Unit (ชุดฉีด)",
    icon: "💉",
    color: "#3B82F6",
    duration: "25 นาที",
    objectives: [
      "เข้าใจการทำงานของ Injection Unit",
      "รู้จัก Screw และหน้าที่",
      "เข้าใจการหลอมพลาสติก"
    ],
    content: `💉 **Injection Unit - ชุดฉีดพลาสติก**

**ส่วนประกอบหลัก:**

🔹 **Hopper (กรวยเติมเม็ด)**
• เก็บเม็ดพลาสติก
• บางรุ่นมี Dryer ในตัว
• ต้องปิดฝาป้องกันฝุ่น

🔹 **Barrel (กระบอกฉีด)**
• มี Heater Band รอบๆ
• แบ่งเป็น Zone (1, 2, 3, 4, Nozzle)
• ตั้งอุณหภูมิแต่ละ Zone ต่างกัน

🔹 **Screw (สกรู) - หัวใจของ Injection Unit**
แบ่งเป็น 3 ส่วน:
1. **Feed Zone** - รับเม็ดพลาสติก, ร่องลึก
2. **Compression Zone** - อัดและหลอม, ร่องตื้นลง
3. **Metering Zone** - ผสมให้เนียน, ร่องตื้นคงที่

🔹 **Non-Return Valve (Check Ring)**
• อยู่หน้าสกรู
• ป้องกันพลาสติกไหลย้อนกลับขณะฉีด

🔹 **Nozzle (หัวฉีด)**
• ต่อกับ Sprue Bush ของแม่พิมพ์
• ต้องตั้งอุณหภูมิเหมาะสม`,
    keyPoints: [
      "Screw มี 3 Zone: Feed, Compression, Metering",
      "Non-Return Valve ป้องกันพลาสติกไหลย้อน",
      "ต้องตั้ง Temp แต่ละ Zone ตามคุณสมบัติพลาสติก"
    ],
    nextLesson: "L1_3"
  },
  
  L1_3: {
    title: "บทที่ 7: Clamping Unit",
    icon: "🔒",
    color: "#3B82F6",
    duration: "25 นาที",
    objectives: [
      "เข้าใจระบบปิด-เปิดแม่พิมพ์",
      "รู้จัก Toggle และ Hydraulic System",
      "เข้าใจ Clamping Force"
    ],
    content: `🔒 **Clamping Unit - ชุดปิด-เปิดแม่พิมพ์**

**หน้าที่หลัก:**
• ปิด-เปิดแม่พิมพ์
• ยึดแม่พิมพ์ให้แน่นขณะฉีด
• ดีดชิ้นงานออก

**ระบบ Clamping มี 2 แบบ:**

🔹 **Toggle System (ระบบข้อศอก)**
• ใช้คานงัดเพิ่มแรง
• ประหยัดพลังงาน
• ความเร็วสูง
• ต้องปรับ Mold Height

🔹 **Hydraulic System (ระบบไฮดรอลิก)**
• ใช้กระบอกไฮดรอลิกโดยตรง
• ปรับแรงได้ง่าย
• เหมาะกับแม่พิมพ์หลายขนาด

**Clamping Force (แรงปิดแม่พิมพ์)**
• หน่วย: ตัน (Ton)
• ต้องมากกว่าแรงดันขณะฉีด
• สูตร: F = P × A
  - F = แรงปิด (ton)
  - P = แรงดัน cavity (kg/cm²)
  - A = พื้นที่ฉาย (cm²)`,
    keyPoints: [
      "Toggle System ประหยัดพลังงาน เร็วกว่า",
      "Hydraulic System ปรับแรงได้ยืดหยุ่น",
      "Clamping Force ต้องมากกว่าแรงดันในแม่พิมพ์"
    ],
    nextLesson: "L1_4"
  },
  
  L1_4: {
    title: "บทที่ 8: หน้าจอควบคุมและปุ่มต่างๆ",
    icon: "🖥️",
    color: "#3B82F6",
    duration: "30 นาที",
    objectives: [
      "รู้จักหน้าจอควบคุม",
      "ใช้ปุ่มควบคุมได้ถูกต้อง",
      "อ่านค่าบนหน้าจอได้"
    ],
    content: `🖥️ **หน้าจอควบคุมและปุ่มสำคัญ**

**ปุ่มสำคัญที่ต้องรู้:**

🔴 **Emergency Stop**
• หยุดเครื่องทันทีกรณีฉุกเฉิน
• กดแล้วต้องปลดล็อคก่อนเดินเครื่อง

🟢 **Motor On/Off**
• เปิด-ปิดมอเตอร์ไฮดรอลิก
• รอ Oil Warm Up ก่อนทำงาน

🔵 **Mode Selector**
• Manual - ทำทีละขั้นตอน
• Semi-Auto - ฉีดอัตโนมัติ 1 รอบ
• Full Auto - ฉีดต่อเนื่อง

**หน้าจอที่ต้องดู:**

📊 **หน้าจอพารามิเตอร์**
• Injection: Speed, Pressure, Position
• Holding: Pressure, Time
• Cooling: Time
• Temperature: Barrel, Mold

📈 **หน้าจอ Monitor**
• Cycle Time จริง
• Cushion จริง
• Peak Pressure
• Actual Temperature`,
    keyPoints: [
      "Emergency Stop = ปุ่มสำคัญที่สุด!",
      "เลือก Mode ให้เหมาะสมกับงาน",
      "ดู Monitor เพื่อตรวจสอบการทำงานจริง"
    ],
    nextLesson: null // จบ Level 1
  },
  
  // =====================================================
  // 🧪 LEVEL 2: Material Science - ความรู้เรื่องวัสดุ
  // =====================================================
  
  L2_1: {
    title: "บทที่ 9: Thermoplastic vs Thermoset",
    icon: "🧪",
    color: "#8B5CF6",
    duration: "25 นาที",
    objectives: [
      "แยกความแตกต่างได้",
      "เข้าใจคุณสมบัติเฉพาะ",
      "เลือกใช้ได้ถูกประเภท"
    ],
    content: `🧪 **Thermoplastic vs Thermoset**

**Thermoplastic (เทอร์โมพลาสติก)**
• หลอมได้ซ้ำๆ ด้วยความร้อน
• รีไซเคิลได้
• ตัวอย่าง: PP, PE, ABS, PC, POM, PA

**คุณสมบัติ Thermoplastic:**
✅ หลอมละลายเมื่อให้ความร้อน
✅ แข็งตัวเมื่อเย็นลง
✅ ทำซ้ำได้หลายครั้ง
✅ รีไซเคิลง่าย

**Thermoset (เทอร์โมเซ็ต)**
• หลอมได้ครั้งเดียว เกิด Cross-linking
• ไม่สามารถหลอมซ้ำได้
• ตัวอย่าง: Epoxy, Phenolic, Melamine

**คุณสมบัติ Thermoset:**
✅ ทนความร้อนสูงมาก
✅ แข็งแรงกว่า
✅ ไม่หลอมละลายเมื่อร้อน
❌ รีไซเคิลไม่ได้

**การใช้งานในอุตสาหกรรม:**
• Thermoplastic: งาน Injection Molding ทั่วไป
• Thermoset: งานไฟฟ้า, ชิ้นส่วนรถยนต์ทนร้อน`,
    keyPoints: [
      "Thermoplastic หลอมซ้ำได้ รีไซเคิลได้",
      "Thermoset หลอมครั้งเดียว ทนร้อนดีกว่า",
      "งาน Injection ส่วนใหญ่ใช้ Thermoplastic"
    ],
    nextLesson: "L2_2"
  },
  
  L2_2: {
    title: "บทที่ 10: พลาสติกที่นิยมใช้งาน",
    icon: "📦",
    color: "#8B5CF6",
    duration: "30 นาที",
    objectives: [
      "รู้จักพลาสติกยอดนิยม",
      "เข้าใจคุณสมบัติแต่ละชนิด",
      "เลือกใช้งานได้เหมาะสม"
    ],
    content: `📦 **พลาสติกที่นิยมใช้ในการฉีด**

🔹 **PP (Polypropylene)**
• เบา ทนเคมี ราคาถูก
• อุณหภูมิ: 200-260°C
• งาน: กล่อง ฝา บรรจุภัณฑ์

🔹 **ABS (Acrylonitrile Butadiene Styrene)**
• แข็งแรง พ่นสีได้ ชุบโครเมียมได้
• อุณหภูมิ: 220-260°C
• งาน: เครื่องใช้ไฟฟ้า ของเล่น

🔹 **PC (Polycarbonate)**
• ใส ทนแรงกระแทก
• อุณหภูมิ: 280-320°C
• งาน: แว่นตา CD ไฟรถ

🔹 **POM (Polyacetal)**
• แข็ง ทนสึกหรอ Self-lubricating
• อุณหภูมิ: 190-210°C
• งาน: เฟือง บูช ชิ้นส่วนกลไก

🔹 **PA/Nylon**
• ทนสึกหรอ ดูดความชื้น
• อุณหภูมิ: 250-280°C
• งาน: เฟือง บูช Cable Tie

🔹 **PE (Polyethylene)**
• เบา ยืดหยุ่น ทนเคมี
• อุณหภูมิ: 180-220°C
• งาน: ถัง ท่อ ถุง`,
    keyPoints: [
      "PP = ราคาถูก ใช้งานทั่วไป",
      "ABS = พ่นสี/ชุบได้ งานสวยงาม",
      "PC = ใสและแข็งแรง",
      "POM = งานเฟือง งานกลไก",
      "PA = ทนสึกหรอ ต้องอบแห้ง"
    ],
    nextLesson: "L2_3"
  },
  
  L2_3: {
    title: "บทที่ 11: การอบแห้งวัสดุ (Drying)",
    icon: "🌡️",
    color: "#8B5CF6",
    duration: "25 นาที",
    objectives: [
      "รู้ว่าทำไมต้องอบแห้ง",
      "เข้าใจเงื่อนไขการอบ",
      "ป้องกันปัญหาความชื้นได้"
    ],
    content: `🌡️ **การอบแห้งวัสดุ (Material Drying)**

**ทำไมต้องอบแห้ง?**
• ความชื้นทำให้เกิด Splay Mark
• เกิดฟองอากาศในชิ้นงาน
• ลดความแข็งแรง
• ผิวไม่สวย

**วัสดุที่ต้องอบแห้ง (Hygroscopic):**
• PC: 120°C / 4 ชม. / <0.02%
• POM: 80°C / 2-3 ชม. / <0.1%
• PA/Nylon: 80°C / 4-6 ชม. / <0.1%
• ABS: 80°C / 2-4 ชม. / <0.1%
• PET: 150°C / 4-6 ชม. / <0.02%
• PBT: 120°C / 3-4 ชม. / <0.02%

**วัสดุที่ไม่ต้องอบ:**
• PP, PE, PS (แต่ควรอุ่น)

**เครื่องอบแห้ง:**
🔹 Hot Air Dryer - ราคาถูก ใช้ลมร้อน
🔹 Dehumidifier - ดูดความชื้นจากอากาศ
🔹 Vacuum Dryer - อบสุญญากาศ เร็วที่สุด

**หลักการตรวจสอบ:**
• ใช้ Moisture Analyzer
• ค่าความชื้นต้องต่ำกว่าที่กำหนด
• อบต่อเนื่องเมื่อไม่ใช้งาน`,
    keyPoints: [
      "วัสดุ Hygroscopic ต้องอบก่อนฉีดเสมอ",
      "PC, PA, PET ต้องอบอย่างเคร่งครัด",
      "ความชื้นทำให้เกิด Splay และฟอง"
    ],
    nextLesson: "L2_4"
  },
  
  L2_4: {
    title: "บทที่ 12: การผสมสีและ Masterbatch",
    icon: "🎨",
    color: "#8B5CF6",
    duration: "25 นาที",
    objectives: [
      "เข้าใจระบบการผสมสี",
      "รู้จัก Masterbatch",
      "คำนวณอัตราส่วนได้"
    ],
    content: `🎨 **การผสมสีและ Masterbatch**

**ประเภทการผสมสี:**

🔹 **Dry Color (ผงสี)**
• ผงสีผสมกับเม็ดพลาสติกโดยตรง
• ราคาถูก
• กระจายตัวไม่สม่ำเสมอ
• ฝุ่นเยอะ

🔹 **Masterbatch (เม็ดสี)**
• สีเข้มข้นในรูปเม็ดพลาสติก
• กระจายตัวดี สะอาด
• ใช้ 1-4% โดยน้ำหนัก
• นิยมใช้ในอุตสาหกรรม

🔹 **Pre-colored (เม็ดสำเร็จ)**
• เม็ดพลาสติกผสมสีมาแล้ว
• สีสม่ำเสมอที่สุด
• ราคาสูง
• สั่งล็อตใหญ่

**การคำนวณ Masterbatch:**
สูตร: %MB = (น้ำหนัก MB / น้ำหนักรวม) × 100

ตัวอย่าง:
• ต้องการ 2% Masterbatch
• วัสดุหลัก 98 kg
• Masterbatch = 2 kg
• รวม = 100 kg

**เครื่องผสม:**
• Volumetric Blender - ผสมตามปริมาตร
• Gravimetric Blender - ผสมตามน้ำหนัก (แม่นยำกว่า)`,
    keyPoints: [
      "Masterbatch นิยมใช้มากที่สุด",
      "ใช้ 1-4% ขึ้นกับความเข้มสี",
      "Gravimetric Blender แม่นยำกว่า Volumetric"
    ],
    nextLesson: null // จบ Level 2
  },
  
  // =====================================================
  // ⚙️ LEVEL 3: Process Parameters - พารามิเตอร์การฉีด
  // =====================================================
  
  L3_1: {
    title: "บทที่ 13: อุณหภูมิกระบอกและหัวฉีด",
    icon: "🌡️",
    color: "#F59E0B",
    duration: "30 นาที",
    objectives: [
      "เข้าใจโปรไฟล์อุณหภูมิ",
      "ตั้งค่าอุณหภูมิได้ถูกต้อง",
      "แก้ปัญหาอุณหภูมิได้"
    ],
    content: `🌡️ **อุณหภูมิกระบอกและหัวฉีด**

**โปรไฟล์อุณหภูมิ (Temperature Profile):**
• Zone 1 (Feed): ต่ำสุด เพื่อป้อนเม็ด
• Zone 2-3 (Compression): เพิ่มขึ้นเรื่อยๆ
• Zone 4 (Metering): สูงสุด หลอมสมบูรณ์
• Nozzle: สูงหรือเท่า Metering Zone

**หลักการตั้งอุณหภูมิ:**

📈 **Ascending Profile (เพิ่มขึ้น)**
• Feed → Nozzle: ต่ำ → สูง
• เหมาะกับวัสดุทั่วไป
• PP, ABS, PC

📉 **Descending Profile (ลดลง)**
• Feed → Nozzle: สูง → ต่ำ
• เหมาะกับ POM, PA
• ป้องกัน Drooling

**ตัวอย่างอุณหภูมิ:**
| วัสดุ | Zone1 | Zone2 | Zone3 | Nozzle |
|------|-------|-------|-------|--------|
| PP   | 190   | 200   | 210   | 210    |
| ABS  | 200   | 220   | 230   | 230    |
| PC   | 260   | 280   | 290   | 290    |
| POM  | 190   | 185   | 180   | 175    |

**ปัญหาที่เกิดจากอุณหภูมิ:**
• ต่ำเกิน: Short Shot, Flow Mark
• สูงเกิน: Burn Mark, Degradation`,
    keyPoints: [
      "ส่วนใหญ่ใช้ Ascending Profile",
      "POM, PA ใช้ Descending Profile",
      "Nozzle ต้องไม่ต่ำกว่า Melt Temperature"
    ],
    nextLesson: "L3_2"
  },
  
  L3_2: {
    title: "บทที่ 14: Injection Speed & Pressure",
    icon: "💨",
    color: "#F59E0B",
    duration: "30 นาที",
    objectives: [
      "เข้าใจความสัมพันธ์ Speed/Pressure",
      "ตั้งค่า Multi-stage ได้",
      "แก้ปัญหา Filling ได้"
    ],
    content: `💨 **Injection Speed & Pressure**

**Injection Speed (ความเร็วฉีด)**
• ควบคุมการไหลของพลาสติก
• หน่วย: mm/s หรือ cc/s
• มีผลต่อ Shear Rate

**หลักการตั้งความเร็ว:**
🐢 **ความเร็วต่ำ**
• ผิวสวย ลาย Flow Mark น้อย
• ใช้เวลานาน อาจ Short Shot
• เหมาะกับผิวขัดเงา

🐰 **ความเร็วสูง**
• เติมเต็มได้ดี
• อาจเกิด Jetting, Burn Mark
• เหมาะกับชิ้นงานบาง

**Multi-Stage Injection:**
• Stage 1: เร็วผ่าน Runner
• Stage 2: ช้าผ่าน Gate
• Stage 3: เร็วเติม Cavity
• Stage 4: ช้าก่อนจบ

**Injection Pressure:**
• แรงดันที่ใช้ดันพลาสติก
• หน่วย: Bar, MPa, kg/cm²
• Limit Pressure vs Actual Pressure

**V/P Transfer (Switch-over):**
• จุดเปลี่ยนจาก Velocity → Pressure Control
• ตั้งที่ 95-99% ของ Cavity
• ใช้ Position หรือ Pressure`,
    keyPoints: [
      "ความเร็วสูง = เติมเต็มดี แต่อาจเกิด Jetting",
      "Multi-stage ช่วยควบคุมการไหลได้ดี",
      "V/P Transfer สำคัญมาก ตั้งที่ 95-99%"
    ],
    nextLesson: "L3_3"
  },
  
  L3_3: {
    title: "บทที่ 15: Holding Pressure & Time",
    icon: "⏱️",
    color: "#F59E0B",
    duration: "25 นาที",
    objectives: [
      "เข้าใจ Packing Phase",
      "ตั้งค่า Holding ได้ถูกต้อง",
      "แก้ปัญหา Sink Mark ได้"
    ],
    content: `⏱️ **Holding Pressure & Time**

**Holding Pressure (แรงดันคงค้าง)**
• รักษาแรงดันหลังเติมเต็ม
• ชดเชยการหดตัว (Shrinkage)
• ป้องกัน Sink Mark

**หลักการตั้ง Holding:**

📊 **Holding Pressure**
• เริ่มที่ 50-70% ของ Injection Pressure
• ปรับขึ้น-ลงตามผล
• มากเกิน = Flash, เครียดภายใน
• น้อยเกิน = Sink Mark, Void

⏰ **Holding Time**
• เวลาที่คงแรงดัน
• ต้องนานพอให้ Gate แข็ง
• ทำ Gate Seal Study หาค่าที่เหมาะ

**Gate Seal Study:**
1. ตั้ง Holding Time สั้นๆ
2. ชั่งน้ำหนักชิ้นงาน
3. เพิ่มเวลาทีละนิด
4. เมื่อน้ำหนักไม่เพิ่ม = Gate Seal

**Multi-Stage Holding:**
• Stage 1: สูง - ชดเชย Shrinkage
• Stage 2: กลาง - รักษาขนาด
• Stage 3: ต่ำ - ลดเครียด

**ปัญหาจาก Holding:**
• น้อย: Sink Mark, Short Shot
• มาก: Flash, Warpage`,
    keyPoints: [
      "Holding ชดเชยการหดตัวของพลาสติก",
      "ทำ Gate Seal Study หาเวลาที่เหมาะสม",
      "50-70% ของ Injection Pressure เป็นจุดเริ่มต้นที่ดี"
    ],
    nextLesson: "L3_4"
  },
  
  L3_4: {
    title: "บทที่ 16: Cooling Time & Mold Temperature",
    icon: "❄️",
    color: "#F59E0B",
    duration: "30 นาที",
    objectives: [
      "เข้าใจการหล่อเย็น",
      "ตั้งค่า Cooling ได้เหมาะสม",
      "ลด Cycle Time ได้"
    ],
    content: `❄️ **Cooling Time & Mold Temperature**

**ความสำคัญของ Cooling:**
• 60-80% ของ Cycle Time
• กำหนดคุณภาพผิว
• ส่งผลต่อ Warpage

**Mold Temperature:**
• ควบคุมด้วย MTC (Mold Temperature Controller)
• ใช้น้ำหรือน้ำมัน
• อุณหภูมิขึ้นกับวัสดุ

**อุณหภูมิแม่พิมพ์แนะนำ:**
| วัสดุ | อุณหภูมิ |
|------|----------|
| PP   | 20-50°C  |
| ABS  | 40-80°C  |
| PC   | 80-120°C |
| PA   | 40-90°C  |
| POM  | 60-90°C  |

**Cooling Time:**
• ขึ้นกับความหนาชิ้นงาน
• สูตร: t ∝ s² (s = ความหนา)
• หนา 2 เท่า ใช้เวลา 4 เท่า!

**การออกแบบระบบหล่อเย็น:**
• Cooling Channel ใกล้ผิว Cavity
• อุณหภูมิน้ำเข้า-ออก ต่างกัน < 3°C
• Flow Rate เพียงพอ (Turbulent Flow)

**ปัญหาจาก Cooling:**
• ไม่สม่ำเสมอ: Warpage
• เย็นเกิน: ผิวด้าน Stress
• นานเกิน: Cycle Time สูง`,
    keyPoints: [
      "Cooling = 60-80% ของ Cycle Time",
      "ความหนา 2 เท่า ใช้เวลา Cooling 4 เท่า",
      "อุณหภูมิแม่พิมพ์มีผลต่อผิวและ Shrinkage"
    ],
    nextLesson: null // จบ Level 3
  },
  
  // =====================================================
  // 🔍 LEVEL 4: Troubleshooting - การแก้ปัญหา
  // =====================================================
  
  L4_1: {
    title: "บทที่ 17: Short Shot & Flash",
    icon: "🔍",
    color: "#EF4444",
    duration: "30 นาที",
    objectives: [
      "วิเคราะห์สาเหตุได้",
      "แก้ไขปัญหาได้ถูกต้อง",
      "ป้องกันปัญหาได้"
    ],
    content: `🔍 **Short Shot & Flash**

**❌ SHORT SHOT (ชิ้นงานไม่เต็ม)**

📋 **สาเหตุ:**
• พลาสติกไม่พอ (Shot Size น้อย)
• อุณหภูมิต่ำเกิน
• ความเร็ว/แรงดันไม่พอ
• Gate เล็กหรืออุดตัน
• Air Trap

🔧 **การแก้ไข:**
1. เพิ่ม Shot Size
2. เพิ่มอุณหภูมิ Barrel
3. เพิ่ม Injection Speed/Pressure
4. ตรวจสอบ Gate
5. เพิ่มช่อง Venting

---

**❌ FLASH (เกิดครีบ)**

📋 **สาเหตุ:**
• Clamping Force น้อยเกิน
• แรงดันฉีดสูงเกิน
• แม่พิมพ์ไม่แนบสนิท
• แม่พิมพ์สึกหรอ
• อุณหภูมิสูงเกิน

🔧 **การแก้ไข:**
1. เพิ่ม Clamping Force
2. ลด Injection Pressure
3. ลด Holding Pressure
4. ตรวจสอบ Parting Line
5. ลดอุณหภูมิ Barrel/Mold

**เทคนิค:**
• Short Shot: เพิ่มทีละนิด จนเต็มพอดี
• Flash: ลด Pressure จนไม่มีครีบ`,
    keyPoints: [
      "Short Shot = พลาสติกไม่พอ/ไหลไม่ถึง",
      "Flash = แรงดันเกิน/Clamp Force น้อย",
      "ปรับทีละขั้น สังเกตผลลัพธ์"
    ],
    nextLesson: "L4_2"
  },
  
  L4_2: {
    title: "บทที่ 18: Sink Mark & Warpage",
    icon: "📉",
    color: "#EF4444",
    duration: "30 นาที",
    objectives: [
      "เข้าใจกลไกการเกิด",
      "วิเคราะห์สาเหตุได้",
      "แก้ไขและป้องกันได้"
    ],
    content: `📉 **Sink Mark & Warpage**

**❌ SINK MARK (รอยยุบ)**

📋 **ลักษณะ:**
• รอยยุบบนผิวชิ้นงาน
• เกิดบริเวณหนาหรือ Rib

📋 **สาเหตุ:**
• Holding Pressure ไม่พอ
• Holding Time สั้นเกิน
• Gate เล็ก/อุดตันเร็ว
• Cooling ไม่สม่ำเสมอ
• Wall Thickness ไม่สม่ำเสมอ

🔧 **การแก้ไข:**
1. เพิ่ม Holding Pressure
2. เพิ่ม Holding Time
3. ขยาย Gate
4. ลด Mold Temperature
5. ออกแบบ Wall Thickness ให้สม่ำเสมอ

---

**❌ WARPAGE (บิดงอ)**

📋 **ลักษณะ:**
• ชิ้นงานบิด โค้ง ไม่ได้รูป

📋 **สาเหตุ:**
• Cooling ไม่สม่ำเสมอ
• Holding Pressure สูงเกิน
• Ejection เร็วเกิน
• Gate ไม่สมมาตร
• Fiber Orientation

🔧 **การแก้ไข:**
1. ปรับ Cooling ให้สม่ำเสมอ
2. ลด Holding Pressure
3. เพิ่ม Cooling Time
4. ปรับตำแหน่ง Gate
5. ใช้ Fixture หลังถอดชิ้นงาน`,
    keyPoints: [
      "Sink Mark เกิดจากการหดตัวไม่สม่ำเสมอ",
      "Warpage เกิดจาก Cooling ไม่สม่ำเสมอ",
      "Gate Seal Time สำคัญมากสำหรับ Sink Mark"
    ],
    nextLesson: "L4_3"
  },
  
  L4_3: {
    title: "บทที่ 19: Burn Mark & Silver Streak",
    icon: "🔥",
    color: "#EF4444",
    duration: "25 นาที",
    objectives: [
      "วิเคราะห์ปัญหาผิวชิ้นงาน",
      "แยกแยะสาเหตุได้",
      "แก้ไขได้ถูกจุด"
    ],
    content: `🔥 **Burn Mark & Silver Streak**

**❌ BURN MARK (รอยไหม้)**

📋 **ลักษณะ:**
• รอยดำ/น้ำตาลบนชิ้นงาน
• มักเกิดปลายทาง Flow

📋 **สาเหตุ:**
• อากาศถูกบีบอัด (Diesel Effect)
• อุณหภูมิสูงเกิน
• ความเร็วฉีดสูงเกิน
• Venting ไม่ดี

🔧 **การแก้ไข:**
1. เพิ่ม/ทำความสะอาด Venting
2. ลด Injection Speed
3. ลดอุณหภูมิ Barrel
4. ลด Clamping Force เล็กน้อย
5. ปรับตำแหน่ง Gate

---

**❌ SILVER STREAK / SPLAY (เส้นสีเงิน)**

📋 **ลักษณะ:**
• เส้นสีเงินตามทิศทาง Flow
• ผิวไม่เรียบ

📋 **สาเหตุ:**
• ความชื้นในวัสดุ
• อุณหภูมิสูงเกิน (Degradation)
• อากาศเข้าในกระบอก
• Back Pressure ต่ำเกิน

🔧 **การแก้ไข:**
1. อบแห้งวัสดุให้ถูกต้อง!
2. ลดอุณหภูมิ Barrel
3. เพิ่ม Back Pressure
4. ลด Screw Speed
5. ตรวจสอบ Hopper/Feed Throat`,
    keyPoints: [
      "Burn Mark = อากาศถูกบีบอัด + ความร้อน",
      "Silver Streak = ความชื้น หรือ Degradation",
      "อบแห้งวัสดุ = วิธีแก้ Silver ที่ดีที่สุด"
    ],
    nextLesson: "L4_4"
  },
  
  L4_4: {
    title: "บทที่ 20: Flow Mark & Weld Line",
    icon: "〰️",
    color: "#EF4444",
    duration: "25 นาที",
    objectives: [
      "เข้าใจปัญหาการไหล",
      "วิเคราะห์ Weld Line",
      "แก้ไขและป้องกันได้"
    ],
    content: `〰️ **Flow Mark & Weld Line**

**❌ FLOW MARK (ลายไหล)**

📋 **ลักษณะ:**
• ลายวงเป็นชั้นๆ บนผิว
• เหมือนลายนิ้วมือ

📋 **สาเหตุ:**
• Injection Speed ช้าเกิน
• อุณหภูมิต่ำ
• Gate เล็กเกินไป
• Mold Temperature ต่ำ

🔧 **การแก้ไข:**
1. เพิ่ม Injection Speed
2. เพิ่มอุณหภูมิ Barrel
3. เพิ่ม Mold Temperature
4. ขยาย Gate

---

**❌ WELD LINE / KNIT LINE (รอยเชื่อม)**

📋 **ลักษณะ:**
• เส้นบนผิวตรงจุดที่ Flow มาบรรจบ
• จุดอ่อนทางกลไก

📋 **สาเหตุ:**
• Flow หลายทางมาเจอกัน
• รอบรู/ขาภายใน
• หลาย Gate

🔧 **การแก้ไข:**
1. เพิ่มอุณหภูมิ Melt
2. เพิ่มอุณหภูมิ Mold
3. เพิ่ม Injection Speed
4. ปรับตำแหน่ง Gate
5. เพิ่ม Venting ที่จุด Weld

**เทคนิคพิเศษ:**
• ย้าย Weld Line ไปจุดที่ไม่สำคัญ
• ใช้ Overflow Well
• Vacuum Mold Technology`,
    keyPoints: [
      "Flow Mark = ความเร็ว/อุณหภูมิต่ำ",
      "Weld Line = จุดบรรจบของ Flow",
      "ย้าย Weld Line ไปจุดที่ไม่สำคัญ"
    ],
    nextLesson: null // จบ Level 4
  },
  
  // =====================================================
  // 🎓 LEVEL 5: Advanced Techniques - เทคนิคขั้นสูง
  // =====================================================
  
  L5_1: {
    title: "บทที่ 21: Scientific Molding",
    icon: "🔬",
    color: "#1F2937",
    duration: "35 นาที",
    objectives: [
      "เข้าใจหลักการ Scientific Molding",
      "ทำ Process Study ได้",
      "สร้าง Process Window"
    ],
    content: `🔬 **Scientific Molding**

**แนวคิด Scientific Molding:**
• ใช้ข้อมูลและการวิเคราะห์
• ไม่ใช้การเดาหรือประสบการณ์อย่างเดียว
• สร้างกระบวนการที่ทำซ้ำได้

**หลักการสำคัญ:**

📊 **1. Viscosity Study**
• หาความหนืดของพลาสติก
• ตั้ง Injection Speed ที่เหมาะสม
• สร้าง Viscosity Curve

📊 **2. Cavity Balance Study**
• ตรวจสอบการเติมเท่ากันทุก Cavity
• ปรับสมดุล Runner System
• ชั่งน้ำหนักแต่ละ Cavity

📊 **3. Gate Seal Study**
• หาเวลา Gate Seal
• ตั้ง Holding Time ที่เหมาะสม
• Plot Weight vs Hold Time

📊 **4. Cooling Study**
• หา Cooling Time ที่เหมาะสม
• วัด Part Temperature หลัง Eject
• ตรวจสอบ Dimensional Stability

**Process Window:**
• พื้นที่ที่ Parameter ทำงานได้ดี
• กว้าง = กระบวนการเสถียร
• แคบ = ต้องควบคุมเข้มงวด

**DOE (Design of Experiments):**
• ทดลองอย่างเป็นระบบ
• หา Optimum Condition
• ลดเวลาในการ Setup`,
    keyPoints: [
      "Scientific Molding ใช้ข้อมูลไม่ใช่การเดา",
      "ทำ 4 Study: Viscosity, Balance, Seal, Cooling",
      "Process Window กว้าง = เสถียรกว่า"
    ],
    nextLesson: "L5_2"
  },
  
  L5_2: {
    title: "บทที่ 22: Process Optimization",
    icon: "📈",
    color: "#1F2937",
    duration: "30 นาที",
    objectives: [
      "วิเคราะห์และปรับปรุง Process",
      "ลด Cycle Time ได้",
      "เพิ่ม OEE"
    ],
    content: `📈 **Process Optimization**

**เป้าหมายการ Optimize:**
• ลด Cycle Time
• ลด Reject Rate
• เพิ่ม Productivity
• ลด Energy

**การลด Cycle Time:**

⏱️ **1. Injection Time**
• เพิ่ม Speed (ระวัง Jetting)
• ใช้ Multi-stage
• ขยาย Gate

⏱️ **2. Holding Time**
• ทำ Gate Seal Study
• ไม่ต้อง Hold นานเกินจำเป็น

⏱️ **3. Cooling Time (60-80%)**
• เพิ่ม Flow Rate น้ำหล่อเย็น
• ลดอุณหภูมิ Coolant
• ปรับปรุง Cooling Channel
• ใช้ Conformal Cooling

⏱️ **4. Mold Open/Close**
• ปรับ Clamp Speed
• ลด Mold Opening Stroke
• ใช้ High Speed Close

**OEE (Overall Equipment Effectiveness):**
OEE = Availability × Performance × Quality

• Availability: เครื่องพร้อมใช้
• Performance: ทำได้เร็วแค่ไหน
• Quality: ของดีกี่ %

**Target OEE:**
• 60-70% = พอใช้
• 70-85% = ดี
• 85%+ = World Class`,
    keyPoints: [
      "Cooling Time คือตัวหลักที่ลด Cycle Time ได้มาก",
      "ทำ Gate Seal Study ก่อนตั้ง Holding Time",
      "OEE 85%+ คือ World Class"
    ],
    nextLesson: "L5_3"
  },
  
  L5_3: {
    title: "บทที่ 23: Quality Control & SPC",
    icon: "📊",
    color: "#1F2937",
    duration: "30 นาที",
    objectives: [
      "เข้าใจหลักการ QC",
      "ใช้ SPC ได้",
      "วิเคราะห์ Cp, Cpk ได้"
    ],
    content: `📊 **Quality Control & SPC**

**Statistical Process Control (SPC):**
• ควบคุมคุณภาพด้วยสถิติ
• ตรวจจับความผิดปกติก่อนเกิด Defect
• ใช้ Control Chart

**Control Chart:**
• UCL = Upper Control Limit
• CL = Center Line (ค่าเฉลี่ย)
• LCL = Lower Control Limit

**กฎ 8 ข้อ (Western Electric Rules):**
1. จุดเกิน Control Limit
2. 9 จุดติดต่อกันอยู่ข้างเดียว
3. 6 จุดติดต่อกันขึ้นหรือลง
4. 14 จุดติดต่อกันสลับขึ้นลง
5-8. และอื่นๆ...

**Process Capability:**

📐 **Cp (Capability Index)**
Cp = (USL - LSL) / (6σ)
• วัดความสามารถของ Process
• ไม่พิจารณาตำแหน่งค่าเฉลี่ย

📐 **Cpk (Centered Capability)**
Cpk = min(Cpu, Cpl)
• พิจารณาทั้งความสามารถและตำแหน่ง
• Cpk < Cp เสมอ (ยกเว้นอยู่กลาง)

**เกณฑ์:**
• Cpk < 1.0 = ไม่ผ่าน
• Cpk 1.0-1.33 = พอใช้
• Cpk 1.33-1.67 = ดี
• Cpk > 1.67 = ดีมาก`,
    keyPoints: [
      "SPC ช่วยตรวจจับปัญหาก่อนเกิด Defect",
      "Cpk > 1.33 คือเกณฑ์ที่ดี",
      "Control Chart ต้องอยู่ใน Limit และไม่มี Pattern"
    ],
    nextLesson: "L5_4"
  },
  
  L5_4: {
    title: "บทที่ 24: Industry 4.0 & Smart Factory",
    icon: "🤖",
    color: "#1F2937",
    duration: "30 นาที",
    objectives: [
      "เข้าใจแนวคิด Industry 4.0",
      "รู้จักเทคโนโลยีที่เกี่ยวข้อง",
      "เตรียมพร้อมสู่ Smart Factory"
    ],
    content: `🤖 **Industry 4.0 & Smart Factory**

**Industry 4.0 คืออะไร?**
• การปฏิวัติอุตสาหกรรมครั้งที่ 4
• เชื่อมต่อโลกจริงกับดิจิทัล
• ใช้ข้อมูลขับเคลื่อนการตัดสินใจ

**เทคโนโลยีหลัก:**

🌐 **IoT (Internet of Things)**
• เซ็นเซอร์เก็บข้อมูลเรียลไทม์
• เชื่อมต่อเครื่องจักรทั้งหมด
• แจ้งเตือนปัญหาทันที

📊 **Big Data & Analytics**
• เก็บข้อมูลการผลิตทั้งหมด
• วิเคราะห์หาความสัมพันธ์
• ทำนายปัญหาล่วงหน้า

🤖 **AI & Machine Learning**
• ปรับ Parameter อัตโนมัติ
• ตรวจจับ Defect ด้วย Vision
• Predictive Maintenance

☁️ **Cloud Computing**
• เก็บข้อมูลบน Cloud
• เข้าถึงได้ทุกที่
• วิเคราะห์ข้อมูลระยะไกล

**Smart Injection Molding:**
• Real-time Process Monitoring
• Automatic Parameter Adjustment
• Predictive Quality Control
• Digital Twin
• MES Integration

**ประโยชน์:**
• ลด Downtime 30-50%
• ลด Reject 20-40%
• เพิ่ม OEE 15-25%
• ลด Energy 10-20%`,
    keyPoints: [
      "Industry 4.0 = เชื่อมต่อ + ข้อมูล + AI",
      "IoT + Big Data ช่วยตัดสินใจด้วยข้อมูล",
      "Smart Factory ลด Downtime และ Reject ได้มาก"
    ],
    nextLesson: null // จบ Level 5 - จบหลักสูตร!
  }
};

// =====================================================
// 📝 QUIZ DATABASE - คลังข้อสอบ
// =====================================================

const QUIZ_DATABASE = {
  Q0: {
    title: "แบบทดสอบ Level 0: Mindset & Foundation",
    passingScore: 70,
    questions: [
      {
        id: "Q0_1",
        question: "หลัก 6M ในการฉีดพลาสติก M ตัวใดหมายถึง 'แม่พิมพ์'?",
        options: ["A. Material", "B. Machine", "C. Mold", "D. Method"],
        answer: "C",
        explanation: "Mold หมายถึงแม่พิมพ์ ซึ่งเป็นหนึ่งใน 6M"
      },
      {
        id: "Q0_2",
        question: "หลัก 3 สิ่งสำคัญในการฉีดพลาสติกคืออะไร?",
        options: [
          "A. ความร้อน แรงดัน เวลา",
          "B. ความเย็น แรงดัน ความเร็ว",
          "C. อุณหภูมิ ความเร็ว พื้นที่",
          "D. แรงดัน ความหนืด Cycle"
        ],
        answer: "A",
        explanation: "Heat (ความร้อน), Pressure (แรงดัน), Time (เวลา)"
      },
      {
        id: "Q0_3",
        question: "ปุ่มใดสำคัญที่สุดสำหรับความปลอดภัย?",
        options: [
          "A. Motor On",
          "B. Emergency Stop",
          "C. Mode Selector",
          "D. Cycle Start"
        ],
        answer: "B",
        explanation: "Emergency Stop หยุดเครื่องทันทีกรณีฉุกเฉิน"
      },
      {
        id: "Q0_4",
        question: "ช่างเทคนิคมืออาชีพควรมีคุณสมบัติอะไร?",
        options: [
          "A. ทำงานเร็วที่สุด",
          "B. ความรับผิดชอบและเรียนรู้ต่อเนื่อง",
          "C. ทำตามคำสั่งอย่างเดียว",
          "D. ไม่ถามเมื่อไม่รู้"
        ],
        answer: "B",
        explanation: "ช่างมืออาชีพต้องมีความรับผิดชอบและเรียนรู้อยู่เสมอ"
      },
      {
        id: "Q0_5",
        question: "อุปกรณ์ใดไม่ใช่ PPE สำหรับงานฉีดพลาสติก?",
        options: [
          "A. แว่นตานิรภัย",
          "B. ถุงมือกันความร้อน",
          "C. หูฟังเพลง",
          "D. รองเท้านิรภัย"
        ],
        answer: "C",
        explanation: "หูฟังเพลงไม่ใช่อุปกรณ์ป้องกัน แต่ที่อุดหูกันเสียงเป็น PPE"
      }
    ]
  },
  
  Q1: {
    title: "แบบทดสอบ Level 1: Machine Fundamentals",
    passingScore: 70,
    questions: [
      {
        id: "Q1_1",
        question: "เครื่องฉีดพลาสติกมีกี่ส่วนหลัก?",
        options: ["A. 2 ส่วน", "B. 3 ส่วน", "C. 4 ส่วน", "D. 5 ส่วน"],
        answer: "B",
        explanation: "3 ส่วน: Injection Unit, Clamping Unit, Base Unit"
      },
      {
        id: "Q1_2",
        question: "Screw ในเครื่องฉีดแบ่งเป็นกี่ Zone?",
        options: ["A. 2 Zone", "B. 3 Zone", "C. 4 Zone", "D. 5 Zone"],
        answer: "B",
        explanation: "3 Zone: Feed Zone, Compression Zone, Metering Zone"
      },
      {
        id: "Q1_3",
        question: "Non-Return Valve (Check Ring) มีหน้าที่อะไร?",
        options: [
          "A. หลอมพลาสติก",
          "B. ป้องกันพลาสติกไหลย้อนกลับ",
          "C. ปิดแม่พิมพ์",
          "D. ดีดชิ้นงาน"
        ],
        answer: "B",
        explanation: "ป้องกันพลาสติกไหลย้อนกลับขณะฉีด"
      },
      {
        id: "Q1_4",
        question: "Toggle System มีข้อดีอย่างไร?",
        options: [
          "A. ราคาถูกกว่า",
          "B. ประหยัดพลังงานและความเร็วสูง",
          "C. ใช้กับแม่พิมพ์ได้ทุกขนาด",
          "D. ไม่ต้องบำรุงรักษา"
        ],
        answer: "B",
        explanation: "Toggle System ประหยัดพลังงานและทำงานเร็วกว่า Hydraulic"
      },
      {
        id: "Q1_5",
        question: "Clamping Force มีหน่วยเป็นอะไร?",
        options: ["A. Bar", "B. PSI", "C. Ton", "D. mm"],
        answer: "C",
        explanation: "Clamping Force มีหน่วยเป็นตัน (Ton)"
      }
    ]
  },
  
  // =====================================================
  // 🧪 QUIZ LEVEL 2: Material Science
  // =====================================================
  Q2: {
    title: "แบบทดสอบ Level 2: Material Science",
    passingScore: 75,
    questions: [
      {
        id: "Q2_1",
        question: "ข้อใดเป็นคุณสมบัติของ Thermoplastic?",
        options: [
          "A. หลอมได้ครั้งเดียว",
          "B. หลอมซ้ำได้หลายครั้ง",
          "C. เกิด Cross-linking ถาวร",
          "D. ทนความร้อนสูงมาก"
        ],
        answer: "B",
        explanation: "Thermoplastic หลอมซ้ำได้หลายครั้ง รีไซเคิลได้"
      },
      {
        id: "Q2_2",
        question: "พลาสติกชนิดใดเหมาะสำหรับงานเฟืองมากที่สุด?",
        options: ["A. PP", "B. PE", "C. POM", "D. PS"],
        answer: "C",
        explanation: "POM (Polyacetal) มีคุณสมบัติ Self-lubricating และทนสึกหรอดี"
      },
      {
        id: "Q2_3",
        question: "วัสดุใดต้องอบแห้งอย่างเข้มงวดก่อนฉีด?",
        options: ["A. PP", "B. PE", "C. PC", "D. PS"],
        answer: "C",
        explanation: "PC ดูดความชื้นสูง ต้องอบที่ 120°C นาน 4 ชม."
      },
      {
        id: "Q2_4",
        question: "Masterbatch คืออะไร?",
        options: [
          "A. เม็ดพลาสติกบริสุทธิ์",
          "B. สีเข้มข้นในรูปเม็ดพลาสติก",
          "C. สารเติมแต่งเหลว",
          "D. ผงสีละเอียด"
        ],
        answer: "B",
        explanation: "Masterbatch คือสีเข้มข้นในรูปเม็ดพลาสติก ใช้ 1-4%"
      },
      {
        id: "Q2_5",
        question: "ความชื้นในวัสดุทำให้เกิดปัญหาใด?",
        options: [
          "A. Short Shot",
          "B. Flash",
          "C. Silver Streak/Splay",
          "D. Warpage"
        ],
        answer: "C",
        explanation: "ความชื้นในวัสดุทำให้เกิด Silver Streak หรือ Splay Mark"
      }
    ]
  },
  
  // =====================================================
  // ⚙️ QUIZ LEVEL 3: Process Parameters
  // =====================================================
  Q3: {
    title: "แบบทดสอบ Level 3: Process Parameters",
    passingScore: 75,
    questions: [
      {
        id: "Q3_1",
        question: "POM ควรใช้ Temperature Profile แบบใด?",
        options: [
          "A. Ascending (เพิ่มขึ้น)",
          "B. Descending (ลดลง)",
          "C. Flat (เท่ากัน)",
          "D. แบบใดก็ได้"
        ],
        answer: "B",
        explanation: "POM ใช้ Descending Profile เพื่อป้องกัน Drooling"
      },
      {
        id: "Q3_2",
        question: "V/P Transfer ควรตั้งที่เท่าไรของ Cavity?",
        options: ["A. 70-80%", "B. 80-90%", "C. 95-99%", "D. 100%"],
        answer: "C",
        explanation: "V/P Transfer ตั้งที่ 95-99% ของการเติม Cavity"
      },
      {
        id: "Q3_3",
        question: "Holding Pressure มีหน้าที่หลักอะไร?",
        options: [
          "A. เติมพลาสติกให้เต็ม",
          "B. ชดเชยการหดตัว",
          "C. หล่อเย็นชิ้นงาน",
          "D. ดีดชิ้นงานออก"
        ],
        answer: "B",
        explanation: "Holding Pressure ชดเชยการหดตัว (Shrinkage) ของพลาสติก"
      },
      {
        id: "Q3_4",
        question: "Cooling Time คิดเป็นกี่ % ของ Cycle Time?",
        options: ["A. 10-20%", "B. 30-40%", "C. 50-60%", "D. 60-80%"],
        answer: "D",
        explanation: "Cooling Time = 60-80% ของ Cycle Time ทั้งหมด"
      },
      {
        id: "Q3_5",
        question: "ถ้าความหนาชิ้นงานเพิ่ม 2 เท่า Cooling Time จะเพิ่มกี่เท่า?",
        options: ["A. 2 เท่า", "B. 3 เท่า", "C. 4 เท่า", "D. 8 เท่า"],
        answer: "C",
        explanation: "Cooling Time ∝ ความหนา² ดังนั้นหนา 2 เท่า = 4 เท่าของเวลา"
      }
    ]
  },
  
  // =====================================================
  // 🔍 QUIZ LEVEL 4: Troubleshooting
  // =====================================================
  Q4: {
    title: "แบบทดสอบ Level 4: Troubleshooting",
    passingScore: 80,
    questions: [
      {
        id: "Q4_1",
        question: "Short Shot เกิดจากสาเหตุใด?",
        options: [
          "A. Clamping Force น้อย",
          "B. พลาสติกไม่พอหรือไหลไม่ถึง",
          "C. Holding Pressure สูงเกิน",
          "D. Cooling Time นานเกิน"
        ],
        answer: "B",
        explanation: "Short Shot เกิดจากพลาสติกไม่พอหรือไหลไม่ถึง"
      },
      {
        id: "Q4_2",
        question: "Flash (ครีบ) แก้ไขอย่างไร?",
        options: [
          "A. เพิ่ม Injection Pressure",
          "B. ลด Clamping Force",
          "C. เพิ่ม Clamping Force",
          "D. เพิ่มอุณหภูมิ"
        ],
        answer: "C",
        explanation: "Flash แก้โดยเพิ่ม Clamping Force หรือลด Injection Pressure"
      },
      {
        id: "Q4_3",
        question: "Sink Mark แก้ไขโดยวิธีใด?",
        options: [
          "A. ลด Holding Pressure",
          "B. เพิ่ม Holding Pressure/Time",
          "C. เพิ่ม Injection Speed",
          "D. ลด Mold Temperature"
        ],
        answer: "B",
        explanation: "Sink Mark แก้โดยเพิ่ม Holding Pressure และ Time"
      },
      {
        id: "Q4_4",
        question: "Burn Mark เกิดจากอะไร?",
        options: [
          "A. ความชื้นในวัสดุ",
          "B. อากาศถูกบีบอัด (Diesel Effect)",
          "C. Cooling ช้าเกินไป",
          "D. Gate เล็กเกินไป"
        ],
        answer: "B",
        explanation: "Burn Mark เกิดจาก Diesel Effect - อากาศถูกบีบอัดจนติดไฟ"
      },
      {
        id: "Q4_5",
        question: "Weld Line เกิดที่จุดใด?",
        options: [
          "A. จุดที่พลาสติกเริ่มไหล",
          "B. จุดที่ Flow หลายทางมาบรรจบกัน",
          "C. จุดที่ Gate ตั้งอยู่",
          "D. จุดที่ Ejector Pin อยู่"
        ],
        answer: "B",
        explanation: "Weld Line เกิดที่จุดที่ Flow หลายทางมาบรรจบกัน"
      }
    ]
  },
  
  // =====================================================
  // 🎓 QUIZ LEVEL 5: Advanced Techniques (Final)
  // =====================================================
  Q5: {
    title: "แบบทดสอบ Level 5: Advanced Techniques (Final Exam)",
    passingScore: 80,
    questions: [
      {
        id: "Q5_1",
        question: "Scientific Molding ใช้หลักการใด?",
        options: [
          "A. ประสบการณ์และการเดา",
          "B. ข้อมูลและการวิเคราะห์",
          "C. ทำตามคู่มือเท่านั้น",
          "D. ลองผิดลองถูก"
        ],
        answer: "B",
        explanation: "Scientific Molding ใช้ข้อมูลและการวิเคราะห์ ไม่ใช่การเดา"
      },
      {
        id: "Q5_2",
        question: "Gate Seal Study ใช้หาค่าอะไร?",
        options: [
          "A. Injection Speed ที่เหมาะสม",
          "B. Holding Time ที่เหมาะสม",
          "C. Cooling Time ที่เหมาะสม",
          "D. Mold Temperature ที่เหมาะสม"
        ],
        answer: "B",
        explanation: "Gate Seal Study หาเวลา Holding ที่เหมาะสมที่ Gate แข็งตัว"
      },
      {
        id: "Q5_3",
        question: "OEE 85% ขึ้นไป จัดอยู่ในระดับใด?",
        options: [
          "A. พอใช้",
          "B. ดี",
          "C. ดีมาก",
          "D. World Class"
        ],
        answer: "D",
        explanation: "OEE 85%+ คือ World Class"
      },
      {
        id: "Q5_4",
        question: "Cpk > 1.33 หมายความว่าอย่างไร?",
        options: [
          "A. Process ไม่ผ่านมาตรฐาน",
          "B. Process พอใช้",
          "C. Process ดี",
          "D. ต้องปรับปรุงทันที"
        ],
        answer: "C",
        explanation: "Cpk > 1.33 คือเกณฑ์ Process ที่ดี"
      },
      {
        id: "Q5_5",
        question: "Industry 4.0 ใช้เทคโนโลยีใดเป็นหลัก?",
        options: [
          "A. IoT + Big Data + AI",
          "B. เครื่องจักรแมนนวล",
          "C. การบันทึกด้วยกระดาษ",
          "D. ประสบการณ์ช่าง"
        ],
        answer: "A",
        explanation: "Industry 4.0 ใช้ IoT, Big Data และ AI ขับเคลื่อน"
      }
    ]
  }
};

// =====================================================
// 📖 LESSON CONTENT FLEX - แสดงเนื้อหาบทเรียน
// =====================================================

/**
 * สร้าง Flex Message แสดงเนื้อหาบทเรียน
 */
function createLessonContentFlex(lessonId, progress, userId) {
  const lesson = LESSON_CONTENT[lessonId];
  if (!lesson) {
    return { type: "text", text: "❌ ไม่พบบทเรียนที่ระบุ" };
  }
  
  // แปลง content เป็น array ของ text components
  const contentLines = lesson.content.split('\n').slice(0, 15).map(line => ({
    type: "text",
    text: line,
    size: "xs",
    color: line.startsWith('**') ? "#333333" : "#666666",
    wrap: true,
    weight: line.startsWith('**') ? "bold" : "regular"
  }));
  
  // Key Points
  const keyPointsComponents = lesson.keyPoints.map((point, idx) => ({
    type: "text",
    text: `${idx + 1}. ${point}`,
    size: "xs",
    color: "#333333",
    wrap: true,
    margin: "sm"
  }));
  
  return {
    type: "flex",
    altText: `📖 ${lesson.title}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {type: "text", text: lesson.icon, size: "xxl", flex: 0},
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {type: "text", text: lesson.title, weight: "bold", size: "md", color: "#FFFFFF", wrap: true},
                  {type: "text", text: `⏱️ ${lesson.duration}`, size: "xs", color: "#E0E0E0"}
                ],
                margin: "md"
              }
            ]
          }
        ],
        backgroundColor: lesson.color,
        paddingAll: "15px"
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {type: "text", text: "🎯 วัตถุประสงค์:", weight: "bold", size: "sm", color: lesson.color},
          ...lesson.objectives.map(obj => ({
            type: "text",
            text: `• ${obj}`,
            size: "xs",
            color: "#666666",
            wrap: true
          })),
          {type: "separator", margin: "md"},
          {type: "text", text: "📚 เนื้อหา:", weight: "bold", size: "sm", color: lesson.color, margin: "md"},
          ...contentLines.slice(0, 10),
          {type: "text", text: "...(กดอ่านต่อ)", size: "xxs", color: "#888888", margin: "sm"},
          {type: "separator", margin: "md"},
          {type: "text", text: "💡 Key Points:", weight: "bold", size: "sm", color: "#F59E0B", margin: "md"},
          ...keyPointsComponents
        ],
        paddingAll: "15px"
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            action: {type: "message", label: "✅ เรียนจบ ไปบทต่อไป", text: `/iml complete ${lessonId}`},
            style: "primary",
            color: lesson.color,
            height: "sm"
          },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "button",
                action: {type: "message", label: "◀️ กลับ", text: `/iml level ${lessonId.charAt(1)}`},
                style: "secondary",
                height: "sm",
                flex: 1
              },
              {
                type: "button",
                action: {type: "message", label: "🏠 เมนู", text: "/เรียนรู้การฉีดพลาสติก"},
                style: "secondary",
                height: "sm",
                flex: 1
              }
            ],
            spacing: "sm",
            margin: "sm"
          }
        ],
        paddingAll: "10px"
      }
    }
  };
}

/**
 * บันทึกว่าเรียนจบบทเรียน
 */
async function completeLessonHandler(lessonId, userId, progress) {
  // เช็คว่าเรียนจบแล้วหรือยัง
  if (progress.completedLessons.includes(lessonId)) {
    const lesson = LESSON_CONTENT[lessonId];
    if (lesson && lesson.nextLesson) {
      return createLessonContentFlex(lesson.nextLesson, progress, userId);
    }
    return { type: "text", text: `✅ คุณเรียนบท ${lessonId} จบแล้ว!\nกลับไปเลือกบทเรียนอื่นได้เลย` };
  }
  
  // อัปเดต progress
  const updatedLessons = [...progress.completedLessons, lessonId];
  
  // เช็คว่าได้ badge หรือไม่
  let newBadge = null;
  if (updatedLessons.length === 1 && !progress.badges.includes('beginner')) {
    newBadge = 'beginner';
  }
  
  const updates = {
    completedLessons: updatedLessons,
    currentLesson: lessonId
  };
  
  if (newBadge) {
    updates.badges = [...progress.badges, newBadge];
  }
  
  await updateUserProgress(userId, updates);
  
  // สร้างข้อความแสดงความยินดี
  const lesson = LESSON_CONTENT[lessonId];
  
  // เช็คว่าเรียนจบ Level หรือยัง
  const levelId = parseInt(lessonId.charAt(1));
  const level = CURRICULUM[`level${levelId}`];
  const allLessonsInLevel = level.lessons.map(l => l.id);
  const completedInLevel = updatedLessons.filter(l => allLessonsInLevel.includes(l));
  const isLevelComplete = completedInLevel.length === allLessonsInLevel.length;
  
  if (isLevelComplete) {
    // เรียนจบทุกบทใน Level แล้ว ให้ทำ Quiz
    return {
      type: "flex",
      altText: "🎉 เรียนจบทุกบทแล้ว!",
      contents: {
        type: "bubble",
        size: "kilo",
        header: {
          type: "box",
          layout: "vertical",
          contents: [
            {type: "text", text: "🎉 ยินดีด้วย!", weight: "bold", size: "xl", color: "#FFFFFF", align: "center"}
          ],
          backgroundColor: "#10B981",
          paddingAll: "15px"
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {type: "text", text: `คุณเรียนจบทุกบทใน Level ${levelId} แล้ว!`, weight: "bold", size: "md", wrap: true, align: "center"},
            {type: "text", text: "พร้อมทำแบบทดสอบเพื่อปลดล็อค Level ถัดไป", size: "sm", color: "#666666", wrap: true, margin: "md", align: "center"},
            newBadge ? {type: "text", text: `🏅 ได้รับเหรียญ: ${LEARNING_BADGES[newBadge].name}`, size: "xs", color: "#F59E0B", margin: "md", align: "center"} : {type: "filler"}
          ],
          paddingAll: "15px"
        },
        footer: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "button",
              action: {type: "message", label: "📝 ทำแบบทดสอบ", text: `/iml startquiz Q${levelId}`},
              style: "primary",
              color: "#7C3AED",
              height: "sm"
            }
          ],
          paddingAll: "10px"
        }
      }
    };
  }
  
  // ยังไม่จบ Level ไปบทถัดไป
  if (lesson && lesson.nextLesson) {
    return {
      type: "flex",
      altText: "✅ เรียนจบบทแล้ว!",
      contents: {
        type: "bubble",
        size: "kilo",
        header: {
          type: "box",
          layout: "vertical",
          contents: [
            {type: "text", text: "✅ เรียนจบแล้ว!", weight: "bold", size: "lg", color: "#FFFFFF", align: "center"}
          ],
          backgroundColor: "#10B981",
          paddingAll: "15px"
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {type: "text", text: lesson.title, weight: "bold", size: "sm", wrap: true, align: "center"},
            {type: "text", text: `เรียนจบแล้ว ${completedInLevel.length}/${allLessonsInLevel.length} บท`, size: "xs", color: "#666666", margin: "md", align: "center"},
            newBadge ? {type: "text", text: `🏅 ได้รับเหรียญ: ${LEARNING_BADGES[newBadge].name}`, size: "xs", color: "#F59E0B", margin: "md", align: "center"} : {type: "filler"}
          ],
          paddingAll: "15px"
        },
        footer: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "button",
              action: {type: "message", label: "▶️ ไปบทถัดไป", text: `/iml lesson ${lesson.nextLesson}`},
              style: "primary",
              color: level.color,
              height: "sm"
            }
          ],
          paddingAll: "10px"
        }
      }
    };
  }
  
  return { type: "text", text: `✅ เรียนจบบท ${lessonId} แล้ว!` };
}

// =====================================================
// 📝 QUIZ SYSTEM - ระบบแบบทดสอบ
// =====================================================

/**
 * สร้าง Flex เริ่มทำ Quiz
 */
function createQuizStartFlex(quizId, progress) {
  const quiz = QUIZ_DATABASE[quizId];
  if (!quiz) {
    return { type: "text", text: "❌ ไม่พบแบบทดสอบ" };
  }
  
  const levelId = quizId.replace('Q', '');
  const level = CURRICULUM[`level${levelId}`];
  
  return {
    type: "flex",
    altText: `📝 ${quiz.title}`,
    contents: {
      type: "bubble",
      size: "kilo",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {type: "text", text: "📝 แบบทดสอบ", weight: "bold", size: "xl", color: "#FFFFFF", align: "center"},
          {type: "text", text: quiz.title, size: "sm", color: "#E0E0E0", align: "center", wrap: true}
        ],
        backgroundColor: "#7C3AED",
        paddingAll: "15px"
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {type: "text", text: `📊 จำนวน ${quiz.questions.length} ข้อ`, size: "sm", color: "#333333"},
          {type: "text", text: `✅ ผ่าน ${quiz.passingScore}%`, size: "sm", color: "#333333", margin: "sm"},
          {type: "text", text: `⏱️ ไม่จำกัดเวลา`, size: "sm", color: "#333333", margin: "sm"},
          {type: "separator", margin: "md"},
          {type: "text", text: "💡 เคล็ดลับ:", weight: "bold", size: "sm", color: "#F59E0B", margin: "md"},
          {type: "text", text: "• อ่านคำถามให้ครบก่อนตอบ\n• ทบทวนบทเรียนก่อนถ้าไม่มั่นใจ\n• สอบไม่ผ่านสามารถทำใหม่ได้", size: "xs", color: "#666666", wrap: true, margin: "sm"}
        ],
        paddingAll: "15px"
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            action: {type: "message", label: "▶️ เริ่มทำข้อสอบ", text: `/iml answer ${quizId}_1 start`},
            style: "primary",
            color: "#7C3AED",
            height: "sm"
          },
          {
            type: "button",
            action: {type: "message", label: "◀️ กลับทบทวน", text: `/iml level ${levelId}`},
            style: "secondary",
            height: "sm",
            margin: "sm"
          }
        ],
        paddingAll: "10px"
      }
    }
  };
}

/**
 * สร้าง Flex แสดงคำถาม Quiz
 */
function createQuizQuestionFlex(quizId, questionIndex, progress) {
  const quiz = QUIZ_DATABASE[quizId];
  if (!quiz || questionIndex >= quiz.questions.length) {
    return { type: "text", text: "❌ ไม่พบคำถาม" };
  }
  
  const question = quiz.questions[questionIndex];
  const levelId = quizId.replace('Q', '');
  const level = CURRICULUM[`level${levelId}`];
  
  const optionButtons = question.options.map((opt, idx) => ({
    type: "button",
    action: {
      type: "message",
      label: opt,
      text: `/iml answer ${quizId}_${questionIndex} ${String.fromCharCode(65 + idx)}`
    },
    style: "secondary",
    height: "sm",
    margin: "sm"
  }));
  
  return {
    type: "flex",
    altText: `❓ ข้อที่ ${questionIndex + 1}/${quiz.questions.length}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {type: "text", text: `❓ ข้อที่ ${questionIndex + 1}`, weight: "bold", size: "lg", color: "#FFFFFF", flex: 1},
              {type: "text", text: `${questionIndex + 1}/${quiz.questions.length}`, size: "sm", color: "#E0E0E0", flex: 0, align: "end"}
            ]
          }
        ],
        backgroundColor: level ? level.color : "#7C3AED",
        paddingAll: "15px"
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {type: "text", text: question.question, weight: "bold", size: "md", wrap: true, color: "#333333"},
          {type: "separator", margin: "lg"},
          ...optionButtons
        ],
        paddingAll: "15px"
      }
    }
  };
}

/**
 * จัดการคำตอบ Quiz
 */
async function handleQuizAnswer(quizQuestionId, userAnswer, userId, progress) {
  // Parse quiz ID และ question index
  const parts = quizQuestionId.split('_');
  const quizId = parts[0];
  const questionIndex = parseInt(parts[1]);
  
  const quiz = QUIZ_DATABASE[quizId];
  if (!quiz) {
    return { type: "text", text: "❌ ไม่พบแบบทดสอบ" };
  }
  
  // ถ้าเป็น start ให้แสดงคำถามแรก
  if (userAnswer === 'start') {
    // Initialize quiz state
    await updateUserProgress(userId, {
      currentQuiz: quizId,
      quizAnswers: {},
      quizStartTime: new Date().toISOString()
    });
    return createQuizQuestionFlex(quizId, 0, progress);
  }
  
  const question = quiz.questions[questionIndex];
  if (!question) {
    return { type: "text", text: "❌ ไม่พบคำถาม" };
  }
  
  // บันทึกคำตอบ
  const quizAnswers = progress.quizAnswers || {};
  quizAnswers[question.id] = userAnswer;
  
  const isCorrect = userAnswer === question.answer;
  const isLastQuestion = questionIndex >= quiz.questions.length - 1;
  
  if (isLastQuestion) {
    // คำนวณคะแนน
    let correctCount = 0;
    quiz.questions.forEach((q, idx) => {
      const ans = idx === questionIndex ? userAnswer : quizAnswers[q.id];
      if (ans === q.answer) correctCount++;
    });
    
    const score = Math.round((correctCount / quiz.questions.length) * 100);
    const passed = score >= quiz.passingScore;
    
    // อัปเดต progress
    const updates = {
      quizAnswers: {},
      currentQuiz: null,
      [`quizScores.${quizId}`]: score
    };
    
    if (passed && !progress.completedQuizzes.includes(quizId)) {
      updates.completedQuizzes = [...progress.completedQuizzes, quizId];
      
      // เพิ่ม badge
      const levelId = quizId.replace('Q', '');
      const badgeKey = `level${levelId}_complete`;
      if (!progress.badges.includes(badgeKey)) {
        updates.badges = [...progress.badges, badgeKey];
      }
      
      // อัปเดต current level
      const nextLevel = parseInt(levelId) + 1;
      if (nextLevel <= 5) {
        updates.currentLevel = nextLevel;
      }
    }
    
    await updateUserProgress(userId, updates);
    
    // แสดงผลลัพธ์
    return createQuizResultFlex(quizId, score, passed, correctCount, quiz.questions.length);
  }
  
  // อัปเดตคำตอบและไปข้อถัดไป
  await updateUserProgress(userId, { quizAnswers });
  
  // แสดงผลลัพธ์ข้อปัจจุบันและไปข้อถัดไป
  const levelId = quizId.replace('Q', '');
  const level = CURRICULUM[`level${levelId}`];
  
  return {
    type: "flex",
    altText: isCorrect ? "✅ ถูกต้อง!" : "❌ ไม่ถูกต้อง",
    contents: {
      type: "bubble",
      size: "kilo",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {type: "text", text: isCorrect ? "✅ ถูกต้อง!" : "❌ ไม่ถูกต้อง", weight: "bold", size: "xl", color: "#FFFFFF", align: "center"}
        ],
        backgroundColor: isCorrect ? "#10B981" : "#EF4444",
        paddingAll: "15px"
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {type: "text", text: `เฉลย: ${question.answer}`, weight: "bold", size: "sm", color: "#333333"},
          {type: "text", text: question.explanation, size: "xs", color: "#666666", wrap: true, margin: "sm"}
        ],
        paddingAll: "15px"
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            action: {type: "message", label: `▶️ ข้อถัดไป (${questionIndex + 2}/${quiz.questions.length})`, text: `/iml answer ${quizId}_${questionIndex + 1} start`},
            style: "primary",
            color: level ? level.color : "#7C3AED",
            height: "sm"
          }
        ],
        paddingAll: "10px"
      }
    }
  };
}

/**
 * สร้าง Flex แสดงผลลัพธ์ Quiz
 */
function createQuizResultFlex(quizId, score, passed, correctCount, totalQuestions) {
  const levelId = quizId.replace('Q', '');
  const level = CURRICULUM[`level${levelId}`];
  const nextLevel = parseInt(levelId) + 1;
  
  return {
    type: "flex",
    altText: passed ? "🎉 ผ่านแบบทดสอบ!" : "😢 ไม่ผ่านแบบทดสอบ",
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {type: "text", text: passed ? "🎉 ยินดีด้วย!" : "😢 เสียใจด้วย", weight: "bold", size: "xl", color: "#FFFFFF", align: "center"},
          {type: "text", text: passed ? "คุณผ่านแบบทดสอบแล้ว!" : "คุณยังไม่ผ่านแบบทดสอบ", size: "sm", color: "#E0E0E0", align: "center"}
        ],
        backgroundColor: passed ? "#10B981" : "#EF4444",
        paddingAll: "20px"
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "vertical",
            contents: [
              {type: "text", text: `${score}%`, weight: "bold", size: "4xl", color: passed ? "#10B981" : "#EF4444", align: "center"},
              {type: "text", text: `${correctCount}/${totalQuestions} ข้อ`, size: "md", color: "#666666", align: "center"}
            ],
            paddingAll: "15px"
          },
          {type: "separator"},
          passed ? {
            type: "box",
            layout: "vertical",
            contents: [
              {type: "text", text: `🏅 ได้รับเหรียญ: ${LEARNING_BADGES[`level${levelId}_complete`].name}`, weight: "bold", size: "sm", color: "#F59E0B", align: "center", margin: "md"},
              nextLevel <= 5 ? {type: "text", text: `🔓 ปลดล็อค Level ${nextLevel} แล้ว!`, size: "sm", color: "#10B981", align: "center", margin: "sm"} : {type: "text", text: "🏆 คุณจบหลักสูตรแล้ว!", size: "sm", color: "#F59E0B", align: "center", margin: "sm"}
            ]
          } : {
            type: "box",
            layout: "vertical",
            contents: [
              {type: "text", text: "💪 อย่าท้อ! ลองทบทวนบทเรียนแล้วมาสอบใหม่", size: "sm", color: "#666666", align: "center", wrap: true, margin: "md"}
            ]
          }
        ],
        paddingAll: "15px"
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: passed ? [
          nextLevel <= 5 ? {
            type: "button",
            action: {type: "message", label: `▶️ ไป Level ${nextLevel}`, text: `/iml level ${nextLevel}`},
            style: "primary",
            color: "#7C3AED",
            height: "sm"
          } : {
            type: "button",
            action: {type: "message", label: "🏠 กลับเมนูหลัก", text: "/เรียนรู้การฉีดพลาสติก"},
            style: "primary",
            color: "#7C3AED",
            height: "sm"
          },
          {
            type: "button",
            action: {type: "message", label: "📊 ดูความก้าวหน้า", text: "/iml progress"},
            style: "secondary",
            height: "sm",
            margin: "sm"
          }
        ] : [
          {
            type: "button",
            action: {type: "message", label: "📖 กลับไปทบทวน", text: `/iml level ${levelId}`},
            style: "primary",
            color: level ? level.color : "#7C3AED",
            height: "sm"
          },
          {
            type: "button",
            action: {type: "message", label: "🔄 สอบใหม่", text: `/iml startquiz ${quizId}`},
            style: "secondary",
            height: "sm",
            margin: "sm"
          }
        ],
        paddingAll: "10px"
      }
    }
  };
}

/**
 * ตรวจสอบว่าเป็นคำสั่ง IML หรือไม่
 */
function isIMLCommand(text) {
  const normalizedText = text.trim().toLowerCase();
  return normalizedText === '/เรียนรู้การฉีดพลาสติก' ||
         normalizedText === '/iml' ||
         normalizedText.startsWith('/iml ');
}

/**
 * ประมวลผลคำสั่ง IML
 */
async function processIMLCommand(text, userId) {
  const normalizedText = text.trim().toLowerCase();
  const progress = await getUserProgress(userId);
  
  // คำสั่งหลัก
  if (normalizedText === '/เรียนรู้การฉีดพลาสติก' || normalizedText === '/iml') {
    return createMainMenuFlex(progress);
  }
  
  // แยก subcommand
  const parts = normalizedText.replace('/iml ', '').split(' ');
  const subCommand = parts[0];
  const param = parts[1];
  const param2 = parts[2];
  
  switch (subCommand) {
    case 'curriculum':
      return createCurriculumFlex(progress);
      
    case 'progress':
      return createProgressFlex(progress);
      
    case 'badges':
      return createBadgesFlex(progress);
      
    case 'help':
      return createHelpFlex();
      
    case 'level':
      const levelId = parseInt(param);
      if (isNaN(levelId) || levelId < 0 || levelId > 5) {
        return createCurriculumFlex(progress);
      }
      if (!isLevelUnlocked(levelId, progress)) {
        return createLockedMessageFlex('level', levelId, progress);
      }
      return createLevelDetailFlex(levelId, progress);
      
    case 'locked':
      if (param === 'lesson' || param === 'quiz') {
        return createLockedMessageFlex('lesson', null, progress);
      }
      const lockedLevelId = parseInt(parts[1]);
      return createLockedMessageFlex('level', lockedLevelId, progress);
      
    case 'lesson':
      // แสดงเนื้อหาบทเรียน
      if (!isLessonUnlocked(param, progress)) {
        return createLockedMessageFlex('lesson', param, progress);
      }
      return createLessonContentFlex(param, progress, userId);
      
    case 'complete':
      // บันทึกว่าเรียนจบบทเรียน
      return await completeLessonHandler(param, userId, progress);
      
    case 'startquiz':
    case 'quiz':
      // เริ่มทำแบบทดสอบ
      const quizId = param || `Q${progress.currentLevel}`;
      return createQuizStartFlex(quizId, progress);
      
    case 'answer':
      // ตอบคำถาม Quiz
      return await handleQuizAnswer(param, param2, userId, progress);
      
    default:
      return createMainMenuFlex(progress);
  }
}

// =====================================================
// 📤 EXPORTS
// =====================================================

module.exports = {
  // Data
  CURRICULUM,
  LEARNING_BADGES,
  DEFAULT_PROGRESS,
  LESSON_CONTENT,
  QUIZ_DATABASE,
  
  // Progress Functions
  getUserProgress,
  updateUserProgress,
  isLessonUnlocked,
  isLevelUnlocked,
  getLevelProgress,
  getOverallProgress,
  
  // Flex Message Creators
  createMainMenuFlex,
  createCurriculumFlex,
  createLevelDetailFlex,
  createProgressFlex,
  createBadgesFlex,
  createLockedMessageFlex,
  createHelpFlex,
  createLessonContentFlex,
  createQuizStartFlex,
  createQuizQuestionFlex,
  createQuizResultFlex,
  
  // Handlers
  completeLessonHandler,
  handleQuizAnswer,
  
  // Command Handler
  isIMLCommand,
  processIMLCommand
};
