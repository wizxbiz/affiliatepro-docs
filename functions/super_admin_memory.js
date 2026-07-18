/**
 * =====================================================
 * 🧠 SUPER ADMIN CONVERSATION MEMORY
 * =====================================================
 * 
 * เก็บประวัติการสนทนาทั้งหมดของ Super Admin
 * เพื่อให้ AI จดจำและทบทวนการสื่อสารที่ผ่านมา
 * 
 * Features:
 * - บันทึกทุกการสนทนา (Q&A)
 * - ดึงประวัติย้อนหลัง
 * - ค้นหาการสนทนาที่เกี่ยวข้อง
 * - สรุปประวัติการสนทนา
 */

const { getFirestore, FieldValue } = require("firebase-admin/firestore");

const SUPER_ADMIN_IDS = ["Ud9bec6d2ea945cf4330a69cb74ac93cf", "U9b40807cbcc8182928a12e3b6b73330e"];

class SuperAdminMemory {
  constructor() {
    this.db = getFirestore();
    this.collectionName = "super_admin_conversations";
    this.maxHistoryForContext = 10; // จำนวนการสนทนาที่จะนำมาใส่ใน AI context
  }

  /**
   * บันทึกการสนทนา
   */
  async saveConversation(userId, question, answer, metadata = {}) {
    try {
      // ตรวจสอบว่าเป็น Super Admin
      if (!SUPER_ADMIN_IDS.includes(userId)) {
        console.log(`⚠️ Not Super Admin, skipping memory save`);
        return null;
      }

      const conversationData = {
        userId: userId,
        question: question,
        answer: answer,
        timestamp: FieldValue.serverTimestamp(),
        metadata: {
          questionLength: question.length,
          answerLength: answer.length,
          conversationType: this._detectConversationType(question),
          ...metadata,
        },
        createdAt: new Date(),
      };

      const docRef = await this.db
        .collection(this.collectionName)
        .add(conversationData);

      console.log(`💾 Saved Super Admin conversation: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error("❌ Error saving conversation:", error);
      return null;
    }
  }

  /**
   * ดึงประวัติการสนทนาล่าสุด
   */
  async getRecentConversations(limit = 20) {
    try {
      const snapshot = await this.db
        .collection(this.collectionName)
        .where("userId", "in", SUPER_ADMIN_IDS)
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();

      const conversations = [];
      snapshot.forEach((doc) => {
        conversations.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      console.log(`📚 Retrieved ${conversations.length} recent conversations`);
      return conversations;
    } catch (error) {
      console.error("❌ Error getting conversations:", error);
      return [];
    }
  }

  /**
   * ค้นหาการสนทนาที่เกี่ยวข้อง
   */
  async searchConversations(keyword, limit = 10) {
    try {
      const snapshot = await this.db
        .collection(this.collectionName)
        .where("userId", "in", SUPER_ADMIN_IDS)
        .orderBy("createdAt", "desc")
        .limit(100) // ดึงมาก่อน แล้วค้นหาใน client
        .get();

      const conversations = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const lowerKeyword = keyword.toLowerCase();
        const questionMatch = data.question.toLowerCase().includes(lowerKeyword);
        const answerMatch = data.answer.toLowerCase().includes(lowerKeyword);

        if (questionMatch || answerMatch) {
          conversations.push({
            id: doc.id,
            ...data,
            relevance: questionMatch ? 1 : 0.5, // คำถามตรงมีความเกี่ยวข้องมากกว่า
          });
        }
      });

      // เรียงตาม relevance แล้ว timestamp
      conversations.sort((a, b) => {
        if (b.relevance !== a.relevance) {
          return b.relevance - a.relevance;
        }
        return b.createdAt - a.createdAt;
      });

      console.log(`🔍 Found ${conversations.length} matching conversations for "${keyword}"`);
      return conversations.slice(0, limit);
    } catch (error) {
      console.error("❌ Error searching conversations:", error);
      return [];
    }
  }

  /**
   * สร้าง Context สำหรับ AI จากประวัติการสนทนา
   */
  async buildContextForAI(currentQuestion) {
    try {
      // 1. ดึงประวัติล่าสุด
      const recentConversations = await this.getRecentConversations(this.maxHistoryForContext);

      if (recentConversations.length === 0) {
        return "";
      }

      // 2. สร้าง context string
      let context = "\n\n📚 **ประวัติการสนทนาที่เกี่ยวข้อง (Super Admin):**\n\n";

      recentConversations.reverse().forEach((conv, index) => {
        const timeAgo = this._getTimeAgo(conv.createdAt);
        context += `[${index + 1}] ${timeAgo}\n`;
        context += `Q: ${conv.question.substring(0, 150)}\n`;
        context += `A: ${conv.answer.substring(0, 200)}...\n\n`;
      });

      // 3. เพิ่ม instruction
      context += "ใช้ประวัติการสนทนาข้างต้นเพื่อให้คำตอบที่สอดคล้องกับบริบทที่เคยคุยไว้\n";

      return context;
    } catch (error) {
      console.error("❌ Error building AI context:", error);
      return "";
    }
  }

  /**
   * สรุปสถิติการสนทนา
   */
  async getConversationStats() {
    try {
      const snapshot = await this.db
        .collection(this.collectionName)
        .where("userId", "in", SUPER_ADMIN_IDS)
        .get();

      const stats = {
        totalConversations: snapshot.size,
        byType: {},
        totalQuestions: 0,
        totalAnswers: 0,
        avgQuestionLength: 0,
        avgAnswerLength: 0,
        firstConversation: null,
        lastConversation: null,
      };

      let totalQuestionLength = 0;
      let totalAnswerLength = 0;
      let firstDate = null;
      let lastDate = null;

      snapshot.forEach((doc) => {
        const data = doc.data();

        // นับตามประเภท
        const type = data.metadata?.conversationType || "general";
        stats.byType[type] = (stats.byType[type] || 0) + 1;

        // รวมความยาว
        totalQuestionLength += data.question.length;
        totalAnswerLength += data.answer.length;

        // หาวันที่แรกและล่าสุด
        const date = data.createdAt?.toDate?.() || data.createdAt;
        if (!firstDate || date < firstDate) firstDate = date;
        if (!lastDate || date > lastDate) lastDate = date;
      });

      if (stats.totalConversations > 0) {
        stats.avgQuestionLength = Math.round(totalQuestionLength / stats.totalConversations);
        stats.avgAnswerLength = Math.round(totalAnswerLength / stats.totalConversations);
        stats.firstConversation = firstDate;
        stats.lastConversation = lastDate;
      }

      return stats;
    } catch (error) {
      console.error("❌ Error getting stats:", error);
      return null;
    }
  }

  /**
   * ลบการสนทนาเก่า (เก็บไว้แค่ล่าสุด)
   */
  async cleanOldConversations(keepLatest = 100) {
    try {
      const snapshot = await this.db
        .collection(this.collectionName)
        .where("userId", "in", SUPER_ADMIN_IDS)
        .orderBy("createdAt", "desc")
        .get();

      if (snapshot.size <= keepLatest) {
        console.log(`✅ No old conversations to clean (${snapshot.size}/${keepLatest})`);
        return 0;
      }

      const batch = this.db.batch();
      let deleteCount = 0;

      snapshot.forEach((doc, index) => {
        if (index >= keepLatest) {
          batch.delete(doc.ref);
          deleteCount++;
        }
      });

      await batch.commit();
      console.log(`🗑️ Cleaned ${deleteCount} old conversations`);
      return deleteCount;
    } catch (error) {
      console.error("❌ Error cleaning conversations:", error);
      return 0;
    }
  }

  // =====================================================
  // 🛠️ HELPER METHODS
  // =====================================================

  /**
   * ตรวจจับประเภทการสนทนา
   */
  _detectConversationType(question) {
    const lower = question.toLowerCase();

    if (lower.includes("/") || lower.includes("คำสั่ง")) return "command";
    if (lower.includes("พัฒนา") || lower.includes("แก้ไข") || lower.includes("เพิ่ม")) return "development";
    if (lower.includes("bug") || lower.includes("error") || lower.includes("ข้อผิดพลาด")) return "debugging";
    if (lower.includes("ดู") || lower.includes("เช็ค") || lower.includes("แสดง")) return "query";
    if (lower.includes("ทดสอบ") || lower.includes("test")) return "testing";

    return "general";
  }

  /**
   * คำนวณเวลาที่ผ่านไป
   */
  _getTimeAgo(date) {
    if (!date) return "unknown";

    const timestamp = date.toDate?.() || date;
    const now = new Date();
    const diffMs = now - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "เมื่อสักครู่";
    if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
    if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
    return `${diffDays} วันที่แล้ว`;
  }
}

// Singleton instance
let superAdminMemory = null;

function getSuperAdminMemory() {
  if (!superAdminMemory) {
    superAdminMemory = new SuperAdminMemory();
  }
  return superAdminMemory;
}

module.exports = {
  SuperAdminMemory,
  getSuperAdminMemory,
  SUPER_ADMIN_IDS,
};
