# 🧪 Hybrid System Testing Guide

**วันที่:** 13 ธันวาคม 2568  
**เวอร์ชัน:** 2.0.0  
**สถานะ:** ✅ พร้อมทดสอบ

---

## 📋 ภาพรวมการทดสอบ

ระบบ Hybrid Intelligence ผสมผสาน:
- 📚 **Local Knowledge** - ความรู้จากฐานข้อมูลท้องถิ่น
- 🤖 **AI Response** - คำตอบจาก AI
- 🎯 **Smart Strategy** - เลือกกลยุทธ์อัตโนมัติ
- 📊 **Confidence Score** - ประเมินความเชื่อมั่น

---

## 🎮 การทดสอบผ่าน LINE Bot

### 1. ทดสอบคำสั่ง Hybrid Test

#### ตัวอย่างที่ 1: ทดสอบวัสดุ ABS
```
พิมพ์: ทดสอบ hybrid ABS รอยยุบ
```

**ผลลัพธ์ที่คาดหวัง:**
- ✅ ตรวจจับวัสดุ: ABS
- ✅ ตรวจจับปัญหา: Sink Mark (รอยยุบ)
- ✅ แสดงข้อมูลจาก Local Knowledge
- ✅ แสดงพารามิเตอร์จาก PLASTIC_MATERIALS_DB
- ✅ แสดง Response Time

#### ตัวอย่างที่ 2: ทดสอบปัญหาฉีดไม่เต็ม
```
พิมพ์: ทดสอบ hybrid PP short shot
```

**ผลลัพธ์ที่คาดหวัง:**
- ✅ ตรวจจับวัสดุ: PP
- ✅ ตรวจจับปัญหา: Short Shot
- ✅ แสดงวิธีแก้จาก TROUBLESHOOTING_GUIDE
- ✅ ค้นหา Local Knowledge ที่เกี่ยวข้อง

#### ตัวอย่างที่ 3: ทดสอบแบบไม่มีข้อมูล
```
พิมพ์: ทดสอบ hybrid XXXX ปัญหาแปลกๆ
```

**ผลลัพธ์ที่คาดหวัง:**
- ⚠️ ไม่พบวัสดุ
- ⚠️ ไม่พบปัญหาที่ตรงกัน
- ✅ แสดงข้อความแนะนำให้ระบุชัดเจนขึ้น

---

## 💻 การทดสอบผ่าน API

### Test Case 1: Hybrid Response - Local Primary

```javascript
// ทดสอบเมื่อมี Local Knowledge มั่นใจสูง
const hyperKnowledge = getHyperLocalizedKnowledge();

const localResults = [
  {
    id: "001",
    problem: "ABS รอยยุบบริเวณหนา",
    solutions: ["ลดอุณหภูมิแม่พิมพ์ 5-10°C", "เพิ่ม Pack Pressure"],
    verificationStatus: "verified",
    useCount: 25,
    relevanceScore: 0.95
  },
  {
    id: "002", 
    problem: "ABS sink mark ที่ริบ",
    solutions: ["เพิ่มเวลา Hold Time", "ใช้ Gate ใหญ่ขึ้น"],
    verificationStatus: "verified",
    useCount: 18,
    relevanceScore: 0.88
  }
];

const aiResponse = `
ABS (Acrylonitrile Butadiene Styrene)
• อุณหภูมิหลอม: 200-260°C (แนะนำ 230°C)
• อุณหภูมิแม่พิมพ์: 40-80°C (แนะนำ 60°C)
• รอยยุบมักเกิดจาก Packing Pressure ไม่เพียงพอ
`;

const hybrid = await hyperKnowledge.createHybridResponse(
  "ABS รอยยุบ",
  localResults,
  aiResponse,
  { materials: ["ABS"], hasFillers: false }
);

console.log("Strategy:", hybrid.strategy); // Expected: "local_primary"
console.log("Confidence:", hybrid.confidence); // Expected: > 0.7
console.log("Response:", hybrid.combinedResponse);
```

**ผลลัพธ์ที่คาดหวัง:**
```json
{
  "strategy": "local_primary",
  "confidence": 0.85,
  "combinedResponse": "📚 **จากประสบการณ์จริงในคลังความรู้:**\n\n1. ABS รอยยุบบริเวณหนา\n   ✅ ลดอุณหภูมิแม่พิมพ์ 5-10°C\n   📊 ใช้ไปแล้ว 25 ครั้ง\n\n2. ABS sink mark ที่ริบ\n   ✅ เพิ่มเวลา Hold Time\n   📊 ใช้ไปแล้ว 18 ครั้ง\n\n🤖 **ข้อมูลเพิ่มเติมจาก AI:**\nABS (Acrylonitrile Butadiene Styrene)...",
  "sources": [
    { "type": "local_knowledge", "count": 2, "verified": 2 },
    { "type": "ai_generated", "length": 200 }
  ]
}
```

---

### Test Case 2: Balanced Hybrid

```javascript
// ทดสอบเมื่อ Local + AI มีความมั่นใจพอๆ กัน
const localResults = [
  {
    problem: "PP warpage ที่ขอบ",
    solutions: ["ปรับเวลา Cooling"],
    verificationStatus: "pending",
    useCount: 3,
    relevanceScore: 0.65
  }
];

const aiResponse = `
PP (Polypropylene) มีการหดตัวสูง 1.0-2.5%
วิธีแก้ warpage:
• ปรับ Mold Temperature ให้สม่ำเสมอ
• ใช้ Cooling Time ที่เพียงพอ
• ตรวจสอบ Gate Location
`;

const hybrid = await hyperKnowledge.createHybridResponse(
  "PP บิดงอ",
  localResults,
  aiResponse
);

console.log("Strategy:", hybrid.strategy); // Expected: "balanced_hybrid"
console.log("Confidence:", hybrid.confidence); // Expected: 0.5-0.7
```

**ผลลัพธ์ที่คาดหวัง:**
```json
{
  "strategy": "balanced_hybrid",
  "confidence": 0.62,
  "combinedResponse": "🎯 **คำแนะนำแบบผสมผสาน:**\n\n💡 **จาก AI Analysis:**\nPP (Polypropylene) มีการหดตัวสูง 1.0-2.5%...\n\n📌 **ประสบการณ์ที่เกี่ยวข้อง:**\n• PP warpage ที่ขอบ"
}
```

---

### Test Case 3: AI Primary

```javascript
// ทดสอบเมื่อ Local Knowledge น้อย แต่ AI มั่นใจสูง
const localResults = []; // ไม่มีข้อมูล Local

const aiResponse = `
PC (Polycarbonate) - วัสดุโปร่งใส ทนแรงกระแทกสูง

พารามิเตอร์แนะนำ:
• อุณหภูมิหลอม: 280-320°C (แนะนำ 300°C)
• อุณหภูมิแม่พิมพ์: 80-120°C (แนะนำ 100°C)
• ต้องอบแห้งที่ 120°C เป็นเวลา 4-6 ชั่วโมง
• ความชื้น < 0.02%

สาเหตุของความขุ่น:
1. ความชื้นในเม็ดพลาสติก
2. อุณหภูมิแม่พิมพ์ต่ำเกินไป
3. Injection Speed เร็วเกินไป
`;

const hybrid = await hyperKnowledge.createHybridResponse(
  "PC ขุ่น",
  localResults,
  aiResponse
);

console.log("Strategy:", hybrid.strategy); // Expected: "ai_primary"
console.log("Confidence:", hybrid.confidence); // Expected: > 0.7
```

---

## 📈 การทดสอบ Learning System

### Test Case 4: Record Feedback

```javascript
// ทดสอบบันทึก Feedback
const knowledgeId = "ABS_SINK_001";
const userId = "U1234567890abcdef";

const feedback = {
  helpful: true,
  rating: 5,
  comment: "แก้ไขได้ผล ขอบคุณครับ"
};

const success = await hyperKnowledge.recordFeedback(
  knowledgeId,
  userId,
  feedback
);

console.log("Feedback recorded:", success); // Expected: true

// ตรวจสอบว่า helpfulVotes เพิ่มขึ้น
const doc = await db.collection("hyper_local_knowledge")
  .doc(knowledgeId)
  .get();
  
console.log("Helpful Votes:", doc.data().helpfulVotes); // Expected: +1
```

---

### Test Case 5: Analyze Knowledge Quality

```javascript
// ทดสอบวิเคราะห์คุณภาพความรู้
const analysis = await hyperKnowledge.analyzeKnowledgeQuality();

console.log("High Performing:", analysis.highPerforming.length);
console.log("Low Quality:", analysis.lowQuality.length);
console.log("Needs Update:", analysis.needsUpdate.length);
console.log("Outdated:", analysis.outdated.length);

// ตัวอย่างผลลัพธ์
/*
{
  highPerforming: [
    { id: "001", qualityScore: 0.92, useCount: 50, helpfulVotes: 12 }
  ],
  lowQuality: [
    { id: "002", qualityScore: 0.25, useCount: 8, helpfulVotes: -2 }
  ],
  needsUpdate: [
    { id: "003", useCount: 15, helpfulVotes: 1 }
  ],
  outdated: [
    { id: "004", daysSinceUpdate: 120 }
  ]
}
*/
```

---

### Test Case 6: Find Duplicate Knowledge

```javascript
// ทดสอบหาความรู้ที่ซ้ำกัน
const duplicates = await hyperKnowledge.findDuplicateKnowledge();

console.log("Found duplicates:", duplicates.length);

duplicates.forEach((dup) => {
  console.log(`Similarity: ${dup.similarity.toFixed(2)}`);
  console.log(`Item 1: ${dup.item1.problem}`);
  console.log(`Item 2: ${dup.item2.problem}`);
  console.log("---");
});

// ตัวอย่างผลลัพธ์
/*
Similarity: 0.87
Item 1: ABS รอยยุบบริเวณหนา
Item 2: ABS sink mark ตรงส่วนที่หนา
---
Similarity: 0.91
Item 1: PP บิดงอหลังออกจากแม่พิมพ์
Item 2: PP warpage หลังจากฉีด
---
*/
```

---

### Test Case 7: Build Knowledge Graph

```javascript
// ทดสอบสร้าง Knowledge Graph
const knowledgeId = "ABS_SINK_001";
const graph = await hyperKnowledge.buildKnowledgeGraph(knowledgeId);

console.log("Knowledge Graph:", JSON.stringify(graph, null, 2));

// ตัวอย่างผลลัพธ์
/*
{
  "id": "ABS_SINK_001",
  "problem": "ABS รอยยุบบริเวณหนา",
  "relatedKnowledge": [
    {
      "id": "ABS_SINK_002",
      "problem": "ABS sink mark ที่ริบ",
      "relevance": 0.85
    },
    {
      "id": "ABS_WARP_001",
      "problem": "ABS บิดงอ",
      "relevance": 0.62
    }
  ],
  "relatedMaterials": ["ABS"],
  "relatedDefects": ["SINK_MARK"]
}
*/
```

---

## 🔍 การทดสอบ Confidence Calculation

### Test Case 8: Local Confidence

```javascript
// ทดสอบคำนวณ Local Confidence
const localResults = [
  { relevanceScore: 0.95, verificationStatus: "verified", useCount: 25 },
  { relevanceScore: 0.88, verificationStatus: "verified", useCount: 18 },
  { relevanceScore: 0.75, verificationStatus: "pending", useCount: 5 },
];

const confidence = hyperKnowledge._calculateLocalConfidence(localResults);
console.log("Local Confidence:", confidence.toFixed(2));

// Expected: 0.70-0.80 (สูง เพราะมี verified items และ use count ดี)
```

---

### Test Case 9: AI Confidence

```javascript
// ทดสอบ AI Confidence - มีข้อมูลเฉพาะเจาะจง
const aiResponse1 = `
ABS: อุณหภูมิ 230°C, แรงดัน 80 MPa
Sink Mark: ลด mold temp 5-10°C
`;

const confidence1 = hyperKnowledge._calculateAIConfidence(aiResponse1, "ABS");
console.log("AI Confidence (Specific):", confidence1.toFixed(2));
// Expected: 0.70-0.80

// ทดสอบ AI Confidence - คำตอบไม่แน่ใจ
const aiResponse2 = `
อาจจะเป็นปัญหาจากความดัน บางทีอาจเป็นอุณหภูมิ
ลองปรับดูไหมครับ
`;

const confidence2 = hyperKnowledge._calculateAIConfidence(aiResponse2, "test");
console.log("AI Confidence (Uncertain):", confidence2.toFixed(2));
// Expected: 0.30-0.40
```

---

## 📊 ตารางเปรียบเทียบ Strategy

| Strategy | Local Confidence | AI Confidence | Use Case |
|----------|------------------|---------------|----------|
| **local_primary** | ≥ 0.7 | Any | มีข้อมูล Local มากและน่าเชื่อถือ |
| **balanced_hybrid** | 0.4-0.7 | ≥ 0.6 | Local + AI มีคุณภาพพอๆ กัน |
| **ai_primary** | < 0.4 | ≥ 0.7 | Local น้อย แต่ AI มั่นใจ |
| **best_effort** | < 0.4 | < 0.7 | ข้อมูลทั้ง 2 ฝ่ายไม่มั่นใจมาก |

---

## ✅ Checklist การทดสอบ

### ฟีเจอร์หลัก
- [ ] ทดสอบ Hybrid Test ผ่าน LINE Bot
- [ ] ทดสอบทุก Strategy (4 แบบ)
- [ ] ทดสอบ Confidence Calculation
- [ ] ทดสอบ Feedback System
- [ ] ทดสอบ Quality Analysis

### ฟีเจอร์ Learning
- [ ] บันทึก Feedback ได้
- [ ] วิเคราะห์ Quality ได้
- [ ] หา Duplicate ได้
- [ ] สร้าง Knowledge Graph ได้
- [ ] Usage Logs บันทึกถูกต้อง

### Edge Cases
- [ ] ไม่มี Local Knowledge
- [ ] ไม่มี AI Response
- [ ] Query ไม่ตรงกับอะไรเลย
- [ ] Error Handling
- [ ] Fallback Response

---

## 🐛 การ Debug

### เปิด Debug Mode
```javascript
// ใน index.js บรรทัด ~11109
console.log(`🔬 DEBUG: cmd = "${cmd}"`);
console.log(`🔬 DEBUG: Hybrid Test Command!`);
```

### ดู Firestore Logs
```javascript
// ตรวจสอบ Collection
db.collection("hybrid_usage_logs")
db.collection("knowledge_feedback")
db.collection("hyper_local_knowledge")
```

### ตรวจสอบ Response Time
```javascript
const startTime = Date.now();
// ... ทำงาน ...
const responseTime = Date.now() - startTime;
console.log(`⏱️ Response Time: ${responseTime}ms`);
```

---

## 🎯 เป้าหมายการทดสอบ

### Performance
- Response Time < 2000ms
- Local Confidence Accuracy > 80%
- AI Confidence Accuracy > 75%

### Quality
- Strategy Selection Accuracy > 90%
- User Satisfaction (Helpful Votes) > 70%
- Duplicate Detection Accuracy > 85%

---

## 📝 หมายเหตุ

1. **Local Knowledge ต้องมีอย่างน้อย 10 รายการ** ในฐานข้อมูลก่อนทดสอบ
2. **Firestore Rules ต้องอนุญาต** การเขียนข้อมูลใน Collections ที่เกี่ยวข้อง
3. **ทดสอบใน Production** ควรใช้ Test Account แยกต่างหาก
4. **Backup ข้อมูล** ก่อนทดสอบฟีเจอร์ที่แก้ไขฐานข้อมูล

---

## 🚀 Next Steps

หลังทดสอบเสร็จ:
1. ✅ Deploy to Production
2. ✅ Monitor Performance
3. ✅ Collect User Feedback
4. ✅ Analyze Usage Patterns
5. ✅ Improve Algorithms

---

**สร้างโดย:** AI Assistant  
**อัปเดตล่าสุด:** 13 ธันวาคม 2568
