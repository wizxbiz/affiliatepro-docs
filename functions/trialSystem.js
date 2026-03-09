/**
 * 🎁 Trial System - ระบบทดลองใช้งาน 7 วัน
 * สำหรับ WiT AI LINE Bot
 *
 * Features:
 * - Trial 7 วัน (7 ครั้ง/วัน)
 * - First Touch Experience
 * - Progressive Notifications
 * - Terms & Conditions Acceptance
 * - Post-Trial Teaser Mode
 */

const {getFirestore, FieldValue} = require("firebase-admin/firestore");

// =====================================================
// 📊 CONSTANTS
// =====================================================

const TRIAL_CONFIG = {
  FREE_FIRST_QUERY: 1, // ถามฟรี 1 ครั้งก่อน accept terms (ไม่นับเข้า trial)
  TRIAL_DAYS: 7, // จำนวนวัน trial
  TRIAL_DAILY_LIMIT: 7, // Trial 7 ครั้ง/วัน
  POST_TRIAL_LIMIT: 1, // หลัง trial หมด (teaser)
  PREMIUM_UNLIMITED: 999999, // Premium ไม่จำกัด

  // Notification days
  NOTIFY_DAYS: [3, 5, 6, 7], // วันที่แจ้งเตือน

  // Promo offers
  EARLY_BIRD_DISCOUNT: 20, // ส่วนลด % สมัครก่อน trial หมด
  WIN_BACK_DISCOUNT: 50, // ส่วนลด % หลัง trial หมด 3 วัน
};

const TRIAL_STATUS = {
  NONE: "none", // ยังไม่เคยเริ่ม trial
  PENDING_TERMS: "pending_terms", // รอ accept terms
  ACTIVE: "active", // กำลังใช้ trial
  EXPIRED: "expired", // trial หมดแล้ว
  CONVERTED: "converted", // สมัคร premium แล้ว
};

// =====================================================
// 🔧 TRIAL MANAGEMENT FUNCTIONS
// =====================================================

/**
 * ตรวจสอบสถานะ Trial ของ user
 */
async function getTrialStatus(userId) {
  const db = getFirestore();
  const userRef = db.collection("line_users").doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    return {
      status: TRIAL_STATUS.NONE,
      isFirstTimeUser: true,
      freeQueryUsed: false, // ยังไม่ได้ใช้ครั้งฟรี
      trialDaysRemaining: 0,
      dailyUsage: 0,
      totalUsage: 0,
      dailyLimit: TRIAL_CONFIG.FREE_FIRST_QUERY,
    };
  }

  const userData = userDoc.data();

  // Premium user - ไม่จำกัด
  if (userData.isPremium && userData.subscriptionStatus === "active") {
    return {
      status: TRIAL_STATUS.CONVERTED,
      isFirstTimeUser: false,
      trialDaysRemaining: 0,
      dailyUsage: userData.dailyUsageCount || 0,
      totalUsage: userData.totalUsageCount || 0,
      dailyLimit: TRIAL_CONFIG.PREMIUM_UNLIMITED,
      isPremium: true,
    };
  }

  // Check trial status
  const trialStatus = userData.trialStatus || TRIAL_STATUS.NONE;
  const trialStartDate = userData.trialStartDate?.toDate();
  const hasAcceptedTerms = userData.hasAcceptedTerms || false;

  // First time user - ยังไม่เคย interact
  if (trialStatus === TRIAL_STATUS.NONE && !userData.firstInteractionDate) {
    return {
      status: TRIAL_STATUS.NONE,
      isFirstTimeUser: true,
      freeQueryUsed: false, // ยังไม่ได้ใช้ครั้งฟรี
      trialDaysRemaining: 0,
      dailyUsage: 0,
      totalUsage: 0,
      dailyLimit: TRIAL_CONFIG.FREE_FIRST_QUERY,
      hasAcceptedTerms: false,
    };
  }

  // Pending terms - ใช้ครั้งฟรีแล้ว รอ accept (ครั้งที่ 2 จะแสดง Welcome Trial Flex)
  if (!hasAcceptedTerms) {
    return {
      status: TRIAL_STATUS.PENDING_TERMS,
      isFirstTimeUser: false,
      freeQueryUsed: true, // ใช้ครั้งฟรีแล้ว
      trialDaysRemaining: 0,
      dailyUsage: userData.dailyUsageCount || 0,
      totalUsage: userData.totalUsageCount || 0,
      dailyLimit: 0, // ต้อง accept terms ก่อน จึงจะใช้ต่อได้
      hasAcceptedTerms: false,
    };
  }

  // Active trial - คำนวณวันที่เหลือ
  if (trialStatus === TRIAL_STATUS.ACTIVE && trialStartDate) {
    const now = new Date();
    const trialEndDate = new Date(trialStartDate);
    trialEndDate.setDate(trialEndDate.getDate() + TRIAL_CONFIG.TRIAL_DAYS);

    const daysRemaining = Math.ceil((trialEndDate - now) / (1000 * 60 * 60 * 24));

    if (daysRemaining <= 0) {
      // Trial หมดแล้ว - update status
      await userRef.update({
        trialStatus: TRIAL_STATUS.EXPIRED,
        trialExpiredDate: FieldValue.serverTimestamp(),
      });

      return {
        status: TRIAL_STATUS.EXPIRED,
        isFirstTimeUser: false,
        trialDaysRemaining: 0,
        dailyUsage: userData.dailyTrialUsage || 0,
        totalUsage: userData.totalTrialUsage || 0,
        dailyLimit: TRIAL_CONFIG.POST_TRIAL_LIMIT,
        hasAcceptedTerms: true,
        trialStartDate,
        trialEndDate,
      };
    }

    // Trial ยังใช้ได้
    return {
      status: TRIAL_STATUS.ACTIVE,
      isFirstTimeUser: false,
      trialDaysRemaining: daysRemaining,
      dailyUsage: userData.dailyTrialUsage || 0,
      totalUsage: userData.totalTrialUsage || 0,
      dailyLimit: TRIAL_CONFIG.TRIAL_DAILY_LIMIT,
      hasAcceptedTerms: true,
      trialStartDate,
      trialEndDate,
      trialDay: TRIAL_CONFIG.TRIAL_DAYS - daysRemaining + 1,
    };
  }

  // Trial expired
  if (trialStatus === TRIAL_STATUS.EXPIRED) {
    return {
      status: TRIAL_STATUS.EXPIRED,
      isFirstTimeUser: false,
      trialDaysRemaining: 0,
      dailyUsage: userData.dailyTrialUsage || 0,
      totalUsage: userData.totalTrialUsage || 0,
      dailyLimit: TRIAL_CONFIG.POST_TRIAL_LIMIT,
      hasAcceptedTerms: true,
    };
  }

  // Default fallback
  return {
    status: TRIAL_STATUS.NONE,
    isFirstTimeUser: true,
    freeQueryUsed: false,
    trialDaysRemaining: 0,
    dailyUsage: 0,
    totalUsage: 0,
    dailyLimit: TRIAL_CONFIG.FREE_FIRST_QUERY,
  };
}

/**
 * บันทึก First Interaction (ใช้ครั้งฟรี - ไม่นับเข้า trial quota)
 * หลังจากนี้ครั้งถัดไปจะแสดง Welcome Trial Flex
 */
async function recordFirstInteraction(userId, displayName = "") {
  const db = getFirestore();
  const userRef = db.collection("line_users").doc(userId);

  await userRef.set({
    firstInteractionDate: FieldValue.serverTimestamp(),
    displayName: displayName,
    trialStatus: TRIAL_STATUS.PENDING_TERMS,
    hasAcceptedTerms: false,
    freeQueryUsed: true, // ใช้ครั้งฟรีแล้ว
    // ไม่นับ dailyUsageCount และ totalUsageCount เพราะเป็นครั้งฟรี
    dailyUsageCount: 0,
    totalUsageCount: 0,
    lastUsageDate: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
  }, {merge: true});

  console.log(`📝 First FREE interaction recorded for ${userId} (not counted as trial usage)`);
}

/**
 * User ยอมรับ Terms & เริ่ม Trial
 */
async function acceptTermsAndStartTrial(userId) {
  const db = getFirestore();
  const userRef = db.collection("line_users").doc(userId);

  const now = new Date();
  const trialEndDate = new Date(now);
  trialEndDate.setDate(trialEndDate.getDate() + TRIAL_CONFIG.TRIAL_DAYS);

  await userRef.update({
    hasAcceptedTerms: true,
    termsAcceptedDate: FieldValue.serverTimestamp(),
    trialStatus: TRIAL_STATUS.ACTIVE,
    trialStartDate: FieldValue.serverTimestamp(),
    trialEndDate: trialEndDate,
    dailyTrialUsage: 0,
    totalTrialUsage: 0,
    lastTrialUsageDate: null,
  });

  console.log(`✅ Trial started for ${userId} - ends ${trialEndDate.toISOString()}`);

  return {
    success: true,
    trialEndDate,
    trialDays: TRIAL_CONFIG.TRIAL_DAYS,
    dailyLimit: TRIAL_CONFIG.TRIAL_DAILY_LIMIT,
  };
}

/**
 * บันทึกการใช้งาน Trial
 */
async function recordTrialUsage(userId) {
  const db = getFirestore();
  const userRef = db.collection("line_users").doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) return {success: false, error: "User not found"};

  const userData = userDoc.data();
  const today = new Date().toDateString();
  const lastUsageDate = userData.lastTrialUsageDate?.toDate()?.toDateString();

  // Reset daily count if new day
  const isNewDay = lastUsageDate !== today;
  const currentDailyUsage = isNewDay ? 0 : (userData.dailyTrialUsage || 0);

  await userRef.update({
    dailyTrialUsage: currentDailyUsage + 1,
    totalTrialUsage: FieldValue.increment(1),
    lastTrialUsageDate: FieldValue.serverTimestamp(),
  });

  return {
    success: true,
    dailyUsage: currentDailyUsage + 1,
    totalUsage: (userData.totalTrialUsage || 0) + 1,
  };
}

/**
 * ตรวจสอบว่าใช้งานได้หรือไม่
 */
async function canUseService(userId) {
  const trialInfo = await getTrialStatus(userId);

  // Premium - ใช้ได้ไม่จำกัด
  if (trialInfo.isPremium) {
    return {
      allowed: true,
      reason: "premium",
      remaining: "unlimited",
      trialInfo,
    };
  }

  // First time user - ให้ใช้ 1 ครั้งก่อน
  if (trialInfo.status === TRIAL_STATUS.NONE && trialInfo.isFirstTimeUser) {
    return {
      allowed: true,
      reason: "first_touch",
      remaining: 1,
      showWelcomeFlex: true,
      trialInfo,
    };
  }

  // Pending terms - ต้อง accept ก่อน
  if (trialInfo.status === TRIAL_STATUS.PENDING_TERMS) {
    return {
      allowed: false,
      reason: "pending_terms",
      remaining: 0,
      showTermsFlex: true,
      trialInfo,
    };
  }

  // Active trial - เช็ค daily limit
  if (trialInfo.status === TRIAL_STATUS.ACTIVE) {
    const remaining = trialInfo.dailyLimit - trialInfo.dailyUsage;
    if (remaining > 0) {
      return {
        allowed: true,
        reason: "trial_active",
        remaining,
        trialInfo,
        showStatusFlex: true,
      };
    } else {
      return {
        allowed: false,
        reason: "daily_limit_reached",
        remaining: 0,
        trialInfo,
        showLimitFlex: true,
      };
    }
  }

  // Expired trial - ให้ใช้ 1 ครั้ง/วัน (teaser)
  if (trialInfo.status === TRIAL_STATUS.EXPIRED) {
    const today = new Date().toDateString();
    const db = getFirestore();
    const userDoc = await db.collection("line_users").doc(userId).get();
    const userData = userDoc.data();
    const lastTeaserDate = userData.lastTeaserDate?.toDate()?.toDateString();

    if (lastTeaserDate !== today) {
      return {
        allowed: true,
        reason: "teaser",
        remaining: 1,
        trialInfo,
        showExpiredFlex: true,
      };
    } else {
      return {
        allowed: false,
        reason: "teaser_used",
        remaining: 0,
        trialInfo,
        showUpgradeFlex: true,
      };
    }
  }

  // Default - not allowed
  return {
    allowed: false,
    reason: "unknown",
    remaining: 0,
    trialInfo,
  };
}

/**
 * บันทึกการใช้ Teaser (หลัง trial หมด)
 */
async function recordTeaserUsage(userId) {
  const db = getFirestore();
  await db.collection("line_users").doc(userId).update({
    lastTeaserDate: FieldValue.serverTimestamp(),
    teaserUsageCount: FieldValue.increment(1),
  });
}

// =====================================================
// 🎨 FLEX MESSAGE CREATORS
// =====================================================

/**
 * 🎨 WELCOME TRIAL FLEX - All-in-One Life Problem Solver!
 * แสดงเมื่อผู้ใช้ถามครั้งที่ 2 (หลังใช้ครั้งฟรีแล้ว)
 *
 * 🚀 Key Highlights:
 * - All-in-One assistant for work & life
 * - Factory, Agriculture, Accounting, Education solutions
 * - Clear real-world use cases
 * - Emphasize completeness & problem-solving
 */
function createWelcomeTrialFlex() {
  return {
    type: "flex",
    altText: "🎉 ถาม WiT ผู้ช่วยส่วนตัวที่เก่งรอบด้านที่สุดในไทย! ทดลองฟรี 7 วัน",
    contents: {
      type: "bubble",
      size: "giga",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "ถาม WiT (วิทย์)",
                weight: "bold",
                size: "3xl",
                color: "#FFD700",
                align: "center"
              },
              {
                type: "text",
                text: "ผู้ช่วยส่วนตัวบน LINE",
                size: "md",
                color: "#ffffffee",
                align: "center",
                margin: "sm"
              },
              {
                type: "text",
                text: "ที่เก่งรอบด้านที่สุดในไทย!",
                size: "sm",
                color: "#ffffffcc",
                align: "center",
                margin: "xs"
              }
            ]
          }
        ],
        backgroundColor: "#667eea",
        paddingAll: "20px"
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          // Success Message
          {
            type: "box",
            layout: "vertical",
            contents: [
              {type: "text", text: "ยินดีต้อนรับสู่ประสบการณ์", weight: "bold", size: "lg", color: "#27ae60", align: "center"},
              {
                type: "text",
                text: "ทดลองใช้เต็มรูปแบบฟรี",
                size: "sm",
                color: "#666666",
                wrap: true,
                align: "center",
                margin: "sm"
              }
            ],
            backgroundColor: "#e8f8f5",
            cornerRadius: "lg",
            paddingAll: "12px",
            margin: "none"
          },

          {type: "separator", margin: "lg"},

          // All-in-One Features Section
          {
            type: "box",
            layout: "vertical",
            contents: [
              {type: "text", text: "🎯 ช่วยให้คำตอบคุณได้ทุกเรื่อง (All-in-One)", weight: "bold", size: "md", color: "#333333", align: "center"},

              // Feature 1: Factory
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {type: "text", text: "🏭", size: "xl", align: "center"}
                    ],
                    backgroundColor: "#fff3e0",
                    cornerRadius: "xl",
                    width: "40px",
                    height: "40px",
                    justifyContent: "center",
                    flex: 0
                  },
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {type: "text", text: "โรงงาน", weight: "bold", size: "sm", color: "#333333"},
                      {type: "text", text: "ถ่ายรูปชิ้นงาน → วิเคราะห์ Defect แก้ปัญหาฉีดพลาสติกทันที", size: "xs", color: "#666666", wrap: true, margin: "xs"}
                    ],
                    margin: "md",
                    justifyContent: "center"
                  }
                ],
                alignItems: "center",
                margin: "lg"
              },

              // Feature 2: Agriculture
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {type: "text", text: "🌾", size: "xl", align: "center"}
                    ],
                    backgroundColor: "#e8f5e9",
                    cornerRadius: "xl",
                    width: "40px",
                    height: "40px",
                    justifyContent: "center",
                    flex: 0
                  },
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {type: "text", text: "เกษตร", weight: "bold", size: "sm", color: "#333333"},
                      {type: "text", text: "ถ่ายรูปใบไม้ → บอกโรคพืช พร้อมสูตรปุ๋ยแม่นยำ", size: "xs", color: "#666666", wrap: true, margin: "xs"}
                    ],
                    margin: "md",
                    justifyContent: "center"
                  }
                ],
                alignItems: "center",
                margin: "md"
              },

              // Feature 3: Accounting
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {type: "text", text: "💰", size: "xl", align: "center"}
                    ],
                    backgroundColor: "#e3f2fd",
                    cornerRadius: "xl",
                    width: "40px",
                    height: "40px",
                    justifyContent: "center",
                    flex: 0
                  },
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {type: "text", text: "บัญชี", weight: "bold", size: "sm", color: "#333333"},
                      {type: "text", text: "พิมพ์ไทยธรรมดา → ลงบัญชีทันที (รู้กำไร-ขาดทุนเรียลไทม์)", size: "xs", color: "#666666", wrap: true, margin: "xs"}
                    ],
                    margin: "md",
                    justifyContent: "center"
                  }
                ],
                alignItems: "center",
                margin: "md"
              },

              // Feature 4: Education
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {type: "text", text: "📚", size: "xl", align: "center"}
                    ],
                    backgroundColor: "#f3e5f5",
                    cornerRadius: "xl",
                    width: "40px",
                    height: "40px",
                    justifyContent: "center",
                    flex: 0
                  },
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {type: "text", text: "การเรียน", weight: "bold", size: "sm", color: "#333333"},
                      {type: "text", text: "ติวเตอร์ส่วนตัว อธิบายการบ้าน สร้างข้อสอบ", size: "xs", color: "#666666", wrap: true, margin: "xs"}
                    ],
                    margin: "md",
                    justifyContent: "center"
                  }
                ],
                alignItems: "center",
                margin: "md"
              }
            ],
            margin: "md"
          },

          {type: "separator", margin: "lg"},

          // CTA Message
          {
            type: "box",
            layout: "vertical",
            contents: [
              {type: "text", text: "💬 ใช้งานง่ายมาก!", weight: "bold", size: "md", color: "#667eea", align: "center"},
              {type: "text", text: "แค่พิมพ์ถาม หรือส่งรูปมา", size: "sm", color: "#555555", align: "center", margin: "sm"},
              {type: "text", text: "ถาม WiT ช่วยคุณเอง", size: "sm", color: "#555555", align: "center", margin: "xs"}
            ],
            backgroundColor: "#f0f3ff",
            cornerRadius: "lg",
            paddingAll: "12px",
            margin: "lg"
          },

          // Trial Offer
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {type: "text", text: "7", size: "3xl", weight: "bold", color: "#667eea", align: "center"},
                  {type: "text", text: "วัน", size: "sm", weight: "bold", color: "#667eea", align: "center"}
                ],
                backgroundColor: "#f0f3ff",
                cornerRadius: "lg",
                paddingAll: "12px",
                flex: 0,
                width: "70px"
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {type: "text", text: "ทดลองใช้ฟรี!", weight: "bold", size: "lg", color: "#333333"},
                  {type: "text", text: "✓ ถามได้ 7 ครั้ง/วัน", size: "xs", color: "#555555", margin: "xs"},
                  {type: "text", text: "✓ ใช้ได้ทุกฟีเจอร์", size: "xs", color: "#555555", margin: "xs"},
                  {type: "text", text: "✓ ไม่ต้องผูกบัตร", size: "xs", color: "#555555", margin: "xs"}
                ],
                margin: "md",
                justifyContent: "center"
              }
            ],
            alignItems: "center",
            margin: "lg"
          },

          {type: "separator", margin: "lg"},

          // Terms Section
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {type: "text", text: "📋", size: "md", flex: 0},
                  {type: "text", text: "เงื่อนไขการใช้งาน", weight: "bold", size: "sm", color: "#e74c3c", margin: "sm"}
                ],
                alignItems: "center"
              },
              {type: "text", text: "• ใช้เพื่อการศึกษาและการทำงานอย่างสร้างสรรค์", size: "xs", color: "#666666", wrap: true, margin: "sm"},
              {type: "text", text: "• AI อาจมีข้อผิดพลาด ควรตรวจสอบข้อมูลสำคัญ", size: "xs", color: "#666666", wrap: true, margin: "xs"},
              {type: "text", text: "• ไม่นำไปใช้ในทางที่ผิดกฎหมายหรือทำร้ายผู้อื่น", size: "xs", color: "#666666", wrap: true, margin: "xs"}
            ],
            backgroundColor: "#fff5f5",
            cornerRadius: "lg",
            paddingAll: "10px",
            margin: "lg",
            borderWidth: "1px",
            borderColor: "#ffcccc"
          }
        ],
        paddingAll: "18px",
        spacing: "none"
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          // Primary CTA Button
          {
            type: "button",
            action: {
              type: "postback",
              label: "🎉 ยอมรับ! เริ่มทดลอง 7 วัน",
              data: "action=accept_trial_terms",
              displayText: "ยอมรับเงื่อนไข เริ่มทดลองใช้ 7 วัน ฟรี!"
            },
            style: "primary",
            color: "#667eea",
            height: "md"
          },
          // Secondary Button - ดูฟีเจอร์ทั้งหมด
          {
            type: "button",
            action: {
              type: "postback",
              label: "✨ ดูฟีเจอร์ทั้งหมด",
              data: "action=show_features_menu",
              displayText: "ดูฟีเจอร์ทั้งหมดของถาม WiT"
            },
            style: "secondary",
            height: "sm",
            margin: "sm"
          },
          // Trust Badge
          {
            type: "box",
            layout: "vertical",
            contents: [
              {type: "text", text: "🔐 ปลอดภัย 100% | ⚡ เริ่มใช้ได้ทันที | 💯 ไม่มีค่าใช้จ่าย", size: "xxs", color: "#999999", align: "center"}
            ],
            margin: "md"
          }
        ],
        paddingAll: "18px",
        spacing: "none"
      }
    }
  };
}

/**
 * สร้าง Trial Started Success Flex
 * @param {string} displayName - ชื่อผู้ใช้
 * @param {object} trialInfo - ข้อมูล trial {trialDays, dailyLimit, trialEndDate}
 */
function createTrialStartedFlex(displayName, trialInfo = {}) {
  const trialEndDate = trialInfo.trialEndDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const trialDays = trialInfo.trialDays || 7;
  const dailyLimit = trialInfo.dailyLimit || 7;
  
  const endDateStr = trialEndDate.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return {
    type: "flex",
    altText: "✅ เริ่มทดลองใช้ 7 วันเรียบร้อย!",
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "✅ เริ่มทดลองใช้เรียบร้อย!",
            weight: "bold",
            size: "lg",
            color: "#ffffff",
            align: "center",
          },
        ],
        backgroundColor: "#27ae60",
        paddingAll: "15px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "vertical",
            contents: [
              {type: "text", text: "🎉", size: "3xl", align: "center"},
              {type: "text", text: `ยินดีด้วย ${displayName}!`, weight: "bold", size: "xl", align: "center", margin: "md"},
              {type: "text", text: "คุณได้รับสิทธิ์ทดลองใช้ WiT AI", size: "sm", align: "center", color: "#555555", margin: "sm"},
            ],
          },
          {type: "separator", margin: "xl"},
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {type: "text", text: "📅 ระยะเวลา", size: "sm", color: "#888888", flex: 1},
                  {type: "text", text: `${trialDays} วัน`, size: "sm", weight: "bold", color: "#333333", align: "end", flex: 1},
                ],
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {type: "text", text: "📊 ถามได้วันละ", size: "sm", color: "#888888", flex: 1},
                  {type: "text", text: `${dailyLimit} ครั้ง`, size: "sm", weight: "bold", color: "#333333", align: "end", flex: 1},
                ],
                margin: "md",
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {type: "text", text: "⏰ หมดอายุ", size: "sm", color: "#888888", flex: 1},
                  {type: "text", text: endDateStr, size: "sm", weight: "bold", color: "#e74c3c", align: "end", flex: 1},
                ],
                margin: "md",
              },
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
            type: "text",
            text: "💡 เริ่มถามคำถามได้เลย!",
            size: "sm",
            color: "#667eea",
            align: "center",
            weight: "bold",
          },
          {
            type: "text",
            text: "พิมพ์คำถามหรือส่งรูปมาเลยครับ",
            size: "xs",
            color: "#888888",
            align: "center",
            margin: "sm",
          },
        ],
        paddingAll: "15px",
      },
    },
  };
}

/**
 * สร้าง Daily Status Flex
 * @param {string} displayName - ชื่อผู้ใช้ (optional)
 * @param {object} trialInfo - ข้อมูล trial
 */
function createDailyStatusFlex(displayName, trialInfo = null) {
  // Support both (displayName, trialInfo) and (trialInfo) signatures
  if (typeof displayName === "object" && trialInfo === null) {
    trialInfo = displayName;
    displayName = "คุณ";
  }
  
  const usagePercent = Math.round((trialInfo.dailyUsage / trialInfo.dailyLimit) * 100);
  const progressBars = Math.round((trialInfo.dailyUsage / trialInfo.dailyLimit) * 10);
  const progressStr = "█".repeat(Math.min(progressBars, 10)) + "░".repeat(Math.max(10 - progressBars, 0));

  return {
    type: "flex",
    altText: `📊 สถานะ Trial: ${trialInfo.dailyUsage}/${trialInfo.dailyLimit} ครั้ง`,
    contents: {
      type: "bubble",
      size: "kilo",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "📊 สถานะการใช้งานวันนี้",
            weight: "bold",
            size: "sm",
            color: "#333333",
          },
          {type: "separator", margin: "md"},
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: `🔋 ${progressStr} ${trialInfo.dailyUsage}/${trialInfo.dailyLimit}`,
                size: "sm",
                color: usagePercent >= 80 ? "#e74c3c" : "#667eea",
                align: "center",
              },
              {
                type: "text",
                text: `📅 Trial เหลือ: ${trialInfo.trialDaysRemaining} วัน`,
                size: "xs",
                color: trialInfo.trialDaysRemaining <= 2 ? "#e74c3c" : "#888888",
                align: "center",
                margin: "sm",
              },
            ],
            margin: "md",
          },
        ],
        paddingAll: "15px",
      },
      footer: {
        type: "box",
        layout: "horizontal",
        contents: [
          {
            type: "button",
            action: {
              type: "message",
              label: "💎 Premium",
              text: "สมัคร Premium",
            },
            style: "primary",
            color: "#667eea",
            height: "sm",
            flex: 1,
          },
        ],
        paddingAll: "10px",
      },
    },
  };
}

/**
 * สร้าง Daily Limit Reached Flex
 */
function createDailyLimitFlex(trialInfo) {
  return {
    type: "flex",
    altText: "⚠️ ใช้ครบ 7 ครั้งวันนี้แล้ว",
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "⚠️ ใช้ครบ 7 ครั้งวันนี้แล้ว",
            weight: "bold",
            size: "md",
            color: "#ffffff",
            align: "center",
          },
        ],
        backgroundColor: "#f39c12",
        paddingAll: "15px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "📊 สรุปการใช้งานวันนี้",
            weight: "bold",
            size: "sm",
            color: "#333333",
          },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {type: "text", text: "ใช้ไปแล้ว", size: "sm", color: "#888888", flex: 1},
              {type: "text", text: `${trialInfo.dailyUsage}/${trialInfo.dailyLimit} ครั้ง`, size: "sm", weight: "bold", color: "#e74c3c", align: "end", flex: 1},
            ],
            margin: "md",
          },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {type: "text", text: "Trial เหลือ", size: "sm", color: "#888888", flex: 1},
              {type: "text", text: `${trialInfo.trialDaysRemaining} วัน`, size: "sm", weight: "bold", color: "#333333", align: "end", flex: 1},
            ],
            margin: "sm",
          },
          {type: "separator", margin: "lg"},
          {
            type: "text",
            text: "💡 กลับมาใช้ใหม่พรุ่งนี้ หรือ",
            size: "sm",
            color: "#555555",
            margin: "lg",
            align: "center",
          },
          {
            type: "text",
            text: "อัปเกรด Premium ใช้ไม่จำกัด!",
            size: "sm",
            color: "#667eea",
            weight: "bold",
            align: "center",
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
              type: "message",
              label: "💎 อัปเกรด Premium เลย",
              text: "สนใจสมัคร Premium",
            },
            style: "primary",
            color: "#667eea",
          },
          {
            type: "button",
            action: {
              type: "message",
              label: "⏰ รอพรุ่งนี้",
              text: "ok",
            },
            style: "secondary",
            margin: "sm",
          },
        ],
        paddingAll: "15px",
      },
    },
    quickReply: {
      items: [
        {type: "action", action: {type: "message", label: "💎 สมัคร Premium", text: "สนใจสมัคร Premium"}},
        {type: "action", action: {type: "message", label: "📋 ดูแพ็คเกจ", text: "ดูแพ็คเกจ"}},
        {type: "action", action: {type: "message", label: "📞 ติดต่อแอดมิน", text: "แจ้งปลดล็อคโควต้า"}},
        {type: "action", action: {type: "message", label: "❓ วิธีใช้", text: "/help"}},
      ],
    },
  };
}

/**
 * สร้าง Trial Ending Soon Flex (วันที่ 5-6)
 */
function createTrialEndingSoonFlex(trialInfo, daysLeft) {
  const discount = daysLeft <= 1 ? 30 : 20;
  const originalPrice = 99;
  const discountedPrice = Math.round(originalPrice * (100 - discount) / 100);

  return {
    type: "flex",
    altText: `⏰ Trial เหลืออีก ${daysLeft} วัน! มีโปรพิเศษ`,
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
              {type: "text", text: "⏰", size: "xxl", flex: 0},
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {type: "text", text: `Trial เหลืออีก ${daysLeft} วัน!`, weight: "bold", size: "lg", color: "#ffffff"},
                  {type: "text", text: "อย่าพลาดสิทธิพิเศษ", size: "sm", color: "#ffffffcc"},
                ],
                margin: "lg",
              },
            ],
          },
        ],
        backgroundColor: "#e74c3c",
        paddingAll: "20px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "📊 สรุปการใช้งานของคุณ",
            weight: "bold",
            size: "md",
            color: "#333333",
          },
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {type: "text", text: "✅ ถามไปแล้ว", size: "sm", color: "#888888", flex: 1},
                  {type: "text", text: `${trialInfo.totalUsage} คำถาม`, size: "sm", weight: "bold", color: "#27ae60", align: "end", flex: 1},
                ],
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {type: "text", text: "📅 ใช้งานมา", size: "sm", color: "#888888", flex: 1},
                  {type: "text", text: `${TRIAL_CONFIG.TRIAL_DAYS - daysLeft} วัน`, size: "sm", weight: "bold", color: "#333333", align: "end", flex: 1},
                ],
                margin: "sm",
              },
            ],
            margin: "lg",
          },
          {type: "separator", margin: "xl"},
          {
            type: "box",
            layout: "vertical",
            contents: [
              {type: "text", text: "🎁 โปรพิเศษเฉพาะคุณ!", weight: "bold", size: "md", color: "#e74c3c", align: "center"},
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {type: "text", text: `ลด ${discount}%`, size: "lg", weight: "bold", color: "#e74c3c", align: "center"},
                ],
                margin: "md",
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {type: "text", text: `${originalPrice}฿`, size: "sm", color: "#888888", decoration: "line-through", align: "center", flex: 1},
                  {type: "text", text: "→", size: "sm", color: "#888888", align: "center", flex: 0},
                  {type: "text", text: `${discountedPrice}฿/เดือน`, size: "md", weight: "bold", color: "#27ae60", align: "center", flex: 1},
                ],
                margin: "sm",
              },
            ],
            margin: "lg",
            backgroundColor: "#fff3f3",
            paddingAll: "15px",
            cornerRadius: "lg",
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
              type: "message",
              label: `🔥 สมัครเลย ลด ${discount}%`,
              text: "สมัคร Premium",
            },
            style: "primary",
            color: "#e74c3c",
          },
          {
            type: "button",
            action: {
              type: "message",
              label: `⏳ ใช้ Trial ต่อ (เหลือ ${daysLeft} วัน)`,
              text: "ใช้ Trial ต่อ",
            },
            style: "secondary",
            margin: "sm",
          },
        ],
        paddingAll: "15px",
      },
    },
  };
}

/**
 * สร้าง Trial Expired Flex
 */
function createTrialExpiredFlex(trialInfo) {
  return {
    type: "flex",
    altText: "😢 Trial 7 วันหมดแล้ว - มีโปรพิเศษ!",
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "😢 Trial 7 วันหมดแล้ว",
            weight: "bold",
            size: "lg",
            color: "#ffffff",
            align: "center",
          },
        ],
        backgroundColor: "#95a5a6",
        paddingAll: "20px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "📊 คุณใช้งาน WiT AI ไปแล้ว:",
            weight: "bold",
            size: "md",
            color: "#333333",
          },
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {type: "text", text: "✅", size: "md", flex: 0},
                  {type: "text", text: `${trialInfo.totalUsage || 0} คำถาม`, size: "md", weight: "bold", color: "#27ae60", margin: "sm", flex: 1},
                ],
              },
            ],
            margin: "lg",
          },
          {type: "separator", margin: "xl"},
          {
            type: "box",
            layout: "vertical",
            contents: [
              {type: "text", text: "💎 Premium เริ่มต้นเพียง", size: "sm", color: "#555555", align: "center"},
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {type: "text", text: "99", size: "3xl", weight: "bold", color: "#667eea", align: "end", flex: 1},
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {type: "text", text: "บาท", size: "sm", color: "#667eea"},
                      {type: "text", text: "/เดือน", size: "xs", color: "#888888"},
                    ],
                    margin: "sm",
                    flex: 0,
                  },
                ],
                justifyContent: "center",
                margin: "md",
              },
              {type: "text", text: "= วันละ 3.30 บาท ☕", size: "xs", color: "#888888", align: "center", margin: "sm"},
            ],
            margin: "lg",
            backgroundColor: "#f8f9fa",
            paddingAll: "20px",
            cornerRadius: "lg",
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
              type: "message",
              label: "💳 สมัคร Premium",
              text: "สนใจสมัคร Premium",
            },
            style: "primary",
            color: "#667eea",
          },
          {
            type: "button",
            action: {
              type: "message",
              label: "📱 ใช้แบบจำกัด (1 ครั้ง/วัน)",
              text: "ใช้แบบจำกัด",
            },
            style: "secondary",
            margin: "sm",
          },
        ],
        paddingAll: "15px",
      },
    },
    quickReply: {
      items: [
        {type: "action", action: {type: "message", label: "💎 สมัคร Premium", text: "สนใจสมัคร Premium"}},
        {type: "action", action: {type: "message", label: "📋 ดูแพ็คเกจ", text: "ดูแพ็คเกจ"}},
        {type: "action", action: {type: "message", label: "📞 ติดต่อแอดมิน", text: "แจ้งปลดล็อคโควต้า"}},
        {type: "action", action: {type: "message", label: "❓ วิธีใช้", text: "/help"}},
      ],
    },
  };
}

/**
 * 🎨 สร้าง Features Menu Flex - แสดงฟีเจอร์ทั้งหมดของ WiT AI
 */
function createFeaturesMenuFlex() {
  return {
    type: "flex",
    altText: "✨ ฟีเจอร์ทั้งหมดของ WiT AI",
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {type: "text", text: "✨ ฟีเจอร์ทั้งหมดของ WiT AI", weight: "bold", size: "lg", color: "#ffffff", align: "center"},
          {type: "text", text: "เลือกฟีเจอร์ที่ต้องการใช้งาน", size: "sm", color: "#ffffffcc", align: "center", margin: "sm"}
        ],
        backgroundColor: "#667eea",
        paddingAll: "20px"
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          // Row 1: AI Chat & Vision
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {type: "text", text: "🤖", size: "xxl", align: "center"},
                  {type: "text", text: "ถาม AI", weight: "bold", size: "sm", align: "center", margin: "sm"},
                  {type: "text", text: "ถามได้ทุกเรื่อง", size: "xxs", color: "#888888", align: "center", wrap: true}
                ],
                backgroundColor: "#f0f3ff",
                cornerRadius: "lg",
                paddingAll: "12px",
                flex: 1,
                action: {type: "message", text: "วิธีถาม AI"}
              },
              {type: "filler", flex: 0},
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {type: "text", text: "📸", size: "xxl", align: "center"},
                  {type: "text", text: "Vision AI", weight: "bold", size: "sm", align: "center", margin: "sm"},
                  {type: "text", text: "วิเคราะห์รูปภาพ", size: "xxs", color: "#888888", align: "center", wrap: true}
                ],
                backgroundColor: "#e8f5e9",
                cornerRadius: "lg",
                paddingAll: "12px",
                flex: 1,
                margin: "md",
                action: {type: "message", text: "วิธีใช้ Vision AI"}
              }
            ],
            spacing: "md"
          },

          // Row 2: Document & Translation
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {type: "text", text: "📄", size: "xxl", align: "center"},
                  {type: "text", text: "อ่านเอกสาร", weight: "bold", size: "sm", align: "center", margin: "sm"},
                  {type: "text", text: "PDF, รูปภาพ", size: "xxs", color: "#888888", align: "center", wrap: true}
                ],
                backgroundColor: "#fff3e0",
                cornerRadius: "lg",
                paddingAll: "12px",
                flex: 1,
                action: {type: "message", text: "วิธีอ่านเอกสาร"}
              },
              {type: "filler", flex: 0},
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {type: "text", text: "🌐", size: "xxl", align: "center"},
                  {type: "text", text: "แปลภาษา", weight: "bold", size: "sm", align: "center", margin: "sm"},
                  {type: "text", text: "หลายภาษา", size: "xxs", color: "#888888", align: "center", wrap: true}
                ],
                backgroundColor: "#e3f2fd",
                cornerRadius: "lg",
                paddingAll: "12px",
                flex: 1,
                margin: "md",
                action: {type: "message", text: "วิธีแปลภาษา"}
              }
            ],
            spacing: "md",
            margin: "md"
          },

          // Row 3: Expert & Calculator
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {type: "text", text: "🏭", size: "xxl", align: "center"},
                  {type: "text", text: "ผู้เชี่ยวชาญ", weight: "bold", size: "sm", align: "center", margin: "sm"},
                  {type: "text", text: "โรงงาน เกษตร", size: "xxs", color: "#888888", align: "center", wrap: true}
                ],
                backgroundColor: "#fce4ec",
                cornerRadius: "lg",
                paddingAll: "12px",
                flex: 1,
                action: {type: "message", text: "ผู้เชี่ยวชาญมีอะไรบ้าง"}
              },
              {type: "filler", flex: 0},
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {type: "text", text: "🧮", size: "xxl", align: "center"},
                  {type: "text", text: "คำนวณ", weight: "bold", size: "sm", align: "center", margin: "sm"},
                  {type: "text", text: "พลาสติก ฉีด", size: "xxs", color: "#888888", align: "center", wrap: true}
                ],
                backgroundColor: "#f3e5f5",
                cornerRadius: "lg",
                paddingAll: "12px",
                flex: 1,
                margin: "md",
                action: {type: "message", text: "เครื่องคำนวณ"}
              }
            ],
            spacing: "md",
            margin: "md"
          },

          // Row 4: Quiz & Help
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {type: "text", text: "📚", size: "xxl", align: "center"},
                  {type: "text", text: "แบบทดสอบ", weight: "bold", size: "sm", align: "center", margin: "sm"},
                  {type: "text", text: "เรียนรู้+Quiz", size: "xxs", color: "#888888", align: "center", wrap: true}
                ],
                backgroundColor: "#e0f7fa",
                cornerRadius: "lg",
                paddingAll: "12px",
                flex: 1,
                action: {type: "message", text: "/quiz"}
              },
              {type: "filler", flex: 0},
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {type: "text", text: "❓", size: "xxl", align: "center"},
                  {type: "text", text: "วิธีใช้", weight: "bold", size: "sm", align: "center", margin: "sm"},
                  {type: "text", text: "คู่มือทั้งหมด", size: "xxs", color: "#888888", align: "center", wrap: true}
                ],
                backgroundColor: "#fffde7",
                cornerRadius: "lg",
                paddingAll: "12px",
                flex: 1,
                margin: "md",
                action: {type: "message", text: "วิธีใช้"}
              }
            ],
            spacing: "md",
            margin: "md"
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
            action: {
              type: "postback",
              label: "🎉 เริ่มทดลองใช้ 7 วัน ฟรี!",
              data: "action=accept_trial_terms",
              displayText: "ยอมรับเงื่อนไข เริ่มทดลองใช้ 7 วัน ฟรี!"
            },
            style: "primary",
            color: "#667eea"
          },
          {type: "text", text: "กดที่ไอคอนเพื่อดูรายละเอียดแต่ละฟีเจอร์", size: "xxs", color: "#999999", align: "center", margin: "md"}
        ],
        paddingAll: "15px"
      }
    }
  };
}

// =====================================================
// 🔔 NOTIFICATION HELPERS
// =====================================================

/**
 * ตรวจสอบว่าควรแจ้งเตือนหรือไม่
 */
function shouldShowNotification(trialInfo) {
  if (trialInfo.status !== TRIAL_STATUS.ACTIVE) return null;

  const daysLeft = trialInfo.trialDaysRemaining;

  // แจ้งเตือนวันที่ 3, 5, 6, 7 (เหลือ 4, 2, 1, 0 วัน)
  if (daysLeft === 4) return {type: "reminder", daysLeft};
  if (daysLeft === 2) return {type: "urgent", daysLeft};
  if (daysLeft === 1) return {type: "lastDay", daysLeft};

  return null;
}

// =====================================================
// 📦 EXPORTS
// =====================================================

module.exports = {
  // Constants
  TRIAL_CONFIG,
  TRIAL_STATUS,

  // Trial Management
  getTrialStatus,
  recordFirstInteraction,
  acceptTermsAndStartTrial,
  recordTrialUsage,
  canUseService,
  recordTeaserUsage,

  // Flex Messages
  createWelcomeTrialFlex,
  createTrialStartedFlex,
  createDailyStatusFlex,
  createDailyLimitFlex,
  createTrialEndingSoonFlex,
  createTrialExpiredFlex,
  createFeaturesMenuFlex,

  // Notifications
  shouldShowNotification,
};