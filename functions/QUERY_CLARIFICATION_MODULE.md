# 🔍 Query Clarification Module

## 📊 สรุประบบ

**Query Clarification Module** คือระบบที่เพิ่มเข้ามาใน Cloud Functions เพื่อแก้ไขปัญหา **Intent Ambiguity** (ความคลุมเครือของเจตนา) ที่ทำให้ Multi-Agent System ล้มเหลวในการประมวลผล

---

## ❌ ปัญหาเดิม

### **Execution ID:** 94w2nylk
**User Query:** "เช็คระบบเพื่อพัฒนา"
**Result:** System Failure (Quality Score: 0%, Confidence: 50%)

### สาเหตุ:
1. **Input Mismatch** - คำสั่งขาด keyword เฉพาะเจาะจง
2. **Lack of Contextual Scoping** - ไม่มีกลไกสอบถามกลับ
3. **User Level Discrepancy** - ใช้โมเดลเทคนิคขั้นสูงกับผู้ใช้ระดับ beginner

---

## ✅ การแก้ไข

### **Phase 1: Query Clarification Module** (ทันที)

เพิ่มโมดูลใหม่ที่ตรวจจับและจัดการคำถามที่คลุมเครือ:

```javascript
class QueryClarificationModule {
  needsClarification(text, userLevel, questionType)
  generateClarificationPrompt(text, analysis)
  isClarificationResponse(text)
  enhanceQueryFromOption(originalQuery, option, followUpText)
}
```

---

## 🔧 การทำงานของระบบ

### **1. ตรวจจับความคลุมเครือ**

```javascript
needsClarification(text, userLevel, questionType) {
  // ตรวจสอบ:
  // 1. มี Ambiguous Keywords หรือไม่ (พัฒนา, ปรับปรุง, เช็ค)
  // 2. มี Specific Keywords หรือไม่ (short shot, warpage, temperature)
  // 3. คำถามสั้นเกินไปหรือไม่ (< 5 คำ)
  // 4. เป็น General Question หรือไม่

  // คำนวณ Confidence Score
  // ถ้า Confidence < 70% และเป็น beginner/intermediate
  // → ต้องการ Clarification
}
```

**Confidence Score Calculation:**
- เริ่มที่ 100%
- มี Ambiguous Keyword → -30%
- ไม่มี Specific Keyword → -20%
- คำถามสั้นเกินไป → -20%
- เป็น General Question → -10%

### **2. สร้างคำถามเพื่อชี้แจง**

```javascript
generateClarificationPrompt(text, analysis) {
  // ตรวจจับประเภทคำถาม:

  // กรณี: "พัฒนา", "ปรับปรุง"
  // → แสดงตัวเลือก A-F:
  //   [A] ลดของเสีย
  //   [B] เพิ่มความเร็วการผลิต
  //   [C] ลดต้นทุน
  //   [D] ปรับปรุงคุณภาพสินค้า
  //   [E] ออกแบบแม่พิมพ์
  //   [F] อื่นๆ

  // กรณี: "เช็ค", "ตรวจสอบ"
  // → แสดงตัวเลือก A-E:
  //   [A] ตรวจสอบพารามิเตอร์เครื่อง
  //   [B] ตรวจสอบคุณภาพชิ้นงาน
  //   [C] ตรวจสอบแม่พิมพ์
  //   [D] ตรวจสอบประสิทธิภาพการผลิต
  //   [E] อื่นๆ

  // กรณี: ทั่วไป
  // → แสดงตัวเลือก A-G:
  //   [A] แก้ปัญหาข้อบกพร่อง
  //   [B] คำนวณค่าต่างๆ
  //   [C] ตั้งค่าพารามิเตอร์
  //   [D] ออกแบบแม่พิมพ์
  //   [E] เลือกวัสดุ
  //   [F] ความรู้ทั่วไป
  //   [G] อื่นๆ
}
```

### **3. ตรวจจับคำตอบจากผู้ใช้**

```javascript
isClarificationResponse(text) {
  // รองรับรูปแบบ:
  // - "A", "B", "C"
  // - "[A]", "[B]", "[C]"
  // - "ตัวเลือก A"
  // - "เลือก A"
  // - "option A"
  // - "A. รายละเอียดเพิ่มเติม"

  return { isResponse: true, option: 'A' }
}
```

### **4. ปรับคำถามให้ชัดเจนขึ้น**

```javascript
enhanceQueryFromOption(originalQuery, option, followUpText) {
  const optionMap = {
    'A': 'ลดของเสีย แก้ปัญหาข้อบกพร่องชิ้นงาน',
    'B': 'เพิ่มความเร็วการผลิต ลด cycle time',
    'C': 'ลดต้นทุนการผลิต',
    'D': 'ปรับปรุงคุณภาพสินค้า',
    'E': 'ออกแบบแม่พิมพ์',
    'F': 'อื่นๆ'
  };

  // "เช็คระบบเพื่อพัฒนา" + Option A
  // → "เช็คระบบเพื่อพัฒนา (โดยเฉพาะ: ลดของเสีย แก้ปัญหาข้อบกพร่องชิ้นงาน)"
}
```

---

## 🔄 Flow ของการทำงาน

### **Scenario 1: คำถามคลุมเครือ**

```
User: "เช็คระบบเพื่อพัฒนา"
  ↓
System: needsClarification()
  ├── Ambiguous Keyword: "เช็ค", "พัฒนา" ✓
  ├── Specific Keyword: ✗
  ├── Very Short: ✗
  ├── Confidence: 50%
  └── Needs Clarification: YES
  ↓
System: generateClarificationPrompt()
  → แสดงตัวเลือก A-F
  ↓
User: "A"
  ↓
System: isClarificationResponse()
  → isResponse: true, option: 'A'
  ↓
System: enhanceQueryFromOption()
  → "เช็คระบบเพื่อพัฒนา (โดยเฉพาะ: ลดของเสีย แก้ปัญหาข้อบกพร่องชิ้นงาน)"
  ↓
System: ประมวลผลด้วย Multi-Agent System
  → SUCCESS ✓
```

### **Scenario 2: คำถามชัดเจน**

```
User: "วิธีแก้ short shot ใน ABS อย่างไร"
  ↓
System: needsClarification()
  ├── Ambiguous Keyword: ✗
  ├── Specific Keyword: "short shot", "ABS" ✓
  ├── Confidence: 100%
  └── Needs Clarification: NO
  ↓
System: ประมวลผลด้วย Multi-Agent System ทันที
  → SUCCESS ✓
```

---

## 📂 ตำแหน่งในโค้ด

### **Location**: `functions/index.js`

### **1. Class Definition** (บรรทัด 750-946)
```javascript
class QueryClarificationModule {
  constructor() { ... }
  needsClarification(text, userLevel, questionType) { ... }
  generateClarificationPrompt(text, analysis) { ... }
  isClarificationResponse(text) { ... }
  enhanceQueryFromOption(originalQuery, option, followUpText) { ... }
}

const queryClarification = new QueryClarificationModule();
```

### **2. Integration in getGeminiResponse** (บรรทัด 3135-3164)

**Step 2.1: ตรวจสอบคำตอบจาก Clarification**
```javascript
// บรรทัด 3135-3164
let enhancedQuery = cleanText;
const clarificationResponse = queryClarification.isClarificationResponse(cleanText);

if (clarificationResponse.isResponse && validHistory.length > 0) {
  // ปรับคำถามให้ชัดเจนขึ้น
  enhancedQuery = queryClarification.enhanceQueryFromOption(...);
}
```

**Step 2.2: วิเคราะห์ความต้องการ Clarification**
```javascript
// บรรทัด 3187-3220
const clarificationAnalysis = queryClarification.needsClarification(
  enhancedQuery,
  userLevel,
  questionType
);

if (clarificationAnalysis.needsClarification && !isSuperAdmin) {
  const clarificationPrompt = queryClarification.generateClarificationPrompt(...);

  return {
    text: clarificationPrompt,
    metadata: {
      requiresClarification: true,
      confidence: clarificationAnalysis.confidence
    }
  };
}
```

**Step 2.3: ใช้ Enhanced Query ทั้งระบบ**
```javascript
// แทนที่ cleanText ด้วย enhancedQuery ใน:
// - analyzeEnhancedContext()
// - detectUserLevel()
// - detectQuestionType()
// - getRelevantMemories()
// - generateKey()
// - analyzeProblem()
// - createAgentEnhancedPrompt()
```

---

## 📊 ผลลัพธ์ที่คาดหวัง

### **ก่อนใช้ Query Clarification:**
```
User: "เช็คระบบเพื่อพัฒนา"
→ System Failure (Quality Score: 0%, Confidence: 50%)
```

### **หลังใช้ Query Clarification:**
```
User: "เช็คระบบเพื่อพัฒนา"
→ System: "คุณต้องการพัฒนาในด้านใดครับ? [A-F]"
→ User: "A"
→ System: ประมวลผลสำเร็จ ✓ (Quality Score: >80%, Confidence: >90%)
```

### **ROI:**
- ✅ ลดอัตราการประมวลผลล้มเหลว >80%
- ✅ เพิ่ม User Satisfaction อย่างมีนัยสำคัญ
- ✅ ลดภาระของ Multi-Agent System
- ✅ ปรับปรุงประสบการณ์ผู้ใช้ระดับ beginner/intermediate

---

## 🎯 Ambiguous Keywords ที่ตรวจจับ

### **ภาษาไทย:**
- พัฒนา
- ปรับปรุง
- เช็ค
- ดู
- ตรวจสอบ
- วิเคราะห์
- ช่วย
- แนะนำ

### **ภาษาอังกฤษ:**
- develop
- improve
- check
- analyze
- review
- inspect
- help
- suggest
- recommend

---

## 🔍 Specific Keywords ที่บ่งชี้ความชัดเจน

### **Defects (ข้อบกพร่อง):**
- short shot, warpage, flash, sink mark, weld line
- burn mark, jetting, silver streak, splay, delamination
- รอยไหม้, ฉีดไม่เต็ม, บิดงอ, เนื้อล้น, ตาปลา, รอยต่อ

### **Parameters (พารามิเตอร์):**
- temperature, pressure, speed, time, cycle time
- injection speed, holding pressure, cooling time
- อุณหภูมิ, แรงดัน, ความเร็ว, เวลา

### **Materials (วัสดุ):**
- pp, pe, abs, pc, pa, pom, pet, ps
- tpu, tpe, pvc, pmma, pei, pes

### **Calculations (การคำนวณ):**
- คำนวณ, calculate, สูตร, formula
- shot weight, clamping force, projected area

### **Design (การออกแบบ):**
- gate design, runner design, cooling channel, venting
- draft angle, wall thickness, ออกแบบเกต, ออกแบบรันเนอร์

---

## ⚙️ Configuration

### **Confidence Threshold:**
```javascript
this.clarificationThreshold = 0.7; // 70%
```

### **Weight System:**
```javascript
if (hasAmbiguousKeyword) confidenceScore -= 0.3;
if (!hasSpecificKeyword) confidenceScore -= 0.2;
if (isVeryShort) confidenceScore -= 0.2;
if (isGeneralQuestion) confidenceScore -= 0.1;
```

### **User Level Filter:**
```javascript
// ใช้ Clarification เฉพาะ beginner และ intermediate
// Super Admin จะไม่เจอ Clarification Prompt
(userLevel === 'beginner' || userLevel === 'intermediate')
```

---

## 🧪 ตัวอย่างการใช้งาน

### **ตัวอย่าง 1: คำถามคลุมเครือ**
```
Input: "ปรับปรุงระบบ"
Confidence: 40%
Output: Clarification Prompt (ตัวเลือก A-F)
```

### **ตัวอย่าง 2: คำถามชัดเจน**
```
Input: "วิธีแก้ short shot ใน PP"
Confidence: 100%
Output: Direct Processing (ไม่ต้อง Clarify)
```

### **ตัวอย่าง 3: คำตอบจาก Clarification**
```
Input: "A"
Detection: isResponse = true, option = 'A'
Output: Enhanced Query
```

---

## 📈 Monitoring

### **Logs ที่เพิ่มเข้ามา:**

```javascript
console.log(`\n✅ CLARIFICATION RESPONSE DETECTED [${executionId}]:`);
console.log(`├── Original Query: ${originalQuestion}`);
console.log(`├── User Selected: Option ${clarificationResponse.option}`);
console.log(`└── Enhanced Query: ${enhancedQuery}`);

console.log(`\n🔍 QUERY CLARIFICATION ANALYSIS [${executionId}]:`);
console.log(`├── Needs Clarification: ${clarificationAnalysis.needsClarification}`);
console.log(`├── Confidence: ${Math.round(clarificationAnalysis.confidence * 100)}%`);
console.log(`├── Reasons:`, clarificationAnalysis.reasons);

console.log(`⚠️ QUERY TOO AMBIGUOUS - REQUESTING CLARIFICATION [${executionId}]`);
```

### **Metadata ที่เพิ่มเข้ามา:**

```javascript
metadata: {
  requiresClarification: true,
  confidence: clarificationAnalysis.confidence,
  clarificationReasons: clarificationAnalysis.reasons,
  processingType: 'clarification_request'
}
```

---

## 🚀 การ Deploy

### **ไฟล์ที่เปลี่ยนแปลง:**
- `functions/index.js` (เพิ่ม 200+ บรรทัด)

### **การทดสอบก่อน Deploy:**

```bash
# ทดสอบ locally
cd functions
npm run serve

# ทดสอบด้วยคำถามคลุมเครือ
curl -X POST http://localhost:5001/appinjproject/us-central1/getGeminiResponse \
  -H "Content-Type: application/json" \
  -d '{"text":"เช็คระบบเพื่อพัฒนา","userId":"test","userName":"Test User"}'
```

### **Deploy:**

```bash
cd functions
firebase deploy --only functions:getGeminiResponse
```

---

## 📞 Support

หากพบปัญหา:
1. ตรวจสอบ [Functions Logs](https://console.firebase.google.com/project/appinjproject/functions/logs)
2. ค้นหา keyword: "QUERY CLARIFICATION", "CLARIFICATION RESPONSE"
3. ตรวจสอบ confidence score และ reasons

---

**Last Updated**: 2025-11-28
**Status**: ✅ Ready to Deploy
**Impact**: High (แก้ไขปัญหา System Failure)
**ROI**: >80% reduction in failed queries
