/**
 * 📄 WiT AI - PDF Report Generator
 * สร้างรายงาน PDF จาก Firestore และอัปโหลดไป Firebase Storage
 *
 * @author WiT AI System
 * @version 1.0.0
 * @created 2025-12-09
 */

const PDFDocument = require("pdfkit");
const { getStorage } = require("firebase-admin/storage");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const path = require("path");
const fs = require("fs");

// =====================================================
// 📊 REPORT GENERATOR CLASS
// =====================================================

class ReportGenerator {
  constructor() {
    this._db = null;
    this._storage = null;
    this._bucket = null;

    // Font paths
    this.fontPath = path.join(__dirname, "fonts", "THSarabunNew.ttf");
    this.fontBoldPath = path.join(__dirname, "fonts", "THSarabunNew-Bold.ttf");
    this.logoPath = path.join(__dirname, "assets", "wit-logo.png");

    // Check if Thai font exists
    this.hasThaiFontFont = fs.existsSync(this.fontPath);
    if (!this.hasThaiFontFont) {
      console.warn("⚠️ Thai font not found. Using default font (Thai may not display correctly)");
    }
  }

  // Lazy initialization getters
  get db() {
    if (!this._db) {
      this._db = getFirestore();
    }
    return this._db;
  }

  get storage() {
    if (!this._storage) {
      this._storage = getStorage();
    }
    return this._storage;
  }

  get bucket() {
    if (!this._bucket) {
      this._bucket = this.storage.bucket();
    }
    return this._bucket;
  }

  /**
   * 📅 Format date to Thai format
   * @param {Date|string} date - Date to format
   * @return {string} - Formatted Thai date
   */
  formatThaiDate(date) {
    const d = new Date(date);
    const thaiMonths = [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
    ];
    const day = d.getDate();
    const month = thaiMonths[d.getMonth()];
    const year = d.getFullYear() + 543; // Buddhist year
    return `${day} ${month} ${year}`;
  }

  /**
   * 📅 Format time to Thai format
   * @param {Date|string} date - Date to format
   * @return {string} - Formatted time (HH:MM)
   */
  formatTime(date) {
    const d = new Date(date);
    return d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
  }

  /**
   * 🏭 Generate Production Report PDF
   * @param {string} userId - User ID
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {object} userData - User data (name, org, etc.)
   * @return {Promise<object>} - { downloadUrl, fileName, summary }
   */
  async generateProductionReport(userId, date, userData = {}) {
    console.log(`📄 Generating production report for user: ${userId}, date: ${date}`);

    try {
      // 1. Fetch production logs
      const logs = await this.fetchProductionLogs(userId, date);

      if (logs.length === 0) {
        return {
          success: false,
          error: "NO_DATA",
          message: `ไม่พบข้อมูลการผลิตในวันที่ ${this.formatThaiDate(date)}`,
        };
      }

      // 2. Generate PDF
      const { buffer, summary } = await this.createProductionPDF(userId, date, logs, userData);

      // 3. Upload to Storage
      const fileName = `${date}_production_${userId.substring(0, 8)}.pdf`;
      const filePath = `reports/${userId}/${fileName}`;
      const downloadUrl = await this.uploadPDF(buffer, filePath);

      // 4. Save record to Firestore
      await this.saveReportRecord({
        userId,
        fileName,
        filePath,
        downloadUrl,
        reportType: "production",
        date,
        summary,
        createdAt: FieldValue.serverTimestamp(),
      });

      console.log(`✅ Production report generated: ${fileName}`);

      return {
        success: true,
        downloadUrl,
        fileName,
        summary,
        date: this.formatThaiDate(date),
      };
    } catch (error) {
      console.error("❌ Error generating production report:", error);
      return {
        success: false,
        error: "GENERATION_ERROR",
        message: `เกิดข้อผิดพลาดในการสร้างรายงาน: ${error.message}`,
      };
    }
  }

  /**
   * 🌾 Generate Farm Account Report PDF
   * @param {string} userId - User ID
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {object} userData - User data (name, org, etc.)
   * @return {Promise<object>} - { downloadUrl, fileName, summary }
   */
  async generateFarmReport(userId, date, userData = {}) {
    console.log(`📄 Generating farm report for user: ${userId}, date: ${date}`);

    try {
      // 1. Fetch farm transactions
      const transactions = await this.fetchFarmTransactions(userId, date);

      if (transactions.length === 0) {
        return {
          success: false,
          error: "NO_DATA",
          message: `ไม่พบข้อมูลบัญชีฟาร์มในวันที่ ${this.formatThaiDate(date)}`,
        };
      }

      // 2. Generate PDF
      const { buffer, summary } = await this.createFarmPDF(userId, date, transactions, userData);

      // 3. Upload to Storage
      const fileName = `${date}_farm_${userId.substring(0, 8)}.pdf`;
      const filePath = `reports/${userId}/${fileName}`;
      const downloadUrl = await this.uploadPDF(buffer, filePath);

      // 4. Save record to Firestore
      await this.saveReportRecord({
        userId,
        fileName,
        filePath,
        downloadUrl,
        reportType: "farm",
        date,
        summary,
        createdAt: FieldValue.serverTimestamp(),
      });

      console.log(`✅ Farm report generated: ${fileName}`);

      return {
        success: true,
        downloadUrl,
        fileName,
        summary,
        date: this.formatThaiDate(date),
      };
    } catch (error) {
      console.error("❌ Error generating farm report:", error);
      return {
        success: false,
        error: "GENERATION_ERROR",
        message: `เกิดข้อผิดพลาดในการสร้างรายงาน: ${error.message}`,
      };
    }
  }

  /**
   * 📥 Fetch Production Logs from Firestore
   * @param {string} userId - User ID
   * @param {string} date - Date in YYYY-MM-DD format
   * @return {Promise<Array>} - Array of production logs
   */
  async fetchProductionLogs(userId, date) {
    const startOfDay = new Date(date + "T00:00:00+07:00");
    const endOfDay = new Date(date + "T23:59:59+07:00");

    const snapshot = await this.db.collection("production_logs")
      .where("userId", "==", userId)
      .where("timestamp", ">=", startOfDay)
      .where("timestamp", "<=", endOfDay)
      .orderBy("timestamp", "asc")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date(),
    }));
  }

  /**
   * 📥 Fetch Farm Transactions from Firestore
   * @param {string} userId - User ID
   * @param {string} date - Date in YYYY-MM-DD format
   * @return {Promise<Array>} - Array of transactions
   */
  async fetchFarmTransactions(userId, date) {
    const startOfDay = new Date(date + "T00:00:00+07:00");
    const endOfDay = new Date(date + "T23:59:59+07:00");

    const snapshot = await this.db.collection("farm_transactions")
      .where("userId", "==", userId)
      .where("timestamp", ">=", startOfDay)
      .where("timestamp", "<=", endOfDay)
      .orderBy("timestamp", "asc")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date(),
    }));
  }

  /**
   * 📄 Create Production PDF
   * @param {string} userId - User ID
   * @param {string} date - Date string
   * @param {Array} logs - Production logs
   * @param {object} userData - User data
   * @return {Promise<object>} - { buffer, summary }
   */
  async createProductionPDF(userId, date, logs, userData) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: "A4",
          margin: 50,
          info: {
            Title: `รายงานการผลิตประจำวัน - ${date}`,
            Author: "WiT AI System",
            Creator: "wizmobiz.com",
          },
        });

        const chunks = [];
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => {
          const buffer = Buffer.concat(chunks);
          resolve({ buffer, summary });
        });
        doc.on("error", reject);

        // Register Thai font if available
        if (this.hasThaiFontFont) {
          doc.registerFont("Thai", this.fontPath);
          if (fs.existsSync(this.fontBoldPath)) {
            doc.registerFont("ThaiBold", this.fontBoldPath);
          }
        }

        // Calculate summary
        const summary = {
          totalRecords: logs.length,
          totalProduction: logs.reduce((sum, log) => sum + (log.quantity || 0), 0),
          totalDefects: logs.reduce((sum, log) => sum + (log.defects || 0), 0),
        };
        summary.defectRate = summary.totalProduction > 0 ?
          ((summary.totalDefects / summary.totalProduction) * 100).toFixed(2) :
          0;

        // === HEADER ===
        this.drawHeader(doc, "รายงานการผลิตประจำวัน", "Production Daily Report");

        // === META INFO ===
        const startY = 140;
        this.setFont(doc, "normal", 12);
        doc.fillColor("#333333");

        doc.text(`ผู้ใช้: ${userData.name || userId.substring(0, 12)}`, 50, startY);
        doc.text(`วันที่: ${this.formatThaiDate(date)}`, 50, startY + 20);
        doc.text(`องค์กร: ${userData.orgName || "-"}`, 300, startY);
        doc.text(`จำนวนรายการ: ${logs.length} รายการ`, 300, startY + 20);

        // === TABLE HEADER ===
        const tableTop = startY + 60;
        this.drawTableHeader(doc, tableTop, ["เวลา", "กิจกรรม", "จำนวน", "ของเสีย", "หมายเหตุ"], [60, 150, 70, 70, 150]);

        // === TABLE DATA ===
        let y = tableTop + 30;
        const maxY = 750; // Max Y before new page

        for (const log of logs) {
          if (y > maxY) {
            doc.addPage();
            y = 50;
            this.drawTableHeader(doc, y, ["เวลา", "กิจกรรม", "จำนวน", "ของเสีย", "หมายเหตุ"], [60, 150, 70, 70, 150]);
            y += 30;
          }

          this.setFont(doc, "normal", 11);
          doc.fillColor("#333333");

          doc.text(this.formatTime(log.timestamp), 50, y, { width: 55 });
          doc.text(log.activity || log.type || "-", 115, y, { width: 145 });
          doc.text(String(log.quantity || 0), 265, y, { width: 65, align: "right" });
          doc.text(String(log.defects || 0), 335, y, { width: 65, align: "right" });
          doc.text((log.note || "-").substring(0, 30), 405, y, { width: 145 });

          // Draw row line
          doc.strokeColor("#EEEEEE").lineWidth(0.5);
          doc.moveTo(50, y + 18).lineTo(550, y + 18).stroke();

          y += 25;
        }

        // === SUMMARY BOX ===
        y = Math.max(y + 20, tableTop + 200);
        if (y > 700) {
          doc.addPage();
          y = 50;
        }

        this.drawSummaryBox(doc, y, [
          { label: "รวมรายการ", value: `${summary.totalRecords} รายการ` },
          { label: "รวมผลิต", value: `${summary.totalProduction.toLocaleString()} ชิ้น` },
          { label: "รวมของเสีย", value: `${summary.totalDefects.toLocaleString()} ชิ้น` },
          { label: "อัตราของเสีย", value: `${summary.defectRate}%` },
        ]);

        // === FOOTER ===
        this.drawFooter(doc);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 📄 Create Farm Account PDF
   * @param {string} userId - User ID
   * @param {string} date - Date string
   * @param {Array} transactions - Farm transactions
   * @param {object} userData - User data
   * @return {Promise<object>} - { buffer, summary }
   */
  async createFarmPDF(userId, date, transactions, userData) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: "A4",
          margin: 50,
          info: {
            Title: `รายงานบัญชีฟาร์มประจำวัน - ${date}`,
            Author: "WiT AI System",
            Creator: "wizmobiz.com",
          },
        });

        const chunks = [];
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => {
          const buffer = Buffer.concat(chunks);
          resolve({ buffer, summary });
        });
        doc.on("error", reject);

        // Register Thai font if available
        if (this.hasThaiFontFont) {
          doc.registerFont("Thai", this.fontPath);
          if (fs.existsSync(this.fontBoldPath)) {
            doc.registerFont("ThaiBold", this.fontBoldPath);
          }
        }

        // Calculate summary
        const income = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + (t.amount || 0), 0);
        const expense = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + (t.amount || 0), 0);
        const summary = {
          totalRecords: transactions.length,
          totalIncome: income,
          totalExpense: expense,
          netProfit: income - expense,
        };

        // === HEADER ===
        this.drawHeader(doc, "รายงานบัญชีฟาร์มประจำวัน", "Farm Account Daily Report");

        // === META INFO ===
        const startY = 140;
        this.setFont(doc, "normal", 12);
        doc.fillColor("#333333");

        doc.text(`ผู้ใช้: ${userData.name || userId.substring(0, 12)}`, 50, startY);
        doc.text(`วันที่: ${this.formatThaiDate(date)}`, 50, startY + 20);
        doc.text(`ฟาร์ม: ${userData.farmName || userData.orgName || "-"}`, 300, startY);
        doc.text(`จำนวนรายการ: ${transactions.length} รายการ`, 300, startY + 20);

        // === TABLE HEADER ===
        const tableTop = startY + 60;
        this.drawTableHeader(doc, tableTop, ["เวลา", "รายการ", "ประเภท", "จำนวนเงิน", "หมายเหตุ"], [60, 150, 60, 80, 130]);

        // === TABLE DATA ===
        let y = tableTop + 30;
        const maxY = 750;

        for (const trans of transactions) {
          if (y > maxY) {
            doc.addPage();
            y = 50;
            this.drawTableHeader(doc, y, ["เวลา", "รายการ", "ประเภท", "จำนวนเงิน", "หมายเหตุ"], [60, 150, 60, 80, 130]);
            y += 30;
          }

          this.setFont(doc, "normal", 11);

          const isIncome = trans.type === "income";
          doc.fillColor("#333333");
          doc.text(this.formatTime(trans.timestamp), 50, y, { width: 55 });
          doc.text(trans.description || trans.item || "-", 115, y, { width: 145 });

          doc.fillColor(isIncome ? "#16A34A" : "#DC2626");
          doc.text(isIncome ? "รายรับ" : "รายจ่าย", 265, y, { width: 55 });
          doc.text(`${isIncome ? "+" : "-"}${(trans.amount || 0).toLocaleString()}`, 325, y, { width: 75, align: "right" });

          doc.fillColor("#333333");
          doc.text((trans.note || "-").substring(0, 25), 405, y, { width: 125 });

          // Draw row line
          doc.strokeColor("#EEEEEE").lineWidth(0.5);
          doc.moveTo(50, y + 18).lineTo(550, y + 18).stroke();

          y += 25;
        }

        // === SUMMARY BOX ===
        y = Math.max(y + 20, tableTop + 200);
        if (y > 700) {
          doc.addPage();
          y = 50;
        }

        const netColor = summary.netProfit >= 0 ? "#16A34A" : "#DC2626";
        this.drawSummaryBox(doc, y, [
          { label: "รวมรายการ", value: `${summary.totalRecords} รายการ` },
          { label: "รวมรายรับ", value: `+${summary.totalIncome.toLocaleString()} บาท`, color: "#16A34A" },
          { label: "รวมรายจ่าย", value: `-${summary.totalExpense.toLocaleString()} บาท`, color: "#DC2626" },
          { label: "กำไร/ขาดทุน", value: `${summary.netProfit >= 0 ? "+" : ""}${summary.netProfit.toLocaleString()} บาท`, color: netColor },
        ]);

        // === FOOTER ===
        this.drawFooter(doc);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 🎨 Draw PDF Header
   */
  drawHeader(doc, titleTH, titleEN) {
    // Header background
    doc.rect(0, 0, 612, 120).fill("#1E40AF");

    // Logo placeholder (if exists)
    if (fs.existsSync(this.logoPath)) {
      try {
        doc.image(this.logoPath, 50, 25, { width: 60 });
      } catch (e) {
        console.warn("Could not load logo:", e.message);
      }
    }

    // Title
    this.setFont(doc, "bold", 24);
    doc.fillColor("#FFFFFF");
    doc.text(titleTH, 130, 35, { width: 400 });

    this.setFont(doc, "normal", 14);
    doc.fillColor("#93C5FD");
    doc.text(titleEN, 130, 70);

    // WiT AI badge
    this.setFont(doc, "normal", 10);
    doc.fillColor("#FFFFFF");
    doc.text("WiT AI System", 450, 90);
  }

  /**
   * 🎨 Draw Table Header
   */
  drawTableHeader(doc, y, headers, widths) {
    // Header background
    doc.rect(50, y, 500, 25).fill("#F3F4F6");

    this.setFont(doc, "bold", 11);
    doc.fillColor("#374151");

    let x = 55;
    headers.forEach((header, i) => {
      doc.text(header, x, y + 7, { width: widths[i] - 10 });
      x += widths[i];
    });

    // Border
    doc.strokeColor("#D1D5DB").lineWidth(1);
    doc.rect(50, y, 500, 25).stroke();
  }

  /**
   * 🎨 Draw Summary Box
   */
  drawSummaryBox(doc, y, items) {
    // Box background
    doc.rect(50, y, 500, 100).fill("#F0FDF4");
    doc.strokeColor("#16A34A").lineWidth(2);
    doc.rect(50, y, 500, 100).stroke();

    // Title
    this.setFont(doc, "bold", 14);
    doc.fillColor("#166534");
    doc.text("📊 สรุปรายงาน", 70, y + 15);

    // Items
    this.setFont(doc, "normal", 12);
    let itemY = y + 40;
    let col = 0;

    items.forEach((item, index) => {
      const x = col === 0 ? 70 : 320;
      doc.fillColor("#374151");
      doc.text(`${item.label}:`, x, itemY);

      doc.fillColor(item.color || "#166534");
      this.setFont(doc, "bold", 12);
      doc.text(item.value, x + 100, itemY);
      this.setFont(doc, "normal", 12);

      col++;
      if (col > 1) {
        col = 0;
        itemY += 25;
      }
    });
  }

  /**
   * 🎨 Draw Footer
   */
  drawFooter(doc) {
    const pageCount = doc.bufferedPageRange().count;

    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);

      // Footer line
      doc.strokeColor("#D1D5DB").lineWidth(1);
      doc.moveTo(50, 780).lineTo(550, 780).stroke();

      // Footer text
      this.setFont(doc, "normal", 9);
      doc.fillColor("#6B7280");
      doc.text("Generated by WiT AI System - wizmobiz.com", 50, 790, { align: "left" });
      doc.text(`หน้า ${i + 1} / ${pageCount}`, 450, 790, { align: "right", width: 100 });
    }
  }

  /**
   * 🔤 Set Font (Thai or default)
   */
  setFont(doc, weight, size) {
    if (this.hasThaiFontFont) {
      const fontName = weight === "bold" && fs.existsSync(this.fontBoldPath) ? "ThaiBold" : "Thai";
      doc.font(fontName).fontSize(size);
    } else {
      doc.font("Helvetica").fontSize(size);
    }
  }

  /**
   * ☁️ Upload PDF to Firebase Storage
   * @param {Buffer} buffer - PDF buffer
   * @param {string} filePath - Storage path
   * @return {Promise<string>} - Download URL
   */
  async uploadPDF(buffer, filePath) {
    const file = this.bucket.file(filePath);

    await file.save(buffer, {
      metadata: {
        contentType: "application/pdf",
        cacheControl: "public, max-age=31536000",
      },
    });

    // Make file publicly accessible
    await file.makePublic();

    return `https://storage.googleapis.com/${this.bucket.name}/${filePath}`;
  }

  /**
   * 💾 Save Report Record to Firestore
   * @param {object} record - Report record data
   */
  async saveReportRecord(record) {
    await this.db.collection("generated_reports").add(record);
  }

  /**
   * 📜 Get Report History
   * @param {string} userId - User ID
   * @param {number} limit - Max records
   * @return {Promise<Array>} - Array of reports
   */
  async getReportHistory(userId, limit = 20) {
    const snapshot = await this.db.collection("generated_reports")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    }));
  }
}

// =====================================================
// 📤 EXPORT
// =====================================================

const reportGenerator = new ReportGenerator();

/**
 * 🎯 Main function to generate daily report
 * @param {object} params - { userId, date, type, userData }
 * @return {Promise<object>} - Report result
 */
async function generateDailyReport({ userId, date, type = "production", userData = {} }) {
  if (!userId) {
    return { success: false, error: "INVALID_INPUT", message: "กรุณาระบุ userId" };
  }

  // Default to today if no date provided
  if (!date) {
    const today = new Date();
    today.setHours(today.getHours() + 7); // Thailand timezone
    date = today.toISOString().split("T")[0];
  }

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { success: false, error: "INVALID_DATE", message: "รูปแบบวันที่ไม่ถูกต้อง (YYYY-MM-DD)" };
  }

  if (type === "production") {
    return reportGenerator.generateProductionReport(userId, date, userData);
  } else if (type === "farm") {
    return reportGenerator.generateFarmReport(userId, date, userData);
  } else {
    return { success: false, error: "INVALID_TYPE", message: "ประเภทรายงานไม่ถูกต้อง (production | farm)" };
  }
}

/**
 * 📜 Get user's report history
 */
async function getReportHistory(userId, limit = 20) {
  return reportGenerator.getReportHistory(userId, limit);
}

/**
 * 🎨 Create Report Result Flex Message for LINE
 */
function createReportResultFlex(result) {
  if (!result.success) {
    return {
      type: "bubble",
      size: "kilo",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "❌ ไม่สามารถสร้างรายงานได้",
            weight: "bold",
            size: "lg",
            color: "#DC2626",
          },
        ],
        backgroundColor: "#FEE2E2",
        paddingAll: "15px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: result.message || "เกิดข้อผิดพลาด",
            wrap: true,
            color: "#666666",
            size: "sm",
          },
        ],
        paddingAll: "15px",
      },
    };
  }

  return {
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
            {
              type: "text",
              text: "📄",
              size: "xxl",
              flex: 0,
            },
            {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: "รายงานเสร็จแล้ว!",
                  weight: "bold",
                  size: "xl",
                  color: "#FFFFFF",
                },
                {
                  type: "text",
                  text: "Report Generated",
                  size: "xs",
                  color: "#93C5FD",
                },
              ],
              paddingStart: "15px",
            },
          ],
          alignItems: "center",
        },
      ],
      backgroundColor: "#1E40AF",
      paddingAll: "20px",
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "text",
              text: "📅 วันที่:",
              size: "sm",
              color: "#666666",
              flex: 3,
            },
            {
              type: "text",
              text: result.date || "-",
              size: "sm",
              color: "#333333",
              weight: "bold",
              flex: 5,
            },
          ],
          paddingBottom: "10px",
        },
        {
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "text",
              text: "📁 ไฟล์:",
              size: "sm",
              color: "#666666",
              flex: 3,
            },
            {
              type: "text",
              text: result.fileName || "-",
              size: "sm",
              color: "#333333",
              flex: 5,
              wrap: true,
            },
          ],
          paddingBottom: "10px",
        },
        {
          type: "separator",
          margin: "md",
        },
        {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "📊 สรุปข้อมูล",
              weight: "bold",
              size: "sm",
              color: "#1E40AF",
              margin: "md",
            },
            {
              type: "box",
              layout: "horizontal",
              contents: getSummaryContents(result.summary),
              margin: "md",
              spacing: "sm",
            },
          ],
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
            type: "uri",
            label: "📥 ดาวน์โหลด PDF",
            uri: result.downloadUrl,
          },
          style: "primary",
          color: "#1E40AF",
          height: "sm",
        },
        {
          type: "button",
          action: {
            type: "uri",
            label: "🌐 ดูประวัติบนเว็บ",
            uri: "https://wizmobiz.com/reports",
          },
          style: "secondary",
          height: "sm",
          margin: "sm",
        },
      ],
      paddingAll: "15px",
    },
  };
}

/**
 * Helper to create summary contents for Flex
 */
function getSummaryContents(summary) {
  if (!summary) return [{ type: "text", text: "ไม่มีข้อมูลสรุป", color: "#999999", size: "xs" }];

  const contents = [];

  if (summary.totalRecords !== undefined) {
    contents.push({
      type: "box",
      layout: "vertical",
      contents: [
        { type: "text", text: String(summary.totalRecords), size: "xl", weight: "bold", color: "#1E40AF", align: "center" },
        { type: "text", text: "รายการ", size: "xxs", color: "#666666", align: "center" },
      ],
      flex: 1,
    });
  }

  if (summary.totalProduction !== undefined) {
    contents.push({
      type: "box",
      layout: "vertical",
      contents: [
        { type: "text", text: summary.totalProduction.toLocaleString(), size: "xl", weight: "bold", color: "#16A34A", align: "center" },
        { type: "text", text: "ผลิต", size: "xxs", color: "#666666", align: "center" },
      ],
      flex: 1,
    });
  }

  if (summary.totalIncome !== undefined) {
    contents.push({
      type: "box",
      layout: "vertical",
      contents: [
        { type: "text", text: `+${summary.totalIncome.toLocaleString()}`, size: "lg", weight: "bold", color: "#16A34A", align: "center" },
        { type: "text", text: "รายรับ", size: "xxs", color: "#666666", align: "center" },
      ],
      flex: 1,
    });
  }

  if (summary.totalExpense !== undefined) {
    contents.push({
      type: "box",
      layout: "vertical",
      contents: [
        { type: "text", text: `-${summary.totalExpense.toLocaleString()}`, size: "lg", weight: "bold", color: "#DC2626", align: "center" },
        { type: "text", text: "รายจ่าย", size: "xxs", color: "#666666", align: "center" },
      ],
      flex: 1,
    });
  }

  if (summary.defectRate !== undefined) {
    contents.push({
      type: "box",
      layout: "vertical",
      contents: [
        { type: "text", text: `${summary.defectRate}%`, size: "xl", weight: "bold", color: summary.defectRate > 5 ? "#DC2626" : "#16A34A", align: "center" },
        { type: "text", text: "ของเสีย", size: "xxs", color: "#666666", align: "center" },
      ],
      flex: 1,
    });
  }

  return contents.length > 0 ? contents : [{ type: "text", text: "ไม่มีข้อมูล", color: "#999999", size: "xs" }];
}

/**
 * 📝 Create Report Selection Flex (for choosing report type)
 */
function createReportSelectionFlex(userId) {
  return {
    type: "bubble",
    size: "mega",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: "📄 สร้างรายงาน PDF",
          weight: "bold",
          size: "lg",
          color: "#FFFFFF",
        },
        {
          type: "text",
          text: "เลือกประเภทรายงานที่ต้องการ",
          size: "xs",
          color: "#93C5FD",
          margin: "sm",
        },
      ],
      backgroundColor: "#1E40AF",
      paddingAll: "20px",
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: "⏰ รายงานจะถูกสร้างจากข้อมูลของวันนี้",
          size: "xs",
          color: "#666666",
          wrap: true,
        },
      ],
      paddingAll: "15px",
    },
    footer: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "button",
          action: {
            type: "message",
            label: "🏭 รายงานการผลิต",
            text: "/report production",
          },
          style: "primary",
          color: "#1E40AF",
          height: "sm",
        },
        {
          type: "button",
          action: {
            type: "message",
            label: "🌾 รายงานบัญชีฟาร์ม",
            text: "/report farm",
          },
          style: "primary",
          color: "#16A34A",
          height: "sm",
          margin: "sm",
        },
        {
          type: "button",
          action: {
            type: "uri",
            label: "📜 ดูประวัติรายงาน",
            uri: "https://wizmobiz.com/reports",
          },
          style: "secondary",
          height: "sm",
          margin: "sm",
        },
      ],
      paddingAll: "15px",
    },
  };
}

module.exports = {
  generateDailyReport,
  getReportHistory,
  createReportResultFlex,
  createReportSelectionFlex,
  ReportGenerator,
};
