/**
 * 🤖 AI RESPONSE FLEX MESSAGES (PREMIUM EDITION)
 * Flex Messages สำหรับการตอบของ AI ที่เน้นความสวยงาม ทันสมัย และอ่านง่าย (Rich Aesthetics)
 */

/**
 * สร้าง Flex Message สำหรับคำตอบของ AI แบบ Premium Design
 * @param {string} responseText - คำตอบจาก AI
 * @param {string} question - คำถามของผู้ใช้
 * @param {Object} metadata - ข้อมูลเพิ่มเติม (questionType, confidence, source, userName, isPremium, etc.)
 * @returns {Object} Flex Message object
 */
const createAIResponseFlex = (responseText, question = "", metadata = {}) => {
  // ดึงชื่อผู้ใช้จาก metadata
  const userName = metadata.userName || "คุณ";
  // ดึงสถานะ Premium
  const isPremium = metadata.isPremium || false;
  const userTier = isPremium ? "⭐ Premium" : "🆓 Free";

  // Sanitize question และ responseText สำหรับ encodeURIComponent
  // ลบตัวอักษร Unicode ที่มีปัญหาออก (emoji, surrogate pairs, special chars)
  const sanitizeForUri = (str) => {
    if (!str) return "";
    return str
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, "") // ลบ emoji
      .replace(/[\u{2600}-\u{26FF}]/gu, "")   // ลบ symbols
      .replace(/[\u{2700}-\u{27BF}]/gu, "")   // ลบ dingbats
      .replace(/[^\x00-\x7F\u0E00-\u0E7F]/g, "") // เก็บแค่ ASCII และภาษาไทย
      .trim();
  };
  const safeQuestion = sanitizeForUri(question).substring(0, 100);
  const safeResponsePreview = sanitizeForUri(responseText).substring(0, 50);

  // ตรวจสอบความยาวของข้อความ
  const isLongResponse = responseText.length > 1000;

  // ทำความสะอาดข้อความ ลบ markdown notation ออกบางส่วนเพื่อให้แสดงผลสวยใน Flex
  // แต่พยายามเก็บโครงสร้างไว้
  let cleanedText = responseText
    .replace(/\*\*\*/g, "") // ลบ ***
    .replace(/\*\*/g, "")   // ลบ **
    .replace(/\*/g, "")     // ลบ *
    .replace(/```/g, "")    // ลบ code block markers
    .trim();

  // Color Palette & Design System
  const designSystem = {
    primary: "#06C755", // LINE Green (Brand)
    secondary: "#2c3e50", // Dark Blue-Grey
    accent: "#3498db",    // Bright Blue
    background: "#ffffff",
    surface: "#f8f9fa",
    text: {
      primary: "#111827",
      secondary: "#6b7280",
      tertiary: "#9ca3af",
      light: "#ffffff",
    },
    gradients: {
      default: { start: "#06C755", end: "#05a044" },
      calculation: { start: "#4F46E5", end: "#3730A3" }, // Indigo
      technical: { start: "#2563EB", end: "#1E40AF" },   // Blue
      howto: { start: "#059669", end: "#047857" },       // Emerald
      troubleshooting: { start: "#EA580C", end: "#C2410C" }, // Orange
      warning: { start: "#DC2626", end: "#991B1B" },      // Red
    }
  };

  // กำหนด Design Config ตามประเภทคำถาม (Enhanced with More Contexts)
  const typeConfig = {
    calculation: {
      icon: "https://cdn-icons-png.flaticon.com/512/2643/2643244.png",
      emoji: "🧮",
      title: "ผลการคำนวณ",
      gradient: designSystem.gradients.calculation,
      headerColor: "#4F46E5"
    },
    technical: {
      icon: "https://cdn-icons-png.flaticon.com/512/2942/2942490.png",
      emoji: "🔧",
      title: "ข้อมูลเทคนิค",
      gradient: designSystem.gradients.technical,
      headerColor: "#2563EB"
    },
    howto: {
      icon: "https://cdn-icons-png.flaticon.com/512/3135/3135673.png",
      emoji: "📚",
      title: "วิธีการปฏิบัติ",
      gradient: designSystem.gradients.howto,
      headerColor: "#059669"
    },
    troubleshooting: {
      icon: "https://cdn-icons-png.flaticon.com/512/9187/9187532.png",
      emoji: "🔍",
      title: "การแก้ปัญหา",
      gradient: designSystem.gradients.troubleshooting,
      headerColor: "#EA580C"
    },
    education: {
      emoji: "🎓",
      title: "การเรียนรู้",
      gradient: { start: "#8B5CF6", end: "#6D28D9" }, // Purple
      headerColor: "#8B5CF6"
    },
    comparison: {
      emoji: "⚖️",
      title: "การเปรียบเทียบ",
      gradient: { start: "#06B6D4", end: "#0891B2" }, // Cyan
      headerColor: "#06B6D4"
    },
    recommendation: {
      emoji: "⭐",
      title: "คำแนะนำ",
      gradient: { start: "#F59E0B", end: "#D97706" }, // Amber
      headerColor: "#F59E0B"
    },
    analysis: {
      emoji: "📊",
      title: "การวิเคราะห์",
      gradient: { start: "#10B981", end: "#059669" }, // Green
      headerColor: "#10B981"
    },
    explanation: {
      emoji: "💬",
      title: "คำอธิบาย",
      gradient: { start: "#3B82F6", end: "#2563EB" }, // Blue
      headerColor: "#3B82F6"
    },
    definition: {
      emoji: "📖",
      title: "คำจำกัดความ",
      gradient: { start: "#6366F1", end: "#4F46E5" }, // Indigo
      headerColor: "#6366F1"
    },
    safety: {
      emoji: "🛡️",
      title: "ความปลอดภัย",
      gradient: { start: "#EF4444", end: "#DC2626" }, // Red
      headerColor: "#EF4444"
    },
    maintenance: {
      emoji: "🔨",
      title: "การบำรุงรักษา",
      gradient: { start: "#14B8A6", end: "#0D9488" }, // Teal
      headerColor: "#14B8A6"
    },
    quality: {
      emoji: "✅",
      title: "มาตรฐานคุณภาพ",
      gradient: { start: "#22C55E", end: "#16A34A" }, // Green
      headerColor: "#22C55E"
    },
    cost: {
      emoji: "💰",
      title: "ต้นทุนและราคา",
      gradient: { start: "#F97316", end: "#EA580C" }, // Orange
      headerColor: "#F97316"
    },
    material: {
      emoji: "🧪",
      title: "วัสดุและสารเคมี",
      gradient: { start: "#A855F7", end: "#9333EA" }, // Purple
      headerColor: "#A855F7"
    },
    process: {
      emoji: "⚙️",
      title: "กระบวนการผลิต",
      gradient: { start: "#64748B", end: "#475569" }, // Slate
      headerColor: "#64748B"
    },
    machine: {
      emoji: "🏭",
      title: "เครื่องจักร",
      gradient: { start: "#71717A", end: "#52525B" }, // Zinc
      headerColor: "#71717A"
    },
    mold: {
      emoji: "🔩",
      title: "แม่พิมพ์",
      gradient: { start: "#78716C", end: "#57534E" }, // Stone
      headerColor: "#78716C"
    },
    general: {
      icon: "https://cdn-icons-png.flaticon.com/512/4712/4712035.png",
      emoji: "💡",
      title: "คำตอบจาก TukTuk",
      gradient: designSystem.gradients.default,
      headerColor: "#06C755"
    },
  };

  const questionType = metadata.questionType || "general";
  const config = typeConfig[questionType] || typeConfig.general;

  // --- Content Segmentation Strategy (ENHANCED) ---
  // แบ่งข้อความอย่างฉลาด:
  // 1. แยก double newline (\n\n) = Paragraphs
  // 2. ตรวจจับ Lists (numbered/bullet)
  // 3. ตรวจจับ Headers (สั้น + ลงท้าย ":")
  // 4. ตรวจจับ Code blocks (```)
  // 5. รักษา Single newlines ภายใน paragraph

  const paragraphs = cleanedText.split(/\n\n+/).filter(p => p.trim());

  const contentComponents = [];

  paragraphs.forEach((para, index) => {
    // ตรวจสอบ Code Block
    if (para.trim().startsWith("```") && para.trim().endsWith("```")) {
      const codeContent = para.trim().slice(3, -3).trim();
      contentComponents.push({
        type: "box",
        layout: "vertical",
        contents: [{
          type: "text",
          text: codeContent,
          size: "sm",
          color: "#22C55E",
          wrap: true,
          style: "normal",
          lineSpacing: "6px"
        }],
        margin: "md",
        paddingAll: "14px",
        backgroundColor: "#1F2937",
        cornerRadius: "8px"
      });
      return;
    }

    // ตรวจสอบ List (bullet points)
    const isList = para.match(/^(\d+\.|[-•])\s/m);

    // ตรวจสอบ Header ย่อย (สั้น + ลงท้าย ":" หรือมี # ข้างหน้า)
    const isHeader = (para.length < 60 && para.trim().endsWith(":")) || para.match(/^#{1,6}\s/);

    if (isList) {
      // จัดการ List Items
      const listItems = para.split(/\n/).filter(line => line.trim());
      const listContents = listItems.map(item => {
        const match = item.match(/^(\d+\.|[-•])\s+(.+)$/);
        const bullet = match ? match[1] : "•";
        const content = match ? match[2] : item;

        return {
          type: "box",
          layout: "baseline",
          spacing: "sm",
          contents: [
            {
              type: "text",
              text: bullet,
              size: "md",
              color: config.headerColor,
              flex: 1,
              weight: "bold"
            },
            {
              type: "text",
              text: content,
              size: "md",
              color: "#374151",
              flex: 9,
              wrap: true,
              lineSpacing: "6px"
            }
          ],
          margin: "sm"
        };
      });

      contentComponents.push({
        type: "box",
        layout: "vertical",
        contents: listContents,
        margin: "md",
        paddingAll: "14px",
        backgroundColor: "#F3F4F6",
        cornerRadius: "8px"
      });

    } else if (isHeader) {
      // จัดการ Header ย่อย
      const headerText = para.replace(/^#{1,6}\s/, "").replace(/:$/, "").trim();
      contentComponents.push({
        type: "text",
        text: `📌 ${headerText}`,
        weight: "bold",
        size: "lg",
        color: config.headerColor,
        margin: index === 0 ? "md" : "lg"
      });

    } else {
      // Text Paragraph ธรรมดา (รักษา single newline)
      contentComponents.push({
        type: "text",
        text: para.trim(),
        size: "md",
        color: "#1F2937",
        wrap: true,
        margin: "md",
        lineSpacing: "8px"
      });
    }
  });

  // --- Metadata Footer Components ---
  const metadataComponents = [];
  if (metadata.confidence) {
    const confidencePercent = Math.round(metadata.confidence * 100);
    metadataComponents.push({
      type: "text",
      text: `ความมั่นใจ: ${confidencePercent}%`,
      size: "xxs",
      color: "#9CA3AF",
      flex: 0
    });
  }
  if (metadata.source) {
    const sourceLabel = metadata.source === 'local_knowledge' ? 'Local DB' : 'AI Analysis';
    metadataComponents.push({
      type: "text",
      text: `• แหล่ง: ${sourceLabel}`,
      size: "xxs",
      color: "#9CA3AF",
      margin: "sm"
    });
  }


  // --- Final Assembly ---
  return {
    type: "flex",
    altText: `💡 ${config.title}: ${question.substring(0, 30)}...`,
    contents: {
      type: "bubble",
      size: "giga", // Max width
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: config.emoji,
                size: "3xl",
                flex: 0
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "text",
                    text: config.title,
                    weight: "bold",
                    size: "xl",
                    color: "#FFFFFF"
                  },
                  {
                    type: "text",
                    text: "TukTuk AI Assistant",
                    size: "xs",
                    color: "#E5E7EB"
                  }
                ],
                margin: "md",
                justifyContent: "center"
              }
            ]
          },
          // User Name & Question Preview
          ...(question ? [{
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: `👤 ${userName} ถาม:`,
                size: "xxs",
                color: "#FFFFFF",
                weight: "bold",
                margin: "none"
              },
              {
                type: "text",
                text: `"${question.length > 60 ? question.substring(0, 60) + '...' : question}"`,
                size: "xs",
                color: "#FFFFFF",
                style: "italic",
                wrap: true,
                maxLines: 2,
                margin: "xs"
              }
            ],
            margin: "md",
            backgroundColor: "#FFFFFF20", // Translucent white
            cornerRadius: "6px",
            paddingAll: "10px",
            spacing: "xs"
          }] : [])
        ],
        paddingAll: "20px",
        background: {
          type: "linearGradient",
          angle: "135deg",
          startColor: config.gradient.start,
          endColor: config.gradient.end
        }
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          ...contentComponents,
          { type: "separator", margin: "xl" },
          // Action Buttons - Compact Layout
          {
            type: "box",
            layout: "vertical",
            margin: "lg",
            spacing: "sm",
            contents: [
              // Row 1: Primary Actions (ถามต่อ, ไม่เข้าใจ, คัดลอก)
              {
                type: "box",
                layout: "horizontal",
                spacing: "sm",
                contents: [
                  {
                    type: "button",
                    action: { type: "message", label: "💬 ถามต่อ", text: "ขอรายละเอียดเพิ่มเติมครับ" },
                    style: "primary",
                    color: config.headerColor,
                    height: "sm",
                    flex: 1
                  },
                  {
                    type: "button",
                    action: { type: "message", label: "❓ ไม่เข้าใจ", text: "ช่วยอธิบายให้ง่ายขึ้นหน่อยครับ" },
                    style: "secondary",
                    height: "sm",
                    flex: 1
                  },
                  {
                    type: "button",
                    action: {
                      type: "clipboard",
                      label: "📋",
                      clipboardText: responseText.substring(0, 800) + "\n\n---\n📱 LINE: https://lin.ee/1YJsw47\n🌐 Web: https://tuktukfeed.com"
                    },
                    style: "secondary",
                    height: "sm",
                    flex: 0
                  }
                ]
              },
              // Row 2: Feedback (3 buttons)
              {
                type: "box",
                layout: "horizontal",
                spacing: "sm",
                contents: [
                  {
                    type: "button",
                    action: { type: "postback", label: "👍 ชอบ", data: "action=like&type=ai_response" },
                    style: "secondary",
                    height: "sm",
                    flex: 1
                  },
                  {
                    type: "button",
                    action: { type: "postback", label: "👎 ไม่ชอบ", data: "action=unlike&type=ai_response" },
                    style: "secondary",
                    height: "sm",
                    flex: 1
                  },
                  {
                    type: "button",
                    action: {
                      type: "uri",
                      label: "📤 แชร์",
                      uri: `https://line.me/R/share?text=${encodeURIComponent("คำตอบจาก WiT:\n" + safeQuestion + "\n\n" + safeResponsePreview + "...")}`
                    },
                    style: "secondary",
                    height: "sm",
                    flex: 1
                  }
                ]
              }
            ]
          }
        ],
        paddingAll: "20px"
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          // User Tier Status
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: userTier,
                size: "xs",
                color: isPremium ? "#F59E0B" : "#6B7280",
                weight: isPremium ? "bold" : "regular",
                flex: 0
              },
              {
                type: "text",
                text: isPremium ? "ไม่จำกัดการใช้งาน" : "เหลือ " + (metadata.freeQuota || 5) + " ครั้ง/วัน",
                size: "xxs",
                color: "#9CA3AF",
                margin: "sm",
                flex: 1
              },
              {
                type: "text",
                text: "✨ TukTuk Thailand",
                size: "xxs",
                color: "#9CA3AF",
                align: "end",
                flex: 0
              }
            ]
          },
          // Upgrade button for Free users
          ...(isPremium ? [] : [{
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: "🚀 อัพเกรด Premium ใช้ไม่จำกัด",
                size: "xxs",
                color: "#6366F1",
                action: { type: "message", text: "/premium" },
                flex: 1,
                align: "center"
              }
            ],
            margin: "sm",
            paddingAll: "8px",
            backgroundColor: "#EEF2FF",
            cornerRadius: "6px"
          }])
        ],
        paddingAll: "12px",
        backgroundColor: "#F9FAFB"
      }
    }
  };
};

/**
 * สร้าง Flex Message แบบง่ายสำหรับคำตอบสั้นๆ (Modern Card)
 * @param {string} responseText - คำตอบจาก AI
 * @param {string} userName - ชื่อผู้ใช้ (optional)
 */
const createSimpleAIResponseFlex = (responseText, userName = "คุณ") => {
  return {
    type: "flex",
    altText: "💬 TukTuk Reply",
    contents: {
      type: "bubble",
      size: "kilo",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: "🤖", size: "xxl", flex: 0 },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "TukTuk Assistant", weight: "bold", size: "md", color: "#111827" },
                  { type: "text", text: "ตอบกลับทันใจ", size: "xs", color: "#6B7280" }
                ],
                margin: "md",
                justifyContent: "center"
              }
            ]
          },
          { type: "separator", margin: "md" },
          {
            type: "text",
            text: responseText,
            size: "sm",
            color: "#374151",
            wrap: true,
            margin: "md",
            lineSpacing: "4px"
          }
        ],
        paddingAll: "20px",
        backgroundColor: "#FFFFFF",
        cornerRadius: "12px",
        borderColor: "#E5E7EB",
        borderWidth: "1px"
      },
      styles: {
        footer: {
          separator: false
        }
      }
    }
  };
};

/**
 * ตัดสินใจว่าควรใช้ Flex Message หรือ Text ธรรมดา
 * @param {string} responseText - คำตอบจาก AI (clean text ไม่มี credit line)
 * @param {string} question - คำถาม
 * @param {Object} metadata - metadata
 * @returns {Object} Message object (Flex หรือ Text)
 */
const getOptimalAIResponse = (responseText, question = "", metadata = {}) => {
  const creditLine = "\n\n✨ ขับเคลื่อนสู่ความสำเร็จโดย TukTuk Thailand";

  console.log(`🎨 getOptimalAIResponse: responseText length = ${responseText.length} chars`);

  // 🎨 ใช้ Flex Message เสมอ ยกเว้นข้อความยาวเกินไป (> 5000 chars) เพื่อความปลอดภัย
  // เหตุผล: Flex Message สวยงามและมี UX ที่ดีกว่า แม้ข้อความสั้นก็ควรใช้ Flex

  if (responseText.length > 5000) {
    // ข้อความยาวเกินไป - ใช้ Text เพื่อหลีกเลี่ยง LINE API limit
    console.log(`⚠️ Response too long (${responseText.length} chars), using text message`);
    return {
      type: "text",
      text: responseText + creditLine,
    };
  }

  // ใช้ Flex Message สำหรับทุกกรณี (รวมข้อความสั้น)
  try {
    console.log(`✨ Creating Flex Message (length: ${responseText.length} chars)`);
    return createAIResponseFlex(responseText, question, metadata);
  } catch (error) {
    console.error("❌ Failed to create Flex Message:", error);
    // Fallback เป็น Text
    return {
      type: "text",
      text: responseText + creditLine,
    };
  }
};

/**
 * สร้าง Flex Message ขอบคุณสำหรับ Feedback (Like/Unlike)
 */
const createFeedbackThankYouFlex = (feedbackType = "like") => {
  // ... (Keep existing implementation or simplify)
  // For brevity, reusing a simple structure but enhanced
  const isLike = feedbackType === "like";
  return {
    type: "flex",
    altText: "Thanks for feedback!",
    contents: {
      type: "bubble",
      size: "kilo",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: isLike ? "🎉" : "🙏", size: "4xl", align: "center" },
          { type: "text", text: isLike ? "ขอบคุณที่ถูกใจครับ!" : "ขอบคุณสำหรับคำติชมครับ", weight: "bold", size: "lg", align: "center", margin: "md", color: "#1F2937" },
          { type: "text", text: isLike ? "ผมจะรักษามาตรฐานต่อไปครับ" : "ผมจะนำไปปรับปรุงให้ดียิ่งขึ้นครับ", size: "sm", align: "center", margin: "sm", color: "#6B7280", wrap: true }
        ],
        paddingAll: "24px"
      }
    }
  };
};

/**
 * สร้าง Loading Flex Message แบบสวยงามระหว่างรอ AI ตอบ
 * @param {string} question - คำถามที่ผู้ใช้ถาม (แสดงในการ์ด)
 * @param {string} userName - ชื่อผู้ใช้ (optional)
 * @returns {Object} Flex Message object
 */
const createLoadingFlex = (question = "", userName = "คุณ") => {
  // สร้างจุดกระพริบ (แบบ minimal, ใช้ emoji)
  const dotsAnimation = "⚪ ⚪ ⚪"; // จะใช้ emoji แทน animation เพราะ Flex ไม่รองรับ CSS

  return {
    type: "flex",
    altText: "🔄 กำลังคิด...",
    contents: {
      type: "bubble",
      size: "kilo",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          // Icon + Animated Dots
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: "🤖",
                size: "4xl",
                flex: 0
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "text",
                    text: "TukTuk กำลังหาข้อมูล...",
                    weight: "bold",
                    size: "lg",
                    color: "#1F2937"
                  },
                  {
                    type: "text",
                    text: dotsAnimation,
                    size: "sm",
                    color: "#06C755",
                    margin: "xs"
                  }
                ],
                margin: "md",
                justifyContent: "center"
              }
            ],
            spacing: "md"
          },
          // User Name & Question Preview (if provided)
          ...(question ? [{
            type: "separator",
            margin: "md"
          }, {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: `👤 ${userName} ถาม:`,
                size: "xs",
                color: "#9CA3AF",
                weight: "bold"
              },
              {
                type: "text",
                text: `"${question.length > 80 ? question.substring(0, 80) + '...' : question}"`,
                size: "sm",
                color: "#374151",
                wrap: true,
                margin: "xs",
                style: "italic"
              }
            ],
            margin: "md",
            backgroundColor: "#F3F4F6",
            cornerRadius: "8px",
            paddingAll: "12px"
          }] : []),
          // Loading indicator text
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "⏳ กำลังวิเคราะห์คำถามและจัดเตรียมคำตอบ...",
                size: "xs",
                color: "#6B7280",
                wrap: true,
                align: "center"
              },
              {
                type: "text",
                text: "กรุณารอสักครู่ครับ",
                size: "xs",
                color: "#9CA3AF",
                align: "center",
                margin: "sm"
              }
            ],
            margin: "lg"
          }
        ],
        paddingAll: "20px",
        backgroundColor: "#FFFFFF"
      },
      styles: {
        body: {
          backgroundColor: "#FFFFFF"
        }
      }
    }
  };
};

/**
 * 🧪 สร้าง Material Card Flex - การ์ดแสดงข้อมูลวัสดุพลาสติกโดยเฉพาะ
 * @param {Object} materialData - ข้อมูลวัสดุ
 * @param {string} materialData.name - ชื่อวัสดุ (e.g., "PP", "ABS")
 * @param {string} materialData.fullName - ชื่อเต็ม (e.g., "Polypropylene")
 * @param {Object} materialData.temperature - อุณหภูมิ { barrel, mold, drying }
 * @param {Object} materialData.pressure - ความดัน { injection, holding }
 * @param {Array} materialData.properties - คุณสมบัติเด่น
 * @param {Array} materialData.applications - การใช้งาน
 * @param {string} materialData.shrinkage - ค่าหดตัว
 * @returns {Object} Flex Message object
 */
const createMaterialCardFlex = (materialData) => {
  const {
    name = "Unknown",
    fullName = "",
    temperature = {},
    pressure = {},
    properties = [],
    applications = [],
    shrinkage = "N/A",
    mfi = "N/A",
    density = "N/A"
  } = materialData;

  // Color mapping for different materials
  const materialColors = {
    PP: { primary: "#22C55E", gradient: { start: "#22C55E", end: "#16A34A" } },
    ABS: { primary: "#3B82F6", gradient: { start: "#3B82F6", end: "#2563EB" } },
    PC: { primary: "#8B5CF6", gradient: { start: "#8B5CF6", end: "#7C3AED" } },
    PA: { primary: "#F59E0B", gradient: { start: "#F59E0B", end: "#D97706" } },
    POM: { primary: "#EF4444", gradient: { start: "#EF4444", end: "#DC2626" } },
    PE: { primary: "#06B6D4", gradient: { start: "#06B6D4", end: "#0891B2" } },
    PET: { primary: "#EC4899", gradient: { start: "#EC4899", end: "#DB2777" } },
    PS: { primary: "#64748B", gradient: { start: "#64748B", end: "#475569" } },
    PVC: { primary: "#84CC16", gradient: { start: "#84CC16", end: "#65A30D" } },
    TPE: { primary: "#14B8A6", gradient: { start: "#14B8A6", end: "#0D9488" } },
    default: { primary: "#6366F1", gradient: { start: "#6366F1", end: "#4F46E5" } }
  };

  const colorKey = Object.keys(materialColors).find(key => name.toUpperCase().includes(key)) || "default";
  const colors = materialColors[colorKey];

  // Build temperature info rows
  const tempRows = [];
  if (temperature.barrel) {
    tempRows.push({
      type: "box", layout: "horizontal", contents: [
        { type: "text", text: "🔥 Barrel", size: "xs", color: "#6B7280", flex: 4 },
        { type: "text", text: `${temperature.barrel}°C`, size: "xs", color: "#1F2937", flex: 3, align: "end", weight: "bold" }
      ]
    });
  }
  if (temperature.mold) {
    tempRows.push({
      type: "box", layout: "horizontal", contents: [
        { type: "text", text: "❄️ Mold", size: "xs", color: "#6B7280", flex: 4 },
        { type: "text", text: `${temperature.mold}°C`, size: "xs", color: "#1F2937", flex: 3, align: "end", weight: "bold" }
      ], margin: "sm"
    });
  }
  if (temperature.drying) {
    tempRows.push({
      type: "box", layout: "horizontal", contents: [
        { type: "text", text: "💨 Drying", size: "xs", color: "#6B7280", flex: 4 },
        { type: "text", text: `${temperature.drying}°C`, size: "xs", color: "#1F2937", flex: 3, align: "end", weight: "bold" }
      ], margin: "sm"
    });
  }

  // Build properties chips
  const propertyChips = properties.slice(0, 4).map(prop => ({
    type: "box",
    layout: "vertical",
    contents: [{ type: "text", text: prop, size: "xxs", color: colors.primary, align: "center" }],
    backgroundColor: colors.primary + "15",
    cornerRadius: "4px",
    paddingAll: "6px",
    margin: "xs"
  }));

  return {
    type: "flex",
    altText: `🧪 ข้อมูลวัสดุ: ${name}`,
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
              { type: "text", text: "🧪", size: "3xl", flex: 0 },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: name, weight: "bold", size: "xxl", color: "#FFFFFF" },
                  { type: "text", text: fullName || "Plastic Material", size: "xs", color: "#E5E7EB" }
                ],
                margin: "md"
              }
            ]
          }
        ],
        paddingAll: "20px",
        background: {
          type: "linearGradient",
          angle: "135deg",
          startColor: colors.gradient.start,
          endColor: colors.gradient.end
        }
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          // Temperature Section
          {
            type: "text",
            text: "📊 พารามิเตอร์แนะนำ",
            weight: "bold",
            size: "sm",
            color: colors.primary
          },
          {
            type: "box",
            layout: "vertical",
            contents: tempRows,
            margin: "md",
            backgroundColor: "#F9FAFB",
            cornerRadius: "8px",
            paddingAll: "12px"
          },
          // Key Stats Row
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "📐 Shrinkage", size: "xxs", color: "#9CA3AF", align: "center" },
                  { type: "text", text: shrinkage, size: "sm", color: "#1F2937", align: "center", weight: "bold" }
                ],
                flex: 1
              },
              { type: "separator" },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "💧 MFI", size: "xxs", color: "#9CA3AF", align: "center" },
                  { type: "text", text: mfi, size: "sm", color: "#1F2937", align: "center", weight: "bold" }
                ],
                flex: 1
              },
              { type: "separator" },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "⚖️ Density", size: "xxs", color: "#9CA3AF", align: "center" },
                  { type: "text", text: density, size: "sm", color: "#1F2937", align: "center", weight: "bold" }
                ],
                flex: 1
              }
            ],
            margin: "lg",
            paddingAll: "10px",
            backgroundColor: "#F3F4F6",
            cornerRadius: "8px"
          },
          // Properties Section
          ...(properties.length > 0 ? [
            { type: "text", text: "✨ คุณสมบัติเด่น", weight: "bold", size: "sm", color: colors.primary, margin: "lg" },
            {
              type: "box",
              layout: "horizontal",
              contents: propertyChips,
              margin: "sm",
              spacing: "sm"
            }
          ] : []),
          // Applications
          ...(applications.length > 0 ? [
            { type: "text", text: "🏭 การใช้งาน", weight: "bold", size: "sm", color: colors.primary, margin: "lg" },
            { type: "text", text: applications.slice(0, 3).join(" • "), size: "xs", color: "#6B7280", wrap: true, margin: "sm" }
          ] : []),
          { type: "separator", margin: "lg" },
          // Action Buttons
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "button",
                action: { type: "message", label: "🔧 ปัญหาที่พบบ่อย", text: `ปัญหาที่พบบ่อยของ ${name}` },
                style: "primary",
                color: colors.primary,
                height: "sm",
                flex: 1
              },
              {
                type: "button",
                action: { type: "message", label: "📋 เทียบวัสดุ", text: `เปรียบเทียบ ${name} กับวัสดุอื่น` },
                style: "secondary",
                height: "sm",
                flex: 1,
                margin: "md"
              }
            ],
            margin: "lg"
          }
        ],
        paddingAll: "20px"
      },
      footer: {
        type: "box",
        layout: "horizontal",
        contents: [
          { type: "text", text: "📊 ข้อมูลจากฐานข้อมูล WiT", size: "xxs", color: "#9CA3AF" },
          { type: "text", text: "✨ อาจารย์วิทยา", size: "xxs", color: "#9CA3AF", align: "end" }
        ],
        paddingAll: "12px",
        backgroundColor: "#F9FAFB"
      }
    }
  };
};

/**
 * 🔧 สร้าง Troubleshooting Card Flex - การ์ดแสดงปัญหา-สาเหตุ-วิธีแก้
 * @param {Object} problemData - ข้อมูลปัญหา
 * @param {string} problemData.defectName - ชื่อปัญหา
 * @param {string} problemData.defectNameTh - ชื่อภาษาไทย
 * @param {string} problemData.description - คำอธิบาย
 * @param {Array} problemData.causes - สาเหตุ [{title, detail}]
 * @param {Array} problemData.solutions - วิธีแก้ [{step, action, tip}]
 * @param {string} problemData.severity - ระดับความรุนแรง (low/medium/high/critical)
 * @returns {Object} Flex Message object
 */
const createTroubleshootingCardFlex = (problemData) => {
  const {
    defectName = "Unknown Defect",
    defectNameTh = "",
    description = "",
    causes = [],
    solutions = [],
    severity = "medium",
    preventionTips = []
  } = problemData;

  // Severity config
  const severityConfig = {
    low: { color: "#22C55E", label: "🟢 ต่ำ", bg: "#DCFCE7" },
    medium: { color: "#F59E0B", label: "🟡 ปานกลาง", bg: "#FEF3C7" },
    high: { color: "#EF4444", label: "🟠 สูง", bg: "#FEE2E2" },
    critical: { color: "#DC2626", label: "🔴 วิกฤต", bg: "#FEE2E2" }
  };
  const severityInfo = severityConfig[severity] || severityConfig.medium;

  // Build causes section
  const causeComponents = causes.slice(0, 4).map((cause, idx) => ({
    type: "box",
    layout: "horizontal",
    contents: [
      {
        type: "box",
        layout: "vertical",
        contents: [{ type: "text", text: `${idx + 1}`, size: "xs", color: "#FFFFFF", align: "center" }],
        backgroundColor: "#EF4444",
        cornerRadius: "50px",
        width: "20px",
        height: "20px",
        justifyContent: "center",
        alignItems: "center"
      },
      {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: cause.title || cause, size: "sm", color: "#1F2937", weight: "bold" },
          ...(cause.detail ? [{ type: "text", text: cause.detail, size: "xs", color: "#6B7280", wrap: true }] : [])
        ],
        margin: "md",
        flex: 1
      }
    ],
    margin: idx === 0 ? "md" : "sm"
  }));

  // Build solutions section (Step by step)
  const solutionComponents = solutions.slice(0, 5).map((sol, idx) => ({
    type: "box",
    layout: "horizontal",
    contents: [
      {
        type: "box",
        layout: "vertical",
        contents: [{ type: "text", text: `${idx + 1}`, size: "xs", color: "#FFFFFF", align: "center" }],
        backgroundColor: "#22C55E",
        cornerRadius: "50px",
        width: "20px",
        height: "20px",
        justifyContent: "center",
        alignItems: "center"
      },
      {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: sol.action || sol, size: "sm", color: "#1F2937", wrap: true },
          ...(sol.tip ? [{ type: "text", text: `💡 ${sol.tip}`, size: "xxs", color: "#059669", wrap: true, margin: "xs" }] : [])
        ],
        margin: "md",
        flex: 1
      }
    ],
    margin: idx === 0 ? "md" : "sm"
  }));

  return {
    type: "flex",
    altText: `🔧 แก้ปัญหา: ${defectName}`,
    contents: {
      type: "bubble",
      size: "giga",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: "🔧", size: "3xl", flex: 0 },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: defectName, weight: "bold", size: "xl", color: "#FFFFFF" },
                  { type: "text", text: defectNameTh || "การแก้ปัญหา", size: "xs", color: "#E5E7EB" }
                ],
                margin: "md"
              },
              {
                type: "box",
                layout: "vertical",
                contents: [{ type: "text", text: severityInfo.label, size: "xs", color: severityInfo.color }],
                backgroundColor: "#FFFFFF",
                cornerRadius: "4px",
                paddingAll: "6px"
              }
            ]
          },
          ...(description ? [{
            type: "text",
            text: description,
            size: "xs",
            color: "#E5E7EB",
            wrap: true,
            margin: "md"
          }] : [])
        ],
        paddingAll: "20px",
        background: {
          type: "linearGradient",
          angle: "135deg",
          startColor: "#EA580C",
          endColor: "#C2410C"
        }
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          // Causes Section
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: "❌", size: "lg", flex: 0 },
              { type: "text", text: "สาเหตุของปัญหา", weight: "bold", size: "md", color: "#DC2626", margin: "sm" }
            ]
          },
          {
            type: "box",
            layout: "vertical",
            contents: causeComponents,
            backgroundColor: "#FEF2F2",
            cornerRadius: "8px",
            paddingAll: "12px",
            margin: "sm"
          },
          // Solutions Section
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: "✅", size: "lg", flex: 0 },
              { type: "text", text: "วิธีแก้ไข (Step-by-Step)", weight: "bold", size: "md", color: "#059669", margin: "sm" }
            ],
            margin: "lg"
          },
          {
            type: "box",
            layout: "vertical",
            contents: solutionComponents,
            backgroundColor: "#F0FDF4",
            cornerRadius: "8px",
            paddingAll: "12px",
            margin: "sm"
          },
          // Prevention Tips (if available)
          ...(preventionTips.length > 0 ? [
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "🛡️", size: "lg", flex: 0 },
                { type: "text", text: "การป้องกัน", weight: "bold", size: "md", color: "#3B82F6", margin: "sm" }
              ],
              margin: "lg"
            },
            {
              type: "text",
              text: preventionTips.slice(0, 2).map(t => `• ${t}`).join("\n"),
              size: "xs",
              color: "#374151",
              wrap: true,
              margin: "sm"
            }
          ] : []),
          { type: "separator", margin: "lg" },
          // Action Buttons
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "button",
                action: { type: "message", label: "📸 ส่งรูปวิเคราะห์", text: "อยากส่งรูปให้ช่วยวิเคราะห์ปัญหา" },
                style: "primary",
                color: "#EA580C",
                height: "sm",
                flex: 1
              },
              {
                type: "button",
                action: { type: "message", label: "❓ ถามเพิ่ม", text: `ขอรายละเอียดเพิ่มเติมเรื่อง ${defectName}` },
                style: "secondary",
                height: "sm",
                flex: 1,
                margin: "md"
              }
            ],
            margin: "lg"
          }
        ],
        paddingAll: "20px"
      },
      footer: {
        type: "box",
        layout: "horizontal",
        contents: [
          { type: "text", text: "🔧 คู่มือแก้ปัญหา WiT", size: "xxs", color: "#9CA3AF" },
          { type: "text", text: "✨ อาจารย์วิทยา", size: "xxs", color: "#9CA3AF", align: "end" }
        ],
        paddingAll: "12px",
        backgroundColor: "#F9FAFB"
      }
    }
  };
};

/**
 * ⚖️ สร้าง Material Comparison Carousel - เปรียบเทียบวัสดุแบบ swipe
 * @param {Array} materials - อาร์เรย์ของวัสดุที่จะเปรียบเทียบ (2-3 ตัว)
 * @param {string} comparisonContext - บริบทการเปรียบเทียบ (e.g., "สำหรับชิ้นงานที่ต้องทนความร้อน")
 * @returns {Object} Flex Message object (Carousel)
 */
const createMaterialComparisonCarousel = (materials, comparisonContext = "") => {
  // Color palette for comparison
  const comparisonColors = [
    { primary: "#3B82F6", gradient: { start: "#3B82F6", end: "#2563EB" }, rank: "🥇" },
    { primary: "#8B5CF6", gradient: { start: "#8B5CF6", end: "#7C3AED" }, rank: "🥈" },
    { primary: "#06B6D4", gradient: { start: "#06B6D4", end: "#0891B2" }, rank: "🥉" }
  ];

  // Create comparison bubbles
  const bubbles = materials.slice(0, 3).map((material, index) => {
    const colors = comparisonColors[index];
    const {
      name = "Unknown",
      fullName = "",
      score = 0,
      temperature = {},
      advantages = [],
      disadvantages = [],
      priceLevel = "💰💰",
      recommendation = ""
    } = material;

    // Score visualization
    const scoreStars = "⭐".repeat(Math.min(Math.round(score / 20), 5));

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
              { type: "text", text: colors.rank, size: "xl", flex: 0 },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: name, weight: "bold", size: "xl", color: "#FFFFFF" },
                  { type: "text", text: fullName || "Material", size: "xxs", color: "#E5E7EB" }
                ],
                margin: "sm"
              }
            ]
          },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: `คะแนน: ${score}/100`, size: "xs", color: "#FFFFFF" },
              { type: "text", text: scoreStars, size: "xs", align: "end" }
            ],
            margin: "md"
          }
        ],
        paddingAll: "15px",
        background: {
          type: "linearGradient",
          angle: "135deg",
          startColor: colors.gradient.start,
          endColor: colors.gradient.end
        }
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          // Temperature Info
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "🔥 Barrel", size: "xxs", color: "#9CA3AF", align: "center" },
                  { type: "text", text: temperature.barrel || "N/A", size: "xs", color: "#1F2937", align: "center", weight: "bold" }
                ],
                flex: 1
              },
              { type: "separator" },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "❄️ Mold", size: "xxs", color: "#9CA3AF", align: "center" },
                  { type: "text", text: temperature.mold || "N/A", size: "xs", color: "#1F2937", align: "center", weight: "bold" }
                ],
                flex: 1
              },
              { type: "separator" },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "💰 ราคา", size: "xxs", color: "#9CA3AF", align: "center" },
                  { type: "text", text: priceLevel, size: "xs", color: "#1F2937", align: "center" }
                ],
                flex: 1
              }
            ],
            backgroundColor: "#F3F4F6",
            cornerRadius: "8px",
            paddingAll: "10px"
          },
          // Advantages
          {
            type: "text",
            text: "✅ ข้อดี",
            size: "xs",
            color: "#059669",
            weight: "bold",
            margin: "lg"
          },
          {
            type: "text",
            text: advantages.slice(0, 3).map(a => `• ${a}`).join("\n") || "• -",
            size: "xxs",
            color: "#374151",
            wrap: true,
            margin: "xs"
          },
          // Disadvantages
          {
            type: "text",
            text: "❌ ข้อจำกัด",
            size: "xs",
            color: "#DC2626",
            weight: "bold",
            margin: "md"
          },
          {
            type: "text",
            text: disadvantages.slice(0, 2).map(d => `• ${d}`).join("\n") || "• -",
            size: "xxs",
            color: "#374151",
            wrap: true,
            margin: "xs"
          },
          // Recommendation
          ...(recommendation ? [{
            type: "box",
            layout: "vertical",
            contents: [
              { type: "text", text: `💡 ${recommendation}`, size: "xxs", color: colors.primary, wrap: true }
            ],
            backgroundColor: colors.primary + "15",
            cornerRadius: "6px",
            paddingAll: "8px",
            margin: "md"
          }] : [])
        ],
        paddingAll: "15px",
        spacing: "none"
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            action: { type: "message", label: `📊 ดูรายละเอียด ${name}`, text: `ขอข้อมูลวัสดุ ${name} แบบละเอียด` },
            style: "primary",
            color: colors.primary,
            height: "sm"
          }
        ],
        paddingAll: "10px"
      }
    };
  });

  // Add summary bubble at the end
  const summaryBubble = {
    type: "bubble",
    size: "kilo",
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        { type: "text", text: "📊", size: "4xl", align: "center" },
        { type: "text", text: "สรุปการเปรียบเทียบ", weight: "bold", size: "lg", align: "center", margin: "md", color: "#1F2937" },
        ...(comparisonContext ? [{
          type: "text",
          text: comparisonContext,
          size: "sm",
          color: "#6B7280",
          wrap: true,
          align: "center",
          margin: "md"
        }] : []),
        { type: "separator", margin: "lg" },
        {
          type: "box",
          layout: "vertical",
          contents: materials.slice(0, 3).map((m, i) => ({
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: comparisonColors[i].rank, size: "sm", flex: 0 },
              { type: "text", text: m.name, size: "sm", color: "#1F2937", weight: "bold", margin: "sm", flex: 3 },
              { type: "text", text: `${m.score || 0}/100`, size: "sm", color: comparisonColors[i].primary, align: "end", flex: 2 }
            ],
            margin: i === 0 ? "lg" : "md"
          })),
          margin: "md"
        },
        {
          type: "text",
          text: "👆 เลื่อนซ้ายเพื่อดูรายละเอียดแต่ละวัสดุ",
          size: "xxs",
          color: "#9CA3AF",
          align: "center",
          margin: "xl"
        }
      ],
      paddingAll: "20px",
      justifyContent: "center"
    },
    footer: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "button",
          action: { type: "message", label: "🔄 เปรียบเทียบวัสดุอื่น", text: "อยากเปรียบเทียบวัสดุอื่น" },
          style: "secondary",
          height: "sm"
        }
      ],
      paddingAll: "10px"
    }
  };

  return {
    type: "flex",
    altText: `⚖️ เปรียบเทียบวัสดุ: ${materials.map(m => m.name).join(" vs ")}`,
    contents: {
      type: "carousel",
      contents: [...bubbles, summaryBubble]
    }
  };
};

/**
 * 🚨 สร้าง Error Message Flex - แสดง error แบบ professional
 * @param {string} errorType - ประเภท error (not_found, invalid_input, system_error, rate_limit)
 * @param {string} message - ข้อความ error
 * @param {string} suggestion - คำแนะนำ
 * @returns {Object} Flex Message object
 */
const createErrorFlex = (errorType = "system_error", message = "", suggestion = "") => {
  const errorConfig = {
    not_found: {
      emoji: "🔍",
      title: "ไม่พบข้อมูล",
      color: "#F59E0B",
      defaultMsg: "ไม่พบข้อมูลที่คุณต้องการในระบบ",
      defaultSuggestion: "ลองใช้คำค้นหาอื่น หรือถามคำถามใหม่"
    },
    invalid_input: {
      emoji: "⚠️",
      title: "ข้อมูลไม่ถูกต้อง",
      color: "#EF4444",
      defaultMsg: "รูปแบบข้อมูลที่ส่งมาไม่ถูกต้อง",
      defaultSuggestion: "กรุณาตรวจสอบและลองใหม่อีกครั้ง"
    },
    system_error: {
      emoji: "🔧",
      title: "ระบบขัดข้อง",
      color: "#DC2626",
      defaultMsg: "เกิดข้อผิดพลาดในระบบ",
      defaultSuggestion: "กรุณาลองใหม่ในอีกสักครู่"
    },
    rate_limit: {
      emoji: "⏱️",
      title: "คำขอมากเกินไป",
      color: "#8B5CF6",
      defaultMsg: "คุณส่งคำขอมากเกินไปในเวลาสั้นๆ",
      defaultSuggestion: "กรุณารอสักครู่แล้วลองใหม่"
    }
  };

  const config = errorConfig[errorType] || errorConfig.system_error;

  return {
    type: "flex",
    altText: `${config.emoji} ${config.title}`,
    contents: {
      type: "bubble",
      size: "kilo",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: config.emoji, size: "4xl", align: "center" },
          { type: "text", text: config.title, weight: "bold", size: "lg", align: "center", margin: "md", color: config.color },
          { type: "text", text: message || config.defaultMsg, size: "sm", color: "#6B7280", wrap: true, align: "center", margin: "md" },
          { type: "separator", margin: "lg" },
          {
            type: "box",
            layout: "vertical",
            contents: [
              { type: "text", text: "💡 คำแนะนำ", size: "xs", color: "#3B82F6", weight: "bold" },
              { type: "text", text: suggestion || config.defaultSuggestion, size: "xs", color: "#374151", wrap: true, margin: "xs" }
            ],
            backgroundColor: "#EFF6FF",
            cornerRadius: "8px",
            paddingAll: "12px",
            margin: "md"
          },
          {
            type: "button",
            action: { type: "message", label: "🔄 ลองใหม่", text: "ช่วยตอบคำถามใหม่หน่อยครับ" },
            style: "primary",
            color: config.color,
            height: "sm",
            margin: "lg"
          }
        ],
        paddingAll: "24px"
      }
    }
  };
};

/**
 * 💡 สร้าง Quick Reply Suggestions - ปุ่มแนะนำคำถามต่อเนื่อง
 * @param {Array} suggestions - อาร์เรย์ของคำแนะนำ [{label, text}]
 * @param {string} context - บริบท (material, troubleshooting, general)
 * @returns {Object} Quick Reply object
 */
const createQuickReplySuggestions = (suggestions = [], context = "general") => {
  const defaultSuggestions = {
    material: [
      { label: "🧪 เปรียบเทียบ", text: "เปรียบเทียบวัสดุนี้กับตัวอื่น" },
      { label: "🔥 อุณหภูมิ", text: "แนะนำอุณหภูมิที่เหมาะสม" },
      { label: "⚠️ ปัญหาที่พบ", text: "ปัญหาที่พบบ่อยของวัสดุนี้" }
    ],
    troubleshooting: [
      { label: "📸 ส่งรูป", text: "อยากส่งรูปให้ดู" },
      { label: "🔧 วิธีอื่น", text: "มีวิธีแก้อื่นอีกไหม" },
      { label: "🛡️ ป้องกัน", text: "จะป้องกันไม่ให้เกิดอีกยังไง" }
    ],
    general: [
      { label: "📚 เรียนรู้เพิ่ม", text: "อยากเรียนรู้เพิ่มเติม" },
      { label: "🧮 คำนวณ", text: "ช่วยคำนวณให้หน่อย" },
      { label: "💬 ถามอื่น", text: "มีคำถามอื่น" }
    ]
  };

  const items = suggestions.length > 0 ? suggestions : (defaultSuggestions[context] || defaultSuggestions.general);

  return {
    items: items.slice(0, 13).map(item => ({
      type: "action",
      action: {
        type: "message",
        label: item.label.substring(0, 20),
        text: item.text
      }
    }))
  };
};

/**
 * 📊 สร้าง Data Table Flex - ตารางข้อมูลแบบสวยงาม
 * @param {Object} tableData - ข้อมูลตาราง
 * @param {string} tableData.title - หัวข้อตาราง
 * @param {Array} tableData.headers - หัวคอลัมน์ ["Parameter", "Value", "Unit"]
 * @param {Array} tableData.rows - แถวข้อมูล [["Temp", "200", "°C"], ...]
 * @param {string} tableData.note - หมายเหตุ (optional)
 * @param {string} tableData.color - สีหลัก (optional)
 * @returns {Object} Flex Message object
 */
const createDataTableFlex = (tableData) => {
  const {
    title = "ข้อมูลตาราง",
    headers = [],
    rows = [],
    note = "",
    color = "#3B82F6",
    icon = "📊"
  } = tableData;

  // สร้าง Header Row
  const headerRow = {
    type: "box",
    layout: "horizontal",
    contents: headers.map((header, idx) => ({
      type: "text",
      text: header,
      size: "xs",
      color: "#FFFFFF",
      weight: "bold",
      flex: idx === 0 ? 3 : 2,
      align: idx === 0 ? "start" : "center"
    })),
    backgroundColor: color,
    paddingAll: "10px",
    cornerRadius: "8px 8px 0px 0px"
  };

  // สร้าง Data Rows
  const dataRows = rows.map((row, rowIdx) => ({
    type: "box",
    layout: "horizontal",
    contents: row.map((cell, cellIdx) => ({
      type: "text",
      text: String(cell),
      size: "xs",
      color: cellIdx === 0 ? "#1F2937" : "#374151",
      weight: cellIdx === 0 ? "bold" : "regular",
      flex: cellIdx === 0 ? 3 : 2,
      align: cellIdx === 0 ? "start" : "center",
      wrap: true
    })),
    paddingAll: "10px",
    backgroundColor: rowIdx % 2 === 0 ? "#F9FAFB" : "#FFFFFF"
  }));

  return {
    type: "flex",
    altText: `📊 ${title}`,
    contents: {
      type: "bubble",
      size: "giga",
      header: {
        type: "box",
        layout: "horizontal",
        contents: [
          { type: "text", text: icon, size: "xl", flex: 0 },
          {
            type: "box",
            layout: "vertical",
            contents: [
              { type: "text", text: title, weight: "bold", size: "lg", color: "#FFFFFF" },
              { type: "text", text: `${rows.length} รายการ`, size: "xs", color: "#E5E7EB" }
            ],
            margin: "md"
          }
        ],
        paddingAll: "20px",
        background: {
          type: "linearGradient",
          angle: "135deg",
          startColor: color,
          endColor: adjustColor(color, -20)
        }
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          // Table Container
          {
            type: "box",
            layout: "vertical",
            contents: [
              headerRow,
              ...dataRows
            ],
            cornerRadius: "8px",
            borderWidth: "1px",
            borderColor: "#E5E7EB"
          },
          // Note (if provided)
          ...(note ? [{
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: "💡", size: "sm", flex: 0 },
              { type: "text", text: note, size: "xs", color: "#6B7280", wrap: true, margin: "sm" }
            ],
            margin: "lg",
            backgroundColor: "#FEF3C7",
            cornerRadius: "8px",
            paddingAll: "10px"
          }] : []),
          { type: "separator", margin: "lg" },
          // Actions
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "button",
                action: { type: "message", label: "📋 ดูเพิ่ม", text: `ขอรายละเอียดเพิ่มเติมเรื่อง ${title}` },
                style: "primary",
                color: color,
                height: "sm",
                flex: 1
              },
              {
                type: "button",
                action: { type: "message", label: "❓ ถามเพิ่ม", text: "มีคำถามเกี่ยวกับข้อมูลนี้" },
                style: "secondary",
                height: "sm",
                flex: 1,
                margin: "md"
              }
            ],
            margin: "lg"
          }
        ],
        paddingAll: "20px"
      },
      footer: {
        type: "box",
        layout: "horizontal",
        contents: [
          { type: "text", text: "📊 ข้อมูลจาก WiT Database", size: "xxs", color: "#9CA3AF" },
          { type: "text", text: "✨ อาจารย์วิทยา", size: "xxs", color: "#9CA3AF", align: "end" }
        ],
        paddingAll: "12px",
        backgroundColor: "#F9FAFB"
      }
    }
  };
};

// Helper function to adjust color brightness
const adjustColor = (hex, percent) => {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
  return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
};

/**
 * 📈 สร้าง Progress Indicator Flex - แสดง step/progress ที่กำลังทำ
 * @param {Object} progressData - ข้อมูล progress
 * @param {string} progressData.title - หัวข้อ
 * @param {number} progressData.currentStep - step ปัจจุบัน (1-based)
 * @param {Array} progressData.steps - [{label, description, status}] status: 'completed'|'current'|'pending'
 * @param {number} progressData.percentage - เปอร์เซ็นต์ (optional, 0-100)
 * @returns {Object} Flex Message object
 */
const createProgressIndicatorFlex = (progressData) => {
  const {
    title = "ความคืบหน้า",
    currentStep = 1,
    steps = [],
    percentage = null,
    color = "#06C755"
  } = progressData;

  // Calculate percentage if not provided
  const calculatedPercentage = percentage !== null
    ? percentage
    : Math.round((currentStep / steps.length) * 100);

  // Build step components
  const stepComponents = steps.map((step, idx) => {
    const stepNum = idx + 1;
    const isCompleted = step.status === 'completed' || stepNum < currentStep;
    const isCurrent = step.status === 'current' || stepNum === currentStep;
    const isPending = step.status === 'pending' || stepNum > currentStep;

    // Status styling
    let statusConfig = {};
    if (isCompleted) {
      statusConfig = { bg: "#22C55E", icon: "✓", textColor: "#059669" };
    } else if (isCurrent) {
      statusConfig = { bg: color, icon: String(stepNum), textColor: color };
    } else {
      statusConfig = { bg: "#D1D5DB", icon: String(stepNum), textColor: "#9CA3AF" };
    }

    return {
      type: "box",
      layout: "horizontal",
      contents: [
        // Step Number Circle
        {
          type: "box",
          layout: "vertical",
          contents: [
            { type: "text", text: statusConfig.icon, size: "xs", color: "#FFFFFF", align: "center" }
          ],
          backgroundColor: statusConfig.bg,
          cornerRadius: "50px",
          width: "24px",
          height: "24px",
          justifyContent: "center",
          alignItems: "center"
        },
        // Step Content
        {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: step.label,
              size: "sm",
              color: isPending ? "#9CA3AF" : "#1F2937",
              weight: isCurrent ? "bold" : "regular"
            },
            ...(step.description ? [{
              type: "text",
              text: step.description,
              size: "xxs",
              color: "#6B7280",
              wrap: true
            }] : [])
          ],
          margin: "md",
          flex: 1
        },
        // Status Badge
        {
          type: "box",
          layout: "vertical",
          contents: [{
            type: "text",
            text: isCompleted ? "✅" : (isCurrent ? "🔄" : "⏳"),
            size: "sm"
          }],
          flex: 0
        }
      ],
      margin: idx === 0 ? "none" : "lg",
      ...(isCurrent ? {
        backgroundColor: color + "10",
        cornerRadius: "8px",
        paddingAll: "10px"
      } : {})
    };
  });

  // Add connecting lines between steps
  const stepsWithLines = [];
  stepComponents.forEach((step, idx) => {
    stepsWithLines.push(step);
    if (idx < stepComponents.length - 1) {
      stepsWithLines.push({
        type: "box",
        layout: "horizontal",
        contents: [
          {
            type: "box",
            layout: "vertical",
            contents: [],
            width: "24px",
            height: "20px"
          },
          {
            type: "box",
            layout: "vertical",
            contents: [{
              type: "box",
              layout: "vertical",
              contents: [],
              backgroundColor: idx < currentStep - 1 ? "#22C55E" : "#E5E7EB",
              width: "2px",
              height: "20px"
            }],
            width: "24px",
            alignItems: "center",
            position: "absolute",
            offsetStart: "11px"
          }
        ],
        height: "20px"
      });
    }
  });

  return {
    type: "flex",
    altText: `📈 ${title}: ${calculatedPercentage}%`,
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
              { type: "text", text: "📈", size: "xl", flex: 0 },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: title, weight: "bold", size: "lg", color: "#FFFFFF" },
                  { type: "text", text: `Step ${currentStep} of ${steps.length}`, size: "xs", color: "#E5E7EB" }
                ],
                margin: "md"
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: `${calculatedPercentage}%`, weight: "bold", size: "xl", color: "#FFFFFF", align: "end" }
                ],
                flex: 0
              }
            ]
          },
          // Progress Bar
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "box",
                layout: "vertical",
                contents: [],
                backgroundColor: "#FFFFFF",
                height: "8px",
                width: `${calculatedPercentage}%`,
                cornerRadius: "4px"
              }
            ],
            backgroundColor: "#FFFFFF40",
            height: "8px",
            cornerRadius: "4px",
            margin: "lg"
          }
        ],
        paddingAll: "20px",
        background: {
          type: "linearGradient",
          angle: "135deg",
          startColor: color,
          endColor: adjustColor(color, -20)
        }
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          // Steps List
          {
            type: "box",
            layout: "vertical",
            contents: stepComponents,
            margin: "none"
          },
          { type: "separator", margin: "xl" },
          // Actions
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "button",
                action: { type: "message", label: "❓ ขอความช่วยเหลือ", text: `ขอความช่วยเหลือเรื่อง ${steps[currentStep - 1]?.label || title}` },
                style: "primary",
                color: color,
                height: "sm",
                flex: 1
              },
              {
                type: "button",
                action: { type: "message", label: "⏭️ ข้ามขั้นตอน", text: "ข้ามไปขั้นตอนถัดไป" },
                style: "secondary",
                height: "sm",
                flex: 1,
                margin: "md"
              }
            ],
            margin: "lg"
          }
        ],
        paddingAll: "20px"
      },
      footer: {
        type: "box",
        layout: "horizontal",
        contents: [
          { type: "text", text: `📈 Step ${currentStep}/${steps.length}`, size: "xxs", color: "#9CA3AF" },
          { type: "text", text: "✨ อาจารย์วิทยา", size: "xxs", color: "#9CA3AF", align: "end" }
        ],
        paddingAll: "12px",
        backgroundColor: "#F9FAFB"
      }
    }
  };
};

/**
 * ⚙️ สร้าง Parameter Setting Card - การ์ดแสดงค่า parameters สำหรับการฉีดพลาสติก
 * @param {Object} paramData - ข้อมูล parameters
 * @param {string} paramData.materialName - ชื่อวัสดุ
 * @param {string} paramData.productType - ประเภทชิ้นงาน
 * @param {Object} paramData.temperature - { barrel: [], nozzle, mold }
 * @param {Object} paramData.pressure - { injection, holding, back }
 * @param {Object} paramData.speed - { injection, screw }
 * @param {Object} paramData.time - { injection, cooling, cycle }
 * @param {Object} paramData.other - { cushion, switchover }
 * @returns {Object} Flex Message object
 */
const createParameterSettingFlex = (paramData) => {
  const {
    materialName = "Unknown",
    productType = "General",
    machineSize = "Unknown Ton",
    temperature = {},
    pressure = {},
    speed = {},
    time = {},
    other = {},
    tips = []
  } = paramData;

  // Color based on material
  const materialColors = {
    PP: "#22C55E", ABS: "#3B82F6", PC: "#8B5CF6",
    PA: "#F59E0B", POM: "#EF4444", PE: "#06B6D4",
    default: "#6366F1"
  };
  const color = Object.keys(materialColors).find(k => materialName.toUpperCase().includes(k))
    ? materialColors[Object.keys(materialColors).find(k => materialName.toUpperCase().includes(k))]
    : materialColors.default;

  // Build temperature zones display
  const tempZones = [];
  if (temperature.barrel && Array.isArray(temperature.barrel)) {
    temperature.barrel.forEach((temp, idx) => {
      tempZones.push({
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: `Z${idx + 1}`, size: "xxs", color: "#9CA3AF", align: "center" },
          { type: "text", text: `${temp}°C`, size: "xs", color: "#1F2937", align: "center", weight: "bold" }
        ],
        flex: 1
      });
    });
  }
  if (temperature.nozzle) {
    tempZones.push({
      type: "box",
      layout: "vertical",
      contents: [
        { type: "text", text: "Nozzle", size: "xxs", color: "#9CA3AF", align: "center" },
        { type: "text", text: `${temperature.nozzle}°C`, size: "xs", color: "#EF4444", align: "center", weight: "bold" }
      ],
      flex: 1
    });
  }

  // Build parameter rows
  const createParamRow = (icon, label, value, unit = "") => ({
    type: "box",
    layout: "horizontal",
    contents: [
      { type: "text", text: icon, size: "sm", flex: 0 },
      { type: "text", text: label, size: "xs", color: "#6B7280", flex: 4, margin: "sm" },
      { type: "text", text: `${value}${unit ? ' ' + unit : ''}`, size: "xs", color: "#1F2937", flex: 3, align: "end", weight: "bold" }
    ],
    margin: "sm"
  });

  const parameterRows = [];

  // Pressure Section
  if (pressure.injection) parameterRows.push(createParamRow("💉", "Injection Pressure", pressure.injection, "MPa"));
  if (pressure.holding) parameterRows.push(createParamRow("🔒", "Holding Pressure", pressure.holding, "MPa"));
  if (pressure.back) parameterRows.push(createParamRow("↩️", "Back Pressure", pressure.back, "MPa"));

  // Speed Section
  if (speed.injection) parameterRows.push(createParamRow("⚡", "Injection Speed", speed.injection, "mm/s"));
  if (speed.screw) parameterRows.push(createParamRow("🔄", "Screw Speed", speed.screw, "rpm"));

  // Time Section
  if (time.injection) parameterRows.push(createParamRow("⏱️", "Injection Time", time.injection, "sec"));
  if (time.cooling) parameterRows.push(createParamRow("❄️", "Cooling Time", time.cooling, "sec"));
  if (time.cycle) parameterRows.push(createParamRow("🔁", "Cycle Time", time.cycle, "sec"));

  // Other
  if (other.cushion) parameterRows.push(createParamRow("📏", "Cushion", other.cushion, "mm"));
  if (other.switchover) parameterRows.push(createParamRow("🎯", "V/P Switchover", other.switchover, "mm"));

  return {
    type: "flex",
    altText: `⚙️ Parameters: ${materialName} - ${productType}`,
    contents: {
      type: "bubble",
      size: "giga",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: "⚙️", size: "3xl", flex: 0 },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "Parameter Setting", weight: "bold", size: "xl", color: "#FFFFFF" },
                  { type: "text", text: `${materialName} • ${productType}`, size: "xs", color: "#E5E7EB" }
                ],
                margin: "md"
              }
            ]
          },
          // Material & Machine Info
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "🧪 Material", size: "xxs", color: "#FFFFFF80" },
                  { type: "text", text: materialName, size: "sm", color: "#FFFFFF", weight: "bold" }
                ],
                flex: 1
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "🏭 Machine", size: "xxs", color: "#FFFFFF80" },
                  { type: "text", text: machineSize, size: "sm", color: "#FFFFFF", weight: "bold" }
                ],
                flex: 1
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "❄️ Mold Temp", size: "xxs", color: "#FFFFFF80" },
                  { type: "text", text: temperature.mold ? `${temperature.mold}°C` : "N/A", size: "sm", color: "#FFFFFF", weight: "bold" }
                ],
                flex: 1
              }
            ],
            margin: "lg",
            backgroundColor: "#FFFFFF20",
            cornerRadius: "8px",
            paddingAll: "10px"
          }
        ],
        paddingAll: "20px",
        background: {
          type: "linearGradient",
          angle: "135deg",
          startColor: color,
          endColor: adjustColor(color, -25)
        }
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          // Temperature Zones
          ...(tempZones.length > 0 ? [
            { type: "text", text: "🔥 Barrel Temperature Zones", weight: "bold", size: "sm", color: color },
            {
              type: "box",
              layout: "horizontal",
              contents: tempZones,
              margin: "md",
              backgroundColor: "#FEF2F2",
              cornerRadius: "8px",
              paddingAll: "12px"
            }
          ] : []),
          // Parameters Section
          { type: "text", text: "📊 Process Parameters", weight: "bold", size: "sm", color: color, margin: "lg" },
          {
            type: "box",
            layout: "vertical",
            contents: parameterRows,
            margin: "md",
            backgroundColor: "#F9FAFB",
            cornerRadius: "8px",
            paddingAll: "12px"
          },
          // Tips Section
          ...(tips.length > 0 ? [
            { type: "text", text: "💡 Tips & Notes", weight: "bold", size: "sm", color: color, margin: "lg" },
            {
              type: "box",
              layout: "vertical",
              contents: tips.slice(0, 3).map(tip => ({
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "•", size: "xs", color: color, flex: 0 },
                  { type: "text", text: tip, size: "xs", color: "#374151", wrap: true, margin: "sm", flex: 1 }
                ],
                margin: "xs"
              })),
              margin: "sm",
              backgroundColor: "#FEF3C7",
              cornerRadius: "8px",
              paddingAll: "10px"
            }
          ] : []),
          { type: "separator", margin: "lg" },
          // Actions
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "button",
                action: { type: "message", label: "🔧 ปรับค่า", text: `ช่วยปรับค่า parameters สำหรับ ${materialName}` },
                style: "primary",
                color: color,
                height: "sm",
                flex: 1
              },
              {
                type: "button",
                action: { type: "message", label: "⚠️ ปัญหา", text: `ปัญหาที่อาจเกิดขึ้นกับ ${materialName}` },
                style: "secondary",
                height: "sm",
                flex: 1,
                margin: "md"
              }
            ],
            margin: "lg"
          }
        ],
        paddingAll: "20px"
      },
      footer: {
        type: "box",
        layout: "horizontal",
        contents: [
          { type: "text", text: "⚙️ WiT Parameter Guide", size: "xxs", color: "#9CA3AF" },
          { type: "text", text: "✨ อาจารย์วิทยา", size: "xxs", color: "#9CA3AF", align: "end" }
        ],
        paddingAll: "12px",
        backgroundColor: "#F9FAFB"
      }
    }
  };
};

module.exports = {
  createAIResponseFlex,
  createSimpleAIResponseFlex,
  getOptimalAIResponse,
  createFeedbackThankYouFlex,
  createLoadingFlex,
  // Material & Troubleshooting Cards
  createMaterialCardFlex,
  createTroubleshootingCardFlex,
  createMaterialComparisonCarousel,
  createErrorFlex,
  createQuickReplySuggestions,
  // NEW: Data Table, Progress & Parameter Setting
  createDataTableFlex,
  createProgressIndicatorFlex,
  createParameterSettingFlex,
};
