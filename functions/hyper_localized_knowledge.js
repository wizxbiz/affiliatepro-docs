/**
 * =====================================================
 * 🧠 HYPER-LOCALIZED DATA MOAT (คลังสมองเฉพาะถิ่น)
 * =====================================================
 *
 * ระบบสะสมและจัดการความรู้เฉพาะทางที่ได้จากการสนทนา
 * สร้าง "คูกำแพงข้อมูล" ที่คู่แข่งไม่สามารถเลียนแบบได้
 *
 * พัฒนาโดย: อาจารย์วิทยา
 * Version: 1.0.0
 *
 * คุณสมบัติหลัก:
 * 1. เก็บความรู้เฉพาะโรงงาน/เครื่องจักร/ปัญหาที่พบจริง
 * 2. สร้าง Knowledge Graph เชื่อมโยงปัญหา-สาเหตุ-วิธีแก้
 * 3. เรียนรู้จากผู้เชี่ยวชาญในพื้นที่
 * 4. ปรับแต่งคำตอบตามบริบทท้องถิ่น
 */

const {getFirestore, FieldValue} = require("firebase-admin/firestore");

// =====================================================
// 📚 KNOWLEDGE CATEGORIES (หมวดหมู่ความรู้)
// =====================================================

const KNOWLEDGE_CATEGORIES = {
  // ปัญหาและวิธีแก้ที่พบจริงในโรงงาน
  REAL_WORLD_SOLUTIONS: "real_world_solutions",

  // พารามิเตอร์ที่ใช้ได้ผลจริง (ไม่ใช่ค่าทฤษฎี)
  PROVEN_PARAMETERS: "proven_parameters",

  // เทคนิคเฉพาะเครื่องจักร/แบรนด์
  MACHINE_SPECIFIC: "machine_specific",

  // ความรู้เฉพาะวัสดุในท้องถิ่น
  LOCAL_MATERIALS: "local_materials",

  // เคล็ดลับจากช่างผู้ชำนาญ
  EXPERT_TIPS: "expert_tips",

  // กรณีศึกษาที่น่าสนใจ
  CASE_STUDIES: "case_studies",

  // คำศัพท์/ภาษาเฉพาะท้องถิ่น
  LOCAL_TERMINOLOGY: "local_terminology",

  // ข้อมูลซัพพลายเออร์/ผู้ขาย
  SUPPLIER_INFO: "supplier_info",
};

// =====================================================
// 🏭 HYPER-LOCALIZED KNOWLEDGE SERVICE
// =====================================================

class HyperLocalizedKnowledge {
  constructor() {
    this.db = getFirestore();
    this.knowledgeCache = new Map();
    this.maxCacheSize = 500;
    this.cacheExpiry = 30 * 60 * 1000; // 30 minutes
  }

  // =====================================================
  // 📥 KNOWLEDGE EXTRACTION (ดึงความรู้จากการสนทนา)
  // =====================================================

  /**
   * วิเคราะห์และดึงความรู้จากการสนทนา
   */
  async extractKnowledgeFromConversation(question, answer, context = {}) {
    const extractedKnowledge = [];

    // 1. ตรวจจับปัญหาและวิธีแก้
    const problemSolution = this._extractProblemSolution(question, answer);
    if (problemSolution) {
      extractedKnowledge.push({
        category: KNOWLEDGE_CATEGORIES.REAL_WORLD_SOLUTIONS,
        ...problemSolution,
      });
    }

    // 2. ตรวจจับพารามิเตอร์ที่ใช้ได้ผล
    const parameters = this._extractProvenParameters(answer);
    if (parameters.length > 0) {
      extractedKnowledge.push({
        category: KNOWLEDGE_CATEGORIES.PROVEN_PARAMETERS,
        parameters,
        context: this._extractMaterialContext(question + " " + answer),
      });
    }

    // 3. ตรวจจับความรู้เฉพาะเครื่องจักร
    const machineKnowledge = this._extractMachineSpecific(question, answer);
    if (machineKnowledge) {
      extractedKnowledge.push({
        category: KNOWLEDGE_CATEGORIES.MACHINE_SPECIFIC,
        ...machineKnowledge,
      });
    }

    // 4. ตรวจจับเคล็ดลับจากผู้เชี่ยวชาญ
    const expertTips = this._extractExpertTips(answer);
    if (expertTips.length > 0) {
      extractedKnowledge.push({
        category: KNOWLEDGE_CATEGORIES.EXPERT_TIPS,
        tips: expertTips,
      });
    }

    // 5. ตรวจจับคำศัพท์เฉพาะทาง
    const terminology = this._extractLocalTerminology(question, answer);
    if (terminology.length > 0) {
      extractedKnowledge.push({
        category: KNOWLEDGE_CATEGORIES.LOCAL_TERMINOLOGY,
        terms: terminology,
      });
    }

    return extractedKnowledge;
  }

  /**
   * ดึงปัญหาและวิธีแก้ไข
   */
  _extractProblemSolution(question, answer) {
    // Pattern สำหรับตรวจจับปัญหา
    const problemPatterns = [
      /ปัญหา\s*[:：]?\s*(.+?)(?:\n|$)/gi,
      /สาเหตุ\s*[:：]?\s*(.+?)(?:\n|$)/gi,
      /(short shot|warpage|flash|sink mark|weld line|burn mark|jetting|void|blush|silver streak)/gi,
      /ชิ้นงาน(.+?)(?:ไม่ดี|มีปัญหา|ผิดปกติ)/gi,
      /เกิด(.+?)(?:ที่|บริเวณ|ตรง)/gi,
    ];

    // Pattern สำหรับตรวจจับวิธีแก้
    const solutionPatterns = [
      /วิธีแก้\s*[:：]?\s*(.+?)(?:\n|$)/gi,
      /แก้ไขโดย\s*[:：]?\s*(.+?)(?:\n|$)/gi,
      /(?:ลอง|ให้|ควร)\s*(เพิ่ม|ลด|ปรับ|เปลี่ยน)(.+?)(?:\n|$)/gi,
      /(?:1\.|•|-)\s*(.+?)(?:\n|$)/gi,
    ];

    let problem = null;
    const solutions = [];

    // ค้นหาปัญหา
    for (const pattern of problemPatterns) {
      const matches = question.match(pattern) || answer.match(pattern);
      if (matches) {
        problem = matches[0].replace(/^(ปัญหา|สาเหตุ)\s*[:：]?\s*/i, "").trim();
        break;
      }
    }

    // ค้นหาวิธีแก้
    for (const pattern of solutionPatterns) {
      const matches = answer.matchAll(pattern);
      for (const match of matches) {
        const solution = match[1] || match[0];
        if (solution && solution.length > 10 && solution.length < 200) {
          solutions.push(solution.trim());
        }
      }
    }

    if (problem && solutions.length > 0) {
      return {
        problem,
        solutions: [...new Set(solutions)].slice(0, 5),
        defectType: this._classifyDefect(problem),
        severity: this._estimateSeverity(problem),
        extractedFrom: "conversation",
      };
    }

    return null;
  }

  /**
   * ดึงพารามิเตอร์ที่มีค่าเฉพาะเจาะจง
   */
  _extractProvenParameters(text) {
    const parameters = [];

    const paramPatterns = [
      // อุณหภูมิ
      {
        pattern: /(?:อุณหภูมิ|temp(?:erature)?|โซน\s*\d+)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(?:°C|องศา|C)/gi,
        type: "temperature",
        unit: "°C",
      },
      // ความดัน
      {
        pattern: /(?:ความดัน|pressure|แรงดัน)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(?:MPa|bar|kg\/cm²)/gi,
        type: "pressure",
        unit: "MPa",
      },
      // ความเร็ว
      {
        pattern: /(?:ความเร็ว|speed|velocity)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(?:%|mm\/s)/gi,
        type: "speed",
        unit: "%",
      },
      // เวลา
      {
        pattern: /(?:เวลา|time|cooling|holding)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(?:วินาที|sec|s)/gi,
        type: "time",
        unit: "sec",
      },
      // แรงบีบ
      {
        pattern: /(?:แรงบีบ|clamping|tonnage)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(?:ton|ตัน)/gi,
        type: "clamping_force",
        unit: "ton",
      },
    ];

    for (const {pattern, type, unit} of paramPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const value = parseFloat(match[1]);
        if (!isNaN(value) && value > 0) {
          parameters.push({
            type,
            value,
            unit,
            rawText: match[0].trim(),
          });
        }
      }
    }

    return parameters;
  }

  /**
   * ดึงความรู้เฉพาะเครื่องจักร
   */
  _extractMachineSpecific(question, answer) {
    const text = question + " " + answer;

    // ตรวจจับแบรนด์/รุ่นเครื่องจักร
    const machinePatterns = [
      /(?:Porcheson|Porchison)\s*(TX\d+|PS\d+AM)?/gi,
      /(?:Techmation)\s*(M\d+M?)?/gi,
      /(?:Toshiba|โตชิบา)\s*(\w+-?\d+)?/gi,
      /(?:Haitian|ไฮเทียน)\s*(\w+)?/gi,
      /(?:JSW)\s*(\w+-?\d+)?/gi,
      /(?:Sumitomo)\s*(\w+)?/gi,
      /(?:Fanuc|แฟนนัค)\s*(\w+)?/gi,
      /(?:Engel)\s*(\w+)?/gi,
      /(?:Arburg)\s*(\w+)?/gi,
      /(?:KraussMaffei|KM)\s*(\w+)?/gi,
    ];

    let machine = null;
    let model = null;

    for (const pattern of machinePatterns) {
      const match = text.match(pattern);
      if (match) {
        machine = match[0].split(/\s+/)[0];
        model = match[1] || null;
        break;
      }
    }

    if (machine) {
      // ดึงข้อมูลเฉพาะเครื่องจักรนั้น
      const specificInfo = this._extractMachineInfo(text, machine);
      return {
        brand: machine,
        model,
        ...specificInfo,
      };
    }

    return null;
  }

  /**
   * ดึงข้อมูลเฉพาะเครื่องจักร
   */
  _extractMachineInfo(text, machine) {
    const info = {
      menuPath: [],
      errorCodes: [],
      specialSettings: [],
      notes: [],
    };

    // ค้นหา Menu Path
    const menuPatterns = [
      /(?:กด|เข้า|ไปที่)\s*(F\d+|Menu\s*[AB]|หน้า\s*\w+)/gi,
      /(?:เมนู|menu)\s*[:>→]\s*(\w+)/gi,
    ];

    for (const pattern of menuPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        info.menuPath.push(match[1].trim());
      }
    }

    // ค้นหา Error Codes
    const errorPattern = /(?:error|alarm|รหัส|code)\s*[:=]?\s*(\d+|E\d+|A\d+)/gi;
    const errorMatches = text.matchAll(errorPattern);
    for (const match of errorMatches) {
      info.errorCodes.push(match[1]);
    }

    // ค้นหา Special Settings
    const settingPattern = /(?:ตั้งค่า|setting|parameter)\s*[:=]?\s*(\w+\s*[:=]\s*[\d.]+)/gi;
    const settingMatches = text.matchAll(settingPattern);
    for (const match of settingMatches) {
      info.specialSettings.push(match[1]);
    }

    return info;
  }

  /**
   * ดึงเคล็ดลับจากผู้เชี่ยวชาญ
   */
  _extractExpertTips(text) {
    const tips = [];

    const tipPatterns = [
      /(?:เคล็ดลับ|tip|trick)\s*[:：]?\s*(.+?)(?:\n|$)/gi,
      /(?:ข้อแนะนำ|แนะนำ|suggestion)\s*[:：]?\s*(.+?)(?:\n|$)/gi,
      /(?:ควรระวัง|ข้อควรระวัง|caution)\s*[:：]?\s*(.+?)(?:\n|$)/gi,
      /(?:สำคัญ|important)\s*[:：]?\s*(.+?)(?:\n|$)/gi,
      /💡\s*(.+?)(?:\n|$)/gi,
      /⚠️\s*(.+?)(?:\n|$)/gi,
    ];

    for (const pattern of tipPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const tip = match[1].trim();
        if (tip.length > 10 && tip.length < 300) {
          tips.push(tip);
        }
      }
    }

    return [...new Set(tips)].slice(0, 5);
  }

  /**
   * ดึงคำศัพท์เฉพาะทาง/ท้องถิ่น
   */
  _extractLocalTerminology(question, answer) {
    const terms = [];
    const text = question + " " + answer;

    // Pattern สำหรับคำศัพท์พร้อมคำอธิบาย
    const termPatterns = [
      /[""](.+?)[""]\s*(?:คือ|หมายถึง|means?)\s*(.+?)(?:\n|$)/gi,
      /(\w+)\s*\((.+?)\)/gi, // คำภาษาอังกฤษ (คำแปล)
      /(?:เรียกว่า|called)\s*[""]?(.+?)[""]?\s*/gi,
    ];

    for (const pattern of termPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[1].length > 2) {
          terms.push({
            term: match[1].trim(),
            definition: match[2] ? match[2].trim() : null,
          });
        }
      }
    }

    return terms.slice(0, 10);
  }

  /**
   * ดึงบริบทวัสดุ
   */
  _extractMaterialContext(text) {
    const materials = [];
    const materialPattern = /\b(PP|PE|ABS|PC|PA|POM|PET|PS|TPU|PVC|PMMA|PBT|PPS|PEEK|Nylon|HDPE|LDPE|LLDPE|PA6|PA66|PC\/ABS|PPO|PPS|LCP|PEI|PSU|PPSU)\b/gi;

    const matches = text.match(materialPattern);
    if (matches) {
      materials.push(...new Set(matches.map((m) => m.toUpperCase())));
    }

    return {
      materials,
      hasFillers: /(?:glass fiber|GF|talc|mineral|เส้นใยแก้ว|แคลเซียม)/i.test(text),
      hasAdditives: /(?:color|สี|masterbatch|additive)/i.test(text),
    };
  }

  /**
   * จำแนกประเภท Defect
   */
  _classifyDefect(problem) {
    const defectMap = {
      "fill": /short shot|ไม่เต็ม|unfilled/i,
      "surface": /sink mark|weld line|flow mark|blush|silver/i,
      "dimensional": /warpage|บิด|shrinkage|หดตัว/i,
      "flash": /flash|เกินขอบ|burr/i,
      "degradation": /burn|ไหม้|degrade|yellow/i,
      "mechanical": /brittle|เปราะ|crack|แตก/i,
    };

    for (const [type, pattern] of Object.entries(defectMap)) {
      if (pattern.test(problem)) return type;
    }
    return "other";
  }

  /**
   * ประเมินความรุนแรงของปัญหา
   */
  _estimateSeverity(problem) {
    const severeKeywords = /ทุกชิ้น|ทั้งหมด|เสียหาย|หยุดผลิต|ลูกค้า|urgent/i;
    const moderateKeywords = /บางชิ้น|เป็นบางครั้ง|sometimes/i;

    if (severeKeywords.test(problem)) return "high";
    if (moderateKeywords.test(problem)) return "medium";
    return "low";
  }

  // =====================================================
  // 💾 KNOWLEDGE STORAGE (บันทึกความรู้)
  // =====================================================

  /**
   * บันทึกความรู้ลง Firestore
   */
  async saveKnowledge(knowledge, userId, source = "conversation") {
    try {
      const knowledgeData = {
        ...knowledge,
        userId,
        source,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        verificationStatus: "pending", // pending, verified, rejected
        useCount: 0,
        helpfulVotes: 0,
        searchTerms: this._generateSearchTerms(knowledge),
      };

      const docRef = await this.db
          .collection("hyper_local_knowledge")
          .add(knowledgeData);

      // อัปเดต Cache
      this._updateCache(docRef.id, knowledgeData);

      console.log(`✅ Knowledge saved: ${docRef.id} [${knowledge.category}]`);
      return docRef.id;
    } catch (error) {
      console.error("❌ Error saving knowledge:", error);
      return null;
    }
  }

  /**
   * สร้าง Search Terms สำหรับการค้นหา
   */
  _generateSearchTerms(knowledge) {
    const terms = new Set();

    const addTerms = (text) => {
      if (!text) return;
      const words = text.toLowerCase()
          .replace(/[^\wก-๙\s]/g, " ")
          .split(/\s+/)
          .filter((w) => w.length > 2);
      words.forEach((w) => terms.add(w));
    };

    if (knowledge.problem) addTerms(knowledge.problem);
    if (knowledge.solutions) knowledge.solutions.forEach((s) => addTerms(s));
    if (knowledge.tips) knowledge.tips.forEach((t) => addTerms(t));
    if (knowledge.parameters) {
      knowledge.parameters.forEach((p) => terms.add(p.type));
    }
    if (knowledge.brand) terms.add(knowledge.brand.toLowerCase());
    if (knowledge.model) terms.add(knowledge.model.toLowerCase());
    if (knowledge.context?.materials) {
      knowledge.context.materials.forEach((m) => terms.add(m.toLowerCase()));
    }

    return Array.from(terms);
  }

  // =====================================================
  // 📈 LEARNING & IMPROVEMENT (เรียนรู้และปรับปรุง)
  // =====================================================

  /**
   * บันทึก Feedback จากผู้ใช้
   */
  async recordFeedback(knowledgeId, userId, feedback) {
    try {
      const feedbackData = {
        knowledgeId,
        userId,
        helpful: feedback.helpful || false,
        rating: feedback.rating || 0,
        comment: feedback.comment || "",
        timestamp: FieldValue.serverTimestamp(),
      };

      await this.db.collection("knowledge_feedback").add(feedbackData);

      // อัปเดต Score ของความรู้
      if (feedback.helpful) {
        await this.db
            .collection("hyper_local_knowledge")
            .doc(knowledgeId)
            .update({
              helpfulVotes: FieldValue.increment(1),
              qualityScore: FieldValue.increment(0.1),
            });
      }

      console.log(`✅ Feedback recorded for knowledge: ${knowledgeId}`);
      return true;
    } catch (error) {
      console.error("❌ Error recording feedback:", error);
      return false;
    }
  }

  /**
   * วิเคราะห์ความรู้ที่ควรปรับปรุง
   */
  async analyzeKnowledgeQuality() {
    try {
      const snapshot = await this.db
          .collection("hyper_local_knowledge")
          .where("useCount", ">", 5)
          .get();

      const analysis = {
        needsUpdate: [],
        lowQuality: [],
        highPerforming: [],
        outdated: [],
      };

      snapshot.forEach((doc) => {
        const data = doc.data();
        const id = doc.id;

        // คำนวณ Quality Score
        const qualityScore = this._calculateQualityScore(data);

        if (qualityScore < 0.3) {
          analysis.lowQuality.push({id, ...data, qualityScore});
        } else if (qualityScore > 0.8) {
          analysis.highPerforming.push({id, ...data, qualityScore});
        }

        // เช็คความเก่า (ถ้าไม่ได้อัปเดตมานาน 90 วัน)
        const daysSinceUpdate = data.updatedAt
          ? (Date.now() - data.updatedAt.toDate()) / (1000 * 60 * 60 * 24)
          : 999;

        if (daysSinceUpdate > 90) {
          analysis.outdated.push({id, ...data, daysSinceUpdate});
        }

        // เช็คว่าควรอัปเดตหรือไม่ (Feedback ติดลบมาก)
        if (data.helpfulVotes < 0 || (data.useCount > 10 && data.helpfulVotes < 2)) {
          analysis.needsUpdate.push({id, ...data});
        }
      });

      return analysis;
    } catch (error) {
      console.error("Error analyzing knowledge quality:", error);
      return null;
    }
  }

  /**
   * คำนวณ Quality Score
   */
  _calculateQualityScore(knowledge) {
    let score = 0.5; // Base score

    // ปัจจัย 1: Helpful Votes
    if (knowledge.helpfulVotes > 0) {
      score += Math.min(knowledge.helpfulVotes / 10, 0.2);
    }

    // ปัจจัย 2: Use Count
    if (knowledge.useCount > 5) {
      score += Math.min(knowledge.useCount / 50, 0.2);
    }

    // ปัจจัย 3: Verification Status
    if (knowledge.verificationStatus === "verified") {
      score += 0.2;
    }

    // ปัจจัย 4: Completeness (มีข้อมูลครบถ้วน)
    if (knowledge.problem && knowledge.solutions && knowledge.solutions.length > 0) {
      score += 0.1;
    }

    // ลด score ถ้ามี negative feedback
    if (knowledge.helpfulVotes < 0) {
      score -= 0.3;
    }

    return Math.min(Math.max(score, 0), 1);
  }

  /**
   * Auto-merge ความรู้ที่คล้ายกัน
   */
  async findDuplicateKnowledge() {
    try {
      const snapshot = await this.db.collection("hyper_local_knowledge").get();
      const allKnowledge = [];

      snapshot.forEach((doc) => {
        allKnowledge.push({id: doc.id, ...doc.data()});
      });

      const duplicates = [];

      // เปรียบเทียบ problem text
      for (let i = 0; i < allKnowledge.length; i++) {
        for (let j = i + 1; j < allKnowledge.length; j++) {
          const similarity = this._calculateTextSimilarity(
              allKnowledge[i].problem || "",
              allKnowledge[j].problem || "",
          );

          if (similarity > 0.85) {
            duplicates.push({
              item1: allKnowledge[i],
              item2: allKnowledge[j],
              similarity,
            });
          }
        }
      }

      return duplicates;
    } catch (error) {
      console.error("Error finding duplicates:", error);
      return [];
    }
  }

  /**
   * คำนวณความคล้ายของข้อความ (Jaccard Similarity)
   */
  _calculateTextSimilarity(text1, text2) {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter((w) => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * สร้าง Knowledge Graph (เชื่อมโยงความรู้)
   */
  async buildKnowledgeGraph(knowledgeId) {
    try {
      const doc = await this.db
          .collection("hyper_local_knowledge")
          .doc(knowledgeId)
          .get();

      if (!doc.exists) return null;

      const knowledge = doc.data();
      const graph = {
        id: knowledgeId,
        problem: knowledge.problem,
        relatedKnowledge: [],
        relatedMaterials: [],
        relatedDefects: [],
      };

      // หา Related Knowledge
      const related = await this.findRelevantKnowledge(knowledge.problem, {
        limit: 5,
        excludeId: knowledgeId,
      });

      graph.relatedKnowledge = related.map((r) => ({
        id: r.id,
        problem: r.problem,
        relevance: r.relevanceScore,
      }));

      // หา Related Materials
      if (knowledge.context?.materials) {
        graph.relatedMaterials = knowledge.context.materials;
      }

      // หา Related Defects
      if (knowledge.defectType) {
        graph.relatedDefects = [knowledge.defectType];
      }

      return graph;
    } catch (error) {
      console.error("Error building knowledge graph:", error);
      return null;
    }
  }

  // =====================================================
  // 🔍 KNOWLEDGE RETRIEVAL (ค้นหาความรู้)
  // =====================================================

  // =====================================================
  // 🎯 HYBRID INTELLIGENCE ENGINE (ระบบผสมผสานอัจฉริยะ)
  // =====================================================

  /**
   * รวมผลลัพธ์จาก Local Data + AI Response แบบฉลาด
   * @param {string} query - คำถาม
   * @param {Array} localResults - ผลลัพธ์จาก Local Knowledge
   * @param {string} aiResponse - คำตอบจาก AI
   * @param {Object} context - บริบทเพิ่มเติม
   * @return {Object} - Hybrid Response พร้อม Confidence Score
   */
  async createHybridResponse(query, localResults, aiResponse, context = {}) {
    try {
      const hybrid = {
        query,
        timestamp: new Date().toISOString(),
        sources: [],
        combinedResponse: "",
        confidence: 0,
        strategy: "",
        metadata: {},
      };

      // 1️⃣ คำนวณ Confidence Score จาก Local Knowledge
      const localConfidence = this._calculateLocalConfidence(localResults);
      
      // 2️⃣ คำนวณ Confidence Score จาก AI Response
      const aiConfidence = this._calculateAIConfidence(aiResponse, query);

      // 3️⃣ เลือกกลยุทธ์การตอบ
      if (localConfidence >= 0.7 && localResults.length >= 2) {
        // Strategy 1: Local-First (ความมั่นใจสูง)
        hybrid.strategy = "local_primary";
        hybrid.combinedResponse = this._buildLocalPrimaryResponse(localResults, aiResponse);
        hybrid.confidence = localConfidence * 0.7 + aiConfidence * 0.3;
      } else if (localConfidence >= 0.4 && aiConfidence >= 0.6) {
        // Strategy 2: Balanced Hybrid
        hybrid.strategy = "balanced_hybrid";
        hybrid.combinedResponse = this._buildBalancedHybridResponse(localResults, aiResponse);
        hybrid.confidence = (localConfidence + aiConfidence) / 2;
      } else if (aiConfidence >= 0.7) {
        // Strategy 3: AI-Primary (ข้อมูล Local น้อย แต่ AI มั่นใจ)
        hybrid.strategy = "ai_primary";
        hybrid.combinedResponse = this._buildAIPrimaryResponse(aiResponse, localResults);
        hybrid.confidence = aiConfidence * 0.8 + localConfidence * 0.2;
      } else {
        // Strategy 4: Best Effort (ความมั่นใจต่ำทั้งคู่)
        hybrid.strategy = "best_effort";
        hybrid.combinedResponse = this._buildBestEffortResponse(localResults, aiResponse, query);
        hybrid.confidence = Math.max(localConfidence, aiConfidence);
      }

      // 4️⃣ เพิ่ม Source Tracking
      hybrid.sources = this._trackSources(localResults, aiResponse);

      // 5️⃣ เพิ่ม Metadata
      hybrid.metadata = {
        localResultsCount: localResults.length,
        localConfidence,
        aiConfidence,
        context,
        recommendFollowUp: this._generateFollowUpQuestions(query, localResults),
      };

      // 6️⃣ บันทึกการใช้งานเพื่อ Learning
      await this._logHybridUsage(hybrid);

      return hybrid;
    } catch (error) {
      console.error("❌ Error creating hybrid response:", error);
      return this._createFallbackResponse(query, localResults, aiResponse);
    }
  }

  /**
   * คำนวณ Confidence จาก Local Knowledge
   */
  _calculateLocalConfidence(localResults) {
    if (!localResults || localResults.length === 0) return 0;

    let confidence = 0;
    
    // ปัจจัยที่ 1: จำนวนผลลัพธ์
    const countScore = Math.min(localResults.length / 5, 1) * 0.3;
    
    // ปัจจัยที่ 2: Relevance Score เฉลี่ย
    const avgRelevance = localResults.reduce((sum, r) => sum + (r.relevanceScore || 0), 0) / localResults.length;
    const relevanceScore = avgRelevance * 0.4;
    
    // ปัจจัยที่ 3: Verification Status
    const verifiedCount = localResults.filter(r => r.verificationStatus === "verified").length;
    const verificationScore = (verifiedCount / localResults.length) * 0.2;
    
    // ปัจจัยที่ 4: Use Count (ความรู้ที่ถูกใช้บ่อย = น่าเชื่อถือ)
    const avgUseCount = localResults.reduce((sum, r) => sum + (r.useCount || 0), 0) / localResults.length;
    const usageScore = Math.min(avgUseCount / 10, 1) * 0.1;

    confidence = countScore + relevanceScore + verificationScore + usageScore;
    return Math.min(confidence, 1);
  }

  /**
   * คำนวณ Confidence จาก AI Response
   */
  _calculateAIConfidence(aiResponse, query) {
    if (!aiResponse || aiResponse.length < 20) return 0;

    let confidence = 0.5; // Base confidence

    // ลด confidence ถ้ามีคำที่บ่งบอกความไม่แน่ใจ
    const uncertaintyKeywords = /ไม่แน่ใจ|อาจจะ|บางที|probably|maybe|might|possibly/i;
    if (uncertaintyKeywords.test(aiResponse)) {
      confidence -= 0.2;
    }

    // เพิ่ม confidence ถ้ามีข้อมูลเฉพาะเจาะจง (ตัวเลข, ชื่อวัสดุ, พารามิเตอร์)
    const hasSpecificData = /\d+[°C%]|\d+\.\d+|\b[A-Z]{2,}\b/.test(aiResponse);
    if (hasSpecificData) {
      confidence += 0.2;
    }

    // เพิ่ม confidence ถ้าคำตอบยาวและมีโครงสร้าง
    if (aiResponse.length > 200 && /[•\n-]/.test(aiResponse)) {
      confidence += 0.1;
    }

    return Math.min(Math.max(confidence, 0), 1);
  }

  /**
   * สร้างคำตอบแบบ Local-Primary
   */
  _buildLocalPrimaryResponse(localResults, aiResponse) {
    let response = "📚 **จากประสบการณ์จริงในคลังความรู้:**\n\n";
    
    // แสดงผลลัพธ์ Local (Top 3)
    localResults.slice(0, 3).forEach((result, idx) => {
      response += `${idx + 1}. ${result.problem || result.title || "N/A"}\n`;
      if (result.solutions && result.solutions.length > 0) {
        response += `   ✅ ${result.solutions[0]}\n`;
      }
      if (result.useCount > 0) {
        response += `   📊 ใช้ไปแล้ว ${result.useCount} ครั้ง\n`;
      }
      response += "\n";
    });

    // เพิ่มข้อมูลจาก AI เป็น context เสริม
    if (aiResponse && aiResponse.length > 50) {
      response += "\n🤖 **ข้อมูลเพิ่มเติมจาก AI:**\n";
      response += aiResponse.substring(0, 300);
      if (aiResponse.length > 300) response += "...";
    }

    return response;
  }

  /**
   * สร้างคำตอบแบบ Balanced Hybrid
   */
  _buildBalancedHybridResponse(localResults, aiResponse) {
    let response = "🎯 **คำแนะนำแบบผสมผสาน:**\n\n";
    
    response += "💡 **จาก AI Analysis:**\n" + aiResponse + "\n\n";
    
    if (localResults.length > 0) {
      response += "📌 **ประสบการณ์ที่เกี่ยวข้อง:**\n";
      localResults.slice(0, 2).forEach((result, idx) => {
        response += `• ${result.problem || result.title || "N/A"}\n`;
      });
    }

    return response;
  }

  /**
   * สร้างคำตอบแบบ AI-Primary
   */
  _buildAIPrimaryResponse(aiResponse, localResults) {
    let response = "🤖 **คำแนะนำจาก AI:**\n\n" + aiResponse;
    
    if (localResults.length > 0) {
      response += "\n\n💬 **หมายเหตุ:** พบประสบการณ์ที่เกี่ยวข้อง " + localResults.length + " รายการ";
    }

    return response;
  }

  /**
   * สร้างคำตอบแบบ Best Effort
   */
  _buildBestEffortResponse(localResults, aiResponse, query) {
    let response = "🔍 **ผลการค้นหา:**\n\n";
    
    if (aiResponse && aiResponse.length > 50) {
      response += aiResponse + "\n\n";
    }
    
    if (localResults.length > 0) {
      response += "📋 **ความรู้ที่อาจเกี่ยวข้อง:**\n";
      localResults.slice(0, 2).forEach((r, idx) => {
        response += `${idx + 1}. ${r.problem || r.title || "N/A"}\n`;
      });
    } else {
      response += "⚠️ ไม่พบข้อมูลที่ตรงกันในคลังความรู้ ลองถามเพิ่มเติมหรือให้รายละเอียดมากขึ้น";
    }

    return response;
  }

  /**
   * Track Sources
   */
  _trackSources(localResults, aiResponse) {
    const sources = [];
    
    if (localResults && localResults.length > 0) {
      sources.push({
        type: "local_knowledge",
        count: localResults.length,
        verified: localResults.filter(r => r.verificationStatus === "verified").length,
      });
    }
    
    if (aiResponse && aiResponse.length > 0) {
      sources.push({
        type: "ai_generated",
        length: aiResponse.length,
      });
    }
    
    return sources;
  }

  /**
   * สร้างคำถามติดตามผล
   */
  _generateFollowUpQuestions(query, localResults) {
    const questions = [];
    
    // ถ้ามีข้อมูลเกี่ยวกับวัสดุ แนะนำคำถามเกี่ยวกับพารามิเตอร์
    if (/PP|ABS|PC|PA|POM/i.test(query)) {
      questions.push("ต้องการทราบพารามิเตอร์ที่แนะนำไหม?");
    }
    
    // ถ้ามีข้อมูลเกี่ยวกับปัญหา แนะนำคำถามเกี่ยวกับสาเหตุ
    if (/รอยยุบ|แตก|บิด|ไหม้|ครีบ/i.test(query)) {
      questions.push("ต้องการทราบสาเหตุที่เป็นไปได้ไหม?");
    }
    
    return questions.slice(0, 2);
  }

  /**
   * บันทึกการใช้งาน Hybrid สำหรับ Learning
   */
  async _logHybridUsage(hybrid) {
    try {
      await this.db.collection("hybrid_usage_logs").add({
        query: hybrid.query,
        strategy: hybrid.strategy,
        confidence: hybrid.confidence,
        sourcesCount: hybrid.sources.length,
        timestamp: FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error("Error logging hybrid usage:", error);
    }
  }

  /**
   * Fallback Response
   */
  _createFallbackResponse(query, localResults, aiResponse) {
    return {
      query,
      combinedResponse: aiResponse || "ขอ้อภัย ไม่สามารถสร้างคำตอบได้ในขณะนี้",
      confidence: 0.3,
      strategy: "fallback",
      sources: [],
      metadata: {},
    };
  }

  /**
   * ค้นหาความรู้ที่เกี่ยวข้อง
   */
  async findRelevantKnowledge(query, options = {}) {
    const {
      category = null,
      limit = 5,
      minRelevance = 0.3,
      includeUnverified = false,
    } = options;

    try {
      // สร้าง Search Terms จาก Query
      const queryTerms = this._generateSearchTerms({problem: query});
      const queryEntities = this._extractMaterialContext(query);

      // Query Firestore
      let knowledgeQuery = this.db.collection("hyper_local_knowledge");

      if (category) {
        knowledgeQuery = knowledgeQuery.where("category", "==", category);
      }

      if (!includeUnverified) {
        knowledgeQuery = knowledgeQuery.where("verificationStatus", "==", "verified");
      }

      const snapshot = await knowledgeQuery
          .orderBy("useCount", "desc")
          .limit(50)
          .get();

      if (snapshot.empty) {
        // ถ้าไม่มี verified ให้ดึง pending มาด้วย
        return this._searchPendingKnowledge(queryTerms, queryEntities, limit);
      }

      // คำนวณ Relevance Score
      const scoredResults = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const relevance = this._calculateKnowledgeRelevance(
            data,
            queryTerms,
            queryEntities,
        );

        if (relevance >= minRelevance) {
          scoredResults.push({
            id: doc.id,
            ...data,
            relevanceScore: relevance,
          });
        }
      });

      // เรียงตาม Relevance
      scoredResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

      return scoredResults.slice(0, limit);
    } catch (error) {
      console.error("❌ Error finding knowledge:", error);
      return [];
    }
  }

  /**
   * ค้นหาความรู้ที่รอการตรวจสอบ
   */
  async _searchPendingKnowledge(queryTerms, queryEntities, limit) {
    try {
      const snapshot = await this.db
          .collection("hyper_local_knowledge")
          .where("verificationStatus", "==", "pending")
          .orderBy("createdAt", "desc")
          .limit(20)
          .get();

      const results = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const relevance = this._calculateKnowledgeRelevance(
            data, queryTerms, queryEntities,
        );
        if (relevance > 0.2) {
          results.push({id: doc.id, ...data, relevanceScore: relevance});
        }
      });

      results.sort((a, b) => b.relevanceScore - a.relevanceScore);
      return results.slice(0, limit);
    } catch (error) {
      return [];
    }
  }

  /**
   * คำนวณ Relevance Score
   */
  _calculateKnowledgeRelevance(knowledge, queryTerms, queryEntities) {
    let score = 0;
    let maxScore = 0;

    // Term Overlap (40%)
    maxScore += 40;
    if (knowledge.searchTerms && queryTerms.length > 0) {
      const knowledgeTermSet = new Set(knowledge.searchTerms);
      const queryTermSet = new Set(queryTerms);
      const intersection = [...queryTermSet].filter((t) => knowledgeTermSet.has(t));
      score += (intersection.length / queryTerms.length) * 40;
    }

    // Material Match (25%)
    maxScore += 25;
    if (knowledge.context?.materials && queryEntities.materials) {
      const knowledgeMaterials = new Set(knowledge.context.materials.map((m) => m.toLowerCase()));
      const queryMaterials = new Set(queryEntities.materials.map((m) => m.toLowerCase()));
      const materialIntersection = [...queryMaterials].filter((m) => knowledgeMaterials.has(m));
      if (queryMaterials.size > 0) {
        score += (materialIntersection.length / queryMaterials.size) * 25;
      }
    }

    // Usage & Helpfulness (20%)
    maxScore += 20;
    const useCountBonus = Math.min(knowledge.useCount || 0, 100) / 100 * 10;
    const helpfulBonus = Math.min(knowledge.helpfulVotes || 0, 50) / 50 * 10;
    score += useCountBonus + helpfulBonus;

    // Recency (15%)
    maxScore += 15;
    if (knowledge.createdAt) {
      const ageInDays = (Date.now() - knowledge.createdAt.toMillis()) / (24 * 60 * 60 * 1000);
      score += Math.max(0, 1 - (ageInDays / 90)) * 15; // 90 days decay
    }

    return score / maxScore;
  }

  // =====================================================
  // 📊 KNOWLEDGE FORMATTING (จัดรูปแบบความรู้)
  // =====================================================

  /**
   * จัดรูปแบบความรู้สำหรับใส่ใน Prompt
   */
  formatKnowledgeForPrompt(knowledgeItems) {
    if (!knowledgeItems || knowledgeItems.length === 0) {
      return "";
    }

    const sections = ["📚 ความรู้จากคลังสมองเฉพาะถิ่น:\n"];

    knowledgeItems.forEach((item, index) => {
      sections.push(`\n【${index + 1}】 ${this._getCategoryEmoji(item.category)}`);

      switch (item.category) {
        case KNOWLEDGE_CATEGORIES.REAL_WORLD_SOLUTIONS:
          sections.push(`ปัญหา: ${item.problem}`);
          if (item.solutions?.length > 0) {
            sections.push(`วิธีแก้ที่ใช้ได้ผล:`);
            item.solutions.forEach((s, i) => sections.push(`  ${i + 1}. ${s}`));
          }
          if (item.context?.materials?.length > 0) {
            sections.push(`วัสดุ: ${item.context.materials.join(", ")}`);
          }
          break;

        case KNOWLEDGE_CATEGORIES.PROVEN_PARAMETERS:
          sections.push(`พารามิเตอร์ที่ใช้ได้ผล:`);
          item.parameters?.forEach((p) => {
            sections.push(`  • ${p.type}: ${p.value} ${p.unit}`);
          });
          break;

        case KNOWLEDGE_CATEGORIES.MACHINE_SPECIFIC:
          sections.push(`เครื่อง: ${item.brand} ${item.model || ""}`);
          if (item.menuPath?.length > 0) {
            sections.push(`เมนู: ${item.menuPath.join(" → ")}`);
          }
          if (item.notes?.length > 0) {
            item.notes.forEach((n) => sections.push(`  💡 ${n}`));
          }
          break;

        case KNOWLEDGE_CATEGORIES.EXPERT_TIPS:
          sections.push(`เคล็ดลับจากผู้เชี่ยวชาญ:`);
          item.tips?.forEach((tip) => sections.push(`  💡 ${tip}`));
          break;

        default:
          sections.push(JSON.stringify(item, null, 2).substring(0, 200));
      }

      sections.push(`(ความเกี่ยวข้อง: ${Math.round((item.relevanceScore || 0) * 100)}%)`);
    });

    return sections.join("\n");
  }

  /**
   * ดึง Emoji ตามหมวดหมู่
   */
  _getCategoryEmoji(category) {
    const emojiMap = {
      [KNOWLEDGE_CATEGORIES.REAL_WORLD_SOLUTIONS]: "🔧 วิธีแก้ปัญหาจริง",
      [KNOWLEDGE_CATEGORIES.PROVEN_PARAMETERS]: "📊 พารามิเตอร์ที่พิสูจน์แล้ว",
      [KNOWLEDGE_CATEGORIES.MACHINE_SPECIFIC]: "🏭 ข้อมูลเฉพาะเครื่อง",
      [KNOWLEDGE_CATEGORIES.LOCAL_MATERIALS]: "📦 วัสดุท้องถิ่น",
      [KNOWLEDGE_CATEGORIES.EXPERT_TIPS]: "💡 เคล็ดลับผู้เชี่ยวชาญ",
      [KNOWLEDGE_CATEGORIES.CASE_STUDIES]: "📋 กรณีศึกษา",
      [KNOWLEDGE_CATEGORIES.LOCAL_TERMINOLOGY]: "📖 คำศัพท์เฉพาะทาง",
      [KNOWLEDGE_CATEGORIES.SUPPLIER_INFO]: "🏪 ข้อมูลซัพพลายเออร์",
    };
    return emojiMap[category] || "📚 ความรู้ทั่วไป";
  }

  // =====================================================
  // 🔄 KNOWLEDGE MAINTENANCE (บำรุงรักษาความรู้)
  // =====================================================

  /**
   * อัปเดตจำนวนครั้งที่ใช้งาน
   */
  async incrementUseCount(knowledgeId) {
    try {
      await this.db
          .collection("hyper_local_knowledge")
          .doc(knowledgeId)
          .update({
            useCount: FieldValue.increment(1),
            lastUsedAt: FieldValue.serverTimestamp(),
          });
    } catch (error) {
      console.error("Error incrementing use count:", error);
    }
  }

  /**
   * ลงคะแนนว่าเป็นประโยชน์
   */
  async voteHelpful(knowledgeId, isHelpful = true) {
    try {
      await this.db
          .collection("hyper_local_knowledge")
          .doc(knowledgeId)
          .update({
            helpfulVotes: FieldValue.increment(isHelpful ? 1 : -1),
          });
    } catch (error) {
      console.error("Error voting:", error);
    }
  }

  /**
   * ยืนยันความถูกต้องของความรู้
   */
  async verifyKnowledge(knowledgeId, verifierId, status = "verified") {
    try {
      await this.db
          .collection("hyper_local_knowledge")
          .doc(knowledgeId)
          .update({
            verificationStatus: status,
            verifiedBy: verifierId,
            verifiedAt: FieldValue.serverTimestamp(),
          });
      return true;
    } catch (error) {
      console.error("Error verifying knowledge:", error);
      return false;
    }
  }

  // =====================================================
  // 📈 KNOWLEDGE ANALYTICS (วิเคราะห์ความรู้)
  // =====================================================

  /**
   * เพิ่มความรู้ใหม่เข้า Knowledge Base
   * @param {Object} knowledgeData - ข้อมูลความรู้
   * @returns {Promise<Object>} - {success, id, message}
   */
  async addKnowledge(knowledgeData) {
    try {
      const {
        problem,
        solution,
        category,
        material,
        defect,
        tags = [],
        source = "admin_import",
        contributedBy,
      } = knowledgeData;

      // Validation
      if (!problem || problem.trim().length < 5) {
        return {success: false, message: "ปัญหา/คำถามต้องมีอย่างน้อย 5 ตัวอักษร"};
      }

      if (!solution || solution.trim().length < 10) {
        return {success: false, message: "วิธีแก้/คำตอบต้องมีอย่างน้อย 10 ตัวอักษร"};
      }

      // Auto-detect category if not provided
      let finalCategory = category;
      if (!finalCategory) {
        finalCategory = this._detectCategory(problem, solution);
      }

      // Validate category
      const validCategories = Object.values(KNOWLEDGE_CATEGORIES);
      if (!validCategories.includes(finalCategory)) {
        finalCategory = KNOWLEDGE_CATEGORIES.REAL_WORLD_SOLUTIONS; // Default
      }

      // Extract search keywords
      const searchKeywords = this._extractKeywords(problem + " " + solution);

      // Build document
      const docData = {
        problem: problem.trim(),
        solution: solution.trim(),
        category: finalCategory,
        material: material || null,
        defect: defect || null,
        tags: Array.isArray(tags) ? tags : [],
        source,
        contributedBy: contributedBy || null,
        verificationStatus: "pending", // Default to pending
        useCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        searchKeywords,
        confidence: 0.7, // Default confidence
      };

      // Save to Firestore
      const docRef = await this.db.collection("hyper_knowledge").add(docData);

      console.log(`✅ Added knowledge: ${docRef.id}`);

      return {
        success: true,
        id: docRef.id,
        message: "เพิ่มความรู้สำเร็จ",
        data: {
          ...docData,
          id: docRef.id,
        },
      };
    } catch (error) {
      console.error("Error adding knowledge:", error);
      return {
        success: false,
        message: `เกิดข้อผิดพลาด: ${error.message}`,
      };
    }
  }

  /**
   * ตรวจจับหมวดหมู่อัตโนมัติ
   */
  _detectCategory(problem, solution) {
    const text = (problem + " " + solution).toLowerCase();

    // Check for problem-solution patterns
    if (text.includes("รอย") || text.includes("ปัญหา") || text.includes("แก้ไข") || text.includes("วิธีแก้")) {
      return KNOWLEDGE_CATEGORIES.REAL_WORLD_SOLUTIONS;
    }

    // Check for parameters
    if (text.includes("อุณหภูมิ") || text.includes("แรงดัน") || text.includes("ความเร็ว") || text.includes("พารามิเตอร์")) {
      return KNOWLEDGE_CATEGORIES.PROVEN_PARAMETERS;
    }

    // Check for machine-specific
    if (text.includes("เครื่อง") || text.includes("sumitomo") || text.includes("toshiba") || text.includes("haitian")) {
      return KNOWLEDGE_CATEGORIES.MACHINE_SPECIFIC;
    }

    // Check for expert tips
    if (text.includes("เคล็ดลับ") || text.includes("ทริค") || text.includes("tip") || text.includes("แนะนำ")) {
      return KNOWLEDGE_CATEGORIES.EXPERT_TIPS;
    }

    // Default
    return KNOWLEDGE_CATEGORIES.REAL_WORLD_SOLUTIONS;
  }

  /**
   * ดึงคำค้นหาสำคัญ
   */
  _extractKeywords(text) {
    const keywords = new Set();

    // Common materials
    const materials = ["abs", "pp", "pe", "pc", "pa", "pmma", "pom", "pet"];
    materials.forEach((mat) => {
      if (text.toLowerCase().includes(mat)) keywords.add(mat);
    });

    // Common defects
    const defects = ["รอยยุบ", "รอยไหม้", "บิดงอ", "ครีบ", "ฉีดไม่เต็ม", "ขุ่น", "แตก"];
    defects.forEach((def) => {
      if (text.includes(def)) keywords.add(def);
    });

    // Extract words (Thai and English)
    const words = text.match(/[\u0E00-\u0E7Fa-zA-Z]{3,}/g) || [];
    words.slice(0, 10).forEach((word) => keywords.add(word.toLowerCase()));

    return Array.from(keywords);
  }

  /**
   * ค้นหาความรู้ที่เกี่ยวข้อง
   * @param {string} query - คำค้นหา
   * @param {number} limit - จำนวนสูงสุด
   * @returns {Promise<Array>} - รายการความรู้ที่เกี่ยวข้อง
   */
  async searchRelevant(query, limit = 5) {
    try {
      const queryLower = query.toLowerCase();
      const queryKeywords = this._extractKeywords(query);

      // Search in verified knowledge first
      const snapshot = await this.db
          .collection("hyper_knowledge")
          .where("verificationStatus", "==", "verified")
          .limit(50)
          .get();

      const results = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        let relevanceScore = 0;

        // Check problem similarity
        if (data.problem && data.problem.toLowerCase().includes(queryLower.substring(0, 10))) {
          relevanceScore += 10;
        }

        // Check keyword matches
        const docKeywords = data.searchKeywords || [];
        queryKeywords.forEach((keyword) => {
          if (docKeywords.includes(keyword)) {
            relevanceScore += 5;
          }
        });

        // Check material match
        queryKeywords.forEach((keyword) => {
          if (data.material && data.material.toLowerCase().includes(keyword)) {
            relevanceScore += 8;
          }
        });

        if (relevanceScore > 0) {
          results.push({
            id: doc.id,
            ...data,
            relevanceScore,
          });
        }
      });

      // Sort by relevance and return top results
      results.sort((a, b) => b.relevanceScore - a.relevanceScore);
      return results.slice(0, limit);
    } catch (error) {
      console.error("Error searching knowledge:", error);
      return [];
    }
  }

  /**
   * ดึงสถิติความรู้
   */
  async getKnowledgeStats() {
    try {
      const stats = {
        totalKnowledge: 0,
        byCategory: {},
        topUsed: [],
        recentlyAdded: [],
        pendingVerification: 0,
      };

      // นับจำนวนทั้งหมด
      const allSnapshot = await this.db
          .collection("hyper_knowledge")
          .get();

      stats.totalKnowledge = allSnapshot.size;

      // นับตามหมวดหมู่
      allSnapshot.forEach((doc) => {
        const data = doc.data();
        const category = data.category || "unknown";
        stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;

        if (data.verificationStatus === "pending") {
          stats.pendingVerification++;
        }
      });

      // Top Used
      const topUsedSnapshot = await this.db
          .collection("hyper_knowledge")
          .orderBy("useCount", "desc")
          .limit(5)
          .get();

      topUsedSnapshot.forEach((doc) => {
        stats.topUsed.push({id: doc.id, ...doc.data()});
      });

      // Recently Added
      const recentSnapshot = await this.db
          .collection("hyper_knowledge")
          .orderBy("createdAt", "desc")
          .limit(5)
          .get();

      recentSnapshot.forEach((doc) => {
        stats.recentlyAdded.push({id: doc.id, ...doc.data()});
      });

      return stats;
    } catch (error) {
      console.error("Error getting stats:", error);
      return null;
    }
  }

  // =====================================================
  // 🗄️ CACHE MANAGEMENT
  // =====================================================

  _updateCache(id, data) {
    this.knowledgeCache.set(id, {
      data,
      timestamp: Date.now(),
    });

    // ลบ Cache ที่เก่าเกินไป
    if (this.knowledgeCache.size > this.maxCacheSize) {
      const oldestKey = this.knowledgeCache.keys().next().value;
      this.knowledgeCache.delete(oldestKey);
    }
  }

  _getFromCache(id) {
    const cached = this.knowledgeCache.get(id);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.cacheExpiry) {
      this.knowledgeCache.delete(id);
      return null;
    }

    return cached.data;
  }
}

// =====================================================
// 📤 EXPORTS
// =====================================================

// Singleton instance
let hyperLocalizedKnowledge = null;

function getHyperLocalizedKnowledge() {
  if (!hyperLocalizedKnowledge) {
    hyperLocalizedKnowledge = new HyperLocalizedKnowledge();
  }
  return hyperLocalizedKnowledge;
}

/**
 * 🌱 Seed ข้อมูลเริ่มต้นลง Firestore
 */
async function seedInitialKnowledge() {
  const db = getFirestore();
  const batch = db.batch();

  const initialData = [
    {
      category: KNOWLEDGE_CATEGORIES.REAL_WORLD_SOLUTIONS,
      problem: "ABS รอยยุบ (Sink Mark)",
      solution: "เพิ่มแรงดัน Holding Pressure 10-15% และเพิ่มเวลา Holding Time",
      context: {
        material: "ABS",
        defect: "SINK_MARK",
        severity: "medium",
      },
      verificationStatus: "verified",
      useCount: 0,
      createdAt: new Date(),
      confidence: 0.85,
    },
    {
      category: KNOWLEDGE_CATEGORIES.REAL_WORLD_SOLUTIONS,
      problem: "PP ฉีดไม่เต็ม (Short Shot)",
      solution: "ลดความหนืด: เพิ่มอุณหภูมิหลอม 10-20°C หรือเพิ่มความเร็วฉีด",
      context: {
        material: "PP",
        defect: "SHORT_SHOT",
        severity: "high",
      },
      verificationStatus: "verified",
      useCount: 0,
      createdAt: new Date(),
      confidence: 0.9,
    },
    {
      category: KNOWLEDGE_CATEGORIES.PROVEN_PARAMETERS,
      problem: "พารามิเตอร์มาตรฐาน ABS",
      solution: "อุณหภูมิหลอม 200-240°C, แม่พิมพ์ 50-80°C, แรงดัน 80-120 MPa",
      context: {
        material: "ABS",
        paramType: "standard",
      },
      verificationStatus: "verified",
      useCount: 0,
      createdAt: new Date(),
      confidence: 0.95,
    },
    {
      category: KNOWLEDGE_CATEGORIES.REAL_WORLD_SOLUTIONS,
      problem: "PC บิดงอ (Warpage)",
      solution: "ปรับอุณหภูมิแม่พิมพ์ให้สม่ำเสมอ และเพิ่มเวลา Cooling",
      context: {
        material: "PC",
        defect: "WARPAGE",
        severity: "high",
      },
      verificationStatus: "verified",
      useCount: 0,
      createdAt: new Date(),
      confidence: 0.8,
    },
    {
      category: KNOWLEDGE_CATEGORIES.EXPERT_TIPS,
      problem: "เคล็ดลับลดครีบ (Flash)",
      solution: "ตรวจสอบแรงล็อคแม่พิมพ์ และความสะอาดของพื้นผิว Parting Line",
      context: {
        defect: "FLASH",
        tip: "maintenance",
      },
      verificationStatus: "verified",
      useCount: 0,
      createdAt: new Date(),
      confidence: 0.75,
    },
  ];

  initialData.forEach((data) => {
    const docRef = db.collection("hyper_knowledge").doc();
    batch.set(docRef, data);
  });

  await batch.commit();
  console.log(`✅ Seeded ${initialData.length} initial knowledge entries`);
  return initialData.length;
}

module.exports = {
  HyperLocalizedKnowledge,
  getHyperLocalizedKnowledge,
  KNOWLEDGE_CATEGORIES,
  seedInitialKnowledge,
};
