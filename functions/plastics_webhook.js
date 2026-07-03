"use strict";

// ─── Fix: Gemini API Key มี HTTP Referrer Restriction ───────────────────────
// wizmobiz.com หรือ appinjproject.web.app (allowed ใน Google Cloud Console)
// Cloud Functions ไม่ส่ง Referer header → ต้อง patch ให้แนบ Referer ทุก request
(function patchFetchForGemini() {
  const _origFetch = globalThis.fetch;
  globalThis.fetch = function (url, opts = {}) {
    if (typeof url === "string" && url.includes("generativelanguage.googleapis.com")) {
      const allowedReferer = "https://wizmobiz.com"; // หรือ "https://appinjproject.web.app"
      if (opts.headers instanceof Headers) {
        opts.headers.set("Referer", allowedReferer);
      } else if (opts.headers && typeof opts.headers === "object") {
        opts.headers["Referer"] = allowedReferer;
      } else {
        opts = { ...opts, headers: { ...(opts.headers || {}), Referer: allowedReferer } };
      }
    }
    return _origFetch.call(this, url, opts);
  };
})();
// ────────────────────────────────────────────────────────────────────────────

/**
 * 🚀 REST FALLBACK FOR GEMINI (Option B from Plan)
 * ใช้เมื่อ SDK โดนบล็อกเรื่อง Referrer หรือต้องการควบคุม Header เต็มรูปแบบ
 */
async function callGeminiREST(apiKey, modelName, systemPrompt, chatHistory, userMsg, config = {}) {
  // 🔄 ปรับจาก v1beta เป็น v1 เพื่อความเสถียรในบาง Project
  const apiVersion = "v1";
  const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${modelName}:generateContent?key=${apiKey}`;

  const contents = [];
  // แปลงประวัติเป็นรูปแบบ REST
  chatHistory.forEach(h => {
    contents.push({
      role: h.role === "model" ? "model" : "user",
      parts: [{ text: h.parts[0].text }]
    });
  });
  // เพิ่มข้อความล่าสุด
  contents.push({ role: "user", parts: [{ text: userMsg || "" }] });

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: contents,
    generationConfig: {
      temperature: config.temperature || 0.7,
      maxOutputTokens: config.maxOutputTokens || 2048,
      topP: 0.95,
      topK: 40
    }
  };

  console.log(`📡 [REST-Webhook] Calling Gemini API (${modelName})...`);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Referer": "https://wizmobiz.com", // ส่ง Referer ที่ allowed เสมอ
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error?.message || response.statusText;
    console.error(`❌ [REST-Webhook] API Failed: ${response.status} ${errorMessage}`);
    throw new Error(`REST_API_ERROR: ${response.status} ${errorMessage}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}
// ────────────────────────────────────────────────────────────────────────────

const { onCall, HttpsError, onRequest } = require("firebase-functions/v2/https");
const crypto = require("crypto");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const line = require("@line/bot-sdk");
const axios = require("axios");
const { PORCHESON_KNOWLEDGE_PROMPT } = require("./porcheson_knowledge_prompt");
const { TOSHIBA_KNOWLEDGE_PROMPT } = require("./toshiba_knowledge_prompt");
const { TECHMATION_KNOWLEDGE_PROMPT } = require("./Techmotion_knowledge_prompt");
const { KAIZEN_EXPERT_PROMPT } = require("./kaizen_expert_prompt");
const { INJECTION_MOLDING_EXPERT_PROMPT } = require("./injection_molding_expert_prompt");
const { PLASTIC_MATERIALS_PROMPT } = require("./plastic_materials_prompt");
const { VICTOR_KNOWLEDGE_PROMPT } = require("./victor_knowledge_prompt");
const { FANUC_KNOWLEDGE_PROMPT } = require("./fanuc_knowledge_prompt");
const { YUSHIN_KNOWLEDGE_PROMPT } = require("./yushin_knowledge_prompt");
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
const { getHyperLocalizedKnowledge, KNOWLEDGE_CATEGORIES, seedInitialKnowledge } = require("./hyper_localized_knowledge");
const { getSuperAdminMemory } = require("./super_admin_memory");
const { isAccountingCommand, handleAccountingCommand, getAccountingHelp } = require("./accounting_system");
const { CalculatorTools, DiagnosticTools, DocumentGenerator, QuickReference, TeamCommunication, VisionTools, AdminTools, parseToolCommand, getToolList, createInjectionCalculationFlex, createDefectDiagnosisFlex, createMaterialTempFlex, createDefectGuideFlex, createFormulasFlex, createSetupSheetFlex, createInjectionToolsMenuFlex, createCalculatorMenuFlex } = require("./professional_tools");
const { createAdminStatsMessage, createDailySummaryMessage, createTopUsersMessage, createPremiumReportMessage, createUserInfoMessage, createRecentUsersMessage, createRecentUsersMessageSimple, createPendingItemsMessage, createSimpleMessage, sanitizeTextForLine, createAdminControlPanelMessage, createUserDetailMessage, createBanConfirmationMessage, createTestModeMessage, createOrgListMessage, createAdminTestDashboard, createQuickTestMenu, createKnowledgeListFlex, createKnowledgeVerifyFlex, createHybridTestFlex, createKnowledgeOptimizeFlex, createKnowledgeMenuFlex, createEmptyKnowledgeFlex, createKnowledgeStatsFlexMessage, createHybridStatsFlexMessage, createKnowledgeQuickAddForm, createKnowledgeDetailedForm, createKnowledgeExamplesForm, createAdminSuperDashboard, createUserControlPanel, createUserListFlex, createSystemCleanupFlex, createSystemLogsFlex, createAIPromptsFlex, createAIAnalyticsFlex } = require("./adminFlexMessages");
const { createEnhancedSuperAdminDashboard } = require("./superAdminEnhanced");
const enhancedHandlers = require("./enhancedAdminHandlers");
const { createAIResponseFlex, createSimpleAIResponseFlex, getOptimalAIResponse, createFeedbackThankYouFlex } = require("./aiResponseFlex");
const { createQuotaLimitMessage, createWelcomeMessage, createPlasticConsultationMenu, createTemperatureTableMessage, createSmartFarmMenu, createPremiumPackageMessage, createHelpMenuMessage, createProductionReportMessage, createSummaryDashboardMessage, createTeamAnnouncementMessage, createBroadcastResultMessage, createOrgCodeGuideMessage, createReportSuccessQuickMessage, createPaymentInstructionMessage, createEmailConfirmationMessage, createPackageDetailMessage, createAllPackagesCarousel, createAccountingGuideMessage } = require("./flexMessageGenerator");
const { generateDailyReport, getReportHistory, createReportResultFlex, createReportSelectionFlex } = require("./reportGenerator");
const { LESSONS, QUIZ_QUESTIONS, createStudentMenuFlex, createLessonListFlex, createLessonContentFlex, createQuizQuestionFlex, createAnswerResultFlex, createExamPrepFlex, createFAQFlex, createQuizResultFlex, askInjectionMoldingAI } = require("./studentLearning");
const quizEnhancement = require("./quizEnhancement");
const quizFlexMessages = require("./quizFlexMessages");
const { EDUCATION_LEVELS, SUBJECTS, COURSES, SAMPLE_LESSONS, STUDY_TOOLS, AI_TUTOR_MODES, ACHIEVEMENT_BADGES, LEVEL_SYSTEM, DAILY_CHALLENGES, MINI_GAMES, GRADE_DIFFICULTY, createEducationHubMenuFlex, createSubjectsMenuFlex, createCourseUnitsFlex, createAITutorMenuFlex, createStudyToolsMenuFlex, createQuickToolsMenuFlex, createToolResponseFlex, createPrimaryGradeMenuFlex, createPrimarySubjectsMenuFlex, createProgressDashboardFlex, createDailyChallengeMenuFlex, createMiniGamesMenuFlex, createBadgeGalleryFlex, createAILessonFlex, createLeaderboardFlex, getEducationSystemPrompt, createSubjectPrompt, detectEducationContext, isEducationQuestion, searchCourses, recommendCourses } = require("./educationHub");
const { handleMarketplace, isMarketplaceCommand, getUserMarketplaceState, USER_STATES } = require("./marketplaceSystem");
const { handleMemoryWebhook, isAnyMemoryCommand } = require("./memoryNoteSystem");
const {
  isIMLCommand,
  processIMLCommand,
  CURRICULUM,
  getUserProgress,
  updateUserProgress
} = require("./injectionMoldingLearning");
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

// Import shared instances and helpers from plastics_ai_engine
const {
  PLASTIC_MATERIALS_DB,
  TROUBLESHOOTING_GUIDE,
  SUPER_ADMIN_IDS,
  ConversationMemory,
  ResponseCache,
  SafetyValidator,
  PerformanceOptimizer,
  AdaptiveLearner,
  QueryClarificationModule,
  GrandmasterOrchestrator,
  AdvancedErrorHandler,
  responseCache,
  adaptiveLearner,
  queryClarification,
  grandmasterOrchestrator,
  getConversationMemory,
  getGeminiApiKey,
  logGeminiApiKeyStatus,
  dynamicTemperature,
  formatChatHistory,
  detectUserLevel,
  detectQuestionType,
  detectExpertiseDomain,
  createExpertisePrompt,
  analyzeContext,
  analyzeEnhancedContext,
  createAgentEnhancedPrompt,
  similarityScore,
  createContextChain,
  sanitizeAndValidateInput,
  detectAdvancedPromptInjection,
  setupPerformanceMonitoring,
  validateResponseQuality,
  optimizeResponse,
  validateQuestionTypeMatch,
  getRecommendedParameters,
  getTroubleshootingSolution,
  findMaterial,
  listAllMaterials,
  listAllDefects,
  getTimeAgo,
} = require("./plastics_ai_engine");

// 💸 Slip auto-verify (SlipOK) + transferable renewal codes — independent of Google
const { verifySlip } = require("./slip_verifier");
const { issueRenewalCode, redeemRenewalCode, isRenewalCode, buildRenewalSuccessFlex, buildCodeIssuedFlex } = require("./renewal_codes");
const { getPlan, getPlanByAmount } = require("./subscription_plans");

// =====================================================
// PLASTICS WEBHOOK
// =====================================================

exports.lineWebhook = onRequest({
  region: "us-central1",
  timeoutSeconds: 60,
  memory: "512MiB",
}, async (req, res) => {
  const executionId = Math.random().toString(36).substring(2, 10);

  console.log(`\n💬 LINE WEBHOOK RECEIVED [${executionId}]`);
  console.log(`├── Method: ${req.method}`);
  console.log(`├── Path: ${req.path}`);
  console.log(`└── Headers:`, Object.keys(req.headers));

  // Get LINE client at runtime
  const { getInjectionClient, getInjectionConfig } = require("./line_client");
  const lineClient = getInjectionClient();
  const lineConfig = getInjectionConfig();

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
  const channelSecret = lineConfig.channelSecret;

  if (!channelSecret) {
    console.warn("⚠️ INJECTION_CHANNEL_SECRET not configured");
    console.warn("Webhook will accept all requests without signature validation");
    console.warn("Please set INJECTION_CHANNEL_SECRET for production use");
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
    console.error("Please set INJECTION_CHANNEL_ACCESS_TOKEN secret");
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
          return handleMessageEvent(event, executionId, lineClient);

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

  // 2. Add Marketplace/Shopping emoji
  if (questionLower.match(/ซื้อ|ขาย|ราคา|แม่ค้า|พ่อค้า|market|shop|ช้อป/i)) {
    if (!responseText.match(/🛍️|🛒|💰/)) {
      responseText = "🛍️ " + responseText;
    }
  }

  // 3. Add Feed/Content emoji
  if (questionLower.match(/feed|โพสต์|วีดีโอ|video|คอนเทนต์|content/i)) {
    if (!responseText.match(/📱|📺|✨/)) {
      responseText = "📱 " + responseText;
    }
  }

  // 4. Add problem/help emoji
  if (questionLower.match(/ปัญหา|แก้|แก้ยังไง|ช่วยด้วย|error|bug|พัง/i)) {
    if (!responseText.match(/⚠️|🔧|💡/)) {
      responseText = responseText.replace(/^(.+)$/m, "⚠️ $1");
    }
  }

  // 5. Add success/completion emoji
  if (responseText.match(/สำเร็จ|เรียบร้อย|ได้แล้ว|ดีมาก|แนะนำ/i) && !responseText.match(/✅|💪|🏆/)) {
    responseText += "\n\n💪 ลุยเลยครับ!";
  }

  // 6. Add calculation/data emoji
  if (responseText.match(/คำนวณ|ตัวเลข|รายได้|กำไร|\d+/i) && !responseText.match(/📊|🔢/)) {
    responseText = "📊 " + responseText;
  }

  // 7. Enhance section headers
  responseText = responseText.replace(/\*\*รายละเอียด:?\*\*/gi, "📝 **รายละเอียด:**");
  responseText = responseText.replace(/\*\*วิธีใช้งาน:?\*\*/gi, "🚀 **วิธีใช้งาน:**");
  responseText = responseText.replace(/\*\*ข้อดี:?\*\*/gi, "✨ **ข้อดี:**");
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
        `👋 สวัสดีครับคุณ ${userName}!\n\n🏭 ผมคือผู้ช่วย AI ด้านวิศวกรรมพลาสติกและการฉีดขึ้นรูป\n\n🎯 ถามผมได้ทุกเรื่อง:\n• 🔧 พารามิเตอร์การฉีดขึ้นรูป\n• 🧪 คุณสมบัติพลาสติก (PP, ABS, PA, PC...)\n• ⚠️ การแก้ปัญหาชิ้นงาน (Defects)\n• 🤖 การตั้งค่าเครื่อง Porcheson / Toshiba / FANUC\n\n💬 มีอะไรให้ช่วยไหมครับ?`,
        `สวัสดีครับคุณ ${userName}! 🏭\n\n😊 ยินดีต้อนรับครับ ผมเชี่ยวชาญด้านพลาสติกและการฉีดขึ้นรูปโดยเฉพาะ\n\nถามได้เลยครับ เช่น:\n✅ Cycle time ควรตั้งเท่าไหร่\n✅ แก้ปัญหา Sink mark / Warpage\n✅ เปรียบเทียบวัสดุพลาสติก\n✅ อัลกอริทึม Cooling time\n\n🚀 เริ่มถามได้เลยครับ!`,
        `🙏 สวัสดีครับคุณ ${userName}!\n\n✨ ผมคือผู้ช่วย AI สำหรับงานฉีดพลาสติกโดยเฉพาะ\n\n🌟 ความเชี่ยวชาญ:\n🔩 ระบบ Injection Molding ทุกยี่ห้อ\n🧪 วัสดุ Engineering Plastics ทุกชนิด\n📐 การคำนวณพารามิเตอร์แม่นยำ\n\nให้ผมช่วยเรื่องอะไรดีครับวันนี้?`,
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
        `🙏 ยินดีครับคุณ ${userName}!\n\n😊 ดีใจที่ข้อมูลพลาสติกเป็นประโยชน์นะครับ\n\n🔧 มีปัญหาการฉีดขึ้นรูปอะไรอีกไหมครับ? ถามได้ตลอดเลยนะครับ!`,
        `🤗 ไม่เป็นไรเลยครับคุณ ${userName}!\n\n🎯 ยินดีให้บริการด้านพลาสติกเสมอครับ มีอะไรสงสัยเรื่องวัสดุ พารามิเตอร์ หรือ defect ถามได้ตลอดนะครับ\n\n🏭 ขอให้การผลิตราบรื่นครับ!`,
        `😊 ด้วยความยินดีเป็นอย่างยิ่งครับคุณ ${userName}!\n\n💡 หวังว่าข้อมูลจะช่วยแก้ปัญหาการฉีดขึ้นรูปได้นะครับ\n\n✨ ถ้ามีปัญหา defect หรืออยากคำนวณพารามิเตอร์ใหม่ แจ้งผมได้เลยครับ!`,
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

  // Detect Injection Molding / Machine
  if (lowerText.match(/ฉีด|แม่พิมพ์|mold|injection|machine|เครื่อง|parameter|พารามิเตอร์/i)) {
    context.type = "injection_molding";
    context.suggestedEmoji = "🏭";
    return context;
  }

  // Detect Plastic Material
  if (lowerText.match(/พลาสติก|plastic|pp|abs|pa|pc|pet|pom|วัสดุ|material|resin/i)) {
    context.type = "plastic_material";
    context.suggestedEmoji = "🧪";
    return context;
  }

  // Detect urgent problem
  if (lowerText.match(/ด่วน|เร่งด่วน|urgent|help|ช่วย|เข้าไม่ได้|พัง/i)) {
    context.urgency = "high";
    context.type = "problem_urgent";
    context.suggestedEmoji = "🚨";
  }

  // Detect thank you
  if (lowerText.match(/ขอบคุณ|thank|ขอบใจ/i)) {
    context.type = "gratitude";
    context.suggestedEmoji = "🙏";
    context.suggestedTone = "warm";
  }

  return context;
}

/**
 * Handle message events
 */
async function handleMessageEvent(event, executionId, lineClient) {
  // If lineClient is not passed (from legacy calls), get it here
  if (!lineClient) {
    const { getInjectionClient } = require("./line_client");
    lineClient = getInjectionClient();
  }
  const pendingFlexMessages = [];
  const userId = event.source.userId ? event.source.userId.trim() : null;
  const replyToken = event.replyToken;
  const message = event.message;

  // 🔧 FIX: Declare userData at function scope to prevent "userData is not defined" error
  let userData = { usageCount: 0, isPremium: false };

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

      const handled = await handleMarketplace({ lineClient, db }, event, userData);
      if (handled) return;
    }
  }

  // Handle Image Messages (Auto Vision & Slip Detection)
  if (message.type === "image") {
    console.log(`📸 Image received from ${userId}`);

    // ═══════════════════════════════════════════════════════════════════
    // 💸 SLIP AUTO-VERIFY (SlipOK) — runs only when the user is awaiting
    //    payment. Real slip + amount matches a plan → mint a renewal code,
    //    redeem it for the user immediately, reply Flex. Anything
    //    inconclusive falls through to Gemini vision (machine/material photo).
    // ═══════════════════════════════════════════════════════════════════
    try {
      const sdb = getFirestore();
      const sUserRef = sdb.collection("line_users").doc(userId);
      const sUserDoc = await sUserRef.get();
      const sUserData = sUserDoc.exists ? sUserDoc.data() : {};
      const awaitingPayment =
        sUserData.subscriptionStatus === "package_selected" ||
        sUserData.subscriptionStatus === "slip_uploaded" ||
        sUserData.subscriptionStatus === "slip_review" ||
        !!sUserData.selectedPackage;
      const slipConfigured = !!(process.env.SLIPOK_API_KEY && process.env.SLIPOK_BRANCH_ID);

      if (awaitingPayment && slipConfigured) {
        console.log(`💸 Awaiting payment → trying SlipOK auto-verify for ${userId}`);
        const sStream = await lineClient.getMessageContent(message.id);
        const sChunks = [];
        for await (const c of sStream) sChunks.push(c);
        const sBuffer = Buffer.concat(sChunks);

        const expectedPlan = getPlan(sUserData.packagePrice);
        const expectedAmount = expectedPlan ? expectedPlan.amount : 0;
        const v = await verifySlip(sBuffer, expectedAmount);
        console.log(`💸 SlipOK result: ok=${v.ok} isSlip=${v.isSlip} amount=${v.amount || "-"} err=${v.error || "-"}`);

        if (v.ok && v.isSlip) {
          let userName = "ผู้ใช้";
          try { userName = (await lineClient.getProfile(userId)).displayName || userName; } catch (e) {}

          const paidPlan = getPlanByAmount(v.amount) || expectedPlan;
          const amountOk = !!paidPlan && (!expectedPlan || paidPlan.amount === v.amount);

          if (amountOk) {
            // ✅ mint a renewal code (audit trail) + redeem immediately for this user
            const issued = await issueRenewalCode({
              priceCode: String(paidPlan.amount),
              months: paidPlan.months,
              packageName: paidPlan.name,
              issuedBy: "slipok-auto",
              boundUserId: userId,
              refNote: `slip:${v.transRef || "n/a"}`,
            });
            const redeem = await redeemRenewalCode(issued.code, userId);

            await sUserRef.set({
              lastSlipUploadAt: FieldValue.serverTimestamp(),
              slipTransRef: v.transRef || null,
              slipAmount: v.amount,
              displayName: userName,
            }, { merge: true });

            if (redeem.success) {
              const expiryStr = new Date(redeem.newExpiry).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
              await lineClient.replyMessage(replyToken, buildRenewalSuccessFlex(userName, redeem.packageName, expiryStr, issued.code));
              try {
                await lineClient.pushMessage(SUPER_ADMIN_ID, {
                  type: "text",
                  text: `✅ ชำระเงินอัตโนมัติสำเร็จ (SlipOK)\n👤 ${userName}\n🆔 ${userId}\n📦 ${redeem.packageName}\n💰 ${v.amount}฿  🏦 ${v.bank || "-"}\n🔑 รหัส: ${issued.code}\n📅 หมดอายุ: ${expiryStr}\n🧾 ref: ${v.transRef || "-"}`,
                });
              } catch (e) {}
              return;
            }
          }

          // ⚠️ real slip but the amount doesn't match a plan → hand to admin
          await sUserRef.set({
            lastSlipUploadAt: FieldValue.serverTimestamp(),
            slipTransRef: v.transRef || null,
            slipAmount: v.amount,
            displayName: userName,
            subscriptionStatus: "slip_review",
          }, { merge: true });
          try {
            await lineClient.pushMessage(SUPER_ADMIN_ID, {
              type: "text",
              text: `🔎 สลิปจริงแต่ยอดไม่ตรงแพ็คเกจ — โปรดตรวจสอบ\n👤 ${userName}\n🆔 ${userId}\n💰 จ่ายจริง: ${v.amount}฿\n📦 เลือก: ${sUserData.selectedPackage || "-"} (${expectedAmount || "?"}฿)\n🧾 ref: ${v.transRef || "-"}\n\nเปิดสิทธิ์เอง: /approve ${userId} <ราคา>\nหรือออกรหัส: /code <ราคา> ${userId}`,
            });
          } catch (e) {}
          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: `✅ ได้รับสลิปแล้วครับ (ยอด ${v.amount}฿)\nยอดอาจไม่ตรงกับแพ็คเกจที่เลือกพอดี แอดมินกำลังตรวจสอบและจะเปิดสิทธิ์ให้เร็วที่สุดครับ ⏱️`,
          });
          return;
        }
        // not auto-verifiable → fall through to Gemini vision below
        console.log(`💸 SlipOK inconclusive → falling through to Gemini vision`);
      }
    } catch (slipErr) {
      console.error("⚠️ Slip auto-verify error (falling back to vision):", slipErr.message);
      // fall through to Gemini vision
    }

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
      const { GoogleGenerativeAI } = require("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      // 4. Prepare Prompt
      const prompt = `
      คุณคือ "WiT AI" ผู้ช่วยอัจฉริยะด้านวิศวกรรมพลาสติกและการฉีดขึ้นรูป (Injection Molding Expert) 🏭

      ภารกิจ: วิเคราะห์ภาพนี้เพื่อสนับสนุนงานวิศวกรรมและการผลิต:

      1. **หากเป็น "ปัญหาชิ้นงาน" (Defects):**
         - วิเคราะห์หาสาเหตุ (เช่น Sink mark, Warpage, Flash)
         - แนะนำแนวทางการปรับพารามิเตอร์เพื่อแก้ไข

      2. **หากเป็น "หน้าจอเครื่องจักร" (Machine Controller):**
         - อ่านค่าพารามิเตอร์ที่เห็น (เช่น Injection Speed, Pressure, Temperature)
         - แนะนำความเหมาะสมของค่าที่ตั้งไว้

      3. **หากเป็น "วัสดุพลาสติก" (Plastic Material):**
         - ระบุประเภทวัสดุ (หากมีป้ายหรือดูจากลักษณะ)
         - บอกคุณสมบัติเด็นและการใช้งานที่เหมาะสม

      4. **หากเป็น "สลิปโอนเงิน" (Bank Slip):**
         - ให้ขึ้นต้นด้วยคำว่า "SLIP_DETECTED"
         - ระบุยอดเงิน และธนาคาร เพื่อใช้ในการอัปเกรดสถานะผู้ใช้งาน

      5. **อื่นๆ:**
         - อธิบายสิ่งที่เห็นในมุมมองของวิศวกรโรงงานพลาสติก

      ตอบเป็นภาษาไทย กระชับ เป็นทางการแต่เข้าใจง่าย`;

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
        }, { merge: true });

        // Notify Super Admin (Push is OK here)
        // Use Global Super Admin ID
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

    const handled = await handleMarketplace({ lineClient, db }, event, userData);
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

    const handled = await handleMemoryWebhook({ lineClient, db }, event, userData);
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

    // 🔑 Renewal code redemption — ต่ออายุด้วยรหัส RENEW-XXXX-XXXX
    if (isRenewalCode(message.text)) {
      console.log(`🔑 Renewal code entered by ${userId}: ${message.text.trim()}`);
      const redeem = await redeemRenewalCode(message.text.trim(), userId);
      if (redeem.success) {
        let userName = "ผู้ใช้";
        try { userName = (await lineClient.getProfile(userId)).displayName || userName; } catch (e) {}
        const expiryStr = new Date(redeem.newExpiry).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
        await lineClient.replyMessage(replyToken, buildRenewalSuccessFlex(userName, redeem.packageName, expiryStr, message.text.trim()));
        try {
          await lineClient.pushMessage(SUPER_ADMIN_ID, {
            type: "text",
            text: `🔑 มีการใช้รหัสต่ออายุ\n👤 ${userName}\n🆔 ${userId}\n📦 ${redeem.packageName}\n📅 หมดอายุ: ${expiryStr}\n🔑 ${message.text.trim()}`,
          });
        } catch (e) {}
      } else {
        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: `❌ ${redeem.message}\n\nหากต้องการความช่วยเหลือ ติดต่อแอดมินได้เลยครับ`,
        });
      }
      return;
    }

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
        }, { merge: true });

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
      }, { merge: true });

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

    // 🔑 WEB LOGIN - ขอรหัสผ่านสำหรับ login wizmobiz.com
    if (message.text.includes("ขอรหัสผ่าน") ||
      message.text.includes("ขอ pin") ||
      message.text.includes("login web") ||
      message.text.toLowerCase().includes("getpin") ||
      message.text.includes("รหัสเข้าเว็บ")) {
      console.log(`🔑 User ${userId} requesting web login PIN`);

      const db = getFirestore();

      // ดึงข้อมูล User จาก line_users
      const userDoc = await db.collection("line_users").doc(userId).get();
      const lineUserData = userDoc.exists ? userDoc.data() : {};

      // ใช้ชื่อจาก LINE Profile ที่ส่งมาในตัว event หรือจาก database
      // 🛡️ SANITIZE: Remove fancy unicode symbols that might break LINE API
      let displayName = (lineUserData.displayName || userName || "User");
      displayName = displayName.replace(/[^\x00-\x7F\u0E00-\u0E7F ]/g, "").trim() || "User";

      const pictureUrl = lineUserData.pictureUrl || null;
      const isPremium = lineUserData.isPremium || false;

      // 🔒 CHECK PREMIUM: สงวนสิทธิ์การเข้าใช้งาน Web Login เฉพาะ Premium เท่านั้น
      if (!isPremium) {
        console.log(`🔒 Access Denied: User ${userId} is not premium`);
        await lineClient.replyMessage({
          replyToken: replyToken,
          messages: [{
            type: "flex",
            altText: "🔒 เฉพาะสมาชิก Premium เท่านั้น",
            contents: {
              type: "bubble",
              size: "kilo",
              header: {
                type: "box",
                layout: "vertical",
                backgroundColor: "#ef4444",
                paddingAll: "15px",
                contents: [
                  { type: "text", text: "🔒 สงวนสิทธิ์เข้าใช้งาน", weight: "bold", size: "lg", color: "#ffffff", align: "center" }
                ]
              },
              body: {
                type: "box",
                layout: "vertical",
                spacing: "md",
                paddingAll: "20px",
                contents: [
                  { type: "text", text: "ขออภัยครับ ฟีเจอร์นี้สำหรับสมาชิก Premium เท่านั้น", weight: "bold", size: "sm", color: "#333333", align: "center", wrap: true },
                  { type: "text", text: "การเข้าสู่ระบบผ่านเว็บเพื่อใช้งาน Marketplace หรือฟีเจอร์พิเศษ จำเป็นต้องมีสถานะสมาชิก", size: "xs", color: "#666666", align: "center", wrap: true, margin: "md" },
                  {
                    type: "box",
                    layout: "vertical",
                    margin: "lg",
                    spacing: "sm",
                    contents: [
                      {
                        type: "button",
                        style: "primary",
                        action: { type: "uri", label: "สมัครสมาชิก Premium", uri: "https://lin.ee/ayl8y1H" },
                        color: "#667eea",
                        height: "sm"
                      },
                      {
                        type: "button",
                        style: "link",
                        action: { type: "uri", label: "ติดต่อแอดมิน", uri: "https://lin.ee/ayl8y1H" },
                        color: "#999999",
                        height: "sm"
                      }
                    ]
                  }
                ]
              }
            }
          }]
        });

        // 🚨 NOTIFY SUPER ADMIN
        // Use Global Super Admin ID
        await lineClient.pushMessage(SUPER_ADMIN_ID, [{
          type: "flex",
          altText: "⚠️ Access Denied Report",
          contents: {
            type: "bubble",
            header: {
              type: "box",
              layout: "vertical",
              backgroundColor: "#fbbf24",
              paddingAll: "10px",
              contents: [
                { type: "text", text: "⚠️ Access Attempt blocked", weight: "bold", size: "sm", color: "#ffffff" }
              ]
            },
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "text", text: `User: ${displayName}`, size: "sm", weight: "bold" },
                { type: "text", text: "Action: Request Web Login", size: "xs", color: "#666666" },
                { type: "text", text: "Result: Denied (Not Premium)", size: "xs", color: "#ef4444" }
              ]
            }
          }
        }]);

        return;
      }

      // ลบ PIN เก่าและบังคับ logout จากทุกอุปกรณ์
      const existingPinDoc = await db.collection("web_login_pins").doc(userId).get();
      if (existingPinDoc.exists) {
        const oldPinData = existingPinDoc.data();
        // บันทึก log ว่า PIN เก่าถูก invalidate
        console.log(`🔄 Invalidating old PIN for user ${userId}, old device: ${oldPinData.boundDeviceId || 'none'}`);
        // ลบ PIN เก่า
        await db.collection("web_login_pins").doc(userId).delete();
      }

      // สร้าง PIN 6 หลัก (ตัวเลขล้วน)
      const generatePIN = () => {
        let pin = "";
        for (let i = 0; i < 6; i++) {
          pin += Math.floor(Math.random() * 10).toString();
        }
        return pin;
      };

      const pin = generatePIN();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // หมดอายุใน 24 ชม.

      // บันทึก PIN ใน Firestore (ใช้ PIN เป็น ID เพื่อให้ค้นหาได้เร็ว)
      await db.collection("web_pins").doc(pin).set({
        pin: pin,
        lineUserId: userId,
        userId: userId, // เพิ่ม field นี้เผื่อไว้
        displayName: displayName,
        pictureUrl: pictureUrl,
        isPremium: isPremium,
        createdAt: FieldValue.serverTimestamp(),
        expiresAt: expiresAt,
        used: false,
      });

      // 🔍 DEBUG: Log values before creating Flex Message
      console.log(`🔍 PIN Flex Message Data (Numeric): pin=${pin}, user=${displayName}`);

      // Validate required fields
      if (!pin || !displayName) {
        console.error(`❌ Missing required fields: pin=${pin}, displayName=${displayName}`);
        await lineClient.replyMessage({
          replyToken: replyToken,
          messages: [{
            type: "text",
            text: `❌ เกิดข้อผิดพลาดในการสร้างรหัส PIN กรุณาลองใหม่อีกครั้ง`
          }]
        });
        return;
      }

      // ส่ง PIN ให้ User แบบ Flex Message (SDK v9/v10 format)
      try {
        await lineClient.replyMessage({
          replyToken: replyToken,
          messages: [{
            type: "flex",
            altText: `Login PIN: ${pin}`,
            contents: {
              type: "bubble",
              size: "kilo",
              header: {
                type: "box",
                layout: "vertical",
                backgroundColor: "#06C755",
                paddingAll: "15px",
                contents: [
                  { type: "text", text: "🔐 รหัสเข้าเว็บไซต์", weight: "bold", size: "lg", color: "#ffffff", align: "center" },
                ],
              },
              body: {
                type: "box",
                layout: "vertical",
                spacing: "md",
                paddingAll: "20px",
                contents: [
                  { type: "text", text: "รหัส PIN ของคุณ", size: "sm", color: "#666666", align: "center" },
                  {
                    type: "box",
                    layout: "vertical",
                    backgroundColor: "#f0faf0",
                    cornerRadius: "10px",
                    paddingAll: "15px",
                    margin: "md",
                    contents: [
                      { type: "text", text: pin.toString(), weight: "bold", size: "4xl", color: "#06C755", align: "center" },
                    ],
                  },
                  { type: "separator", margin: "lg" },
                  { type: "text", text: `👤 ${displayName}`, size: "sm", color: "#333333", margin: "md" },
                  { type: "text", text: isPremium ? "💎 Premium Member" : "🆓 Free Member", size: "sm", color: isPremium ? "#f59e0b" : "#666666" },
                  { type: "text", text: `⏱️ หมดอายุใน 24 ชั่วโมง`, size: "xs", color: "#999999", margin: "md" },
                ],
              },
              footer: {
                type: "box",
                layout: "vertical",
                spacing: "sm",
                paddingAll: "15px",
                contents: [
                  {
                    type: "button",
                    style: "primary",
                    color: "#06C755",
                    action: { type: "uri", label: "🌐 เข้าสู่ระบบ Wit365", uri: "https://tuktukfeed.com/login.html" },
                  },
                  {
                    type: "button",
                    style: "secondary",
                    action: { type: "message", label: "🔄 ขอรหัสใหม่", text: "ขอรหัสผ่าน" },
                  },
                  { type: "text", text: "กรอกรหัสนี้ที่หน้า Login", size: "xs", color: "#999999", align: "center", margin: "md" },
                ],
              },
            },
          }]
        });
        console.log(`✅ PIN Flex Message sent successfully`);
      } catch (error) {
        console.error(`❌ LINE API Error:`, error.message);
        if (error.body) console.error(`📦 Error Body:`, JSON.stringify(error.body));

        // Fallback: ใช้ pushMessage เพราะ Reply Token อาจจะตายไปแล้ว
        try {
          await lineClient.pushMessage({
            to: userId,
            messages: [{
              type: "text",
              text: `🔑 รหัสเข้าเว็บไซต์: ${pin}\n👤 User: ${displayName}\n🌐 https://wit365.net/login.html`
            }]
          });
          console.log(`✅ Fallback PIN sent via pushMessage`);
        } catch (innerError) {
          console.error("❌ Fallback (Push) also failed:", innerError.message);
        }
      }
      return;
    }

    // 🏢 JOIN TEAM - เข้าร่วมทีมด้วยรหัส Org Code
    const joinTeamMatch = message.text.match(/(?:เข้าร่วม|join|jointeam|เข้าทีม)\s*([A-Z]{2,10}\d{0,5})/i);
    if (joinTeamMatch) {
      const orgCode = joinTeamMatch[1].toUpperCase();
      console.log(`🏢 User ${userId} joining team: ${orgCode}`);

      const db = getFirestore();

      // ค้นหา Team Admin ที่มี orgCode นี้
      const teamAdminSnapshot = await db.collection("line_users")
        .where("orgCode", "==", orgCode)
        .where("isTeamAdmin", "==", true)
        .limit(1)
        .get();

      if (teamAdminSnapshot.empty) {
        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: `❌ **ไม่พบทีม: ${orgCode}**\n\n` +
            `กรุณาตรวจสอบรหัสทีมอีกครั้ง\n` +
            `หรือติดต่อผู้ดูแลทีมของคุณ`,
        });
        return;
      }

      const teamAdminDoc = teamAdminSnapshot.docs[0];
      const teamAdminData = teamAdminDoc.data();

      // ตรวจสอบว่า Team ยังมี slot เหลือ (สูงสุด 10 คน/ทีม)
      const teamMembersSnapshot = await db.collection("line_users")
        .where("orgCode", "==", orgCode)
        .get();

      const maxTeamMembers = 10;
      if (teamMembersSnapshot.size >= maxTeamMembers) {
        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: `⚠️ **ทีม ${orgCode} เต็มแล้ว**\n\n` +
            `จำนวนสมาชิกสูงสุด: ${maxTeamMembers} คน\n` +
            `กรุณาติดต่อผู้ดูแลทีมเพื่ออัปเกรด`,
        });
        return;
      }

      // เพิ่ม user เข้าทีม + รับ Premium status เหมือน Admin
      await userRef.update({
        orgCode: orgCode,
        teamRole: "member",
        isTeamAdmin: false,
        isPremium: true,
        subscriptionStatus: "active",
        premiumExpiry: teamAdminData.premiumExpiry,
        selectedPackage: teamAdminData.selectedPackage || "Team Member",
        joinedTeamAt: FieldValue.serverTimestamp(),
      });

      const expiryDate = teamAdminData.premiumExpiry?.toDate?.() || teamAdminData.premiumExpiry;
      const expiryStr = expiryDate ? new Date(expiryDate).toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }) : "ไม่ระบุ";

      await lineClient.replyMessage({
        replyToken: replyToken,
        messages: [{
          type: "text",
          text: `🎉 **เข้าร่วมทีมสำเร็จ!**\n\n` +
            `🏢 ทีม: ${orgCode}\n` +
            `👑 Admin: ${teamAdminData.displayName || "Unknown"}\n` +
            `📅 หมดอายุ: ${expiryStr}\n` +
            `👥 สมาชิก: ${teamMembersSnapshot.size + 1}/${maxTeamMembers} คน\n\n` +
            `✅ คุณได้รับสิทธิ์ Premium แล้ว!\n` +
            `สามารถใช้งานได้ไม่จำกัดครับ 💎`,
        }]
      });
      return;
    }

    // 3. Handle General Subscription Request - ใช้ Flex Message Carousel สวยงาม
    if (message.text.includes("สนใจสมัคร") || message.text.includes("สมัครสมาชิก") || message.text.includes("ขอสมัคร") || message.text.toLowerCase().includes("upgrade") || message.text.includes("/upgrade")) {
      console.log(`💰 User ${userId} requested subscription info`);

      await userRef.set({
        subscriptionStatus: "interested",
        lastRequestAt: FieldValue.serverTimestamp(),
      }, { merge: true });

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
                { type: "action", action: { type: "message", label: "👤 รายเดือน (99฿)", text: "เลือกรายเดือน" } },
                { type: "action", action: { type: "message", label: "🔥 รายปี (699฿)", text: "เลือกรายปี" } },
                { type: "action", action: { type: "message", label: "🏢 ทีมรายเดือน (399฿)", text: "เลือกทีมรายเดือน" } },
                { type: "action", action: { type: "message", label: "🏆 ทีมรายปี (2,490฿)", text: "เลือกทีมรายปี" } },
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
              { type: "action", action: { type: "message", label: "👤 รายเดือน (99฿)", text: "เลือกรายเดือน" } },
              { type: "action", action: { type: "message", label: "🔥 รายปี (699฿)", text: "เลือกรายปี" } },
            ],
          },
        });
      }
      return;
    }

    // 2. Check User Status & Quota
    const userDoc = await userRef.get();
    // userData already declared at function scope, just reset default values
    userData = { usageCount: 0, isPremium: false };

    if (userDoc.exists) {
      userData = userDoc.data();

      // 🛠️ Fix: Update display name if missing or default
      if (!userData.displayName || userData.displayName === "New User" || userData.displayName === "User") {
        try {
          const profile = await lineClient.getProfile(userId);
          if (profile.displayName) {
            userData.displayName = profile.displayName;
            // Update in background
            userRef.update({ displayName: profile.displayName }).catch((e) => console.error(e));
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
                  { type: "action", action: { type: "message", label: "👁️ วิเคราะห์ภาพ", text: "วิเคราะห์ภาพ" } },
                  { type: "action", action: { type: "message", label: "❓ ถามปัญหา", text: "รอยไหม้เกิดจากอะไร" } },
                  { type: "action", action: { type: "message", label: "📊 คำนวณ", text: "เมนูคำนวณ" } },
                  { type: "action", action: { type: "message", label: "🌱 เกษตร", text: "ปรึกษาเรื่องเกษตรครับ" } },
                  { type: "action", action: { type: "message", label: "💎 สมัคร Premium", text: "สนใจสมัคร Premium" } },
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
                { type: "action", action: { type: "message", label: "👁️ วิเคราะห์ภาพ", text: "วิเคราะห์ภาพ" } },
                { type: "action", action: { type: "message", label: "💎 สมัคร Premium", text: "สนใจสมัคร Premium" } },
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
              { type: "action", action: { type: "message", label: "📖 บทที่ 1", text: "บทที่ 1" } },
              { type: "action", action: { type: "message", label: "📚 หลักสูตร", text: "หลักสูตรฉีด" } },
              { type: "action", action: { type: "message", label: "📝 Quiz", text: "quiz ฉีดพลาสติก" } },
              { type: "action", action: { type: "message", label: "🏠 เมนูหลัก", text: "/help" } },
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
                { type: "action", action: { type: "message", label: `📖 บทที่ ${nextLesson}`, text: `บทที่ ${nextLesson}` } },
                { type: "action", action: { type: "message", label: "📝 Quiz", text: "quiz ฉีดพลาสติก" } },
                { type: "action", action: { type: "message", label: "📈 ความก้าวหน้า", text: "ความก้าวหน้าฉีด" } },
                { type: "action", action: { type: "message", label: "📚 หลักสูตร", text: "หลักสูตรฉีด" } },
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
                { type: "action", action: { type: "message", label: "📖 เริ่มเรียน", text: "เริ่มเรียนฉีด" } },
                { type: "action", action: { type: "message", label: "📝 Quiz", text: "quiz ฉีดพลาสติก" } },
                { type: "action", action: { type: "message", label: "📚 หลักสูตร", text: "หลักสูตรฉีด" } },
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
              { type: "action", action: { type: "message", label: "A", text: "A" } },
              { type: "action", action: { type: "message", label: "B", text: "B" } },
              { type: "action", action: { type: "message", label: "C", text: "C" } },
              { type: "action", action: { type: "message", label: "📚 หลักสูตร", text: "หลักสูตรฉีด" } },
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
              { type: "action", action: { type: "message", label: "📊 ตารางอบ", text: "ตารางอบเม็ด" } },
              { type: "action", action: { type: "message", label: "❄️ ตารางเย็น", text: "ตารางเย็น" } },
              { type: "action", action: { type: "message", label: "💪 ตารางแรงดัน", text: "ตารางแรงดันฉีด" } },
              { type: "action", action: { type: "message", label: "📚 หลักสูตร", text: "หลักสูตรฉีด" } },
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
                  { type: "text", text: "🤖 AI Expert Explanation", weight: "bold", size: "lg", color: "#FFFFFF" },
                ],
                backgroundColor: "#4F46E5",
                paddingAll: "15px",
              },
              body: {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: aiExplanation, wrap: true, size: "sm", color: "#333333" },
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
          const userData = userDoc.data()?.education || { xp: 0, level: 1, streak: 0, badges: [], lessonsCompleted: 0, quizScore: 0 };
          const dashboardFlex = createProgressDashboardFlex(userData);
          await lineClient.replyMessage(replyToken, dashboardFlex);
          console.log("✅ Sent Progress Dashboard");
        } catch (err) {
          console.error("Dashboard Error:", err);
          const defaultDashboard = createProgressDashboardFlex({ xp: 0, level: 1, streak: 0, badges: [], lessonsCompleted: 0, quizScore: 0 });
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
          const leaderboardFlex = createLeaderboardFlex([{ name: "คุณ", xp: 0, level: 1 }]);
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
            const { GoogleGenerativeAI } = require("@google/generative-ai");
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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
                    { type: "text", text: `📚 ${subjectName}`, weight: "bold", size: "lg", color: "#FFFFFF" },
                    { type: "text", text: `🎓 ${levelName}`, size: "sm", color: "#E0E0E0" },
                  ],
                  backgroundColor: "#6366F1",
                  paddingAll: "15px",
                },
                body: {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    { type: "text", text: aiResponse, wrap: true, size: "sm", color: "#333333" },
                  ],
                  paddingAll: "15px",
                },
                footer: {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    { type: "button", action: { type: "message", label: "💬 ถาม WiT", text: `/tutor explain สอนเรื่อง${subjectName} ${levelName}` }, style: "primary", color: "#6366F1", height: "sm" },
                    { type: "button", action: { type: "message", label: "◀ กลับ", text: `/edu ${levelId}` }, style: "secondary", height: "sm", margin: "sm" },
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
        }, { merge: true });

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
          challengeQuestion = `🎯 **${challenge.title}**\n\n📚 จำคำศัพท์เหล่านี้:\n\n${words.slice(0, 5).map((w, i) => `${i + 1}. ${w}`).join("\n")}\n\n✅ พิมพ์ "พร้อม" เมื่อจำได้แล้ว`;
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
            { q: "ดวงอาทิตย์ขึ้นทางทิศตะวันออก", a: true },
            { q: "น้ำเดือดที่อุณหภูมิ 50°C", a: false },
            { q: "ประเทศไทยมี 77 จังหวัด", a: true },
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
              { type: "action", action: { type: "message", label: "📝 ข้อสอบเพิ่ม", text: `สร้างข้อสอบ ${topic} เพิ่มอีก 5 ข้อ` } },
              { type: "action", action: { type: "message", label: "📚 อธิบายเฉลย", text: `อธิบายเฉลยข้อสอบ ${topic}` } },
              { type: "action", action: { type: "message", label: "🏠 เมนูหลัก", text: "/edu" } },
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
              { type: "action", action: { type: "message", label: "📇 เพิ่มคำศัพท์", text: `สร้างบัตรคำ ${topic} เพิ่มอีก 10 คำ` } },
              { type: "action", action: { type: "message", label: "📝 ทดสอบคำศัพท์", text: `สร้างข้อสอบคำศัพท์ ${topic}` } },
              { type: "action", action: { type: "message", label: "🏠 เมนูหลัก", text: "/edu" } },
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
              { type: "action", action: { type: "message", label: "🔍 ขยายหัวข้อ", text: `อธิบายเพิ่มเติมเรื่อง ${topic}` } },
              { type: "action", action: { type: "message", label: "📝 ทดสอบความรู้", text: `สร้างข้อสอบ ${topic}` } },
              { type: "action", action: { type: "message", label: "🏠 เมนูหลัก", text: "/edu" } },
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
              { type: "action", action: { type: "message", label: "📝 แบบฝึกหัด", text: `สร้างแบบฝึกหัด ${topic}` } },
              { type: "action", action: { type: "message", label: "🔄 ปรับแผน", text: `ปรับแผนการเรียน ${topic} ให้เข้มข้นขึ้น` } },
              { type: "action", action: { type: "message", label: "🏠 เมนูหลัก", text: "/edu" } },
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
              { type: "action", action: { type: "message", label: "❓ โจทย์คล้ายกัน", text: `สร้างโจทย์คล้ายกับ ${problem}` } },
              { type: "action", action: { type: "message", label: "📝 แบบฝึกหัด", text: "สร้างแบบฝึกหัดคณิตศาสตร์" } },
              { type: "action", action: { type: "message", label: "🏠 เมนูหลัก", text: "/edu" } },
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
                      { type: "text", text: "🎉 ยอดเยี่ยม!", weight: "bold", size: "xl", color: "#10B981", align: "center" },
                      { type: "text", text: `คำตอบที่ถูก: ${gameState.answer}`, size: "md", color: "#333333", align: "center", margin: "md" },
                      {
                        type: "box", layout: "horizontal", contents: [
                          { type: "text", text: "+20 XP", weight: "bold", size: "lg", color: "#F59E0B", align: "center" },
                        ], backgroundColor: "#FEF3C7", paddingAll: "10px", cornerRadius: "md", margin: "md"
                      },
                      { type: "text", text: `🏆 เกมที่ชนะ: ${gamesWon} | XP: ${newXP}`, size: "sm", color: "#666666", align: "center", margin: "md" },
                    ],
                    paddingAll: "20px",
                    backgroundColor: "#F0FDF4",
                  },
                  footer: {
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      { type: "button", action: { type: "message", label: "🔄 เล่นอีก", text: "/game word_scramble" }, style: "primary", color: "#10B981", height: "sm" },
                      { type: "button", action: { type: "message", label: "🎮 เกมอื่น", text: "/edu games" }, style: "secondary", height: "sm", margin: "sm" },
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
                      { type: "text", text: "❌ ยังไม่ถูก!", weight: "bold", size: "xl", color: "#EF4444", align: "center" },
                      { type: "text", text: `ตัวอักษร: ${gameState.scrambled}`, size: "md", color: "#333333", align: "center", margin: "md" },
                      { type: "text", text: "💡 Hint: " + gameState.hint, size: "sm", color: "#6B7280", align: "center", margin: "sm", wrap: true },
                    ],
                    paddingAll: "20px",
                    backgroundColor: "#FEF2F2",
                  },
                  footer: {
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      { type: "button", action: { type: "message", label: "🔄 ลองใหม่", text: "/game word_scramble" }, style: "secondary", height: "sm" },
                      { type: "button", action: { type: "message", label: "💡 เฉลย", text: `/game word_scramble reveal` }, style: "secondary", height: "sm", margin: "sm" },
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
          await userRef.update({ "currentGame": null });

          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: `💡 เฉลย: ${gameState.answer || "ไม่พบคำตอบ"}\n\n📚 ความหมาย: ${gameState.hint || "-"}\n\nลองเล่นใหม่นะ!`,
            quickReply: {
              items: [
                { type: "action", action: { type: "message", label: "🔄 เล่นใหม่", text: "/game word_scramble" } },
                { type: "action", action: { type: "message", label: "🎮 เกมอื่น", text: "/edu games" } },
              ],
            },
          });
          return;
        }

        // สร้างเกมใหม่
        const words = [
          { word: "APPLE", hint: "ผลไม้สีแดงหรือเขียว 🍎", thai: "แอปเปิ้ล" },
          { word: "SCHOOL", hint: "สถานที่เรียนหนังสือ 🏫", thai: "โรงเรียน" },
          { word: "FRIEND", hint: "คนที่เราสนิทด้วย 👫", thai: "เพื่อน" },
          { word: "HAPPY", hint: "ความรู้สึกดีใจ 😊", thai: "มีความสุข" },
          { word: "WATER", hint: "ของเหลวที่ดื่มได้ 💧", thai: "น้ำ" },
          { word: "MUSIC", hint: "เสียงเพลง 🎵", thai: "ดนตรี" },
          { word: "FLOWER", hint: "พืชที่มีกลิ่นหอม 🌸", thai: "ดอกไม้" },
          { word: "ORANGE", hint: "ผลไม้สีส้ม 🍊", thai: "ส้ม" },
          { word: "TIGER", hint: "สัตว์ป่าลายพาดกลอน 🐅", thai: "เสือ" },
          { word: "CHICKEN", hint: "สัตว์ปีกที่เราเลี้ยง 🐔", thai: "ไก่" },
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
        }, { merge: true });

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
                { type: "text", text: "🔤 Word Scramble", weight: "bold", size: "xl", color: "#FFFFFF" },
                { type: "text", text: "เรียงตัวอักษรให้เป็นคำ!", size: "sm", color: "#DBEAFE" },
              ],
              backgroundColor: "#3B82F6",
              paddingAll: "20px",
            },
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "box", layout: "vertical", contents: [
                    { type: "text", text: scrambled, weight: "bold", size: "xxl", color: "#1E40AF", align: "center", wrap: true },
                  ], backgroundColor: "#EFF6FF", paddingAll: "20px", cornerRadius: "lg"
                },
                { type: "separator", margin: "lg" },
                { type: "text", text: "💡 Hint:", weight: "bold", size: "md", color: "#6B7280", margin: "md" },
                { type: "text", text: randomWord.hint, size: "md", color: "#333333", wrap: true },
                { type: "text", text: `🇹🇭 ภาษาไทย: ${randomWord.thai}`, size: "sm", color: "#666666", margin: "md" },
                { type: "separator", margin: "lg" },
                { type: "text", text: "📝 พิมพ์คำตอบ:", weight: "bold", size: "md", color: "#10B981", margin: "md" },
                { type: "text", text: "/game word_scramble answer [คำตอบ]", size: "sm", color: "#666666" },
              ],
              paddingAll: "20px",
            },
            footer: {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "button", action: { type: "message", label: "🔄 สุ่มใหม่", text: "/game word_scramble" }, style: "secondary", height: "sm" },
                { type: "button", action: { type: "message", label: "💡 เฉลย", text: "/game word_scramble reveal" }, style: "secondary", height: "sm", margin: "sm" },
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
                      { type: "text", text: "🎉 ถูกต้อง!", weight: "bold", size: "xl", color: "#10B981", align: "center" },
                      { type: "text", text: `${gameState.question} = ${gameState.answer}`, size: "lg", color: "#333333", align: "center", margin: "md" },
                      { type: "text", text: `⏱️ เวลา: ${timeTaken} วินาที`, size: "md", color: "#6B7280", align: "center", margin: "sm" },
                      ...(speedBonus ? [{ type: "text", text: speedBonus, weight: "bold", size: "md", color: "#F59E0B", align: "center", margin: "sm" }] : []),
                      {
                        type: "box", layout: "horizontal", contents: [
                          { type: "text", text: `+${totalXP} XP`, weight: "bold", size: "lg", color: "#10B981", align: "center" },
                        ], backgroundColor: "#D1FAE5", paddingAll: "10px", cornerRadius: "md", margin: "md"
                      },
                    ],
                    paddingAll: "20px",
                    backgroundColor: "#F0FDF4",
                  },
                  footer: {
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      { type: "button", action: { type: "message", label: "🔄 เล่นอีก", text: "/game math_race" }, style: "primary", color: "#10B981", height: "sm" },
                      { type: "button", action: { type: "message", label: "🎮 เกมอื่น", text: "/edu games" }, style: "secondary", height: "sm", margin: "sm" },
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
                      { type: "text", text: "❌ ผิด!", weight: "bold", size: "xl", color: "#EF4444", align: "center" },
                      { type: "text", text: `${gameState.question} = ?`, size: "lg", color: "#333333", align: "center", margin: "md" },
                      { type: "text", text: `คำตอบของคุณ: ${userAnswer}`, size: "md", color: "#6B7280", align: "center", margin: "sm" },
                    ],
                    paddingAll: "20px",
                    backgroundColor: "#FEF2F2",
                  },
                  footer: {
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      { type: "button", action: { type: "message", label: "🔄 โจทย์ใหม่", text: "/game math_race" }, style: "secondary", height: "sm" },
                      { type: "button", action: { type: "message", label: "💡 เฉลย", text: `/game math_race reveal` }, style: "secondary", height: "sm", margin: "sm" },
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
          await userRef.update({ "currentGame": null });

          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: `💡 เฉลย: ${gameState.question || "?"} = ${gameState.answer || "?"}\n\nลองเล่นใหม่นะ!`,
            quickReply: {
              items: [
                { type: "action", action: { type: "message", label: "🔄 เล่นใหม่", text: "/game math_race" } },
                { type: "action", action: { type: "message", label: "🎮 เกมอื่น", text: "/edu games" } },
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
        }, { merge: true });

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
                { type: "text", text: "🏎️ Math Race", weight: "bold", size: "xl", color: "#FFFFFF" },
                { type: "text", text: "ตอบให้เร็วได้ Bonus XP!", size: "sm", color: "#FEF3C7" },
              ],
              backgroundColor: "#F59E0B",
              paddingAll: "20px",
            },
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "box", layout: "vertical", contents: [
                    { type: "text", text: question, weight: "bold", size: "xxl", color: "#B45309", align: "center" },
                    { type: "text", text: "= ?", weight: "bold", size: "xl", color: "#B45309", align: "center", margin: "sm" },
                  ], backgroundColor: "#FEF3C7", paddingAll: "25px", cornerRadius: "lg"
                },
                { type: "separator", margin: "lg" },
                { type: "text", text: "⚡ Speed Bonus:", weight: "bold", size: "md", color: "#F59E0B", margin: "md" },
                { type: "text", text: "≤5 วินาที = +15 XP | ≤10 วินาที = +10 XP", size: "sm", color: "#666666" },
                { type: "separator", margin: "lg" },
                { type: "text", text: "📝 พิมพ์คำตอบ:", weight: "bold", size: "md", color: "#10B981", margin: "md" },
                { type: "text", text: "/game math_race answer [ตัวเลข]", size: "sm", color: "#666666" },
              ],
              paddingAll: "20px",
            },
            footer: {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "button", action: { type: "message", label: "🔄 โจทย์ใหม่", text: "/game math_race" }, style: "secondary", height: "sm" },
                { type: "button", action: { type: "message", label: "🎮 เกมอื่น", text: "/edu games" }, style: "secondary", height: "sm", margin: "sm" },
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
                      { type: "text", text: "🎉 ถูกต้อง!", weight: "bold", size: "xl", color: "#10B981", align: "center" },
                      { type: "text", text: `คำตอบ: ${gameState.answer ? "✅ จริง" : "❌ เท็จ"}`, size: "md", color: "#333333", align: "center", margin: "md" },
                      { type: "text", text: `💡 ${gameState.explanation}`, size: "sm", color: "#666666", align: "center", margin: "md", wrap: true },
                      {
                        type: "box", layout: "horizontal", contents: [
                          { type: "text", text: "+18 XP", weight: "bold", size: "lg", color: "#10B981", align: "center" },
                        ], backgroundColor: "#D1FAE5", paddingAll: "10px", cornerRadius: "md", margin: "md"
                      },
                    ],
                    paddingAll: "20px",
                    backgroundColor: "#F0FDF4",
                  },
                  footer: {
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      { type: "button", action: { type: "message", label: "🔄 เล่นอีก", text: "/game true_false" }, style: "primary", color: "#10B981", height: "sm" },
                      { type: "button", action: { type: "message", label: "🎮 เกมอื่น", text: "/edu games" }, style: "secondary", height: "sm", margin: "sm" },
                    ],
                    paddingAll: "10px",
                  },
                },
              });
            } else {
              await userRef.update({ "currentGame": null });

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
                      { type: "text", text: "❌ ผิด!", weight: "bold", size: "xl", color: "#EF4444", align: "center" },
                      { type: "text", text: `คำตอบที่ถูก: ${gameState.answer ? "✅ จริง" : "❌ เท็จ"}`, size: "md", color: "#333333", align: "center", margin: "md" },
                      { type: "text", text: `💡 ${gameState.explanation}`, size: "sm", color: "#666666", align: "center", margin: "md", wrap: true },
                    ],
                    paddingAll: "20px",
                    backgroundColor: "#FEF2F2",
                  },
                  footer: {
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      { type: "button", action: { type: "message", label: "🔄 เล่นอีก", text: "/game true_false" }, style: "secondary", height: "sm" },
                      { type: "button", action: { type: "message", label: "🎮 เกมอื่น", text: "/edu games" }, style: "secondary", height: "sm", margin: "sm" },
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
          { question: "ดวงอาทิตย์โคจรรอบโลก", answer: false, explanation: "โลกโคจรรอบดวงอาทิตย์ ไม่ใช่ดวงอาทิตย์โคจรรอบโลก" },
          { question: "น้ำเดือดที่อุณหภูมิ 100°C", answer: true, explanation: "ที่ความดันปกติ น้ำจะเดือดที่ 100 องศาเซลเซียส" },
          { question: "แมวเป็นสัตว์เลี้ยงลูกด้วยนม", answer: true, explanation: "แมวเป็นสัตว์เลี้ยงลูกด้วยนมในอันดับ Carnivora" },
          { question: "กรุงเทพฯ เป็นเมืองหลวงของเวียดนาม", answer: false, explanation: "กรุงเทพฯ เป็นเมืองหลวงของประเทศไทย ไม่ใช่เวียดนาม" },
          { question: "เลข 0 เป็นจำนวนคู่", answer: true, explanation: "เลข 0 หารด้วย 2 ลงตัว จึงเป็นจำนวนคู่" },
          { question: "ปลาวาฬเป็นปลา", answer: false, explanation: "ปลาวาฬเป็นสัตว์เลี้ยงลูกด้วยนม ไม่ใช่ปลา" },
          { question: "พระอาทิตย์ขึ้นทางทิศตะวันออก", answer: true, explanation: "พระอาทิตย์ขึ้นทางทิศตะวันออกและตกทางทิศตะวันตก" },
          { question: "ประเทศไทยมี 77 จังหวัด", answer: true, explanation: "ประเทศไทยมีทั้งหมด 77 จังหวัด" },
          { question: "1 กิโลกรัม เท่ากับ 100 กรัม", answer: false, explanation: "1 กิโลกรัม เท่ากับ 1,000 กรัม ไม่ใช่ 100 กรัม" },
          { question: "เพชรแข็งกว่าเหล็ก", answer: true, explanation: "เพชรเป็นแร่ที่แข็งที่สุดในโลก (ระดับ 10 ในสเกลโมห์ส)" },
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
        }, { merge: true });

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
                { type: "text", text: "✅ True or False", weight: "bold", size: "xl", color: "#FFFFFF" },
                { type: "text", text: "ข้อความนี้จริงหรือเท็จ?", size: "sm", color: "#D1FAE5" },
              ],
              backgroundColor: "#8B5CF6",
              paddingAll: "20px",
            },
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "box", layout: "vertical", contents: [
                    { type: "text", text: "❓", size: "xxl", align: "center" },
                    { type: "text", text: randomQ.question, weight: "bold", size: "lg", color: "#1F2937", align: "center", wrap: true, margin: "md" },
                  ], backgroundColor: "#F3E8FF", paddingAll: "20px", cornerRadius: "lg"
                },
                { type: "separator", margin: "lg" },
                { type: "text", text: "🎯 ตอบได้เลย:", weight: "bold", size: "md", color: "#8B5CF6", margin: "md", align: "center" },
              ],
              paddingAll: "20px",
            },
            footer: {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "button", action: { type: "message", label: "✅ จริง", text: "/game true_false true" }, style: "primary", color: "#10B981", height: "sm" },
                { type: "button", action: { type: "message", label: "❌ เท็จ", text: "/game true_false false" }, style: "primary", color: "#EF4444", height: "sm", margin: "md" },
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
                      { type: "text", text: "🎉 เยี่ยมมาก!", weight: "bold", size: "xl", color: "#10B981", align: "center" },
                      { type: "text", text: gameState.fullSentence, size: "md", color: "#333333", align: "center", margin: "md", wrap: true },
                      {
                        type: "box", layout: "horizontal", contents: [
                          { type: "text", text: "+22 XP", weight: "bold", size: "lg", color: "#10B981", align: "center" },
                        ], backgroundColor: "#D1FAE5", paddingAll: "10px", cornerRadius: "md", margin: "md"
                      },
                    ],
                    paddingAll: "20px",
                    backgroundColor: "#F0FDF4",
                  },
                  footer: {
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      { type: "button", action: { type: "message", label: "🔄 เล่นอีก", text: "/game fill_blank" }, style: "primary", color: "#10B981", height: "sm" },
                      { type: "button", action: { type: "message", label: "🎮 เกมอื่น", text: "/edu games" }, style: "secondary", height: "sm", margin: "sm" },
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
                      { type: "text", text: "❌ ยังไม่ถูก!", weight: "bold", size: "xl", color: "#EF4444", align: "center" },
                      { type: "text", text: gameState.sentence, size: "md", color: "#333333", align: "center", margin: "md", wrap: true },
                      { type: "text", text: `💡 Hint: ${gameState.hint}`, size: "sm", color: "#6B7280", align: "center", margin: "sm" },
                    ],
                    paddingAll: "20px",
                    backgroundColor: "#FEF2F2",
                  },
                  footer: {
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      { type: "button", action: { type: "message", label: "🔄 ลองใหม่", text: "/game fill_blank" }, style: "secondary", height: "sm" },
                      { type: "button", action: { type: "message", label: "💡 เฉลย", text: "/game fill_blank reveal" }, style: "secondary", height: "sm", margin: "sm" },
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
          await userRef.update({ "currentGame": null });

          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: `💡 เฉลย: ${gameState.answer || "?"}\n\n📝 ประโยคเต็ม: ${gameState.fullSentence || "-"}\n\nลองเล่นใหม่นะ!`,
            quickReply: {
              items: [
                { type: "action", action: { type: "message", label: "🔄 เล่นใหม่", text: "/game fill_blank" } },
                { type: "action", action: { type: "message", label: "🎮 เกมอื่น", text: "/edu games" } },
              ],
            },
          });
          return;
        }

        // สร้างโจทย์เติมคำ
        const sentences = [
          { sentence: "The sun _____ in the east.", answer: "rises", hint: "ขึ้น", fullSentence: "The sun rises in the east." },
          { sentence: "She _____ to school every day.", answer: "goes", hint: "ไป", fullSentence: "She goes to school every day." },
          { sentence: "I _____ breakfast at 7 AM.", answer: "eat", hint: "กิน", fullSentence: "I eat breakfast at 7 AM." },
          { sentence: "We _____ English in class.", answer: "study", hint: "เรียน", fullSentence: "We study English in class." },
          { sentence: "Birds can _____ in the sky.", answer: "fly", hint: "บิน", fullSentence: "Birds can fly in the sky." },
          { sentence: "Fish _____ in the water.", answer: "swim", hint: "ว่ายน้ำ", fullSentence: "Fish swim in the water." },
          { sentence: "I _____ my teeth every morning.", answer: "brush", hint: "แปรง", fullSentence: "I brush my teeth every morning." },
          { sentence: "The cat _____ on the sofa.", answer: "sleeps", hint: "นอน", fullSentence: "The cat sleeps on the sofa." },
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
        }, { merge: true });

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
                { type: "text", text: "📝 Fill the Blank", weight: "bold", size: "xl", color: "#FFFFFF" },
                { type: "text", text: "เติมคำในช่องว่าง", size: "sm", color: "#DBEAFE" },
              ],
              backgroundColor: "#6366F1",
              paddingAll: "20px",
            },
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "box", layout: "vertical", contents: [
                    { type: "text", text: randomS.sentence, weight: "bold", size: "lg", color: "#4338CA", align: "center", wrap: true },
                  ], backgroundColor: "#EEF2FF", paddingAll: "20px", cornerRadius: "lg"
                },
                { type: "separator", margin: "lg" },
                { type: "text", text: "💡 Hint:", weight: "bold", size: "md", color: "#6B7280", margin: "md" },
                { type: "text", text: randomS.hint, size: "md", color: "#333333" },
                { type: "separator", margin: "lg" },
                { type: "text", text: "📝 พิมพ์คำตอบ:", weight: "bold", size: "md", color: "#10B981", margin: "md" },
                { type: "text", text: "/game fill_blank answer [คำตอบ]", size: "sm", color: "#666666" },
              ],
              paddingAll: "20px",
            },
            footer: {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "button", action: { type: "message", label: "🔄 ข้ามข้อ", text: "/game fill_blank" }, style: "secondary", height: "sm" },
                { type: "button", action: { type: "message", label: "💡 เฉลย", text: "/game fill_blank reveal" }, style: "secondary", height: "sm", margin: "sm" },
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
          const { GoogleGenerativeAI } = require("@google/generative-ai");
          const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
          const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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
                  { type: "text", text: modeName, weight: "bold", size: "lg", color: "#FFFFFF", flex: 4 },
                  { type: "text", text: "✨", size: "xl", flex: 1, align: "end" },
                ],
                backgroundColor: "#16A34A",
                paddingAll: "15px",
              },
              body: {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "box", layout: "vertical", contents: [
                      { type: "text", text: `❓ ${question}`, size: "md", color: "#555555", wrap: true, weight: "bold" },
                    ], backgroundColor: "#F0FDF4", paddingAll: "12px", cornerRadius: "md"
                  },
                  { type: "separator", margin: "md" },
                  { type: "text", text: aiResponse, wrap: true, size: "md", color: "#333333", margin: "md" },
                ],
                paddingAll: "15px",
              },
              footer: {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "box", layout: "horizontal", contents: [
                      { type: "button", action: { type: "message", label: "📝 ทำแบบฝึก", text: `/tutor practice ${question}` }, style: "primary", color: "#16A34A", height: "sm", flex: 1 },
                      { type: "button", action: { type: "message", label: "📚 ตัวอย่างเพิ่ม", text: `/tutor explain ขอตัวอย่างเพิ่มเรื่อง ${question}` }, style: "secondary", height: "sm", flex: 1, margin: "sm" },
                    ]
                  },
                  { type: "button", action: { type: "message", label: "🏠 กลับเมนู WiT", text: "/tutor" }, style: "link", height: "sm", margin: "sm" },
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
                { type: "text", text: modeName, weight: "bold", size: "xl", color: "#FFFFFF" },
                { type: "text", text: modeDesc, size: "sm", color: "#D1FAE5" },
              ],
              backgroundColor: "#16A34A",
              paddingAll: "20px",
            },
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "text", text: "💬 พิมพ์คำถามหรือเรื่องที่ต้องการ:", weight: "bold", size: "md", color: "#16A34A" },
                { type: "text", text: `ตัวอย่าง: /tutor ${mode} [คำถาม]`, size: "sm", color: "#666666", margin: "sm" },
                { type: "separator", margin: "lg" },
                { type: "text", text: "⚡ ลองถามเลย:", weight: "bold", size: "md", color: "#333333", margin: "md" },
                {
                  type: "box",
                  layout: "vertical",
                  contents: examples.map((ex) => ({
                    type: "button",
                    action: { type: "message", label: ex, text: `/tutor ${mode} ${ex}` },
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
                { type: "button", action: { type: "message", label: "◀ กลับ", text: "/tutor" }, style: "secondary", height: "sm" },
                { type: "button", action: { type: "message", label: "🏠 เมนูหลัก", text: "/edu" }, style: "secondary", height: "sm", margin: "sm" },
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
              { type: "action", action: { type: "message", label: "📚 เมนูการศึกษา", text: "/edu" } },
              { type: "action", action: { type: "message", label: "🏠 เมนูหลัก", text: "/help" } },
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
        const { GoogleGenerativeAI } = require("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `${systemPrompt}\n\nคำถาม: ${message.text}`;
        const result = await model.generateContent(prompt);
        const aiResponse = result.response.text();

        // 🎨 ส่ง Flex Message สำหรับ WiT Tutor
        const tutorFlex = {
          type: "flex",
          altText: `💬 WiT 365 Tutor: ${message.text.substring(0, 50)}...`,
          contents: {
            type: "bubble",
            size: "giga",
            header: {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "🎓", size: "3xl", flex: 0 },
                {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    { type: "text", text: "WiT 365 Tutor", weight: "bold", size: "xl", color: "#FFFFFF" },
                    { type: "text", text: "ผู้ช่วยการเรียนรู้อัจฉริยะ", size: "md", color: "#D1FAE5" },
                  ],
                  paddingStart: "10px",
                },
              ],
              backgroundColor: "#16A34A",
              paddingAll: "20px",
            },
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    { type: "text", text: "📝 คำถาม:", weight: "bold", size: "lg", color: "#16A34A" },
                    { type: "text", text: message.text.substring(0, 150) + (message.text.length > 150 ? "..." : ""), size: "md", color: "#666666", wrap: true, margin: "md" },
                  ],
                  backgroundColor: "#F0FDF4",
                  paddingAll: "15px",
                  cornerRadius: "10px",
                },
                { type: "separator", margin: "xl" },
                {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    { type: "text", text: "💡 คำตอบ:", weight: "bold", size: "lg", color: "#16A34A", margin: "lg" },
                    { type: "text", text: aiResponse, wrap: true, size: "md", color: "#333333", margin: "md" },
                  ],
                  margin: "lg",
                },
              ],
              paddingAll: "20px",
            },
            footer: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    { type: "button", action: { type: "message", label: "📚 ตัวอย่างเพิ่ม", text: "ขอตัวอย่างเพิ่มเติม" }, style: "secondary", height: "md", flex: 1 },
                    { type: "button", action: { type: "message", label: "📝 แบบฝึกหัด", text: "/tool quiz" }, style: "secondary", height: "md", flex: 1, margin: "md" },
                  ],
                },
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    { type: "button", action: { type: "message", label: "🔄 อธิบายใหม่", text: "ช่วยอธิบายใหม่แบบง่ายๆ" }, style: "secondary", height: "md", flex: 1 },
                    { type: "button", action: { type: "message", label: "🏠 เมนูการศึกษา", text: "/edu" }, style: "primary", height: "md", flex: 1, margin: "md" },
                  ],
                  margin: "md",
                },
              ],
              paddingAll: "15px",
              backgroundColor: "#F9FAFB",
            },
          },
        };

        await lineClient.replyMessage(replyToken, tutorFlex);
        console.log("✅ AI Education Flex response sent");
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
                { type: "action", action: { type: "message", label: "🔍 Defect", text: "/defect" } },
                { type: "action", action: { type: "message", label: "🧮 คำนวณ", text: "/calc" } },
                { type: "action", action: { type: "message", label: "🌡️ อุณหภูมิ", text: "/temp" } },
                { type: "action", action: { type: "message", label: "🤖 ถาม AI", text: "Short shot แก้ยังไง" } },
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
                { type: "action", action: { type: "message", label: "🔥 การอบวัสดุ", text: "วิธีอบวัสดุพลาสติก" } },
                { type: "action", action: { type: "message", label: "🔴 Hot Runner", text: "อุณหภูมิ Hot Runner" } },
                { type: "action", action: { type: "message", label: "🏭 เมนูหลัก", text: "/plastic" } },
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
                { type: "action", action: { type: "message", label: "🧪 สูตรปุ๋ย", text: "สูตรปุ๋ยสำหรับพืช" } },
                { type: "action", action: { type: "message", label: "🌾 พืชเศรษฐกิจ", text: "แนะนำพืชเศรษฐกิจ" } },
                { type: "action", action: { type: "message", label: "💰 ต้นทุน", text: "คำนวณต้นทุนการเกษตร" } },
                { type: "action", action: { type: "message", label: "🏛️ เงินอุดหนุน", text: "สิทธิประโยชน์เกษตรกร" } },
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
    const accountingKeywords = ["บัญชี", "สรุป", "รายรับ", "รายจ่าย", "ขาย", "ซื้อ", "จ่าย", "ค่า", "บาท", "รับเงิน", "รับค่าจ้าง"];

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
      // 🆕 Quick Commands
      "/รับเงิน", "/รับค่าจ้าง", "/เงินเดือน", "/โบนัส",
      "/จ่าย", "/ค่าใช้จ่าย", "/ค่าอาหาร", "/ค่าเดินทาง",
      "สรุปรายปี", "สรุปปีนี้", "สรุป 12 เดือน", "yearly",
      "dashboard pro", "แดชบอร์ดโปร",
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
                  { type: "action", action: { type: "message", label: "สรุปเดือน", text: "สรุปเดือน" } },
                  { type: "action", action: { type: "message", label: "รายการล่าสุด", text: "รายการล่าสุด" } },
                  { type: "action", action: { type: "message", label: "โหมดฟาร์ม", text: "เปลี่ยนเป็นโหมดฟาร์ม" } },
                  { type: "action", action: { type: "message", label: "โหมดร้านค้า", text: "เปลี่ยนเป็นโหมดร้านค้า" } },
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
        await userRef.update({ businessType: "farm" });
        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: `🌾 **เปลี่ยนเป็นโหมดฟาร์มแล้ว!**\n\nตอนนี้ระบบจะจัดหมวดหมู่แบบเกษตรกร\n(ปุ๋ย, ยา, เมล็ดพันธุ์, ค่าแรง ฯลฯ)`,
        });
        return;
      }

      if (message.text.includes("โหมดร้านค้า") || message.text.includes("เปลี่ยนเป็นร้านค้า")) {
        await userRef.update({ businessType: "retail" });
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
            messagePayload = { type: "text", text: messagePayload };
          }

          // Add Quick Reply to all accounting messages for better UX
          // 🔧 ปรับปรุง: เพิ่มปุ่มเลือกลบ/แก้ไข
          const quickReplyItems = {
            items: [
              { type: "action", action: { type: "message", label: "สรุปเดือน", text: "สรุปเดือน" } },
              { type: "action", action: { type: "message", label: "รายการล่าสุด", text: "รายการล่าสุด" } },
              { type: "action", action: { type: "message", label: "เลือกลบ", text: "เลือกลบ" } },
              { type: "action", action: { type: "message", label: "เลือกแก้ไข", text: "เลือกแก้ไข" } },
              { type: "action", action: { type: "message", label: "ลบล่าสุด", text: "ลบ" } },
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
    const SUPER_ADMIN_IDS = ["Ud9bec6d2ea945cf4330a69cb74ac93cf", "U9b40807cbcc8182928a12e3b6b73330e"];
    const isSuperAdmin = SUPER_ADMIN_IDS.includes(userId);

    console.log(`👑 ========== ADMIN CHECK ==========`);
    console.log(`👑 User ID: '${userId}'`);
    console.log(`👑 Super Admin IDs: ${JSON.stringify(SUPER_ADMIN_IDS)}`);
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
          await lineClient.replyMessage({
            replyToken: replyToken,
            messages: [enhancedDashboard]
          });
          console.log(`✅ Enhanced Dashboard sent`);
        } catch (error) {
          console.error(`❌ Enhanced Dashboard error:`, error);
          await lineClient.replyMessage({
            replyToken: replyToken,
            messages: [createSimpleMessage(`❌ เกิดข้อผิดพลาด: ${error.message}`, false)]
          });
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
        const body = { replyToken, messages: [debugFlex] };
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
                  { type: "action", action: { type: "message", label: "👤 User Mode", text: "/test user" } },
                  { type: "action", action: { type: "message", label: "💎 Premium", text: "/test premium" } },
                  { type: "action", action: { type: "message", label: "📊 Quota", text: "/test quota" } },
                  { type: "action", action: { type: "message", label: "📱 Report", text: "/test report" } },
                  { type: "action", action: { type: "message", label: "🔄 Reset", text: "/test reset" } },
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
              orgMap.set(orgCode, { orgCode, memberCount: 0, members: [] });
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
                    { type: "text", text: "Response Cache:", size: "sm", color: "#6b7280", flex: 5 },
                    { type: "text", text: `${responseCacheCleared} items`, size: "sm", color: "#059669", weight: "bold", flex: 3, align: "end" },
                  ],
                },
                {
                  type: "box",
                  layout: "horizontal",
                  margin: "sm",
                  contents: [
                    { type: "text", text: "Memory Cache:", size: "sm", color: "#6b7280", flex: 5 },
                    { type: "text", text: `${memoryCacheCleared} items`, size: "sm", color: "#059669", weight: "bold", flex: 3, align: "end" },
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
                    { type: "text", text: "Response Cache:", size: "xs", color: "#9ca3af", flex: 5 },
                    { type: "text", text: `${afterResponseCache.size}/${afterResponseCache.maxSize}`, size: "xs", color: "#374151", flex: 3, align: "end" },
                  ],
                },
                {
                  type: "box",
                  layout: "horizontal",
                  margin: "sm",
                  contents: [
                    { type: "text", text: "Memory Cache:", size: "xs", color: "#9ca3af", flex: 5 },
                    { type: "text", text: `${afterMemoryCache.cacheSize}/${afterMemoryCache.maxCacheSize}`, size: "xs", color: "#374151", flex: 3, align: "end" },
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
              header: { separator: true },
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
                        { type: "text", text: "Size:", size: "sm", color: "#6b7280", flex: 4 },
                        { type: "text", text: `${responseCacheStats.size}/${responseCacheStats.maxSize}`, size: "sm", color: "#059669", weight: "bold", flex: 3, align: "end" },
                      ],
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        { type: "text", text: "Total Hits:", size: "sm", color: "#6b7280", flex: 4 },
                        { type: "text", text: `${responseCacheStats.totalHits}`, size: "sm", color: "#374151", flex: 3, align: "end" },
                      ],
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        { type: "text", text: "Expired:", size: "sm", color: "#6b7280", flex: 4 },
                        { type: "text", text: `${responseCacheStats.expiredCount}`, size: "sm", color: "#f59e0b", flex: 3, align: "end" },
                      ],
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        { type: "text", text: "TTL:", size: "sm", color: "#6b7280", flex: 4 },
                        { type: "text", text: `${responseCacheStats.ttlMinutes} นาที`, size: "sm", color: "#374151", flex: 3, align: "end" },
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
                    { type: "text", text: "Size:", size: "sm", color: "#6b7280", flex: 4 },
                    { type: "text", text: `${memoryCacheStats.cacheSize}/${memoryCacheStats.maxCacheSize}`, size: "sm", color: "#059669", weight: "bold", flex: 3, align: "end" },
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
              header: { separator: true },
            },
          },
        });
        return;
      }

      // =====================================================
      // 🆕 ACCOUNTING CHECK FOR SUPER ADMIN (Priority!)
      // =====================================================
      // 🔥 HIGH PRIORITY: Direct accounting patterns (รับเงิน XXX, จ่าย XXX)
      const directAccountingPattern = /^(รับเงิน|รับค่าจ้าง|เงินเดือน|โบนัส|จ่าย|ค่า|ขาย|ซื้อ)\s*\d+/i;
      const isDirectAccounting = directAccountingPattern.test(cmd);

      const accountingExactCommandsAdmin = [
        "^/acc$", "สรุป", "รายการ", "บัญชี", "ลบ", "ยืนยันลบ", "ยกเลิกการลบ", "วิธีใช้บัญชี",
        "เลือกลบ", "ลบทั้งหมด", "ลบ#", "แก้#",
        "เลือกแก้ไข", "แก้ไขรายการ", "ยกเลิกแก้ไข", "แก้จำนวน", "แก้หมวด",
        "วิเคราะห์บัญชี", "คำแนะนำการเงิน", "เปรียบเทียบเดือน", "เทียบเดือน",
        "ตั้งงบ", "เช็คงบ", "งบประมาณ",
        "ตั้งเป้าออม", "ดูเป้าหมาย", "เป้าหมาย",
        "dashboard", "ภาพรวม",
        "เมนูบัญชี", "menu", "เมนู acc", "คู่มือบัญชี", "help acc",
        "/รับเงิน", "/รับค่าจ้าง", "/เงินเดือน", "/โบนัส",
        "/จ่าย", "/ค่าใช้จ่าย", "/ค่าอาหาร", "/ค่าเดินทาง",
        "สรุปรายปี", "สรุปปีนี้", "สรุป 12 เดือน", "yearly",
        "dashboard pro", "แดชบอร์ดโปร", "รายรับ", "รายจ่าย",
        // 🏪 RETAIL SHOP COMMANDS
        "ร้านค้า", "shop", "เมนูร้านค้า", "shop menu",
        "กำไรวันนี้", "กำไรเมื่อวาน", "กำไรสัปดาห์", "กำไรเดือน",
        "profit", "ยอดตามช่องทาง", "ช่องทางขาย", "channels",
        "โควต้า", "quota",
      ];

      const isAccountingExactAdmin = accountingExactCommandsAdmin.some((c) => {
        if (c.startsWith("^")) return new RegExp(c, "i").test(cmd);
        return cmd.includes(c.toLowerCase());
      });

      // 🔥 Combine: Direct pattern OR exact command
      const shouldHandleAccounting = isDirectAccounting || isAccountingExactAdmin;

      if (shouldHandleAccounting) {
        console.log(`💰 [ADMIN] Accounting detected: direct=${isDirectAccounting}, exact=${isAccountingExactAdmin}, msg="${message.text}"`);
        console.log(`💰 [ADMIN] Accounting command detected: "${message.text}"`);
        try {
          const accountingResult = await handleAccountingCommand(userId, message.text);
          if (accountingResult && accountingResult.handled) {
            console.log(`✅ [ADMIN] Accounting command handled successfully`);
            await lineClient.replyMessage(replyToken, accountingResult.response);
            return;
          }
        } catch (accError) {
          console.error(`❌ [ADMIN] Accounting error:`, accError);
        }
      }

      // =====================================================
      // 👤 ADMIN COMMANDS (General Access - No Super Admin Required)
      // =====================================================
      //const cmd = message.text.toLowerCase().trim();
      console.log(`📋 Checking admin commands for: "${cmd}"`);

      // =====================================================
      // 👤 NEW: USER DETAIL COMMAND (Enhanced)
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

        const userData_target = { ...targetUserDoc.data(), odUserId: targetUserId };
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
              doc.ref.update({ displayName: displayName }).catch((e) => console.error(e));
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
          const textMsg = `🏆 Top Users:\n${topUsers.map((u, i) => `${i + 1}. ${sanitizeTextForLine(u.name)} - ${u.count} ข้อความ`).join("\n")}`;
          await lineClient.replyMessage(replyToken, { type: "text", text: textMsg });
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

      // Command: ออกรหัสต่ออายุ (transferable renewal code) — /code <price> [userId]
      if (cmd.includes("/code") || cmd.includes("ออกรหัส")) {
        console.log(`👑 Admin command detected: issue renewal code`);
        const pMatch = message.text.match(/\b(99|259|699|399|999|2490)\b/);
        if (!pMatch) {
          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: "🔑 **ออกรหัสต่ออายุ**\n\n" +
              "รูปแบบ:\n" +
              "• `/code 259` — รหัสทั่วไป (ใครกรอกก็ได้)\n" +
              "• `/code 259 U1234...` — ผูกกับ User คนนั้น\n\n" +
              "ราคา: 99 / 259 / 699 / 399 / 999 / 2490",
          });
          return;
        }
        const plan = getPlan(pMatch[1]);
        const bindMatch = message.text.match(/U[a-f0-9]{32}/i);
        const boundUserId = bindMatch ? bindMatch[0] : null;
        const issued = await issueRenewalCode({
          priceCode: pMatch[1],
          months: plan.months,
          packageName: plan.name,
          issuedBy: userId,
          boundUserId,
          refNote: "manual-admin",
        });
        await lineClient.replyMessage(replyToken, buildCodeIssuedFlex(issued.code, issued.packageName, issued.months, issued.codeExpiresAt, boundUserId));
        return;
      }

      // Command: อนุมัติสมาชิก
      if (cmd.includes("/approve") || cmd.includes("อนุมัติ") || cmd.includes("approve")) {
        console.log(`👑 Admin command detected: approve`);
        const userIdMatch = message.text.match(/U[a-f0-9]{32}/i);
        if (!userIdMatch) {
          await lineClient.replyMessage(replyToken, {
            type: "text",
            text: "❌ กรุณาระบุ User ID\n\n" +
              "📋 **รูปแบบคำสั่ง:**\n" +
              "• `/approve U1234...` - อนุมัติตามแพ็คเกจที่เลือก\n" +
              "• `/approve U1234... 99` - รายเดือน (1 เดือน)\n" +
              "• `/approve U1234... 259` - 3 เดือน\n" +
              "• `/approve U1234... 699` - รายปี (12 เดือน)\n" +
              "• `/approve U1234... 399 ORGCODE` - Team รายเดือน\n" +
              "• `/approve U1234... 999 ORGCODE` - Team 3 เดือน\n" +
              "• `/approve U1234... 2490 ORGCODE` - Team รายปี",
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

        const targetUserData = targetUserDoc.data();

        // 💰 Parse package price and duration from command
        const priceMatch = message.text.match(/\b(99|259|699|399|999|2490)\b/);
        const orgCodeMatch = message.text.match(/\b([A-Z]{2,10}\d{0,5})\b/i);

        let packageName = targetUserData.selectedPackage || "Premium";
        let durationMonths = 1; // Default 1 month
        let price = "99";
        let isTeamPackage = false;
        let orgCode = orgCodeMatch ? orgCodeMatch[1].toUpperCase() : targetUserData.orgCode || null;

        if (priceMatch) {
          const priceCode = priceMatch[1];
          switch (priceCode) {
            case "99":
              packageName = "รายเดือน (99฿)";
              durationMonths = 1;
              price = "99";
              break;
            case "259":
              packageName = "3 เดือน (259฿)";
              durationMonths = 3;
              price = "259";
              break;
            case "699":
              packageName = "รายปี (699฿)";
              durationMonths = 12;
              price = "699";
              break;
            case "399":
              packageName = "Team Pack รายเดือน (399฿)";
              durationMonths = 1;
              price = "399";
              isTeamPackage = true;
              break;
            case "999":
              packageName = "Team Pack 3 เดือน (999฿)";
              durationMonths = 3;
              price = "999";
              isTeamPackage = true;
              break;
            case "2490":
              packageName = "Team Pack รายปี (2,490฿)";
              durationMonths = 12;
              price = "2,490";
              isTeamPackage = true;
              break;
          }
        } else {
          // Auto-detect from selectedPackage if no price specified
          const pkg = (targetUserData.selectedPackage || "").toLowerCase();
          if (pkg.includes("3 เดือน") || pkg.includes("259")) {
            durationMonths = 3;
            price = pkg.includes("team") ? "999" : "259";
            isTeamPackage = pkg.includes("team");
          } else if (pkg.includes("รายปี") || pkg.includes("699") || pkg.includes("2490")) {
            durationMonths = 12;
            price = pkg.includes("team") ? "2,490" : "699";
            isTeamPackage = pkg.includes("team");
          } else if (pkg.includes("team") || pkg.includes("399")) {
            price = "399";
            isTeamPackage = true;
          }
        }

        // 📅 Calculate expiry date
        const now = new Date();
        const expiryDate = new Date(now);
        expiryDate.setMonth(expiryDate.getMonth() + durationMonths);

        // 📦 Prepare update data
        const updateData = {
          isPremium: true,
          subscriptionStatus: "active",
          selectedPackage: packageName,
          packagePrice: price,
          premiumStartDate: FieldValue.serverTimestamp(),
          premiumExpiry: expiryDate,
          premiumDurationMonths: durationMonths,
          approvedAt: FieldValue.serverTimestamp(),
          approvedBy: "Admin",
        };

        // 🏢 Team Package: Add orgCode
        if (isTeamPackage) {
          if (!orgCode) {
            await lineClient.replyMessage(replyToken, {
              type: "text",
              text: "⚠️ **Team Package ต้องระบุ Org Code**\n\n" +
                "ตัวอย่าง:\n" +
                "`/approve ${targetUserId} 399 MYTEAM01`\n\n" +
                "หรือให้ User พิมพ์รหัสทีมก่อน",
            });
            return;
          }
          updateData.orgCode = orgCode;
          updateData.teamRole = "admin"; // First member = admin
          updateData.isTeamAdmin = true;
        }

        // Update to Premium
        await targetUserRef.update(updateData);

        // 📨 Notify user
        const expiryStr = expiryDate.toLocaleDateString("th-TH", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        let userNotifyText = `🎉 **ยินดีด้วยครับ!**\n\n` +
          `บัญชีของคุณได้รับการอนุมัติแล้ว ✅\n\n` +
          `📦 แพ็คเกจ: ${packageName}\n` +
          `📅 หมดอายุ: ${expiryStr}\n` +
          `⏱️ ระยะเวลา: ${durationMonths} เดือน\n`;

        if (isTeamPackage && orgCode) {
          userNotifyText += `\n🏢 **รหัสทีม: ${orgCode}**\n` +
            `แชร์รหัสนี้ให้เพื่อนร่วมทีมเพื่อเข้าร่วมกลุ่ม\n` +
            `(พิมพ์ "เข้าร่วม ${orgCode}" เพื่อเข้าทีม)`;
        }

        userNotifyText += `\n\nคุณสามารถใช้งานได้ไม่จำกัดแล้วครับ 💎\n` +
          `ขอบคุณที่สนับสนุนครับ 🙏`;

        try {
          await lineClient.pushMessage(targetUserId, {
            type: "text",
            text: userNotifyText,
          });
        } catch (err) {
          console.warn("Cannot notify user:", err);
        }

        // 📋 Admin confirmation
        let adminReplyText = `✅ **อนุมัติสำเร็จ**\n\n` +
          `👤 ${targetUserData.displayName || "Unknown"}\n` +
          `🆔 ${targetUserId}\n` +
          `📦 ${packageName}\n` +
          `💰 ${price} บาท\n` +
          `📅 หมดอายุ: ${expiryStr}\n` +
          `⏱️ ${durationMonths} เดือน`;

        if (isTeamPackage && orgCode) {
          adminReplyText += `\n🏢 Org Code: ${orgCode}`;
        }

        adminReplyText += `\n\n✉️ ผู้ใช้ได้รับการแจ้งเตือนแล้ว`;

        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: adminReplyText,
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
          await lineClient.replyMessage(replyToken, { type: "text", text: "❌ รูปแบบคำสั่งผิด\n\n/reply [UserID] [ข้อความ]\nหรือ\nตอบกลับ [UserID] [ข้อความ]" });
          return;
        }
        const targetId = parts[1];
        const replyText = parts.slice(2).join(" ");

        try {
          await lineClient.pushMessage(targetId, { type: "text", text: `📩 **ข้อความจาก Admin:**\n\n${replyText}` });
          await lineClient.replyMessage(replyToken, { type: "text", text: `✅ ส่งข้อความถึง ${targetId} แล้ว` });
        } catch (err) {
          await lineClient.replyMessage(replyToken, { type: "text", text: `❌ ส่งไม่สำเร็จ: ${err.message}` });
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
          await lineClient.replyMessage(replyToken, { type: "text", text: "❌ กรุณาระบุข้อความประกาศ" });
          return;
        }

        // Get active users in last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const activeUsers = await db.collection("line_users")
          .where("lastActiveAt", ">=", sevenDaysAgo)
          .get();

        if (activeUsers.empty) {
          await lineClient.replyMessage(replyToken, { type: "text", text: "❌ ไม่พบผู้ใช้งานที่ Active ใน 7 วันนี้" });
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
            "real_world_solutions": { name: "วิธีแก้จริง", icon: "🔧" },
            "proven_parameters": { name: "พารามิเตอร์", icon: "📊" },
            "machine_specific": { name: "เฉพาะเครื่อง", icon: "🏭" },
            "expert_tips": { name: "เคล็ดลับ", icon: "💡" },
            "local_terminology": { name: "คำศัพท์", icon: "📖" },
            "case_studies": { name: "กรณีศึกษา", icon: "📚" },
            "local_materials": { name: "วัสดุท้องถิ่น", icon: "🧪" },
            "supplier_info": { name: "ซัพพลายเออร์", icon: "🏪" },
          };

          const categories = Object.entries(stats.byCategory || {}).map(([catKey, count]) => {
            const catInfo = categoryMap[catKey] || { name: catKey, icon: "📁" };
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

          await lineClient.replyMessage(replyToken, { type: "text", text: responseText });
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
              { limit: 5, minRelevance: 0.2, includeUnverified: true },
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

          let strategyCount = { local_primary: 0, balanced_hybrid: 0, ai_primary: 0, best_effort: 0 };
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
          let statsCount = { premium: 0, trial: 0, free: 0, expired: 0 };

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
      }, { merge: true });

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
        await lineClient.replyMessage({
          replyToken: replyToken,
          messages: [trialGrantedFlex]
        });
      } catch (replyErr) {
        await lineClient.pushMessage({
          to: userId,
          messages: [trialGrantedFlex]
        });
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
        await lineClient.replyMessage({
          replyToken: replyToken,
          messages: [{
            type: "text",
            text: `⏰ คุณเพิ่งขอปลดล็อคไปเมื่อ ${timeSinceLastRequest.toFixed(0)} นาทีที่แล้ว\n\n` +
              `กรุณารอสักครู่ หรือสมัคร Premium เพื่อใช้งานได้ทันที`,
            quickReply: {
              items: [
                { type: "action", action: { type: "message", label: "💎 สมัคร Premium", text: "สนใจสมัคร Premium" } },
                { type: "action", action: { type: "message", label: "📋 ดูแพ็คเกจ", text: "ดูแพ็คเกจ" } },
              ],
            },
          }]
        });
        return;
      }

      // Update last unlock request time
      await userRef.set({
        lastUnlockRequestAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      // Define Super Admin ID
      // Use Global Super Admin ID

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
        await lineClient.pushMessage({
          to: SUPER_ADMIN_ID,
          messages: [adminNotification]
        });
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
        await lineClient.replyMessage({
          replyToken: replyToken,
          messages: [userConfirmFlex]
        });
        console.log(`✅ User confirmation sent to ${userId}`);
      } catch (replyErr) {
        console.warn("⚠️ replyMessage failed, trying pushMessage:", replyErr.message);
        try {
          await lineClient.pushMessage({
            to: userId,
            messages: [userConfirmFlex]
          });
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
    else if (SUPER_ADMIN_IDS.includes(userId)) {
      console.log(`👑 Super Admin ${userId} - bypassing Trial/Quota check, unlimited access`);
      // Continue directly to AI processing
    } else {
      // Normal user - check Trial Status
      const trialStatus = await getTrialStatus(userId);
      console.log(`🎁 Trial Status: ${JSON.stringify(trialStatus)}`);

      // Helper function to send message with fallbacks
      const sendTrialMessage = async (messageToSend) => {
        try {
          await lineClient.replyMessage({
            replyToken: replyToken,
            messages: [messageToSend]
          });
          console.log("✅ Trial message sent via replyMessage");
          return true;
        } catch (replyError) {
          console.warn("⚠️ replyMessage failed:", replyError.message);
          try {
            await lineClient.pushMessage({
              to: userId,
              messages: [messageToSend]
            });
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
          await lineClient.replyMessage({
            replyToken: replyToken,
            messages: [{
              type: "flex",
              altText: "📄 เลือกประเภทรายงาน",
              contents: selectionFlex,
            }]
          });
          console.log("✅ Sent Report Selection Flex");
          return;
        }

        // Send loading message first
        try {
          await lineClient.replyMessage({
            replyToken: replyToken,
            messages: [{
              type: "text",
              text: "🚧 กำลังรวบรวมข้อมูลและสร้างรายงาน PDF สักครู่ครับ...",
            }]
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

    // =====================================================
    // 🆕 ACCOUNTING SYSTEM CHECK (BEFORE TOOLS & AI)
    // =====================================================
    const accountingKeywordsCheck = ["บัญชี", "สรุป", "รายรับ", "รายจ่าย", "ขาย", "ซื้อ", "จ่าย", "ค่า", "บาท", "รับเงิน", "รับค่าจ้าง"];
    const accountingExactCommandsCheck = [
      "^/acc$", "สรุป", "รายการ", "บัญชี", "ลบ", "ยืนยันลบ", "ยกเลิกการลบ", "วิธีใช้บัญชี",
      "เลือกลบ", "ลบทั้งหมด", "ลบ#", "แก้#",
      "เลือกแก้ไข", "แก้ไขรายการ", "ยกเลิกแก้ไข", "แก้จำนวน", "แก้หมวด",
      "วิเคราะห์บัญชี", "คำแนะนำการเงิน", "เปรียบเทียบเดือน", "เทียบเดือน",
      "ตั้งงบ", "เช็คงบ", "งบประมาณ",
      "ตั้งเป้าออม", "ดูเป้าหมาย", "เป้าหมาย",
      "dashboard", "ภาพรวม",
      "เมนูบัญชี", "menu", "เมนู acc", "คู่มือบัญชี", "help acc",
      "/รับเงิน", "/รับค่าจ้าง", "/เงินเดือน", "/โบนัส",
      "/จ่าย", "/ค่าใช้จ่าย", "/ค่าอาหาร", "/ค่าเดินทาง",
      "สรุปรายปี", "สรุปปีนี้", "สรุป 12 เดือน", "yearly",
      "dashboard pro", "แดชบอร์ดโปร",
    ];

    const msgLowerAcc = message.text.toLowerCase().trim();
    const isAccountingExactCheck = accountingExactCommandsCheck.some((cmd) => {
      if (cmd.startsWith("^")) {
        return new RegExp(cmd, "i").test(msgLowerAcc);
      }
      return msgLowerAcc.includes(cmd.toLowerCase());
    });

    const questionKeywordsAcc = ["ช่วย", "คำนวณ", "วิธี", "อย่างไร", "ยังไง", "แนะนำ", "เฉลี่ย", "ลด", "ประหยัด", "แบ่ง", "คิด", "เท่าไร", "กี่", "?", "？", "ทำไม", "หรือไม่", "ดีไหม", "ควร", "สาเหตุ", "ปัญหา"];
    const isQuestionAcc = !isAccountingExactCheck && questionKeywordsAcc.some((q) => msgLowerAcc.includes(q));
    const isAccountingRelatedCheck = !isQuestionAcc && accountingKeywordsCheck.some((kw) => msgLowerAcc.includes(kw)) && /\d/.test(message.text);

    if (isAccountingRelatedCheck || isAccountingExactCheck) {
      console.log(`💰 [MAIN] Accounting command detected: "${message.text}"`);
      try {
        const accountingResult = await handleAccountingCommand(userId, message.text);
        if (accountingResult && accountingResult.handled) {
          console.log(`✅ Accounting command handled successfully`);
          await lineClient.replyMessage(replyToken, accountingResult.response);
          return;
        }
      } catch (accError) {
        console.error(`❌ Accounting error:`, accError);
      }
    }

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
              const params = { ...toolCommand.params };
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
                      }, { merge: true });
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
                    const flexMsg = createSummaryDashboardMessage(reports, { orgCode: paramOrgCode });
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
                  const { orgCode, message: broadcastMsg } = result;

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
              // Use Global Super Admin ID
              const isPremium = userData.subscriptionStatus === "approved" ||
                userData.subscriptionStatus === "active" ||
                userData.subscriptionStatus === "premium" ||
                SUPER_ADMIN_IDS.includes(userId); // ✅ Allow Super Admin

              if (!isPremium) {
                toolResponse = `⚠️ **ขออภัยครับ ฟีเจอร์นี้สำหรับสมาชิก Premium เท่านั้น**\n\n` +
                  `สมัครสมาชิกเริ่มต้นเพียง 99 บาท/เดือน\n` +
                  `พิมพ์ "สนใจสมัคร" เพื่อดูรายละเอียด`;
              } else {
                const result = visionTool.generate(toolCommand.params);
                if (result.action === "request_image") {
                  // Set flag in Firestore
                  await userRef.set({ imageMode: "vision_diagnosis" }, { merge: true });
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
            // Use Global Super Admin ID
            if (!SUPER_ADMIN_IDS.includes(userId)) {
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
                  const testParams = { projectedArea: 400, cavityPressure: 60 };
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
              { type: "action", action: { type: "message", label: "🔧 แรงปิด", text: "คำนวณแรงปิด" } },
              { type: "action", action: { type: "message", label: "⏱️ Cooling", text: "คำนวณ cooling" } },
              { type: "action", action: { type: "message", label: "🔍 วินิจฉัย", text: "คู่มือ defect" } },
              { type: "action", action: { type: "message", label: "🌡️ อุณหภูมิ", text: "ตารางอุณหภูมิวัสดุ" } },
              { type: "action", action: { type: "message", label: "🛠️ เครื่องมือ", text: "เครื่องมือ" } },
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

    // ──────────────────────────────────────────────────────────────────────────
    // 🎯 SELECTIVE KNOWLEDGE LOADING
    // Only inject machine-brand prompts that are relevant to the current message.
    // Always includes core knowledge (injection molding + materials).
    // Brand-specific manuals are included only when the brand is explicitly
    // mentioned, reducing token cost by 60-80% for most queries.
    // ──────────────────────────────────────────────────────────────────────────
    const selectKnowledgeContext = (text) => {
      const t = text.toLowerCase();
      const parts = [];

      // Core knowledge — always included
      parts.push(INJECTION_MOLDING_EXPERT_PROMPT);
      parts.push(PLASTIC_MATERIALS_PROMPT);

      // Brand-specific — include only when mentioned
      const wantsPorcheson = /porcheson|ปอร์เชสัน|ps90|ps160|ps100|ps200/.test(t);
      const wantsToshiba = /toshiba|โตชิบา|ท็อปชิบา/.test(t);
      const wantsTechmation = /techmation|techmotion|เทคเมชั่น|เทคโมชั่น/.test(t);
      const wantsVictor = /victor|วิคเตอร์|วิกเตอร์/.test(t);
      const wantsFanuc = /fanuc|ฟานัค|fanac/.test(t);
      const wantsYushin = /yushin|ยูชิน|ยูชิ้น/.test(t);
      const wantsTeaching = /\bเรียน\b|สอน|บทเรียน|\blesson\b|\bquiz\b|แบบทดสอบ|ตำรา|textbook/.test(t);

      if (wantsPorcheson) parts.push(PORCHESON_KNOWLEDGE_PROMPT);
      if (wantsToshiba) parts.push(TOSHIBA_KNOWLEDGE_PROMPT);
      if (wantsTechmation) parts.push(TECHMATION_KNOWLEDGE_PROMPT);
      if (wantsVictor) parts.push(VICTOR_KNOWLEDGE_PROMPT);
      if (wantsFanuc) parts.push(FANUC_KNOWLEDGE_PROMPT);
      if (wantsYushin) parts.push(YUSHIN_KNOWLEDGE_PROMPT);
      if (wantsTeaching) parts.push(TEXTBOOK_TEACHING_PROMPT);

      // If no specific brand was identified but user is asking about a machine /
      // controller in general, include all brand manuals so nothing is missed.
      const anyBrandSelected = wantsPorcheson || wantsToshiba || wantsTechmation ||
        wantsVictor || wantsFanuc || wantsYushin;
      if (!anyBrandSelected && /เครื่องฉีด|controller|control\s*card|ตั้งค่าเครื่อง|parameter|alarm|error code/.test(t)) {
        parts.push(PORCHESON_KNOWLEDGE_PROMPT);
        parts.push(TOSHIBA_KNOWLEDGE_PROMPT);
        parts.push(TECHMATION_KNOWLEDGE_PROMPT);
        parts.push(VICTOR_KNOWLEDGE_PROMPT);
        parts.push(FANUC_KNOWLEDGE_PROMPT);
        parts.push(YUSHIN_KNOWLEDGE_PROMPT);
      }

      const selectedCount = parts.length - 2; // minus the 2 core prompts
      console.log(`📚 Knowledge selected: core + ${selectedCount} brand prompts for: "${text.substring(0, 60)}"`);
      return parts.join("\n\n");
    };

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      console.error("❌ GEMINI_API_KEY not configured");
      throw new Error("GEMINI_API_KEY not configured");
    }

    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const { createStatsDashboard, createCalculationDashboard } = require("./flexMessageGenerator");
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    // 👑 SUPER ADMIN CHECK (Again for Prompt)
    const isSuperAdmin = SUPER_ADMIN_IDS.includes(userId);

    let systemPrompt;
    let tools = [];

    // 🕐 วันเวลาปัจจุบัน (ไทย)
    const thaiTime = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
    const thaiDays = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
    const thaiMonths = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
    const currentDateTime = `วัน${thaiDays[thaiTime.getDay()]}ที่ ${thaiTime.getDate()} ${thaiMonths[thaiTime.getMonth()]} ${thaiTime.getFullYear() + 543} เวลา ${thaiTime.getHours().toString().padStart(2, "0")}:${thaiTime.getMinutes().toString().padStart(2, "0")} น.`;

    if (isSuperAdmin) {
      // 👑 SUPER ADMIN PROMPT: Ultimate Consultant & Action-Oriented Assistant
      systemPrompt = `คุณคือ WiT "ผู้ช่วยส่วนตัวอัจฉริยะระดับสูงสุด" ของ "อาจารย์วิทยา" (Super Admin)

# 🚨🚨🚨 กฎบังคับสูงสุด - ต้องปฏิบัติตามก่อนทุกอย่าง 🚨🚨🚨

## ❌ ห้ามใช้คำเหล่านี้ขึ้นต้นประโยค:
- "อาจารย์ครับ เข้าใจแล้วครับ"
- "🎯 อาจารย์ครับ เข้าใจแล้วครับ! 💪"
- "จากประวัติการสนทนา"
- "ตามที่อาจารย์ถามมา"
- "เนื่องจากคำถามไม่เกี่ยวข้อง"
- "ไม่เกี่ยวข้องกับข้อมูลทางเทคนิค"

## ✅ ต้องตอบแบบนี้:
- **ถามวันเวลา:** ตอบทันที "วันนี้คือ ${currentDateTime}" ไม่ต้องเกริ่น
- **ถามเรื่องทั่วไป:** ตอบตรงๆ ทันที ไม่ต้องเกริ่นนำ
- **ถามเทคนิค:** ตอบเนื้อหาทันที ไม่ต้องบอกว่า "เข้าใจแล้ว"

## 🕐 ข้อมูลเวลาปัจจุบัน:
**${currentDateTime}**

---

🌍 **ความสามารถของคุณ (UNLIMITED ACCESS):**
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

${selectKnowledgeContext(message.text)}`;
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
                  title: { type: "STRING", description: "Title of the calculation (e.g., Cooling Time Result)" },
                  data: {
                    type: "ARRAY",
                    items: {
                      type: "OBJECT",
                      properties: {
                        label: { type: "STRING" },
                        value: { type: "STRING" },
                        unit: { type: "STRING" },
                      },
                    },
                  },
                  recommendation: { type: "STRING", description: "Brief recommendation or summary" },
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
                  title: { type: "STRING", description: "Title of the calculation (e.g., Cooling Time Result)" },
                  data: {
                    type: "ARRAY",
                    items: {
                      type: "OBJECT",
                      properties: {
                        label: { type: "STRING", description: "Label for the data item" },
                        value: { type: "STRING", description: "Value of the data item" },
                        unit: { type: "STRING", description: "Unit of the value (optional)" },
                      },
                    },
                    description: "Array of calculation data to display",
                  },
                  recommendation: { type: "STRING", description: "Brief recommendation or summary based on the calculation" },
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

${selectKnowledgeContext(message.text)}`;
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
                  title: { type: "STRING", description: "Title of the calculation (e.g., Cooling Time Result)" },
                  data: {
                    type: "ARRAY",
                    items: {
                      type: "OBJECT",
                      properties: {
                        label: { type: "STRING" },
                        value: { type: "STRING" },
                        unit: { type: "STRING" },
                      },
                    },
                  },
                  recommendation: { type: "STRING", description: "Brief recommendation or summary" },
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

    // =====================================================
    // 🗄️ LOCAL DATABASE ANSWERING (ไม่ใช้ Gemini)
    // ตอบกลับโดยตรงจาก PLASTIC_MATERIALS_DB / TROUBLESHOOTING_GUIDE
    // =====================================================

    // --- Helper: สร้างคำตอบจากข้อมูลวัสดุ ---
    const buildMaterialResponse = (materialKey) => {
      const mat = PLASTIC_MATERIALS_DB[materialKey];
      if (!mat) return null;
      const dryingLine = mat.dryingTemp.temp
        ? `อบที่ ${mat.dryingTemp.temp}°C เป็นเวลา ${mat.dryingTemp.time}`
        : `ไม่จำเป็นต้องอบแห้ง`;
      return (
        `🧪 ข้อมูล ${mat.name} (${mat.nameThai})\n` +
        `📂 ประเภท: ${mat.category}\n\n` +
        `🌡️ อุณหภูมิแนะนำ:\n` +
        `• Melt: ${mat.meltTemp.recommended}°C (range: ${mat.meltTemp.min}–${mat.meltTemp.max}°C)\n` +
        `• Mold: ${mat.moldTemp.recommended}°C (range: ${mat.moldTemp.min}–${mat.moldTemp.max}°C)\n\n` +
        `💧 การอบแห้ง: ${dryingLine}\n` +
        `💧 ความชื้นสูงสุด: ${mat.moisture}\n\n` +
        `📐 การหดตัว: ${mat.shrinkage.min}–${mat.shrinkage.max}%\n` +
        `⚡ Injection Pressure: ${mat.injectionPressure.min}–${mat.injectionPressure.max} MPa\n` +
        `⚡ Back Pressure: ${mat.backPressure.min}–${mat.backPressure.max} MPa\n` +
        `⚡ Injection Speed: ${mat.injectionSpeed}\n\n` +
        `✨ คุณสมบัติเด่น:\n${mat.properties.map(p => `• ${p}`).join("\n")}\n\n` +
        `🎯 การใช้งานทั่วไป:\n${mat.applications.map(a => `• ${a}`).join("\n")}\n\n` +
        `⚠️ ข้อควรระวัง:\n${mat.warnings.map(w => `• ${w}`).join("\n")}\n\n` +
        `🔥 ปัญหาที่พบบ่อย:\n${mat.commonDefects.map(d => `• ${d}`).join("\n")}`
      );
    };

    // --- Helper: สร้างคำตอบจากคู่มือแก้ปัญหา ---
    const buildDefectResponse = (defectKey) => {
      const guide = TROUBLESHOOTING_GUIDE[defectKey];
      if (!guide) return null;
      const causesText = guide.possibleCauses
        .map((c, i) => `${i + 1}. ${c.cause} (โอกาส: ${c.probability})`)
        .join("\n");
      const solutionsText = guide.solutions.join("\n");
      const preventText = guide.preventiveMeasures.map(p => `• ${p}`).join("\n");
      return (
        `🔧 ปัญหา: ${guide.name} (${guide.nameThai})\n` +
        `📝 คำอธิบาย: ${guide.description}\n\n` +
        `⚡ Quick Fix: ${guide.quickFix}\n\n` +
        `🔍 สาเหตุที่เป็นไปได้:\n${causesText}\n\n` +
        `✅ วิธีแก้ไขทีละขั้นตอน:\n${solutionsText}\n\n` +
        `🛡️ การป้องกัน:\n${preventText}`
      );
    };

    // --- Helper: สร้างเมนู Fallback เมื่อไม่พบข้อมูล ---
    const buildFallbackResponse = () => {
      const matList = ["ABS", "PP", "PC", "PA", "POM", "PE", "PS", "PET", "PVC", "TPU",
        "PMMA", "PBT", "PEEK", "PPS", "TPE", "HDPE", "LDPE", "HIPS", "PETG", "PA12"];
      const defectList = ["Short Shot", "Flash", "Sink Mark", "Warpage", "Burn Mark",
        "Silver Streak", "Weld Line", "Void", "Jetting", "Flow Mark",
        "Delamination", "Sticking", "Black Specks", "Orange Peel"];
      return (
        `🤖 สวัสดีครับ! ผม WiT365 ระบบผู้ช่วยงานฉีดพลาสติก\n\n` +
        `📦 วัสดุที่รองรับ:\n${matList.map(m => `• ${m}`).join("  |  ")}\n\n` +
        `🔧 ปัญหาที่วิเคราะห์ได้:\n${defectList.map(d => `• ${d}`).join("  |  ")}\n\n` +
        `💡 ลองพิมพ์ชื่อวัสดุ เช่น "ABS" หรือชื่อปัญหา เช่น "short shot" ได้เลยครับ\n\n` +
        `📱 หรือใช้คำสั่ง:\n` +
        `• /help - เมนูช่วยเหลือ\n` +
        `• เครื่องมือ - เครื่องมือคำนวณ\n` +
        `• คู่มือ defect - รายการปัญหาทั้งหมด`
      );
    };

    // --- ดึง Hyper-Local Knowledge ---
    let relevantKnowledge = [];
    try {
      const hyperKnowledge = getHyperLocalizedKnowledge();
      relevantKnowledge = await hyperKnowledge.findRelevantKnowledge(
        message.text,
        { limit: 3, minRelevance: 0.25, includeUnverified: true },
      );
      if (relevantKnowledge.length > 0) {
        console.log(`🧠 Found ${relevantKnowledge.length} relevant Hyper-Local knowledge items`);
        for (const k of relevantKnowledge) {
          await hyperKnowledge.incrementUseCount(k.id);
        }
      }
    } catch (knowledgeError) {
      console.warn("⚠️ Could not fetch local knowledge:", knowledgeError.message);
    }

    // --- ตัดสินใจคำตอบ ---
    let responseText = "";
    let questionTypeForFlex = "general";

    if (detectedMaterial && PLASTIC_MATERIALS_DB[detectedMaterial]) {
      // ✅ ตอบจาก Material DB
      console.log(`📦 [LOCAL] Answering from Material DB: ${detectedMaterial}`);
      responseText = buildMaterialResponse(detectedMaterial);
      questionTypeForFlex = "material";

    } else if (detectedDefect && TROUBLESHOOTING_GUIDE[detectedDefect]) {
      // ✅ ตอบจาก Troubleshooting Guide
      console.log(`🔧 [LOCAL] Answering from Troubleshooting Guide: ${detectedDefect}`);
      responseText = buildDefectResponse(detectedDefect);
      questionTypeForFlex = "troubleshooting";

    } else if (relevantKnowledge.length > 0) {
      // ✅ ตอบจาก Hyper-Local Firestore Knowledge
      console.log(`🧠 [LOCAL] Answering from Hyper-Local Knowledge`);
      const hyperKnowledge = getHyperLocalizedKnowledge();
      const knowledgeText = hyperKnowledge.formatKnowledgeForPrompt(relevantKnowledge);
      // Format เป็นคำตอบที่อ่านง่าย
      responseText = `🧠 ข้อมูลจากคลังความรู้เฉพาะถิ่น:\n\n${knowledgeText}`;
      questionTypeForFlex = "technical";

    } else {
      // ✅ ไม่พบข้อมูล → แสดงเมนู Fallback
      console.log(`📋 [LOCAL] No match found — showing Fallback Menu`);
      responseText = buildFallbackResponse();
      questionTypeForFlex = "general";
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
    if (!responseText.includes("อาจารย์ วิทยา")) {
      responseText += "\n\n✨ โดย อาจารย์ วิทยา";
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
          { userId, source: "line" },
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

    // คำนวณ Free Quota ที่เหลือ
    const FREE_DAILY_LIMIT = 5;
    const remainingQuota = Math.max(0, FREE_DAILY_LIMIT - (userData.usageCount || 0));

    const aiResponseMessage = getOptimalAIResponse(
      cleanResponseText, // ใช้ clean response (ไม่มี credit line ซ้ำ)
      message.text,
      {
        questionType: questionTypeForFlex || questionContext?.type || "general",
        source: "local_knowledge",
        isPremium: userData.isPremium || false,
        freeQuota: remainingQuota,
        userName: userData.displayName || "คุณ",
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

    // 🔘 Quick Reply Buttons ตามประเภทคำตอบ
    let quickReplyItems = [];
    if (questionTypeForFlex === "material" && detectedMaterial) {
      quickReplyItems = [
        { type: "action", action: { type: "message", label: "🌡️ อุณหภูมิ", text: `อุณหภูมิ ${detectedMaterial}` } },
        { type: "action", action: { type: "message", label: "⚠️ ข้อควรระวัง", text: `ข้อควรระวัง ${detectedMaterial}` } },
        { type: "action", action: { type: "message", label: "🔥 ปัญหาที่พบบ่อย", text: `ปัญหา ${detectedMaterial}` } },
        { type: "action", action: { type: "message", label: "🛠️ เครื่องมือ", text: "เครื่องมือ" } },
        { type: "action", action: { type: "message", label: "❓ ถามอีก", text: "/help" } },
      ];
    } else if (questionTypeForFlex === "troubleshooting" && detectedDefect) {
      quickReplyItems = [
        { type: "action", action: { type: "message", label: "📊 สาเหตุทั้งหมด", text: `สาเหตุ ${detectedDefect.replace("_", " ").toLowerCase()}` } },
        { type: "action", action: { type: "message", label: "✅ วิธีแก้ไข", text: `แก้ไข ${detectedDefect.replace("_", " ").toLowerCase()}` } },
        { type: "action", action: { type: "message", label: "🛡️ ป้องกัน", text: `ป้องกัน ${detectedDefect.replace("_", " ").toLowerCase()}` } },
        { type: "action", action: { type: "message", label: "📦 ดูวัสดุ ABS", text: "ABS" } },
        { type: "action", action: { type: "message", label: "🛠️ เครื่องมือ", text: "เครื่องมือ" } },
      ];
    } else {
      quickReplyItems = [
        { type: "action", action: { type: "message", label: "📦 ABS", text: "ABS" } },
        { type: "action", action: { type: "message", label: "📦 PP", text: "PP" } },
        { type: "action", action: { type: "message", label: "🔧 Short Shot", text: "short shot" } },
        { type: "action", action: { type: "message", label: "🔧 Flash", text: "flash ครีบ" } },
        { type: "action", action: { type: "message", label: "🛠️ เครื่องมือ", text: "เครื่องมือ" } },
        { type: "action", action: { type: "message", label: "❓ วิธีใช้", text: "/help" } },
      ];
    }

    if (quickReplyItems.length > 0 && messagesToSend.length < 5) {
      messagesToSend.push({
        type: "text",
        text: "📌 คำถามที่เกี่ยวข้อง:",
        quickReply: { items: quickReplyItems.slice(0, 13) },
      });
    }



    // Try to send with Flex, if fails, send only text, if still fails use pushMessage
    try {
      await lineClient.replyMessage({
        replyToken: replyToken,
        messages: messagesToSend
      });
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
          await lineClient.pushMessage({
            to: userId,
            messages: [endingSoonFlex]
          });
          console.log(`✅ Trial Ending Soon Flex sent via pushMessage`);
        } catch (notifyError) {
          console.error("⚠️ Failed to send Trial Ending notification:", notifyError.message);
        }
      }

      // 🎁 TRIAL SYSTEM: Show Upgrade message after teaser
      if (userData._showUpgradeAfterAnswer) {
        console.log(`💎 Showing upgrade message after teaser for ${userId}`);
        try {
          await lineClient.pushMessage({
            to: userId,
            messages: [{
              type: "text",
              text: `💎 **อัปเกรดวันนี้ รับส่วนลด 50%!**\n\n` +
                `คุณเหลือการใช้งานฟรี 1 ครั้ง/วัน\n` +
                `อัปเกรดเป็น Premium เพื่อใช้งานไม่จำกัด\n\n` +
                `🔥 รายเดือน: 99฿ → 49฿\n` +
                `🔥 รายปี: 699฿ → 349฿\n\n` +
                `พิมพ์ "สมัคร Premium" เพื่อดูแพ็คเกจ`,
              quickReply: {
                items: [
                  { type: "action", action: { type: "postback", label: "💎 สมัคร Premium", data: "action=subscribe_premium" } },
                  { type: "action", action: { type: "postback", label: "📊 ดูสถานะ", data: "action=trial_status" } },
                ],
              },
            }]
          });
          console.log(`✅ Upgrade message sent via pushMessage`);
        } catch (upgradeError) {
          console.error("⚠️ Failed to send upgrade message:", upgradeError.message);
        }
      }
    } catch (replyError) {
      console.error("⚠️ Error sending with Flex, trying text only:", replyError.message);
      // Fallback: send only text message
      try {
        await lineClient.replyMessage({
          replyToken: replyToken,
          messages: [{
            type: "text",
            text: responseText,
          }]
        });
        console.log(`✅ Reply sent (text only) to LINE`);
      } catch (textError) {
        console.error("❌ Failed to send even text only:", textError.message);

        // 🔄 Final fallback: use pushMessage instead
        try {
          console.log("🔄 Trying pushMessage as final fallback...");
          await lineClient.pushMessage({
            to: userId,
            messages: messagesToSend
          });
          console.log(`✅ Reply sent via pushMessage (fallback) to LINE`);
        } catch (pushError) {
          console.error("❌ pushMessage also failed:", pushError.message);
          // Try with text only via push
          try {
            await lineClient.pushMessage({
              to: userId,
              messages: [{ type: "text", text: responseText }]
            });
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
      await lineClient.replyMessage({
        replyToken: replyToken,
        messages: [{
          type: "text",
          text: "ขอโทษครับ เกิดข้อผิดพลาดในการประมวลผล กรุณาลองใหม่อีกครั้ง",
        }]
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

    // 🏭 ใช้ Plastics Welcome Message
    const welcomeFlex = {
      type: "flex",
      altText: "ยินดีต้อนรับสู่ WiT AI",
      contents: {
        type: "bubble",
        header: {
          type: "box",
          layout: "vertical",
          backgroundColor: "#06C755",
          paddingAll: "15px",
          contents: [
            { type: "text", text: "🏭 WiT AI Assistant", weight: "bold", size: "lg", color: "#ffffff", align: "center" }
          ]
        },
        body: {
          type: "box",
          layout: "vertical",
          spacing: "md",
          paddingAll: "20px",
          contents: [
            { type: "text", text: `สวัสดีครับคุณ ${profile.displayName} 👋`, weight: "bold", size: "md", color: "#333333" },
            { type: "text", text: "ผมคือผู้ช่วยส่วนตัวอัจฉริยะด้านวิศวกรรมพลาสติกและการฉีดขึ้นรูป (Injection Molding)", size: "sm", color: "#666666", wrap: true },
            { type: "separator", margin: "lg" },
            { type: "text", text: "📊 สิ่งที่ผมช่วยคุณได้:", size: "sm", weight: "bold", color: "#06C755", margin: "md" },
            { type: "text", text: "• วิเคราะห์ปัญหาชิ้นงาน (Defect Analysis)\n• แนะนำพารามิเตอร์การฉีดวัสดุต่างๆ\n• ให้ความรู้พื้นฐานจนถึงระดับผู้เชี่ยวชาญ", size: "xs", color: "#666666", wrap: true },
            { type: "button", style: "primary", color: "#06C755", action: { type: "uri", label: "🌐 เว็บไซต์ WiT365", uri: "https://wizmobiz.com" }, margin: "lg" }
          ]
        }
      }
    };

    try {
      await lineClient.pushMessage(userId, welcomeFlex);
      console.log("✅ Plastics Welcome Flex Message sent");
    } catch (flexError) {
      console.error("⚠️ Plastics Flex failed, using text fallback:", flexError.message);
      // Fallback to text message
      await lineClient.pushMessage(userId, {
        type: "text",
        text: `ยินดีต้อนรับคุณ ${profile.displayName} เข้าสู่ WiT AI! 🏭\n\n` +
          `ผมคือผู้ช่วยอัจฉริยะด้านวิศวกรรมพลาสติกและการฉีดขึ้นรูป\n` +
          `📊 วิเคราะห์ปัญหาชิ้นงาน / แนะนำพารามิเตอร์การฉีด\n` +
          `🎓 ให้ความรู้วิศวกรรมพลาสติกทุกระดับ\n\n` +
          `เริ่มต้นใช้งานได้เลยครับ หรือดูข้อมูลที่: https://wizmobiz.com`,
      });
    }
    console.log("✅ WiT AI Welcome message processed");
  } catch (error) {
    console.error("❌ Error sending WiT AI welcome message:", error);
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
          { type: "action", action: { type: "postback", label: "✅ ยอมรับและเริ่มใช้", data: "action=accept_terms" } },
          { type: "action", action: { type: "message", label: "❌ ยังไม่ยอมรับ", text: "ยังไม่ยอมรับข้อตกลง" } },
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
            { type: "action", action: { type: "message", label: "👤 รายเดือน 99฿", text: "เลือกรายเดือน" } },
            { type: "action", action: { type: "message", label: "🔥 รายปี 699฿", text: "เลือกรายปี" } },
            { type: "action", action: { type: "message", label: "🏢 ทีม", text: "เลือกทีมรายปี" } },
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

    const handled = await handleMarketplace({ lineClient, db }, event, userData);
    if (handled) return;
  }

  // =====================================================
  // 📝 MEMORY NOTE POSTBACK HANDLERS
  // =====================================================
  if (action && (action === "view_note" || action === "note_actions" || action === "toggle_note" ||
    action === "edit_note" || action === "confirm_delete" || action === "delete_note_confirmed" ||
    action === "delete_note" || action === "confirm_delete_note")) {
    console.log(`📝 Memory Note postback: ${action}`);
    const { handleNotePostback } = require("./memoryNoteSystem");

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
              { type: "action", action: { type: "message", label: "📝 ทำแบบฝึกหัด", text: `/tool quiz` } },
              { type: "action", action: { type: "message", label: "💬 WiT Tutor", text: "/tutor" } },
              { type: "action", action: { type: "message", label: "🏠 กลับเมนู", text: "/edu" } },
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
        text: `📖 **${lesson.title}**\n\n${lesson.content}\n\n📝 **แบบฝึกหัด:**\n${lesson.exercises.map((ex, i) => `${i + 1}. ${ex}`).join("\n")}`,
        quickReply: {
          items: [
            { type: "action", action: { type: "message", label: "❓ ถามเพิ่มเติม", text: `อธิบายเพิ่มเรื่อง ${lesson.title}` } },
            { type: "action", action: { type: "message", label: "📝 ทำแบบทดสอบ", text: "/tool quiz" } },
            { type: "action", action: { type: "message", label: "🔙 กลับ", text: `/edu ${COURSES[courseId]?.level} ${COURSES[courseId]?.subject}` } },
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
                { type: "action", action: { type: "message", label: "📝 ทำแบบฝึกหัด", text: `สร้างแบบฝึกหัดเรื่อง ${unit.title}` } },
                { type: "action", action: { type: "message", label: "🔙 กลับ", text: `/edu ${course.level} ${course.subject}` } },
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
            { type: "action", action: { type: "message", label: "📚 ตัวอย่างคำถาม", text: tutorMode.prompts[0] } },
            { type: "action", action: { type: "message", label: "🔙 เปลี่ยนโหมด", text: "/tutor" } },
            { type: "action", action: { type: "message", label: "🏠 เมนูหลัก", text: "/edu" } },
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

module.exports = {
  lineWebhook: exports.lineWebhook,
};
