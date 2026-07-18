/**
 * 🃏 AI Flashcard System - ระบบบัตรคำอัจฉริยะ
 * สร้างบัตรคำอัตโนมัติด้วย AI พร้อมระบบทดสอบความจำ
 * @author WiT AI System
 * @version 1.0.0
 */

const admin = require("firebase-admin");

// =====================================================
// 📚 FLASHCARD CATEGORIES - หมวดหมู่บัตรคำ
// =====================================================

const FLASHCARD_CATEGORIES = {
  vocabulary: {
    id: "vocabulary",
    name: "🔤 คำศัพท์",
    nameEn: "Vocabulary",
    subjects: ["english", "thai", "chinese", "japanese"],
    template: "word-meaning",
  },
  formula: {
    id: "formula",
    name: "🔢 สูตรและสมการ",
    nameEn: "Formulas",
    subjects: ["math", "physics", "chemistry"],
    template: "formula-usage",
  },
  definition: {
    id: "definition",
    name: "📖 คำจำกัดความ",
    nameEn: "Definitions",
    subjects: ["science", "social", "biology"],
    template: "term-definition",
  },
  historical: {
    id: "historical",
    name: "📜 ประวัติศาสตร์",
    nameEn: "Historical Facts",
    subjects: ["social", "history"],
    template: "event-detail",
  },
  elements: {
    id: "elements",
    name: "🧪 ธาตุและสาร",
    nameEn: "Chemical Elements",
    subjects: ["chemistry"],
    template: "element-property",
  },
};

// =====================================================
// 🤖 AI FLASHCARD GENERATOR - สร้างบัตรคำด้วย AI
// =====================================================

/**
 * สร้างบัตรคำอัตโนมัติจาก AI
 * @param {Object} params - พารามิเตอร์สำหรับสร้างบัตรคำ
 * @param {string} params.topic - หัวข้อที่ต้องการสร้าง เช่น "สัตว์ 10 ชนิด", "สูตรคณิต ม.2"
 * @param {string} params.subject - วิชา เช่น "english", "math", "science"
 * @param {string} params.level - ระดับชั้น เช่น "ป.4", "ม.1", "university"
 * @param {number} params.count - จำนวนบัตรคำที่ต้องการ (5-20 ใบ)
 * @param {string} params.language - ภาษาที่ต้องการ "th" หรือ "en"
 * @returns {Promise<Array>} - Array ของบัตรคำที่สร้างขึ้น
 */
async function generateFlashcards(params) {
  const {topic, subject = "general", level = "ป.4", count = 10, language = "th"} = params;

  // สร้าง Prompt สำหรับ AI
  const prompt = createFlashcardPrompt(topic, subject, level, count, language);

  console.log("🎯 Generating flashcards with prompt:", prompt.substring(0, 200));

  try {
    // เรียกใช้ Gemini AI (ใช้ฟังก์ชันเดียวกับที่มีอยู่แล้วใน index.js)
    const aiResponse = await callGeminiForFlashcards(prompt);
    
    // Parse ผลลัพธ์จาก AI
    const flashcards = parseFlashcardsFromAI(aiResponse, topic, subject);
    
    console.log(`✅ Generated ${flashcards.length} flashcards`);
    return flashcards;
  } catch (error) {
    console.error("❌ Error generating flashcards:", error);
    // Return fallback flashcards
    return createFallbackFlashcards(topic, count);
  }
}

/**
 * สร้าง Prompt สำหรับ AI เพื่อสร้างบัตรคำ
 */
function createFlashcardPrompt(topic, subject, level, count, language) {
  const subjectNames = {
    english: "ภาษาอังกฤษ",
    math: "คณิตศาสตร์",
    science: "วิทยาศาสตร์",
    physics: "ฟิสิกส์",
    chemistry: "เคมี",
    biology: "ชีววิทยา",
    thai: "ภาษาไทย",
    social: "สังคมศึกษา",
  };

  const languageInstruction = language === "en" ?
    "Create flashcards in English" :
    "สร้างบัตรคำเป็นภาษาไทย";

  return `🃏 **สร้างบัตรคำ (Flashcards) สำหรับการเรียนรู้**

📚 **หัวข้อ:** ${topic}
🎯 **วิชา:** ${subjectNames[subject] || subject}
📊 **ระดับชั้น:** ${level}
🔢 **จำนวน:** ${count} ใบ
🌐 **ภาษา:** ${languageInstruction}

กรุณาสร้างบัตรคำ ${count} ใบ ตามรูปแบบนี้:

**รูปแบบ JSON:**
\`\`\`json
[
  {
    "id": 1,
    "front": "คำถาม/คำศัพท์/สูตร (ด้านหน้าบัตรคำ)",
    "back": "คำตอบ/ความหมาย/คำอธิบาย (ด้านหลังบัตรคำ)",
    "hint": "คำใบ้ (ถ้ามี)",
    "example": "ตัวอย่างประโยค/การใช้งาน (ถ้ามี)",
    "difficulty": "easy|medium|hard"
  }
]
\`\`\`

**ตัวอย่างบัตรคำ:**

สำหรับคำศัพท์ภาษาอังกฤษ:
- Front: "Cat"
- Back: "แมว (สัตว์เลี้ยงสี่ขา ขนนุ่ม)"
- Hint: "สัตว์เลี้ยงยอดนิยม"
- Example: "I have a cute cat at home."

สำหรับสูตรคณิตศาสตร์:
- Front: "หาพื้นที่สี่เหลี่ยม"
- Back: "พื้นที่ = กว้าง × ยาว"
- Hint: "คูณด้านสองด้าน"
- Example: "กว้าง 5 ม. ยาว 3 ม. = 15 ตร.ม."

สำหรับคำจำกัดความ:
- Front: "การสังเคราะห์แสง คืออะไร?"
- Back: "กระบวนการที่พืชใช้แสงแดด น้ำ และคาร์บอนไดออกไซด์ สร้างอาหาร"
- Hint: "เกี่ยวกับพืชและแสงแดด"

**ข้อกำหนด:**
1. ด้านหน้า (front): สั้น กระชับ เป็นคำถามหรือคำศัพท์
2. ด้านหลัง (back): คำตอบชัดเจน อธิบายเพิ่มเติม
3. hint: ให้คำใบ้ช่วยจำ (ไม่เกิน 1 ประโยค)
4. example: ยกตัวอย่างการใช้งานจริง
5. difficulty: ประเมินระดับความยาก easy (ง่าย 40%), medium (ปานกลาง 40%), hard (ยาก 20%)
6. เรียงจากง่ายไปยาก
7. เนื้อหาเหมาะกับระดับ ${level}

กรุณาตอบเป็น **JSON Array เท่านั้น** ไม่ต้องมีข้อความอื่น`;
}

/**
 * Parse บัตรคำจาก AI Response
 */
function parseFlashcardsFromAI(aiResponse, topic, subject) {
  try {
    // ลองหา JSON ใน response
    const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const flashcards = JSON.parse(jsonMatch[0]);
      
      // เพิ่ม metadata
      return flashcards.map((card, index) => ({
        ...card,
        id: `${Date.now()}_${index}`,
        topic: topic,
        subject: subject,
        createdAt: new Date().toISOString(),
        reviewCount: 0,
        lastReviewed: null,
        masteryLevel: 0, // 0-100
      }));
    }
  } catch (error) {
    console.error("❌ Error parsing flashcards JSON:", error);
  }

  // ถ้า parse ไม่ได้ ให้แยกด้วย pattern
  return parseFlashcardsFromText(aiResponse, topic, subject);
}

/**
 * Parse บัตรคำจากข้อความธรรมดา (fallback)
 */
function parseFlashcardsFromText(text, topic, subject) {
  const flashcards = [];
  const lines = text.split("\n");
  
  let currentCard = {};
  let cardIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith("Front:") || line.includes("ด้านหน้า")) {
      if (currentCard.front && currentCard.back) {
        flashcards.push(currentCard);
      }
      currentCard = {
        id: `${Date.now()}_${cardIndex++}`,
        front: line.replace(/Front:|ด้านหน้า:/gi, "").trim(),
        topic: topic,
        subject: subject,
        createdAt: new Date().toISOString(),
      };
    } else if (line.startsWith("Back:") || line.includes("ด้านหลัง")) {
      currentCard.back = line.replace(/Back:|ด้านหลัง:/gi, "").trim();
    } else if (line.startsWith("Hint:") || line.includes("คำใบ้")) {
      currentCard.hint = line.replace(/Hint:|คำใบ้:/gi, "").trim();
    } else if (line.startsWith("Example:") || line.includes("ตัวอย่าง")) {
      currentCard.example = line.replace(/Example:|ตัวอย่าง:/gi, "").trim();
    }
  }

  // เพิ่มการ์ดสุดท้าย
  if (currentCard.front && currentCard.back) {
    flashcards.push(currentCard);
  }

  return flashcards;
}

/**
 * สร้างบัตรคำ Fallback กรณี AI ล้มเหลว
 */
function createFallbackFlashcards(topic, count) {
  const fallbackCards = [];
  
  for (let i = 1; i <= Math.min(count, 5); i++) {
    fallbackCards.push({
      id: `fallback_${Date.now()}_${i}`,
      front: `${topic} - คำที่ ${i}`,
      back: `ความหมายของ ${topic} ข้อที่ ${i}\nกรุณาลองใหม่อีกครั้งด้วยคำถามที่ชัดเจนกว่านี้`,
      hint: "ระบบกำลังเรียนรู้จากคำถามของคุณ",
      example: "ตัวอย่าง: สร้างบัตรคำศัพท์อังกฤษเรื่องสัตว์ 10 คำ",
      difficulty: "medium",
      topic: topic,
      createdAt: new Date().toISOString(),
    });
  }
  
  return fallbackCards;
}

/**
 * เรียก Gemini AI สำหรับสร้างบัตรคำ
 * (ฟังก์ชันนี้จะเชื่อมกับ Gemini ที่มีอยู่แล้วใน index.js)
 */
async function callGeminiForFlashcards(prompt) {
  // ฟังก์ชันนี้จะถูกเรียกจาก index.js ที่มี Gemini setup อยู่แล้ว
  // เพื่อไม่ให้ duplicate code
  throw new Error("This function should be called from index.js with proper Gemini setup");
}

// =====================================================
// 🎴 FLASHCARD FLEX MESSAGES - สร้าง Flex Message
// =====================================================

/**
 * สร้าง Flex Message แสดงบัตรคำแบบพลิกได้
 */
function createFlashcardFlexMessage(flashcards, currentIndex = 0, showAnswer = false) {
  if (!flashcards || flashcards.length === 0) {
    return createNoFlashcardsMessage();
  }

  const card = flashcards[currentIndex];
  const progress = `${currentIndex + 1}/${flashcards.length}`;
  
  // สร้าง Carousel สำหรับบัตรคำ
  return {
    type: "flex",
    altText: `🃏 Flashcard: ${card.front}`,
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
              {type: "text", text: "🃏", size: "xl"},
              {
                type: "text",
                text: `บัตรคำ ${progress}`,
                weight: "bold",
                size: "lg",
                color: "#FFFFFF",
                margin: "md",
                flex: 1,
              },
              {
                type: "text",
                text: card.difficulty === "easy" ? "⭐" : card.difficulty === "hard" ? "⭐⭐⭐" : "⭐⭐",
                size: "sm",
                color: "#FFD700",
                align: "end",
              },
            ],
          },
        ],
        backgroundColor: "#8B5CF6",
        paddingAll: "20px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          // ด้านหน้าบัตรคำ (เสมอ)
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: showAnswer ? "❓ คำถาม" : "🎯 ลองตอบดู!",
                size: "xs",
                color: "#8B5CF6",
                weight: "bold",
              },
              {
                type: "text",
                text: card.front,
                size: "xl",
                weight: "bold",
                color: "#333",
                wrap: true,
                margin: "md",
              },
            ],
            backgroundColor: "#F5F3FF",
            paddingAll: "20px",
            cornerRadius: "lg",
            margin: "none",
          },

          // ด้านหลังบัตรคำ (แสดงเมื่อกดพลิก)
          ...(showAnswer ? [
            {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: "✅ คำตอบ",
                  size: "xs",
                  color: "#16A34A",
                  weight: "bold",
                },
                {
                  type: "text",
                  text: card.back,
                  size: "md",
                  color: "#333",
                  wrap: true,
                  margin: "md",
                },
              ],
              backgroundColor: "#D1FAE5",
              paddingAll: "20px",
              cornerRadius: "lg",
              margin: "lg",
            },
            
            // Hint (ถ้ามี)
            ...(card.hint ? [{
              type: "box",
              layout: "horizontal",
              contents: [
                {type: "text", text: "💡", size: "md"},
                {
                  type: "text",
                  text: card.hint,
                  size: "sm",
                  color: "#666",
                  wrap: true,
                  margin: "sm",
                  flex: 1,
                },
              ],
              backgroundColor: "#FEF3C7",
              paddingAll: "12px",
              cornerRadius: "md",
              margin: "md",
            }] : []),

            // Example (ถ้ามี)
            ...(card.example ? [{
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: "📝 ตัวอย่าง",
                  size: "xs",
                  color: "#3B82F6",
                  weight: "bold",
                },
                {
                  type: "text",
                  text: card.example,
                  size: "sm",
                  color: "#555",
                  wrap: true,
                  margin: "sm",
                },
              ],
              backgroundColor: "#DBEAFE",
              paddingAll: "12px",
              cornerRadius: "md",
              margin: "md",
            }] : []),
          ] : [
            // แสดงคำใบ้เมื่อยังไม่พลิก
            ...(card.hint ? [{
              type: "box",
              layout: "horizontal",
              contents: [
                {type: "text", text: "💡", size: "md"},
                {
                  type: "text",
                  text: card.hint,
                  size: "sm",
                  color: "#666",
                  wrap: true,
                  margin: "sm",
                  flex: 1,
                },
              ],
              backgroundColor: "#FEF3C7",
              paddingAll: "12px",
              cornerRadius: "md",
              margin: "lg",
            }] : []),
          ]),
        ],
        paddingAll: "20px",
        spacing: "none",
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          // ปุ่มพลิกการ์ด
          ...(showAnswer ? [] : [{
            type: "button",
            action: {
              type: "message",
              label: "🔄 พลิกดูคำตอบ",
              text: `พลิกบัตรคำที่ ${currentIndex + 1}`,
            },
            style: "primary",
            color: "#8B5CF6",
            height: "sm",
            margin: "none",
          }]),

          // ปุ่มนำทาง
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "button",
                action: {
                  type: "message",
                  label: "⬅️ ก่อนหน้า",
                  text: currentIndex > 0 ? `บัตรคำที่ ${currentIndex}` : "บัตรคำแรกแล้ว",
                },
                style: "secondary",
                height: "sm",
                flex: 1,
              },
              {
                type: "button",
                action: {
                  type: "message",
                  label: "➡️ ถัดไป",
                  text: currentIndex < flashcards.length - 1 ? `บัตรคำที่ ${currentIndex + 2}` : "บัตรคำสุดท้ายแล้ว",
                },
                style: "secondary",
                height: "sm",
                flex: 1,
                margin: "sm",
              },
            ],
            margin: "md",
          },

          // ปุ่มทำควิซ
          ...(showAnswer ? [{
            type: "button",
            action: {
              type: "message",
              label: "🎯 ทำแบบทดสอบ",
              text: `ทดสอบบัตรคำชุดนี้`,
            },
            style: "primary",
            color: "#16A34A",
            height: "sm",
            margin: "md",
          }] : []),
        ],
        paddingAll: "15px",
        backgroundColor: "#FAFAFA",
        spacing: "none",
      },
    },
  };
}

/**
 * สร้างข้อความเมื่อไม่มีบัตรคำ
 */
function createNoFlashcardsMessage() {
  return {
    type: "flex",
    altText: "❌ ไม่พบบัตรคำ",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {type: "text", text: "❌", size: "3xl", align: "center"},
          {
            type: "text",
            text: "ไม่พบบัตรคำ",
            weight: "bold",
            size: "lg",
            align: "center",
            margin: "md",
          },
          {
            type: "text",
            text: "ลองสร้างบัตรคำใหม่ด้วยคำสั่ง:\n\"สร้างบัตรคำ [หัวข้อ] [จำนวน] ใบ\"",
            size: "sm",
            color: "#666",
            wrap: true,
            align: "center",
            margin: "md",
          },
        ],
        paddingAll: "30px",
      },
    },
  };
}

/**
 * สร้าง Flex Message แสดงรายการบัตรคำทั้งหมด
 */
function createFlashcardListFlex(flashcards, topic) {
  return {
    type: "flex",
    altText: `🃏 บัตรคำ: ${topic}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {type: "text", text: "🃏 บัตรคำทั้งหมด", weight: "bold", size: "xl", color: "#FFFFFF"},
          {type: "text", text: `${topic} (${flashcards.length} ใบ)`, size: "sm", color: "#E9D5FF", margin: "sm"},
        ],
        backgroundColor: "#8B5CF6",
        paddingAll: "20px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: flashcards.slice(0, 10).map((card, index) => ({
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "text",
              text: `${index + 1}.`,
              size: "sm",
              color: "#8B5CF6",
              weight: "bold",
              flex: 0,
            },
            {
              type: "text",
              text: card.front.length > 40 ? card.front.substring(0, 40) + "..." : card.front,
              size: "sm",
              color: "#333",
              wrap: false,
              margin: "md",
              flex: 4,
            },
            {
              type: "text",
              text: card.difficulty === "easy" ? "⭐" : card.difficulty === "hard" ? "⭐⭐⭐" : "⭐⭐",
              size: "xs",
              color: "#FFD700",
              flex: 0,
            },
          ],
          margin: "md",
          action: {
            type: "message",
            text: `บัตรคำที่ ${index + 1}`,
          },
        })),
        paddingAll: "15px",
        spacing: "sm",
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            action: {type: "message", label: "▶️ เริ่มเรียน", text: "บัตรคำที่ 1"},
            style: "primary",
            color: "#8B5CF6",
            height: "sm",
          },
          {
            type: "button",
            action: {type: "message", label: "🎯 ทำแบบทดสอบ", text: "ทดสอบบัตรคำชุดนี้"},
            style: "primary",
            color: "#16A34A",
            height: "sm",
            margin: "md",
          },
        ],
        paddingAll: "15px",
      },
    },
  };
}

// =====================================================
// 💾 FLASHCARD STORAGE - บันทึกและจัดการบัตรคำ
// =====================================================

/**
 * บันทึกบัตรคำลง Firestore
 */
async function saveFlashcards(userId, flashcards, topic) {
  try {
    const flashcardSetRef = admin.firestore()
      .collection("users")
      .doc(userId)
      .collection("flashcards")
      .doc();

    await flashcardSetRef.set({
      id: flashcardSetRef.id,
      topic: topic,
      cards: flashcards,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      totalCards: flashcards.length,
      reviewedCards: 0,
      masteryScore: 0,
    });

    console.log(`✅ Saved ${flashcards.length} flashcards for user ${userId}`);
    return flashcardSetRef.id;
  } catch (error) {
    console.error("❌ Error saving flashcards:", error);
    return null;
  }
}

/**
 * ดึงบัตรคำของผู้ใช้
 */
async function getUserFlashcards(userId, setId = null) {
  try {
    const flashcardsRef = admin.firestore()
      .collection("users")
      .doc(userId)
      .collection("flashcards");

    if (setId) {
      const doc = await flashcardsRef.doc(setId).get();
      return doc.exists ? doc.data() : null;
    }

    // ดึงทั้งหมด
    const snapshot = await flashcardsRef
      .orderBy("createdAt", "desc")
      .limit(10)
      .get();

    return snapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error("❌ Error getting flashcards:", error);
    return null;
  }
}

// =====================================================
// 📤 EXPORTS
// =====================================================

module.exports = {
  // Core functions
  generateFlashcards,
  createFlashcardFlexMessage,
  createFlashcardListFlex,
  
  // Storage functions
  saveFlashcards,
  getUserFlashcards,
  
  // Utility functions
  parseFlashcardsFromAI,
  parseFlashcardsFromText,
  createFallbackFlashcards,
  
  // Constants
  FLASHCARD_CATEGORIES,
};
