# 📚 Knowledge Import System - Design Document

**วันที่:** 14 ธันวาคม 2568
**Version:** 1.0.0
**สถานะ:** 🚧 In Development

---

## 🎯 เป้าหมาย

สร้างระบบให้ Super Admin สามารถ:
1. **นำเข้าความรู้ใหม่** เข้า Knowledge Base
2. **AI ดึงข้อมูล** จาก Knowledge Base มาใช้ตอบคำถาม
3. **อัปเดตความรู้** ที่มีอยู่แล้ว
4. **ลบความรู้** ที่ไม่ต้องการ

---

## 📋 Workflow

```
┌─────────────────────────────────────────────────────────────┐
│  1. IMPORT KNOWLEDGE (Super Admin)                          │
│     - เพิ่มความรู้ทีละรายการ                                 │
│     - Import จากไฟล์ (CSV, JSON)                             │
│     - Import จากการสนทนา (Auto-extract)                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  2. STORE IN FIRESTORE                                       │
│     Collection: hyper_knowledge                              │
│     - Auto-categorize                                        │
│     - Verify & Quality check                                 │
│     - Index for search                                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  3. AI RETRIEVAL (When user asks)                            │
│     - Search relevant knowledge                              │
│     - Inject into AI prompt                                  │
│     - Generate answer                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 ฟังก์ชันที่ต้องพัฒนา

### 1. **Add Knowledge Function**

**File:** `hyper_localized_knowledge.js`

```javascript
/**
 * เพิ่มความรู้ใหม่เข้า Knowledge Base
 * @param {Object} knowledgeData - ข้อมูลความรู้
 * @returns {Promise<string>} - Document ID
 */
async addKnowledge(knowledgeData) {
  const {
    problem,      // ปัญหา/คำถาม (required)
    solution,     // วิธีแก้/คำตอบ (required)
    category,     // หมวดหมู่ (optional - auto-detect)
    material,     // วัสดุที่เกี่ยวข้อง (optional)
    defect,       // ปัญหาที่เกี่ยวข้อง (optional)
    tags,         // Tags (optional)
    source,       // แหล่งที่มา (optional)
  } = knowledgeData;

  // Validation
  // Auto-categorization
  // Quality check
  // Save to Firestore
  // Return document ID
}
```

---

### 2. **Import Commands (Admin Only)**

#### 2.1 เพิ่มความรู้ทีละรายการ

**คำสั่ง:**
```
เพิ่มความรู้
ปัญหา: ABS มีรอยไหม้
วิธีแก้: ลดอุณหภูมิลง 10-20°C และเพิ่มระบบระบายอากาศ
หมวด: วิธีแก้จริง
```

**Format:**
```
เพิ่มความรู้
ปัญหา: [ปัญหา/คำถาม]
วิธีแก้: [วิธีแก้/คำตอบ]
หมวด: [หมวดหมู่]
วัสดุ: [วัสดุ] (optional)
แท็ก: [tag1, tag2] (optional)
```

#### 2.2 Import จาก JSON

**คำสั่ง:**
```
import knowledge
[JSON data]
```

**JSON Format:**
```json
{
  "items": [
    {
      "problem": "ABS มีรอยไหม้",
      "solution": "ลดอุณหภูมิลง 10-20°C",
      "category": "real_world_solutions",
      "material": "ABS",
      "tags": ["burn_mark", "temperature"]
    }
  ]
}
```

---

### 3. **AI Integration**

**File:** `index.js` (Gemini API section)

#### Current Flow:
```
User Question
    ↓
Gemini AI
    ↓
Response
```

#### New Flow:
```
User Question
    ↓
Search Knowledge Base
    ↓
Inject relevant knowledge into prompt
    ↓
Gemini AI (with knowledge context)
    ↓
Enhanced Response
```

#### Implementation:
```javascript
// In getGeminiResponse function
async function getGeminiResponse(userMessage) {
  // 1. Search knowledge base
  const hyperKnowledge = getHyperLocalizedKnowledge();
  const relevantKnowledge = await hyperKnowledge.searchRelevant(userMessage);

  // 2. Build enhanced prompt
  let enhancedPrompt = userMessage;
  if (relevantKnowledge.length > 0) {
    enhancedPrompt = `
**บริบทจากฐานความรู้:**
${relevantKnowledge.map(k => `- ${k.problem}: ${k.solution}`).join('\n')}

**คำถามของผู้ใช้:**
${userMessage}

**คำแนะนำ:** ใช้ความรู้จากฐานข้อมูลข้างต้นประกอบคำตอบ
`;
  }

  // 3. Send to Gemini
  const response = await model.generateContent(enhancedPrompt);
  return response;
}
```

---

## 📊 Database Schema

### Collection: `hyper_knowledge`

```javascript
{
  // Auto-generated
  id: "abc123",
  createdAt: Timestamp,
  updatedAt: Timestamp,

  // Required
  problem: "ABS มีรอยไหม้",
  solution: "ลดอุณหภูมิลง 10-20°C และเพิ่มระบบระบายอากาศ",

  // Auto-detected or manual
  category: "real_world_solutions",

  // Metadata
  material: "ABS",              // วัสดุที่เกี่ยวข้อง
  defect: "burn_mark",          // ปัญหาที่เกี่ยวข้อง
  tags: ["temperature", "venting"],

  // Quality & Verification
  verificationStatus: "verified" | "pending" | "rejected",
  verifiedBy: "userId",
  verifiedAt: Timestamp,
  confidence: 0.85,             // 0-1

  // Usage tracking
  useCount: 0,
  lastUsedAt: Timestamp,

  // Source
  source: "admin_import" | "auto_extract" | "user_contribution",
  contributedBy: "userId",

  // Search optimization
  searchKeywords: ["abs", "รอยไหม้", "อุณหภูมิ"],
  embedding: [0.1, 0.2, ...],   // For semantic search (future)
}
```

---

## 🎨 UI/UX Flow

### Admin Interface:

```
👑 SUPER ADMIN COMMANDS
=======================

📚 Knowledge Management:
1. เพิ่มความรู้ - เพิ่มความรู้ทีละรายการ
2. import knowledge - Import จาก JSON
3. ดูความรู้ทั้งหมด - ดูรายการทั้งหมด
4. ดูหมวด [หมวด] - ดูตามหมวดหมู่
5. แก้ไขความรู้ [ID] - แก้ไขความรู้
6. ลบความรู้ [ID] - ลบความรู้
7. /knowledge - สถิติ Knowledge Base
```

---

## 🔍 Search & Retrieval Methods

### Method 1: Keyword Search (Current)
```javascript
searchByKeywords(query) {
  // Search in problem, solution, tags
  // Return matching items
}
```

### Method 2: Category Filter
```javascript
searchByCategory(category) {
  // Filter by category
  // Order by useCount
}
```

### Method 3: Material-based Search
```javascript
searchByMaterial(material) {
  // Find knowledge for specific material
}
```

### Method 4: Semantic Search (Future)
```javascript
searchSemantic(query) {
  // Use embeddings
  // Find similar problems
}
```

---

## 🚀 Implementation Steps

### Phase 1: Basic Add Function (Today)
- [x] Create `addKnowledge()` function
- [ ] Create admin command "เพิ่มความรู้"
- [ ] Test with manual input
- [ ] Deploy

### Phase 2: Search & Retrieval (Today)
- [ ] Create `searchRelevant()` function
- [ ] Integrate with Gemini AI
- [ ] Test knowledge injection
- [ ] Deploy

### Phase 3: Bulk Import (Tomorrow)
- [ ] Support JSON import
- [ ] Support CSV import
- [ ] Batch processing
- [ ] Deploy

### Phase 4: Advanced Features (Future)
- [ ] Auto-categorization with AI
- [ ] Quality scoring
- [ ] Duplicate detection
- [ ] Semantic search with embeddings

---

## 📝 Command Examples

### Example 1: Add Knowledge (Manual)
```
Admin types:
-------------
เพิ่มความรู้
ปัญหา: PP มีรอยขาว (White Streaks)
วิธีแก้: ตรวจสอบความชื้นในเม็ดพลาสติก และอบให้แห้งก่อนใช้
หมวด: วิธีแก้จริง
วัสดุ: PP

System Response:
-----------------
✅ เพิ่มความรู้สำเร็จ!

📊 รายละเอียด:
• ID: xyz789
• หมวด: วิธีแก้จริง
• วัสดุ: PP
• สถานะ: รอตรวจสอบ

💡 พิมพ์ "/verify xyz789" เพื่อยืนยัน
```

### Example 2: User Query with Knowledge Injection
```
User asks:
----------
PP ของผมมีรอยขาวเป็นๆ หาย เกิดจากอะไร

AI Processing:
--------------
1. Search knowledge: "PP รอยขาว"
2. Found: "PP มีรอยขาว (White Streaks) - ตรวจสอบความชื้น"
3. Inject into prompt
4. Generate answer

AI Response:
------------
รอยขาวเป็นๆ หายในชิ้นงาน PP มักเกิดจาก **ความชื้นในเม็ดพลาสติก**

🔧 วิธีแก้ไข:
1. อบเม็ด PP ให้แห้งก่อนใช้ (80-90°C, 2-3 ชั่วโมง)
2. ตรวจสอบระบบอบแห้ง (Dryer)
3. เก็บเม็ดในที่แห้ง

📚 ความรู้นี้มาจาก: Knowledge Base (verified)
```

---

## 🎯 Success Metrics

1. **Knowledge Base Growth**
   - Target: 100 items in 1 month
   - Current: 5 items

2. **AI Accuracy Improvement**
   - Measure: User satisfaction
   - Track: Knowledge usage count

3. **Admin Efficiency**
   - Time to add knowledge: < 1 minute
   - Import speed: 100 items/minute

---

**Status:** Ready for implementation
**Next:** Create `addKnowledge()` function
