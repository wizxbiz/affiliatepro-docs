/**
 * 🌾 Farm Accounting & 🏪 Retail Shop Accounting System
 * ระบบบัญชี "พิมพ์/พูด เพื่อจดบัญชี" บน LINE (Ultra Powerful AI Edition)
 *
 * Features:
 * - บันทึกรายรับ/รายจ่าย ด้วยภาษาธรรมชาติ (Advanced NLP)
 * - รองรับการระบุเวลา: "เมื่อวาน", "วันนี้", "3 วันก่อน", "อาทิตย์ที่แล้ว"
 * - Flex Message Reports: สรุปยอดสวยงาม พร้อมกราฟแท่งจำลอง
 * - Quick Actions: ลบรายการ, ดูสรุปทันที
 * - 🆕 AI INSIGHTS: วิเคราะห์พฤติกรรมการใช้จ่าย
 * - 🆕 SMART ALERTS: แจ้งเตือนเมื่อใช้จ่ายผิดปกติ
 * - 🆕 BUDGETING: ตั้งงบประมาณและติดตาม
 * - 🆕 RECURRING: รายการประจำอัตโนมัติ
 * - 🆕 MULTI-WALLET: จัดการหลายกระเป๋าเงิน
 * - 🆕 GOALS: ตั้งเป้าหมายออมเงิน
 * - 🆕 EXPORT: ส่งออก Excel/PDF
 * - 🆕 VOICE MEMO: บันทึกเสียงเป็นรายการ
 * - 🆕 PHOTO RECEIPT: ถ่ายรูปใบเสร็จ AI อ่านให้
 * - 🆕 TRENDS: วิเคราะห์แนวโน้ม
 *
 * @author WiT AI Assistant
 * @version 3.0.0 (Ultra Powerful AI Edition)
 */

const { getFirestore, FieldValue } = require("firebase-admin/firestore");

// ==========================================
// � FREEMIUM QUOTA SETTINGS
// ==========================================
const FREE_ACCOUNTING_LIMIT = 30; // รายการต่อเดือนสำหรับ Free users

// ==========================================
// �📊 CATEGORY DEFINITIONS
// ==========================================

const FARM_CATEGORIES = {
  income: {
    "ขายผลผลิต": ["ขาย", "ส่ง", "ส่งออก", "จำหน่าย", "ราคา"],
    "ขายพืช": ["มะม่วง", "ทุเรียน", "มังคุด", "ลำไย", "ลิ้นจี่", "เงาะ", "มะพร้าว", "ยางพารา", "ปาล์ม", "ข้าว", "ข้าวโพด", "มันสำปะหลัง", "อ้อย", "ผัก", "พริก", "มะเขือ", "ถั่ว", "กล้วย", "ส้ม", "มะนาว"],
    "ขายสัตว์": ["หมู", "ไก่", "เป็ด", "วัว", "ควาย", "ปลา", "กุ้ง", "ปู", "ไข่"],
    "ขายนม": ["นม", "น้ำนม"],
    "เงินอุดหนุน": ["อุดหนุน", "ชดเชย", "ประกัน", "เยียวยา", "โครงการ"],
    "รับจ้าง": ["รับจ้าง", "ไถนา", "ฉีดยา", "เกี่ยวข้าว"],
    "อื่นๆ": [],
  },
  expense: {
    "ปุ๋ย/ฮอร์โมน": ["ปุ๋ย", "ยูเรีย", "สูตร", "NPK", "ปุ๋ยคอก", "ปุ๋ยหมัก", "ฮอร์โมน", "อาหารเสริม"],
    "ยา/สารเคมี": ["ยา", "ฆ่าแมลง", "กำจัดศัตรูพืช", "สารเคมี", "ฉีดยา", "ยาฆ่าหญ้า", "กำจัดวัชพืช", "ราวด์อัพ"],
    "พันธุ์พืช/สัตว์": ["เมล็ด", "พันธุ์", "กล้า", "ต้นกล้า", "ลูกปลา", "ลูกกุ้ง", "ลูกไก่"],
    "อาหารสัตว์": ["อาหารสัตว์", "อาหารหมู", "อาหารไก่", "อาหารปลา", "หัวอาหาร", "รำ", "ปลายข้าว"],
    "พลังงาน": ["น้ำมัน", "ดีเซล", "เบนซิน", "แก๊ส", "เติมน้ำมัน", "ค่าไฟ", "ไฟฟ้า"],
    "ค่าแรง": ["ค่าแรง", "จ้าง", "ลูกจ้าง", "คนงาน", "เก็บเกี่ยว", "ตัดหญ้า", "ฉีดพ่น", "แรงงาน"],
    "น้ำ": ["ค่าน้ำ", "น้ำประปา", "สูบน้ำ", "น้ำมันเครื่องสูบ"],
    "ซ่อมบำรุง": ["ซ่อม", "บำรุง", "เปลี่ยน", "ซ่อมแซม", "อะไหล่", "ยางรถ"],
    "อุปกรณ์": ["เครื่องมือ", "อุปกรณ์", "จอบ", "เสียม", "พลั่ว", "สายยาง", "ถัง", "ตาข่าย"],
    "ค่าเช่า": ["ค่าเช่า", "เช่าที่", "เช่านา"],
    "การเงิน": ["ดอกเบี้ย", "ธกส", "สหกรณ์", "ผ่อน"],
    "อื่นๆ": [],
  },
};

const RETAIL_CATEGORIES = {
  income: {
    "ขายสินค้า": ["ขาย", "ได้เงิน", "รับเงิน", "ลูกค้าจ่าย", "หน้าร้าน", "ยอดขาย"],
    "ขายส่ง": ["ขายส่ง", "ส่งของ", "ออเดอร์", "ยกโหล"],
    "ขายออนไลน์": ["shopee", "lazada", "tiktok", "facebook", "ig", "ออนไลน์"],
    "รับโอน": ["โอนเข้า", "รับโอน", "เงินเข้า"],
    "อื่นๆ": [],
  },
  expense: {
    "ซื้อสินค้า": ["ซื้อ", "สั่งของ", "สต๊อก", "เข้าของ", "รับของ", "เติมของ", "ของกิน", "ต้นทุน"],
    "ค่าเช่า": ["ค่าเช่า", "เช่าร้าน", "เช่าที่", "ค่าห้อง"],
    "สาธารณูปโภค": ["ค่าน้ำ", "น้ำประปา", "ค่าไฟ", "ไฟฟ้า", "ค่าเน็ต", "ค่าโทร", "อินเตอร์เน็ต", "wifi"],
    "ค่าแรง": ["ค่าแรง", "เงินเดือน", "พนักงาน", "ลูกจ้าง", "โอที", "จ้างงาน"],
    "ขนส่ง": ["ขนส่ง", "ค่าส่ง", "ค่ารถ", "น้ำมัน", "ไปรษณีย์", "kerry", "flash", "grab", "lalamove"],
    "อุปกรณ์/บรรจุภัณฑ์": ["อุปกรณ์", "ถุง", "กล่อง", "เทป", "ป้าย", "สติ๊กเกอร์", "ซองไปรษณีย์"],
    "ซ่อมบำรุง": ["ซ่อม", "บำรุง", "แอร์", "ตู้แช่", "คอม", "เครื่องพิมพ์"],
    "การตลาด": ["โฆษณา", "ยิงแอด", "โปรโมท", "แจก", "ads", "boost"],
    "ค่าธรรมเนียม": ["ค่าธรรมเนียม", "ค่าบริการ", "ค่าโอน", "ค่าปรับ", "commission"],
    "วัตถุดิบ": ["วัตถุดิบ", "ส่วนผสม", "เครื่องปรุง"],
    "อื่นๆ": [],
  },
};

// ==========================================
// � RETAIL SHOP FUNCTIONS
// ==========================================

/**
 * คำนวณกำไรร้านค้า (รายวัน/เดือน)
 */
async function getShopProfit(userId, period = "today") {
  const db = getFirestore();
  const now = new Date();

  let startDate, endDate;

  switch (period) {
    case "today":
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = now;
      break;
    case "yesterday":
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "week":
      const day = now.getDay();
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + (day === 0 ? -6 : 1));
      endDate = now;
      break;
    case "month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = now;
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = now;
  }

  const startDateStr = startDate.toISOString().split("T")[0];
  const endDateStr = endDate.toISOString().split("T")[0];

  const snapshot = await db.collection("accounting_transactions")
    .where("userId", "==", userId)
    .where("date", ">=", startDateStr)
    .where("date", "<=", endDateStr)
    .get();

  let sales = 0;        // ยอดขาย
  let cost = 0;         // ต้นทุนสินค้า
  let expenses = 0;     // ค่าใช้จ่ายอื่นๆ
  let transactions = 0;

  // หมวดที่ถือเป็นต้นทุนสินค้า
  const costCategories = ["ซื้อสินค้า", "วัตถุดิบ", "ต้นทุน"];
  // หมวดที่ถือเป็นยอดขาย
  const salesCategories = ["ขายสินค้า", "ขายส่ง", "ขายออนไลน์"];

  snapshot.forEach((doc) => {
    const data = doc.data();
    transactions++;

    if (data.type === "income") {
      if (salesCategories.some((cat) => data.category?.includes(cat))) {
        sales += data.amount;
      } else {
        sales += data.amount; // รายรับอื่นๆ ถือเป็นยอดขายด้วย
      }
    } else {
      if (costCategories.some((cat) => data.category?.includes(cat))) {
        cost += data.amount;
      } else {
        expenses += data.amount;
      }
    }
  });

  const grossProfit = sales - cost;          // กำไรขั้นต้น
  const netProfit = grossProfit - expenses;  // กำไรสุทธิ
  const profitMargin = sales > 0 ? Math.round((netProfit / sales) * 100) : 0;

  return {
    period,
    periodText: period === "today" ? "วันนี้" : period === "yesterday" ? "เมื่อวาน" : period === "week" ? "สัปดาห์นี้" : "เดือนนี้",
    sales,
    cost,
    expenses,
    grossProfit,
    netProfit,
    profitMargin,
    transactions,
    startDate: startDateStr,
    endDate: endDateStr,
  };
}

/**
 * สรุปยอดขายตามช่องทาง
 */
async function getSalesByChannel(userId, period = "month") {
  const db = getFirestore();
  const now = new Date();

  let startDate;
  if (period === "today") {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (period === "week") {
    const day = now.getDay();
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + (day === 0 ? -6 : 1));
  } else {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const startDateStr = startDate.toISOString().split("T")[0];

  const snapshot = await db.collection("accounting_transactions")
    .where("userId", "==", userId)
    .where("type", "==", "income")
    .where("date", ">=", startDateStr)
    .get();

  const channels = {
    "หน้าร้าน": 0,
    "ขายส่ง": 0,
    "Shopee": 0,
    "Lazada": 0,
    "TikTok": 0,
    "Facebook": 0,
    "อื่นๆ": 0,
  };

  snapshot.forEach((doc) => {
    const data = doc.data();
    const desc = (data.description || "").toLowerCase();
    const cat = data.category || "";

    if (desc.includes("shopee") || cat.includes("Shopee")) {
      channels["Shopee"] += data.amount;
    } else if (desc.includes("lazada") || cat.includes("Lazada")) {
      channels["Lazada"] += data.amount;
    } else if (desc.includes("tiktok") || cat.includes("TikTok")) {
      channels["TikTok"] += data.amount;
    } else if (desc.includes("facebook") || desc.includes("fb") || cat.includes("Facebook")) {
      channels["Facebook"] += data.amount;
    } else if (cat.includes("ขายส่ง")) {
      channels["ขายส่ง"] += data.amount;
    } else if (cat.includes("ขายสินค้า") || cat.includes("หน้าร้าน")) {
      channels["หน้าร้าน"] += data.amount;
    } else {
      channels["อื่นๆ"] += data.amount;
    }
  });

  // Sort by amount
  const sorted = Object.entries(channels)
    .filter(([_, amount]) => amount > 0)
    .sort((a, b) => b[1] - a[1]);

  const total = sorted.reduce((sum, [_, amount]) => sum + amount, 0);

  return {
    channels: sorted.map(([name, amount]) => ({
      name,
      amount,
      percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
    })),
    total,
    period: period === "today" ? "วันนี้" : period === "week" ? "สัปดาห์นี้" : "เดือนนี้",
  };
}

/**
 * สร้าง Flex Message Dashboard ร้านค้า
 */
function createShopDashboardFlex(profit, channels) {
  const profitColor = profit.netProfit >= 0 ? "#06c755" : "#ef454d";
  const grossColor = profit.grossProfit >= 0 ? "#2e7d32" : "#c62828";

  // สร้าง channel rows
  const channelRows = channels?.channels?.slice(0, 5).map((ch) => ({
    type: "box",
    layout: "horizontal",
    contents: [
      { type: "text", text: ch.name, size: "sm", color: "#555555", flex: 3 },
      { type: "text", text: `฿${ch.amount.toLocaleString()}`, size: "sm", color: "#111111", align: "end", flex: 2 },
      { type: "text", text: `${ch.percentage}%`, size: "sm", color: "#888888", align: "end", flex: 1 },
    ],
  })) || [];

  return {
    type: "flex",
    altText: `🏪 ร้านค้า ${profit.periodText}: กำไร ฿${profit.netProfit.toLocaleString()}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#ff6b35",
        paddingTop: "lg",
        paddingBottom: "lg",
        paddingStart: "lg",
        paddingEnd: "lg",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: "🏪 Dashboard ร้านค้า", color: "#ffffff", weight: "bold", size: "lg", flex: 1 },
              { type: "text", text: profit.periodText, color: "#ffffff", size: "sm", align: "end" },
            ],
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        paddingTop: "lg",
        paddingBottom: "lg",
        paddingStart: "lg",
        paddingEnd: "lg",
        contents: [
          // ยอดขาย & ต้นทุน
          {
            type: "box",
            layout: "horizontal",
            spacing: "md",
            contents: [
              {
                type: "box",
                layout: "vertical",
                flex: 1,
                contents: [
                  { type: "text", text: "💰 ยอดขาย", size: "xs", color: "#888888" },
                  { type: "text", text: `฿${profit.sales.toLocaleString()}`, size: "lg", weight: "bold", color: "#06c755" },
                ],
              },
              {
                type: "box",
                layout: "vertical",
                flex: 1,
                contents: [
                  { type: "text", text: "📦 ต้นทุน", size: "xs", color: "#888888" },
                  { type: "text", text: `฿${profit.cost.toLocaleString()}`, size: "lg", weight: "bold", color: "#ef454d" },
                ],
              },
            ],
          },
          { type: "separator" },
          // กำไรขั้นต้น & ค่าใช้จ่าย
          {
            type: "box",
            layout: "horizontal",
            spacing: "md",
            contents: [
              {
                type: "box",
                layout: "vertical",
                flex: 1,
                contents: [
                  { type: "text", text: "📊 กำไรขั้นต้น", size: "xs", color: "#888888" },
                  { type: "text", text: `฿${profit.grossProfit.toLocaleString()}`, size: "md", weight: "bold", color: grossColor },
                ],
              },
              {
                type: "box",
                layout: "vertical",
                flex: 1,
                contents: [
                  { type: "text", text: "💸 ค่าใช้จ่าย", size: "xs", color: "#888888" },
                  { type: "text", text: `฿${profit.expenses.toLocaleString()}`, size: "md", weight: "bold", color: "#f57c00" },
                ],
              },
            ],
          },
          { type: "separator" },
          // กำไรสุทธิ (เด่น)
          {
            type: "box",
            layout: "vertical",
            spacing: "sm",
            contents: [
              { type: "text", text: profit.netProfit >= 0 ? "✨ กำไรสุทธิ" : "⚠️ ขาดทุนสุทธิ", size: "sm", color: "#888888" },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: `฿${Math.abs(profit.netProfit).toLocaleString()}`, size: "xxl", weight: "bold", color: profitColor, flex: 1 },
                  { type: "text", text: `${profit.profitMargin}%`, size: "lg", color: profitColor, align: "end" },
                ],
              },
              { type: "text", text: `📝 ${profit.transactions} รายการ`, size: "xs", color: "#888888" },
            ],
          },
          // ช่องทางขาย (ถ้ามี)
          ...(channelRows.length > 0 ? [
            { type: "separator" },
            { type: "text", text: "📊 ยอดขายตามช่องทาง", size: "sm", weight: "bold", color: "#555555" },
            ...channelRows,
          ] : []),
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
            color: "#ff6b35",
            height: "sm",
            action: { type: "message", label: "📆 กำไรเดือนนี้", text: "กำไรเดือน" },
          },
          {
            type: "button",
            style: "secondary",
            height: "sm",
            action: { type: "message", label: "📋 เมนูร้านค้า", text: "เมนูร้านค้า" },
          },
        ],
      },
    },
  };
}

/**
 * สร้าง Flex Menu ร้านค้า
 */
function createShopMenuFlex() {
  return {
    type: "flex",
    altText: "🏪 เมนูร้านค้า",
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#ff6b35",
        paddingAll: "lg",
        contents: [
          { type: "text", text: "🏪 เมนูร้านค้า", color: "#ffffff", weight: "bold", size: "xl" },
          { type: "text", text: "ระบบบัญชีร้านค้าครบวงจร", color: "#ffffff", size: "sm" },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        paddingAll: "lg",
        contents: [
          // บันทึกรายการ
          { type: "text", text: "📝 บันทึกรายการ", weight: "bold", size: "sm", color: "#333333" },
          {
            type: "box",
            layout: "horizontal",
            spacing: "sm",
            contents: [
              {
                type: "button", style: "primary", color: "#06c755", height: "sm", flex: 1,
                action: { type: "message", label: "💰 ขาย", text: "ขาย 0" }
              },
              {
                type: "button", style: "primary", color: "#ef454d", height: "sm", flex: 1,
                action: { type: "message", label: "📦 ซื้อสต๊อก", text: "ซื้อสต๊อก 0" }
              },
            ],
          },
          { type: "separator" },
          // ดูกำไร
          { type: "text", text: "💵 ดูกำไร", weight: "bold", size: "sm", color: "#333333" },
          {
            type: "box",
            layout: "horizontal",
            spacing: "sm",
            contents: [
              {
                type: "button", style: "secondary", height: "sm", flex: 1,
                action: { type: "message", label: "📅 วันนี้", text: "กำไรวันนี้" }
              },
              {
                type: "button", style: "secondary", height: "sm", flex: 1,
                action: { type: "message", label: "📆 เดือน", text: "กำไรเดือน" }
              },
            ],
          },
          { type: "separator" },
          // สรุป & รายงาน
          { type: "text", text: "📊 สรุป & รายงาน", weight: "bold", size: "sm", color: "#333333" },
          {
            type: "box",
            layout: "horizontal",
            spacing: "sm",
            contents: [
              {
                type: "button", style: "secondary", height: "sm", flex: 1,
                action: { type: "message", label: "🏪 Dashboard", text: "ร้านค้า" }
              },
              {
                type: "button", style: "secondary", height: "sm", flex: 1,
                action: { type: "message", label: "📈 ช่องทาง", text: "ยอดตามช่องทาง" }
              },
            ],
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          { type: "text", text: "💡 พิมพ์ตามตัวอย่าง:", size: "xs", color: "#888888" },
          { type: "text", text: "• ขาย 500  • ซื้อสต๊อก 2000", size: "xs", color: "#888888" },
          { type: "text", text: "• ขาย shopee 300  • ค่าส่ง 50", size: "xs", color: "#888888" },
        ],
      },
    },
  };
}

// ==========================================
// �🆕 SMART AI INSIGHTS ENGINE
// ==========================================

/**
 * AI วิเคราะห์รูปแบบการใช้จ่าย
 */
async function analyzeSpendingPattern(userId) {
  const db = getFirestore();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const snapshot = await db.collection("accounting_transactions")
    .where("userId", "==", userId)
    .where("timestamp", ">=", thirtyDaysAgo.getTime())
    .get();

  if (snapshot.empty || snapshot.size < 5) {
    return null;
  }

  const transactions = snapshot.docs.map((doc) => doc.data());

  // Calculate insights
  const insights = {
    totalIncome: 0,
    totalExpense: 0,
    avgDailyExpense: 0,
    topExpenseCategories: {},
    topIncomeCategories: {},
    weekdayPattern: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }, // Sun-Sat
    hourlyPattern: {},
    unusualTransactions: [],
    savingsRate: 0,
    predictedMonthlyExpense: 0,
    trend: "stable", // increasing, decreasing, stable
  };

  // Process transactions
  const dailyExpenses = {};

  transactions.forEach((tx) => {
    const date = new Date(tx.timestamp);
    const dateStr = date.toISOString().split("T")[0];
    const dayOfWeek = date.getDay();

    if (tx.type === "income") {
      insights.totalIncome += tx.amount;
      insights.topIncomeCategories[tx.category] = (insights.topIncomeCategories[tx.category] || 0) + tx.amount;
    } else {
      insights.totalExpense += tx.amount;
      insights.topExpenseCategories[tx.category] = (insights.topExpenseCategories[tx.category] || 0) + tx.amount;
      insights.weekdayPattern[dayOfWeek] += tx.amount;
      dailyExpenses[dateStr] = (dailyExpenses[dateStr] || 0) + tx.amount;
    }
  });

  // Calculate averages and patterns
  const days = Object.keys(dailyExpenses).length || 1;
  insights.avgDailyExpense = Math.round(insights.totalExpense / days);
  insights.predictedMonthlyExpense = Math.round(insights.avgDailyExpense * 30);

  // Savings rate
  if (insights.totalIncome > 0) {
    insights.savingsRate = Math.round(((insights.totalIncome - insights.totalExpense) / insights.totalIncome) * 100);
  }

  // Detect unusual transactions (> 2x average)
  const avgTransaction = insights.totalExpense / transactions.filter((tx) => tx.type === "expense").length;
  transactions.forEach((tx) => {
    if (tx.type === "expense" && tx.amount > avgTransaction * 2.5) {
      insights.unusualTransactions.push({
        amount: tx.amount,
        category: tx.category,
        date: tx.date,
        ratio: (tx.amount / avgTransaction).toFixed(1),
      });
    }
  });

  // Trend analysis (compare first half vs second half of period)
  const midpoint = thirtyDaysAgo.getTime() + 15 * 24 * 60 * 60 * 1000;
  let firstHalfExpense = 0; let secondHalfExpense = 0;

  transactions.forEach((tx) => {
    if (tx.type === "expense") {
      if (tx.timestamp < midpoint) firstHalfExpense += tx.amount;
      else secondHalfExpense += tx.amount;
    }
  });

  const changeRate = firstHalfExpense > 0 ? ((secondHalfExpense - firstHalfExpense) / firstHalfExpense) * 100 : 0;
  if (changeRate > 20) insights.trend = "increasing";
  else if (changeRate < -20) insights.trend = "decreasing";
  else insights.trend = "stable";

  // Find busiest spending day
  let busiestDay = 0; let maxSpending = 0;
  for (let i = 0; i < 7; i++) {
    if (insights.weekdayPattern[i] > maxSpending) {
      maxSpending = insights.weekdayPattern[i];
      busiestDay = i;
    }
  }
  insights.busiestSpendingDay = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัส", "ศุกร์", "เสาร์"][busiestDay];

  return insights;
}

/**
 * สร้าง AI Insights Message
 */
function createInsightsFlex(insights) {
  if (!insights) {
    return {
      type: "flex",
      altText: "ยังไม่มีข้อมูลเพียงพอ",
      contents: {
        type: "bubble",
        body: {
          type: "box", layout: "vertical",
          contents: [
            { type: "text", text: "📊 ยังไม่มีข้อมูลเพียงพอ", weight: "bold", align: "center" },
            { type: "text", text: "ต้องมีรายการอย่างน้อย 5 รายการ ใน 30 วันที่ผ่านมา", size: "sm", color: "#888888", align: "center", margin: "md", wrap: true },
          ],
        },
      },
    };
  }

  const trendEmoji = {
    "increasing": "📈",
    "decreasing": "📉",
    "stable": "➡️",
  };
  const trendText = {
    "increasing": "เพิ่มขึ้น",
    "decreasing": "ลดลง",
    "stable": "คงที่",
  };

  // Top 3 expense categories
  const topExpenses = Object.entries(insights.topExpenseCategories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const categoryRows = topExpenses.map(([cat, amt], i) => ({
    type: "box", layout: "horizontal", margin: "sm",
    contents: [
      { type: "text", text: `${i + 1}. ${cat}`, size: "sm", flex: 3 },
      { type: "text", text: `฿${amt.toLocaleString()}`, size: "sm", color: "#ef454d", align: "end", flex: 2 },
    ],
  }));

  const savingsColor = insights.savingsRate >= 20 ? "#06c755" :
    insights.savingsRate >= 0 ? "#f5a623" : "#ef454d";

  return {
    type: "flex",
    altText: `🤖 AI วิเคราะห์: อัตราเก็บออม ${insights.savingsRate}%`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box", layout: "vertical",
        backgroundColor: "#667eea",
        paddingAll: "lg",
        contents: [
          { type: "text", text: "🤖 AI วิเคราะห์การเงิน", color: "#ffffff", weight: "bold", size: "lg" },
          { type: "text", text: "30 วันที่ผ่านมา", color: "#ffffff", size: "xs", margin: "sm" },
        ],
      },
      body: {
        type: "box", layout: "vertical", spacing: "md",
        contents: [
          // Summary Cards
          {
            type: "box", layout: "horizontal", spacing: "md",
            contents: [
              {
                type: "box", layout: "vertical", flex: 1, backgroundColor: "#e8f5e9", cornerRadius: "md", paddingAll: "sm",
                contents: [
                  { type: "text", text: "💰 รายรับ", size: "xs", color: "#2e7d32" },
                  { type: "text", text: `฿${insights.totalIncome.toLocaleString()}`, size: "sm", weight: "bold", color: "#2e7d32" },
                ],
              },
              {
                type: "box", layout: "vertical", flex: 1, backgroundColor: "#ffebee", cornerRadius: "md", paddingAll: "sm",
                contents: [
                  { type: "text", text: "💸 รายจ่าย", size: "xs", color: "#c62828" },
                  { type: "text", text: `฿${insights.totalExpense.toLocaleString()}`, size: "sm", weight: "bold", color: "#c62828" },
                ],
              },
            ],
          },
          // Savings Rate
          {
            type: "box", layout: "vertical", backgroundColor: "#f5f5f5", cornerRadius: "md", paddingAll: "md",
            contents: [
              { type: "text", text: "💎 อัตราเก็บออม", size: "sm", color: "#666666" },
              {
                type: "box", layout: "horizontal", margin: "sm",
                contents: [
                  { type: "text", text: `${insights.savingsRate}%`, size: "xxl", weight: "bold", color: savingsColor },
                  { type: "text", text: insights.savingsRate >= 20 ? "ยอดเยี่ยม! 🌟" : insights.savingsRate >= 0 ? "พอใช้ได้" : "ต้องระวัง!", size: "xs", color: "#888888", align: "end", gravity: "bottom" },
                ],
              },
            ],
          },
          { type: "separator" },
          // AI Insights
          {
            type: "box", layout: "vertical",
            contents: [
              { type: "text", text: "🎯 AI Insights", weight: "bold", size: "sm" },
              { type: "text", text: `${trendEmoji[insights.trend]} แนวโน้มรายจ่าย: ${trendText[insights.trend]}`, size: "xs", margin: "sm" },
              { type: "text", text: `📅 ใช้จ่ายมากสุดวัน${insights.busiestSpendingDay}`, size: "xs", margin: "sm" },
              { type: "text", text: `💡 คาดการณ์รายจ่ายเดือนนี้: ฿${insights.predictedMonthlyExpense.toLocaleString()}`, size: "xs", margin: "sm" },
            ],
          },
          { type: "separator" },
          // Top Expenses
          {
            type: "box", layout: "vertical",
            contents: [
              { type: "text", text: "📊 หมวดจ่ายมากสุด", weight: "bold", size: "sm" },
              ...categoryRows,
            ],
          },
          // Unusual Alert
          ...(insights.unusualTransactions.length > 0 ? [{
            type: "box", layout: "vertical", backgroundColor: "#fff3e0", cornerRadius: "md", paddingAll: "sm", margin: "md",
            contents: [
              { type: "text", text: "⚠️ รายการผิดปกติ", size: "xs", color: "#e65100", weight: "bold" },
              { type: "text", text: `พบ ${insights.unusualTransactions.length} รายการที่สูงกว่าปกติ`, size: "xs", color: "#f57c00" },
            ],
          }] : []),
        ],
      },
      footer: {
        type: "box", layout: "horizontal", spacing: "sm",
        contents: [
          { type: "button", style: "primary", color: "#667eea", height: "sm", action: { type: "message", label: "💡 คำแนะนำ", text: "คำแนะนำการเงิน" }, flex: 1 },
          { type: "button", style: "secondary", height: "sm", action: { type: "message", label: "📊 สรุป", text: "สรุปเดือน" }, flex: 1 },
        ],
      },
    },
  };
}

// ==========================================
// 🆕 BUDGET MANAGEMENT SYSTEM
// ==========================================

async function setBudget(userId, category, amount, period = "month") {
  const db = getFirestore();
  const budgetId = `${userId}_${category}_${period}`;

  await db.collection("accounting_budgets").doc(budgetId).set({
    userId,
    category,
    amount,
    period,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  return { success: true, category, amount, period };
}

async function getBudgets(userId) {
  const db = getFirestore();
  const snapshot = await db.collection("accounting_budgets")
    .where("userId", "==", userId)
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

async function checkBudgetStatus(userId) {
  const db = getFirestore();
  const budgets = await getBudgets(userId);

  if (budgets.length === 0) return null;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Get current month expenses by category
  const expenseSnapshot = await db.collection("accounting_transactions")
    .where("userId", "==", userId)
    .where("month", "==", monthStr)
    .where("type", "==", "expense")
    .get();

  const categoryExpenses = {};
  expenseSnapshot.forEach((doc) => {
    const data = doc.data();
    categoryExpenses[data.category] = (categoryExpenses[data.category] || 0) + data.amount;
  });

  // Check each budget
  const budgetStatus = budgets.map((budget) => {
    const spent = categoryExpenses[budget.category] || 0;
    const percentage = Math.round((spent / budget.amount) * 100);
    const remaining = budget.amount - spent;

    let status = "safe"; // safe, warning, danger, exceeded
    if (percentage >= 100) status = "exceeded";
    else if (percentage >= 80) status = "danger";
    else if (percentage >= 60) status = "warning";

    return {
      ...budget,
      spent,
      remaining,
      percentage,
      status,
    };
  });

  return budgetStatus;
}

function createBudgetFlex(budgetStatus) {
  if (!budgetStatus || budgetStatus.length === 0) {
    return {
      type: "flex",
      altText: "ยังไม่ได้ตั้งงบประมาณ",
      contents: {
        type: "bubble",
        body: {
          type: "box", layout: "vertical",
          contents: [
            { type: "text", text: "📋 ยังไม่ได้ตั้งงบประมาณ", weight: "bold", align: "center" },
            { type: "text", text: "ลองพิมพ์: ตั้งงบ อาหาร 5000", size: "sm", color: "#888888", align: "center", margin: "md" },
          ],
        },
      },
    };
  }

  const statusColors = {
    "safe": "#06c755",
    "warning": "#f5a623",
    "danger": "#ef454d",
    "exceeded": "#d32f2f",
  };

  const statusEmojis = {
    "safe": "✅",
    "warning": "⚠️",
    "danger": "🔥",
    "exceeded": "💥",
  };

  const budgetRows = budgetStatus.map((b) => ({
    type: "box", layout: "vertical", margin: "lg",
    contents: [
      {
        type: "box", layout: "horizontal",
        contents: [
          { type: "text", text: `${statusEmojis[b.status]} ${b.category}`, size: "sm", weight: "bold", flex: 3 },
          { type: "text", text: `${b.percentage}%`, size: "sm", color: statusColors[b.status], align: "end", flex: 1 },
        ],
      },
      {
        type: "box", layout: "horizontal", margin: "sm",
        contents: [
          { type: "box", layout: "vertical", flex: Math.max(1, b.percentage), height: "6px", backgroundColor: statusColors[b.status], cornerRadius: "sm" },
          { type: "box", layout: "vertical", flex: Math.max(1, 100 - b.percentage), height: "6px", backgroundColor: "#e0e0e0", cornerRadius: "sm" },
        ],
      },
      {
        type: "box", layout: "horizontal", margin: "xs",
        contents: [
          { type: "text", text: `ใช้ไป ฿${b.spent.toLocaleString()}`, size: "xxs", color: "#888888" },
          { type: "text", text: `งบ ฿${b.amount.toLocaleString()}`, size: "xxs", color: "#888888", align: "end" },
        ],
      },
    ],
  }));

  return {
    type: "flex",
    altText: "📊 สถานะงบประมาณ",
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box", layout: "vertical", backgroundColor: "#764ba2", paddingAll: "lg",
        contents: [
          { type: "text", text: "📊 สถานะงบประมาณ", color: "#ffffff", weight: "bold", size: "lg" },
          { type: "text", text: "เดือนนี้", color: "#ffffff", size: "xs" },
        ],
      },
      body: {
        type: "box", layout: "vertical",
        contents: budgetRows,
      },
      footer: {
        type: "box", layout: "horizontal", spacing: "sm",
        contents: [
          { type: "button", style: "primary", color: "#764ba2", height: "sm", action: { type: "message", label: "➕ เพิ่มงบ", text: "ตั้งงบประมาณ" }, flex: 1 },
        ],
      },
    },
  };
}

// ==========================================
// 🆕 SAVINGS GOALS SYSTEM
// ==========================================

async function setGoal(userId, name, targetAmount, deadline = null) {
  const db = getFirestore();
  const goalRef = db.collection("accounting_goals").doc();

  await goalRef.set({
    userId,
    name,
    targetAmount,
    currentAmount: 0,
    deadline,
    createdAt: FieldValue.serverTimestamp(),
    status: "active", // active, completed, cancelled
  });

  return { success: true, goalId: goalRef.id, name, targetAmount };
}

async function addToGoal(userId, goalId, amount) {
  const db = getFirestore();
  const goalRef = db.collection("accounting_goals").doc(goalId);
  const goal = await goalRef.get();

  if (!goal.exists || goal.data().userId !== userId) {
    return { success: false, message: "ไม่พบเป้าหมาย" };
  }

  const goalData = goal.data();
  const newAmount = goalData.currentAmount + amount;
  const completed = newAmount >= goalData.targetAmount;

  await goalRef.update({
    currentAmount: newAmount,
    status: completed ? "completed" : "active",
    updatedAt: FieldValue.serverTimestamp(),
  });

  return {
    success: true,
    name: goalData.name,
    currentAmount: newAmount,
    targetAmount: goalData.targetAmount,
    completed,
    percentage: Math.round((newAmount / goalData.targetAmount) * 100),
  };
}

async function getGoals(userId) {
  const db = getFirestore();
  const snapshot = await db.collection("accounting_goals")
    .where("userId", "==", userId)
    .where("status", "==", "active")
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

function createGoalsFlex(goals) {
  if (!goals || goals.length === 0) {
    return {
      type: "flex",
      altText: "ยังไม่มีเป้าหมายออม",
      contents: {
        type: "bubble",
        body: {
          type: "box", layout: "vertical",
          contents: [
            { type: "text", text: "🎯 ยังไม่มีเป้าหมายออม", weight: "bold", align: "center" },
            { type: "text", text: "ลองพิมพ์: ตั้งเป้าออม iPhone 35000", size: "sm", color: "#888888", align: "center", margin: "md", wrap: true },
          ],
        },
      },
    };
  }

  const goalRows = goals.map((g) => {
    const percentage = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
    return {
      type: "box", layout: "vertical", margin: "lg", backgroundColor: "#f8f9fa", cornerRadius: "md", paddingAll: "md",
      contents: [
        { type: "text", text: `🎯 ${g.name}`, weight: "bold", size: "sm" },
        {
          type: "box", layout: "horizontal", margin: "md",
          contents: [
            { type: "box", layout: "vertical", flex: Math.max(1, percentage), height: "8px", backgroundColor: "#667eea", cornerRadius: "md" },
            { type: "box", layout: "vertical", flex: Math.max(1, 100 - percentage), height: "8px", backgroundColor: "#e0e0e0", cornerRadius: "md" },
          ],
        },
        {
          type: "box", layout: "horizontal", margin: "sm",
          contents: [
            { type: "text", text: `฿${g.currentAmount.toLocaleString()}`, size: "sm", color: "#667eea", weight: "bold" },
            { type: "text", text: `/ ฿${g.targetAmount.toLocaleString()}`, size: "sm", color: "#888888", align: "end" },
          ],
        },
        { type: "text", text: `${percentage}% - เหลืออีก ฿${(g.targetAmount - g.currentAmount).toLocaleString()}`, size: "xxs", color: "#888888", margin: "sm" },
      ],
    };
  });

  return {
    type: "flex",
    altText: "🎯 เป้าหมายออม",
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box", layout: "vertical", backgroundColor: "#667eea", paddingAll: "lg",
        contents: [
          { type: "text", text: "🎯 เป้าหมายออมเงิน", color: "#ffffff", weight: "bold", size: "lg" },
        ],
      },
      body: {
        type: "box", layout: "vertical",
        contents: goalRows,
      },
      footer: {
        type: "box", layout: "horizontal", spacing: "sm",
        contents: [
          { type: "button", style: "primary", color: "#667eea", height: "sm", action: { type: "message", label: "➕ เพิ่มเป้าหมาย", text: "ตั้งเป้าออม" }, flex: 1 },
        ],
      },
    },
  };
}

// ==========================================
// 🆕 FINANCIAL ADVICE AI
// ==========================================

async function generateFinancialAdvice(userId) {
  const insights = await analyzeSpendingPattern(userId);
  if (!insights) return null;

  const advice = [];

  // Savings rate advice
  if (insights.savingsRate < 0) {
    advice.push({
      icon: "🚨",
      title: "รายจ่ายเกินรายรับ!",
      text: `คุณใช้จ่ายเกินรายรับ ${Math.abs(insights.savingsRate)}% ควรลดรายจ่ายโดยด่วน`,
      priority: "critical",
    });
  } else if (insights.savingsRate < 10) {
    advice.push({
      icon: "⚠️",
      title: "ออมน้อยเกินไป",
      text: "ควรออมอย่างน้อย 20% ของรายรับ ลองตัดรายจ่ายที่ไม่จำเป็น",
      priority: "warning",
    });
  } else if (insights.savingsRate >= 30) {
    advice.push({
      icon: "🌟",
      title: "ยอดเยี่ยม!",
      text: `คุณออมได้ ${insights.savingsRate}% ลองลงทุนเพิ่มมูลค่าเงินออม`,
      priority: "success",
    });
  }

  // Trend advice
  if (insights.trend === "increasing") {
    advice.push({
      icon: "📈",
      title: "รายจ่ายเพิ่มขึ้น",
      text: "รายจ่ายเพิ่มขึ้นเมื่อเทียบกับช่วงก่อนหน้า ควรทบทวนค่าใช้จ่าย",
      priority: "warning",
    });
  }

  // Category-specific advice
  const topExpenseCategory = Object.entries(insights.topExpenseCategories)
    .sort((a, b) => b[1] - a[1])[0];

  if (topExpenseCategory) {
    const [category, amount] = topExpenseCategory;
    const percentage = Math.round((amount / insights.totalExpense) * 100);

    if (percentage > 40) {
      advice.push({
        icon: "💡",
        title: `${category} สูงมาก`,
        text: `${category} คิดเป็น ${percentage}% ของรายจ่าย ลองหาทางลดค่าใช้จ่ายส่วนนี้`,
        priority: "info",
      });
    }
  }

  // Day pattern advice
  advice.push({
    icon: "📅",
    title: "วันที่ใช้จ่ายมาก",
    text: `คุณมักใช้จ่ายมากในวัน${insights.busiestSpendingDay} ลองวางแผนการใช้จ่ายล่วงหน้า`,
    priority: "info",
  });

  // Unusual transactions
  if (insights.unusualTransactions.length > 0) {
    advice.push({
      icon: "🔍",
      title: "รายจ่ายผิดปกติ",
      text: `พบ ${insights.unusualTransactions.length} รายการที่สูงกว่าปกติ ควรทบทวนความจำเป็น`,
      priority: "warning",
    });
  }

  return advice;
}

function createAdviceFlex(advice) {
  if (!advice || advice.length === 0) {
    return {
      type: "text",
      text: "💡 ยังไม่มีข้อมูลเพียงพอสำหรับคำแนะนำ",
    };
  }

  const priorityColors = {
    "critical": "#d32f2f",
    "warning": "#f5a623",
    "success": "#06c755",
    "info": "#2196f3",
  };

  const adviceRows = advice.slice(0, 4).map((a) => ({
    type: "box", layout: "vertical", margin: "lg", backgroundColor: "#f8f9fa", cornerRadius: "md", paddingAll: "md",
    borderColor: priorityColors[a.priority],
    borderWidth: "2px",
    contents: [
      { type: "text", text: `${a.icon} ${a.title}`, weight: "bold", size: "sm", color: priorityColors[a.priority] },
      { type: "text", text: a.text, size: "xs", color: "#666666", margin: "sm", wrap: true },
    ],
  }));

  return {
    type: "flex",
    altText: "💡 คำแนะนำการเงิน",
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box", layout: "vertical", backgroundColor: "#00bcd4", paddingAll: "lg",
        contents: [
          { type: "text", text: "💡 คำแนะนำการเงิน AI", color: "#ffffff", weight: "bold", size: "lg" },
          { type: "text", text: "จาก AI วิเคราะห์พฤติกรรมของคุณ", color: "#ffffff", size: "xs" },
        ],
      },
      body: {
        type: "box", layout: "vertical",
        contents: adviceRows,
      },
      footer: {
        type: "box", layout: "vertical",
        contents: [
          { type: "button", style: "primary", color: "#00bcd4", action: { type: "message", label: "🤖 วิเคราะห์เพิ่ม", text: "วิเคราะห์การเงิน" } },
        ],
      },
    },
  };
}

// ==========================================
// 🆕 RECURRING TRANSACTIONS
// ==========================================

async function setRecurring(userId, description, amount, type, frequency = "monthly", dayOfMonth = 1) {
  const db = getFirestore();
  const recurringRef = db.collection("accounting_recurring").doc();

  await recurringRef.set({
    userId,
    description,
    amount,
    type, // income or expense
    frequency, // daily, weekly, monthly
    dayOfMonth, // for monthly
    lastProcessed: null,
    nextDue: calculateNextDue(frequency, dayOfMonth),
    status: "active",
    createdAt: FieldValue.serverTimestamp(),
  });

  return { success: true, id: recurringRef.id, description, amount, frequency };
}

function calculateNextDue(frequency, dayOfMonth = 1) {
  const now = new Date();
  let nextDue = new Date();

  switch (frequency) {
    case "daily":
      nextDue.setDate(now.getDate() + 1);
      break;
    case "weekly":
      nextDue.setDate(now.getDate() + (7 - now.getDay()));
      break;
    case "monthly":
      nextDue = new Date(now.getFullYear(), now.getMonth() + 1, dayOfMonth);
      break;
  }

  return nextDue.toISOString().split("T")[0];
}

async function getRecurringTransactions(userId) {
  const db = getFirestore();
  const snapshot = await db.collection("accounting_recurring")
    .where("userId", "==", userId)
    .where("status", "==", "active")
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

// ==========================================
// 🆕 COMPARISON & TRENDS
// ==========================================

async function getMonthComparison(userId) {
  const db = getFirestore();
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, "0")}`;

  // Get both months' summaries
  const [thisDoc, lastDoc] = await Promise.all([
    db.collection("accounting_summary").doc(`${userId}_${thisMonth}`).get(),
    db.collection("accounting_summary").doc(`${userId}_${lastMonth}`).get(),
  ]);

  const thisData = thisDoc.exists ? thisDoc.data() : { totalIncome: 0, totalExpense: 0 };
  const lastData = lastDoc.exists ? lastDoc.data() : { totalIncome: 0, totalExpense: 0 };

  const incomeChange = lastData.totalIncome > 0 ?
    Math.round(((thisData.totalIncome - lastData.totalIncome) / lastData.totalIncome) * 100) : 0;
  const expenseChange = lastData.totalExpense > 0 ?
    Math.round(((thisData.totalExpense - lastData.totalExpense) / lastData.totalExpense) * 100) : 0;

  return {
    thisMonth: {
      month: thisMonth,
      income: thisData.totalIncome || 0,
      expense: thisData.totalExpense || 0,
      profit: (thisData.totalIncome || 0) - (thisData.totalExpense || 0),
    },
    lastMonth: {
      month: lastMonth,
      income: lastData.totalIncome || 0,
      expense: lastData.totalExpense || 0,
      profit: (lastData.totalIncome || 0) - (lastData.totalExpense || 0),
    },
    changes: {
      income: incomeChange,
      expense: expenseChange,
    },
  };
}

function createComparisonFlex(comparison) {
  const incomeArrow = comparison.changes.income >= 0 ? "📈" : "📉";
  const expenseArrow = comparison.changes.expense >= 0 ? "📈" : "📉";
  const incomeColor = comparison.changes.income >= 0 ? "#06c755" : "#ef454d";
  const expenseColor = comparison.changes.expense <= 0 ? "#06c755" : "#ef454d"; // ลดลงดีกว่า

  return {
    type: "flex",
    altText: "📊 เปรียบเทียบเดือน",
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box", layout: "vertical", backgroundColor: "#ff9800", paddingAll: "lg",
        contents: [
          { type: "text", text: "📊 เปรียบเทียบกับเดือนที่แล้ว", color: "#ffffff", weight: "bold", size: "md" },
        ],
      },
      body: {
        type: "box", layout: "vertical", spacing: "lg",
        contents: [
          // Income comparison
          {
            type: "box", layout: "vertical",
            contents: [
              { type: "text", text: "💰 รายรับ", weight: "bold", size: "sm" },
              {
                type: "box", layout: "horizontal", margin: "sm",
                contents: [
                  { type: "text", text: `เดือนนี้: ฿${comparison.thisMonth.income.toLocaleString()}`, size: "sm", flex: 3 },
                  { type: "text", text: `${incomeArrow} ${comparison.changes.income}%`, size: "sm", color: incomeColor, align: "end", flex: 2 },
                ],
              },
              { type: "text", text: `เดือนที่แล้ว: ฿${comparison.lastMonth.income.toLocaleString()}`, size: "xs", color: "#888888" },
            ],
          },
          { type: "separator" },
          // Expense comparison
          {
            type: "box", layout: "vertical",
            contents: [
              { type: "text", text: "💸 รายจ่าย", weight: "bold", size: "sm" },
              {
                type: "box", layout: "horizontal", margin: "sm",
                contents: [
                  { type: "text", text: `เดือนนี้: ฿${comparison.thisMonth.expense.toLocaleString()}`, size: "sm", flex: 3 },
                  { type: "text", text: `${expenseArrow} ${comparison.changes.expense}%`, size: "sm", color: expenseColor, align: "end", flex: 2 },
                ],
              },
              { type: "text", text: `เดือนที่แล้ว: ฿${comparison.lastMonth.expense.toLocaleString()}`, size: "xs", color: "#888888" },
            ],
          },
          { type: "separator" },
          // Profit comparison
          {
            type: "box", layout: "horizontal",
            contents: [
              {
                type: "box", layout: "vertical", flex: 1, backgroundColor: "#e8f5e9", cornerRadius: "md", paddingAll: "md",
                contents: [
                  { type: "text", text: "เดือนนี้", size: "xs", align: "center" },
                  { type: "text", text: comparison.thisMonth.profit >= 0 ? "กำไร" : "ขาดทุน", size: "xs", align: "center", color: comparison.thisMonth.profit >= 0 ? "#2e7d32" : "#c62828" },
                  { type: "text", text: `฿${Math.abs(comparison.thisMonth.profit).toLocaleString()}`, weight: "bold", align: "center", color: comparison.thisMonth.profit >= 0 ? "#2e7d32" : "#c62828" },
                ],
              },
              { type: "box", layout: "vertical", flex: 0, width: "10px" },
              {
                type: "box", layout: "vertical", flex: 1, backgroundColor: "#f5f5f5", cornerRadius: "md", paddingAll: "md",
                contents: [
                  { type: "text", text: "เดือนที่แล้ว", size: "xs", align: "center" },
                  { type: "text", text: comparison.lastMonth.profit >= 0 ? "กำไร" : "ขาดทุน", size: "xs", align: "center", color: "#888888" },
                  { type: "text", text: `฿${Math.abs(comparison.lastMonth.profit).toLocaleString()}`, weight: "bold", align: "center", color: "#888888" },
                ],
              },
            ],
          },
        ],
      },
    },
  };
}

// ==========================================
// 🔍 ADVANCED PARSER
// ==========================================

function parseTransaction(text, businessType = "farm") {
  const lowerText = text.toLowerCase();
  const categories = businessType === "farm" ? FARM_CATEGORIES : RETAIL_CATEGORIES;

  // 1. Check if it's an accounting command
  const accountingKeywords = [
    "ขาย", "ซื้อ", "จ่าย", "รับ", "ได้", "เสีย", "ค่า", "เงิน",
    "บาท", "กิโล", "กก", "กระสอบ", "ลัง", "ถุง", "ตัว", "ชิ้น",
    "บันทึก", "จด", "ลง", "บัญชี", "รายรับ", "รายจ่าย", "โอน",
  ];

  const isAccounting = accountingKeywords.some((keyword) => lowerText.includes(keyword));
  if (!isAccounting) return null;

  // 2. Extract Amount (Enhanced)
  // Supports: 1000, 1,000, 1.5k, 500บาท, 500บ, 2500 (ไม่มีหน่วย)
  let amount = 0;

  // Pattern: Amount x Price (e.g., 50 x 100)
  const calcMatch = text.match(/(\d+)\s*[x*]\s*(\d+)/);
  if (calcMatch) {
    amount = parseInt(calcMatch[1]) * parseInt(calcMatch[2]);
  } else {
    // Pattern: Standard numbers
    const amountPatterns = [
      /(\d+(?:,\d{3})*(?:\.\d{1,2})?)[kK]/, // 5k, 1.5k
      /(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:บาท|฿|baht|บ\.|บ)/i, // 2500บาท, 2500 บาท
      /(?:บาท|฿|baht|ราคา|ละ)\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)/i, // บาท 2500
      /(\d+(?:,\d{3})*(?:\.\d{1,2})?)/g, // Fallback: find all numbers
    ];

    for (const pattern of amountPatterns) {
      const match = text.match(pattern);
      if (match) {
        if (pattern.toString().includes("k")) {
          amount = parseFloat(match[1].replace(/,/g, "")) * 1000;
        } else if (pattern.global) {
          // Logic for fallback numbers: pick the largest one that looks like a price (>10)
          // or the last one if multiple exist
          const numbers = text.match(pattern).map((n) => parseFloat(n.replace(/,/g, "")));
          const likelyAmount = numbers.filter((n) => n > 10).pop(); // Prefer > 10
          amount = likelyAmount || numbers.pop();
        } else {
          amount = parseFloat(match[1].replace(/,/g, ""));
        }
        if (amount > 0) break;
      }
    }
  }

  if (!amount || amount === 0) return null;

  // 3. Determine Type (Income/Expense)
  const incomeKeywords = ["ขาย", "ได้", "รับ", "รายรับ", "เก็บเงิน", "ส่งออก", "จำหน่าย", "อุดหนุน", "ถูกหวย", "โบนัส"];
  const expenseKeywords = ["ซื้อ", "จ่าย", "ค่า", "เสีย", "รายจ่าย", "จ้าง", "เติม", "ซ่อม", "ผ่อน", "หมด", "ชำระ"];

  let type = "expense"; // Default safety

  // Score based approach
  const incomeScore = incomeKeywords.filter((kw) => lowerText.includes(kw)).length;
  const expenseScore = expenseKeywords.filter((kw) => lowerText.includes(kw)).length;

  if (incomeScore > expenseScore) type = "income";
  else if (expenseScore > incomeScore) type = "expense";
  else {
    // Tie-breaker: 'ขาย' usually means income unless 'ค่าขาย' (rare)
    if (lowerText.includes("ขาย")) type = "income";
  }

  // 4. Determine Category
  let category = "อื่นๆ";
  const categoryList = categories[type];

  for (const [cat, keywords] of Object.entries(categoryList)) {
    if (keywords.some((kw) => lowerText.includes(kw))) {
      category = cat;
      break;
    }
  }

  // 5. Extract Quantity & Unit
  let quantity = null;
  let unit = null;
  const quantityPatterns = [
    /(\d+(?:\.\d+)?)\s*(กิโล|กก\.|กก|kg|ตัน|t)/i,
    /(\d+(?:\.\d+)?)\s*(กระสอบ|ถุง|ลัง|ถัง|ขวด|แพ็ค|โหล|มัด)/i,
    /(\d+(?:\.\d+)?)\s*(ตัว|หัว|ต้น|ลูก|ผล|ใบ)/i,
    /(\d+(?:\.\d+)?)\s*(ชิ้น|อัน|เครื่อง|ชุด)/i,
    /(\d+(?:\.\d+)?)\s*(ไร่|งาน|ตร\.?ว\.?)/i,
    /(\d+(?:\.\d+)?)\s*(ลิตร|แกลลอน|cc)/i,
  ];

  for (const pattern of quantityPatterns) {
    const match = text.match(pattern);
    if (match) {
      quantity = parseFloat(match[1]);
      unit = match[2];
      // Filter out if this number was used as amount (simple heuristic)
      if (Math.abs(quantity - amount) < 0.01) {
        quantity = null; unit = null; // It was likely the amount
      } else {
        break;
      }
    }
  }

  // 6. Date Parsing (Smart Date)
  const date = new Date();
  if (lowerText.includes("เมื่อวาน") || lowerText.includes("วานนี้")) {
    date.setDate(date.getDate() - 1);
  } else if (lowerText.includes("เมื่อคืน")) {
    // If early morning, might mean yesterday night, but let's stick to -1 day
    date.setDate(date.getDate() - 1);
  }

  // 7. Clean Description
  // 🔧 ปรับปรุงการทำความสะอาด description ให้ดีขึ้น
  let description = text
    // ลบคำที่ไม่จำเป็น
    .replace(/ช่วย|คำนวณ|บันทึก|จด|ลง|ได้ไหม|หน่อย|ครับ|ค่ะ|คะ/gi, "")
    .replace(/(\d+(?:,\d{3})*(?:\.\d{1,2})?)[kK]/, "") // Remove 5k
    .replace(/\d+(?:,\d{3})*(?:\.\d{1,2})?\s*(?:บาท|฿|baht|บ\.?)?/gi, "") // Remove price (with or without บาท)
    .replace(/เมื่อวาน|วานนี้|วันนี้|เมื่อคืน/g, "") // Remove date keywords
    .replace(/ที่\s*\d+|เลขที่.*|แก้ยังไง|ทำยังไง|อย่างไร/gi, "") // ลบคำถามและเลขที่
    .replace(/และ.*|หรือ.*/g, "") // ตัดข้อความหลัง "และ" หรือ "หรือ"
    .trim();

  if (quantity && unit) {
    // Try to remove quantity string from description to clean it up
    const qRegex = new RegExp(`${quantity}\\s*${unit}`, "i");
    description = description.replace(qRegex, "").trim();
  }

  // Remove leading/trailing non-content chars and extra spaces
  description = description
    .replace(/^[-_,\.]+|[-_,\.]+$/g, "")
    .replace(/\s+/g, " ") // Collapse multiple spaces
    .trim();

  // ถ้า description ยังยาวเกินไป (>30 ตัวอักษร) และไม่มีความหมาย ให้ใช้ category แทน
  if (!description || description.length > 30) {
    description = category; // Fallback to category
  }

  return {
    type,
    amount,
    category,
    description: description.substring(0, 60),
    quantity,
    unit,
    date: date, // Date Object
    originalText: text,
  };
}

// ==========================================
// 💾 DATABASE OPERATIONS
// ==========================================

async function saveTransaction(userId, transaction) {
  const db = getFirestore();

  // Format dates
  const dateObj = transaction.date || new Date();
  const dateStr = dateObj.toISOString().split("T")[0]; // YYYY-MM-DD
  const monthStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}`; // YYYY-MM

  const transactionData = {
    ...transaction,
    userId,
    createdAt: FieldValue.serverTimestamp(),
    date: dateStr,
    month: monthStr,
    year: dateObj.getFullYear(),
    timestamp: dateObj.getTime(), // Useful for sorting
  };

  // Save to main collection
  const docRef = await db.collection("accounting_transactions").add(transactionData);

  // Update Monthly Summary
  const summaryRef = db.collection("accounting_summary").doc(`${userId}_${monthStr}`);

  const increment = transaction.type === "income" ?
    { totalIncome: FieldValue.increment(transaction.amount), transactionCount: FieldValue.increment(1) } :
    { totalExpense: FieldValue.increment(transaction.amount), transactionCount: FieldValue.increment(1) };

  await summaryRef.set({
    userId,
    month: monthStr,
    ...increment,
    lastUpdated: FieldValue.serverTimestamp(),
  }, { merge: true });

  return {
    success: true,
    transactionId: docRef.id,
    data: transactionData,
  };
}

async function getReport(userId, period = "month") {
  const db = getFirestore();
  const now = new Date();

  let startDate; const endDate = now;

  switch (period) {
    case "today":
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "week":
      const day = now.getDay();
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + (day === 0 ? -6 : 1)); // Monday start
      break;
    case "month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "year":
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const startDateStr = startDate.toISOString().split("T")[0];
  const endDateStr = endDate.toISOString().split("T")[0];

  const snapshot = await db.collection("accounting_transactions")
    .where("userId", "==", userId)
    .where("date", ">=", startDateStr)
    .where("date", "<=", endDateStr)
    .orderBy("date", "desc")
    .get();

  let totalIncome = 0;
  let totalExpense = 0;
  const categoryBreakdown = { income: {}, expense: {} };

  snapshot.forEach((doc) => {
    const data = doc.data();
    if (data.type === "income") {
      totalIncome += data.amount;
      categoryBreakdown.income[data.category] = (categoryBreakdown.income[data.category] || 0) + data.amount;
    } else {
      totalExpense += data.amount;
      categoryBreakdown.expense[data.category] = (categoryBreakdown.expense[data.category] || 0) + data.amount;
    }
  });

  return {
    period,
    startDate: startDateStr,
    endDate: endDateStr,
    totalIncome,
    totalExpense,
    profit: totalIncome - totalExpense,
    transactionCount: snapshot.size,
    categoryBreakdown,
  };
}

async function deleteLastTransaction(userId) {
  const db = getFirestore();
  console.log(`🗑️ Delete request for user: ${userId}`);

  // 🔧 แก้ไข: ไม่ใช้ orderBy เพื่อหลีกเลี่ยง composite index
  // ดึงทุกรายการแล้วเรียงฝั่ง client แทน
  const snapshot = await db.collection("accounting_transactions")
    .where("userId", "==", userId)
    .get();

  console.log(`🗑️ Found ${snapshot.size} transactions for user`);

  if (snapshot.empty) {
    console.log(`🗑️ No transactions found - cannot delete`);
    return { success: false, message: "ไม่พบรายการล่าสุด" };
  }

  // Sort client-side by createdAt (descending)
  const transactions = snapshot.docs.map((doc) => ({
    ref: doc.ref,
    id: doc.id,
    data: doc.data(),
  }));

  // เรียงลำดับจากล่าสุดไปเก่าสุด
  transactions.sort((a, b) => {
    const timeA = a.data.createdAt?.toMillis() || 0;
    const timeB = b.data.createdAt?.toMillis() || 0;
    return timeB - timeA; // descending
  });

  // เอารายการล่าสุด (ตัวแรก)
  const latestTransaction = transactions[0];
  const data = latestTransaction.data;

  console.log(`🗑️ Deleting transaction: ${latestTransaction.id}`);
  console.log(`🗑️ Transaction details: ${data.type} - ${data.category} - ฿${data.amount}`);

  // Revert summary
  const monthStr = data.month;
  const summaryRef = db.collection("accounting_summary").doc(`${userId}_${monthStr}`);
  const decrement = data.type === "income" ?
    { totalIncome: FieldValue.increment(-data.amount), transactionCount: FieldValue.increment(-1) } :
    { totalExpense: FieldValue.increment(-data.amount), transactionCount: FieldValue.increment(-1) };

  await summaryRef.set(decrement, { merge: true });
  console.log(`🗑️ Summary updated for ${monthStr}`);

  await latestTransaction.ref.delete();
  console.log(`🗑️ ✅ Transaction deleted successfully: ${latestTransaction.id}`);

  return { success: true, message: "ลบรายการล่าสุดเรียบร้อย", deletedData: data };
}

/**
 * ดึงรายการล่าสุด 1 รายการ สำหรับ preview ก่อนลบ
 */
async function getLastTransaction(userId) {
  const db = getFirestore();
  const snapshot = await db.collection("accounting_transactions")
    .where("userId", "==", userId)
    .get();

  if (snapshot.empty) return null;

  // Sort client-side by createdAt (descending)
  const transactions = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  transactions.sort((a, b) => {
    const timeA = a.createdAt?.toMillis() || 0;
    const timeB = b.createdAt?.toMillis() || 0;
    return timeB - timeA;
  });

  return transactions[0];
}

/**
 * ลบรายการตาม ID
 */
async function deleteTransactionById(userId, transactionId) {
  const db = getFirestore();
  console.log(`🗑️ Delete by ID request: ${transactionId} for user: ${userId}`);

  const docRef = db.collection("accounting_transactions").doc(transactionId);
  const doc = await docRef.get();

  if (!doc.exists) {
    return { success: false, message: "ไม่พบรายการที่ต้องการลบ" };
  }

  const data = doc.data();

  // ตรวจสอบว่าเป็นของ user นี้
  if (data.userId !== userId) {
    return { success: false, message: "ไม่มีสิทธิ์ลบรายการนี้" };
  }

  // Revert summary
  const monthStr = data.month;
  const summaryRef = db.collection("accounting_summary").doc(`${userId}_${monthStr}`);
  const decrement = data.type === "income" ?
    { totalIncome: FieldValue.increment(-data.amount), transactionCount: FieldValue.increment(-1) } :
    { totalExpense: FieldValue.increment(-data.amount), transactionCount: FieldValue.increment(-1) };

  await summaryRef.set(decrement, { merge: true });
  await docRef.delete();

  console.log(`🗑️ ✅ Transaction ${transactionId} deleted`);
  return { success: true, message: "ลบรายการสำเร็จ", deletedData: data };
}

/**
 * ลบรายการทั้งหมดของ user ในเดือนปัจจุบัน
 */
async function deleteAllTransactions(userId, month = null) {
  const db = getFirestore();
  const targetMonth = month || new Date().toISOString().slice(0, 7); // YYYY-MM

  console.log(`🗑️ Delete ALL request for user: ${userId}, month: ${targetMonth}`);

  const snapshot = await db.collection("accounting_transactions")
    .where("userId", "==", userId)
    .where("month", "==", targetMonth)
    .get();

  if (snapshot.empty) {
    return { success: false, message: "ไม่พบรายการในเดือนนี้", count: 0 };
  }

  const batch = db.batch();
  let totalIncome = 0;
  let totalExpense = 0;

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    if (data.type === "income") totalIncome += data.amount;
    else totalExpense += data.amount;
    batch.delete(doc.ref);
  });

  // Reset summary
  const summaryRef = db.collection("accounting_summary").doc(`${userId}_${targetMonth}`);
  batch.set(summaryRef, {
    totalIncome: FieldValue.increment(-totalIncome),
    totalExpense: FieldValue.increment(-totalExpense),
    transactionCount: FieldValue.increment(-snapshot.size),
  }, { merge: true });

  await batch.commit();

  console.log(`🗑️ ✅ Deleted ${snapshot.size} transactions`);
  return { success: true, message: `ลบ ${snapshot.size} รายการสำเร็จ`, count: snapshot.size };
}

/**
 * แก้ไขรายการ
 */
async function updateTransaction(userId, transactionId, updates) {
  const db = getFirestore();
  console.log(`✏️ Update request: ${transactionId} for user: ${userId}`);

  const docRef = db.collection("accounting_transactions").doc(transactionId);
  const doc = await docRef.get();

  if (!doc.exists) {
    return { success: false, message: "ไม่พบรายการที่ต้องการแก้ไข" };
  }

  const oldData = doc.data();

  if (oldData.userId !== userId) {
    return { success: false, message: "ไม่มีสิทธิ์แก้ไขรายการนี้" };
  }

  // ถ้าแก้จำนวนเงิน ต้อง update summary
  if (updates.amount && updates.amount !== oldData.amount) {
    const monthStr = oldData.month;
    const summaryRef = db.collection("accounting_summary").doc(`${userId}_${monthStr}`);
    const diff = updates.amount - oldData.amount;

    const change = oldData.type === "income" ?
      { totalIncome: FieldValue.increment(diff) } :
      { totalExpense: FieldValue.increment(diff) };

    await summaryRef.set(change, { merge: true });
  }

  await docRef.update({
    ...updates,
    updatedAt: FieldValue.serverTimestamp(),
  });

  console.log(`✏️ ✅ Transaction ${transactionId} updated`);
  return { success: true, message: "แก้ไขรายการสำเร็จ", oldData, newData: { ...oldData, ...updates } };
}

/**
 * ดึงรายการล่าสุด 10 รายการ สำหรับเลือกลบ/แก้ไข
 */
async function getTransactionsForSelection(userId, limit = 10) {
  const db = getFirestore();
  const snapshot = await db.collection("accounting_transactions")
    .where("userId", "==", userId)
    .get();

  if (snapshot.empty) return [];

  const transactions = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  transactions.sort((a, b) => {
    const timeA = a.createdAt?.toMillis() || 0;
    const timeB = b.createdAt?.toMillis() || 0;
    return timeB - timeA;
  });

  return transactions.slice(0, limit);
}

async function getRecentTransactions(userId, limit = 5) {
  const db = getFirestore();
  const snapshot = await db.collection("accounting_transactions")
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

// ==========================================
// 🎨 FLEX MESSAGE GENERATORS
// ==========================================

function createTransactionReceipt(transaction) {
  const isIncome = transaction.type === "income";
  const color = isIncome ? "#06c755" : "#ef454d"; // Green : Red
  const icon = isIncome ? "💰" : "💸";
  const title = isIncome ? "รายรับ" : "รายจ่าย";

  // Format Date: "8 ธ.ค. 2568"
  const dateObj = new Date(transaction.date);
  const dateText = dateObj.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });

  return {
    type: "flex",
    altText: `บันทึก${title}: ${transaction.amount} บาท`,
    contents: {
      type: "bubble",
      size: "kilo",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: "บันทึกสำเร็จ", color: "#ffffff", weight: "bold", size: "sm" },
          { type: "text", text: `${icon} ${title}`, color: "#ffffff", weight: "bold", size: "xl", margin: "sm" },
        ],
        backgroundColor: color,
        paddingAll: "20px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: "จำนวนเงิน", color: "#aaaaaa", size: "xs" },
          { type: "text", text: `฿${transaction.amount.toLocaleString()}`, color: "#333333", size: "3xl", weight: "bold", margin: "sm" },
          { type: "separator", margin: "lg" },
          {
            type: "box", layout: "horizontal", margin: "lg",
            contents: [
              { type: "text", text: "หมวดหมู่", color: "#aaaaaa", size: "sm", flex: 1 },
              { type: "text", text: transaction.category, color: "#333333", size: "sm", flex: 2, align: "end" },
            ],
          },
          {
            type: "box", layout: "horizontal", margin: "md",
            contents: [
              { type: "text", text: "รายละเอียด", color: "#aaaaaa", size: "sm", flex: 1 },
              { type: "text", text: transaction.description, color: "#333333", size: "sm", flex: 2, align: "end", wrap: true },
            ],
          },
          ...(transaction.quantity ? [{
            type: "box", layout: "horizontal", margin: "md",
            contents: [
              { type: "text", text: "จำนวน", color: "#aaaaaa", size: "sm", flex: 1 },
              { type: "text", text: `${transaction.quantity} ${transaction.unit}`, color: "#333333", size: "sm", flex: 2, align: "end" },
            ],
          }] : []),
          {
            type: "box", layout: "horizontal", margin: "md",
            contents: [
              { type: "text", text: "วันที่", color: "#aaaaaa", size: "sm", flex: 1 },
              { type: "text", text: dateText, color: "#333333", size: "sm", flex: 2, align: "end" },
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
            style: "secondary",
            color: "#666666",
            height: "sm",
            action: { type: "message", label: "ลบรายการ", text: "ลบรายการล่าสุด" },
            flex: 1,
          },
          {
            type: "button",
            style: "primary",
            color: color,
            height: "sm",
            action: { type: "message", label: "ดูสรุป", text: "สรุปยอดเดือนนี้" },
            flex: 1,
          },
        ],
      },
    },
  };
}

function createReportFlex(report) {
  const profit = report.profit;
  const isProfit = profit >= 0;
  const profitColor = isProfit ? "#06c755" : "#ef454d";
  const profitIcon = isProfit ? "✅" : "❌";

  // แปล period เป็นภาษาไทย
  const periodMap = {
    "today": "วันนี้",
    "week": "สัปดาห์นี้",
    "month": "เดือนนี้",
    "year": "ปีนี้",
    "all": "ทั้งหมด",
  };
  const periodThai = periodMap[report.period] || report.period;

  // Top Expenses (simpler format)
  const topExpensesList = Object.entries(report.categoryBreakdown.expense || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat, amt]) => `• ${cat}: ฿${amt.toLocaleString()}`)
    .join("\n");

  return {
    type: "flex",
    altText: `สรุปบัญชี: ${isProfit ? "กำไร" : "ขาดทุน"} ${Math.abs(profit).toLocaleString()} บาท`,
    contents: {
      type: "bubble",
      size: "kilo",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "📊 สรุปบัญชี",
            weight: "bold",
            size: "xl",
            color: "#1DB446",
          },
          {
            type: "text",
            text: `ช่วง: ${periodThai}`,
            size: "sm",
            color: "#888888",
            margin: "sm",
          },
          {
            type: "separator",
            margin: "lg",
          },
          {
            type: "box",
            layout: "horizontal",
            margin: "lg",
            contents: [
              {
                type: "text",
                text: "💰 รายรับ",
                size: "sm",
                color: "#555555",
                flex: 1,
              },
              {
                type: "text",
                text: `฿${report.totalIncome.toLocaleString()}`,
                size: "sm",
                color: "#06c755",
                weight: "bold",
                align: "end",
              },
            ],
          },
          {
            type: "box",
            layout: "horizontal",
            margin: "md",
            contents: [
              {
                type: "text",
                text: "💸 รายจ่าย",
                size: "sm",
                color: "#555555",
                flex: 1,
              },
              {
                type: "text",
                text: `฿${report.totalExpense.toLocaleString()}`,
                size: "sm",
                color: "#ef454d",
                weight: "bold",
                align: "end",
              },
            ],
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
                text: `${profitIcon} ${isProfit ? "กำไรสุทธิ" : "ขาดทุนสุทธิ"}`,
                size: "md",
                color: "#333333",
                align: "center",
              },
              {
                type: "text",
                text: `฿${Math.abs(profit).toLocaleString()}`,
                size: "xxl",
                color: profitColor,
                weight: "bold",
                align: "center",
                margin: "sm",
              },
            ],
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: `📅 ${report.startDate} - ${report.endDate}`,
            size: "xs",
            color: "#aaaaaa",
            align: "center",
          },
        ],
      },
    },
  };
}

function createRecentListFlex(transactions) {
  if (transactions.length === 0) {
    return {
      type: "flex",
      altText: "ยังไม่มีรายการ",
      contents: {
        type: "bubble",
        body: {
          type: "box", layout: "vertical",
          contents: [
            { type: "text", text: "📝 ยังไม่มีรายการบันทึก", align: "center", color: "#aaaaaa" },
            { type: "text", text: "ลองพิมพ์: ขายข้าว 5000", align: "center", color: "#666666", size: "sm", margin: "md" },
          ],
        },
      },
    };
  }

  // สร้างรายการพร้อมปุ่มลบ/แก้ไข
  const rows = transactions.map((tx, index) => {
    const isIncome = tx.type === "income";
    const num = index + 1;
    return {
      type: "box", layout: "horizontal", margin: "md", spacing: "sm",
      contents: [
        { type: "text", text: `${num}.`, flex: 0, size: "sm", color: "#888888" },
        { type: "text", text: isIncome ? "💰" : "💸", flex: 0, size: "sm" },
        {
          type: "box", layout: "vertical", flex: 4,
          contents: [
            { type: "text", text: tx.category, size: "sm", color: "#333333", weight: "bold" },
            { type: "text", text: `${isIncome ? "+" : "-"}฿${tx.amount.toLocaleString()} • ${tx.date}`, size: "xxs", color: isIncome ? "#06c755" : "#ef454d" },
          ],
        },
        {
          type: "box", layout: "horizontal", flex: 0, spacing: "xs",
          contents: [
            {
              type: "button",
              style: "primary",
              color: "#4CAF50",
              height: "sm",
              action: { type: "message", label: "✏️", text: `แก้#${num}` },
              flex: 0,
              adjustMode: "shrink-to-fit",
            },
            {
              type: "button",
              style: "primary",
              color: "#ff6b6b",
              height: "sm",
              action: { type: "message", label: "🗑️", text: `ลบ#${num}` },
              flex: 0,
              adjustMode: "shrink-to-fit",
            },
          ],
        },
      ],
    };
  });

  return {
    type: "flex",
    altText: "รายการล่าสุด",
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box", layout: "horizontal",
        contents: [
          { type: "text", text: "📋 รายการล่าสุด", weight: "bold", size: "lg", flex: 4 },
          { type: "text", text: `${transactions.length} รายการ`, size: "sm", color: "#888888", align: "end", flex: 2 },
        ],
      },
      body: {
        type: "box", layout: "vertical",
        contents: rows,
      },
      footer: {
        type: "box", layout: "horizontal", spacing: "sm",
        contents: [
          {
            type: "button",
            style: "secondary",
            height: "sm",
            action: { type: "message", label: "📊 สรุป", text: "สรุปเดือน" },
            flex: 1,
          },
          {
            type: "button",
            style: "primary",
            color: "#ff6b6b",
            height: "sm",
            action: { type: "message", label: "🗑️ ลบทั้งหมด", text: "ลบทั้งหมด" },
            flex: 1,
          },
        ],
      },
    },
  };
}

/**
 * 🗑️ สร้าง Flex Message ยืนยันการลบ
 */
function createDeleteConfirmFlex(transaction) {
  if (!transaction) {
    return {
      type: "flex",
      altText: "ไม่พบรายการที่จะลบ",
      contents: {
        type: "bubble",
        size: "kilo",
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "⚠️ ไม่พบรายการ",
              weight: "bold",
              size: "lg",
              color: "#ff6b6b",
              align: "center",
            },
            {
              type: "text",
              text: "ไม่มีรายการบันทึกที่จะลบ",
              size: "sm",
              color: "#888888",
              align: "center",
              margin: "md",
            },
          ],
        },
      },
    };
  }

  const isIncome = transaction.type === "income";
  const typeText = isIncome ? "💰 รายรับ" : "💸 รายจ่าย";
  const typeColor = isIncome ? "#06c755" : "#ef454d";

  // Format date
  const dateText = transaction.date || "ไม่ระบุ";

  return {
    type: "flex",
    altText: `ยืนยันลบ: ${transaction.category} ฿${transaction.amount.toLocaleString()}`,
    contents: {
      type: "bubble",
      size: "kilo",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "🗑️ ยืนยันการลบ?",
            weight: "bold",
            size: "lg",
            color: "#ff6b6b",
            align: "center",
          },
          {
            type: "text",
            text: "รายการที่จะลบ:",
            size: "sm",
            color: "#888888",
            margin: "lg",
          },
          {
            type: "separator",
            margin: "md",
          },
          {
            type: "box",
            layout: "horizontal",
            margin: "lg",
            contents: [
              {
                type: "text",
                text: "ประเภท",
                size: "sm",
                color: "#888888",
                flex: 1,
              },
              {
                type: "text",
                text: typeText,
                size: "sm",
                color: typeColor,
                weight: "bold",
                align: "end",
              },
            ],
          },
          {
            type: "box",
            layout: "horizontal",
            margin: "sm",
            contents: [
              {
                type: "text",
                text: "หมวดหมู่",
                size: "sm",
                color: "#888888",
                flex: 1,
              },
              {
                type: "text",
                text: transaction.category || "-",
                size: "sm",
                color: "#333333",
                align: "end",
              },
            ],
          },
          {
            type: "box",
            layout: "horizontal",
            margin: "sm",
            contents: [
              {
                type: "text",
                text: "จำนวนเงิน",
                size: "sm",
                color: "#888888",
                flex: 1,
              },
              {
                type: "text",
                text: `฿${transaction.amount.toLocaleString()}`,
                size: "md",
                color: typeColor,
                weight: "bold",
                align: "end",
              },
            ],
          },
          {
            type: "box",
            layout: "horizontal",
            margin: "sm",
            contents: [
              {
                type: "text",
                text: "วันที่",
                size: "sm",
                color: "#888888",
                flex: 1,
              },
              {
                type: "text",
                text: dateText,
                size: "sm",
                color: "#333333",
                align: "end",
              },
            ],
          },
          {
            type: "box",
            layout: "horizontal",
            margin: "sm",
            contents: [
              {
                type: "text",
                text: "รายละเอียด",
                size: "sm",
                color: "#888888",
                flex: 1,
              },
              {
                type: "text",
                text: transaction.description || "-",
                size: "sm",
                color: "#333333",
                align: "end",
                wrap: true,
              },
            ],
          },
        ],
      },
      footer: {
        type: "box",
        layout: "horizontal",
        spacing: "md",
        contents: [
          {
            type: "button",
            style: "secondary",
            height: "sm",
            action: {
              type: "message",
              label: "❌ ยกเลิก",
              text: "ยกเลิกการลบ",
            },
            flex: 1,
          },
          {
            type: "button",
            style: "primary",
            color: "#ff6b6b",
            height: "sm",
            action: {
              type: "message",
              label: "🗑️ ยืนยันลบ",
              text: "ยืนยันลบรายการล่าสุด",
            },
            flex: 1,
          },
        ],
      },
    },
  };
}

/**
 * Flex Message: แสดงรายการให้เลือกลบ/แก้ไข
 */
function createSelectionFlex(transactions, action = "delete") {
  if (!transactions || transactions.length === 0) {
    return {
      type: "text",
      text: "⚠️ ไม่พบรายการ",
    };
  }

  const actionLabel = action === "delete" ? "🗑️ เลือกลบ" : "✏️ เลือกแก้ไข";
  // ใช้เลข index แทน ID ยาวๆ
  const actionPrefix = action === "delete" ? "ลบ#" : "แก้#";

  const items = transactions.slice(0, 10).map((tx, index) => {
    const emoji = tx.type === "income" ? "💰" : "💸";
    const color = tx.type === "income" ? "#06c755" : "#ef454d";
    const sign = tx.type === "income" ? "+" : "-";
    const num = index + 1; // 1-based for display
    return {
      type: "box",
      layout: "horizontal",
      spacing: "sm",
      margin: index === 0 ? "none" : "lg",
      contents: [
        {
          type: "text",
          text: `${num}.`,
          size: "sm",
          color: "#888888",
          flex: 0,
          gravity: "center",
        },
        {
          type: "box",
          layout: "vertical",
          flex: 5,
          contents: [
            {
              type: "text",
              text: `${emoji} ${tx.category}`,
              size: "sm",
              weight: "bold",
              color: "#333333",
            },
            {
              type: "text",
              text: `${sign}฿${tx.amount.toLocaleString()} • ${tx.date}`,
              size: "xs",
              color: color,
            },
          ],
        },
        {
          type: "button",
          style: "primary",
          color: action === "delete" ? "#ff6b6b" : "#4CAF50",
          height: "sm",
          action: {
            type: "message",
            label: action === "delete" ? "🗑️" : "✏️",
            text: `${actionPrefix}${num}`,
          },
          flex: 0,
          gravity: "center",
        },
      ],
    };
  });

  return {
    type: "flex",
    altText: actionLabel,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: action === "delete" ? "#ff6b6b" : "#4CAF50",
        paddingAll: "lg",
        contents: [
          {
            type: "text",
            text: actionLabel,
            weight: "bold",
            size: "lg",
            color: "#ffffff",
          },
          {
            type: "text",
            text: `กดปุ่มเพื่อ${action === "delete" ? "ลบ" : "แก้ไข"}รายการ`,
            size: "xs",
            color: "#ffffff",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: items,
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            style: "secondary",
            action: {
              type: "message",
              label: "❌ ปิด",
              text: "ยกเลิกการลบ",
            },
          },
        ],
      },
    },
  };
}

/**
 * Flex Message: ยืนยันลบทั้งหมด
 */
function createDeleteAllConfirmFlex(count, month) {
  const monthNames = ["", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const [year, monthNum] = month.split("-");
  const monthText = `${monthNames[parseInt(monthNum)]} ${parseInt(year) + 543}`;

  return {
    type: "flex",
    altText: `⚠️ ยืนยันลบทั้งหมด ${count} รายการ`,
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#ff6b6b",
        paddingAll: "lg",
        contents: [
          {
            type: "text",
            text: "⚠️ ลบทั้งหมด?",
            weight: "bold",
            size: "xl",
            color: "#ffffff",
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
            text: `คุณกำลังจะลบ ${count} รายการ`,
            size: "md",
            weight: "bold",
            align: "center",
          },
          {
            type: "text",
            text: `ในเดือน ${monthText}`,
            size: "sm",
            color: "#888888",
            align: "center",
          },
          {
            type: "separator",
            margin: "lg",
          },
          {
            type: "text",
            text: "⚠️ การกระทำนี้ไม่สามารถยกเลิกได้!",
            size: "sm",
            color: "#ff6b6b",
            align: "center",
            margin: "lg",
          },
        ],
      },
      footer: {
        type: "box",
        layout: "horizontal",
        spacing: "md",
        contents: [
          {
            type: "button",
            style: "secondary",
            action: {
              type: "message",
              label: "❌ ยกเลิก",
              text: "ยกเลิกการลบ",
            },
            flex: 1,
          },
          {
            type: "button",
            style: "primary",
            color: "#ff6b6b",
            action: {
              type: "message",
              label: "🗑️ ลบทั้งหมด",
              text: "ยืนยันลบทั้งหมด",
            },
            flex: 1,
          },
        ],
      },
    },
  };
}

/**
 * Flex Message: เลือกแก้ไขอะไร
 */
function createEditOptionsFlex(transaction) {
  if (!transaction) {
    return { type: "text", text: "⚠️ ไม่พบรายการที่ต้องการแก้ไข" };
  }

  const emoji = transaction.type === "income" ? "💰" : "💸";
  const typeText = transaction.type === "income" ? "รายรับ" : "รายจ่าย";

  return {
    type: "flex",
    altText: `✏️ แก้ไข: ${transaction.category}`,
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#4CAF50",
        paddingAll: "lg",
        contents: [
          {
            type: "text",
            text: "✏️ แก้ไขรายการ",
            weight: "bold",
            size: "lg",
            color: "#ffffff",
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
            text: `${emoji} ${typeText}: ${transaction.category}`,
            weight: "bold",
            size: "md",
          },
          {
            type: "text",
            text: `จำนวน: ฿${transaction.amount.toLocaleString()}`,
            size: "sm",
          },
          {
            type: "text",
            text: `วันที่: ${transaction.date}`,
            size: "sm",
            color: "#888888",
          },
          {
            type: "separator",
            margin: "lg",
          },
          {
            type: "text",
            text: "พิมพ์สิ่งที่ต้องการแก้:",
            size: "sm",
            margin: "lg",
          },
          {
            type: "text",
            text: `• "แก้จำนวน 500" - เปลี่ยนเป็น ฿500`,
            size: "xs",
            color: "#666666",
          },
          {
            type: "text",
            text: `• "แก้หมวด ค่าอาหาร" - เปลี่ยนหมวดหมู่`,
            size: "xs",
            color: "#666666",
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            style: "secondary",
            action: {
              type: "message",
              label: "❌ ยกเลิก",
              text: "ยกเลิกแก้ไข",
            },
          },
        ],
      },
    },
  };
}

// ==========================================
// 🎯 MAIN HANDLER
// ==========================================

function isAccountingCommand(text) {
  const lowerText = text.toLowerCase();
  const commands = ["สรุป", "รายงาน", "บัญชี", "รายรับ", "รายจ่าย", "รายการ", "ลบ", "ยืนยันลบ", "ยกเลิกการลบ",
    "เลือกลบ", "ลบทั้งหมด", "แก้ไข", "แก้", "เลือกแก้ไข", "ยกเลิกแก้ไข", "แก้จำนวน", "แก้หมวด",
    "ลบ#", "แก้#",
    // 🆕 New AI Commands
    "วิเคราะห์", "insights", "คำแนะนำ", "แนะนำการเงิน",
    "งบประมาณ", "ตั้งงบ", "เช็คงบ", "budget",
    "เป้าหมาย", "ตั้งเป้า", "ออม", "goal",
    "เปรียบเทียบ", "compare", "เทียบเดือน",
    "รายการประจำ", "recurring", "ประจำเดือน",
    "ส่งออก", "export", "excel", "pdf",
    "กราฟ", "chart", "trend", "แนวโน้ม",
  ];
  const keywords = ["ขาย", "ซื้อ", "จ่าย", "รับ", "ได้", "เสีย", "ค่า", "บาท", "โอน"];

  // 🔧 ตรวจสอบว่าเป็นคำถาม (Question) หรือ คำสั่งบันทึก (Command)
  const questionKeywords = [
    "ช่วย", "คำนวณ", "วิธี", "อย่างไร", "ยังไง", "แนะนำ",
    "เฉลี่ย", "ลด", "ประหยัด", "แบ่ง", "คิด",
    "เท่าไร", "กี่", "เท่าไหร่", "?", "？",
  ];

  // ถ้ามีคำถาม → ไม่ใช่คำสั่งบันทึกบัญชี (ยกเว้นคำสั่ง AI)
  const aiCommands = ["วิเคราะห์", "คำแนะนำ", "แนะนำการเงิน", "insights"];
  if (questionKeywords.some((q) => lowerText.includes(q)) && !aiCommands.some((cmd) => lowerText.includes(cmd))) {
    return false;
  }

  if (commands.some((cmd) => lowerText.includes(cmd))) return true;
  return /\d/.test(text) && keywords.some((kw) => lowerText.includes(kw));
}

// ==========================================
// 💎 FREEMIUM QUOTA SYSTEM
// ==========================================

/**
 * นับจำนวนรายการบัญชีในเดือนปัจจุบัน
 */
async function getMonthlyTransactionCount(userId) {
  const db = getFirestore();
  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const snapshot = await db.collection("accounting_transactions")
    .where("userId", "==", userId)
    .where("month", "==", monthStr)
    .get();

  return snapshot.size;
}

/**
 * ตรวจสอบ Quota และ Premium Status
 * @returns {Object} {canRecord: boolean, isPremium: boolean, used: number, limit: number, message?: string}
 */
async function checkAccountingQuota(userId) {
  const db = getFirestore();

  // 👑 Super Admin IDs - ได้ Premium อัตโนมัติ
  const SUPER_ADMIN_IDS = ["Ud9bec6d2ea945cf4330a69cb74ac93cf", "U9b40807cbcc8182928a12e3b6b73330e"];

  // Super Admin = unlimited access
  if (SUPER_ADMIN_IDS.includes(userId)) {
    console.log(`👑 Super Admin detected - unlimited accounting access`);
    return {
      canRecord: true,
      isPremium: true,
      used: 0,
      limit: -1,
      remaining: -1,
    };
  }

  // ตรวจสอบ Premium status จาก line_users (เหมือนระบบอื่นๆ)
  const userRef = db.collection("line_users").doc(userId);
  const userDoc = await userRef.get();
  const userData = userDoc.exists ? userDoc.data() : {};

  // ตรวจสอบหลายฟิลด์: isPremium, subscriptionStatus, premiumTier
  const isPremium = userData.isPremium === true ||
    userData.subscriptionStatus === "active" ||
    userData.premiumTier === "premium";
  const premiumExpiry = userData.premiumExpiry?.toDate?.() || userData.premiumExpiry;

  // ตรวจสอบว่า Premium หมดอายุหรือยัง
  let isValidPremium = isPremium;
  if (premiumExpiry && new Date(premiumExpiry) < new Date()) {
    isValidPremium = false;
  }

  // Premium users = unlimited
  if (isValidPremium) {
    return {
      canRecord: true,
      isPremium: true,
      used: 0,
      limit: -1, // unlimited
      remaining: -1,
    };
  }

  // Free users = check quota
  const usedCount = await getMonthlyTransactionCount(userId);
  const remaining = FREE_ACCOUNTING_LIMIT - usedCount;

  if (usedCount >= FREE_ACCOUNTING_LIMIT) {
    return {
      canRecord: false,
      isPremium: false,
      used: usedCount,
      limit: FREE_ACCOUNTING_LIMIT,
      remaining: 0,
      message: `❌ หมดโควต้าบันทึกบัญชีเดือนนี้แล้ว\n\n📊 ใช้ไป: ${usedCount}/${FREE_ACCOUNTING_LIMIT} รายการ\n\n💎 อัปเกรดเป็น Premium เพื่อบันทึกไม่จำกัด!\n\nพิมพ์ "สมัครสมาชิก" เพื่อดูแพ็คเกจ`,
    };
  }

  return {
    canRecord: true,
    isPremium: false,
    used: usedCount,
    limit: FREE_ACCOUNTING_LIMIT,
    remaining: remaining,
  };
}

/**
 * สร้าง Flex Message แจ้งเตือน Quota
 */
function createQuotaWarningFlex(quotaInfo) {
  const percentage = Math.round((quotaInfo.used / quotaInfo.limit) * 100);
  const barWidth = Math.min(percentage, 100);

  return {
    type: "flex",
    altText: `⚠️ เหลือโควต้า ${quotaInfo.remaining} รายการ`,
    contents: {
      type: "bubble",
      size: "kilo",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "⚠️ โควต้าใกล้หมด",
            weight: "bold",
            size: "lg",
            color: "#f57c00",
          },
          {
            type: "text",
            text: `เหลืออีก ${quotaInfo.remaining} รายการในเดือนนี้`,
            size: "sm",
            color: "#666666",
            margin: "md",
          },
          {
            type: "box",
            layout: "vertical",
            margin: "lg",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: `${quotaInfo.used}/${quotaInfo.limit}`,
                    size: "sm",
                    color: "#666666",
                  },
                  {
                    type: "text",
                    text: `${percentage}%`,
                    size: "sm",
                    color: "#f57c00",
                    align: "end",
                  },
                ],
              },
              {
                type: "box",
                layout: "vertical",
                margin: "sm",
                height: "6px",
                backgroundColor: "#e0e0e0",
                cornerRadius: "3px",
                contents: [
                  {
                    type: "box",
                    layout: "vertical",
                    width: `${barWidth}%`,
                    height: "6px",
                    backgroundColor: percentage >= 90 ? "#ef454d" : "#f57c00",
                    cornerRadius: "3px",
                    contents: [],
                  },
                ],
              },
            ],
          },
        ],
        paddingAll: "16px",
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#4CAF50",
            height: "sm",
            action: {
              type: "message",
              label: "💎 อัปเกรด Premium",
              text: "สมัครสมาชิก",
            },
          },
        ],
      },
    },
  };
}

/**
 * สร้าง Flex Message แจ้งหมด Quota
 */
function createQuotaExceededFlex(quotaInfo) {
  return {
    type: "flex",
    altText: "❌ หมดโควต้าบันทึกบัญชีเดือนนี้",
    contents: {
      type: "bubble",
      size: "kilo",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "❌ หมดโควต้าแล้ว",
            weight: "bold",
            size: "lg",
            color: "#ef454d",
          },
          {
            type: "text",
            text: `ใช้ครบ ${quotaInfo.limit} รายการในเดือนนี้แล้ว`,
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
                text: "💎 อัปเกรดเป็น Premium",
                weight: "bold",
                size: "sm",
                color: "#333333",
              },
              {
                type: "text",
                text: "• บันทึกบัญชีไม่จำกัด",
                size: "sm",
                color: "#666666",
                margin: "sm",
              },
              {
                type: "text",
                text: "• Dashboard Pro + วิเคราะห์ AI",
                size: "sm",
                color: "#666666",
                margin: "sm",
              },
              {
                type: "text",
                text: "• Export Excel/PDF",
                size: "sm",
                color: "#666666",
                margin: "sm",
              },
            ],
          },
        ],
        paddingAll: "16px",
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
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
          {
            type: "button",
            style: "secondary",
            action: {
              type: "message",
              label: "📊 ดูสรุปบัญชี (ฟรี)",
              text: "สรุปเดือน",
            },
          },
        ],
      },
    },
  };
}

async function handleAccountingCommand(userId, text, businessType = "farm") {
  const lowerText = text.toLowerCase();

  try {
    // =====================================================
    // 🆕 MENU & HELP COMMANDS (ต้องเช็คก่อนสุด)
    // =====================================================

    // เมนูบัญชี (Flex Carousel)
    if (lowerText === "เมนูบัญชี" || lowerText === "menu" || lowerText === "เมนู acc") {
      console.log(`📊 Accounting menu request for user: ${userId}`);
      return { handled: true, response: createAccountingMenuFlex() };
    }

    // วิธีใช้บัญชี / Help
    if (lowerText === "วิธีใช้บัญชี" || lowerText === "help acc" || lowerText === "คู่มือบัญชี") {
      console.log(`📖 Accounting guide request for user: ${userId}`);
      return { handled: true, response: createAccountingGuideMessage() };
    }

    // =====================================================
    // 💎 QUOTA CHECK - สำหรับคำสั่งที่จะบันทึกข้อมูล
    // =====================================================
    // คำสั่งที่ไม่ต้องเช็ค quota (ดูสรุป/รายงาน)
    const freeCommands = [
      "สรุป", "dashboard", "acc", "/acc", "ภาพรวม", "เช็คงบ", "งบประมาณ", "budget",
      "เป้าหมาย", "goal", "ดูเป้า", "วิเคราะห์", "insights", "คำแนะนำ", "advice",
      "เปรียบเทียบ", "compare", "12 เดือน", "รายปี", "yearly", "ลบ", "ยกเลิก",
      "ดูรายการ", "รายการล่าสุด", "เลือกลบ", "โควต้า", "quota",
    ];

    const isRecordingCommand = !freeCommands.some((cmd) => lowerText.includes(cmd));

    // ตรวจสอบโควต้าสำหรับคำสั่งบันทึก
    if (isRecordingCommand && /\d/.test(text)) {
      const quotaInfo = await checkAccountingQuota(userId);

      if (!quotaInfo.canRecord) {
        console.log(`⚠️ Quota exceeded for user: ${userId} (${quotaInfo.used}/${quotaInfo.limit})`);
        return { handled: true, response: createQuotaExceededFlex(quotaInfo) };
      }

      // แจ้งเตือนเมื่อโควต้าเหลือน้อย (< 5 รายการ) - เฉพาะ Free users
      if (!quotaInfo.isPremium && quotaInfo.remaining <= 5 && quotaInfo.remaining > 0) {
        console.log(`⚠️ Quota warning for user: ${userId} (${quotaInfo.remaining} remaining)`);
        // เก็บไว้แจ้งหลังบันทึกสำเร็จ
        // quotaWarning will be handled after successful save
      }
    }

    // =====================================================
    // � RETAIL SHOP COMMANDS (ต้องเช็คก่อน AI)
    // =====================================================

    // เมนูร้านค้า
    if (lowerText === "เมนูร้านค้า" || lowerText === "shop menu" || lowerText === "ร้านค้า menu") {
      console.log(`🏪 Shop menu request for user: ${userId}`);
      return { handled: true, response: createShopMenuFlex() };
    }

    // Dashboard ร้านค้า
    if (lowerText === "ร้านค้า" || lowerText === "shop" || lowerText === "shop dashboard") {
      console.log(`🏪 Shop dashboard request for user: ${userId}`);
      const profit = await getShopProfit(userId, "today");
      const channels = await getSalesByChannel(userId, "today");
      return { handled: true, response: createShopDashboardFlex(profit, channels) };
    }

    // กำไรวันนี้
    if (lowerText.includes("กำไรวันนี้") || lowerText === "profit today" || lowerText === "กำไร วันนี้") {
      console.log(`💵 Today's profit request for user: ${userId}`);
      const profit = await getShopProfit(userId, "today");
      const channels = await getSalesByChannel(userId, "today");
      return { handled: true, response: createShopDashboardFlex(profit, channels) };
    }

    // กำไรเมื่อวาน
    if (lowerText.includes("กำไรเมื่อวาน") || lowerText === "profit yesterday") {
      console.log(`💵 Yesterday's profit request for user: ${userId}`);
      const profit = await getShopProfit(userId, "yesterday");
      return { handled: true, response: createShopDashboardFlex(profit, null) };
    }

    // กำไรสัปดาห์
    if (lowerText.includes("กำไรสัปดาห์") || lowerText.includes("กำไร week") || lowerText === "profit week") {
      console.log(`💵 Week's profit request for user: ${userId}`);
      const profit = await getShopProfit(userId, "week");
      const channels = await getSalesByChannel(userId, "week");
      return { handled: true, response: createShopDashboardFlex(profit, channels) };
    }

    // กำไรเดือน
    if (lowerText.includes("กำไรเดือน") || lowerText === "profit month" || lowerText === "กำไร เดือน") {
      console.log(`💵 Month's profit request for user: ${userId}`);
      const profit = await getShopProfit(userId, "month");
      const channels = await getSalesByChannel(userId, "month");
      return { handled: true, response: createShopDashboardFlex(profit, channels) };
    }

    // ยอดตามช่องทาง
    if (lowerText.includes("ยอดตามช่องทาง") || lowerText.includes("ช่องทางขาย") || lowerText === "channels") {
      console.log(`📊 Sales by channel request for user: ${userId}`);
      const channels = await getSalesByChannel(userId, "month");

      if (channels.channels.length === 0) {
        return {
          handled: true,
          response: { type: "text", text: "📊 ยังไม่มียอดขายในเดือนนี้\n\nพิมพ์ \"ขาย 500\" เพื่อบันทึกยอดขาย" },
        };
      }

      let text = `📊 ยอดขายตามช่องทาง (${channels.period})\n\n`;
      channels.channels.forEach((ch, i) => {
        const emoji = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "📌";
        text += `${emoji} ${ch.name}: ฿${ch.amount.toLocaleString()} (${ch.percentage}%)\n`;
      });
      text += `\n💰 รวม: ฿${channels.total.toLocaleString()}`;

      return { handled: true, response: { type: "text", text } };
    }

    // =====================================================
    // �🆕 AI INSIGHTS & ANALYSIS COMMANDS (ต้องเช็คก่อน)
    // =====================================================

    // AI วิเคราะห์การเงิน - ใช้ "วิเคราะห์บัญชี" เพื่อไม่ชนกับคำถามทั่วไป
    if (lowerText.includes("วิเคราะห์บัญชี") || lowerText === "insights" || lowerText.includes("วิเคราะห์การเงิน")) {
      console.log(`🤖 AI Analysis request for user: ${userId}`);
      const insights = await analyzeSpendingPattern(userId);
      return { handled: true, response: createInsightsFlex(insights) };
    }

    // AI คำแนะนำการเงิน
    if (lowerText.includes("คำแนะนำ") || lowerText.includes("แนะนำการเงิน") || lowerText.includes("advice")) {
      console.log(`💡 Financial advice request for user: ${userId}`);
      const advice = await generateFinancialAdvice(userId);
      return { handled: true, response: createAdviceFlex(advice) };
    }

    // เปรียบเทียบเดือน
    if (lowerText.includes("เปรียบเทียบ") || lowerText.includes("เทียบเดือน") || lowerText.includes("compare")) {
      console.log(`📊 Month comparison request for user: ${userId}`);
      const comparison = await getMonthComparison(userId);
      return { handled: true, response: createComparisonFlex(comparison) };
    }

    // =====================================================
    // 🆕 BUDGET COMMANDS
    // =====================================================

    // ตั้งงบประมาณ: "ตั้งงบ อาหาร 5000"
    const setBudgetMatch = text.match(/ตั้งงบ\s*(.+?)\s+(\d+)/);
    if (setBudgetMatch) {
      const category = setBudgetMatch[1].trim();
      const amount = parseInt(setBudgetMatch[2]);
      console.log(`📋 Set budget: ${category} = ${amount}`);
      const result = await setBudget(userId, category, amount);
      return {
        handled: true,
        response: {
          type: "text",
          text: `✅ ตั้งงบประมาณสำเร็จ!\n\n📋 หมวด: ${category}\n💰 งบ: ฿${amount.toLocaleString()}/เดือน\n\nพิมพ์ "เช็คงบ" เพื่อดูสถานะ`,
        },
      };
    }

    // เช็คงบประมาณ
    if (lowerText.includes("เช็คงบ") || lowerText.includes("งบประมาณ") || lowerText.includes("budget")) {
      console.log(`📊 Check budget for user: ${userId}`);
      const budgetStatus = await checkBudgetStatus(userId);
      return { handled: true, response: createBudgetFlex(budgetStatus) };
    }

    // =====================================================
    // 🆕 SAVINGS GOALS COMMANDS
    // =====================================================

    // ตั้งเป้าออม: "ตั้งเป้าออม iPhone 35000"
    const setGoalMatch = text.match(/ตั้งเป้า(?:ออม)?\s*(.+?)\s+(\d+)/);
    if (setGoalMatch) {
      const name = setGoalMatch[1].trim();
      const amount = parseInt(setGoalMatch[2]);
      console.log(`🎯 Set goal: ${name} = ${amount}`);
      const result = await setGoal(userId, name, amount);
      return {
        handled: true,
        response: {
          type: "text",
          text: `✅ ตั้งเป้าหมายสำเร็จ!\n\n🎯 เป้าหมาย: ${name}\n💰 ยอดเป้า: ฿${amount.toLocaleString()}\n\nพิมพ์ "ออมเข้า ${name} xxx" เพื่อเพิ่มเงิน`,
        },
      };
    }

    // ออมเข้าเป้าหมาย: "ออมเข้า iPhone 1000"
    const addToGoalMatch = text.match(/ออม(?:เข้า)?\s*(.+?)\s+(\d+)/);
    if (addToGoalMatch && !lowerText.includes("ตั้งเป้า")) {
      const goalName = addToGoalMatch[1].trim();
      const amount = parseInt(addToGoalMatch[2]);

      // Find goal by name
      const goals = await getGoals(userId);
      const matchingGoal = goals.find((g) => g.name.toLowerCase().includes(goalName.toLowerCase()));

      if (matchingGoal) {
        const result = await addToGoal(userId, matchingGoal.id, amount);
        if (result.success) {
          const emoji = result.completed ? "🎉" : "💰";
          const status = result.completed ? "ถึงเป้าหมายแล้ว!" : `อีก ฿${(result.targetAmount - result.currentAmount).toLocaleString()} ถึงเป้า`;
          return {
            handled: true,
            response: {
              type: "text",
              text: `${emoji} ออมเงินสำเร็จ!\n\n🎯 ${result.name}\n💵 ออมเพิ่ม: ฿${amount.toLocaleString()}\n📊 รวม: ฿${result.currentAmount.toLocaleString()} / ฿${result.targetAmount.toLocaleString()} (${result.percentage}%)\n\n${status}`,
            },
          };
        }
      } else {
        return {
          handled: true,
          response: { type: "text", text: `⚠️ ไม่พบเป้าหมาย "${goalName}"\n\nพิมพ์ "ดูเป้าหมาย" เพื่อดูรายการ` },
        };
      }
    }

    // ดูเป้าหมาย
    if (lowerText.includes("เป้าหมาย") || lowerText.includes("goal") || lowerText.includes("ดูเป้า")) {
      console.log(`🎯 Get goals for user: ${userId}`);
      const goals = await getGoals(userId);
      return { handled: true, response: createGoalsFlex(goals) };
    }

    // =====================================================
    // 🆕 CHECK QUOTA COMMAND
    // =====================================================
    if (lowerText.includes("โควต้า") || lowerText === "quota" || lowerText.includes("เช็คโควต้า")) {
      console.log(`📊 Quota check for user: ${userId}`);
      const quotaInfo = await checkAccountingQuota(userId);

      if (quotaInfo.isPremium) {
        return {
          handled: true,
          response: {
            type: "text",
            text: `💎 สถานะ: Premium\n\n✅ บันทึกบัญชีได้ไม่จำกัด!\n\n📊 ใช้งานได้เต็มที่ทุกฟีเจอร์`,
          },
        };
      } else {
        const percentage = Math.round((quotaInfo.used / quotaInfo.limit) * 100);
        return {
          handled: true,
          response: {
            type: "text",
            text: `📊 สถานะโควต้าบัญชี\n\n` +
              `👤 แพ็คเกจ: Free\n` +
              `📝 ใช้ไป: ${quotaInfo.used}/${quotaInfo.limit} รายการ (${percentage}%)\n` +
              `💡 เหลือ: ${quotaInfo.remaining} รายการ\n\n` +
              `${quotaInfo.remaining <= 5 ? "⚠️ โควต้าใกล้หมด! " : ""}` +
              `\n💎 อัปเกรด Premium = บันทึกไม่จำกัด\nพิมพ์ "สมัครสมาชิก" เพื่อดูแพ็คเกจ`,
          },
        };
      }
    }

    // =====================================================
    // 🆕 DASHBOARD PRO (with 12-month trend)
    // =====================================================
    if (lowerText === "dashboard pro" || lowerText.includes("แดชบอร์ดโปร") || lowerText.includes("dashboard+")) {
      console.log(`📊 Dashboard PRO request for user: ${userId}`);
      const stats = await getQuickStats(userId);
      const monthlyData = await getLast12MonthsData(userId);

      // Debug: Log Flex structure
      const flexResponse = createEnhancedDashboardFlex(stats, monthlyData);
      console.log(`📊 Dashboard PRO Flex:`, JSON.stringify(flexResponse).substring(0, 500));

      return { handled: true, response: flexResponse };
    }

    // =====================================================
    // 🆕 DASHBOARD / QUICK STATS (Enhanced)
    // =====================================================
    if (lowerText.includes("dashboard") || lowerText === "acc" || lowerText === "/acc" || lowerText.includes("ภาพรวม")) {
      console.log(`📊 Enhanced Dashboard request for user: ${userId}`);
      const stats = await getQuickStats(userId);
      return { handled: true, response: createEnhancedDashboardFlex(stats, null) };
    }

    // =====================================================
    // 🆕 QUICK INCOME COMMANDS: /รับเงิน, /รับค่าจ้าง, etc.
    // =====================================================
    const quickIncome = parseQuickIncomeCommand(text);
    if (quickIncome) {
      console.log(`💰 Quick Income: ${quickIncome.category} ฿${quickIncome.amount}`);
      const result = await saveTransaction(userId, quickIncome);
      return { handled: true, response: createTransactionReceipt(quickIncome) };
    }

    // =====================================================
    // 🆕 QUICK EXPENSE COMMANDS: /จ่าย, /ค่าใช้จ่าย, etc.
    // =====================================================
    const quickExpense = parseQuickExpenseCommand(text);
    if (quickExpense) {
      console.log(`💸 Quick Expense: ${quickExpense.category} ฿${quickExpense.amount}`);
      const result = await saveTransaction(userId, quickExpense);
      return { handled: true, response: createTransactionReceipt(quickExpense) };
    }

    // =====================================================
    // 🆕 YEARLY / 12-MONTHS REPORTS
    // =====================================================

    // สรุปรายปี (ปีปัจจุบัน)
    if (lowerText.includes("สรุปรายปี") || lowerText.includes("สรุปปีนี้") || lowerText === "yearly") {
      console.log(`📊 Yearly report request for user: ${userId}`);
      const yearData = await getYearlyMonthlyData(userId);
      return { handled: true, response: createYearlyReportFlex(yearData) };
    }

    // สรุปปีย้อนหลัง (เช่น "สรุปปี 2568" หรือ "สรุปปี 2025")
    const yearMatch = text.match(/สรุปปี\s*(\d{4})/);
    if (yearMatch) {
      let year = parseInt(yearMatch[1]);
      if (year > 2500) year -= 543; // แปลง พ.ศ. → ค.ศ.
      console.log(`📊 Yearly report for ${year} request for user: ${userId}`);
      const yearData = await getYearlyMonthlyData(userId, year);
      return { handled: true, response: createYearlyReportFlex(yearData) };
    }

    // สรุป 12 เดือนล่าสุด
    if (lowerText.includes("12 เดือน") || lowerText.includes("12เดือน") || lowerText.includes("สรุป12เดือน")) {
      console.log(`📊 Last 12 months report for user: ${userId}`);
      const data = await getLast12MonthsData(userId);
      return { handled: true, response: createLast12MonthsFlex(data) };
    }

    // =====================================================
    // 1. DELETE COMMANDS - ต้องเช็คก่อน! (เพราะมีคำว่า "ล่าสุด")
    // =====================================================
    console.log(`🔍 Command check - lowerText: "${lowerText}"`);

    // 1a. ยกเลิกการลบ/แก้ไข (Cancel)
    if (lowerText === "ยกเลิกการลบ" || lowerText === "ยกเลิกแก้ไข") {
      return {
        handled: true,
        response: { type: "text", text: "✅ ยกเลิกเรียบร้อย" },
      };
    }

    // 1b. ลบตามเลข index (ลบ#1, ลบ#2) - จากรายการเลือกลบ
    const deleteByIndexMatch = text.match(/ลบ#(\d+)/);
    if (deleteByIndexMatch) {
      const index = parseInt(deleteByIndexMatch[1]) - 1; // convert to 0-based
      console.log(`🗑️ Delete by index: ${index + 1}`);

      // ดึงรายการใหม่แล้วลบตาม index
      const transactions = await getTransactionsForSelection(userId, 10);
      if (index >= 0 && index < transactions.length) {
        const tx = transactions[index];
        const result = await deleteTransactionById(userId, tx.id);
        if (result.success) {
          const deleted = result.deletedData;
          const emoji = deleted.type === "income" ? "💰" : "💸";
          const typeText = deleted.type === "income" ? "รายรับ" : "รายจ่าย";
          return {
            handled: true,
            response: {
              type: "text",
              text: `✅ ลบรายการที่ ${index + 1} สำเร็จ!\n\n` +
                `${emoji} ${typeText}: ${deleted.category}\n` +
                `💵 ฿${deleted.amount.toLocaleString()}\n` +
                `📅 ${deleted.date}`,
            },
          };
        }
      }
      return { handled: true, response: { type: "text", text: `⚠️ ไม่พบรายการที่ ${index + 1}` } };
    }

    // 1c. ลบรายการตาม ID (ลบรายการ#xxxxx) - backward compatible
    const deleteByIdMatch = text.match(/ลบรายการ#(\S+)/);
    if (deleteByIdMatch) {
      const transactionId = deleteByIdMatch[1];
      console.log(`🗑️ Delete by ID: ${transactionId}`);
      const result = await deleteTransactionById(userId, transactionId);
      if (result.success) {
        const deleted = result.deletedData;
        const emoji = deleted.type === "income" ? "💰" : "💸";
        const typeText = deleted.type === "income" ? "รายรับ" : "รายจ่าย";
        return {
          handled: true,
          response: {
            type: "text",
            text: `✅ ลบสำเร็จ!\n\n` +
              `${emoji} ${typeText}: ${deleted.category}\n` +
              `💵 ฿${deleted.amount.toLocaleString()}\n` +
              `📅 ${deleted.date}`,
          },
        };
      } else {
        return { handled: true, response: { type: "text", text: `⚠️ ${result.message}` } };
      }
    }

    // 1d. ยืนยันลบทั้งหมด
    if (lowerText.includes("ยืนยันลบทั้งหมด")) {
      console.log(`🗑️ Delete ALL confirmed!`);
      const currentMonth = new Date().toISOString().slice(0, 7);
      const result = await deleteAllTransactions(userId, currentMonth);
      if (result.success) {
        return {
          handled: true,
          response: { type: "text", text: `🗑️ ลบทั้งหมดสำเร็จ!\n\nลบไป ${result.count} รายการ` },
        };
      } else {
        return { handled: true, response: { type: "text", text: `⚠️ ${result.message}` } };
      }
    }

    // 1d. ยืนยันลบรายการล่าสุด
    if (lowerText.includes("ยืนยันลบ") && !lowerText.includes("ทั้งหมด")) {
      console.log(`🔥 Delete last transaction confirmed!`);
      const result = await deleteLastTransaction(userId);
      if (result.success) {
        const deleted = result.deletedData;
        const typeText = deleted.type === "income" ? "รายรับ" : "รายจ่าย";
        return {
          handled: true,
          response: {
            type: "text",
            text: `🗑️ ลบรายการสำเร็จ!\n\n` +
              `❌ ${typeText}: ${deleted.category}\n` +
              `💰 จำนวน: ฿${deleted.amount.toLocaleString()}\n` +
              `📅 วันที่: ${deleted.date}`,
          },
        };
      } else {
        return { handled: true, response: { type: "text", text: `⚠️ ${result.message}` } };
      }
    }

    // 1e. ลบทั้งหมด (Show Confirm)
    if (lowerText.includes("ลบทั้งหมด") && !lowerText.includes("ยืนยัน")) {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const transactions = await getTransactionsForSelection(userId, 100);
      const monthTransactions = transactions.filter((tx) => tx.month === currentMonth);
      return {
        handled: true,
        response: createDeleteAllConfirmFlex(monthTransactions.length, currentMonth),
        textFallback: `⚠️ ต้องการลบทั้งหมด ${monthTransactions.length} รายการ?\n\nพิมพ์ "ยืนยันลบทั้งหมด" เพื่อยืนยัน`,
      };
    }

    // 1f. เลือกลบ (Show Selection List)
    if (lowerText.includes("เลือกลบ")) {
      const transactions = await getTransactionsForSelection(userId, 10);
      return {
        handled: true,
        response: createSelectionFlex(transactions, "delete"),
        textFallback: "📋 เลือกรายการที่ต้องการลบ",
      };
    }

    // 1g. ลบ (Show Confirm Dialog for Last Transaction)
    if (lowerText.includes("ลบ") && !lowerText.includes("ยืนยัน") && !lowerText.includes("เลือก") && !lowerText.includes("ทั้งหมด")) {
      const lastTx = await getLastTransaction(userId);
      return {
        handled: true,
        response: createDeleteConfirmFlex(lastTx),
        textFallback: lastTx ?
          `🗑️ ยืนยันลบรายการนี้?\n\n` +
          `${lastTx.type === "income" ? "💰 รายรับ" : "💸 รายจ่าย"}: ${lastTx.category}\n` +
          `จำนวน: ฿${lastTx.amount.toLocaleString()}\n` +
          `วันที่: ${lastTx.date}\n\n` +
          `พิมพ์ "ยืนยันลบรายการล่าสุด" เพื่อลบ\n` +
          `พิมพ์ "ยกเลิกการลบ" เพื่อยกเลิก` :
          "⚠️ ไม่พบรายการที่จะลบ",
      };
    }

    // =====================================================
    // 2. EDIT COMMANDS - แก้ไขรายการ
    // =====================================================

    // 2a. แก้ตามเลข index (แก้#1, แก้#2) - จากรายการเลือกแก้ไข
    const editByIndexMatch = text.match(/แก้#(\d+)/);
    if (editByIndexMatch) {
      const index = parseInt(editByIndexMatch[1]) - 1;
      console.log(`✏️ Edit by index: ${index + 1}`);

      const transactions = await getTransactionsForSelection(userId, 10);
      if (index >= 0 && index < transactions.length) {
        const tx = transactions[index];
        return {
          handled: true,
          response: createEditOptionsFlex(tx),
        };
      }
      return { handled: true, response: { type: "text", text: `⚠️ ไม่พบรายการที่ ${index + 1}` } };
    }

    // 2b. แก้ไขรายการตาม ID (แก้ไขรายการ#xxxxx) - backward compatible
    const editByIdMatch = text.match(/แก้ไขรายการ#(\S+)/);
    if (editByIdMatch) {
      const transactionId = editByIdMatch[1];
      const db = getFirestore();
      const doc = await db.collection("accounting_transactions").doc(transactionId).get();
      if (doc.exists && doc.data().userId === userId) {
        return {
          handled: true,
          response: createEditOptionsFlex({ id: transactionId, ...doc.data() }),
        };
      } else {
        return { handled: true, response: { type: "text", text: "⚠️ ไม่พบรายการที่ต้องการแก้ไข" } };
      }
    }

    // 2c. แก้จำนวน xxx (หลังจากเลือกรายการแล้ว)
    const editAmountMatch = text.match(/แก้จำนวน\s*(\d+)/);
    if (editAmountMatch) {
      // ดึงรายการล่าสุดมาแก้ (หรือจาก session)
      const lastTx = await getLastTransaction(userId);
      if (lastTx) {
        const newAmount = parseInt(editAmountMatch[1]);
        const result = await updateTransaction(userId, lastTx.id, { amount: newAmount });
        if (result.success) {
          return {
            handled: true,
            response: {
              type: "text",
              text: `✏️ แก้ไขสำเร็จ!\n\n` +
                `${result.oldData.category}\n` +
                `จำนวนเดิม: ฿${result.oldData.amount.toLocaleString()}\n` +
                `จำนวนใหม่: ฿${newAmount.toLocaleString()}`,
            },
          };
        }
      }
      return { handled: true, response: { type: "text", text: "⚠️ ไม่พบรายการที่จะแก้ไข" } };
    }

    // 2d. แก้หมวด xxx
    const editCategoryMatch = text.match(/แก้หมวด\s*(.+)/);
    if (editCategoryMatch) {
      const lastTx = await getLastTransaction(userId);
      if (lastTx) {
        const newCategory = editCategoryMatch[1].trim();
        const result = await updateTransaction(userId, lastTx.id, { category: newCategory });
        if (result.success) {
          return {
            handled: true,
            response: {
              type: "text",
              text: `✏️ แก้ไขสำเร็จ!\n\n` +
                `หมวดเดิม: ${result.oldData.category}\n` +
                `หมวดใหม่: ${newCategory}`,
            },
          };
        }
      }
      return { handled: true, response: { type: "text", text: "⚠️ ไม่พบรายการที่จะแก้ไข" } };
    }

    // 2d. เลือกแก้ไข (Show Selection List)
    if (lowerText.includes("เลือกแก้ไข") || lowerText.includes("แก้ไขรายการ")) {
      const transactions = await getTransactionsForSelection(userId, 10);
      return {
        handled: true,
        response: createSelectionFlex(transactions, "edit"),
        textFallback: "📋 เลือกรายการที่ต้องการแก้ไข",
      };
    }

    // 2e. แก้ไข (Show Last Transaction to Edit)
    if (lowerText.includes("แก้ไข") || lowerText.includes("แก้")) {
      const lastTx = await getLastTransaction(userId);
      return {
        handled: true,
        response: createEditOptionsFlex(lastTx),
      };
    }

    // =====================================================
    // 3. REPORT COMMANDS
    // =====================================================
    if (lowerText.includes("สรุป") || lowerText.includes("รายงาน")) {
      let period = "month";
      if (lowerText.includes("วัน")) period = "today";
      else if (lowerText.includes("อาทิตย์") || lowerText.includes("สัปดาห์")) period = "week";
      else if (lowerText.includes("ปี")) period = "year";

      const report = await getReport(userId, period);
      const profit = report.profit;
      const textFallback = `📊 สรุปบัญชี\n` +
        `💰 รายรับ: ฿${report.totalIncome.toLocaleString()}\n` +
        `💸 รายจ่าย: ฿${report.totalExpense.toLocaleString()}\n` +
        `${profit >= 0 ? "✅ กำไร" : "❌ ขาดทุน"}: ฿${Math.abs(profit).toLocaleString()}`;
      return { handled: true, response: createReportFlex(report), textFallback };
    }

    // 4. Recent List (ไม่รวมคำสั่งลบ/แก้ไข)
    if ((lowerText.includes("รายการ") || lowerText.includes("ล่าสุด")) && !lowerText.includes("ลบ") && !lowerText.includes("แก้")) {
      const transactions = await getRecentTransactions(userId);
      return { handled: true, response: createRecentListFlex(transactions) };
    }

    // 5. Parse & Save New Transaction
    const transaction = parseTransaction(text, businessType);
    if (transaction) {
      const result = await saveTransaction(userId, transaction);
      return { handled: true, response: createTransactionReceipt(transaction) };
    }

    return { handled: false, response: null };
  } catch (error) {
    console.error("Accounting Error:", error);
    return { handled: true, response: { type: "text", text: `⚠️ ระบบขัดข้อง: ${error.message}` } };
  }
}

function getAccountingHelp(businessType = "farm") {
  // Return simple text or could be upgraded to Flex Message too
  return `🤖 **ระบบบัญชี AI อัจฉริยะ v3.0**\n\n` +
    `📝 **บันทึกรายการ**\n` +
    `   • "ขายข้าว 5000"\n` +
    `   • "ซื้อปุ๋ย 1200"\n` +
    `   • "จ่ายค่าไฟ 500"\n` +
    `   • "เมื่อวานขายมะม่วง 2000"\n\n` +
    `📊 **ดูรายงาน**\n` +
    `   • "สรุป" / "สรุปวันนี้" / "สรุปเดือน"\n` +
    `   • "เปรียบเทียบเดือน"\n\n` +
    `🤖 **AI วิเคราะห์** 🆕\n` +
    `   • "วิเคราะห์" - AI วิเคราะห์พฤติกรรม\n` +
    `   • "คำแนะนำการเงิน" - รับคำแนะนำ\n\n` +
    `📋 **งบประมาณ** 🆕\n` +
    `   • "ตั้งงบ อาหาร 5000"\n` +
    `   • "เช็คงบ"\n\n` +
    `🎯 **เป้าหมายออม** 🆕\n` +
    `   • "ตั้งเป้าออม iPhone 35000"\n` +
    `   • "ออมเข้า iPhone 1000"\n` +
    `   • "ดูเป้าหมาย"\n\n` +
    `✏️ **จัดการ**\n` +
    `   • "ลบ" - ลบรายการล่าสุด\n` +
    `   • "เลือกลบ" - เลือกรายการลบ\n` +
    `   • "แก้ไข" - แก้ไขรายการ`;
}

// ==========================================
// 🆕 QUICK INCOME COMMANDS (คำสั่งลัดรายรับ)
// ==========================================

/**
 * Parse Quick Income Command: /รับเงิน, /รับค่าจ้าง, /รายรับ, etc.
 */
function parseQuickIncomeCommand(text) {
  const lowerText = text.toLowerCase();

  // Pattern: /รับเงิน 5000 หรือ รับเงิน 5000 ค่าขายของ
  const incomePatterns = [
    { regex: /[\/]?รับเงิน\s*(\d+(?:,\d{3})*)\s*(.*)?/i, category: "รับเงิน" },
    { regex: /[\/]?รับค่าจ้าง\s*(\d+(?:,\d{3})*)\s*(.*)?/i, category: "รับจ้าง" },
    { regex: /[\/]?รับค่างาน\s*(\d+(?:,\d{3})*)\s*(.*)?/i, category: "รับจ้าง" },
    { regex: /[\/]?เงินเดือน\s*(\d+(?:,\d{3})*)\s*(.*)?/i, category: "เงินเดือน" },
    { regex: /[\/]?โบนัส\s*(\d+(?:,\d{3})*)\s*(.*)?/i, category: "โบนัส" },
    { regex: /[\/]?ปันผล\s*(\d+(?:,\d{3})*)\s*(.*)?/i, category: "ปันผล" },
    { regex: /[\/]?ดอกเบี้ยรับ\s*(\d+(?:,\d{3})*)\s*(.*)?/i, category: "ดอกเบี้ยรับ" },
    { regex: /[\/]?ค่าเช่ารับ\s*(\d+(?:,\d{3})*)\s*(.*)?/i, category: "ค่าเช่ารับ" },
    { regex: /[\/]?รายรับ\s*(\d+(?:,\d{3})*)\s*(.*)?/i, category: "รายรับอื่นๆ" },
  ];

  for (const pattern of incomePatterns) {
    const match = text.match(pattern.regex);
    if (match) {
      const amount = parseInt(match[1].replace(/,/g, ""));
      const description = match[2]?.trim() || pattern.category;
      return {
        type: "income",
        amount,
        category: pattern.category,
        description: description.substring(0, 60),
        date: new Date(),
        originalText: text,
      };
    }
  }
  return null;
}

/**
 * Parse Quick Expense Command: /จ่าย, /ค่าใช้จ่าย, etc.
 */
function parseQuickExpenseCommand(text) {
  const lowerText = text.toLowerCase();

  // Pattern: /จ่าย 500 ค่าอาหาร
  const expensePatterns = [
    { regex: /[\/]?จ่าย\s*(\d+(?:,\d{3})*)\s*(.*)?/i, category: "ค่าใช้จ่าย" },
    { regex: /[\/]?ค่าใช้จ่าย\s*(\d+(?:,\d{3})*)\s*(.*)?/i, category: "ค่าใช้จ่าย" },
    { regex: /[\/]?ค่าอาหาร\s*(\d+(?:,\d{3})*)\s*(.*)?/i, category: "อาหาร" },
    { regex: /[\/]?ค่าเดินทาง\s*(\d+(?:,\d{3})*)\s*(.*)?/i, category: "เดินทาง" },
    { regex: /[\/]?ค่าน้ำมัน\s*(\d+(?:,\d{3})*)\s*(.*)?/i, category: "พลังงาน" },
    { regex: /[\/]?ค่าไฟ\s*(\d+(?:,\d{3})*)\s*(.*)?/i, category: "สาธารณูปโภค" },
    { regex: /[\/]?ค่าน้ำ\s*(\d+(?:,\d{3})*)\s*(.*)?/i, category: "สาธารณูปโภค" },
    { regex: /[\/]?ค่าเช่า\s*(\d+(?:,\d{3})*)\s*(.*)?/i, category: "ค่าเช่า" },
    { regex: /[\/]?ค่าโทร\s*(\d+(?:,\d{3})*)\s*(.*)?/i, category: "สาธารณูปโภค" },
    { regex: /[\/]?รายจ่าย\s*(\d+(?:,\d{3})*)\s*(.*)?/i, category: "รายจ่ายอื่นๆ" },
  ];

  for (const pattern of expensePatterns) {
    const match = text.match(pattern.regex);
    if (match) {
      const amount = parseInt(match[1].replace(/,/g, ""));
      const description = match[2]?.trim() || pattern.category;
      return {
        type: "expense",
        amount,
        category: pattern.category,
        description: description.substring(0, 60),
        date: new Date(),
        originalText: text,
      };
    }
  }
  return null;
}

// ==========================================
// 🆕 YEARLY & MONTHLY REPORTS (12 เดือน + รายปี)
// ==========================================

/**
 * ดึงข้อมูลรายเดือนย้อนหลัง 12 เดือน
 */
async function getYearlyMonthlyData(userId, year = null) {
  const db = getFirestore();
  const now = new Date();
  const targetYear = year || now.getFullYear();

  const monthlyData = [];

  // ดึงข้อมูลทั้ง 12 เดือน
  for (let month = 1; month <= 12; month++) {
    const monthStr = `${targetYear}-${String(month).padStart(2, "0")}`;
    const summaryDoc = await db.collection("accounting_summary").doc(`${userId}_${monthStr}`).get();

    if (summaryDoc.exists) {
      const data = summaryDoc.data();
      monthlyData.push({
        month: month,
        monthStr: monthStr,
        income: data.totalIncome || 0,
        expense: data.totalExpense || 0,
        profit: (data.totalIncome || 0) - (data.totalExpense || 0),
        transactions: data.transactionCount || 0,
      });
    } else {
      monthlyData.push({
        month: month,
        monthStr: monthStr,
        income: 0,
        expense: 0,
        profit: 0,
        transactions: 0,
      });
    }
  }

  // คำนวณยอดรวมทั้งปี
  const yearlyTotal = monthlyData.reduce((acc, m) => ({
    income: acc.income + m.income,
    expense: acc.expense + m.expense,
    profit: acc.profit + m.profit,
    transactions: acc.transactions + m.transactions,
  }), { income: 0, expense: 0, profit: 0, transactions: 0 });

  // หาเดือนที่รายรับสูงสุด/ต่ำสุด
  const bestMonth = monthlyData.reduce((best, m) => m.profit > best.profit ? m : best, monthlyData[0]);
  const worstMonth = monthlyData.reduce((worst, m) => m.profit < worst.profit ? m : worst, monthlyData[0]);

  // คำนวณค่าเฉลี่ย
  const avgMonthlyIncome = Math.round(yearlyTotal.income / 12);
  const avgMonthlyExpense = Math.round(yearlyTotal.expense / 12);

  return {
    year: targetYear,
    monthlyData,
    yearlyTotal,
    bestMonth,
    worstMonth,
    averages: {
      income: avgMonthlyIncome,
      expense: avgMonthlyExpense,
      profit: avgMonthlyIncome - avgMonthlyExpense,
    },
  };
}

/**
 * ดึงข้อมูลย้อนหลัง 12 เดือนล่าสุด (ไม่จำกัดปี)
 */
async function getLast12MonthsData(userId) {
  const db = getFirestore();
  const now = new Date();
  const monthlyData = [];

  for (let i = 11; i >= 0; i--) {
    const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, "0")}`;
    const summaryDoc = await db.collection("accounting_summary").doc(`${userId}_${monthStr}`).get();

    const monthNames = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
      "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

    if (summaryDoc.exists) {
      const data = summaryDoc.data();
      monthlyData.push({
        monthStr: monthStr,
        monthName: monthNames[targetDate.getMonth()],
        year: targetDate.getFullYear(),
        income: data.totalIncome || 0,
        expense: data.totalExpense || 0,
        profit: (data.totalIncome || 0) - (data.totalExpense || 0),
        transactions: data.transactionCount || 0,
      });
    } else {
      monthlyData.push({
        monthStr: monthStr,
        monthName: monthNames[targetDate.getMonth()],
        year: targetDate.getFullYear(),
        income: 0,
        expense: 0,
        profit: 0,
        transactions: 0,
      });
    }
  }

  // คำนวณยอดรวม 12 เดือน
  const total = monthlyData.reduce((acc, m) => ({
    income: acc.income + m.income,
    expense: acc.expense + m.expense,
    profit: acc.profit + m.profit,
    transactions: acc.transactions + m.transactions,
  }), { income: 0, expense: 0, profit: 0, transactions: 0 });

  return { monthlyData, total };
}

/**
 * สร้าง Flex Message แสดงข้อมูล 12 เดือน (Carousel)
 */
function createYearlyReportFlex(yearData) {
  const monthNames = ["", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

  // Create mini chart bars
  const maxIncome = Math.max(...yearData.monthlyData.map(m => m.income), 1);
  const maxExpense = Math.max(...yearData.monthlyData.map(m => m.expense), 1);

  // Bubble 1: Summary Overview
  const summaryBubble = {
    type: "bubble",
    size: "mega",
    header: {
      type: "box", layout: "vertical",
      backgroundColor: "#1a1a2e",
      paddingAll: "lg",
      contents: [
        { type: "text", text: `📊 สรุปรายปี ${yearData.year + 543}`, color: "#ffffff", weight: "bold", size: "lg" },
        { type: "text", text: "ภาพรวมทั้งปี", color: "#cccccc", size: "xs" },
      ],
    },
    body: {
      type: "box", layout: "vertical", spacing: "lg", paddingAll: "lg",
      contents: [
        // Total Cards
        {
          type: "box", layout: "horizontal", spacing: "md",
          contents: [
            {
              type: "box", layout: "vertical", flex: 1, backgroundColor: "#e8f5e9", cornerRadius: "md", paddingAll: "md",
              contents: [
                { type: "text", text: "💰 รายรับรวม", size: "xs", color: "#2e7d32" },
                { type: "text", text: `฿${yearData.yearlyTotal.income.toLocaleString()}`, size: "md", weight: "bold", color: "#2e7d32" },
              ],
            },
            {
              type: "box", layout: "vertical", flex: 1, backgroundColor: "#ffebee", cornerRadius: "md", paddingAll: "md",
              contents: [
                { type: "text", text: "💸 รายจ่ายรวม", size: "xs", color: "#c62828" },
                { type: "text", text: `฿${yearData.yearlyTotal.expense.toLocaleString()}`, size: "md", weight: "bold", color: "#c62828" },
              ],
            },
          ],
        },
        // Profit Card
        {
          type: "box", layout: "vertical", backgroundColor: yearData.yearlyTotal.profit >= 0 ? "#e3f2fd" : "#fce4ec",
          cornerRadius: "md", paddingAll: "md",
          contents: [
            {
              type: "text", text: yearData.yearlyTotal.profit >= 0 ? "✨ กำไรสุทธิ" : "⚠️ ขาดทุนสุทธิ", size: "sm",
              color: yearData.yearlyTotal.profit >= 0 ? "#1565c0" : "#c62828", weight: "bold"
            },
            {
              type: "text", text: `฿${Math.abs(yearData.yearlyTotal.profit).toLocaleString()}`, size: "xxl", weight: "bold",
              color: yearData.yearlyTotal.profit >= 0 ? "#1565c0" : "#c62828"
            },
          ],
        },
        { type: "separator" },
        // Best/Worst Month
        {
          type: "box", layout: "horizontal", spacing: "md",
          contents: [
            {
              type: "box", layout: "vertical", flex: 1,
              contents: [
                { type: "text", text: "🏆 เดือนที่ดีที่สุด", size: "xs", color: "#666" },
                { type: "text", text: monthNames[yearData.bestMonth.month], size: "sm", weight: "bold" },
                { type: "text", text: `฿${yearData.bestMonth.profit.toLocaleString()}`, size: "xs", color: "#06c755" },
              ],
            },
            {
              type: "box", layout: "vertical", flex: 1,
              contents: [
                { type: "text", text: "📉 เดือนที่แย่ที่สุด", size: "xs", color: "#666" },
                { type: "text", text: monthNames[yearData.worstMonth.month], size: "sm", weight: "bold" },
                { type: "text", text: `฿${yearData.worstMonth.profit.toLocaleString()}`, size: "xs", color: "#ef454d" },
              ],
            },
          ],
        },
        // Averages
        {
          type: "box", layout: "vertical", backgroundColor: "#f5f5f5", cornerRadius: "md", paddingAll: "sm", margin: "md",
          contents: [
            { type: "text", text: "📈 ค่าเฉลี่ยต่อเดือน", size: "xs", color: "#666", weight: "bold" },
            {
              type: "text", text: `รายรับ ฿${yearData.averages.income.toLocaleString()} | รายจ่าย ฿${yearData.averages.expense.toLocaleString()}`,
              size: "xs", color: "#888"
            },
          ],
        },
      ],
    },
  };

  // Bubble 2: First 6 Months Chart
  const firstHalfMonths = yearData.monthlyData.slice(0, 6);
  const firstHalfBubble = createMonthlyChartBubble(firstHalfMonths, "ม.ค. - มิ.ย.", maxIncome, maxExpense, yearData.year);

  // Bubble 3: Last 6 Months Chart
  const secondHalfMonths = yearData.monthlyData.slice(6, 12);
  const secondHalfBubble = createMonthlyChartBubble(secondHalfMonths, "ก.ค. - ธ.ค.", maxIncome, maxExpense, yearData.year);

  return {
    type: "flex",
    altText: `📊 สรุปรายปี ${yearData.year + 543}: กำไร ฿${yearData.yearlyTotal.profit.toLocaleString()}`,
    contents: {
      type: "carousel",
      contents: [summaryBubble, firstHalfBubble, secondHalfBubble],
    },
  };
}

/**
 * สร้าง Bubble สำหรับแสดงกราฟรายเดือน
 */
function createMonthlyChartBubble(months, title, maxIncome, maxExpense, year) {
  const monthNames = ["", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

  const chartRows = months.map((m) => {
    const incomeWidth = Math.max(5, Math.round((m.income / maxIncome) * 100));
    const expenseWidth = Math.max(5, Math.round((m.expense / maxExpense) * 100));
    const profitColor = m.profit >= 0 ? "#06c755" : "#ef454d";
    const profitSign = m.profit >= 0 ? "+" : "";

    return {
      type: "box", layout: "vertical", margin: "md",
      contents: [
        {
          type: "box", layout: "horizontal",
          contents: [
            { type: "text", text: monthNames[m.month], size: "xs", color: "#666", flex: 0, gravity: "center" },
            { type: "filler" },
            { type: "text", text: `${profitSign}฿${m.profit.toLocaleString()}`, size: "xs", color: profitColor, align: "end" },
          ],
        },
        // Income bar
        {
          type: "box", layout: "horizontal", margin: "xs",
          contents: [
            { type: "box", layout: "vertical", flex: incomeWidth, height: "4px", backgroundColor: "#06c755", cornerRadius: "sm" },
            { type: "box", layout: "vertical", flex: Math.max(1, 100 - incomeWidth), height: "4px", backgroundColor: "#e0e0e0", cornerRadius: "sm" },
          ],
        },
        // Expense bar  
        {
          type: "box", layout: "horizontal", margin: "xs",
          contents: [
            { type: "box", layout: "vertical", flex: expenseWidth, height: "4px", backgroundColor: "#ef454d", cornerRadius: "sm" },
            { type: "box", layout: "vertical", flex: Math.max(1, 100 - expenseWidth), height: "4px", backgroundColor: "#e0e0e0", cornerRadius: "sm" },
          ],
        },
      ],
    };
  });

  return {
    type: "bubble",
    size: "mega",
    header: {
      type: "box", layout: "vertical",
      backgroundColor: "#667eea",
      paddingAll: "lg",
      contents: [
        { type: "text", text: `📅 ${title} ${year + 543}`, color: "#ffffff", weight: "bold", size: "md" },
        {
          type: "box", layout: "horizontal", margin: "sm",
          contents: [
            {
              type: "box", layout: "horizontal", flex: 1,
              contents: [
                { type: "box", layout: "vertical", width: "12px", height: "12px", backgroundColor: "#06c755", cornerRadius: "sm" },
                { type: "text", text: " รายรับ", size: "xxs", color: "#fff", margin: "xs" },
              ],
            },
            {
              type: "box", layout: "horizontal", flex: 1,
              contents: [
                { type: "box", layout: "vertical", width: "12px", height: "12px", backgroundColor: "#ef454d", cornerRadius: "sm" },
                { type: "text", text: " รายจ่าย", size: "xxs", color: "#fff", margin: "xs" },
              ],
            },
          ],
        },
      ],
    },
    body: {
      type: "box", layout: "vertical", paddingAll: "lg",
      contents: chartRows,
    },
  };
}

/**
 * สร้าง Flex Message แสดงข้อมูล 12 เดือนล่าสุด
 */
function createLast12MonthsFlex(data) {
  const { monthlyData, total } = data;

  // แบ่งเป็น 2 กลุ่ม: 6 เดือนเก่า และ 6 เดือนล่าสุด
  const olderMonths = monthlyData.slice(0, 6);
  const recentMonths = monthlyData.slice(6, 12);

  const maxValue = Math.max(...monthlyData.map(m => Math.max(m.income, m.expense)), 1);

  const createMonthRows = (months) => months.map((m) => {
    const profitColor = m.profit >= 0 ? "#06c755" : "#ef454d";
    const profitSign = m.profit >= 0 ? "+" : "";
    return {
      type: "box", layout: "horizontal", margin: "sm",
      contents: [
        { type: "text", text: `${m.monthName} ${(m.year + 543) % 100}`, size: "xs", color: "#666", flex: 2 },
        { type: "text", text: `฿${m.income.toLocaleString()}`, size: "xs", color: "#06c755", flex: 2, align: "end" },
        { type: "text", text: `฿${m.expense.toLocaleString()}`, size: "xs", color: "#ef454d", flex: 2, align: "end" },
        { type: "text", text: `${profitSign}${m.profit.toLocaleString()}`, size: "xs", color: profitColor, flex: 2, align: "end", weight: "bold" },
      ],
    };
  });

  return {
    type: "flex",
    altText: `📊 12 เดือนล่าสุด: รวม ฿${total.profit.toLocaleString()}`,
    contents: {
      type: "carousel",
      contents: [
        // Summary Bubble
        {
          type: "bubble",
          size: "mega",
          header: {
            type: "box", layout: "vertical", backgroundColor: "#1a1a2e", paddingAll: "lg",
            contents: [
              { type: "text", text: "📊 สรุป 12 เดือนล่าสุด", color: "#ffffff", weight: "bold", size: "lg" },
            ],
          },
          body: {
            type: "box", layout: "vertical", spacing: "md", paddingAll: "lg",
            contents: [
              {
                type: "box", layout: "horizontal", spacing: "md",
                contents: [
                  {
                    type: "box", layout: "vertical", flex: 1, backgroundColor: "#e8f5e9", cornerRadius: "md", paddingAll: "md",
                    contents: [
                      { type: "text", text: "💰 รายรับรวม", size: "xs", color: "#2e7d32" },
                      { type: "text", text: `฿${total.income.toLocaleString()}`, size: "lg", weight: "bold", color: "#2e7d32" },
                    ],
                  },
                  {
                    type: "box", layout: "vertical", flex: 1, backgroundColor: "#ffebee", cornerRadius: "md", paddingAll: "md",
                    contents: [
                      { type: "text", text: "💸 รายจ่ายรวม", size: "xs", color: "#c62828" },
                      { type: "text", text: `฿${total.expense.toLocaleString()}`, size: "lg", weight: "bold", color: "#c62828" },
                    ],
                  },
                ],
              },
              {
                type: "box", layout: "vertical", backgroundColor: total.profit >= 0 ? "#e3f2fd" : "#fce4ec",
                cornerRadius: "md", paddingAll: "lg",
                contents: [
                  {
                    type: "text", text: total.profit >= 0 ? "✨ กำไรสุทธิ 12 เดือน" : "⚠️ ขาดทุนสุทธิ 12 เดือน",
                    size: "sm", color: total.profit >= 0 ? "#1565c0" : "#c62828"
                  },
                  {
                    type: "text", text: `฿${Math.abs(total.profit).toLocaleString()}`,
                    size: "3xl", weight: "bold", color: total.profit >= 0 ? "#1565c0" : "#c62828"
                  },
                  {
                    type: "text", text: `เฉลี่ย ฿${Math.round(total.profit / 12).toLocaleString()}/เดือน`,
                    size: "xs", color: "#888", margin: "sm"
                  },
                ],
              },
              { type: "text", text: `📝 รายการทั้งหมด: ${total.transactions.toLocaleString()} รายการ`, size: "xs", color: "#888", margin: "md" },
            ],
          },
          footer: {
            type: "box", layout: "horizontal", spacing: "sm",
            contents: [
              {
                type: "button", style: "primary", color: "#667eea", height: "sm",
                action: { type: "message", label: "📅 ดูรายปี", text: "สรุปรายปี" }
              },
              {
                type: "button", style: "secondary", height: "sm",
                action: { type: "message", label: "🤖 วิเคราะห์", text: "วิเคราะห์บัญชี" }
              },
            ],
          },
        },
        // Detail Table Bubble
        {
          type: "bubble",
          size: "mega",
          header: {
            type: "box", layout: "vertical", backgroundColor: "#667eea", paddingAll: "md",
            contents: [
              { type: "text", text: "📋 รายละเอียด 12 เดือน", color: "#ffffff", weight: "bold", size: "md" },
              {
                type: "box", layout: "horizontal", margin: "sm",
                contents: [
                  { type: "text", text: "เดือน", size: "xxs", color: "#ddd", flex: 2 },
                  { type: "text", text: "รับ", size: "xxs", color: "#ddd", flex: 2, align: "end" },
                  { type: "text", text: "จ่าย", size: "xxs", color: "#ddd", flex: 2, align: "end" },
                  { type: "text", text: "คงเหลือ", size: "xxs", color: "#ddd", flex: 2, align: "end" },
                ],
              },
            ],
          },
          body: {
            type: "box", layout: "vertical", paddingAll: "md",
            contents: [
              ...createMonthRows(olderMonths),
              { type: "separator", margin: "md" },
              ...createMonthRows(recentMonths),
            ],
          },
        },
      ],
    },
  };
}

// ==========================================
// 🆕 ENHANCED DASHBOARD
// ==========================================

/**
 * สร้าง Dashboard ที่ทรงพลังขึ้น
 */
function createEnhancedDashboardFlex(stats, monthlyTrend) {
  const todayColor = stats.today.net >= 0 ? "#06c755" : "#ef454d";
  const monthColor = stats.month.profit >= 0 ? "#06c755" : "#ef454d";

  // ดึง monthlyData array จาก monthlyTrend object
  const monthlyData = monthlyTrend?.monthlyData || [];
  const total12Months = monthlyTrend?.total || { income: 0, expense: 0, profit: 0 };

  // สร้าง mini trend chart (6 เดือนล่าสุด) - ต้องมี monthName ที่ไม่ใช่ empty string
  const validMonthlyData = monthlyData.filter((m) => m.monthName && m.monthName.trim() !== "");

  // หา max expense เพื่อ scale bar height
  const maxExpense = Math.max(...validMonthlyData.map((m) => m.expense || 0), 1);

  const trendBars = validMonthlyData.length > 0 ? validMonthlyData.slice(-6).map((m) => {
    const barHeight = Math.round(Math.max(5, Math.min(40, ((m.expense || 0) / maxExpense) * 40)));
    return {
      type: "box", layout: "vertical",
      flex: 1,
      contents: [
        {
          type: "box", layout: "vertical",
          height: `${barHeight}px`,
          backgroundColor: "#ef454d",
        },
        { type: "text", text: m.monthName, size: "xxs", color: "#888888", align: "center" },
      ],
    };
  }) : [];

  // สร้าง Yearly Summary Row (ถ้ามีข้อมูล 12 เดือน)
  const yearlySummaryRow = monthlyTrend ? {
    type: "box", layout: "vertical",
    contents: [
      { type: "text", text: "📆 ยอดรวม 12 เดือน", weight: "bold", size: "sm", color: "#666666" },
      {
        type: "box", layout: "horizontal", margin: "sm", spacing: "md",
        contents: [
          {
            type: "box", layout: "vertical", flex: 1,
            contents: [
              { type: "text", text: "รายรับ", size: "xxs", color: "#888888" },
              { type: "text", text: `฿${total12Months.income.toLocaleString()}`, size: "sm", weight: "bold", color: "#06c755" },
            ],
          },
          {
            type: "box", layout: "vertical", flex: 1,
            contents: [
              { type: "text", text: "รายจ่าย", size: "xxs", color: "#888888" },
              { type: "text", text: `฿${total12Months.expense.toLocaleString()}`, size: "sm", weight: "bold", color: "#ef454d" },
            ],
          },
          {
            type: "box", layout: "vertical", flex: 1,
            contents: [
              { type: "text", text: total12Months.profit >= 0 ? "กำไร" : "ขาดทุน", size: "xxs", color: "#888888" },
              {
                type: "text", text: `฿${Math.abs(total12Months.profit).toLocaleString()}`,
                size: "sm", weight: "bold", color: total12Months.profit >= 0 ? "#06c755" : "#ef454d"
              },
            ],
          },
        ],
      },
    ],
  } : null;

  // Trend Chart Box (ถ้ามีข้อมูล)
  const trendChartBox = trendBars.length > 0 ? {
    type: "box", layout: "vertical",
    contents: [
      { type: "text", text: "📈 แนวโน้ม 6 เดือน", weight: "bold", size: "sm", color: "#666666" },
      {
        type: "box", layout: "horizontal", margin: "sm", spacing: "xs",
        height: "60px",
        contents: trendBars,
      },
    ],
  } : null;

  // Build body contents dynamically
  const bodyContents = [
    // Today Stats
    {
      type: "box", layout: "vertical",
      contents: [
        { type: "text", text: "📅 วันนี้", weight: "bold", size: "sm", color: "#666666" },
        {
          type: "box", layout: "horizontal", margin: "sm", spacing: "md",
          contents: [
            {
              type: "box", layout: "vertical", flex: 1,
              contents: [
                { type: "text", text: "รายรับ", size: "xxs", color: "#888888" },
                { type: "text", text: `฿${stats.today.income.toLocaleString()}`, size: "md", weight: "bold", color: "#06c755" },
              ],
            },
            {
              type: "box", layout: "vertical", flex: 1,
              contents: [
                { type: "text", text: "รายจ่าย", size: "xxs", color: "#888888" },
                { type: "text", text: `฿${stats.today.expense.toLocaleString()}`, size: "md", weight: "bold", color: "#ef454d" },
              ],
            },
            {
              type: "box", layout: "vertical", flex: 1,
              contents: [
                { type: "text", text: "คงเหลือ", size: "xxs", color: "#888888" },
                {
                  type: "text", text: `${stats.today.net >= 0 ? "+" : ""}฿${stats.today.net.toLocaleString()}`,
                  size: "md", weight: "bold", color: todayColor
                },
              ],
            },
          ],
        },
      ],
    },
    { type: "separator" },
    // Month Stats
    {
      type: "box", layout: "vertical",
      contents: [
        { type: "text", text: "📆 เดือนนี้", weight: "bold", size: "sm", color: "#666666" },
        {
          type: "box", layout: "horizontal", margin: "sm", spacing: "md",
          contents: [
            {
              type: "box", layout: "vertical", flex: 1,
              contents: [
                { type: "text", text: "รายรับ", size: "xxs", color: "#888888" },
                { type: "text", text: `฿${stats.month.income.toLocaleString()}`, size: "md", weight: "bold", color: "#06c755" },
              ],
            },
            {
              type: "box", layout: "vertical", flex: 1,
              contents: [
                { type: "text", text: "รายจ่าย", size: "xxs", color: "#888888" },
                { type: "text", text: `฿${stats.month.expense.toLocaleString()}`, size: "md", weight: "bold", color: "#ef454d" },
              ],
            },
            {
              type: "box", layout: "vertical", flex: 1,
              contents: [
                { type: "text", text: stats.month.profit >= 0 ? "กำไร" : "ขาดทุน", size: "xxs", color: "#888888" },
                {
                  type: "text", text: `฿${Math.abs(stats.month.profit).toLocaleString()}`,
                  size: "md", weight: "bold", color: monthColor
                },
              ],
            },
          ],
        },
      ],
    },
  ];

  // Add yearly summary if available (Dashboard Pro)
  if (yearlySummaryRow) {
    bodyContents.push({ type: "separator" });
    bodyContents.push(yearlySummaryRow);
  }

  // Skip trend chart for now (causing 400 error)
  // if (trendChartBox) {
  //   bodyContents.push({type: "separator"});
  //   bodyContents.push(trendChartBox);
  // }

  // Add simple quick stats row
  bodyContents.push({ type: "separator" });
  bodyContents.push({
    type: "box", layout: "horizontal", spacing: "md",
    contents: [
      {
        type: "box", layout: "vertical", flex: 1,
        contents: [
          { type: "text", text: "🎯", size: "lg", align: "center" },
          { type: "text", text: `${stats.goals?.active || 0}`, size: "lg", weight: "bold", align: "center", color: "#667eea" },
          { type: "text", text: "เป้าหมาย", size: "xxs", align: "center", color: "#888888" },
        ],
      },
      {
        type: "box", layout: "vertical", flex: 1,
        contents: [
          { type: "text", text: stats.alerts?.budget > 0 ? "⚠️" : "✅", size: "lg", align: "center" },
          {
            type: "text", text: `${stats.alerts?.budget || 0}`, size: "lg", weight: "bold", align: "center",
            color: stats.alerts?.budget > 0 ? "#f57c00" : "#4caf50"
          },
          { type: "text", text: "งบเกิน", size: "xxs", align: "center", color: "#888888" },
        ],
      },
      {
        type: "box", layout: "vertical", flex: 1,
        contents: [
          { type: "text", text: "📝", size: "lg", align: "center" },
          { type: "text", text: `${stats.today.transactions}`, size: "lg", weight: "bold", align: "center", color: "#2e7d32" },
          { type: "text", text: "รายการวันนี้", size: "xxs", align: "center", color: "#888888" },
        ],
      },
    ],
  });

  return {
    type: "flex",
    altText: `📊 Dashboard Pro: วันนี้ ${stats.today.net >= 0 ? "+" : ""}฿${stats.today.net.toLocaleString()}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box", layout: "vertical",
        backgroundColor: monthlyTrend ? "#4a148c" : "#1a1a2e",
        paddingTop: "lg",
        paddingBottom: "lg",
        paddingStart: "lg",
        paddingEnd: "lg",
        contents: [
          {
            type: "box", layout: "horizontal",
            contents: [
              { type: "text", text: monthlyTrend ? "📊 Dashboard Pro" : "📊 Dashboard", color: "#ffffff", weight: "bold", size: "xl", flex: 1 },
              {
                type: "text", text: new Date().toLocaleDateString("th-TH", { day: "numeric", month: "short" }),
                color: "#888888", size: "sm", align: "end"
              },
            ],
          },
        ],
      },
      body: {
        type: "box", layout: "vertical", spacing: "md",
        paddingTop: "lg",
        paddingBottom: "lg",
        paddingStart: "lg",
        paddingEnd: "lg",
        contents: bodyContents,
      },
      footer: {
        type: "box", layout: "vertical", spacing: "sm",
        contents: [
          {
            type: "box", layout: "horizontal", spacing: "sm",
            contents: [
              {
                type: "button", style: "primary", color: "#06c755", height: "sm", flex: 1,
                action: { type: "message", label: "📆 สรุปเดือน", text: "สรุปเดือน" }
              },
              {
                type: "button", style: "primary", color: "#667eea", height: "sm", flex: 1,
                action: { type: "message", label: "📊 12 เดือน", text: "สรุป 12 เดือน" }
              },
            ],
          },
          {
            type: "box", layout: "horizontal", spacing: "sm",
            contents: [
              {
                type: "button", style: "secondary", height: "sm", flex: 1,
                action: { type: "message", label: "🤖 วิเคราะห์", text: "วิเคราะห์บัญชี" }
              },
              {
                type: "button", style: "secondary", height: "sm", flex: 1,
                action: { type: "message", label: "📋 เมนูบัญชี", text: "เมนูบัญชี" }
              },
            ],
          },
        ],
      },
    },
  };
}

// ==========================================
// 🆕 QUICK STATS (Dashboard Overview)
// ==========================================

async function getQuickStats(userId) {
  const db = getFirestore();
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Get today's transactions
  const todaySnapshot = await db.collection("accounting_transactions")
    .where("userId", "==", userId)
    .where("date", "==", todayStr)
    .get();

  let todayIncome = 0; let todayExpense = 0;
  todaySnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.type === "income") todayIncome += data.amount;
    else todayExpense += data.amount;
  });

  // Get month summary
  const monthDoc = await db.collection("accounting_summary").doc(`${userId}_${monthStr}`).get();
  const monthData = monthDoc.exists ? monthDoc.data() : { totalIncome: 0, totalExpense: 0 };

  // Get active goals count
  const goalsSnapshot = await db.collection("accounting_goals")
    .where("userId", "==", userId)
    .where("status", "==", "active")
    .get();

  // Get budget alerts
  const budgetStatus = await checkBudgetStatus(userId);
  const alertCount = budgetStatus ? budgetStatus.filter((b) => b.status === "danger" || b.status === "exceeded").length : 0;

  return {
    today: {
      income: todayIncome,
      expense: todayExpense,
      net: todayIncome - todayExpense,
      transactions: todaySnapshot.size,
    },
    month: {
      income: monthData.totalIncome || 0,
      expense: monthData.totalExpense || 0,
      profit: (monthData.totalIncome || 0) - (monthData.totalExpense || 0),
    },
    goals: {
      active: goalsSnapshot.size,
    },
    alerts: {
      budget: alertCount,
    },
  };
}

function createQuickStatsFlex(stats) {
  return {
    type: "flex",
    altText: "📊 สรุปด่วน",
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box", layout: "vertical", backgroundColor: "#1a1a2e", paddingAll: "lg",
        contents: [
          { type: "text", text: "📊 Dashboard สรุปด่วน", color: "#ffffff", weight: "bold", size: "lg" },
          { type: "text", text: new Date().toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "short" }), color: "#cccccc", size: "xs" },
        ],
      },
      body: {
        type: "box", layout: "vertical", spacing: "md",
        contents: [
          // Today Stats
          {
            type: "box", layout: "horizontal", spacing: "sm",
            contents: [
              {
                type: "box", layout: "vertical", flex: 1, backgroundColor: "#e3f2fd", cornerRadius: "md", paddingAll: "sm",
                contents: [
                  { type: "text", text: "📅 วันนี้", size: "xxs", color: "#1565c0" },
                  { type: "text", text: `฿${stats.today.net.toLocaleString()}`, size: "lg", weight: "bold", color: stats.today.net >= 0 ? "#2e7d32" : "#c62828" },
                  { type: "text", text: `${stats.today.transactions} รายการ`, size: "xxs", color: "#666666" },
                ],
              },
              {
                type: "box", layout: "vertical", flex: 1, backgroundColor: "#f3e5f5", cornerRadius: "md", paddingAll: "sm",
                contents: [
                  { type: "text", text: "📆 เดือนนี้", size: "xxs", color: "#7b1fa2" },
                  { type: "text", text: `฿${stats.month.profit.toLocaleString()}`, size: "lg", weight: "bold", color: stats.month.profit >= 0 ? "#2e7d32" : "#c62828" },
                  { type: "text", text: stats.month.profit >= 0 ? "กำไร" : "ขาดทุน", size: "xxs", color: "#666666" },
                ],
              },
            ],
          },
          // Income/Expense Row
          {
            type: "box", layout: "horizontal", spacing: "sm",
            contents: [
              {
                type: "box", layout: "vertical", flex: 1, backgroundColor: "#e8f5e9", cornerRadius: "md", paddingAll: "sm",
                contents: [
                  { type: "text", text: "💰 รายรับเดือนนี้", size: "xxs", color: "#2e7d32" },
                  { type: "text", text: `฿${stats.month.income.toLocaleString()}`, size: "md", weight: "bold", color: "#2e7d32" },
                ],
              },
              {
                type: "box", layout: "vertical", flex: 1, backgroundColor: "#ffebee", cornerRadius: "md", paddingAll: "sm",
                contents: [
                  { type: "text", text: "💸 รายจ่ายเดือนนี้", size: "xxs", color: "#c62828" },
                  { type: "text", text: `฿${stats.month.expense.toLocaleString()}`, size: "md", weight: "bold", color: "#c62828" },
                ],
              },
            ],
          },
          // Status Row
          {
            type: "box", layout: "horizontal", spacing: "sm",
            contents: [
              {
                type: "box", layout: "horizontal", flex: 1, backgroundColor: "#fff8e1", cornerRadius: "md", paddingAll: "sm", spacing: "sm",
                contents: [
                  { type: "text", text: "🎯", size: "lg" },
                  {
                    type: "box", layout: "vertical",
                    contents: [
                      { type: "text", text: "เป้าหมาย", size: "xxs", color: "#f57f17" },
                      { type: "text", text: `${stats.goals.active} รายการ`, size: "sm", weight: "bold" },
                    ],
                  },
                ],
              },
              {
                type: "box", layout: "horizontal", flex: 1, backgroundColor: stats.alerts.budget > 0 ? "#ffcdd2" : "#e8f5e9", cornerRadius: "md", paddingAll: "sm", spacing: "sm",
                contents: [
                  { type: "text", text: stats.alerts.budget > 0 ? "⚠️" : "✅", size: "lg" },
                  {
                    type: "box", layout: "vertical",
                    contents: [
                      { type: "text", text: "งบประมาณ", size: "xxs", color: stats.alerts.budget > 0 ? "#c62828" : "#2e7d32" },
                      { type: "text", text: stats.alerts.budget > 0 ? `${stats.alerts.budget} แจ้งเตือน` : "ปกติ", size: "sm", weight: "bold" },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      footer: {
        type: "box", layout: "horizontal", spacing: "sm",
        contents: [
          { type: "button", style: "primary", color: "#1a1a2e", height: "sm", action: { type: "message", label: "🤖 AI วิเคราะห์", text: "วิเคราะห์" }, flex: 1 },
          { type: "button", style: "secondary", height: "sm", action: { type: "message", label: "📊 สรุปเดือน", text: "สรุปเดือน" }, flex: 1 },
        ],
      },
    },
  };
}

// ==========================================
// 🆕 ACCOUNTING MENU FLEX (Full Features)
// ==========================================

/**
 * สร้าง Flex Message เมนูหลักระบบบัญชี (Carousel)
 */
function createAccountingMenuFlex() {
  return {
    type: "flex",
    altText: "📊 เมนูระบบบัญชี AI v3.0",
    contents: {
      type: "carousel",
      contents: [
        // === BUBBLE 1: Dashboard & AI (ขนาดใหญ่ ว้าว!) ===
        {
          type: "bubble",
          size: "kilo",
          header: {
            type: "box", layout: "vertical",
            backgroundColor: "#667eea",
            paddingAll: "lg",
            contents: [
              { type: "text", text: "🤖 AI วิเคราะห์", color: "#ffffff", weight: "bold", size: "lg", align: "center" },
              { type: "text", text: "ระบบอัจฉริยะช่วยวิเคราะห์", color: "#d4d4ff", size: "xs", align: "center", margin: "sm" },
            ],
          },
          hero: {
            type: "box", layout: "vertical",
            backgroundColor: "#5a67d8",
            paddingAll: "xl",
            contents: [
              { type: "text", text: "💰", size: "3xl", align: "center" },
              { type: "text", text: "จัดการเงินอย่างมืออาชีพ", color: "#ffffff", size: "sm", align: "center", margin: "md", weight: "bold" },
            ],
          },
          body: {
            type: "box", layout: "vertical", spacing: "md", paddingAll: "lg",
            contents: [
              {
                type: "button", style: "primary", color: "#667eea", height: "md",
                action: { type: "message", label: "📊 Dashboard ภาพรวม", text: "dashboard" },
              },
              {
                type: "button", style: "primary", color: "#764ba2", height: "md",
                action: { type: "message", label: "🤖 AI วิเคราะห์บัญชี", text: "วิเคราะห์บัญชี" },
              },
              {
                type: "button", style: "primary", color: "#00bcd4", height: "md",
                action: { type: "message", label: "💡 คำแนะนำการเงิน", text: "คำแนะนำการเงิน" },
              },
              {
                type: "button", style: "secondary", height: "md",
                action: { type: "message", label: "📈 เปรียบเทียบเดือน", text: "เปรียบเทียบเดือน" },
              },
            ],
          },
        },
        // === BUBBLE 2: รายงาน & สรุป ===
        {
          type: "bubble",
          size: "kilo",
          header: {
            type: "box", layout: "vertical",
            backgroundColor: "#06c755",
            paddingAll: "lg",
            contents: [
              { type: "text", text: "📊 รายงานการเงิน", color: "#ffffff", weight: "bold", size: "lg", align: "center" },
              { type: "text", text: "สรุปรายรับ-รายจ่าย", color: "#c8ffc8", size: "xs", align: "center", margin: "sm" },
            ],
          },
          hero: {
            type: "box", layout: "vertical",
            backgroundColor: "#059d4a",
            paddingAll: "xl",
            contents: [
              { type: "text", text: "📈", size: "3xl", align: "center" },
              { type: "text", text: "ดูรายงานทุกมิติ", color: "#ffffff", size: "sm", align: "center", margin: "md", weight: "bold" },
            ],
          },
          body: {
            type: "box", layout: "vertical", spacing: "md", paddingAll: "lg",
            contents: [
              {
                type: "button", style: "primary", color: "#06c755", height: "md",
                action: { type: "message", label: "📅 สรุปวันนี้", text: "สรุปวันนี้" },
              },
              {
                type: "button", style: "primary", color: "#2e7d32", height: "md",
                action: { type: "message", label: "📆 สรุปเดือนนี้", text: "สรุปเดือน" },
              },
              {
                type: "button", style: "primary", color: "#1b5e20", height: "md",
                action: { type: "message", label: "📋 ดู 10 รายการล่าสุด", text: "รายการล่าสุด" },
              },
              {
                type: "button", style: "secondary", height: "md",
                action: { type: "message", label: "📈 สรุปทั้งปี", text: "สรุปปีนี้" },
              },
            ],
          },
        },
        // === BUBBLE 3: จัดการรายการ ===
        {
          type: "bubble",
          size: "kilo",
          header: {
            type: "box", layout: "vertical",
            backgroundColor: "#ff6b6b",
            paddingAll: "lg",
            contents: [
              { type: "text", text: "✏️ จัดการรายการ", color: "#ffffff", weight: "bold", size: "lg", align: "center" },
              { type: "text", text: "แก้ไข / ลบ รายการ", color: "#ffd4d4", size: "xs", align: "center", margin: "sm" },
            ],
          },
          hero: {
            type: "box", layout: "vertical",
            backgroundColor: "#e85555",
            paddingAll: "xl",
            contents: [
              { type: "text", text: "✏️", size: "3xl", align: "center" },
              { type: "text", text: "จัดการข้อมูลง่ายดาย", color: "#ffffff", size: "sm", align: "center", margin: "md", weight: "bold" },
            ],
          },
          body: {
            type: "box", layout: "vertical", spacing: "md", paddingAll: "lg",
            contents: [
              {
                type: "button", style: "primary", color: "#4CAF50", height: "md",
                action: { type: "message", label: "✏️ เลือกแก้ไขรายการ", text: "เลือกแก้ไข" },
              },
              {
                type: "button", style: "primary", color: "#ff6b6b", height: "md",
                action: { type: "message", label: "🗑️ เลือกลบรายการ", text: "เลือกลบ" },
              },
              {
                type: "button", style: "primary", color: "#d32f2f", height: "md",
                action: { type: "message", label: "🗑️ ลบรายการล่าสุด", text: "ลบ" },
              },
              {
                type: "button", style: "secondary", height: "md",
                action: { type: "message", label: "❌ ลบทั้งหมด (ระวัง!)", text: "ลบทั้งหมด" },
              },
            ],
          },
        },
        // === BUBBLE 4: งบประมาณ ===
        {
          type: "bubble",
          size: "kilo",
          header: {
            type: "box", layout: "vertical",
            backgroundColor: "#764ba2",
            paddingAll: "lg",
            contents: [
              { type: "text", text: "📋 งบประมาณ", color: "#ffffff", weight: "bold", size: "lg", align: "center" },
              { type: "text", text: "ตั้งงบ & ติดตามการใช้จ่าย", color: "#e4d4ff", size: "xs", align: "center", margin: "sm" },
            ],
          },
          hero: {
            type: "box", layout: "vertical",
            backgroundColor: "#5e3d8a",
            paddingAll: "xl",
            contents: [
              { type: "text", text: "📋", size: "3xl", align: "center" },
              { type: "text", text: "ควบคุมค่าใช้จ่าย", color: "#ffffff", size: "sm", align: "center", margin: "md", weight: "bold" },
            ],
          },
          body: {
            type: "box", layout: "vertical", spacing: "md", paddingAll: "lg",
            contents: [
              {
                type: "button", style: "primary", color: "#764ba2", height: "md",
                action: { type: "message", label: "📊 เช็คสถานะงบประมาณ", text: "เช็คงบ" },
              },
              {
                type: "button", style: "secondary", height: "md",
                action: { type: "message", label: "🍜 ตั้งงบอาหาร 5,000", text: "ตั้งงบ อาหาร 5000" },
              },
              {
                type: "button", style: "secondary", height: "md",
                action: { type: "message", label: "🚗 ตั้งงบเดินทาง 3,000", text: "ตั้งงบ เดินทาง 3000" },
              },
              {
                type: "button", style: "secondary", height: "md",
                action: { type: "message", label: "📦 ตั้งงบอื่นๆ 2,000", text: "ตั้งงบ อื่นๆ 2000" },
              },
            ],
          },
        },
        // === BUBBLE 5: ⚡ Quick Commands (NEW!) ===
        {
          type: "bubble",
          size: "kilo",
          header: {
            type: "box", layout: "vertical",
            backgroundColor: "#00bcd4",
            paddingAll: "lg",
            contents: [
              { type: "text", text: "⚡ คำสั่งด่วน", color: "#ffffff", weight: "bold", size: "lg", align: "center" },
              { type: "text", text: "บันทึกรายรับ-จ่ายเร็วสุด", color: "#b2ebf2", size: "xs", align: "center", margin: "sm" },
            ],
          },
          hero: {
            type: "box", layout: "vertical",
            backgroundColor: "#0097a7",
            paddingAll: "xl",
            contents: [
              { type: "text", text: "⚡", size: "3xl", align: "center" },
              { type: "text", text: "พิมพ์ /รับเงิน /จ่าย", color: "#ffffff", size: "sm", align: "center", margin: "md", weight: "bold" },
            ],
          },
          body: {
            type: "box", layout: "vertical", spacing: "md", paddingAll: "lg",
            contents: [
              {
                type: "button", style: "primary", color: "#4CAF50", height: "md",
                action: { type: "message", label: "💵 /รับเงิน 5000", text: "/รับเงิน 5000" },
              },
              {
                type: "button", style: "primary", color: "#2196F3", height: "md",
                action: { type: "message", label: "💼 /รับค่าจ้าง 3000", text: "/รับค่าจ้าง 3000 ค่าแรง" },
              },
              {
                type: "button", style: "primary", color: "#ff5722", height: "md",
                action: { type: "message", label: "🍜 /จ่าย 500 อาหาร", text: "/จ่าย 500 ค่าอาหาร" },
              },
              {
                type: "button", style: "secondary", height: "md",
                action: { type: "message", label: "🚗 /ค่าเดินทาง 200", text: "/ค่าเดินทาง 200" },
              },
            ],
          },
        },
        // === BUBBLE 6: 📆 Yearly Reports (NEW!) ===
        {
          type: "bubble",
          size: "kilo",
          header: {
            type: "box", layout: "vertical",
            backgroundColor: "#e91e63",
            paddingAll: "lg",
            contents: [
              { type: "text", text: "📆 รายงานรายปี", color: "#ffffff", weight: "bold", size: "lg", align: "center" },
              { type: "text", text: "สรุป 12 เดือน / ทั้งปี", color: "#f8bbd0", size: "xs", align: "center", margin: "sm" },
            ],
          },
          hero: {
            type: "box", layout: "vertical",
            backgroundColor: "#c2185b",
            paddingAll: "xl",
            contents: [
              { type: "text", text: "📆", size: "3xl", align: "center" },
              { type: "text", text: "ดูภาพรวมทั้งปี", color: "#ffffff", size: "sm", align: "center", margin: "md", weight: "bold" },
            ],
          },
          body: {
            type: "box", layout: "vertical", spacing: "md", paddingAll: "lg",
            contents: [
              {
                type: "button", style: "primary", color: "#e91e63", height: "md",
                action: { type: "message", label: "📊 สรุปรายปี 2568", text: "สรุปรายปี 2568" },
              },
              {
                type: "button", style: "primary", color: "#9c27b0", height: "md",
                action: { type: "message", label: "📈 สรุป 12 เดือนล่าสุด", text: "สรุป 12 เดือน" },
              },
              {
                type: "button", style: "secondary", height: "md",
                action: { type: "message", label: "📊 Dashboard Pro", text: "dashboard pro" },
              },
              {
                type: "button", style: "secondary", height: "md",
                action: { type: "message", label: "📖 วิธีใช้ระบบบัญชี", text: "วิธีใช้บัญชี" },
              },
            ],
          },
        },
        // === BUBBLE 7: เป้าหมายออม ===
        {
          type: "bubble",
          size: "kilo",
          header: {
            type: "box", layout: "vertical",
            backgroundColor: "#f5a623",
            paddingAll: "lg",
            contents: [
              { type: "text", text: "🎯 เป้าหมายออม", color: "#ffffff", weight: "bold", size: "lg", align: "center" },
              { type: "text", text: "ออมเงินให้ถึงฝัน", color: "#fff5d4", size: "xs", align: "center", margin: "sm" },
            ],
          },
          hero: {
            type: "box", layout: "vertical",
            backgroundColor: "#d9901a",
            paddingAll: "xl",
            contents: [
              { type: "text", text: "🎯", size: "3xl", align: "center" },
              { type: "text", text: "สร้างเป้าหมายการออม", color: "#ffffff", size: "sm", align: "center", margin: "md", weight: "bold" },
            ],
          },
          body: {
            type: "box", layout: "vertical", spacing: "md", paddingAll: "lg",
            contents: [
              {
                type: "button", style: "primary", color: "#f5a623", height: "md",
                action: { type: "message", label: "🎯 ดูเป้าหมายทั้งหมด", text: "ดูเป้าหมาย" },
              },
              {
                type: "button", style: "secondary", height: "md",
                action: { type: "message", label: "📱 ตั้งเป้า iPhone 35,000", text: "ตั้งเป้าออม iPhone 35000" },
              },
              {
                type: "button", style: "secondary", height: "md",
                action: { type: "message", label: "💰 ออมเข้า iPhone 1,000", text: "ออมเข้า iPhone 1000" },
              },
              {
                type: "button", style: "secondary", height: "md",
                action: { type: "message", label: "📖 วิธีใช้ระบบบัญชี", text: "วิธีใช้บัญชี" },
              },
            ],
          },
        },
      ],
    },
  };
}

/**
 * สร้าง Quick Reply สำหรับระบบบัญชี
 */
function getAccountingQuickReply() {
  return {
    items: [
      { type: "action", action: { type: "message", label: "📊 Dashboard", text: "dashboard" } },
      { type: "action", action: { type: "message", label: "🤖 วิเคราะห์บัญชี", text: "วิเคราะห์บัญชี" } },
      { type: "action", action: { type: "message", label: "📆 สรุปเดือน", text: "สรุปเดือน" } },
      { type: "action", action: { type: "message", label: "✏️ แก้ไข", text: "เลือกแก้ไข" } },
      { type: "action", action: { type: "message", label: "🗑️ ลบ", text: "เลือกลบ" } },
      { type: "action", action: { type: "message", label: "📋 งบ", text: "เช็คงบ" } },
      { type: "action", action: { type: "message", label: "🎯 เป้าหมาย", text: "ดูเป้าหมาย" } },
      { type: "action", action: { type: "message", label: "💡 คำแนะนำ", text: "คำแนะนำการเงิน" } },
      { type: "action", action: { type: "message", label: "📈 เทียบเดือน", text: "เปรียบเทียบเดือน" } },
      { type: "action", action: { type: "message", label: "📖 วิธีใช้", text: "วิธีใช้บัญชี" } },
    ],
  };
}

/**
 * สร้าง Flex Message คู่มือการใช้งานระบบบัญชี
 */
function createAccountingGuideMessage() {
  return {
    type: "flex",
    altText: "📖 คู่มือระบบบัญชี AI v3.0",
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box", layout: "vertical",
        backgroundColor: "#1a1a2e",
        paddingAll: "lg",
        contents: [
          { type: "text", text: "📊 ระบบบัญชี AI v3.0", color: "#ffffff", weight: "bold", size: "xl" },
          { type: "text", text: "พิมพ์/พูด เพื่อจดบัญชี", color: "#cccccc", size: "sm", margin: "sm" },
        ],
      },
      body: {
        type: "box", layout: "vertical", spacing: "lg", paddingAll: "lg",
        contents: [
          // บันทึกรายการ
          {
            type: "box", layout: "vertical",
            contents: [
              { type: "text", text: "📝 บันทึกรายการ", weight: "bold", size: "md", color: "#06c755" },
              { type: "text", text: "• ขายข้าว 5000", size: "sm", color: "#666666", margin: "sm" },
              { type: "text", text: "• ซื้อปุ๋ย 1200", size: "sm", color: "#666666" },
              { type: "text", text: "• จ่ายค่าไฟ 500", size: "sm", color: "#666666" },
              { type: "text", text: "• เมื่อวานขายมะม่วง 2000", size: "sm", color: "#666666" },
            ],
          },
          { type: "separator" },
          // AI Features
          {
            type: "box", layout: "vertical",
            contents: [
              { type: "text", text: "🤖 AI วิเคราะห์", weight: "bold", size: "md", color: "#667eea" },
              { type: "text", text: "• วิเคราะห์บัญชี - AI วิเคราะห์พฤติกรรม", size: "sm", color: "#666666", margin: "sm" },
              { type: "text", text: "• คำแนะนำการเงิน - รับคำแนะนำ", size: "sm", color: "#666666" },
              { type: "text", text: "• เปรียบเทียบเดือน - เทียบกับเดือนก่อน", size: "sm", color: "#666666" },
            ],
          },
          { type: "separator" },
          // งบประมาณ & เป้าหมาย
          {
            type: "box", layout: "vertical",
            contents: [
              { type: "text", text: "📋 งบประมาณ & 🎯 เป้าหมาย", weight: "bold", size: "md", color: "#764ba2" },
              { type: "text", text: "• ตั้งงบ อาหาร 5000", size: "sm", color: "#666666", margin: "sm" },
              { type: "text", text: "• เช็คงบ - ดูสถานะงบ", size: "sm", color: "#666666" },
              { type: "text", text: "• ตั้งเป้าออม iPhone 35000", size: "sm", color: "#666666" },
              { type: "text", text: "• ออมเข้า iPhone 1000", size: "sm", color: "#666666" },
            ],
          },
        ],
      },
      footer: {
        type: "box", layout: "vertical", spacing: "sm",
        contents: [
          {
            type: "box", layout: "horizontal", spacing: "sm",
            contents: [
              { type: "button", style: "primary", color: "#667eea", height: "sm", action: { type: "message", label: "📊 เปิดเมนู", text: "เมนูบัญชี" }, flex: 1 },
              { type: "button", style: "primary", color: "#06c755", height: "sm", action: { type: "message", label: "📆 สรุปเดือน", text: "สรุปเดือน" }, flex: 1 },
            ],
          },
          {
            type: "box", layout: "horizontal", spacing: "sm",
            contents: [
              { type: "button", style: "secondary", height: "sm", action: { type: "message", label: "🤖 วิเคราะห์บัญชี", text: "วิเคราะห์บัญชี" }, flex: 1 },
              { type: "button", style: "secondary", height: "sm", action: { type: "message", label: "🎯 เป้าหมาย", text: "ดูเป้าหมาย" }, flex: 1 },
            ],
          },
        ],
      },
    },
  };
}

module.exports = {
  isAccountingCommand,
  handleAccountingCommand,
  getAccountingHelp,
  // Core functions
  parseTransaction,
  saveTransaction,
  // 🆕 Quick Commands
  parseQuickIncomeCommand,
  parseQuickExpenseCommand,
  // 🆕 AI Features
  analyzeSpendingPattern,
  generateFinancialAdvice,
  // 🆕 Budget Management
  setBudget,
  getBudgets,
  checkBudgetStatus,
  // 🆕 Savings Goals
  setGoal,
  addToGoal,
  getGoals,
  // 🆕 Comparison & Stats
  getMonthComparison,
  getQuickStats,
  // 🆕 Yearly/Monthly Reports
  getYearlyMonthlyData,
  getLast12MonthsData,
  // 🆕 Recurring
  setRecurring,
  getRecurringTransactions,
  // Flex Creators
  createInsightsFlex,
  createBudgetFlex,
  createGoalsFlex,
  createAdviceFlex,
  createComparisonFlex,
  createQuickStatsFlex,
  // 🆕 New Flex Creators
  createYearlyReportFlex,
  createLast12MonthsFlex,
  createEnhancedDashboardFlex,
  // 🆕 Menu & Guide
  createAccountingMenuFlex,
  createAccountingGuideMessage,
  getAccountingQuickReply,
  // 💎 Quota System
  checkAccountingQuota,
  getMonthlyTransactionCount,
  createQuotaWarningFlex,
  createQuotaExceededFlex,
  FREE_ACCOUNTING_LIMIT,
  // 🏪 Retail Shop Functions
  getShopProfit,
  getSalesByChannel,
  createShopDashboardFlex,
  createShopMenuFlex,
};
