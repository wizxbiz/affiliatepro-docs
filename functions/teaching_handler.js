/**
 * Teaching Handler - Multi-Platform API for AI Teaching Assistant
 * Version: 2.0.0 - Flex Message Edition
 * 
 * 🌐 Supported Platforms: LINE, Web API, Mobile, Discord
 * 📚 Features: Lesson delivery, Quiz, Progress tracking
 * 🎨 NEW: Beautiful Flex Messages with images
 */

const { TEXTBOOK_TEACHING_PROMPT, QUIZ_DATABASE } = require('./textbook_teaching_prompt');
const lessonsData = require('./lessons_database.json');
const {
  LESSON_IMAGES,
  LEVEL_COLORS,
  getImageUrl,
  createWelcomeFlexMessage,
  createLessonFlexMessage,
  createCurriculumFlexMessage,
  createLevelOverviewFlexMessage,
  createQuizFlexMessage,
  createQuizResultFlexMessage,
  createProgressFlexMessage,
  createReferenceTableFlexMessage
} = require('./teaching_flex_templates');

/**
 * Process teaching-related commands
 * @param {string} userMessage - User's input message
 * @param {object} userProgress - User's learning progress (from Firestore)
 * @param {boolean} useFlex - Whether to return Flex Messages (for LINE)
 * @returns {object} Response with text/flex and optional actions
 */
function processTeachingCommand(userMessage, userProgress = {}, useFlex = true) {
  const message = userMessage.toLowerCase().trim();
  
  // Initialize progress if new user
  if (!userProgress.currentLevel) {
    userProgress = {
      currentLevel: 0,
      currentLesson: 1,
      completedLessons: [],
      quizScores: {},
      totalPoints: 0
    };
  }
  
  // Command handlers - return Flex Messages when useFlex is true
  if (message.includes('เริ่มเรียน') || message.includes('สอน') || message.includes('เรียน')) {
    return handleStartLearning(userProgress, useFlex);
  }
  
  if (message.match(/บทที่\s*(\d+)/)) {
    const lessonNum = parseInt(message.match(/บทที่\s*(\d+)/)[1]);
    return handleGetLesson(lessonNum, userProgress, useFlex);
  }
  
  if (message.match(/level\s*(\d+)/i) || message.match(/เลเวล\s*(\d+)/)) {
    const levelNum = parseInt(message.match(/(?:level|เลเวล)\s*(\d+)/i)[1]);
    return handleGetLevel(levelNum, userProgress, useFlex);
  }
  
  if (message.includes('quiz') || message.includes('ทดสอบ') || message.includes('แบบทดสอบ')) {
    return handleQuiz(userProgress, useFlex);
  }
  
  // Handle quiz answer
  if (message.match(/^ตอบ\s*([abc])/i)) {
    const answer = message.match(/^ตอบ\s*([abc])/i)[1].toUpperCase();
    return handleQuizAnswer(answer, userProgress, useFlex);
  }
  
  if (message.includes('ความก้าวหน้า') || message.includes('progress') || message.includes('สถานะ')) {
    return handleGetProgress(userProgress, useFlex);
  }
  
  if (message.includes('หลักสูตร') || message.includes('เนื้อหา') || message.includes('สารบัญ')) {
    return handleGetCurriculum(useFlex);
  }
  
  if (message.includes('ตาราง')) {
    return handleGetReferenceTable(message, useFlex);
  }
  
  // Default: return teaching prompt context
  return {
    isTeachingMode: true,
    teachingContext: TEXTBOOK_TEACHING_PROMPT,
    response: null
  };
}

/**
 * Handle start learning command
 */
function handleStartLearning(userProgress, useFlex = true) {
  const currentLesson = lessonsData.levels[userProgress.currentLevel]?.lessons.find(
    l => l.id === userProgress.currentLesson
  );
  
  // Return Flex Message for LINE
  if (useFlex) {
    return {
      isTeachingMode: true,
      flexMessage: createWelcomeFlexMessage(userProgress),
      userProgress
    };
  }
  
  // Fallback text response
  let response = `🎓 **ยินดีต้อนรับสู่หลักสูตรเทคนิคการฉีดพลาสติก!**

📊 **สถานะของคุณ:**
• Level: ${userProgress.currentLevel} (${lessonsData.levels[userProgress.currentLevel]?.name || 'ผู้เริ่มต้น'})
• บทเรียนปัจจุบัน: บทที่ ${userProgress.currentLesson}
• คะแนนสะสม: ${userProgress.totalPoints} คะแนน

📖 **บทเรียนถัดไป:**
**บทที่ ${currentLesson?.id}: ${currentLesson?.title}**
⏱️ ระยะเวลา: ${currentLesson?.duration}

พร้อมเริ่มเรียนไหมครับ?
• พิมพ์ "บทที่ ${currentLesson?.id}" เพื่อเริ่มเรียน
• พิมพ์ "หลักสูตร" เพื่อดูเนื้อหาทั้งหมด
• พิมพ์ "quiz" เพื่อทำแบบทดสอบ`;

  return {
    isTeachingMode: true,
    response,
    userProgress
  };
}

/**
 * Handle get specific lesson
 */
function handleGetLesson(lessonId, userProgress, useFlex = true) {
  let lesson = null;
  let levelInfo = null;
  
  // Find lesson in all levels
  for (const level of lessonsData.levels) {
    const found = level.lessons.find(l => l.id === lessonId);
    if (found) {
      lesson = found;
      levelInfo = level;
      break;
    }
  }
  
  if (!lesson) {
    return {
      isTeachingMode: true,
      response: `❌ ไม่พบบทที่ ${lessonId} กรุณาเลือกบทที่ 1-24`
    };
  }
  
  // Check if user can access this lesson
  if (levelInfo.requiredScore > userProgress.totalPoints) {
    return {
      isTeachingMode: true,
      response: `🔒 **บทนี้ยังไม่ปลดล็อค**

บทที่ ${lessonId} อยู่ใน Level ${levelInfo.id} (${levelInfo.name})
ต้องการคะแนน: ${levelInfo.requiredScore} คะแนน
คะแนนปัจจุบัน: ${userProgress.totalPoints} คะแนน

💡 ทำ Quiz ของ Level ก่อนหน้าเพื่อสะสมคะแนน!
พิมพ์ "quiz" เพื่อทำแบบทดสอบ`
    };
  }
  
  // Update progress
  if (!userProgress.completedLessons.includes(lessonId)) {
    userProgress.completedLessons.push(lessonId);
    userProgress.currentLesson = lessonId + 1;
    userProgress.totalPoints += 5; // 5 points per lesson
  }
  
  // Return Flex Message for LINE
  if (useFlex) {
    return {
      isTeachingMode: true,
      flexMessage: createLessonFlexMessage(lesson, levelInfo, userProgress),
      userProgress,
      pointsEarned: 5
    };
  }
  
  // Fallback text response
  const content = lesson.content;
  
  let response = `📖 **บทที่ ${lesson.id}: ${lesson.title}**
${levelInfo.icon} Level ${levelInfo.id}: ${levelInfo.name}
⏱️ ระยะเวลา: ${lesson.duration}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 **บทนำ:**
${content.introduction}

🎯 **จุดสำคัญ:**
${content.keyPoints.map((point, i) => `${i + 1}. ${point}`).join('\n')}

💡 **ตัวอย่าง:**
${content.example}

✨ **เคล็ดลับ:**
${content.tip}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 **วัตถุประสงค์การเรียนรู้:**
${lesson.objectives.map(obj => `✅ ${obj}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

เรียนจบแล้ว? 
• พิมพ์ "quiz" เพื่อทดสอบความรู้
• พิมพ์ "บทที่ ${lesson.id + 1}" เพื่อไปบทถัดไป

🎉 +5 คะแนน! (รวม: ${userProgress.totalPoints} คะแนน)`;
  
  return {
    isTeachingMode: true,
    response,
    userProgress
  };
}

/**
 * Handle get level overview
 */
function handleGetLevel(levelId, userProgress = {}, useFlex = true) {
  const level = lessonsData.levels.find(l => l.id === levelId);
  
  if (!level) {
    return {
      isTeachingMode: true,
      response: `❌ ไม่พบ Level ${levelId} กรุณาเลือก Level 0-5`
    };
  }
  
  // Return Flex Carousel for LINE
  if (useFlex) {
    return {
      isTeachingMode: true,
      flexMessage: createLevelOverviewFlexMessage(level, userProgress)
    };
  }
  
  // Fallback text response
  let response = `${level.icon} **LEVEL ${level.id}: ${level.name}**
📋 ${level.description}
🔓 ต้องการคะแนน: ${level.requiredScore}

📚 **บทเรียนใน Level นี้:**
${level.lessons.map(lesson => 
  `  📖 บทที่ ${lesson.id}: ${lesson.title} (${lesson.duration})`
).join('\n')}

พิมพ์ "บทที่ X" เพื่อเริ่มเรียนบทที่ต้องการ`;

  return {
    isTeachingMode: true,
    response
  };
}

/**
 * Handle quiz request
 */
function handleQuiz(userProgress, useFlex = true) {
  const level = `level${userProgress.currentLevel}`;
  const questions = QUIZ_DATABASE[level];
  
  if (!questions || questions.length === 0) {
    return {
      isTeachingMode: true,
      response: '❌ ยังไม่มีแบบทดสอบสำหรับ Level นี้'
    };
  }
  
  // Pick random question
  const randomQ = questions[Math.floor(Math.random() * questions.length)];
  
  // Store pending quiz for answer checking
  const pendingQuiz = {
    answer: randomQ.answer,
    explanation: randomQ.explanation,
    points: 10,
    levelId: userProgress.currentLevel
  };
  
  // Return Flex Message for LINE
  if (useFlex) {
    return {
      isTeachingMode: true,
      flexMessage: createQuizFlexMessage(randomQ, userProgress.currentLevel),
      pendingQuiz
    };
  }
  
  // Fallback text response
  let response = `📝 **แบบทดสอบ Level ${userProgress.currentLevel}**

❓ **คำถาม:**
${randomQ.question}

${randomQ.options.join('\n')}

💬 พิมพ์ตอบ A, B หรือ C`;

  return {
    isTeachingMode: true,
    response,
    pendingQuiz
  };
}

/**
 * Handle quiz answer
 */
function handleQuizAnswer(answer, userProgress, useFlex = true) {
  // This should be called with the pending quiz info from session
  // For now, return a generic response
  return {
    isTeachingMode: true,
    response: `📝 คุณตอบ: ${answer}\n\nกรุณาพิมพ์ "quiz" เพื่อเริ่มทำแบบทดสอบใหม่`
  };
}

/**
 * Process quiz answer with pending quiz data
 */
function processQuizAnswer(answer, pendingQuiz, userProgress, useFlex = true) {
  if (!pendingQuiz) {
    return {
      isTeachingMode: true,
      response: '❌ ไม่พบคำถามที่รอตอบ กรุณาพิมพ์ "quiz" เพื่อเริ่มทำแบบทดสอบ'
    };
  }
  
  const isCorrect = answer.toUpperCase() === pendingQuiz.answer;
  
  if (isCorrect) {
    userProgress.totalPoints = (userProgress.totalPoints || 0) + pendingQuiz.points;
    
    // Check if user should level up
    const nextLevel = lessonsData.levels.find(l => 
      l.id === userProgress.currentLevel + 1 && 
      userProgress.totalPoints >= l.requiredScore
    );
    
    if (nextLevel) {
      userProgress.currentLevel = nextLevel.id;
    }
  }
  
  // Return Flex Message for LINE
  if (useFlex) {
    return {
      isTeachingMode: true,
      flexMessage: createQuizResultFlexMessage(
        isCorrect, 
        pendingQuiz.explanation, 
        pendingQuiz.points, 
        pendingQuiz.levelId || userProgress.currentLevel
      ),
      userProgress,
      isCorrect,
      pointsEarned: isCorrect ? pendingQuiz.points : 0
    };
  }
  
  // Fallback text response
  let response = isCorrect 
    ? `✅ **ถูกต้อง!** +${pendingQuiz.points} คะแนน\n\n💡 ${pendingQuiz.explanation}\n\nคะแนนรวม: ${userProgress.totalPoints} คะแนน`
    : `❌ **ไม่ถูกต้อง**\n\nคำตอบที่ถูกต้องคือ: ${pendingQuiz.answer}\n💡 ${pendingQuiz.explanation}`;
  
  return {
    isTeachingMode: true,
    response,
    userProgress,
    isCorrect
  };
}

/**
 * Handle get progress
 */
function handleGetProgress(userProgress, useFlex = true) {
  const currentLevel = lessonsData.levels[userProgress.currentLevel];
  const totalLessons = 24;
  const completedCount = userProgress.completedLessons?.length || 0;
  const progressPercent = Math.round((completedCount / totalLessons) * 100);
  
  // Return Flex Message for LINE
  if (useFlex) {
    return {
      isTeachingMode: true,
      flexMessage: createProgressFlexMessage(userProgress, lessonsData.levels)
    };
  }
  
  // Fallback text response
  let response = `📊 **ความก้าวหน้าของคุณ**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 **Level ปัจจุบัน:** ${currentLevel?.icon || '🌱'} Level ${userProgress.currentLevel} - ${currentLevel?.name || 'ผู้เริ่มต้น'}

📖 **บทเรียน:**
• เรียนจบแล้ว: ${completedCount}/${totalLessons} บท
• ความก้าวหน้า: ${progressPercent}%
${'█'.repeat(Math.floor(progressPercent / 5))}${'░'.repeat(20 - Math.floor(progressPercent / 5))}

💯 **คะแนน:**
• คะแนนรวม: ${userProgress.totalPoints} คะแนน
• ต้องการอีก ${(currentLevel?.requiredScore || 0) - userProgress.totalPoints} คะแนนเพื่อ Level ถัดไป

📚 **บทที่เรียนจบ:**
${userProgress.completedLessons?.slice(-5).map(id => `✅ บทที่ ${id}`).join('\n') || 'ยังไม่มี'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 ทำ Quiz เพื่อสะสมคะแนนเพิ่ม!
พิมพ์ "quiz" เพื่อทำแบบทดสอบ`;

  return {
    isTeachingMode: true,
    response
  };
}

/**
 * Handle get curriculum
 */
function handleGetCurriculum(useFlex = true) {
  // Return Flex Carousel for LINE
  if (useFlex) {
    return {
      isTeachingMode: true,
      flexMessage: createCurriculumFlexMessage(lessonsData.levels)
    };
  }
  
  // Fallback text response
  let response = `📚 **หลักสูตรเทคนิคการฉีดพลาสติก**
🏫 IMT THAILAND - สถาบันเรียนรู้การฉีดพลาสติก

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;
  
  for (const level of lessonsData.levels) {
    response += `${level.icon} **LEVEL ${level.id}: ${level.name}**\n`;
    response += `   📋 ${level.description}\n`;
    response += `   🔓 ต้องการ: ${level.requiredScore} คะแนน\n`;
    response += `   📖 ${level.lessons.length} บทเรียน\n\n`;
  }
  
  response += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 รวม: 6 Levels, 24 บทเรียน
⏱️ เวลาเรียนโดยประมาณ: 12-15 ชั่วโมง

พิมพ์ "Level X" เพื่อดูรายละเอียดแต่ละ Level
พิมพ์ "เริ่มเรียน" เพื่อเริ่มต้น!`;

  return {
    isTeachingMode: true,
    response
  };
}

/**
 * Handle get reference tables
 */
function handleGetReferenceTable(message, useFlex = true) {
  const refData = lessonsData.referenceData;
  
  // Determine table type
  let tableType = null;
  let data = null;
  
  if (message.includes('อบ') || message.includes('drying')) {
    tableType = 'drying';
    data = refData.dryingTemperatures;
  } else if (message.includes('เย็น') || message.includes('cooling')) {
    tableType = 'cooling';
    data = refData.coolingTimes;
  } else if (message.includes('แรงดัน') || message.includes('pressure')) {
    tableType = 'pressure';
    data = refData.injectionPressures;
  }
  
  // Return Flex Message for LINE
  if (useFlex && tableType && data) {
    return {
      isTeachingMode: true,
      flexMessage: createReferenceTableFlexMessage(tableType, data)
    };
  }
  
  // Fallback text response
  let response = '';
  
  if (tableType === 'drying') {
    response = `📊 **ตารางอุณหภูมิอบเม็ดพลาสติก**

┌─────────────┬──────────────┬─────────────┐
│ พลาสติก    │ อุณหภูมิ(°C) │ เวลา(ชม.)  │
├─────────────┼──────────────┼─────────────┤`;
    
    for (const [plastic, info] of Object.entries(data)) {
      response += `\n│ ${plastic.padEnd(11)} │ ${info.temp.padEnd(12)} │ ${info.time.padEnd(11)} │`;
    }
    response += `\n└─────────────┴──────────────┴─────────────┘`;
  }
  else if (tableType === 'cooling') {
    response = `📊 **ตารางเวลาหล่อเย็น**

┌─────────────┬────────────────┐
│ พลาสติก    │ เวลา (วินาที) │
├─────────────┼────────────────┤`;
    
    for (const [plastic, time] of Object.entries(data)) {
      response += `\n│ ${plastic.padEnd(11)} │ ${time.padEnd(14)} │`;
    }
    response += `\n└─────────────┴────────────────┘`;
  }
  else if (tableType === 'pressure') {
    response = `📊 **ตารางแรงดันฉีด**

┌─────────────┬──────────────────┐
│ พลาสติก    │ แรงดัน (kg/cm²) │
├─────────────┼──────────────────┤`;
    
    for (const [plastic, pressure] of Object.entries(data)) {
      response += `\n│ ${plastic.padEnd(11)} │ ${pressure.padEnd(16)} │`;
    }
    response += `\n└─────────────┴──────────────────┘`;
  }
  else {
    response = `📊 **ตารางอ้างอิงที่มี:**

• พิมพ์ "ตารางอบ" - ดูอุณหภูมิอบเม็ดพลาสติก
• พิมพ์ "ตารางเย็น" - ดูเวลาหล่อเย็น
• พิมพ์ "ตารางแรงดัน" - ดูแรงดันฉีด`;
  }
  
  return {
    isTeachingMode: true,
    response
  };
}

/**
 * Check if message is teaching-related
 */
function isTeachingRelated(message) {
  const teachingKeywords = [
    'เรียน', 'สอน', 'บทที่', 'level', 'เลเวล', 'quiz', 'ทดสอบ',
    'หลักสูตร', 'เนื้อหา', 'ความก้าวหน้า', 'progress', 'ตาราง',
    'พื้นฐาน', 'เริ่มต้น', 'beginner', 'ฉีดพลาสติก', 'injection'
  ];
  
  const lowerMessage = message.toLowerCase();
  return teachingKeywords.some(keyword => lowerMessage.includes(keyword));
}

/**
 * Get teaching prompt for AI context
 */
function getTeachingPrompt() {
  return TEXTBOOK_TEACHING_PROMPT;
}

/**
 * Get lessons database
 */
function getLessonsData() {
  return lessonsData;
}

/**
 * Get quiz questions for specific level
 */
function getQuizQuestions(level) {
  return QUIZ_DATABASE[`level${level}`] || [];
}

/**
 * Get lesson images
 */
function getLessonImages() {
  return LESSON_IMAGES;
}

/**
 * Get level colors
 */
function getLevelColors() {
  return LEVEL_COLORS;
}

module.exports = {
  processTeachingCommand,
  processQuizAnswer,
  isTeachingRelated,
  getTeachingPrompt,
  getLessonsData,
  getQuizQuestions,
  getLessonImages,
  getLevelColors,
  TEXTBOOK_TEACHING_PROMPT,
  // Flex template exports
  createWelcomeFlexMessage,
  createLessonFlexMessage,
  createCurriculumFlexMessage,
  createLevelOverviewFlexMessage,
  createQuizFlexMessage,
  createQuizResultFlexMessage,
  createProgressFlexMessage,
  createReferenceTableFlexMessage
};
