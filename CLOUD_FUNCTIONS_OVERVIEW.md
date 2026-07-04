# ☁️ Cloud Functions Overview

## 📊 สรุประบบ Cloud Functions

### 📁 โครงสร้างไฟล์หลัก:

```
functions/
├── index.js                      (4,323 บรรทัด) - หลักของระบบ
├── oracle_core_integration.js    (39 บรรทัด)   - Vector DB Integration
├── VectorKnowledgeService.js     (82 บรรทัด)   - Pinecone Service
└── package.json                  - Dependencies
```

**รวม: 4,444 บรรทัดโค้ด**

---

## 🔧 Cloud Functions ที่มีอยู่:

### 1. **getGeminiResponse** 🧠 (Main Function)
**Location**: `index.js:2877`

**Purpose**: ระบบ AI Chat หลักที่ใช้ Google Gemini AI

**Features**:
- ✅ **Advanced Conversation Memory System** - จดจำบริบทการสนทนา
- ✅ **Multi-tier Context System** - จัดการ context หลายชั้น
- ✅ **Vector Knowledge Integration** - ใช้ Pinecone สำหรับค้นหาความรู้
- ✅ **Smart Question Detection** - วิเคราะห์ประเภทคำถาม
- ✅ **User Level Adaptation** - ปรับคำตอบตาม expertise level
- ✅ **Problem-Solving Mode** - โหมดแก้ปัญหาเชิงลึก
- ✅ **Citation Support** - อ้างอิงแหล่งที่มา
- ✅ **Rate Limiting** - จำกัดการใช้งาน
- ✅ **Subscription Management** - ตรวจสอบ subscription

**Request Parameters**:
```javascript
{
  text: string,              // คำถามของผู้ใช้
  userId: string,            // UID จาก Firebase Auth
  userName: string,          // ชื่อผู้ใช้
  isSuperAdmin: boolean,     // สถานะ Super Admin
  adminMode: string,         // โหมด (system_management, ai_training, etc.)
  requireTechnicalDepth: string,
  skipBasicExplanations: boolean,
  sessionId: string          // Session ID สำหรับจดจำบริบท
}
```

**Response**:
```javascript
{
  text: string,              // คำตอบจาก AI
  metadata: {
    model: string,           // Model ที่ใช้
    tokensUsed: number,
    processingTime: number,
    contextUsed: boolean,
    memoryUsed: boolean,
    relevantKnowledge: array,
    questionType: string,
    confidence: number
  }
}
```

---

### 2. **healthCheck** 🏥
**Location**: `index.js:4168`

**Purpose**: ตรวจสอบสุขภาพของระบบ

**Features**:
- ✅ ตรวจสอบ Firestore connection
- ✅ ตรวจสอบ Gemini AI availability
- ✅ ตรวจสอบ Vector DB status
- ✅ System metrics

**Response**:
```javascript
{
  status: "healthy" | "degraded" | "down",
  timestamp: string,
  services: {
    firestore: boolean,
    geminiAI: boolean,
    vectorDB: boolean
  },
  metrics: {
    uptime: number,
    memory: object,
    responseTime: number
  }
}
```

---

### 3. **submitFeedback** 📝
**Location**: `index.js:4245`

**Purpose**: รับ feedback จากผู้ใช้

**Features**:
- ✅ บันทึก feedback ลง Firestore
- ✅ ติดตาม session ID
- ✅ วิเคราะห์ sentiment

**Request Parameters**:
```javascript
{
  userId: string,
  sessionId: string,
  rating: number,           // 1-5
  feedback: string,
  questionId: string
}
```

---

### 4. **manageMemory** 🧠
**Location**: `index.js:4110`

**Purpose**: จัดการ AI Memory (สำหรับ Super Admin)

**Features**:
- ✅ View all memories
- ✅ Clear specific memory
- ✅ Export memory data
- ✅ Analyze patterns

**Request Parameters**:
```javascript
{
  action: "view" | "clear" | "export" | "analyze",
  userId: string,            // Optional
  memoryId: string,          // Optional
  filters: object            // Optional
}
```

---

## 🧠 Conversation Memory System

### Class: **ConversationMemory**

**Location**: `index.js:16-970`

**Features**:

#### 1. **saveConversationMemory()**
บันทึกการสนทนาพร้อม metadata:
- ✅ Extract entities (materials, defects, parameters, machines)
- ✅ Extract keywords
- ✅ Detect topics
- ✅ Estimate satisfaction
- ✅ Detect if problem was solved
- ✅ Suggest follow-up questions

**Firestore Structure**:
```
conversation_memory/
  {userId}/
    memories/
      {memoryId}/
        - question: string
        - answer: string
        - entities: {materials, defects, parameters, machines, processes}
        - keywords: array
        - topics: array
        - questionType: string
        - userLevel: string
        - problemSolved: boolean
        - satisfactionIndicator: number
        - timestamp: Timestamp
```

#### 2. **getRelevantMemories()**
ดึงประวัติที่เกี่ยวข้องจาก:
- ✅ Entity matching
- ✅ Keyword matching
- ✅ Topic similarity
- ✅ Relevance scoring (> 0.3)

#### 3. **formatMemoryContext()**
จัดรูปแบบ context สำหรับ AI:
```
🧠 **ความจำจากการสนทนาก่อนหน้า:**

**[1] 2 ชั่วโมงที่แล้ว** (เกี่ยวข้อง 85%)
   📦 วัสดุ: PP, PE | ปัญหา: short shot
   ❓ "วิธีแก้ short shot ใน PP อย่างไร?"
```

---

## 🎯 Vector Knowledge System (Pinecone)

### File: **VectorKnowledgeService.js** (82 บรรทัด)

**Purpose**: จัดการ Vector Database สำหรับค้นหาความรู้

**Features**:

#### 1. **initialize()**
- เชื่อมต่อ Pinecone
- สร้าง index (ถ้ายังไม่มี)
- Dimension: 768 (Gemini embeddings)
- Metric: cosine similarity

#### 2. **upsertKnowledge()**
```javascript
await vectorKnowledge.upsertKnowledge(
  id,        // Unique ID
  vector,    // 768-dim embedding
  metadata   // {text, source, category, ...}
);
```

#### 3. **queryKnowledge()**
```javascript
const results = await vectorKnowledge.queryKnowledge(
  questionVector,  // 768-dim embedding
  topK: 5          // จำนวนผลลัพธ์
);
```

**Returns**:
```javascript
[
  {
    id: string,
    score: number,        // 0-1 (similarity)
    metadata: {
      text: string,
      source: string,
      category: string,
      timestamp: Date
    }
  }
]
```

---

### File: **oracle_core_integration.js** (39 บรรทัด)

**Purpose**: Bridge ระหว่าง main logic กับ Vector DB

**Function**: `getRelevantKnowledgeFromVectorDB()`

**Process**:
1. สร้าง embedding จากคำถาม (ใช้ Gemini embedding-001)
2. Query Pinecone ด้วย vector
3. Format ผลลัพธ์พร้อม relevance score

**Returns**:
```javascript
[
  {
    id: string,
    relevanceScore: number,
    text: string,
    source: string,
    category: string,
    timestamp: Date
  }
]
```

---

## 📦 Dependencies

### Main Dependencies:
```json
{
  "@google/generative-ai": "^0.24.1",      // Gemini AI
  "@pinecone-database/pinecone": "^2.2.0", // Vector DB
  "firebase-admin": "^12.0.0",             // Firebase Admin SDK
  "firebase-functions": "^5.0.0"           // Cloud Functions v2
}
```

### Node Version:
- **Node.js 20** (LTS)

---

## 🔐 Environment Variables Required

```env
# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Pinecone Vector DB
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=your_pinecone_environment
PINECONE_INDEX_NAME=injection-molding-knowledge

# Firebase (auto-configured)
FIREBASE_CONFIG=auto
```

---

## 🚀 การ Deploy

### Deploy ทั้งหมด:
```bash
cd functions
npm install
firebase deploy --only functions
```

### Deploy function เดียว:
```bash
firebase deploy --only functions:getGeminiResponse
firebase deploy --only functions:healthCheck
firebase deploy --only functions:submitFeedback
firebase deploy --only functions:manageMemory
```

### ดู Logs:
```bash
firebase functions:log
```

### Test Locally:
```bash
npm run serve
```

---

## 📊 Performance Metrics

### เวลาประมวลผล (เฉลี่ย):
- ✅ Simple question: 1-2 วินาที
- ✅ Complex question: 3-5 วินาที
- ✅ With memory context: +0.5-1 วินาที
- ✅ With vector knowledge: +1-2 วินาที

### Token Usage:
- ✅ Input tokens: 500-2,000 tokens
- ✅ Output tokens: 500-1,500 tokens
- ✅ Context tokens: 1,000-5,000 tokens (รวม memory + knowledge)

### Rate Limits:
- ✅ Free users: 10 questions/day
- ✅ Premium users: Unlimited
- ✅ Super Admin: Unlimited + priority

---

## 🔍 Monitoring & Debugging

### Firebase Console:
- 📊 [Functions Dashboard](https://console.firebase.google.com/project/appinjproject/functions)
- 📈 [Logs](https://console.firebase.google.com/project/appinjproject/functions/logs)
- 💰 [Usage](https://console.firebase.google.com/project/appinjproject/usage)

### Pinecone Console:
- 🧠 [Vector DB Dashboard](https://app.pinecone.io)
- 📊 Query statistics
- 💾 Storage usage

### Gemini AI:
- 🤖 [Google AI Studio](https://aistudio.google.com)
- 💳 API usage & billing

---

## ⚠️ Known Issues & Limitations

### 1. **Vector DB ไม่ได้ initialize ทุกครั้ง**
- **สาเหตุ**: Cold start ของ Cloud Functions
- **Impact**: ไม่มี knowledge retrieval ในครั้งแรก
- **Solution**: มี fallback mechanism

### 2. **Memory Query ช้าเมื่อมี > 1,000 memories**
- **สาเหตุ**: Firestore query limit
- **Solution**: ใช้ pagination และ indexing

### 3. **Gemini API Rate Limits**
- **Limit**: 60 requests/minute (free tier)
- **Solution**: Implement queue system

---

## 🎯 Recommendations

### ปรับปรุงที่แนะนำ:

1. ✅ **เพิ่ม Caching Layer**
   - Cache คำตอบที่ถามบ่อย
   - ลด API calls ได้ 30-50%

2. ✅ **Implement Request Queue**
   - จัดการ rate limits ดีขึ้น
   - Prevent throttling

3. ✅ **Add Analytics**
   - Track question types
   - Measure satisfaction
   - Identify knowledge gaps

4. ✅ **Optimize Memory Storage**
   - Archive old memories
   - Implement compression
   - Use background cleanup

5. ✅ **Add A/B Testing**
   - Test different prompts
   - Measure response quality
   - Optimize for user satisfaction

---

## 📞 Support

หากพบปัญหา:
1. ตรวจสอบ [Functions Logs](https://console.firebase.google.com/project/appinjproject/functions/logs)
2. ตรวจสอบ Environment Variables
3. ทดสอบด้วย `healthCheck` function
4. ดู error logs ใน Firebase Console

---

**Last Updated**: 2025-01-28
**Total Lines of Code**: 4,444
**Functions Count**: 4 (exported)
**Status**: ✅ Production Ready
