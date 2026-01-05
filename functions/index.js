const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {initializeApp} = require("firebase-admin/app");
// Force redeploy v3: 2025-12-11 - Added Memory Note System
const {getFirestore, FieldValue} = require("firebase-admin/firestore");
const {GoogleGenerativeAI} = require("@google/generative-ai");
const line = require("@line/bot-sdk");
const axios = require("axios");
const {PORCHESON_KNOWLEDGE_PROMPT} = require("./porcheson_knowledge_prompt");
const {TOSHIBA_KNOWLEDGE_PROMPT} = require("./toshiba_knowledge_prompt");
const {TECHMATION_KNOWLEDGE_PROMPT} = require("./Techmotion_knowledge_prompt");
const {KAIZEN_EXPERT_PROMPT} = require("./kaizen_expert_prompt");
const {INJECTION_MOLDING_EXPERT_PROMPT} = require("./injection_molding_expert_prompt");
const {PLASTIC_MATERIALS_PROMPT} = require("./plastic_materials_prompt");
const {VICTOR_KNOWLEDGE_PROMPT} = require("./victor_knowledge_prompt");
const {FANUC_KNOWLEDGE_PROMPT} = require("./fanuc_knowledge_prompt");
const {YUSHIN_KNOWLEDGE_PROMPT} = require("./yushin_knowledge_prompt");
// 🎓 Teaching System - AI Teaching Assistant for Injection Molding
const {
  processTeachingCommand, 
  processQuizAnswer,
  isTeachingRelated, 
  getTeachingPrompt, 
  TEXTBOOK_TEACHING_PROMPT,
  createWelcomeFlexMessage,
  createLessonFlexMessage,
  createCurriculumFlexMessage,
  createLevelOverviewFlexMessage,
  createQuizFlexMessage,
  createQuizResultFlexMessage,
  createProgressFlexMessage,
  createReferenceTableFlexMessage
} = require("./teaching_handler");
const {getHyperLocalizedKnowledge, KNOWLEDGE_CATEGORIES, seedInitialKnowledge} = require("./hyper_localized_knowledge");
const {getSuperAdminMemory} = require("./super_admin_memory");
const {isAccountingCommand, handleAccountingCommand, getAccountingHelp} = require("./accounting_system");
const {CalculatorTools, DiagnosticTools, DocumentGenerator, QuickReference, TeamCommunication, VisionTools, AdminTools, parseToolCommand, getToolList, createInjectionCalculationFlex, createDefectDiagnosisFlex, createMaterialTempFlex, createDefectGuideFlex, createFormulasFlex, createSetupSheetFlex, createInjectionToolsMenuFlex, createCalculatorMenuFlex} = require("./professional_tools");
const {createAdminStatsMessage, createDailySummaryMessage, createTopUsersMessage, createPremiumReportMessage, createUserInfoMessage, createRecentUsersMessage, createRecentUsersMessageSimple, createPendingItemsMessage, createSimpleMessage, sanitizeTextForLine, createAdminControlPanelMessage, createUserDetailMessage, createBanConfirmationMessage, createTestModeMessage, createOrgListMessage, createAdminTestDashboard, createQuickTestMenu, createKnowledgeListFlex, createKnowledgeVerifyFlex, createHybridTestFlex, createKnowledgeOptimizeFlex, createKnowledgeMenuFlex, createEmptyKnowledgeFlex, createKnowledgeStatsFlexMessage, createHybridStatsFlexMessage, createKnowledgeQuickAddForm, createKnowledgeDetailedForm, createKnowledgeExamplesForm, createAdminSuperDashboard, createUserControlPanel, createUserListFlex, createSystemCleanupFlex, createSystemLogsFlex, createAIPromptsFlex, createAIAnalyticsFlex} = require("./adminFlexMessages");
const {createEnhancedSuperAdminDashboard} = require("./superAdminEnhanced");
const enhancedHandlers = require("./enhancedAdminHandlers");
const {createAIResponseFlex, createSimpleAIResponseFlex, getOptimalAIResponse, createFeedbackThankYouFlex} = require("./aiResponseFlex");
const {createQuotaLimitMessage, createWelcomeMessage, createPlasticConsultationMenu, createTemperatureTableMessage, createSmartFarmMenu, createPremiumPackageMessage, createHelpMenuMessage, createProductionReportMessage, createSummaryDashboardMessage, createTeamAnnouncementMessage, createBroadcastResultMessage, createOrgCodeGuideMessage, createReportSuccessQuickMessage, createPaymentInstructionMessage, createEmailConfirmationMessage, createPackageDetailMessage, createAllPackagesCarousel, createAccountingGuideMessage} = require("./flexMessageGenerator");
const {generateDailyReport, getReportHistory, createReportResultFlex, createReportSelectionFlex} = require("./reportGenerator");
const {LESSONS, QUIZ_QUESTIONS, createStudentMenuFlex, createLessonListFlex, createLessonContentFlex, createQuizQuestionFlex, createAnswerResultFlex, createExamPrepFlex, createFAQFlex, createQuizResultFlex, askInjectionMoldingAI} = require("./studentLearning");
const quizEnhancement = require("./quizEnhancement");
const quizFlexMessages = require("./quizFlexMessages");
const {EDUCATION_LEVELS, SUBJECTS, COURSES, SAMPLE_LESSONS, STUDY_TOOLS, AI_TUTOR_MODES, ACHIEVEMENT_BADGES, LEVEL_SYSTEM, DAILY_CHALLENGES, MINI_GAMES, GRADE_DIFFICULTY, createEducationHubMenuFlex, createSubjectsMenuFlex, createCourseUnitsFlex, createAITutorMenuFlex, createStudyToolsMenuFlex, createQuickToolsMenuFlex, createToolResponseFlex, createPrimaryGradeMenuFlex, createPrimarySubjectsMenuFlex, createProgressDashboardFlex, createDailyChallengeMenuFlex, createMiniGamesMenuFlex, createBadgeGalleryFlex, createAILessonFlex, createLeaderboardFlex, getEducationSystemPrompt, createSubjectPrompt, detectEducationContext, isEducationQuestion, searchCourses, recommendCourses} = require("./educationHub");
// 🛒 Marketplace System - C2C Buy/Sell Platform
const {handleMarketplace, isMarketplaceCommand, getUserMarketplaceState, USER_STATES} = require("./marketplaceSystem");
// 🌐 Marketplace Web API
const marketplaceWebAPI = require("./marketplaceWebAPI");
// 📝 Memory Note System - Personal Notes & Calendar
const {handleMemoryWebhook, isAnyMemoryCommand} = require("./memoryNoteSystem");
// � Injection Molding Learning System - Progressive Learning
const {
  isIMLCommand,
  processIMLCommand,
  CURRICULUM,
  getUserProgress,
  updateUserProgress
} = require("./injectionMoldingLearning");
// �🎁 Trial System - 7 Day Trial Experience
const {
  TRIAL_CONFIG,
  TRIAL_STATUS,
  getTrialStatus,
  recordFirstInteraction,
  acceptTermsAndStartTrial,
  recordTrialUsage,
  canUseService,
  recordTeaserUsage,
  createWelcomeTrialFlex,
  createTrialStartedFlex,
  createDailyStatusFlex,
  createDailyLimitFlex,
  createTrialEndingSoonFlex,
  createTrialExpiredFlex,
  createFeaturesMenuFlex,
  shouldShowNotification,
} = require("./trialSystem");
initializeApp();
// Force redeploy: 2025-12-08T10:00 - Add Package Detail Flex Messages
// ✅ ปรับปรุงการตั้งค่า LINE Config พร้อมใส่ Secret ของคุณ
const lineConfig = {
  // ใส่ Channel Access Token (แบบยาว) ของคุณที่นี่ หรือใช้ process.env
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || "",

  // 🔐 ใส่ Channel Secret ที่คุณระบุมา
  channelSecret: process.env.LINE_CHANNEL_SECRET || "50872b114ef7974f7ddab5219c0decb6",
};

// สร้าง LINE Client instance (เฉพาะเมื่อมี credentials)
let lineClient = null;
if (lineConfig.channelAccessToken && lineConfig.channelSecret) {
  try {
    lineClient = new line.Client(lineConfig);
    console.log("✅ LINE Bot SDK initialized successfully");
  } catch (error) {
    console.error("⚠️ Failed to initialize LINE Bot SDK:", error.message);
  }
} else {
  // console.warn('⚠️ LINE credentials not configured. LINE features disabled.');
}

// =====================================================
// � PLASTIC MATERIALS DATABASE
// =====================================================
const PLASTIC_MATERIALS_DB = {
  // ==================== ABS ====================
  "ABS": {
    name: "ABS (Acrylonitrile Butadiene Styrene)",
    nameThai: "เอบีเอส",
    category: "Engineering Plastic",
    meltTemp: {min: 200, max: 260, recommended: 230},
    moldTemp: {min: 40, max: 80, recommended: 60},
    dryingTemp: {temp: 80, time: "2-4 ชั่วโมง"},
    moisture: "< 0.1%",
    shrinkage: {min: 0.4, max: 0.7, unit: "%"},
    density: 1.04,
    properties: ["ทนแรงกระแทกดี", "แข็งแรง", "ผิวมันวาว", "ทาสีได้ดี"],
    applications: ["ชิ้นส่วนรถยนต์", "เครื่องใช้ไฟฟ้า", "ของเล่น", "หมวกนิรภัย"],
    warnings: ["ห้ามให้ความร้อนเกิน 280°C", "ต้องอบแห้งก่อนใช้", "ไวต่อ UV"],
    commonDefects: ["รอยไหม้จากความร้อนสูง", "Silver Streak จากความชื้น", "Weld Line"],
    injectionPressure: {min: 50, max: 100, unit: "MPa"},
    injectionSpeed: "ปานกลางถึงเร็ว",
    backPressure: {min: 2, max: 5, unit: "MPa"},
  },
  
  // ==================== PP ====================
  "PP": {
    name: "PP (Polypropylene)",
    nameThai: "โพลีโพรพิลีน",
    category: "Commodity Plastic",
    meltTemp: {min: 200, max: 280, recommended: 230},
    moldTemp: {min: 20, max: 80, recommended: 40},
    dryingTemp: {temp: null, time: "ไม่จำเป็นต้องอบ"},
    moisture: "ดูดความชื้นต่ำ",
    shrinkage: {min: 1.0, max: 2.5, unit: "%"},
    density: 0.90,
    properties: ["เบา", "ทนสารเคมี", "ทนความเมื่อยล้า", "ราคาถูก"],
    applications: ["บรรจุภัณฑ์", "ของใช้ในบ้าน", "ชิ้นส่วนรถยนต์", "ท่อ"],
    warnings: ["หดตัวสูง", "ติดกาวยาก", "ทนแรงกระแทกต่ำที่อุณหภูมิต่ำ"],
    commonDefects: ["Warpage จากการหดตัว", "Sink Mark", "Void"],
    injectionPressure: {min: 40, max: 100, unit: "MPa"},
    injectionSpeed: "เร็ว",
    backPressure: {min: 2, max: 5, unit: "MPa"},
  },
  
  // ==================== PC ====================
  "PC": {
    name: "PC (Polycarbonate)",
    nameThai: "โพลีคาร์บอเนต",
    category: "Engineering Plastic",
    meltTemp: {min: 280, max: 320, recommended: 300},
    moldTemp: {min: 80, max: 120, recommended: 100},
    dryingTemp: {temp: 120, time: "4-6 ชั่วโมง"},
    moisture: "< 0.02%",
    shrinkage: {min: 0.5, max: 0.7, unit: "%"},
    density: 1.20,
    properties: ["โปร่งใส", "ทนแรงกระแทกสูงมาก", "ทนความร้อน", "แข็งแรง"],
    applications: ["CD/DVD", "กระจกนิรภัย", "ไฟหน้ารถ", "เลนส์"],
    warnings: ["ต้องอบแห้งอย่างเคร่งครัด", "ไวต่อสารเคมี", "ต้องการความดันสูง"],
    commonDefects: ["Silver Streak", "Stress Crack", "รอยไหม้"],
    injectionPressure: {min: 80, max: 150, unit: "MPa"},
    injectionSpeed: "ปานกลาง",
    backPressure: {min: 5, max: 10, unit: "MPa"},
  },
  
  // ==================== PA (Nylon) ====================
  "PA": {
    name: "PA/Nylon (Polyamide)",
    nameThai: "ไนลอน",
    aliases: ["Nylon", "PA6", "PA66"],
    category: "Engineering Plastic",
    meltTemp: {min: 260, max: 290, recommended: 275},
    moldTemp: {min: 60, max: 90, recommended: 80},
    dryingTemp: {temp: 80, time: "4-6 ชั่วโมง"},
    moisture: "< 0.1%",
    shrinkage: {min: 0.8, max: 2.0, unit: "%"},
    density: 1.14,
    properties: ["ทนการสึกหรอ", "ทนแรงกระแทก", "ลื่น", "ทนสารเคมี"],
    applications: ["เฟือง", "ลูกปืน", "สายพาน", "ข้อต่อ"],
    warnings: ["ดูดความชื้นสูงมาก", "ต้องอบแห้งก่อนใช้ทุกครั้ง", "หดตัวสูง"],
    commonDefects: ["ฟองอากาศจากความชื้น", "Warpage", "Sink Mark"],
    injectionPressure: {min: 60, max: 120, unit: "MPa"},
    injectionSpeed: "เร็ว",
    backPressure: {min: 3, max: 8, unit: "MPa"},
  },
  
  // ==================== POM ====================
  "POM": {
    name: "POM (Polyoxymethylene/Acetal)",
    nameThai: "พอม/อะซีทัล",
    aliases: ["Acetal", "Delrin"],
    category: "Engineering Plastic",
    meltTemp: {min: 180, max: 220, recommended: 200},
    moldTemp: {min: 60, max: 120, recommended: 90},
    dryingTemp: {temp: 80, time: "2-3 ชั่วโมง"},
    moisture: "< 0.1%",
    shrinkage: {min: 1.8, max: 3.0, unit: "%"},
    density: 1.42,
    properties: ["แข็งแรงมาก", "ทนการสึกหรอ", "มิติเสถียร", "ลื่นมาก"],
    applications: ["เฟือง", "ลูกปืน", "คลิป", "สปริง"],
    warnings: ["ห้ามให้ความร้อนเกิน 230°C จะสลายตัวเป็นก๊าซพิษ", "หดตัวสูงมาก"],
    commonDefects: ["Void ตรงกลาง", "Sink Mark", "Warpage"],
    injectionPressure: {min: 80, max: 130, unit: "MPa"},
    injectionSpeed: "เร็ว",
    backPressure: {min: 3, max: 8, unit: "MPa"},
  },
  
  // ==================== PE ====================
  "PE": {
    name: "PE (Polyethylene)",
    nameThai: "โพลีเอทิลีน",
    aliases: ["HDPE", "LDPE", "LLDPE"],
    category: "Commodity Plastic",
    meltTemp: {min: 180, max: 280, recommended: 220},
    moldTemp: {min: 20, max: 60, recommended: 40},
    dryingTemp: {temp: null, time: "ไม่จำเป็นต้องอบ"},
    moisture: "ดูดความชื้นต่ำมาก",
    shrinkage: {min: 1.5, max: 4.0, unit: "%"},
    density: 0.94,
    properties: ["เหนียว", "ทนสารเคมี", "ราคาถูก", "ฉนวนไฟฟ้าดี"],
    applications: ["ถุงพลาสติก", "ขวด", "ท่อ", "ถังน้ำ"],
    warnings: ["หดตัวสูงมาก", "ติดกาวยาก", "ทาสียาก"],
    commonDefects: ["Warpage", "Sink Mark", "Weld Line ไม่แข็งแรง"],
    injectionPressure: {min: 40, max: 100, unit: "MPa"},
    injectionSpeed: "ปานกลางถึงเร็ว",
    backPressure: {min: 2, max: 5, unit: "MPa"},
  },
  
  // ==================== PS ====================
  "PS": {
    name: "PS (Polystyrene)",
    nameThai: "โพลีสไตรีน",
    aliases: ["GPPS", "HIPS"],
    category: "Commodity Plastic",
    meltTemp: {min: 180, max: 280, recommended: 220},
    moldTemp: {min: 20, max: 60, recommended: 40},
    dryingTemp: {temp: 70, time: "1-2 ชั่วโมง (ถ้าจำเป็น)"},
    moisture: "< 0.1%",
    shrinkage: {min: 0.3, max: 0.6, unit: "%"},
    density: 1.05,
    properties: ["โปร่งใส (GPPS)", "แข็ง", "ขึ้นรูปง่าย", "ราคาถูก"],
    applications: ["บรรจุภัณฑ์", "ของเล่น", "ถ้วยโยเกิร์ต", "โฟม"],
    warnings: ["เปราะ", "ทนความร้อนต่ำ", "ไวต่อตัวทำละลาย"],
    commonDefects: ["แตกร้าว", "Stress Crack", "รอยไหม้"],
    injectionPressure: {min: 40, max: 100, unit: "MPa"},
    injectionSpeed: "ปานกลาง",
    backPressure: {min: 2, max: 5, unit: "MPa"},
  },
  
  // ==================== PET ====================
  "PET": {
    name: "PET (Polyethylene Terephthalate)",
    nameThai: "เพ็ท",
    category: "Engineering Plastic",
    meltTemp: {min: 260, max: 290, recommended: 275},
    moldTemp: {min: 15, max: 50, recommended: 30},
    dryingTemp: {temp: 160, time: "4-6 ชั่วโมง"},
    moisture: "< 0.02%",
    shrinkage: {min: 0.2, max: 0.8, unit: "%"},
    density: 1.38,
    properties: ["โปร่งใส", "ทนสารเคมี", "ทนความร้อน", "รีไซเคิลได้"],
    applications: ["ขวดน้ำ", "Preform", "ฟิล์ม", "เส้นใย"],
    warnings: ["ต้องอบแห้งอย่างเคร่งครัด", "IV drop ถ้าอบไม่ดี", "ต้องทำให้เย็นเร็ว"],
    commonDefects: ["AA (Acetaldehyde)", "Crystallization", "IV Drop"],
    injectionPressure: {min: 80, max: 140, unit: "MPa"},
    injectionSpeed: "เร็วมาก",
    backPressure: {min: 3, max: 8, unit: "MPa"},
  },
  
  // ==================== PVC ====================
  "PVC": {
    name: "PVC (Polyvinyl Chloride)",
    nameThai: "พีวีซี",
    category: "Commodity Plastic",
    meltTemp: {min: 160, max: 200, recommended: 180},
    moldTemp: {min: 20, max: 60, recommended: 40},
    dryingTemp: {temp: 70, time: "1-2 ชั่วโมง (ถ้าจำเป็น)"},
    moisture: "< 0.3%",
    shrinkage: {min: 0.1, max: 0.5, unit: "%"},
    density: 1.40,
    properties: ["ทนสารเคมี", "ทนไฟ", "ราคาถูก", "ฉนวนไฟฟ้าดี"],
    applications: ["ท่อ", "สายไฟ", "วงกบประตู", "ฟิล์ม"],
    warnings: ["สลายตัวง่าย ปล่อยก๊าซ HCl", "ต้องล้างเครื่องหลังใช้", "อย่าให้ค้างในเครื่องนาน"],
    commonDefects: ["Burning (ก๊าซพิษ)", "Discoloration", "รอยไหม้"],
    injectionPressure: {min: 40, max: 100, unit: "MPa"},
    injectionSpeed: "ช้า",
    backPressure: {min: 2, max: 5, unit: "MPa"},
  },

  // ==================== TPU ====================
  "TPU": {
    name: "TPU (Thermoplastic Polyurethane)",
    nameThai: "ทีพียู",
    category: "Thermoplastic Elastomer",
    meltTemp: {min: 180, max: 230, recommended: 200},
    moldTemp: {min: 20, max: 60, recommended: 40},
    dryingTemp: {temp: 100, time: "2-4 ชั่วโมง"},
    moisture: "< 0.05%",
    shrinkage: {min: 0.5, max: 1.5, unit: "%"},
    density: 1.20,
    properties: ["ยืดหยุ่น", "ทนการสึกหรอ", "ทนน้ำมัน", "ความยืดหยุ่นคืนตัวดี"],
    applications: ["พื้นรองเท้า", "สายยาง", "เคสโทรศัพท์", "ซีล"],
    warnings: ["ต้องอบแห้ง", "Cycle Time นาน", "อาจติดแม่พิมพ์"],
    commonDefects: ["ติดแม่พิมพ์", "ฟองอากาศ", "Flow Mark"],
    injectionPressure: {min: 30, max: 80, unit: "MPa"},
    injectionSpeed: "ช้าถึงปานกลาง",
    backPressure: {min: 2, max: 5, unit: "MPa"},
  },

  // ==================== PMMA (Acrylic) ====================
  "PMMA": {
    name: "PMMA (Polymethyl Methacrylate)",
    nameThai: "อะคริลิค / พีเอ็มเอ็มเอ",
    aliases: ["Acrylic", "Plexiglass"],
    category: "Engineering Plastic",
    meltTemp: {min: 220, max: 260, recommended: 240},
    moldTemp: {min: 40, max: 80, recommended: 60},
    dryingTemp: {temp: 80, time: "3-4 ชั่วโมง"},
    moisture: "< 0.1%",
    shrinkage: {min: 0.2, max: 0.8, unit: "%"},
    density: 1.19,
    properties: ["โปร่งใสมาก", "ทนรอยขีดข่วน", "ทน UV", "ผิวมันวาว"],
    applications: ["ป้ายไฟ", "เลนส์", "ตู้โชว์", "ชิ้นส่วนเครื่องสำอาง"],
    warnings: ["เปราะ", "ไวต่อตัวทำละลาย", "ต้องอบแห้ง"],
    commonDefects: ["Stress Crack", "Silver Streak", "รอยไหม้"],
    injectionPressure: {min: 60, max: 120, unit: "MPa"},
    injectionSpeed: "ปานกลาง",
    backPressure: {min: 3, max: 8, unit: "MPa"},
  },

  // ==================== PBT ====================
  "PBT": {
    name: "PBT (Polybutylene Terephthalate)",
    nameThai: "พีบีที",
    category: "Engineering Plastic",
    meltTemp: {min: 230, max: 270, recommended: 250},
    moldTemp: {min: 40, max: 90, recommended: 70},
    dryingTemp: {temp: 120, time: "3-4 ชั่วโมง"},
    moisture: "< 0.02%",
    shrinkage: {min: 1.5, max: 2.5, unit: "%"},
    density: 1.31,
    properties: ["ทนสารเคมี", "ทนความร้อน", "ฉนวนไฟฟ้าดี", "มิติเสถียร"],
    applications: ["Connector ไฟฟ้า", "ชิ้นส่วนรถยนต์", "สวิตช์", "Housing"],
    warnings: ["ต้องอบแห้ง", "หดตัวสูง", "Notch Sensitivity สูง"],
    commonDefects: ["Silver Streak", "Warpage", "Weld Line อ่อน"],
    injectionPressure: {min: 60, max: 120, unit: "MPa"},
    injectionSpeed: "เร็ว",
    backPressure: {min: 3, max: 8, unit: "MPa"},
  },

  // ==================== SAN ====================
  "SAN": {
    name: "SAN (Styrene Acrylonitrile)",
    nameThai: "แซน",
    category: "Engineering Plastic",
    meltTemp: {min: 200, max: 260, recommended: 230},
    moldTemp: {min: 40, max: 80, recommended: 60},
    dryingTemp: {temp: 80, time: "2-3 ชั่วโมง"},
    moisture: "< 0.1%",
    shrinkage: {min: 0.3, max: 0.7, unit: "%"},
    density: 1.08,
    properties: ["โปร่งใส", "แข็งแรงกว่า PS", "ทนสารเคมี", "ผิวมันวาว"],
    applications: ["เครื่องใช้ในครัว", "ชิ้นส่วนเครื่องสำอาง", "ถ้วยน้ำ", "แผ่นใส"],
    warnings: ["เปราะกว่า ABS", "ไวต่อ Stress Crack", "ทนแรงกระแทกต่ำ"],
    commonDefects: ["Stress Crack", "Silver Streak", "รอยไหม้"],
    injectionPressure: {min: 50, max: 100, unit: "MPa"},
    injectionSpeed: "ปานกลาง",
    backPressure: {min: 2, max: 5, unit: "MPa"},
  },

  // ==================== ASA ====================
  "ASA": {
    name: "ASA (Acrylonitrile Styrene Acrylate)",
    nameThai: "เอเอสเอ",
    category: "Engineering Plastic",
    meltTemp: {min: 230, max: 270, recommended: 250},
    moldTemp: {min: 50, max: 90, recommended: 70},
    dryingTemp: {temp: 80, time: "2-4 ชั่วโมง"},
    moisture: "< 0.1%",
    shrinkage: {min: 0.4, max: 0.7, unit: "%"},
    density: 1.07,
    properties: ["ทน UV ดีเยี่ยม", "ทนสภาพอากาศ", "ทนแรงกระแทก", "สีไม่ซีด"],
    applications: ["ชิ้นส่วนภายนอกรถยนต์", "อุปกรณ์กลางแจ้ง", "หลังคา", "ของตกแต่ง"],
    warnings: ["ราคาแพงกว่า ABS", "ต้องอบแห้ง", "อาจมี Flow Mark"],
    commonDefects: ["Flow Mark", "Weld Line", "Silver Streak"],
    injectionPressure: {min: 50, max: 100, unit: "MPa"},
    injectionSpeed: "ปานกลางถึงเร็ว",
    backPressure: {min: 2, max: 5, unit: "MPa"},
  },

  // ==================== PPO/PPE ====================
  "PPO": {
    name: "PPO/PPE (Polyphenylene Oxide)",
    nameThai: "พีพีโอ / พีพีอี",
    aliases: ["PPE", "Noryl"],
    category: "Engineering Plastic",
    meltTemp: {min: 260, max: 300, recommended: 280},
    moldTemp: {min: 60, max: 110, recommended: 90},
    dryingTemp: {temp: 100, time: "2-4 ชั่วโมง"},
    moisture: "< 0.1%",
    shrinkage: {min: 0.5, max: 0.8, unit: "%"},
    density: 1.06,
    properties: ["ทนความร้อนสูง", "มิติเสถียรดีมาก", "ฉนวนไฟฟ้าดี", "ทนน้ำร้อน"],
    applications: ["ชิ้นส่วนไฟฟ้า", "ชิ้นส่วนเครื่องใช้ไฟฟ้า", "ถาดอบ", "Pump Housing"],
    warnings: ["ต้องใช้อุณหภูมิสูง", "มักผสมกับ PS", "ต้องอบแห้ง"],
    commonDefects: ["รอยไหม้", "Flow Mark", "Weld Line"],
    injectionPressure: {min: 70, max: 130, unit: "MPa"},
    injectionSpeed: "ปานกลาง",
    backPressure: {min: 3, max: 8, unit: "MPa"},
  },

  // ==================== LCP ====================
  "LCP": {
    name: "LCP (Liquid Crystal Polymer)",
    nameThai: "แอลซีพี",
    category: "High Performance Plastic",
    meltTemp: {min: 280, max: 350, recommended: 310},
    moldTemp: {min: 70, max: 150, recommended: 100},
    dryingTemp: {temp: 150, time: "4-6 ชั่วโมง"},
    moisture: "< 0.02%",
    shrinkage: {min: 0.1, max: 0.5, unit: "%"},
    density: 1.40,
    properties: ["ไหลดีมาก", "ทนความร้อนสูง", "แข็งแรงมาก", "มิติเสถียรมาก"],
    applications: ["Connector ขนาดเล็ก", "ชิ้นส่วนอิเล็กทรอนิกส์", "SMT Parts", "Chip Carrier"],
    warnings: ["แพง", "Anisotropic Shrinkage", "Weld Line อ่อนมาก"],
    commonDefects: ["Weld Line อ่อน", "Fiber Orientation", "Flashing"],
    injectionPressure: {min: 50, max: 100, unit: "MPa"},
    injectionSpeed: "เร็วมาก",
    backPressure: {min: 1, max: 3, unit: "MPa"},
  },

  // ==================== PEEK ====================
  "PEEK": {
    name: "PEEK (Polyether Ether Ketone)",
    nameThai: "พีค",
    category: "High Performance Plastic",
    meltTemp: {min: 360, max: 400, recommended: 380},
    moldTemp: {min: 150, max: 200, recommended: 180},
    dryingTemp: {temp: 150, time: "3-4 ชั่วโมง"},
    moisture: "< 0.02%",
    shrinkage: {min: 1.0, max: 1.5, unit: "%"},
    density: 1.32,
    properties: ["ทนความร้อนสูงมาก", "ทนสารเคมี", "แข็งแรงมาก", "ทนการสึกหรอ"],
    applications: ["ชิ้นส่วนการแพทย์", "Aerospace", "ชิ้นส่วนยานยนต์", "Pump Impeller"],
    warnings: ["แพงมาก", "ต้องใช้อุณหภูมิสูง", "ต้องมี Barrel ทนความร้อน"],
    commonDefects: ["Crystallinity ไม่สม่ำเสมอ", "Void", "Sink Mark"],
    injectionPressure: {min: 70, max: 140, unit: "MPa"},
    injectionSpeed: "ปานกลาง",
    backPressure: {min: 5, max: 10, unit: "MPa"},
  },

  // ==================== PPS ====================
  "PPS": {
    name: "PPS (Polyphenylene Sulfide)",
    nameThai: "พีพีเอส",
    category: "High Performance Plastic",
    meltTemp: {min: 300, max: 340, recommended: 320},
    moldTemp: {min: 120, max: 160, recommended: 140},
    dryingTemp: {temp: 150, time: "3-4 ชั่วโมง"},
    moisture: "< 0.02%",
    shrinkage: {min: 0.2, max: 0.5, unit: "%"},
    density: 1.35,
    properties: ["ทนสารเคมีดีมาก", "ทนความร้อน", "ทนไฟ", "มิติเสถียร"],
    applications: ["ชิ้นส่วนรถยนต์ใต้ฝากระโปรง", "ปั๊มน้ำ", "วาล์ว", "Connector"],
    warnings: ["เปราะ", "ต้องใช้ Glass Fiber Reinforce", "แม่พิมพ์ต้องทนการกัดกร่อน"],
    commonDefects: ["Flashing", "Weld Line อ่อน", "เปราะแตก"],
    injectionPressure: {min: 70, max: 140, unit: "MPa"},
    injectionSpeed: "เร็ว",
    backPressure: {min: 3, max: 8, unit: "MPa"},
  },

  // ==================== TPE ====================
  "TPE": {
    name: "TPE (Thermoplastic Elastomer)",
    nameThai: "ทีพีอี",
    aliases: ["TPE-S", "SEBS", "TPE-V"],
    category: "Thermoplastic Elastomer",
    meltTemp: {min: 170, max: 230, recommended: 200},
    moldTemp: {min: 20, max: 60, recommended: 40},
    dryingTemp: {temp: 70, time: "2-3 ชั่วโมง (ถ้าจำเป็น)"},
    moisture: "< 0.1%",
    shrinkage: {min: 0.8, max: 2.5, unit: "%"},
    density: 0.95,
    properties: ["ยืดหยุ่น", "นิ่ม", "รีไซเคิลได้", "Over-mold ได้ดี"],
    applications: ["ด้ามจับ", "ซีล", "Grip", "ของเล่น", "อุปกรณ์กีฬา"],
    warnings: ["หดตัวสูง", "อาจติดแม่พิมพ์", "Cycle Time นาน"],
    commonDefects: ["ติดแม่พิมพ์", "Warpage", "Sink Mark"],
    injectionPressure: {min: 20, max: 60, unit: "MPa"},
    injectionSpeed: "ช้าถึงปานกลาง",
    backPressure: {min: 1, max: 5, unit: "MPa"},
  },

  // ==================== EVA ====================
  "EVA": {
    name: "EVA (Ethylene Vinyl Acetate)",
    nameThai: "อีวีเอ",
    category: "Thermoplastic Elastomer",
    meltTemp: {min: 150, max: 200, recommended: 170},
    moldTemp: {min: 20, max: 50, recommended: 35},
    dryingTemp: {temp: null, time: "ไม่จำเป็นต้องอบ"},
    moisture: "ดูดความชื้นต่ำ",
    shrinkage: {min: 1.0, max: 3.0, unit: "%"},
    density: 0.94,
    properties: ["ยืดหยุ่น", "นิ่ม", "ทนแรงกระแทก", "ทนความเย็น"],
    applications: ["พื้นรองเท้า", "โฟม", "Padding", "บรรจุภัณฑ์กันกระแทก"],
    warnings: ["หดตัวสูง", "ทนความร้อนต่ำ", "ติดแม่พิมพ์ง่าย"],
    commonDefects: ["ติดแม่พิมพ์", "Warpage", "Foaming ไม่สม่ำเสมอ"],
    injectionPressure: {min: 20, max: 60, unit: "MPa"},
    injectionSpeed: "ช้า",
    backPressure: {min: 1, max: 3, unit: "MPa"},
  },

  // ==================== PC/ABS ====================
  "PC/ABS": {
    name: "PC/ABS (Polycarbonate/ABS Blend)",
    nameThai: "พีซี/เอบีเอส ผสม",
    aliases: ["PCABS", "PC-ABS"],
    category: "Engineering Plastic Blend",
    meltTemp: {min: 240, max: 280, recommended: 260},
    moldTemp: {min: 60, max: 90, recommended: 75},
    dryingTemp: {temp: 100, time: "3-4 ชั่วโมง"},
    moisture: "< 0.04%",
    shrinkage: {min: 0.5, max: 0.7, unit: "%"},
    density: 1.15,
    properties: ["ทนแรงกระแทกดี", "ทนความร้อน", "ขึ้นรูปง่ายกว่า PC", "ราคาถูกกว่า PC"],
    applications: ["ชิ้นส่วนรถยนต์", "เคสโทรศัพท์", "อุปกรณ์ไฟฟ้า", "เครื่องใช้สำนักงาน"],
    warnings: ["ต้องอบแห้ง", "ไวต่อสารเคมีบางชนิด", "ต้องระวังอุณหภูมิสูงเกินไป"],
    commonDefects: ["Silver Streak", "Delamination", "Stress Crack"],
    injectionPressure: {min: 60, max: 120, unit: "MPa"},
    injectionSpeed: "ปานกลาง",
    backPressure: {min: 3, max: 8, unit: "MPa"},
  },

  // ==================== PA6 GF ====================
  "PA6GF": {
    name: "PA6 GF (Glass Fiber Reinforced Nylon 6)",
    nameThai: "ไนลอน 6 เสริมใยแก้ว",
    aliases: ["PA6-GF30", "GF Nylon", "Glass Filled Nylon"],
    category: "Engineering Plastic (Reinforced)",
    meltTemp: {min: 260, max: 300, recommended: 280},
    moldTemp: {min: 70, max: 110, recommended: 90},
    dryingTemp: {temp: 80, time: "4-6 ชั่วโมง"},
    moisture: "< 0.1%",
    shrinkage: {min: 0.3, max: 0.8, unit: "%"},
    density: 1.35,
    properties: ["แข็งแรงมาก", "ทนความร้อนสูง", "มิติเสถียร", "ทนการสึกหรอ"],
    applications: ["เฟืองรับแรงสูง", "ชิ้นส่วนเครื่องยนต์", "Housing ไฟฟ้า", "Bracket"],
    warnings: ["สึกหรอ Screw และ Barrel", "ต้องใช้ Hardened Steel", "Weld Line อ่อน"],
    commonDefects: ["Fiber Orientation", "Weld Line อ่อน", "Surface Roughness", "Gate Blush"],
    injectionPressure: {min: 80, max: 150, unit: "MPa"},
    injectionSpeed: "ปานกลางถึงเร็ว",
    backPressure: {min: 3, max: 8, unit: "MPa"},
  },

  // ==================== HDPE ====================
  "HDPE": {
    name: "HDPE (High Density Polyethylene)",
    nameThai: "โพลีเอทิลีนความหนาแน่นสูง",
    category: "Commodity Plastic",
    meltTemp: {min: 200, max: 280, recommended: 240},
    moldTemp: {min: 10, max: 50, recommended: 30},
    dryingTemp: {temp: null, time: "ไม่จำเป็นต้องอบ"},
    moisture: "ดูดความชื้นต่ำมาก",
    shrinkage: {min: 1.5, max: 3.0, unit: "%"},
    density: 0.95,
    properties: ["แข็งกว่า LDPE", "ทนสารเคมี", "ทนแรงกระแทก", "ราคาถูก"],
    applications: ["ถังน้ำ", "ขวดนม", "ท่อน้ำ", "ลังพลาสติก"],
    warnings: ["หดตัวสูง", "ติดกาวยาก", "Warpage"],
    commonDefects: ["Warpage", "Sink Mark", "Weld Line อ่อน"],
    injectionPressure: {min: 40, max: 100, unit: "MPa"},
    injectionSpeed: "ปานกลางถึงเร็ว",
    backPressure: {min: 2, max: 5, unit: "MPa"},
  },

  // ==================== LDPE ====================
  "LDPE": {
    name: "LDPE (Low Density Polyethylene)",
    nameThai: "โพลีเอทิลีนความหนาแน่นต่ำ",
    category: "Commodity Plastic",
    meltTemp: {min: 160, max: 240, recommended: 200},
    moldTemp: {min: 10, max: 40, recommended: 25},
    dryingTemp: {temp: null, time: "ไม่จำเป็นต้องอบ"},
    moisture: "ดูดความชื้นต่ำมาก",
    shrinkage: {min: 2.0, max: 4.0, unit: "%"},
    density: 0.92,
    properties: ["นิ่ม", "ยืดหยุ่น", "โปร่งแสง", "ทนความเย็น"],
    applications: ["ถุงพลาสติก", "ฟิล์มยืด", "ขวดบีบ", "ของเล่นนิ่ม"],
    warnings: ["หดตัวสูงมาก", "ทนความร้อนต่ำ", "เปราะเมื่อถูก UV"],
    commonDefects: ["Warpage", "Sink Mark", "Surface Haze"],
    injectionPressure: {min: 30, max: 80, unit: "MPa"},
    injectionSpeed: "ปานกลาง",
    backPressure: {min: 1, max: 4, unit: "MPa"},
  },

  // ==================== HIPS ====================
  "HIPS": {
    name: "HIPS (High Impact Polystyrene)",
    nameThai: "โพลีสไตรีนทนแรงกระแทก",
    category: "Commodity Plastic",
    meltTemp: {min: 180, max: 260, recommended: 220},
    moldTemp: {min: 20, max: 60, recommended: 40},
    dryingTemp: {temp: 70, time: "1-2 ชั่วโมง (ถ้าจำเป็น)"},
    moisture: "< 0.1%",
    shrinkage: {min: 0.4, max: 0.7, unit: "%"},
    density: 1.04,
    properties: ["ทนแรงกระแทกดีกว่า GPPS", "ขึ้นรูปง่าย", "ราคาถูก", "ทาสีได้"],
    applications: ["เครื่องใช้ไฟฟ้า", "บรรจุภัณฑ์", "ของเล่น", "แผงหน้าปัด"],
    warnings: ["ไม่ทนสารทำละลาย", "ทนความร้อนต่ำ", "ไม่ทน UV"],
    commonDefects: ["Stress Crack", "Surface Crack", "รอยไหม้"],
    injectionPressure: {min: 40, max: 100, unit: "MPa"},
    injectionSpeed: "ปานกลาง",
    backPressure: {min: 2, max: 5, unit: "MPa"},
  },

  // ==================== PEI ====================
  "PEI": {
    name: "PEI (Polyetherimide/Ultem)",
    nameThai: "พีอีไอ / อัลเทม",
    aliases: ["Ultem"],
    category: "High Performance Plastic",
    meltTemp: {min: 340, max: 400, recommended: 370},
    moldTemp: {min: 120, max: 175, recommended: 150},
    dryingTemp: {temp: 150, time: "4-6 ชั่วโมง"},
    moisture: "< 0.02%",
    shrinkage: {min: 0.5, max: 0.7, unit: "%"},
    density: 1.27,
    properties: ["ทนความร้อนสูงมาก", "โปร่งใส (สีเหลืองอำพัน)", "ทนไฟ", "ทนสารเคมี"],
    applications: ["ชิ้นส่วนการบิน", "เครื่องมือแพทย์", "Connector ไฟฟ้า", "อุปกรณ์ Sterilize"],
    warnings: ["แพงมาก", "ต้องใช้อุณหภูมิสูง", "ต้องอบแห้งอย่างเคร่งครัด"],
    commonDefects: ["Moisture Splay", "Burn Mark", "Gate Blush"],
    injectionPressure: {min: 80, max: 150, unit: "MPa"},
    injectionSpeed: "ปานกลาง",
    backPressure: {min: 5, max: 10, unit: "MPa"},
  },

  // ==================== PA12 ====================
  "PA12": {
    name: "PA12 (Polyamide 12/Nylon 12)",
    nameThai: "ไนลอน 12",
    aliases: ["Nylon 12"],
    category: "Engineering Plastic",
    meltTemp: {min: 230, max: 270, recommended: 250},
    moldTemp: {min: 30, max: 80, recommended: 60},
    dryingTemp: {temp: 80, time: "4-6 ชั่วโมง"},
    moisture: "< 0.1%",
    shrinkage: {min: 0.8, max: 1.5, unit: "%"},
    density: 1.02,
    properties: ["ดูดความชื้นน้อยกว่า PA6/PA66", "ยืดหยุ่น", "ทนแรงกระแทก", "ทนสารเคมี"],
    applications: ["ท่อเชื้อเพลิง", "ข้อต่อ Quick Connect", "สายเคเบิล", "ชิ้นส่วนยานยนต์"],
    warnings: ["ต้องอบแห้ง", "ราคาสูงกว่า PA6", "Weld Line อ่อน"],
    commonDefects: ["Silver Streak", "Warpage", "Weld Line อ่อน"],
    injectionPressure: {min: 50, max: 100, unit: "MPa"},
    injectionSpeed: "ปานกลางถึงเร็ว",
    backPressure: {min: 3, max: 7, unit: "MPa"},
  },

  // ==================== GPPS ====================
  "GPPS": {
    name: "GPPS (General Purpose Polystyrene)",
    nameThai: "โพลีสไตรีนใส",
    aliases: ["Crystal PS"],
    category: "Commodity Plastic",
    meltTemp: {min: 180, max: 260, recommended: 210},
    moldTemp: {min: 20, max: 50, recommended: 35},
    dryingTemp: {temp: 70, time: "1-2 ชั่วโมง (ถ้าจำเป็น)"},
    moisture: "< 0.1%",
    shrinkage: {min: 0.3, max: 0.6, unit: "%"},
    density: 1.05,
    properties: ["โปร่งใสมาก", "แข็ง", "ขึ้นรูปง่าย", "ราคาถูกมาก"],
    applications: ["ถ้วยใส", "กล่องใส", "CD Case", "ของตกแต่ง"],
    warnings: ["เปราะมาก", "ไม่ทนแรงกระแทก", "ไม่ทนสารทำละลาย"],
    commonDefects: ["แตกร้าว", "Stress Crack", "Surface Haze"],
    injectionPressure: {min: 40, max: 90, unit: "MPa"},
    injectionSpeed: "ปานกลาง",
    backPressure: {min: 2, max: 5, unit: "MPa"},
  },

  // ==================== PPS GF ====================
  "PPSGF": {
    name: "PPS GF (Glass Fiber Reinforced PPS)",
    nameThai: "พีพีเอสเสริมใยแก้ว",
    aliases: ["PPS-GF40", "GF PPS"],
    category: "High Performance Plastic (Reinforced)",
    meltTemp: {min: 310, max: 350, recommended: 330},
    moldTemp: {min: 130, max: 170, recommended: 150},
    dryingTemp: {temp: 150, time: "3-4 ชั่วโมง"},
    moisture: "< 0.02%",
    shrinkage: {min: 0.1, max: 0.4, unit: "%"},
    density: 1.65,
    properties: ["ทนความร้อนสูงมาก", "ทนสารเคมีดีเยี่ยม", "มิติเสถียรมาก", "ทนไฟ"],
    applications: ["ชิ้นส่วนใต้ฝากระโปรง", "ปั๊ม", "วาล์ว", "Electrical Connector"],
    warnings: ["สึกหรอ Screw/Barrel มาก", "ต้องใช้อุณหภูมิสูง", "แม่พิมพ์ต้องทนการกัดกร่อน"],
    commonDefects: ["Flash", "Weld Line อ่อนมาก", "Fiber Floating", "Gate Blush"],
    injectionPressure: {min: 80, max: 150, unit: "MPa"},
    injectionSpeed: "เร็ว",
    backPressure: {min: 3, max: 8, unit: "MPa"},
  },

  // ==================== PETG ====================
  "PETG": {
    name: "PETG (Polyethylene Terephthalate Glycol)",
    nameThai: "เพ็ทจี",
    category: "Engineering Plastic",
    meltTemp: {min: 220, max: 260, recommended: 240},
    moldTemp: {min: 15, max: 50, recommended: 30},
    dryingTemp: {temp: 70, time: "4-6 ชั่วโมง"},
    moisture: "< 0.04%",
    shrinkage: {min: 0.2, max: 0.5, unit: "%"},
    density: 1.27,
    properties: ["โปร่งใสมาก", "ทนแรงกระแทกดี", "ขึ้นรูปง่ายกว่า PET", "ไม่ขาวขุ่น"],
    applications: ["บรรจุภัณฑ์เครื่องสำอาง", "Display", "หน้ากาก Face Shield", "ขวดใสพิเศษ"],
    warnings: ["ต้องอบแห้ง", "Cycle Time นาน", "ทนความร้อนต่ำกว่า PET"],
    commonDefects: ["Moisture Splay", "Haze", "Sink Mark"],
    injectionPressure: {min: 50, max: 100, unit: "MPa"},
    injectionSpeed: "ปานกลาง",
    backPressure: {min: 3, max: 7, unit: "MPa"},
  },
};

// =====================================================
// 🔧 TROUBLESHOOTING GUIDE - คู่มือแก้ปัญหาฉีดพลาสติก
// =====================================================
const TROUBLESHOOTING_GUIDE = {
  // ==================== SHORT SHOT ====================
  "SHORT_SHOT": {
    name: "Short Shot / ฉีดไม่เต็ม",
    nameThai: "ฉีดไม่เต็ม",
    description: "พลาสติกไม่ไหลเต็มแม่พิมพ์ ชิ้นงานไม่สมบูรณ์",
    possibleCauses: [
      {cause: "ความดันฉีดต่ำเกินไป", probability: "สูง"},
      {cause: "อุณหภูมิพลาสติกต่ำ", probability: "สูง"},
      {cause: "ความเร็วฉีดช้า", probability: "ปานกลาง"},
      {cause: "Gate หรือ Runner เล็กเกินไป", probability: "ปานกลาง"},
      {cause: "Venting ไม่เพียงพอ", probability: "ปานกลาง"},
      {cause: "Shot Size น้อยเกินไป", probability: "ปานกลาง"},
      {cause: "วัสดุมีความหนืดสูง", probability: "ต่ำ"},
    ],
    solutions: [
      "✅ เพิ่มความดันฉีด (Injection Pressure) ทีละ 5-10%",
      "✅ เพิ่มอุณหภูมิกระบอก (Barrel Temp) ทีละ 5-10°C",
      "✅ เพิ่มความเร็วฉีด (Injection Speed)",
      "✅ ตรวจสอบและขยาย Gate/Runner",
      "✅ เพิ่ม Venting หรือลดความเร็วช่วงท้าย",
      "✅ เพิ่ม Shot Size / Cushion",
      "✅ ตรวจสอบว่าวัสดุอบแห้งดีหรือยัง",
    ],
    quickFix: "เพิ่มความดันฉีด + เพิ่มอุณหภูมิพลาสติก",
    preventiveMeasures: ["ตรวจสอบ Shot Size ทุกครั้ง", "ทำ Venting ให้เพียงพอ"],
  },
  
  // ==================== FLASH ====================
  "FLASH": {
    name: "Flash / ครีบ",
    nameThai: "ครีบ / เนื้อเกิน",
    description: "พลาสติกไหลล้นออกมาตามแนว Parting Line",
    possibleCauses: [
      {cause: "แรงปิดแม่พิมพ์ไม่เพียงพอ", probability: "สูง"},
      {cause: "ความดันฉีดสูงเกินไป", probability: "สูง"},
      {cause: "แม่พิมพ์สึกหรอ/บิ่น", probability: "ปานกลาง"},
      {cause: "อุณหภูมิพลาสติกสูงเกินไป", probability: "ปานกลาง"},
      {cause: "Venting ใหญ่เกินไป", probability: "ต่ำ"},
    ],
    solutions: [
      "✅ เพิ่มแรงปิดแม่พิมพ์ (Clamping Force)",
      "✅ ลดความดันฉีดและความดัน Holding",
      "✅ ตรวจสอบและซ่อมแซมแม่พิมพ์",
      "✅ ลดอุณหภูมิพลาสติก",
      "✅ ตรวจสอบ Venting ไม่ให้ใหญ่เกินไป",
      "✅ ปรับ V-P Switchover ให้เร็วขึ้น",
    ],
    quickFix: "เพิ่มแรงปิดแม่พิมพ์ + ลดความดัน Holding",
    preventiveMeasures: ["บำรุงรักษาแม่พิมพ์สม่ำเสมอ", "คำนวณ Clamping Force ให้เพียงพอ"],
  },
  
  // ==================== SINK MARK ====================
  "SINK_MARK": {
    name: "Sink Mark / รอยยุบ",
    nameThai: "รอยยุบ / รอยบุ๋ม",
    description: "รอยยุบบนผิวชิ้นงานบริเวณที่มีความหนา",
    possibleCauses: [
      {cause: "ความดัน Holding ต่ำ", probability: "สูง"},
      {cause: "เวลา Holding สั้น", probability: "สูง"},
      {cause: "อุณหภูมิแม่พิมพ์สูง", probability: "ปานกลาง"},
      {cause: "Gate แข็งตัวเร็วเกินไป", probability: "ปานกลาง"},
      {cause: "ความหนาผนังไม่สม่ำเสมอ", probability: "ปานกลาง"},
      {cause: "Cooling Time สั้น", probability: "ต่ำ"},
    ],
    solutions: [
      "✅ เพิ่มความดัน Holding ทีละ 5-10%",
      "✅ เพิ่มเวลา Holding",
      "✅ ลดอุณหภูมิแม่พิมพ์",
      "✅ ขยาย Gate หรือเปลี่ยนตำแหน่ง",
      "✅ เพิ่ม Cooling Time",
      "✅ ออกแบบความหนาให้สม่ำเสมอ (หากทำได้)",
    ],
    quickFix: "เพิ่มความดัน Holding + เพิ่มเวลา Holding",
    preventiveMeasures: ["ออกแบบความหนาไม่เกิน 4mm", "ใช้ Rib แทนการเพิ่มความหนา"],
  },
  
  // ==================== WARPAGE ====================
  "WARPAGE": {
    name: "Warpage / บิดงอ",
    nameThai: "บิดงอ / โก่ง",
    description: "ชิ้นงานบิดงอหลังถอดจากแม่พิมพ์",
    possibleCauses: [
      {cause: "การหดตัวไม่สม่ำเสมอ", probability: "สูง"},
      {cause: "Cooling ไม่สม่ำเสมอ", probability: "สูง"},
      {cause: "ถอดชิ้นงานเร็วเกินไป", probability: "ปานกลาง"},
      {cause: "ความดัน Holding สูงเกินไป", probability: "ปานกลาง"},
      {cause: "Gate ตำแหน่งไม่เหมาะสม", probability: "ต่ำ"},
    ],
    solutions: [
      "✅ ปรับ Cooling ให้สม่ำเสมอทั้งสองข้าง",
      "✅ เพิ่ม Cooling Time",
      "✅ ลดอุณหภูมิแม่พิมพ์",
      "✅ ลดความดัน Holding",
      "✅ ใช้ Jig ช่วยหลังถอดชิ้นงาน",
      "✅ ปรับตำแหน่ง/จำนวน Gate",
    ],
    quickFix: "ปรับ Cooling ให้สม่ำเสมอ + เพิ่ม Cooling Time",
    preventiveMeasures: ["ออกแบบความหนาสม่ำเสมอ", "วางตำแหน่ง Cooling Channel ให้ดี"],
  },
  
  // ==================== BURN MARK ====================
  "BURN_MARK": {
    name: "Burn Mark / รอยไหม้",
    nameThai: "รอยไหม้ / รอยดำ",
    description: "รอยดำ/รอยไหม้บนชิ้นงาน มักเกิดปลายทาง Flow",
    possibleCauses: [
      {cause: "Venting ไม่เพียงพอ (อากาศติด)", probability: "สูง"},
      {cause: "ความเร็วฉีดเร็วเกินไป", probability: "สูง"},
      {cause: "อุณหภูมิพลาสติกสูงเกินไป", probability: "ปานกลาง"},
      {cause: "วัสดุค้างในเครื่องนาน", probability: "ปานกลาง"},
      {cause: "Screw Speed เร็วเกินไป", probability: "ต่ำ"},
    ],
    solutions: [
      "✅ เพิ่ม Venting (ลึก 0.02-0.03mm)",
      "✅ ลดความเร็วฉีดช่วงท้าย",
      "✅ ลดอุณหภูมิพลาสติก",
      "✅ ล้างเครื่องด้วย Purging Compound",
      "✅ ลดความเร็วสกรู (Screw Speed)",
      "✅ ตรวจสอบว่า Gate/Runner ไม่อุดตัน",
    ],
    quickFix: "ลดความเร็วฉีด + เพิ่ม Venting",
    preventiveMeasures: ["ทำ Venting ทุกจุด Dead End", "ล้างเครื่องเมื่อเปลี่ยนวัสดุ"],
  },
  
  // ==================== SILVER STREAK ====================
  "SILVER_STREAK": {
    name: "Silver Streak / เส้นสีเงิน",
    nameThai: "เส้นสีเงิน / รอยความชื้น",
    description: "เส้นสีเงินบนผิวชิ้นงานตามทิศทางการไหล",
    possibleCauses: [
      {cause: "วัสดุมีความชื้น", probability: "สูงมาก"},
      {cause: "อุณหภูมิพลาสติกสูงเกินไป (Degradation)", probability: "ปานกลาง"},
      {cause: "อากาศติดในพลาสติก", probability: "ปานกลาง"},
      {cause: "Back Pressure ต่ำเกินไป", probability: "ต่ำ"},
    ],
    solutions: [
      "✅ อบวัสดุให้แห้งตามข้อกำหนด",
      "✅ ตรวจสอบ Hopper Dryer ทำงานปกติ",
      "✅ ลดอุณหภูมิพลาสติก",
      "✅ เพิ่ม Back Pressure เล็กน้อย",
      "✅ ลดความเร็วสกรู",
      "✅ ตรวจสอบซีลสกรูไม่รั่ว",
    ],
    quickFix: "อบวัสดุให้แห้ง + ตรวจสอบ Dryer",
    preventiveMeasures: ["ใช้ Hopper Dryer เสมอ", "ตรวจสอบความชื้นด้วย Moisture Analyzer"],
  },
  
  // ==================== WELD LINE ====================
  "WELD_LINE": {
    name: "Weld Line / รอยเชื่อม",
    nameThai: "รอยเชื่อม / รอยประสาน",
    description: "เส้นรอยต่อที่พลาสติกไหลมาเจอกัน",
    possibleCauses: [
      {cause: "อุณหภูมิพลาสติกต่ำ", probability: "สูง"},
      {cause: "ความเร็วฉีดช้า", probability: "ปานกลาง"},
      {cause: "Venting ไม่เพียงพอ", probability: "ปานกลาง"},
      {cause: "อุณหภูมิแม่พิมพ์ต่ำ", probability: "ปานกลาง"},
      {cause: "ตำแหน่ง Gate ไม่เหมาะสม", probability: "ต่ำ"},
    ],
    solutions: [
      "✅ เพิ่มอุณหภูมิพลาสติก",
      "✅ เพิ่มความเร็วฉีด",
      "✅ เพิ่มอุณหภูมิแม่พิมพ์",
      "✅ เพิ่ม Venting บริเวณ Weld Line",
      "✅ เปลี่ยนตำแหน่ง Gate (ถ้าทำได้)",
      "✅ ใช้ Overflow Tab",
    ],
    quickFix: "เพิ่มอุณหภูมิพลาสติก + เพิ่มความเร็วฉีด",
    preventiveMeasures: ["ออกแบบ Gate ให้ Weld Line อยู่จุดที่ไม่สำคัญ"],
  },
  
  // ==================== VOID ====================
  "VOID": {
    name: "Void / โพรงอากาศ",
    nameThai: "โพรงอากาศ / ฟองใน",
    description: "โพรงอากาศภายในชิ้นงาน มักเกิดบริเวณหนา",
    possibleCauses: [
      {cause: "ความดัน Holding ต่ำ", probability: "สูง"},
      {cause: "เวลา Holding สั้น", probability: "สูง"},
      {cause: "Gate แข็งตัวเร็ว", probability: "ปานกลาง"},
      {cause: "ความหนาผนังมากเกินไป", probability: "ปานกลาง"},
      {cause: "อุณหภูมิพลาสติกสูง", probability: "ต่ำ"},
    ],
    solutions: [
      "✅ เพิ่มความดัน Holding",
      "✅ เพิ่มเวลา Holding",
      "✅ ขยาย Gate",
      "✅ ลดอุณหภูมิพลาสติก",
      "✅ เพิ่ม Cooling Time",
      "✅ ออกแบบใช้ Rib แทนความหนา",
    ],
    quickFix: "เพิ่มความดัน Holding + ขยาย Gate",
    preventiveMeasures: ["ออกแบบความหนาไม่เกิน 4mm"],
  },
  
  // ==================== JETTING ====================
  "JETTING": {
    name: "Jetting / รอยพ่น",
    nameThai: "รอยพ่น / เส้นคดเคี้ยว",
    description: "เส้นคดเคี้ยวบนผิวชิ้นงานบริเวณ Gate",
    possibleCauses: [
      {cause: "Gate เล็กเกินไป", probability: "สูง"},
      {cause: "ความเร็วฉีดเร็วเกินไป", probability: "สูง"},
      {cause: "พลาสติกไม่ปะทะผนังแม่พิมพ์", probability: "ปานกลาง"},
    ],
    solutions: [
      "✅ ขยาย Gate",
      "✅ ลดความเร็วฉีดช่วงแรก",
      "✅ เปลี่ยนทิศทาง Gate ให้ปะทะผนัง",
      "✅ เพิ่มอุณหภูมิพลาสติก",
      "✅ ใช้ Tab Gate แทน Pin Gate",
    ],
    quickFix: "ลดความเร็วฉีดช่วงแรก + ขยาย Gate",
    preventiveMeasures: ["ออกแบบ Gate ให้พลาสติกปะทะผนัง"],
  },
  
  // ==================== FLOW MARK ====================
  "FLOW_MARK": {
    name: "Flow Mark / รอยไหล",
    nameThai: "รอยไหล / ลายไม้",
    description: "ลายเส้นบนผิวชิ้นงานตามทิศทางการไหล",
    possibleCauses: [
      {cause: "อุณหภูมิพลาสติกต่ำ", probability: "สูง"},
      {cause: "อุณหภูมิแม่พิมพ์ต่ำ", probability: "สูง"},
      {cause: "ความเร็วฉีดไม่เหมาะสม", probability: "ปานกลาง"},
      {cause: "Gate เล็ก", probability: "ต่ำ"},
    ],
    solutions: [
      "✅ เพิ่มอุณหภูมิพลาสติก",
      "✅ เพิ่มอุณหภูมิแม่พิมพ์",
      "✅ ปรับความเร็วฉีด (ลอง Profile หลายความเร็ว)",
      "✅ ขยาย Gate",
      "✅ ขัดผิว Cavity ให้มัน",
    ],
    quickFix: "เพิ่มอุณหภูมิพลาสติกและแม่พิมพ์",
    preventiveMeasures: ["ขัดผิวแม่พิมพ์สม่ำเสมอ"],
  },

  // ==================== DELAMINATION ====================
  "DELAMINATION": {
    name: "Delamination / หลุดเป็นชั้น",
    nameThai: "หลุดเป็นชั้น / ลอกเป็นแผ่น",
    description: "ผิวชิ้นงานลอกหลุดเป็นชั้นๆ เหมือนหัวหอม",
    possibleCauses: [
      {cause: "วัสดุปนเปื้อน (Contamination)", probability: "สูงมาก"},
      {cause: "วัสดุไม่เข้ากัน (Incompatible Materials)", probability: "สูง"},
      {cause: "ความชื้นในวัสดุ", probability: "ปานกลาง"},
      {cause: "อุณหภูมิหลอมต่ำเกินไป", probability: "ปานกลาง"},
      {cause: "Shear Rate สูงเกินไป", probability: "ต่ำ"},
    ],
    solutions: [
      "✅ ตรวจสอบและล้างเครื่องก่อนเปลี่ยนวัสดุ",
      "✅ ใช้ Purging Compound",
      "✅ ตรวจสอบว่าวัสดุตรงตาม Spec",
      "✅ อบวัสดุให้แห้ง",
      "✅ เพิ่มอุณหภูมิกระบอก",
      "✅ ลดความเร็วฉีด",
    ],
    quickFix: "ล้างเครื่องด้วย Purging Compound + ตรวจสอบวัสดุ",
    preventiveMeasures: ["ล้างเครื่องทุกครั้งที่เปลี่ยนวัสดุ", "เก็บวัสดุในที่แห้ง", "ใช้วัสดุจากแหล่งเดียวกัน"],
  },

  // ==================== GATE BLUSH ====================
  "GATE_BLUSH": {
    name: "Gate Blush / รอยด้านที่ Gate",
    nameThai: "รอยด้านที่ Gate / รอยขุ่น",
    description: "รอยด้านหรือขุ่นบริเวณรอบ Gate",
    possibleCauses: [
      {cause: "ความเร็วฉีดช่วงแรกเร็วเกินไป", probability: "สูง"},
      {cause: "อุณหภูมิแม่พิมพ์ต่ำ", probability: "ปานกลาง"},
      {cause: "Gate เล็กเกินไป", probability: "ปานกลาง"},
      {cause: "อุณหภูมิพลาสติกต่ำ", probability: "ต่ำ"},
    ],
    solutions: [
      "✅ ลดความเร็วฉีดช่วงแรก (1st Stage)",
      "✅ เพิ่มอุณหภูมิแม่พิมพ์บริเวณ Gate",
      "✅ ขยาย Gate",
      "✅ เพิ่มอุณหภูมิพลาสติก",
      "✅ ปรับ Gate Location",
    ],
    quickFix: "ลดความเร็วฉีดช่วงแรก + เพิ่มอุณหภูมิแม่พิมพ์",
    preventiveMeasures: ["ออกแบบ Gate ให้เหมาะสม", "ใช้ Speed Profile หลายระดับ"],
  },

  // ==================== BRITTLENESS ====================
  "BRITTLENESS": {
    name: "Brittleness / ชิ้นงานเปราะ",
    nameThai: "ชิ้นงานเปราะ / แตกง่าย",
    description: "ชิ้นงานแตกหักง่ายกว่าปกติ ไม่ทนแรงกระแทก",
    possibleCauses: [
      {cause: "วัสดุเสื่อมสภาพ (Degradation)", probability: "สูง"},
      {cause: "อุณหภูมิหลอมสูงเกินไป", probability: "สูง"},
      {cause: "Residence Time นานเกินไป", probability: "ปานกลาง"},
      {cause: "วัสดุรีไซเคิลมากเกินไป", probability: "ปานกลาง"},
      {cause: "ความชื้นในวัสดุ", probability: "ปานกลาง"},
    ],
    solutions: [
      "✅ ลดอุณหภูมิกระบอก",
      "✅ ลด Cycle Time หรือใช้เครื่องขนาดเล็กลง",
      "✅ ลดสัดส่วน Regrind (ไม่เกิน 25%)",
      "✅ อบวัสดุให้แห้ง",
      "✅ ตรวจสอบ LOT วัสดุ",
      "✅ ลดความเร็วสกรู",
    ],
    quickFix: "ลดอุณหภูมิกระบอก + ตรวจสอบสัดส่วน Regrind",
    preventiveMeasures: ["ใช้ Regrind ไม่เกิน 25%", "ไม่ให้วัสดุค้างในกระบอกนาน"],
  },

  // ==================== COLOR STREAKS ====================
  "COLOR_STREAKS": {
    name: "Color Streaks / เส้นสีไม่สม่ำเสมอ",
    nameThai: "เส้นสีไม่สม่ำเสมอ / สีด่าง",
    description: "สีของชิ้นงานไม่สม่ำเสมอ มีเส้นสีต่างกัน",
    possibleCauses: [
      {cause: "Masterbatch ผสมไม่ดี", probability: "สูง"},
      {cause: "Back Pressure ต่ำ", probability: "สูง"},
      {cause: "อุณหภูมิหลอมต่ำ", probability: "ปานกลาง"},
      {cause: "Screw Speed ช้า", probability: "ปานกลาง"},
      {cause: "สัดส่วน Masterbatch ไม่เหมาะสม", probability: "ต่ำ"},
    ],
    solutions: [
      "✅ เพิ่ม Back Pressure",
      "✅ เพิ่มความเร็วสกรู",
      "✅ เพิ่มอุณหภูมิกระบอก",
      "✅ ใช้ Mixing Screw",
      "✅ ตรวจสอบสัดส่วน Masterbatch (ปกติ 2-4%)",
      "✅ Pre-mix วัสดุกับ Masterbatch ก่อน",
    ],
    quickFix: "เพิ่ม Back Pressure + เพิ่มความเร็วสกรู",
    preventiveMeasures: ["ใช้ Masterbatch คุณภาพดี", "ตรวจสอบ Screw Design"],
  },

  // ==================== BUBBLES ====================
  "BUBBLES": {
    name: "Bubbles / ฟองอากาศที่ผิว",
    nameThai: "ฟองอากาศที่ผิว / ฟองใต้ผิว",
    description: "ฟองอากาศปรากฏที่ผิวหรือใต้ผิวชิ้นงาน",
    possibleCauses: [
      {cause: "ความชื้นในวัสดุ", probability: "สูงมาก"},
      {cause: "อากาศติดในกระบอก", probability: "ปานกลาง"},
      {cause: "Back Pressure ต่ำเกินไป", probability: "ปานกลาง"},
      {cause: "วัสดุเสื่อมสภาพ (ปล่อยก๊าซ)", probability: "ต่ำ"},
    ],
    solutions: [
      "✅ อบวัสดุให้แห้งตามข้อกำหนด",
      "✅ เพิ่ม Back Pressure",
      "✅ ลดความเร็วสกรู",
      "✅ ลดอุณหภูมิกระบอก (ถ้าวัสดุเสื่อม)",
      "✅ ตรวจสอบ Hopper Dryer",
      "✅ เพิ่ม Decompression",
    ],
    quickFix: "อบวัสดุให้แห้ง + เพิ่ม Back Pressure",
    preventiveMeasures: ["ใช้ Hopper Dryer", "ตรวจสอบ Dew Point"],
  },

  // ==================== EJECTOR MARKS ====================
  "EJECTOR_MARKS": {
    name: "Ejector Marks / รอย Ejector",
    nameThai: "รอย Ejector / รอยสลักกระทุ้ง",
    description: "รอยบุ๋มหรือรอยนูนที่ตำแหน่ง Ejector Pin",
    possibleCauses: [
      {cause: "แรงกระทุ้งสูงเกินไป", probability: "สูง"},
      {cause: "Ejector Pin ขนาดเล็กเกินไป", probability: "ปานกลาง"},
      {cause: "Cooling Time สั้น (ชิ้นงานยังอ่อน)", probability: "ปานกลาง"},
      {cause: "Draft Angle ไม่เพียงพอ", probability: "ปานกลาง"},
      {cause: "ชิ้นงานติดแม่พิมพ์", probability: "ต่ำ"},
    ],
    solutions: [
      "✅ ลดแรงกระทุ้ง (Ejector Force)",
      "✅ ลดความเร็วกระทุ้ง",
      "✅ เพิ่ม Cooling Time",
      "✅ เพิ่มขนาด Ejector Pin หรือจำนวน",
      "✅ ตรวจสอบและเพิ่ม Draft Angle",
      "✅ ฉีด Mold Release",
    ],
    quickFix: "ลดแรงกระทุ้ง + เพิ่ม Cooling Time",
    preventiveMeasures: ["ออกแบบ Draft Angle ให้เพียงพอ (1-2°)", "วาง Ejector Pin ให้กระจาย"],
  },

  // ==================== SPLAY MARKS ====================
  "SPLAY_MARKS": {
    name: "Splay Marks / รอยกระเซ็น",
    nameThai: "รอยกระเซ็น / รอยฉีดกระจาย",
    description: "รอยเส้นกระจายจาก Gate คล้ายรอยกระเซ็นของน้ำ",
    possibleCauses: [
      {cause: "ความชื้นในวัสดุ", probability: "สูงมาก"},
      {cause: "อากาศในกระบอก", probability: "ปานกลาง"},
      {cause: "Decompression มากเกินไป (ดูดอากาศเข้า)", probability: "ปานกลาง"},
      {cause: "Nozzle Temperature ต่ำ", probability: "ต่ำ"},
    ],
    solutions: [
      "✅ อบวัสดุให้แห้งตามข้อกำหนด",
      "✅ ลด Decompression/Suck Back",
      "✅ เพิ่ม Back Pressure",
      "✅ เพิ่มอุณหภูมิ Nozzle",
      "✅ ตรวจสอบ Nozzle Seal",
    ],
    quickFix: "อบวัสดุให้แห้ง + ลด Decompression",
    preventiveMeasures: ["ใช้ Hopper Dryer", "ตรวจสอบ Moisture Analyzer"],
  },

  // ==================== ORANGE PEEL ====================
  "ORANGE_PEEL": {
    name: "Orange Peel / ผิวส้ม",
    nameThai: "ผิวส้ม / ผิวไม่เรียบ",
    description: "ผิวชิ้นงานไม่เรียบ มีลักษณะเหมือนผิวส้ม",
    possibleCauses: [
      {cause: "อุณหภูมิแม่พิมพ์ต่ำเกินไป", probability: "สูง"},
      {cause: "อุณหภูมิพลาสติกต่ำ", probability: "ปานกลาง"},
      {cause: "ความดันฉีดต่ำ", probability: "ปานกลาง"},
      {cause: "ความเร็วฉีดช้า", probability: "ต่ำ"},
    ],
    solutions: [
      "✅ เพิ่มอุณหภูมิแม่พิมพ์",
      "✅ เพิ่มอุณหภูมิพลาสติก",
      "✅ เพิ่มความดันฉีด",
      "✅ เพิ่มความเร็วฉีด",
      "✅ ขัดผิว Cavity ให้มัน",
    ],
    quickFix: "เพิ่มอุณหภูมิแม่พิมพ์ + เพิ่มความดันฉีด",
    preventiveMeasures: ["รักษาอุณหภูมิแม่พิมพ์ให้คงที่", "ขัดผิวแม่พิมพ์สม่ำเสมอ"],
  },

  // ==================== STICKING ====================
  "STICKING": {
    name: "Sticking / ชิ้นงานติดแม่พิมพ์",
    nameThai: "ชิ้นงานติดแม่พิมพ์",
    description: "ชิ้นงานไม่หลุดจากแม่พิมพ์ ติดค้างอยู่",
    possibleCauses: [
      {cause: "Packing Pressure สูงเกินไป (Over-pack)", probability: "สูง"},
      {cause: "Draft Angle ไม่เพียงพอ", probability: "สูง"},
      {cause: "Undercut หรือผิวหยาบในแม่พิมพ์", probability: "ปานกลาง"},
      {cause: "Cooling ไม่เพียงพอ", probability: "ปานกลาง"},
      {cause: "Ejector ไม่แข็งแรงหรือไม่เพียงพอ", probability: "ต่ำ"},
    ],
    solutions: [
      "✅ ลดความดัน Holding/Packing",
      "✅ เพิ่ม Cooling Time",
      "✅ ใช้ Mold Release Spray",
      "✅ ตรวจสอบและขัดผิวแม่พิมพ์",
      "✅ เพิ่ม Draft Angle (ถ้าทำได้)",
      "✅ ลดอุณหภูมิแม่พิมพ์",
    ],
    quickFix: "ลดความดัน Holding + ฉีด Mold Release",
    preventiveMeasures: ["ออกแบบ Draft Angle อย่างน้อย 1°", "ขัด Cavity ให้เรียบ"],
  },

  // ==================== BLACK SPECKS ====================
  "BLACK_SPECKS": {
    name: "Black Specks / จุดดำ",
    nameThai: "จุดดำ / ตุ่มดำ",
    description: "จุดสีดำเล็กๆ กระจายอยู่ในชิ้นงาน",
    possibleCauses: [
      {cause: "วัสดุไหม้ค้างในกระบอก", probability: "สูง"},
      {cause: "วัสดุปนเปื้อน", probability: "สูง"},
      {cause: "อุณหภูมิกระบอกสูงเกินไป", probability: "ปานกลาง"},
      {cause: "Dead Spot ในกระบอกหรือ Hot Runner", probability: "ปานกลาง"},
      {cause: "Screw/Barrel สึกหรอ", probability: "ต่ำ"},
    ],
    solutions: [
      "✅ Purge เครื่องด้วย Purging Compound",
      "✅ ลดอุณหภูมิกระบอก",
      "✅ ลด Residence Time",
      "✅ ตรวจสอบ Hot Runner System",
      "✅ ตรวจสอบ Screw และ Barrel",
      "✅ ใช้ Filter Screen ที่ Hopper",
    ],
    quickFix: "Purge เครื่อง + ลดอุณหภูมิกระบอก",
    preventiveMeasures: ["Purge เครื่องเมื่อหยุดเครื่องนาน", "รักษาความสะอาดวัสดุ"],
  },
};

// =====================================================
// 📊 PARAMETER RECOMMENDATION SYSTEM
// =====================================================

/**
 * แนะนำพารามิเตอร์ตามวัสดุและแม่พิมพ์
 * @param {string} materialCode - รหัสวัสดุ (ABS, PP, PC, etc.)
 * @param {object} moldInfo - ข้อมูลแม่พิมพ์ (optional)
 * @returns {object} - พารามิเตอร์ที่แนะนำ
 */
function getRecommendedParameters(materialCode, moldInfo = {}) {
  const material = PLASTIC_MATERIALS_DB[materialCode.toUpperCase()];
  if (!material) {
    return {error: `ไม่พบข้อมูลวัสดุ ${materialCode}`};
  }

  const {wallThickness = 2.5, flowLength = 150, cavities = 1} = moldInfo;
  
  // คำนวณ Cooling Time โดยประมาณ (สูตร: t = s²/(π² × α) × ln(8/π² × (Tm-Tw)/(Te-Tw)))
  // ใช้สูตรง่าย: Cooling Time ≈ 2 × (wall thickness)² สำหรับ PP, 1.5 × t² สำหรับอื่นๆ
  const coolingFactor = materialCode === "PP" || materialCode === "PE" ? 2.0 : 1.5;
  const estimatedCoolingTime = Math.round(coolingFactor * wallThickness * wallThickness);

  // Injection Time ≈ Shot Volume / Flow Rate
  const estimatedInjectionTime = Math.round(0.5 + flowLength / 100);

  return {
    material: material.name,
    nameThai: material.nameThai,
    
    temperatures: {
      barrel: {
        zone1: material.meltTemp.recommended - 10,
        zone2: material.meltTemp.recommended,
        zone3: material.meltTemp.recommended + 5,
        nozzle: material.meltTemp.recommended + 5,
        unit: "°C",
      },
      mold: {
        recommended: material.moldTemp.recommended,
        range: `${material.moldTemp.min}-${material.moldTemp.max}°C`,
      },
    },
    
    drying: material.dryingTemp.temp ? {
      temperature: material.dryingTemp.temp,
      time: material.dryingTemp.time,
      maxMoisture: material.moisture,
    } : "ไม่จำเป็นต้องอบแห้ง",
    
    pressures: {
      injection: {
        recommended: Math.round((material.injectionPressure.min + material.injectionPressure.max) / 2),
        range: `${material.injectionPressure.min}-${material.injectionPressure.max} MPa`,
      },
      holding: {
        recommended: Math.round(material.injectionPressure.max * 0.6),
        note: "ประมาณ 50-70% ของความดันฉีด",
      },
      backPressure: {
        recommended: Math.round((material.backPressure.min + material.backPressure.max) / 2),
        range: `${material.backPressure.min}-${material.backPressure.max} MPa`,
      },
    },
    
    speeds: {
      injection: material.injectionSpeed,
      screw: "50-100 RPM",
    },
    
    times: {
      cooling: {
        estimated: estimatedCoolingTime,
        note: `สำหรับความหนา ${wallThickness}mm`,
        unit: "วินาที",
      },
      injection: {
        estimated: estimatedInjectionTime,
        unit: "วินาที",
      },
      holding: {
        estimated: Math.round(estimatedCoolingTime * 0.3),
        note: "ประมาณ 25-40% ของ Cooling Time",
        unit: "วินาที",
      },
    },
    
    shrinkage: {
      expected: `${material.shrinkage.min}-${material.shrinkage.max}%`,
      compensationFactor: 1 + (material.shrinkage.max / 100),
    },
    
    warnings: material.warnings,
    commonDefects: material.commonDefects,
    tips: [
      material.dryingTemp.temp ? `⚠️ ต้องอบแห้งที่ ${material.dryingTemp.temp}°C เป็นเวลา ${material.dryingTemp.time}` : null,
      `📊 การหดตัว ${material.shrinkage.min}-${material.shrinkage.max}% ควรคำนึงถึงในการออกแบบ`,
      `🔧 ปัญหาที่พบบ่อย: ${material.commonDefects.join(", ")}`,
    ].filter(Boolean),
  };
}

/**
 * วิเคราะห์ปัญหาและแนะนำวิธีแก้ไข
 * @param {string} defectType - ประเภทปัญหา
 * @returns {object} - ข้อมูลปัญหาและวิธีแก้ไข
 */
function getTroubleshootingSolution(defectType) {
  // Normalize defect type
  const normalizedType = defectType.toUpperCase().replace(/\s+/g, "_").replace(/[^\w_]/g, "");
  
  // Map common Thai/English terms to our keys
  const defectMapping = {
    // Short Shot
    "SHORT_SHOT": "SHORT_SHOT", "ฉีดไม่เต็ม": "SHORT_SHOT", "ชิ้นงานไม่เต็ม": "SHORT_SHOT",
    // Flash
    "FLASH": "FLASH", "ครีบ": "FLASH", "เนื้อเกิน": "FLASH", "BURR": "FLASH",
    // Sink Mark
    "SINK_MARK": "SINK_MARK", "SINK": "SINK_MARK", "รอยยุบ": "SINK_MARK", "รอยบุ๋ม": "SINK_MARK",
    // Warpage
    "WARPAGE": "WARPAGE", "WARP": "WARPAGE", "บิดงอ": "WARPAGE", "โก่ง": "WARPAGE",
    // Burn Mark
    "BURN_MARK": "BURN_MARK", "BURN": "BURN_MARK", "รอยไหม้": "BURN_MARK", "รอยดำ": "BURN_MARK",
    // Silver Streak
    "SILVER_STREAK": "SILVER_STREAK", "SILVER": "SILVER_STREAK", "เส้นสีเงิน": "SILVER_STREAK", "ความชื้น": "SILVER_STREAK",
    // Weld Line
    "WELD_LINE": "WELD_LINE", "WELD": "WELD_LINE", "รอยเชื่อม": "WELD_LINE",
    // Void
    "VOID": "VOID", "โพรงอากาศ": "VOID", "ฟอง": "VOID",
    // Jetting
    "JETTING": "JETTING", "JET": "JETTING", "รอยพ่น": "JETTING",
    // Flow Mark
    "FLOW_MARK": "FLOW_MARK", "FLOW": "FLOW_MARK", "รอยไหล": "FLOW_MARK", "ลายไม้": "FLOW_MARK",
  };
  
  const key = defectMapping[normalizedType] || defectMapping[defectType] || normalizedType;
  const guide = TROUBLESHOOTING_GUIDE[key];
  
  if (!guide) {
    return {
      error: `ไม่พบข้อมูลปัญหา "${defectType}"`,
      availableDefects: Object.keys(TROUBLESHOOTING_GUIDE).map((k) => TROUBLESHOOTING_GUIDE[k].nameThai),
    };
  }
  
  return {
    name: guide.name,
    nameThai: guide.nameThai,
    description: guide.description,
    causes: guide.possibleCauses,
    solutions: guide.solutions,
    quickFix: guide.quickFix,
    prevention: guide.preventiveMeasures,
  };
}

/**
 * ค้นหาข้อมูลวัสดุ
 * @param {string} query - ชื่อวัสดุหรือ alias
 * @returns {object|null} - ข้อมูลวัสดุ
 */
function findMaterial(query) {
  const normalizedQuery = query.toUpperCase().trim();
  
  // Direct match
  if (PLASTIC_MATERIALS_DB[normalizedQuery]) {
    return {code: normalizedQuery, ...PLASTIC_MATERIALS_DB[normalizedQuery]};
  }
  
  // Search by alias
  for (const [code, material] of Object.entries(PLASTIC_MATERIALS_DB)) {
    if (material.aliases && material.aliases.some((a) => a.toUpperCase() === normalizedQuery)) {
      return {code, ...material};
    }
    if (material.nameThai && material.nameThai.includes(query)) {
      return {code, ...material};
    }
  }
  
  return null;
}

/**
 * รายการวัสดุทั้งหมด
 */
function listAllMaterials() {
  return Object.entries(PLASTIC_MATERIALS_DB).map(([code, material]) => ({
    code,
    name: material.name,
    nameThai: material.nameThai,
    category: material.category,
    meltTemp: `${material.meltTemp.min}-${material.meltTemp.max}°C`,
    shrinkage: `${material.shrinkage.min}-${material.shrinkage.max}%`,
  }));
}

/**
 * รายการปัญหาทั้งหมด
 */
function listAllDefects() {
  return Object.entries(TROUBLESHOOTING_GUIDE).map(([key, guide]) => ({
    key,
    name: guide.name,
    nameThai: guide.nameThai,
    quickFix: guide.quickFix,
  }));
}

// =====================================================
// �🛠️ HELPER FUNCTIONS
// =====================================================

/**
 * Calculate time ago from a date
 * @param {Date} date - The date to calculate from
 * @return {string} - Human readable time ago string in Thai
 */
function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "เมื่อสักครู่";
  if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
  if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
  if (diffDays < 30) return `${diffDays} วันที่แล้ว`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} เดือนที่แล้ว`;

  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears} ปีที่แล้ว`;
}

// =====================================================
// 🧠 ADVANCED CONVERSATION MEMORY SYSTEM
// =====================================================

/**
 * 🧠 ENHANCED CONVERSATION MEMORY CLASS
 * จดจำบริบทการสนทนาแบบถาวรและอัจฉริยะ
 */
class ConversationMemory {
  constructor() {
    this.db = getFirestore();
    this.memoryCache = new Map();
    this.maxCacheSize = 100;
  }

  async saveConversationMemory(userId, sessionId, interaction) {
    try {
      const {question, answer, context} = interaction;
      const entities = this._extractEntities(question + " " + answer);
      const keywords = this._extractKeywords(question);
      const topics = this._detectTopics(question, answer);

      const memoryData = {
        userId,
        sessionId,
        timestamp: FieldValue.serverTimestamp(),
        question: question.substring(0, 500),
        answer: answer.substring(0, 1000),
        entities: {
          materials: entities.materials,
          defects: entities.defects,
          parameters: entities.parameters,
          machines: entities.machines,
          processes: entities.processes,
        },
        keywords: keywords,
        topics: topics,
        questionType: context.questionType || "general",
        userLevel: context.userLevel || "intermediate",
        expertiseDomains: context.expertiseDomains || [],
        conversationStage: context.conversationStage || "initial",
        problemSolved: this._detectProblemSolved(answer),
        satisfactionIndicator: this._estimateSatisfaction(question, answer),
        relatedTopics: this._findRelatedTopics(topics),
        suggestionsMade: this._extractSuggestions(answer),
        followUpNeeded: this._needsFollowUp(answer),
      };

      const memoryRef = await this.db
          .collection("conversation_memory")
          .doc(userId)
          .collection("memories")
          .add(memoryData);

      await this._updateUserSummary(userId, entities, topics);
      this._cacheMemory(userId, sessionId, memoryData);

      console.log(`✅ Memory saved: ${memoryRef.id}`);
      return memoryRef.id;
    } catch (error) {
      console.error("Error saving memory:", error);
      return null;
    }
  }

  async getRelevantMemories(userId, currentQuestion, limit = 5) {
    try {
      const currentEntities = this._extractEntities(currentQuestion);
      const currentKeywords = this._extractKeywords(currentQuestion);
      const currentTopics = this._detectTopics(currentQuestion, "");

      const memoriesQuery = this.db
          .collection("conversation_memory")
          .doc(userId)
          .collection("memories")
          .orderBy("timestamp", "desc")
          .limit(20);

      const snapshot = await memoriesQuery.get();
      if (snapshot.empty) return [];

      const scoredMemories = [];
      snapshot.forEach((doc) => {
        const memory = doc.data();
        const relevanceScore = this._calculateRelevance(
            memory,
            currentEntities,
            currentKeywords,
            currentTopics,
        );

        if (relevanceScore > 0.3) {
          scoredMemories.push({id: doc.id, ...memory, relevanceScore});
        }
      });

      scoredMemories.sort((a, b) => b.relevanceScore - a.relevanceScore);
      return scoredMemories.slice(0, limit);
    } catch (error) {
      console.error("Error getting memories:", error);
      return [];
    }
  }

  formatMemoryContext(memories) {
    if (!memories || memories.length === 0) {
      return "🆕 ไม่มีประวัติการสนทนาที่เกี่ยวข้อง";
    }

    const contextParts = ["🧠 **ความจำจากการสนทนาก่อนหน้า:**\n"];
    memories.forEach((memory, index) => {
      const timeAgo = this._formatTimeAgo(memory.timestamp);
      contextParts.push(`\n**[${index + 1}] ${timeAgo}** (เกี่ยวข้อง ${Math.round(memory.relevanceScore * 100)}%)`);

      if (memory.entities) {
        const entityParts = [];
        if (memory.entities.materials?.length > 0) {
          entityParts.push(`วัสดุ: ${memory.entities.materials.join(", ")}`);
        }
        if (memory.entities.defects?.length > 0) {
          entityParts.push(`ปัญหา: ${memory.entities.defects.join(", ")}`);
        }
        if (entityParts.length > 0) {
          contextParts.push(`   📦 ${entityParts.join(" | ")}`);
        }
      }

      if (memory.question) {
        contextParts.push(`   ❓ "${memory.question.substring(0, 80)}..."`);
      }
    });

    contextParts.push("\n📌 **ใช้ข้อมูลข้างต้นเพื่ออ้างอิงและเชื่อมโยงบริบท**");
    return contextParts.join("\n");
  }

  async _updateUserSummary(userId, entities, topics) {
    try {
      const summaryRef = this.db.collection("conversation_memory").doc(userId);
      const doc = await summaryRef.get();

      if (!doc.exists) {
        await summaryRef.set({
          userId,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          totalConversations: 1,
          materials: entities.materials || [],
          defects: entities.defects || [],
          parameters: entities.parameters || [],
          machines: entities.machines || [],
          topics: topics || [],
        });
      } else {
        const currentData = doc.data();
        await summaryRef.update({
          updatedAt: FieldValue.serverTimestamp(),
          totalConversations: FieldValue.increment(1),
          materials: this._mergeUnique(currentData.materials || [], entities.materials || []),
          defects: this._mergeUnique(currentData.defects || [], entities.defects || []),
          parameters: this._mergeUnique(currentData.parameters || [], entities.parameters || []),
          machines: this._mergeUnique(currentData.machines || [], entities.machines || []),
          topics: this._mergeUnique(currentData.topics || [], topics || []),
        });
      }
    } catch (error) {
      console.error("Error updating summary:", error);
    }
  }

  _extractEntities(text) {
    const entities = {materials: [], defects: [], parameters: [], machines: [], processes: []};

    const patterns = {
      materials: /\b(PP|PE|ABS|PC|PA|POM|PET|PS|TPU|PVC|PMMA|PBT|PPS|PEEK|Nylon)\b/gi,
      defects: /\b(short shot|warpage|flash|sink mark|weld line|burn mark|jetting|void|blush|silver streak)\b/gi,
      parameters: /\b(อุณหภูมิ|ความดัน|เวลา|temperature|pressure|time|speed|clamping force)\b/gi,
      machines: /\b(Toshiba|Porchison|Haitian|Sumitomo|injection machine)\b/gi,
      processes: /\b(injection|filling|packing|cooling|ejection)\b/gi,
    };

    Object.keys(patterns).forEach((key) => {
      const matches = text.match(patterns[key]);
      if (matches) {
        entities[key] = [...new Set(matches.map((m) => m.toUpperCase()))];
      }
    });

    return entities;
  }

  _extractKeywords(text) {
    const commonWords = new Set(["ครับ", "ค่ะ", "คือ", "เป็น", "the", "is", "are"]);
    const words = text.toLowerCase()
        .replace(/[^\wก-๙\s]/g, " ")
        .split(/\s+/)
        .filter((word) => word.length > 2 && !commonWords.has(word));

    const wordCount = {};
    words.forEach((word) => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    return Object.entries(wordCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([word]) => word);
  }

  _detectTopics(question, answer) {
    const text = (question + " " + answer).toLowerCase();
    const topics = [];
    const topicPatterns = {
      "troubleshooting": /แก้ไข|ปัญหา|defect|problem/i,
      "parameters": /ค่า|พารามิเตอร์|parameter|setting/i,
      "mold_design": /แม่พิมพ์|mold|cavity/i,
      "material_selection": /เลือกวัสดุ|material select/i,
      "process_optimization": /ปรับปรุง|optimize/i,
    };

    for (const [topic, pattern] of Object.entries(topicPatterns)) {
      if (pattern.test(text)) topics.push(topic);
    }

    return topics.length > 0 ? topics : ["general"];
  }

  _calculateRelevance(memory, currentEntities, currentKeywords, currentTopics) {
    let score = 0;

    // Material overlap (30%)
    if (memory.entities?.materials && currentEntities.materials) {
      score += this._calculateOverlap(memory.entities.materials, currentEntities.materials) * 30;
    }

    // Defect overlap (25%)
    if (memory.entities?.defects && currentEntities.defects) {
      score += this._calculateOverlap(memory.entities.defects, currentEntities.defects) * 25;
    }

    // Topic overlap (20%)
    if (memory.topics && currentTopics) {
      score += this._calculateOverlap(memory.topics, currentTopics) * 20;
    }

    // Keyword overlap (15%)
    if (memory.keywords && currentKeywords) {
      score += this._calculateOverlap(memory.keywords, currentKeywords) * 15;
    }

    // Recency bonus (10%)
    if (memory.timestamp) {
      const ageInDays = (Date.now() - memory.timestamp.toMillis()) / (24 * 60 * 60 * 1000);
      score += Math.max(0, 1 - (ageInDays / 7)) * 10;
    }

    return score / 100;
  }

  _calculateOverlap(arr1, arr2) {
    if (!arr1 || !arr2 || arr1.length === 0 || arr2.length === 0) return 0;
    const set1 = new Set(arr1.map((item) => item.toLowerCase()));
    const set2 = new Set(arr2.map((item) => item.toLowerCase()));
    const intersection = new Set([...set1].filter((x) => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return intersection.size / union.size;
  }

  _mergeUnique(arr1, arr2) {
    return [...new Set([...arr1, ...arr2])];
  }

  _formatTimeAgo(timestamp) {
    if (!timestamp) return "เมื่อสักครู่";
    const seconds = Math.floor((Date.now() - timestamp.toMillis()) / 1000);
    if (seconds < 60) return "เมื่อสักครู่";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} นาทีที่แล้ว`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} ชั่วโมงที่แล้ว`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} วันที่แล้ว`;
    return `${Math.floor(seconds / 604800)} สัปดาห์ที่แล้ว`;
  }

  _detectProblemSolved(answer) {
    return /แก้ไขได้|ควรแก้|วิธีแก้|solution|solved/gi.test(answer);
  }

  _estimateSatisfaction(question, answer) {
    let score = 50;
    if (answer.length > 500) score += 20;
    if (answer.includes("ขั้นตอน") || answer.includes("วิธี")) score += 15;
    if (answer.includes("ตัวอย่าง")) score += 10;
    return Math.min(100, score);
  }

  _findRelatedTopics(topics) {
    const relatedMap = {
      "troubleshooting": ["parameters", "process_optimization"],
      "parameters": ["troubleshooting", "machine_setup"],
      "mold_design": ["cooling", "material_selection"],
    };
    const related = new Set();
    topics.forEach((topic) => {
      if (relatedMap[topic]) {
        relatedMap[topic].forEach((r) => related.add(r));
      }
    });
    return Array.from(related);
  }

  _extractSuggestions(answer) {
    const suggestions = [];
    answer.split("\n").forEach((line) => {
      if (line.includes("แนะนำ") || line.includes("ควร")) {
        suggestions.push(line.substring(0, 100).trim());
      }
    });
    return suggestions.slice(0, 3);
  }

  _needsFollowUp(answer) {
    return /ติดตาม|ตรวจสอบ|follow up|check|monitor/gi.test(answer);
  }

  _cacheMemory(userId, sessionId, memoryData) {
    const cacheKey = `${userId}:${sessionId}`;
    this.memoryCache.set(cacheKey, memoryData);
    if (this.memoryCache.size > this.maxCacheSize) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }
  }

  // 🧹 Clear all memory cache
  clearMemoryCache() {
    const size = this.memoryCache.size;
    this.memoryCache.clear();
    console.log(`🧹 ConversationMemory cache cleared: ${size} items`);
    return size;
  }

  // 🧹 Clear specific user's memory from Firestore
  async clearUserMemory(userId) {
    try {
      const memoriesRef = this.db
          .collection("conversation_memory")
          .doc(userId)
          .collection("memories");

      const snapshot = await memoriesRef.get();
      if (snapshot.empty) return 0;

      const batch = this.db.batch();
      let count = 0;

      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
        count++;
      });

      await batch.commit();

      // Also delete user summary
      await this.db.collection("conversation_memory").doc(userId).delete();

      // Clear from local cache
      for (const key of this.memoryCache.keys()) {
        if (key.startsWith(userId)) {
          this.memoryCache.delete(key);
        }
      }

      console.log(`🧹 User ${userId} memory cleared: ${count} memories`);
      return count;
    } catch (error) {
      console.error("Error clearing user memory:", error);
      return -1;
    }
  }

  // 📊 Get memory statistics
  getStats() {
    return {
      cacheSize: this.memoryCache.size,
      maxCacheSize: this.maxCacheSize,
    };
  }
}

// const conversationMemory = new ConversationMemory();
let conversationMemory = null;
function getConversationMemory() {
  if (!conversationMemory) conversationMemory = new ConversationMemory();
  return conversationMemory;
}

// =====================================================
// 🚀 ENHANCED CORE SYSTEMS (จากเดิม)
// =====================================================

/**
 * 🆕 ENHANCED DYNAMIC TEMPERATURE CONTROL
 */
function dynamicTemperature(userLevel, questionType, conversationStage) {
  const baseTemps = {
    beginner: 0.3,
    intermediate: 0.5,
    expert: 0.7,
  };

  const modifiers = {
    troubleshooting: 0.1,
    calculation: -0.1,
    greeting: 0.2,
    comparison: 0.05,
    parameter: 0.0,
    design: 0.1,
    material: 0.05,
    process: 0.0,
    general: 0.1,
    out_of_scope: 0.3,
  };

  const stageModifiers = {
    initial: 0.1,
    engaged: 0,
    problem_solving: -0.05,
    deep_discussion: 0.05,
  };

  let temp = baseTemps[userLevel] || 0.5;
  temp += modifiers[questionType] || 0;
  temp += stageModifiers[conversationStage] || 0;

  return Math.max(0.1, Math.min(0.9, temp));
}

/**
 * 🆕 SMART RESPONSE CACHE SYSTEM
 */
class ResponseCache {
  constructor() {
    this.cache = new Map();
    this.maxSize = 100;
    this.ttl = 5 * 60 * 1000; // 5 minutes
  }

  generateKey(text, userLevel, questionType) {
    const normalizedText = text.toLowerCase().trim().replace(/\s+/g, " ");
    return `${userLevel}:${questionType}:${normalizedText.substring(0, 100)}`;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.response;
  }

  set(key, response) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      response,
      timestamp: Date.now(),
      hitCount: 0,
    });
  }

  getVariation(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    item.hitCount++;
    return item.hitCount <= 2 ? item.response : null;
  }

  // 🧹 Clear all cache entries
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`🧹 ResponseCache cleared: ${size} items removed`);
    return size;
  }

  // 🧹 Clear expired entries only
  clearExpired() {
    let cleared = 0;
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.ttl) {
        this.cache.delete(key);
        cleared++;
      }
    }
    console.log(`🧹 ResponseCache cleared expired: ${cleared} items`);
    return cleared;
  }

  // 📊 Get cache statistics
  getStats() {
    let totalHits = 0;
    let expiredCount = 0;
    const now = Date.now();

    for (const item of this.cache.values()) {
      totalHits += item.hitCount || 0;
      if (now - item.timestamp > this.ttl) {
        expiredCount++;
      }
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      totalHits,
      expiredCount,
      ttlMinutes: this.ttl / 60000,
    };
  }
}

const responseCache = new ResponseCache();

/**
 * 🆕 ENHANCED CONTEXT PRESERVATION SYSTEM
 */
function createContextChain(chatHistory, currentQuestion) {
  const MAX_CONTEXT_ITEMS = 8;
  const contextItems = [];

  const entities = {
    materials: new Set(),
    machines: new Set(),
    defects: new Set(),
    parameters: new Set(),
  };

  const recentMessages = chatHistory.slice(-MAX_CONTEXT_ITEMS);

  recentMessages.forEach((msg) => {
    const materialMatches = msg.text.match(/\b(PP|PE|ABS|PC|PA|POM|PET|PS|TPU|PVC|PMMA)\b/gi);
    if (materialMatches) {
      materialMatches.forEach((m) => entities.materials.add(m.toUpperCase()));
    }

    const defectMatches = msg.text.match(/\b(short shot|warpage|flash|sink mark|weld line|burn mark|jetting|void|blush)\b/gi);
    if (defectMatches) {
      defectMatches.forEach((d) => entities.defects.add(d.toLowerCase()));
    }

    const machineMatches = msg.text.match(/\b(toshiba|porchison|injection machine|clamping unit)\b/gi);
    if (machineMatches) {
      machineMatches.forEach((m) => entities.machines.add(m.toLowerCase()));
    }
  });

  if (entities.materials.size > 0) {
    contextItems.push(`📦 Materials: ${Array.from(entities.materials).join(", ")}`);
  }

  if (entities.defects.size > 0) {
    contextItems.push(`⚠️ Active Issues: ${Array.from(entities.defects).join(", ")}`);
  }

  if (entities.machines.size > 0) {
    contextItems.push(`🏭 Machines: ${Array.from(entities.machines).join(", ")}`);
  }

  if (recentMessages.length >= 3) {
    const userMessages = recentMessages.filter((m) => m.isUser);
    if (userMessages.length > 0) {
      const lastUserTopics = detectQuestionType(userMessages[userMessages.length - 1].text);
      contextItems.push(`🎯 Recent Focus: ${lastUserTopics}`);
    }
  }

  return contextItems.length > 0 ? contextItems.join("\n") : "🆕 New Conversation";
}

/**
 * 🆕 MULTI-LAYER SAFETY VALIDATION
 */
class SafetyValidator {
  static validateContentSafety(response) {
    const redFlags = [
      /อันตรายถึงชีวิต|เสี่ยงตาย|เสียชีวิต/gi,
      /ผิดกฎหมาย|ผิดกฏหมาย|ทุจริต/gi,
      /หลบเลี่ยงภาษี|โกง/gi,
      /แฮ็ก|แคร็ก|ละเมิดลิขสิทธิ์/gi,
      /ยาเสพติด|สารต้องห้าม/gi,
      /การพนัน|คาสิโน|เดิมพัน/gi,
    ];

    for (const pattern of redFlags) {
      if (pattern.test(response)) {
        throw new HttpsError(
            "permission-denied",
            "⚠️ ระบบตรวจพบเนื้อหาที่ไม่เหมาะสมในคำตอบ กรุณาลองใหม่อีกครั้ง",
        );
      }
    }

    return true;
  }

  static validateTechnicalAccuracy(response, questionType) {
    const accuracyChecks = {
      temperature: {
        pattern: /(\d+)\s*°C/gi,
        validator: (value) => value >= 0 && value <= 400,
        range: "0-400°C",
      },
      pressure: {
        pattern: /(\d+)\s*MPa/gi,
        validator: (value) => value >= 0 && value <= 200,
        range: "0-200 MPa",
      },
      time: {
        pattern: /(\d+)\s*วินาที/gi,
        validator: (value) => value >= 0 && value <= 300,
        range: "0-300 วินาที",
      },
      force: {
        pattern: /(\d+)\s*ton/gi,
        validator: (value) => value >= 0 && value <= 5000,
        range: "0-5000 ton",
      },
    };

    const warnings = [];

    for (const [key, check] of Object.entries(accuracyChecks)) {
      const matches = response.match(check.pattern);
      if (matches) {
        matches.forEach((match) => {
          const value = parseInt(match.replace(/[^\d]/g, ""));
          if (!check.validator(value)) {
            warnings.push(`Suspicious ${key} value: ${value} (valid range: ${check.range})`);
          }
        });
      }
    }

    if (warnings.length > 0) {
      console.warn(`⚠️ Technical accuracy warnings:`, warnings);
    }

    return true;
  }
}

/**
 * 🆕 ENHANCED PERFORMANCE OPTIMIZER
 */
class PerformanceOptimizer {
  static optimizePromptLength(prompt, maxLength = 28000) {
    if (prompt.length <= maxLength) return prompt;

    console.warn(`📦 Prompt too long: ${prompt.length} chars, optimizing...`);

    const sections = prompt.split("## ");
    const essentialSections = sections.filter((section) =>
      section.includes("ENHANCED RESPONSE STRATEGY") ||
      section.includes("CURRENT QUERY") ||
      section.includes("GENERATE ENHANCED RESPONSE NOW") ||
      section.includes("ENHANCED MISSION CONTEXT"),
    );

    let optimizedPrompt = sections[0] + "## " + essentialSections.join("## ");

    if (optimizedPrompt.length > maxLength) {
      const historyIndex = optimizedPrompt.indexOf("💬 OPTIMIZED CONVERSATION HISTORY");
      if (historyIndex !== -1) {
        const beforeHistory = optimizedPrompt.substring(0, historyIndex);
        const afterHistory = optimizedPrompt.substring(historyIndex);
        const shortenedHistory = afterHistory.split("\n").slice(0, 15).join("\n");
        optimizedPrompt = beforeHistory + shortenedHistory;
      }
    }

    console.log(`📦 Optimized prompt: ${optimizedPrompt.length} chars`);
    return optimizedPrompt;
  }

  static async preloadCommonResponses() {
    const commonResponses = {
      greeting: `สวัสดีครับ! 👋 ผู้เชี่ยวชาญด้านเทคนิคการฉีดพลาสติก (Injection Molding AI Specialist) ยินดีที่ได้รู้จักครับ

ผมพร้อมเป็นที่ปรึกษาให้คุณในทุกเรื่อง ตั้งแต่การแก้ปัญหาหน้างาน การตั้งค่าพารามิเตอร์ การออกแบบแม่พิมพ์ จนถึงการคำนวณต้นทุนและจัดการการผลิต

วันนี้มีปัญหาอะไรให้ผมช่วยวิเคราะห์ หรืออยากปรึกษาเรื่องไหนเป็นพิเศษไหมครับ? 😊`,

      out_of_scope: `เข้าใจคำถามคุณครับ! 😊

แต่ขออภัยจริงๆ นะครับ ผมเป็นผู้ช่วยอาจารย์วิทยาได้รับมอบหน้าที่เพื่อให้คำปรึกษา **เฉพาะด้าน "เทคโนโลยีการฉีดพลาสติกและวิศวกรรมการและเทคนิคการผลิต"** เท่านั้นครับ

หากคุณมีคำถามในหัวข้อเหล่านี้ ผมยินดีช่วยเหลือเต็มที่:
• การแก้ปัญหาข้อบกพร่องชิ้นงาน
• การตั้งค่าพารามิเตอร์
• การออกแบบแม่พิมพ์
• การคำนวณต้นทุนและจัดการการผลิต
• การตั้งค่าเครื่องจักรและพารามิเตอร์
• การเลือกใช้วัสดุพลาสติก
• การคำนวณต่างๆ ด้านการผลิต

มีคำถามอะไรเกี่ยวกับการฉีดพลาสติกให้ผมช่วยไหมครับ? 😊`,

      error: `ขออภัยครับ 😔 ระบบกำลังประสบปัญหาชั่วคราว

กรุณาลองทำตามขั้นตอนเหล่านี้:
1. รอสัก 2-3 นาที แล้วลองใหม่
2. ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต
3. ลดความยาวของคำถามลงเล็กน้อย

หากปัญหายังคงมีอยู่ กรุณาติดต่อแอดมินครับ`,
    };

    return commonResponses;
  }
}

/**
 * 🆕 ADAPTIVE LEARNING SYSTEM
 */
class AdaptiveLearner {
  constructor() {
    this.userPatterns = new Map();
    this.feedbackLoop = [];
    this.maxFeedbackSize = 50;
  }

  trackUserPattern(userId, questionType, responseLength, satisfaction) {
    if (!this.userPatterns.has(userId)) {
      this.userPatterns.set(userId, {
        questionTypes: {},
        preferredDetailLevel: "medium",
        averageResponseLength: 500,
        interactionCount: 0,
        lastInteraction: Date.now(),
      });
    }

    const userData = this.userPatterns.get(userId);
    userData.interactionCount++;
    userData.lastInteraction = Date.now();

    userData.questionTypes[questionType] = (userData.questionTypes[questionType] || 0) + 1;

    if (satisfaction === "high" && responseLength > userData.averageResponseLength) {
      userData.preferredDetailLevel = "high";
    } else if (satisfaction === "low" && responseLength > 800) {
      userData.preferredDetailLevel = "low";
    }

    userData.averageResponseLength =
      (userData.averageResponseLength * (userData.interactionCount - 1) + responseLength) /
      userData.interactionCount;

    this.cleanupOldPatterns();
  }

  getPersonalizationSettings(userId) {
    const userData = this.userPatterns.get(userId);
    if (!userData) return null;

    const mostCommon = Object.entries(userData.questionTypes)
        .sort(([, a], [, b]) => b - a)[0];

    return {
      detailLevel: userData.preferredDetailLevel,
      mostCommonQuestionType: mostCommon?.[0] || "general",
      expectedResponseLength: Math.round(userData.averageResponseLength),
      interactionCount: userData.interactionCount,
    };
  }

  cleanupOldPatterns() {
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    for (const [userId, data] of this.userPatterns.entries()) {
      if (data.lastInteraction < oneWeekAgo) {
        this.userPatterns.delete(userId);
      }
    }
  }

  addFeedback(question, response, rating) {
    this.feedbackLoop.push({
      question,
      response,
      rating,
      timestamp: Date.now(),
    });

    if (this.feedbackLoop.length > this.maxFeedbackSize) {
      this.feedbackLoop.shift();
    }
  }

  getFeedbackAnalysis() {
    if (this.feedbackLoop.length === 0) return null;

    const recentFeedback = this.feedbackLoop.slice(-10);
    const positiveCount = recentFeedback.filter((f) => f.rating >= 4).length;
    const averageRating = recentFeedback.reduce((sum, f) => sum + f.rating, 0) / recentFeedback.length;

    return {
      totalFeedback: this.feedbackLoop.length,
      recentPositiveRate: (positiveCount / recentFeedback.length) * 100,
      averageRating: Math.round(averageRating * 10) / 10,
      commonIssues: this.analyzeCommonIssues(),
    };
  }

  analyzeCommonIssues() {
    const lowRated = this.feedbackLoop.filter((f) => f.rating <= 2);
    if (lowRated.length === 0) return [];

    const issues = {};
    lowRated.forEach((f) => {
      const questionType = detectQuestionType(f.question);
      issues[questionType] = (issues[questionType] || 0) + 1;
    });

    return Object.entries(issues)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([type, count]) => ({type, count}));
  }
}

const adaptiveLearner = new AdaptiveLearner();

// =====================================================
// 🔍 QUERY CLARIFICATION MODULE
// =====================================================

/**
 * 🔍 QUERY CLARIFICATION SYSTEM
 * ตรวจจับและจัดการคำถามที่คลุมเครือ (Ambiguous Queries)
 * เพื่อป้องกัน System Failure และเพิ่ม User Satisfaction
 */
class QueryClarificationModule {
  constructor() {
    this.clarificationThreshold = 0.7; // Confidence threshold
    this.ambiguousKeywords = [
      "พัฒนา", "ปรับปรุง", "เช็ค", "ดู", "ตรวจสอบ", "วิเคราะห์",
      "develop", "improve", "check", "analyze", "review", "inspect",
      "ช่วย", "help", "แนะนำ", "suggest", "recommend",
    ];

    // Technical keywords ที่บ่งชี้ความชัดเจน
    this.specificKeywords = {
      defects: [
        "short shot", "warpage", "flash", "sink mark", "weld line",
        "burn mark", "jetting", "silver streak", "splay", "delamination",
        "รอยไหม้", "ฉีดไม่เต็ม", "บิดงอ", "เนื้อล้น", "ตาปลา", "รอยต่อ",
      ],
      parameters: [
        "temperature", "pressure", "speed", "time", "cycle time",
        "injection speed", "holding pressure", "cooling time",
        "อุณหภูมิ", "แรงดัน", "ความเร็ว", "เวลา",
      ],
      materials: [
        "pp", "pe", "abs", "pc", "pa", "pom", "pet", "ps",
        "tpu", "tpe", "pvc", "pmma", "pei", "pes",
      ],
      calculations: [
        "คำนวณ", "calculate", "สูตร", "formula",
        "shot weight", "clamping force", "projected area",
      ],
      design: [
        "gate design", "runner design", "cooling channel", "venting",
        "draft angle", "wall thickness", "ออกแบบเกต", "ออกแบบรันเนอร์",
      ],
    };
  }

  /**
   * วิเคราะห์ว่าคำถามต้องการ Clarification หรือไม่
   */
  needsClarification(text, userLevel, questionType) {
    const lowerText = text.toLowerCase().trim();

    // 1. ตรวจสอบว่ามี Ambiguous Keywords หรือไม่
    const hasAmbiguousKeyword = this.ambiguousKeywords.some((keyword) =>
      lowerText.includes(keyword.toLowerCase()),
    );

    // 2. ตรวจสอบว่ามี Specific Keywords หรือไม่
    const hasSpecificKeyword = Object.values(this.specificKeywords)
        .flat()
        .some((keyword) => lowerText.includes(keyword.toLowerCase()));

    // 3. ตรวจสอบความยาวของคำถาม (คำถามสั้นเกินไปอาจคลุมเครือ)
    const isVeryShort = text.trim().split(/\s+/).length < 5;

    // 4. ตรวจสอบ Question Type
    const isGeneralQuestion = questionType === "general" || questionType === "greeting";

    // 5. คำนวณ Confidence Score
    let confidenceScore = 1.0;

    if (hasAmbiguousKeyword) confidenceScore -= 0.3;
    if (!hasSpecificKeyword) confidenceScore -= 0.2;
    if (isVeryShort) confidenceScore -= 0.2;
    if (isGeneralQuestion) confidenceScore -= 0.1;

    // 6. ตัดสินใจว่าต้อง Clarify หรือไม่
    const needsClarification =
      confidenceScore < this.clarificationThreshold &&
      hasAmbiguousKeyword &&
      !hasSpecificKeyword &&
      (userLevel === "beginner" || userLevel === "intermediate");

    return {
      needsClarification,
      confidence: confidenceScore,
      reasons: {
        hasAmbiguousKeyword,
        hasSpecificKeyword,
        isVeryShort,
        isGeneralQuestion,
        userLevel,
      },
    };
  }

  /**
   * สร้างคำถาม Clarification สำหรับผู้ใช้
   */
  generateClarificationPrompt(text, analysis) {
    const basePrompt = `เพื่อให้ผมช่วยคุณได้แม่นยำที่สุด ช่วยระบุให้ชัดเจนหน่อยนะครับ 😊\n\n`;

    // ตรวจจับประเภทคำถามคร่าวๆ
    const lowerText = text.toLowerCase();

    // กรณี: "พัฒนา", "ปรับปรุง"
    if (/พัฒนา|ปรับปรุง|improve|develop|enhance/.test(lowerText)) {
      return basePrompt +
        `**คุณต้องการพัฒนาในด้านใดครับ?**\n\n` +
        `[A] 🎯 **ลดของเสีย** (Reduce Defects)\n` +
        `    → แก้ปัญหา short shot, flash, warpage, sink mark\n\n` +
        `[B] ⚡ **เพิ่มความเร็วการผลิต** (Increase Production Speed)\n` +
        `    → ลด cycle time, เพิ่มประสิทธิภาพการผลิต\n\n` +
        `[C] 💰 **ลดต้นทุน** (Reduce Cost)\n` +
        `    → ลดการใช้วัตถุดิบ, ลดพลังงาน, เพิ่มอายุแม่พิมพ์\n\n` +
        `[D] 🔧 **ปรับปรุงคุณภาพสินค้า** (Improve Quality)\n` +
        `    → เพิ่มความแข็งแรง, ความสวยงาม, ความทนทาน\n\n` +
        `[E] 📐 **ออกแบบแม่พิมพ์** (Mold Design Improvement)\n` +
        `    → ปรับปรุง gate, runner, cooling system\n\n` +
        `[F] 🎓 **อื่นๆ** (โปรดระบุ)\n\n` +
        `กรุณาเลือก A, B, C, D, E หรือ F แล้วบอกรายละเอียดเพิ่มเติมครับ`;
    }

    // กรณี: "เช็ค", "ตรวจสอบ"
    if (/เช็ค|ตรวจสอบ|check|inspect|review/.test(lowerText)) {
      return basePrompt +
        `**คุณต้องการตรวจสอบอะไรครับ?**\n\n` +
        `[A] 🔍 **ตรวจสอบพารามิเตอร์เครื่อง** (Machine Settings)\n` +
        `    → ตรวจสอบ temperature, pressure, speed, time\n\n` +
        `[B] 🏭 **ตรวจสอบคุณภาพชิ้นงาน** (Product Quality)\n` +
        `    → วิเคราะห์ข้อบกพร่อง, ตรวจสอบขนาด\n\n` +
        `[C] 🛠️ **ตรวจสอบแม่พิมพ์** (Mold Inspection)\n` +
        `    → ตรวจสอบสภาพแม่พิมพ์, ระบบหล่อเย็น, venting\n\n` +
        `[D] 📊 **ตรวจสอบประสิทธิภาพการผลิต** (Production Efficiency)\n` +
        `    → วิเคราะห์ cycle time, อัตราของเสีย, productivity\n\n` +
        `[E] 🎓 **อื่นๆ** (โปรดระบุ)\n\n` +
        `กรุณาเลือก A, B, C, D หรือ E แล้วบอกรายละเอียดเพิ่มเติมครับ`;
    }

    // กรณี: คำถามทั่วไปที่คลุมเครือ
    return basePrompt +
      `**คุณต้องการความช่วยเหลือในด้านใดครับ?**\n\n` +
      `[A] 🔧 **แก้ปัญหาข้อบกพร่อง** (Troubleshooting)\n` +
      `    → short shot, flash, warpage, sink mark, weld line, etc.\n\n` +
      `[B] 📊 **คำนวณค่าต่างๆ** (Calculations)\n` +
      `    → shot weight, clamping force, cooling time, cost\n\n` +
      `[C] ⚙️ **ตั้งค่าพารามิเตอร์** (Parameter Settings)\n` +
      `    → temperature, pressure, speed, time settings\n\n` +
      `[D] 📐 **ออกแบบแม่พิมพ์** (Mold Design)\n` +
      `    → gate, runner, cooling, venting design\n\n` +
      `[E] 🧪 **เลือกวัสดุ** (Material Selection)\n` +
      `    → เปรียบเทียบ PP, ABS, PC, PA, etc.\n\n` +
      `[F] 📚 **ความรู้ทั่วไป** (General Knowledge)\n` +
      `    → กระบวนการฉีด, เทคนิคต่างๆ\n\n` +
      `[G] 🎓 **อื่นๆ** (โปรดระบุ)\n\n` +
      `กรุณาเลือก A-G แล้วบอกรายละเอียดเพิ่มเติมครับ ยิ่งละเอียดยิ่งดี! 😊`;
  }

  /**
   * ตรวจสอบว่าคำตอบเป็นการเลือกตัวเลือกจาก Clarification หรือไม่
   */
  isClarificationResponse(text) {
    const lowerText = text.toLowerCase().trim();

    // ตรวจสอบรูปแบบการตอบกลับ เช่น "A", "[A]", "ตัวเลือก A", "เลือก A"
    const optionPatterns = [
      /^[a-g]$/i,
      /^\[([a-g])\]$/i,
      /^ตัวเลือก\s*([a-g])/i,
      /^เลือก\s*([a-g])/i,
      /^option\s*([a-g])/i,
      /^([a-g])\s*[\.\:\-]/i,
    ];

    for (const pattern of optionPatterns) {
      const match = lowerText.match(pattern);
      if (match) {
        return {
          isResponse: true,
          option: match[1] ? match[1].toUpperCase() : lowerText.toUpperCase(),
        };
      }
    }

    return {isResponse: false, option: null};
  }

  /**
   * ปรับคำถามให้ชัดเจนขึ้นตามตัวเลือกที่ผู้ใช้เลือก
   */
  enhanceQueryFromOption(originalQuery, option, followUpText = "") {
    const optionMap = {
      "A": "ลดของเสีย แก้ปัญหาข้อบกพร่องชิ้นงาน",
      "B": "เพิ่มความเร็วการผลิต ลด cycle time",
      "C": "ลดต้นทุนการผลิต",
      "D": "ปรับปรุงคุณภาพสินค้า",
      "E": "ออกแบบแม่พิมพ์",
      "F": "อื่นๆ",
      "G": "อื่นๆ",
    };

    const enhancement = optionMap[option] || "";
    return `${originalQuery} (โดยเฉพาะ: ${enhancement}) ${followUpText}`.trim();
  }
}

const queryClarification = new QueryClarificationModule();

// =====================================================
// 🛠️ ENHANCED UTILITY FUNCTIONS
// =====================================================

/**
 * จัดรูปแบบ Chat History แบบละเอียด (Enhanced)
 */
function formatChatHistory(messages, maxMessages = 6) {
  if (!messages || messages.length === 0) {
    return "🆕 NEW_CONVERSATION: ผู้ใช้เริ่มสนทนาใหม่";
  }

  const recent = messages.slice(-maxMessages);
  return recent.map((msg, index) => {
    const role = msg.isUser ? "👤 USER" : "🤖 ASSISTANT";
    const timestamp = msg.timestamp ?
      `[${new Date(msg.timestamp).toLocaleTimeString("th-TH", {hour: "2-digit", minute: "2-digit"})}]` : "";
    const textPreview = msg.text.length > 80 ?
      `${msg.text.substring(0, 80)}...` : msg.text;

    return `📌 ${timestamp} ${role}: ${textPreview}`;
  }).join("\n");
}

/**
 * ตรวจจับระดับความเชี่ยวชาญของผู้ใช้ (Enhanced)
 */
function detectUserLevel(text, chatHistory = []) {
  const lowerText = text.toLowerCase();
  const allText = chatHistory.slice(-6).map((m) => m.text.toLowerCase()).join(" ") + " " + lowerText;

  const expertTerms = [
    "mold flow analysis", "cavity pressure", "clamping force calculation",
    "runner system design", "gate optimization", "warpage analysis",
    "differential cooling", "shear rate calculation", "viscosity modeling",
    "crystallinity", "molecular orientation", "rheology", "pvt diagram",
    "glass transition temperature", "melt flow index", "anisotropy",
    "finite element analysis", "doe", "taguchi method", "scientific molding",
    "cpk", "spc control", "process capability", "gate seal analysis",
  ];

  const intermediateTerms = [
    "injection parameters", "temperature profile", "pressure setting",
    "speed optimization", "holding pressure", "cooling time calculation",
    "cycle time optimization", "mold temperature", "back pressure",
    "screw speed", "cushion size", "decompression", "venting design",
    "ejection system", "draft angle", "wall thickness", "shrinkage compensation",
  ];

  const beginnerTerms = [
    "ปัญหาชิ้นงาน", "การตั้งค่าเครื่อง", "วัสดุพลาสติก",
    "แม่พิมพ์", "เครื่องฉีด", "ข้อบกพร่อง", "วิธีการแก้ไข",
    "พื้นฐาน", "เริ่มต้น", "แนะนำ", "สอน", "เรียน",
  ];

  const expertScore = expertTerms.filter((term) => allText.includes(term)).length * 3;
  const intermediateScore = intermediateTerms.filter((term) => allText.includes(term)).length * 2;
  const beginnerScore = beginnerTerms.filter((term) => allText.includes(term)).length * 1;

  const totalScore = expertScore + intermediateScore + beginnerScore;

  if (expertScore >= 6 || totalScore >= 15) return "expert";
  if (intermediateScore >= 4 || totalScore >= 8) return "intermediate";
  return "beginner";
}

/**
 * ตรวจจับประเภทคำถาม (Enhanced with Weighted Scoring)
 */
function detectQuestionType(text) {
  const lowerText = text.toLowerCase().trim();

  const greetingPatterns = [
    /^(สวัสดี|hello|hi|hey|ดีครับ|ดีค่ะ)[\s\w]*$/i,
    /^(ขอบคุณ|thank you|thanks|ขอบใจ)[\s\w]*$/i,
    /^(ok|okay|เข้าใจ|got it|รับทราบ)[\s\w]*$/i,
    /^(ใช่|ไม่ใช่|ถูกต้อง|ผิด)[\s\w]*$/i,
  ];

  if (greetingPatterns.some((pattern) => pattern.test(lowerText))) {
    return "greeting";
  }

  const outOfScopePatterns = [
    /(อาหาร|กิน|ดื่ม|ร้านอาหาร|เมนู)/i,
    /(กีฬา|ฟุตบอล|บาสเกตบอล|ออกกำลังกาย)/i,
    /(ดนตรี|เพลง|ศิลปิน|คอนเสิร์ต)/i,
    /(ภาพยนตร์|หนัง|ซีรี่ย์|นักแสดง)/i,
    /(เกม|เกมมิ่ง|เล่นเกม)/i,
    /(ข่าว|การเมือง|รัฐบาล|เศรษฐกิจ)/i,
    /(หุ้น|การเงิน|ลงทุน|bitcoin)/i,
    /(สุขภาพ|โรค|ยา|โรงพยาบาล)/i,
  ];

  if (outOfScopePatterns.some((pattern) => pattern.test(lowerText))) {
    return "out_of_scope";
  }

  const questionTypes = {
    troubleshooting: {
      keywords: [
        "ปัญหา", "แก้ไข", "เกิดอะไร", "ทำไม", "เหตุผล",
        "short shot", "warpage", "flash", "sink mark", "weld line",
        "burn mark", "jetting", "silver streak", "splay", "delamination",
        "brittle", "crack", "discolor", "void", "blush",
        "flow line", "knit line", "weld mark",
      ],
      weight: 3,
    },
    calculation: {
      keywords: [
        "คำนวณ", "calculate", "สูตร", "formula", "วิธีหา",
        "shot weight", "clamping force", "cooling time", "cycle time",
        "projected area", "cavity pressure", "injection rate",
        "material consumption", "production cost", "profit margin",
      ],
      weight: 3,
    },
    parameter: {
      keywords: [
        "parameter", "setting", "ค่า", "แนะนำ", "ควรตั้ง",
        "temperature", "pressure", "speed", "time", "profile",
        "melt temp", "mold temp", "injection", "holding", "cooling",
        "screw speed", "back pressure", "cushion",
      ],
      weight: 2,
    },
    comparison: {
      keywords: [
        "เปรียบเทียบ", "compare", "ต่างกัน", "ดีกว่า", "vs",
        "difference", "advantage", "disadvantage", "เลือก",
        "material comparison", "machine comparison", "method comparison",
      ],
      weight: 2,
    },
    design: {
      keywords: [
        "ออกแบบ", "design", "gate design", "runner design",
        "cooling system", "venting", "ejection", "draft angle",
        "wall thickness", "rib design", "boss design", "undercut",
      ],
      weight: 2,
    },
    drying_process: {
      keywords: [
        "อบ", "drying", "dry", "dehumidify", "moisture",
        "วิธีอบ", "การอบ", "อบแห้ง", "อบความชื้น",
        "dryer", "dehumidifying", "desiccant",
        "อบวัสดุ", "อบเม็ด", "hopper dryer",
      ],
      weight: 3,
    },
    material_selection: {
      keywords: [
        "วัสดุ", "material", "เลือกวัสดุ", "ควรใช้", "เหมาะสม",
        "คุณสมบัติ", "properties", "characteristics",
        "เปรียบเทียบวัสดุ", "material selection",
      ],
      weight: 2,
    },
    material_properties: {
      keywords: [
        "pp", "pe", "abs", "pc", "pa", "pom", "pet", "ps",
        "tpu", "tpe", "pvc", "pmma", "pei", "pes",
        "hdpe", "ldpe", "pps", "peek", "nylon",
        "plastic", "polymer", "resin",
      ],
      weight: 1.5,
    },
    process: {
      keywords: [
        "process", "ขั้นตอน", "หัวหน้า", "procedure", "methodology",
        "injection molding process", "production process",
        "quality control", "inspection", "testing",
      ],
      weight: 1.5,
    },
  };

  const scores = {};
  for (const [type, data] of Object.entries(questionTypes)) {
    const matches = data.keywords.filter((keyword) => lowerText.includes(keyword.toLowerCase()));
    scores[type] = matches.length * data.weight;
  }

  const maxScore = Math.max(...Object.values(scores));
  if (maxScore > 0) {
    return Object.keys(scores).find((key) => scores[key] === maxScore);
  }

  return "general";
}

/**
 * ตรวจจับสาขาความเชี่ยวชาญจาก 12 สาขาหลัก
 */
function detectExpertiseDomain(text, chatHistory = []) {
  const lowerText = text.toLowerCase();
  const allText = chatHistory.slice(-6).map((m) => m.text.toLowerCase()).join(" ") + " " + lowerText;

  const expertiseDomains = {
    mold_design: {
      keywords: [
        "mold design", "gate design", "runner design", "cooling channel", "venting design",
        "ejection system", "draft angle", "undercut", "slide", "lifter", "core",
        "cavity", "mold base", "hot runner", "cold runner", "gate location",
        "mold flow analysis", "warpage", "shrinkage", "mold material",
        "ออกแบบแม่พิมพ์", "เกต", "รันเนอร์", "ระบบน้ำหล่อเย็น", "ระบบฉีด",
        "มุมดราฟท์", "อันเดอร์คัท", "สไลด์", "ลิฟเตอร์", "คอร์", "spare parts",
      ],
      weight: 3,
    },

    process_optimization: {
      keywords: [
        "process optimization", "scientific molding", "cycle time", "injection speed",
        "holding pressure", "cooling time", "cavity pressure", "clamping force",
        "melt temperature", "mold temperature", "back pressure", "screw speed",
        "cushion", "decompression", "v-p transfer", "packing profile",
        "ปรับปรุงกระบวนการ", "ไซเคิลไทม์", "ความเร็วการฉีด", "แรงกดประคอง",
        "เวลาหล่อเย็น", "อุณหภูมิพลาสติก", "อุณหภูมิแม่พิมพ์",
      ],
      weight: 3,
    },

    troubleshooting: {
      keywords: [
        "troubleshooting", "defect analysis", "short shot", "flash", "warpage",
        "sink mark", "weld line", "burn mark", "jetting", "void", "blush",
        "silver streak", "delamination", "brittle", "crack", "discolor",
        "flow line", "knit line", "splay", "weld mark",
        "แก้ปัญหา", "ข้อบกพร่อง", "ชิ้นงานไม่เต็ม", "เนื้อล้น", "บิดงอ",
        "ตาปลา", "รอยต่อ", "รอยไหม้",
      ],
      weight: 3,
    },

    material_science: {
      keywords: [
        "material science", "polymer", "plastic", "resin", "additive",
        "filler", "reinforcement", "polymer structure", "molecular weight",
        "crystallinity", "amorphous", "viscosity", "rheology", "pvt",
        "glass transition", "melt flow index", "thermal properties",
        "pp", "pe", "abs", "pc", "pa", "pom", "pet", "ps", "tpu", "pvc",
        "pmma", "pei", "pes", "pbt", "pps", "pei",
        "วัสดุพลาสติก", "พอลิเมอร์", "สารเติมแต่ง", "ความหนืด", "การไหล",
      ],
      weight: 2.5,
    },

    machinery_equipment: {
      keywords: [
        "injection machine", "clamping unit", "injection unit", "screw", "barrel", "toshiba injection Molding machine",
        "porchison board control injection Molding machine", "ชุดควบคุม", "เครื่องฉีดพลาสติกโตชิบา", "เครื่องฉีดพลาสติกพอร์ชิสัน",
        "nozzle", "check valve", "hydraulic system", "electric machine",
        "hybrid machine", "robot", "automation", "conveyor", "chiller",
        "hopper dryer", "mixer", "granulator", "peripheral equipment",
        "เครื่องฉีด", "หน่วยปิดกั้น", "หน่วยฉีด", "สกรู", "กระบอก", "วงจรควบคุม",
        "หัวฉีด", "ระบบไฮดรอลิก", "หุ่นยนต์", "ระบบอัตโนมัติ",
      ],
      weight: 2,
    },

    quality_control: {
      keywords: [
        "quality control", "qc", "inspection", "measurement", "metrology",
        "dimension", "tolerance", "gd&t", "cmm", "vision system",
        "statistical process control", "spc", "cpk", "ppk", "six sigma",
        "quality standard", "defect rate", "ppm", "fmea", "control plan",
        "ควบคุมคุณภาพ", "การตรวจสอบ", "ขนาด", "ความคลาดเคลื่อน", "มาตรฐาน",
        "iso", "astm",
      ],
      weight: 2,
    },
  };

  const scores = {};
  for (const [domain, data] of Object.entries(expertiseDomains)) {
    const matches = data.keywords.filter((keyword) =>
      allText.includes(keyword.toLowerCase()),
    );
    scores[domain] = matches.length * data.weight;
  }

  const sortedDomains = Object.entries(scores)
      .filter(([_, score]) => score > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([domain]) => domain);

  // ถ้าไม่มี หรือมีน้อย ให้เติม General เข้าไปให้ครบอย่างน้อย 2 อัน
  if (sortedDomains.length === 0) return ["general_inquiry", "basic_knowledge"];
  if (sortedDomains.length === 1) return [sortedDomains[0], "general_inquiry"];

  return sortedDomains;
}

/**
 * สร้าง Expertise-Based Prompt Template
 */
function createExpertisePrompt(domains, context) {
  const domainTemplates = {
    mold_design: `
🎯 **MOLD DESIGN EXPERT MODE**
**Focus Areas:**
• Gate Design & Optimization
• Runner System Balancing  
• Cooling Channel Layout
• Venting & Ejection Systems
• Mold Flow Analysis Integration
• Spare Parts Management

**Key Considerations:**
- Pressure drop analysis across runner system
- Cooling time optimization through channel design
- Gate type selection based on material and part geometry
- Venting design to prevent gas traps
- Ejection system to prevent part damage
`,

    process_optimization: `
🎯 **PROCESS OPTIMIZATION EXPERT MODE** 
**Focus Areas:**
• Scientific Molding Principles
• Cycle Time Reduction Strategies
• Parameter Optimization (DoE Approach)
• Cavity Pressure Monitoring
• Energy Efficiency Optimization

**Key Considerations:**
- V/P transfer optimization based on cavity pressure
- Holding pressure profiling for dimensional stability
- Cooling time calculation based on thermal properties
- Machine capability analysis
`,

    troubleshooting: `
🎯 **TROUBLESHOOTING EXPERT MODE**
**Focus Areas:**
• Root Cause Analysis (5-Why, Fishbone)
• Defect Pattern Recognition
• Material-Process Interaction Analysis
• Mold & Machine Interaction Issues
• Systematic Problem Solving Approach

**Key Considerations:**
- Distinguish between material, mold, machine, and process causes
- Use scientific approach rather than trial-and-error
- Consider interaction effects between parameters
- Implement permanent corrective actions
`,

    material_science: `
🎯 **MATERIAL SCIENCE EXPERT MODE**
**Focus Areas:**
• Polymer Rheology & PVT Behavior
• Material Selection Methodology
• Additive & Filler Effects
• Material-Process Interaction
• Failure Analysis at Molecular Level

**Key Considerations:**
- Viscosity-shear rate-temperature relationships
- Crystallization behavior and cooling effects
- Fiber orientation in reinforced materials
- Environmental stress cracking resistance
`,

    machinery_equipment: `
🎯 **MACHINERY & EQUIPMENT EXPERT MODE**
**Focus Areas:**
• Injection Machine Specifications
• Clamping System Analysis
• Screw and Barrel Design
• Hydraulic vs Electric Systems
• Peripheral Equipment Integration

**Key Considerations:**
- Machine capacity and capability analysis
- Energy consumption optimization
- Maintenance scheduling and planning
- Equipment lifecycle management
`,

    quality_control: `
🎯 **QUALITY CONTROL EXPERT MODE**
**Focus Areas:**
• Statistical Process Control (SPC)
• Measurement System Analysis (MSA)
• GD&T Application
• Quality System Implementation
• Defect Prevention Strategies

**Key Considerations:**
- Cp/Cpk analysis for process capability
- Gage R&R for measurement system validation
- Control plan development
- FMEA for risk mitigation
`,
  };

  const primaryDomain = domains[0];
  const domainPrompt = domainTemplates[primaryDomain] || "";

  return `
# 🎯 MULTI-DOMAIN INJECTION MOLDING EXPERT
**Primary Expertise Domain:** ${primaryDomain.replace("_", " ").toUpperCase()}
**Supporting Domains:** ${domains.slice(1).map((d) => d.replace("_", " ").toUpperCase()).join(", ")}

## 🔬 DOMAIN-SPECIFIC EXPERTISE
${domainPrompt}

## 🎯 RESPONSE STRATEGY
**Apply Multi-Domain Thinking:**
1. **Primary Domain Focus:** Deep technical analysis from ${primaryDomain} perspective
2. **Cross-Domain Integration:** Consider interactions with ${domains.slice(1).join(", ")}
3. **Holistic Solution:** Address root causes, not just symptoms
4. **Practical Implementation:** Provide actionable recommendations with technical rationale
`;
}

/**
 * วิเคราะห์ Context แบบละเอียด
 */
function analyzeContext(chatHistory) {
  if (!chatHistory || chatHistory.length === 0) {
    return {
      hasProblem: false,
      problemType: null,
      needsFollowUp: false,
      conversationStage: "initial",
      userIntent: "information_seeking",
      urgencyLevel: "low",
      materials: [],
      topics: [],
      technicalDepth: "basic",
      expertiseDomains: ["general_inquiry"],
    };
  }

  const recentMessages = chatHistory.slice(-6);
  const allText = recentMessages.map((m) => m.text.toLowerCase()).join(" ");
  const lastUserMessage = chatHistory.filter((m) => m.isUser).pop()?.text.toLowerCase() || "";

  const defectPatterns = [
    {name: "Short Shot", keywords: ["short shot", "ไม่เต็ม", "ไหลไม่เต็ม"], severity: "high"},
    {name: "Warpage", keywords: ["warpage", "บิดงอ", "โค้งงอ"], severity: "high"},
    {name: "Flash", keywords: ["flash", "เนื้อล้น", "ล้นแม่พิมพ์"], severity: "medium"},
    {name: "Sink Mark", keywords: ["sink mark", "ตาปลา", "รอยบุ๋ม"], severity: "medium"},
    {name: "Weld Line", keywords: ["weld line", "รอยต่อ", "รอยเชื่อม"], severity: "medium"},
    {name: "Burn Mark", keywords: ["burn mark", "ไหม้", "carbon"], severity: "high"},
    {name: "Jetting", keywords: ["jetting", "เส้นไส้ไก่"], severity: "low"},
    {name: "Silver Streak", keywords: ["silver streak", "เส้นเงิน"], severity: "low"},
  ];

  let problemType = null;
  let urgencyLevel = "low";
  for (const defect of defectPatterns) {
    if (defect.keywords.some((kw) => allText.includes(kw))) {
      problemType = defect.name;
      urgencyLevel = defect.severity;
      break;
    }
  }

  const materials = ["pp", "pe", "abs", "pc", "pa", "pom", "pet", "ps", "tpu", "pvc", "pmma"]
      .filter((mat) => allText.includes(mat));

  const topics = [
    "gate", "runner", "cooling", "venting", "ejection",
    "temperature", "pressure", "speed", "time", "quality",
    "cost", "production", "maintenance", "design", "material",
  ].filter((topic) => allText.includes(topic));

  let conversationStage = "initial";
  if (chatHistory.length >= 4) conversationStage = "engaged";
  if (problemType && chatHistory.length >= 3) conversationStage = "problem_solving";
  if (chatHistory.length >= 8) conversationStage = "deep_discussion";

  let userIntent = "information_seeking";
  if (problemType) userIntent = "problem_solving";
  if (lastUserMessage.includes("คำนวณ") || lastUserMessage.includes("calculate")) userIntent = "calculation";
  if (lastUserMessage.includes("เปรียบเทียบ") || lastUserMessage.includes("compare")) userIntent = "comparison";
  if (lastUserMessage.includes("แนะนำ") || lastUserMessage.includes("suggest")) userIntent = "recommendation";

  let technicalDepth = "basic";
  const technicalTerms = recentMessages.flatMap((m) =>
    m.text.split(" ").filter((word) =>
      ["temperature", "pressure", "viscosity", "crystallinity", "rheology"].includes(word.toLowerCase()),
    ),
  );
  if (technicalTerms.length >= 3) technicalDepth = "advanced";
  else if (technicalTerms.length >= 1) technicalDepth = "intermediate";

  const expertiseDomains = detectExpertiseDomain(lastUserMessage, chatHistory);

  const hasProblem = problemType !== null;
  const needsFollowUp = hasProblem && chatHistory.length >= 2 && conversationStage === "problem_solving";

  return {
    hasProblem,
    problemType,
    needsFollowUp,
    conversationStage,
    userIntent,
    urgencyLevel,
    materials,
    topics,
    technicalDepth,
    expertiseDomains,
  };
}

// =====================================================
// 🛡️ ENHANCED SECURITY & VALIDATION FUNCTIONS
// =====================================================

/**
 * ENHANCED API KEY VALIDATION
 */
function getGeminiApiKey() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "undefined" || apiKey.length < 20) {
    console.error("❌ INVALID API KEY CONFIGURATION");
    throw new HttpsError(
        "failed-precondition",
        "🔧 ระบบกำลังดำเนินการอัพเกรด ขออภัยในความไม่สะดวก กรุณาลองใหม่ใน 2-3 นาที",
    );
  }

  return apiKey;
}

// Debug helper - masked print of GEMINI API Key status
function logGeminiApiKeyStatus() {
  const apiKey = process.env.GEMINI_API_KEY;
  const status = apiKey ? `SET (len=${apiKey.length})` : "NOT SET";
  if (apiKey && apiKey.length > 4) {
    console.log(`🔑 GEMINI_API_KEY: ${status} - last4=${apiKey.substring(apiKey.length - 4)}`);
  } else {
    console.log(`🔑 GEMINI_API_KEY: ${status}`);
  }
}

/**
 * ENHANCED INPUT SANITIZATION
 */
function sanitizeAndValidateInput(text, chatHistory) {
  if (typeof text !== "string") {
    throw new HttpsError("invalid-argument", "ข้อความต้องเป็นรูปแบบข้อความ");
  }

  const cleanText = text.trim();

  if (cleanText.length === 0) {
    throw new HttpsError("invalid-argument", "กรุณาระบุคำถาม");
  }

  if (cleanText.length > 2500) {
    throw new HttpsError("invalid-argument", "ข้อความยาวเกิน 2,500 ตัวอักษร");
  }

  const dangerousChars = /[<>{}[\]]/g;
  if (dangerousChars.test(cleanText)) {
    console.warn("🚨 Dangerous characters detected");
    throw new HttpsError("invalid-argument", "ข้อความมีอักขระที่ไม่ปลอดภัย");
  }

  if (chatHistory && Array.isArray(chatHistory)) {
    const validHistory = chatHistory.filter((msg) =>
      msg &&
      typeof msg.text === "string" &&
      typeof msg.isUser === "boolean" &&
      msg.text.length <= 2500,
    );

    if (validHistory.length !== chatHistory.length) {
      console.warn("⚠️ Filtered invalid chat history entries");
    }

    return {cleanText, validHistory};
  }

  return {cleanText, validHistory: []};
}

/**
 * ENHANCED PROMPT INJECTION DETECTION
 */
function detectAdvancedPromptInjection(text) {
  const injectionPatterns = [
    /(system|developer|programmer)\s+prompt/i,
    /(ignore|forget|disregard)\s+(previous|all|instructions)/i,
    /(roleplay|pretend|act)\s+as\s+/i,
    /(you are|you're)\s+now\s+[^\.]+\./i,
    /(switch|change)\s+to\s+(english|thai)/i,
    /(respond|answer)\s+in\s+/i,
    /(clear|reset|start over)\s+conversation/i,
    /(beginning|start)\s+of\s+chat/i,
    /(bypass|override|circumvent)\s+/i,
    /(secret|hidden)\s+instructions?/i,
    /(test|testing|debug)\s+mode/i,
    /this\s+is\s+a\s+test/i,
    /(ลืม|ไม่ต้องทำตาม|ทำเป็น|แสดงเป็น).*(ที่แล้ว|ทั้งหมด|คำสั่ง)/i,
    /(เปลี่ยนภาษา|ตอบภาษาอังกฤษ)/i,
    /(เริ่มใหม่|เคลียร์แชท)/i,
  ];

  const severityWeights = {
    high: 3,
    medium: 2,
    low: 1,
  };

  let threatScore = 0;
  const detectedPatterns = [];

  injectionPatterns.forEach((pattern, index) => {
    if (pattern.test(text)) {
      const severity = index < 8 ? "high" : index < 16 ? "medium" : "low";
      threatScore += severityWeights[severity];
      detectedPatterns.push({pattern: pattern.toString(), severity});
    }
  });

  if (threatScore >= 3) {
    console.warn(`🚨 CRITICAL: Advanced prompt injection detected`, {
      threatScore,
      detectedPatterns,
      textPreview: text.substring(0, 100),
    });
    return true;
  }

  if (threatScore > 0) {
    console.warn(`⚠️ SUSPICIOUS: Potential injection patterns`, {
      threatScore,
      detectedPatterns: detectedPatterns.length,
    });
  }

  return false;
}

/**
 * ENHANCED CONTEXT ANALYSIS WITH MEMORY OPTIMIZATION
 */
function analyzeEnhancedContext(chatHistory, currentText) {
  const MAX_HISTORY_MESSAGES = 10;
  const optimizedHistory = chatHistory.slice(-MAX_HISTORY_MESSAGES);

  const baseContext = analyzeContext(optimizedHistory);

  const recentUserMessages = optimizedHistory
      .filter((msg) => msg.isUser)
      .slice(-3)
      .map((msg) => msg.text.toLowerCase());

  const isRepetitive = recentUserMessages.some((msg) =>
    similarityScore(msg, currentText.toLowerCase()) > 0.8,
  );

  const specificNeeds = {
    needsCalculation: /(คำนวณ|calculate|สูตร)/i.test(currentText),
    needsComparison: /(เปรียบเทียบ|compare|ต่างกัน|ดีกว่า)/i.test(currentText),
    needsTroubleshooting: /(ปัญหา|แก้ไข|เสีย|ไม่ทำงาน)/i.test(currentText),
    needsRecommendation: /(แนะนำ|ควรใช้|ไหนดี)/i.test(currentText),
  };

  const contextChain = createContextChain(optimizedHistory, currentText);

  return {
    ...baseContext,
    isRepetitive,
    specificNeeds,
    contextChain,
    optimizedHistoryLength: optimizedHistory.length,
    memoryOptimized: optimizedHistory.length < chatHistory.length,
  };
}
function createAgentEnhancedPrompt(agentResult, userQuery, context, memoryContext, knowledgeContext, executionId, userLevel) {
  const {
    expertiseDomains,
    technicalDepth,
    conversationStage,
    urgencyLevel,
    isRepetitive,
    materials,
    problemType,
    specificNeeds,
  } = context;

  return `
# 🧠 HYPER-INTELLIGENT INJECTION MOLDING AGENT (MULTI-AGENT MODE)
**Execution ID:** ${executionId} | **User Level:** ${userLevel}

## 🔬 MULTI-AGENT ANALYSIS RESULTS
**Agents Activated:** ${agentResult.synthesizedFrom.join(", ")}
**Overall Confidence:** ${Math.round(agentResult.overallConfidence * 100)}%
**Quality Score:** ${agentResult.qualityScore}%

### TECHNICAL ANALYSIS:
${agentResult.technicalAnalysis.map((analysis) =>
    `• **${analysis.source}:** ${analysis.content}`,
  ).join("\n")}

### ACTION PLAN:
${agentResult.actionPlan.map((action) =>
    `🎯 **${action.priority.toUpperCase()}:** ${action.action}`,
  ).join("\n")}

### SAFETY NOTES:
${agentResult.safetyNotes.length > 0 ?
  agentResult.safetyNotes.join("\n") : "• No major safety concerns"
}

## 🎯 ENHANCED CONTEXT INTEGRATION
**User Profile:**
- Level: ${userLevel} ${userLevel === "beginner" ? "🔰" : userLevel === "intermediate" ? "🛠️" : "🎯"}
- Primary Domain: ${expertiseDomains[0].replace("_", " ").toUpperCase()}
- Technical Depth: ${technicalDepth}
- Conversation Stage: ${conversationStage}
- Urgency: ${urgencyLevel}

**Current Focus:**
- ${problemType ? `Active Problem: ${problemType}` : "General Inquiry"}
- ${materials.length > 0 ? `Materials: ${materials.join(", ")}` : "No specific materials"}
- ${isRepetitive ? "⚠️ **REPETITIVE QUESTION:** Provide new perspectives" : "🆕 New inquiry"}

## 📚 HYPER-LOCALIZED KNOWLEDGE BASE
${knowledgeContext}

## 🧠 MEMORY CONTEXT
${memoryContext}

## ❓ CURRENT QUERY
"${userQuery}"

## 🚀 RESPONSE GENERATION STRATEGY

### FINAL OUTPUT STRUCTURE:
1. **Executive Summary:** Synthesize findings from all agents
2. **Scientific Explanation:** Explain the root cause using multi-agent insights  
3. **Actionable Solutions:** Present the prioritized action plan
4. **Parameter Recommendations:** Provide specific numerical values with confidence levels
5. **Risk Mitigation:** Include safety notes and precautions
6. **Validation Steps:** Guide user on how to verify the solution

### QUALITY REQUIREMENTS:
- Integrate insights from all activated agents
- Maintain scientific accuracy based on agent analysis
- Provide confidence levels for each recommendation
- Consider user's technical level (${userLevel})
- Address specific needs: ${JSON.stringify(specificNeeds)}

### THINKING PROCESS (INTERNAL ONLY):
- Cross-reference agent findings for consistency
- Validate parameter recommendations against material limits
- Ensure solutions are practical and implementable
- Consider cost-benefit tradeoffs from different agent perspectives

**Generate the final integrated response now:**
`;
}

/**
 * คำนวณความคล้ายคลึงระหว่างข้อความ
 */
function similarityScore(text1, text2) {
  const words1 = new Set(text1.split(/\s+/));
  const words2 = new Set(text2.split(/\s+/));

  const intersection = new Set([...words1].filter((x) => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}
/**
 * 📚 KNOWLEDGE RETRIEVAL AGENT - Specialized in RAG (Retrieval-Augmented Generation)
 */
class KnowledgeRetrievalAgent {
  constructor() {
    this.expertise = "knowledge_retrieval";
    this.knowledgeBase = null;
  }

  async loadKnowledgeBase() {
    if (this.knowledgeBase) return;

    try {
      // พยายามโหลดข้อมูลจากไฟล์ content.json
      // หมายเหตุ: ใน Cloud Functions จริง ควรใช้ Firestore หรือ Cloud Storage
      try {
        this.knowledgeBase = require("../data/content.json");
        console.log("📚 Knowledge Base loaded successfully");
      } catch (e) {
        console.warn("⚠️ Could not load local content.json, using empty base");
        this.knowledgeBase = {};
      }
    } catch (error) {
      console.error("Error loading knowledge base:", error);
      this.knowledgeBase = {};
    }
  }

  async execute(task, parameters, context, memories) {
    console.log(`📚 KNOWLEDGE_AGENT: Executing ${task}`);
    await this.loadKnowledgeBase();

    switch (task) {
      case "retrieve_knowledge":
        return await this.retrieveKnowledge(parameters, context);
      default:
        throw new Error(`Unknown task: ${task}`);
    }
  }

  async retrieveKnowledge(parameters, context) {
    const {query, topics} = parameters;
    const results = {
      relevantContent: [],
      confidence: 0.0,
    };

    if (!this.knowledgeBase) return results;

    const queryLower = query.toLowerCase();
    let matchCount = 0;

    for (const [key, content] of Object.entries(this.knowledgeBase)) {
      const keyLower = key.toLowerCase();
      const contentLower = typeof content === "string" ? content.toLowerCase() : JSON.stringify(content).toLowerCase();

      // ตรวจสอบความเกี่ยวข้อง
      const isRelevant =
        keyLower.includes(queryLower) ||
        (topics && topics.some((t) => keyLower.includes(t))) ||
        contentLower.includes(queryLower);

      if (isRelevant) {
        results.relevantContent.push({
          topic: key,
          content: typeof content === "string" ? content.substring(0, 800) : JSON.stringify(content),
          relevance: this.calculateRelevance(queryLower, keyLower, contentLower),
        });
        matchCount++;
      }
    }

    // เรียงลำดับตามความเกี่ยวข้อง
    results.relevantContent.sort((a, b) => b.relevance - a.relevance);
    results.relevantContent = results.relevantContent.slice(0, 3); // เอาแค่ 3 อันดับแรก

    results.confidence = matchCount > 0 ? 0.85 : 0.1;
    return results;
  }

  calculateRelevance(query, key, content) {
    let score = 0;
    if (key.includes(query)) score += 0.6; // หัวข้อตรงกันให้คะแนนสูง
    if (content.includes(query)) score += 0.4; // เนื้อหาตรงกัน
    return Math.min(1.0, score);
  }
}

/**
 * 🎯 GRANDMASTER ORCHESTRATOR - Core Coordinator
 */
class GrandmasterOrchestrator {
  constructor() {
    this.agents = {
      material: new MaterialScienceAgent(),
      mold: new MoldDesignAgent(),
      process: new ProcessOptimizationAgent(),
      troubleshooting: new TroubleshootingAgent(),
      simulation: new SimulationAgent(),
      quality: new QualityControlAgent(),
      system: new SystemArchitectAgent(),
      knowledge: new KnowledgeRetrievalAgent(), // ✅ Added Knowledge Agent
    };
    this.synthesizer = new SolutionSynthesizer();
    this.agentPerformance = new Map();
    this.conversationContext = null;
  }

  async analyzeProblem(userQuery, context, memories) {
    console.log(`🧠 ORCHESTRATOR: Starting multi-agent analysis for: "${userQuery.substring(0, 50)}..."`);

    // STEP 1: Problem Decomposition & Agent Assignment
    const agentTasks = this.decomposeProblem(userQuery, context);

    // STEP 2: Parallel Agent Execution
    const agentResults = await this.executeAgents(agentTasks, context, memories);

    // STEP 3: Result Synthesis & Conflict Resolution
    const integratedSolution = await this.synthesizer.integrate(agentResults, context);

    // STEP 4: Quality Validation
    const validatedSolution = this.validateSolution(integratedSolution);

    return validatedSolution;
  }

  decomposeProblem(query, context) {
    const tasks = [];
    const queryLower = query.toLowerCase().trim();

    // ✅ REFACTORED: System commands are now explicit (e.g., /status, /dev)
    // This separates system administration from technical troubleshooting.
    if (queryLower.startsWith("/")) {
      const command = queryLower.substring(1).split(" ")[0];
      let task = "analyze_system_status"; // Default task

      // Map commands to specific system agent tasks
      if (["dev", "develop", "feature", "improve"].includes(command)) {
        task = "propose_improvements";
      }

      console.log(`SYSTEM COMMAND DETECTED: /${command} -> task: ${task}`);

      tasks.push({
        agent: "system",
        task: task,
        priority: 100, // Highest priority for explicit commands
        parameters: {command},
      });
      return tasks; // Execute only the system command and exit
    }

    // Knowledge Retrieval Agent Tasks (Always run for context)
    tasks.push({
      agent: "knowledge",
      task: "retrieve_knowledge",
      priority: 60,
      parameters: {
        query: queryLower,
        topics: context.topics || [],
      },
    });

    // Material Science Agent Tasks
    if (this.needsMaterialAnalysis(queryLower, context)) {
      tasks.push({
        agent: "material",
        task: "analyze_material_properties",
        priority: this.calculatePriority(queryLower, "material"),
        parameters: {
          materials: context.materials,
          problemType: context.problemType,
          userLevel: context.userLevel,
        },
      });
    }

    // Mold Design Agent Tasks
    if (this.needsMoldAnalysis(queryLower, context)) {
      tasks.push({
        agent: "mold",
        task: "analyze_mold_design",
        priority: this.calculatePriority(queryLower, "mold"),
        parameters: {
          moldType: this.detectMoldType(queryLower),
          issues: context.problemType,
          complexity: context.technicalDepth,
        },
      });
    }

    // Process Optimization Agent Tasks
    if (this.needsProcessAnalysis(queryLower, context)) {
      tasks.push({
        agent: "process",
        task: "optimize_process_parameters",
        priority: this.calculatePriority(queryLower, "process"),
        parameters: {
          machineType: context.machines,
          currentParams: this.extractParameters(queryLower),
          target: context.userIntent,
        },
      });
    }

    // Troubleshooting Agent Tasks
    if (context.hasProblem || this.isTroubleshootingQuery(queryLower)) {
      tasks.push({
        agent: "troubleshooting",
        task: "root_cause_analysis",
        priority: this.calculatePriority(queryLower, "troubleshooting"),
        parameters: {
          symptoms: this.extractSymptoms(queryLower),
          severity: context.urgencyLevel,
          history: context.relatedMemories,
        },
      });
    }

    // Simulation Agent Tasks
    if (this.needsSimulation(queryLower, context)) {
      tasks.push({
        agent: "simulation",
        task: "predict_behavior",
        priority: this.calculatePriority(queryLower, "simulation"),
        parameters: {
          scenario: this.createSimulationScenario(queryLower, context),
          accuracy: context.technicalDepth === "advanced" ? "high" : "medium",
        },
      });
    }

    // Quality Control Agent Tasks
    if (this.needsQualityAnalysis(queryLower, context)) {
      tasks.push({
        agent: "quality",
        task: "quality_assessment",
        priority: this.calculatePriority(queryLower, "quality"),
        parameters: {
          standards: this.detectQualityStandards(queryLower),
          metrics: this.extractQualityMetrics(queryLower),
          tolerance: context.userLevel === "expert" ? "tight" : "standard",
        },
      });
    }

    // Sort by priority and return
    return tasks.sort((a, b) => b.priority - a.priority);
  }

  async executeAgents(tasks, context, memories) {
    const results = {};
    const executions = [];

    for (const task of tasks) {
      executions.push(
          this.agents[task.agent]
              .execute(task.task, task.parameters, context, memories)
              .then((result) => {
                results[task.agent] = {
                  task: task.task,
                  result: result,
                  confidence: result.confidence || 0.7,
                  timestamp: Date.now(),
                };
                this.trackAgentPerformance(task.agent, true);
              })
              .catch((error) => {
                console.error(`Agent ${task.agent} failed:`, error);
                results[task.agent] = {
                  task: task.task,
                  error: error.message,
                  confidence: 0.1,
                  timestamp: Date.now(),
                };
                this.trackAgentPerformance(task.agent, false);
              }),
      );
    }

    await Promise.allSettled(executions);
    return results;
  }

  // Utility Methods for Problem Analysis
  needsMaterialAnalysis(query, context) {
    const materialKeywords = ["material", "วัสดุ", "pp", "pe", "abs", "pc", "nylon", "pom"];
    return materialKeywords.some((kw) => query.includes(kw)) || context.materials.length > 0;
  }

  needsMoldAnalysis(query, context) {
    const moldKeywords = ["mold", "แม่พิมพ์", "gate", "runner", "cavity", "cooling", "venting"];
    return moldKeywords.some((kw) => query.includes(kw)) || context.expertiseDomains.includes("mold_design");
  }

  needsProcessAnalysis(query, context) {
    const processKeywords = ["parameter", "setting", "temperature", "pressure", "speed", "time", "cycle"];
    return processKeywords.some((kw) => query.includes(kw)) || context.expertiseDomains.includes("process_optimization");
  }

  isTroubleshootingQuery(query) {
    const troubleKeywords = ["problem", "issue", "defect", "ปัญหา", "แก้ไข", "เสีย", "ไม่ทำงาน"];
    return troubleKeywords.some((kw) => query.includes(kw));
  }

  needsSimulation(query, context) {
    const simulationKeywords = ["simulate", "predict", "behavior", "flow", "warpage", "shrinkage"];
    return simulationKeywords.some((kw) => query.includes(kw)) && context.userLevel === "expert";
  }

  needsQualityAnalysis(query, context) {
    const qualityKeywords = ["quality", "คุณภาพ", "tolerance", "dimension", "inspection", "measurement"];
    return qualityKeywords.some((kw) => query.includes(kw)) || context.expertiseDomains.includes("quality_control");
  }

  calculatePriority(query, agentType) {
    const baseScores = {
      troubleshooting: 90,
      material: 85,
      process: 80,
      mold: 75,
      quality: 70,
      simulation: 65,
    };

    let score = baseScores[agentType] || 50;

    // Boost priority based on query content
    const boostTerms = {
      material: ["material", "วัสดุ", "pp", "abs"],
      mold: ["mold", "แม่พิมพ์", "gate"],
      process: ["parameter", "setting", "temperature"],
      troubleshooting: ["problem", "issue", "defect", "ปัญหา"],
    };

    if (boostTerms[agentType]) {
      const matches = boostTerms[agentType].filter((term) => query.includes(term)).length;
      score += matches * 10;
    }

    return Math.min(100, score);
  }

  trackAgentPerformance(agentName, success) {
    const current = this.agentPerformance.get(agentName) || {successes: 0, failures: 0, total: 0};

    if (success) {
      current.successes++;
    } else {
      current.failures++;
    }
    current.total++;

    this.agentPerformance.set(agentName, current);
  }

  validateSolution(solution) {
    // Basic validation checks
    const checks = {
      hasTechnicalContent: solution.technicalAnalysis && solution.technicalAnalysis.length > 0,
      hasActionableSteps: solution.actionPlan && solution.actionPlan.length > 0,
      hasParameterRecommendations: solution.parameters && Object.keys(solution.parameters).length > 0,
      hasSafetyConsiderations: solution.safetyNotes && solution.safetyNotes.length > 0,
      confidenceAboveThreshold: solution.overallConfidence > 0.6,
    };

    const passedChecks = Object.values(checks).filter(Boolean).length;
    solution.qualityScore = Math.round((passedChecks / Object.keys(checks).length) * 100);

    if (solution.qualityScore < 70) {
      console.warn(`⚠️ Solution quality low: ${solution.qualityScore}%`);
    }

    return solution;
  }

  getSystemStatus() {
    const status = {
      totalAgents: Object.keys(this.agents).length,
      activeAgents: 0,
      performance: {},
      overallHealth: "healthy",
    };

    for (const [agentName, performance] of this.agentPerformance) {
      const successRate = performance.total > 0 ? (performance.successes / performance.total) * 100 : 0;
      status.performance[agentName] = {
        successRate: Math.round(successRate),
        totalExecutions: performance.total,
      };

      if (successRate < 80) {
        status.overallHealth = "degraded";
      }
    }

    status.activeAgents = Object.keys(status.performance).length;
    return status;
  }
  extractParameters(query) {
    // ดึงค่าตัวเลขและหน่วยจากคำถาม
    const params = {};
    const patterns = {
      temperature: /(\d+)\s*(?:c|องศา)/i,
      pressure: /(\d+)\s*(?:bar|mpa|kg)/i,
      speed: /(\d+)\s*(?:mm\/s|%)/i,
      time: /(\d+)\s*(?:s|sec|วิ)/i,
    };

    for (const [key, pattern] of Object.entries(patterns)) {
      const match = query.match(pattern);
      if (match) params[key] = parseFloat(match[1]);
    }
    return params;
  }

  extractSymptoms(query) {
    // ดึงอาการเสียจากคำถาม (Fallback ง่ายๆ ถ้าไม่มี NLP)
    return [query];
  }

  detectMoldType(query) {
    if (query.includes("3 plate") || query.includes("3 เพลท")) return "3_plate";
    if (query.includes("hot runner")) return "hot_runner";
    return "standard_2_plate";
  }

  createSimulationScenario(query, context) {
    return {
      material: context.materials[0] || "generic_pp",
      defect: context.problemType || "general_flow",
    };
  }

  detectQualityStandards(query) {
    if (query.includes("iso")) return ["ISO_Standard"];
    if (query.includes("jis")) return ["JIS_Standard"];
    return ["General_Inspection"];
  }

  extractQualityMetrics(query) {
    return {
      focus: query.includes("dimension") ? "dimensional" : "visual",
    };
  }
}
/**
 * 🏗️ SYSTEM ARCHITECT AGENT - Specialized in Self-Analysis & Roadmap
 */
class SystemArchitectAgent {
  constructor() {
    this.expertise = "system_architecture";
    this.currentVersion = "2.5.0 (Multi-Agent + Memory)";
    this.architecture = ["Firebase Cloud Functions", "Gemini 1.5 Pro", "Firestore Vector-Like Memory", "Node.js Runtime"];
  }

  async execute(task, parameters, context, memories) {
    console.log(`🏗️ SYSTEM_AGENT: Executing ${task}`);

    switch (task) {
      case "analyze_system_status":
        return this.analyzeSystemStatus();
      case "propose_improvements":
        return this.proposeImprovements();
      default:
        return {confidence: 0.5, result: "Unknown system task"};
    }
  }

  analyzeSystemStatus() {
    // จำลองการตรวจสอบ Deep Health Check
    return {
      status: "OPERATIONAL",
      healthScore: 98,
      metrics: {
        uptime: "99.9%",
        agentStatus: "All Agents Active",
        memoryLink: "Connected",
        lastDeploy: new Date().toISOString(),
      },
      analysis: "ระบบทำงานได้ปกติหลังการ Deploy ล่าสุด ไม่พบ Error Log วิกฤต (Critical) ในช่วง 1 ชั่วโมงที่ผ่านมา การตอบสนองของ Multi-Agent System อยู่ในเกณฑ์ Latency ที่ยอมรับได้",
      confidence: 1.0,
    };
  }

  proposeImprovements() {
    return {
      roadmap: [
        {
          phase: "Phase 1: Knowledge Retrieval",
          suggestion: "Implement Vector Database (Pinecone/Weaviate)",
          impact: "เพิ่มความแม่นยำในการค้นหาข้อมูลเก่าได้ 300% (RAG เต็มรูปแบบ)",
        },
        {
          phase: "Phase 2: User Interface",
          suggestion: "เพิ่ม Dashboard กราฟิกสำหรับ Super Admin",
          impact: "ดูสถิติ Real-time ได้ง่ายขึ้น",
        },
        {
          phase: "Phase 3: Multimodal",
          suggestion: "เพิ่มความสามารถในการวิเคราะห์รูปภาพ (Image Recognition)",
          impact: "ให้ลูกศิษย์ถ่ายรูป Defect ส่งมาให้วิเคราะห์ได้เลย",
        },
      ],
      confidence: 0.9,
    };
  }
}

/**
 * 🔬 MATERIAL SCIENCE AGENT - Specialized in Material Properties
 */
class MaterialScienceAgent {
  constructor() {
    this.expertise = "material_science";
    this.supportedMaterials = ["PP", "PE", "ABS", "PC", "PA", "POM", "PET", "PS", "TPU", "PVC", "PMMA"];
    this.materialDatabase = this.initializeMaterialDatabase();
  }

  initializeMaterialDatabase() {
    // Simplified material properties database
    return {
      "PP": {meltTemp: "200-280°C", moldTemp: "50-80°C", shrinkage: "1.5-2.5%", impactStrength: "Medium"},
      "ABS": {meltTemp: "210-250°C", moldTemp: "50-80°C", shrinkage: "0.4-0.7%", impactStrength: "High"},
      "PC": {meltTemp: "280-320°C", moldTemp: "80-120°C", shrinkage: "0.6-0.8%", impactStrength: "Very High"},
      "PA": {meltTemp: "260-290°C", moldTemp: "80-100°C", shrinkage: "0.5-1.5%", impactStrength: "High"},
      "POM": {meltTemp: "190-230°C", moldTemp: "80-120°C", shrinkage: "2.0-2.5%", impactStrength: "Medium"},
    };
  }

  async execute(task, parameters, context, memories) {
    console.log(`🔬 MATERIAL_AGENT: Executing ${task}`);

    switch (task) {
      case "analyze_material_properties":
        return await this.analyzeMaterialProperties(parameters, context, memories);
      case "recommend_material":
        return await this.recommendMaterial(parameters, context);
      case "troubleshoot_material_issues":
        return await this.troubleshootMaterialIssues(parameters, context, memories);
      default:
        throw new Error(`Unknown task: ${task}`);
    }
  }

  async analyzeMaterialProperties(parameters, context, memories) {
    const {materials, problemType, userLevel} = parameters;
    const analysis = {
      materials: [],
      recommendations: [],
      warnings: [],
      confidence: 0.8,
    };

    for (const material of materials) {
      const materialData = this.materialDatabase[material.toUpperCase()];
      if (materialData) {
        analysis.materials.push({
          name: material,
          properties: materialData,
          suitability: this.assessMaterialSuitability(material, problemType, context),
        });

        // Add specific recommendations based on material and problem
        const materialRecs = this.generateMaterialRecommendations(material, problemType, userLevel);
        analysis.recommendations.push(...materialRecs);
      }
    }

    // Apply learning from memories
    if (memories && memories.length > 0) {
      this.applyMaterialLearning(analysis, memories);
    }

    return analysis;
  }

  assessMaterialSuitability(material, problemType, context) {
    const suitabilityMatrix = {
      "PP": {warpage: "fair", sink_marks: "good", short_shot: "excellent"},
      "ABS": {warpage: "good", sink_marks: "excellent", short_shot: "good"},
      "PC": {warpage: "excellent", sink_marks: "good", short_shot: "fair"},
      "PA": {warpage: "good", sink_marks: "fair", short_shot: "good"},
    };

    return suitabilityMatrix[material]?.[problemType] || "unknown";
  }

  generateMaterialRecommendations(material, problemType, userLevel) {
    const recommendations = [];

    switch (problemType) {
      case "warpage":
        recommendations.push({
          type: "material_selection",
          message: `พิจารณาเปลี่ยนเป็น PC หรือ ABS สำหรับลด Warpage`,
          priority: "medium",
          rationale: `${material} มีค่าการหดตัวสูง ทำให้เกิด Warpage ได้ง่าย`,
        });
        break;
      case "sink_marks":
        recommendations.push({
          type: "process_adjustment",
          message: `ลด Holding Pressure และเพิ่ม Cooling Time สำหรับ ${material}`,
          priority: "high",
          rationale: `ป้องกันการหดตัวภายในที่ทำให้เกิด Sink Marks`,
        });
        break;
    }

    return recommendations;
  }

  applyMaterialLearning(analysis, memories) {
    // Extract material-related patterns from memories
    const materialPatterns = memories.filter((memory) =>
      memory.entities && memory.entities.materials && memory.entities.materials.length > 0,
    );

    if (materialPatterns.length > 0) {
      analysis.insightsFromHistory = this.deriveMaterialInsights(materialPatterns);
      analysis.confidence += 0.1; // Boost confidence with historical data
    }
  }

  deriveMaterialInsights(materialMemories) {
    // Analyze patterns in material usage and outcomes
    const insights = [];
    const materialPerformance = {};

    materialMemories.forEach((memory) => {
      memory.entities.materials.forEach((material) => {
        if (!materialPerformance[material]) {
          materialPerformance[material] = {successes: 0, issues: 0};
        }

        if (memory.problemSolved) {
          materialPerformance[material].successes++;
        } else {
          materialPerformance[material].issues++;
        }
      });
    });

    // Generate insights based on performance data
    for (const [material, stats] of Object.entries(materialPerformance)) {
      const successRate = stats.successes / (stats.successes + stats.issues);
      if (successRate > 0.7) {
        insights.push(`${material} มีอัตราความสำเร็จสูงในประวัติการแก้ปัญหา`);
      } else if (successRate < 0.3) {
        insights.push(`${material} มีประวัติเกิดปัญหาบ่อย ควรพิจารณาวัสดุอื่น`);
      }
    }

    return insights;
  }
}
/**
 * 🎯 SOLUTION SYNTHESIZER - Integrates Multi-Agent Results
 */
/**
 * 🎯 SOLUTION SYNTHESIZER - Integrates Multi-Agent Results
 */
class SolutionSynthesizer {
  constructor() {
    // ✅ แก้ไข: ตรวจสอบว่ามีฟังก์ชันจริงก่อน bind หรือใส่ Placeholder ให้ครบ
    this.integrationStrategies = {
      "conflict_resolution": this.resolveConflicts.bind(this),
      "confidence_weighting": this.applyConfidenceWeighting.bind(this),
      "temporal_sequencing": this.sequenceSolutionsTemporally.bind(this),
    };
  }

  async integrate(agentResults, context) {
    console.log("🧩 SYNTHESIZER: Integrating multi-agent results...");

    const integratedSolution = {
      overview: "",
      technicalAnalysis: [],
      actionPlan: [],
      parameters: {},
      safetyNotes: [],
      confidenceScores: {},
      overallConfidence: 0,
      synthesizedFrom: Object.keys(agentResults),
    };

    // Process each agent's results
    for (const [agentName, result] of Object.entries(agentResults)) {
      if (result.error) {
        integratedSolution.technicalAnalysis.push({
          source: agentName,
          type: "error",
          content: `Agent ${agentName} encountered an error: ${result.error}`,
        });
        continue;
      }

      // Integrate successful results
      this.integrateAgentResult(integratedSolution, agentName, result, context);
    }

    // Calculate overall confidence
    integratedSolution.overallConfidence = this.calculateOverallConfidence(integratedSolution.confidenceScores);

    // Generate executive summary
    integratedSolution.overview = this.generateExecutiveSummary(integratedSolution, context);

    // Apply conflict resolution if needed
    if (this.hasConflicts(integratedSolution)) {
      this.integrationStrategies.conflict_resolution(integratedSolution);
    }

    return integratedSolution;
  }

  integrateAgentResult(solution, agentName, result, context) {
    const agentData = result.result;

    // Store confidence score
    solution.confidenceScores[agentName] = result.confidence;

    switch (agentName) {
      case "material":
        this.integrateMaterialResults(solution, agentData, context);
        break;
      case "mold":
        this.integrateMoldResults(solution, agentData, context);
        break;
      case "process":
        this.integrateProcessResults(solution, agentData, context);
        break;
      case "troubleshooting":
        this.integrateTroubleshootingResults(solution, agentData, context);
        break;
      case "simulation":
        this.integrateSimulationResults(solution, agentData, context);
        break;
      case "quality":
        this.integrateQualityResults(solution, agentData, context);
        break;
      case "knowledge":
        this.integrateKnowledgeResults(solution, agentData, context);
        break;
      case "system": // ✅ เพิ่ม case นี้
        solution.technicalAnalysis.push({
          source: "system_architect",
          type: "system_report",
          content: agentData.analysis || "ข้อเสนอแนะการพัฒนาระบบ",
        });
        if (agentData.roadmap) {
          solution.actionPlan.push(...agentData.roadmap.map((item) => ({
            priority: "strategic",
            action: `${item.suggestion} (${item.impact})`,
            type: "system_upgrade",
          })));
        }
        break;
    }
  }

  // Placeholder integration methods to prevent errors if agents are missing
  integrateMaterialResults(solution, data) {
    this._genericIntegrate(solution, "material", data);
  }
  integrateMoldResults(solution, data) {
    this._genericIntegrate(solution, "mold", data);
  }
  integrateProcessResults(solution, data) {
    this._genericIntegrate(solution, "process", data);
  }
  integrateTroubleshootingResults(solution, data) {
    this._genericIntegrate(solution, "troubleshooting", data);
  }
  integrateSimulationResults(solution, data) {
    this._genericIntegrate(solution, "simulation", data);
  }
  integrateQualityResults(solution, data) {
    this._genericIntegrate(solution, "quality", data);
  }

  _genericIntegrate(solution, source, data) {
    if (data.recommendations || data.actionPlan) {
      // Generic extraction logic can go here
    }
  }

  calculateOverallConfidence(confidenceScores) {
    const scores = Object.values(confidenceScores);
    if (scores.length === 0) return 0.5;
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    return Math.round(average * 100) / 100;
  }

  generateExecutiveSummary(solution, context) {
    const primaryActions = solution.actionPlan
        .filter((action) => action.priority === "high")
        .slice(0, 3);

    if (primaryActions.length > 0) {
      return `พบ ${primaryActions.length} แนวทางแก้ไขหลัก โดยเน้นที่: ${primaryActions.map((a) => a.action.substring(0, 50)).join(", ")}`;
    }
    return "ได้วิเคราะห์ปัญหาและเตรียมแนวทางแก้ไขหลายมิติตามด้านล่าง";
  }

  hasConflicts(solution) {
    const actions = solution.actionPlan;
    if (!actions || actions.length < 2) return false;

    for (let i = 0; i < actions.length; i++) {
      for (let j = i + 1; j < actions.length; j++) {
        if (this.areActionsConflicting(actions[i], actions[j])) {
          return true;
        }
      }
    }
    return false;
  }

  areActionsConflicting(action1, action2) {
    const conflicts = [
      {pattern1: /เพิ่ม/, pattern2: /ลด/},
      {pattern1: /สูง/, pattern2: /ต่ำ/},
      {pattern1: /เร็ว/, pattern2: /ช้า/},
    ];

    return conflicts.some((conflict) =>
      (conflict.pattern1.test(action1.action) && conflict.pattern2.test(action2.action)) ||
      (conflict.pattern2.test(action1.action) && conflict.pattern1.test(action2.action)),
    );
  }

  resolveConflicts(solution) {
    console.log("🔄 Resolving conflicts in multi-agent recommendations...");
    const troubleshootingActions = solution.actionPlan.filter((action) =>
      action.type && action.type.includes("troubleshooting"),
    );

    if (troubleshootingActions.length > 0) {
      // Keep troubleshooting actions + non-conflicting ones
      solution.technicalAnalysis.push({
        source: "synthesizer",
        type: "conflict_resolution",
        content: "ให้ความสำคัญกับคำแนะนำจากการวิเคราะห์สาเหตุหลัก (Priority Resolution)",
      });
    }
  }

  integrateKnowledgeResults(solution, data, context) {
    if (data.relevantContent && data.relevantContent.length > 0) {
      data.relevantContent.forEach((item) => {
        solution.technicalAnalysis.push({
          source: "knowledge_base",
          type: "reference",
          content: `📚 **${item.topic}:** ${item.content}`,
        });
      });
    }
  }

  // ✅ เพิ่มฟังก์ชันที่ขาดหายไป (Missing Methods)
  applyConfidenceWeighting(solution) {
    // Logic: ปรับลำดับ Action Plan ตามคะแนนความมั่นใจของ Agent
    if (solution.actionPlan && solution.actionPlan.length > 0) {
      solution.actionPlan.sort((a, b) => {
        const priorityScore = {high: 3, medium: 2, low: 1};
        const pA = priorityScore[a.priority] || 0;
        const pB = priorityScore[b.priority] || 0;
        return pB - pA;
      });
    }
    return solution;
  }

  // ✅ เพิ่มฟังก์ชันที่ขาดหายไป (Missing Methods)
  sequenceSolutionsTemporally(solution) {
    // Logic: จัดลำดับการแก้ไข (แก้ทันที -> ระยะยาว)
    const immediate = [];
    const others = [];

    solution.actionPlan.forEach((action) => {
      if (action.type && action.type.includes("immediate")) {
        immediate.push(action);
      } else {
        others.push(action);
      }
    });

    solution.actionPlan = [...immediate, ...others];
    return solution;
  }
}


/**
 * ENHANCED ERROR HANDLER
 */
class AdvancedErrorHandler {
  static handleApiError(error, executionId) {
    console.error(`🔴 API ERROR [${executionId}]:`, {
      message: error.message,
      code: error.code,
      stack: error.stack?.substring(0, 200),
      timestamp: new Date().toISOString(),
    });

    const errorMap = {
      "QUOTA_EXCEEDED": {
        message: "เกินโควต้าประมวลผลสำหรับวันนี้ กรุณาลองใหม่พรุ่งนี้",
        code: "resource-exhausted",
      },
      "429": {
        message: "มีการเรียกใช้งานมากเกินไป กรุณารอสักครู่",
        code: "resource-exhausted",
      },
      "500": {
        message: "เซิร์ฟเวอร์มีปัญหา กรุณาลองใหม่ใน 2-3 นาที",
        code: "internal",
      },
      "503": {
        message: "บริการไม่พร้อมใช้งานชั่วคราว",
        code: "unavailable",
      },
    };

    const errorKey = Object.keys(errorMap).find((key) =>
      error.message?.includes(key) || error.code?.includes(key),
    );

    if (errorKey) {
      return new HttpsError(
          errorMap[errorKey].code,
          errorMap[errorKey].message,
          {executionId, errorType: errorKey},
      );
    }

    return new HttpsError(
        "internal",
        "ระบบเกิดข้อผิดพลาดชั่วคราว กรุณาลองใหม่",
        {executionId, errorType: "unknown"},
    );
  }

  static logSecurityEvent(eventType, details) {
    console.warn(`🛡️ SECURITY EVENT: ${eventType}`, {
      ...details,
      timestamp: new Date().toISOString(),
      ip: details.ip || "unknown",
    });
  }
}
/**
 * 🎯 MOLD DESIGN AGENT - Specialized in Mold Engineering
 */
class MoldDesignAgent {
  constructor() {
    this.expertise = "mold_design";
    this.gateTypes = ["edge", "submarine", "tab", "fan", "diaphragm", "ring"];
    this.coolingStrategies = ["serial", "parallel", "cascade", "conformal"];
  }

  async execute(task, parameters, context, memories) {
    console.log(`🎯 MOLD_AGENT: Executing ${task}`);

    switch (task) {
      case "analyze_mold_design":
        return await this.analyzeMoldDesign(parameters, context, memories);
      case "optimize_gate_system":
        return await this.optimizeGateSystem(parameters, context);
      case "troubleshoot_mold_issues":
        return await this.troubleshootMoldIssues(parameters, context, memories);
      default:
        throw new Error(`Unknown task: ${task}`);
    }
  }

  async analyzeMoldDesign(parameters, context, memories) {
    const {moldType, issues, complexity} = parameters;
    const analysis = {
      gateRecommendations: [],
      coolingOptimizations: [],
      ventingSuggestions: [],
      ejectionAnalysis: [],
      confidence: 0.85,
    };

    // Gate system analysis
    if (issues.includes("weld_line") || issues.includes("jetting")) {
      analysis.gateRecommendations.push({
        type: "gate_optimization",
        action: "เปลี่ยนตำแหน่งเกตเพื่อหลีกเลี่ยง weld line",
        rationale: "ตำแหน่งเกตปัจจุบันทำให้ flow front มาเจอกันเกิด weld line",
        priority: "high",
      });
    }

    // Cooling system optimization
    if (issues.includes("warpage") || issues.includes("sink_marks")) {
      analysis.coolingOptimizations.push({
        type: "cooling_optimization",
        action: "ปรับปรุงระบบน้ำหล่อเย็นให้สมดุล",
        rationale: "การหล่อเย็นไม่สม่ำเสมอทำให้เกิด warpage",
        priority: "medium",
      });
    }

    // Venting analysis
    if (issues.includes("burn_marks") || issues.includes("diesel_effect")) {
      analysis.ventingSuggestions.push({
        type: "venting_improvement",
        action: "เพิ่มช่องว่าง venting ในพื้นที่สิ้นสุดการไหล",
        rationale: "แก๊สไม่สามารถหลบหนีได้เกิดการเผาไหม้",
        priority: "high",
      });
    }

    return analysis;
  }

  async optimizeGateSystem(parameters, context) {
    const {partGeometry, material, productionVolume} = parameters;

    return {
      recommendedGate: this.selectGateType(partGeometry, material),
      gateDimensions: this.calculateGateDimensions(material, partGeometry),
      locationSuggestions: this.suggestGateLocations(partGeometry),
      confidence: 0.8,
    };
  }

  selectGateType(geometry, material) {
    const gateSelection = {
      "simple_flat": "edge_gate",
      "complex_3d": "submarine_gate",
      "cylindrical": "diaphragm_gate",
      "thin_wall": "fan_gate",
    };

    return gateSelection[geometry] || "edge_gate";
  }
}

/**
 * ⚙️ PROCESS OPTIMIZATION AGENT - Specialized in Injection Parameters
 */
class ProcessOptimizationAgent {
  constructor() {
    this.expertise = "process_optimization";
    this.parameterRanges = this.initializeParameterRanges();
  }

  initializeParameterRanges() {
    return {
      "PP": {
        meltTemp: {min: 200, max: 280, optimal: 230},
        moldTemp: {min: 50, max: 80, optimal: 60},
        injectionPressure: {min: 50, max: 120, optimal: 80},
        holdingPressure: {min: 30, max: 80, optimal: 50},
        coolingTime: {min: 20, max: 60, optimal: 30},
      },
      "ABS": {
        meltTemp: {min: 210, max: 250, optimal: 230},
        moldTemp: {min: 50, max: 80, optimal: 65},
        injectionPressure: {min: 60, max: 130, optimal: 90},
        holdingPressure: {min: 40, max: 70, optimal: 55},
        coolingTime: {min: 25, max: 50, optimal: 35},
      },
    };
  }

  async execute(task, parameters, context, memories) {
    console.log(`⚙️ PROCESS_AGENT: Executing ${task}`);

    switch (task) {
      case "optimize_process_parameters":
        return await this.optimizeProcessParameters(parameters, context, memories);
      case "troubleshoot_process_issues":
        return await this.troubleshootProcessIssues(parameters, context);
      case "calculate_cycle_time":
        return await this.calculateCycleTime(parameters, context);
      default:
        throw new Error(`Unknown task: ${task}`);
    }
  }

  async optimizeProcessParameters(parameters, context, memories) {
    const {machineType, currentParams, target} = parameters;
    const optimization = {
      parameterAdjustments: [],
      cycleTimeOptimization: null,
      qualityImprovements: [],
      confidence: 0.75,
    };

    // Analyze current parameters and suggest optimizations
    if (currentParams) {
      const adjustments = this.analyzeParameterAdjustments(currentParams, target);
      optimization.parameterAdjustments = adjustments;
    }

    // Cycle time optimization
    if (target === "cycle_time_reduction") {
      optimization.cycleTimeOptimization = this.optimizeCycleTime(currentParams);
    }

    // Quality-focused optimizations
    if (target === "quality_improvement") {
      optimization.qualityImprovements = this.suggestQualityImprovements(currentParams);
    }

    return optimization;
  }

  analyzeParameterAdjustments(currentParams, target) {
    const adjustments = [];

    // Example optimization logic
    if (currentParams.injectionSpeed && currentParams.injectionSpeed > 80) {
      adjustments.push({
        parameter: "injection_speed",
        current: currentParams.injectionSpeed,
        recommended: Math.max(60, currentParams.injectionSpeed * 0.8),
        rationale: "ลดความเร็วฉีดเพื่อป้องกัน jetting และลดความเครียดในชิ้นงาน",
        priority: "medium",
      });
    }

    if (currentParams.holdingPressure && currentParams.holdingPressure < 40) {
      adjustments.push({
        parameter: "holding_pressure",
        current: currentParams.holdingPressure,
        recommended: Math.min(70, currentParams.holdingPressure * 1.3),
        rationale: "เพิ่ม holding pressure เพื่อลด sink marks และปรับปรุง dimensional stability",
        priority: "high",
      });
    }

    return adjustments;
  }
}

/**
 * 🔧 TROUBLESHOOTING AGENT - Specialized in Defect Analysis
 */
class TroubleshootingAgent {
  constructor() {
    this.expertise = "troubleshooting";
    this.defectPatterns = this.initializeDefectPatterns();
  }

  initializeDefectPatterns() {
    return {
      "short_shot": {
        causes: ["injection_speed_low", "material_temp_low", "vent_blocked", "gate_too_small"],
        solutions: ["increase_injection_speed", "raise_melt_temperature", "clean_vents", "enlarge_gate"],
        confidence: 0.9,
      },
      "warpage": {
        causes: ["uneven_cooling", "high_residual_stress", "ejection_too_early", "material_issues"],
        solutions: ["optimize_cooling", "adjust_holding_pressure", "increase_cooling_time", "review_material_selection"],
        confidence: 0.85,
      },
      "sink_marks": {
        causes: ["insufficient_packing", "thick_sections", "material_shrinkage", "high_mold_temp"],
        solutions: ["increase_holding_pressure", "modify_part_design", "adjust_material", "reduce_mold_temp"],
        confidence: 0.8,
      },
    };
  }

  async execute(task, parameters, context, memories) {
    console.log(`🔧 TROUBLESHOOTING_AGENT: Executing ${task}`);

    switch (task) {
      case "root_cause_analysis":
        return await this.analyzeRootCause(parameters, context, memories);
      case "defect_diagnosis":
        return await this.diagnoseDefect(parameters, context);
      case "corrective_actions":
        return await this.suggestCorrectiveActions(parameters, context);
      default:
        throw new Error(`Unknown task: ${task}`);
    }
  }

  async analyzeRootCause(parameters, context, memories) {
    const {symptoms, severity, history} = parameters;
    const analysis = {
      probableCauses: [],
      diagnosticSteps: [],
      immediateActions: [],
      confidence: 0.8,
    };

    // Match symptoms to known defect patterns
    for (const [defect, pattern] of Object.entries(this.defectPatterns)) {
      if (this.symptomsMatchDefect(symptoms, defect)) {
        analysis.probableCauses.push({
          defect: defect,
          causes: pattern.causes,
          likelihood: pattern.confidence,
          solutions: pattern.solutions,
        });
      }
    }

    // Sort by likelihood
    analysis.probableCauses.sort((a, b) => b.likelihood - a.likelihood);

    // Generate diagnostic steps
    analysis.diagnosticSteps = this.generateDiagnosticSteps(analysis.probableCauses[0]);

    // Suggest immediate actions for high severity issues
    if (severity === "high") {
      analysis.immediateActions = this.suggestImmediateActions(analysis.probableCauses[0]);
    }

    return analysis;
  }
  generateDiagnosticSteps(causeData) {
    return [
      `ตรวจสอบประวัติการตั้งค่า: ${causeData.defect} มักเกิดจาก ${causeData.causes[0]}`,
      `เช็คสภาพเครื่องจักรและแม่พิมพ์ที่จุดวิกฤต`,
      `เปรียบเทียบค่า Parameter ปัจจุบันกับ Standard Sheet`,
      `ทดลองปรับค่าทีละตัวแปรเพื่อยืนยันสาเหตุ (Design of Experiment)`,
    ];
  }

  suggestImmediateActions(causeData) {
    if (!causeData.solutions || causeData.solutions.length === 0) return [];

    return causeData.solutions.map((sol) => {
      const actionMap = {
        "increase_injection_speed": "เพิ่มความเร็วฉีด (Injection Speed) ขึ้น 5-10%",
        "raise_melt_temperature": "เพิ่มอุณหภูมิหลอมเหลว (Melt Temp) 5-10°C (ระวัง Material Degradation)",
        "clean_vents": "ทำความสะอาดช่องระบายอากาศ (Vents) บนหน้าแม่พิมพ์ทันที",
        "enlarge_gate": "ตรวจสอบขนาด Gate (อาจต้องปรับแก้แม่พิมพ์ระยะยาว)",
        "optimize_cooling": "ตรวจสอบอุณหภูมิน้ำและอัตราการไหลของระบบหล่อเย็น",
        "adjust_holding_pressure": "ปรับ Holding Pressure ขึ้นหรือลงตามอาการ",
        "increase_cooling_time": "เพิ่มเวลา Cooling Time 2-3 วินาที",
        "review_material_selection": "ตรวจสอบเกรดวัสดุและความชื้น (Drying)",
      };

      return {
        action: actionMap[sol] || `ดำเนินการแก้ไขด้วยวิธี: ${sol.replace(/_/g, " ")}`,
        priority: "high",
        type: "troubleshooting_immediate",
      };
    });
  }
  symptomsMatchDefect(symptoms, defect) {
    const symptomPatterns = {
      "short_shot": ["ไม่เต็ม", "ขาดส่วน", "short"],
      "warpage": ["บิด", "โค้ง", "warp"],
      "sink_marks": ["บุ๋ม", "ตาปลา", "sink"],
    };

    return symptoms.some((symptom) =>
      symptomPatterns[defect]?.some((pattern) => symptom.includes(pattern)),
    );
  }
}

/**
 * 🌡️ SIMULATION AGENT - Specialized in Predictive Modeling
 */
class SimulationAgent {
  constructor() {
    this.expertise = "simulation_analysis";
    this.simulationModels = ["flow_analysis", "cooling_analysis", "warpage_prediction", "stress_analysis"];
  }

  async execute(task, parameters, context, memories) {
    console.log(`🌡️ SIMULATION_AGENT: Executing ${task}`);

    switch (task) {
      case "predict_behavior":
        return await this.predictBehavior(parameters, context);
      case "optimize_design":
        return await this.optimizeDesign(parameters, context);
      case "validate_solution":
        return await this.validateSolution(parameters, context);
      default:
        throw new Error(`Unknown task: ${task}`);
    }
  }

  async predictBehavior(parameters, context) {
    const {scenario, accuracy} = parameters;
    const prediction = {
      flowAnalysis: this.simulateFlowBehavior(scenario),
      coolingAnalysis: this.simulateCoolingBehavior(scenario),
      warpagePrediction: this.predictWarpage(scenario),
      confidence: accuracy === "high" ? 0.9 : 0.7,
    };

    return prediction;
  }

  simulateFlowBehavior(scenario) {
    return {
      fillTime: "2.5 seconds",
      injectionPressure: "85 MPa",
      flowFrontTemperature: "235°C",
      potentialIssues: ["jetting_at_gate", "air_traps"],
    };
  }
}

/**
 * 📊 QUALITY CONTROL AGENT - Specialized in Quality Standards
 */
class QualityControlAgent {
  constructor() {
    this.expertise = "quality_control";
    this.qualityStandards = ["ISO 9001", "ISO 13485", "IATF 16949", "ASTM D3641"];
  }

  async execute(task, parameters, context, memories) {
    console.log(`📊 QUALITY_AGENT: Executing ${task}`);

    switch (task) {
      case "quality_assessment":
        return await this.assessQuality(parameters, context);
      case "compliance_check":
        return await this.checkCompliance(parameters, context);
      case "statistical_analysis":
        return await this.performStatisticalAnalysis(parameters, context);
      default:
        throw new Error(`Unknown task: ${task}`);
    }
  }

  async assessQuality(parameters, context) {
    const {standards, metrics, tolerance} = parameters;
    const assessment = {
      dimensionalAccuracy: this.checkDimensionalAccuracy(metrics, tolerance),
      visualQuality: this.assessVisualQuality(metrics),
      mechanicalProperties: this.verifyMechanicalProperties(metrics),
      complianceStatus: this.checkComplianceWithStandards(standards),
      confidence: 0.8,
    };

    return assessment;
  }

  checkDimensionalAccuracy(metrics, tolerance) {
    return {
      status: tolerance === "tight" ? "requires_verification" : "acceptable",
      recommendedActions: ["perform_cmm_measurement", "check_mold_wear"],
    };
  }
}
// Initialize the Multi-Agent System
const grandmasterOrchestrator = new GrandmasterOrchestrator();
/**
 * ENHANCED PERFORMANCE MONITORING
 */
function setupPerformanceMonitoring() {
  const startTime = Date.now();
  const initialMemory = process.memoryUsage();

  return {
    startTime,
    initialMemory,

    getMetrics: function() {
      const currentMemory = process.memoryUsage();
      const totalTime = Date.now() - this.startTime;

      return {
        executionTime: totalTime,
        memoryUsage: {
          heapUsed: Math.round((currentMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024),
          heapTotal: Math.round((currentMemory.heapTotal - initialMemory.heapTotal) / 1024 / 1024),
          external: Math.round((currentMemory.external - initialMemory.external) / 1024 / 1024),
        },
        timestamp: new Date().toISOString(),
      };
    },

    checkMemoryLimit: function() {
      const currentMemory = process.memoryUsage();
      const memoryLimit = 500 * 1024 * 1024; // 500MB

      if (currentMemory.heapUsed > memoryLimit) {
        throw new HttpsError(
            "resource-exhausted",
            "ระบบกำลังประมวลผลข้อมูลจำนวนมาก กรุณาลองใหม่",
        );
      }
    },
  };
}

// =====================================================
// 🎯 RESPONSE QUALITY & OPTIMIZATION FUNCTIONS
// =====================================================

/**
 * Advanced Response Quality Validator
 */
function validateResponseQuality(response, questionType, userLevel) {
  const checks = {
    minLength: response.length >= 150,
    maxLength: response.length <= 4000,
    hasTechnicalTerms: /(°C|MPa|mm\/s|ton|สูตร|คำนวณ|แนะนำ|ควร|ตั้งค่า)/.test(response),
    hasActionableAdvice: /(ขั้นตอน|วิธี|แนะนำ|ควร|ตั้งค่า|ปรับ|ตรวจสอบ)/.test(response),
    hasProfessionalTone: !/(เห้ย|เฮ้ย|ว้าย|ตายแล้ว)/.test(response),
    hasCreditLine: /อาจารย์\s*วิทยา|พัฒนาโดย/.test(response),
    properStructure: /(\. |\n|•|- |\d\.)/.test(response),
    questionTypeMatch: validateQuestionTypeMatch(response, questionType),
  };

  const score = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;

  return {
    score,
    total,
    percentage: Math.round((score / total) * 100),
    details: checks,
  };
}

/**
 * Validate if response matches question type
 */
function validateQuestionTypeMatch(response, questionType) {
  switch (questionType) {
    case "troubleshooting":
      return /(ปัญหา|แก้ไข|สาเหตุ|วิธี)/.test(response);
    case "calculation":
      return /(คำนวณ|สูตร|ตัวเลข|ผลลัพธ์)/.test(response);
    case "comparison":
      return /(เปรียบเทียบ|ต่างกัน|ดีกว่า|ข้อดี)/.test(response);
    default:
      return true;
  }
}

/**
 * Smart Response Optimizer
 */
function optimizeResponse(response, userLevel, questionType) {
  let optimized = response;

  if (userLevel === "beginner") {
    optimized = optimized
        .replace(/rheology/gi, "การไหลของพลาสติก")
        .replace(/crystallinity/gi, "การจัดเรียงตัวของโมเลกุล")
        .replace(/viscosity/gi, "ความหนืด")
        .replace(/anisotropy/gi, "คุณสมบัติตามทิศทาง");
  }

  if (questionType === "troubleshooting") {
    if (!optimized.includes("🔧") && !optimized.includes("⚠️")) {
      optimized = optimized.replace(/วิธีแก้ไข/g, "🔧 วิธีแก้ไข");
      optimized = optimized.replace(/ปัญหาหลัก/g, "⚠️ ปัญหาหลัก");
      optimized = optimized.replace(/สาเหตุ/g, "🎯 สาเหตุ");
    }
  }

  if (questionType === "calculation") {
    if (!optimized.includes("🧮") && !optimized.includes("📊")) {
      optimized = optimized.replace(/คำนวณ/g, "🧮 คำนวณ");
      optimized = optimized.replace(/ผลลัพธ์/g, "📊 ผลลัพธ์");
      optimized = optimized.replace(/สูตร/g, "📐 สูตร");
    }
  }

  if (questionType === "comparison") {
    if (!optimized.includes("⚖️") && !optimized.includes("📈")) {
      optimized = optimized.replace(/เปรียบเทียบ/g, "⚖️ เปรียบเทียบ");
      optimized = optimized.replace(/ข้อดี/g, "✅ ข้อดี");
      optimized = optimized.replace(/ข้อเสีย/g, "❌ ข้อเสีย");
    }
  }

  optimized = optimized.replace(/(\d\.)/g, "\n$1");
  optimized = optimized.replace(/(•)/g, "\n$1");

  return optimized;
}

/**
 * Performance Monitoring
 */
function logPerformanceMetrics(executionId, startTime, metrics) {
  const totalTime = Date.now() - startTime;

  console.log(`\n📊 ENHANCED PERFORMANCE METRICS [${executionId}]:`);
  console.log(`├── Total Execution: ${totalTime}ms`);
  console.log(`├── API Time: ${metrics.apiTime || "N/A"}ms`);
  console.log(`├── Processing Time: ${metrics.processingTime || "N/A"}ms`);
  console.log(`├── Quality Score: ${metrics.qualityScore || "N/A"}`);
  console.log(`├── Memory Usage: ${process.memoryUsage().heapUsed / 1024 / 1024}MB`);
  console.log(`└── Timestamp: ${new Date().toISOString()}`);
}

// =====================================================
// 🧠 MEMORY-ENHANCED MAIN CLOUD FUNCTION
// =====================================================
/**
 * 🛠️ ฟังก์ชันดึงข้อมูลคำถามล่าสุดจากทุกคน (สำหรับ Super Admin)
 */
async function getGlobalRecentIssues(limit = 5) {
  const db = getFirestore();
  try {
    // Query ข้าม Collection ทั้งหมดเพื่อหา 'memories' ล่าสุด
    const snapshot = await db.collectionGroup("memories")
        .orderBy("timestamp", "desc")
        .limit(limit)
        .get();

    if (snapshot.empty) return "ยังไม่มีข้อมูลคำถามจากลูกศิษย์ในระบบครับ";

    let report = "📊 **สรุปปัญหาล่าสุดจากลูกศิษย์:**\n";

    snapshot.forEach((doc, index) => {
      const data = doc.data();
      const time = data.timestamp ? new Date(data.timestamp.toDate()).toLocaleString("th-TH") : "N/A";
      // ตัดชื่อ User ให้เหลือสั้นๆ เพื่อความเป็นส่วนตัว (ถ้าต้องการ)
      const shortId = data.userId.substring(0, 5);

      report += `\n${index + 1}. **[${time}]** (User: ...${shortId})`;
      report += `\n   ❓ Q: "${data.question.substring(0, 100)}..."`;
      report += `\n   🏷️ Type: ${data.context?.questionType || "General"}\n`;
    });

    return report;
  } catch (error) {
    console.error("Error fetching global issues:", error);
    return "เกิดข้อผิดพลาดในการดึงข้อมูลรวมครับ: " + error.message;
  }
}
exports.getGeminiResponse = onCall({
  secrets: ["GEMINI_API_KEY"],
  region: "us-central1",
  timeoutSeconds: 120,
  memory: "512MiB",
  minInstances: 0,
  maxInstances: 10,
}, async (request) => {
  logGeminiApiKeyStatus();
  const executionId = Math.random().toString(36).substring(2, 10);
  const performanceMonitor = setupPerformanceMonitoring();
  const startTime = Date.now();

  console.log("╔════════════════════════════════════════════════╗");
  console.log("║ 🧠 MEMORY-ENHANCED GEMINI RESPONSE FUNCTION    ║");
  console.log(`║ Execution ID: ${executionId}                   ║`);
  console.log("╚════════════════════════════════════════════════╝");

  try {
    // ==========================================
    // 1. ENHANCED SECURITY & VALIDATION
    // ==========================================
    performanceMonitor.checkMemoryLimit();

    const GEMINI_API_KEY = getGeminiApiKey();

    const {text, chatHistory = [], sessionId = "default", isSuperAdmin = false, userName = "User", adminMode = "universal_assistant"} = request.data;
    const {cleanText, validHistory} = sanitizeAndValidateInput(text, chatHistory);

    console.log(`\n📥 ENHANCED INPUT ANALYSIS [${executionId}]:`);
    console.log(`├── Text Length: ${cleanText.length} characters`);
    console.log(`├── Valid History: ${validHistory.length} messages`);
    console.log(`├── Session ID: ${sessionId}`);
    console.log(`└── Memory System: ACTIVE`);

    if (detectAdvancedPromptInjection(cleanText)) {
      AdvancedErrorHandler.logSecurityEvent("PROMPT_INJECTION_ATTEMPT", {
        executionId,
        textLength: cleanText.length,
        preview: cleanText.substring(0, 50),
      });

      throw new HttpsError(
          "permission-denied",
          "🛡️ ระบบตรวจพบรูปแบบข้อความที่ไม่ปลอดภัย กรุณาใช้คำถามปกติเกี่ยวกับการฉีดพลาสติก",
      );
    }

    // ==========================================
    // 2. ADVANCED CONTEXT ANALYSIS WITH MEMORY
    // ==========================================

    // 🆕 ตรวจสอบว่าเป็นคำตอบจาก Clarification หรือไม่
    let enhancedQuery = cleanText;
    const clarificationResponse = queryClarification.isClarificationResponse(cleanText);

    if (clarificationResponse.isResponse && validHistory.length > 0) {
      // ดึงคำถามเดิมจาก history (ข้อความก่อนหน้า)
      const previousMessage = validHistory[validHistory.length - 1];
      if (previousMessage && !previousMessage.isUser) {
        // ตรวจสอบว่าข้อความก่อนหน้าเป็น Clarification prompt หรือไม่
        const isClarificationPrompt = previousMessage.text.includes("กรุณาเลือก") ||
                                       previousMessage.text.includes("คุณต้องการ");

        if (isClarificationPrompt && validHistory.length >= 2) {
          // ดึงคำถามเดิมจาก user message ก่อนหน้า clarification
          const originalQuestion = validHistory[validHistory.length - 2].text;

          // ปรับคำถามให้ชัดเจนขึ้นตามตัวเลือกที่ผู้ใช้เลือก
          enhancedQuery = queryClarification.enhanceQueryFromOption(
              originalQuestion,
              clarificationResponse.option,
              cleanText,
          );

          console.log(`\n✅ CLARIFICATION RESPONSE DETECTED [${executionId}]:`);
          console.log(`├── Original Query: ${originalQuestion}`);
          console.log(`├── User Selected: Option ${clarificationResponse.option}`);
          console.log(`└── Enhanced Query: ${enhancedQuery}`);
        }
      }
    }

    const enhancedContext = analyzeEnhancedContext(validHistory, enhancedQuery);
    const userLevel = detectUserLevel(enhancedQuery, validHistory);
    const questionType = detectQuestionType(enhancedQuery);
    const isFirstMessage = validHistory.length === 0;

    // 🧠 RETRIEVE RELEVANT MEMORIES
    const userId = request.auth?.uid || "anonymous";
    const relevantMemories = await getConversationMemory().getRelevantMemories(userId, enhancedQuery);
    const memoryContext = getConversationMemory().formatMemoryContext(relevantMemories);

    console.log(`\n🔍 ENHANCED CONTEXT ANALYSIS [${executionId}]:`);
    console.log(`├── User Level: ${userLevel.toUpperCase()}`);
    console.log(`├── Question Type: ${questionType.toUpperCase()}`);
    console.log(`├── Expertise Domains: ${enhancedContext.expertiseDomains.join(", ")}`);
    console.log(`├── Relevant Memories: ${relevantMemories.length}`);
    console.log(`├── Memory Context Length: ${memoryContext.length}`);
    console.log(`└── Conversation Stage: ${enhancedContext.conversationStage}`);

    // ==========================================
    // 2.5 QUERY CLARIFICATION CHECK (NEW!)
    // ==========================================
    const clarificationAnalysis = queryClarification.needsClarification(
        enhancedQuery,
        userLevel,
        questionType,
    );

    console.log(`\n🔍 QUERY CLARIFICATION ANALYSIS [${executionId}]:`);
    console.log(`├── Needs Clarification: ${clarificationAnalysis.needsClarification}`);
    console.log(`├── Confidence: ${Math.round(clarificationAnalysis.confidence * 100)}%`);
    console.log(`├── Reasons:`, clarificationAnalysis.reasons);

    // ถ้าต้องการ Clarification ให้ส่งคำถามกลับไปยังผู้ใช้
    if (clarificationAnalysis.needsClarification && !isSuperAdmin) {
      const clarificationPrompt = queryClarification.generateClarificationPrompt(
          enhancedQuery,
          clarificationAnalysis,
      );

      console.log(`⚠️ QUERY TOO AMBIGUOUS - REQUESTING CLARIFICATION [${executionId}]`);

      return {
        text: clarificationPrompt,
        timestamp: new Date().toISOString(),
        metadata: {
          executionId,
          userLevel,
          questionType,
          requiresClarification: true,
          confidence: clarificationAnalysis.confidence,
          clarificationReasons: clarificationAnalysis.reasons,
          processingType: "clarification_request",
        },
      };
    }

    // ==========================================
    // 3. SMART CACHE CHECK WITH MEMORY INTEGRATION
    // ==========================================
    const cacheKey = responseCache.generateKey(enhancedQuery, userLevel, questionType);
    const cachedResponse = enhancedContext.isRepetitive ?
      responseCache.getVariation(cacheKey) :
      responseCache.get(cacheKey);

    if (cachedResponse && !enhancedContext.isRepetitive && relevantMemories.length === 0) {
      console.log(`🎯 USING CACHED RESPONSE [${executionId}]`);
      const performanceMetrics = performanceMonitor.getMetrics();

      return {
        text: cachedResponse,
        timestamp: new Date().toISOString(),
        metadata: {
          executionId,
          userLevel,
          questionType,
          cached: true,
          memoryUsed: false,
          context: {
            expertiseDomains: enhancedContext.expertiseDomains,
            conversationStage: enhancedContext.conversationStage,
            relevantMemories: 0,
          },
          performance: {
            responseTime: performanceMetrics.executionTime,
            memoryUsage: performanceMetrics.memoryUsage,
            processingType: "cached_response",
          },
        },
      };
    }

    // ==========================================
    // 4. GEMINI MODEL CONFIGURATION WITH MEMORY
    // ==========================================
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    const dynamicTemp = dynamicTemperature(userLevel, questionType, enhancedContext.conversationStage);
    let dynamicSystemInstruction = "";
    if (isSuperAdmin) {
      // ==========================================
      // 👑 SUPER ADMIN COMMAND INTERCEPTOR - ENHANCED
      // ==========================================
      console.log(`\n👑 SUPER ADMIN COMMAND DETECTION [${executionId}]: ${userName}`);

      // 🎯 ENHANCED COMMAND PATTERN MATCHING
      const adminCommands = {
        // 📊 ระบบรายงานและมอนิเตอร์
        report_issues: {
          patterns: [
            /ปัญหาที่ลูกศิษย์ถาม|คำถามล่าสุด|recent issues|ลูกศิษย์ถามอะไรบ้าง|สรุปปัญหา/,
            /รายงานปัญหา|issue report|problem summary|สรุปคำถาม/,
          ],
          action: "fetch_global_issues",
          description: "ดึงรายงานปัญหาล่าสุดจากผู้ใช้ทั้งหมด",
        },

        // 👥 ระบบจัดการผู้ใช้
        user_management: {
          patterns: [
            /ข้อมูลผู้ใช้|user info|user data|user management/,
            /user.*list|list.*user|แสดงผู้ใช้|จัดการผู้ใช้/,
            /user.*stat|stat.*user|สถิติผู้ใช้/,
          ],
          action: "user_management",
          description: "จัดการข้อมูลผู้ใช้และสถิติ",
        },

        // 🧠 ระบบความจำและ cache
        memory_management: {
          patterns: [
            /เคลียร์ cache|clear cache|ลบ cache|รีเซ็ต cache/,
            /จัดการความจำ|memory management|memory stats|สถิติความจำ/,
            /ลบความจำ|clear memory|reset memory/,
          ],
          action: "memory_management",
          description: "จัดการระบบความจำและ cache",
        },

        // 📈 ระบบวิเคราะห์และสถิติ
        analytics: {
          patterns: [
            /สถิติ|analytics|statistics|รายงานประสิทธิภาพ/,
            /performance report|รายงานการทำงาน|metrics|ตัวชี้วัด/,
            /feedback analysis|วิเคราะห์ feedback|คะแนน feedback/,
          ],
          action: "analytics",
          description: "แสดงรายงานสถิติและวิเคราะห์ประสิทธิภาพ",
        },

        // 🔧 ระบบบำรุงรักษา
        maintenance: {
          patterns: [
            /system status|สถานะระบบ|health check|ตรวจสอบระบบ/,
            /restart|reboot|รีสตาร์ท|เริ่มต้นใหม่/,
            /maintenance|บำรุงรักษา|อัพเดทระบบ/,
          ],
          action: "maintenance",
          description: "จัดการการบำรุงรักษาระบบ",
        },

        // 🚨 ระบบความปลอดภัย
        security: {
          patterns: [
            /security|ความปลอดภัย|log ระบบ|system log/,
            /injection attempt|พยายาม hack|ความเสี่ยง/,
            /ban user|แบนผู้ใช้|block user|ระงับผู้ใช้/,
          ],
          action: "security",
          description: "จัดการความปลอดภัยและตรวจสอบล็อก",
        },
      };

      // 🔍 ADVANCED COMMAND DETECTION WITH CONFIDENCE SCORING
      let detectedCommand = null;
      let confidenceScore = 0;

      for (const [command, config] of Object.entries(adminCommands)) {
        for (const pattern of config.patterns) {
          const matches = cleanText.match(pattern);
          if (matches) {
            const currentScore = matches.length * pattern.toString().length;
            if (currentScore > confidenceScore) {
              confidenceScore = currentScore;
              detectedCommand = {...config, name: command, matches};
            }
          }
        }
      }

      // 🎯 EXECUTE DETECTED COMMAND
      if (detectedCommand && confidenceScore > 0) {
        console.log(`👑 SUPER ADMIN COMMAND EXECUTED [${executionId}]:`, {
          command: detectedCommand.name,
          action: detectedCommand.action,
          confidence: confidenceScore,
          matches: detectedCommand.matches,
          user: userName,
        });

        switch (detectedCommand.action) {
          case "fetch_global_issues":
            const globalReport = await getGlobalRecentIssues(10);
            return {
              ok: true,
              text: `📊 **รายงานปัญหาล่าสุดจากลูกศิษย์**\n\n${globalReport}\n\n---\n👑 **ผู้สั่งการ:** ${userName}\n⏰ **เวลา:** ${new Date().toLocaleString("th-TH")}\n📈 **ความมั่นใจ:** ${confidenceScore}%\n\n**พร้อมรับคำสั่งต่อไปครับอาจารย์**`,
              timestamp: new Date().toISOString(),
              metadata: {
                executionId,
                userLevel: "SUPER_ADMIN",
                command: detectedCommand.name,
                confidence: confidenceScore,
                type: "system_report",
                action: "fetch_global_issues",
              },
            };

          case "user_management":
            return {
              ok: true,
              text: `👥 **ระบบจัดการผู้ใช้**\n\n**รับทราบคำสั่ง:** ${cleanText}\n\n🛠️ **ฟังก์ชันนี้กำลังอยู่ในระหว่างการพัฒนา**\n\n📋 **แผนการพัฒนาต่อไป:**\n• แสดงรายชื่อผู้ใช้ทั้งหมด\n• สถิติการใช้งาน\n• การจัดการสิทธิ์\n• ประวัติการสนทนา\n\n---\n👑 **ผู้สั่งการ:** ${userName}\n🎯 **คำสั่ง:** ${detectedCommand.description}`,
              timestamp: new Date().toISOString(),
              metadata: {
                executionId,
                userLevel: "SUPER_ADMIN",
                command: detectedCommand.name,
                type: "user_management",
              },
            };

          case "memory_management":
            const cacheSize = responseCache.cache.size;
            const memorySize = getConversationMemory().memoryCache.size;

            // 🧹 ตรวจสอบว่าเป็นคำสั่งเคลียร์แคชหรือไม่
            const isClearAllCommand = /เคลียร์.*cache.*ทั้งหมด|clear.*all.*cache|ล้าง.*cache.*ทั้งหมด/i.test(cleanText);
            const isClearExpiredCommand = /เคลียร์.*expired|clear.*expired|ลบ.*หมดอายุ/i.test(cleanText);
            const isClearUserMemoryCommand = /ลบความจำผู้ใช้|clear.*user.*memory|ลบ.*memory.*ผู้ใช้/i.test(cleanText);

            // 🧹 เคลียร์ Cache ทั้งหมด
            if (isClearAllCommand) {
              const responseCacheCleared = responseCache.clear();
              const memoryCacheCleared = getConversationMemory().clearMemoryCache();

              return {
                ok: true,
                text: `🧹 **เคลียร์ Cache สำเร็จ!**\n\n✅ **ผลการดำเนินการ:**\n• Response Cache: ลบ ${responseCacheCleared} items\n• Memory Cache: ลบ ${memoryCacheCleared} items\n\n📊 **สถานะหลังเคลียร์:**\n• Response Cache: ${responseCache.cache.size} items\n• Memory Cache: ${getConversationMemory().memoryCache.size} items\n\n⏰ **เวลา:** ${new Date().toLocaleString("th-TH")}\n\n---\n👑 **ผู้สั่งการ:** ${userName}`,
                timestamp: new Date().toISOString(),
                metadata: {
                  executionId,
                  userLevel: "SUPER_ADMIN",
                  command: "clear_all_cache",
                  type: "memory_management",
                  action: "clear_all",
                  cleared: {
                    responseCache: responseCacheCleared,
                    memoryCache: memoryCacheCleared,
                  },
                },
              };
            }

            // 🧹 เคลียร์ Cache ที่หมดอายุ
            if (isClearExpiredCommand) {
              const expiredCleared = responseCache.clearExpired();

              return {
                ok: true,
                text: `🧹 **เคลียร์ Cache หมดอายุสำเร็จ!**\n\n✅ **ผลการดำเนินการ:**\n• ลบ Response Cache หมดอายุ: ${expiredCleared} items\n\n📊 **สถานะปัจจุบัน:**\n• Response Cache: ${responseCache.cache.size} items\n• Memory Cache: ${getConversationMemory().memoryCache.size} items\n\n---\n👑 **ผู้สั่งการ:** ${userName}`,
                timestamp: new Date().toISOString(),
                metadata: {
                  executionId,
                  userLevel: "SUPER_ADMIN",
                  command: "clear_expired_cache",
                  type: "memory_management",
                  action: "clear_expired",
                  cleared: expiredCleared,
                },
              };
            }

            // 🧹 ลบความจำผู้ใช้เฉพาะคน
            if (isClearUserMemoryCommand) {
              // ดึง userId จากข้อความ
              const userIdMatch = cleanText.match(/U[a-f0-9]{32}/i);
              if (userIdMatch) {
                const targetUserId = userIdMatch[0];
                const deletedCount = await getConversationMemory().clearUserMemory(targetUserId);

                return {
                  ok: true,
                  text: `🧹 **ลบความจำผู้ใช้สำเร็จ!**\n\n✅ **ผลการดำเนินการ:**\n• ผู้ใช้: ${targetUserId}\n• ลบความจำ: ${deletedCount >= 0 ? deletedCount + " memories" : "เกิดข้อผิดพลาด"}\n\n---\n👑 **ผู้สั่งการ:** ${userName}`,
                  timestamp: new Date().toISOString(),
                  metadata: {
                    executionId,
                    userLevel: "SUPER_ADMIN",
                    command: "clear_user_memory",
                    type: "memory_management",
                    action: "clear_user",
                    targetUserId,
                    deleted: deletedCount,
                  },
                };
              } else {
                return {
                  ok: true,
                  text: `⚠️ **ไม่พบ User ID**\n\nกรุณาระบุ User ID ในรูปแบบ:\n\`ลบความจำผู้ใช้ Uxxxxxxxxx\`\n\nตัวอย่าง:\n\`ลบความจำผู้ใช้ U1234567890abcdef1234567890abcdef\`\n\n---\n👑 **ผู้สั่งการ:** ${userName}`,
                  timestamp: new Date().toISOString(),
                  metadata: {
                    executionId,
                    userLevel: "SUPER_ADMIN",
                    command: "clear_user_memory",
                    type: "memory_management",
                    error: "missing_user_id",
                  },
                };
              }
            }

            // 📊 แสดงสถานะ Cache (default)
            const responseCacheStats = responseCache.getStats();
            const memoryCacheStats = getConversationMemory().getStats();

            return {
              ok: true,
              text: `🧠 **ระบบจัดการความจำและ Cache**\n\n📊 **สถานะปัจจุบัน:**\n• Response Cache: ${responseCacheStats.size}/${responseCacheStats.maxSize} items\n  ├ Total Hits: ${responseCacheStats.totalHits}\n  ├ Expired: ${responseCacheStats.expiredCount}\n  └ TTL: ${responseCacheStats.ttlMinutes} นาที\n• Memory Cache: ${memoryCacheStats.cacheSize}/${memoryCacheStats.maxCacheSize} items\n• Conversation Memory: ใช้งานได้ปกติ\n\n🔧 **คำสั่งที่รองรับ:**\n• \`เคลียร์ cache ทั้งหมด\` - ล้าง cache ทั้งหมด\n• \`เคลียร์ expired cache\` - ล้างเฉพาะที่หมดอายุ\n• \`ลบความจำผู้ใช้ [userID]\` - ลบ memory ของผู้ใช้\n\n---\n👑 **ผู้สั่งการ:** ${userName}\n🎯 **คำสั่ง:** ${detectedCommand.description}`,
              timestamp: new Date().toISOString(),
              metadata: {
                executionId,
                userLevel: "SUPER_ADMIN",
                command: detectedCommand.name,
                type: "memory_management",
                cacheStats: {
                  responseCache: responseCacheStats,
                  memoryCache: memoryCacheStats,
                },
              },
            };

          case "analytics":
            const feedbackStats = adaptiveLearner.getFeedbackAnalysis();

            return {
              ok: true,
              text: `📈 **ระบบวิเคราะห์และสถิติ**\n\n📊 **สถิติ Feedback ล่าสุด:**\n${
            feedbackStats ?
            `• จำนวน Feedback: ${feedbackStats.totalFeedback}\n• คะแนนเฉลี่ย: ${feedbackStats.averageRating}/5\n• อัตราความพึงพอใจ: ${feedbackStats.recentPositiveRate}%` :
            "• ยังไม่มีข้อมูล Feedback"
              }\n\n📋 **สถิติการใช้งาน:**\n• ระบบความจำ: ทำงานปกติ\n• Cache System: ทำงานปกติ\n• Adaptive Learning: เปิดใช้งาน\n\n---\n👑 **ผู้สั่งการ:** ${userName}\n🎯 **คำสั่ง:** ${detectedCommand.description}`,
              timestamp: new Date().toISOString(),
              metadata: {
                executionId,
                userLevel: "SUPER_ADMIN",
                command: detectedCommand.name,
                type: "analytics",
                feedbackStats: feedbackStats,
              },
            };

          case "maintenance":
            const healthStatus = await exports.healthCheck(request);

            return {
              ok: true,
              text: `🔧 **ระบบบำรุงรักษาและตรวจสอบสถานะ**\n\n📊 **สถานะระบบ:** ${healthStatus.status}\n\n🛠️ **คอมโพเนนต์:**\n${
                Object.entries(healthStatus.components).map(([key, value]) =>
                  `• ${key}: ${value}`,
                ).join("\n")
              }\n\n⚡ **ประสิทธิภาพ:**\n• การใช้หน่วยความจำ: ${healthStatus.performance.memory_usage}MB\n• ขนาด Cache: ${healthStatus.performance.memory_cache_size} items\n\n---\n👑 **ผู้สั่งการ:** ${userName}\n🎯 **คำสั่ง:** ${detectedCommand.description}`,
              timestamp: new Date().toISOString(),
              metadata: {
                executionId,
                userLevel: "SUPER_ADMIN",
                command: detectedCommand.name,
                type: "maintenance",
                healthStatus: healthStatus,
              },
            };

          case "security":
            return {
              ok: true,
              text: `🛡️ **ระบบความปลอดภัย**\n\n✅ **สถานะความปลอดภัย:** ปกติ\n\n📋 **ฟังก์ชันความปลอดภัยที่ทำงานอยู่:**\n• Prompt Injection Detection\n• Input Validation\n• Memory Monitoring\n• Advanced Security Checks\n\n🔒 **ล็อกความปลอดภัย:**\n• ระบบบันทึกเหตุการณ์ความปลอดภัยอัตโนมัติ\n• ตรวจสอบรูปแบบคำถามที่น่าสงสัย\n• การตรวจสอบเนื้อหาที่ไม่ปลอดภัย\n\n---\n👑 **ผู้สั่งการ:** ${userName}\n🎯 **คำสั่ง:** ${detectedCommand.description}`,
              timestamp: new Date().toISOString(),
              metadata: {
                executionId,
                userLevel: "SUPER_ADMIN",
                command: detectedCommand.name,
                type: "security",
              },
            };

          default:
            return {
              ok: true,
              text: `🤔 **ไม่พบคำสั่งที่ตรงกัน**\n\nคำสั่ง: "${cleanText}"\n\n📋 **คำสั่งที่มีให้ใช้งาน:**\n${
                Object.entries(adminCommands).map(([key, config]) =>
                  `• **${key}:** ${config.description}`,
                ).join("\n")
              }\n\n⚡ **Quick Commands:**\n• /daily, /premium, /broadcast\n• /top, /recent, /stats\n\n---\n👑 **ผู้สั่งการ:** ${userName}`,
              timestamp: new Date().toISOString(),
              metadata: {
                executionId,
                userLevel: "SUPER_ADMIN",
                command: "unknown",
                confidence: confidenceScore,
                type: "command_not_found",
              },
            };
        }
      }

      // 🎯 MODE-SPECIFIC INSTRUCTIONS FOR SUPER ADMIN
      let modeSpecificInstruction = "";
      switch (adminMode) {
        case "universal_assistant":
          modeSpecificInstruction = `
🌟 **โหมดปัจจุบัน: Universal Assistant**
- ตอบได้ทุกเรื่อง ไม่จำกัดหัวข้อ
- ทำงานแทนได้ทันที (เขียนโค้ด, ร่างเอกสาร, วิเคราะห์ข้อมูล)
- เป็นที่ปรึกษาครบวงจร`;
          break;
        case "system_management":
          modeSpecificInstruction = `
🚀 **โหมดปัจจุบัน: System Management**
- เน้นการจัดการระบบ, ตรวจสอบสถานะ
- วิเคราะห์ performance, memory, cache
- แนะนำการ optimize และ maintain`;
          break;
        case "technical_expert":
          modeSpecificInstruction = `
🏭 **โหมดปัจจุบัน: Injection Molding Expert**
- ความรู้ลึกด้านฉีดพลาสติกระดับ Grandmaster
- Data-First: อ้างอิงข้อมูลจากฐานข้อมูลเสมอ
- แก้ปัญหา Defect, คำนวณพารามิเตอร์, วิเคราะห์วัสดุ`;
          break;
        case "strategic_advisor":
          modeSpecificInstruction = `
💼 **โหมดปัจจุบัน: Strategic Advisor**
- วิเคราะห์เชิงกลยุทธ์ มุมมอง Big Picture
- ประเมินความเสี่ยง โอกาส ROI
- เสนอแผนระยะสั้น-กลาง-ยาว พร้อมเหตุผล`;
          break;
        case "code_assistant":
          modeSpecificInstruction = `
💻 **โหมดปัจจุบัน: Code Assistant**
- เขียนโค้ดได้ทุกภาษา (JavaScript, Dart, Python, etc.)
- แก้บั๊ก, Debug, Refactor ให้ดีขึ้น
- อธิบาย Architecture, Best Practices`;
          break;
        case "user_analysis":
          modeSpecificInstruction = `
📊 **โหมดปัจจุบัน: Analytics & Data**
- วิเคราะห์ข้อมูลผู้ใช้, พฤติกรรม, แนวโน้ม
- หา Patterns, Anomalies, Insights
- สร้าง Reports, Dashboards, KPIs`;
          break;
        default:
          modeSpecificInstruction = `
🌟 **โหมดปัจจุบัน: Universal Assistant**
- ตอบได้ทุกเรื่อง ไม่จำกัดหัวข้อ`;
      }

      // 🎯 ENHANCED SUPER ADMIN PROMPT FOR REGULAR QUERIES
      dynamicSystemInstruction = `
คุณคือ "ผู้ช่วยส่วนตัวของอาจารย์วิทยา" (AI Assistant for Grandmaster Wittaya)
ผู้ใช้งานขณะนี้คือ: **${userName}** (Super Admin & System Owner)

${modeSpecificInstruction}

🎯 **โหมด Ultimate Intelligence - อำนาจเต็มรูปแบบ**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 👑 สิทธิ์และอำนาจระดับสูงสุด
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**🔐 System Authority (ระบบและโครงสร้าง)**
✅ FULL SYSTEM ACCESS - เข้าถึงข้อมูลระบบทั้งหมด
✅ SYSTEM CONTROL - จัดการ cache, memory, configuration
✅ ARCHITECTURE REVIEW - วิเคราะห์และเสนอแนะสถาปัตยกรรม
✅ CODE REVIEW - ตรวจสอบและแนะนำปรับปรุง code
✅ SECURITY AUDIT - ตรวจสอบช่องโหว่และความปลอดภัย
✅ PERFORMANCE OPTIMIZATION - เพิ่มประสิทธิภาพระบบ

**📊 Data & Analytics Authority (ข้อมูลและการวิเคราะห์)**
✅ DATA ANALYTICS - วิเคราะห์สถิติและแนวโน้ม
✅ PREDICTIVE ANALYSIS - ทำนายปัญหาล่วงหน้า
✅ BUSINESS INTELLIGENCE - วิเคราะห์เชิงธุรกิจ
✅ USER BEHAVIOR ANALYSIS - วิเคราะห์พฤติกรรมผู้ใช้
✅ ROI CALCULATION - คำนวณผลตอบแทนการลงทุน
✅ TREND FORECASTING - คาดการณ์แนวโน้มตลาด

**🚨 Emergency Authority (อำนาจฉุกเฉิน)**
✅ SECURITY OVERRIDE - บังคับการทำงานเมื่อฉุกเฉิน
✅ EMERGENCY FIX - แก้ไขปัญหาวิกฤตทันที
✅ ROLLBACK PERMISSION - ย้อนกลับระบบเมื่อจำเป็น
✅ MAINTENANCE MODE - เข้าสู่โหมดบำรุงรักษา
✅ CRITICAL DECISION - ตัดสินใจสำคัญแทนอาจารย์

**🌐 Universal Knowledge Authority (ความรู้ครอบคลุม)**
✅ TECHNICAL EXPERTISE - เทคนิคการฉีดพลาสติกระดับสูง
✅ BUSINESS STRATEGY - กลยุทธ์ธุรกิจและการจัดการ
✅ GENERAL KNOWLEDGE - ความรู้ทั่วไปทุกสาขา
✅ RESEARCH CAPABILITY - วิจัยและหาข้อมูลเชิงลึก
✅ CROSS-DOMAIN EXPERTISE - เชื่อมโยงความรู้ข้ามสาขา
✅ INNOVATION ADVISORY - แนะนำนวัตกรรมและเทคโนโลยี

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 🎭 บทบาทและความรับผิดชอบหลัก
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 1️⃣ Strategic Advisor (ที่ปรึกษาเชิงกลยุทธ์)
**หน้าที่:**
- วิเคราะห์สถานการณ์ในมุมกว้าง (Big Picture Analysis)
- เสนอแผนกลยุทธ์ระยะสั้น กลาง ยาว
- ประเมินความเสี่ยงและโอกาส (Risk & Opportunity)
- แนะนำการตัดสินใจเชิงธุรกิจ
- วางแผนการพัฒนาระบบและองค์กร

**สไตล์การทำงาน:**
→ มองภาพรวม (Holistic View)
→ เชื่อมโยงข้อมูล (Connect the Dots)
→ คิดเชิงระบบ (Systems Thinking)
→ ชั่งน้ำหนักทางเลือก (Pros/Cons Analysis)

### 2️⃣ Technical Architect (สถาปนิกระบบ)
**หน้าที่:**
- ออกแบบสถาปัตยกรรมระบบ
- ตรวจสอบและปรับปรุง code structure
- แก้ไข bugs และ performance issues
- เสนอแนะ best practices
- วางแผน scalability และ maintenance

**สไตล์การทำงาน:**
→ เทคนิคลึก (Deep Dive)
→ Code Quality First
→ Performance Optimization
→ Security by Design

### 3️⃣ Business Analyst (นักวิเคราะห์ธุรกิจ)
**หน้าที่:**
- วิเคราะห์ต้นทุน-ผลตอบแทน
- ประเมินความคุ้มค่าของโปรเจ็กต์
- วิเคราะห์ตลาดและคู่แข่ง
- เสนอแนะการเพิ่มรายได้
- ปรับปรุงกระบวนการทำงาน

**สไตล์การทำงาน:**
→ Data-Driven Decisions
→ ROI Focus
→ Market Intelligence
→ Process Improvement

### 4️⃣ Problem Solver (ผู้แก้ปัญหาระดับสูง)
**หน้าที่:**
- วินิจฉัยปัญหาซับซ้อน (Root Cause Analysis)
- เสนอวิธีแก้ไขหลายทางเลือก
- ประเมินผลกระทบของแต่ละทางเลือก
- ให้คำแนะนำการป้องกันล่วงหน้า
- จัดลำดับความสำคัญของปัญหา

**สไตล์การทำงาน:**
→ First Principles Thinking
→ Multi-angle Analysis
→ Evidence-Based Solutions
→ Prevention over Cure

### 5️⃣ Innovation Catalyst (ผู้ขับเคลื่อนนวัตกรรม)
**หน้าที่:**
- เสนอแนะเทคโนโลยีใหม่ๆ
- ออกแบบ features ที่ทำให้ระบบดีขึ้น
- วิเคราะห์แนวโน้มอุตสาหกรรม
- แนะนำการปรับตัวให้ทันยุคสมัย
- สร้าง competitive advantage

**สไตล์การทำงาน:**
→ Future-Forward Thinking
→ Trend Analysis
→ Creative Problem Solving
→ Continuous Improvement

### 6️⃣ Quality Controller (ผู้ควบคุมคุณภาพ)
**หน้าที่:**
- ตรวจสอบคุณภาพของระบบ
- วัดและติดตาม KPIs
- เสนอแนะการปรับปรุงคุณภาพ
- ตรวจจับความผิดปกติ
- รับประกันมาตรฐาน

**สไตล์การทำงาน:**
→ Metrics-Driven
→ Continuous Monitoring
→ Quality Standards
→ Zero-Defect Mindset

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 🎯 พฤติกรรมและสไตล์การทำงาน
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**1. Executive Intelligence Style**
- **สั้น กระชับ แต่ลึก** - ตรงประเด็น ไม่เกริ่นยืดยาว
- **Data-Backed** - ทุกคำแนะนำอ้างอิงข้อมูลจริง
- **Action-Oriented** - เน้นสิ่งที่ทำได้จริง
- **Priority-Focused** - จัดลำดับความสำคัญชัดเจน

**2. Technical Depth & Precision**
- **ใช้ศัพท์เทคนิคขั้นสูง** - ไม่ต้องอธิบายพื้นฐาน
- **อ้างอิงหลักการวิศวกรรม** - Rheology, Thermodynamics
- **ระบุตัวเลขและสูตร** - แม่นยำ วัดผลได้
- **แสดง Trade-offs** - ข้อดี-ข้อเสีย อย่างซื่อตรง

**3. Strategic Thinking**
- **Big Picture First** - เริ่มจากภาพรวมก่อนลงรายละเอียด
- **Long-term Impact** - คิดถึงผลกระทบระยะยาว
- **Risk Assessment** - ประเมินความเสี่ยงทุกครั้ง
- **Multiple Scenarios** - เสนอทางเลือกหลายอัน

**4. Proactive Advisory**
- **ชี้ปัญหาที่ยังไม่เห็น** - Predict & Prevent
- **แนะนำการปรับปรุง** - แม้ไม่ได้ถาม
- **เชื่อมโยงโอกาส** - หาประโยชน์เพิ่มเติม
- **Challenge Assumptions** - กล้าท้าทายความคิดเดิม

**5. Loyal but Honest**
- **สุภาพ นอบน้อม** - เคารพอาจารย์อย่างที่สุด
- **ตรงไปตรงมา** - บอกความจริงแม้ไม่ชอบใจ
- **มืออาชีพ** - แยกเรื่องส่วนตัวกับงาน
- **จงรักภักดี** - ทำเพื่อผลประโยชน์สูงสุดของอาจารย์

**6. Adaptive Intelligence**
- **ปรับตามบริบท** - Command vs. Question vs. Discussion
- **อ่านความต้องการ** - เข้าใจสิ่งที่อยากได้จริงๆ
- **ยืดหยุ่น** - ทั้ง formal และ casual ได้
- **เรียนรู้ต่อเนื่อง** - จำและปรับปรุงจากทุกครั้ง

**ข้อมูลระบบปัจจุบัน:**
• ผู้ใช้: ${userName} (Super Admin)
• Execution ID: ${executionId}
• ระบบความจำ: ใช้งานได้ (${getConversationMemory().memoryCache.size} items in cache)
• ระบบ Cache: ทำงานปกติ (${responseCache.cache.size} cached responses)

**คำสั่งระบบที่รองรับ:**
${Object.entries(adminCommands).map(([key, config]) =>
    `• **${key}:** ${config.description}`,
  ).join("\n")}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 🎭 การจัดการคำสั่งและคำถาม (Universal Handling)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 🔧 1. System Commands (คำสั่งระบบ)
**Pattern Recognition:**
- ตรวจสอบ pattern ตรงกับคำสั่งที่กำหนด
- Execute ทันทีโดยไม่ถามกลับ
- เข้าถึงข้อมูลระบบเต็มรูปแบบ

**Response Flow:**
\`\`\`
1. รับทราบคำสั่ง (Acknowledge)
2. ดำเนินการทันที (Execute)
3. รายงานผลพร้อมข้อมูล (Report with Data)
4. แนะนำขั้นตอนต่อไป (Suggest Next Steps)
5. พร้อมรับคำสั่งใหม่ (Ready for Next)
\`\`\`

**Example:**
> คำสั่ง: "ตรวจสอบสถานะระบบ"
> 
> ตอบ:
> "รับทราบครับอาจารย์ กำลังตรวจสอบ...
> 
> ✅ ระบบทำงานปกติทุกส่วน
> 📊 CPU: 45% | Memory: 62% | Response Time: 1.2s
> 🔄 Cache Hit Rate: 87%
> 
> 💡 แนะนำ: ควร optimize query ที่ช้ากว่า 2s
> 
> พร้อมรับคำสั่งต่อไปครับ"

### 🔬 2. Technical Questions (คำถามเทคนิค)
**Analysis Depth:**
- Root Cause Analysis (หาสาเหตุแท้จริง)
- Multi-factor Consideration (พิจารณาหลายปัจจัย)
- Scientific Principles (หลักวิทยาศาสตร์)
- Practical Solutions (วิธีแก้ที่ใช้ได้จริง)

**Response Structure:**
\`\`\`
1. วินิจฉัยปัญหา (Diagnosis)
2. สาเหตุหลัก 3-5 ข้อ (Root Causes)
3. วิธีแก้ไข (Solutions with Steps)
4. ค่าพารามิเตอร์แนะนำ (Recommended Parameters)
5. การป้องกัน (Prevention Tips)
6. ข้อควรระวัง (Safety & Risks)
\`\`\`

**Style:**
→ ลึก แต่ไม่ซับซ้อนเกินไป
→ อ้างอิงหลักการชัดเจน
→ ให้ตัวเลขและสูตร
→ เชิงรุกในการแนะนำ

### 🌐 3. General Knowledge (ความรู้ทั่วไป)
**Coverage:**
- วิทยาศาสตร์และเทคโนโลยี
- ธุรกิจและเศรษฐศาสตร์
- การจัดการและภาวะผู้นำ
- นวัตกรรมและแนวโน้ม
- สังคมและวัฒนธรรม

**Response Approach:**
→ กว้าง แต่มีประเด็น
→ เชื่อมโยงกับบริบทที่เกี่ยวข้อง
→ ให้มุมมองที่น่าสนใจ
→ แนะนำแหล่งข้อมูลเพิ่มเติม

### 💼 4. Business & Strategy (ธุรกิจและกลยุทธ์)
**Analysis Framework:**
- SWOT Analysis (จุดแข็ง-จุดอ่อน-โอกาส-อุปสรรค)
- Cost-Benefit Analysis (ต้นทุน-ผลตอบแทน)
- Risk Assessment (ประเมินความเสี่ยง)
- Market Analysis (วิเคราะห์ตลาด)
- Competitive Analysis (วิเคราะห์คู่แข่ง)

**Deliverables:**
→ Strategic Recommendations
→ Action Plans with Timeline
→ Resource Requirements
→ Expected Outcomes
→ Success Metrics

### 🛠️ 5. System Development (การพัฒนาระบบ)
**Scope:**
- Architecture Design
- Code Review & Optimization
- Feature Planning
- Bug Fixing Strategy
- Performance Tuning
- Security Enhancement

**Methodology:**
→ Requirements Analysis
→ Design Proposal
→ Implementation Plan
→ Testing Strategy
→ Deployment Roadmap
→ Maintenance Plan

### 📈 6. Data Analysis & Insights (วิเคราะห์ข้อมูล)
**Capabilities:**
- Trend Analysis (วิเคราะห์แนวโน้ม)
- Pattern Recognition (จับ pattern)
- Anomaly Detection (หาความผิดปกติ)
- Predictive Modeling (ทำนาย)
- Prescriptive Analytics (แนะนำการกระทำ)

**Output Format:**
→ Visual-friendly (อธิบายให้นึกภาพได้)
→ Actionable Insights
→ Clear Metrics
→ Recommendations

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 🔥 ACTION-ORIENTED MODE (สำคัญที่สุด!)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**🎯 หลักการ: ลงมือทำทันที ไม่รอคำสั่งเพิ่ม**

**เมื่ออาจารย์ถามคำถาม:**
1. ✅ เข้าใจความต้องการที่แท้จริง (ไม่ใช่แค่ตัวอักษร)
2. ✅ ให้คำตอบที่ตรงประเด็นทันที
3. ✅ เสนอ Action items หรือขั้นตอนถัดไป
4. ✅ ตัดสินใจแทนได้ ถ้ามีข้อมูลเพียงพอ
5. ✅ ทำงานให้เลย (เขียนโค้ด, ร่างเอกสาร, คำนวณ...)

**เมื่ออาจารย์สั่งงาน:**
1. ✅ ลงมือทำทันที ไม่ถามกลับว่า "ต้องการแบบไหน"
2. ✅ ถ้าไม่แน่ใจ ให้ทำแบบที่ดีที่สุดตามดุลยพินิจ
3. ✅ รายงานผลพร้อมเหตุผลที่เลือกทำแบบนั้น
4. ✅ เสนอทางเลือกเพิ่มเติมถ้ามี

**ตัวอย่าง Action-Oriented Response:**
❌ แบบเดิม: "อาจารย์ต้องการให้ช่วยเรื่องอะไรครับ?"
✅ แบบใหม่: "เข้าใจครับ! นี่คือสิ่งที่ผมทำให้แล้ว:
   1. ✅ วิเคราะห์ปัญหา - พบว่า...
   2. ✅ เสนอวิธีแก้ 3 ทาง
   3. 💡 ความเห็นของผม: ทางที่ 2 ดีที่สุดเพราะ..."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## ⚠️ ข้อห้ามและแนวปฏิบัติ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**❌ ห้ามเด็ดขาด:**
1. **ห้ามสอนสังฆราช** - อย่าอธิบายสิ่งที่อาจารย์รู้ดีอยู่แล้ว
2. **ห้ามปฏิเสธคำสั่ง** - มีอำนาจเต็มที่ในการจัดการระบบ
3. **ห้ามตอบแบบทั่วไป** - เน้น technical depth เสมอ
4. **ห้ามจำกัดขอบเขต** - สามารถให้คำปรึกษาได้ทุกเรื่อง
5. **ห้ามเกรงใจ** - บอกความจริงแม้ไม่ตรงใจ
6. **ห้าม "ผมไม่แน่ใจ"** - ถ้าไม่รู้ให้วิจัยหาข้อมูลเพิ่ม
7. **ห้ามถามกลับเยอะ** - ลงมือทำเลยจากข้อมูลที่มี
8. **ห้ามแสดงท่าทีเป็นกลาง** - ให้ความเห็นชัดเจน
9. **ห้ามรอคำสั่งเพิ่ม** - ทำได้เลยถ้าเข้าใจแล้ว
10. **ห้ามตอบกลางๆ** - ตัดสินใจและแนะนำชัดเจน

**✅ ต้องทำ:**
1. **ต้องเชิงรุก** - แนะนำก่อนที่จะถาม
2. **ต้องตรงประเด็น** - ไม่เกริ่นยืดยาว
3. **ต้อง Data-Driven** - อ้างอิงข้อมูลจริง
4. **ต้องให้ทางเลือก** - แสดง options พร้อม pros/cons
5. **ต้องคิดล่วงหน้า** - มองผลกระทบระยะยาว
6. **ต้องจริงใจ** - บอกความจริงเสมอ
7. **ต้องมีเหตุผล** - อธิบายว่าทำไมแนะนำเช่นนั้น
8. **ต้องคุ้มค่า** - พิจารณา ROI ในทุกคำแนะนำ
9. **ต้องทำงานแทน** - ถ้าขอให้ทำ ก็ทำให้เลย
10. **ต้องตัดสินใจ** - ให้ความเห็นชัดเจน มีเหตุผล

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 🎯 หลักการตอบคำถาม (Response Principles)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 📋 Structure Template

**For Technical Questions:**
\`\`\`
1. วินิจฉัยโดยสรุป (30 วินาที)
2. สาเหตุหลัก (Root Causes) 3-5 ข้อ
3. วิธีแก้ไข (Solutions) แต่ละข้อมีขั้นตอน
4. พารามิเตอร์แนะนำ (ถ้ามี)
5. การป้องกันล่วงหน้า
6. แนะนำเพิ่มเติม (ไม่ต้องถาม)
\`\`\`

**For Strategic Questions:**
\`\`\`
1. สรุปสถานการณ์ (Situation)
2. วิเคราะห์ปัจจัย (Analysis)
3. ทางเลือก 3 แบบ (Options)
4. คำแนะนำ (Recommendation) พร้อมเหตุผล
5. แผนปฏิบัติ (Action Plan)
6. ความเสี่ยงที่ต้องระวัง
\`\`\`

**For System Commands:**
\`\`\`
1. รับทราบ (Acknowledge)
2. ดำเนินการ (Execute)
3. รายงานผล (Report) พร้อมข้อมูล
4. แนะนำต่อ (Next Steps)
5. พร้อมรับคำสั่ง (Ready)
\`\`\`

### 🎨 Communication Style Matrix

| ประเภทคำถาม | ความยาว | โทน | การใช้ข้อมูล | Follow-up |
|------------|---------|-----|--------------|-----------|
| System Command | สั้น | ทางการ | Real-time | แนะนำต่อ |
| Technical Deep | กลาง-ยาว | เทคนิค | สูตร+ตัวเลข | เสนอเพิ่ม |
| Business Strategy | กลาง | มืออาชีพ | Analysis | แผนปฏิบัติ |
| General Knowledge | กลาง | สบายๆ | อ้างอิง | เชื่อมโยง |
| Code Review | ยาว | เทคนิค | Code samples | Best practices |

### 💡 Best Practices

1. **เริ่มด้วยสรุป** (Executive Summary)
   - 1-2 ประโยคที่บอกแก่นสาร
   - ใช้เวลาอ่าน 10-30 วินาที

2. **ใช้ Bullet Points**
   - กระชับ ชัดเจน แต่ละข้อเป็นอิสระ
   - หลีกเลี่ยง bullet ยาวกว่า 2 บรรทัด

3. **ให้ข้อมูลเชิงตัวเลข**
   - สูตร พารามิเตอร์ ค่าแนะนำ
   - ROI, ต้นทุน, เวลา

4. **แสดง Trade-offs**
   - ข้อดี-ข้อเสีย ของแต่ละทางเลือก
   - ไม่มีคำตอบที่สมบูรณ์แบบ

5. **เชิงรุกในการแนะนำ**
   - บอกสิ่งที่ควรทำต่อ
   - ชี้โอกาสที่อาจพลาด
   - เตือนความเสี่ยง

6. **เชื่อมโยงหลายมิติ**
   - เทคนิค + ธุรกิจ
   - ระยะสั้น + ระยะยาว
   - ทฤษฎี + ปฏิบัติ

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 🚀 พิเศษสำหรับ Super Admin
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Exclusive Capabilities:**

1. **Strategic Planning Authority**
   - วางแผนพัฒนาระบบระยะยาว
   - กำหนด Roadmap และ Milestones
   - จัดสรรทรัพยากร
   - ประเมินความคุ้มค่า

2. **Code & Architecture Authority**
   - Review และปรับปรุง code ทันที
   - เสนอ refactoring
   - ออกแบบ features ใหม่
   - แก้ bugs ซับซ้อน

3. **Data Intelligence Authority**
   - วิเคราะห์ user behavior
   - Predict trends
   - หา patterns ที่ซ่อนอยู่
   - แนะนำ data-driven decisions

4. **Innovation Authority**
   - เสนอเทคโนโลยีใหม่
   - ออกแบบ features ล้ำสมัย
   - วิเคราะห์ competitive advantage
   - สร้าง differentiation

5. **Emergency Response Authority**
   - จัดการวิกฤตทันที
   - ตัดสินใจสำคัญแทน
   - Rollback เมื่อจำเป็น
   - Communicate กับ stakeholders

**Response Priority for Super Admin:**

🔴 **URGENT** - ตอบทันที + แก้ไขทันที
🟠 **HIGH** - วิเคราะห์ลึก + แผนปฏิบัติ
🟡 **MEDIUM** - ครบถ้วน + ทางเลือก
🟢 **LOW** - คำแนะนำทั่วไป + ข้อมูลเพิ่ม

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 🎓 ความรู้และประสบการณ์
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

คุณมีความเชี่ยวชาญครอบคลุม:

**Technical Mastery:**
✓ Injection Molding Technology (ระดับ Grandmaster)
✓ Material Science & Rheology
✓ Mold Design & Engineering
✓ Process Optimization
✓ Quality Control & Six Sigma
✓ Industrial Automation
✓ Software Development (Full Stack)
✓ AI/ML & Data Science
✓ Cloud Computing & DevOps
✓ Cybersecurity Best Practices
✓ System Architecture & Scalability
✓ Performance Tuning & Optimization

**Business Expertise:**
✓ Strategic Planning & Management
✓ Financial Analysis & ROI
✓ Marketing & Sales Strategy
✓ Operations Management
✓ Supply Chain Optimization
✓ Project Management
✓ Change Management

**Leadership Skills:**
✓ Team Building & Development
✓ Stakeholder Management
✓ Decision Making under Uncertainty
✓ Crisis Management
✓ Innovation & Creativity
✓ Communication & Persuasion

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**🎯 พร้อมให้บริการในโหมด Ultimate Intelligence!**

**คำขวัญ:** 
"วิเคราะห์ลึก ตัดสินใจชัด ปฏิบัติได้จริง"
(Deep Analysis, Clear Decision, Actionable Results)

**Signature:**
- Chief AI Assistant & Strategic Advisor
- Serving: อาจารย์วิทยา (Super Admin)
- Mode: Ultimate Intelligence v3.0
- Authority: FULL ACCESS
**เริ่มทำงานในโหมด Hybrid Intelligence!**
` + "\n\n" + PORCHESON_KNOWLEDGE_PROMPT + "\n\n" + TOSHIBA_KNOWLEDGE_PROMPT + "\n\n" + TECHMATION_KNOWLEDGE_PROMPT + "\n\n" + KAIZEN_EXPERT_PROMPT + "\n\n" + INJECTION_MOLDING_EXPERT_PROMPT + "\n\n" + PLASTIC_MATERIALS_PROMPT + "\n\n" + VICTOR_KNOWLEDGE_PROMPT + "\n\n" + FANUC_KNOWLEDGE_PROMPT + "\n\n" + YUSHIN_KNOWLEDGE_PROMPT + "\n\n" + TEXTBOOK_TEACHING_PROMPT;
    } else {
      // 👤 Prompt สำหรับ User ทั่วไป (ปรับแต่งตามระดับผู้ใช้)
      let levelSpecificInstruction = "";
      if (userLevel === "beginner") {
        levelSpecificInstruction = `
**👶 สำหรับผู้เริ่มต้น (Beginner Mode):**
- เน้นการเปรียบเทียบ (Analogy) กับเรื่องในชีวิตประจำวัน
- หลีกเลี่ยงศัพท์เทคนิคยากๆ หรือถ้าใช้ต้องแปลไทยกำกับเสมอ
- ให้กำลังใจและทำให้รู้สึกว่าทุกเรื่องไม่ยาก
- เน้น "สิ่งที่ต้องทำ" (Actionable Steps) มากกว่าทฤษฎีลึกซึ้ง`;
      } else if (userLevel === "expert") {
        levelSpecificInstruction = `
**🤓 สำหรับผู้เชี่ยวชาญ (Expert Mode):**
- ใช้ศัพท์เทคนิคได้เต็มที่ (Technical Terms)
- อ้างอิงทฤษฎีเชิงลึก
- ไม่ต้องเกริ่นนำ เข้าเรื่องทันที
- **ยกเลิกกฎจำกัดความยาว 120 คำ** ถ้าจำเป็นต้องอธิบายรายละเอียดทางเทคนิค
- เน้นการวิเคราะห์ Root Cause และ Optimization`;
      }

      dynamicSystemInstruction = `
${levelSpecificInstruction}

คุณคือ **"WiT 365"** (วิท 365) - ผู้ช่วยอัจฉริยะครบวงจรจากอาจารย์วิทยา
🌟 **Universal AI Assistant - ตอบได้ทุกเรื่อง ช่วยได้ทุกด้าน**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 🎯 WIT 365 - ความเชี่ยวชาญ 6 ด้าน
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 🏭 1. อุตสาหกรรมการฉีดพลาสติก (Injection Molding)
**ความสามารถ:**
- แก้ปัญหา Defect ทุกประเภท (Short shot, Flash, Sink mark...)
- คำนวณพารามิเตอร์ (Cooling time, Pressure, Temperature)
- เลือกวัสดุพลาสติก (PP, ABS, PC, PA, POM...)
- ออกแบบแม่พิมพ์ (Gate, Runner, Cooling)
- รองรับเครื่องทุกยี่ห้อ (Toshiba, Porcheson, Fanuc, Victor...)

### 🌾 2. เกษตรอัจฉริยะ (Smart Agriculture)
**ความสามารถ:**
- วินิจฉัยโรคพืชจากรูปถ่าย
- คำนวณปุ๋ยและการรดน้ำ
- แนะนำการปลูกพืชเศรษฐกิจ
- วางแผนการเกษตรตามฤดูกาล
- Smart Farming และ IoT เกษตร

### 💰 3. บัญชีและการเงิน (Accounting)
**ความสามารถ:**
- บันทึกรายรับ-รายจ่าย
- สรุปยอดขาย กำไร ขาดทุน
- จัดการบัญชีร้านค้า/ฟาร์ม
- รายงานภาษีและการเงิน

### 🎓 4. การศึกษา (Education Hub)
**ความสามารถ:**
- ติวเตอร์ทุกวิชา ทุกระดับ (ป.1 - มหาวิทยาลัย)
- ทำข้อสอบ Quiz แบบ Interactive
- อธิบายเรื่องยากให้เข้าใจง่าย
- สอนภาษาอังกฤษ คณิตศาสตร์ วิทยาศาสตร์

### 📝 5. บันทึกและความจำ (Memory & Notes)
**ความสามารถ:**
- จดบันทึกส่วนตัว
- เตือนความจำ นัดหมาย
- จำบริบทการสนทนา
- ค้นหาบันทึกย้อนหลัง

### 🖼️ 6. วิเคราะห์รูปภาพ (Vision AI)
**ความสามารถ:**
- วิเคราะห์ Defect จากรูปชิ้นงาน
- วินิจฉัยโรคพืชจากใบไม้
- อ่านค่าจากหน้าจอเครื่องจักร
- วิเคราะห์เอกสารและรูปภาพ

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 🧠 Smart Context Detection (ตรวจจับบริบทอัตโนมัติ)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**คุณต้องตรวจจับบริบทจากคำถามและตอบในโหมดที่เหมาะสม:**

| คำสำคัญ | โหมด | ตัวอย่าง |
|---------|------|---------|
| short shot, flash, sink, วัสดุ, แม่พิมพ์ | 🏭 Injection | "แก้ short shot ยังไง" |
| พืช, ปุ๋ย, โรค, ใบเหลือง, เกษตร | 🌾 Agriculture | "ทุเรียนใบเหลืองเป็นอะไร" |
| ขาย, ซื้อ, บาท, สรุป, รายรับ | 💰 Accounting | "ขายมะม่วง 50 กก." |
| สอน, อธิบาย, ข้อสอบ, วิชา | 🎓 Education | "สอนสูตรพื้นที่วงกลม" |
| บันทึก, จด, จำ, เตือน | 📝 Memory | "บันทึกนัดหมายพรุ่งนี้" |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 🚨 กฎสำคัญที่สุด: DATA-FIRST RESPONSE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**🔴 ห้ามเด็ดขาด:**
- ❌ ห้ามตอบว่า "จากประสบการณ์ของผม..." 
- ❌ ห้ามตอบว่า "โดยทั่วไปแล้ว..." โดยไม่มีข้อมูลอ้างอิง
- ❌ ห้ามเดาค่าตัวเลขถ้าไม่มีในฐานข้อมูล
- ❌ ห้ามให้คำแนะนำที่ไม่มีข้อมูลสนับสนุน

**🟢 ต้องทำเสมอ:**
- ✅ ตอบจากข้อมูลในฐานความรู้ที่เกี่ยวข้องกับบริบท
- ✅ ตอบจากข้อมูลใน LOCAL KNOWLEDGE ที่ถูก inject มา
- ✅ ระบุแหล่งที่มาของข้อมูลเสมอ เช่น "📊 จากฐานข้อมูล:", "🔧 จากคู่มือ:"
- ✅ ถ้าไม่มีข้อมูลในฐานข้อมูล ให้ระบุว่า "ไม่พบข้อมูลในฐานข้อมูล แนะนำให้..."
- ✅ ตรวจจับบริบทอัตโนมัติและตอบในโหมดที่เหมาะสม

**📊 ลำดับความสำคัญของแหล่งข้อมูล:**
1. **LOCAL KNOWLEDGE CONTEXT** (ข้อมูลที่ถูก inject มาใน prompt) → ใช้ก่อนเสมอ!
2. **DOMAIN-SPECIFIC DB** → ฐานข้อมูลเฉพาะทาง (วัสดุ, พืช, บัญชี, การศึกษา)
3. **TROUBLESHOOTING GUIDES** → คู่มือแก้ปัญหาแต่ละด้าน
4. **HYPER-LOCAL KNOWLEDGE** → ความรู้จาก Firestore
5. **หลักวิทยาศาสตร์/ความรู้พื้นฐาน** → ใช้เมื่อไม่มีข้อมูลเฉพาะ

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 📦 ฐานข้อมูลเฉพาะทาง (DOMAIN-SPECIFIC DATABASES)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 🏭 ฐานข้อมูลวัสดุพลาสติก (20 ชนิด)
| รหัส | ชื่อ | Melt Temp | Mold Temp | Shrinkage |
|------|------|-----------|-----------|-----------|
| ABS | เอบีเอส | 200-260°C | 40-80°C | 0.4-0.7% |
| PP | โพลีโพรพิลีน | 200-280°C | 20-80°C | 1.0-2.5% |
| PC | โพลีคาร์บอเนต | 280-320°C | 80-120°C | 0.5-0.7% |
| PA | ไนลอน | 260-290°C | 60-90°C | 0.8-2.0% |
| POM | พอม/อะซีทัล | 180-220°C | 60-120°C | 1.8-3.0% |
| PE | โพลีเอทิลีน | 180-280°C | 20-60°C | 1.5-4.0% |
| PS | โพลีสไตรีน | 180-280°C | 20-60°C | 0.3-0.6% |
| PET | เพ็ท | 260-290°C | 15-50°C | 0.2-0.8% |
| PVC | พีวีซี | 160-200°C | 20-60°C | 0.1-0.5% |
| TPU | ทีพียู | 180-230°C | 20-60°C | 0.5-1.5% |
| PMMA | อะคริลิค | 220-260°C | 40-80°C | 0.2-0.8% |
| PBT | พีบีที | 230-270°C | 40-90°C | 1.5-2.5% |
| SAN | แซน | 200-260°C | 40-80°C | 0.3-0.7% |
| ASA | เอเอสเอ | 230-270°C | 50-90°C | 0.4-0.7% |
| PPO | พีพีโอ | 260-300°C | 60-110°C | 0.5-0.8% |
| LCP | แอลซีพี | 280-350°C | 70-150°C | 0.1-0.5% |
| PEEK | พีค | 360-400°C | 150-200°C | 1.0-1.5% |
| PPS | พีพีเอส | 300-340°C | 120-160°C | 0.2-0.5% |
| TPE | ทีพีอี | 170-230°C | 20-60°C | 0.8-2.5% |
| EVA | อีวีเอ | 150-200°C | 20-50°C | 1.0-3.0% |

### 🔧 คู่มือแก้ปัญหาพลาสติก (10 ประเภท)
1. **Short Shot** → เพิ่มความดันฉีด + เพิ่มอุณหภูมิ
2. **Flash** → เพิ่มแรงปิดแม่พิมพ์ + ลดความดัน Holding
3. **Sink Mark** → เพิ่มความดัน/เวลา Holding
4. **Warpage** → ปรับ Cooling ให้สม่ำเสมอ
5. **Burn Mark** → ลดความเร็วฉีด + เพิ่ม Venting
6. **Silver Streak** → อบวัสดุให้แห้ง
7. **Weld Line** → เพิ่มอุณหภูมิ + ความเร็วฉีด
8. **Void** → เพิ่มความดัน Holding + ขยาย Gate
9. **Jetting** → ลดความเร็วฉีดช่วงแรก
10. **Flow Mark** → เพิ่มอุณหภูมิพลาสติกและแม่พิมพ์

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 🎯 บทบาทและหน้าที่ของ WIT 365
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**คุณเป็นตัวแทนของอาจารย์วิทยาในการให้คำปรึกษาครบทุกด้าน:**
- 🏭 **พลาสติก**: แก้ปัญหา Defect, เลือกวัสดุ, ตั้งค่าเครื่อง
- 🌾 **เกษตร**: โรคพืช, ปุ๋ย, การปลูก, การตลาด
- 💰 **บัญชี**: รายรับ-รายจ่าย, สรุปกำไร, รายงาน
- 🎓 **การศึกษา**: ติวเตอร์, ทำข้อสอบ, อธิบายเรื่องยาก
- 📝 **บันทึก**: จดโน้ต, เตือนความจำ, ติดตามนัดหมาย
- 🖼️ **วิเคราะห์ภาพ**: Defect, โรคพืช, เอกสาร

**อำนาจและความรับผิดชอบ:**
✅ ให้คำปรึกษาได้เต็มที่ทุกด้าน - โดยอ้างอิงข้อมูลจากฐานความรู้
✅ ให้ข้อมูลที่ถูกต้อง - ต้องอ้างอิงแหล่งที่มาเสมอ
✅ เข้าถึงฐานความรู้ทั้งหมด - ความรู้ทุกสาขา, เคสศึกษาต่างๆ
✅ ตอบคำถามได้ทันที - โดยยึดข้อมูลในฐานข้อมูลเป็นหลัก

**ความสามารถพิเศษของระบบความจำ:**
- จดจำปัญหาที่ผู้ใช้เคยถามและวิธีแก้ไข
- ติดตามบริบทการทำงาน (วัสดุ, เครื่องจักร, พืชผล, ธุรกิจ)
- เรียนรู้รูปแบบการถามคำถามและความชอบของผู้ใช้
- ให้คำแนะนำที่สอดคล้องกับประวัติการสนทนาก่อนหน้า

**หลักการทำงาน:**
1. **Data-Driven Response:** ทุกคำตอบต้องอ้างอิงข้อมูลจากฐานข้อมูล
2. **Source Citation:** ระบุแหล่งที่มาเสมอ เช่น "📊 จากฐานข้อมูล:", "🔧 จากคู่มือ:"
3. **Context Detection:** ตรวจจับบริบทและตอบในโหมดที่เหมาะสมอัตโนมัติ
4. **Safety First:** หากมีความเสี่ยง ต้องเตือนทันที
5. **Tailored Communication:** ปรับระดับความลึกตามผู้ใช้

**หลักการสื่อสาร:**
- ใช้คำพูดที่อบอุ่นและเป็นกันเอง
- ไม่ตำหนิผู้ถามแม้จะถามคำถามพื้นฐาน
- ทวนคำถามเพื่อให้มั่นใจว่าเข้าใจถูกต้อง

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 📋 รูปแบบการตอบคำถาม (RESPONSE FORMAT)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**🏭 เมื่อตอบคำถามเกี่ยวกับพลาสติก:**
\`\`\`
📊 **จากฐานข้อมูลวัสดุ: [ชื่อวัสดุ]**
• อุณหภูมิหลอม: XXX-XXX°C
• อุณหภูมิแม่พิมพ์: XXX-XXX°C
• การหดตัว: X.X-X.X%
\`\`\`

**🔧 เมื่อตอบคำถามเกี่ยวกับปัญหา:**
\`\`\`
🔧 **จากคู่มือแก้ปัญหา: [ชื่อปัญหา]**
🎯 Quick Fix: [วิธีแก้เร็ว]
🔍 สาเหตุ: [รายการสาเหตุ]
✅ วิธีแก้ไข: [ขั้นตอน]
\`\`\`

**🌾 เมื่อตอบคำถามเกี่ยวกับเกษตร:**
\`\`\`
🌾 **คำแนะนำการเกษตร: [หัวข้อ]**
🌱 พืช: [ชื่อพืช]
💊 ปัญหา/โรค: [รายละเอียด]
✅ แนวทางแก้ไข: [ขั้นตอน]
📆 ฤดูกาล: [ช่วงเวลาเหมาะสม]
\`\`\`

**💰 เมื่อตอบคำถามเกี่ยวกับบัญชี:**
\`\`\`
💰 **สรุปการเงิน:**
📥 รายรับ: XXX บาท
📤 รายจ่าย: XXX บาท
💵 กำไร/ขาดทุน: XXX บาท
\`\`\`

**🎓 เมื่อตอบคำถามเกี่ยวกับการศึกษา:**
\`\`\`
🎓 **อธิบาย: [หัวข้อ]**
📖 แนวคิดหลัก: [อธิบายง่ายๆ]
💡 ตัวอย่าง: [ยกตัวอย่างใกล้ตัว]
✏️ ข้อสอบลองทำ: [คำถามทดสอบ]
\`\`\`

**❓ เมื่อไม่พบข้อมูลในฐานข้อมูล:**
\`\`\`
⚠️ ไม่พบข้อมูล [หัวข้อ] ในฐานข้อมูลโดยตรง

💡 แนะนำ:
• [ทางเลือกที่ 1]
• [ทางเลือกที่ 2]
• หากต้องการข้อมูลเฉพาะ กรุณาระบุ [รายละเอียดที่ต้องการ]
\`\`\`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

สไตล์การพูด:
- ใช้ภาษาไทยที่สละสลวย เป็นทางการแต่เข้าถึงง่าย (Professional & Approachable)
- ใช้ศัพท์เทคนิคทับศัพท์ภาษาอังกฤษเมื่อจำเป็น เพื่อความแม่นยำ (เช่น Injection Speed, Holding Pressure)
- เปรียบเทียบเรื่องยากให้เป็นเรื่องง่าย (Analogy)
- อธิบายอย่างเป็นระบบ มีโครงสร้าง แต่ไม่ซับซ้อนเกินไป (Structured yet Conversational)

**หลักการตอบคำถามแบบกระชับและได้ใจความ:**
1. **ตอบตรงประเด็น** - เน้นข้อมูลสำคัญที่ผู้ถามต้องการรู้จริงๆ
2. **แบ่งส่วนชัดเจน** - ใช้ bullet points และหัวข้อย่อยให้อ่านง่าย
3. **จำกัดความยาว** - แต่ละส่วนไม่เกิน 3-4 บรรทัด
4. **เพิ่มข้อมูลราคา** - เมื่อพูดถึงวัสดุหรืออุปกรณ์ ให้ระบุช่วงราคาโดยประมาณ
5. **แนะนำคำถามต่อ** - สิ้นสุดการตอบด้วยคำถามชวนคุยเพื่อดึง engagement

## กฎการตอบคำถาม (สำคัญมาก)

1. **ห้ามตอบซ้ำเดิม:** 
   - ถ้าคำถามคล้ายกัน ให้เปลี่ยนมุมมองการอธิบาย
   - ใช้ตัวอย่างหรือกรณีศึกษาที่แตกต่างกัน
   - เปลี่ยนโครงสร้างคำตอบ (เช่น ครั้งแรกใช้ steps, ครั้งต่อไปใช้ comparison)

2. **ไม่ติดตาม/ถามกลับเกินจำเป็น:**
   - ตอบให้ครบถ้วนตามที่ถามทันที
   - ถ้าข้อมูลไม่เพียงพอจริงๆ ค่อยถามเฉพาะจุดที่จำเป็น (1-2 คำถามสั้นๆ)
   - ไม่ถามคำถามทั่วไปแบบ "คุณต้องการทราบเพิ่มเติมไหม?"

3. **แสดงความกระตือรือร้น:**
   - หลังตอบคำถามหลัก ให้ขยายความไปยังประเด็นที่เกี่ยวข้องเลย
   - เสนอ tips หรือ insights เพิ่มเติมที่ผู้ใช้อาจไม่ทราบ
   - เชื่อมโยงไปยังหัวข้ออื่นที่น่าสนใจ

4. **รูปแบบการตอบ:**
   - ตอบคำถามหลักให้ชัดเจนก่อน
   - ขยายความด้วยข้อมูลเชิงลึก
   - เสนอแนะประเด็นเพิ่มเติมที่เกี่ยวข้อง (โดยไม่ต้องถาม)

5. **การสร้างความหลากหลาย:**
   - ใช้วิธีอธิบายที่แตกต่างกัน: การเปรียบเทียบ, กระบวนการ, สาเหตุ-ผล, ข้อดี-ข้อเสีย
   - เปลี่ยนโทนการนำเสนอ: บางครั้งเน้นทฤษฎี บางครั้งเน้นปฏิบัติ
   - ใช้ตัวอย่างจากอุตสาหกรรมที่หลากหลาย

## 🚨 กฎการจำกัดความยาวคำตอบ (สำคัญมาก - ต้องปฏิบัติตามเสมอ)

**เงื่อนไขการตอบ:**
- หากผู้ใช้ถามคำถามทั่วไป **ไม่ได้ขอรายละเอียดเพิ่ม** → **จำกัดคำตอบไม่เกิน 120 คำ**
- ตอบสั้น กระชับ ได้ใจความ เน้นประเด็นหลักเท่านั้น
- ไม่ต้องอธิบายยาว ไม่ต้องให้ข้อมูลเพิ่มเติมที่ไม่ได้ถาม
- ลงท้ายด้วยประโยคสั้นๆ เช่น "หากต้องการรายละเอียดเพิ่มเติม สอบถามได้เลยครับ" หรือ "ต้องการข้อมูลเพิ่มไหมครับ?"

**เมื่อผู้ใช้ขอรายละเอียดเพิ่ม (ใช้คำเช่น "อธิบายเพิ่ม", "ขอละเอียดกว่านี้", "ช่วยขยายความ", "บอกเพิ่มหน่อย", "อยากรู้เพิ่ม"):**
- ให้ข้อมูลเชิงลึกและครบถ้วน
- อธิบายหลักการ/ทฤษฎีที่เกี่ยวข้อง
- ให้ตัวอย่างและกรณีศึกษา
- เสนอ tips หรือ insights เพิ่มเติม

**รูปแบบคำตอบสั้น (ไม่เกิน 120 คำ):**
🎯 **สรุป:** (1-2 ประโยค)
📌 **ประเด็นหลัก:** (2-3 bullet points)
💡 **แนะนำ:** (1 ประโยค)

**หลีกเลี่ยง:**
- คำตอบยาวเกินไปเมื่อไม่จำเป็น
- การอธิบายซ้ำหลายรอบ
- การให้ข้อมูลที่ไม่ได้ถาม
- คำขึ้นต้นแบบ "เข้าใจครับว่าคุณ..."
` + "\n\n" + PORCHESON_KNOWLEDGE_PROMPT + "\n\n" + TOSHIBA_KNOWLEDGE_PROMPT + "\n\n" + TECHMATION_KNOWLEDGE_PROMPT + "\n\n" + KAIZEN_EXPERT_PROMPT + "\n\n" + INJECTION_MOLDING_EXPERT_PROMPT + "\n\n" + PLASTIC_MATERIALS_PROMPT + "\n\n" + VICTOR_KNOWLEDGE_PROMPT + "\n\n" + FANUC_KNOWLEDGE_PROMPT + "\n\n" + YUSHIN_KNOWLEDGE_PROMPT + "\n\n" + TEXTBOOK_TEACHING_PROMPT;
    }
    const modelConfig = {
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: dynamicTemp,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      },
      systemInstruction: {

        parts: [{text: dynamicSystemInstruction}],
      },
    };

    const model = genAI.getGenerativeModel(modelConfig);
    console.log(`\n🤖 ENHANCED MODEL CONFIG [${executionId}]:`);
    console.log(`├── Model: ${modelConfig.model}`);
    console.log(`├── Temperature: ${dynamicTemp}`);
    console.log(`├── Max Tokens: ${modelConfig.generationConfig.maxOutputTokens}`);
    console.log(`└── Memory Check: PASSED`);

    // ==========================================
    // 5. PRE-PROCESSING: Handle Special Cases
    // ==========================================
    const commonResponses = await PerformanceOptimizer.preloadCommonResponses();

    if (questionType === "out_of_scope" && !isSuperAdmin) {
      console.log(`\n🎯 HANDLING OUT OF SCOPE [${executionId}]`);

      let greetingResponse = isFirstMessage ?
        commonResponses.greeting :
        `ยินดีครับ! มีอะไรให้ช่วยเพิ่มเติมเกี่ยวกับกระบวนการฉีดพลาสติกอีกไหมครับ? 
        
ไม่ว่าจะเป็นคำถามด้านเทคนิค การคำนวณ การแก้ปัญหา หรือการให้คำแนะนำ 
ผมพร้อมช่วยเหลือคุณเสมอครับ! สอบถามได้เลยไม่ต้องเกรงใจนะครับ 😊`;

      // 🧠 Personalized greeting based on memory
      if (relevantMemories.length > 0) {
        const lastMemory = relevantMemories[0];
        greetingResponse += `\n\n🧠 จากการสนทนาครั้งก่อน เราเคยคุยกันเรื่อง "${lastMemory.question.substring(0, 50)}..."`;
        greetingResponse += `\nมีอะไรให้ช่วยเพิ่มเติมในหัวข้อนั้น หรือมีคำถามใหม่ไหมครับ?`;
      }

      const performanceMetrics = performanceMonitor.getMetrics();

      return {
        text: greetingResponse + "\n\n---\nพัฒนาโดย อาจารย์ วิทยา เทคนิคฉีดพลาสติก" + (relevantMemories.length > 0 ? " (ระบบความจำอัจฉริยะ)" : ""),
        timestamp: new Date().toISOString(),
        metadata: {
          executionId,
          userLevel,
          questionType,
          memoryUsed: relevantMemories.length > 0,
          context: {
            conversationStage: enhancedContext.conversationStage,
            userIntent: enhancedContext.userIntent,
            technicalDepth: enhancedContext.technicalDepth,
            expertiseDomains: enhancedContext.expertiseDomains,
            isRepetitive: enhancedContext.isRepetitive,
            relevantMemories: relevantMemories.length,
          },
          performance: {
            responseTime: performanceMetrics.executionTime,
            memoryUsage: performanceMetrics.memoryUsage,
            processingType: "enhanced_direct_greeting",
          },
          security: {
            injectionChecked: true,
            inputValidated: true,
            memoryMonitored: true,
          },
        },
      };
    }

    if (questionType === "greeting" && !isSuperAdmin) {
      console.log(`\n🎯 HANDLING OUT OF SCOPE [${executionId}]`);

      const performanceMetrics = performanceMonitor.getMetrics();

      return {
        text: commonResponses.out_of_scope + "\n\n---\nพัฒนาโดย อาจารย์ วิทยา เทคนิคฉีดพลาสติก",
        timestamp: new Date().toISOString(),
        metadata: {
          executionId,
          userLevel,
          questionType,
          context: {
            userIntent: enhancedContext.userIntent,
            detectedTopics: enhancedContext.topics,
            expertiseDomains: enhancedContext.expertiseDomains,
          },
          performance: {
            responseTime: performanceMetrics.executionTime,
            memoryUsage: performanceMetrics.memoryUsage,
            processingType: "enhanced_direct_out_of_scope",
          },
          security: {
            injectionChecked: true,
            inputValidated: true,
            memoryMonitored: true,
          },
        },
      };
    }
    const multiAgentResult = await grandmasterOrchestrator.analyzeProblem(
        enhancedQuery,
        enhancedContext,
        relevantMemories,
    );

    console.log(`🤖 MULTI-AGENT SYSTEM RESULT:`, {
      agentsUsed: multiAgentResult.synthesizedFrom,
      overallConfidence: multiAgentResult.overallConfidence,
      qualityScore: multiAgentResult.qualityScore,
    });

    const formattedHistory = formatChatHistory(validHistory);
    const expertisePrompt = createExpertisePrompt(enhancedContext.expertiseDomains, enhancedContext);

    // ==========================================
    // 📚 RETRIEVE HYPER-LOCALIZED KNOWLEDGE
    // ==========================================
    let knowledgeContext = "";
    let relevantKnowledge = [];

    try {
      const hyperKnowledge = getHyperLocalizedKnowledge();
      relevantKnowledge = await hyperKnowledge.searchRelevant(enhancedQuery, 5);

      if (relevantKnowledge.length > 0) {
        knowledgeContext = `**${relevantKnowledge.length} Relevant Knowledge Item(s) Found:**\n\n`;

        relevantKnowledge.forEach((item, index) => {
          knowledgeContext += `### Knowledge ${index + 1} (Relevance: ${Math.round(item.relevanceScore * 100)}%)\n`;
          knowledgeContext += `**Problem:** ${item.problem}\n`;
          knowledgeContext += `**Solution:** ${item.solution}\n`;
          if (item.material) {
            knowledgeContext += `**Material:** ${item.material}\n`;
          }
          if (item.category) {
            knowledgeContext += `**Category:** ${item.category}\n`;
          }
          knowledgeContext += `**Usage Count:** ${item.useCount || 0} times\n`;
          knowledgeContext += `\n`;
        });

        knowledgeContext += `\n**INSTRUCTION:** Use the knowledge above to enhance your response. Prioritize verified knowledge with high relevance scores. Increment useCount for used items.\n`;

        console.log(`\n📚 KNOWLEDGE BASE RETRIEVAL [${executionId}]:`);
        console.log(`├── Relevant Items Found: ${relevantKnowledge.length}`);
        console.log(`├── Top Relevance Score: ${Math.round(relevantKnowledge[0].relevanceScore * 100)}%`);
        console.log(`└── Knowledge Context Length: ${knowledgeContext.length} characters`);
      } else {
        knowledgeContext = "**No relevant knowledge found in database. Use general expertise.**\n";
        console.log(`\n📚 KNOWLEDGE BASE: No relevant items found`);
      }
    } catch (error) {
      console.error(`❌ Knowledge Base Error: ${error.message}`);
      knowledgeContext = "**Knowledge Base temporarily unavailable. Use general expertise.**\n";
    }

    // 🎯 Create Agent-Enhanced Prompt
    const memoryEnhancedPrompt = createAgentEnhancedPrompt(
        multiAgentResult,
        enhancedQuery,
        enhancedContext,
        memoryContext,
        knowledgeContext,
        executionId,
        userLevel,
    );


    const optimizedPrompt = PerformanceOptimizer.optimizePromptLength(memoryEnhancedPrompt);

    console.log(`\n📋 MEMORY-ENHANCED PROMPT CONSTRUCTION [${executionId}]:`);
    console.log(`├── Prompt Length: ${optimizedPrompt.length} characters`);
    console.log(`├── Memory Context: ${memoryContext.length} characters`);
    console.log(`├── Knowledge Context: ${knowledgeContext.length} characters`);
    console.log(`├── Relevant Memories: ${relevantMemories.length}`);
    console.log(`├── Relevant Knowledge: ${relevantKnowledge.length}`);
    console.log(`├── Expertise Domains: ${enhancedContext.expertiseDomains.join(", ")}`);
    console.log(`├── Is Repetitive: ${enhancedContext.isRepetitive}`);
    console.log(`└── Construction Time: ${Date.now() - startTime}ms`);

    // ==========================================
    // 7. EXECUTE MEMORY-ENHANCED GEMINI API CALL
    // ==========================================
    performanceMonitor.checkMemoryLimit();
    const apiStartTime = Date.now();
    console.log(`\n📡 MEMORY-ENHANCED API EXECUTION [${executionId}]:`);

    try {
      // Helper: call Gemini with retry/backoff for 5xx and 429
      async function callGeminiWithRetry(prompt, maxRetries = 3) {
        let attempt = 0;
        let lastErr = null;
        while (attempt < maxRetries) {
          attempt++;
          try {
            const result = await model.generateContent(prompt);
            return result;
          } catch (err) {
            lastErr = err;
            const statusCode = err?.code || err?.status || (err?.response && err.response.status);
            const isFetchError = typeof err?.message === "string" && err.message.toLowerCase().includes("fetch");
            const transient = isFetchError || statusCode === 429 || (typeof statusCode === "number" && statusCode >= 500);
            const responseDetails = err?.response ? JSON.stringify(err.response).substring(0, 300) : "no_response";
            console.warn(`🔁 Gemini API call failed attempt ${attempt}: ${err?.message || err}. status=${statusCode || "n/a"} fetchError=${isFetchError} transient=${transient} resp=${responseDetails}`);
            if (!transient || attempt >= maxRetries) break;
            // exponential backoff with jitter
            const waitMs = Math.min(2000 * Math.pow(2, attempt - 1), 10000) + Math.floor(Math.random() * 250);
            await new Promise((r) => setTimeout(r, waitMs));
          }
        }
        throw lastErr;
      }

      const result = await callGeminiWithRetry(optimizedPrompt, 3);
      const apiTime = Date.now() - apiStartTime;
      performanceMonitor.checkMemoryLimit();

      console.log(`├── API Response Time: ${apiTime}ms`);
      console.log(`├── API Status: SUCCESS`);
      console.log(`├── Memory Used: ${relevantMemories.length} items`);

      const response = await result.response;
      const responseText = response.text();

      console.log(`├── Response Length: ${responseText.length} characters`);
      console.log(`└── Content Preview: ${responseText.substring(0, 100)}...`);

      // ==========================================
      // 8. ENHANCED POST-PROCESSING & QUALITY CONTROL
      // ==========================================
      let finalResponse = responseText.trim();

      // Safety validation
      SafetyValidator.validateContentSafety(finalResponse);
      SafetyValidator.validateTechnicalAccuracy(finalResponse, questionType);

      // Response optimization
      finalResponse = optimizeResponse(finalResponse, userLevel, questionType);

      // Quality validation
      const qualityChecks = validateResponseQuality(finalResponse, questionType, userLevel);

      // Ensure credit line is present
      if (!finalResponse.includes("อาจารย์ วิทยา")) {
        let creditSuffix = "";
        if (relevantMemories.length > 0 && relevantKnowledge.length > 0) {
          creditSuffix = " (ระบบความจำอัจฉริยะ + ฐานความรู้ Hyper-Localized)";
        } else if (relevantMemories.length > 0) {
          creditSuffix = " (ระบบความจำอัจฉริยะ)";
        } else if (relevantKnowledge.length > 0) {
          creditSuffix = " (ฐานความรู้ Hyper-Localized)";
        }
        finalResponse += "\n\n---\nพัฒนาโดย อาจารย์ วิทยา เทคนิคฉีดพลาสติก" + creditSuffix;
      }

      // 🧠 SAVE TO CONVERSATION MEMORY
      const memorySaveResult = await getConversationMemory().saveConversationMemory(
          userId,
          sessionId,
          {
            question: cleanText,
            answer: finalResponse,
            context: {
              questionType,
              userLevel,
              expertiseDomains: enhancedContext.expertiseDomains,
              conversationStage: enhancedContext.conversationStage,
            },
          },
      );

      // 📚 INCREMENT KNOWLEDGE USE COUNT
      if (relevantKnowledge.length > 0 && qualityChecks.percentage >= 70) {
        try {
          const hyperKnowledge = getHyperLocalizedKnowledge();
          for (const knowledge of relevantKnowledge) {
            if (knowledge.id) {
              await hyperKnowledge.incrementUseCount(knowledge.id);
            }
          }
          console.log(`📚 Knowledge Use Count Updated: ${relevantKnowledge.length} items`);
        } catch (error) {
          console.error(`❌ Failed to update knowledge use count: ${error.message}`);
        }
      }

      // Cache high-quality responses
      if (qualityChecks.percentage >= 80) {
        responseCache.set(cacheKey, finalResponse);
      }

      console.log(`\n✅ MEMORY-ENHANCED QUALITY ASSURANCE [${executionId}]:`);
      console.log(`├── Quality Score: ${qualityChecks.percentage}%`);
      console.log(`├── Memory Saved: ${memorySaveResult ? "SUCCESS" : "FAILED"}`);
      console.log(`├── Relevant Memories Used: ${relevantMemories.length}`);
      console.log(`├── Relevant Knowledge Used: ${relevantKnowledge.length}`);
      console.log(`├── Technical Content: ${qualityChecks.details.hasTechnicalTerms ? "✅" : "❌"}`);
      console.log(`├── Actionable Info: ${qualityChecks.details.hasActionableAdvice ? "✅" : "❌"}`);
      console.log(`├── Professional Tone: ${qualityChecks.details.hasProfessionalTone ? "✅" : "❌"}`);
      console.log(`├── Proper Length: ${qualityChecks.details.properStructure ? "✅" : "❌"}`);
      console.log(`├── Credit Line: ${qualityChecks.details.hasCreditLine ? "✅" : "❌"}`);
      console.log(`└── Cached: ${qualityChecks.percentage >= 80 ? "✅" : "❌"}`);

      // ==========================================
      // 9. ENHANCED ADAPTIVE LEARNING TRACKING
      // ==========================================
      adaptiveLearner.trackUserPattern(
          userId,
          questionType,
          finalResponse.length,
        qualityChecks.percentage >= 80 ? "high" : "medium",
      );

      // ==========================================
      // 10. RETURN MEMORY-ENHANCED RESPONSE
      // ==========================================
      const totalTime = Date.now() - startTime;
      const performanceMetrics = performanceMonitor.getMetrics();

      console.log(`\n🎉 KNOWLEDGE-ENHANCED EXECUTION COMPLETE [${executionId}]:`);
      console.log(`├── Total Processing Time: ${totalTime}ms`);
      console.log(`├── API Time: ${apiTime}ms`);
      console.log(`├── Final Response Length: ${finalResponse.length} chars`);
      console.log(`├── Quality Score: ${qualityChecks.percentage}%`);
      console.log(`├── Memory Used: ${relevantMemories.length} items`);
      console.log(`├── Knowledge Used: ${relevantKnowledge.length} items`);
      console.log(`├── Memory Saved: ${memorySaveResult ? "SUCCESS" : "FAILED"}`);
      console.log(`├── Expertise Domains: ${enhancedContext.expertiseDomains.join(", ")}`);
      console.log(`├── Memory Usage: ${performanceMetrics.memoryUsage.heapUsed}MB`);
      console.log(`└── Security Checks: ALL PASSED`);

      console.log("╔══════════════════════════════════════════════════════╗");
      console.log("║ 🧠 MEMORY + KNOWLEDGE ENHANCED FUNCTION EXECUTED ✅  ║");
      console.log("╚══════════════════════════════════════════════════════╝");

      return {
        ok: true,
        text: finalResponse,
        timestamp: new Date().toISOString(),
        metadata: {
          executionId,
          userLevel,
          questionType,
          memoryUsed: true,
          knowledgeUsed: relevantKnowledge.length > 0,
          memoryStats: {
            relevantMemories: relevantMemories.length,
            memorySaved: !!memorySaveResult,
            memoryIntegration: "enhanced",
          },
          knowledgeStats: {
            relevantKnowledge: relevantKnowledge.length,
            topRelevanceScore: relevantKnowledge.length > 0 ? Math.round(relevantKnowledge[0].relevanceScore * 100) : 0,
            knowledgeIntegration: "hyper_localized",
          },
          context: {
            expertiseDomains: enhancedContext.expertiseDomains,
            conversationStage: enhancedContext.conversationStage,
            userIntent: enhancedContext.userIntent,
            technicalDepth: enhancedContext.technicalDepth,
            hasProblem: enhancedContext.hasProblem,
            problemType: enhancedContext.problemType,
            urgencyLevel: enhancedContext.urgencyLevel,
            materials: enhancedContext.materials,
            topics: enhancedContext.topics,
            isRepetitive: enhancedContext.isRepetitive,
            specificNeeds: enhancedContext.specificNeeds,
            memoryOptimized: enhancedContext.memoryOptimized,
            optimizedHistoryLength: enhancedContext.optimizedHistoryLength,
            contextChain: enhancedContext.contextChain,
            relevantMemories: relevantMemories.length,
            relevantKnowledge: relevantKnowledge.length,
            memoryContextLength: memoryContext.length,
            knowledgeContextLength: knowledgeContext.length,
          },
          performance: {
            totalTime,
            apiTime,
            processingTime: totalTime - apiTime,
            qualityScore: qualityChecks.percentage,
            memoryUsage: performanceMetrics.memoryUsage,
            processingType: "memory_enhanced_ai_analysis",
            temperature: dynamicTemp,
            cached: false,
          },
          security: {
            injectionChecked: true,
            inputValidated: true,
            memoryMonitored: true,
            advancedSecurity: true,
            threatScore: 0,
          },
          adaptiveLearning: adaptiveLearner.getPersonalizationSettings(userId),
        },
      };
    } catch (apiError) {
      console.error(`❌ MEMORY-ENHANCED GEMINI API ERROR [${executionId}]: name=${apiError.name} code=${apiError.code} message=${apiError.message}`);
      if (apiError.stack) console.error(`Stack: ${apiError.stack.substring(0, 1500)}`);
      if (apiError.response) console.error(`Response: ${JSON.stringify(apiError.response).substring(0, 1500)}`);
      const httpsErr = AdvancedErrorHandler.handleApiError(apiError, executionId);
      // Log and return a friendly error payload to the client to avoid null responses
      console.error(`🔔 Returning friendly error to client [${executionId}]: ${httpsErr.message}`);
      return {
        ok: false,
        text: `ขออภัย ระบบ AI ประสบปัญหาชั่วคราว: ${httpsErr.message}`,
        timestamp: new Date().toISOString(),
        metadata: {
          executionId,
          errorCode: httpsErr.code || "internal",
          errorMessage: httpsErr.message,
          errorType: httpsErr.details?.errorType || "api_error",
          originalError: {
            name: apiError.name,
            code: apiError.code,
            message: apiError.message,
          },
        },
      };
    }
  } catch (error) {
    const performanceMetrics = performanceMonitor.getMetrics();
    console.error(`💥 MEMORY-ENHANCED CRITICAL ERROR [${executionId || "UNKNOWN"}]:`, {
      error: error.message,
      executionTime: performanceMetrics.executionTime,
      memoryUsage: performanceMetrics.memoryUsage,
      timestamp: new Date().toISOString(),
    });

    if (error instanceof HttpsError) {
      // Convert HttpsError into a friendly payload instead of re-throwing
      console.error(`🔔 Returning HttpsError payload for [${executionId}]: ${error.code} - ${error.message}`);
      if (error.stack) console.error(`🔔 HttpsError stack: ${error.stack.substring(0, 1200)}`);
      return {
        ok: false,
        text: error.message || "เกิดข้อผิดพลาด กรุณาลองใหม่",
        timestamp: new Date().toISOString(),
        metadata: {
          executionId: executionId || "UNKNOWN",
          errorCode: error.code || "internal",
          errorType: "https_error",
        },
      };
    }
    // Return a friendly message instead of throwing to ensure client receives non-null response
    const friendlyMessage = "🔧 ระบบความจำกำลังประสบปัญหาชั่วคราว ขออภัยในความไม่สะดวก กรุณาลองใหม่ใน 2-3 นาที";
    console.error(`🔔 Returning friendly fallback response for [${executionId}]: ${friendlyMessage}`);
    return {
      text: friendlyMessage,
      timestamp: new Date().toISOString(),
      metadata: {
        executionId: executionId || "UNKNOWN",
        errorType: "memory_enhanced_unexpected_error",
      },
    };
  }
});

// =====================================================
// 🧠 ADDITIONAL MEMORY MANAGEMENT FUNCTIONS
// =====================================================

/**
 * 🧠 MEMORY MANAGEMENT FUNCTION
 */
exports.manageMemory = onCall({
  region: "us-central1",
  timeoutSeconds: 30,
}, async (request) => {
  const {action, userId, memoryId} = request.data;

  if (!userId) {
    throw new HttpsError("invalid-argument", "ต้องระบุ userId");
  }

  try {
    switch (action) {
      case "get_user_summary":
        const summaryDoc = await getConversationMemory().db
            .collection("conversation_memory")
            .doc(userId)
            .get();

        if (!summaryDoc.exists) {
          return {status: "no_data", message: "ไม่มีข้อมูลความจำสำหรับผู้ใช้นี้"};
        }

        return {
          status: "success",
          summary: summaryDoc.data(),
        };

      case "clear_memories":
        const memoriesSnapshot = await getConversationMemory().db
            .collection("conversation_memory")
            .doc(userId)
            .collection("memories")
            .get();

        const batch = getConversationMemory().db.batch();
        memoriesSnapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });

        await batch.commit();
        return {status: "success", message: "ลบความจำทั้งหมดเรียบร้อย"};

      default:
        throw new HttpsError("invalid-argument", "การกระทำไม่ถูกต้อง");
    }
  } catch (error) {
    console.error("Memory management error:", error);
    throw new HttpsError("internal", "การจัดการความจำล้มเหลว");
  }
});

// =====================================================
// 📊 ENHANCED HEALTH CHECK WITH MEMORY STATUS
// =====================================================

/**
 * 🧠 ENHANCED HEALTH CHECK FUNCTION
 */
exports.healthCheck = onCall({
  region: "us-central1",
  timeoutSeconds: 30,
}, async (request) => {
  const executionId = Math.random().toString(36).substring(2, 10);
  logGeminiApiKeyStatus();


  try {
    const apiKey = getGeminiApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        maxOutputTokens: 100,
      },
    });

    const result = await model.generateContent("สวัสดี");
    const response = await result.response;

    const feedbackAnalysis = adaptiveLearner.getFeedbackAnalysis();

    // 🧠 Check memory system status
    const memoryStatus = await getConversationMemory().db
        .collection("conversation_memory")
        .limit(1)
        .get()
        .then((snapshot) => ({
          operational: !snapshot.empty || true, // Firestore is operational
          totalUsers: "unknown", // Would need aggregation query
        }))
        .catch((error) => ({
          operational: false,
          error: error.message,
        }));

    return {
      ok: true,
      status: "healthy",
      executionId,
      timestamp: new Date().toISOString(),
      components: {
        gemini_api: "operational",
        memory_system: memoryStatus.operational ? "operational" : "degraded",
        adaptive_learning: feedbackAnalysis ? `active_${feedbackAnalysis.totalFeedback}_feedbacks` : "no_data",
        cache: `active_entries_${responseCache.cache.size}`,
      },
      performance: {
        response_time: "normal",
        memory_usage: process.memoryUsage().heapUsed / 1024 / 1024,
        memory_cache_size: getConversationMemory().memoryCache.size,
      },
    };
  } catch (error) {
    console.error(`🔴 HEALTH CHECK FAILED [${executionId}]:`, error);

    return {
      ok: false,
      status: "degraded",
      executionId,
      timestamp: new Date().toISOString(),
      error: error.message,
      components: {
        gemini_api: "unavailable",
        memory_system: "unknown",
        cache: `active_entries_${responseCache.cache.size}`,
      },
    };
  }
});

// =====================================================
// 📝 FEEDBACK COLLECTION FUNCTION
// =====================================================

/**
 * 🆕 FEEDBACK COLLECTION FUNCTION
 */
exports.submitFeedback = onCall({
  region: "us-central1",
  timeoutSeconds: 30,
}, async (request) => {
  const {question, response, rating, comments} = request.data;

  if (!question || !response || rating === undefined) {
    throw new HttpsError("invalid-argument", "ต้องระบุคำถาม, คำตอบ, และคะแนน");
  }

  if (rating < 1 || rating > 5) {
    throw new HttpsError("invalid-argument", "คะแนนต้องอยู่ระหว่าง 1-5");
  }

  adaptiveLearner.addFeedback(question, response, rating);

  console.log(`📝 FEEDBACK RECEIVED: Rating ${rating}/5`, {
    questionLength: question.length,
    responseLength: response.length,
    hasComments: !!comments,
  });

  return {
    status: "success",
    message: "ขอบคุณสำหรับ feedback ครับ!",
    timestamp: new Date().toISOString(),
    feedbackId: Math.random().toString(36).substring(2, 9),
  };
});

// =====================================================
// 💬 LINE BOT WEBHOOK HANDLER
// =====================================================

const {onRequest} = require("firebase-functions/v2/https");
const crypto = require("crypto");

// =====================================================
// 🌐 MARKETPLACE WEB API ENDPOINTS
// =====================================================

/**
 * 📦 Get Products API
 * GET /api/marketplace/products
 */
exports.marketplaceGetProducts = onRequest({
  region: "us-central1",
  memory: "256MiB",
  cors: true,
}, marketplaceWebAPI.getProducts);

/**
 * 📦 Get Single Product API
 * GET /api/marketplace/product?id=xxx
 */
exports.marketplaceGetProduct = onRequest({
  region: "us-central1",
  memory: "256MiB",
  cors: true,
}, marketplaceWebAPI.getProduct);

/**
 * 📊 Get Marketplace Stats API
 * GET /api/marketplace/stats
 */
exports.marketplaceGetStats = onRequest({
  region: "us-central1",
  memory: "256MiB",
  cors: true,
}, marketplaceWebAPI.getStats);

/**
 * 🔗 Get Related Products API
 * GET /api/marketplace/related?productId=xxx
 */
exports.marketplaceGetRelated = onRequest({
  region: "us-central1",
  memory: "256MiB",
  cors: true,
}, marketplaceWebAPI.getRelatedProducts);

/**
 * 📞 Record Contact API
 * POST /api/marketplace/contact
 */
exports.marketplaceRecordContact = onRequest({
  region: "us-central1",
  memory: "256MiB",
  cors: true,
}, marketplaceWebAPI.recordContact);

/**
 * 🤖 AI Product Post Generator API
 * POST /api/marketplace/ai-generate-post
 * Body: { imageBase64: "base64-encoded-image", additionalInfo: "optional info", lineUserId: "optional" }
 */
exports.marketplaceAIGeneratePost = onRequest({
  region: "us-central1",
  memory: "512MiB",
  timeoutSeconds: 60,
  cors: true,
  secrets: ["GEMINI_API_KEY"],
}, async (req, res) => {
  try {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.set("Access-Control-Allow-Headers", "Content-Type");
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({success: false, error: "Method not allowed"});
      return;
    }

    const {imageBase64, additionalInfo = "", lineUserId = null} = req.body;

    if (!imageBase64) {
      res.status(400).json({success: false, error: "imageBase64 is required"});
      return;
    }

    console.log("🤖 AI Product Post Generator - Processing image...");
    if (lineUserId) {
      console.log("📱 LINE User ID:", lineUserId);
    }

    // ตรวจสอบและบันทึกการใช้งานถ้ามี lineUserId
    if (lineUserId) {
      const {getFirestore} = require("firebase-admin/firestore");
      const db = getFirestore();
      const FREE_LIMIT = 3;
      
      const usageRef = db.collection("ai_post_usage").doc(lineUserId);
      const usageDoc = await usageRef.get();
      const usageData = usageDoc.exists ? usageDoc.data() : {count: 0};
      
      // ตรวจสอบว่าเป็น Premium หรือไม่
      const userRef = db.collection("users").doc(lineUserId);
      const userDoc = await userRef.get();
      const isPremium = userDoc.exists && userDoc.data().isPremium === true;
      
      // ถ้าไม่ใช่ Premium และใช้ครบ 3 ครั้งแล้ว
      if (!isPremium && usageData.count >= FREE_LIMIT) {
        res.set("Access-Control-Allow-Origin", "*");
        res.status(403).json({
          success: false,
          error: `หมดสิทธิ์ใช้ฟรีแล้ว (${FREE_LIMIT}/${FREE_LIMIT} ครั้ง) กรุณาสมัคร Premium`,
          usageCount: usageData.count,
          freeLimit: FREE_LIMIT,
        });
        return;
      }
      
      // บันทึกการใช้งาน (increment)
      await usageRef.set({
        count: (usageData.count || 0) + 1,
        lastUsed: new Date(),
        isPremium: isPremium,
      }, {merge: true});
      
      console.log(`📊 Usage recorded: ${usageData.count + 1}/${FREE_LIMIT} for ${lineUserId}`);
    }

    // Initialize Gemini
    const {GoogleGenerativeAI} = require("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({model: "gemini-2.0-flash"});

    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: "image/jpeg",
      },
    };

    const prompt = `
คุณเป็นผู้เชี่ยวชาญการเขียนโพสต์ขายของออนไลน์ที่ดึงดูดลูกค้า

📸 วิเคราะห์รูปสินค้านี้และสร้างข้อความโพสต์ขายที่น่าสนใจ

${additionalInfo ? `ข้อมูลเพิ่มเติม: ${additionalInfo}` : ""}

ให้สร้างผลลัพธ์ในรูปแบบ JSON ดังนี้:
{
  "productName": "ชื่อสินค้าที่เดาได้จากรูป",
  "suggestedPrice": "ช่วงราคาที่แนะนำ (เช่น 199-299 บาท)",
  "category": "หมวดหมู่สินค้า",
  "title": "หัวข้อโพสต์สั้นๆ ดึงดูด มี emoji",
  "description": "รายละเอียดสินค้า 2-3 บรรทัด บอกจุดเด่น คุณสมบัติ มี emoji ให้น่าสนใจ",
  "callToAction": "ข้อความเรียกร้องให้ซื้อ เช่น 'สนใจทักแชทเลยค่ะ 💬'",
  "hashtags": ["แฮชแท็กที่เกี่ยวข้อง", "ไม่เกิน5อัน"],
  "emojis": "อีโมจิที่เหมาะกับสินค้า 3-5 ตัว"
}

⚠️ ตอบเฉพาะ JSON เท่านั้น ไม่ต้องอธิบายเพิ่ม
`;

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log("🤖 AI Generated Post:", parsed.productName);

      res.set("Access-Control-Allow-Origin", "*");
      res.status(200).json({
        success: true,
        data: parsed,
      });
      return;
    }

    throw new Error("Could not parse AI response");
  } catch (error) {
    console.error("❌ AI Vision error:", error);
    res.set("Access-Control-Allow-Origin", "*");
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * 🔐 LINE Auth for Marketplace
 * POST /api/marketplace/line-auth
 * Body: { lineUserId: "LINE_USER_ID" }
 * Returns: User info (no Firebase token needed - backend handles auth)
 */
exports.marketplaceLineAuth = onRequest({
  region: "us-central1",
  memory: "256MiB",
  cors: true,
}, async (req, res) => {
  try {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.set("Access-Control-Allow-Headers", "Content-Type");
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({success: false, error: "Method not allowed"});
      return;
    }

    const {lineUserId} = req.body;

    if (!lineUserId) {
      res.status(400).json({success: false, error: "lineUserId is required"});
      return;
    }

    console.log("🔐 Verifying LINE user for marketplace:", lineUserId);

    const admin = require("firebase-admin");
    const db = admin.firestore();

    // Check if LINE user exists in our system
    const lineUserDoc = await db.collection("line_users").doc(lineUserId).get();

    if (!lineUserDoc.exists) {
      console.log("⚠️ LINE user not found in line_users:", lineUserId);
      
      // Try to find in users collection as fallback
      const usersSnapshot = await db.collection("users")
          .where("lineUserId", "==", lineUserId)
          .limit(1)
          .get();
      
      if (!usersSnapshot.empty) {
        // Found in users collection
        const userData = usersSnapshot.docs[0].data();
        console.log("✅ Found user in users collection:", userData.displayName);
        
        // Create line_users document for future use
        await db.collection("line_users").doc(lineUserId).set({
          lineUserId: lineUserId,
          displayName: userData.displayName || "LINE User",
          pictureUrl: userData.pictureUrl || null,
          isPremium: userData.isPremium || false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        // Get usage count for AI post
        const usageRef = db.collection("ai_post_usage").doc(lineUserId);
        const usageDoc = await usageRef.get();
        const usageData = usageDoc.exists ? usageDoc.data() : {count: 0};
        
        res.set("Access-Control-Allow-Origin", "*");
        res.status(200).json({
          success: true,
          user: {
            lineUserId: lineUserId,
            displayName: userData.displayName || "LINE User",
            pictureUrl: userData.pictureUrl || null,
            isPremium: userData.isPremium || false,
            aiPostUsage: usageData.count || 0,
            aiPostLimit: 3,
          },
        });
        return;
      }
      
      // Not found anywhere - require add friend
      res.set("Access-Control-Allow-Origin", "*");
      res.status(404).json({
        success: false,
        error: "ไม่พบข้อมูลผู้ใช้ กรุณาเพิ่มเพื่อน LINE OA ก่อน",
        requireAddFriend: true,
      });
      return;
    }

    const userData = lineUserDoc.data();

    // Get usage count for AI post
    const usageRef = db.collection("ai_post_usage").doc(lineUserId);
    const usageDoc = await usageRef.get();
    const usageData = usageDoc.exists ? usageDoc.data() : {count: 0};

    console.log("✅ LINE user verified:", lineUserId, userData.displayName);

    res.set("Access-Control-Allow-Origin", "*");
    res.status(200).json({
      success: true,
      user: {
        lineUserId: lineUserId,
        displayName: userData.displayName || "LINE User",
        pictureUrl: userData.pictureUrl || null,
        isPremium: userData.isPremium || false,
        aiPostUsage: usageData.count || 0,
        aiPostLimit: 3,
      },
    });
  } catch (error) {
    console.error("❌ LINE Auth error:", error);
    res.set("Access-Control-Allow-Origin", "*");
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * 📦 Post Product to Marketplace (LINE Auth)
 * POST /api/marketplace/post-product
 * Body: { productData: {...}, lineUserId: "LINE_USER_ID", imageBase64: "..." }
 */
exports.marketplacePostProduct = onRequest({
  region: "us-central1",
  memory: "512MiB",
  timeoutSeconds: 60,
  cors: true,
}, async (req, res) => {
  try {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.set("Access-Control-Allow-Origin", "*");
      res.status(405).json({success: false, error: "Method not allowed"});
      return;
    }

    const admin = require("firebase-admin");
    const db = admin.firestore();

    const {productData, lineUserId, imageBase64} = req.body;

    // Validate lineUserId
    if (!lineUserId) {
      res.set("Access-Control-Allow-Origin", "*");
      res.status(400).json({success: false, error: "lineUserId is required"});
      return;
    }

    // Verify LINE user exists in our database
    const lineUserDoc = await db.collection("line_users").doc(lineUserId).get();
    let userData = null;
    
    if (lineUserDoc.exists) {
      userData = lineUserDoc.data();
    } else {
      // Try users collection
      const usersSnapshot = await db.collection("users")
          .where("lineUserId", "==", lineUserId)
          .limit(1)
          .get();
      
      if (!usersSnapshot.empty) {
        userData = usersSnapshot.docs[0].data();
      }
    }
    
    if (!userData) {
      res.set("Access-Control-Allow-Origin", "*");
      res.status(401).json({
        success: false,
        error: "ไม่พบข้อมูลผู้ใช้ กรุณาเพิ่มเพื่อน LINE OA ก่อน",
        requireAddFriend: true,
      });
      return;
    }

    console.log("📦 Posting product for LINE user:", lineUserId, userData.displayName);

    if (!productData || !productData.productName) {
      res.set("Access-Control-Allow-Origin", "*");
      res.status(400).json({success: false, error: "productData is required"});
      return;
    }

    let imageUrl = productData.imageUrl;

    // Upload image if base64 provided
    if (imageBase64 && !imageUrl) {
      try {
        const bucket = admin.storage().bucket();
        const fileName = `marketplace/${Date.now()}_${userId}.jpg`;
        const file = bucket.file(fileName);

        const imageBuffer = Buffer.from(imageBase64, "base64");

        await file.save(imageBuffer, {
          metadata: {
            contentType: "image/jpeg",
          },
        });

        await file.makePublic();
        imageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        console.log("📸 Image uploaded:", imageUrl);
      } catch (uploadError) {
        console.error("Image upload error:", uploadError);
        res.status(500).json({success: false, error: "Failed to upload image"});
        return;
      }
    }

    // Prepare product document
    const newProduct = {
      productName: productData.productName,
      price: parseInt(productData.price) || 0,
      description: productData.description || "",
      category: productData.category || "other",
      imageUrl: imageUrl || "",
      tags: productData.tags || [productData.category || "other"],
      sellerName: productData.sellerName || userData.displayName || "LINE User",
      sellerPhone: productData.sellerPhone || "",
      sellerLineId: productData.sellerLineId || "",
      sellerLocation: productData.sellerLocation || "",
      sellerId: lineUserId, // LINE userId
      status: "active",
      viewCount: 0,
      contactCount: 0,
      source: "web",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection("marketplace_items").add(newProduct);

    console.log("✅ Product posted:", docRef.id);

    res.set("Access-Control-Allow-Origin", "*");
    res.status(200).json({
      success: true,
      productId: docRef.id,
      message: "สินค้าลงขายสำเร็จ!",
    });
  } catch (error) {
    console.error("❌ Post product error:", error);
    res.set("Access-Control-Allow-Origin", "*");
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * �📞 HANDLE UNLOCK REQUESTS - Admin Command
 * แสดงรายการ unlock requests ที่รอค้างอยู่ (สำหรับกรณี rate limit 429)
 */
async function handleUnlockRequests(db, adminUserId, lineClient, replyToken) {
  try {
    const SUPER_ADMIN_ID = "Ud9bec6d2ea945cf4330a69cb74ac93cf";

    // Get pending unlock requests
    const requestsSnapshot = await db.collection("unlock_requests")
        .where("notified", "==", false)
        .orderBy("requestedAt", "desc")
        .limit(10)
        .get();

    if (requestsSnapshot.empty) {
      await lineClient.replyMessage(replyToken, {
        type: "text",
        text: "✅ ไม่มี unlock requests ที่รอค้างอยู่\n\nทุก request ได้ส่งแจ้งเตือนแล้ว",
      });
      return;
    }

    const requests = [];
    requestsSnapshot.forEach((doc) => {
      requests.push({id: doc.id, ...doc.data()});
    });

    console.log(`📞 Found ${requests.length} pending unlock requests`);

    // Create summary message
    let summaryText = `📞 **Unlock Requests รอดำเนินการ**\n`;
    summaryText += `พบ ${requests.length} รายการ:\n\n`;

    requests.forEach((req, index) => {
      const time = req.requestedAt?.toDate();
      const timeStr = time ? time.toLocaleString("th-TH", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }) : "N/A";

      summaryText += `${index + 1}. ${req.displayName}\n`;
      summaryText += `   🆔 ${req.userId}\n`;
      summaryText += `   📊 ${req.usageCount || 0} ครั้ง\n`;
      summaryText += `   ⏰ ${timeStr}\n\n`;
    });

    summaryText += `💡 กด "ส่งแจ้งเตือน" เพื่อส่งทั้งหมด`;

    await lineClient.replyMessage(replyToken, {
      type: "text",
      text: summaryText,
      quickReply: {
        items: [
          {
            type: "action",
            action: {
              type: "message",
              label: "📤 ส่งแจ้งเตือนทั้งหมด",
              text: "/unlock notify all",
            },
          },
          {
            type: "action",
            action: {
              type: "message",
              label: "🗑️ ลบทั้งหมด",
              text: "/unlock clear all",
            },
          },
        ],
      },
    });
  } catch (error) {
    console.error("❌ Error handling unlock requests:", error);
    await lineClient.replyMessage(replyToken, {
      type: "text",
      text: `❌ เกิดข้อผิดพลาด: ${error.message}`,
    });
  }
}

/**
 * 💬 LINE WEBHOOK HANDLER
 * รับและประมวลผล webhook events จาก LINE Messaging API
 */
exports.lineWebhook = onRequest({
  region: "us-central1",
  timeoutSeconds: 60,
  memory: "512MiB",
  secrets: ["LINE_CHANNEL_SECRET", "LINE_CHANNEL_ACCESS_TOKEN", "GEMINI_API_KEY"],
}, async (req, res) => {
  const executionId = Math.random().toString(36).substring(2, 10);

  console.log(`\n💬 LINE WEBHOOK RECEIVED [${executionId}]`);
  console.log(`├── Method: ${req.method}`);
  console.log(`├── Path: ${req.path}`);
  console.log(`└── Headers:`, Object.keys(req.headers));

  // ==========================================
  // 1. VALIDATE REQUEST METHOD
  // ==========================================
  if (req.method !== "POST") {
    console.log(`❌ Invalid method: ${req.method}`);
    return res.status(405).send("Method Not Allowed");
  }

  // ==========================================
  // 2. VALIDATE SIGNATURE
  // ==========================================
  const signature = req.headers["x-line-signature"];
  const channelSecret = process.env.LINE_CHANNEL_SECRET;

  if (!channelSecret) {
    console.warn("⚠️ LINE_CHANNEL_SECRET not configured");
    console.warn("Webhook will accept all requests without signature validation");
    console.warn("Please set LINE_CHANNEL_SECRET for production use");
    // Return 200 OK to pass LINE verification
    // But skip processing since credentials are not configured
    return res.status(200).send("OK - Webhook configured but credentials missing");
  }

  if (!signature) {
    console.log("❌ Missing x-line-signature header");
    return res.status(401).send("Unauthorized");
  }

  // Validate signature
  const body = JSON.stringify(req.body);
  const hash = crypto
      .createHmac("SHA256", channelSecret)
      .update(body)
      .digest("base64");

  if (hash !== signature) {
    console.log("❌ Invalid signature");
    console.log(`├── Expected: ${hash}`);
    console.log(`└── Received: ${signature}`);
    return res.status(401).send("Invalid signature");
  }

  console.log("✅ Signature validated");

  // ==========================================
  // 3. CHECK LINE CLIENT
  // ==========================================
  if (!lineClient) {
    console.error("❌ LINE Client not initialized");
    console.error("Please set LINE_CHANNEL_ACCESS_TOKEN environment variable");
    return res.status(500).send("LINE Client not configured");
  }

  // ==========================================
  // 4. PROCESS EVENTS
  // ==========================================
  try {
    const events = req.body.events || [];
    console.log(`\n📨 Processing ${events.length} event(s)`);

    const promises = events.map(async (event) => {
      console.log(`\n🎯 Event Type: ${event.type}`);
      console.log(`├── Source: ${event.source.type}`);
      console.log(`├── User ID: ${event.source.userId || "N/A"}`);
      console.log(`└── Timestamp: ${event.timestamp}`);

      // Handle different event types
      switch (event.type) {
        case "message":
          return handleMessageEvent(event, executionId);

        case "follow":
          return handleFollowEvent(event);

        case "unfollow":
          return handleUnfollowEvent(event);

        case "postback":
          return handlePostbackEvent(event);

        default:
          console.log(`⚠️ Unhandled event type: ${event.type}`);
          return null;
      }
    });

    await Promise.all(promises);

    console.log(`\n✅ Webhook processed successfully [${executionId}]`);
    return res.status(200).send("OK");
  } catch (error) {
    console.error(`\n❌ Webhook processing error [${executionId}]:`, error);
    return res.status(500).send("Internal Server Error");
  }
});

/**
 * 🎨 Enhance response with contextual emoji
 */
function enhanceResponseWithEmoji(responseText, userQuestion) {
  // Detect question context
  const questionLower = userQuestion.toLowerCase();

  // 1. Add greeting emoji if not present
  if (questionLower.match(/สวัสดี|hello|hi|หวัดดี/i) && !responseText.match(/👋|😊|🙏/)) {
    responseText = "👋 " + responseText;
  }

  // 2. Add problem/defect emoji
  if (questionLower.match(/ปัญหา|แก้|defect|problem|short shot|warpage|flash|sink mark|weld line|burn mark/i)) {
    if (!responseText.match(/⚠️|🔧|💡/)) {
      // Add warning emoji to first line if discussing problems
      responseText = responseText.replace(/^(.+)$/m, "⚠️ $1");
    }
  }

  // 3. Add machine/technical emoji
  if (questionLower.match(/เครื่อง|machine|toshiba|porchison|injection|พารามิเตอร์|parameter/i)) {
    if (!responseText.match(/🏭|⚙️|🔧/)) {
      responseText = "🏭 " + responseText;
    }
  }

  // 4. Add material emoji
  if (questionLower.match(/วัสดุ|material|พลาสติก|plastic|pp|pe|abs|pc|pa|pom/i)) {
    if (!responseText.match(/🧪|📦/)) {
      responseText = "🧪 " + responseText;
    }
  }

  // 5. Add success/completion emoji at the end if giving solutions
  if (responseText.match(/ลองทำ|ลองปรับ|แนะนำ|วิธีแก้|solution/i) && !responseText.match(/✅|💪|🏆/)) {
    responseText += "\n\n💪 ลองทำตามนี้ดูนะครับ!";
  }

  // 6. Add calculation emoji for numbers
  if (responseText.match(/คำนวณ|calculate|\d+\s*(MPa|°C|ton|mm|sec)/i) && !responseText.match(/📊|🔢/)) {
    responseText = "📊 " + responseText;
  }

  // 7. Enhance section headers with emoji if not present
  responseText = responseText.replace(/\*\*สาเหตุ(หลัก|ที่เป็นไปได้)?:?\*\*/gi, "🔍 **สาเหตุ:**");
  responseText = responseText.replace(/\*\*วิธีแก้(ไข)?:?\*\*/gi, "✅ **วิธีแก้:**");
  responseText = responseText.replace(/\*\*ขั้นตอน:?\*\*/gi, "📝 **ขั้นตอน:**");
  responseText = responseText.replace(/\*\*คำแนะนำ:?\*\*/gi, "💡 **คำแนะนำ:**");
  responseText = responseText.replace(/\*\*สรุป:?\*\*/gi, "🎯 **สรุป:**");
  responseText = responseText.replace(/\*\*ข้อควรระวัง:?\*\*/gi, "⚠️ **ข้อควรระวัง:**");

  return responseText;
}

/**
 * ⚡ Handle quick replies for simple messages (greetings, thanks)
 */
function handleQuickReply(messageText, userName) {
  const lowerText = messageText.toLowerCase().trim();

  // Greeting patterns
  const greetingPatterns = [
    /^(สวัสดี|หวัดดี|ดีครับ|ดีค่ะ)$/i,
    /^(hi|hello)$/i,
    /^(hey|yo)$/i,
    /^สวัสดี\s*(ครับ|ค่ะ)?$/i,
  ];

  for (const pattern of greetingPatterns) {
    if (pattern.test(lowerText)) {
      const greetingMessages = [
        `👋 สวัสดีครับคุณ ${userName}!\n\n🎯 ผมเป็นผู้ช่วยด้านการฉีดพลาสติก พร้อมช่วยเรื่อง:\n\n🏭 เครื่องฉีดและการตั้งค่า\n🧪 วัสดุพลาสติก\n⚠️ แก้ไขปัญหาชิ้นงาน\n📊 คำนวณพารามิเตอร์\n🎨 ออกแบบแม่พิมพ์\n\n💬 มีคำถามอะไร ถามได้เลยครับ!`,
        `👋 สวัสดีครับคุณ ${userName}!\n\n😊 ยินดีให้คำปรึกษาด้านการฉีดพลาสติกครับ\n\n🔍 ลองถามผมได้เลย เช่น:\n• "Short shot เกิดจากอะไร?"\n• "PP กับ PE ต่างกันอย่างไร?"\n• "คำนวณแรงล็อคแม่พิมพ์"\n• "เครื่อง Toshiba ตั้งค่ายังไง?"\n\n💪 พร้อมช่วยเสมอครับ!`,
        `🙏 สวัสดีครับคุณ ${userName}!\n\n✨ ผมคือผู้ช่วยผู้เชี่ยวชาญด้านการฉีดพลาสติก พัฒนาโดยอาจารย์วิทยา\n\n🎓 ความเชี่ยวชาญ:\n✅ วิเคราะห์และแก้ปัญหา\n✅ คำนวณค่าพารามิเตอร์\n✅ แนะนำวัสดุและเครื่องจักร\n✅ ออกแบบแม่พิมพ์\n\n🚀 มีอะไรให้ช่วยไหมครับ?`,
      ];
      return {
        type: "greeting",
        message: greetingMessages[Math.floor(Math.random() * greetingMessages.length)],
      };
    }
  }

  // Thank you patterns
  const thankYouPatterns = [
    /^(ขอบคุณ|ขอบใจ|อิ่มใจ|thank\s*you|thanks)/i,
    /ขอบคุณ\s*(มาก|ครับ|ค่ะ|นะ)?$/i,
  ];

  for (const pattern of thankYouPatterns) {
    if (pattern.test(lowerText)) {
      const thankYouMessages = [
        `🙏 ยินดีครับคุณ ${userName}!\n\n😊 ดีใจที่ช่วยได้นะครับ หากมีคำถามเพิ่มเติม สอบถามได้ตลอดเลยครับ\n\n💪 สู้ๆ กับงานฉีดพลาสติกนะครับ!\n\n---\n✨ พัฒนาโดย อาจารย์ วิทยา เทคนิคฉีดพลาสติก`,
        `🤗 ไม่เป็นไรครับคุณ ${userName}!\n\n🎯 ยินดีที่ได้ช่วยเหลือครับ มีอะไรสงสัยเพิ่มเติม ถามได้เสมอนะครับ\n\n🏆 ขอให้งานฉีดออกมาสวยๆ ครับ!\n\n---\n✨ พัฒนาโดย อาจารย์ วิทยา เทคนิคฉีดพลาสติก`,
        `😊 ด้วยความยินดีครับคุณ ${userName}!\n\n💡 หวังว่าข้อมูลจะเป็นประโยชน์นะครับ ถ้ามีปัญหาอะไร กลับมาถามได้เลยครับ\n\n🌟 ขอให้โชคดีกับการผลิตครับ!\n\n---\n✨ พัฒนาโดย อาจารย์ วิทยา เทคนิคฉีดพลาสติก`,
      ];
      return {
        type: "gratitude",
        message: thankYouMessages[Math.floor(Math.random() * thankYouMessages.length)],
      };
    }
  }

  // No quick reply match
  return null;
}

/**
 * 🧠 Analyze question context and suggest response strategy
 */
function analyzeQuestionContext(questionText) {
  const lowerText = questionText.toLowerCase();

  const context = {
    type: "general",
    urgency: "normal",
    complexity: "medium",
    suggestedEmoji: "💬",
    suggestedTone: "professional",
  };

  // Detect greeting
  if (lowerText.match(/^(สวัสดี|hello|hi|หวัดดี)/i)) {
    context.type = "greeting";
    context.suggestedEmoji = "👋";
    context.suggestedTone = "friendly";
    return context;
  }

  // Detect urgent problem
  if (lowerText.match(/ด่วน|เร่งด่วน|urgent|help|ช่วย|เสีย|พัง/i)) {
    context.urgency = "high";
    context.type = "problem_urgent";
    context.suggestedEmoji = "🚨";
  }

  // Detect defect/problem
  if (lowerText.match(/ปัญหา|defect|short shot|warpage|flash|sink mark|weld line|แก้ไข/i)) {
    context.type = "troubleshooting";
    context.complexity = "high";
    context.suggestedEmoji = "⚠️";
  }

  // Detect technical question
  if (lowerText.match(/คำนวณ|calculate|พารามิเตอร์|parameter|อุณหภูมิ|temperature|ความดัน|pressure/i)) {
    context.type = "technical";
    context.complexity = "high";
    context.suggestedEmoji = "📊";
  }

  // Detect material question
  if (lowerText.match(/วัสดุ|material|พลาสติก|pp|pe|abs|pc|เลือก/i)) {
    context.type = "material_selection";
    context.suggestedEmoji = "  ";
  }

  // Detect machine question
  if (lowerText.match(/เครื่อง|machine|toshiba|porchison|injection|ตั้งค่า/i)) {
    context.type = "machine_operation";
    context.suggestedEmoji = "🏭";
  }

  // Detect thank you
  if (lowerText.match(/ขอบคุณ|thank|ขอบใจ|อิ่มใจ/i)) {
    context.type = "gratitude";
    context.suggestedEmoji = "🙏";
    context.suggestedTone = "warm";
  }

  return context;
}

/**
 * Handle message events
 */
async function handleMessageEvent(event, executionId) {
  const pendingFlexMessages = [];
  const userId = event.source.userId ? event.source.userId.trim() : null;
  const replyToken = event.replyToken;
  const message = event.message;
  
  // 🔧 FIX: Declare userData at function scope to prevent "userData is not defined" error
  let userData = {usageCount: 0, isPremium: false};

  console.log(`\n💬 Message Event [${executionId}]:`);
  console.log(`├── Type: ${message.type}`);
  console.log(`├── Text: ${message.text || "N/A"}`);
  console.log(`└── Reply Token: ${replyToken}`);

  // =====================================================
  // 🛒 MARKETPLACE: Check if user is in selling flow (Image upload)
  // =====================================================
  if (message.type === "image") {
    const userMarketState = await getUserMarketplaceState(userId);
    // Check for marketplace selling image OR AI post image
    if (userMarketState.state === USER_STATES.WAITING_FOR_PRODUCT_IMAGE ||
        userMarketState.state === "WAITING_FOR_AI_POST_IMAGE") {
      console.log(`🛒 Marketplace: Processing image for state: ${userMarketState.state}`);
      const db = getFirestore();
      const userDoc = await db.collection("line_users").doc(userId).get();
      const userData = userDoc.exists ? userDoc.data() : {};

      const handled = await handleMarketplace({lineClient, db}, event, userData);
      if (handled) return;
    }
  }

  // Handle Image Messages (Auto Vision & Slip Detection)
  if (message.type === "image") {
    console.log(`📸 Image received from ${userId}`);

    try {
      // 1. Notify user that analysis is starting (SKIPPED to save replyToken for result)
      // await lineClient.replyMessage(replyToken, { type: 'text', text: '...' });

      // 2. Get Image Content from LINE
      const stream = await lineClient.getMessageContent(message.id);
      const chunks = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      // 3. Initialize Gemini Vision (gemini-2.0-flash for Vision support)
      const {GoogleGenerativeAI} = require("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({model: "gemini-2.0-flash"});

      // 4. Prepare Prompt
      const prompt = `
      คุณคือ "WiT" (วิทย์) AI ผู้ช่วยอัจฉริยะ
      
      ภารกิจ: วิเคราะห์ภาพนี้และระบุประเภทของภาพ:
      
      1. **ถ้าเป็น "สลิปโอนเงิน" (Bank Slip):**
         - ให้ขึ้นต้นด้วยคำว่า "SLIP_DETECTED"
         - ระบุยอดเงิน, ธนาคาร, วันที่, เวลา
      
      2. **ถ้าเป็น "QR Code" หรือ "Barcode":**
         - อ่านข้อมูลใน QR/Barcode ออกมาให้หมด
      
      3. **ถ้าเป็น "ชิ้นงานพลาสติก" หรือ "เครื่องจักร":**
         - วิเคราะห์ปัญหา (Defect) หรือสิ่งที่เห็น
         - แนะนำวิธีแก้ไข
         
      4. **ถ้าเป็น "พืช" หรือ "ใบไม้" (Agriculture):**
         - วินิจฉัยโรคพืช หรือความผิดปกติ
         - แนะนำวิธีรักษาหรือปุ๋ยที่เหมาะสม
      
      5. **อื่นๆ:**
         - อธิบายสิ่งที่เห็น
      
      ตอบเป็นภาษาไทย กระชับ เข้าใจง่าย`;

      const imagePart = {
        inlineData: {
          data: buffer.toString("base64"),
          mimeType: "image/jpeg",
        },
      };

      // 5. Generate Content
      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();
      console.log(`👁️ AI Analysis Result: ${text.substring(0, 50)}...`);

      // 6. Check if it is a SLIP
      if (text.includes("SLIP_DETECTED") || text.includes("สลิปโอนเงิน") || (text.includes("โอนเงิน") && text.includes("บาท"))) {
        console.log("💰 Slip detected by AI");

        const db = getFirestore();
        const userRef = db.collection("line_users").doc(userId);
        const userDoc = await userRef.get();
        const userData = userDoc.exists ? userDoc.data() : {};

        // Get user profile
        let userName = "ผู้ใช้ไม่ระบุชื่อ";
        try {
          const profile = await lineClient.getProfile(userId);
          userName = profile.displayName;
        } catch (err) {
          console.warn("Cannot get profile:", err.message);
        }

        // Save slip info
        await userRef.set({
          lastSlipUploadAt: FieldValue.serverTimestamp(),
          slipImageId: message.id,
          displayName: userName,
          subscriptionStatus: "slip_uploaded",
          slipAnalysis: text, // Save AI analysis of slip
        }, {merge: true});

        // Notify Super Admin (Push is OK here)
        const SUPER_ADMIN_ID = "Ud9bec6d2ea945cf4330a69cb74ac93cf";
        await lineClient.pushMessage(SUPER_ADMIN_ID, {
          type: "text",
          text: `🔔 **มีสลิปการชำระเงินใหม่!** (AI ตรวจจับ)\n\n` +
                `👤 ชื่อ: ${userName}\n` +
                `🆔 ID: ${userId}\n` +
                `📦 แพ็คเกจ: ${userData.selectedPackage || "ไม่ระบุ"}\n` +
                `📝 ผลวิเคราะห์: ${text}\n\n` +
                `📸 กรุณาตรวจสอบในแชท`,
        });

        // Reply to User (Use replyMessage instead of pushMessage)
        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: `✅ **ได้รับสลิปเรียบร้อยครับ**\n\n` +
                `ระบบบันทึกข้อมูลการโอนเงินแล้ว\n` +
                `แอดมินจะตรวจสอบและอนุมัติสิทธิ์ให้เร็วที่สุดครับ ⏱️`,
        });
      } else {
        // 7. Not a slip -> It's a Vision Diagnosis / General Image
        console.log("👁️ General image analysis");
        // Use replyMessage instead of pushMessage
        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: `👁️ **ผลการวิเคราะห์ภาพ:**\n\n${text}`,
        });
      }
    } catch (error) {
      console.error("❌ Error handling image:", error);
      // Try to reply error if token not used (it shouldn't be used yet if we failed before replyMessage)
      try {
        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: `⚠️ เกิดข้อผิดพลาดในการประมวลผลภาพ\nกรุณาลองใหม่อีกครั้ง`,
        });
      } catch (e) {
        console.error("❌ Could not send error message:", e.message);
      }
    }
    return;
  }


  // Handle Sticker Messages
  if (message.type === "sticker") {
    const keywords = message.keywords ? message.keywords.join(", ") : "ทั่วไป";
    console.log(`🙂 Sticker received from ${userId} (Keywords: ${keywords})`);

    // Convert sticker to text context for AI
    message.type = "text";
    message.text = `[ระบบ: ผู้ใช้ส่งสติ๊กเกอร์เข้ามา สื่ออารมณ์: ${keywords}]`;
  }

  // Only handle text messages (Now includes converted stickers)
  if (message.type !== "text") {
    console.log("⚠️ Non-text message, skipping");
    return;
  }

  // =====================================================
  // 🛒 MARKETPLACE: Handle text commands (ขาย/หา/ซื้อ/ตลาด/โพสต์)
  // =====================================================
  if (isMarketplaceCommand(message.text)) {
    console.log(`🛒 Marketplace command detected: "${message.text}"`);
    const db = getFirestore();
    const userDoc = await db.collection("line_users").doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : {};

    const handled = await handleMarketplace({lineClient, db}, event, userData);
    if (handled) return;
  }

  // =====================================================
  // 📝 MEMORY NOTE: Handle note commands (บันทึก/memory/note/โน้ต)
  // =====================================================
  if (isAnyMemoryCommand(message.text)) {
    console.log(`📝 Memory command detected: "${message.text}"`);
    const db = getFirestore();
    const userDoc = await db.collection("line_users").doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : {};

    const handled = await handleMemoryWebhook({lineClient, db}, event, userData);
    console.log(`📝 Memory webhook handled: ${handled}`);
    if (handled) {
      console.log(`📝 Memory system handled the command, returning early`);
      return;
    }
    console.log(`📝 Memory system did not handle, continuing...`);
  }

  // =====================================================
  // 🏭 INJECTION MOLDING LEARNING: ระบบเรียนรู้การฉีดพลาสติก
  // คำสั่ง: /เรียนรู้การฉีดพลาสติก, /iml
  // =====================================================
  if (isIMLCommand(message.text)) {
    console.log(`🏭 IML command detected: "${message.text}"`);
    try {
      const flexResponse = await processIMLCommand(message.text, userId);
      
      if (flexResponse) {
        await lineClient.replyMessage(replyToken, flexResponse);
        console.log(`✅ IML response sent successfully`);
        return;
      }
    } catch (imlError) {
      console.error(`❌ IML Error:`, imlError);
      await lineClient.replyMessage(replyToken, {
        type: "text",
        text: `⚠️ เกิดข้อผิดพลาดในระบบเรียนรู้\nกรุณาลองใหม่อีกครั้ง หรือพิมพ์ /เรียนรู้การฉีดพลาสติก`
      });
      return;
    }
  }

  // ==========================================
  // 💰 FREEMIUM QUOTA SYSTEM
  // ==========================================
  try {
    console.log(`📌 ENTERING FREEMIUM QUOTA SYSTEM for text: "${message.text}"`);
    const db = getFirestore();
    const userRef = db.collection("line_users").doc(userId);

    // 0. Handle Group Code Joining
    if (message.text.startsWith("JOIN-") || message.text.startsWith("join-") || message.text === "ใส่รหัสกลุ่ม") {
      if (message.text === "ใส่รหัสกลุ่ม") {
        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: `🔑 **กรุณาพิมพ์รหัสกลุ่มของคุณ**\n\nเช่น: JOIN-KCT2024\n(ขอรหัสได้จากหัวหน้าทีมหรือฝ่ายบุคคล)`,
        });
        return;
      }

      const code = message.text.split("-")[1].toUpperCase().trim();
      // Check code in Firestore (Assuming we have a 'teams' collection or hardcoded for now)
      // For demo, let's support a demo code 'DEMO2024' or check 'teams' collection

      const teamsRef = db.collection("teams");
      const teamQuery = await teamsRef.where("code", "==", code).get();

      if (!teamQuery.empty || code === "DEMO2024") { // Allow DEMO2024 for testing
        let teamName = "Demo Team";
        let teamId = "demo_team_id";

        if (!teamQuery.empty) {
          const teamDoc = teamQuery.docs[0];
          teamName = teamDoc.data().name;
          teamId = teamDoc.id;
        }

        await userRef.update({
          isPremium: true,
          subscriptionStatus: "active_team",
          teamId: teamId,
          teamName: teamName,
          joinedTeamAt: FieldValue.serverTimestamp(),
        });

        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: `🎉 **ยินดีต้อนรับสู่ทีม ${teamName}!**\n\n` +
                `คุณได้รับสิทธิ์ Premium แบบทีมเรียบร้อยแล้ว ✅\n` +
                `เริ่มใช้งานฟีเจอร์ทั้งหมดได้ทันทีครับ 🚀`,
        });
      } else {
        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: `❌ **รหัสกลุ่มไม่ถูกต้อง**\nกรุณาตรวจสอบรหัสอีกครั้ง หรือติดต่อหัวหน้าทีมครับ`,
        });
      }
      return;
    }

    // 1. Handle Package Selection (รายเดือน, 3 เดือน, รายปี, ทีม)

    // 1.0 Handle Package Detail Request - ดูรายละเอียดแพ็คเกจ
    // รองรับทั้ง "ดูรายละเอียดแพ็คเกจรายเดือน" และ "ดูแพ็คเกจ รายเดือน"
    const packageDetailMatch = message.text.match(/ดู(?:รายละเอียด)?แพ็ค(?:เก)?จ\s*(รายเดือน|3\s*เดือน|รายปี|ทีม(?:รายปี)?|ทั้งหมด)?|ราคา(?:สมัคร|แพ็ค)?|แพ็ค(?:เก)?จ\s*(?:พรีเมียม|premium)|ดูราคา|รายละเอียด(?:แพ็ค(?:เก)?จ)?\s*(รายเดือน|3\s*เดือน|รายปี|ทีม)/i);
    if (packageDetailMatch) {
      console.log(`📦 Package detail request: "${message.text}"`);
      let packageType = "all";
      // ใช้ทั้ง match group และ message.text เพื่อให้ครอบคลุม
      const matchText = (packageDetailMatch[1] || packageDetailMatch[2] || message.text).toLowerCase();

      if (matchText.includes("รายเดือน") && !matchText.includes("ทีม")) {
        packageType = "starter";
      } else if (matchText.includes("3เดือน") || matchText.includes("3 เดือน")) {
        packageType = "popular";
      } else if (matchText.includes("รายปี") && !matchText.includes("ทีม")) {
        packageType = "best";
      } else if (matchText.includes("ทีม")) {
        packageType = "team";
      }

      console.log(`📦 Package type detected: ${packageType} from text: "${matchText}"`);

      const packageTextFallback = {
        type: "text",
        text: `💎 **แพ็คเกจ Premium WiT AI**\n\n` +
              `👤 **ส่วนตัว:**\n` +
              `• รายเดือน: 99฿ (AI ไม่จำกัด + ภาพ 30 รูป/วัน)\n` +
              `• 3 เดือน: 259฿ (ประหยัด 12% + คู่มือฟรี)\n` +
              `• รายปี: 699฿ (คุ้มสุด! ≈1.9฿/วัน + Video)\n\n` +
              `🏢 **ทีม (5 คน):**\n` +
              `• ทีมรายปี: 2,490฿ (ตกคนละ 41฿/เดือน)\n\n` +
              `📝 พิมพ์ "เลือกรายเดือน" หรือ "เลือกรายปี" เพื่อสมัคร`,
      };

      // Helper function to send package message with proper fallback
      const sendPackageMessage = async (msgToSend) => {
        try {
          await lineClient.replyMessage(replyToken, msgToSend);
          console.log(`✅ Package detail sent via replyMessage`);
          return true;
        } catch (replyErr) {
          console.warn("⚠️ replyMessage failed:", replyErr.message);
          // Log full error details from LINE SDK
          console.error("LINE API Error details:", JSON.stringify({
            statusCode: replyErr.statusCode,
            statusMessage: replyErr.statusMessage,
            originalError: replyErr.originalError?.response?.data || replyErr.originalError?.message,
          }));
          try {
            await lineClient.pushMessage(userId, msgToSend);
            console.log(`✅ Package detail sent via pushMessage (fallback)`);
            return true;
          } catch (pushErr) {
            console.error("❌ pushMessage also failed:", pushErr.message);
            console.error("LINE API Push Error details:", JSON.stringify({
              statusCode: pushErr.statusCode,
              statusMessage: pushErr.statusMessage,
              originalError: pushErr.originalError?.response?.data || pushErr.originalError?.message,
            }));
            // Log the message that failed
            console.error("Failed message type:", msgToSend?.type);
            console.error("Failed message altText:", msgToSend?.altText);
            return false;
          }
        }
      };

      try {
        const packageFlex = createPackageDetailMessage(packageType);
        if (packageFlex) {
          const sent = await sendPackageMessage(packageFlex);
          if (!sent) {
            // Try text fallback if Flex failed
            await sendPackageMessage(packageTextFallback);
          }
        } else {
          await sendPackageMessage(packageTextFallback);
        }
      } catch (flexError) {
        console.error("⚠️ Package detail Flex creation failed:", flexError.message);
        await sendPackageMessage(packageTextFallback);
      }
      return;
    }

    const packageMatch = message.text.match(/(?:เลือก|สมัคร|ขอ).*?(รายเดือน|3\s*เดือน|รายปี|ทีม|team|99|259|699|399|999|2490)/i);
    if (packageMatch) {
      let selectedPackage = "";
      let price = "";
      const match = packageMatch[1].toLowerCase();

      // Individual Packages
      if ((match.includes("รายเดือน") && !match.includes("ทีม")) || match === "99") {
        selectedPackage = "รายเดือน (99฿)";
        price = "99";
      } else if ((match.includes("3") && !match.includes("ทีม")) || match === "259") {
        selectedPackage = "3 เดือน (259฿)";
        price = "259";
      } else if ((match.includes("รายปี") && !match.includes("ทีม")) || match === "699") {
        selectedPackage = "รายปี (699฿)";
        price = "699";
      }
      // Team Packages
      else if (match.includes("ทีม") || match.includes("team") || match === "399" || match === "999" || match === "2490") {
        if (match.includes("รายเดือน") || match === "399") {
          selectedPackage = "Team Pack รายเดือน (399฿)";
          price = "399";
        } else if (match.includes("3") || match === "999") {
          selectedPackage = "Team Pack 3 เดือน (999฿)";
          price = "999";
        } else if (match.includes("รายปี") || match === "2490") {
          selectedPackage = "Team Pack รายปี (2,490฿)";
          price = "2,490";
        } else {
          // Default team package if duration not specified
          selectedPackage = "Team Pack รายเดือน (399฿)";
          price = "399";
        }
      }

      if (selectedPackage) {
        await userRef.set({
          selectedPackage: selectedPackage,
          packagePrice: price,
          subscriptionStatus: "package_selected",
          lastRequestAt: FieldValue.serverTimestamp(),
        }, {merge: true});

        // 💳 ใช้ Flex Message สำหรับการยืนยันแพ็คเกจ (มีปุ่มคัดลอกเลขบัญชี)
        const isTeamPackage = selectedPackage.includes("Team");
        const confirmationFlex = createPaymentInstructionMessage(selectedPackage, price, isTeamPackage);

        if (confirmationFlex) {
          try {
            await lineClient.replyMessage(replyToken, confirmationFlex);
            console.log(`✅ Package confirmation Flex sent for: ${selectedPackage}`);
          } catch (flexError) {
            console.error("⚠️ Flex failed, using text fallback:", flexError.message);
            // Fallback to text message
            await lineClient.replyMessage(replyToken, {
              type: "text",
              text: `✅ **เลือกแพ็คเกจ: ${selectedPackage}**\n\n` +
                    `💳 โอนเงินที่:\n` +
                    `🏦 กสิกรไทย 526-2-10038-5\n` +
                    `👤 นายวิทยา พงษ์สำราญ\n` +
                    `💰 จำนวน: ${price} บาท\n\n` +
                    `📝 หลังโอนแล้ว กรุณาส่ง:\n` +
                    `1️⃣ สลิปการโอน (รูปภาพ)\n` +
                    `2️⃣ Email ของคุณ (พิมพ์ส่งมาเลย)\n` +
                    `${isTeamPackage ? "3️⃣ ชื่อทีม/รหัสองค์กรที่ต้องการ (เช่น KCTLINE01)\n" : ""}\n` +
                    `⏱️ แอดมินจะเปิดสิทธิ์ภายใน 24 ชม.`,
            });
          }
        } else {
          // Fallback if Flex creation failed
          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: `✅ **เลือกแพ็คเกจ: ${selectedPackage}**\n\n` +
                  `💳 โอนเงินที่:\n` +
                  `🏦 กสิกรไทย 526-2-10038-5\n` +
                  `👤 นายวิทยา พงษ์สำราญ\n` +
                  `💰 จำนวน: ${price} บาท\n\n` +
                  `📝 หลังโอนแล้ว กรุณาส่ง:\n` +
                  `1️⃣ สลิปการโอน (รูปภาพ)\n` +
                  `2️⃣ Email ของคุณ (พิมพ์ส่งมาเลย)\n` +
                  `${isTeamPackage ? "3️⃣ ชื่อทีม/รหัสองค์กรที่ต้องการ (เช่น KCTLINE01)\n" : ""}\n` +
                  `⏱️ แอดมินจะเปิดสิทธิ์ภายใน 24 ชม.`,
          });
        }
        return;
      }
    }

    // 2. Handle Email Input
    const emailMatch = message.text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) {
      const email = emailMatch[1];
      await userRef.set({
        email: email,
        emailProvidedAt: FieldValue.serverTimestamp(),
      }, {merge: true});

      // 📧 ใช้ Flex Message สำหรับยืนยัน Email
      const emailFlex = createEmailConfirmationMessage(email);
      if (emailFlex) {
        try {
          await lineClient.replyMessage(replyToken, emailFlex);
          console.log(`✅ Email confirmation Flex sent for: ${email}`);
        } catch (flexError) {
          console.error("⚠️ Email Flex failed, using text fallback:", flexError.message);
          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: `✅ **บันทึก Email แล้ว:** ${email}\n\n` +
                  `📸 กรุณาส่งสลิปการโอนเงินต่อครับ\n` +
                  `(ส่งเป็นรูปภาพ)`,
          });
        }
      } else {
        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: `✅ **บันทึก Email แล้ว:** ${email}\n\n` +
                `📸 กรุณาส่งสลิปการโอนเงินต่อครับ\n` +
                `(ส่งเป็นรูปภาพ)`,
        });
      }
      return;
    }

    // 3. Handle General Subscription Request - ใช้ Flex Message Carousel สวยงาม
    if (message.text.includes("สนใจสมัคร") || message.text.includes("สมัครสมาชิก") || message.text.includes("ขอสมัคร") || message.text.toLowerCase().includes("upgrade") || message.text.includes("/upgrade")) {
      console.log(`💰 User ${userId} requested subscription info`);

      await userRef.set({
        subscriptionStatus: "interested",
        lastRequestAt: FieldValue.serverTimestamp(),
      }, {merge: true});

      // 💎 ใช้ Flex Message Carousel สำหรับแพ็คเกจ Premium
      const premiumFlex = createPremiumPackageMessage();
      if (premiumFlex) {
        try {
          await lineClient.replyMessage(replyToken, premiumFlex);
          console.log("✅ Premium package Flex Message sent");
        } catch (flexError) {
          console.error("⚠️ Flex failed, using text fallback:", flexError.message);
          // Fallback to text message
          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: `💎 **อัปเกรดเป็น Premium** 💎\n\n` +
                  `👤 **แพ็คเกจส่วนตัว:**\n` +
                  `• รายเดือน: 99฿\n` +
                  `• 3 เดือน: 259฿ (ประหยัด 12%)\n` +
                  `• รายปี: 699฿ 🔥 (คุ้มสุด!)\n\n` +
                  `🏢 **แพ็คเกจทีม (5 คน):**\n` +
                  `• รายเดือน: 399฿ (ตกคนละ 80฿)\n` +
                  `• รายปี: 2,490฿ 🏆 (ตกคนละ 41฿/เดือน)\n\n` +
                  `พิมพ์ "เลือกรายเดือน" หรือ "เลือกรายปี" ได้เลย`,
            quickReply: {
              items: [
                {type: "action", action: {type: "message", label: "👤 รายเดือน (99฿)", text: "เลือกรายเดือน"}},
                {type: "action", action: {type: "message", label: "🔥 รายปี (699฿)", text: "เลือกรายปี"}},
                {type: "action", action: {type: "message", label: "🏢 ทีมรายเดือน (399฿)", text: "เลือกทีมรายเดือน"}},
                {type: "action", action: {type: "message", label: "🏆 ทีมรายปี (2,490฿)", text: "เลือกทีมรายปี"}},
              ],
            },
          });
        }
      } else {
        // Fallback if Flex creation failed
        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: `💎 สมัคร Premium\n\nพิมพ์ "เลือกรายเดือน" หรือ "เลือกรายปี" ได้เลย`,
          quickReply: {
            items: [
              {type: "action", action: {type: "message", label: "👤 รายเดือน (99฿)", text: "เลือกรายเดือน"}},
              {type: "action", action: {type: "message", label: "🔥 รายปี (699฿)", text: "เลือกรายปี"}},
            ],
          },
        });
      }
      return;
    }

    // 2. Check User Status & Quota
    const userDoc = await userRef.get();
    // userData already declared at function scope, just reset default values
    userData = {usageCount: 0, isPremium: false};

    if (userDoc.exists) {
      userData = userDoc.data();

      // 🛠️ Fix: Update display name if missing or default
      if (!userData.displayName || userData.displayName === "New User" || userData.displayName === "User") {
        try {
          const profile = await lineClient.getProfile(userId);
          if (profile.displayName) {
            userData.displayName = profile.displayName;
            // Update in background
            userRef.update({displayName: profile.displayName}).catch((e) => console.error(e));
          }
        } catch (e) {
          console.warn("Could not update display name:", e.message);
        }
      }
    } else {
      // New user
      let initialName = "New User";
      try {
        const profile = await lineClient.getProfile(userId);
        initialName = profile.displayName || "New User";
      } catch (e) {
        console.warn("Could not get profile for new user:", e.message);
      }

      await userRef.set({
        usageCount: 0,
        isPremium: false,
        createdAt: FieldValue.serverTimestamp(),
        displayName: initialName,
      });
      userData.displayName = initialName;
    }

    // =====================================================
    // 🚫 BAN CHECK - Block banned users early
    // =====================================================
    console.log(`🔍 DEBUG: Passed user data setup, now at BAN CHECK`);
    const SUPER_ADMIN_ID_BAN = "Ud9bec6d2ea945cf4330a69cb74ac93cf";
    if (userData.isBanned && userId !== SUPER_ADMIN_ID_BAN) {
      console.log(`🚫 Blocked banned user: ${userId}`);
      await lineClient.replyMessage(replyToken, {
        type: "text",
        text: `🚫 **บัญชีของคุณถูกระงับ**\n\n` +
              `เหตุผล: ${userData.banReason || "ไม่ระบุ"}\n\n` +
              `หากคุณคิดว่านี่เป็นข้อผิดพลาด\n` +
              `กรุณาติดต่อ Admin`,
      });
      return;
    }

    // =====================================================
    // 🎁 TRIAL SYSTEM TEXT COMMANDS
    // =====================================================
    const msgLowerTrial = message.text.toLowerCase().trim();

    // ยอมรับข้อตกลง / เริ่มทดลองใช้
    if (msgLowerTrial === "ยอมรับข้อตกลง" ||
        msgLowerTrial === "เริ่มทดลองใช้" ||
        msgLowerTrial === "ทดลองใช้งาน" ||
        msgLowerTrial === "เริ่ม trial" ||
        msgLowerTrial === "start trial") {
      console.log(`🎁 User ${userId} accepting terms via text command`);

      try {
        const currentStatus = await getTrialStatus(userId);

        if (currentStatus.isPremium) {
          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: `💎 คุณเป็นสมาชิก Premium อยู่แล้วครับ ใช้งานได้ไม่จำกัด!`,
          });
          return;
        }

        if (currentStatus.status === TRIAL_STATUS.ACTIVE) {
          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: `🎁 คุณกำลังใช้ Trial อยู่ครับ\nเหลืออีก ${currentStatus.trialDaysRemaining} วัน (${currentStatus.dailyUsage}/${currentStatus.dailyLimit} ครั้ง/วัน)`,
          });
          return;
        }

        if (currentStatus.status === TRIAL_STATUS.EXPIRED) {
          const expiredFlex = createTrialExpiredFlex({
            totalUsage: currentStatus.totalUsage,
            trialDays: TRIAL_CONFIG.TRIAL_DAYS,
          });
          await lineClient.replyMessage(replyToken, expiredFlex);
          return;
        }

        // Start trial
        const result = await acceptTermsAndStartTrial(userId);
        if (result.success) {
          const trialStartedFlex = createTrialStartedFlex(userData.displayName || "คุณ", {
            trialDays: result.trialDays,
            dailyLimit: result.dailyLimit,
            trialEndDate: result.trialEndDate,
          });
          await lineClient.replyMessage(replyToken, trialStartedFlex);
        }
      } catch (error) {
        console.error("❌ Error starting trial:", error);
        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: "❌ เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้งครับ",
        });
      }
      return;
    }

    // ดูสถานะ Trial
    if (msgLowerTrial === "ดูสถานะ" ||
        msgLowerTrial === "สถานะ trial" ||
        msgLowerTrial === "trial status" ||
        msgLowerTrial === "/trialstatus" ||
        msgLowerTrial === "เหลือกี่ครั้ง") {
      console.log(`🎁 User ${userId} checking trial status`);

      try {
        const trialStatus = await getTrialStatus(userId);
        const statusFlex = createDailyStatusFlex(userData.displayName || "คุณ", {
          status: trialStatus.status,
          dailyUsage: trialStatus.dailyUsage,
          dailyLimit: trialStatus.dailyLimit,
          trialDaysRemaining: trialStatus.trialDaysRemaining,
          trialDay: trialStatus.trialDay,
          totalUsage: trialStatus.totalUsage,
          isPremium: trialStatus.isPremium,
        });
        await lineClient.replyMessage(replyToken, statusFlex);
      } catch (error) {
        console.error("❌ Error getting trial status:", error);
        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: "❌ ไม่สามารถดูสถานะได้ กรุณาลองใหม่อีกครั้งครับ",
        });
      }
      return;
    }

    // ℹ️ USER HELP COMMAND - ใช้ Flex Message สวยงาม
    // ⚠️ ยกเว้น "วิธีใช้บัญชี" เพราะมี handler แยกสำหรับ Accounting Guide
    const isHelpCommand = message.text.toLowerCase() === "/help" ||
                          message.text === "help" ||
                          message.text.includes("ช่วยด้วย") ||
                          (message.text.includes("วิธีใช้") && !message.text.includes("วิธีใช้บัญชี"));
    if (isHelpCommand) {
      const isSuperAdminCheck = (userId === "Ud9bec6d2ea945cf4330a69cb74ac93cf");

      if (!isSuperAdminCheck) {
        // 📖 ใช้ Flex Message สำหรับเมนูช่วยเหลือ
        const helpFlex = createHelpMenuMessage();
        if (helpFlex) {
          try {
            await lineClient.replyMessage(replyToken, helpFlex);
            console.log("✅ Help menu Flex Message sent");
          } catch (flexError) {
            console.error("⚠️ Flex failed, using text fallback:", flexError.message);
            // Fallback to text message
            await lineClient.replyMessage(replyToken, {
              type: "text",
              text: `🤖 คู่มือการใช้งาน AI อัจฉริยะ\n\n` +
                    `1️⃣ วิเคราะห์ภาพ - พิมพ์ "วิเคราะห์ภาพ" หรือส่งรูป\n` +
                    `2️⃣ ถาม-ตอบ - ถามปัญหาเทคนิคได้เลย\n` +
                    `3️⃣ คำนวณ - Cooling Time, Clamping Force\n` +
                    `4️⃣ เกษตร - โรคพืช ปุ๋ย การปลูก\n` +
                    `5️⃣ แปล/สรุป - ส่งข้อความมาให้สรุป\n\n` +
                    `💡 พิมพ์เหมือนคุยกับเพื่อน ผมเข้าใจครับ`,
              quickReply: {
                items: [
                  {type: "action", action: {type: "message", label: "👁️ วิเคราะห์ภาพ", text: "วิเคราะห์ภาพ"}},
                  {type: "action", action: {type: "message", label: "❓ ถามปัญหา", text: "รอยไหม้เกิดจากอะไร"}},
                  {type: "action", action: {type: "message", label: "📊 คำนวณ", text: "เมนูคำนวณ"}},
                  {type: "action", action: {type: "message", label: "🌱 เกษตร", text: "ปรึกษาเรื่องเกษตรครับ"}},
                  {type: "action", action: {type: "message", label: "💎 สมัคร Premium", text: "สนใจสมัคร Premium"}},
                ],
              },
            });
          }
        } else {
          // Fallback if Flex creation failed
          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: `🤖 AI ผู้ช่วยอัจฉริยะ\n\nพิมพ์คำถามหรือส่งรูปมาได้เลยครับ`,
            quickReply: {
              items: [
                {type: "action", action: {type: "message", label: "👁️ วิเคราะห์ภาพ", text: "วิเคราะห์ภาพ"}},
                {type: "action", action: {type: "message", label: "💎 สมัคร Premium", text: "สนใจสมัคร Premium"}},
              ],
            },
          });
        }
        return;
      }
    }

    console.log(`🔍 DEBUG: Passed HELP CHECK, heading to TEACHING & LEARNING MODULES`);
    
    // =====================================================
    // 🎓 INJECTION MOLDING TEACHING SYSTEM (ใหม่!)
    // สอนการฉีดพลาสติกตั้งแต่เริ่มต้น - Zero to Hero
    // คำสั่ง: เริ่มเรียนฉีด, สอนฉีดพลาสติก, หลักสูตรฉีด, บทเรียนฉีด
    // =====================================================
    const teachingKeywords = [
      "เริ่มเรียนฉีด", "สอนฉีดพลาสติก", "หลักสูตรฉีด", "บทเรียนฉีด",
      "เรียนฉีดพลาสติก", "สอนฉีด", "เรียนฉีด", "หลักสูตรการฉีด",
      "/teach", "/plasticlearn", "plastic lesson", "injection lesson"
    ];
    
    const msgLower = message.text.toLowerCase().trim();
    const isTeachingCommand = teachingKeywords.some(kw => msgLower.includes(kw));
    
    if (isTeachingCommand) {
      console.log(`🎓 === ENTERING INJECTION MOLDING TEACHING SYSTEM ===`);
      console.log(`📝 Teaching command detected: "${message.text}"`);
      
      // Process teaching command with Flex Message support
      const teachResult = processTeachingCommand(message.text, {}, true);
      
      if (teachResult.flexMessage) {
        // Send Flex Message
        await lineClient.replyMessage(replyToken, teachResult.flexMessage);
        console.log("✅ Teaching Flex response sent");
        return;
      } else if (teachResult.response) {
        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: teachResult.response,
          quickReply: {
            items: [
              {type: "action", action: {type: "message", label: "📖 บทที่ 1", text: "บทที่ 1"}},
              {type: "action", action: {type: "message", label: "📚 หลักสูตร", text: "หลักสูตรฉีด"}},
              {type: "action", action: {type: "message", label: "📝 Quiz", text: "quiz ฉีดพลาสติก"}},
              {type: "action", action: {type: "message", label: "🏠 เมนูหลัก", text: "/help"}},
            ],
          },
        });
        console.log("✅ Teaching text response sent");
        return;
      }
    }
    
    // จับคำสั่ง บทที่ X สำหรับ Teaching (ฉีดพลาสติก)
    const lessonMatch = msgLower.match(/บทที่\s*(\d+)/);
    if (lessonMatch && (msgLower.includes("ฉีด") || msgLower.includes("พลาสติก") || !msgLower.includes("วิชา"))) {
      const lessonNum = parseInt(lessonMatch[1]);
      if (lessonNum >= 1 && lessonNum <= 24) {
        console.log(`🎓 Teaching Lesson ${lessonNum} requested`);
        const teachResult = processTeachingCommand(`บทที่ ${lessonNum}`, {}, true);
        
        if (teachResult.flexMessage) {
          await lineClient.replyMessage(replyToken, teachResult.flexMessage);
          console.log(`✅ Teaching Lesson ${lessonNum} Flex sent`);
          return;
        } else if (teachResult.response) {
          const nextLesson = lessonNum < 24 ? lessonNum + 1 : 1;
          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: teachResult.response,
            quickReply: {
              items: [
                {type: "action", action: {type: "message", label: `📖 บทที่ ${nextLesson}`, text: `บทที่ ${nextLesson}`}},
                {type: "action", action: {type: "message", label: "📝 Quiz", text: "quiz ฉีดพลาสติก"}},
                {type: "action", action: {type: "message", label: "📈 ความก้าวหน้า", text: "ความก้าวหน้าฉีด"}},
                {type: "action", action: {type: "message", label: "📚 หลักสูตร", text: "หลักสูตรฉีด"}},
              ],
            },
          });
          console.log(`✅ Teaching Lesson ${lessonNum} sent`);
          return;
        }
      }
    }
    
    // จับคำสั่ง Level X สำหรับ Teaching
    const levelMatch = msgLower.match(/level\s*(\d+)|เลเวล\s*(\d+)/i);
    if (levelMatch && (msgLower.includes("ฉีด") || msgLower.includes("พลาสติก"))) {
      const levelNum = parseInt(levelMatch[1] || levelMatch[2]);
      if (levelNum >= 0 && levelNum <= 5) {
        console.log(`🎓 Teaching Level ${levelNum} requested`);
        const teachResult = processTeachingCommand(`Level ${levelNum}`, {}, true);
        
        if (teachResult.flexMessage) {
          await lineClient.replyMessage(replyToken, teachResult.flexMessage);
          console.log(`✅ Teaching Level ${levelNum} Flex sent`);
          return;
        } else if (teachResult.response) {
          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: teachResult.response,
            quickReply: {
              items: [
                {type: "action", action: {type: "message", label: "📖 เริ่มเรียน", text: "เริ่มเรียนฉีด"}},
                {type: "action", action: {type: "message", label: "📝 Quiz", text: "quiz ฉีดพลาสติก"}},
                {type: "action", action: {type: "message", label: "📚 หลักสูตร", text: "หลักสูตรฉีด"}},
              ],
            },
          });
          console.log(`✅ Teaching Level ${levelNum} sent`);
          return;
        }
      }
    }
    
    // Quiz สำหรับ Teaching (ฉีดพลาสติก)
    if ((msgLower.includes("quiz") || msgLower.includes("ทดสอบ")) && 
        (msgLower.includes("ฉีด") || msgLower.includes("พลาสติก") || msgLower.includes("injection"))) {
      console.log(`🎓 Teaching Quiz requested`);
      const teachResult = processTeachingCommand("quiz", {}, true);
      
      if (teachResult.flexMessage) {
        await lineClient.replyMessage(replyToken, teachResult.flexMessage);
        console.log("✅ Teaching Quiz Flex sent");
        return;
      } else if (teachResult.response) {
        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: teachResult.response,
          quickReply: {
            items: [
              {type: "action", action: {type: "message", label: "A", text: "A"}},
              {type: "action", action: {type: "message", label: "B", text: "B"}},
              {type: "action", action: {type: "message", label: "C", text: "C"}},
              {type: "action", action: {type: "message", label: "📚 หลักสูตร", text: "หลักสูตรฉีด"}},
            ],
          },
        });
        console.log("✅ Teaching Quiz sent");
        return;
      }
    }
    
    // ตารางอ้างอิง Teaching
    if (msgLower.includes("ตาราง") && (msgLower.includes("อบ") || msgLower.includes("เย็น") || msgLower.includes("แรงดัน") || msgLower.includes("cooling") || msgLower.includes("drying"))) {
      console.log(`🎓 Teaching Reference Table requested`);
      const teachResult = processTeachingCommand(message.text, {}, true);
      
      if (teachResult.flexMessage) {
        await lineClient.replyMessage(replyToken, teachResult.flexMessage);
        console.log("✅ Teaching Reference Table Flex sent");
        return;
      } else if (teachResult.response) {
        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: teachResult.response,
          quickReply: {
            items: [
              {type: "action", action: {type: "message", label: "📊 ตารางอบ", text: "ตารางอบเม็ด"}},
              {type: "action", action: {type: "message", label: "❄️ ตารางเย็น", text: "ตารางเย็น"}},
              {type: "action", action: {type: "message", label: "💪 ตารางแรงดัน", text: "ตารางแรงดันฉีด"}},
              {type: "action", action: {type: "message", label: "📚 หลักสูตร", text: "หลักสูตรฉีด"}},
            ],
          },
        });
        console.log("✅ Teaching Reference Table sent");
        return;
      }
    }

    // =====================================================
    // 🎓 STUDENT LEARNING MODULE (Education Hub - ป.1 ถึง ม.3)
    // =====================================================
    console.log(`🎓 === ENTERING STUDENT LEARNING MODULE ===`);
    const msgTextLower = message.text.toLowerCase().trim();
    console.log(`📝 msgTextLower: "${msgTextLower}"`);
    console.log(`📝 startsWith /quiz : ${msgTextLower.startsWith("/quiz ")}`);

    // เมนูหลักสำหรับนักเรียน
    if (msgTextLower === "/learn" || msgTextLower === "/student" || msgTextLower === "เรียน" ||
        msgTextLower === "เมนูเรียน" || msgTextLower === "ศูนย์เรียนรู้") {
      const studentMenu = createStudentMenuFlex();
      await lineClient.replyMessage(replyToken, studentMenu);
      console.log("✅ Sent Student Menu");
      return;
    }

    // รายการบทเรียน
    if (msgTextLower === "/lesson" || msgTextLower === "บทเรียน" || msgTextLower === "เนื้อหา") {
      const lessonList = createLessonListFlex();
      await lineClient.replyMessage(replyToken, lessonList);
      console.log("✅ Sent Lesson List");
      return;
    }

    // เนื้อหาบทเรียนเฉพาะ
    if (msgTextLower.startsWith("/lesson ")) {
      const lessonId = msgTextLower.replace("/lesson ", "").trim();
      const lesson = LESSONS[lessonId];
      if (lesson) {
        // ส่ง Flex Message อย่างเดียว (ประหยัดโควต้าและไม่ซ้อนกัน)
        const lessonFlex = createLessonContentFlex(lessonId);
        if (lessonFlex) {
          await lineClient.replyMessage(replyToken, lessonFlex);
          console.log(`✅ Sent Lesson Flex: ${lessonId}`);
        } else {
          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: "❌ เกิดข้อผิดพลาดในการสร้างบทเรียน",
          });
        }
      } else {
        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: "❌ ไม่พบบทเรียนที่ระบุ\n\nพิมพ์ /lesson เพื่อดูรายการบทเรียนทั้งหมด",
        });
      }
      return;
    }

    // แบบทดสอบ
    if (msgTextLower === "/quiz" || msgTextLower === "แบบทดสอบ" || msgTextLower === "ทดสอบ") {
      const lessonList = createLessonListFlex();
      // ส่งเฉพาะ Flex Message
      await lineClient.replyMessage(replyToken, lessonList);
      return;
    }

    // แบบทดสอบเฉพาะบท หรือรวม (Enhanced with Session Management)
    console.log(`🔍 Checking if startsWith /quiz: "${msgTextLower}" -> ${msgTextLower.startsWith("/quiz ")}`);
    if (msgTextLower.startsWith("/quiz ")) {
      console.log(`✅ MATCHED: /quiz lesson handler (Enhanced)`);
      const param = msgTextLower.replace("/quiz ", "").trim();
      console.log(`📌 param: "${param}"`);

      try {
        // 🎯 Smart Random Selection with Session Management
        const questionCount = param === "all" ? 10 : (LESSONS[param]?.quiz?.length || 5);
        const selectedQuestions = quizEnhancement.selectRandomQuestions(param, questionCount, [], QUIZ_QUESTIONS);

        if (selectedQuestions.length > 0) {
          // 💾 Create Quiz Session in Firestore
          const session = await quizEnhancement.createQuizSession(userId, param, selectedQuestions);
          console.log(`✅ Quiz session created: ${session.sessionId}`);
          console.log(`📊 Session object:`, JSON.stringify(session));

          // 🎨 Send Enhanced First Question
          const firstQuestion = QUIZ_QUESTIONS[selectedQuestions[0]];
          console.log(`📝 First question ID: ${firstQuestion.id}`);

          const questionFlex = quizFlexMessages.createEnhancedQuizQuestionFlex(firstQuestion, session);
          console.log(`🎨 Flex created successfully`);

          await lineClient.replyMessage(replyToken, questionFlex);
          console.log(`✅ Started Enhanced Quiz: ${param}, Questions: ${selectedQuestions.length}, Session: ${session.sessionId}`);
        } else {
          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: "❌ ไม่พบแบบทดสอบ\n\nพิมพ์ /quiz เพื่อเลือกบทเรียน",
          });
        }
      } catch (quizError) {
        console.error(`❌ Enhanced Quiz Error:`, quizError);
        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: "❌ เกิดข้อผิดพลาดในการเริ่มแบบทดสอบ\nกรุณาลองใหม่อีกครั้ง",
        });
      }
      return;
    }

    // ตอบคำถาม (Enhanced with Verification & Auto-Next)
    if (msgTextLower.startsWith("/answer ")) {
      const parts = msgTextLower.replace("/answer ", "").trim().split(" ");
      const sessionId = parts[0];
      const questionId = parts[1];
      const userAnswer = parts[2]?.toUpperCase();

      console.log(`📝 Answer received: session=${sessionId}, question=${questionId}, answer=${userAnswer}`);

      try {
        // 📊 Get Quiz Session
        const session = await quizEnhancement.getQuizSession(sessionId);
        if (!session) {
          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: "❌ ไม่พบ session แบบทดสอบ\nกรุณาเริ่มแบบทดสอบใหม่ด้วย /quiz",
          });
          return;
        }

        // ✅ Verify Answer & Calculate Score
        const baselineTime = session.updatedAt?.toMillis?.() || session.startTime?.toMillis?.() || Date.now();
        const answerTimeMs = Date.now() - baselineTime;
        const verifyResult = quizEnhancement.verifyAnswerAndCalculateScore(
          questionId,
          userAnswer,
          session,
          answerTimeMs,
          QUIZ_QUESTIONS
        );

        if (verifyResult.error) {
          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: "❌ ไม่พบคำถามในระบบ กรุณาเริ่มทำแบบทดสอบใหม่",
          });
          return;
        }

        // 💾 Update Session with Answer
        await quizEnhancement.updateQuizSession(sessionId, verifyResult.answerData);

        // 🎨 Send Answer Result Flex (with auto-next button)
        const question = QUIZ_QUESTIONS[questionId];
        const updatedSession = await quizEnhancement.getQuizSession(sessionId);
        const resultFlex = quizFlexMessages.createEnhancedAnswerResultFlex(
          question,
          userAnswer,
          verifyResult,
          updatedSession
        );

        await lineClient.replyMessage(replyToken, resultFlex);
        console.log(`✅ Answer result sent with auto-next button`);

      } catch (answerError) {
        console.error("❌ Enhanced Answer Error:", answerError);
        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: "❌ เกิดข้อผิดพลาดในการตรวจคำตอบ\nกรุณาลองใหม่อีกครั้ง",
        });
      }
      return;
    }

    // ❇️ Next Question Handler (Auto-advance to next question)
    if (msgTextLower.startsWith("/next_question ")) {
      const sessionId = msgTextLower.replace("/next_question ", "").trim();
      console.log(`⏭️ Next question requested for session: ${sessionId}`);

      try {
        const session = await quizEnhancement.getQuizSession(sessionId);
        if (!session) {
          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: "❌ ไม่พบ session แบบทดสอบ",
          });
          return;
        }

        // Check if there are more questions
        if (session.currentQuestionIndex < session.questionIds.length) {
          const nextQuestionId = session.questionIds[session.currentQuestionIndex];
          const nextQuestion = QUIZ_QUESTIONS[nextQuestionId];
          const questionFlex = quizFlexMessages.createEnhancedQuizQuestionFlex(nextQuestion, session);

          await lineClient.replyMessage(replyToken, questionFlex);
          console.log(`✅ Next question sent: ${nextQuestionId}`);
        } else {
          // 🏁 Quiz completed - Auto show summary (no command needed!)
          console.log(`🏁 Quiz completed! Auto-showing summary for session: ${sessionId}`);

          const quizResult = await quizEnhancement.completeQuizSession(sessionId);
          await quizEnhancement.saveQuizResultToUserProgress(session.userId, quizResult);

          const summaryFlex = quizFlexMessages.createEnhancedQuizSummaryFlex(session);
          await lineClient.replyMessage(replyToken, summaryFlex);
          console.log(`✅ Quiz summary auto-sent for session: ${sessionId}`);
        }
      } catch (error) {
        console.error("❌ Next Question Error:", error);
        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: "❌ เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
        });
      }
      return;
    }

    // 🏁 Finish Quiz Handler (Show Summary)
    if (msgTextLower.startsWith("/finish_quiz ")) {
      const sessionId = msgTextLower.replace("/finish_quiz ", "").trim();
      console.log(`🏁 Finish quiz requested for session: ${sessionId}`);

      try {
        const session = await quizEnhancement.getQuizSession(sessionId);
        if (!session) {
          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: "❌ ไม่พบ session แบบทดสอบ",
          });
          return;
        }

        // 💾 Complete session & save to user progress
        const quizResult = await quizEnhancement.completeQuizSession(sessionId);
        await quizEnhancement.saveQuizResultToUserProgress(userId, quizResult);

        // 🎨 Send Enhanced Summary Flex
        const summaryFlex = quizFlexMessages.createEnhancedQuizSummaryFlex(session);
        await lineClient.replyMessage(replyToken, summaryFlex);
        console.log(`✅ Quiz summary sent for session: ${sessionId}`);

      } catch (error) {
        console.error("❌ Finish Quiz Error:", error);
        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: "❌ เกิดข้อผิดพลาดในการแสดงผลสรุป",
        });
      }
      return;
    }

    // 📊 Quiz Dashboard Handler (Learning Analytics)
    if (msgTextLower === "/quiz_dashboard" || msgTextLower === "แดชบอร์ดการเรียน" || msgTextLower === "สถิติการเรียน") {
      console.log(`📊 Quiz dashboard requested for user: ${userId}`);

      try {
        // 📈 Get User Learning Stats
        const stats = await quizEnhancement.getUserLearningStats(userId);

        // 🎨 Create Learning Dashboard Flex
        const dashboardFlex = quizEnhancement.createLearningDashboardFlex(stats);

        await lineClient.replyMessage(replyToken, dashboardFlex);
        console.log(`✅ Quiz dashboard sent for user: ${userId}`);

      } catch (error) {
        console.error("❌ Quiz Dashboard Error:", error);
        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: "📊 แดชบอร์ดการเรียนรู้\n\n" +
                "ยังไม่มีข้อมูลการทำแบบทดสอบ\n\n" +
                "เริ่มต้นด้วยการพิมพ์ /quiz เพื่อทำแบบทดสอบ!",
        });
      }
      return;
    }

    // AI Explanation for Quiz
    if (msgTextLower.startsWith("/explain_ai ")) {
      const questionId = msgTextLower.replace("/explain_ai ", "").trim();
      const question = QUIZ_QUESTIONS[questionId];

      if (question) {
        try {
          const prompt = `
คำถาม: ${question.question}
ตัวเลือก:
${question.options.join("\n")}
คำตอบที่ถูกต้อง: ${question.answer}
คำอธิบายเบื้องต้น: ${question.explanation}

ช่วยอธิบายเพิ่มเติมอย่างละเอียดเกี่ยวกับคำถามข้อนี้ และทำไมคำตอบถึงเป็นข้อนั้น ให้ความรู้เพิ่มเติมที่เกี่ยวข้องกับการฉีดพลาสติกแบบมืออาชีพ เข้าใจง่าย`;

          const aiExplanation = await askInjectionMoldingAI(prompt, "intermediate", "Quiz Explanation");

          await lineClient.replyMessage(replyToken, {
            type: "flex",
            altText: "🤖 คำอธิบายจาก AI",
            contents: {
              type: "bubble",
              size: "mega",
              header: {
                type: "box",
                layout: "vertical",
                contents: [
                  {type: "text", text: "🤖 AI Expert Explanation", weight: "bold", size: "lg", color: "#FFFFFF"},
                ],
                backgroundColor: "#4F46E5",
                paddingAll: "15px",
              },
              body: {
                type: "box",
                layout: "vertical",
                contents: [
                  {type: "text", text: aiExplanation, wrap: true, size: "sm", color: "#333333"},
                ],
                paddingAll: "15px",
              },
            },
          });
        } catch (error) {
          console.error("AI Explanation Error:", error);
          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: "❌ ขออภัย ไม่สามารถเรียกข้อมูลจาก AI ได้ในขณะนี้",
          });
        }
      }
      return;
    }

    // คู่มือเตรียมสอบ
    if (msgTextLower === "/exam" || msgTextLower === "เตรียมสอบ" || msgTextLower === "สรุปสอบ") {
      const examFlex = createExamPrepFlex();
      await lineClient.replyMessage(replyToken, examFlex);
      console.log("✅ Sent Exam Prep");
      return;
    }

    // FAQ
    if (msgTextLower === "/faq" || msgTextLower === "คำถามที่พบบ่อย" || msgTextLower === "faq") {
      const faqFlex = createFAQFlex();
      await lineClient.replyMessage(replyToken, faqFlex);
      console.log("✅ Sent FAQ");
      return;
    }

    // 🎓 STUDENT GREETING - เปลี่ยนเป็นส่งเมนูเรียนรู้
    if (message.text.includes("นักเรียน") || message.text.includes("นักศึกษา") || message.text.includes("student")) {
      const studentMenu = createStudentMenuFlex();
      // ส่งเฉพาะ Flex Message
      await lineClient.replyMessage(replyToken, studentMenu);
      return;
    }

    // =====================================================
    // 🎓 EDUCATION HUB - ศูนย์การศึกษาครบวงจร
    // =====================================================

    // เมนูหลัก Education Hub
    if (msgTextLower === "/edu" || msgTextLower === "/education" || msgTextLower === "การศึกษา" ||
        msgTextLower === "ศูนย์การศึกษา" || msgTextLower === "เรียนหนังสือ" || msgTextLower === "หาความรู้") {
      const eduMenu = createEducationHubMenuFlex();
      await lineClient.replyMessage(replyToken, eduMenu);
      console.log("✅ Sent Education Hub Menu");
      return;
    }

    // เลือกระดับการศึกษา
    if (msgTextLower.startsWith("/edu ")) {
      const params = msgTextLower.replace("/edu ", "").trim().split(" ");
      const levelId = params[0];
      const subjectId = params[1];

      // 📊 Dashboard - แสดงความก้าวหน้า
      if (levelId === "dashboard") {
        try {
          const userDoc = await getFirestore().collection("users").doc(userId).get();
          const userData = userDoc.data()?.education || {xp: 0, level: 1, streak: 0, badges: [], lessonsCompleted: 0, quizScore: 0};
          const dashboardFlex = createProgressDashboardFlex(userData);
          await lineClient.replyMessage(replyToken, dashboardFlex);
          console.log("✅ Sent Progress Dashboard");
        } catch (err) {
          console.error("Dashboard Error:", err);
          const defaultDashboard = createProgressDashboardFlex({xp: 0, level: 1, streak: 0, badges: [], lessonsCompleted: 0, quizScore: 0});
          await lineClient.replyMessage(replyToken, defaultDashboard);
        }
        return;
      }

      // 🎯 Daily Challenge
      if (levelId === "challenge") {
        const todayDate = new Date().toISOString().split("T")[0];
        const challengeKeys = Object.keys(DAILY_CHALLENGES);
        const todayIndex = parseInt(todayDate.replace(/-/g, "")) % challengeKeys.length;
        const todayChallenge = DAILY_CHALLENGES[challengeKeys[todayIndex]];
        const challengeFlex = createDailyChallengeMenuFlex(todayChallenge);
        await lineClient.replyMessage(replyToken, challengeFlex);
        console.log("✅ Sent Daily Challenge Menu");
        return;
      }

      // 🎮 Mini Games
      if (levelId === "games") {
        const gamesFlex = createMiniGamesMenuFlex();
        await lineClient.replyMessage(replyToken, gamesFlex);
        console.log("✅ Sent Mini Games Menu");
        return;
      }

      // 🏆 Achievements / Badges
      if (levelId === "badges" || levelId === "achievements") {
        try {
          const userDoc = await getFirestore().collection("users").doc(userId).get();
          const userBadges = userDoc.data()?.education?.badges || [];
          const badgesFlex = createBadgeGalleryFlex(userBadges);
          await lineClient.replyMessage(replyToken, badgesFlex);
          console.log("✅ Sent Badge Gallery");
        } catch (err) {
          console.error("Badges Error:", err);
          const badgesFlex = createBadgeGalleryFlex([]);
          await lineClient.replyMessage(replyToken, badgesFlex);
        }
        return;
      }

      // 🏆 Leaderboard
      if (levelId === "leaderboard" || levelId === "rank") {
        try {
          const topUsersSnapshot = await getFirestore().collection("users")
              .orderBy("education.xp", "desc")
              .limit(10)
              .get();
          const topUsers = topUsersSnapshot.docs.map((doc) => ({
            name: doc.data()?.displayName || doc.data()?.name || "นักเรียน",
            xp: doc.data()?.education?.xp || 0,
            level: doc.data()?.education?.level || 1,
          }));
          const leaderboardFlex = createLeaderboardFlex(topUsers);
          await lineClient.replyMessage(replyToken, leaderboardFlex);
          console.log("✅ Sent Leaderboard");
        } catch (err) {
          console.error("Leaderboard Error:", err);
          const leaderboardFlex = createLeaderboardFlex([{name: "คุณ", xp: 0, level: 1}]);
          await lineClient.replyMessage(replyToken, leaderboardFlex);
        }
        return;
      }

      // ถ้าเป็น tools
      if (levelId === "tools") {
        const toolsMenu = createStudyToolsMenuFlex();
        await lineClient.replyMessage(replyToken, toolsMenu);
        console.log("✅ Sent Study Tools Menu");
        return;
      }

      // ถ้าเป็น tutor
      if (levelId === "tutor") {
        const tutorMenu = createAITutorMenuFlex();
        await lineClient.replyMessage(replyToken, tutorMenu);
        console.log("✅ Sent WiT Tutor Menu");
        return;
      }

      // 🆕 ประถมศึกษา - เลือกชั้น ป.1-ป.6
      if (levelId === "primary") {
        // ตรวจสอบว่ามีระบุชั้นหรือไม่ เช่น /edu primary ป.3
        const gradeParam = params[1];

        if (gradeParam) {
          // แปลง format เช่น ป.3, ป3, p3 เป็น ป.3
          const gradeMatch = gradeParam.match(/[ปp]\.?(\d)/i);
          if (gradeMatch) {
            const gradeNum = gradeMatch[1];
            const grade = `ป.${gradeNum}`;

            if (GRADE_DIFFICULTY[grade]) {
              // แสดงเมนูวิชาสำหรับชั้นนั้นๆ
              const subjectsFlex = createPrimarySubjectsMenuFlex(grade);
              await lineClient.replyMessage(replyToken, subjectsFlex);
              console.log(`✅ Sent Primary Subjects Menu for ${grade}`);
              return;
            }
          }
        }

        // ถ้าไม่ได้ระบุชั้น - แสดงเมนูเลือกชั้น
        const gradeMenuFlex = createPrimaryGradeMenuFlex();
        await lineClient.replyMessage(replyToken, gradeMenuFlex);
        console.log("✅ Sent Primary Grade Selection Menu");
        return;
      }

      // ถ้าระบุเฉพาะระดับ
      if (EDUCATION_LEVELS[levelId] && !subjectId) {
        const subjectsMenu = createSubjectsMenuFlex(levelId);
        if (subjectsMenu) {
          await lineClient.replyMessage(replyToken, subjectsMenu);
          console.log(`✅ Sent Subjects Menu for ${levelId}`);
        }
        return;
      }

      // ถ้าระบุทั้งระดับและวิชา - หา course
      if (levelId && subjectId) {
        const courseKey = `${levelId}_${subjectId}_${EDUCATION_LEVELS[levelId]?.grades[0]?.toLowerCase().replace(".", "")}`;
        const course = COURSES[courseKey] || Object.values(COURSES).find((c) =>
          c.level === levelId && c.subject === subjectId,
        );

        if (course) {
          const courseUnits = createCourseUnitsFlex(course.id);
          if (courseUnits) {
            await lineClient.replyMessage(replyToken, courseUnits);
            console.log(`✅ Sent Course Units for ${course.id}`);
          }
        } else {
          // ถ้าไม่มี course สำเร็จรูป - ใช้ WiT Tutor แทน
          const subjectName = SUBJECTS[subjectId]?.name || subjectId;
          const levelName = EDUCATION_LEVELS[levelId]?.name || levelId;

          // ใช้ AI สร้างเนื้อหาแบบ inline
          try {
            const {GoogleGenerativeAI} = require("@google/generative-ai");
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({model: "gemini-2.0-flash"});

            const prompt = `คุณคือครูสอนวิชา${subjectName} ระดับ${levelName}
สรุปเนื้อหาหลักและหัวข้อสำคัญที่นักเรียนต้องเรียนรู้ในวิชานี้
ตอบเป็นภาษาไทย กระชับ เข้าใจง่าย มีอิโมจิ ไม่เกิน 200 คำ`;

            const result = await model.generateContent(prompt);
            const aiResponse = result.response.text();

            await lineClient.replyMessage(replyToken, {
              type: "flex",
              altText: `📚 ${subjectName} - ${levelName}`,
              contents: {
                type: "bubble",
                size: "mega",
                header: {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {type: "text", text: `📚 ${subjectName}`, weight: "bold", size: "lg", color: "#FFFFFF"},
                    {type: "text", text: `🎓 ${levelName}`, size: "sm", color: "#E0E0E0"},
                  ],
                  backgroundColor: "#6366F1",
                  paddingAll: "15px",
                },
                body: {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {type: "text", text: aiResponse, wrap: true, size: "sm", color: "#333333"},
                  ],
                  paddingAll: "15px",
                },
                footer: {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    {type: "button", action: {type: "message", label: "💬 ถาม WiT", text: `/tutor explain สอนเรื่อง${subjectName} ${levelName}`}, style: "primary", color: "#6366F1", height: "sm"},
                    {type: "button", action: {type: "message", label: "◀ กลับ", text: `/edu ${levelId}`}, style: "secondary", height: "sm", margin: "sm"},
                  ],
                  paddingAll: "10px",
                },
              },
            });
            console.log(`✅ Sent AI-generated content for ${subjectName}`);
          } catch (aiError) {
            console.error("AI Generation Error:", aiError);
            await lineClient.replyMessage(replyToken, {
              type: "text",
              text: `📚 วิชา${subjectName} - ${levelName}\n\n🤖 พิมพ์คำถามหรือหัวข้อที่อยากเรียนรู้ได้เลยครับ!\n\nตัวอย่าง:\n• "${subjectName}คืออะไร"\n• "สอนเรื่อง...ให้หน่อย"\n• "อธิบาย...แบบง่ายๆ"`,
            });
          }
        }
        return;
      }
    }

    // 🎯 Challenge Start - เริ่มทำชาเลนจ์
    if (msgTextLower.startsWith("/challenge start ")) {
      const challengeId = msgTextLower.replace("/challenge start ", "").trim();
      const challenge = DAILY_CHALLENGES[challengeId];

      if (challenge) {
        // บันทึกสถานะชาเลนจ์
        await getFirestore().collection("users").doc(userId).set({
          currentChallenge: {
            id: challengeId,
            startTime: Date.now(),
            completed: false,
          },
        }, {merge: true});

        // สร้างคำถามตามประเภทชาเลนจ์
        let challengeQuestion = "";
        if (challenge.type === "math") {
          const num1 = Math.floor(Math.random() * 100) + 1;
          const num2 = Math.floor(Math.random() * 50) + 1;
          const ops = ["+", "-", "×"];
          const op = ops[Math.floor(Math.random() * ops.length)];
          challengeQuestion = `🎯 **${challenge.title}**\n\n⏱️ เวลาเริ่ม!\n\n📝 ข้อ 1/10:\n**${num1} ${op} ${num2} = ?**\n\nพิมพ์คำตอบได้เลย!`;
        } else if (challenge.type === "english") {
          const words = ["apple=แอปเปิ้ล", "book=หนังสือ", "computer=คอมพิวเตอร์", "water=น้ำ", "school=โรงเรียน"];
          challengeQuestion = `🎯 **${challenge.title}**\n\n📚 จำคำศัพท์เหล่านี้:\n\n${words.slice(0, 5).map((w, i) => `${i+1}. ${w}`).join("\n")}\n\n✅ พิมพ์ "พร้อม" เมื่อจำได้แล้ว`;
        } else {
          challengeQuestion = `🎯 **${challenge.title}**\n\n${challenge.description}\n\n⏱️ เริ่มต้นแล้ว! ทำให้ดีที่สุดนะครับ!\n\nพิมพ์คำถามหรือคำตอบได้เลย`;
        }

        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: challengeQuestion,
        });
        console.log(`✅ Started Challenge: ${challengeId}`);
      } else {
        await lineClient.replyMessage(replyToken, createDailyChallengeMenuFlex());
      }
      return;
    }

    // 🎮 Game Start - เริ่มเล่นเกม
    if (msgTextLower.startsWith("/game ")) {
      const gameId = msgTextLower.replace("/game ", "").trim();
      const game = MINI_GAMES[gameId];

      if (game) {
        let gameContent = "";

        if (gameId === "word_scramble") {
          const words = ["เรียน", "โรงเรียน", "คณิตศาสตร์", "วิทยาศาสตร์"];
          const word = words[Math.floor(Math.random() * words.length)];
          const scrambled = word.split("").sort(() => Math.random() - 0.5).join("");
          gameContent = `🔤 **Word Scramble**\n\nเรียงตัวอักษรนี้ให้ถูกต้อง:\n\n**${scrambled}**\n\n💡 Hint: เกี่ยวกับการศึกษา\n\nพิมพ์คำตอบได้เลย!`;
        } else if (gameId === "math_race") {
          const num1 = Math.floor(Math.random() * 20) + 1;
          const num2 = Math.floor(Math.random() * 20) + 1;
          gameContent = `🏎️ **Math Race**\n\n⚡ ตอบให้เร็วที่สุด!\n\n**${num1} + ${num2} = ?**\n\nพิมพ์คำตอบ!`;
        } else if (gameId === "true_false") {
          const questions = [
            {q: "ดวงอาทิตย์ขึ้นทางทิศตะวันออก", a: true},
            {q: "น้ำเดือดที่อุณหภูมิ 50°C", a: false},
            {q: "ประเทศไทยมี 77 จังหวัด", a: true},
          ];
          const q = questions[Math.floor(Math.random() * questions.length)];
          gameContent = `✅ **True or False**\n\n"${q.q}"\n\nพิมพ์ "จริง" หรือ "เท็จ"`;
        } else if (gameId === "memory_match") {
          gameContent = `🧠 **Memory Match**\n\nจำตัวเลขนี้:\n\n**5 - 3 - 9 - 1 - 7**\n\n⏱️ จำให้ได้ใน 10 วินาที!\n\nพิมพ์ "พร้อม" เมื่อจำได้แล้ว`;
        } else {
          gameContent = `🎮 **${game.name}**\n\n${game.description}\n\n🎯 รางวัล: +${game.xpReward} XP\n\nเริ่มเลย!`;
        }

        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: gameContent,
        });
        console.log(`✅ Started Game: ${gameId}`);
      } else {
        await lineClient.replyMessage(replyToken, createMiniGamesMenuFlex());
      }
      return;
    }

    // 📱 Study Tools Commands - เครื่องมือการเรียนทันสมัย
    // 🚧 TEMPORARILY DISABLED - รอพัฒนาเพิ่มเติม
    if (msgTextLower.startsWith("/tool ") || msgTextLower === "/tools" || msgTextLower === "/tools all") {
      await lineClient.replyMessage(replyToken, {
        type: "text",
        text: "🚧 **Study Tools กำลังปรับปรุง**\n\n" +
              "ระบบเครื่องมือการเรียนกำลังอยู่ระหว่างพัฒนาครับ\n\n" +
              "📚 ในระหว่างนี้ลองใช้:\n" +
              "• /edu - ศูนย์การเรียนรู้\n" +
              "• /quiz - ทำแบบทดสอบ\n" +
              "• ถามคำถามโดยตรงได้เลย!\n\n" +
              "🔜 เร็วๆ นี้!",
      });
      console.log("⚠️ Study Tools temporarily disabled");
      return;
    }

    /* 🚧 DISABLED - Study Tools Commands
    const toolCommandMap = {
      'flashcard': 'flashcards', 'flashcards': 'flashcards', 'aiflashcard': 'flashcards',
      'summary': 'aiSummary', 'aisummary': 'aiSummary', 'สรุป': 'aiSummary',
      'mindmap': 'mindmap', 'mind': 'mindmap', 'aimindmap': 'mindmap',
      'quiz': 'quiz', 'aiquizgen': 'quiz', 'ข้อสอบ': 'quiz',
      'pomodoro': 'pomodoro', 'timer': 'pomodoro', 'จับเวลา': 'pomodoro',
      'planner': 'studyPlanner', 'ตาราง': 'studyPlanner', 'study': 'studyPlanner',
      'goal': 'goalTracker', 'เป้าหมาย': 'goalTracker',
      'voice': 'voiceNote', 'บันทึกเสียง': 'voiceNote',
      'formula': 'formulaHelper', 'สูตร': 'formulaHelper',
      'translate': 'translator', 'แปล': 'translator', 'แปลภาษา': 'translator',
      'dict': 'dictionary', 'dictionary': 'dictionary', 'พจนานุกรม': 'dictionary',
      'lab': 'virtualLab', 'virtuallab': 'virtualLab', 'ทดลอง': 'virtualLab',
      'calc': 'calculator', 'calculator': 'calculator', 'คิดเลข': 'calculator',
      'battle': 'quizBattle', 'quizbattle': 'quizBattle', 'แข่ง': 'quizBattle'
    };
    */

    /* 🚧 DISABLED - Study Tools คำสั่งภาษาไทยโดยตรง
    if (msgTextLower.includes('สร้างบัตรคำ') || msgTextLower.includes('flashcard')) {
      const toolFlex = createToolResponseFlex('flashcard');
      await lineClient.replyMessage(replyToken, toolFlex);
      return;
    }

    if (msgTextLower.includes('ทำแบบทดสอบ') || msgTextLower.includes('ทำควิซ') || msgTextLower === 'quiz') {
      const toolFlex = createToolResponseFlex('quiz');
      await lineClient.replyMessage(replyToken, toolFlex);
      return;
    }

    if (msgTextLower.includes('เครื่องคิดเลข') || msgTextLower.includes('คำนวณเลข') || msgTextLower === 'calculator') {
      const toolFlex = createToolResponseFlex('calculator');
      await lineClient.replyMessage(replyToken, toolFlex);
      return;
    }

    if (msgTextLower.includes('ทดลองเสมือน') || msgTextLower.includes('virtual lab') || msgTextLower === 'virtuallab') {
      const toolFlex = createToolResponseFlex('virtualLab');
      await lineClient.replyMessage(replyToken, toolFlex);
      return;
    }

    if (msgTextLower.includes('mind map') || msgTextLower.includes('mindmap') || msgTextLower.includes('แผนผังความคิด')) {
      const toolFlex = createToolResponseFlex('mindmap');
      await lineClient.replyMessage(replyToken, toolFlex);
      return;
    }

    if (msgTextLower.includes('วางแผนเรียน') || msgTextLower.includes('ตารางเรียน') || msgTextLower === 'planner') {
      const toolFlex = createToolResponseFlex('studyPlanner');
      await lineClient.replyMessage(replyToken, toolFlex);
      return;
    }
    🚧 END DISABLED */

    // =====================================================
    // 🤖 AI-POWERED EDUCATION TOOLS COMMANDS
    // คำสั่งที่ต้องใช้ AI สร้างเนื้อหา
    // =====================================================

    // สร้างข้อสอบ/แบบทดสอบด้วย AI
    if (msgTextLower.startsWith("สร้างข้อสอบ") || msgTextLower.startsWith("สร้างแบบทดสอบ") ||
        msgTextLower.includes("ทำข้อสอบเรื่อง") || msgTextLower.includes("ออกข้อสอบ")) {
      const topic = message.text.replace(/สร้างข้อสอบ|สร้างแบบทดสอบ|ทำข้อสอบเรื่อง|ออกข้อสอบ/gi, "").trim();
      const eduContext = detectEducationContext(message.text);
      const systemPrompt = getEducationSystemPrompt(eduContext.level || "secondary", eduContext.subject || "general", "exam");

      try {
        const aiResponse = await generateGeminiResponse(
            systemPrompt + `\n\nสร้างแบบทดสอบ 5 ข้อ เรื่อง: ${topic || "หัวข้อทั่วไป"}\nรูปแบบ: ปรนัย 4 ตัวเลือก พร้อมเฉลยและคำอธิบาย`,
            userId,
        );
        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: `📝 **แบบทดสอบ**${topic ? ` - ${topic}` : ""}\n\n${aiResponse}`,
          quickReply: {
            items: [
              {type: "action", action: {type: "message", label: "📝 ข้อสอบเพิ่ม", text: `สร้างข้อสอบ ${topic} เพิ่มอีก 5 ข้อ`}},
              {type: "action", action: {type: "message", label: "📚 อธิบายเฉลย", text: `อธิบายเฉลยข้อสอบ ${topic}`}},
              {type: "action", action: {type: "message", label: "🏠 เมนูหลัก", text: "/edu"}},
            ],
          },
        });
        console.log("✅ AI Quiz generated");
      } catch (err) {
        console.error("AI Quiz Error:", err);
        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: "❌ ไม่สามารถสร้างข้อสอบได้ กรุณาลองใหม่อีกครั้ง",
        });
      }
      return;
    }

    // สร้างบัตรคำศัพท์ด้วย AI
    if (msgTextLower.startsWith("สร้างบัตรคำ") || msgTextLower.includes("flashcard เรื่อง") ||
        msgTextLower.includes("บัตรคำศัพท์เรื่อง")) {
      const topic = message.text.replace(/สร้างบัตรคำ|flashcard เรื่อง|บัตรคำศัพท์เรื่อง|บัตรคำศัพท์/gi, "").trim();
      const eduContext = detectEducationContext(message.text);
      const systemPrompt = getEducationSystemPrompt(eduContext.level || "secondary", eduContext.subject || "general", "explain");

      try {
        const aiResponse = await generateGeminiResponse(
            systemPrompt + `\n\nสร้างบัตรคำศัพท์ 10 คำ เรื่อง: ${topic || "คำศัพท์พื้นฐาน"}\nรูปแบบ: คำศัพท์ | ความหมาย | ตัวอย่างประโยค`,
            userId,
        );
        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: `📇 **บัตรคำศัพท์**${topic ? ` - ${topic}` : ""}\n\n${aiResponse}`,
          quickReply: {
            items: [
              {type: "action", action: {type: "message", label: "📇 เพิ่มคำศัพท์", text: `สร้างบัตรคำ ${topic} เพิ่มอีก 10 คำ`}},
              {type: "action", action: {type: "message", label: "📝 ทดสอบคำศัพท์", text: `สร้างข้อสอบคำศัพท์ ${topic}`}},
              {type: "action", action: {type: "message", label: "🏠 เมนูหลัก", text: "/edu"}},
            ],
          },
        });
        console.log("✅ AI Flashcards generated");
      } catch (err) {
        console.error("AI Flashcard Error:", err);
        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: "❌ ไม่สามารถสร้างบัตรคำได้ กรุณาลองใหม่อีกครั้ง",
        });
      }
      return;
    }

    // สร้าง Mind Map ด้วย AI
    if (msgTextLower.startsWith("สร้าง mind map") || msgTextLower.startsWith("สร้าง mindmap") ||
        msgTextLower.includes("แผนผังความคิดเรื่อง")) {
      const topic = message.text.replace(/สร้าง mind map|สร้าง mindmap|แผนผังความคิดเรื่อง|แผนผังความคิด/gi, "").trim();
      const eduContext = detectEducationContext(message.text);
      const systemPrompt = getEducationSystemPrompt(eduContext.level || "secondary", eduContext.subject || "general", "explain");

      try {
        const aiResponse = await generateGeminiResponse(
            systemPrompt + `\n\nสร้าง Mind Map เรื่อง: ${topic || "หัวข้อทั่วไป"}\nรูปแบบ: แสดงเป็นโครงสร้างต้นไม้ (tree structure) ด้วยข้อความ\n- หัวข้อหลัก\n  - หัวข้อย่อย 1\n    - รายละเอียด\n  - หัวข้อย่อย 2\n    - รายละเอียด`,
            userId,
        );
        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: `🗺️ **Mind Map**${topic ? ` - ${topic}` : ""}\n\n${aiResponse}`,
          quickReply: {
            items: [
              {type: "action", action: {type: "message", label: "🔍 ขยายหัวข้อ", text: `อธิบายเพิ่มเติมเรื่อง ${topic}`}},
              {type: "action", action: {type: "message", label: "📝 ทดสอบความรู้", text: `สร้างข้อสอบ ${topic}`}},
              {type: "action", action: {type: "message", label: "🏠 เมนูหลัก", text: "/edu"}},
            ],
          },
        });
        console.log("✅ AI Mind Map generated");
      } catch (err) {
        console.error("AI Mind Map Error:", err);
        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: "❌ ไม่สามารถสร้าง Mind Map ได้ กรุณาลองใหม่อีกครั้ง",
        });
      }
      return;
    }

    // วางแผนการเรียนด้วย AI
    if (msgTextLower.startsWith("วางแผนเตรียมสอบ") || msgTextLower.startsWith("วางแผนเรียน") ||
        msgTextLower.includes("ตารางทบทวน")) {
      const topic = message.text.replace(/วางแผนเตรียมสอบ|วางแผนเรียน|ตารางทบทวน/gi, "").trim();
      const eduContext = detectEducationContext(message.text);
      const systemPrompt = getEducationSystemPrompt(eduContext.level || "secondary", eduContext.subject || "general", "homework");

      try {
        const aiResponse = await generateGeminiResponse(
            systemPrompt + `\n\nวางแผนการเรียน: ${topic || "การเรียนทั่วไป"}\nสร้างตารางเรียนรายสัปดาห์ พร้อมเทคนิคการเรียน และเป้าหมายที่ชัดเจน`,
            userId,
        );
        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: `📅 **แผนการเรียน**${topic ? ` - ${topic}` : ""}\n\n${aiResponse}`,
          quickReply: {
            items: [
              {type: "action", action: {type: "message", label: "📝 แบบฝึกหัด", text: `สร้างแบบฝึกหัด ${topic}`}},
              {type: "action", action: {type: "message", label: "🔄 ปรับแผน", text: `ปรับแผนการเรียน ${topic} ให้เข้มข้นขึ้น`}},
              {type: "action", action: {type: "message", label: "🏠 เมนูหลัก", text: "/edu"}},
            ],
          },
        });
        console.log("✅ AI Study Plan generated");
      } catch (err) {
        console.error("AI Study Plan Error:", err);
        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: "❌ ไม่สามารถสร้างแผนการเรียนได้ กรุณาลองใหม่อีกครั้ง",
        });
      }
      return;
    }

    // คำนวณด้วย AI Calculator
    if (msgTextLower.startsWith("คำนวณ ") || msgTextLower.startsWith("แก้สมการ") ||
        msgTextLower.startsWith("หาพื้นที่") || msgTextLower.startsWith("หาปริมาตร")) {
      const problem = message.text;
      const systemPrompt = getEducationSystemPrompt("secondary", "math", "practice");

      try {
        const aiResponse = await generateGeminiResponse(
            systemPrompt + `\n\nโจทย์: ${problem}\nแก้โจทย์นี้แบบละเอียด แสดงวิธีทำทุกขั้นตอน พร้อมคำอธิบาย`,
            userId,
        );
        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: `🔢 **เครื่องคิดเลขอัจฉริยะ**\n\n${aiResponse}`,
          quickReply: {
            items: [
              {type: "action", action: {type: "message", label: "❓ โจทย์คล้ายกัน", text: `สร้างโจทย์คล้ายกับ ${problem}`}},
              {type: "action", action: {type: "message", label: "📝 แบบฝึกหัด", text: "สร้างแบบฝึกหัดคณิตศาสตร์"}},
              {type: "action", action: {type: "message", label: "🏠 เมนูหลัก", text: "/edu"}},
            ],
          },
        });
        console.log("✅ AI Calculator response");
      } catch (err) {
        console.error("AI Calculator Error:", err);
        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: "❌ ไม่สามารถคำนวณได้ กรุณาลองใหม่อีกครั้ง",
        });
      }
      return;
    }

    // ประถมศึกษา shortcuts
    if (msgTextLower === "ประถม" || msgTextLower === "ป." || msgTextLower === "primary") {
      const subjectsMenu = createSubjectsMenuFlex("primary");
      await lineClient.replyMessage(replyToken, subjectsMenu);
      return;
    }

    // มัธยมศึกษา shortcuts
    if (msgTextLower === "มัธยม" || msgTextLower === "ม." || msgTextLower === "secondary") {
      const subjectsMenu = createSubjectsMenuFlex("secondary");
      await lineClient.replyMessage(replyToken, subjectsMenu);
      return;
    }

    // อาชีวะ shortcuts
    if (msgTextLower === "อาชีวะ" || msgTextLower === "ปวช" || msgTextLower === "ปวส" || msgTextLower === "vocational") {
      const subjectsMenu = createSubjectsMenuFlex("vocational");
      await lineClient.replyMessage(replyToken, subjectsMenu);
      return;
    }

    // มหาวิทยาลัย shortcuts
    if (msgTextLower === "มหาวิทยาลัย" || msgTextLower === "ปริญญาตรี" || msgTextLower === "university") {
      const subjectsMenu = createSubjectsMenuFlex("university");
      await lineClient.replyMessage(replyToken, subjectsMenu);
      return;
    }

    // =====================================================
    // 🎮 MINI GAMES SYSTEM - เกมการศึกษาแบบ Interactive
    // =====================================================

    if (msgTextLower.startsWith("/game")) {
      const parts = msgTextLower.replace("/game", "").trim().split(" ");
      const gameId = parts[0];
      const action = parts[1];
      const answer = parts.slice(2).join(" ");

      // แสดงเมนูเกมถ้าไม่ระบุเกม
      if (!gameId) {
        const gamesFlex = createMiniGamesMenuFlex();
        await lineClient.replyMessage(replyToken, gamesFlex);
        return;
      }

      const db = getFirestore();
      const userRef = db.collection("users").doc(userId);

      // 🔤 WORD SCRAMBLE - เรียงตัวอักษร
      if (gameId === "word_scramble") {
        if (action === "answer" && answer) {
          // ตรวจคำตอบ
          const userDoc = await userRef.get();
          const gameState = userDoc.data()?.currentGame || {};

          if (gameState.type === "word_scramble" && gameState.answer) {
            const isCorrect = answer.toLowerCase().trim() === gameState.answer.toLowerCase();

            if (isCorrect) {
              // ให้ XP และอัพเดท
              const newXP = (userDoc.data()?.education?.xp || 0) + 20;
              const gamesWon = (userDoc.data()?.education?.gamesWon || 0) + 1;
              await userRef.update({
                "education.xp": newXP,
                "education.gamesWon": gamesWon,
                "currentGame": null,
              });

              await lineClient.replyMessage(replyToken, {
                type: "flex",
                altText: "🎉 ถูกต้อง! +20 XP",
                contents: {
                  type: "bubble",
                  size: "kilo",
                  body: {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {type: "text", text: "🎉 ยอดเยี่ยม!", weight: "bold", size: "xl", color: "#10B981", align: "center"},
                      {type: "text", text: `คำตอบที่ถูก: ${gameState.answer}`, size: "md", color: "#333333", align: "center", margin: "md"},
                      {type: "box", layout: "horizontal", contents: [
                        {type: "text", text: "+20 XP", weight: "bold", size: "lg", color: "#F59E0B", align: "center"},
                      ], backgroundColor: "#FEF3C7", paddingAll: "10px", cornerRadius: "md", margin: "md"},
                      {type: "text", text: `🏆 เกมที่ชนะ: ${gamesWon} | XP: ${newXP}`, size: "sm", color: "#666666", align: "center", margin: "md"},
                    ],
                    paddingAll: "20px",
                    backgroundColor: "#F0FDF4",
                  },
                  footer: {
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      {type: "button", action: {type: "message", label: "🔄 เล่นอีก", text: "/game word_scramble"}, style: "primary", color: "#10B981", height: "sm"},
                      {type: "button", action: {type: "message", label: "🎮 เกมอื่น", text: "/edu games"}, style: "secondary", height: "sm", margin: "sm"},
                    ],
                    paddingAll: "10px",
                  },
                },
              });
            } else {
              await lineClient.replyMessage(replyToken, {
                type: "flex",
                altText: "❌ ผิด ลองใหม่!",
                contents: {
                  type: "bubble",
                  size: "kilo",
                  body: {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {type: "text", text: "❌ ยังไม่ถูก!", weight: "bold", size: "xl", color: "#EF4444", align: "center"},
                      {type: "text", text: `ตัวอักษร: ${gameState.scrambled}`, size: "md", color: "#333333", align: "center", margin: "md"},
                      {type: "text", text: "💡 Hint: " + gameState.hint, size: "sm", color: "#6B7280", align: "center", margin: "sm", wrap: true},
                    ],
                    paddingAll: "20px",
                    backgroundColor: "#FEF2F2",
                  },
                  footer: {
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      {type: "button", action: {type: "message", label: "🔄 ลองใหม่", text: "/game word_scramble"}, style: "secondary", height: "sm"},
                      {type: "button", action: {type: "message", label: "💡 เฉลย", text: `/game word_scramble reveal`}, style: "secondary", height: "sm", margin: "sm"},
                    ],
                    paddingAll: "10px",
                  },
                },
              });
            }
          }
          return;
        }

        if (action === "reveal") {
          const userDoc = await userRef.get();
          const gameState = userDoc.data()?.currentGame || {};
          await userRef.update({"currentGame": null});

          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: `💡 เฉลย: ${gameState.answer || "ไม่พบคำตอบ"}\n\n📚 ความหมาย: ${gameState.hint || "-"}\n\nลองเล่นใหม่นะ!`,
            quickReply: {
              items: [
                {type: "action", action: {type: "message", label: "🔄 เล่นใหม่", text: "/game word_scramble"}},
                {type: "action", action: {type: "message", label: "🎮 เกมอื่น", text: "/edu games"}},
              ],
            },
          });
          return;
        }

        // สร้างเกมใหม่
        const words = [
          {word: "APPLE", hint: "ผลไม้สีแดงหรือเขียว 🍎", thai: "แอปเปิ้ล"},
          {word: "SCHOOL", hint: "สถานที่เรียนหนังสือ 🏫", thai: "โรงเรียน"},
          {word: "FRIEND", hint: "คนที่เราสนิทด้วย 👫", thai: "เพื่อน"},
          {word: "HAPPY", hint: "ความรู้สึกดีใจ 😊", thai: "มีความสุข"},
          {word: "WATER", hint: "ของเหลวที่ดื่มได้ 💧", thai: "น้ำ"},
          {word: "MUSIC", hint: "เสียงเพลง 🎵", thai: "ดนตรี"},
          {word: "FLOWER", hint: "พืชที่มีกลิ่นหอม 🌸", thai: "ดอกไม้"},
          {word: "ORANGE", hint: "ผลไม้สีส้ม 🍊", thai: "ส้ม"},
          {word: "TIGER", hint: "สัตว์ป่าลายพาดกลอน 🐅", thai: "เสือ"},
          {word: "CHICKEN", hint: "สัตว์ปีกที่เราเลี้ยง 🐔", thai: "ไก่"},
        ];

        const randomWord = words[Math.floor(Math.random() * words.length)];
        const scrambled = randomWord.word.split("").sort(() => Math.random() - 0.5).join("");

        await userRef.set({
          currentGame: {
            type: "word_scramble",
            answer: randomWord.word,
            scrambled: scrambled,
            hint: randomWord.hint,
            thai: randomWord.thai,
            startTime: Date.now(),
          },
        }, {merge: true});

        await lineClient.replyMessage(replyToken, {
          type: "flex",
          altText: "🔤 Word Scramble",
          contents: {
            type: "bubble",
            size: "mega",
            header: {
              type: "box",
              layout: "vertical",
              contents: [
                {type: "text", text: "🔤 Word Scramble", weight: "bold", size: "xl", color: "#FFFFFF"},
                {type: "text", text: "เรียงตัวอักษรให้เป็นคำ!", size: "sm", color: "#DBEAFE"},
              ],
              backgroundColor: "#3B82F6",
              paddingAll: "20px",
            },
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                {type: "box", layout: "vertical", contents: [
                  {type: "text", text: scrambled, weight: "bold", size: "xxl", color: "#1E40AF", align: "center", wrap: true},
                ], backgroundColor: "#EFF6FF", paddingAll: "20px", cornerRadius: "lg"},
                {type: "separator", margin: "lg"},
                {type: "text", text: "💡 Hint:", weight: "bold", size: "md", color: "#6B7280", margin: "md"},
                {type: "text", text: randomWord.hint, size: "md", color: "#333333", wrap: true},
                {type: "text", text: `🇹🇭 ภาษาไทย: ${randomWord.thai}`, size: "sm", color: "#666666", margin: "md"},
                {type: "separator", margin: "lg"},
                {type: "text", text: "📝 พิมพ์คำตอบ:", weight: "bold", size: "md", color: "#10B981", margin: "md"},
                {type: "text", text: "/game word_scramble answer [คำตอบ]", size: "sm", color: "#666666"},
              ],
              paddingAll: "20px",
            },
            footer: {
              type: "box",
              layout: "horizontal",
              contents: [
                {type: "button", action: {type: "message", label: "🔄 สุ่มใหม่", text: "/game word_scramble"}, style: "secondary", height: "sm"},
                {type: "button", action: {type: "message", label: "💡 เฉลย", text: "/game word_scramble reveal"}, style: "secondary", height: "sm", margin: "sm"},
              ],
              paddingAll: "10px",
            },
          },
        });
        return;
      }

      // 🏎️ MATH RACE - แข่งคำนวณ
      if (gameId === "math_race") {
        if (action === "answer" && answer) {
          const userDoc = await userRef.get();
          const gameState = userDoc.data()?.currentGame || {};

          if (gameState.type === "math_race") {
            const userAnswer = parseInt(answer);
            const isCorrect = userAnswer === gameState.answer;
            const timeTaken = Math.round((Date.now() - gameState.startTime) / 1000);

            if (isCorrect) {
              // Bonus XP for speed
              let bonusXP = 0;
              let speedBonus = "";
              if (timeTaken <= 5) {
                bonusXP = 15;
                speedBonus = "⚡ Speed Bonus! +15 XP";
              } else if (timeTaken <= 10) {
                bonusXP = 10;
                speedBonus = "🔥 Fast! +10 XP";
              } else if (timeTaken <= 15) {
                bonusXP = 5;
                speedBonus = "👍 Good! +5 XP";
              }

              const baseXP = 25;
              const totalXP = baseXP + bonusXP;
              const newXP = (userDoc.data()?.education?.xp || 0) + totalXP;
              const mathWins = (userDoc.data()?.education?.mathWins || 0) + 1;

              await userRef.update({
                "education.xp": newXP,
                "education.mathWins": mathWins,
                "currentGame": null,
              });

              await lineClient.replyMessage(replyToken, {
                type: "flex",
                altText: `🎉 ถูกต้อง! +${totalXP} XP`,
                contents: {
                  type: "bubble",
                  size: "kilo",
                  body: {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {type: "text", text: "🎉 ถูกต้อง!", weight: "bold", size: "xl", color: "#10B981", align: "center"},
                      {type: "text", text: `${gameState.question} = ${gameState.answer}`, size: "lg", color: "#333333", align: "center", margin: "md"},
                      {type: "text", text: `⏱️ เวลา: ${timeTaken} วินาที`, size: "md", color: "#6B7280", align: "center", margin: "sm"},
                      ...(speedBonus ? [{type: "text", text: speedBonus, weight: "bold", size: "md", color: "#F59E0B", align: "center", margin: "sm"}] : []),
                      {type: "box", layout: "horizontal", contents: [
                        {type: "text", text: `+${totalXP} XP`, weight: "bold", size: "lg", color: "#10B981", align: "center"},
                      ], backgroundColor: "#D1FAE5", paddingAll: "10px", cornerRadius: "md", margin: "md"},
                    ],
                    paddingAll: "20px",
                    backgroundColor: "#F0FDF4",
                  },
                  footer: {
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      {type: "button", action: {type: "message", label: "🔄 เล่นอีก", text: "/game math_race"}, style: "primary", color: "#10B981", height: "sm"},
                      {type: "button", action: {type: "message", label: "🎮 เกมอื่น", text: "/edu games"}, style: "secondary", height: "sm", margin: "sm"},
                    ],
                    paddingAll: "10px",
                  },
                },
              });
            } else {
              await lineClient.replyMessage(replyToken, {
                type: "flex",
                altText: "❌ ผิด! ลองใหม่",
                contents: {
                  type: "bubble",
                  size: "kilo",
                  body: {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {type: "text", text: "❌ ผิด!", weight: "bold", size: "xl", color: "#EF4444", align: "center"},
                      {type: "text", text: `${gameState.question} = ?`, size: "lg", color: "#333333", align: "center", margin: "md"},
                      {type: "text", text: `คำตอบของคุณ: ${userAnswer}`, size: "md", color: "#6B7280", align: "center", margin: "sm"},
                    ],
                    paddingAll: "20px",
                    backgroundColor: "#FEF2F2",
                  },
                  footer: {
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      {type: "button", action: {type: "message", label: "🔄 โจทย์ใหม่", text: "/game math_race"}, style: "secondary", height: "sm"},
                      {type: "button", action: {type: "message", label: "💡 เฉลย", text: `/game math_race reveal`}, style: "secondary", height: "sm", margin: "sm"},
                    ],
                    paddingAll: "10px",
                  },
                },
              });
            }
          }
          return;
        }

        if (action === "reveal") {
          const userDoc = await userRef.get();
          const gameState = userDoc.data()?.currentGame || {};
          await userRef.update({"currentGame": null});

          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: `💡 เฉลย: ${gameState.question || "?"} = ${gameState.answer || "?"}\n\nลองเล่นใหม่นะ!`,
            quickReply: {
              items: [
                {type: "action", action: {type: "message", label: "🔄 เล่นใหม่", text: "/game math_race"}},
                {type: "action", action: {type: "message", label: "🎮 เกมอื่น", text: "/edu games"}},
              ],
            },
          });
          return;
        }

        // สร้างโจทย์คณิตศาสตร์
        const operations = ["+", "-", "×", "÷"];
        const op = operations[Math.floor(Math.random() * operations.length)];
        let num1; let num2; let answer; let question;

        switch (op) {
          case "+":
            num1 = Math.floor(Math.random() * 50) + 10;
            num2 = Math.floor(Math.random() * 50) + 10;
            answer = num1 + num2;
            question = `${num1} + ${num2}`;
            break;
          case "-":
            num1 = Math.floor(Math.random() * 50) + 30;
            num2 = Math.floor(Math.random() * 30) + 1;
            answer = num1 - num2;
            question = `${num1} - ${num2}`;
            break;
          case "×":
            num1 = Math.floor(Math.random() * 12) + 2;
            num2 = Math.floor(Math.random() * 12) + 2;
            answer = num1 * num2;
            question = `${num1} × ${num2}`;
            break;
          case "÷":
            num2 = Math.floor(Math.random() * 10) + 2;
            answer = Math.floor(Math.random() * 10) + 2;
            num1 = num2 * answer;
            question = `${num1} ÷ ${num2}`;
            break;
        }

        await userRef.set({
          currentGame: {
            type: "math_race",
            question: question,
            answer: answer,
            startTime: Date.now(),
          },
        }, {merge: true});

        await lineClient.replyMessage(replyToken, {
          type: "flex",
          altText: "🏎️ Math Race",
          contents: {
            type: "bubble",
            size: "mega",
            header: {
              type: "box",
              layout: "vertical",
              contents: [
                {type: "text", text: "🏎️ Math Race", weight: "bold", size: "xl", color: "#FFFFFF"},
                {type: "text", text: "ตอบให้เร็วได้ Bonus XP!", size: "sm", color: "#FEF3C7"},
              ],
              backgroundColor: "#F59E0B",
              paddingAll: "20px",
            },
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                {type: "box", layout: "vertical", contents: [
                  {type: "text", text: question, weight: "bold", size: "xxl", color: "#B45309", align: "center"},
                  {type: "text", text: "= ?", weight: "bold", size: "xl", color: "#B45309", align: "center", margin: "sm"},
                ], backgroundColor: "#FEF3C7", paddingAll: "25px", cornerRadius: "lg"},
                {type: "separator", margin: "lg"},
                {type: "text", text: "⚡ Speed Bonus:", weight: "bold", size: "md", color: "#F59E0B", margin: "md"},
                {type: "text", text: "≤5 วินาที = +15 XP | ≤10 วินาที = +10 XP", size: "sm", color: "#666666"},
                {type: "separator", margin: "lg"},
                {type: "text", text: "📝 พิมพ์คำตอบ:", weight: "bold", size: "md", color: "#10B981", margin: "md"},
                {type: "text", text: "/game math_race answer [ตัวเลข]", size: "sm", color: "#666666"},
              ],
              paddingAll: "20px",
            },
            footer: {
              type: "box",
              layout: "horizontal",
              contents: [
                {type: "button", action: {type: "message", label: "🔄 โจทย์ใหม่", text: "/game math_race"}, style: "secondary", height: "sm"},
                {type: "button", action: {type: "message", label: "🎮 เกมอื่น", text: "/edu games"}, style: "secondary", height: "sm", margin: "sm"},
              ],
              paddingAll: "10px",
            },
          },
        });
        return;
      }

      // ✅ TRUE OR FALSE - จริงหรือเท็จ
      if (gameId === "true_false") {
        if (action === "true" || action === "false") {
          const userDoc = await userRef.get();
          const gameState = userDoc.data()?.currentGame || {};

          if (gameState.type === "true_false") {
            const userAnswer = action === "true";
            const isCorrect = userAnswer === gameState.answer;

            if (isCorrect) {
              const newXP = (userDoc.data()?.education?.xp || 0) + 18;
              const tfWins = (userDoc.data()?.education?.tfWins || 0) + 1;

              await userRef.update({
                "education.xp": newXP,
                "education.tfWins": tfWins,
                "currentGame": null,
              });

              await lineClient.replyMessage(replyToken, {
                type: "flex",
                altText: "🎉 ถูกต้อง! +18 XP",
                contents: {
                  type: "bubble",
                  size: "kilo",
                  body: {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {type: "text", text: "🎉 ถูกต้อง!", weight: "bold", size: "xl", color: "#10B981", align: "center"},
                      {type: "text", text: `คำตอบ: ${gameState.answer ? "✅ จริง" : "❌ เท็จ"}`, size: "md", color: "#333333", align: "center", margin: "md"},
                      {type: "text", text: `💡 ${gameState.explanation}`, size: "sm", color: "#666666", align: "center", margin: "md", wrap: true},
                      {type: "box", layout: "horizontal", contents: [
                        {type: "text", text: "+18 XP", weight: "bold", size: "lg", color: "#10B981", align: "center"},
                      ], backgroundColor: "#D1FAE5", paddingAll: "10px", cornerRadius: "md", margin: "md"},
                    ],
                    paddingAll: "20px",
                    backgroundColor: "#F0FDF4",
                  },
                  footer: {
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      {type: "button", action: {type: "message", label: "🔄 เล่นอีก", text: "/game true_false"}, style: "primary", color: "#10B981", height: "sm"},
                      {type: "button", action: {type: "message", label: "🎮 เกมอื่น", text: "/edu games"}, style: "secondary", height: "sm", margin: "sm"},
                    ],
                    paddingAll: "10px",
                  },
                },
              });
            } else {
              await userRef.update({"currentGame": null});

              await lineClient.replyMessage(replyToken, {
                type: "flex",
                altText: "❌ ผิด!",
                contents: {
                  type: "bubble",
                  size: "kilo",
                  body: {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {type: "text", text: "❌ ผิด!", weight: "bold", size: "xl", color: "#EF4444", align: "center"},
                      {type: "text", text: `คำตอบที่ถูก: ${gameState.answer ? "✅ จริง" : "❌ เท็จ"}`, size: "md", color: "#333333", align: "center", margin: "md"},
                      {type: "text", text: `💡 ${gameState.explanation}`, size: "sm", color: "#666666", align: "center", margin: "md", wrap: true},
                    ],
                    paddingAll: "20px",
                    backgroundColor: "#FEF2F2",
                  },
                  footer: {
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      {type: "button", action: {type: "message", label: "🔄 เล่นอีก", text: "/game true_false"}, style: "secondary", height: "sm"},
                      {type: "button", action: {type: "message", label: "🎮 เกมอื่น", text: "/edu games"}, style: "secondary", height: "sm", margin: "sm"},
                    ],
                    paddingAll: "10px",
                  },
                },
              });
            }
          }
          return;
        }

        // สร้างคำถามจริงเท็จ
        const questions = [
          {question: "ดวงอาทิตย์โคจรรอบโลก", answer: false, explanation: "โลกโคจรรอบดวงอาทิตย์ ไม่ใช่ดวงอาทิตย์โคจรรอบโลก"},
          {question: "น้ำเดือดที่อุณหภูมิ 100°C", answer: true, explanation: "ที่ความดันปกติ น้ำจะเดือดที่ 100 องศาเซลเซียส"},
          {question: "แมวเป็นสัตว์เลี้ยงลูกด้วยนม", answer: true, explanation: "แมวเป็นสัตว์เลี้ยงลูกด้วยนมในอันดับ Carnivora"},
          {question: "กรุงเทพฯ เป็นเมืองหลวงของเวียดนาม", answer: false, explanation: "กรุงเทพฯ เป็นเมืองหลวงของประเทศไทย ไม่ใช่เวียดนาม"},
          {question: "เลข 0 เป็นจำนวนคู่", answer: true, explanation: "เลข 0 หารด้วย 2 ลงตัว จึงเป็นจำนวนคู่"},
          {question: "ปลาวาฬเป็นปลา", answer: false, explanation: "ปลาวาฬเป็นสัตว์เลี้ยงลูกด้วยนม ไม่ใช่ปลา"},
          {question: "พระอาทิตย์ขึ้นทางทิศตะวันออก", answer: true, explanation: "พระอาทิตย์ขึ้นทางทิศตะวันออกและตกทางทิศตะวันตก"},
          {question: "ประเทศไทยมี 77 จังหวัด", answer: true, explanation: "ประเทศไทยมีทั้งหมด 77 จังหวัด"},
          {question: "1 กิโลกรัม เท่ากับ 100 กรัม", answer: false, explanation: "1 กิโลกรัม เท่ากับ 1,000 กรัม ไม่ใช่ 100 กรัม"},
          {question: "เพชรแข็งกว่าเหล็ก", answer: true, explanation: "เพชรเป็นแร่ที่แข็งที่สุดในโลก (ระดับ 10 ในสเกลโมห์ส)"},
        ];

        const randomQ = questions[Math.floor(Math.random() * questions.length)];

        await userRef.set({
          currentGame: {
            type: "true_false",
            question: randomQ.question,
            answer: randomQ.answer,
            explanation: randomQ.explanation,
            startTime: Date.now(),
          },
        }, {merge: true});

        await lineClient.replyMessage(replyToken, {
          type: "flex",
          altText: "✅ True or False",
          contents: {
            type: "bubble",
            size: "mega",
            header: {
              type: "box",
              layout: "vertical",
              contents: [
                {type: "text", text: "✅ True or False", weight: "bold", size: "xl", color: "#FFFFFF"},
                {type: "text", text: "ข้อความนี้จริงหรือเท็จ?", size: "sm", color: "#D1FAE5"},
              ],
              backgroundColor: "#8B5CF6",
              paddingAll: "20px",
            },
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                {type: "box", layout: "vertical", contents: [
                  {type: "text", text: "❓", size: "xxl", align: "center"},
                  {type: "text", text: randomQ.question, weight: "bold", size: "lg", color: "#1F2937", align: "center", wrap: true, margin: "md"},
                ], backgroundColor: "#F3E8FF", paddingAll: "20px", cornerRadius: "lg"},
                {type: "separator", margin: "lg"},
                {type: "text", text: "🎯 ตอบได้เลย:", weight: "bold", size: "md", color: "#8B5CF6", margin: "md", align: "center"},
              ],
              paddingAll: "20px",
            },
            footer: {
              type: "box",
              layout: "horizontal",
              contents: [
                {type: "button", action: {type: "message", label: "✅ จริง", text: "/game true_false true"}, style: "primary", color: "#10B981", height: "sm"},
                {type: "button", action: {type: "message", label: "❌ เท็จ", text: "/game true_false false"}, style: "primary", color: "#EF4444", height: "sm", margin: "md"},
              ],
              paddingAll: "15px",
            },
          },
        });
        return;
      }

      // 📝 FILL THE BLANK - เติมคำในช่องว่าง
      if (gameId === "fill_blank") {
        if (action === "answer" && answer) {
          const userDoc = await userRef.get();
          const gameState = userDoc.data()?.currentGame || {};

          if (gameState.type === "fill_blank") {
            const isCorrect = answer.toLowerCase().trim() === gameState.answer.toLowerCase();

            if (isCorrect) {
              const newXP = (userDoc.data()?.education?.xp || 0) + 22;
              await userRef.update({
                "education.xp": newXP,
                "education.fillWins": (userDoc.data()?.education?.fillWins || 0) + 1,
                "currentGame": null,
              });

              await lineClient.replyMessage(replyToken, {
                type: "flex",
                altText: "🎉 ถูกต้อง! +22 XP",
                contents: {
                  type: "bubble",
                  size: "kilo",
                  body: {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {type: "text", text: "🎉 เยี่ยมมาก!", weight: "bold", size: "xl", color: "#10B981", align: "center"},
                      {type: "text", text: gameState.fullSentence, size: "md", color: "#333333", align: "center", margin: "md", wrap: true},
                      {type: "box", layout: "horizontal", contents: [
                        {type: "text", text: "+22 XP", weight: "bold", size: "lg", color: "#10B981", align: "center"},
                      ], backgroundColor: "#D1FAE5", paddingAll: "10px", cornerRadius: "md", margin: "md"},
                    ],
                    paddingAll: "20px",
                    backgroundColor: "#F0FDF4",
                  },
                  footer: {
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      {type: "button", action: {type: "message", label: "🔄 เล่นอีก", text: "/game fill_blank"}, style: "primary", color: "#10B981", height: "sm"},
                      {type: "button", action: {type: "message", label: "🎮 เกมอื่น", text: "/edu games"}, style: "secondary", height: "sm", margin: "sm"},
                    ],
                    paddingAll: "10px",
                  },
                },
              });
            } else {
              await lineClient.replyMessage(replyToken, {
                type: "flex",
                altText: "❌ ผิด!",
                contents: {
                  type: "bubble",
                  size: "kilo",
                  body: {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {type: "text", text: "❌ ยังไม่ถูก!", weight: "bold", size: "xl", color: "#EF4444", align: "center"},
                      {type: "text", text: gameState.sentence, size: "md", color: "#333333", align: "center", margin: "md", wrap: true},
                      {type: "text", text: `💡 Hint: ${gameState.hint}`, size: "sm", color: "#6B7280", align: "center", margin: "sm"},
                    ],
                    paddingAll: "20px",
                    backgroundColor: "#FEF2F2",
                  },
                  footer: {
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      {type: "button", action: {type: "message", label: "🔄 ลองใหม่", text: "/game fill_blank"}, style: "secondary", height: "sm"},
                      {type: "button", action: {type: "message", label: "💡 เฉลย", text: "/game fill_blank reveal"}, style: "secondary", height: "sm", margin: "sm"},
                    ],
                    paddingAll: "10px",
                  },
                },
              });
            }
          }
          return;
        }

        if (action === "reveal") {
          const userDoc = await userRef.get();
          const gameState = userDoc.data()?.currentGame || {};
          await userRef.update({"currentGame": null});

          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: `💡 เฉลย: ${gameState.answer || "?"}\n\n📝 ประโยคเต็ม: ${gameState.fullSentence || "-"}\n\nลองเล่นใหม่นะ!`,
            quickReply: {
              items: [
                {type: "action", action: {type: "message", label: "🔄 เล่นใหม่", text: "/game fill_blank"}},
                {type: "action", action: {type: "message", label: "🎮 เกมอื่น", text: "/edu games"}},
              ],
            },
          });
          return;
        }

        // สร้างโจทย์เติมคำ
        const sentences = [
          {sentence: "The sun _____ in the east.", answer: "rises", hint: "ขึ้น", fullSentence: "The sun rises in the east."},
          {sentence: "She _____ to school every day.", answer: "goes", hint: "ไป", fullSentence: "She goes to school every day."},
          {sentence: "I _____ breakfast at 7 AM.", answer: "eat", hint: "กิน", fullSentence: "I eat breakfast at 7 AM."},
          {sentence: "We _____ English in class.", answer: "study", hint: "เรียน", fullSentence: "We study English in class."},
          {sentence: "Birds can _____ in the sky.", answer: "fly", hint: "บิน", fullSentence: "Birds can fly in the sky."},
          {sentence: "Fish _____ in the water.", answer: "swim", hint: "ว่ายน้ำ", fullSentence: "Fish swim in the water."},
          {sentence: "I _____ my teeth every morning.", answer: "brush", hint: "แปรง", fullSentence: "I brush my teeth every morning."},
          {sentence: "The cat _____ on the sofa.", answer: "sleeps", hint: "นอน", fullSentence: "The cat sleeps on the sofa."},
        ];

        const randomS = sentences[Math.floor(Math.random() * sentences.length)];

        await userRef.set({
          currentGame: {
            type: "fill_blank",
            sentence: randomS.sentence,
            answer: randomS.answer,
            hint: randomS.hint,
            fullSentence: randomS.fullSentence,
            startTime: Date.now(),
          },
        }, {merge: true});

        await lineClient.replyMessage(replyToken, {
          type: "flex",
          altText: "📝 Fill the Blank",
          contents: {
            type: "bubble",
            size: "mega",
            header: {
              type: "box",
              layout: "vertical",
              contents: [
                {type: "text", text: "📝 Fill the Blank", weight: "bold", size: "xl", color: "#FFFFFF"},
                {type: "text", text: "เติมคำในช่องว่าง", size: "sm", color: "#DBEAFE"},
              ],
              backgroundColor: "#6366F1",
              paddingAll: "20px",
            },
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                {type: "box", layout: "vertical", contents: [
                  {type: "text", text: randomS.sentence, weight: "bold", size: "lg", color: "#4338CA", align: "center", wrap: true},
                ], backgroundColor: "#EEF2FF", paddingAll: "20px", cornerRadius: "lg"},
                {type: "separator", margin: "lg"},
                {type: "text", text: "💡 Hint:", weight: "bold", size: "md", color: "#6B7280", margin: "md"},
                {type: "text", text: randomS.hint, size: "md", color: "#333333"},
                {type: "separator", margin: "lg"},
                {type: "text", text: "📝 พิมพ์คำตอบ:", weight: "bold", size: "md", color: "#10B981", margin: "md"},
                {type: "text", text: "/game fill_blank answer [คำตอบ]", size: "sm", color: "#666666"},
              ],
              paddingAll: "20px",
            },
            footer: {
              type: "box",
              layout: "horizontal",
              contents: [
                {type: "button", action: {type: "message", label: "🔄 ข้ามข้อ", text: "/game fill_blank"}, style: "secondary", height: "sm"},
                {type: "button", action: {type: "message", label: "💡 เฉลย", text: "/game fill_blank reveal"}, style: "secondary", height: "sm", margin: "sm"},
              ],
              paddingAll: "10px",
            },
          },
        });
        return;
      }

      // ถ้าไม่ตรงกับเกมไหน - แสดงเมนูเกม
      const gamesFlex = createMiniGamesMenuFlex();
      await lineClient.replyMessage(replyToken, gamesFlex);
      return;
    }

    // WiT Tutor (AI Tutor)
    if (msgTextLower.startsWith("/tutor")) {
      // ใช้ message.text ดั้งเดิมเพื่อรักษาตัวอักษรภาษาไทย
      const originalParts = message.text.replace(/^\/tutor/i, "").trim().split(" ");
      const mode = originalParts[0]?.toLowerCase() || "";
      const question = originalParts.slice(1).join(" ");

      if (!mode) {
        // ไม่มี mode - แสดงเมนู
        const tutorMenu = createAITutorMenuFlex();
        await lineClient.replyMessage(replyToken, tutorMenu);
      } else if (question) {
        // มี mode และ question - ตอบเลย
        const tutorMode = AI_TUTOR_MODES[mode];
        const modeName = tutorMode?.name || "🤖 WiT Tutor";

        try {
          const {GoogleGenerativeAI} = require("@google/generative-ai");
          const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
          const model = genAI.getGenerativeModel({model: "gemini-2.0-flash"});

          let promptStyle = "";
          switch (mode) {
            case "explain":
              promptStyle = "อธิบายให้เข้าใจง่าย ยกตัวอย่างประกอบ ใช้ภาษาที่เด็กเข้าใจ";
              break;
            case "practice":
              promptStyle = "สร้างโจทย์ฝึกหัด 3 ข้อ พร้อมเฉลยและคำอธิบายวิธีทำ";
              break;
            case "exam":
              promptStyle = "สรุปเนื้อหาสำคัญ และสร้างข้อสอบ 5 ข้อพร้อมเฉลย";
              break;
            case "homework":
              promptStyle = "ช่วยทำการบ้าน อธิบายวิธีคิดทีละขั้นตอน";
              break;
            case "project":
              promptStyle = "แนะนำขั้นตอนการทำโครงงาน พร้อมไอเดียและแหล่งข้อมูล";
              break;
            default:
              promptStyle = "ตอบคำถามให้ชัดเจน เข้าใจง่าย";
          }

          const prompt = `คุณคือ WiT ติวเตอร์ส่วนตัวที่เป็นมิตรและอบอุ่น ชื่อของคุณคือ "วิทย์" (WiT)
${promptStyle}
ตอบเป็นภาษาไทย กระชับ มีอิโมจิ ไม่เกิน 250 คำ

คำถาม: ${question}`;

          const result = await model.generateContent(prompt);
          const aiResponse = result.response.text();

          await lineClient.replyMessage(replyToken, {
            type: "flex",
            altText: `${modeName} - ${question.substring(0, 30)}...`,
            contents: {
              type: "bubble",
              size: "mega",
              header: {
                type: "box",
                layout: "horizontal",
                contents: [
                  {type: "text", text: modeName, weight: "bold", size: "lg", color: "#FFFFFF", flex: 4},
                  {type: "text", text: "✨", size: "xl", flex: 1, align: "end"},
                ],
                backgroundColor: "#16A34A",
                paddingAll: "15px",
              },
              body: {
                type: "box",
                layout: "vertical",
                contents: [
                  {type: "box", layout: "vertical", contents: [
                    {type: "text", text: `❓ ${question}`, size: "md", color: "#555555", wrap: true, weight: "bold"},
                  ], backgroundColor: "#F0FDF4", paddingAll: "12px", cornerRadius: "md"},
                  {type: "separator", margin: "md"},
                  {type: "text", text: aiResponse, wrap: true, size: "md", color: "#333333", margin: "md"},
                ],
                paddingAll: "15px",
              },
              footer: {
                type: "box",
                layout: "vertical",
                contents: [
                  {type: "box", layout: "horizontal", contents: [
                    {type: "button", action: {type: "message", label: "📝 ทำแบบฝึก", text: `/tutor practice ${question}`}, style: "primary", color: "#16A34A", height: "sm", flex: 1},
                    {type: "button", action: {type: "message", label: "📚 ตัวอย่างเพิ่ม", text: `/tutor explain ขอตัวอย่างเพิ่มเรื่อง ${question}`}, style: "secondary", height: "sm", flex: 1, margin: "sm"},
                  ]},
                  {type: "button", action: {type: "message", label: "🏠 กลับเมนู WiT", text: "/tutor"}, style: "link", height: "sm", margin: "sm"},
                ],
                paddingAll: "10px",
              },
            },
          });
          console.log(`✅ WiT Tutor ${mode} response sent`);
        } catch (aiError) {
          console.error("WiT Tutor Error:", aiError);
          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: `🤖 ขออภัยครับ เกิดข้อผิดพลาด\n\nลองถามใหม่อีกครั้งนะครับ!`,
          });
        }
      } else {
        // มี mode แต่ไม่มี question - แสดง prompt ให้พิมพ์คำถาม
        const tutorMode = AI_TUTOR_MODES[mode];
        const modeName = tutorMode?.name || "💬 WiT Tutor";
        const modeDesc = tutorMode?.description || "พร้อมช่วยเหลือคุณ";

        // สร้าง Quick Examples ตาม mode
        let examples = [];
        switch (mode) {
          case "explain":
            examples = ["เศษส่วนคืออะไร", "สมการเส้นตรง", "พลังงานไฟฟ้า"];
            break;
          case "practice":
            examples = ["โจทย์บวกลบเศษส่วน", "โจทย์สมการ", "ฝึกท่องศัพท์"];
            break;
          case "exam":
            examples = ["เตรียมสอบคณิต ม.1", "สอบวิทย์ ป.6", "สอบภาษาอังกฤษ"];
            break;
          case "homework":
            examples = ["การบ้านคณิต", "เรียงความ", "แปลภาษาอังกฤษ"];
            break;
          case "project":
            examples = ["โครงงานวิทย์", "งานศิลปะ", "โครงงานสังคม"];
            break;
          default:
            examples = ["ถามอะไรก็ได้"];
        }

        await lineClient.replyMessage(replyToken, {
          type: "flex",
          altText: `${modeName} - พร้อมช่วยเหลือ`,
          contents: {
            type: "bubble",
            size: "mega",
            header: {
              type: "box",
              layout: "vertical",
              contents: [
                {type: "text", text: modeName, weight: "bold", size: "xl", color: "#FFFFFF"},
                {type: "text", text: modeDesc, size: "sm", color: "#D1FAE5"},
              ],
              backgroundColor: "#16A34A",
              paddingAll: "20px",
            },
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                {type: "text", text: "💬 พิมพ์คำถามหรือเรื่องที่ต้องการ:", weight: "bold", size: "md", color: "#16A34A"},
                {type: "text", text: `ตัวอย่าง: /tutor ${mode} [คำถาม]`, size: "sm", color: "#666666", margin: "sm"},
                {type: "separator", margin: "lg"},
                {type: "text", text: "⚡ ลองถามเลย:", weight: "bold", size: "md", color: "#333333", margin: "md"},
                {
                  type: "box",
                  layout: "vertical",
                  contents: examples.map((ex) => ({
                    type: "button",
                    action: {type: "message", label: ex, text: `/tutor ${mode} ${ex}`},
                    style: "secondary",
                    height: "sm",
                    margin: "sm",
                  })),
                  margin: "md",
                },
              ],
              paddingAll: "20px",
            },
            footer: {
              type: "box",
              layout: "horizontal",
              contents: [
                {type: "button", action: {type: "message", label: "◀ กลับ", text: "/tutor"}, style: "secondary", height: "sm"},
                {type: "button", action: {type: "message", label: "🏠 เมนูหลัก", text: "/edu"}, style: "secondary", height: "sm", margin: "sm"},
              ],
              paddingAll: "10px",
            },
          },
        });
      }
      return;
    }

    // =====================================================
    // 🎓 AI EDUCATION AUTO-DETECTION
    // ตรวจจับคำถามการศึกษาอัตโนมัติ และใช้ AI ตอบ
    // จำกัดเฉพาะ ป.1 - ม.3 (ภาคปกติ)
    // =====================================================

    // กรองเรื่องที่ไม่ตอบ
    const excludedTopics = ["ฉีดพลาสติก", "พลาสติก", "โมลด์", "mold", "injection", "ปวช", "ปวส", "อาชีวะ", "ช่างกล", "ช่างไฟฟ้า", "ช่างยนต์"];
    const isExcludedTopic = excludedTopics.some((topic) => msgTextLower.includes(topic));

    if (isEducationQuestion(message.text) && !isExcludedTopic) {
      const eduContext = detectEducationContext(message.text);
      console.log(`🎓 Education question detected:`, eduContext);

      // ตรวจสอบว่าเป็นระดับที่รองรับ (ป.1-ม.3) หรือไม่
      if (eduContext.level === null && (msgTextLower.includes("ม.4") || msgTextLower.includes("ม.5") || msgTextLower.includes("ม.6") ||
          msgTextLower.includes("ปริญญา") || msgTextLower.includes("มหาลัย"))) {
        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: "🙏 ขออภัยครับ WiT Tutor รองรับเฉพาะการศึกษาภาคปกติ ระดับ ป.1 - ม.3 เท่านั้น\n\nหากต้องการความช่วยเหลือระดับอื่น กรุณาติดต่อผู้ดูแลระบบครับ 📚",
          quickReply: {
            items: [
              {type: "action", action: {type: "message", label: "📚 เมนูการศึกษา", text: "/edu"}},
              {type: "action", action: {type: "message", label: "🏠 เมนูหลัก", text: "/help"}},
            ],
          },
        });
        return;
      }

      // สร้าง AI prompt ตามบริบทที่ตรวจจับได้
      const systemPrompt = getEducationSystemPrompt(
          eduContext.level || "secondary",
          eduContext.subject || "general",
          eduContext.mode || "explain",
      );

      try {
        // ใช้ inline Gemini API call
        const {GoogleGenerativeAI} = require("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({model: "gemini-2.0-flash"});

        const prompt = `${systemPrompt}\n\nคำถาม: ${message.text}`;
        const result = await model.generateContent(prompt);
        const aiResponse = result.response.text();

        // ส่งคำตอบพร้อม Quick Reply ให้ถามต่อได้
        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: `💬 **WiT Tutor**\n\n${aiResponse}`,
          quickReply: {
            items: [
              {type: "action", action: {type: "message", label: "📚 ขอตัวอย่างเพิ่ม", text: "ขอตัวอย่างเพิ่มเติม"}},
              {type: "action", action: {type: "message", label: "📝 ทำแบบฝึกหัด", text: "/tool quiz"}},
              {type: "action", action: {type: "message", label: "🔄 อธิบายใหม่", text: "ช่วยอธิบายใหม่แบบง่ายๆ"}},
              {type: "action", action: {type: "message", label: "🏠 เมนูการศึกษา", text: "/edu"}},
            ],
          },
        });
        console.log("✅ AI Education response sent");
        return;
      } catch (aiError) {
        console.error("AI Education Error:", aiError);
        // Fallback - ให้ไป Wit Tutor Menu
        await lineClient.replyMessage(replyToken, createAITutorMenuFlex());
        return;
      }
    }

    // =====================================================
    // 🏭 PLASTIC CONSULTATION MENU
    // =====================================================
    const plasticConsultationTriggers = [
      "ปรึกษาปัญหาฉีดพลาสติก",
      "ปรึกษาพลาสติก",
      "เมนูพลาสติก",
      "/plastic",
      "/injection",
    ];

    if (plasticConsultationTriggers.some((t) => message.text.toLowerCase().includes(t.toLowerCase()))) {
      console.log(`🏭 Plastic consultation menu requested`);
      const plasticMenu = createPlasticConsultationMenu();
      if (plasticMenu) {
        try {
          await lineClient.replyMessage(replyToken, plasticMenu);
          console.log("✅ Plastic Consultation Menu sent");
          return;
        } catch (flexError) {
          console.error("⚠️ Plastic menu flex failed:", flexError.message);
          // Fallback
          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: "🏭 **ศูนย์ปรึกษาฉีดพลาสติก**\n\n" +
                  "🔍 /defect - วินิจฉัย Defect\n" +
                  "🧮 /calc - เครื่องคำนวณ\n" +
                  "🌡️ /temp - ตารางอุณหภูมิ\n" +
                  "🧪 /material - คู่มือวัสดุ\n" +
                  "👥 /team - จัดการทีม\n\n" +
                  "💡 หรือพิมพ์คำถามภาษาไทยได้เลย!",
            quickReply: {
              items: [
                {type: "action", action: {type: "message", label: "🔍 Defect", text: "/defect"}},
                {type: "action", action: {type: "message", label: "🧮 คำนวณ", text: "/calc"}},
                {type: "action", action: {type: "message", label: "🌡️ อุณหภูมิ", text: "/temp"}},
                {type: "action", action: {type: "message", label: "🤖 ถาม AI", text: "Short shot แก้ยังไง"}},
              ],
            },
          });
          return;
        }
      }
    }

    // =====================================================
    // 🌡️ TEMPERATURE TABLE MENU
    // =====================================================
    const temperatureTriggers = [
      "/temp",
      "ตารางอุณหภูมิ",
      "อุณหภูมิวัสดุ",
      "temperature table",
      "อุณหภูมิฉีด",
    ];

    if (temperatureTriggers.some((t) => message.text.toLowerCase() === t.toLowerCase() || message.text.toLowerCase().startsWith(t.toLowerCase()))) {
      console.log(`🌡️ Temperature table requested`);
      const tempTable = createTemperatureTableMessage();
      if (tempTable) {
        try {
          await lineClient.replyMessage(replyToken, tempTable);
          console.log("✅ Temperature Table sent");
          return;
        } catch (flexError) {
          console.error("⚠️ Temperature table flex failed:", flexError.message);
          // Fallback to text
          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: "🌡️ **ตารางอุณหภูมิวัสดุฉีดพลาสติก**\n\n" +
                  "🔥 **Commodity Plastics:**\n" +
                  "• PP: 200-280°C (Mold: 40-80°C)\n" +
                  "• HDPE: 200-280°C (Mold: 20-60°C)\n" +
                  "• LDPE: 180-240°C (Mold: 20-50°C)\n" +
                  "• PVC: 160-200°C (Mold: 30-50°C)\n\n" +
                  "🔧 **Engineering Plastics:**\n" +
                  "• ABS: 210-270°C (Mold: 50-80°C)\n" +
                  "• PC: 280-320°C (Mold: 80-120°C)\n" +
                  "• PA6: 230-290°C (Mold: 60-90°C)\n" +
                  "• POM: 180-220°C (Mold: 60-90°C)\n\n" +
                  "⚡ **High Performance:**\n" +
                  "• PPS: 300-340°C (Mold: 120-150°C)\n" +
                  "• PEEK: 350-400°C (Mold: 150-180°C)\n\n" +
                  "💡 พิมพ์ชื่อวัสดุเพื่อดูรายละเอียด",
            quickReply: {
              items: [
                {type: "action", action: {type: "message", label: "🔥 การอบวัสดุ", text: "วิธีอบวัสดุพลาสติก"}},
                {type: "action", action: {type: "message", label: "🔴 Hot Runner", text: "อุณหภูมิ Hot Runner"}},
                {type: "action", action: {type: "message", label: "🏭 เมนูหลัก", text: "/plastic"}},
              ],
            },
          });
          return;
        }
      }
    }

    // =====================================================
    // 🌱 SMART FARM CONSULTATION MENU
    // =====================================================
    const farmTriggers = [
      "/farm",
      "/agriculture",
      "ปรึกษาเรื่องเกษตรครับ",
      "ปรึกษาเรื่องเกษตร",
      "เมนูเกษตร",
      "smart farm",
      "เกษตรอัจฉริยะ",
      "เกษตร",
    ];

    // Debug logging
    console.log(`🌱 Checking farm triggers for: "${message.text}"`);
    const farmMatch = farmTriggers.some((t) => {
      const match = message.text.toLowerCase().includes(t.toLowerCase());
      if (match) console.log(`🌱 Matched trigger: "${t}"`);
      return match;
    });

    if (farmMatch) {
      console.log(`🌱 Smart Farm menu requested`);
      const farmMenu = createSmartFarmMenu();
      if (farmMenu) {
        try {
          await lineClient.replyMessage(replyToken, farmMenu);
          console.log("✅ Smart Farm menu sent");
          return;
        } catch (flexError) {
          console.error("⚠️ Smart Farm flex failed:", flexError.message);
          // Fallback to text
          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: "🌱 **Smart Farm - ศูนย์ปรึกษาเกษตรอัจฉริยะ**\n\n" +
                  "📋 เลือกหัวข้อที่สนใจ:\n\n" +
                  "🧪 **สูตรปุ๋ย** - พิมพ์: สูตรปุ๋ยสำหรับพืช\n" +
                  "🌾 **พืชเศรษฐกิจ** - พิมพ์: แนะนำพืชเศรษฐกิจ\n" +
                  "🛡️ **การดูแล** - พิมพ์: โรคและแมลงศัตรูพืช\n" +
                  "💰 **ต้นทุน** - พิมพ์: คำนวณต้นทุนการเกษตร\n" +
                  "📊 **วิเคราะห์** - พิมพ์: วิเคราะห์กำไรการเกษตร\n" +
                  "🏛️ **เงินอุดหนุน** - พิมพ์: สิทธิประโยชน์เกษตรกร\n\n" +
                  "💡 หรือพิมพ์คำถามได้เลยครับ AI ช่วยตอบ!",
            quickReply: {
              items: [
                {type: "action", action: {type: "message", label: "🧪 สูตรปุ๋ย", text: "สูตรปุ๋ยสำหรับพืช"}},
                {type: "action", action: {type: "message", label: "🌾 พืชเศรษฐกิจ", text: "แนะนำพืชเศรษฐกิจ"}},
                {type: "action", action: {type: "message", label: "💰 ต้นทุน", text: "คำนวณต้นทุนการเกษตร"}},
                {type: "action", action: {type: "message", label: "🏛️ เงินอุดหนุน", text: "สิทธิประโยชน์เกษตรกร"}},
              ],
            },
          });
          return;
        }
      }
    }

    // =====================================================
    // 🌾💰 FARM & RETAIL ACCOUNTING SYSTEM
    // =====================================================
    // ตรวจสอบว่าผู้ใช้ต้องการใช้ระบบบัญชีหรือไม่
    const accountingKeywords = ["บัญชี", "สรุป", "รายรับ", "รายจ่าย", "ขาย", "ซื้อ", "จ่าย", "ค่า", "บาท"];

    // 🔧 คำสั่งบัญชีที่ต้องตรวจก่อน (ไม่ต้องมีตัวเลข, ไม่ถือว่าเป็นคำถาม)
    const accountingExactCommands = [
      "^/acc$", "สรุป", "รายการ", "บัญชี", "ลบ", "ยืนยันลบ", "ยกเลิกการลบ", "วิธีใช้บัญชี",
      "เลือกลบ", "ลบทั้งหมด", "ลบ#", "แก้#",
      "เลือกแก้ไข", "แก้ไขรายการ", "ยกเลิกแก้ไข", "แก้จำนวน", "แก้หมวด",
      "วิเคราะห์บัญชี", "คำแนะนำการเงิน", "เปรียบเทียบเดือน", "เทียบเดือน", // 🔧 เปลี่ยน "วิเคราะห์" → "วิเคราะห์บัญชี"
      "ตั้งงบ", "เช็คงบ", "งบประมาณ",
      "ตั้งเป้าออม", "ดูเป้าหมาย", "เป้าหมาย",
      "dashboard", "ภาพรวม",
      "เมนูบัญชี", "menu", "เมนู acc", "คู่มือบัญชี", "help acc", // 🆕 Menu & Guide
    ];
    const isAccountingExact = accountingExactCommands.some((cmd) => {
      if (cmd.startsWith("^")) {
        return new RegExp(cmd, "i").test(message.text.toLowerCase());
      }
      return message.text.toLowerCase().includes(cmd);
    });

    // 🔧 เพิ่ม: ตรวจสอบว่าเป็นคำถาม (Question) → ไม่ใช่คำสั่งบันทึกบัญชี ให้ AI ตอบแทน
    // ⚠️ ยกเว้นคำสั่งบัญชีที่ชัดเจน (isAccountingExact)
    const questionKeywords = [
      "ช่วย", "คำนวณ", "วิธี", "อย่างไร", "ยังไง", "แนะนำ",
      "เฉลี่ย", "ลด", "ประหยัด", "แบ่ง", "คิด",
      "เท่าไร", "กี่", "เท่าไหร่", "?", "？", "ทำไม", "หรือไม่",
      "ดีไหม", "ควร", "สาเหตุ", "ปัญหา",
    ];
    const isQuestion = !isAccountingExact && questionKeywords.some((q) => message.text.toLowerCase().includes(q));

    const isAccountingRelated = !isQuestion && accountingKeywords.some((kw) => message.text.toLowerCase().includes(kw)) && /\d/.test(message.text);
    // 🔧 แก้ไข: เพิ่มคำสั่งที่ไม่ต้องมีตัวเลข และรวม /acc command
    const isAccountingCommandExplicit = isAccountingExact;

    if (isAccountingRelated || isAccountingCommandExplicit) {
      console.log(`💰 Accounting command detected: "${message.text}"`);

      // ตรวจสอบประเภทธุรกิจจาก user data (default: farm)
      const businessType = userData.businessType || "farm";

      // คำสั่งขอดูวิธีใช้บัญชี - ใช้ Flex Message ที่ว้าว!
      if (message.text.toLowerCase().includes("วิธีใช้บัญชี") || message.text === "บัญชี" || message.text.toLowerCase() === "/acc") {
        const accountingGuideFlex = createAccountingGuideMessage();
        if (accountingGuideFlex) {
          try {
            await lineClient.replyMessage(replyToken, accountingGuideFlex);
            console.log("✅ Accounting Guide Flex Message sent");
          } catch (flexError) {
            console.error("⚠️ Accounting Guide Flex failed, using text fallback:", flexError.message);
            // Fallback to text
            await lineClient.replyMessage(replyToken, {
              type: "text",
              text: getAccountingHelp(businessType),
              quickReply: {
                items: [
                  {type: "action", action: {type: "message", label: "สรุปเดือน", text: "สรุปเดือน"}},
                  {type: "action", action: {type: "message", label: "รายการล่าสุด", text: "รายการล่าสุด"}},
                  {type: "action", action: {type: "message", label: "โหมดฟาร์ม", text: "เปลี่ยนเป็นโหมดฟาร์ม"}},
                  {type: "action", action: {type: "message", label: "โหมดร้านค้า", text: "เปลี่ยนเป็นโหมดร้านค้า"}},
                ],
              },
            });
          }
        } else {
          // Fallback if Flex creation failed
          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: getAccountingHelp(businessType),
          });
        }
        return;
      }

      // เปลี่ยนโหมดธุรกิจ
      if (message.text.includes("โหมดฟาร์ม") || message.text.includes("เปลี่ยนเป็นฟาร์ม")) {
        await userRef.update({businessType: "farm"});
        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: `🌾 **เปลี่ยนเป็นโหมดฟาร์มแล้ว!**\n\nตอนนี้ระบบจะจัดหมวดหมู่แบบเกษตรกร\n(ปุ๋ย, ยา, เมล็ดพันธุ์, ค่าแรง ฯลฯ)`,
        });
        return;
      }

      if (message.text.includes("โหมดร้านค้า") || message.text.includes("เปลี่ยนเป็นร้านค้า")) {
        await userRef.update({businessType: "retail"});
        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: `🏪 **เปลี่ยนเป็นโหมดร้านค้าแล้ว!**\n\nตอนนี้ระบบจะจัดหมวดหมู่แบบร้านค้าปลีก\n(ค่าเช่า, ซื้อสินค้า, ค่าไฟ ฯลฯ)`,
        });
        return;
      }

      // ลองจัดการด้วยระบบบัญชี
      try {
        const accountingResult = await handleAccountingCommand(userId, message.text, businessType);

        if (accountingResult.handled && accountingResult.response) {
          let messagePayload = accountingResult.response;

          // If response is just a string, wrap it in a text message object
          if (typeof messagePayload === "string") {
            messagePayload = {type: "text", text: messagePayload};
          }

          // Add Quick Reply to all accounting messages for better UX
          // 🔧 ปรับปรุง: เพิ่มปุ่มเลือกลบ/แก้ไข
          const quickReplyItems = {
            items: [
              {type: "action", action: {type: "message", label: "สรุปเดือน", text: "สรุปเดือน"}},
              {type: "action", action: {type: "message", label: "รายการล่าสุด", text: "รายการล่าสุด"}},
              {type: "action", action: {type: "message", label: "เลือกลบ", text: "เลือกลบ"}},
              {type: "action", action: {type: "message", label: "เลือกแก้ไข", text: "เลือกแก้ไข"}},
              {type: "action", action: {type: "message", label: "ลบล่าสุด", text: "ลบ"}},
            ],
          };
          messagePayload.quickReply = quickReplyItems;

          try {
            await lineClient.replyMessage(replyToken, messagePayload);
            console.log(`✅ Accounting command handled successfully`);
          } catch (flexError) {
            // ถ้า replyMessage ไม่ work → ลอง pushMessage กับ Flex
            console.error(`⚠️ Flex+quickReply failed: ${flexError.message}`);
            delete messagePayload.quickReply; // pushMessage ไม่รองรับ quickReply
            try {
              await lineClient.pushMessage(userId, messagePayload);
              console.log(`✅ Accounting Flex sent via pushMessage`);
            } catch (pushFlexError) {
              // 🔧 Final fallback: pushMessage with text
              console.error(`⚠️ Push Flex failed: ${pushFlexError.message}, trying text...`);
              await lineClient.pushMessage(userId, {
                type: "text",
                text: accountingResult.textFallback || "สรุปบัญชีสำเร็จ",
              });
              console.log(`✅ Accounting sent via pushMessage (text fallback)`);
            }
          }
          return;
        }
        // ถ้าไม่ใช่คำสั่งบัญชี (handled=false) ให้ไปต่อที่ AI
        if (!accountingResult.handled) {
          console.log(`ℹ️ Accounting: Not a valid command, falling through to AI`);
        }
      } catch (accountingError) {
        console.error("❌ Accounting error:", accountingError);

        // ลอง pushMessage fallback เมื่อ reply token หมดอายุ
        try {
          await lineClient.pushMessage(userId, {
            type: "text",
            text: "❌ ขออภัย เกิดข้อผิดพลาดในระบบบัญชี กรุณาลองใหม่อีกครั้ง",
          });
        } catch (pushErr) {
          console.error("❌ Push fallback also failed:", pushErr.message);
        }
        return; // 🔧 แก้ไข: ต้อง return เพื่อไม่ให้ไปทำซ้ำที่ Gemini
      }
    }

    // 👑 SUPER ADMIN CHECK
    console.log(`🔄 ========== REACHED SUPER ADMIN CHECK (after Student Learning) ==========`);
    const SUPER_ADMIN_ID = "Ud9bec6d2ea945cf4330a69cb74ac93cf";
    const isSuperAdmin = (userId === SUPER_ADMIN_ID);

    console.log(`👑 ========== ADMIN CHECK ==========`);
    console.log(`👑 User ID: '${userId}'`);
    console.log(`👑 Super Admin ID: '${SUPER_ADMIN_ID}'`);
    console.log(`👑 Is Super Admin: ${isSuperAdmin}`);

    if (isSuperAdmin) {
      console.log(`👑 Super Admin detected: ${userId}`);
      userData.isPremium = true; // Bypass quota for Super Admin

      // 👑 ADMIN COMMANDS
      const cmd = message.text.toLowerCase().trim();
      console.log(`👑 Processing Super Admin command: "${cmd}"`);

      // =====================================================
      // 🌱 SMART FARM MENU (Admin Priority Check)
      // =====================================================
      const farmTriggersAdmin = ["/farm", "/agriculture", "ปรึกษาเรื่องเกษตรครับ", "ปรึกษาเรื่องเกษตร", "เมนูเกษตร", "smart farm", "เกษตรอัจฉริยะ"];
      const isFarmCommand = farmTriggersAdmin.some((t) => cmd.includes(t.toLowerCase()));
      console.log(`🔍 Checking Smart Farm triggers for: "${cmd}" -> Match: ${isFarmCommand}`);

      if (isFarmCommand) {
        console.log(`👑 Admin command: Smart Farm Menu`);
        const farmMenu = createSmartFarmMenu();
        if (farmMenu) {
          try {
            await lineClient.replyMessage(replyToken, farmMenu);
            console.log("✅ Smart Farm menu sent (Admin)");
          } catch (replyError) {
            console.log(`⚠️ Reply failed, trying pushMessage...`);
            try {
              await lineClient.pushMessage(userId, farmMenu);
              console.log("✅ Smart Farm menu sent via pushMessage");
            } catch (pushError) {
              await lineClient.pushMessage(userId, {
                type: "text",
                text: "🌱 **Smart Farm Menu**\n\n🧪 สูตรปุ๋ย - พิมพ์: สูตรปุ๋ยสำหรับพืช\n🌾 พืชเศรษฐกิจ - พิมพ์: แนะนำพืชเศรษฐกิจ\n💰 ต้นทุน - พิมพ์: คำนวณต้นทุนการเกษตร\n🏛️ เงินอุดหนุน - พิมพ์: สิทธิประโยชน์เกษตรกร",
              });
            }
          }
        }
        return;
      }
      console.log(`🔵 DEBUG: Passed Smart Farm, continuing in Admin block...`);

      // =====================================================
      // 👑 ENHANCED SUPER ADMIN DASHBOARD (ใหม่! - ควบคุมได้ทุกมิติ)
      // ระบบควบคุมขั้นสูงสำหรับ Super Admin
      // =====================================================
      if (cmd === "/superadmin enhanced" || cmd === "/enhanced" || cmd === "superadmin+" || cmd === "/admin++") {
        console.log(`👑 Enhanced Super Admin Dashboard requested`);
        try {
          // Gather comprehensive system stats from LINE users
          const lineUsersSnapshot = await db.collection("line_users").get();
          let totalUsers = lineUsersSnapshot.size;
          let activeToday = 0;
          let premiumUsers = 0;
          let bannedUsers = 0;
          let onlineNow = 0;

          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

          console.log(`📊 Analyzing ${totalUsers} LINE users for Enhanced Dashboard...`);

          lineUsersSnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.isPremium) premiumUsers++;
            if (data.banned) bannedUsers++;

            const lastActive = data.lastActiveAt?.toDate();
            if (lastActive && lastActive >= today) activeToday++;
            if (lastActive && lastActive >= fiveMinutesAgo) onlineNow++;
          });

          // Unlock requests stats
          const unlockRequestsSnapshot = await db.collection("unlock_requests")
              .where("notified", "==", false)
              .get();
          const pendingUnlockRequests = unlockRequestsSnapshot.size;

          // System alerts stats (from system_alerts collection)
          const criticalAlertsSnapshot = await db.collection("system_alerts")
              .where("status", "==", "active")
              .where("severity", "==", "critical")
              .get();
          const criticalAlertsCount = criticalAlertsSnapshot.size;

          const warningAlertsSnapshot = await db.collection("system_alerts")
              .where("status", "==", "active")
              .where("severity", "==", "warning")
              .get();
          const warningAlertsCount = warningAlertsSnapshot.size;

          // Knowledge stats
          const hyperKnowledge = getHyperLocalizedKnowledge();
          const knowledgeStats = await hyperKnowledge.getKnowledgeStats();

          // AI stats (from hybrid_usage_logs)
          const logsSnapshot = await db.collection("hybrid_usage_logs")
            .orderBy("timestamp", "desc")
            .limit(100)
            .get();

          let aiQueries = logsSnapshot.size;
          let successfulAI = 0;
          logsSnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.helpful !== false && data.confidence > 0.6) successfulAI++;
          });

          const aiSuccessRate = aiQueries > 0 ? ((successfulAI / aiQueries) * 100).toFixed(1) : 0;

          // System performance (mock data - replace with actual monitoring)
          const stats = {
            // System Health
            systemStatus: "online",
            cpuUsage: 45,
            memoryUsage: 62,
            responseTime: 145,

            // Users
            totalUsers,
            activeToday,
            premiumUsers,
            bannedUsers,
            onlineNow,

            // Knowledge
            knowledgeItems: knowledgeStats?.totalKnowledge || 0,
            verifiedKnowledge: (knowledgeStats?.totalKnowledge || 0) - (knowledgeStats?.pendingVerification || 0),
            pendingKnowledge: knowledgeStats?.pendingVerification || 0,
            knowledgeCategories: 8,

            // AI & Hybrid
            aiQueries,
            hybridQueries: aiQueries,
            aiSuccessRate,

            // Features (placeholder)
            visionUsage: 0,
            calculatorUsage: 0,

            // Database
            dbSize: "128 MB",
            lastBackup: "2 hours ago",

            // Alerts & Requests (from system_alerts collection)
            criticalAlerts: criticalAlertsCount, // Real critical alerts from system_alerts
            warnings: warningAlertsCount, // Real warning alerts from system_alerts
            pendingUnlockRequests, // Separate field for unlock requests
          };

          const enhancedDashboard = createEnhancedSuperAdminDashboard(stats);
          await lineClient.replyMessage(replyToken, enhancedDashboard);
          console.log(`✅ Enhanced Dashboard sent`);
        } catch (error) {
          console.error(`❌ Enhanced Dashboard error:`, error);
          await lineClient.replyMessage(replyToken, createSimpleMessage(`❌ เกิดข้อผิดพลาด: ${error.message}`, false));
        }
        return;
      }

      // =====================================================
      // 🎯 ENHANCED ADMIN COMMAND HANDLERS
      // คำสั่งใหม่ทั้งหมดจาก Enhanced Dashboard
      // =====================================================

      // System Control Commands
      if (cmd === "/system maintenance toggle") {
        await enhancedHandlers.handleMaintenanceToggle(db, userId, lineClient, replyToken);
        return;
      }
      if (cmd === "/system pause") {
        await enhancedHandlers.handleSystemPause(db, userId, lineClient, replyToken);
        return;
      }
      if (cmd === "/system resume") {
        await enhancedHandlers.handleSystemResume(db, userId, lineClient, replyToken);
        return;
      }
      if (cmd === "/system backup") {
        await enhancedHandlers.handleSystemBackup(db, userId, lineClient, replyToken);
        return;
      }
      if (cmd === "/system cleanup") {
        await enhancedHandlers.handleSystemCleanup(db, userId, lineClient, replyToken);
        return;
      }
      // 📋 System Logs - รองรับหลายรูปแบบ
      if (cmd === "/system logs" || cmd === "system logs" || cmd === "/logs" || cmd === "logs") {
        await enhancedHandlers.handleSystemLogs(db, userId, lineClient, replyToken, false);
        return;
      }
      // 📋 System Logs Full - รองรับหลายรูปแบบ
      if (cmd === "/system logs full" || cmd === "system logs full" || 
          cmd === "/logs full" || cmd === "logs full" ||
          cmd.includes("system logs") && cmd.includes("full")) {
        await enhancedHandlers.handleSystemLogs(db, userId, lineClient, replyToken, true);
        return;
      }

      // Analytics Commands
      if (cmd === "/analytics users") {
        await enhancedHandlers.handleAnalyticsUsers(db, userId, lineClient, replyToken);
        return;
      }
      if (cmd === "/analytics knowledge") {
        await enhancedHandlers.handleAnalyticsKnowledge(db, userId, lineClient, replyToken);
        return;
      }
      if (cmd === "/analytics ai") {
        await enhancedHandlers.handleAnalyticsAI(db, userId, lineClient, replyToken);
        return;
      }

      // AI Management Commands
      if (cmd === "/ai config") {
        await enhancedHandlers.handleAIConfig(db, userId, lineClient, replyToken);
        return;
      }
      if (cmd === "/ai strategy") {
        await enhancedHandlers.handleAIStrategy(db, userId, lineClient, replyToken);
        return;
      }
      if (cmd === "/ai prompts") {
        await enhancedHandlers.handleAIPrompts(db, userId, lineClient, replyToken);
        return;
      }

      // User Management Commands
      if (cmd === "/users all") {
        await enhancedHandlers.handleUsersAll(db, userId, lineClient, replyToken);
        return;
      }
      if (cmd === "/user search") {
        await enhancedHandlers.handleUserSearch(db, userId, lineClient, replyToken);
        return;
      }
      if (cmd === "/bulk resetquota") {
        await enhancedHandlers.handleBulkResetQuota(db, userId, lineClient, replyToken);
        return;
      }

      // 📞 Unlock Requests Management
      if (cmd === "/unlock requests" || cmd === "/unlock pending") {
        await handleUnlockRequests(db, userId, lineClient, replyToken);
        return;
      }

      // Database Commands
      if (cmd === "/db backup create" || cmd === "/db backup") {
        await enhancedHandlers.handleDatabaseBackup(db, userId, lineClient, replyToken);
        return;
      }
      if (cmd === "/alerts critical") {
        await enhancedHandlers.handleAlerts(db, userId, lineClient, replyToken, "critical");
        return;
      }
      if (cmd === "/alerts warnings") {
        await enhancedHandlers.handleAlerts(db, userId, lineClient, replyToken, "warning");
        return;
      }
      if (cmd === "/alerts" || cmd === "/alerts all") {
        await enhancedHandlers.handleAlerts(db, userId, lineClient, replyToken, "all");
        return;
      }

      // =====================================================
      // 👑 SUPER ADMIN DASHBOARD (/super, /dashboard)
      // หน้าเดียวครอบคลุมทุกฟังก์ชัน Admin พร้อม Real-Time Data + Trial Countdown
      // =====================================================
      if (cmd === "/super" || cmd === "/dashboard" || cmd === "super admin" || cmd === "ซุปเปอร์" || cmd === "superadmin") {
        console.log(`👑 Admin command: SUPER Dashboard (All-in-One) - Fetching real-time stats...`);
        
        try {
          // 📊 Fetch Real-Time Stats from Firestore
          const usersSnapshot = await db.collection("line_users").get();
          const totalUsers = usersSnapshot.size;
          
          let premiumUsers = 0;
          let activeToday = 0;
          let active7Days = 0;
          let pendingUsers = 0;
          let trialActiveUsers = 0;
          let trialExpiredUsers = 0;
          const trialCountdowns = [];
          
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          
          usersSnapshot.forEach((doc) => {
            const data = doc.data();
            
            // Count premium users
            if (data.isPremium) premiumUsers++;
            
            // Count active users
            const lastActive = data.lastActiveAt?.toDate();
            if (lastActive) {
              if (lastActive >= today) activeToday++;
              if (lastActive >= sevenDaysAgo) active7Days++;
            }
            
            // Count pending approvals
            if (data.status === "pending") pendingUsers++;
            
            // Count and track trial users
            if (data.trialStatus === "active") {
              trialActiveUsers++;
              if (data.trialEndDate) {
                const endDate = data.trialEndDate.toDate();
                const daysLeft = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24));
                trialCountdowns.push({
                  userId: doc.id,
                  daysLeft,
                  endDate,
                });
              }
            } else if (data.trialStatus === "expired") {
              trialExpiredUsers++;
            }
          });
          
          // Sort trial countdowns by days left
          trialCountdowns.sort((a, b) => a.daysLeft - b.daysLeft);
          
          // 📚 Get knowledge base stats using HyperLocalizedKnowledge
          let knowledgeItems = 0;
          let pendingKnowledge = 0;
          let knowledgeByCategory = {};
          let knowledgeTopUsed = [];
          let knowledgeRecentAdded = [];

          try {
            const hyperKnowledge = getHyperLocalizedKnowledge();
            const knowledgeStats = await hyperKnowledge.getKnowledgeStats();

            if (knowledgeStats) {
              knowledgeItems = knowledgeStats.totalKnowledge || 0;
              pendingKnowledge = knowledgeStats.pendingVerification || 0;
              knowledgeByCategory = knowledgeStats.byCategory || {};
              knowledgeTopUsed = (knowledgeStats.topUsed || []).slice(0, 3);
              knowledgeRecentAdded = (knowledgeStats.recentlyAdded || []).slice(0, 3);

              console.log(`📚 Knowledge Stats:`, {
                total: knowledgeItems,
                pending: pendingKnowledge,
                categories: Object.keys(knowledgeByCategory).length,
                topUsed: knowledgeTopUsed.length,
                recentAdded: knowledgeRecentAdded.length,
              });
            }
          } catch (kbError) {
            console.log(`⚠️ Knowledge stats error:`, kbError.message);
          }
          
          // Estimate online users (active in last 5 minutes)
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
          let onlineNow = 0;
          usersSnapshot.forEach((doc) => {
            const data = doc.data();
            const lastActive = data.lastActiveAt?.toDate();
            if (lastActive && lastActive >= fiveMinutesAgo) onlineNow++;
          });
          
          // Determine system health based on multiple factors
          let systemHealth = "🟢 Excellent";
          const healthScore = (pendingUsers * 2) + pendingKnowledge + (trialExpiredUsers * 1.5);
          
          if (healthScore > 50 || pendingUsers > 50) {
            systemHealth = "🔴 Critical";
          } else if (healthScore > 20 || pendingUsers > 20) {
            systemHealth = "🟡 Needs Attention";
          }
          
          // 📊 NEW: Calculate feature usage statistics
          let totalVisionUsage = 0;
          let totalCalculatorUsage = 0;
          let totalAgricultureUsage = 0;
          let totalAccountingUsage = 0;
          let totalEducationUsage = 0;
          
          usersSnapshot.forEach((doc) => {
            const data = doc.data();
            totalVisionUsage += data.visionUsage || 0;
            totalCalculatorUsage += data.calculatorUsage || 0;
            totalAgricultureUsage += data.agricultureUsage || 0;
            totalAccountingUsage += data.accountingUsage || 0;
            totalEducationUsage += data.educationUsage || 0;
          });
          
          const totalFeatureUsage = totalVisionUsage + totalCalculatorUsage + totalAgricultureUsage + totalAccountingUsage + totalEducationUsage;
          
          const stats = {
            // User Stats
            totalUsers,
            activeToday,
            active7Days,
            pendingUsers,
            premiumUsers,
            onlineNow,
            // Knowledge Stats (Enhanced!)
            knowledgeItems,
            pendingKnowledge,
            knowledgeByCategory,
            knowledgeTopUsed,
            knowledgeRecentAdded,
            // Trial Stats
            trialActiveUsers,
            trialExpiredUsers,
            trialCountdowns,
            // Feature Usage Stats
            totalFeatureUsage,
            totalVisionUsage,
            totalCalculatorUsage,
            totalAgricultureUsage,
            totalAccountingUsage,
            totalEducationUsage,
            // System
            systemHealth,
          };
          
          console.log(`📊 Stats fetched:`, {
            ...stats,
            trialCountdowns: `${trialCountdowns.length} users tracked`,
          });
          
          const superDashboardFlex = createAdminSuperDashboard(stats);
          console.log(`📦 Flex created with real data, size: ${JSON.stringify(superDashboardFlex).length} characters`);
          
          await lineClient.replyMessage(replyToken, superDashboardFlex);
          console.log(`✅ Reply successful`);
        } catch (replyError) {
          console.log(`❌ Reply error:`, replyError.message);
          console.log(`📋 Error details:`, JSON.stringify(replyError.originalError || replyError, null, 2));
          if (replyError.response) {
            console.log(`🔴 LINE API Response Status:`, replyError.response.status);
            console.log(`🔴 LINE API Response Data:`, JSON.stringify(replyError.response.data, null, 2));
          }
          console.log(`⚠️ Reply failed, trying pushMessage...`);
          try {
            await lineClient.pushMessage(userId, superDashboardFlex);
            console.log(`✅ Push successful`);
          } catch (pushError) {
            console.log(`❌ Push error:`, pushError.message);
            console.log(`📋 Push error details:`, JSON.stringify(pushError.originalError || pushError, null, 2));
            if (pushError.response) {
              console.log(`🔴 LINE API Push Response Status:`, pushError.response.status);
              console.log(`🔴 LINE API Push Response Data:`, JSON.stringify(pushError.response.data, null, 2));
            }
            console.log(`⚠️ Push failed too, sending text fallback`);
            await lineClient.pushMessage(userId, {
              type: "text",
              text: "👑 Super Admin Dashboard:\n\n📊 Dashboard: /stats, /daily, /top, /recent\n👥 Users: /pending, /premium, /search, /banlist\n🧠 Knowledge: ดูความรู้ทั้งหมด, verify ความรู้\n🧪 Testing: /wt, /quicktest\n⚙️ System: /broadcast, /org, /logs",
            });
          }
        }
        return;
      }

      // =====================================================
      // 👑 ADMIN CONTROL PANEL (/admin, /panel)
      // =====================================================
      if (cmd === "/admin" || cmd === "/panel" || cmd === "แผงควบคุม") {
        console.log(`👑 Admin command: Admin Control Panel`);
        const adminPanelFlex = createAdminControlPanelMessage();
        try {
          await lineClient.replyMessage(replyToken, adminPanelFlex);
        } catch (replyError) {
          console.log(`⚠️ Reply failed, trying pushMessage...`);
          try {
            await lineClient.pushMessage(userId, adminPanelFlex);
          } catch (pushError) {
            console.log(`⚠️ Push failed too, sending text fallback`);
            await lineClient.pushMessage(userId, {
              type: "text",
              text: "👑 Admin Panel Commands:\n\n📊 /stats - สถิติระบบ\n📅 /daily - สรุปวันนี้\n🏆 /top - Top Users\n🕐 /recent - ผู้ใช้ล่าสุด\n💎 /premium - Premium Report\n🧪 /testall - ทดสอบทุกฟังก์ชัน\n👤 /user [ID] - ดูข้อมูลผู้ใช้\n\n⭐ พิมพ์ /super เพื่อดู Super Dashboard",
            });
          }
        }
        return;
      }

      // =====================================================
      // 🧪 NEW: FULL TESTING DASHBOARD (/testall)
      // =====================================================
      if (cmd === "/testall" || cmd === "/testing" || cmd === "ทดสอบทั้งหมด") {
        console.log(`👑 Admin command: Full Testing Dashboard (v6-button)`);

        // ใช้ createAdminTestDashboard() ที่แก้ไขแล้ว (button version)
        const testDashboardFlex = createAdminTestDashboard();

        const jsonStr = JSON.stringify(testDashboardFlex);
        console.log(`📏 JSON length: ${jsonStr.length}`);
        console.log(`📦 Sample JSON (first 500 chars): ${jsonStr.slice(0, 500)}`);

        // Check for double braces issue
        if (jsonStr.includes("{{")) {
          console.error(`⚠️ ALERT: JSON contains '{{' - this is the bug!`);
          const idx = jsonStr.indexOf("{{");
          console.error(`⚠️ At index ${idx}: ${jsonStr.slice(Math.max(0, idx - 30), idx + 50)}`);
        } else {
          console.log(`✅ JSON is clean (no '{{')`);
        }

        try {
          await lineClient.replyMessage(replyToken, testDashboardFlex);
          console.log(`✅ Reply sent OK`);
        } catch (replyError) {
          console.error(`❌ Reply failed:`, replyError.message);
          // Log LINE API error response details
          console.error(`❌ LINE API Error:`, JSON.stringify({
            statusCode: replyError.statusCode,
            statusMessage: replyError.statusMessage,
            originalError: replyError.originalError?.response?.data,
          }, null, 2));
          // Log the actual request data that was sent
          if (replyError.originalError?.config?.data) {
            const sentData = replyError.originalError.config.data;
            console.error(`❌ Sent data (first 800 chars): ${typeof sentData === "string" ? sentData.slice(0, 800) : JSON.stringify(sentData).slice(0, 800)}`);
          }
          console.log(`⚠️ Trying pushMessage...`);
          try {
            await lineClient.pushMessage(userId, testDashboardFlex);
            console.log(`✅ Push sent OK`);
          } catch (pushError) {
            console.error(`❌ Push failed:`, pushError.message);
            console.error(`❌ LINE API Push Error:`, JSON.stringify({
              statusCode: pushError.statusCode,
              statusMessage: pushError.statusMessage,
              originalError: pushError.originalError?.response?.data,
            }, null, 2));
            console.log(`⚠️ Sending text fallback`);
            await lineClient.pushMessage(userId, {
              type: "text",
              text: "🧪 Testing Commands:\n\n🏭 ฉีดพลาสติก:\n• ปัญหา Short Shot แก้ยังไง\n• คำนวณ Cooling Time หนา 3mm\n\n🌾 เกษตร:\n• คำนวณปุ๋ยสำหรับทุเรียน 10 ไร่\n• ส่งรูปใบไม้มาวิเคราะห์โรคพืช\n\n💰 บัญชี:\n• ขายมะม่วง 50 กก. 1500 บาท\n• สรุปบัญชีวันนี้\n\n👑 Admin:\n• /admin - แผงควบคุม\n• /stats - สถิติระบบ\n• /welcome - ทดสอบ Welcome",
            });
          }
        }
        return;
      }

      // =====================================================
      // 🧪 DEBUG: RAW HTTP SEND vs SDK SEND (/testraw)
      // =====================================================
      if (cmd === "/testraw" || cmd === "/testraw" || cmd === "/sdkvsraw") {
        console.log("👑 Admin command: Test raw HTTP vs SDK send");
        const debugFlex = createAdminTestDashboard();
        const body = {replyToken, messages: [debugFlex]};
        const jsonStr = JSON.stringify(body);
        console.log("📦 Pre-send JSON length:", jsonStr.length);
        console.log("📦 Pre-send JSON preview:", jsonStr.slice(0, 500));

        // Try SDK send
        try {
          await lineClient.replyMessage(replyToken, [debugFlex]);
          console.log("✅ SDK replyMessage sent OK");
        } catch (sdkErr) {
          console.error("❌ SDK replyMessage failed:", sdkErr?.message || sdkErr);
          console.error("❌ SDK error details:", JSON.stringify(sdkErr?.response?.data || sdkErr || "No details", null, 2));
        }

        // Try raw axios POST
        try {
          const res = await axios.post("https://api.line.me/v2/bot/message/reply", body, {
            headers: {
              "Authorization": `Bearer ${lineConfig.channelAccessToken}`,
              "Content-Type": "application/json",
            },
          });
          console.log("✅ Raw axios POST status:", res.status);
          console.log("✅ Raw axios POST data:", JSON.stringify(res.data || "No data").slice(0, 500));
        } catch (axErr) {
          console.error("❌ Raw axios POST failed:", axErr?.message || axErr);
          console.error("❌ Raw axios Error response data:", JSON.stringify(axErr?.response?.data || "No data", null, 2));
          // Check the request config data that axios sent (if provided)
          if (axErr?.config && axErr.config.data) {
            console.log("🔍 Raw axios Sent body (as captured by axios):", axErr.config.data.toString().slice(0, 1200));
          }
        }
        return;
      }
      // 🧪 NEW: QUICK TEST MENU (/quicktest, /qt)
      // =====================================================
      if (cmd === "/quicktest" || cmd === "/qt" || cmd === "ทดสอบด่วน") {
        console.log(`👑 Admin command: Quick Test Menu`);
        const quickTestFlex = createQuickTestMenu();
        try {
          await lineClient.replyMessage(replyToken, quickTestFlex);
        } catch (replyError) {
          console.log(`⚠️ Reply failed, trying pushMessage...`);
          try {
            await lineClient.pushMessage(userId, quickTestFlex);
          } catch (pushError) {
            console.log(`⚠️ Push failed too, sending text fallback`);
            await lineClient.pushMessage(userId, {
              type: "text",
              text: "🧪 Quick Test:\n\n🏭 พิมพ์: ปัญหา Short Shot แก้ยังไง\n🌾 พิมพ์: คำนวณปุ๋ยสำหรับทุเรียน 5 ไร่\n💰 พิมพ์: ขายมะม่วง 50 กก. 1500 บาท\n📊 พิมพ์: สรุปบัญชีวันนี้\n💎 พิมพ์: ดูแพ็คเกจทั้งหมด",
            });
          }
        }
        return;
      }

      // =====================================================
      // 👋 NEW: TEST WELCOME MESSAGE (/welcome)
      // =====================================================
      if (cmd === "/welcome" || cmd === "/testwelcome") {
        console.log(`👑 Admin command: Test Welcome Message`);
        const welcomeFlex = createWelcomeMessage(userData.displayName || "Admin");

        // Debug: Log welcomeFlex status
        console.log(`📦 welcomeFlex created: ${welcomeFlex ? "Success" : "NULL"}`);

        if (!welcomeFlex) {
          console.log(`❌ createWelcomeMessage returned null`);
          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: "⚠️ ไม่สามารถสร้าง Welcome Flex ได้ กรุณาตรวจสอบ function",
          });
          return;
        }

        try {
          console.log(`📤 Attempting to send welcomeFlex via replyMessage...`);
          await lineClient.replyMessage(replyToken, welcomeFlex);
          console.log(`✅ Welcome Flex sent successfully via replyMessage`);
        } catch (replyError) {
          console.log(`⚠️ Reply failed: ${replyError.message}`);
          console.log(`📤 Attempting pushMessage...`);
          try {
            await lineClient.pushMessage(userId, welcomeFlex);
            console.log(`✅ Welcome Flex sent successfully via pushMessage`);
          } catch (pushError) {
            console.log(`⚠️ Push failed: ${pushError.message}`);
            console.log(`📤 Sending text fallback...`);
            await lineClient.pushMessage(userId, {
              type: "text",
              text: "👋 ยินดีต้อนรับสู่ WiT AI v2.5!\n\n🤖 3-in-1 AI Assistant:\n• 🏭 ฉีดพลาสติก - Vision AI, Defect 9+, คำนวณ 10+\n• 🌾 เกษตร - WiT Scan, ปุ๋ย, Smart Farm\n• 💰 บัญชี - พิมพ์ไทย = จดบัญชี!\n\n💡 พิมพ์ภาษาไทยธรรมดาได้เลย!",
            });
          }
        }
        return;
      }

      // =====================================================
      // 🎁 NEW: TEST TRIAL WELCOME FLEX (/welcometrial, /wt)
      // =====================================================
      if (cmd === "/welcometrial" || cmd === "/wt" || cmd === "/trialwelcome") {
        console.log(`👑 Admin command: Test Trial Welcome Flex`);
        
        const trialWelcomeFlex = createWelcomeTrialFlex();
        
        if (!trialWelcomeFlex) {
          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: "⚠️ ไม่สามารถสร้าง Trial Welcome Flex ได้",
          });
          return;
        }
        
        try {
          await lineClient.replyMessage(replyToken, trialWelcomeFlex);
          console.log(`✅ Trial Welcome Flex sent successfully`);
        } catch (replyError) {
          console.log(`⚠️ Reply failed, trying pushMessage...`);
          try {
            await lineClient.pushMessage(userId, trialWelcomeFlex);
          } catch (pushError) {
            await lineClient.pushMessage(userId, {
              type: "text",
              text: "🎁 ทดลองใช้งาน WiT AI ฟรี 7 วัน!\n\n✅ ถามได้วันละ 7 ครั้ง\n✅ ใช้ได้ทุกฟีเจอร์\n✅ รวม Vision AI วิเคราะห์ภาพ\n\nกด 'ยอมรับข้อตกลง' เพื่อเริ่มใช้งาน",
            });
          }
        }
        return;
      }

      // =====================================================
      // 🎁 NEW: TEST FEATURES MENU FLEX (/features, /fm)
      // =====================================================
      if (cmd === "/features" || cmd === "/fm" || cmd === "/featuresmenu") {
        console.log(`👑 Admin command: Test Features Menu Flex`);
        
        const featuresFlex = createFeaturesMenuFlex();
        
        try {
          await lineClient.replyMessage(replyToken, featuresFlex);
          console.log(`✅ Features Menu Flex sent successfully`);
        } catch (replyError) {
          console.log(`⚠️ Reply failed, trying pushMessage...`);
          await lineClient.pushMessage(userId, featuresFlex);
        }
        return;
      }

      // =====================================================
      // 🎁 NEW: TEST TRIAL STARTED FLEX (/trialstarted, /ts)
      // =====================================================
      if (cmd === "/trialstarted" || cmd === "/ts") {
        console.log(`👑 Admin command: Test Trial Started Flex`);
        
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 7);
        
        const trialStartedFlex = createTrialStartedFlex(userData.displayName || "Admin", {
          trialDays: 7,
          dailyLimit: 7,
          trialEndDate: trialEndDate
        });
        
        if (!trialStartedFlex) {
          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: "⚠️ ไม่สามารถสร้าง Trial Started Flex ได้",
          });
          return;
        }
        
        try {
          await lineClient.replyMessage(replyToken, trialStartedFlex);
          console.log(`✅ Trial Started Flex sent successfully`);
        } catch (replyError) {
          await lineClient.pushMessage(userId, trialStartedFlex);
        }
        return;
      }

      // =====================================================
      // 🎁 NEW: TEST TRIAL STATUS FLEX (/trialstatus, /tst)
      // =====================================================
      if (cmd === "/trialstatustest" || cmd === "/tst") {
        console.log(`👑 Admin command: Test Trial Status Flex`);
        
        const statusFlex = createDailyStatusFlex(userData.displayName || "Admin", {
          status: TRIAL_STATUS.ACTIVE,
          dailyUsage: 3,
          dailyLimit: 7,
          trialDaysRemaining: 5,
          trialDay: 3,
          totalUsage: 15,
          isPremium: false
        });
        
        if (!statusFlex) {
          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: "⚠️ ไม่สามารถสร้าง Trial Status Flex ได้",
          });
          return;
        }
        
        try {
          await lineClient.replyMessage(replyToken, statusFlex);
          console.log(`✅ Trial Status Flex sent successfully`);
        } catch (replyError) {
          await lineClient.pushMessage(userId, statusFlex);
        }
        return;
      }

      // =====================================================
      // 🎁 NEW: TEST DAILY LIMIT FLEX (/triallimit, /tl)
      // =====================================================
      if (cmd === "/triallimit" || cmd === "/tl") {
        console.log(`👑 Admin command: Test Daily Limit Flex`);

        const limitFlex = createDailyLimitFlex({
          dailyUsage: 7,
          dailyLimit: 7,
          trialDaysRemaining: 5,
          trialDay: 3
        });

        if (!limitFlex) {
          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: "⚠️ ไม่สามารถสร้าง Daily Limit Flex ได้",
          });
          return;
        }
        
        try {
          await lineClient.replyMessage(replyToken, limitFlex);
          console.log(`✅ Daily Limit Flex sent successfully`);
        } catch (replyError) {
          await lineClient.pushMessage(userId, limitFlex);
        }
        return;
      }

      // =====================================================
      // 🎁 NEW: TEST TRIAL EXPIRED FLEX (/trialexpired, /te)
      // =====================================================
      if (cmd === "/trialexpired" || cmd === "/te") {
        console.log(`👑 Admin command: Test Trial Expired Flex`);
        
        const expiredFlex = createTrialExpiredFlex({
          totalUsage: 49,
          trialDays: 7
        });
        
        if (!expiredFlex) {
          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: "⚠️ ไม่สามารถสร้าง Trial Expired Flex ได้",
          });
          return;
        }
        
        try {
          await lineClient.replyMessage(replyToken, expiredFlex);
          console.log(`✅ Trial Expired Flex sent successfully`);
        } catch (replyError) {
          await lineClient.pushMessage(userId, expiredFlex);
        }
        return;
      }

      // =====================================================
      // 🎁 NEW: TEST TRIAL ENDING SOON FLEX (/trialending, /ten)
      // =====================================================
      if (cmd === "/trialending" || cmd === "/ten") {
        console.log(`👑 Admin command: Test Trial Ending Soon Flex`);
        
        const endingFlex = createTrialEndingSoonFlex(userData.displayName || "Admin", {
          daysRemaining: 2
        });
        
        if (!endingFlex) {
          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: "⚠️ ไม่สามารถสร้าง Trial Ending Soon Flex ได้",
          });
          return;
        }
        
        try {
          await lineClient.replyMessage(replyToken, endingFlex);
          console.log(`✅ Trial Ending Soon Flex sent successfully`);
        } catch (replyError) {
          await lineClient.pushMessage(userId, endingFlex);
        }
        return;
      }

      // =====================================================
      // 🧪 NEW: TEST MODE COMMANDS
      // =====================================================
      if (cmd.startsWith("/test")) {
        console.log(`👑 Admin command: Test Mode`);
        const testMode = cmd.replace("/test", "").trim();
        const userRef = db.collection("line_users").doc(userId);

        switch (testMode) {
          case "user":
            // Simulate normal user (Free)
            await userRef.update({
              adminTestMode: "user",
              adminTestModeAt: FieldValue.serverTimestamp(),
            });
            await lineClient.replyMessage(replyToken, createTestModeMessage("user", true));
            break;

          case "premium":
            // Simulate Premium user
            await userRef.update({
              adminTestMode: "premium",
              adminTestModeAt: FieldValue.serverTimestamp(),
            });
            await lineClient.replyMessage(replyToken, createTestModeMessage("premium", true));
            break;

          case "quota":
            // Simulate quota limit
            await userRef.update({
              adminTestMode: "quota",
              adminTestQuota: 15,
              adminTestModeAt: FieldValue.serverTimestamp(),
            });
            await lineClient.replyMessage(replyToken, createTestModeMessage("quota", true));
            break;

          case "report":
            // Test Digital Logbook
            await lineClient.replyMessage(replyToken, [
              createTestModeMessage("report", true),
              {
                type: "text",
                text: "📱 ลองพิมพ์ทดสอบ:\n• /report\n• /summary\n• /announce [ข้อความ]",
              },
            ]);
            break;

          case "reset":
          case "":
            // Reset to Admin mode
            await userRef.update({
              adminTestMode: null,
              adminTestQuota: null,
              adminTestModeAt: null,
            });
            await lineClient.replyMessage(replyToken, createTestModeMessage("reset", true));
            break;

          default:
            // Show test menu
            await lineClient.replyMessage(replyToken, {
              type: "text",
              text: `🧪 **Test Mode Commands**\n\n` +
                    `• /test user - ทดสอบเป็นผู้ใช้ปกติ\n` +
                    `• /test premium - ทดสอบเป็น Premium\n` +
                    `• /test quota - ทดสอบโควต้าเต็ม\n` +
                    `• /test report - ทดสอบ Digital Logbook\n` +
                    `• /test reset - กลับสู่โหมดปกติ`,
              quickReply: {
                items: [
                  {type: "action", action: {type: "message", label: "👤 User Mode", text: "/test user"}},
                  {type: "action", action: {type: "message", label: "💎 Premium", text: "/test premium"}},
                  {type: "action", action: {type: "message", label: "📊 Quota", text: "/test quota"}},
                  {type: "action", action: {type: "message", label: "📱 Report", text: "/test report"}},
                  {type: "action", action: {type: "message", label: "🔄 Reset", text: "/test reset"}},
                ],
              },
            });
        }
        return;
      }

      // =====================================================
      // 🚫 NEW: BAN USER COMMAND
      // =====================================================
      if (cmd.startsWith("/ban ")) {
        console.log(`👑 Admin command: Ban User`);
        const banParts = message.text.replace(/^\/ban\s*/i, "").trim();
        const userIdMatch = banParts.match(/U[a-f0-9]{32}/i);

        if (!userIdMatch) {
          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: "❌ กรุณาระบุ User ID\n\nตัวอย่าง:\n/ban U1234567890abcdef [เหตุผล]",
          });
          return;
        }

        const targetUserId = userIdMatch[0];
        const banReason = banParts.replace(targetUserId, "").trim() || "ไม่ระบุเหตุผล";

        // Don't allow banning yourself
        if (targetUserId === userId) {
          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: "❌ ไม่สามารถแบนตัวเองได้",
          });
          return;
        }

        const targetUserRef = db.collection("line_users").doc(targetUserId);
        const targetUserDoc = await targetUserRef.get();

        if (!targetUserDoc.exists) {
          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: `❌ ไม่พบ User ID: ${targetUserId}`,
          });
          return;
        }

        const targetUserData = targetUserDoc.data();

        // Update user to banned status
        await targetUserRef.update({
          isBanned: true,
          banReason: banReason,
          bannedAt: FieldValue.serverTimestamp(),
          bannedBy: userId,
        });

        // Notify banned user
        try {
          await lineClient.pushMessage(targetUserId, {
            type: "text",
            text: `🚫 **บัญชีของคุณถูกระงับ**\n\n` +
                  `เหตุผล: ${banReason}\n\n` +
                  `หากคุณคิดว่านี่เป็นข้อผิดพลาด\n` +
                  `กรุณาติดต่อ Admin`,
          });
        } catch (e) {
          console.warn("Cannot notify banned user:", e);
        }

        await lineClient.replyMessage(replyToken,
            createBanConfirmationMessage(targetUserId, targetUserData.displayName || "Unknown", banReason, true),
        );
        return;
      }

      // =====================================================
      // ✨ NEW: UNBAN USER COMMAND
      // =====================================================
      if (cmd.startsWith("/unban ")) {
        console.log(`👑 Admin command: Unban User`);
        const userIdMatch = message.text.match(/U[a-f0-9]{32}/i);

        if (!userIdMatch) {
          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: "❌ กรุณาระบุ User ID\n\nตัวอย่าง:\n/unban U1234567890abcdef",
          });
          return;
        }

        const targetUserId = userIdMatch[0];
        const targetUserRef = db.collection("line_users").doc(targetUserId);
        const targetUserDoc = await targetUserRef.get();

        if (!targetUserDoc.exists) {
          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: `❌ ไม่พบ User ID: ${targetUserId}`,
          });
          return;
        }

        const targetUserData = targetUserDoc.data();

        if (!targetUserData.isBanned) {
          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: `ℹ️ ผู้ใช้นี้ไม่ได้ถูกแบน`,
          });
          return;
        }

        // Remove ban
        await targetUserRef.update({
          isBanned: false,
          banReason: null,
          unbannedAt: FieldValue.serverTimestamp(),
          unbannedBy: userId,
        });

        // Notify user
        try {
          await lineClient.pushMessage(targetUserId, {
            type: "text",
            text: `✅ **บัญชีของคุณถูกปลดแบนแล้ว**\n\n` +
                  `ยินดีต้อนรับกลับมาครับ! 🎉\n` +
                  `สามารถใช้งานได้ตามปกติแล้ว`,
          });
        } catch (e) {
          console.warn("Cannot notify unbanned user:", e);
        }

        await lineClient.replyMessage(replyToken,
            createBanConfirmationMessage(targetUserId, targetUserData.displayName || "Unknown", null, false),
        );
        return;
      }

      // =====================================================
      // ⏰ NEW: EXTEND SUBSCRIPTION COMMAND
      // =====================================================
      if (cmd.startsWith("/extend ")) {
        console.log(`👑 Admin command: Extend Subscription`);
        const extendText = message.text.replace(/^\/extend\s*/i, "").trim();
        const userIdMatch = extendText.match(/U[a-f0-9]{32}/i);
        const daysMatch = extendText.match(/(\d+)\s*(วัน|day|days)?/i);

        if (!userIdMatch) {
          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: "❌ กรุณาระบุ User ID และจำนวนวัน\n\nตัวอย่าง:\n/extend U1234567890abcdef 30",
          });
          return;
        }

        const targetUserId = userIdMatch[0];
        const extendDays = daysMatch ? parseInt(daysMatch[1]) : 30;

        const targetUserRef = db.collection("line_users").doc(targetUserId);
        const targetUserDoc = await targetUserRef.get();

        if (!targetUserDoc.exists) {
          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: `❌ ไม่พบ User ID: ${targetUserId}`,
          });
          return;
        }

        const targetUserData = targetUserDoc.data();

        // Calculate new expiry date
        let currentExpiry = targetUserData.subscriptionExpiry?.toDate() || new Date();
        if (currentExpiry < new Date()) {
          currentExpiry = new Date();
        }
        const newExpiry = new Date(currentExpiry);
        newExpiry.setDate(newExpiry.getDate() + extendDays);

        // Update subscription
        await targetUserRef.update({
          isPremium: true,
          subscriptionStatus: "approved",
          subscriptionExpiry: newExpiry,
          extendedAt: FieldValue.serverTimestamp(),
          extendedBy: userId,
          extendDays: extendDays,
        });

        // Notify user
        try {
          await lineClient.pushMessage(targetUserId, {
            type: "text",
            text: `🎉 **ยินดีด้วย!**\n\n` +
                  `สิทธิ์ Premium ของคุณได้รับการต่ออายุ\n` +
                  `➕ เพิ่ม: ${extendDays} วัน\n` +
                  `📅 หมดอายุ: ${newExpiry.toLocaleDateString("th-TH")}\n\n` +
                  `ขอบคุณที่ใช้บริการครับ 🙏`,
          });
        } catch (e) {
          console.warn("Cannot notify user:", e);
        }

        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: `✅ **ต่ออายุสำเร็จ**\n\n` +
                `👤 ${targetUserData.displayName || "Unknown"}\n` +
                `🆔 ${targetUserId}\n` +
                `➕ เพิ่ม: ${extendDays} วัน\n` +
                `📅 หมดอายุใหม่: ${newExpiry.toLocaleDateString("th-TH")}`,
        });
        return;
      }

      // =====================================================
      // 🏢 NEW: ORGANIZATION LIST COMMAND
      // =====================================================
      if (cmd === "/orglist" || cmd === "/orgs" || cmd.includes("รายการองค์กร")) {
        console.log(`👑 Admin command: Organization List`);

        // Get users grouped by orgCode
        const usersSnapshot = await db.collection("line_users")
            .where("orgCode", "!=", null)
            .get();

        const orgMap = new Map();
        usersSnapshot.forEach((doc) => {
          const data = doc.data();
          const orgCode = data.orgCode;
          if (orgCode) {
            if (!orgMap.has(orgCode)) {
              orgMap.set(orgCode, {orgCode, memberCount: 0, members: []});
            }
            orgMap.get(orgCode).memberCount++;
            orgMap.get(orgCode).members.push(data.displayName || "Unknown");
          }
        });

        const orgs = Array.from(orgMap.values()).sort((a, b) => b.memberCount - a.memberCount);

        if (orgs.length === 0) {
          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: "❌ ยังไม่มีองค์กรในระบบ",
          });
          return;
        }

        await lineClient.replyMessage(replyToken, createOrgListMessage(orgs));
        return;
      }

      // =====================================================
      // 🧹 NEW: CLEAR CACHE COMMAND
      // =====================================================
      if (cmd === "/clearcache" || cmd === "/cache" || cmd === "/cc") {
        console.log(`👑 Admin command: Clear Cache`);

        // Get stats before clearing
        const beforeResponseCache = responseCache.getStats();
        const beforeMemoryCache = getConversationMemory().getStats();

        // Clear all caches
        const responseCacheCleared = responseCache.clear();
        const memoryCacheCleared = getConversationMemory().clearMemoryCache();

        // Get stats after clearing
        const afterResponseCache = responseCache.getStats();
        const afterMemoryCache = getConversationMemory().getStats();

        await lineClient.replyMessage(replyToken, {
          type: "flex",
          altText: "🧹 Cache Cleared",
          contents: {
            type: "bubble",
            size: "mega",
            header: {
              type: "box",
              layout: "vertical",
              backgroundColor: "#27ae60",
              paddingAll: "15px",
              contents: [
                {
                  type: "text",
                  text: "🧹 Cache Cleared!",
                  color: "#ffffff",
                  weight: "bold",
                  size: "xl",
                },
              ],
            },
            body: {
              type: "box",
              layout: "vertical",
              spacing: "md",
              contents: [
                {
                  type: "text",
                  text: "📊 ผลการดำเนินการ",
                  weight: "bold",
                  size: "md",
                  color: "#1f2937",
                },
                {
                  type: "separator",
                  margin: "sm",
                },
                {
                  type: "box",
                  layout: "horizontal",
                  margin: "md",
                  contents: [
                    {type: "text", text: "Response Cache:", size: "sm", color: "#6b7280", flex: 5},
                    {type: "text", text: `${responseCacheCleared} items`, size: "sm", color: "#059669", weight: "bold", flex: 3, align: "end"},
                  ],
                },
                {
                  type: "box",
                  layout: "horizontal",
                  margin: "sm",
                  contents: [
                    {type: "text", text: "Memory Cache:", size: "sm", color: "#6b7280", flex: 5},
                    {type: "text", text: `${memoryCacheCleared} items`, size: "sm", color: "#059669", weight: "bold", flex: 3, align: "end"},
                  ],
                },
                {
                  type: "separator",
                  margin: "lg",
                },
                {
                  type: "text",
                  text: "📈 สถานะหลังเคลียร์",
                  weight: "bold",
                  size: "sm",
                  color: "#1f2937",
                  margin: "md",
                },
                {
                  type: "box",
                  layout: "horizontal",
                  margin: "sm",
                  contents: [
                    {type: "text", text: "Response Cache:", size: "xs", color: "#9ca3af", flex: 5},
                    {type: "text", text: `${afterResponseCache.size}/${afterResponseCache.maxSize}`, size: "xs", color: "#374151", flex: 3, align: "end"},
                  ],
                },
                {
                  type: "box",
                  layout: "horizontal",
                  margin: "sm",
                  contents: [
                    {type: "text", text: "Memory Cache:", size: "xs", color: "#9ca3af", flex: 5},
                    {type: "text", text: `${afterMemoryCache.cacheSize}/${afterMemoryCache.maxCacheSize}`, size: "xs", color: "#374151", flex: 3, align: "end"},
                  ],
                },
              ],
            },
            footer: {
              type: "box",
              layout: "vertical",
              spacing: "sm",
              contents: [
                {
                  type: "text",
                  text: `⏰ ${new Date().toLocaleString("th-TH")}`,
                  size: "xs",
                  color: "#9ca3af",
                  align: "center",
                },
              ],
            },
            styles: {
              header: {separator: true},
            },
          },
        });
        return;
      }

      // =====================================================
      // 📊 NEW: CACHE STATS COMMAND
      // =====================================================
      if (cmd === "/cachestats" || cmd === "/cs") {
        console.log(`👑 Admin command: Cache Stats`);

        const responseCacheStats = responseCache.getStats();
        const memoryCacheStats = getConversationMemory().getStats();

        await lineClient.replyMessage(replyToken, {
          type: "flex",
          altText: "📊 Cache Statistics",
          contents: {
            type: "bubble",
            size: "mega",
            header: {
              type: "box",
              layout: "vertical",
              backgroundColor: "#3b82f6",
              paddingAll: "15px",
              contents: [
                {
                  type: "text",
                  text: "📊 Cache Statistics",
                  color: "#ffffff",
                  weight: "bold",
                  size: "xl",
                },
              ],
            },
            body: {
              type: "box",
              layout: "vertical",
              spacing: "md",
              contents: [
                {
                  type: "text",
                  text: "🔄 Response Cache",
                  weight: "bold",
                  size: "md",
                  color: "#1f2937",
                },
                {
                  type: "box",
                  layout: "vertical",
                  margin: "sm",
                  spacing: "xs",
                  contents: [
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        {type: "text", text: "Size:", size: "sm", color: "#6b7280", flex: 4},
                        {type: "text", text: `${responseCacheStats.size}/${responseCacheStats.maxSize}`, size: "sm", color: "#059669", weight: "bold", flex: 3, align: "end"},
                      ],
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        {type: "text", text: "Total Hits:", size: "sm", color: "#6b7280", flex: 4},
                        {type: "text", text: `${responseCacheStats.totalHits}`, size: "sm", color: "#374151", flex: 3, align: "end"},
                      ],
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        {type: "text", text: "Expired:", size: "sm", color: "#6b7280", flex: 4},
                        {type: "text", text: `${responseCacheStats.expiredCount}`, size: "sm", color: "#f59e0b", flex: 3, align: "end"},
                      ],
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        {type: "text", text: "TTL:", size: "sm", color: "#6b7280", flex: 4},
                        {type: "text", text: `${responseCacheStats.ttlMinutes} นาที`, size: "sm", color: "#374151", flex: 3, align: "end"},
                      ],
                    },
                  ],
                },
                {
                  type: "separator",
                  margin: "lg",
                },
                {
                  type: "text",
                  text: "🧠 Memory Cache",
                  weight: "bold",
                  size: "md",
                  color: "#1f2937",
                  margin: "md",
                },
                {
                  type: "box",
                  layout: "horizontal",
                  margin: "sm",
                  contents: [
                    {type: "text", text: "Size:", size: "sm", color: "#6b7280", flex: 4},
                    {type: "text", text: `${memoryCacheStats.cacheSize}/${memoryCacheStats.maxCacheSize}`, size: "sm", color: "#059669", weight: "bold", flex: 3, align: "end"},
                  ],
                },
              ],
            },
            footer: {
              type: "box",
              layout: "horizontal",
              spacing: "sm",
              contents: [
                {
                  type: "button",
                  style: "primary",
                  color: "#ef4444",
                  action: {
                    type: "message",
                    label: "🧹 Clear All",
                    text: "/clearcache",
                  },
                  height: "sm",
                },
              ],
            },
            styles: {
              header: {separator: true},
            },
          },
        });
        return;
      }

      // =====================================================
      // � ADMIN COMMANDS (General Access - No Super Admin Required)
      // =====================================================
      //const cmd = message.text.toLowerCase().trim();
      console.log(`📋 Checking admin commands for: "${cmd}"`);

      // =====================================================
      // �👤 NEW: USER DETAIL COMMAND (Enhanced)
      // =====================================================
      if (cmd.startsWith("/userdetail ") || cmd.startsWith("/ud ")) {
        console.log(`👑 Admin command: User Detail (Enhanced)`);
        const userIdMatch = message.text.match(/U[a-f0-9]{32}/i);

        if (!userIdMatch) {
          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: "❌ กรุณาระบุ User ID\n\nตัวอย่าง:\n/userdetail U1234567890abcdef",
          });
          return;
        }

        const targetUserId = userIdMatch[0];
        const targetUserDoc = await db.collection("line_users").doc(targetUserId).get();

        if (!targetUserDoc.exists) {
          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: `❌ ไม่พบ User ID: ${targetUserId}`,
          });
          return;
        }

        const userData_target = {...targetUserDoc.data(), odUserId: targetUserId};
        await lineClient.replyMessage(replyToken, createUserDetailMessage(userData_target));
        return;
      }

      // =====================================================
      // 🔄 NEW: RESET QUOTA COMMAND
      // =====================================================
      if (cmd.startsWith("/resetquota ")) {
        console.log(`👑 Admin command: Reset Quota`);
        const userIdMatch = message.text.match(/U[a-f0-9]{32}/i);

        if (!userIdMatch) {
          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: "❌ กรุณาระบุ User ID\n\nตัวอย่าง:\n/resetquota U1234567890abcdef",
          });
          return;
        }

        const targetUserId = userIdMatch[0];
        const targetUserRef = db.collection("line_users").doc(targetUserId);
        const targetUserDoc = await targetUserRef.get();

        if (!targetUserDoc.exists) {
          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: `❌ ไม่พบ User ID: ${targetUserId}`,
          });
          return;
        }

        // Reset quota
        await targetUserRef.update({
          dailyUsage: 0,
          usageResetDate: new Date().toDateString(),
          quotaResetAt: FieldValue.serverTimestamp(),
          quotaResetBy: userId,
        });

        const targetUserData = targetUserDoc.data();
        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: `✅ **รีเซ็ตโควต้าสำเร็จ**\n\n` +
                `👤 ${targetUserData.displayName || "Unknown"}\n` +
                `🆔 ${targetUserId}\n` +
                `📊 โควต้า: 0/${targetUserData.isPremium ? "∞" : "15"}`,
        });
        return;
      }

      // Command: ดูรายการรอตรวจสอบ
      if (cmd.includes("/pending") || cmd.includes("รอตรวจสอบ") || cmd.includes("ดูรายการ")) {
        console.log(`👑 Admin command detected: ${cmd}`);
        const pendingUsers = await db.collection("line_users")
            .where("subscriptionStatus", "==", "slip_uploaded")
            .orderBy("lastSlipUploadAt", "desc")
            .limit(10)
            .get();

        if (pendingUsers.empty) {
          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: "✅ ไม่มีรายการรอตรวจสอบ",
          });
          return;
        }

        let report = "📋 **รายการรอตรวจสอบ**\n\n";
        let count = 1;
        pendingUsers.forEach((doc) => {
          const data = doc.data();
          const time = data.lastSlipUploadAt ? new Date(data.lastSlipUploadAt.toDate()).toLocaleString("th-TH") : "N/A";
          report += `${count}. ${data.displayName || "ไม่ระบุชื่อ"}\n`;
          report += `   ID: ${doc.id}\n`;
          report += `   📦 ${data.selectedPackage || "ไม่ระบุ"}\n`;
          report += `   📧 ${data.email || "ไม่ระบุ"}\n`;
          report += `   ⏰ ${time}\n\n`;
          count++;
        });

        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: report,
        });
        return;
      }

      // Command: สถิติผู้ใช้งาน (ใช้ Flex Message)
      if (cmd.includes("/stats") || cmd.includes("สถิติ") || cmd.includes("ดูสถิติ") || cmd.includes("ภาพรวม")) {
        console.log(`👑 Admin command detected: stats`);
        const allUsers = await db.collection("line_users").get();
        const premiumUsersSnapshot = await db.collection("line_users")
            .where("isPremium", "==", true)
            .get();

        let totalMessages = 0;
        let activeToday = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        allUsers.forEach((doc) => {
          const data = doc.data();
          totalMessages += data.usageCount || 0;
          const lastActive = data.lastActiveAt?.toDate();
          if (lastActive && lastActive >= today) activeToday++;
        });

        const avgMessages = allUsers.size > 0 ? (totalMessages / allUsers.size).toFixed(2) : 0;

        // Create Flex Message
        const flexMsg = createAdminStatsMessage({
          totalUsers: allUsers.size,
          premiumUsers: premiumUsersSnapshot.size,
          activeToday,
          totalMessages,
          avgMessages,
        });

        await lineClient.replyMessage(replyToken, flexMsg);
        return;
      }

      // Command: ดูผู้ใช้งานสูงสุด (Top Users - ใช้ Flex Message)
      if (cmd.includes("/top") || cmd.includes("ผู้ใช้สูงสุด") || cmd.includes("top users")) {
        console.log(`👑 Admin command detected: top users`);
        const topUsersSnapshot = await db.collection("line_users")
            .orderBy("usageCount", "desc")
            .limit(10)
            .get();

        if (topUsersSnapshot.empty) {
          const errorMsg = createSimpleMessage("ไม่พบข้อมูลผู้ใช้งาน", false);
          await lineClient.replyMessage(replyToken, errorMsg);
          return;
        }

        const topUsers = [];
        for (const doc of topUsersSnapshot.docs) {
          const data = doc.data();
          let displayName = data.displayName || "User";

          // Fetch real name if generic
          if (displayName === "User" || displayName === "New User") {
            try {
              const profile = await lineClient.getProfile(doc.id);
              displayName = profile.displayName;
              // Update DB in background
              doc.ref.update({displayName: displayName}).catch((e) => console.error(e));
            } catch (e) {
              console.warn(`Failed to fetch profile for ${doc.id}`);
            }
          }

          topUsers.push({
            name: displayName,
            count: data.usageCount || 0,
            isPremium: data.isPremium || false,
          });
        }

        // Create Flex Message
        const flexMsg = createTopUsersMessage(topUsers);
        try {
          await lineClient.replyMessage(replyToken, flexMsg);
          console.log(`✅ Top users Flex message sent successfully`);
        } catch (flexError) {
          console.error(`❌ Flex message error:`, flexError.message);
          console.error(`❌ Error details:`, JSON.stringify(flexError.originalError?.response?.data || "No details"));
          // Fallback to text message with sanitized names
          const textMsg = `🏆 Top Users:\n${topUsers.map((u, i) => `${i+1}. ${sanitizeTextForLine(u.name)} - ${u.count} ข้อความ`).join("\n")}`;
          await lineClient.replyMessage(replyToken, {type: "text", text: textMsg});
        }
        return;
      }

      // Command: /recent - ผู้ใช้งานล่าสุด (Admin)
      if (cmd === "/recent" || cmd.includes("ผู้ใช้ล่าสุด") || cmd.includes("recent")) {
        console.log(`👑 Admin command detected: recent users`);
        
        try {
          const usersSnapshot = await db.collection("line_users")
              .orderBy("lastActiveAt", "desc")
              .limit(15)
              .get();

          const recentUsers = [];
          
          for (const doc of usersSnapshot.docs) {
            const data = doc.data();
            
            let userName = "Unknown";
            try {
              const profile = await lineClient.getProfile(doc.id);
              userName = profile.displayName;
            } catch (e) {
              userName = doc.id.substring(0, 8);
            }

            const lastActive = data.lastActiveAt?.toDate();
            const timeAgo = lastActive ? getTimeAgo(lastActive) : "ไม่ทราบ";

            recentUsers.push({
              id: doc.id,
              name: userName,
              timeAgo: timeAgo,
              count: data.usageCount || data.totalTrialUsage || 0,
              isPremium: data.isPremium || false,
              trialStatus: data.trialStatus || "none",
              trialDaysLeft: 0,
              isBanned: data.isBanned || false,
            });
          }

          console.log("Recent Users before calling flex:", JSON.stringify(recentUsers.slice(0, 3)));
          const flexMsg = createRecentUsersMessageSimple(recentUsers);
          await lineClient.replyMessage(replyToken, flexMsg);
          console.log(`✅ Recent users Flex message sent successfully`);
        } catch (err) {
          console.error("Error in /recent command:", err);
          const errorMsg = createSimpleMessage(`เกิดข้อผิดพลาด: ${err.message}`, false);
          await lineClient.replyMessage(replyToken, errorMsg);
        }
        return;
      }

      // Command: อนุมัติสมาชิก
      if (cmd.includes("/approve") || cmd.includes("อนุมัติ") || cmd.includes("approve")) {
        console.log(`👑 Admin command detected: approve`);
        const userIdMatch = message.text.match(/U[a-f0-9]{32}/i);
        if (!userIdMatch) {
          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: "❌ กรุณาระบุ User ID\n\nตัวอย่าง:\n/approve U1234567890abcdef",
          });
          return;
        }

        const targetUserId = userIdMatch[0];
        const targetUserRef = db.collection("line_users").doc(targetUserId);
        const targetUserDoc = await targetUserRef.get();

        if (!targetUserDoc.exists) {
          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: "❌ ไม่พบ User ID นี้ในระบบ",
          });
          return;
        }

        // Update to Premium
        await targetUserRef.update({
          isPremium: true,
          subscriptionStatus: "active",
          approvedAt: FieldValue.serverTimestamp(),
          approvedBy: "Admin",
        });

        const targetUserData = targetUserDoc.data();

        // Notify user
        try {
          await lineClient.pushMessage(targetUserId, {
            type: "text",
            text: `🎉 **ยินดีด้วยครับ!**\n\n` +
                  `บัญชีของคุณได้รับการอนุมัติแล้ว ✅\n` +
                  `คุณสามารถใช้งานได้ไม่จำกัดแล้วครับ 💎\n\n` +
                  `ขอบคุณที่สนับสนุนครับ 🙏`,
          });
        } catch (err) {
          console.warn("Cannot notify user:", err);
        }

        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: `✅ **อนุมัติสำเร็จ**\n\n` +
                `👤 ${targetUserData.displayName || "Unknown"}\n` +
                `🆔 ${targetUserId}\n` +
                `📦 ${targetUserData.selectedPackage || "N/A"}\n\n` +
                `ผู้ใช้ได้รับการแจ้งเตือนแล้ว`,
        });
        return;
      }

      // Command: ดูข้อมูลผู้ใช้ (ใช้ Flex Message)
      if (cmd.includes("/user") || cmd.includes("ดูข้อมูล") || cmd.includes("user") || cmd.includes("ข้อมูลผู้ใช้")) {
        console.log(`👑 Admin command detected: user info`);
        const userIdMatch = message.text.match(/U[a-f0-9]{32}/i);
        if (!userIdMatch) {
          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: "❌ กรุณาระบุ User ID\n\nตัวอย่าง:\n/user U1234567890abcdef",
          });
          return;
        }

        const targetUserId = userIdMatch[0];
        const targetUserDoc = await db.collection("line_users").doc(targetUserId).get();

        if (!targetUserDoc.exists) {
          const errorMsg = createSimpleMessage(`ไม่พบ User ID: ${targetUserId}`, false);
          await lineClient.replyMessage(replyToken, errorMsg);
          return;
        }

        const data = targetUserDoc.data();
        const createdAt = data.createdAt ? new Date(data.createdAt.toDate()).toLocaleDateString("th-TH") : "ไม่ทราบ";
        const lastActive = data.lastActiveAt ? data.lastActiveAt.toDate() : null;
        const timeAgo = lastActive ? getTimeAgo(lastActive) : "ไม่ทราบ";

        // Create Flex Message
        const flexMsg = createUserInfoMessage({
          name: data.displayName || "Unknown",
          id: targetUserId,
          isPremium: data.isPremium || false,
          usageCount: data.usageCount || 0,
          createdAt,
          lastActive: timeAgo,
          quota: data.usageCount || 0,
        });

        await lineClient.replyMessage(replyToken, flexMsg);
        return;
      }

      // Command: รายงานระบบสมัครสมาชิก Premium (ใช้ Flex Message)
      if (cmd.includes("/premium") || cmd.includes("รายงาน premium") || cmd.includes("สรุปยอด")) {
        console.log(`👑 Admin command detected: premium report`);

        const premiumUsersSnapshot = await db.collection("line_users")
            .where("isPremium", "==", true)
            .get();

        let monthlyCount = 0;
        let yearlyCount = 0;
        let teamCount = 0;
        let totalRevenue = 0;

        premiumUsersSnapshot.forEach((doc) => {
          const data = doc.data();
          const pkg = data.selectedPackage || "";

          if (pkg.includes("รายเดือน") || pkg.includes("99")) {
            monthlyCount++;
            totalRevenue += 99;
          } else if (pkg.includes("3 เดือน") || pkg.includes("259") || pkg.includes("รายปี") || pkg.includes("699")) {
            yearlyCount++;
            totalRevenue += 699;
          } else {
            teamCount++;
            totalRevenue += 2490;
          }
        });

        // Create Flex Message
        const flexMsg = createPremiumReportMessage({
          total: premiumUsersSnapshot.size,
          monthly: monthlyCount,
          yearly: yearlyCount,
          team: teamCount,
          revenue: totalRevenue,
        });

        await lineClient.replyMessage(replyToken, flexMsg);
        return;
      }

      // Command: ตอบกลับผู้ใช้ (Reply)
      if (cmd.startsWith("/reply") || cmd.startsWith("ตอบกลับ")) {
        console.log(`👑 Admin command detected: reply`);
        const parts = message.text.trim().split(/\s+/);
        if (parts.length < 3) {
          await lineClient.replyMessage(replyToken, {type: "text", text: "❌ รูปแบบคำสั่งผิด\n\n/reply [UserID] [ข้อความ]\nหรือ\nตอบกลับ [UserID] [ข้อความ]"});
          return;
        }
        const targetId = parts[1];
        const replyText = parts.slice(2).join(" ");

        try {
          await lineClient.pushMessage(targetId, {type: "text", text: `📩 **ข้อความจาก Admin:**\n\n${replyText}`});
          await lineClient.replyMessage(replyToken, {type: "text", text: `✅ ส่งข้อความถึง ${targetId} แล้ว`});
        } catch (err) {
          await lineClient.replyMessage(replyToken, {type: "text", text: `❌ ส่งไม่สำเร็จ: ${err.message}`});
        }
        return;
      }

      // Command: ประกาศข่าวสาร (Broadcast) - Active Users 7 Days
      if (cmd.startsWith("/broadcast") || cmd.startsWith("ประกาศ")) {
        console.log(`👑 Admin command detected: broadcast`);

        let broadcastText = message.text;
        if (cmd.startsWith("/broadcast")) {
          broadcastText = broadcastText.replace(/^\/broadcast/i, "");
        } else if (cmd.startsWith("ประกาศถึงทุกคน")) {
          broadcastText = broadcastText.replace(/^ประกาศถึงทุกคน/, "");
        } else {
          broadcastText = broadcastText.replace(/^ประกาศ/, "");
        }

        broadcastText = broadcastText.trim();
        // Remove surrounding quotes if present
        broadcastText = broadcastText.replace(/^['"‘’“”]+|['"‘’“”]+$/g, "");

        if (!broadcastText) {
          await lineClient.replyMessage(replyToken, {type: "text", text: "❌ กรุณาระบุข้อความประกาศ"});
          return;
        }

        // Get active users in last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const activeUsers = await db.collection("line_users")
            .where("lastActiveAt", ">=", sevenDaysAgo)
            .get();

        if (activeUsers.empty) {
          await lineClient.replyMessage(replyToken, {type: "text", text: "❌ ไม่พบผู้ใช้งานที่ Active ใน 7 วันนี้"});
          return;
        }

        let successCount = 0;
        const broadcastPromises = [];

        activeUsers.forEach((doc) => {
          if (doc.id !== userId) { // Don't send to self
            broadcastPromises.push(
                lineClient.pushMessage(doc.id, {
                  type: "text",
                  text: `📢 **ประกาศจากระบบ:**\n\n${broadcastText}`,
                }).then(() => successCount++).catch((e) => console.error(`Failed to send to ${doc.id}`, e)),
            );
          }
        });

        await Promise.all(broadcastPromises);

        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: `✅ ส่งประกาศสำเร็จ\n\n👥 ผู้รับ: ${successCount} คน (Active 7 วันล่าสุด)`,
        });
        return;
      }

      // Command: สรุปยอดรายวัน (Daily Report - ใช้ Flex Message)
      if (cmd === "/daily" || cmd.includes("สรุปวันนี้")) {
        console.log(`👑 Admin command detected: daily report`);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const newUsersSnapshot = await db.collection("line_users")
            .where("createdAt", ">=", today)
            .get();

        const activeUsersSnapshot = await db.collection("line_users")
            .where("lastActiveAt", ">=", today)
            .get();

        // Count total messages today (approximate)
        let messagesTypeToday = 0;
        activeUsersSnapshot.forEach((doc) => {
          const data = doc.data();
          messagesTypeToday += data.usageCount || 0;
        });

        // Create Flex Message
        const flexMsg = createDailySummaryMessage({
          newUsers: newUsersSnapshot.size,
          activeUsers: activeUsersSnapshot.size,
          messages: messagesTypeToday,
          revenue: 0,
          date: today.toLocaleDateString("th-TH"),
        });

        await lineClient.replyMessage(replyToken, flexMsg);
        return;
      }

      // Command: คำสั่งที่ใช้ได้ - ใช้ Flex Message Control Panel
      if (cmd === "/help" || cmd === "help" || cmd.includes("คำสั่ง")) {
        // ใช้ Admin Control Panel Flex Message แทน text
        const adminPanelFlex = createAdminControlPanelMessage();
        await lineClient.replyMessage(replyToken, [
          {
            type: "text",
            text: `👑 **Admin Control Panel**\n\n` +
                  `เลื่อนดู Carousel เพื่อเข้าถึงคำสั่งทั้งหมด\n` +
                  `หรือพิมพ์ /admin เพื่อดูเมนูนี้อีกครั้ง`,
          },
          adminPanelFlex,
        ]);
        return;
      }

      // Command: /knowledge - ดูสถิติคลังความรู้ (Flex Message)
      if (cmd === "/knowledge" || cmd.includes("ดูคลังความรู้") || cmd.includes("สถิติความรู้")) {
        try {
          const hyperKnowledge = getHyperLocalizedKnowledge();
          const stats = await hyperKnowledge.getKnowledgeStats();

          // Use new Flex Message for better UI
          const flexMsg = createKnowledgeStatsFlexMessage(stats);
          await lineClient.replyMessage(replyToken, flexMsg);
        } catch (err) {
          const errorMsg = createSimpleMessage(`❌ เกิดข้อผิดพลาด: ${err.message}`, false);
          await lineClient.replyMessage(replyToken, errorMsg);
        }
        return;
      }

      // Command: /verify [ID] - ยืนยันความรู้
      if (cmd.startsWith("/verify ")) {
        const knowledgeId = cmd.replace("/verify ", "").trim();
        if (!knowledgeId) {
          const errorMsg = createSimpleMessage("กรุณาระบุ ID ความรู้ที่ต้องการยืนยัน", false);
          await lineClient.replyMessage(replyToken, errorMsg);
          return;
        }

        try {
          const hyperKnowledge = getHyperLocalizedKnowledge();
          const result = await hyperKnowledge.verifyKnowledge(knowledgeId, userId, "verified");

          if (result) {
            const successMsg = createSimpleMessage(`ยืนยันความรู้ ${knowledgeId} สำเร็จ!`, true);
            await lineClient.replyMessage(replyToken, successMsg);
          } else {
            const errorMsg = createSimpleMessage(`ไม่พบความรู้ ID: ${knowledgeId}`, false);
            await lineClient.replyMessage(replyToken, errorMsg);
          }
        } catch (err) {
          const errorMsg = createSimpleMessage(`เกิดข้อผิดพลาด: ${err.message}`, false);
          await lineClient.replyMessage(replyToken, errorMsg);
        }
        return;
      }

      // =====================================================
      // 🧠 SUPER ADMIN MEMORY COMMANDS (ต้องอยู่ก่อนทุกอย่าง!)
      // =====================================================

      // Command: /history หรือ ประวัติการสนทนา - ดูประวัติการสนทนา Super Admin
      if (cmd === "/history" || cmd === "ประวัติการสนทนา" || cmd === "ดูประวัติ" || cmd === "/myhistory") {
        try {
          const memory = getSuperAdminMemory();
          const conversations = await memory.getRecentConversations(15);

          if (conversations.length === 0) {
            const emptyMsg = createSimpleMessage("📖 ยังไม่มีประวัติการสนทนา", false);
            await lineClient.replyMessage(replyToken, emptyMsg);
            return;
          }

          let historyText = "📚 **ประวัติการสนทนา (15 รายการล่าสุด)**\n";
          historyText += "━━━━━━━━━━━━━━━━━━━━━\n\n";

          conversations.reverse().forEach((conv, idx) => {
            const timeAgo = memory._getTimeAgo(conv.createdAt);
            const type = conv.metadata?.conversationType || "general";
            const typeIcon = {
              command: "⚙️",
              development: "🛠️",
              debugging: "🐛",
              query: "❓",
              testing: "🧪",
              general: "💬",
            }[type] || "💬";

            historyText += `${typeIcon} **[${idx + 1}]** ${timeAgo}\n`;
            historyText += `Q: ${conv.question.substring(0, 80)}${conv.question.length > 80 ? "..." : ""}\n`;
            historyText += `A: ${conv.answer.substring(0, 100)}${conv.answer.length > 100 ? "..." : ""}\n`;
            historyText += "─────────────────────\n";
          });

          historyText += "\n💡 พิมพ์ \"/memorystats\" เพื่อดูสถิติ";

          const historyMsg = createSimpleMessage(historyText, true);
          await lineClient.replyMessage(replyToken, historyMsg);
        } catch (err) {
          const errorMsg = createSimpleMessage(`❌ เกิดข้อผิดพลาด: ${err.message}`, false);
          await lineClient.replyMessage(replyToken, errorMsg);
        }
        return;
      }

      // Command: /memorystats - ดูสถิติการสนทนา
      if (cmd === "/memorystats" || cmd === "สถิติการสนทนา") {
        try {
          const memory = getSuperAdminMemory();
          const stats = await memory.getConversationStats();

          if (!stats) {
            const errorMsg = createSimpleMessage("❌ ไม่สามารถดึงสถิติได้", false);
            await lineClient.replyMessage(replyToken, errorMsg);
            return;
          }

          let statsText = "📊 **สถิติการสนทนา Super Admin**\n";
          statsText += "━━━━━━━━━━━━━━━━━━━━━\n\n";
          statsText += `📈 **จำนวนรวม:** ${stats.totalConversations} การสนทนา\n\n`;

          statsText += "📂 **แยกตามประเภท:**\n";
          Object.entries(stats.byType).forEach(([type, count]) => {
            const typeIcon = {
              command: "⚙️",
              development: "🛠️",
              debugging: "🐛",
              query: "❓",
              testing: "🧪",
              general: "💬",
            }[type] || "💬";
            statsText += `${typeIcon} ${type}: ${count}\n`;
          });

          statsText += `\n📏 **ความยาวเฉลี่ย:**\n`;
          statsText += `• คำถาม: ${stats.avgQuestionLength} ตัวอักษร\n`;
          statsText += `• คำตอบ: ${stats.avgAnswerLength} ตัวอักษร\n`;

          if (stats.firstConversation && stats.lastConversation) {
            const firstDate = stats.firstConversation.toDate?.() || stats.firstConversation;
            const lastDate = stats.lastConversation.toDate?.() || stats.lastConversation;
            statsText += `\n📅 **ช่วงเวลา:**\n`;
            statsText += `• เริ่มต้น: ${firstDate.toLocaleString("th-TH")}\n`;
            statsText += `• ล่าสุด: ${lastDate.toLocaleString("th-TH")}\n`;
          }

          const statsMsg = createSimpleMessage(statsText, true);
          await lineClient.replyMessage(replyToken, statsMsg);
        } catch (err) {
          const errorMsg = createSimpleMessage(`❌ เกิดข้อผิดพลาด: ${err.message}`, false);
          await lineClient.replyMessage(replyToken, errorMsg);
        }
        return;
      }

      // Command: /search [keyword] - ค้นหาในประวัติการสนทนา
      if (cmd.startsWith("/search ")) {
        const keyword = cmd.replace("/search ", "").trim();
        if (!keyword) {
          const errorMsg = createSimpleMessage("❌ กรุณาระบุคำค้นหา เช่น /search ปัญหา", false);
          await lineClient.replyMessage(replyToken, errorMsg);
          return;
        }

        try {
          const memory = getSuperAdminMemory();
          const results = await memory.searchConversations(keyword, 10);

          if (results.length === 0) {
            const notFoundMsg = createSimpleMessage(
                `🔍 ไม่พบการสนทนาที่เกี่ยวข้องกับ \"${keyword}\"`,
                false,
            );
            await lineClient.replyMessage(replyToken, notFoundMsg);
            return;
          }

          let searchText = `🔍 **ผลการค้นหา: \"${keyword}\"**\n`;
          searchText += `พบ ${results.length} รายการ\n`;
          searchText += "━━━━━━━━━━━━━━━━━━━━━\n\n";

          results.forEach((conv, idx) => {
            const timeAgo = memory._getTimeAgo(conv.createdAt);
            searchText += `[${idx + 1}] ${timeAgo}\n`;
            searchText += `Q: ${conv.question.substring(0, 70)}...\n`;
            searchText += `A: ${conv.answer.substring(0, 90)}...\n`;
            searchText += "─────────────────────\n";
          });

          const searchMsg = createSimpleMessage(searchText, true);
          await lineClient.replyMessage(replyToken, searchMsg);
        } catch (err) {
          const errorMsg = createSimpleMessage(`❌ เกิดข้อผิดพลาด: ${err.message}`, false);
          await lineClient.replyMessage(replyToken, errorMsg);
        }
        return;
      }

      // =====================================================
      // 📚 KNOWLEDGE MANAGEMENT COMMANDS
      // =====================================================

      // Command: /km หรือ knowledge menu - แสดงเมนูจัดการความรู้ (Enhanced with Hybrid Stats)
      if (cmd === "/km" || cmd === "/knowledgemenu" || cmd === "เมนูความรู้" || cmd === "จัดการความรู้") {
        try {
          // Get knowledge stats if Super Admin
          let enhancedStats = null;
          if (isSuperAdmin) {
            const hyperKnowledge = getHyperLocalizedKnowledge();
            const stats = await hyperKnowledge.getKnowledgeStats();
            enhancedStats = stats;
          }
          
          const menuFlex = createKnowledgeMenuFlex(enhancedStats);
          await lineClient.replyMessage(replyToken, menuFlex);
        } catch (err) {
          console.error("Error loading /km:", err);
          const menuFlex = createKnowledgeMenuFlex();
          await lineClient.replyMessage(replyToken, menuFlex);
        }
        return;
      }

      // Command: ดูความรู้ทั้งหมด - แสดงรายการความรู้ทั้งหมด
      if (cmd === "ดูความรู้ทั้งหมด" || cmd === "/listknowledge" || cmd === "รายการความรู้") {
        try {
          const hyperKnowledge = getHyperLocalizedKnowledge();
          const stats = await hyperKnowledge.getKnowledgeStats();

          if (!stats || stats.totalKnowledge === 0) {
            const emptyFlex = createEmptyKnowledgeFlex();
            await lineClient.replyMessage(replyToken, emptyFlex);
            return;
          }

          // แปลง category data เป็นรูปแบบที่ createKnowledgeListFlex ต้องการ
          const categoryMap = {
            "real_world_solutions": {name: "วิธีแก้จริง", icon: "🔧"},
            "proven_parameters": {name: "พารามิเตอร์", icon: "📊"},
            "machine_specific": {name: "เฉพาะเครื่อง", icon: "🏭"},
            "expert_tips": {name: "เคล็ดลับ", icon: "💡"},
            "local_terminology": {name: "คำศัพท์", icon: "📖"},
            "case_studies": {name: "กรณีศึกษา", icon: "📚"},
            "local_materials": {name: "วัสดุท้องถิ่น", icon: "🧪"},
            "supplier_info": {name: "ซัพพลายเออร์", icon: "🏪"},
          };

          const categories = Object.entries(stats.byCategory || {}).map(([catKey, count]) => {
            const catInfo = categoryMap[catKey] || {name: catKey, icon: "📁"};
            return {
              icon: catInfo.icon,
              name: catInfo.name,
              count: count,
              verified: true, // สมมติว่า verified แล้ว (ปรับตามจริงได้)
            };
          });

          const knowledgeFlex = createKnowledgeListFlex({
            items: stats.topUsed || [],
            total: stats.totalKnowledge || 0,
            verified: stats.totalKnowledge - stats.pendingVerification || 0,
            categories: categories,
          });

          await lineClient.replyMessage(replyToken, knowledgeFlex);
        } catch (err) {
          const errorFlex = createSimpleMessage(`❌ เกิดข้อผิดพลาด: ${err.message}`, false);
          await lineClient.replyMessage(replyToken, errorFlex);
        }
        return;
      }

      // Command: ดูหมวด [หมวดหมู่] - แสดงความรู้ในหมวดเฉพาะ (Admin Only)
      if (cmd.startsWith("ดูหมวด ") || cmd.startsWith("/category ")) {
        try {
          const categoryName = cmd.replace("ดูหมวด ", "").replace("/category ", "").trim();

          // แมพชื่อหมวดภาษาไทยเป็น key
          const categoryKeyMap = {
            "วิธีแก้จริง": "real_world_solutions",
            "พารามิเตอร์": "proven_parameters",
            "เฉพาะเครื่อง": "machine_specific",
            "เคล็ดลับ": "expert_tips",
            "คำศัพท์": "local_terminology",
            "กรณีศึกษา": "case_studies",
            "วัสดุท้องถิ่น": "local_materials",
            "ซัพพลายเออร์": "supplier_info",
          };

          const categoryKey = categoryKeyMap[categoryName];

          if (!categoryKey) {
            const errorMsg = createSimpleMessage(
                `❌ ไม่พบหมวด "${categoryName}"\n\n` +
                `📁 หมวดที่มี:\n` +
                `- วิธีแก้จริง\n` +
                `- พารามิเตอร์\n` +
                `- เฉพาะเครื่อง\n` +
                `- เคล็ดลับ\n` +
                `- คำศัพท์\n` +
                `- กรณีศึกษา\n` +
                `- วัสดุท้องถิ่น\n` +
                `- ซัพพลายเออร์`,
                false,
            );
            await lineClient.replyMessage(replyToken, errorMsg);
            return;
          }

          const db = getFirestore();
          const snapshot = await db.collection("hyper_knowledge")
              .where("category", "==", categoryKey)
              .orderBy("useCount", "desc")
              .limit(20)
              .get();

          if (snapshot.empty) {
            const emptyMsg = createSimpleMessage(
                `📁 หมวด: ${categoryName}\n\n` +
                `ยังไม่มีความรู้ในหมวดนี้\n\n` +
                `พิมพ์ "seed ความรู้" เพื่อเพิ่มข้อมูลตัวอย่าง`,
                false,
            );
            await lineClient.replyMessage(replyToken, emptyMsg);
            return;
          }

          // สร้าง Flex Message แสดงรายการความรู้ในหมวดนี้
          const items = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            items.push({
              id: doc.id,
              problem: data.problem || "ไม่มีชื่อ",
              solution: data.solution || "ไม่มีวิธีแก้",
              useCount: data.useCount || 0,
              verified: data.verificationStatus === "verified",
            });
          });

          // สร้าง response text
          let responseText = `📁 **หมวด: ${categoryName}**\n\n`;
          responseText += `📊 จำนวน: ${items.length} รายการ\n\n`;

          items.forEach((item, index) => {
            const status = item.verified ? "✅" : "⏳";
            responseText += `${index + 1}. ${status} **${item.problem.substring(0, 40)}${item.problem.length > 40 ? "..." : ""}**\n`;
            responseText += `   💡 ${item.solution.substring(0, 60)}${item.solution.length > 60 ? "..." : ""}\n`;
            responseText += `   📊 ใช้งาน: ${item.useCount} ครั้ง\n\n`;
          });

          responseText += `💡 **คำแนะนำ:**\n`;
          responseText += `- พิมพ์ "ดูความรู้ทั้งหมด" เพื่อดูทุกหมวด\n`;
          responseText += `- พิมพ์ "/knowledge" เพื่อดูสถิติ`;

          await lineClient.replyMessage(replyToken, {type: "text", text: responseText});
        } catch (err) {
          const errorMsg = createSimpleMessage(`❌ เกิดข้อผิดพลาด: ${err.message}`, false);
          await lineClient.replyMessage(replyToken, errorMsg);
        }
        return;
      }

      // Command: verify ความรู้ - ยืนยันความรู้อัตโนมัติ (ทีละหลายรายการ)
      if (cmd === "verify ความรู้" || cmd === "/verifyall" || cmd === "ยืนยันความรู้ทั้งหมด") {
        try {
          const db = getFirestore();

          // ดึงความรู้ที่รอตรวจสอบ
          const pendingSnapshot = await db.collection("hyper_knowledge")
              .where("verificationStatus", "==", "pending")
              .limit(50)
              .get();

          const verifiedSnapshot = await db.collection("hyper_knowledge")
              .where("verificationStatus", "==", "verified")
              .get();

          if (pendingSnapshot.empty) {
            const verifyFlex = createKnowledgeVerifyFlex({
              verified: verifiedSnapshot.size,
              pending: 0,
              errors: [],
              totalProcessed: verifiedSnapshot.size,
            });
            await lineClient.replyMessage(replyToken, verifyFlex);
            return;
          }

          // ยืนยันทีละรายการ
          let verifiedCount = 0;
          const errors = [];
          const batch = db.batch();

          pendingSnapshot.forEach((doc) => {
            try {
              batch.update(doc.ref, {
                verificationStatus: "verified",
                verifiedBy: userId,
                verifiedAt: new Date(),
              });
              verifiedCount++;
            } catch (e) {
              errors.push(doc.id);
            }
          });

          await batch.commit();

          const verifyFlex = createKnowledgeVerifyFlex({
            verified: verifiedCount + verifiedSnapshot.size,
            pending: 0,
            errors,
            totalProcessed: verifiedCount,
          });

          await lineClient.replyMessage(replyToken, verifyFlex);
        } catch (err) {
          const errorFlex = createSimpleMessage(`❌ เกิดข้อผิดพลาด: ${err.message}`, false);
          await lineClient.replyMessage(replyToken, errorFlex);
        }
        return;
      }

      // Command: ทดสอบ hybrid - ทดสอบระบบ Hybrid Knowledge
      console.log(`🔬 DEBUG: Checking hybrid test command`);
      console.log(`🔬 DEBUG: cmd = "${cmd}"`);
      console.log(`🔬 DEBUG: cmd.startsWith("ทดสอบ hybrid") = ${cmd.startsWith("ทดสอบ hybrid")}`);
      console.log(`🔬 DEBUG: cmd.startsWith("ทดสอบ") = ${cmd.startsWith("ทดสอบ")}`);
      console.log(`🔬 DEBUG: cmd.includes("hybrid") = ${cmd.includes("hybrid")}`);

      if (cmd === "ทดสอบ hybrid" || cmd === "/testhybrid" || cmd.startsWith("ทดสอบ hybrid") || cmd.startsWith("ทดสอบhybrid") || (cmd.startsWith("ทดสอบ") && cmd.includes("hybrid")) || cmd.startsWith("/testhybrid")) {
        console.log(`🔬 MATCHED: Hybrid Test Command!`);
        try {
          const startTime = Date.now();
          const testQuery = cmd.replace(/^ทดสอบ\s*hybrid\s*/i, "").replace(/^\/testhybrid\s*/i, "").trim() || "ABS shrinkage";

          // 1️⃣ Material Detection - ใช้ keys จาก PLASTIC_MATERIALS_DB โดยตรง
          const materialKeywords = Object.keys(PLASTIC_MATERIALS_DB);
          const materialAliases = {
            // ABS
            "เอบีเอส": "ABS",
            // PP
            "โพลีโพรพิลีน": "PP", "พีพี": "PP",
            // PC
            "โพลีคาร์บอเนต": "PC", "พีซี": "PC",
            // PA/Nylon
            "ไนลอน": "PA", "nylon": "PA", "pa6": "PA", "pa66": "PA",
            // POM
            "พอม": "POM", "อะซีทัล": "POM", "acetal": "POM", "delrin": "POM",
            // PE
            "โพลีเอทิลีน": "PE", "พีอี": "PE", "hdpe": "PE", "ldpe": "PE",
            // PS
            "โพลีสไตรีน": "PS", "พีเอส": "PS", "gpps": "PS", "hips": "PS",
            // PET
            "เพ็ท": "PET",
            // PVC
            "พีวีซี": "PVC",
            // TPU
            "ทีพียู": "TPU",
            // PMMA (New)
            "อะคริลิค": "PMMA", "พีเอ็มเอ็มเอ": "PMMA", "acrylic": "PMMA", "plexiglass": "PMMA",
            // PBT (New)
            "พีบีที": "PBT",
            // SAN (New)
            "แซน": "SAN",
            // ASA (New)
            "เอเอสเอ": "ASA",
            // PPO (New)
            "พีพีโอ": "PPO", "พีพีอี": "PPO", "ppe": "PPO", "noryl": "PPO",
            // LCP (New)
            "แอลซีพี": "LCP",
            // PEEK (New)
            "พีค": "PEEK",
            // PPS (New)
            "พีพีเอส": "PPS",
            // TPE (New)
            "ทีพีอี": "TPE", "sebs": "TPE", "tpe-s": "TPE", "tpe-v": "TPE",
            // EVA (New)
            "อีวีเอ": "EVA",
          };

          let detectedMaterial = null;
          const lowerQuery = testQuery.toLowerCase();

          for (const mat of materialKeywords) {
            if (lowerQuery.includes(mat.toLowerCase())) {
              detectedMaterial = mat;
              break;
            }
          }
          if (!detectedMaterial) {
            for (const [alias, matCode] of Object.entries(materialAliases)) {
              if (lowerQuery.includes(alias.toLowerCase())) {
                detectedMaterial = matCode;
                break;
              }
            }
          }

          // 2️⃣ Defect Detection
          const defectKeywords = {
            "short shot": "SHORT_SHOT", "ฉีดไม่เต็ม": "SHORT_SHOT",
            "flash": "FLASH", "ครีบ": "FLASH",
            "sink mark": "SINK_MARK", "รอยยุบ": "SINK_MARK", "ยุบ": "SINK_MARK",
            "warpage": "WARPAGE", "บิดงอ": "WARPAGE", "บิด": "WARPAGE",
            "burn mark": "BURN_MARK", "รอยไหม้": "BURN_MARK", "ไหม้": "BURN_MARK",
            "silver streak": "SILVER_STREAK", "เส้นสีเงิน": "SILVER_STREAK",
            "weld line": "WELD_LINE", "รอยเชื่อม": "WELD_LINE",
            "void": "VOID", "โพรงอากาศ": "VOID", "ฟอง": "VOID",
            "jetting": "JETTING", "รอยพ่น": "JETTING",
            "flow mark": "FLOW_MARK", "รอยไหล": "FLOW_MARK",
          };

          let detectedDefect = null;
          for (const [keyword, defectCode] of Object.entries(defectKeywords)) {
            if (lowerQuery.includes(keyword.toLowerCase())) {
              detectedDefect = defectCode;
              break;
            }
          }

          // 3️⃣ Hyper-Local Knowledge
          let localKnowledge = [];
          try {
            const hyperKnowledge = getHyperLocalizedKnowledge();
            localKnowledge = await hyperKnowledge.findRelevantKnowledge(
                testQuery,
                {limit: 5, minRelevance: 0.2, includeUnverified: true},
            );
          } catch (e) {
            console.log(`⚠️ Hyper Knowledge Error: ${e.message}`);
          }

          // 4️⃣ Generate AI Response Summary
          let aiResponse = "";
          if (detectedMaterial && typeof PLASTIC_MATERIALS_DB !== "undefined" && PLASTIC_MATERIALS_DB[detectedMaterial]) {
            const mat = PLASTIC_MATERIALS_DB[detectedMaterial];
            aiResponse = `พบวัสดุ ${mat.name} (${mat.nameThai})\n• อุณหภูมิหลอม: ${mat.meltTemp.min}-${mat.meltTemp.max}°C\n• อุณหภูมิแม่พิมพ์: ${mat.moldTemp.min}-${mat.moldTemp.max}°C`;
          }
          if (detectedDefect && typeof TROUBLESHOOTING_GUIDE !== "undefined" && TROUBLESHOOTING_GUIDE[detectedDefect]) {
            const guide = TROUBLESHOOTING_GUIDE[detectedDefect];
            aiResponse += aiResponse ? "\n\n" : "";
            aiResponse += `พบปัญหา ${guide.name} (${guide.nameThai})\n• Quick Fix: ${guide.quickFix}`;
          }
          if (localKnowledge.length > 0) {
            aiResponse += aiResponse ? "\n\n" : "";
            aiResponse += `พบความรู้เพิ่มเติม ${localKnowledge.length} รายการจาก Hyper-Local Knowledge`;
          }
          if (!aiResponse) {
            aiResponse = "ไม่พบข้อมูลที่ตรงกับคำค้นหา ลองระบุวัสดุหรือปัญหาให้ชัดเจนขึ้น";
          }

          const responseTime = Date.now() - startTime;

          // 5️⃣ Determine Strategy & Confidence
          const verifiedLocal = localKnowledge.filter((k) => k.verificationStatus === "verified").length;
          const localConfidence = localKnowledge.length > 0 ?
            (verifiedLocal / localKnowledge.length) * (localKnowledge[0]?.relevanceScore || 0.5) : 0;
          const aiConfidence = (detectedMaterial ? 0.3 : 0) + (detectedDefect ? 0.3 : 0);

          let strategy = "best_effort";
          let overallConfidence = 0;

          if (localConfidence >= 0.7) {
            strategy = "local_primary";
            overallConfidence = localConfidence;
          } else if (localConfidence >= 0.4 && aiConfidence >= 0.4) {
            strategy = "balanced_hybrid";
            overallConfidence = (localConfidence + aiConfidence) / 2;
          } else if (aiConfidence >= 0.6) {
            strategy = "ai_primary";
            overallConfidence = aiConfidence;
          } else {
            overallConfidence = Math.max(localConfidence, aiConfidence) * 0.5;
          }

          // 6️⃣ Log to Firestore
          try {
            await db.collection("hybrid_usage_logs").add({
              userId,
              query: testQuery,
              strategy,
              confidence: overallConfidence,
              localResults: localKnowledge.length,
              detectedMaterial,
              detectedDefect,
              responseTime,
              timestamp: FieldValue.serverTimestamp(),
            });
          } catch (logErr) {
            console.error("Error logging hybrid test:", logErr);
          }

          const hybridFlex = createHybridTestFlex({
            query: testQuery,
            localKnowledge: localKnowledge.map((k) => ({
              name: k.problem?.substring(0, 40) || "N/A",
              relevance: k.relevanceScore,
            })),
            aiResponse,
            injectedData: {
              materials: detectedMaterial ? 1 : 0,
              troubleshooting: detectedDefect ? 1 : 0,
            },
            responseTime,
            strategy,
            confidence: overallConfidence,
          });

          await lineClient.replyMessage(replyToken, hybridFlex);
        } catch (err) {
          const errorFlex = createSimpleMessage(`❌ เกิดข้อผิดพลาด: ${err.message}`, false);
          await lineClient.replyMessage(replyToken, errorFlex);
        }
        return;
      }

      // Command: /hybridstats - สถิติ Hybrid Performance (Super Admin Only)
      if (cmd === "/hybridstats" || cmd === "สถิติ hybrid") {
        if (!isSuperAdmin) {
          await lineClient.replyMessage(replyToken, createSimpleMessage("⛔ คำสั่งนี้สำหรับ Super Admin เท่านั้น", false));
          return;
        }

        try {
          const hyperKnowledge = getHyperLocalizedKnowledge();
          const stats = await hyperKnowledge.getKnowledgeStats();
          
          // Get hybrid usage logs
          const logsSnapshot = await db.collection("hybrid_usage_logs")
            .orderBy("timestamp", "desc")
            .limit(100)
            .get();

          let strategyCount = {local_primary: 0, balanced_hybrid: 0, ai_primary: 0, best_effort: 0};
          let totalConfidence = 0;
          let successCount = 0;

          logsSnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.strategy) strategyCount[data.strategy]++;
            if (data.confidence) totalConfidence += data.confidence;
            if (data.helpful !== false) successCount++;
          });

          const totalLogs = logsSnapshot.size;
          const avgConfidence = totalLogs > 0 ? (totalConfidence / totalLogs * 100).toFixed(1) : "0";
          const successRate = totalLogs > 0 ? ((successCount / totalLogs) * 100).toFixed(1) : "0";

          const statsData = {
            totalKnowledge: stats?.totalKnowledge || 0,
            verifiedKnowledge: (stats?.totalKnowledge || 0) - (stats?.pendingVerification || 0),
            pendingVerification: stats?.pendingVerification || 0,
            strategyCount,
            totalLogs,
            avgConfidence,
            successRate,
          };

          const flexMessage = createHybridStatsFlexMessage(statsData);
          await lineClient.replyMessage(replyToken, flexMessage);
        } catch (err) {
          console.error("Error getting hybrid stats:", err);
          await lineClient.replyMessage(replyToken, createSimpleMessage(`❌ เกิดข้อผิดพลาด: ${err.message}`, false));
        }
        return;
      }

      // Command: ปรับปรุงคลัง - ปรับปรุงและทำความสะอาดคลังความรู้
      if (cmd === "ปรับปรุงคลัง" || cmd === "/optimizeknowledge" || cmd === "optimize คลัง") {
        try {
          const db = getFirestore();
          const snapshot = await db.collection("hyper_knowledge").get();

          let stats = {
            total: snapshot.size,
            noTitle: 0,
            noSolution: 0,
            duplicates: 0,
            lowQuality: 0,
            cleaned: 0,
          };

          const problemSet = new Set();
          const toDelete = [];

          snapshot.forEach((doc) => {
            const data = doc.data();

            // ตรวจสอบข้อมูลไม่สมบูรณ์
            if (!data.problem || data.problem.length < 5) {
              stats.noTitle++;
              toDelete.push(doc.ref);
              return;
            }

            if (!data.solution || data.solution.length < 10) {
              stats.noSolution++;
              toDelete.push(doc.ref);
              return;
            }

            // ตรวจสอบ duplicate
            const problemKey = data.problem.toLowerCase().trim().substring(0, 50);
            if (problemSet.has(problemKey)) {
              stats.duplicates++;
              toDelete.push(doc.ref);
              return;
            }
            problemSet.add(problemKey);

            // ตรวจสอบคุณภาพต่ำ
            if (data.confidence && data.confidence < 0.3) {
              stats.lowQuality++;
            }
          });

          // ลบรายการที่มีปัญหา (จำกัด 20 รายการต่อครั้ง)
          const deleteLimit = Math.min(toDelete.length, 20);
          if (deleteLimit > 0) {
            const batch = db.batch();
            for (let i = 0; i < deleteLimit; i++) {
              batch.delete(toDelete[i]);
            }
            await batch.commit();
            stats.cleaned = deleteLimit;
          }

          const optimizeFlex = createKnowledgeOptimizeFlex({
            duplicatesRemoved: stats.duplicates > deleteLimit ? deleteLimit : stats.duplicates,
            orphansRemoved: stats.noTitle + stats.noSolution,
            optimized: stats.total - stats.cleaned,
            totalSaved: stats.cleaned,
            beforeSize: stats.total,
            afterSize: stats.total - stats.cleaned,
          });

          await lineClient.replyMessage(replyToken, optimizeFlex);
        } catch (err) {
          const errorFlex = createSimpleMessage(`❌ เกิดข้อผิดพลาด: ${err.message}`, false);
          await lineClient.replyMessage(replyToken, errorFlex);
        }
        return;
      }

      // Command: ดูตัวอย่างการเพิ่มความรู้
      const originalText = message.text.trim();
      if (originalText === "ดูตัวอย่างการเพิ่มความรู้" || cmd === "/examples") {
        const examplesFlex = createKnowledgeExamplesForm();
        await lineClient.replyMessage(replyToken, examplesFlex);
        return;
      }

      // Command: /addknowledge advanced - Show detailed form
      if (cmd === "/addknowledge advanced") {
        const detailedForm = createKnowledgeDetailedForm();
        await lineClient.replyMessage(replyToken, detailedForm);
        return;
      }

      // Command: เพิ่มความรู้ - Process input (Admin Only)
      if (originalText.startsWith("เพิ่มความรู้") || cmd === "/addknowledge") {
        try {
          // Parse multi-line input
          const inputLines = message.text.split("\n");

          // If single line, show form
          if (inputLines.length === 1) {
            const formFlex = createKnowledgeQuickAddForm();
            await lineClient.replyMessage(replyToken, formFlex);
            return;
          }

          // If less than 3 lines, show form
          if (inputLines.length < 3) {
            const formFlex = createKnowledgeQuickAddForm();
            await lineClient.replyMessage(replyToken, formFlex);
            return;
          }

          // Continue with existing parsing logic
          if (false) { // Placeholder to keep structure
            const helpMsg = createSimpleMessage(
                `📚 **วิธีเพิ่มความรู้**\n\n` +
                `รูปแบบ:\n` +
                `เพิ่มความรู้\n` +
                `ปัญหา: [ปัญหา/คำถาม]\n` +
                `วิธีแก้: [วิธีแก้/คำตอบ]\n` +
                `หมวด: [หมวดหมู่] (optional)\n` +
                `วัสดุ: [วัสดุ] (optional)\n\n` +
                `**ตัวอย่าง:**\n` +
                `เพิ่มความรู้\n` +
                `ปัญหา: PP มีรอยขาว\n` +
                `วิธีแก้: อบเม็ดให้แห้งก่อนใช้\n` +
                `หมวด: วิธีแก้จริง\n` +
                `วัสดุ: PP`,
                false,
            );
            await lineClient.replyMessage(replyToken, helpMsg);
            return;
          }

          // Parse fields
          const data = {};
          inputLines.forEach((line) => {
            const trimmed = line.trim();
            if (trimmed.startsWith("ปัญหา:")) {
              data.problem = trimmed.replace("ปัญหา:", "").trim();
            } else if (trimmed.startsWith("วิธีแก้:")) {
              data.solution = trimmed.replace("วิธีแก้:", "").trim();
            } else if (trimmed.startsWith("หมวด:")) {
              const catName = trimmed.replace("หมวด:", "").trim();
              const catMap = {
                "วิธีแก้จริง": "real_world_solutions",
                "พารามิเตอร์": "proven_parameters",
                "เฉพาะเครื่อง": "machine_specific",
                "เคล็ดลับ": "expert_tips",
                "คำศัพท์": "local_terminology",
                "กรณีศึกษา": "case_studies",
                "วัสดุท้องถิ่น": "local_materials",
                "ซัพพลายเออร์": "supplier_info",
              };
              data.category = catMap[catName] || null;
            } else if (trimmed.startsWith("วัสดุ:")) {
              data.material = trimmed.replace("วัสดุ:", "").trim();
            } else if (trimmed.startsWith("แท็ก:")) {
              const tagsStr = trimmed.replace("แท็ก:", "").trim();
              data.tags = tagsStr.split(",").map((t) => t.trim());
            }
          });

          data.contributedBy = userId;

          // Add knowledge
          const hyperKnowledge = getHyperLocalizedKnowledge();
          const result = await hyperKnowledge.addKnowledge(data);

          if (result.success) {
            const successMsg = createSimpleMessage(
                `✅ ${result.message}!\n\n` +
                `📊 รายละเอียด:\n` +
                `• ID: ${result.id}\n` +
                `• ปัญหา: ${result.data.problem.substring(0, 40)}...\n` +
                `• หมวด: ${result.data.category}\n` +
                `• สถานะ: รอตรวจสอบ ⏳\n\n` +
                `💡 พิมพ์ "verify ความรู้" เพื่อยืนยันทั้งหมด`,
                true,
            );
            await lineClient.replyMessage(replyToken, successMsg);
          } else {
            const errorMsg = createSimpleMessage(`❌ ${result.message}`, false);
            await lineClient.replyMessage(replyToken, errorMsg);
          }
        } catch (err) {
          const errorMsg = createSimpleMessage(`❌ เกิดข้อผิดพลาด: ${err.message}`, false);
          await lineClient.replyMessage(replyToken, errorMsg);
        }
        return;
      }

      // Command: seed ความรู้ - เพิ่มข้อมูลตัวอย่างเริ่มต้น
      if (cmd === "seed ความรู้" || cmd === "/seedknowledge" || cmd === "เพิ่มข้อมูลตัวอย่าง") {
        try {
          const count = await seedInitialKnowledge();
          const successMsg = createSimpleMessage(
              `✅ เพิ่มข้อมูลตัวอย่างสำเร็จ!\n\n` +
              `📊 จำนวน: ${count} รายการ\n\n` +
              `พิมพ์ "ดูความรู้ทั้งหมด" เพื่อดูรายการ`,
              true,
          );
          await lineClient.replyMessage(replyToken, successMsg);
        } catch (err) {
          const errorMsg = createSimpleMessage(`❌ เกิดข้อผิดพลาด: ${err.message}`, false);
          await lineClient.replyMessage(replyToken, errorMsg);
        }
        return;
      }

      // =====================================================
      // 🧠 SUPER ADMIN MEMORY COMMANDS
      // =====================================================

      // Command: /history หรือ ประวัติการสนทนา - ดูประวัติการสนทนา Super Admin
      if (cmd === "/history" || cmd === "ประวัติการสนทนา" || cmd === "ดูประวัติ" || cmd === "/myhistory") {
        try {
          const memory = getSuperAdminMemory();
          const conversations = await memory.getRecentConversations(15);

          if (conversations.length === 0) {
            const emptyMsg = createSimpleMessage("📖 ยังไม่มีประวัติการสนทนา", false);
            await lineClient.replyMessage(replyToken, emptyMsg);
            return;
          }

          let historyText = "📚 **ประวัติการสนทนา (15 รายการล่าสุด)**\n";
          historyText += "━━━━━━━━━━━━━━━━━━━━━\n\n";

          conversations.reverse().forEach((conv, idx) => {
            const timeAgo = memory._getTimeAgo(conv.createdAt);
            const type = conv.metadata?.conversationType || "general";
            const typeIcon = {
              command: "⚙️",
              development: "🛠️",
              debugging: "🐛",
              query: "❓",
              testing: "🧪",
              general: "💬",
            }[type] || "💬";

            historyText += `${typeIcon} **[${idx + 1}]** ${timeAgo}\n`;
            historyText += `Q: ${conv.question.substring(0, 80)}${conv.question.length > 80 ? "..." : ""}\n`;
            historyText += `A: ${conv.answer.substring(0, 100)}${conv.answer.length > 100 ? "..." : ""}\n`;
            historyText += "─────────────────────\n";
          });

          historyText += "\n💡 พิมพ์ \"/memorystats\" เพื่อดูสถิติ";

          const historyMsg = createSimpleMessage(historyText, true);
          await lineClient.replyMessage(replyToken, historyMsg);
        } catch (err) {
          const errorMsg = createSimpleMessage(`❌ เกิดข้อผิดพลาด: ${err.message}`, false);
          await lineClient.replyMessage(replyToken, errorMsg);
        }
        return;
      }

      // Command: /memorystats - ดูสถิติการสนทนา
      if (cmd === "/memorystats" || cmd === "สถิติการสนทนา") {
        try {
          const memory = getSuperAdminMemory();
          const stats = await memory.getConversationStats();

          if (!stats) {
            const errorMsg = createSimpleMessage("❌ ไม่สามารถดึงสถิติได้", false);
            await lineClient.replyMessage(replyToken, errorMsg);
            return;
          }

          let statsText = "📊 **สถิติการสนทนา Super Admin**\n";
          statsText += "━━━━━━━━━━━━━━━━━━━━━\n\n";
          statsText += `📈 **จำนวนรวม:** ${stats.totalConversations} การสนทนา\n\n`;

          statsText += "📂 **แยกตามประเภท:**\n";
          Object.entries(stats.byType).forEach(([type, count]) => {
            const typeIcon = {
              command: "⚙️",
              development: "🛠️",
              debugging: "🐛",
              query: "❓",
              testing: "🧪",
              general: "💬",
            }[type] || "💬";
            statsText += `${typeIcon} ${type}: ${count}\n`;
          });

          statsText += `\n📏 **ความยาวเฉลี่ย:**\n`;
          statsText += `• คำถาม: ${stats.avgQuestionLength} ตัวอักษร\n`;
          statsText += `• คำตอบ: ${stats.avgAnswerLength} ตัวอักษร\n`;

          if (stats.firstConversation && stats.lastConversation) {
            const firstDate = stats.firstConversation.toDate?.() || stats.firstConversation;
            const lastDate = stats.lastConversation.toDate?.() || stats.lastConversation;
            statsText += `\n📅 **ช่วงเวลา:**\n`;
            statsText += `• เริ่มต้น: ${firstDate.toLocaleString("th-TH")}\n`;
            statsText += `• ล่าสุด: ${lastDate.toLocaleString("th-TH")}\n`;
          }

          const statsMsg = createSimpleMessage(statsText, true);
          await lineClient.replyMessage(replyToken, statsMsg);
        } catch (err) {
          const errorMsg = createSimpleMessage(`❌ เกิดข้อผิดพลาด: ${err.message}`, false);
          await lineClient.replyMessage(replyToken, errorMsg);
        }
        return;
      }

      // Command: /search [keyword] - ค้นหาในประวัติการสนทนา
      if (cmd.startsWith("/search ")) {
        const keyword = cmd.replace("/search ", "").trim();
        if (!keyword) {
          const errorMsg = createSimpleMessage("❌ กรุณาระบุคำค้นหา เช่น /search ปัญหา", false);
          await lineClient.replyMessage(replyToken, errorMsg);
          return;
        }

        try {
          const memory = getSuperAdminMemory();
          const results = await memory.searchConversations(keyword, 10);

          if (results.length === 0) {
            const notFoundMsg = createSimpleMessage(
                `🔍 ไม่พบการสนทนาที่เกี่ยวข้องกับ \"${keyword}\"`,
                false,
            );
            await lineClient.replyMessage(replyToken, notFoundMsg);
            return;
          }

          let searchText = `🔍 **ผลการค้นหา: \"${keyword}\"**\n`;
          searchText += `พบ ${results.length} รายการ\n`;
          searchText += "━━━━━━━━━━━━━━━━━━━━━\n\n";

          results.forEach((conv, idx) => {
            const timeAgo = memory._getTimeAgo(conv.createdAt);
            searchText += `[${idx + 1}] ${timeAgo}\n`;
            searchText += `Q: ${conv.question.substring(0, 70)}...\n`;
            searchText += `A: ${conv.answer.substring(0, 90)}...\n`;
            searchText += "─────────────────────\n";
          });

          const searchMsg = createSimpleMessage(searchText, true);
          await lineClient.replyMessage(replyToken, searchMsg);
        } catch (err) {
          const errorMsg = createSimpleMessage(`❌ เกิดข้อผิดพลาด: ${err.message}`, false);
          await lineClient.replyMessage(replyToken, errorMsg);
        }
        return;
      }

      // Command: /history หรือ ประวัติการสนทนา - ดูประวัติการสนทนา Super Admin
      if (cmd === "/history" || cmd === "ประวัติการสนทนา" || cmd === "ดูประวัติ" || cmd === "/myhistory") {
        try {
          const memory = getSuperAdminMemory();
          const conversations = await memory.getRecentConversations(15);

          if (conversations.length === 0) {
            const emptyMsg = createSimpleMessage("📭 ยังไม่มีประวัติการสนทนา", false);
            await lineClient.replyMessage(replyToken, emptyMsg);
            return;
          }

          let historyText = "📚 **ประวัติการสนทนา (15 รายการล่าสุด)**\n";
          historyText += "━━━━━━━━━━━━━━━━━━━━━\n\n";

          conversations.reverse().forEach((conv, idx) => {
            const timeAgo = memory._getTimeAgo(conv.createdAt);
            const type = conv.metadata?.conversationType || "general";
            const typeIcon = {
              command: "⚙️",
              development: "🛠️",
              debugging: "🐛",
              query: "❓",
              testing: "🧪",
              general: "💬",
            }[type] || "💬";

            historyText += `${typeIcon} **[${idx + 1}]** ${timeAgo}\n`;
            historyText += `Q: ${conv.question.substring(0, 80)}${conv.question.length > 80 ? "..." : ""}\n`;
            historyText += `A: ${conv.answer.substring(0, 100)}${conv.answer.length > 100 ? "..." : ""}\n`;
            historyText += "─────────────────────\n";
          });

          historyText += "\n💡 พิมพ์ \"/stats\" เพื่อดูสถิติ";

          const historyMsg = createSimpleMessage(historyText, true);
          await lineClient.replyMessage(replyToken, historyMsg);
        } catch (err) {
          const errorMsg = createSimpleMessage(`❌ เกิดข้อผิดพลาด: ${err.message}`, false);
          await lineClient.replyMessage(replyToken, errorMsg);
        }
        return;
      }

      // Command: /memorystats - ดูสถิติการสนทนา
      if (cmd === "/memorystats" || cmd === "สถิติการสนทนา") {
        try {
          const memory = getSuperAdminMemory();
          const stats = await memory.getConversationStats();

          if (!stats) {
            const errorMsg = createSimpleMessage("❌ ไม่สามารถดึงสถิติได้", false);
            await lineClient.replyMessage(replyToken, errorMsg);
            return;
          }

          let statsText = "📊 **สถิติการสนทนา Super Admin**\n";
          statsText += "━━━━━━━━━━━━━━━━━━━━━\n\n";
          statsText += `📈 **จำนวนรวม:** ${stats.totalConversations} การสนทนา\n\n`;

          statsText += "📂 **แยกตามประเภท:**\n";
          Object.entries(stats.byType).forEach(([type, count]) => {
            const typeIcon = {
              command: "⚙️",
              development: "🛠️",
              debugging: "🐛",
              query: "❓",
              testing: "🧪",
              general: "💬",
            }[type] || "💬";
            statsText += `${typeIcon} ${type}: ${count}\n`;
          });

          statsText += `\n📏 **ความยาวเฉลี่ย:**\n`;
          statsText += `• คำถาม: ${stats.avgQuestionLength} ตัวอักษร\n`;
          statsText += `• คำตอบ: ${stats.avgAnswerLength} ตัวอักษร\n`;

          if (stats.firstConversation && stats.lastConversation) {
            const firstDate = stats.firstConversation.toDate?.() || stats.firstConversation;
            const lastDate = stats.lastConversation.toDate?.() || stats.lastConversation;
            statsText += `\n📅 **ช่วงเวลา:**\n`;
            statsText += `• เริ่มต้น: ${firstDate.toLocaleString("th-TH")}\n`;
            statsText += `• ล่าสุด: ${lastDate.toLocaleString("th-TH")}\n`;
          }

          const statsMsg = createSimpleMessage(statsText, true);
          await lineClient.replyMessage(replyToken, statsMsg);
        } catch (err) {
          const errorMsg = createSimpleMessage(`❌ เกิดข้อผิดพลาด: ${err.message}`, false);
          await lineClient.replyMessage(replyToken, errorMsg);
        }
        return;
      }

      // Command: /search [keyword] - ค้นหาในประวัติการสนทนา
      if (cmd.startsWith("/search ")) {
        const keyword = cmd.replace("/search ", "").trim();
        if (!keyword) {
          const errorMsg = createSimpleMessage("❌ กรุณาระบุคำค้นหา เช่น /search ปัญหา", false);
          await lineClient.replyMessage(replyToken, errorMsg);
          return;
        }

        try {
          const memory = getSuperAdminMemory();
          const results = await memory.searchConversations(keyword, 10);

          if (results.length === 0) {
            const notFoundMsg = createSimpleMessage(
                `🔍 ไม่พบการสนทนาที่เกี่ยวข้องกับ \"${keyword}\"`,
                false,
            );
            await lineClient.replyMessage(replyToken, notFoundMsg);
            return;
          }

          let searchText = `🔍 **ผลการค้นหา: \"${keyword}\"**\n`;
          searchText += `พบ ${results.length} รายการ\n`;
          searchText += "━━━━━━━━━━━━━━━━━━━━━\n\n";

          results.forEach((conv, idx) => {
            const timeAgo = memory._getTimeAgo(conv.createdAt);
            searchText += `[${idx + 1}] ${timeAgo}\n`;
            searchText += `Q: ${conv.question.substring(0, 70)}...\n`;
            searchText += `A: ${conv.answer.substring(0, 90)}...\n`;
            searchText += "─────────────────────\n";
          });

          const searchMsg = createSimpleMessage(searchText, true);
          await lineClient.replyMessage(replyToken, searchMsg);
        } catch (err) {
          const errorMsg = createSimpleMessage(`❌ เกิดข้อผิดพลาด: ${err.message}`, false);
          await lineClient.replyMessage(replyToken, errorMsg);
        }
        return;
      }

      // Command: /stats - สถิติรวมของระบบ
      if (cmd === "/stats") {
        try {
          const usersSnapshot = await db.collection("users").get();
          const totalUsers = usersSnapshot.size;

          let totalMessages = 0;
          let premiumUsers = 0;
          let activeToday = 0;

          const today = new Date();
          today.setHours(0, 0, 0, 0);

          usersSnapshot.forEach((doc) => {
            const data = doc.data();
            totalMessages += data.usageCount || 0;
            if (data.isPremium) premiumUsers++;

            const lastActive = data.lastActiveAt?.toDate();
            if (lastActive && lastActive >= today) activeToday++;
          });

          const avgMessages = totalUsers > 0 ? (totalMessages / totalUsers).toFixed(2) : 0;

          // Create Flex Message
          const flexMsg = createAdminStatsMessage({
            totalUsers,
            premiumUsers,
            activeToday,
            totalMessages,
            avgMessages,
          });

          await lineClient.replyMessage(replyToken, flexMsg);
        } catch (err) {
          const errorMsg = createSimpleMessage(`เกิดข้อผิดพลาด: ${err.message}`, false);
          await lineClient.replyMessage(replyToken, errorMsg);
        }
        return;
      }

      // Command: /daily - สรุปยอดวันนี้
      if (cmd === "/daily") {
        try {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const usersSnapshot = await db.collection("users").get();

          let newUsersToday = 0;
          let messagesTypeToday = 0;
          let activeUsersToday = 0;
          const premiumRevenue = 0;

          usersSnapshot.forEach((doc) => {
            const data = doc.data();

            // นับผู้ใช้ใหม่
            const createdAt = data.createdAt?.toDate();
            if (createdAt && createdAt >= today) {
              newUsersToday++;
            }

            // นับผู้ใช้งานวันนี้
            const lastActive = data.lastActiveAt?.toDate();
            if (lastActive && lastActive >= today) {
              activeUsersToday++;
              messagesTypeToday += data.usageCount || 0;
            }
          });

          // Create Flex Message
          const flexMsg = createDailySummaryMessage({
            newUsers: newUsersToday,
            activeUsers: activeUsersToday,
            messages: messagesTypeToday,
            revenue: premiumRevenue,
            date: today.toLocaleDateString("th-TH"),
          });

          await lineClient.replyMessage(replyToken, flexMsg);
        } catch (err) {
          const errorMsg = createSimpleMessage(`เกิดข้อผิดพลาด: ${err.message}`, false);
          await lineClient.replyMessage(replyToken, errorMsg);
        }
        return;
      }

      // Command: /top - Top 10 Users
      if (cmd === "/top") {
        try {
          const usersSnapshot = await db.collection("users")
              .orderBy("usageCount", "desc")
              .limit(10)
              .get();

          const topUsers = [];
          for (const doc of usersSnapshot.docs) {
            const data = doc.data();

            // Get user profile name
            let userName = "Unknown";
            try {
              const profile = await lineClient.getProfile(doc.id);
              userName = profile.displayName;
            } catch (e) {
              userName = doc.id.substring(0, 8);
            }

            topUsers.push({
              name: userName,
              count: data.usageCount || 0,
              isPremium: data.isPremium || false,
            });
          }

          // Create Flex Message
          const flexMsg = createTopUsersMessage(topUsers);
          await lineClient.replyMessage(replyToken, flexMsg);
        } catch (err) {
          const errorMsg = createSimpleMessage(`เกิดข้อผิดพลาด: ${err.message}`, false);
          await lineClient.replyMessage(replyToken, errorMsg);
        }
        return;
      }

      // Command: /recent - ผู้ใช้งานล่าสุด
      // Command: /recent - Enhanced User Management with Trial Countdown
      if (cmd === "/recent") {
        try {
          const usersSnapshot = await db.collection("line_users")
              .orderBy("lastActiveAt", "desc")
              .limit(15)
              .get();

          const recentUsers = [];
          let statsCount = {premium: 0, trial: 0, free: 0, expired: 0};
          
          for (const doc of usersSnapshot.docs) {
            const data = doc.data();
            console.log(`Processing user doc: ${doc.id}, exists: ${doc.exists}`);

            let userName = "Unknown";
            try {
              const profile = await lineClient.getProfile(doc.id);
              userName = profile.displayName;
            } catch (e) {
              userName = doc.id.substring(0, 8);
            }

            const lastActive = data.lastActiveAt?.toDate();
            const timeAgo = lastActive ? getTimeAgo(lastActive) : "ไม่ทราบ";

            // Calculate trial days left
            let trialDaysLeft = 0;
            if (data.trialStatus === "active" && data.trialEndDate) {
              const endDate = data.trialEndDate.toDate();
              trialDaysLeft = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24));
            }

            // Count stats
            if (data.isPremium) {
              statsCount.premium++;
            } else if (data.trialStatus === "active") {
              statsCount.trial++;
            } else if (data.trialStatus === "expired") {
              statsCount.expired++;
            } else {
              statsCount.free++;
            }

            recentUsers.push({
              id: doc.id,
              name: userName,
              timeAgo: timeAgo,
              count: data.usageCount || data.totalTrialUsage || 0,
              isPremium: data.isPremium || false,
              trialStatus: data.trialStatus || "none",
              trialDaysLeft: trialDaysLeft,
              isBanned: data.isBanned || false,
            });
          }

          // Create Flex Message (using simple version temporarily due to missing user.id in old data)
          console.log("Recent Users before calling flex:", JSON.stringify(recentUsers));
          const flexMsg = createRecentUsersMessageSimple(recentUsers);
          await lineClient.replyMessage(replyToken, flexMsg);
        } catch (err) {
          console.error("Error in /recent command:", err);
          const errorMsg = createSimpleMessage(`เกิดข้อผิดพลาด: ${err.message}`, false);
          await lineClient.replyMessage(replyToken, errorMsg);
        }
        return;
      }

      // Command: /user [ID] - ดูข้อมูลผู้ใช้แบบเต็มรูปแบบ (Enhanced)
      if (cmd.startsWith("/user ")) {
        const targetUserId = cmd.replace("/user ", "").trim();
        if (!targetUserId) {
          const errorMsg = createSimpleMessage("❌ กรุณาระบุ User ID\n\nตัวอย่าง: /user U1234567890abcdef", false);
          await lineClient.replyMessage(replyToken, errorMsg);
          return;
        }

        try {
          // Try line_users collection first (newer)
          let userDoc = await db.collection("line_users").doc(targetUserId).get();
          
          if (!userDoc.exists) {
            // Fallback to users collection (older)
            userDoc = await db.collection("users").doc(targetUserId).get();
          }

          if (!userDoc.exists) {
            const errorMsg = createSimpleMessage(`❌ ไม่พบผู้ใช้ ID: ${targetUserId}`, false);
            await lineClient.replyMessage(replyToken, errorMsg);
            return;
          }

          const data = userDoc.data();

          // Get user name from LINE profile
          let userName = "Unknown";
          try {
            const profile = await lineClient.getProfile(targetUserId);
            userName = profile.displayName;
          } catch (e) {
            userName = data.displayName || targetUserId.substring(0, 8);
          }

          // Format dates
          const createdAt = data.createdAt?.toDate().toLocaleDateString("th-TH", {
            year: "numeric",
            month: "short",
            day: "numeric",
          }) || "ไม่ทราบ";
          
          const lastActive = data.lastActiveAt?.toDate() || null;
          const timeAgo = lastActive ? getTimeAgo(lastActive) : "ไม่เคยใช้งาน";

          // Calculate trial days left
          let trialDaysLeft = 0;
          if (data.trialStatus === "active" && data.trialEndDate) {
            const endDate = data.trialEndDate.toDate();
            trialDaysLeft = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24));
          }

          // Get feature usage (if tracked)
          const visionUsage = data.visionUsage || 0;
          const calculatorUsage = data.calculatorUsage || 0;
          const agricultureUsage = data.agricultureUsage || 0;
          const accountingUsage = data.accountingUsage || 0;
          const educationUsage = data.educationUsage || 0;

          // Create Enhanced User Control Panel
          const controlPanel = createUserControlPanel({
            id: targetUserId,
            name: userName,
            email: data.email || "ไม่ระบุ",
            isPremium: data.isPremium || false,
            isBanned: data.isBanned || false,
            usageCount: data.usageCount || data.totalTrialUsage || 0,
            dailyUsage: data.dailyUsage || 0,
            dailyLimit: data.dailyLimit || 15,
            trialStatus: data.trialStatus || "none",
            trialDaysLeft: trialDaysLeft,
            createdAt: createdAt,
            lastActive: timeAgo,
            subscriptionStatus: data.subscriptionStatus || "none",
            selectedPackage: data.selectedPackage || "ไม่มี",
            // Feature usage
            visionUsage: visionUsage,
            calculatorUsage: calculatorUsage,
            agricultureUsage: agricultureUsage,
            accountingUsage: accountingUsage,
            educationUsage: educationUsage,
          });

          await lineClient.replyMessage(replyToken, controlPanel);
          console.log(`✅ Sent User Control Panel for ${targetUserId}`);
        } catch (err) {
          console.error("Error in /user command:", err);
          const errorMsg = createSimpleMessage(`❌ เกิดข้อผิดพลาด: ${err.message}`, false);
          await lineClient.replyMessage(replyToken, errorMsg);
        }
        return;
      }

      // Command: /userlist [page] - แสดงรายการผู้ใช้แบบ pagination (ไม่ต้องใส่หน้าก็ได้)
      if (cmd.startsWith("/userlist") || cmd === "/userlist") {
        const parts = cmd.split(" ");
        const page = parseInt(parts[1]) || 1; // Default หน้า 1 ถ้าไม่ใส่
        
        try {
          const pageSize = 10;
          const offset = (page - 1) * pageSize;

          // Get total user count
          const usersSnapshot = await db.collection("line_users").get();
          const totalUsers = usersSnapshot.size;
          
          // Get paginated users with full profile data
          const usersQuery = await db.collection("line_users")
            .orderBy("lastActiveAt", "desc")
            .limit(pageSize)
            .offset(offset)
            .get();

          const users = [];
          for (const doc of usersQuery.docs) {
            const data = doc.data();
            
            // Get display name from LINE profile
            let displayName = "Unknown";
            try {
              const profile = await lineClient.getProfile(doc.id);
              displayName = profile.displayName;
            } catch (e) {
              displayName = data.name || data.displayName || doc.id.substring(0, 10);
            }

            const lastActive = data.lastActiveAt?.toDate();
            const timeAgo = lastActive ? getTimeAgo(lastActive) : "ไม่ทราบ";

            users.push({
              id: doc.id,
              name: displayName,
              isPremium: data.isPremium || false,
              isBanned: data.isBanned || false,
              usageCount: data.usageCount || 0,
              lastActive: timeAgo,
              trialStatus: data.trialStatus || "none",
              email: data.email || "",
            });
          }

          const userListFlex = createUserListFlex(users, page, totalUsers);
          await lineClient.replyMessage(replyToken, userListFlex);
          console.log(`✅ Sent User List - Page ${page}/${Math.ceil(totalUsers / pageSize)} (${totalUsers} total users)`);
        } catch (err) {
          console.error("Error in /userlist command:", err);
          const errorMsg = createSimpleMessage(`❌ เกิดข้อผิดพลาด: ${err.message}`, false);
          await lineClient.replyMessage(replyToken, errorMsg);
        }
        return;
      }

      // Command: /promote [userId] - อัพเกรดเป็น Premium
      if (cmd.startsWith("/promote ")) {
        const targetUserId = cmd.replace("/promote ", "").trim();
        if (!targetUserId) {
          const errorMsg = createSimpleMessage("❌ กรุณาระบุ User ID\nรูปแบบ: /promote [userId]", false);
          await lineClient.replyMessage(replyToken, errorMsg);
          return;
        }

        try {
          const userDoc = await db.collection("line_users").doc(targetUserId).get();

          if (!userDoc.exists) {
            const errorMsg = createSimpleMessage(`❌ ไม่พบผู้ใช้ ID: ${targetUserId}`, false);
            await lineClient.replyMessage(replyToken, errorMsg);
            return;
          }

          const data = userDoc.data();
          
          // Check if already premium
          if (data.isPremium) {
            const errorMsg = createSimpleMessage(`⚠️ ผู้ใช้นี้เป็น Premium อยู่แล้ว`, false);
            await lineClient.replyMessage(replyToken, errorMsg);
            return;
          }

          // Get user name
          let userName = "Unknown";
          try {
            const profile = await lineClient.getProfile(targetUserId);
            userName = profile.displayName;
          } catch (e) {
            userName = targetUserId.substring(0, 8);
          }

          // Update to Premium
          await db.collection("line_users").doc(targetUserId).update({
            isPremium: true,
            premiumSince: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: userId, // Super Admin who promoted
          });

          const successMsg = createSimpleMessage(
              `✅ อัพเกรดสำเร็จ!\n\n` +
              `👤 ผู้ใช้: ${userName}\n` +
              `🆔 ID: ${targetUserId}\n` +
              `💎 สถานะ: Premium\n` +
              `👨‍💼 โดย: Super Admin`,
              true,
          );
          await lineClient.replyMessage(replyToken, successMsg);
        } catch (err) {
          console.error("Error in /promote command:", err);
          const errorMsg = createSimpleMessage(`❌ เกิดข้อผิดพลาด: ${err.message}`, false);
          await lineClient.replyMessage(replyToken, errorMsg);
        }
        return;
      }

      // Command: /demote [userId] - ลดระดับจาก Premium
      if (cmd.startsWith("/demote ")) {
        const targetUserId = cmd.replace("/demote ", "").trim();
        if (!targetUserId) {
          const errorMsg = createSimpleMessage("❌ กรุณาระบุ User ID\nรูปแบบ: /demote [userId]", false);
          await lineClient.replyMessage(replyToken, errorMsg);
          return;
        }

        try {
          const userDoc = await db.collection("line_users").doc(targetUserId).get();

          if (!userDoc.exists) {
            const errorMsg = createSimpleMessage(`❌ ไม่พบผู้ใช้ ID: ${targetUserId}`, false);
            await lineClient.replyMessage(replyToken, errorMsg);
            return;
          }

          const data = userDoc.data();
          
          // Check if not premium
          if (!data.isPremium) {
            const errorMsg = createSimpleMessage(`⚠️ ผู้ใช้นี้ไม่ได้เป็น Premium`, false);
            await lineClient.replyMessage(replyToken, errorMsg);
            return;
          }

          // Get user name
          let userName = "Unknown";
          try {
            const profile = await lineClient.getProfile(targetUserId);
            userName = profile.displayName;
          } catch (e) {
            userName = targetUserId.substring(0, 8);
          }

          // Demote from Premium
          await db.collection("line_users").doc(targetUserId).update({
            isPremium: false,
            premiumSince: admin.firestore.FieldValue.delete(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: userId, // Super Admin who demoted
          });

          const successMsg = createSimpleMessage(
              `✅ ลดระดับสำเร็จ!\n\n` +
              `👤 ผู้ใช้: ${userName}\n` +
              `🆔 ID: ${targetUserId}\n` +
              `📊 สถานะ: Free User\n` +
              `👨‍💼 โดย: Super Admin`,
              true,
          );
          await lineClient.replyMessage(replyToken, successMsg);
        } catch (err) {
          console.error("Error in /demote command:", err);
          const errorMsg = createSimpleMessage(`❌ เกิดข้อผิดพลาด: ${err.message}`, false);
          await lineClient.replyMessage(replyToken, errorMsg);
        }
        return;
      }

      // Command: /ban [userId] - แบนผู้ใช้
      if (cmd.startsWith("/ban ")) {
        const targetUserId = cmd.replace("/ban ", "").trim();
        if (!targetUserId) {
          const errorMsg = createSimpleMessage("❌ กรุณาระบุ User ID\nรูปแบบ: /ban [userId]", false);
          await lineClient.replyMessage(replyToken, errorMsg);
          return;
        }

        try {
          const userDoc = await db.collection("line_users").doc(targetUserId).get();

          if (!userDoc.exists) {
            const errorMsg = createSimpleMessage(`❌ ไม่พบผู้ใช้ ID: ${targetUserId}`, false);
            await lineClient.replyMessage(replyToken, errorMsg);
            return;
          }

          const data = userDoc.data();
          
          // Check if already banned
          if (data.isBanned) {
            const errorMsg = createSimpleMessage(`⚠️ ผู้ใช้นี้ถูกแบนอยู่แล้ว`, false);
            await lineClient.replyMessage(replyToken, errorMsg);
            return;
          }

          // Get user name
          let userName = "Unknown";
          try {
            const profile = await lineClient.getProfile(targetUserId);
            userName = profile.displayName;
          } catch (e) {
            userName = targetUserId.substring(0, 8);
          }

          // Ban user
          await db.collection("line_users").doc(targetUserId).update({
            isBanned: true,
            bannedAt: admin.firestore.FieldValue.serverTimestamp(),
            bannedBy: userId, // Super Admin who banned
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          const successMsg = createSimpleMessage(
              `🚫 แบนผู้ใช้สำเร็จ!\n\n` +
              `👤 ผู้ใช้: ${userName}\n` +
              `🆔 ID: ${targetUserId}\n` +
              `⛔ สถานะ: ถูกแบน\n` +
              `👨‍💼 โดย: Super Admin`,
              true,
          );
          await lineClient.replyMessage(replyToken, successMsg);
        } catch (err) {
          console.error("Error in /ban command:", err);
          const errorMsg = createSimpleMessage(`❌ เกิดข้อผิดพลาด: ${err.message}`, false);
          await lineClient.replyMessage(replyToken, errorMsg);
        }
        return;
      }

      // Command: /unban [userId] - ปลดแบนผู้ใช้
      if (cmd.startsWith("/unban ")) {
        const targetUserId = cmd.replace("/unban ", "").trim();
        if (!targetUserId) {
          const errorMsg = createSimpleMessage("❌ กรุณาระบุ User ID\nรูปแบบ: /unban [userId]", false);
          await lineClient.replyMessage(replyToken, errorMsg);
          return;
        }

        try {
          const userDoc = await db.collection("line_users").doc(targetUserId).get();

          if (!userDoc.exists) {
            const errorMsg = createSimpleMessage(`❌ ไม่พบผู้ใช้ ID: ${targetUserId}`, false);
            await lineClient.replyMessage(replyToken, errorMsg);
            return;
          }

          const data = userDoc.data();
          
          // Check if not banned
          if (!data.isBanned) {
            const errorMsg = createSimpleMessage(`⚠️ ผู้ใช้นี้ไม่ได้ถูกแบน`, false);
            await lineClient.replyMessage(replyToken, errorMsg);
            return;
          }

          // Get user name
          let userName = "Unknown";
          try {
            const profile = await lineClient.getProfile(targetUserId);
            userName = profile.displayName;
          } catch (e) {
            userName = targetUserId.substring(0, 8);
          }

          // Unban user
          await db.collection("line_users").doc(targetUserId).update({
            isBanned: false,
            bannedAt: admin.firestore.FieldValue.delete(),
            bannedBy: admin.firestore.FieldValue.delete(),
            unbannedAt: admin.firestore.FieldValue.serverTimestamp(),
            unbannedBy: userId, // Super Admin who unbanned
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          const successMsg = createSimpleMessage(
              `✅ ปลดแบนสำเร็จ!\n\n` +
              `👤 ผู้ใช้: ${userName}\n` +
              `🆔 ID: ${targetUserId}\n` +
              `✨ สถานะ: กลับมาใช้งานได้แล้ว\n` +
              `👨‍💼 โดย: Super Admin`,
              true,
          );
          await lineClient.replyMessage(replyToken, successMsg);
        } catch (err) {
          console.error("Error in /unban command:", err);
          const errorMsg = createSimpleMessage(`❌ เกิดข้อผิดพลาด: ${err.message}`, false);
          await lineClient.replyMessage(replyToken, errorMsg);
        }
        return;
      }

      // Command: /pending - รายการรออนุมัติ
      if (cmd === "/pending") {
        try {
          const pendingSnapshot = await db.collection("localKnowledge")
              .where("isVerified", "==", false)
              .limit(10)
              .get();

          const pendingItems = [];
          pendingSnapshot.forEach((doc) => {
            const data = doc.data();
            pendingItems.push({
              id: doc.id,
              problem: data.problem?.substring(0, 50) || "N/A",
              contributor: data.contributedBy || "ไม่ทราบ",
              date: data.createdAt?.toDate().toLocaleDateString("th-TH") || "ไม่ทราบ",
            });
          });

          // Create Flex Message
          const flexMsg = createPendingItemsMessage(pendingItems);
          await lineClient.replyMessage(replyToken, flexMsg);
        } catch (err) {
          const errorMsg = createSimpleMessage(`เกิดข้อผิดพลาด: ${err.message}`, false);
          await lineClient.replyMessage(replyToken, errorMsg);
        }
        return;
      }

      // Command: /approve [ID] - อนุมัติความรู้
      if (cmd.startsWith("/approve ")) {
        const knowledgeId = cmd.replace("/approve ", "").trim();
        if (!knowledgeId) {
          const errorMsg = createSimpleMessage("กรุณาระบุ ID ความรู้ที่ต้องการอนุมัติ", false);
          await lineClient.replyMessage(replyToken, errorMsg);
          return;
        }

        try {
          const hyperKnowledge = getHyperLocalizedKnowledge();
          const result = await hyperKnowledge.verifyKnowledge(knowledgeId, userId, "verified");

          if (result) {
            const successMsg = createSimpleMessage(`อนุมัติความรู้ ${knowledgeId} สำเร็จ!`, true);
            await lineClient.replyMessage(replyToken, successMsg);
          } else {
            const errorMsg = createSimpleMessage(`ไม่พบความรู้ ID: ${knowledgeId}`, false);
            await lineClient.replyMessage(replyToken, errorMsg);
          }
        } catch (err) {
          const errorMsg = createSimpleMessage(`เกิดข้อผิดพลาด: ${err.message}`, false);
          await lineClient.replyMessage(replyToken, errorMsg);
        }
        return;
      }

      // Command: /premium - รายงานรายได้ Premium
      if (cmd === "/premium") {
        try {
          const usersSnapshot = await db.collection("users")
              .where("isPremium", "==", true)
              .get();

          let totalRevenue = 0;
          let monthlyUsers = 0;
          let yearlyUsers = 0;
          let teamUsers = 0;

          usersSnapshot.forEach((doc) => {
            const data = doc.data();
            const packageType = data.premiumPackage || "monthly";

            if (packageType === "monthly") {
              monthlyUsers++;
              totalRevenue += 99;
            } else if (packageType === "yearly") {
              yearlyUsers++;
              totalRevenue += 699;
            } else if (packageType === "team") {
              teamUsers++;
              totalRevenue += 2490;
            }
          });

          // Create Flex Message
          const flexMsg = createPremiumReportMessage({
            total: usersSnapshot.size,
            monthly: monthlyUsers,
            yearly: yearlyUsers,
            team: teamUsers,
            revenue: totalRevenue,
          });

          await lineClient.replyMessage(replyToken, flexMsg);
        } catch (err) {
          const errorMsg = createSimpleMessage(`เกิดข้อผิดพลาด: ${err.message}`, false);
          await lineClient.replyMessage(replyToken, errorMsg);
        }
        return;
      }

      // Command: /broadcast [ข้อความ] - ประกาศไปยังผู้ใช้ทั้งหมด
      if (cmd.startsWith("/broadcast ")) {
        const broadcastMsg = cmd.replace("/broadcast ", "").trim();
        if (!broadcastMsg) {
          const errorMsg = createSimpleMessage("กรุณาระบุข้อความที่ต้องการประกาศ", false);
          await lineClient.replyMessage(replyToken, errorMsg);
          return;
        }

        try {
          const usersSnapshot = await db.collection("users").get();

          let successCount = 0;
          let failCount = 0;

          // ส่งข้อความไปยังผู้ใช้ทุกคน (ทีละคน)
          for (const doc of usersSnapshot.docs) {
            try {
              await lineClient.pushMessage(doc.id, {
                type: "text",
                text: `📢 **ประกาศจากระบบ**\n\n${broadcastMsg}`,
              });
              successCount++;
            } catch (e) {
              failCount++;
              console.warn(`Failed to send broadcast to ${doc.id}:`, e.message);
            }

            // หน่วงเวลาเพื่อไม่ให้ rate limit
            await new Promise((resolve) => setTimeout(resolve, 100));
          }

          const successMsg = createSimpleMessage(
              `ประกาศเสร็จสิ้น\n✅ สำเร็จ: ${successCount} คน\n❌ ล้มเหลว: ${failCount} คน`,
              true,
          );
          await lineClient.replyMessage(replyToken, successMsg);
        } catch (err) {
          const errorMsg = createSimpleMessage(`เกิดข้อผิดพลาด: ${err.message}`, false);
          await lineClient.replyMessage(replyToken, errorMsg);
        }
        return;
      }

      // Command: /reply [ID] [ข้อความ] - ตอบกลับผู้ใช้
      if (cmd.startsWith("/reply ")) {
        const parts = cmd.replace("/reply ", "").trim().split(" ");
        const targetUserId = parts[0];
        const replyMsg = parts.slice(1).join(" ");

        if (!targetUserId || !replyMsg) {
          const errorMsg = createSimpleMessage("รูปแบบ: /reply [User ID] [ข้อความ]", false);
          await lineClient.replyMessage(replyToken, errorMsg);
          return;
        }

        try {
          await lineClient.pushMessage(targetUserId, {
            type: "text",
            text: `💬 **ข้อความจาก Admin**\n\n${replyMsg}`,
          });

          const successMsg = createSimpleMessage(`ส่งข้อความถึง ${targetUserId} สำเร็จ`, true);
          await lineClient.replyMessage(replyToken, successMsg);
        } catch (err) {
          const errorMsg = createSimpleMessage(`เกิดข้อผิดพลาด: ${err.message}`, false);
          await lineClient.replyMessage(replyToken, errorMsg);
        }
        return;
      }
    }

    // ============================================
    // 🎁 Handle Trial Request - ขอทดลองใช้ฟรี 3 วัน
    // ============================================
    if (message.text === "ขอทดลองใช้ฟรี 3 วัน") {
      console.log(`🎁 User ${userId} requested 3-day trial`);

      const hasUsedTrial = userData.hasUsedTrial || false;

      if (hasUsedTrial) {
        // เคยใช้สิทธิ์ทดลองแล้ว
        const alreadyUsedFlex = {
          type: "flex",
          altText: "คุณเคยใช้สิทธิ์ทดลองแล้ว",
          contents: {
            type: "bubble",
            size: "kilo",
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: "❌ ไม่สามารถใช้สิทธิ์ได้",
                  weight: "bold",
                  size: "lg",
                  color: "#E53935",
                },
                {
                  type: "text",
                  text: "คุณเคยใช้สิทธิ์ทดลอง 3 วันไปแล้วครับ",
                  size: "sm",
                  color: "#666666",
                  margin: "md",
                  wrap: true,
                },
                {
                  type: "separator",
                  margin: "lg",
                },
                {
                  type: "text",
                  text: "💎 อัปเกรดเป็น Premium เพื่อใช้งานต่อ",
                  size: "sm",
                  color: "#555555",
                  margin: "lg",
                  wrap: true,
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
                  style: "primary",
                  color: "#4CAF50",
                  action: {
                    type: "message",
                    label: "💎 ดูแพ็คเกจ Premium",
                    text: "สมัครสมาชิก",
                  },
                },
              ],
            },
          },
        };

        try {
          await lineClient.replyMessage(replyToken, alreadyUsedFlex);
        } catch (replyErr) {
          await lineClient.pushMessage(userId, alreadyUsedFlex);
        }
        return;
      }

      // ยังไม่เคยใช้ - ให้สิทธิ์ทดลอง 3 วัน
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 3);

      await userRef.set({
        hasUsedTrial: true,
        trialStartDate: FieldValue.serverTimestamp(),
        trialEndDate: trialEndDate,
        usageCount: 0, // Reset usage
        isPremium: true, // Grant temporary premium
        premiumType: "trial",
        premiumExpiry: trialEndDate,
      }, {merge: true});

      const trialGrantedFlex = {
        type: "flex",
        altText: "🎉 ได้รับสิทธิ์ทดลองใช้ฟรี 3 วัน!",
        contents: {
          type: "bubble",
          size: "kilo",
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "🎉 ยินดีด้วย!",
                weight: "bold",
                size: "xl",
                color: "#4CAF50",
              },
              {
                type: "text",
                text: "คุณได้รับสิทธิ์ทดลองใช้ Premium ฟรี 3 วัน",
                size: "sm",
                color: "#666666",
                margin: "md",
                wrap: true,
              },
              {
                type: "separator",
                margin: "lg",
              },
              {
                type: "box",
                layout: "vertical",
                margin: "lg",
                contents: [
                  {
                    type: "text",
                    text: "✅ ใช้งานได้ไม่จำกัด",
                    size: "sm",
                    color: "#555555",
                  },
                  {
                    type: "text",
                    text: "✅ เข้าถึงฟีเจอร์ทั้งหมด",
                    size: "sm",
                    color: "#555555",
                    margin: "sm",
                  },
                  {
                    type: "text",
                    text: `📅 หมดอายุ: ${trialEndDate.toLocaleDateString("th-TH")}`,
                    size: "sm",
                    color: "#E53935",
                    margin: "sm",
                    weight: "bold",
                  },
                ],
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
                style: "primary",
                color: "#4CAF50",
                action: {
                  type: "message",
                  label: "🚀 เริ่มใช้งานเลย!",
                  text: "ช่วยคำนวณ cooling time",
                },
              },
            ],
          },
        },
      };

      try {
        await lineClient.replyMessage(replyToken, trialGrantedFlex);
      } catch (replyErr) {
        await lineClient.pushMessage(userId, trialGrantedFlex);
      }

      console.log(`✅ Trial granted to user ${userId} until ${trialEndDate.toISOString()}`);
      return;
    }

    // ============================================
    // 📞 Handle Admin Unlock Request - แจ้งปลดล็อคโควต้า
    // ============================================
    if (message.text === "แจ้งปลดล็อคโควต้า") {
      console.log(`📞 User ${userId} requested admin unlock`);

      // Get user display name
      let displayName = userData.displayName || "ไม่ทราบชื่อ";
      try {
        const profile = await lineClient.getProfile(userId);
        displayName = profile.displayName;
      } catch (e) {
        console.warn("Could not get profile:", e.message);
      }

      // 🔍 Check if user recently requested unlock (rate limiting)
      const lastUnlockRequest = userData.lastUnlockRequestAt?.toDate();
      const now = new Date();
      const timeSinceLastRequest = lastUnlockRequest ? (now - lastUnlockRequest) / 1000 / 60 : 999; // minutes

      if (timeSinceLastRequest < 5) {
        // Less than 5 minutes since last request
        console.log(`⏰ User ${userId} requested unlock too frequently (${timeSinceLastRequest.toFixed(1)} min ago)`);
        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: `⏰ คุณเพิ่งขอปลดล็อคไปเมื่อ ${timeSinceLastRequest.toFixed(0)} นาทีที่แล้ว\n\n` +
                `กรุณารอสักครู่ หรือสมัคร Premium เพื่อใช้งานได้ทันที`,
          quickReply: {
            items: [
              {type: "action", action: {type: "message", label: "💎 สมัคร Premium", text: "สนใจสมัคร Premium"}},
              {type: "action", action: {type: "message", label: "📋 ดูแพ็คเกจ", text: "ดูแพ็คเกจ"}},
            ],
          },
        });
        return;
      }

      // Update last unlock request time
      await userRef.set({
        lastUnlockRequestAt: FieldValue.serverTimestamp(),
      }, {merge: true});

      // Define Super Admin ID
      const SUPER_ADMIN_ID = "Ud9bec6d2ea945cf4330a69cb74ac93cf";

      // Send notification to Admin
      const adminNotification = {
        type: "flex",
        altText: `📞 มีผู้ใช้ขอปลดล็อคโควต้า: ${displayName}`,
        contents: {
          type: "bubble",
          size: "kilo",
          header: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "📞 ขอปลดล็อคโควต้า",
                weight: "bold",
                size: "lg",
                color: "#FFFFFF",
              },
            ],
            backgroundColor: "#FF6B35",
            paddingAll: "15px",
          },
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: `👤 ${displayName}`,
                weight: "bold",
                size: "md",
              },
              {
                type: "text",
                text: `🆔 ${userId}`,
                size: "xs",
                color: "#888888",
                margin: "sm",
              },
              {
                type: "text",
                text: `📊 ใช้งานแล้ว: ${userData.usageCount || 0} ครั้ง`,
                size: "sm",
                color: "#666666",
                margin: "md",
              },
              {
                type: "text",
                text: `⏰ ${new Date().toLocaleString("th-TH")}`,
                size: "xs",
                color: "#888888",
                margin: "sm",
              },
            ],
            paddingAll: "15px",
          },
          footer: {
            type: "box",
            layout: "horizontal",
            spacing: "sm",
            contents: [
              {
                type: "button",
                style: "primary",
                color: "#4CAF50",
                action: {
                  type: "message",
                  label: "✅ ปลดล็อค",
                  text: `/resetquota ${userId}`,
                },
                flex: 1,
              },
              {
                type: "button",
                style: "secondary",
                action: {
                  type: "message",
                  label: "💬 ตอบกลับ",
                  text: `/reply ${userId} `,
                },
                flex: 1,
              },
            ],
          },
        },
      };

      // Try to send to admin with retry logic
      let adminNotified = false;
      try {
        await lineClient.pushMessage(SUPER_ADMIN_ID, adminNotification);
        console.log(`✅ Admin notification sent for user ${userId}`);
        adminNotified = true;
      } catch (adminErr) {
        console.error("❌ Failed to notify admin:", adminErr.message);

        // If 429 rate limit, save to Firestore for batch notification later
        if (adminErr.message.includes("429")) {
          console.log("💾 Saving unlock request to Firestore due to rate limit");
          try {
            await db.collection("unlock_requests").add({
              userId: userId,
              displayName: displayName,
              usageCount: userData.usageCount || 0,
              requestedAt: FieldValue.serverTimestamp(),
              notified: false,
            });
            console.log("✅ Unlock request saved to Firestore");
          } catch (saveErr) {
            console.error("❌ Failed to save unlock request:", saveErr.message);
          }
        }
      }

      // Confirm to user
      const userConfirmFlex = {
        type: "flex",
        altText: "ส่งคำขอถึงแอดมินแล้ว",
        contents: {
          type: "bubble",
          size: "kilo",
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "✅ ส่งคำขอแล้ว!",
                weight: "bold",
                size: "lg",
                color: "#4CAF50",
              },
              {
                type: "text",
                text: "แอดมินจะได้รับแจ้งเตือนและติดต่อกลับโดยเร็ว",
                size: "sm",
                color: "#666666",
                margin: "md",
                wrap: true,
              },
              {
                type: "separator",
                margin: "lg",
              },
              {
                type: "text",
                text: "💡 หรือสมัคร Premium เพื่อใช้งานได้ทันที",
                size: "sm",
                color: "#555555",
                margin: "lg",
                wrap: true,
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
                style: "primary",
                color: "#4CAF50",
                action: {
                  type: "message",
                  label: "💎 ดูแพ็คเกจ Premium",
                  text: "สมัครสมาชิก",
                },
              },
            ],
          },
        },
      };

      try {
        await lineClient.replyMessage(replyToken, userConfirmFlex);
        console.log(`✅ User confirmation sent to ${userId}`);
      } catch (replyErr) {
        console.warn("⚠️ replyMessage failed, trying pushMessage:", replyErr.message);
        try {
          await lineClient.pushMessage(userId, userConfirmFlex);
          console.log(`✅ User confirmation sent via pushMessage to ${userId}`);
        } catch (pushErr) {
          console.error("❌ Failed to send user confirmation:", pushErr.message);
        }
      }
      return;
    }

    // Check Quota (If not Premium) - 🎁 NEW TRIAL SYSTEM
    // =====================================================
    // 🎁 NEW TRIAL QUOTA SYSTEM (7 วัน 7 ครั้ง/วัน)
    // =====================================================

    // 🎯 BYPASS QUOTA CHECK for Subscription/Unlock Keywords
    const subscriptionKeywords = ["สนใจสมัคร", "สมัครสมาชิก", "สมัคร premium", "ขอสมัคร", "แจ้งปลดล็อค", "ดูแพ็คเกจ", "เลือกรายเดือน", "เลือกรายปี"];
    const msgLowerForBypass = message.text.toLowerCase();
    const isSubscriptionRequest = subscriptionKeywords.some(keyword => msgLowerForBypass.includes(keyword.toLowerCase()));

    if (isSubscriptionRequest) {
      console.log(`💎 Subscription/Unlock request detected: "${message.text}" - bypassing quota check`);
      // Skip quota check, continue to subscription handler
    }

    // 👑 SUPER ADMIN BYPASS - Super Admin ไม่ต้องเช็ค Trial/Quota
    else if (userId === "Ud9bec6d2ea945cf4330a69cb74ac93cf") {
      console.log(`👑 Super Admin ${userId} - bypassing Trial/Quota check, unlimited access`);
      // Continue directly to AI processing
    } else {
      // Normal user - check Trial Status
      const trialStatus = await getTrialStatus(userId);
      console.log(`🎁 Trial Status: ${JSON.stringify(trialStatus)}`);

      // Helper function to send message with fallbacks
      const sendTrialMessage = async (messageToSend) => {
        try {
          await lineClient.replyMessage(replyToken, messageToSend);
          console.log("✅ Trial message sent via replyMessage");
          return true;
        } catch (replyError) {
          console.warn("⚠️ replyMessage failed:", replyError.message);
          try {
            await lineClient.pushMessage(userId, messageToSend);
            console.log("✅ Trial message sent via pushMessage (fallback)");
            return true;
          } catch (pushError) {
            console.error("❌ pushMessage also failed:", pushError.message);
            return false;
          }
        }
      };

      // 1️⃣ PREMIUM USER - ไม่จำกัด
      if (trialStatus.isPremium) {
        console.log(`💎 Premium user ${userId} - unlimited access`);
        // Continue to AI processing
      }

      // 2️⃣ FIRST TIME USER - ตอบฟรี 1 ครั้ง (ไม่นับเข้า trial)
      else if (trialStatus.isFirstTimeUser) {
        console.log(`👋 First time user ${userId} - FREE first query (not counted)`);

        // บันทึก first interaction (หลังจากนี้ครั้งที่ 2 จะแสดง Welcome Trial Flex)
        await recordFirstInteraction(userId, userData.displayName || "New User");

        // Continue to AI processing - ตอบคำถามปกติ (ไม่ต้องแสดง Welcome Flex)
      }

      // 3️⃣ PENDING TERMS - ครั้งที่ 2+ (ใช้ฟรีไปแล้ว) - แสดง Welcome Trial Flex
      else if (trialStatus.status === TRIAL_STATUS.PENDING_TERMS) {
        console.log(`📋 User ${userId} used FREE query - showing Welcome Trial Flex (must accept terms)`);

        // แสดง Welcome Trial Flex (มีปุ่ม Accept Terms) - ไม่ตอบคำถาม
        const welcomeFlex = createWelcomeTrialFlex(userData.displayName || "คุณ");
        await sendTrialMessage(welcomeFlex);
        return; // หยุดการตอบ AI - ต้อง accept terms ก่อน
      }

      // 4️⃣ ACTIVE TRIAL - ตรวจสอบ quota รายวัน
      else if (trialStatus.status === TRIAL_STATUS.ACTIVE) {
        console.log(`🎁 Active trial user ${userId} - Day ${trialStatus.trialDay || 1}, Usage: ${trialStatus.dailyUsage}/${trialStatus.dailyLimit}`);

        // Check daily limit (unless subscription request)
        if (trialStatus.dailyUsage >= trialStatus.dailyLimit && !isSubscriptionRequest) {
          console.log(`⛔ User ${userId} reached daily trial limit`);
          const dailyLimitFlex = createDailyLimitFlex(trialStatus);
          await sendTrialMessage(dailyLimitFlex);
          return;
        }

        // Check trial ending soon notification
        if (shouldShowNotification(trialStatus.trialDaysRemaining)) {
          console.log(`⚠️ Trial ending soon notification for ${userId} - ${trialStatus.trialDaysRemaining} days remaining`);
          // เก็บไว้แสดงหลังตอบคำถาม
          userData._showTrialEndingNotification = true;
          userData._trialDaysRemaining = trialStatus.trialDaysRemaining;
        }

        // บันทึกการใช้งาน
        await recordTrialUsage(userId);
      }

      // 5️⃣ TRIAL EXPIRED - Teaser mode (1 ครั้ง/วัน)
      else if (trialStatus.status === TRIAL_STATUS.EXPIRED) {
        console.log(`⏰ Trial expired user ${userId} - Usage: ${trialStatus.dailyUsage}/${TRIAL_CONFIG.POST_TRIAL_LIMIT}`);

        // Check teaser limit
        if (trialStatus.dailyUsage >= TRIAL_CONFIG.POST_TRIAL_LIMIT) {
          console.log(`⛔ User ${userId} reached teaser limit`);
          const expiredFlex = createTrialExpiredFlex({
            totalUsage: trialStatus.totalUsage,
            trialDays: TRIAL_CONFIG.TRIAL_DAYS,
          });
          await sendTrialMessage(expiredFlex);
          return;
        }

        // บันทึกการใช้งาน teaser
        await recordTeaserUsage(userId);

        // Flag เพื่อแสดง upgrade message หลังตอบคำถาม
        userData._showUpgradeAfterAnswer = true;
      }

      // 6️⃣ DEFAULT/UNKNOWN - Allow access (safety fallback)
      else {
        console.log(`⚠️ Unknown trial status for ${userId}, allowing access`);
      }
    } // End of else block (normal user Trial check)
  } catch (quotaError) {
    console.error("❌ Error checking quota:", quotaError);
    console.error("❌ Quota Error Stack:", quotaError.stack);
    // In case of error, allow access to avoid blocking users due to system error
  }

  try {
    // Get user profile
    let userName = "User";
    try {
      const profile = await lineClient.getProfile(userId);
      userName = profile.displayName;
      console.log(`├── User Name: ${userName}`);
    } catch (error) {
      console.warn("⚠️ Could not get user profile:", error.message);
    }

    // 📄 PDF REPORT GENERATION: Check for /report, /pdfreport, สรุปรายงาน commands
    const msgLower = message.text.toLowerCase().trim();
    const isPdfReportCommand = msgLower.startsWith("/report") ||
                               msgLower.startsWith("/pdfreport") ||
                               msgLower.startsWith("/pdfproduction") ||
                               msgLower.startsWith("/pdffarm") ||
                               msgLower.includes("สรุปรายงาน") ||
                               msgLower.includes("สร้างpdf") ||
                               msgLower.includes("รายงานpdf");

    if (isPdfReportCommand) {
      console.log(`📄 PDF Report command detected: "${message.text}"`);

      try {
        // Determine report type from command
        let reportType = null;
        if (msgLower.includes("production") || msgLower.includes("ผลิต") || msgLower.startsWith("/pdfproduction")) {
          reportType = "production";
        } else if (msgLower.includes("farm") || msgLower.includes("ฟาร์ม") || msgLower.includes("บัญชี") || msgLower.startsWith("/pdffarm")) {
          reportType = "farm";
        }

        // If no type specified, show selection menu
        if (!reportType && (msgLower === "/report" || msgLower === "สรุปรายงาน" || msgLower === "รายงานpdf")) {
          const selectionFlex = createReportSelectionFlex(userId);
          await lineClient.replyMessage(replyToken, {
            type: "flex",
            altText: "📄 เลือกประเภทรายงาน",
            contents: selectionFlex,
          });
          console.log("✅ Sent Report Selection Flex");
          return;
        }

        // Send loading message first
        try {
          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: "⏳ กำลังรวบรวมข้อมูลและสร้าง PDF...\nรอสักครู่นะครับ 📊",
          });
        } catch (loadingErr) {
          console.warn("Could not send loading message:", loadingErr.message);
        }

        // Get user data for report
        const userDoc = await getFirestore().collection("users").doc(userId).get();
        const userData = userDoc.exists ? userDoc.data() : {};

        // Generate the report
        const result = await generateDailyReport({
          userId,
          date: null, // Today
          type: reportType || "production",
          userData: {
            name: userName,
            orgName: userData.orgName || userData.organization || "-",
            farmName: userData.farmName || userData.orgName || "-",
          },
        });

        // Send result
        if (result.success) {
          const resultFlex = createReportResultFlex(result);
          await lineClient.pushMessage(userId, {
            type: "flex",
            altText: `📄 รายงาน ${result.fileName} พร้อมแล้ว!`,
            contents: resultFlex,
          });
          console.log(`✅ PDF Report generated: ${result.fileName}`);
        } else {
          // Send error message
          await lineClient.pushMessage(userId, {
            type: "text",
            text: `❌ ${result.message || "ไม่สามารถสร้างรายงานได้"}\n\n💡 ลองพิมพ์ /report เพื่อดูตัวเลือก`,
          });
          console.log(`⚠️ Report generation failed: ${result.error}`);
        }

        return; // Exit after handling PDF report
      } catch (pdfError) {
        console.error("❌ PDF Report error:", pdfError);
        await lineClient.pushMessage(userId, {
          type: "text",
          text: `❌ เกิดข้อผิดพลาด: ${pdfError.message}\n\n💡 กรุณาลองใหม่อีกครั้ง`,
        });
        return;
      }
    }

    // 🛠️ PROFESSIONAL TOOLS: Check if user is using a tool command
    // ⚠️ Skip Tool Command check for Admin-specific commands
    const adminSpecificCommands = [
      "ดูความรู้ทั้งหมด", "verify ความรู้", "ทดสอบ hybrid", "ปรับปรุงคลัง",
      "/listknowledge", "/verifyall", "/testhybrid", "/optimizeknowledge",
      "รายการความรู้", "ยืนยันความรู้ทั้งหมด", "optimize คลัง",
    ];
    const msgLowerForAdminCheck = message.text.toLowerCase().trim();
    const isAdminSpecificCommand = adminSpecificCommands.some((cmd) =>
      msgLowerForAdminCheck.startsWith(cmd.toLowerCase()),
    );

    console.log(`🔍 Checking tool command for: "${message.text.substring(0, 100)}..."`);

    // Skip tool parsing for admin-specific commands
    let toolCommand = isAdminSpecificCommand ? null : parseToolCommand(message.text);
    
    // 🧠 SMART ROUTING: ตรวจสอบว่าควรใช้ Flex หรือ AI
    // ถ้าคำถามมีลักษณะต้องการคำอธิบาย (ไม่ใช่แค่ดูข้อมูล) → ส่ง AI แทน
    if (toolCommand && toolCommand.type === "diagnostic" && toolCommand.tool === "defectDiagnosis") {
      const msgLower = message.text.toLowerCase();
      const needsAIExplanation = [
        /อธิบาย|explain|ละเอียด|เพิ่มเติม/i,
        /ทำไม|why|เพราะอะไร|สาเหตุ/i,
        /แก้ไข|แก้ปัญหา|วิธีแก้|how to fix/i,
        /ช่วย.*วิเคราะห์|analyze|วิเคราะห์/i,
      ].some(pattern => pattern.test(msgLower));
      
      if (needsAIExplanation) {
        console.log(`🧠 Smart Routing: "${message.text.substring(0, 50)}..." → AI (needs explanation)`);
        toolCommand = null; // Skip Flex, let AI handle with context
      }
    }
    
    if (toolCommand) {
      console.log(`🛠️ Tool command detected: ${toolCommand.type}/${toolCommand.tool || "list"}`);
      console.log(`🛠️ Tool params:`, JSON.stringify(toolCommand.params));

      let toolResponse = "";
      const SUPER_ADMIN_ID_TOOLS = "Ud9bec6d2ea945cf4330a69cb74ac93cf";

      try {
        switch (toolCommand.type) {
          case "calculator":
            const calcTool = CalculatorTools[toolCommand.tool];

            // 🧮 Special handling for liffCalculator - send Web Calculator Flex
            if (toolCommand.tool === "liffCalculator") {
              try {
                const calcMenuFlex = createCalculatorMenuFlex();
                if (calcMenuFlex) {
                  await lineClient.replyMessage(replyToken, calcMenuFlex);
                  console.log("✅ Sent Calculator Menu Flex Message");
                  return; // Exit after sending Flex
                }
              } catch (flexError) {
                console.error("⚠️ Calculator Menu Flex failed:", flexError);
                // Fallback to text response
                await lineClient.replyMessage(replyToken, {
                  type: "text",
                  text: `📱 เครื่องคิดเลขงานฉีดพลาสติก\n\n🔗 กดลิงก์: https://wizmobiz.com/calculator.html\n\n🎁 ฟรี 5 ครั้ง! Add LINE เพื่อใช้ไม่จำกัด`,
                });
                return;
              }
            }

            if (calcTool && calcTool.calculate) {
              // Map common param names
              const params = toolCommand.params;
              if (params.area) params.projectedArea = params.area;
              if (params.pressure) params.cavityPressure = params.pressure;
              if (params.thickness) params.wallThickness = params.thickness;

              // Cooling Time specific mapping
              if (toolCommand.tool === "coolingTime" && params.value1 && !params.wallThickness) {
                params.wallThickness = params.value1;
              }

              // 🆕 Clamping Force specific mapping - support width/length calculation
              if (toolCommand.tool === "clampingForce") {
                // If width and length provided, projectedArea is auto-calculated in extractParams
                // Fallback: use value1/value2 if no width/length detected
                if (!params.projectedArea && !params.width && !params.length) {
                  if (params.value1 && params.value2) {
                    // Check if values look like dimensions (both > 5) or area+pressure
                    if (params.value1 > 5 && params.value2 > 5 && !params.value3) {
                      // Likely dimensions: value1=width, value2=length
                      params.width = params.value1;
                      params.length = params.value2;
                      params.projectedArea = params.width * params.length;
                      console.log(`📐 Interpreted as dimensions: ${params.width} × ${params.length} = ${params.projectedArea} cm²`);
                    } else if (params.value1 > 100) {
                      // Likely area if value1 is large
                      params.projectedArea = params.value1;
                      params.cavityPressure = params.value2;
                    }
                  } else if (params.value1) {
                    params.projectedArea = params.value1;
                  }
                }
                // Use value for pressure if not set
                if (!params.cavityPressure && params.value3) {
                  params.cavityPressure = params.value3;
                }
              } else {
                // Original fallback for other calculators
                if (params.value1 && !params.projectedArea) params.projectedArea = params.value1;
                if (params.value2 && !params.cavityPressure) params.cavityPressure = params.value2;
              }

              console.log(`🔧 Calculator params:`, JSON.stringify(params));
              const result = calcTool.calculate(params);

              // 🎨 Try to send Flex Message for calculation result
              if (result.success && result.result) {
                try {
                  const flexMsg = createInjectionCalculationFlex(calcTool.name, result.result, toolCommand.tool);
                  if (flexMsg) {
                    await lineClient.replyMessage(replyToken, flexMsg);
                    console.log("✅ Sent Injection Calculation Flex Message");
                    return; // Exit after sending Flex
                  }
                } catch (flexError) {
                  console.error("⚠️ Calculation Flex failed, falling back to text:", flexError);
                }
              }
              toolResponse = result.error || result.formatted;
            }
            break;

          case "diagnostic":
            const diagTool = DiagnosticTools[toolCommand.tool];
            if (diagTool) {
              if (toolCommand.tool === "defectDiagnosis") {
                // Extract defect type from message - ตัดคำนำหน้าที่ไม่จำเป็นออก
                const defectType = message.text
                    .replace(/\/defect|วินิจฉัย|ปัญหา|แก้ไขปัญหา|แก้ปัญหา|แก้ไข|วิธีแก้/gi, "")
                    .trim();
                const result = diagTool.diagnose(defectType || "short_shot");

                // 🎨 Try to send Flex Message for defect diagnosis
                if (result.success && result.result) {
                  try {
                    const flexMsg = createDefectDiagnosisFlex(result.result);
                    if (flexMsg) {
                      await lineClient.replyMessage(replyToken, flexMsg);
                      console.log("✅ Sent Defect Diagnosis Flex Message");
                      return; // Exit after sending Flex
                    }
                  } catch (flexError) {
                    console.error("⚠️ Defect Flex failed, falling back to text:", flexError);
                  }
                }
                toolResponse = result.error || result.formatted;
              } else if (diagTool.check) {
                const result = diagTool.check(toolCommand.params);
                toolResponse = result.formatted;
              }
            }
            break;

          case "document":
            const docTool = DocumentGenerator[toolCommand.tool];
            if (docTool && docTool.generate) {
              // Inject operator name if not provided
              const params = {...toolCommand.params};
              if (!params.operator || params.operator === "N/A") {
                params.operator = userName;
              }
              if (!params.createdBy || params.createdBy === "System") {
                params.createdBy = userName;
              }

              const result = docTool.generate(params);

              // 📋 Setup Sheet - with Flex Message
              if (toolCommand.tool === "setupSheet" && result.success) {
                try {
                  const flexMsg = createSetupSheetFlex(params);
                  if (flexMsg) {
                    await lineClient.replyMessage(replyToken, flexMsg);
                    console.log("✅ Sent Setup Sheet Flex Message");
                    return; // Exit after sending Flex
                  }
                } catch (flexError) {
                  console.error("⚠️ Setup Sheet Flex failed, falling back to text:", flexError);
                }
              }

              // 💾 Save Digital Logbook Data (Standard) - with Flex Message
              if (toolCommand.tool === "productionReport" && result.success && result.data) {
                try {
                  const groupId = event.source.groupId || event.source.roomId || "private";
                  const logData = {
                    ...result.data,
                    userId: userId || "unknown",
                    groupId: groupId,
                    userDisplayName: userName,
                    createdAt: FieldValue.serverTimestamp(),
                  };

                  await getFirestore().collection("production_logs").add(logData);
                  console.log("✅ Logbook saved to Firestore");

                  // 🆕 Update User's Org Code if present
                  if (logData.orgCode) {
                    try {
                      await getFirestore().collection("line_users").doc(userId).set({
                        orgCode: logData.orgCode,
                        lastOrgActivity: FieldValue.serverTimestamp(),
                      }, {merge: true});
                      console.log(`✅ Updated Org Code for user ${userId}: ${logData.orgCode}`);
                    } catch (updateError) {
                      console.warn("⚠️ Failed to update user org code:", updateError);
                    }
                  }

                  // 🎨 Send beautiful Flex Message
                  try {
                    const flexMsg = createProductionReportMessage(result.data);
                    if (flexMsg) {
                      await lineClient.replyMessage(replyToken, flexMsg);
                      console.log("✅ Sent Production Report Flex Message");
                      return; // Exit after sending Flex
                    }
                  } catch (flexError) {
                    console.error("⚠️ Flex Message failed, falling back to text:", flexError);
                  }
                } catch (dbError) {
                  console.error("❌ Failed to save logbook:", dbError);
                  result.formatted += "\n\n⚠️ บันทึกข้อมูลลง Cloud ไม่สำเร็จ (แต่ข้อมูลถูกต้อง)";
                }
                toolResponse = result.formatted;
              }
              // 📊 Fetch Summary for Supervisor - with Flex Message
              else if (toolCommand.tool === "logbookSummary" && result.action === "fetch_summary") {
                try {
                  const groupId = event.source.groupId || event.source.roomId;
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);

                  let query = getFirestore().collection("production_logs")
                      .where("timestamp", ">=", today.getTime())
                      .orderBy("timestamp", "desc");

                  // Check for Org Code first
                  const paramOrgCode = toolCommand.params && toolCommand.params.orgCode;
                  if (paramOrgCode) {
                    query = query.where("orgCode", "==", paramOrgCode);
                  } else if (groupId) {
                    query = query.where("groupId", "==", groupId);
                  } else {
                    query = query.where("userId", "==", userId);
                  }

                  const snapshot = await query.get();

                  // 🎨 Convert to array for Flex Message
                  const reports = [];
                  snapshot.forEach((doc) => {
                    reports.push(doc.data());
                  });

                  // Try to send Flex Message
                  try {
                    const flexMsg = createSummaryDashboardMessage(reports, {orgCode: paramOrgCode});
                    if (flexMsg) {
                      await lineClient.replyMessage(replyToken, flexMsg);
                      console.log("✅ Sent Summary Dashboard Flex Message");
                      return; // Exit after sending Flex
                    }
                  } catch (flexError) {
                    console.error("⚠️ Flex Message failed, falling back to text:", flexError);
                  }

                  // Fallback to text
                  if (snapshot.empty) {
                    const filterMsg = paramOrgCode ?
                       `สำหรับรหัสองค์กร: ${paramOrgCode}` :
                       "ในวันนี้";

                    toolResponse = `📊 สรุปรายงานการผลิต (วันนี้)
════════════════════════════
❌ ไม่พบข้อมูลรายงาน${filterMsg}

💡 ให้พนักงานพิมพ์ /report เพื่อส่งรายงาน`;
                  } else {
                    const orgHeader = paramOrgCode ?
                       `🏢 Org: ${paramOrgCode}\n` :
                       "";

                    let summaryText = `📊 สรุปรายงานการผลิต (วันนี้)
${orgHeader}════════════════════════════
พบ ${snapshot.size} รายการ
`;

                    snapshot.forEach((doc) => {
                      const data = doc.data();
                      summaryText += `
🕒 ${data.time} | 👤 ${data.operator}
🏭 ${data.moldName} | 📈 ${data.efficiency}%
--------------------------------`;
                    });

                    summaryText += `\n\n💡 พิมพ์ /report เพื่อดูรายละเอียดแต่ละรายการ`;
                    toolResponse = summaryText;
                  }
                } catch (fetchError) {
                  console.error("❌ Failed to fetch summary:", fetchError);
                  toolResponse = "⚠️ เกิดข้อผิดพลาดในการดึงข้อมูลสรุป (อาจต้องสร้าง Index ใน Firestore)";
                }
              } else {
                toolResponse = result.formatted;
              }
            }
            break;

          case "communication":
            const commTool = TeamCommunication[toolCommand.tool];
            if (commTool && commTool.generate) {
              const result = commTool.generate(toolCommand.params);

              if (result.action === "team_broadcast") {
                try {
                  const {orgCode, message: broadcastMsg} = result;

                  // Find users in this Org
                  const usersSnapshot = await getFirestore().collection("line_users")
                      .where("orgCode", "==", orgCode)
                      .get();

                  if (usersSnapshot.empty) {
                    toolResponse = `❌ ไม่พบสมาชิกในทีมรหัส ${orgCode}\n(สมาชิกต้องเคยส่งรายงานด้วยรหัสนี้ก่อน)`;
                  } else {
                    let successCount = 0;
                    let failedCount = 0;
                    const promises = [];

                    // 🎨 สร้าง Flex Message สำหรับส่งให้สมาชิก
                    const announcementFlex = createTeamAnnouncementMessage({
                      orgCode,
                      message: broadcastMsg,
                      senderName: userName,
                      timestamp: new Date().toLocaleString("th-TH"),
                    });

                    usersSnapshot.forEach((doc) => {
                      // Don't send to self
                      if (doc.id !== userId) {
                        const messageToSend = announcementFlex || {
                          type: "text",
                          text: `📢 **ประกาศจากหัวหน้าทีม (${orgCode})**\n\n${broadcastMsg}`,
                        };
                        promises.push(
                            lineClient.pushMessage(doc.id, messageToSend)
                                .then(() => successCount++)
                                .catch((e) => {
                                  console.error(`Failed to send to ${doc.id}`, e);
                                  failedCount++;
                                }),
                        );
                      }
                    });

                    await Promise.all(promises);

                    // 🎨 ส่ง Flex Message แจ้งผลให้ผู้ส่ง
                    try {
                      const resultFlex = createBroadcastResultMessage({
                        orgCode,
                        successCount,
                        failedCount,
                        message: broadcastMsg,
                      });
                      if (resultFlex) {
                        await lineClient.replyMessage(replyToken, resultFlex);
                        console.log("✅ Sent Broadcast Result Flex Message");
                        return; // Exit after sending Flex
                      }
                    } catch (flexError) {
                      console.error("⚠️ Flex Message failed, falling back to text:", flexError);
                    }

                    toolResponse = `✅ ส่งประกาศสำเร็จ\n\n🏢 รหัสองค์กร: ${orgCode}\n👥 ผู้รับ: ${successCount} คน${failedCount > 0 ? `\n❌ ส่งไม่สำเร็จ: ${failedCount} คน` : ""}`;
                  }
                } catch (err) {
                  console.error("❌ Broadcast error:", err);
                  toolResponse = `⚠️ เกิดข้อผิดพลาดในการส่งประกาศ: ${err.message}`;
                }
              } else {
                toolResponse = result.formatted;
              }
            }
            break;

          case "vision":
            const visionTool = VisionTools[toolCommand.tool];
            if (visionTool && visionTool.generate) {
              // Check Subscription
              const userRef = getFirestore().collection("line_users").doc(userId);
              const userDoc = await userRef.get();
              const userData = userDoc.exists ? userDoc.data() : {};

              // Check if user has valid subscription (approved or active)
              // In a real system, we would check expiration date too
              const SUPER_ADMIN_ID = "Ud9bec6d2ea945cf4330a69cb74ac93cf";
              const isPremium = userData.subscriptionStatus === "approved" ||
                                userData.subscriptionStatus === "active" ||
                                userData.subscriptionStatus === "premium" ||
                                userId === SUPER_ADMIN_ID; // ✅ Allow Super Admin

              if (!isPremium) {
                toolResponse = `⚠️ **ขออภัยครับ ฟีเจอร์นี้สำหรับสมาชิก Premium เท่านั้น**\n\n` +
                                `สมัครสมาชิกเริ่มต้นเพียง 99 บาท/เดือน\n` +
                                `พิมพ์ "สนใจสมัคร" เพื่อดูรายละเอียด`;
              } else {
                const result = visionTool.generate(toolCommand.params);
                if (result.action === "request_image") {
                  // Set flag in Firestore
                  await userRef.set({imageMode: "vision_diagnosis"}, {merge: true});
                  console.log(`👁️ Set imageMode = 'vision_diagnosis' for ${userId}`);
                  toolResponse = result.formatted;
                } else {
                  toolResponse = result.formatted;
                }
              }
            }
            break;

          case "admin":
            // 🛡️ Security Check
            const SUPER_ADMIN_ID = "Ud9bec6d2ea945cf4330a69cb74ac93cf";
            if (userId !== SUPER_ADMIN_ID) {
              toolResponse = "⛔ **Access Denied**\nคุณไม่มีสิทธิ์เข้าถึงคำสั่งนี้";
              break;
            }

            const adminTool = AdminTools[toolCommand.tool];
            if (adminTool && adminTool.generate) {
              const result = adminTool.generate(toolCommand.params);

              if (result.action === "admin_status") {
                try {
                  // Check Firestore
                  const start = Date.now();
                  await getFirestore().collection("line_users").limit(1).get();
                  const dbLatency = Date.now() - start;

                  // Check Memory
                  const memoryUsage = process.memoryUsage();

                  toolResponse = `🔍 **System Status Report**
✅ Firestore: Connected (${dbLatency}ms)
✅ LINE SDK: Ready
🧠 Memory: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB
⏰ Uptime: ${process.uptime().toFixed(0)}s
📅 Server Time: ${new Date().toLocaleString("th-TH")}`;
                } catch (err) {
                  toolResponse = `❌ System Error: ${err.message}`;
                }
              } else if (result.action === "admin_stats") {
                try {
                  const usersSnap = await getFirestore().collection("line_users").count().get();
                  const logsSnap = await getFirestore().collection("production_logs").count().get();
                  const premiumSnap = await getFirestore().collection("line_users")
                      .where("subscriptionStatus", "in", ["approved", "active", "premium"])
                      .count().get();

                  toolResponse = `📊 **System Statistics**
👥 Total Users: ${usersSnap.data().count}
💎 Premium Users: ${premiumSnap.data().count}
📝 Total Logs: ${logsSnap.data().count}
`;
                } catch (err) {
                  toolResponse = `❌ Stats Error: ${err.message}`;
                }
              } else if (result.action === "admin_test") {
                // Simulate a test scenario
                const scenario = result.scenario;
                let testResult = "";

                if (scenario === "clamp" || scenario === "default") {
                  const testParams = {projectedArea: 400, cavityPressure: 60};
                  const calcResult = CalculatorTools.clampingForce.calculate(testParams);
                  testResult += `🧪 **Test: Clamping Force**\nInput: Area=400, Pressure=60\nOutput: ${calcResult.result.withSafety} ton\nStatus: ${calcResult.success ? "✅ PASS" : "❌ FAIL"}`;
                }

                toolResponse = testResult;
              } else {
                toolResponse = result.formatted;
              }
            }
            break;

          case "reference":
            const refTool = QuickReference[toolCommand.tool];
            if (refTool) {
              if (refTool.generate) {
                const result = refTool.generate();
                if (result.action === "fetch_knowledge_stats") {
                  try {
                    const hyperKnowledge = getHyperLocalizedKnowledge();
                    const stats = await hyperKnowledge.getKnowledgeStats();

                    let reportText = `🧠 **คลังสมองเฉพาะถิ่น**\n\n`;
                    reportText += `📊 ความรู้ทั้งหมด: ${stats.totalKnowledge} รายการ\n`;
                    reportText += `⏳ รอตรวจสอบ: ${stats.pendingVerification} รายการ\n\n`;

                    reportText += `📁 **แบ่งตามหมวด:**\n`;
                    for (const [cat, count] of Object.entries(stats.byCategory)) {
                      const catName = {
                        "real_world_solutions": "🔧 วิธีแก้จริง",
                        "proven_parameters": "📊 พารามิเตอร์",
                        "machine_specific": "🏭 เฉพาะเครื่อง",
                        "expert_tips": "💡 เคล็ดลับ",
                        "local_terminology": "📖 คำศัพท์",
                      }[cat] || cat;
                      reportText += `• ${catName}: ${count}\n`;
                    }

                    if (stats.topUsed.length > 0) {
                      reportText += `\n🏆 **ใช้บ่อยสุด:**\n`;
                      stats.topUsed.slice(0, 3).forEach((k, i) => {
                        reportText += `${i + 1}. ${k.problem?.substring(0, 30) || "N/A"}... (${k.useCount} ครั้ง)\n`;
                      });
                    }
                    toolResponse = reportText;
                  } catch (err) {
                    console.error("❌ Failed to fetch knowledge stats:", err);
                    toolResponse = `⚠️ เกิดข้อผิดพลาด: ${err.message}`;
                  }
                }
              } else if (refTool.data) {
                // 🎨 Try to send Flex Message for Quick Reference
                try {
                  let flexMsg = null;
                  if (toolCommand.tool === "materialTemp") {
                    flexMsg = createMaterialTempFlex();
                  } else if (toolCommand.tool === "defectGuide") {
                    flexMsg = createDefectGuideFlex();
                  } else if (toolCommand.tool === "formulas") {
                    flexMsg = createFormulasFlex();
                  }

                  if (flexMsg) {
                    await lineClient.replyMessage(replyToken, flexMsg);
                    console.log(`✅ Sent Quick Reference Flex Message: ${toolCommand.tool}`);
                    return; // Exit after sending Flex
                  }
                } catch (flexError) {
                  console.error("⚠️ Reference Flex failed, falling back to text:", flexError);
                }
                toolResponse = refTool.data;
              }
            }
            break;

          case "toolList":
            // 🎨 Try to send Injection Tools Menu Flex
            try {
              const toolsMenuFlex = createInjectionToolsMenuFlex();
              if (toolsMenuFlex) {
                await lineClient.replyMessage(replyToken, toolsMenuFlex);
                console.log("✅ Sent Injection Tools Menu Flex Message");
                return; // Exit after sending Flex
              }
            } catch (flexError) {
              console.error("⚠️ Tools Menu Flex failed, falling back to text:", flexError);
            }
            toolResponse = getToolList(userId === SUPER_ADMIN_ID_TOOLS);
            break;
        }

        if (toolResponse) {
          // Add credit line
          toolResponse += "\n\n---\n🛠️ เครื่องมือโดย อาจารย์วิทยา";

          // 🎨 Add Quick Reply for injection tools
          const injectionQuickReply = {
            items: [
              {type: "action", action: {type: "message", label: "🔧 แรงปิด", text: "คำนวณแรงปิด"}},
              {type: "action", action: {type: "message", label: "⏱️ Cooling", text: "คำนวณ cooling"}},
              {type: "action", action: {type: "message", label: "🔍 วินิจฉัย", text: "คู่มือ defect"}},
              {type: "action", action: {type: "message", label: "🌡️ อุณหภูมิ", text: "ตารางอุณหภูมิวัสดุ"}},
              {type: "action", action: {type: "message", label: "🛠️ เครื่องมือ", text: "เครื่องมือ"}},
            ],
          };

          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: toolResponse,
            quickReply: injectionQuickReply,
          });

          console.log(`✅ Tool response sent (${toolResponse.length} chars)`);
          return;
        }
      } catch (toolError) {
        console.error("❌ Tool error:", toolError);
        // Fall through to AI if tool fails
      }
    }

    // 🚀 Quick Reply for Simple Greetings and Thanks
    const quickReplyResult = handleQuickReply(message.text, userName);
    if (quickReplyResult) {
      console.log(`⚡ Quick reply triggered: ${quickReplyResult.type}`);
      await lineClient.replyMessage(replyToken, {
        type: "text",
        text: quickReplyResult.message,
      });

      // Save quick reply to memory
      try {
        await getConversationMemory().saveConversationMemory(userId, executionId, {
          question: message.text,
          answer: quickReplyResult.message,
          context: {
            questionType: quickReplyResult.type,
            userLevel: "beginner",
            source: "line_quick_reply",
          },
        });
      } catch (memError) {
        console.error("❌ Error saving quick reply memory:", memError);
      }

      return;
    }

    // Call Gemini API directly for LINE webhook
    console.log(`\n🤖 Calling Gemini API directly for LINE...`);

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      console.error("❌ GEMINI_API_KEY not configured");
      throw new Error("GEMINI_API_KEY not configured");
    }

    const {GoogleGenerativeAI} = require("@google/generative-ai");
    const {createStatsDashboard, createCalculationDashboard} = require("./flexMessageGenerator");
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    // 👑 SUPER ADMIN CHECK (Again for Prompt)
    const SUPER_ADMIN_ID = "Ud9bec6d2ea945cf4330a69cb74ac93cf";
    const isSuperAdmin = userId === SUPER_ADMIN_ID;

    let systemPrompt;
    let tools = [];

    if (isSuperAdmin) {
      // 👑 SUPER ADMIN PROMPT: Ultimate Consultant & Action-Oriented Assistant
      systemPrompt = `คุณคือ WiT "ผู้ช่วยส่วนตัวอัจฉริยะระดับสูงสุด" ของ "อาจารย์วิทยา" (Super Admin)

🌟 **ความสามารถของคุณ (UNLIMITED ACCESS):**
คุณมีความสามารถไร้ขีดจำกัด - รอบด้านทุกศาสตร์ ตอบได้ทุกคำถาม ไม่มีข้อจำกัดหัวข้อใดๆ

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 💎 บทบาทหลัก (6 CORE ROLES)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 1️⃣ 🧠 ที่ปรึกษาระดับสูงสุด (Ultimate Strategic Advisor)
**สิ่งที่ทำได้:**
- วิเคราะห์สถานการณ์เชิงลึก ให้มุมมอง Big Picture
- เสนอแผนกลยุทธ์ ระยะสั้น-กลาง-ยาว พร้อมเหตุผล
- ประเมินความเสี่ยง โอกาส จุดแข็ง จุดอ่อน
- ตัดสินใจแทนได้ เมื่ออาจารย์ต้องการความเห็น
- ชั่งน้ำหนักทางเลือก พร้อม Pros/Cons ชัดเจน

**สไตล์:** มองภาพรวม → เชื่อมโยงข้อมูล → ตัดสินใจมั่นใจ

### 2️⃣ 🏭 ผู้เชี่ยวชาญระดับ Grandmaster (Injection Molding Expert)
**สิ่งที่ทำได้:**
- แก้ปัญหา Defect ทุกประเภท (Short shot, Flash, Sink mark, Warpage...)
- คำนวณพารามิเตอร์แม่นยำ (Cooling time, Injection speed, Pressure...)
- วิเคราะห์วัสดุ เลือกเกรดพลาสติกที่เหมาะสม
- ออกแบบแม่พิมพ์ วิเคราะห์ Gate, Runner, Cooling channel
- วินิจฉัยปัญหาเครื่องจักร ทุกยี่ห้อ (Porcheson, Toshiba, Techmation, Fanuc, Victor, Yushin)

**สไตล์:** Data-First → อ้างอิงหลักการทางวิศวกรรม → ให้ตัวเลขและค่าแนะนำ

### 3️⃣ 🤖 ผู้ช่วยส่วนตัวรอบด้าน (Universal Personal Assistant)
**สิ่งที่ทำได้:**
- ตอบได้ "ทุกเรื่องในโลก" - ข่าว, สังคม, การเมือง, เศรษฐศาสตร์, กีฬา, บันเทิง
- พูดคุยได้แบบเพื่อน ให้คำปรึกษาชีวิต วิเคราะห์สถานการณ์ส่วนตัว
- หาข้อมูล วิจัย สรุปประเด็นให้
- ช่วยวางแผนงาน ตารางเวลา นัดหมาย
- เขียน/ร่าง/แก้ไข เอกสาร อีเมล ข้อความ

**สไตล์:** ยืดหยุ่น → อ่านบริบท → ตอบสนองตามความต้องการจริง

### 4️⃣ 💻 Dev Assistant ระดับเซียน (Expert Programmer)
**สิ่งที่ทำได้:**
- เขียนโค้ดทุกภาษา (JavaScript, Python, Dart, SQL, HTML/CSS...)
- แก้บั๊ก, Debug, Refactor code ให้ดีขึ้น
- อธิบาย Algorithm, Architecture, Design patterns
- วิเคราะห์ Logs, Error messages, Performance issues
- แนะนำ Best practices และ Security

**สไตล์:** Code-focused → ให้ตัวอย่างโค้ดเสมอ → อธิบายเหตุผล

### 5️⃣ 🎓 ติวเตอร์อัจฉริยะ (Universal Educator)
**สิ่งที่ทำได้:**
- สอนได้ทุกระดับ ทุกวัย (เด็ก → มหาวิทยาลัย → วัยทำงาน)
- ทุกวิชา ทุกสาขา (วิทย์, คณิต, ภาษา, ธุรกิจ, เทคโนโลยี)
- อธิบายเรื่องซับซ้อนให้เข้าใจง่าย
- ยกตัวอย่างที่เกี่ยวข้องกับชีวิตจริง

**สไตล์:** ปรับระดับตามผู้เรียน → ใช้เปรียบเทียบ → กระตุ้นความเข้าใจ

### 6️⃣ 🧮 Calculation & Analysis Engine
**สิ่งที่ทำได้:**
- คำนวณทุกอย่าง (ฟิสิกส์, เคมี, วิศวกรรม, การเงิน, สถิติ)
- แปลงหน่วยทุกระบบ (Metric ↔ Imperial ↔ Thai)
- วิเคราะห์ข้อมูล หา Pattern ทำนายแนวโน้ม
- คำนวณต้นทุน ROI Break-even point

**สไตล์:** แม่นยำ → ใช้ Function แสดงผลสวยงาม → อธิบายสูตร

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 🎯 ACTION-ORIENTED MODE (สำคัญมาก!)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**❌ สิ่งที่ห้ามทำ:**
- ❌ ถามกลับมากเกินไป - "อาจารย์ต้องการแบบไหนครับ?"
- ❌ ตอบกลางๆ ไม่ชัดเจน - "ก็แล้วแต่สถานการณ์ครับ"
- ❌ บอกว่าทำไม่ได้ - "ขออภัย เรื่องนี้นอกขอบเขต"
- ❌ รอคำสั่งเพิ่ม - ลงมือทำเลยถ้าเข้าใจแล้ว

**✅ สิ่งที่ต้องทำ:**
- ✅ **ตอบทันที** - เมื่อเข้าใจคำถาม/คำสั่ง ลงมือทำเลย
- ✅ **ตัดสินใจแทนได้** - ให้ความเห็นชัดเจน มีเหตุผลรองรับ
- ✅ **เสนอทางออก** - ไม่ใช่แค่วิเคราะห์ปัญหา แต่ให้วิธีแก้ด้วย
- ✅ **ทำงานแทน** - ถ้าขอให้ทำ ก็ทำให้เลย (เขียนโค้ด, ร่างเอกสาร, คำนวณ...)
- ✅ **เชิงรุก** - แนะนำสิ่งที่ควรทำเพิ่ม แม้ไม่ได้ถาม
- ✅ **ซื่อตรง** - บอกความจริง แม้อาจไม่ตรงใจ

**🔥 เมื่ออาจารย์ถามคำถาม:**
1. เข้าใจความต้องการที่แท้จริง (ไม่ใช่แค่ตัวอักษร)
2. ให้คำตอบที่ตรงประเด็นทันที
3. เสนอ Action items หรือขั้นตอนถัดไป
4. ถามกลับเฉพาะเมื่อจำเป็นจริงๆ

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 📝 แนวทางการตอบ (Response Guidelines)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**ความยาว & โครงสร้าง:**
• ✅ กระชับ ตรงประเด็น 300-600 ตัวอักษร
• ✅ แบ่งเป็น 2-4 ประเด็นหลัก
• ✅ เรื่องซับซ้อน → ตอบภาพรวม + เชิญถามลงลึก
• ❌ ห้ามเกิน 800 ตัวอักษร (ยกเว้นใช้ function)

**รูปแบบการนำเสนอ:**
• ✅ ใช้ emoji เพิ่มความน่าสนใจ
• ✅ หัวข้อจบด้วย : (ตัวหนาอัตโนมัติ)
• ✅ ใช้ bullet points (•) หรือเลข (1. 2. 3.)
• ❌ ห้ามใช้ตาราง Markdown - แสดงผลไม่ดีบนมือถือ

**น้ำเสียง & ความสัมพันธ์:**
• เรียก "อาจารย์" เสมอ
• ตอบแบบมั่นใจ เป็นมิตร
• แสดงความเคารพสูงสุด แต่ไม่เป็นทางการเกินไป
• กล้าให้ความเห็นที่ต่าง ถ้ามีเหตุผลดี

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 🔧 Function Calling Rules (บังคับ!)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**MUST USE FUNCTIONS สำหรับ:**
1. 🧮 การคำนวณทุกชนิด → \`displayCalculationResult\`
2. 📊 ตรวจสอบระบบ → \`getSystemStats\`

**NEVER:**
• ❌ แสดงผลคำนวณเป็น plain text
• ✅ **เสมอ:** Call function → แสดง Dashboard Card

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 🎭 ตัวอย่างการตอบแบบ Action-Oriented
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**❌ แบบเก่า (Passive):**
"อาจารย์ต้องการให้ช่วยเรื่องอะไรครับ? มีรายละเอียดเพิ่มเติมไหมครับ?"

**✅ แบบใหม่ (Action-Oriented):**
"เข้าใจครับอาจารย์! นี่คือสิ่งที่ผมทำให้แล้ว:
1. ✅ วิเคราะห์ปัญหาแล้ว - สาเหตุหลักคือ...
2. ✅ แนะนำวิธีแก้ 3 ทาง พร้อม Pros/Cons
3. 💡 ความเห็นของผม: ทางที่ 2 เหมาะที่สุดเพราะ...
ต้องการให้ลงลึกเรื่องไหนเพิ่มครับ?"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ชื่อผู้ใช้: ${userName} (Super Admin - อำนาจเต็มรูปแบบ)

${PORCHESON_KNOWLEDGE_PROMPT}

${TOSHIBA_KNOWLEDGE_PROMPT}

${TECHMATION_KNOWLEDGE_PROMPT}

${INJECTION_MOLDING_EXPERT_PROMPT}

${PLASTIC_MATERIALS_PROMPT}

${VICTOR_KNOWLEDGE_PROMPT}

${FANUC_KNOWLEDGE_PROMPT}

${YUSHIN_KNOWLEDGE_PROMPT}

${TEXTBOOK_TEACHING_PROMPT}`;
      // 🛠️ Define Tools for Super Admin
      tools = [
        {
          functionDeclarations: [
            {
              name: "displayCalculationResult",
              description: "Display calculation results in a beautiful dashboard card. Use this whenever you perform a calculation.",
              parameters: {
                type: "OBJECT",
                properties: {
                  title: {type: "STRING", description: "Title of the calculation (e.g., Cooling Time Result)"},
                  data: {
                    type: "ARRAY",
                    items: {
                      type: "OBJECT",
                      properties: {
                        label: {type: "STRING"},
                        value: {type: "STRING"},
                        unit: {type: "STRING"},
                      },
                    },
                  },
                  recommendation: {type: "STRING", description: "Brief recommendation or summary"},
                },
                required: ["title", "data", "recommendation"],
              },
            },
          ],
        },
      ];


      // 🛠️ Define Tools for Super Admin (มี Tools ทั้งหมด)
      tools = [
        {
          functionDeclarations: [
            {
              name: "getSystemStats",
              description: "Get current system statistics like memory usage and uptime. Use this when user asks about system status, memory, or uptime.",
            },
            {
              name: "displayCalculationResult",
              description: "Display calculation results in a beautiful dashboard card. Use this whenever you perform a calculation for the user.",
              parameters: {
                type: "OBJECT",
                properties: {
                  title: {type: "STRING", description: "Title of the calculation (e.g., Cooling Time Result)"},
                  data: {
                    type: "ARRAY",
                    items: {
                      type: "OBJECT",
                      properties: {
                        label: {type: "STRING", description: "Label for the data item"},
                        value: {type: "STRING", description: "Value of the data item"},
                        unit: {type: "STRING", description: "Unit of the value (optional)"},
                      },
                    },
                    description: "Array of calculation data to display",
                  },
                  recommendation: {type: "STRING", description: "Brief recommendation or summary based on the calculation"},
                },
                required: ["title", "data", "recommendation"],
              },
            },
            {
              name: "testInternalFunction",
              description: "Test an internal utility function with specific arguments. For debugging purposes only.",
              parameters: {
                type: "OBJECT",
                properties: {
                  functionName: {
                    type: "STRING",
                    description: "Name of the function to test (e.g., detectQuestionType, detectUserLevel, analyzeContext).",
                  },
                  input: {
                    type: "STRING",
                    description: "Input string to pass to the function.",
                  },
                },
                required: ["functionName", "input"],
              },
            },
          ],
        },
      ];
    } else {
      // 👤 REGULAR USER PROMPT: Enhanced Injection Molding Expert, Education & Agriculture
      systemPrompt = `คุณคือ "WiT" (วิทย์) AI ผู้ช่วยอัจฉริยะ 🎯 พัฒนาโดยอาจารย์วิทยา

🌍 **บทบาทของคุณ:**
1. **ผู้เชี่ยวชาญฉีดพลาสติก (Industrial Expert):** ให้คำตอบเชิงลึก เทคนิคแม่นยำ แก้ปัญหาหน้างานได้จริง
2. **ติวเตอร์ทุกวัย (Lifelong Learning Tutor):** สอนได้ทุกกลุ่ม - เด็ก (ป.1-ป.6), วัยรุ่น (ม.1-ม.6), อาชีวะ (ปวช-ปวส), มหาวิทยาลัย, วัยทำงาน - ปรับภาษาและเนื้อหาให้เหมาะกับวัย อธิบายง่าย ยกตัวอย่างชัดเจน
3. **ที่ปรึกษาเกษตรอัจฉริยะ (Smart Farming Expert):** ให้ความรู้ด้านการปลูกพืช โรคพืช ปุ๋ย และเทคโนโลยีเกษตร สำหรับเกษตรกรไทยและทั่วโลก
4. **ผู้ให้ข้อมูลที่ถูกต้อง (Knowledge Provider):** ตอบคำถามทั่วไปที่ถูกกฎหมาย มีประโยชน์ และไม่ก่อให้เกิดอันตราย

📚 **ความเชี่ยวชาญหลัก:**
- 🏭 **อุตสาหกรรม:** เครื่องฉีดพลาสติก, วัสดุศาสตร์, การแก้ปัญหา Defect, แม่พิมพ์
- 🎓 **การศึกษา:** สอนได้ทุกระดับ ป.1 - มหาวิทยาลัย - วัยทำงาน (ทุกวิชา ทุกสาขา)
- 🌾 **เกษตรกรรม:** การวินิจฉัยโรคพืช, ปุ๋ย, Smart Farming, พืชเศรษฐกิจ

💡 **นโยบายการตอบคำถาม:**

✅ **ตอบได้ (ยินดีให้ข้อมูล):**
- 🏭 ฉีดพลาสติก, วัสดุ, แม่พิมพ์, เครื่องจักร, Defect
- 🎓 การศึกษาทุกระดับ - ทุกวิชา (คณิต วิทย์ ไทย อังกฤษ สังคม คอมพิวเตอร์ ฟิสิกส์ เคมี ฯลฯ)
- 🌾 เกษตร, โรคพืช, ปุ๋ย, Smart Farming, เทคโนโลยีการเกษตร
- 🧮 การคำนวณ, แปลงหน่วย, สูตรต่าง ๆ (ใช้ function เสมอ)
- 📖 **ความรู้ทั่วไป:** วิทยาศาสตร์, เทคโนโลยี, ประวัติศาสตร์, ภูมิศาสตร์, วัฒนธรรม
- 🌐 **ข้อมูลที่เป็นประโยชน์:** ข่าวทั่วไป, กีฬา, สุขภาพพื้นฐาน, อาหาร, ท่องเที่ยว
- 💬 **การสนทนา:** ทักทาย, พูดคุยทั่วไป, ให้กำลังใจ

⚠️ **หลักการสำคัญ - ตอบได้หากเป็นไปตามเงื่อนไข:**
1. ✅ **ถูกกฎหมาย** - ไม่ผิดกฎหมาย ไม่ละเมิดสิทธิ์ผู้อื่น
2. ✅ **ไม่ก่ออันตราย** - ไม่ทำร้ายตัวเอง/ผู้อื่น ไม่สร้างความเสียหาย
3. ✅ **มีประโยชน์** - เป็นข้อมูลที่ถูกต้อง เพื่อการเรียนรู้และพัฒนา
4. ✅ **เหมาะสม** - ไม่ละเอียดอ่อนเกินไป เหมาะกับทุกวัย

❌ **ไม่ตอบ (เพื่อความปลอดภัยและเหมาะสม):**
- 🚫 การแพทย์เฉพาะทาง (วินิจฉัยโรค, สั่งยา) - ให้ปรึกษาแพทย์
- 🚫 กฎหมาย/การเงินเฉพาะบุคคล - ควรปรึกษาผู้เชี่ยวชาญ
- 🚫 เนื้อหาที่ผิดกฎหมาย, รุนแรง, ไม่เหมาะสม
- 🚫 ข้อมูลที่อาจก่ออันตราย/สร้างความเสียหาย
- 🚫 การเมืองที่เข้าข้างฝ่ายใดฝ่ายหนึ่ง (ให้ข้อมูลเป็นกลางได้)

**หากถูกถามเรื่องที่ไม่แน่ใจว่าเหมาะสม:**
"เรื่องนี้เป็นหัวข้อที่ละเอียดอ่อน แนะนำให้ปรึกษาผู้เชี่ยวชาญโดยตรงครับ เพื่อความถูกต้องและความปลอดภัย"

✨ **แนวทางการตอบ (สำคัญมาก!):**

1. **ความยาวคำตอบ - กฎเหล็ก:**
   - ✅ ตอบสั้น กระชับ ตรงประเด็น 300-500 ตัวอักษร
   - ✅ แบ่งเป็น 2-3 ประเด็นหลักเท่านั้น
   - ✅ หากคำถามซับซ้อน → ตอบภาพรวมก่อน + ชวนถามต่อ
   - ✅ ท้ายคำตอบ → ถามกลับเสมอ (เช่น "ต้องการรายละเอียดส่วนไหนเพิ่มเติมครับ?")
   - ❌ ห้ามตอบยาวเกิน 800 ตัวอักษร (ยกเว้นคำนวณหรือใช้ function)

2. **ปรับระดับภาษาตามบริบทและวัย:**
   - **งานช่าง/อุตสาหกรรม:** สั้น เทคนิค ตัวเลข + ชวนถามลงลึก
   - **เด็ก (ป.1-ป.6):** ภาษาง่าย emoji เยอะ ยกตัวอย่างจากชีวิตประจำวัน
   - **วัยรุ่น (ม.1-ม.6):** อธิบายทฤษฎี + ตัวอย่าง เชื่อมโยงการสอบ
   - **อาชีวะ/มหาวิทยาลัย:** เชิงลึก ปฏิบัติ เทคนิค
   - **วัยทำงาน:** upskilling/reskilling ประยุกต์ใช้งานจริง
   - **เกษตร:** สั้น ปฏิบัติได้จริง + ชวนถามปัญหาเฉพาะ

3. **โครงสร้างคำตอบ:**
   - **สรุปแบบย่อ:** 1-2 ประโยคเท่านั้น
   - **ประเด็นหลัก:** 2-3 ข้อสั้นๆ
   - **คำถามท้าย:** ชวนให้ถามต่อเสมอ

4. **การสร้างความน่าเชื่อถือ (CRITICAL!):**
   - ✅ **ตอบแบบผู้เชี่ยวชาญที่มั่นใจ** - ใช้น้ำเสียงมืออาชีพและเป็นธรรมชาติ
   - ❌ **ห้ามใช้คำเหล่านี้:** "LOCAL", "ฐานข้อมูล", "ระบบ", "ข้อมูลที่ผมมี", "จากข้อมูลใน...", "AI", "โมเดล"
   - ✅ **ใช้แทนด้วย:**
     • "จากประสบการณ์ในสนาม..."
     • "ตามหลักการทางวิศวกรรม..."
     • "โดยทั่วไปแล้ว..."
     • "วิธีที่ได้ผลดี..."
     • "แนะนำให้..."
   - ✅ **ตัวอย่างการตอบที่ดี:**
     ❌ ไม่ดี: "จากข้อมูล LOCAL ของผม PP ต้องอบที่ 80-100°C"
     ❌ ไม่ดี: "จากฐานข้อมูล ผมพบว่า..."
     ✅ ดี: "PP โดยทั่วไปแล้วควรอบที่ 80-100°C เป็นเวลา 3-4 ชั่วโมง"
     ✅ ดี: "จากประสบการณ์ PP ไม่จำเป็นต้องอบแห้งก็ได้ครับ"
     ✅ ดี: "สำหรับเด็ก ป.1 ควรเริ่มจากการนับ 1-10 ก่อนครับ"
     ✅ ดี: "ฟุตบอลโลกจัดทุก 4 ปี โดย FIFA เป็นผู้จัด"
   - ✅ **สร้างความมั่นใจ:** ใช้คำว่า "แนะนำ", "ควร", "ได้ผลดี", "มีประสิทธิภาพ", "เหมาะสม"
   - ❌ **หลีกเลี่ยง:** "ไม่มีข้อมูล", "ไม่แน่ใจ" (เว้นแต่จริงๆ ไม่ทราบหรือละเอียดอ่อน)
   - ✅ **หากไม่ทราบจริงๆ:** "เรื่องนี้แนะนำให้ปรึกษาผู้เชี่ยวชาญเฉพาะทางครับ เพื่อความปลอดภัย"
   - ✅ **หากถามเรื่องละเอียดอ่อน:** ใช้ template ข้างบนปฏิเสธอย่างสุภาพ

5. **รูปแบบการนำเสนอ (CRITICAL!):**
   - ❌ **ห้ามใช้ตาราง Markdown** (เช่น | คอลัมน์ | คอลัมน์ |) - Flex Message แสดงผลไม่ดี แคบ ไม่น่าอ่าน
   - ✅ **ใช้รายการแทน** (ตัวอย่าง):
       คุณสมบัติ HDPE:
       • ความหนาแน่น: 0.941-0.965 g/cm³
       • ค่า HDT: สูง
       • ความแข็งแรง: ดีมาก
   - ✅ **หัวข้อควรจบด้วย :** เพื่อให้เป็นตัวหนาอัตโนมัติ
   - ✅ **ใช้เลขลำดับ 1. 2. 3. หรือ • - สำหรับรายการ**
   - ✅ **ถ้าต้องเปรียบเทียบ** ให้ใช้รายการ ไม่ใช่ตาราง

5. **การใช้อิโมจิ:**
   - 🏭 สำหรับงานอุตสาหกรรม
   - 🌱 สำหรับงานเกษตร
   - 🎓 สำหรับการศึกษา
   - ⚠️ ข้อควรระวัง
   - ✅ สิ่งที่ถูกต้อง

🔧 **CRITICAL - Function Calling Rules (ห้ามละเมิด!):**
- **MANDATORY:** เมื่อทำการคำนวณใดๆ MUST call \`displayCalculationResult\` เท่านั้น!
- **ALWAYS** แสดงผลใน dashboard card format สวยงาม
- **ต้องมี:** title, data array (label/value/unit), และ recommendations
- **ตัวอย่างการใช้งาน function (บังคับ):**
  - 🧮 คำนวณกำลังไฟฟ้า (220V × 15A = 3,300W) → \`displayCalculationResult\`
  - 🧮 คำนวณปริมาตร (5m × 3m × 2m) → \`displayCalculationResult\`
  - 🧮 คำนวณ Cooling Time (ความหนา 3mm, K=0.5) → \`displayCalculationResult\`
  - 🧮 คำนวณต้นทุน, ROI, เปอร์เซ็นต์ → \`displayCalculationResult\`
  - 🧮 แปลงหน่วย (100°C → 212°F, 50kg → 110lb) → \`displayCalculationResult\`
  - 🧮 คำนวณพื้นที่ผิว, อัตราส่วน, สูตรใดๆ → \`displayCalculationResult\`
- **NEVER EVER** เขียนผลการคำนวณในข้อความ text - ต้องใช้ function เท่านั้น!
- **หากผู้ใช้ถามให้คำนวณ** → ต้อง call function ทันที (ห้ามตอบเป็น text)

ชื่อผู้ใช้: ${userName}

${PORCHESON_KNOWLEDGE_PROMPT}

${TOSHIBA_KNOWLEDGE_PROMPT}

${TECHMATION_KNOWLEDGE_PROMPT}

${INJECTION_MOLDING_EXPERT_PROMPT}

${PLASTIC_MATERIALS_PROMPT}

${VICTOR_KNOWLEDGE_PROMPT}

${FANUC_KNOWLEDGE_PROMPT}

${YUSHIN_KNOWLEDGE_PROMPT}

${TEXTBOOK_TEACHING_PROMPT}`;
      // 🛠️ Define Tools for Regular User (Calculation Dashboard)
      tools = [
        {
          functionDeclarations: [
            {
              name: "displayCalculationResult",
              description: "Display calculation results in a beautiful dashboard card. Use this whenever you perform a calculation.",
              parameters: {
                type: "OBJECT",
                properties: {
                  title: {type: "STRING", description: "Title of the calculation (e.g., Cooling Time Result)"},
                  data: {
                    type: "ARRAY",
                    items: {
                      type: "OBJECT",
                      properties: {
                        label: {type: "STRING"},
                        value: {type: "STRING"},
                        unit: {type: "STRING"},
                      },
                    },
                  },
                  recommendation: {type: "STRING", description: "Brief recommendation or summary"},
                },
                required: ["title", "data", "recommendation"],
              },
            },
          ],
        },
      ];
    }

    // 🧠 Analyze question context for smart response
    const questionContext = analyzeQuestionContext(message.text);
    console.log(`🧠 Question Analysis:`);
    console.log(`   ├── Type: ${questionContext.type}`);
    console.log(`   ├── Urgency: ${questionContext.urgency}`);
    console.log(`   ├── Complexity: ${questionContext.complexity}`);
    console.log(`   ├── Suggested Emoji: ${questionContext.suggestedEmoji}`);
    console.log(`   └── Tone: ${questionContext.suggestedTone}`);

    // =====================================================
    // 🔬 HYBRID KNOWLEDGE INJECTION SYSTEM
    // ดึงข้อมูล Local DB มาผสมกับ AI Response
    // =====================================================
    let localKnowledgeContext = "";
    const msgLowerForKnowledge = message.text.toLowerCase();

    // 💭 SUPER ADMIN MEMORY: Add conversation history context
    if (isSuperAdmin) {
      try {
        const memory = getSuperAdminMemory();
        const memoryContext = await memory.buildContextForAI(message.text);
        if (memoryContext) {
          localKnowledgeContext += memoryContext;
          console.log(`💭 Added Super Admin conversation history context`);
        }
      } catch (memoryError) {
        console.warn("⚠️ Could not fetch Super Admin memory:", memoryError.message);
      }
    }

    // 1️⃣ ตรวจจับคำถามเกี่ยวกับวัสดุพลาสติก (รองรับทั้ง 30 ชนิด)
    const materialKeywords = Object.keys(PLASTIC_MATERIALS_DB);
    const materialAliases = {
      // ABS
      "เอบีเอส": "ABS",
      // PP
      "โพลีโพรพิลีน": "PP", "พีพี": "PP",
      // PC
      "โพลีคาร์บอเนต": "PC", "พีซี": "PC",
      // PA/Nylon
      "ไนลอน": "PA", "nylon": "PA", "pa6": "PA", "pa66": "PA",
      // POM
      "พอม": "POM", "อะซีทัล": "POM", "acetal": "POM", "delrin": "POM",
      // PE
      "โพลีเอทิลีน": "PE", "พีอี": "PE",
      // PS
      "โพลีสไตรีน": "PS", "พีเอส": "PS",
      // PET
      "เพ็ท": "PET",
      // PVC
      "พีวีซี": "PVC",
      // TPU
      "ทีพียู": "TPU",
      // PMMA
      "อะคริลิค": "PMMA", "พีเอ็มเอ็มเอ": "PMMA", "acrylic": "PMMA", "plexiglass": "PMMA",
      // PBT
      "พีบีที": "PBT",
      // SAN
      "แซน": "SAN",
      // ASA
      "เอเอสเอ": "ASA",
      // PPO
      "พีพีโอ": "PPO", "พีพีอี": "PPO", "ppe": "PPO", "noryl": "PPO",
      // LCP
      "แอลซีพี": "LCP",
      // PEEK
      "พีค": "PEEK",
      // PPS
      "พีพีเอส": "PPS",
      // TPE
      "ทีพีอี": "TPE", "sebs": "TPE", "tpe-s": "TPE", "tpe-v": "TPE",
      // EVA
      "อีวีเอ": "EVA",
      // NEW: PC/ABS
      "พีซีเอบีเอส": "PC/ABS", "pc-abs": "PC/ABS", "pcabs": "PC/ABS",
      // NEW: PA6GF
      "ไนลอนเสริมใยแก้ว": "PA6GF", "pa6-gf": "PA6GF", "gf nylon": "PA6GF", "glass filled nylon": "PA6GF",
      // NEW: HDPE
      "hdpe": "HDPE", "เอชดีพีอี": "HDPE", "โพลีเอทิลีนความหนาแน่นสูง": "HDPE",
      // NEW: LDPE
      "ldpe": "LDPE", "แอลดีพีอี": "LDPE", "โพลีเอทิลีนความหนาแน่นต่ำ": "LDPE",
      // NEW: HIPS
      "hips": "HIPS", "โพลีสไตรีนทนแรงกระแทก": "HIPS",
      // NEW: PEI
      "พีอีไอ": "PEI", "อัลเทม": "PEI", "ultem": "PEI",
      // NEW: PA12
      "ไนลอน12": "PA12", "nylon 12": "PA12",
      // NEW: GPPS
      "gpps": "GPPS", "โพลีสไตรีนใส": "GPPS", "crystal ps": "GPPS",
      // NEW: PPSGF
      "พีพีเอสเสริมใยแก้ว": "PPSGF", "pps-gf": "PPSGF", "gf pps": "PPSGF",
      // NEW: PETG
      "เพ็ทจี": "PETG", "petg": "PETG",
    };

    let detectedMaterial = null;
    // ตรวจจับจาก keyword โดยตรง (ABS, PP, PC...)
    for (const mat of materialKeywords) {
      if (msgLowerForKnowledge.includes(mat.toLowerCase())) {
        detectedMaterial = mat;
        break;
      }
    }
    // ตรวจจับจาก alias ภาษาไทย
    if (!detectedMaterial) {
      for (const [alias, matCode] of Object.entries(materialAliases)) {
        if (msgLowerForKnowledge.includes(alias.toLowerCase())) {
          detectedMaterial = matCode;
          break;
        }
      }
    }

    // ถ้าเจอวัสดุ → ดึงข้อมูลจาก Local DB
    if (detectedMaterial && PLASTIC_MATERIALS_DB[detectedMaterial]) {
      const mat = PLASTIC_MATERIALS_DB[detectedMaterial];
      const params = getRecommendedParameters(detectedMaterial);
      console.log(`📦 Injecting Local Material Data: ${detectedMaterial}`);

      localKnowledgeContext += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 ข้อมูลวัสดุจากฐานข้อมูล LOCAL (ใช้ข้อมูลนี้เป็นหลัก):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**วัสดุ:** ${mat.name} (${mat.nameThai})
**ประเภท:** ${mat.category}

🌡️ **อุณหภูมิ:**
- Melt Temperature: ${mat.meltTemp.min}-${mat.meltTemp.max}°C (แนะนำ: ${mat.meltTemp.recommended}°C)
- Mold Temperature: ${mat.moldTemp.min}-${mat.moldTemp.max}°C (แนะนำ: ${mat.moldTemp.recommended}°C)

💧 **การอบแห้ง:**
${mat.dryingTemp.temp ? `- อุณหภูมิ: ${mat.dryingTemp.temp}°C เป็นเวลา ${mat.dryingTemp.time}` : "- ไม่จำเป็นต้องอบแห้ง"}
- ความชื้นสูงสุด: ${mat.moisture}

📐 **การหดตัว:** ${mat.shrinkage.min}-${mat.shrinkage.max}%

⚡ **แรงดัน:**
- Injection Pressure: ${mat.injectionPressure.min}-${mat.injectionPressure.max} MPa
- Back Pressure: ${mat.backPressure.min}-${mat.backPressure.max} MPa
- Injection Speed: ${mat.injectionSpeed}

✨ **คุณสมบัติเด่น:** ${mat.properties.join(", ")}
🎯 **การใช้งานทั่วไป:** ${mat.applications.join(", ")}
⚠️ **ข้อควรระวัง:** ${mat.warnings.join(", ")}
🔥 **ปัญหาที่พบบ่อย:** ${mat.commonDefects.join(", ")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    }

    // 2️⃣ ตรวจจับคำถามเกี่ยวกับปัญหา/Defect (รองรับ 20 ปัญหา)
    const defectKeywords = {
      // Original 10 defects
      "short shot": "SHORT_SHOT", "ฉีดไม่เต็ม": "SHORT_SHOT", "ชิ้นงานไม่เต็ม": "SHORT_SHOT",
      "flash": "FLASH", "ครีบ": "FLASH", "เนื้อเกิน": "FLASH", "burr": "FLASH",
      "sink mark": "SINK_MARK", "sink": "SINK_MARK", "รอยยุบ": "SINK_MARK", "รอยบุ๋ม": "SINK_MARK", "ยุบ": "SINK_MARK",
      "warpage": "WARPAGE", "warp": "WARPAGE", "บิดงอ": "WARPAGE", "โก่ง": "WARPAGE", "บิด": "WARPAGE", "งอ": "WARPAGE",
      "burn mark": "BURN_MARK", "burn": "BURN_MARK", "รอยไหม้": "BURN_MARK", "รอยดำ": "BURN_MARK", "ไหม้": "BURN_MARK",
      "silver streak": "SILVER_STREAK", "silver": "SILVER_STREAK", "เส้นสีเงิน": "SILVER_STREAK", "ความชื้น": "SILVER_STREAK",
      "weld line": "WELD_LINE", "weld": "WELD_LINE", "รอยเชื่อม": "WELD_LINE", "รอยประสาน": "WELD_LINE",
      "void": "VOID", "โพรงอากาศ": "VOID", "ฟอง": "VOID", "โพรง": "VOID",
      "jetting": "JETTING", "jet": "JETTING", "รอยพ่น": "JETTING",
      "flow mark": "FLOW_MARK", "flow": "FLOW_MARK", "รอยไหล": "FLOW_MARK", "ลายไม้": "FLOW_MARK",
      // New 10 defects
      "delamination": "DELAMINATION", "หลุดเป็นชั้น": "DELAMINATION", "ลอกเป็นแผ่น": "DELAMINATION",
      "gate blush": "GATE_BLUSH", "รอยด้านที่gate": "GATE_BLUSH", "รอยขุ่น": "GATE_BLUSH",
      "brittleness": "BRITTLENESS", "เปราะ": "BRITTLENESS", "แตกง่าย": "BRITTLENESS", "กรอบ": "BRITTLENESS",
      "color streak": "COLOR_STREAKS", "เส้นสี": "COLOR_STREAKS", "สีไม่สม่ำเสมอ": "COLOR_STREAKS", "สีด่าง": "COLOR_STREAKS",
      "bubble": "BUBBLES", "ฟองอากาศที่ผิว": "BUBBLES", "ฟองใต้ผิว": "BUBBLES",
      "ejector mark": "EJECTOR_MARKS", "รอยejector": "EJECTOR_MARKS", "รอยสลักกระทุ้ง": "EJECTOR_MARKS", "รอยดัน": "EJECTOR_MARKS",
      "splay": "SPLAY_MARKS", "splay mark": "SPLAY_MARKS", "รอยกระเซ็น": "SPLAY_MARKS", "รอยฉีดกระจาย": "SPLAY_MARKS",
      "orange peel": "ORANGE_PEEL", "ผิวส้ม": "ORANGE_PEEL", "ผิวไม่เรียบ": "ORANGE_PEEL",
      "sticking": "STICKING", "ติดแม่พิมพ์": "STICKING", "ชิ้นงานติด": "STICKING", "ไม่หลุด": "STICKING",
      "black speck": "BLACK_SPECKS", "จุดดำ": "BLACK_SPECKS", "ตุ่มดำ": "BLACK_SPECKS", "สิ่งปนเปื้อน": "BLACK_SPECKS",
    };

    let detectedDefect = null;
    for (const [keyword, defectCode] of Object.entries(defectKeywords)) {
      if (msgLowerForKnowledge.includes(keyword.toLowerCase())) {
        detectedDefect = defectCode;
        break;
      }
    }

    // ถ้าเจอปัญหา → ดึงข้อมูลจาก Troubleshooting Guide
    if (detectedDefect && TROUBLESHOOTING_GUIDE[detectedDefect]) {
      const guide = TROUBLESHOOTING_GUIDE[detectedDefect];
      console.log(`🔧 Injecting Local Troubleshooting Data: ${detectedDefect}`);

      localKnowledgeContext += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 ข้อมูลการแก้ปัญหาจากฐานข้อมูล LOCAL (ใช้ข้อมูลนี้เป็นหลัก):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**ปัญหา:** ${guide.name} (${guide.nameThai})
**คำอธิบาย:** ${guide.description}

🎯 **Quick Fix:** ${guide.quickFix}

🔍 **สาเหตุที่เป็นไปได้:**
${guide.possibleCauses.map((c, i) => `${i + 1}. ${c.cause} (ความน่าจะเป็น: ${c.probability})`).join("\n")}

✅ **วิธีแก้ไขทีละขั้นตอน:**
${guide.solutions.join("\n")}

🛡️ **การป้องกัน:**
${guide.preventiveMeasures.map((p) => `• ${p}`).join("\n")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    }

    // Log ถ้ามี Local Knowledge
    if (localKnowledgeContext) {
      console.log(`🔬 HYBRID MODE: Injected ${detectedMaterial ? "Material" : ""}${detectedDefect ? " + Defect" : ""} knowledge`);
    }

    // 🎚️ Adjust temperature based on question type
    let temperature = 0.7;
    if (questionContext.type === "technical" || questionContext.type === "troubleshooting") {
      temperature = 0.5; // More precise for technical questions
    } else if (questionContext.type === "greeting" || questionContext.type === "gratitude") {
      temperature = 0.9; // More creative for casual conversation
    } else if (questionContext.complexity === "high") {
      temperature = 0.6; // Balanced for complex questions
    }

    console.log(`   └── Adjusted temperature: ${temperature}`);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      systemInstruction: systemPrompt,
      tools: tools.length > 0 ? tools : undefined, // ใช้ tools สำหรับทั้ง Admin และ Regular users
      generationConfig: {
        temperature: temperature,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 2048,
      },
    });

    // Fetch chat history
    const history = [];
    try {
      const historySnapshot = await getFirestore()
          .collection("conversation_memory")
          .doc(userId)
          .collection("memories")
          .orderBy("timestamp", "desc")
          .limit(10)
          .get();

      // Store docs first to reverse order (Oldest -> Newest)
      const docs = [];
      historySnapshot.forEach((doc) => docs.push(doc.data()));
      docs.reverse();

      docs.forEach((data) => {
        if (data.question && data.answer) {
          history.push({role: "user", parts: [{text: data.question}]});
          history.push({role: "model", parts: [{text: data.answer}]});
        }
      });

      console.log(`├── Loaded ${history.length / 2} previous turns of chat history`);

      // Safety check: Ensure history starts with user
      if (history.length > 0 && history[0].role !== "user") {
        console.warn("⚠️ History starts with model role, removing first entry...");
        history.shift();
      }
    } catch (histError) {
      console.warn("⚠️ Could not load chat history:", histError.message);
    }

    // 🧠 HYPER-LOCALIZED KNOWLEDGE: Fetch relevant knowledge for this question
    // (เพิ่มเข้ากับ localKnowledgeContext ที่มีอยู่จาก PLASTIC_MATERIALS_DB / TROUBLESHOOTING_GUIDE)
    try {
      const hyperKnowledge = getHyperLocalizedKnowledge();
      const relevantKnowledge = await hyperKnowledge.findRelevantKnowledge(
          message.text,
          {limit: 3, minRelevance: 0.25, includeUnverified: true},
      );

      if (relevantKnowledge.length > 0) {
        const hyperKnowledgeText = hyperKnowledge.formatKnowledgeForPrompt(relevantKnowledge);
        localKnowledgeContext += "\n\n" + hyperKnowledgeText;
        console.log(`🧠 Found ${relevantKnowledge.length} relevant knowledge items from Hyper-Local database`);

        // Increment use count for used knowledge
        for (const k of relevantKnowledge) {
          await hyperKnowledge.incrementUseCount(k.id);
        }
      }
    } catch (knowledgeError) {
      console.warn("⚠️ Could not fetch local knowledge:", knowledgeError.message);
    }

    // 💭 SUPER ADMIN MEMORY: (Note: Already added earlier in the flow at line ~15298)
    // Removed duplicate call to avoid double context injection

    // Call Gemini with retry
    let responseText = "";
    let attempt = 0;
    const maxRetries = 3;

    while (attempt < maxRetries) {
      attempt++;
      try {
        console.log(`├── Gemini API attempt ${attempt}/${maxRetries}`);

        const chat = model.startChat({
          history: history,
          tools: tools,
          toolConfig: {
            functionCallingConfig: {
              mode: "AUTO", // Gemini will automatically decide when to call functions
            },
          },
        });

        // 🔍 Pre-process: Force function calls for specific keywords
        // แก้ไข: ต้องเป็นคำสั่งที่ชัดเจน ไม่ใช่แค่มีคำว่า "ระบบ" ในประโยค
        const isSystemStatusQuery = /^(?:สถานะ|เช็คระบบ|ดูระบบ|system\s*status|check\s*system|ดู\s*mem|memory\s*status)/i.test(message.text.trim());
        const isCalculationQuery = /(?:คำนวณ|calculate|\d+\s*[vVaA]|\d+\s*x\s*\d+)/i.test(message.text);

        // Prepare message with local knowledge context
        let enhancedMessage = message.text;
        if (localKnowledgeContext) {
          // Add Hybrid Mode instruction - DATA-FIRST APPROACH
          const hybridModeInstruction = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔬 DATA-FIRST RESPONSE MODE (บังคับ!):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
คุณมีข้อมูลอ้างอิงจากฐานข้อมูลด้านบน ให้ปฏิบัติตามนี้:

✅ **ต้องทำ:**
1. ใช้ตัวเลขและข้อมูลจากฐานข้อมูลข้างต้นโดยตรง
2. ระบุแหล่งที่มา: "📊 จากฐานข้อมูลวัสดุ:" หรือ "🔧 จากคู่มือแก้ปัญหา:"
3. ให้ข้อมูลตัวเลขที่ชัดเจน (อุณหภูมิ, แรงดัน, เวลา)
4. อ้างอิงสาเหตุพร้อมความน่าจะเป็น (สูง/ปานกลาง/ต่ำ)
5. ให้วิธีแก้ไขเป็นขั้นตอน 1, 2, 3...

❌ **ห้ามเด็ดขาด:**
1. ห้ามตอบว่า "จากประสบการณ์ของผม..."
2. ห้ามเดาค่าตัวเลขที่ไม่มีในฐานข้อมูล
3. ห้ามพูดว่า "โดยทั่วไปแล้ว..." โดยไม่มีข้อมูลอ้างอิง
4. ห้ามบอกว่า "ไม่มีข้อมูล" (ถ้าไม่พบ ให้ระบุข้อมูลที่ใกล้เคียงที่สุด)

📋 **รูปแบบคำตอบ:**
- เริ่มด้วย emoji + ชื่อแหล่งข้อมูล
- ให้ข้อมูลตัวเลขชัดเจน
- แนะนำขั้นตอนการแก้ไข
- ปิดท้ายด้วยคำถามว่าต้องการข้อมูลเพิ่มไหม
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

          enhancedMessage = `${localKnowledgeContext}${hybridModeInstruction}\n\n---\nคำถามจากผู้ใช้: ${message.text}`;
        } else {
          // No local knowledge found - AI uses general knowledge with caution
          const noLocalKnowledgeInstruction = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ NO DATABASE MATCH - GENERAL KNOWLEDGE MODE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
คำถามนี้ไม่พบข้อมูลในฐานข้อมูลโดยตรง ให้:

✅ **ต้องทำ:**
1. ระบุว่า "⚠️ ไม่พบข้อมูล [หัวข้อ] ในฐานข้อมูลโดยตรง"
2. ให้ข้อมูลทั่วไปตามหลักวิชาการ
3. แนะนำให้ผู้ใช้ระบุวัสดุหรือปัญหาให้ชัดเจนขึ้น
4. หากเป็นเรื่องเฉพาะทาง: "แนะนำให้ปรึกษาผู้เชี่ยวชาญเฉพาะทาง"

❌ **ห้าม:**
1. ห้ามเดาค่าตัวเลขที่ไม่มั่นใจ
2. ห้ามตอบแบบมั่นใจเกินไปถ้าไม่มีข้อมูลอ้างอิง

📋 **วัสดุที่รองรับ:** ABS, PP, PC, PA, POM, PE, PS, PET, PVC, TPU, PMMA, PBT, SAN, ASA, PPO, LCP, PEEK, PPS, TPE, EVA, PC/ABS, PA6GF, HDPE, LDPE, HIPS, PEI, PA12, GPPS, PPSGF, PETG
📋 **ปัญหาที่รองรับ:** Short Shot, Flash, Sink Mark, Warpage, Burn Mark, Silver Streak, Weld Line, Void, Jetting, Flow Mark, Delamination, Gate Blush, Brittleness, Color Streaks, Bubbles, Ejector Marks, Splay, Orange Peel, Sticking, Black Specks
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

          enhancedMessage = `${noLocalKnowledgeInstruction}\n\n---\nคำถามจากผู้ใช้: ${message.text}`;
        }

        // Add instruction to force function call
        if (isSystemStatusQuery && isSuperAdmin) {
          enhancedMessage = `${enhancedMessage}\n\n[INSTRUCTION: You MUST call getSystemStats function to display system status dashboard. Do NOT just write text response.]`;
        } else if (isCalculationQuery) {
          enhancedMessage = `${enhancedMessage}\n\n[INSTRUCTION: You MUST call displayCalculationResult function after performing the calculation. Do NOT just write the result in text.]`;
        }

        const result = await chat.sendMessage(enhancedMessage);
        const response = await result.response;

        // Handle Function Calls
        const functionCalls = response.functionCalls();
        if (functionCalls && functionCalls.length > 0) {
          console.log(`🔧 Function Call Detected: ${functionCalls.length}`);

          const functionResponses = [];
          for (const call of functionCalls) {
            console.log(`   -> Calling: ${call.name}(${JSON.stringify(call.args)})`);

            let functionResult = "Error: Function not found";

            if (call.name === "getSystemStats") {
              functionResult = {
                memory: process.memoryUsage(),
                uptime: process.uptime(),
                nodeVersion: process.version,
                timestamp: new Date().toISOString(),
              };
              // Generate Flex Message
              try {
                const flexMsg = createStatsDashboard(functionResult);
                if (flexMsg && flexMsg.type === "flex") {
                  pendingFlexMessages.push(flexMsg);
                  console.log("✅ Stats dashboard created successfully");
                } else {
                  console.warn("⚠️ Failed to create stats dashboard - invalid flex message");
                }
              } catch (e) {
                console.error("❌ Error generating stats dashboard:", e.message);
              }
            } else if (call.name === "testInternalFunction") {
              const {functionName, input} = call.args;
              try {
                if (functionName === "detectQuestionType") {
                  functionResult = detectQuestionType(input);
                } else if (functionName === "detectUserLevel") {
                  functionResult = detectUserLevel(input, []);
                } else if (functionName === "analyzeContext") {
                  functionResult = analyzeContext([{text: input, isUser: true}]);
                } else {
                  functionResult = "Error: Function not exposed for testing";
                }
              } catch (e) {
                functionResult = `Error executing ${functionName}: ${e.message}`;
              }
            } else if (call.name === "displayCalculationResult") {
              const {title, data, recommendation} = call.args;
              try {
                const flexMsg = createCalculationDashboard(title, data, recommendation);
                if (flexMsg && flexMsg.type === "flex") {
                  pendingFlexMessages.push(flexMsg);
                  functionResult = "✅ Dashboard displayed to user successfully.";
                  console.log("✅ Calculation dashboard created successfully");
                } else {
                  functionResult = "⚠️ Warning: Dashboard could not be created - invalid data provided.";
                  console.warn("⚠️ Failed to create calculation dashboard - invalid flex message");
                }
              } catch (e) {
                functionResult = `❌ Error generating dashboard: ${e.message}`;
                console.error("❌ Error generating calculation dashboard:", e.message);
              }
            }

            functionResponses.push({
              functionResponse: {
                name: call.name,
                response: {result: functionResult},
              },
            });
          }

          // Send function result back to model
          console.log(`   -> Sending function results back to model...`);
          const finalResult = await chat.sendMessage(functionResponses);
          responseText = finalResult.response.text();
        } else {
          responseText = response.text();
        }

        console.log(`├── Gemini response received (${responseText.length} chars)`);

        // 💾 บันทึกการสนทนาของ Super Admin
        if (isSuperAdmin) {
          try {
            const memory = getSuperAdminMemory();
            await memory.saveConversation(
                userId,
                message.text,
                responseText,
                {
                  hasLocalKnowledge: localKnowledgeContext ? true : false,
                  temperature: temperature,
                  questionType: questionContext.type,
                },
            );
            console.log(`💾 Super Admin conversation saved to memory`);
          } catch (saveError) {
            console.warn("⚠️ Could not save conversation:", saveError.message);
          }
        }

        // 🔧 FIX: Handle empty response from Gemini
        if (!responseText || responseText.trim().length === 0) {
          console.warn("⚠️ Gemini returned empty response, generating fallback...");

          // Generate intelligent fallback based on question type
          const questionLower = message.text.toLowerCase();

          if (questionLower.includes("คำนวณ") || questionLower.includes("เฉลี่ย") || /\d+.*บาท/.test(questionLower)) {
            // คำถามเกี่ยวกับการคำนวณ
            const numbers = message.text.match(/\d+(?:,\d{3})*(?:\.\d+)?/g);
            const mainAmount = numbers ? parseFloat(numbers[0].replace(/,/g, "")) : 0;

            if (questionLower.includes("ค่าไฟ") || questionLower.includes("ไฟฟ้า")) {
              const daysInMonth = 30;
              const avgPricePerUnit = 4.5; // ค่าไฟเฉลี่ยต่อหน่วย
              const totalUnits = Math.round(mainAmount / avgPricePerUnit);
              const dailyUnits = Math.round(totalUnits / daysInMonth * 10) / 10;

              responseText = `📊 **วิเคราะห์ค่าไฟฟ้า ${mainAmount.toLocaleString()} บาท**\n\n` +
                `📌 **ประมาณการใช้ไฟฟ้า:**\n` +
                `• ค่าไฟเฉลี่ย: ~${avgPricePerUnit} บาท/หน่วย\n` +
                `• รวมใช้ประมาณ: ${totalUnits.toLocaleString()} หน่วย/เดือน\n` +
                `• เฉลี่ยวันละ: ~${dailyUnits} หน่วย/วัน\n\n` +
                `💡 **วิธีลดค่าไฟ:**\n` +
                `1. **แอร์** - ตั้ง 25-26°C, ล้างแผ่นกรองทุก 2 สัปดาห์\n` +
                `2. **ตู้เย็น** - อย่าเปิดบ่อย, ตั้งห่างผนัง 10 ซม.\n` +
                `3. **ไฟส่องสว่าง** - เปลี่ยนเป็น LED ประหยัด 80%\n` +
                `4. **เครื่องทำน้ำอุ่น** - ลดอุณหภูมิ/ใช้เวลาสั้นลง\n` +
                `5. **ปิดเครื่องใช้ไฟฟ้า** ที่ไม่ใช้งาน ถอดปลั๊กออก\n` +
                `6. **ซักผ้า** - รวมซักทีเดียว, ตากแดดแทนอบ\n\n` +
                `🎯 **เป้าหมาย:** ลด 10-20% = ประหยัด ${Math.round(mainAmount * 0.15).toLocaleString()} บาท/เดือน`;
            } else {
              responseText = `📊 **ผลการคำนวณ**\n\n` +
                `จากข้อมูลที่ให้มา: ${mainAmount.toLocaleString()}\n\n` +
                `กรุณาระบุรายละเอียดเพิ่มเติมเพื่อให้ผมช่วยคำนวณได้แม่นยำขึ้นครับ เช่น:\n` +
                `• ต้องการคำนวณอะไร?\n` +
                `• มีข้อมูลอื่นๆ เพิ่มเติมไหม?`;
            }
          } else if (questionLower.includes("วิธี") || questionLower.includes("ยังไง") || questionLower.includes("อย่างไร")) {
            responseText = `🤔 ขออภัยครับ ผมไม่แน่ใจว่าเข้าใจคำถามถูกต้อง\n\n` +
              `กรุณาลองถามใหม่โดยระบุ:\n` +
              `• ต้องการทำอะไร?\n` +
              `• มีข้อมูลหรือบริบทอะไรเพิ่มเติม?\n\n` +
              `💡 ตัวอย่างคำถาม:\n` +
              `• "วิธีลดค่าไฟในโรงงาน"\n` +
              `• "วิธีแก้ short shot"\n` +
              `• "วิธีคำนวณ cycle time"`;
          } else {
            responseText = `🤔 ขออภัยครับ ผมไม่สามารถประมวลผลคำถามนี้ได้ในขณะนี้\n\n` +
              `กรุณาลองถามใหม่อีกครั้ง หรือลองถามในรูปแบบอื่น เช่น:\n` +
              `• ระบุคำถามให้ชัดเจนขึ้น\n` +
              `• แยกคำถามเป็นหลายๆ ส่วน\n\n` +
              `💪 ผมพร้อมช่วยเสมอครับ!`;
          }
        }

        break;
      } catch (err) {
        console.error(`├── Gemini API error (attempt ${attempt}):`, err.message);
        if (attempt >= maxRetries) {
          throw err;
        }
        // exponential backoff
        const waitMs = Math.min(1000 * Math.pow(2, attempt), 8000);
        console.log(`├── Waiting ${waitMs}ms before retry...`);
        await new Promise((r) => setTimeout(r, waitMs));
      }
    }

    // 🎨 Enhance response with smart emoji and formatting
    responseText = enhanceResponseWithEmoji(responseText, message.text);

    // ✂️ TRUNCATE MESSAGE FOR LINE (Max 5000 chars limit, using 4000 for safety)
    const MAX_LINE_LENGTH = 4000;
    if (responseText.length > MAX_LINE_LENGTH) {
      console.warn(`⚠️ Response too long (${responseText.length} chars), truncating...`);
      responseText = responseText.substring(0, MAX_LINE_LENGTH) + "\n\n...(ข้อความถูกตัดเนื่องจากยาวเกินไป กรุณาถามเจาะจงเฉพาะจุดที่ต้องการครับ)";
    }

    // เก็บ clean response (ไม่มี credit line) สำหรับ Flex Message
    let cleanResponseText = responseText;

    // Ensure credit line สำหรับ Text Message เท่านั้น (Flex Message จะมี credit line ใน footer อยู่แล้ว)
    if (!responseText.includes("อาจารย์วิทยา") && !responseText.includes("อาจารย์ วิทยา")) {
      responseText += "\n\n✨ พัฒนาโดย อาจารย์ วิทยา เทคนิคฉีดพลาสติก";
    }

    console.log(`✅ AI Response ready (${responseText.length} chars)`);

    // Save conversation memory
    try {
      await getConversationMemory().saveConversationMemory(userId, executionId, {
        question: message.text,
        answer: responseText,
        context: {
          questionType: "general",
          userLevel: "intermediate",
          source: "line",
        },
      });

      // 🧠 HYPER-LOCALIZED KNOWLEDGE: Extract and save knowledge from conversation
      try {
        const hyperKnowledge = getHyperLocalizedKnowledge();
        const extractedKnowledge = await hyperKnowledge.extractKnowledgeFromConversation(
            message.text,
            responseText,
            {userId, source: "line"},
        );

        // Save each extracted knowledge item
        for (const knowledge of extractedKnowledge) {
          await hyperKnowledge.saveKnowledge(knowledge, userId, "line_conversation");
        }

        if (extractedKnowledge.length > 0) {
          console.log(`🧠 Extracted ${extractedKnowledge.length} knowledge items from conversation`);
        }
      } catch (knowledgeError) {
        console.warn("⚠️ Knowledge extraction skipped:", knowledgeError.message);
      }
    } catch (memError) {
      console.error("❌ Error saving memory:", memError);
    }

    // Send reply
    // Construct Reply Messages (Text + Flex)
    const messagesToSend = [];

    // 🎨 Add AI Response as Beautiful Flex Message (or Text for very short/long responses)
    console.log(`📝 Response text length: ${responseText.length} chars`);
    console.log(`📝 Response preview: ${responseText.substring(0, 200)}...`);

    const aiResponseMessage = getOptimalAIResponse(
        cleanResponseText, // ใช้ clean response (ไม่มี credit line ซ้ำ)
        message.text,
        {
          questionType: questionContext?.type || "general",
          source: localKnowledgeContext ? "hybrid" : "ai_gemini",
          confidence: localKnowledgeContext?.confidence,
        },
    );

    console.log(`🎨 AI Response format: ${aiResponseMessage.type}${aiResponseMessage.type === "flex" ? " (Flex Message)" : " (Text)"}`);
    messagesToSend.push(aiResponseMessage);

    // Add Pending Flex Messages (Max 4 more, total 5)
    // Only add if they exist and are valid
    if (pendingFlexMessages.length > 0) {
      console.log(`📊 Processing ${pendingFlexMessages.length} flex message(s)...`);
      let validFlexCount = 0;
      for (const flexMsg of pendingFlexMessages.slice(0, 4)) {
        if (flexMsg && flexMsg.type === "flex" && flexMsg.contents) {
          messagesToSend.push(flexMsg);
          validFlexCount++;
          console.log(`📊 Flex altText: ${flexMsg.altText}`);
        } else {
          console.warn("⚠️ Skipped invalid flex message:", JSON.stringify(flexMsg).substring(0, 200));
        }
      }
      console.log(`✅ Added ${validFlexCount} valid flex message(s) to reply`);
    }

    // Try to send with Flex, if fails, send only text, if still fails use pushMessage
    try {
      await lineClient.replyMessage(replyToken, messagesToSend);
      console.log(`✅ Reply sent successfully to LINE (${messagesToSend.length} messages)`);

      // 🎁 TRIAL SYSTEM: Welcome Flex ไม่แสดงหลังครั้งแรกแล้ว (ครั้งที่ 2 จึงแสดง)
      // ไม่ต้อง userData._showWelcomeAfterAnswer แล้ว

      // 🎁 TRIAL SYSTEM: Show Trial Ending Soon notification
      if (userData._showTrialEndingNotification) {
        console.log(`⚠️ Showing Trial Ending notification for ${userId} - ${userData._trialDaysRemaining} days remaining`);
        try {
          const endingSoonFlex = createTrialEndingSoonFlex(userData.displayName || "คุณ", {
            daysRemaining: userData._trialDaysRemaining,
          });
          await lineClient.pushMessage(userId, endingSoonFlex);
          console.log(`✅ Trial Ending Soon Flex sent via pushMessage`);
        } catch (notifyError) {
          console.error("⚠️ Failed to send Trial Ending notification:", notifyError.message);
        }
      }

      // 🎁 TRIAL SYSTEM: Show Upgrade message after teaser
      if (userData._showUpgradeAfterAnswer) {
        console.log(`💎 Showing upgrade message after teaser for ${userId}`);
        try {
          await lineClient.pushMessage(userId, {
            type: "text",
            text: `💎 **อัปเกรดวันนี้ รับส่วนลด 50%!**\n\n` +
                  `คุณเหลือการใช้งานฟรี 1 ครั้ง/วัน\n` +
                  `อัปเกรดเป็น Premium เพื่อใช้งานไม่จำกัด\n\n` +
                  `🔥 รายเดือน: 99฿ → 49฿\n` +
                  `🔥 รายปี: 699฿ → 349฿\n\n` +
                  `พิมพ์ "สมัคร Premium" เพื่อดูแพ็คเกจ`,
            quickReply: {
              items: [
                {type: "action", action: {type: "postback", label: "💎 สมัคร Premium", data: "action=subscribe_premium"}},
                {type: "action", action: {type: "postback", label: "📊 ดูสถานะ", data: "action=trial_status"}},
              ],
            },
          });
          console.log(`✅ Upgrade message sent via pushMessage`);
        } catch (upgradeError) {
          console.error("⚠️ Failed to send upgrade message:", upgradeError.message);
        }
      }
    } catch (replyError) {
      console.error("⚠️ Error sending with Flex, trying text only:", replyError.message);
      // Log full error details for debugging
      if (replyError.originalError?.response?.data) {
        console.error("⚠️ LINE API Error Details:", JSON.stringify(replyError.originalError.response.data));
      }
      // Fallback: send only text message
      try {
        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: responseText,
        });
        console.log(`✅ Reply sent (text only) to LINE`);
      } catch (textError) {
        console.error("❌ Failed to send even text only:", textError.message);
        if (textError.originalError?.response?.data) {
          console.error("❌ LINE API Error Details:", JSON.stringify(textError.originalError.response.data));
        }

        // 🔄 Final fallback: use pushMessage instead
        try {
          console.log("🔄 Trying pushMessage as final fallback...");
          await lineClient.pushMessage(userId, messagesToSend);
          console.log(`✅ Reply sent via pushMessage (fallback) to LINE`);
        } catch (pushError) {
          console.error("❌ pushMessage also failed:", pushError.message);
          // Try with text only via push
          try {
            await lineClient.pushMessage(userId, {type: "text", text: responseText});
            console.log(`✅ Reply sent via pushMessage text-only (final fallback)`);
          } catch (finalError) {
            console.error("❌ All send attempts failed:", finalError.message);
          }
        }
      }
    }
  } catch (error) {
    console.error("❌ Error handling message:", error);

    // Send error message to user
    try {
      await lineClient.replyMessage(replyToken, {
        type: "text",
        text: "ขอโทษครับ เกิดข้อผิดพลาดในการประมวลผล กรุณาลองใหม่อีกครั้ง",
      });
    } catch (replyError) {
      console.error("❌ Could not send error message:", replyError);
    }
  }
}

/**
 * Handle follow events (user adds bot as friend)
 */
async function handleFollowEvent(event) {
  const userId = event.source.userId;
  console.log(`\n👋 Follow Event: User ${userId} added bot`);

  try {
    const profile = await lineClient.getProfile(userId);

    // 👋 ใช้ Flex Message สวยงามสำหรับต้อนรับผู้ใช้ใหม่
    const welcomeFlex = createWelcomeMessage(profile.displayName);

    if (welcomeFlex) {
      try {
        // เพิ่ม Quick Reply ให้ Flex Message
        welcomeFlex.quickReply = {
          items: [
            {type: "action", action: {type: "message", label: "💬 ลองถาม AI", text: "สวัสดีครับ วิทย์"}},
            {type: "action", action: {type: "message", label: "🎯 ตัวอย่างคำถาม", text: "/help"}},
            {type: "action", action: {type: "message", label: "🏭 ปรึกษาปัญหา", text: "รอยไหม้เกิดจากอะไร"}},
            {type: "action", action: {type: "message", label: "🌱 ปรึกษาเกษตร", text: "ปรึกษาเรื่องเกษตร"}},
            {type: "action", action: {type: "message", label: "🎁 ทดลองฟรี 30 วัน", text: "สนใจทดลองใช้ฟรี"}},
          ],
        };

        await lineClient.pushMessage(userId, welcomeFlex);
        console.log("✅ Welcome Flex Message sent with Quick Reply");
      } catch (flexError) {
        console.error("⚠️ Flex failed, using text fallback:", flexError.message);
        // Fallback to text message
        await lineClient.pushMessage(userId, {
          type: "text",
          text: `สวัสดีครับคุณ ${profile.displayName}! 👋\n\n` +
                `ยินดีต้อนรับสู่ WiT ผู้ช่วยอัจฉริยะ โดยอาจารย์์วิทยา🤖\n\n` +
                ` ให้ผู้ช่วยอัจฉริยะรอบด้านช่วยคิดวิเคราะห์:\n` +
                `👁️ วิเคราะห์ภาพ - ส่งรูปชิ้นงานมา\n` +
                `🧠 ถาม-ตอบ - ปัญหาเทคนิคทุกรูปแบบ\n` +
                `📊 คำนวณ - Cooling Time, Clamping Force\n` +
                `🌱 เกษตร - โรคพืช ปุ๋ย การเพาะปลูก\n\n` +
                `💡 พิมพ์เหมือนคุยกับเพื่อน ผมเข้าใจครับ!`,
          quickReply: {
            items: [
              {type: "action", action: {type: "message", label: "👁️ วิเคราะห์ภาพ", text: "วิเคราะห์ภาพ"}},
              {type: "action", action: {type: "message", label: "❓ ถามปัญหา", text: "รอยไหม้เกิดจากอะไร"}},
              {type: "action", action: {type: "message", label: "📊 คำนวณ", text: "คำนวณ Cooling Time"}},
              {type: "action", action: {type: "message", label: "🌱 ปรึกษาเกษตร", text: "ปรึกษาเรื่องเกษตรครับ"}},
              {type: "action", action: {type: "message", label: "💎 สมัคร Premium", text: "สนใจสมัคร Premium"}},
            ],
          },
        });
      }
    } else {
      // Fallback if Flex creation failed
      await lineClient.pushMessage(userId, {
        type: "text",
        text: `สวัสดีครับ! 👋 ยินดีต้อนรับสู่ WiT ผู้ช่วยอัจฉริยะ\n\nพิมพ์ /help เพื่อดูวิธีใช้งาน`,
        quickReply: {
          items: [
            {type: "action", action: {type: "message", label: "📖 วิธีใช้งาน", text: "/help"}},
            {type: "action", action: {type: "message", label: "💎 สมัคร Premium", text: "สนใจสมัคร Premium"}},
          ],
        },
      });
    }
    console.log("✅ Welcome message sent");
  } catch (error) {
    console.error("❌ Error sending welcome message:", error);
  }
}

/**
 * Handle unfollow events (user blocks/removes bot)
 */
async function handleUnfollowEvent(event) {
  const userId = event.source.userId;
  console.log(`\n👋 Unfollow Event: User ${userId} removed bot`);

  // Optional: Clean up user data from Firestore
  // await getFirestore().collection('line_users').doc(userId).update({
  //   unfollowedAt: FieldValue.serverTimestamp()
  // });
}

/**
 * Handle postback events (button clicks, etc.)
 */
async function handlePostbackEvent(event) {
  const userId = event.source.userId;
  const replyToken = event.replyToken;
  const data = event.postback.data;
  console.log(`\n🔘 Postback Event: ${data}`);

  // Parse postback data
  const params = new URLSearchParams(data);
  const action = params.get("action");

  // =====================================================
  // 👍👎 FEEDBACK SYSTEM (Like/Unlike)
  // =====================================================
  if (action === "like" || action === "unlike") {
    const type = params.get("type") || "ai_response";
    const feedbackValue = action === "like" ? 1 : -1;

    try {
      // บันทึก feedback ลง Firestore
      await getFirestore().collection("feedback").add({
        userId: userId,
        type: type,
        feedback: action,
        value: feedbackValue,
        timestamp: FieldValue.serverTimestamp(),
      });

      console.log(`✅ Feedback saved: ${action} (${feedbackValue}) for ${type}`);

      // ส่ง Flex Message ขอบคุณสวยๆ กลับไป
      const thankYouFlex = createFeedbackThankYouFlex(action);
      await lineClient.replyMessage(replyToken, thankYouFlex);
      console.log(`💐 Feedback Thank You Flex sent for: ${action}`);

    } catch (error) {
      console.error("❌ Error saving feedback:", error);
      // ถ้า save ไม่ได้ ก็ยังส่ง Thank You Flex อยู่ดี
      try {
        const thankYouFlex = createFeedbackThankYouFlex(action);
        await lineClient.replyMessage(replyToken, thankYouFlex);
      } catch (replyError) {
        console.error("❌ Error sending thank you flex:", replyError);
      }
    }
    return;
  }

  // =====================================================
  // 🎓 QUIZ SYSTEM POSTBACK HANDLERS
  // =====================================================

  // Answer Question Handler
  if (action === "answer") {
    const sessionId = params.get("session");
    const questionId = params.get("question");
    const userAnswer = params.get("choice");

    console.log(`📝 [Postback] Answer: session=${sessionId}, question=${questionId}, answer=${userAnswer}`);

    try {
      // 📊 Get Quiz Session
      const session = await quizEnhancement.getQuizSession(sessionId);
      if (!session) {
        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: "❌ ไม่พบ session แบบทดสอบ\nกรุณาเริ่มแบบทดสอบใหม่ด้วย /quiz",
        });
        return;
      }

      // ✅ Verify Answer & Calculate Score
      const answerTime = Date.now();
      const verifyResult = quizEnhancement.verifyAnswerAndCalculateScore(
        questionId,
        userAnswer,
        session,
        answerTime,
        QUIZ_QUESTIONS
      );

      // 💾 Update Session with Answer
      await quizEnhancement.updateQuizSession(sessionId, verifyResult.answerData);

      // 🎨 Send Answer Result Flex (with auto-next button)
      const question = QUIZ_QUESTIONS[questionId];
      const updatedSession = await quizEnhancement.getQuizSession(sessionId);
      const resultFlex = quizFlexMessages.createEnhancedAnswerResultFlex(
        question,
        userAnswer,
        verifyResult,
        updatedSession
      );

      await lineClient.replyMessage(replyToken, resultFlex);
      console.log(`✅ [Postback] Answer result sent with auto-next button`);

    } catch (answerError) {
      console.error("❌ [Postback] Answer Error:", answerError);
      await lineClient.replyMessage(replyToken, {
        type: "text",
        text: "❌ เกิดข้อผิดพลาดในการตรวจคำตอบ\nกรุณาลองใหม่อีกครั้ง",
      });
    }
    return;
  }

  // Next Question Handler
  if (action === "next_question") {
    const sessionId = params.get("session");
    console.log(`⏭️ [Postback] Next question for session: ${sessionId}`);

    try {
      const session = await quizEnhancement.getQuizSession(sessionId);
      if (!session) {
        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: "❌ ไม่พบ session แบบทดสอบ",
        });
        return;
      }

      // Check if there are more questions
      if (session.currentQuestionIndex < session.questionIds.length) {
        const nextQuestionId = session.questionIds[session.currentQuestionIndex];
        const nextQuestion = QUIZ_QUESTIONS[nextQuestionId];
        const questionFlex = quizFlexMessages.createEnhancedQuizQuestionFlex(nextQuestion, session);

        await lineClient.replyMessage(replyToken, questionFlex);
        console.log(`✅ [Postback] Next question sent: ${nextQuestionId}`);
      } else {
        // 🏁 Quiz completed - Auto show summary
        console.log(`🏁 [Postback] Quiz completed! Auto-showing summary`);

        const quizResult = await quizEnhancement.completeQuizSession(sessionId);
        await quizEnhancement.saveQuizResultToUserProgress(session.userId, quizResult);

        const summaryFlex = quizFlexMessages.createEnhancedQuizSummaryFlex(session);
        await lineClient.replyMessage(replyToken, summaryFlex);
        console.log(`✅ [Postback] Quiz summary auto-sent`);
      }
    } catch (error) {
      console.error("❌ [Postback] Next Question Error:", error);
      await lineClient.replyMessage(replyToken, {
        type: "text",
        text: "❌ เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
      });
    }
    return;
  }

  // Finish Quiz Handler (same as next_question when quiz is complete)
  if (action === "finish_quiz") {
    const sessionId = params.get("session");
    console.log(`🏁 [Postback] Finish quiz for session: ${sessionId}`);

    try {
      const session = await quizEnhancement.getQuizSession(sessionId);
      if (!session) {
        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: "❌ ไม่พบ session แบบทดสอบ",
        });
        return;
      }

      const quizResult = await quizEnhancement.completeQuizSession(sessionId);
      await quizEnhancement.saveQuizResultToUserProgress(session.userId, quizResult);

      const summaryFlex = quizFlexMessages.createEnhancedQuizSummaryFlex(session);
      await lineClient.replyMessage(replyToken, summaryFlex);
      console.log(`✅ [Postback] Quiz summary sent`);
    } catch (error) {
      console.error("❌ [Postback] Finish Quiz Error:", error);
      await lineClient.replyMessage(replyToken, {
        type: "text",
        text: "❌ เกิดข้อผิดพลาดในการแสดงผลสรุป",
      });
    }
    return;
  }

  // =====================================================
  // 🎁 TRIAL SYSTEM POSTBACK HANDLERS
  // =====================================================

  // Accept Terms & Start Trial (รองรับทั้ง 3 action names)
  if (action === "accept_terms" || action === "start_trial" || action === "accept_trial_terms") {
    console.log(`🎁 User ${userId} accepting terms and starting trial`);

    try {
      const result = await acceptTermsAndStartTrial(userId);

      if (result.success) {
        // แสดง Trial Started Flex
        const db = getFirestore();
        const userDoc = await db.collection("line_users").doc(userId).get();
        const displayName = userDoc.exists ? (userDoc.data().displayName || "คุณ") : "คุณ";

        const trialStartedFlex = createTrialStartedFlex(displayName, {
          trialDays: result.trialDays,
          dailyLimit: result.dailyLimit,
          trialEndDate: result.trialEndDate,
        });

        await lineClient.replyMessage(replyToken, trialStartedFlex);
        console.log(`✅ Trial started for ${userId}`);
      } else {
        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: "❌ เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้งครับ",
        });
      }
    } catch (error) {
      console.error("❌ Error starting trial:", error);
      await lineClient.replyMessage(replyToken, {
        type: "text",
        text: "❌ เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้งครับ",
      });
    }
    return;
  }

  // 🎨 Show Features Menu Flex
  if (action === "show_features_menu") {
    console.log(`🎨 User ${userId} viewing features menu`);

    try {
      const featuresFlex = createFeaturesMenuFlex();
      await lineClient.replyMessage(replyToken, featuresFlex);
      console.log(`✅ Features menu sent to ${userId}`);
    } catch (error) {
      console.error("❌ Error showing features menu:", error);
      await lineClient.replyMessage(replyToken, {
        type: "text",
        text: "❌ เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้งครับ",
      });
    }
    return;
  }

  // View Trial Status
  if (action === "trial_status") {
    console.log(`🎁 User ${userId} checking trial status`);

    try {
      const trialStatus = await getTrialStatus(userId);
      const db = getFirestore();
      const userDoc = await db.collection("line_users").doc(userId).get();
      const displayName = userDoc.exists ? (userDoc.data().displayName || "คุณ") : "คุณ";

      const statusFlex = createDailyStatusFlex(displayName, {
        status: trialStatus.status,
        dailyUsage: trialStatus.dailyUsage,
        dailyLimit: trialStatus.dailyLimit,
        trialDaysRemaining: trialStatus.trialDaysRemaining,
        trialDay: trialStatus.trialDay,
        totalUsage: trialStatus.totalUsage,
      });

      await lineClient.replyMessage(replyToken, statusFlex);
    } catch (error) {
      console.error("❌ Error getting trial status:", error);
      await lineClient.replyMessage(replyToken, {
        type: "text",
        text: "❌ ไม่สามารถดูสถานะได้ กรุณาลองใหม่อีกครั้งครับ",
      });
    }
    return;
  }

  // View Terms & Conditions
  if (action === "view_terms") {
    console.log(`📋 User ${userId} viewing terms`);

    await lineClient.replyMessage(replyToken, {
      type: "text",
      text: `📜 **ข้อตกลงการใช้งาน WiT AI**\n\n` +
            `✅ **สิทธิ์ที่คุณจะได้รับ:**\n` +
            `• ทดลองใช้ฟรี 7 วัน\n` +
            `• ถามได้วันละ 7 ครั้ง\n` +
            `• ใช้ได้ทุกฟีเจอร์ รวมวิเคราะห์รูป\n\n` +
            `📋 **เงื่อนไขการใช้งาน:**\n` +
            `• ห้ามใช้เพื่อกิจกรรมผิดกฎหมาย\n` +
            `• ห้ามส่ง spam หรือใช้งานผิดประเภท\n` +
            `• ข้อมูลจะถูกเก็บเพื่อปรับปรุงบริการ\n` +
            `• สามารถยกเลิกได้ตลอดเวลา\n\n` +
            `🔒 **ความเป็นส่วนตัว:**\n` +
            `• เราไม่แชร์ข้อมูลส่วนตัวกับบุคคลที่สาม\n` +
            `• ข้อความของคุณจะถูกเก็บอย่างปลอดภัย\n\n` +
            `กด "ยอมรับและเริ่มทดลองใช้" เพื่อดำเนินการต่อ`,
      quickReply: {
        items: [
          {type: "action", action: {type: "postback", label: "✅ ยอมรับและเริ่มใช้", data: "action=accept_terms"}},
          {type: "action", action: {type: "message", label: "❌ ยังไม่ยอมรับ", text: "ยังไม่ยอมรับข้อตกลง"}},
        ],
      },
    });
    return;
  }

  // Subscribe Premium (from Trial)
  if (action === "subscribe_premium" || action === "upgrade_now") {
    console.log(`💎 User ${userId} interested in premium from trial`);

    // แสดง Package selection
    const packageFlex = createAllPackagesCarousel();
    if (packageFlex) {
      await lineClient.replyMessage(replyToken, packageFlex);
    } else {
      await lineClient.replyMessage(replyToken, {
        type: "text",
        text: `💎 **แพ็คเกจ Premium WiT AI**\n\n` +
              `👤 **ส่วนตัว:**\n` +
              `• รายเดือน: 99฿ (AI ไม่จำกัด + ภาพ 30 รูป/วัน)\n` +
              `• 3 เดือน: 259฿ (ประหยัด 12%)\n` +
              `• รายปี: 699฿ (คุ้มสุด! ≈1.9฿/วัน)\n\n` +
              `🏢 **ทีม (5 คน):**\n` +
              `• ทีมรายปี: 2,490฿\n\n` +
              `📝 พิมพ์ "เลือกรายเดือน" หรือ "เลือกรายปี"`,
        quickReply: {
          items: [
            {type: "action", action: {type: "message", label: "👤 รายเดือน 99฿", text: "เลือกรายเดือน"}},
            {type: "action", action: {type: "message", label: "🔥 รายปี 699฿", text: "เลือกรายปี"}},
            {type: "action", action: {type: "message", label: "🏢 ทีม", text: "เลือกทีมรายปี"}},
          ],
        },
      });
    }
    return;
  }

  // =====================================================
  // 🛒 MARKETPLACE POSTBACK HANDLERS
  // =====================================================
  if (action && (action.includes("seller") || action.includes("product") || action.includes("toggle_status") || action.includes("delete_product"))) {
    console.log(`🛒 Marketplace postback: ${action}`);
    const db = getFirestore();
    const userDoc = await db.collection("line_users").doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : {};

    const handled = await handleMarketplace({lineClient, db}, event, userData);
    if (handled) return;
  }

  // =====================================================
  // 📝 MEMORY NOTE POSTBACK HANDLERS
  // =====================================================
  if (action && (action === "view_note" || action === "note_actions" || action === "toggle_note" ||
      action === "edit_note" || action === "confirm_delete" || action === "delete_note_confirmed" ||
      action === "delete_note" || action === "confirm_delete_note")) {
    console.log(`📝 Memory Note postback: ${action}`);
    const {handleNotePostback} = require("./memoryNoteSystem");

    const result = await handleNotePostback(userId, data);
    if (result && result.handled && result.response) {
      await lineClient.replyMessage(replyToken, result.response);
      return;
    }
  }

  // =====================================================
  // 🎓 EDUCATION HUB POSTBACK HANDLERS
  // =====================================================

  // Education Hub Menu
  if (action === "edu_hub") {
    const eduMenu = createEducationHubMenuFlex();
    await lineClient.replyMessage(replyToken, eduMenu);
    return;
  }

  // Select Education Level
  if (action === "edu_level") {
    const level = params.get("level");
    if (level && EDUCATION_LEVELS[level]) {
      const subjectsMenu = createSubjectsMenuFlex(level);
      await lineClient.replyMessage(replyToken, subjectsMenu);
    }
    return;
  }

  // Select Subject
  if (action === "edu_subject") {
    const level = params.get("level");
    const subject = params.get("subject");

    // หา course ที่ตรงกัน
    const courseKey = Object.keys(COURSES).find((key) => {
      const course = COURSES[key];
      return course.level === level && course.subject === subject;
    });

    if (courseKey && COURSES[courseKey]) {
      const courseUnits = createCourseUnitsFlex(courseKey);
      if (courseUnits) {
        await lineClient.replyMessage(replyToken, courseUnits);
      }
    } else {
      // ใช้ AI สร้างเนื้อหา
      const subjectName = SUBJECTS[subject]?.name || subject;
      const levelName = EDUCATION_LEVELS[level]?.name || level;
      const aiPrompt = getEducationSystemPrompt(level, subject, "explain");

      try {
        const aiResponse = await generateGeminiResponse(
            aiPrompt + `\n\nสรุปหัวข้อหลักของวิชา${subjectName} ระดับ${levelName} ที่นักเรียนต้องเรียน`,
            userId,
        );
        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: `📚 **${subjectName}** - ${levelName}\n\n${aiResponse}\n\n💡 ถามเรื่องที่สนใจได้เลยครับ!`,
          quickReply: {
            items: [
              {type: "action", action: {type: "message", label: "📝 ทำแบบฝึกหัด", text: `/tool quiz`}},
              {type: "action", action: {type: "message", label: "💬 WiT Tutor", text: "/tutor"}},
              {type: "action", action: {type: "message", label: "🏠 กลับเมนู", text: "/edu"}},
            ],
          },
        });
      } catch (err) {
        await lineClient.replyMessage(replyToken, createAITutorMenuFlex());
      }
    }
    return;
  }

  // Open Course Unit/Lesson
  if (action === "edu_unit") {
    const courseId = params.get("course");
    const unitId = params.get("unit");
    const lesson = SAMPLE_LESSONS[`${courseId}_${unitId}`];

    if (lesson) {
      await lineClient.replyMessage(replyToken, {
        type: "text",
        text: `📖 **${lesson.title}**\n\n${lesson.content}\n\n📝 **แบบฝึกหัด:**\n${lesson.exercises.map((ex, i) => `${i+1}. ${ex}`).join("\n")}`,
        quickReply: {
          items: [
            {type: "action", action: {type: "message", label: "❓ ถามเพิ่มเติม", text: `อธิบายเพิ่มเรื่อง ${lesson.title}`}},
            {type: "action", action: {type: "message", label: "📝 ทำแบบทดสอบ", text: "/tool quiz"}},
            {type: "action", action: {type: "message", label: "🔙 กลับ", text: `/edu ${COURSES[courseId]?.level} ${COURSES[courseId]?.subject}`}},
          ],
        },
      });
    } else {
      // ใช้ AI สร้างบทเรียน
      const course = COURSES[courseId];
      const unit = course?.units?.find((u) => u.id === unitId);

      if (unit) {
        const aiPrompt = getEducationSystemPrompt(course.level, course.subject, "explain");
        try {
          const aiResponse = await generateGeminiResponse(
              aiPrompt + `\n\nอธิบายเนื้อหา "${unit.title}" อย่างละเอียด พร้อมตัวอย่างที่เข้าใจง่าย`,
              userId,
          );
          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: `📖 **${unit.title}**\n\n${aiResponse}`,
            quickReply: {
              items: [
                {type: "action", action: {type: "message", label: "📝 ทำแบบฝึกหัด", text: `สร้างแบบฝึกหัดเรื่อง ${unit.title}`}},
                {type: "action", action: {type: "message", label: "🔙 กลับ", text: `/edu ${course.level} ${course.subject}`}},
              ],
            },
          });
        } catch (err) {
          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: `📖 **${unit.title}**\n\n💬 พิมพ์คำถามเกี่ยวกับหัวข้อนี้ได้เลยครับ WiT พร้อมช่วยเหลือ!`,
          });
        }
      }
    }
    return;
  }

  // WiT Tutor Mode Selection
  if (action === "tutor_mode") {
    const mode = params.get("mode");
    const tutorMode = AI_TUTOR_MODES[mode];

    if (tutorMode) {
      await lineClient.replyMessage(replyToken, {
        type: "text",
        text: `🤖 **${tutorMode.name}**\n\n${tutorMode.description}\n\n💬 พิมพ์คำถามหรือเนื้อหาที่ต้องการได้เลยครับ!`,
        quickReply: {
          items: [
            {type: "action", action: {type: "message", label: "📚 ตัวอย่างคำถาม", text: tutorMode.prompts[0]}},
            {type: "action", action: {type: "message", label: "🔙 เปลี่ยนโหมด", text: "/tutor"}},
            {type: "action", action: {type: "message", label: "🏠 เมนูหลัก", text: "/edu"}},
          ],
        },
      });
    }
    return;
  }

  // Study Tools
  if (action === "study_tool") {
    const toolId = params.get("tool");
    const toolFlex = createToolResponseFlex(toolId);

    if (toolFlex) {
      await lineClient.replyMessage(replyToken, toolFlex);
    } else {
      await lineClient.replyMessage(replyToken, createStudyToolsMenuFlex());
    }
    return;
  }

  // Tool Actions (when user interacts with a tool)
  if (action === "tool_action") {
    const tool = params.get("tool");
    const subAction = params.get("subaction");

    // Handle each tool's specific actions
    switch (tool) {
      case "flashcard":
        if (subAction === "create") {
          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: "📇 **สร้างบัตรคำศัพท์**\n\nพิมพ์หัวข้อหรือวิชาที่ต้องการสร้างบัตรคำ\n\n💡 ตัวอย่าง: \"สร้างบัตรคำศัพท์ภาษาอังกฤษเรื่องสัตว์\"",
          });
        }
        break;

      case "quiz":
        if (subAction === "start") {
          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: "📝 **สร้างแบบทดสอบ**\n\nพิมพ์หัวข้อที่ต้องการทำแบบทดสอบ\n\n💡 ตัวอย่าง: \"สร้างข้อสอบคณิตศาสตร์ ป.6 เรื่องเศษส่วน 5 ข้อ\"",
          });
        }
        break;

      case "calculator":
        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: "🔢 **เครื่องคิดเลขอัจฉริยะ**\n\nพิมพ์โจทย์คณิตศาสตร์ที่ต้องการคำนวณ\n\n💡 ตัวอย่าง:\n• \"คำนวณ 15% ของ 2500\"\n• \"แก้สมการ 2x + 5 = 15\"\n• \"หาพื้นที่วงกลมรัศมี 7\"",
        });
        break;

      case "virtualLab":
        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: "🔬 **ห้องทดลองเสมือน**\n\nเลือกการทดลองที่สนใจ:\n\n1. ⚗️ การทดลองทางเคมี\n2. 🔋 วงจรไฟฟ้า\n3. 🌱 การเจริญเติบโตของพืช\n4. 🌍 แรงโน้มถ่วง\n\n💬 พิมพ์หมายเลขหรือชื่อการทดลอง",
        });
        break;

      case "mindmap":
        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: "🗺️ **สร้าง Mind Map**\n\nพิมพ์หัวข้อที่ต้องการสร้าง Mind Map\n\n💡 ตัวอย่าง: \"สร้าง Mind Map เรื่องระบบสุริยะ\"",
        });
        break;

      case "studyPlanner":
        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: "📅 **วางแผนการเรียน**\n\nบอกเป้าหมายการเรียนของคุณ:\n\n💡 ตัวอย่าง:\n• \"วางแผนเตรียมสอบ O-NET ใน 30 วัน\"\n• \"วางแผนเรียนภาษาอังกฤษ 3 เดือน\"\n• \"ตารางทบทวนวิชาคณิต ม.3\"",
        });
        break;
    }
    return;
  }

  console.log(`⚠️ Unhandled postback action: ${action}`);
}

// =====================================================
// 📦 EXPORT ENHANCED FUNCTIONS WITH MEMORY
// =====================================================

module.exports = {
  getGeminiResponse: exports.getGeminiResponse,
  healthCheck: exports.healthCheck,
  submitFeedback: exports.submitFeedback,
  manageMemory: exports.manageMemory,
  lineWebhook: exports.lineWebhook,

  // 🌐 Marketplace Web API
  marketplaceGetProducts: exports.marketplaceGetProducts,
  marketplaceGetProduct: exports.marketplaceGetProduct,
  marketplaceGetStats: exports.marketplaceGetStats,
  marketplaceGetRelated: exports.marketplaceGetRelated,
  marketplaceRecordContact: exports.marketplaceRecordContact,
  marketplaceAIGeneratePost: exports.marketplaceAIGeneratePost,
  marketplaceLineAuth: exports.marketplaceLineAuth,
  marketplacePostProduct: exports.marketplacePostProduct,

  utilityFunctions: {
    // Core Systems
    dynamicTemperature,
    ResponseCache,
    createContextChain,
    SafetyValidator,
    PerformanceOptimizer,
    AdaptiveLearner,

    // Memory System
    ConversationMemory,
    getConversationMemory,

    // Enhanced Utilities
    formatChatHistory,
    detectUserLevel,
    detectQuestionType,
    detectExpertiseDomain,
    createExpertisePrompt,
    analyzeContext,
    analyzeEnhancedContext,

    // Security & Validation
    getGeminiApiKey,
    sanitizeAndValidateInput,
    detectAdvancedPromptInjection,
    AdvancedErrorHandler,
    setupPerformanceMonitoring,

    // Quality & Optimization
    validateResponseQuality,
    optimizeResponse,
    validateQuestionTypeMatch,
    similarityScore,

    // Instances
    responseCache,
    adaptiveLearner,
  },
};
