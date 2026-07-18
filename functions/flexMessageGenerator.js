const createStatsDashboard = (stats) => {
  // Validate input
  if (!stats || !stats.memory) {
    console.error("Invalid stats data provided to createStatsDashboard");
    return null;
  }

  try {
    // Calculate memory metrics safely
    const heapUsed = stats.memory.heapUsed || 0;
    const heapTotal = stats.memory.heapTotal || 1;
    const rss = stats.memory.rss || 0;

    const memoryUsage = (heapUsed / 1024 / 1024).toFixed(2);
    const memoryTotal = (heapTotal / 1024 / 1024).toFixed(2);
    const memoryPercent = Math.round((heapUsed / heapTotal) * 100);
    const rssMemory = (rss / 1024 / 1024).toFixed(2);

    const uptime = stats.uptime || 0;
    const uptimeHours = (uptime / 3600).toFixed(2);
    const uptimeMinutes = (uptime / 60).toFixed(1);
    const nodeVersion = stats.nodeVersion || "N/A";

    // Determine status color and emoji
    let progressColor = "#06c755"; // Green
    let statusEmoji = "✅";
    let statusText = "ปกติ";
    let headerBg = "#27ae60";

    if (memoryPercent > 70 && memoryPercent <= 90) {
      progressColor = "#f39c12"; // Orange
      statusEmoji = "⚠️";
      statusText = "ใช้งานสูง";
      headerBg = "#f39c12";
    }
    if (memoryPercent > 90) {
      progressColor = "#e74c3c"; // Red
      statusEmoji = "🔴";
      statusText = "วิกฤต";
      headerBg = "#c0392b";
    }

    // Calculate progress bar width (minimum 5% for visibility)
    const progressWidth = Math.max(5, Math.min(100, memoryPercent));

    return {
      type: "flex",
      altText: `สถานะระบบ: ${statusText} | Memory ${memoryPercent}% | Uptime ${uptimeMinutes} นาที`,
      contents: {
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
                {
                  type: "text",
                  text: "📊",
                  size: "xl",
                  flex: 0,
                  margin: "none",
                },
                {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {
                      type: "text",
                      text: "สถานะระบบ",
                      weight: "bold",
                      color: "#ffffff",
                      size: "sm",
                    },
                    {
                      type: "text",
                      text: "SYSTEM STATUS",
                      color: "#ffffff99",
                      size: "xxs",
                    },
                  ],
                  margin: "md",
                },
              ],
            },
          ],
          backgroundColor: headerBg,
          paddingAll: "18px",
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
                  text: statusEmoji,
                  size: "xl",
                  flex: 0,
                },
                {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {
                      type: "text",
                      text: statusText,
                      weight: "bold",
                      size: "lg",
                      color: progressColor,
                    },
                    {
                      type: "text",
                      text: `Node.js ${nodeVersion}`,
                      size: "xs",
                      color: "#999999",
                      margin: "xs",
                    },
                  ],
                  margin: "md",
                },
              ],
              margin: "none",
            },
            {
              type: "separator",
              margin: "xl",
            },
            {
              type: "box",
              layout: "vertical",
              margin: "xl",
              spacing: "sm",
              contents: [
                {
                  type: "text",
                  text: "💾 การใช้หน่วยความจำ",
                  weight: "bold",
                  size: "sm",
                  color: "#1a1a1a",
                },
                {
                  type: "box",
                  layout: "horizontal",
                  margin: "md",
                  contents: [
                    {
                      type: "text",
                      text: "Heap Memory",
                      size: "xs",
                      color: "#666666",
                      flex: 0,
                    },
                    {
                      type: "text",
                      text: `${memoryUsage} / ${memoryTotal} MB`,
                      size: "xs",
                      color: "#1a1a1a",
                      align: "end",
                      weight: "bold",
                    },
                  ],
                },
                {
                  type: "box",
                  layout: "vertical",
                  margin: "md",
                  contents: [
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        {
                          type: "box",
                          layout: "vertical",
                          contents: [],
                          width: `${progressWidth}%`,
                          backgroundColor: progressColor,
                          height: "6px",
                          cornerRadius: "3px",
                        },
                      ],
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      margin: "xs",
                      contents: [
                        {
                          type: "text",
                          text: "0%",
                          size: "xxs",
                          color: "#999999",
                          flex: 0,
                        },
                        {
                          type: "text",
                          text: `${memoryPercent}%`,
                          size: "xs",
                          color: progressColor,
                          align: "center",
                          weight: "bold",
                        },
                        {
                          type: "text",
                          text: "100%",
                          size: "xxs",
                          color: "#999999",
                          align: "end",
                          flex: 0,
                        },
                      ],
                    },
                  ],
                  backgroundColor: "#f0f0f0",
                  height: "6px",
                  cornerRadius: "3px",
                },
                {
                  type: "box",
                  layout: "horizontal",
                  margin: "md",
                  contents: [
                    {
                      type: "text",
                      text: "RSS Memory",
                      size: "xs",
                      color: "#666666",
                      flex: 0,
                    },
                    {
                      type: "text",
                      text: `${rssMemory} MB`,
                      size: "xs",
                      color: "#1a1a1a",
                      align: "end",
                    },
                  ],
                },
              ],
            },
            {
              type: "separator",
              margin: "xl",
            },
            {
              type: "box",
              layout: "vertical",
              margin: "xl",
              spacing: "sm",
              contents: [
                {
                  type: "text",
                  text: "⏱️ เวลาทำงาน",
                  weight: "bold",
                  size: "sm",
                  color: "#1a1a1a",
                },
                {
                  type: "box",
                  layout: "horizontal",
                  margin: "md",
                  contents: [
                    {
                      type: "text",
                      text: "เวลาออนไลน์",
                      size: "xs",
                      color: "#666666",
                      flex: 0,
                    },
                    {
                      type: "text",
                      text: `${uptimeHours} ชั่วโมง (${uptimeMinutes} นาที)`,
                      size: "xs",
                      color: "#1a1a1a",
                      align: "end",
                      weight: "bold",
                    },
                  ],
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
              type: "separator",
              margin: "none",
            },
            {
              type: "box",
              layout: "horizontal",
              margin: "md",
              contents: [
                {
                  type: "text",
                  text: "🤖",
                  size: "sm",
                  flex: 0,
                },
                {
                  type: "text",
                  text: "ระบบพัฒนาโดย อาจารย์ วิทยา",
                  size: "xs",
                  color: "#999999",
                  margin: "sm",
                  flex: 0,
                },
              ],
            },
          ],
          paddingAll: "12px",
        },
        styles: {
          footer: {
            separator: true,
          },
        },
      },
    };
  } catch (error) {
    console.error("Error creating stats dashboard:", error);
    return null;
  }
};

const createCalculationDashboard = (title, data, recommendation) => {
  // Validate input
  if (!title || !Array.isArray(data) || data.length === 0) {
    console.error("Invalid data provided to createCalculationDashboard");
    return null;
  }

  try {
    // Safely create data rows
    const dataRows = data.map((item, index) => {
      const label = String(item.label || "ไม่ระบุ");
      const value = String(item.value || "0");
      const unit = String(item.unit || "");

      return {
        type: "box",
        layout: "horizontal",
        margin: index === 0 ? "md" : "sm",
        contents: [
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: label,
                size: "xs",
                color: "#666666",
                wrap: true,
              },
            ],
            flex: 2,
          },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: value,
                size: "sm",
                color: "#1a1a1a",
                align: "end",
                weight: "bold",
                flex: 0,
              },
              {
                type: "text",
                text: unit ? ` ${unit}` : "",
                size: "xs",
                color: "#999999",
                align: "start",
                margin: "xs",
                flex: 0,
              },
            ],
            flex: 3,
            justifyContent: "flex-end",
            alignItems: "center",
          },
        ],
        paddingAll: "8px",
        backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8f9fa",
        cornerRadius: "4px",
      };
    });

    // Truncate title if too long
    const displayTitle = title.length > 60 ? title.substring(0, 57) + "..." : title;
    const safeRecommendation = String(recommendation || "ไม่มีคำแนะนำเพิ่มเติม");

    return {
      type: "flex",
      altText: `📊 ${displayTitle}`,
      contents: {
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
                {
                  type: "text",
                  text: "📊",
                  size: "xl",
                  flex: 0,
                  margin: "none",
                },
                {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {
                      type: "text",
                      text: "ผลการคำนวณ",
                      color: "#ffffff",
                      weight: "bold",
                      size: "xs",
                    },
                    {
                      type: "text",
                      text: "CALCULATION RESULT",
                      color: "#ffffff99",
                      size: "xxs",
                      margin: "xs",
                    },
                  ],
                  margin: "md",
                },
              ],
            },
            {
              type: "separator",
              margin: "md",
              color: "#ffffff33",
            },
            {
              type: "text",
              text: displayTitle,
              color: "#ffffff",
              weight: "bold",
              size: "md",
              margin: "md",
              wrap: true,
            },
          ],
          backgroundColor: "#1e88e5",
          paddingAll: "18px",
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "📋 รายละเอียด",
              weight: "bold",
              size: "sm",
              color: "#1a1a1a",
              margin: "none",
            },
            {
              type: "box",
              layout: "vertical",
              margin: "md",
              spacing: "xs",
              contents: dataRows,
            },
            {
              type: "separator",
              margin: "xl",
            },
            {
              type: "box",
              layout: "vertical",
              margin: "xl",
              contents: [
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    {
                      type: "text",
                      text: "💡",
                      size: "lg",
                      flex: 0,
                    },
                    {
                      type: "text",
                      text: "คำแนะนำ",
                      weight: "bold",
                      size: "sm",
                      color: "#1a1a1a",
                      margin: "sm",
                    },
                  ],
                },
                {
                  type: "box",
                  layout: "vertical",
                  margin: "md",
                  paddingAll: "12px",
                  backgroundColor: "#e3f2fd",
                  cornerRadius: "8px",
                  contents: [
                    {
                      type: "text",
                      text: safeRecommendation,
                      size: "xs",
                      color: "#424242",
                      wrap: true,
                      lineSpacing: "4px",
                    },
                  ],
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
              type: "separator",
              margin: "none",
            },
            {
              type: "box",
              layout: "horizontal",
              margin: "md",
              contents: [
                {
                  type: "text",
                  text: "🤖",
                  size: "sm",
                  flex: 0,
                },
                {
                  type: "text",
                  text: "ระบบพัฒนาโดย อาจารย์ วิทยา",
                  size: "xs",
                  color: "#999999",
                  margin: "sm",
                  flex: 0,
                },
              ],
            },
          ],
          paddingAll: "12px",
        },
        styles: {
          footer: {
            separator: true,
          },
        },
      },
    };
  } catch (error) {
    console.error("Error creating calculation dashboard:", error);
    return null;
  }
};

// =====================================================
// 💰 PACKAGE DETAIL FLEX MESSAGES
// =====================================================

/**
 * 💰 CREATE PACKAGE DETAIL MESSAGE
 * แสดงรายละเอียดแพ็คเกจแต่ละประเภทเมื่อผู้ใช้คลิกดู
 * @param {string} packageType - 'starter'(99), 'popular'(259), 'best'(699), 'team' (2490)
 */
const createPackageDetailMessage = (packageType = "all") => {
  try {
    // Package data
    const packages = {
      starter: {
        name: "Starter",
        thaiName: "รายเดือน",
        price: "99",
        period: "1 เดือน",
        pricePerDay: "3.3",
        color: "#7c4dff",
        emoji: "👤",
        tag: "เริ่มต้น",
        features: [
          { icon: "✅", text: "WiT ตอบคำถามไม่จำกัด." },
          { icon: "✅", text: "ส่งรูปวิเคราะห์ภาพได้ 10 รูป/วัน" },
          { icon: "✅", text: "เครื่องมือคำนวณทั้งหมด" },
          { icon: "✅", text: "ถามปัญหาเทคนิคได้ตลอด" },
          { icon: "⭐", text: "Support ตอบภายใน 24 ชม." },
        ],
        limitations: [
          { icon: "ℹ️", text: "1 บัญชี / 1 ผู้ใช้" },
        ],
        selectAction: "เลือกรายเดือน",
      },
      popular: {
        name: "Popular",
        thaiName: "3 เดือน",
        price: "259",
        originalPrice: "297",
        period: "3 เดือน",
        pricePerDay: "2.8",
        discount: "12%",
        color: "#1e88e5",
        emoji: "⭐",
        tag: "ยอดนิยม",
        features: [
          { icon: "✅", text: "WiT ตอบคำถามไม่จำกัด." },
          { icon: "✅", text: "วิเคราะห์ภาพได้ 25 รูป/วัน" },
          { icon: "✅", text: "เครื่องมือคำนวณทั้งหมด" },
          { icon: "✅", text: "ถามปัญหาเทคนิคได้ตลอด" },
          { icon: "⭐", text: "Support ตอบภายใน 12 ชม." },
          { icon: "🎁", text: "ฟรี! คู่มือ Injection Molding" },
        ],
        limitations: [
          { icon: "ℹ️", text: "1 บัญชี / 1 ผู้ใช้" },
        ],
        selectAction: "เลือก3เดือน",
      },
      best: {
        name: "Best Value",
        thaiName: "รายปี",
        price: "699",
        originalPrice: "1,188",
        period: "12 เดือน",
        pricePerDay: "1.9",
        discount: "41%",
        color: "#e65100",
        emoji: "🔥",
        tag: "คุ้มสุด!",
        features: [
          { icon: "✅", text: "WiT ตอบคำถามไม่จำกัด." },
          { icon: "✅", text: "วิเคราะห์ภาพไม่จำกัด" },
          { icon: "✅", text: "เครื่องมือคำนวณทั้งหมด" },
          { icon: "✅", text: "ถามปัญหาเทคนิคได้ตลอด" },
          { icon: "⚡", text: "Priority Support ตอบเร็ว" },
          { icon: "🎁", text: "ฟรี! คู่มือ + Video Course" },
          { icon: "🏆", text: "Early Access ฟีเจอร์ใหม่" },
        ],
        limitations: [
          { icon: "ℹ️", text: "1 บัญชี / 1 ผู้ใช้" },
        ],
        selectAction: "เลือกรายปี",
      },
      team: {
        name: "Team Pack",
        thaiName: "ทีมรายปี",
        price: "2,490",
        period: "12 เดือน",
        pricePerUser: "41",
        users: "5 คน",
        color: "#2e7d32",
        emoji: "🏢",
        tag: "องค์กร",
        features: [
          { icon: "✅", text: "WiT ตอบคำถามไม่จำกัด 5 คน" },
          { icon: "✅", text: "วิเคราะห์ภาพไม่จำกัดทุกคน" },
          { icon: "✅", text: "เครื่องมือคำนวณทั้งหมด" },
          { icon: "🔑", text: "Group Code ดึงทีมเข้าง่าย" },
          { icon: "📊", text: "Dashboard ดูสถิติทีม" },
          { icon: "⚡", text: "VIP Support" },
          { icon: "🎁", text: "ฟรี! คู่มือ + Video + Consulting" },
        ],
        limitations: [
          { icon: "💡", text: "เพิ่มสมาชิกได้ 199฿/คน/ปี" },
        ],
        selectAction: "เลือกทีมรายปี",
      },
    };

    // If showing all packages, return carousel
    if (packageType === "all") {
      return createAllPackagesCarousel(packages);
    }

    // Get selected package
    const pkg = packages[packageType];
    if (!pkg) {
      return createAllPackagesCarousel(packages);
    }

    // Build price per day row contents
    const pricePerDayContents = [];
    if (pkg.pricePerDay) {
      pricePerDayContents.push({ type: "text", text: `≈ ${pkg.pricePerDay} บาท/วัน`, size: "xs", color: "#ffffffaa" });
    } else if (pkg.pricePerUser) {
      pricePerDayContents.push({ type: "text", text: `ตกคนละ ${pkg.pricePerUser} บาท/เดือน`, size: "xs", color: "#ffffffaa" });
    }

    if (pkg.discount) {
      pricePerDayContents.push({
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: `ประหยัด ${pkg.discount}`, size: "xxs", color: "#ffffff", align: "center" },
        ],
        backgroundColor: "#ff6b6b",
        cornerRadius: "10px",
        paddingAll: "3px",
        paddingStart: "8px",
        paddingEnd: "8px",
        margin: "md",
      });
    }

    // Create single package detail bubble
    return {
      type: "flex",
      altText: `💎 แพ็คเกจ ${pkg.thaiName} - ${pkg.price}฿ | WiT AI Premium`,
      contents: {
        type: "bubble",
        size: "mega",
        header: {
          type: "box",
          layout: "vertical",
          contents: [
            // Tag badge
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    { type: "text", text: pkg.tag, size: "xxs", color: "#ffffff", weight: "bold", align: "center" },
                  ],
                  backgroundColor: pkg.color,
                  cornerRadius: "12px",
                  paddingAll: "4px",
                  paddingStart: "10px",
                  paddingEnd: "10px",
                },
                { type: "spacer", size: "xl" },
              ],
            },
            // Package name
            {
              type: "box",
              layout: "horizontal",
              margin: "lg",
              contents: [
                { type: "text", text: pkg.emoji, size: "xxl", flex: 0 },
                {
                  type: "box",
                  layout: "vertical",
                  margin: "lg",
                  contents: [
                    { type: "text", text: pkg.thaiName, weight: "bold", size: "xl", color: "#ffffff" },
                    { type: "text", text: pkg.name.toUpperCase(), size: "xs", color: "#ffffffaa" },
                  ],
                },
              ],
            },
            // Price
            {
              type: "box",
              layout: "horizontal",
              margin: "lg",
              contents: [
                { type: "text", text: "฿", size: "lg", color: "#ffffff", flex: 0 },
                { type: "text", text: pkg.price, size: "xxl", weight: "bold", color: "#ffffff", flex: 0 },
                { type: "text", text: ` /${pkg.period}`, size: "sm", color: "#ffffffcc", margin: "sm" },
              ],
            },
            // Price per day (only if has contents)
            ...(pricePerDayContents.length > 0 ? [{
              type: "box",
              layout: "horizontal",
              contents: pricePerDayContents,
            }] : []),
          ],
          backgroundColor: pkg.color,
          paddingAll: "20px",
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            { type: "text", text: "✨ สิ่งที่คุณจะได้รับ", weight: "bold", size: "md", color: "#1a1a1a" },
            {
              type: "box",
              layout: "vertical",
              margin: "md",
              spacing: "sm",
              contents: pkg.features.map((f) => ({
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: f.icon, size: "sm", flex: 0 },
                  { type: "text", text: f.text, size: "sm", color: "#333333", margin: "md", flex: 1, wrap: true },
                ],
              })),
            },
            { type: "separator", margin: "lg" },
            {
              type: "box",
              layout: "vertical",
              margin: "md",
              contents: pkg.limitations.map((l) => ({
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: l.icon, size: "xs", flex: 0 },
                  { type: "text", text: l.text, size: "xs", color: "#888888", margin: "md", flex: 1 },
                ],
              })),
            },
          ],
          paddingAll: "20px",
        },
        footer: {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [
            {
              type: "button",
              style: "primary",
              color: pkg.color,
              action: { type: "message", label: `✅ สมัคร ${pkg.thaiName} ${pkg.price}฿`, text: pkg.selectAction },
              height: "md",
            },
            {
              type: "button",
              style: "secondary",
              action: { type: "message", label: "🔙 ดูแพ็คเกจทั้งหมด", text: "ดูแพ็คเกจทั้งหมด" },
              height: "sm",
            },
          ],
          paddingAll: "15px",
        },
      },
    };
  } catch (error) {
    console.error("Error creating package detail message:", error);
    return null;
  }
};

/**
 * 📦 CREATE ALL PACKAGES CAROUSEL
 * แสดงแพ็คเกจทั้งหมดในรูปแบบ Carousel ให้คลิกดูรายละเอียด
 */
const createAllPackagesCarousel = (packages) => {
  try {
    const bubbles = Object.entries(packages).map(([key, pkg]) => {
      // Build body contents - limit to 4 features
      const featureContents = pkg.features.slice(0, 4).map((f) => ({
        type: "box",
        layout: "horizontal",
        contents: [
          { type: "text", text: f.icon, size: "xs", flex: 0 },
          { type: "text", text: f.text, size: "xs", color: "#555555", margin: "sm", flex: 1, wrap: true },
        ],
        margin: "sm",
      }));

      // Add "more" text if there are more features
      if (pkg.features.length > 4) {
        featureContents.push({
          type: "text",
          text: `+${pkg.features.length - 4} รายการเพิ่มเติม...`,
          size: "xxs",
          color: "#999999",
          margin: "md",
          align: "center",
        });
      }

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
                { type: "text", text: pkg.emoji, size: "xl", flex: 0 },
                {
                  type: "box",
                  layout: "vertical",
                  margin: "md",
                  contents: [
                    { type: "text", text: pkg.thaiName, weight: "bold", size: "md", color: "#ffffff" },
                    { type: "text", text: pkg.tag, size: "xxs", color: "#ffffffaa" },
                  ],
                },
              ],
            },
            {
              type: "box",
              layout: "horizontal",
              margin: "lg",
              contents: [
                { type: "text", text: "฿" + pkg.price, size: "xxl", weight: "bold", color: "#ffffff", flex: 0 },
                { type: "text", text: ` /${pkg.period}`, size: "xs", color: "#ffffffcc", margin: "sm" },
              ],
            },
          ],
          backgroundColor: pkg.color,
          paddingAll: "15px",
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: featureContents,
          paddingAll: "12px",
        },
        footer: {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [
            {
              type: "button",
              style: "primary",
              color: pkg.color,
              action: { type: "message", label: "📋 ดูรายละเอียด", text: `ดูรายละเอียดแพ็คเกจ${pkg.thaiName}` },
              height: "sm",
            },
            {
              type: "button",
              style: "link",
              action: { type: "message", label: "สมัครเลย", text: pkg.selectAction },
              height: "sm",
            },
          ],
          paddingAll: "10px",
        },
      };
    });

    return {
      type: "flex",
      altText: "💎 เลือกแพ็คเกจที่เหมาะกับคุณ - 99฿/259฿/699฿/2,490฿",
      contents: {
        type: "carousel",
        contents: bubbles,
      },
    };
  } catch (error) {
    console.error("Error creating packages carousel:", error);
    return null;
  }
};

/**
 * 💎 CREATE QUOTA LIMIT FLEX MESSAGE (IMPROVED)
 * แสดงเมื่อผู้ใช้หมดโควต้าฟรี - ดีไซน์สวยงาม กระตุ้นการอัปเกรด
 * ปรับปรุง: เพิ่มปุ่มคลิกดูรายละเอียดแต่ละแพ็คเกจ
 */
const createQuotaLimitMessage = (usageCount = 15, hasUsedTrial = false) => {
  try {
    // สร้างปุ่มขอทดลองใช้ (แสดงเฉพาะผู้ที่ยังไม่เคยทดลอง)
    const trialButton = hasUsedTrial ? null : {
      type: "button",
      style: "primary",
      color: "#00b894",
      action: {
        type: "message",
        label: "🎁 ขอทดลองใช้ฟรี 3 วัน",
        text: "ขอทดลองใช้ฟรี 3 วัน",
      },
      height: "sm",
      margin: "sm",
    };

    // ปุ่มดูแพ็คเกจทั้งหมด
    const viewAllPackagesButton = {
      type: "button",
      style: "secondary",
      action: {
        type: "message",
        label: "📦 ดูแพ็คเกจทั้งหมด",
        text: "ดูแพ็คเกจทั้งหมด",
      },
      height: "sm",
      margin: "sm",
    };

    // รวมปุ่มที่ใช้ได้
    const footerButtons = [];
    if (trialButton) footerButtons.push(trialButton);
    footerButtons.push(viewAllPackagesButton);

    return {
      type: "flex",
      altText: "💎 หมดโควต้าฟรีวันนี้ - เลือกแพ็คเกจที่เหมาะกับคุณ 99฿/259฿/699฿/2,490฿",
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
                {
                  type: "text",
                  text: "💎",
                  size: "xxl",
                  flex: 0,
                },
                {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {
                      type: "text",
                      text: "หมดโควต้าฟรีวันนี้",
                      weight: "bold",
                      color: "#ffffff",
                      size: "lg",
                    },
                    {
                      type: "text",
                      text: `ใช้งานครบ ${usageCount}/15 ครั้งแล้ว`,
                      color: "#ffffffcc",
                      size: "xs",
                    },
                  ],
                  margin: "lg",
                },
              ],
            },
            // Progress bar
            {
              type: "box",
              layout: "vertical",
              margin: "lg",
              contents: [
                {
                  type: "box",
                  layout: "vertical",
                  contents: [],
                  height: "6px",
                  backgroundColor: "#ffffff",
                  cornerRadius: "3px",
                },
              ],
            },
          ],
          backgroundColor: "#7c4dff",
          paddingAll: "20px",
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "🚀 อัปเกรดเพื่อใช้งานต่อทันที!",
              weight: "bold",
              size: "md",
              color: "#1a1a1a",
            },
            {
              type: "text",
              text: "คลิกที่แพ็คเกจเพื่อดูรายละเอียดเพิ่มเติม",
              size: "xs",
              color: "#666666",
              margin: "sm",
              wrap: true,
            },
            {
              type: "separator",
              margin: "lg",
            },
            // Package Cards - Clickable
            {
              type: "box",
              layout: "vertical",
              margin: "lg",
              spacing: "sm",
              contents: [
                // Starter Package - 99฿
                {
                  type: "box",
                  layout: "horizontal",
                  backgroundColor: "#f8f4ff",
                  cornerRadius: "10px",
                  paddingAll: "12px",
                  contents: [
                    {
                      type: "box",
                      layout: "vertical",
                      flex: 1,
                      contents: [
                        {
                          type: "box",
                          layout: "horizontal",
                          contents: [
                            { type: "text", text: "👤", size: "md", flex: 0 },
                            { type: "text", text: "รายเดือน", weight: "bold", size: "sm", color: "#7c4dff", margin: "sm" },
                          ],
                        },
                        { type: "text", text: "AI ไม่จำกัด + วิเคราะห์ภาพ 30 รูป/วัน", size: "xxs", color: "#888888", margin: "xs", wrap: true },
                      ],
                    },
                    {
                      type: "box",
                      layout: "vertical",
                      contents: [
                        { type: "text", text: "99฿", weight: "bold", size: "lg", color: "#7c4dff", align: "end" },
                        { type: "text", text: "ดูรายละเอียด →", size: "xxs", color: "#7c4dff", align: "end" },
                      ],
                      justifyContent: "center",
                    },
                  ],
                  action: {
                    type: "message",
                    text: "ดูรายละเอียดแพ็คเกจรายเดือน",
                  },
                },
                // Popular Package - 259฿
                {
                  type: "box",
                  layout: "horizontal",
                  backgroundColor: "#e3f2fd",
                  cornerRadius: "10px",
                  paddingAll: "12px",
                  contents: [
                    {
                      type: "box",
                      layout: "vertical",
                      flex: 1,
                      contents: [
                        {
                          type: "box",
                          layout: "horizontal",
                          contents: [
                            { type: "text", text: "⭐", size: "md", flex: 0 },
                            { type: "text", text: "3 เดือน", weight: "bold", size: "sm", color: "#1e88e5", margin: "sm" },
                            {
                              type: "box",
                              layout: "vertical",
                              backgroundColor: "#1e88e5",
                              cornerRadius: "8px",
                              paddingAll: "2px",
                              paddingStart: "6px",
                              paddingEnd: "6px",
                              margin: "sm",
                              contents: [
                                { type: "text", text: "ยอดนิยม", size: "xxs", color: "#ffffff" },
                              ],
                            },
                          ],
                        },
                        { type: "text", text: "AI ไม่จำกัด + ภาพ 50 รูป/วัน + คู่มือฟรี", size: "xxs", color: "#888888", margin: "xs", wrap: true },
                      ],
                    },
                    {
                      type: "box",
                      layout: "vertical",
                      contents: [
                        { type: "text", text: "259฿", weight: "bold", size: "lg", color: "#1e88e5", align: "end" },
                        { type: "text", text: "ดูรายละเอียด →", size: "xxs", color: "#1e88e5", align: "end" },
                      ],
                      justifyContent: "center",
                    },
                  ],
                  action: {
                    type: "message",
                    text: "ดูรายละเอียดแพ็คเกจ3เดือน",
                  },
                },
                // Best Value - 699฿
                {
                  type: "box",
                  layout: "horizontal",
                  backgroundColor: "#fff3e0",
                  cornerRadius: "10px",
                  paddingAll: "12px",
                  borderWidth: "2px",
                  borderColor: "#ff6d00",
                  contents: [
                    {
                      type: "box",
                      layout: "vertical",
                      flex: 1,
                      contents: [
                        {
                          type: "box",
                          layout: "horizontal",
                          contents: [
                            { type: "text", text: "🔥", size: "md", flex: 0 },
                            { type: "text", text: "รายปี", weight: "bold", size: "sm", color: "#e65100", margin: "sm" },
                            {
                              type: "box",
                              layout: "vertical",
                              backgroundColor: "#ff6d00",
                              cornerRadius: "8px",
                              paddingAll: "2px",
                              paddingStart: "6px",
                              paddingEnd: "6px",
                              margin: "sm",
                              contents: [
                                { type: "text", text: "คุ้มสุด!", size: "xxs", color: "#ffffff" },
                              ],
                            },
                          ],
                        },
                        { type: "text", text: "ทุกอย่างไม่จำกัด + Priority Support + Video", size: "xxs", color: "#888888", margin: "xs", wrap: true },
                      ],
                    },
                    {
                      type: "box",
                      layout: "vertical",
                      contents: [
                        { type: "text", text: "699฿", weight: "bold", size: "lg", color: "#e65100", align: "end" },
                        { type: "text", text: "≈ 1.9฿/วัน", size: "xxs", color: "#f57c00", align: "end" },
                      ],
                      justifyContent: "center",
                    },
                  ],
                  action: {
                    type: "message",
                    text: "ดูรายละเอียดแพ็คเกจรายปี",
                  },
                },
                // Team Package - 2,490฿
                {
                  type: "box",
                  layout: "horizontal",
                  backgroundColor: "#e8f5e9",
                  cornerRadius: "10px",
                  paddingAll: "12px",
                  contents: [
                    {
                      type: "box",
                      layout: "vertical",
                      flex: 1,
                      contents: [
                        {
                          type: "box",
                          layout: "horizontal",
                          contents: [
                            { type: "text", text: "🏢", size: "md", flex: 0 },
                            { type: "text", text: "ทีมรายปี", weight: "bold", size: "sm", color: "#2e7d32", margin: "sm" },
                            {
                              type: "box",
                              layout: "vertical",
                              backgroundColor: "#2e7d32",
                              cornerRadius: "8px",
                              paddingAll: "2px",
                              paddingStart: "6px",
                              paddingEnd: "6px",
                              margin: "sm",
                              contents: [
                                { type: "text", text: "5 คน", size: "xxs", color: "#ffffff" },
                              ],
                            },
                          ],
                        },
                        { type: "text", text: "ใช้ได้ทั้งทีม + Group Code + VIP Support", size: "xxs", color: "#888888", margin: "xs", wrap: true },
                      ],
                    },
                    {
                      type: "box",
                      layout: "vertical",
                      contents: [
                        { type: "text", text: "2,490฿", weight: "bold", size: "md", color: "#2e7d32", align: "end" },
                        { type: "text", text: "41฿/คน/เดือน", size: "xxs", color: "#388e3c", align: "end" },
                      ],
                      justifyContent: "center",
                    },
                  ],
                  action: {
                    type: "message",
                    text: "ดูรายละเอียดแพ็คเกจทีมรายปี",
                  },
                },
              ],
            },
            // Group Code section
            {
              type: "box",
              layout: "horizontal",
              margin: "lg",
              backgroundColor: "#ede7f6",
              cornerRadius: "8px",
              paddingAll: "10px",
              contents: [
                { type: "text", text: "🔑", size: "md", flex: 0 },
                {
                  type: "box",
                  layout: "vertical",
                  margin: "md",
                  flex: 1,
                  contents: [
                    { type: "text", text: "มีรหัสกลุ่มแล้ว?", weight: "bold", size: "xs", color: "#5e35b1" },
                    { type: "text", text: "กดเพื่อใส่รหัสเข้าร่วมทีม", size: "xxs", color: "#7e57c2" },
                  ],
                },
              ],
              action: {
                type: "message",
                text: "ใส่รหัสกลุ่ม",
              },
            },
          ],
          paddingAll: "20px",
        },
        footer: {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: footerButtons,
          paddingAll: "12px",
        },
      },
    };
  } catch (error) {
    console.error("Error creating quota limit message:", error);
    return null;
  }
};

/**
 * 👋 CREATE WELCOME FLEX MESSAGE
 * แสดงเมื่อผู้ใช้ใหม่ Follow Bot - ดีไซน์สวยงาม แนะนำฟีเจอร์
 */
/**
 * 🎨 CREATE WELCOME MESSAGE - MODERN DASHBOARD STYLE v2.5
 * ออกแบบในสไตล์ Modern Dashboard ดูเป็นมืออาชีพ
 * รวมบริการทั้ง ฉีดพลาสติก, เกษตร และ บัญชีฟาร์ม/ร้านค้า ไว้ในหน้าเดียว
 *
 * NOTE: หากต้องการใส่ Logo ให้ upload รูปไป Firebase Storage หรือ CDN
 * แล้วใส่ URL ใน heroImageUrl (LINE รองรับเฉพาะ HTTPS URL เท่านั้น)
 * Local path: D:\Flutterapp\caculateapp\assets\icons\logo.png
 */

// ==========================================
// 🎨 WELCOME MESSAGE - High-Fidelity UI Design
// Modern Glassmorphism with Carousel Layout
// ==========================================
const createWelcomeMessage = (displayName = "User") => {
  try {
    // Sanitize display name for LINE API
    const safeName = displayName.replace(/[^\u0000-\u007F\u0E00-\u0E7F]/g, "").substring(0, 20) || "User";
    const userName = `คุณ${safeName}`;

    return {
      type: "flex",
      altText: `ยินดีต้อนรับ ${userName} สู่ระบบจัดการอัจฉริยะ`,
      contents: {
        type: "carousel",
        contents: [
          // ==========================================
          // 🎯 BUBBLE 1: Main Welcome Card
          // Premium Immersive Header with Dual Buttons
          // ==========================================
          {
            type: "bubble",
            size: "mega",
            header: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "image",
                  url: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=1200&h=800&fit=crop&q=80",
                  size: "full",
                  aspectMode: "cover",
                  aspectRatio: "20:13",
                  gravity: "center",
                },
                {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {
                      type: "box",
                      layout: "vertical",
                      contents: [
                        {
                          type: "text",
                          text: "✨",
                          size: "xxl",
                          align: "center",
                        },
                        {
                          type: "text",
                          text: "ยินดีต้อนรับ",
                          size: "xl",
                          weight: "bold",
                          color: "#ffffff",
                          align: "center",
                          margin: "md",
                        },
                        {
                          type: "text",
                          text: userName,
                          size: "lg",
                          color: "#ffffffcc",
                          align: "center",
                          margin: "sm",
                        },
                      ],
                      backgroundColor: "#00000080",
                      cornerRadius: "16px",
                      paddingAll: "24px",
                      margin: "none",
                    },
                  ],
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  justifyContent: "center",
                  alignItems: "center",
                },
              ],
              paddingAll: "0px",
              position: "relative",
            },
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: "🎯 Wit365 - วิศวกรรมพลาสติก",
                  size: "md",
                  weight: "bold",
                  color: "#1a1a1a",
                  margin: "none",
                },
                {
                  type: "text",
                  text: "ระบบผู้ช่วยอัจฉริยะแบบครบวงจร",
                  size: "xs",
                  color: "#666666",
                  margin: "sm",
                  wrap: true,
                },
                {
                  type: "separator",
                  margin: "lg",
                },
                // Primary Action Buttons (Factory & Farm)
                {
                  type: "box",
                  layout: "vertical",
                  margin: "lg",
                  spacing: "md",
                  contents: [
                    // Factory Button (Deep Blue)
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        {
                          type: "box",
                          layout: "vertical",
                          contents: [
                            {
                              type: "text",
                              text: "🏭",
                              size: "xxl",
                              align: "center",
                            },
                          ],
                          backgroundColor: "#1565c0",
                          cornerRadius: "12px",
                          width: "56px",
                          height: "56px",
                          justifyContent: "center",
                          flex: 0,
                        },
                        {
                          type: "box",
                          layout: "vertical",
                          contents: [
                            {
                              type: "text",
                              text: "ผู้ช่วยจัดการการผลิต",
                              weight: "bold",
                              size: "md",
                              color: "#ffffff",
                            },
                            {
                              type: "text",
                              text: "เทคนิคการผลิต • จัดการผลิต • ควบคุมต้นทุน • รายงาน",
                              size: "xs",
                              color: "#ffffffcc",
                              wrap: true,
                              margin: "xs",
                            },
                          ],
                          margin: "md",
                          flex: 1,
                          justifyContent: "center",
                        },
                      ],
                      backgroundColor: "#1976d2",
                      cornerRadius: "16px",
                      paddingAll: "16px",
                      action: {
                        type: "message",
                        text: "ปรึกษาปัญหาฉีดพลาสติกครับ",
                      },
                    },
                    // Smart Farm Button (Green)
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        {
                          type: "box",
                          layout: "vertical",
                          contents: [
                            {
                              type: "text",
                              text: "🌱",
                              size: "xxl",
                              align: "center",
                            },
                          ],
                          backgroundColor: "#2e7d32",
                          cornerRadius: "12px",
                          width: "56px",
                          height: "56px",
                          justifyContent: "center",
                          flex: 0,
                        },
                        {
                          type: "box",
                          layout: "vertical",
                          contents: [
                            {
                              type: "text",
                              text: "ระบบฟาร์มอัจฉริยะ",
                              weight: "bold",
                              size: "md",
                              color: "#ffffff",
                            },
                            {
                              type: "text",
                              text: "บันทึกผลผลิต • วิเคราะห์ปุ๋ย • ติดตาม",
                              size: "xs",
                              color: "#ffffffcc",
                              wrap: true,
                              margin: "xs",
                            },
                          ],
                          margin: "md",
                          flex: 1,
                          justifyContent: "center",
                        },
                      ],
                      backgroundColor: "#388e3c",
                      cornerRadius: "16px",
                      paddingAll: "16px",
                      action: {
                        type: "message",
                        text: "ปรึกษาเรื่องเกษตรครับ",
                      },
                    },
                  ],
                },
                {
                  type: "separator",
                  margin: "lg",
                },
                // Secondary Action Buttons (Education, Accounting & Help)
                {
                  type: "box",
                  layout: "horizontal",
                  margin: "lg",
                  spacing: "sm",
                  contents: [
                    {
                      type: "box",
                      layout: "vertical",
                      contents: [
                        {
                          type: "text",
                          text: "📚",
                          size: "xl",
                          align: "center",
                        },
                        {
                          type: "text",
                          text: "Education",
                          size: "xs",
                          color: "#ffffff",
                          align: "center",
                          margin: "sm",
                          weight: "bold",
                        },
                      ],
                      backgroundColor: "#9c27b0",
                      cornerRadius: "12px",
                      paddingAll: "12px",
                      flex: 1,
                      action: {
                        type: "message",
                        text: "/edu",
                      },
                    },
                    {
                      type: "box",
                      layout: "vertical",
                      contents: [
                        {
                          type: "text",
                          text: "📊",
                          size: "xl",
                          align: "center",
                        },
                        {
                          type: "text",
                          text: "บัญชี",
                          size: "xs",
                          color: "#ffffff",
                          align: "center",
                          margin: "sm",
                          weight: "bold",
                        },
                      ],
                      backgroundColor: "#607d8b",
                      cornerRadius: "12px",
                      paddingAll: "12px",
                      flex: 1,
                      action: {
                        type: "message",
                        text: "/acc",
                      },
                    },
                    {
                      type: "box",
                      layout: "vertical",
                      contents: [
                        {
                          type: "text",
                          text: "❓",
                          size: "xl",
                          align: "center",
                        },
                        {
                          type: "text",
                          text: "ช่วยเหลือ",
                          size: "xs",
                          color: "#ffffff",
                          align: "center",
                          margin: "sm",
                          weight: "bold",
                        },
                      ],
                      backgroundColor: "#757575",
                      cornerRadius: "12px",
                      paddingAll: "12px",
                      flex: 1,
                      action: {
                        type: "message",
                        text: "/help",
                      },
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
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    {
                      type: "box",
                      layout: "vertical",
                      contents: [
                        {
                          type: "text",
                          text: "👑",
                          size: "lg",
                        },
                      ],
                      flex: 0,
                      margin: "none",
                    },
                    {
                      type: "box",
                      layout: "vertical",
                      contents: [
                        {
                          type: "text",
                          text: "อัพเกรด Premium",
                          weight: "bold",
                          size: "sm",
                          color: "#ffffff",
                        },
                        {
                          type: "text",
                          text: "ปลดล็อคฟีเจอร์พิเศษทั้งหมด",
                          size: "xs",
                          color: "#ffffffcc",
                          margin: "xs",
                        },
                      ],
                      margin: "md",
                      flex: 1,
                    },
                  ],
                  backgroundColor: "#FFD700",
                  cornerRadius: "12px",
                  paddingAll: "16px",
                  action: {
                    type: "message",
                    text: "👑 อัพเกรด Premium",
                  },
                },
              ],
              paddingAll: "16px",
              backgroundColor: "#fafafa",
            },
          },
          // ==========================================
          // 🏭 BUBBLE 2: Factory System Details
          // ==========================================
          {
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
                      text: "🏭",
                      size: "xl",
                      flex: 0,
                    },
                    {
                      type: "box",
                      layout: "vertical",
                      contents: [
                        {
                          type: "text",
                          text: "ระบบจัดการโรงงาน",
                          weight: "bold",
                          size: "lg",
                          color: "#ffffff",
                        },
                        {
                          type: "text",
                          text: "SMART FACTORY MANAGEMENT",
                          size: "xs",
                          color: "#ffffffcc",
                        },
                      ],
                      margin: "md",
                    },
                  ],
                },
              ],
              backgroundColor: "#1976d2",
              paddingAll: "20px",
            },
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: "✨ ฟีเจอร์หลัก",
                  weight: "bold",
                  size: "md",
                  color: "#1a1a1a",
                },
                {
                  type: "box",
                  layout: "vertical",
                  margin: "lg",
                  spacing: "md",
                  contents: [
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        {
                          type: "box",
                          layout: "vertical",
                          contents: [
                            {
                              type: "text",
                              text: "📦",
                              size: "lg",
                            },
                          ],
                          backgroundColor: "#e3f2fd",
                          cornerRadius: "8px",
                          width: "40px",
                          height: "40px",
                          justifyContent: "center",
                          alignItems: "center",
                          flex: 0,
                        },
                        {
                          type: "box",
                          layout: "vertical",
                          contents: [
                            {
                              type: "text",
                              text: "บันทึกการผลิต",
                              weight: "bold",
                              size: "sm",
                              color: "#333333",
                            },
                            {
                              type: "text",
                              text: "ติดตามปริมาณผลผลิตแบบเรียลไทม์",
                              size: "xs",
                              color: "#666666",
                              wrap: true,
                            },
                          ],
                          margin: "md",
                          flex: 1,
                        },
                      ],
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        {
                          type: "box",
                          layout: "vertical",
                          contents: [
                            {
                              type: "text",
                              text: "💰",
                              size: "lg",
                            },
                          ],
                          backgroundColor: "#e3f2fd",
                          cornerRadius: "8px",
                          width: "40px",
                          height: "40px",
                          justifyContent: "center",
                          alignItems: "center",
                          flex: 0,
                        },
                        {
                          type: "box",
                          layout: "vertical",
                          contents: [
                            {
                              type: "text",
                              text: "คำนวณต้นทุน",
                              weight: "bold",
                              size: "sm",
                              color: "#333333",
                            },
                            {
                              type: "text",
                              text: "วิเคราะห์ต้นทุนการผลิตอัตโนมัติ",
                              size: "xs",
                              color: "#666666",
                              wrap: true,
                            },
                          ],
                          margin: "md",
                          flex: 1,
                        },
                      ],
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        {
                          type: "box",
                          layout: "vertical",
                          contents: [
                            {
                              type: "text",
                              text: "📈",
                              size: "lg",
                            },
                          ],
                          backgroundColor: "#e3f2fd",
                          cornerRadius: "8px",
                          width: "40px",
                          height: "40px",
                          justifyContent: "center",
                          alignItems: "center",
                          flex: 0,
                        },
                        {
                          type: "box",
                          layout: "vertical",
                          contents: [
                            {
                              type: "text",
                              text: "รายงานสรุป",
                              weight: "bold",
                              size: "sm",
                              color: "#333333",
                            },
                            {
                              type: "text",
                              text: "ดูสถิติและแนวโน้มการผลิต",
                              size: "xs",
                              color: "#666666",
                              wrap: true,
                            },
                          ],
                          margin: "md",
                          flex: 1,
                        },
                      ],
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
                  backgroundColor: "#e3f2fd",
                  cornerRadius: "12px",
                  paddingAll: "12px",
                  contents: [
                    {
                      type: "text",
                      text: "💡 เหมาะสำหรับ",
                      weight: "bold",
                      size: "xs",
                      color: "#1976d2",
                    },
                    {
                      type: "text",
                      text: "• โรงงานผลิตภัณฑ์อาหาร\n• โรงงานสินค้าอุปโภคบริโภค\n• โรงงานแปรรูปเกษตร",
                      size: "xs",
                      color: "#555555",
                      wrap: true,
                      margin: "sm",
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
                  style: "primary",
                  color: "#1976d2",
                  action: {
                    type: "message",
                    label: "🚀 ปรึกษาเรื่องพลาสติก",
                    text: "ปรึกษาปัญหาฉีดพลาสติกครับ",
                  },
                },
              ],
              paddingAll: "16px",
            },
          },
          // ==========================================
          // 🌱 BUBBLE 3: Smart Farm System Details
          // ==========================================
          {
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
                      text: "🌱",
                      size: "xl",
                      flex: 0,
                    },
                    {
                      type: "box",
                      layout: "vertical",
                      contents: [
                        {
                          type: "text",
                          text: "ระบบฟาร์มอัจฉริยะ",
                          weight: "bold",
                          size: "lg",
                          color: "#ffffff",
                        },
                        {
                          type: "text",
                          text: "SMART FARM MANAGEMENT",
                          size: "xs",
                          color: "#ffffffcc",
                        },
                      ],
                      margin: "md",
                    },
                  ],
                },
              ],
              backgroundColor: "#388e3c",
              paddingAll: "20px",
            },
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: "✨ ฟีเจอร์หลัก",
                  weight: "bold",
                  size: "md",
                  color: "#1a1a1a",
                },
                {
                  type: "box",
                  layout: "vertical",
                  margin: "lg",
                  spacing: "md",
                  contents: [
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        {
                          type: "box",
                          layout: "vertical",
                          contents: [
                            {
                              type: "text",
                              text: "🌾",
                              size: "lg",
                            },
                          ],
                          backgroundColor: "#e8f5e9",
                          cornerRadius: "8px",
                          width: "40px",
                          height: "40px",
                          justifyContent: "center",
                          alignItems: "center",
                          flex: 0,
                        },
                        {
                          type: "box",
                          layout: "vertical",
                          contents: [
                            {
                              type: "text",
                              text: "บันทึกผลผลิต",
                              weight: "bold",
                              size: "sm",
                              color: "#333333",
                            },
                            {
                              type: "text",
                              text: "จดบันทึกผลผลิตทุกครั้งที่เก็บเกี่ยว",
                              size: "xs",
                              color: "#666666",
                              wrap: true,
                            },
                          ],
                          margin: "md",
                          flex: 1,
                        },
                      ],
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        {
                          type: "box",
                          layout: "vertical",
                          contents: [
                            {
                              type: "text",
                              text: "🧪",
                              size: "lg",
                            },
                          ],
                          backgroundColor: "#e8f5e9",
                          cornerRadius: "8px",
                          width: "40px",
                          height: "40px",
                          justifyContent: "center",
                          alignItems: "center",
                          flex: 0,
                        },
                        {
                          type: "box",
                          layout: "vertical",
                          contents: [
                            {
                              type: "text",
                              text: "จัดการปุ๋ย-ยา",
                              weight: "bold",
                              size: "sm",
                              color: "#333333",
                            },
                            {
                              type: "text",
                              text: "ติดตามการใช้ปุ๋ยและสารเคมี",
                              size: "xs",
                              color: "#666666",
                              wrap: true,
                            },
                          ],
                          margin: "md",
                          flex: 1,
                        },
                      ],
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        {
                          type: "box",
                          layout: "vertical",
                          contents: [
                            {
                              type: "text",
                              text: "📊",
                              size: "lg",
                            },
                          ],
                          backgroundColor: "#e8f5e9",
                          cornerRadius: "8px",
                          width: "40px",
                          height: "40px",
                          justifyContent: "center",
                          alignItems: "center",
                          flex: 0,
                        },
                        {
                          type: "box",
                          layout: "vertical",
                          contents: [
                            {
                              type: "text",
                              text: "วิเคราะห์ผลผลิต",
                              weight: "bold",
                              size: "sm",
                              color: "#333333",
                            },
                            {
                              type: "text",
                              text: "เปรียบเทียบผลผลิตแต่ละฤดูกาล",
                              size: "xs",
                              color: "#666666",
                              wrap: true,
                            },
                          ],
                          margin: "md",
                          flex: 1,
                        },
                      ],
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
                  backgroundColor: "#e8f5e9",
                  cornerRadius: "12px",
                  paddingAll: "12px",
                  contents: [
                    {
                      type: "text",
                      text: "💡 เหมาะสำหรับ",
                      weight: "bold",
                      size: "xs",
                      color: "#388e3c",
                    },
                    {
                      type: "text",
                      text: "• สวนผลไม้ ไร่นา ไร่ข้าวโพด\n• ฟาร์มเกษตรอินทรีย์\n• ธุรกิจเกษตรครบวงจร",
                      size: "xs",
                      color: "#555555",
                      wrap: true,
                      margin: "sm",
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
                  style: "primary",
                  color: "#388e3c",
                  action: {
                    type: "message",
                    label: "🚀 ปรึกษาเรื่องเกษตร",
                    text: "ปรึกษาเรื่องเกษตรครับ",
                  },
                },
              ],
              paddingAll: "16px",
            },
          },
          // ==========================================
          // 👑 BUBBLE 4: Premium Features
          // ==========================================
          {
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
                      text: "👑",
                      size: "xl",
                      flex: 0,
                    },
                    {
                      type: "box",
                      layout: "vertical",
                      contents: [
                        {
                          type: "text",
                          text: "Premium Features",
                          weight: "bold",
                          size: "lg",
                          color: "#1a1a1a",
                        },
                        {
                          type: "text",
                          text: "ปลดล็อคความสามารถเต็มรูปแบบ",
                          size: "xs",
                          color: "#666666",
                        },
                      ],
                      margin: "md",
                    },
                  ],
                },
              ],
              backgroundColor: "#fff9c4",
              paddingAll: "20px",
            },
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: "✨ สิทธิพิเศษ Premium",
                  weight: "bold",
                  size: "md",
                  color: "#1a1a1a",
                },
                {
                  type: "box",
                  layout: "vertical",
                  margin: "lg",
                  spacing: "md",
                  contents: [
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        {
                          type: "text",
                          text: "✓",
                          size: "lg",
                          color: "#ffd700",
                          flex: 0,
                          weight: "bold",
                        },
                        {
                          type: "text",
                          text: "บันทึกข้อมูลไม่จำกัด",
                          size: "sm",
                          color: "#333333",
                          margin: "md",
                          flex: 1,
                        },
                      ],
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        {
                          type: "text",
                          text: "✓",
                          size: "lg",
                          color: "#ffd700",
                          flex: 0,
                          weight: "bold",
                        },
                        {
                          type: "text",
                          text: "รายงานแบบละเอียด + ส่งออก Excel",
                          size: "sm",
                          color: "#333333",
                          margin: "md",
                          flex: 1,
                          wrap: true,
                        },
                      ],
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        {
                          type: "text",
                          text: "✓",
                          size: "lg",
                          color: "#ffd700",
                          flex: 0,
                          weight: "bold",
                        },
                        {
                          type: "text",
                          text: "แจ้งเตือนอัตโนมัติผ่าน LINE",
                          size: "sm",
                          color: "#333333",
                          margin: "md",
                          flex: 1,
                          wrap: true,
                        },
                      ],
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        {
                          type: "text",
                          text: "✓",
                          size: "lg",
                          color: "#ffd700",
                          flex: 0,
                          weight: "bold",
                        },
                        {
                          type: "text",
                          text: "จัดการทีมงานหลายคน",
                          size: "sm",
                          color: "#333333",
                          margin: "md",
                          flex: 1,
                        },
                      ],
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        {
                          type: "text",
                          text: "✓",
                          size: "lg",
                          color: "#ffd700",
                          flex: 0,
                          weight: "bold",
                        },
                        {
                          type: "text",
                          text: "AI วิเคราะห์และพยากรณ์ผลผลิต",
                          size: "sm",
                          color: "#333333",
                          margin: "md",
                          flex: 1,
                          wrap: true,
                        },
                      ],
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        {
                          type: "text",
                          text: "✓",
                          size: "lg",
                          color: "#ffd700",
                          flex: 0,
                          weight: "bold",
                        },
                        {
                          type: "text",
                          text: "ฝ่ายสนับสนุนตอบกลับภายใน 1 ชม.",
                          size: "sm",
                          color: "#333333",
                          margin: "md",
                          flex: 1,
                          wrap: true,
                        },
                      ],
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
                  backgroundColor: "#fff9c4",
                  cornerRadius: "12px",
                  paddingAll: "16px",
                  contents: [
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        {
                          type: "text",
                          text: "💰",
                          size: "xl",
                          flex: 0,
                        },
                        {
                          type: "box",
                          layout: "vertical",
                          contents: [
                            {
                              type: "text",
                              text: "เริ่มต้นเพียง 99 บาท/เดือน",
                              weight: "bold",
                              size: "md",
                              color: "#d4af37",
                            },
                            {
                              type: "text",
                              text: "ทดลองใช้ฟรี 7 วัน ไม่ต้องใช้บัตรเครดิต",
                              size: "xs",
                              color: "#666666",
                              wrap: true,
                              margin: "xs",
                            },
                          ],
                          margin: "md",
                          flex: 1,
                        },
                      ],
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
                  style: "primary",
                  color: "#ffd700",
                  action: {
                    type: "message",
                    label: "🎁 ทดลองใช้ฟรี 7 วัน",
                    text: "👑 อัพเกรด Premium",
                  },
                },
                {
                  type: "box",
                  layout: "horizontal",
                  margin: "md",
                  justifyContent: "center",
                  contents: [
                    {
                      type: "text",
                      text: "🔒 ชำระเงินปลอดภัย • ยกเลิกได้ทุกเมื่อ",
                      size: "xxs",
                      color: "#999999",
                      align: "center",
                    },
                  ],
                },
              ],
              paddingAll: "16px",
            },
          },
          // ==========================================
          // ❓ BUBBLE 5: Help & Support
          // ==========================================
          {
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
                      text: "❓",
                      size: "xl",
                      flex: 0,
                    },
                    {
                      type: "box",
                      layout: "vertical",
                      contents: [
                        {
                          type: "text",
                          text: "ศูนย์ช่วยเหลือ",
                          weight: "bold",
                          size: "lg",
                          color: "#ffffff",
                        },
                        {
                          type: "text",
                          text: "HELP CENTER",
                          size: "xs",
                          color: "#ffffffcc",
                        },
                      ],
                      margin: "md",
                    },
                  ],
                },
              ],
              backgroundColor: "#757575",
              paddingAll: "20px",
            },
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: "💬 ติดต่อเรา",
                  weight: "bold",
                  size: "md",
                  color: "#1a1a1a",
                },
                {
                  type: "box",
                  layout: "vertical",
                  margin: "lg",
                  spacing: "md",
                  contents: [
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        {
                          type: "box",
                          layout: "vertical",
                          contents: [
                            {
                              type: "text",
                              text: "📚",
                              size: "lg",
                            },
                          ],
                          backgroundColor: "#f5f5f5",
                          cornerRadius: "8px",
                          width: "40px",
                          height: "40px",
                          justifyContent: "center",
                          alignItems: "center",
                          flex: 0,
                        },
                        {
                          type: "box",
                          layout: "vertical",
                          contents: [
                            {
                              type: "text",
                              text: "คู่มือการใช้งาน",
                              weight: "bold",
                              size: "sm",
                              color: "#333333",
                            },
                            {
                              type: "text",
                              text: "เรียนรู้วิธีใช้งานทีละขั้นตอน",
                              size: "xs",
                              color: "#666666",
                              wrap: true,
                            },
                          ],
                          margin: "md",
                          flex: 1,
                        },
                      ],
                      action: {
                        type: "uri",
                        uri: "https://line.me/R/ti/p/@yourbotid",
                      },
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        {
                          type: "box",
                          layout: "vertical",
                          contents: [
                            {
                              type: "text",
                              text: "💬",
                              size: "lg",
                            },
                          ],
                          backgroundColor: "#f5f5f5",
                          cornerRadius: "8px",
                          width: "40px",
                          height: "40px",
                          justifyContent: "center",
                          alignItems: "center",
                          flex: 0,
                        },
                        {
                          type: "box",
                          layout: "vertical",
                          contents: [
                            {
                              type: "text",
                              text: "แชทกับทีมงาน",
                              weight: "bold",
                              size: "sm",
                              color: "#333333",
                            },
                            {
                              type: "text",
                              text: "ตอบคำถามภายใน 24 ชั่วโมง",
                              size: "xs",
                              color: "#666666",
                              wrap: true,
                            },
                          ],
                          margin: "md",
                          flex: 1,
                        },
                      ],
                      action: {
                        type: "message",
                        text: "💬 ติดต่อทีมงาน",
                      },
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        {
                          type: "box",
                          layout: "vertical",
                          contents: [
                            {
                              type: "text",
                              text: "🎥",
                              size: "lg",
                            },
                          ],
                          backgroundColor: "#f5f5f5",
                          cornerRadius: "8px",
                          width: "40px",
                          height: "40px",
                          justifyContent: "center",
                          alignItems: "center",
                          flex: 0,
                        },
                        {
                          type: "box",
                          layout: "vertical",
                          contents: [
                            {
                              type: "text",
                              text: "วิดีโอสอนการใช้งาน",
                              weight: "bold",
                              size: "sm",
                              color: "#333333",
                            },
                            {
                              type: "text",
                              text: "ดูตัวอย่างการใช้งานจริง",
                              size: "xs",
                              color: "#666666",
                              wrap: true,
                            },
                          ],
                          margin: "md",
                          flex: 1,
                        },
                      ],
                      action: {
                        type: "uri",
                        uri: "https://youtube.com/@yourchannel",
                      },
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
                  backgroundColor: "#f5f5f5",
                  cornerRadius: "12px",
                  paddingAll: "12px",
                  contents: [
                    {
                      type: "text",
                      text: "📍 เวลาทำการ",
                      weight: "bold",
                      size: "xs",
                      color: "#666666",
                    },
                    {
                      type: "text",
                      text: "จันทร์-ศุกร์ 8:00-17:00 น.\n(หยุดวันเสาร์-อาทิตย์ และวันหยุดนักขัตฤกษ์)",
                      size: "xs",
                      color: "#888888",
                      wrap: true,
                      margin: "sm",
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
                  type: "box",
                  layout: "horizontal",
                  spacing: "sm",
                  contents: [
                    {
                      type: "button",
                      style: "secondary",
                      action: {
                        type: "uri",
                        label: "Facebook",
                        uri: "https://facebook.com/yourpage",
                      },
                      flex: 1,
                    },
                    {
                      type: "button",
                      style: "secondary",
                      action: {
                        type: "uri",
                        label: "LINE OA",
                        uri: "https://line.me/R/ti/p/@yourbotid",
                      },
                      flex: 1,
                    },
                  ],
                },
                {
                  type: "box",
                  layout: "horizontal",
                  margin: "md",
                  justifyContent: "center",
                  contents: [
                    {
                      type: "box",
                      layout: "vertical",
                      contents: [
                        {
                          type: "image",
                          url: "https://raw.githubusercontent.com/wizxbiz/affiliatepro-docs/main/images/loog.png",
                          size: "full",
                          aspectMode: "cover",
                          aspectRatio: "1:1",
                        },
                      ],
                      width: "16px",
                      height: "16px",
                      cornerRadius: "8px",
                    },
                    {
                      type: "text",
                      text: "โดย อาจารย์ วิทยา",
                      size: "xxs",
                      color: "#aaaaaa",
                      margin: "sm",
                    },
                  ],
                },
              ],
              paddingAll: "16px",
              backgroundColor: "#fafafa",
            },
          },
        ],
      },
    };
  } catch (error) {
    console.error("Error creating welcome message:", error);
    return null;
  }
};

/**
 * 🏭 CREATE PLASTIC CONSULTATION MENU
 * เมนูปรึกษาปัญหาฉีดพลาสติก - Learning Hub
 */
const createPlasticConsultationMenu = () => {
  try {
    return {
      type: "flex",
      altText: "🏭 Wit365 - วิศวกรรมพลาสติก",
      contents: {
        type: "carousel",
        contents: [
          // BUBBLE 1: Main Menu
          {
            type: "bubble",
            size: "mega",
            header: {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "🏭", size: "xxl", flex: 0 },
                {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    { type: "text", text: "Wit365", weight: "bold", size: "lg", color: "#ffffff" },
                    { type: "text", text: "วิศวกรรมพลาสติก โดย อาจารย์ วิทยา", size: "xs", color: "#ffffffcc" },
                  ],
                  margin: "md",
                },
              ],
              backgroundColor: "#1565c0",
              paddingAll: "20px",
            },
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "text", text: "🎯 เลือกหัวข้อที่ต้องการ", weight: "bold", size: "md", color: "#1a1a1a" },
                {
                  type: "box",
                  layout: "vertical",
                  margin: "lg",
                  spacing: "md",
                  contents: [
                    // Row 1
                    {
                      type: "box",
                      layout: "horizontal",
                      spacing: "md",
                      contents: [
                        {
                          type: "box",
                          layout: "vertical",
                          contents: [
                            { type: "text", text: "🔍", size: "xxl", align: "center" },
                            { type: "text", text: "วินิจฉัย Defect", weight: "bold", size: "sm", align: "center", color: "#1565c0", margin: "sm" },
                            { type: "text", text: "9+ ปัญหา", size: "xxs", align: "center", color: "#888888" },
                          ],
                          backgroundColor: "#e3f2fd",
                          cornerRadius: "12px",
                          paddingAll: "12px",
                          flex: 1,
                          action: { type: "message", text: "/defect" },
                        },
                        {
                          type: "box",
                          layout: "vertical",
                          contents: [
                            { type: "text", text: "🧮", size: "xxl", align: "center" },
                            { type: "text", text: "เครื่องคำนวณ", weight: "bold", size: "sm", align: "center", color: "#2e7d32", margin: "sm" },
                            { type: "text", text: "10+ สูตร", size: "xxs", align: "center", color: "#888888" },
                          ],
                          backgroundColor: "#e8f5e9",
                          cornerRadius: "12px",
                          paddingAll: "12px",
                          flex: 1,
                          action: { type: "message", text: "/calc" },
                        },
                      ],
                    },
                    // Row 2
                    {
                      type: "box",
                      layout: "horizontal",
                      spacing: "md",
                      contents: [
                        {
                          type: "box",
                          layout: "vertical",
                          contents: [
                            { type: "text", text: "🌡️", size: "xxl", align: "center" },
                            { type: "text", text: "ตารางอุณหภูมิ", weight: "bold", size: "sm", align: "center", color: "#d84315", margin: "sm" },
                            { type: "text", text: "50+ วัสดุ", size: "xxs", align: "center", color: "#888888" },
                          ],
                          backgroundColor: "#fbe9e7",
                          cornerRadius: "12px",
                          paddingAll: "12px",
                          flex: 1,
                          action: { type: "message", text: "/temp" },
                        },
                        {
                          type: "box",
                          layout: "vertical",
                          contents: [
                            { type: "text", text: "🧪", size: "xxl", align: "center" },
                            { type: "text", text: "คู่มือวัสดุ", weight: "bold", size: "sm", align: "center", color: "#7b1fa2", margin: "sm" },
                            { type: "text", text: "PP PE ABS...", size: "xxs", align: "center", color: "#888888" },
                          ],
                          backgroundColor: "#f3e5f5",
                          cornerRadius: "12px",
                          paddingAll: "12px",
                          flex: 1,
                          action: { type: "message", text: "/material" },
                        },
                      ],
                    },
                    // Row 3
                    {
                      type: "box",
                      layout: "horizontal",
                      spacing: "md",
                      contents: [
                        {
                          type: "box",
                          layout: "vertical",
                          contents: [
                            { type: "text", text: "👥", size: "xxl", align: "center" },
                            { type: "text", text: "ทีมงาน", weight: "bold", size: "sm", align: "center", color: "#00838f", margin: "sm" },
                            { type: "text", text: "จัดการทีม", size: "xxs", align: "center", color: "#888888" },
                          ],
                          backgroundColor: "#e0f7fa",
                          cornerRadius: "12px",
                          paddingAll: "12px",
                          flex: 1,
                          action: { type: "message", text: "/team" },
                        },
                        {
                          type: "box",
                          layout: "vertical",
                          contents: [
                            { type: "text", text: "🤖", size: "xxl", align: "center" },
                            { type: "text", text: "ถาม Wit365", weight: "bold", size: "sm", align: "center", color: "#f57c00", margin: "sm" },
                            { type: "text", text: "พิมพ์คำถาม", size: "xxs", align: "center", color: "#888888" },
                          ],
                          backgroundColor: "#fff3e0",
                          cornerRadius: "12px",
                          paddingAll: "12px",
                          flex: 1,
                          action: { type: "message", text: "Short shot แก้ยังไงครับ" },
                        },
                      ],
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
                { type: "text", text: "💡 พิมพ์คำถามภาษาไทยได้เลย WiT เข้าใจครับ!", size: "xs", color: "#888888", align: "center", wrap: true },
              ],
              paddingAll: "12px",
              backgroundColor: "#f5f5f5",
            },
          },
          // BUBBLE 2: Defect Guide
          {
            type: "bubble",
            size: "mega",
            header: {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "🔍", size: "xl", flex: 0 },
                {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    { type: "text", text: "คู่มือวินิจฉัย Defect", weight: "bold", size: "lg", color: "#ffffff" },
                    { type: "text", text: "DEFECT DIAGNOSIS", size: "xs", color: "#ffffffcc" },
                  ],
                  margin: "md",
                },
              ],
              backgroundColor: "#c62828",
              paddingAll: "20px",
            },
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "text", text: "⚠️ ปัญหาที่พบบ่อย", weight: "bold", size: "md", color: "#1a1a1a" },
                {
                  type: "box",
                  layout: "vertical",
                  margin: "lg",
                  spacing: "sm",
                  contents: [
                    { type: "box", layout: "horizontal", contents: [{ type: "text", text: "🔸", size: "sm", flex: 0 }, { type: "text", text: "Short Shot - ฉีดไม่เต็ม", size: "sm", color: "#333333", margin: "sm" }], action: { type: "message", text: "วินิจฉัย Short Shot" } },
                    { type: "box", layout: "horizontal", contents: [{ type: "text", text: "🔸", size: "sm", flex: 0 }, { type: "text", text: "Flash - เนื้อเกิน/ครีบ", size: "sm", color: "#333333", margin: "sm" }], action: { type: "message", text: "วินิจฉัย Flash" } },
                    { type: "box", layout: "horizontal", contents: [{ type: "text", text: "🔸", size: "sm", flex: 0 }, { type: "text", text: "Sink Mark - รอยยุบ", size: "sm", color: "#333333", margin: "sm" }], action: { type: "message", text: "วินิจฉัย Sink Mark" } },
                    { type: "box", layout: "horizontal", contents: [{ type: "text", text: "🔸", size: "sm", flex: 0 }, { type: "text", text: "Burn Mark - รอยไหม้", size: "sm", color: "#333333", margin: "sm" }], action: { type: "message", text: "วินิจฉัย Burn Mark" } },
                    { type: "box", layout: "horizontal", contents: [{ type: "text", text: "🔸", size: "sm", flex: 0 }, { type: "text", text: "Warp - บิดงอ", size: "sm", color: "#333333", margin: "sm" }], action: { type: "message", text: "วินิจฉัย Warpage" } },
                    { type: "box", layout: "horizontal", contents: [{ type: "text", text: "🔸", size: "sm", flex: 0 }, { type: "text", text: "Weld Line - รอยเชื่อม", size: "sm", color: "#333333", margin: "sm" }], action: { type: "message", text: "วินิจฉัย Weld Line" } },
                    { type: "box", layout: "horizontal", contents: [{ type: "text", text: "🔸", size: "sm", flex: 0 }, { type: "text", text: "Silver Streak - เส้นเงิน", size: "sm", color: "#333333", margin: "sm" }], action: { type: "message", text: "วินิจฉัย Silver Streak" } },
                    { type: "box", layout: "horizontal", contents: [{ type: "text", text: "🔸", size: "sm", flex: 0 }, { type: "text", text: "Jetting - รอยพุ่ง", size: "sm", color: "#333333", margin: "sm" }], action: { type: "message", text: "วินิจฉัย Jetting" } },
                    { type: "box", layout: "horizontal", contents: [{ type: "text", text: "🔸", size: "sm", flex: 0 }, { type: "text", text: "Void - โพรงอากาศ", size: "sm", color: "#333333", margin: "sm" }], action: { type: "message", text: "วินิจฉัย Void" } },
                  ],
                },
              ],
              paddingAll: "20px",
            },
            footer: {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "button", style: "primary", color: "#c62828", action: { type: "message", label: "📋 ดู Defect ทั้งหมด", text: "/defect" } },
              ],
              paddingAll: "16px",
            },
          },
          // BUBBLE 3: Calculator
          {
            type: "bubble",
            size: "mega",
            header: {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "🧮", size: "xl", flex: 0 },
                {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    { type: "text", text: "เครื่องคำนวณ", weight: "bold", size: "lg", color: "#ffffff" },
                    { type: "text", text: "CALCULATION TOOLS", size: "xs", color: "#ffffffcc" },
                  ],
                  margin: "md",
                },
              ],
              backgroundColor: "#2e7d32",
              paddingAll: "20px",
            },
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "text", text: "📊 สูตรคำนวณยอดนิยม", weight: "bold", size: "md", color: "#1a1a1a" },
                {
                  type: "box",
                  layout: "vertical",
                  margin: "lg",
                  spacing: "sm",
                  contents: [
                    { type: "box", layout: "horizontal", contents: [{ type: "text", text: "⏱️", size: "sm", flex: 0 }, { type: "text", text: "Cooling Time", size: "sm", color: "#333333", margin: "sm" }], action: { type: "message", text: "คำนวณ Cooling Time หนา 3mm" } },
                    { type: "box", layout: "horizontal", contents: [{ type: "text", text: "💪", size: "sm", flex: 0 }, { type: "text", text: "Clamping Force", size: "sm", color: "#333333", margin: "sm" }], action: { type: "message", text: "คำนวณ Clamping Force" } },
                    { type: "box", layout: "horizontal", contents: [{ type: "text", text: "📦", size: "sm", flex: 0 }, { type: "text", text: "Shot Weight", size: "sm", color: "#333333", margin: "sm" }], action: { type: "message", text: "คำนวณ Shot Weight" } },
                    { type: "box", layout: "horizontal", contents: [{ type: "text", text: "🔄", size: "sm", flex: 0 }, { type: "text", text: "Cycle Time", size: "sm", color: "#333333", margin: "sm" }], action: { type: "message", text: "คำนวณ Cycle Time" } },
                    { type: "box", layout: "horizontal", contents: [{ type: "text", text: "📐", size: "sm", flex: 0 }, { type: "text", text: "Shrinkage", size: "sm", color: "#333333", margin: "sm" }], action: { type: "message", text: "คำนวณ Shrinkage PP" } },
                    { type: "box", layout: "horizontal", contents: [{ type: "text", text: "⚡", size: "sm", flex: 0 }, { type: "text", text: "Injection Speed", size: "sm", color: "#333333", margin: "sm" }], action: { type: "message", text: "คำนวณ Injection Speed" } },
                    { type: "box", layout: "horizontal", contents: [{ type: "text", text: "🔥", size: "sm", flex: 0 }, { type: "text", text: "Barrel Capacity", size: "sm", color: "#333333", margin: "sm" }], action: { type: "message", text: "คำนวณ Barrel Capacity" } },
                    { type: "box", layout: "horizontal", contents: [{ type: "text", text: "💨", size: "sm", flex: 0 }, { type: "text", text: "Vent Depth", size: "sm", color: "#333333", margin: "sm" }], action: { type: "message", text: "คำนวณ Vent Depth PP" } },
                  ],
                },
              ],
              paddingAll: "20px",
            },
            footer: {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "button", style: "primary", color: "#2e7d32", action: { type: "message", label: "🧮 ดูสูตรทั้งหมด", text: "/calc" } },
              ],
              paddingAll: "16px",
            },
          },
          // BUBBLE 4: Temperature
          {
            type: "bubble",
            size: "mega",
            header: {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "🌡️", size: "xl", flex: 0 },
                {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    { type: "text", text: "ตารางอุณหภูมิ", weight: "bold", size: "lg", color: "#ffffff" },
                    { type: "text", text: "PROCESSING TEMP", size: "xs", color: "#ffffffcc" },
                  ],
                  margin: "md",
                },
              ],
              backgroundColor: "#d84315",
              paddingAll: "20px",
            },
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "text", text: "🧪 วัสดุยอดนิยม", weight: "bold", size: "md", color: "#1a1a1a" },
                {
                  type: "box",
                  layout: "vertical",
                  margin: "lg",
                  spacing: "sm",
                  contents: [
                    { type: "box", layout: "horizontal", contents: [{ type: "text", text: "PP", weight: "bold", size: "sm", color: "#d84315", flex: 1 }, { type: "text", text: "200-280°C", size: "sm", color: "#333333", align: "end" }], action: { type: "message", text: "อุณหภูมิ PP" } },
                    { type: "box", layout: "horizontal", contents: [{ type: "text", text: "PE", weight: "bold", size: "sm", color: "#d84315", flex: 1 }, { type: "text", text: "180-280°C", size: "sm", color: "#333333", align: "end" }], action: { type: "message", text: "อุณหภูมิ PE" } },
                    { type: "box", layout: "horizontal", contents: [{ type: "text", text: "ABS", weight: "bold", size: "sm", color: "#d84315", flex: 1 }, { type: "text", text: "210-270°C", size: "sm", color: "#333333", align: "end" }], action: { type: "message", text: "อุณหภูมิ ABS" } },
                    { type: "box", layout: "horizontal", contents: [{ type: "text", text: "PC", weight: "bold", size: "sm", color: "#d84315", flex: 1 }, { type: "text", text: "280-320°C", size: "sm", color: "#333333", align: "end" }], action: { type: "message", text: "อุณหภูมิ PC" } },
                    { type: "box", layout: "horizontal", contents: [{ type: "text", text: "PA (Nylon)", weight: "bold", size: "sm", color: "#d84315", flex: 1 }, { type: "text", text: "230-290°C", size: "sm", color: "#333333", align: "end" }], action: { type: "message", text: "อุณหภูมิ Nylon" } },
                    { type: "box", layout: "horizontal", contents: [{ type: "text", text: "POM", weight: "bold", size: "sm", color: "#d84315", flex: 1 }, { type: "text", text: "180-220°C", size: "sm", color: "#333333", align: "end" }], action: { type: "message", text: "อุณหภูมิ POM" } },
                    { type: "box", layout: "horizontal", contents: [{ type: "text", text: "PBT", weight: "bold", size: "sm", color: "#d84315", flex: 1 }, { type: "text", text: "230-270°C", size: "sm", color: "#333333", align: "end" }], action: { type: "message", text: "อุณหภูมิ PBT" } },
                    { type: "box", layout: "horizontal", contents: [{ type: "text", text: "PMMA", weight: "bold", size: "sm", color: "#d84315", flex: 1 }, { type: "text", text: "220-260°C", size: "sm", color: "#333333", align: "end" }], action: { type: "message", text: "อุณหภูมิ PMMA" } },
                  ],
                },
              ],
              paddingAll: "20px",
            },
            footer: {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "button", style: "primary", color: "#d84315", action: { type: "message", label: "🌡️ ดูวัสดุทั้งหมด", text: "/temp" } },
              ],
              paddingAll: "16px",
            },
          },
          // BUBBLE 5: Team
          {
            type: "bubble",
            size: "mega",
            header: {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "👥", size: "xl", flex: 0 },
                {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    { type: "text", text: "การใช้งานแบบทีม", weight: "bold", size: "lg", color: "#ffffff" },
                    { type: "text", text: "TEAM COLLABORATION", size: "xs", color: "#ffffffcc" },
                  ],
                  margin: "md",
                },
              ],
              backgroundColor: "#00838f",
              paddingAll: "20px",
            },
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "text", text: "🚀 ฟีเจอร์ทีม", weight: "bold", size: "md", color: "#1a1a1a" },
                {
                  type: "box",
                  layout: "vertical",
                  margin: "lg",
                  spacing: "md",
                  contents: [
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        { type: "box", layout: "vertical", contents: [{ type: "text", text: "📢", size: "lg" }], backgroundColor: "#e0f7fa", cornerRadius: "8px", width: "40px", height: "40px", justifyContent: "center", alignItems: "center", flex: 0 },
                        { type: "box", layout: "vertical", contents: [{ type: "text", text: "ประกาศทีม", weight: "bold", size: "sm", color: "#333333" }, { type: "text", text: "แจ้งข่าวสารถึงสมาชิก", size: "xs", color: "#666666", wrap: true }], margin: "md", flex: 1 },
                      ],
                      action: { type: "message", text: "/broadcast" },
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        { type: "box", layout: "vertical", contents: [{ type: "text", text: "📝", size: "lg" }], backgroundColor: "#e0f7fa", cornerRadius: "8px", width: "40px", height: "40px", justifyContent: "center", alignItems: "center", flex: 0 },
                        { type: "box", layout: "vertical", contents: [{ type: "text", text: "บันทึกการผลิต", weight: "bold", size: "sm", color: "#333333" }, { type: "text", text: "รายงานผลผลิตประจำวัน", size: "xs", color: "#666666", wrap: true }], margin: "md", flex: 1 },
                      ],
                      action: { type: "message", text: "/report" },
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        { type: "box", layout: "vertical", contents: [{ type: "text", text: "📊", size: "lg" }], backgroundColor: "#e0f7fa", cornerRadius: "8px", width: "40px", height: "40px", justifyContent: "center", alignItems: "center", flex: 0 },
                        { type: "box", layout: "vertical", contents: [{ type: "text", text: "สรุปผลผลิต", weight: "bold", size: "sm", color: "#333333" }, { type: "text", text: "Dashboard รายงาน", size: "xs", color: "#666666", wrap: true }], margin: "md", flex: 1 },
                      ],
                      action: { type: "message", text: "/summary" },
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        { type: "box", layout: "vertical", contents: [{ type: "text", text: "🔗", size: "lg" }], backgroundColor: "#e0f7fa", cornerRadius: "8px", width: "40px", height: "40px", justifyContent: "center", alignItems: "center", flex: 0 },
                        { type: "box", layout: "vertical", contents: [{ type: "text", text: "เชื่อมต่อทีม", weight: "bold", size: "sm", color: "#333333" }, { type: "text", text: "เข้าร่วมองค์กรด้วยรหัส", size: "xs", color: "#666666", wrap: true }], margin: "md", flex: 1 },
                      ],
                      action: { type: "message", text: "/joinorg" },
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
                { type: "button", style: "primary", color: "#00838f", action: { type: "message", label: "👥 จัดการทีม", text: "/team" } },
              ],
              paddingAll: "16px",
            },
          },
        ],
      },
    };
  } catch (error) {
    console.error("Error creating plastic consultation menu:", error);
    return null;
  }
};

/**
 * 💰 CREATE PREMIUM PACKAGE FLEX MESSAGE
 * แสดงรายละเอียดแพ็คเกจ Premium - กระตุ้นการซื้อ
 */
const createPremiumPackageMessage = () => {
  try {
    return {
      type: "flex",
      altText: "💎 แพ็คเกจ Premium - ปลดล็อคความสามารถเต็มที่!",
      contents: {
        type: "carousel",
        contents: [
          // Card 1: Individual Packages
          {
            type: "bubble",
            size: "kilo",
            header: {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "text", text: "👤 แพ็คเกจส่วนตัว", weight: "bold", color: "#ffffff", size: "md" },
                { type: "text", text: "INDIVIDUAL PLAN", color: "#ffffffaa", size: "xxs" },
              ],
              backgroundColor: "#7c4dff",
              paddingAll: "15px",
            },
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "box",
                  layout: "horizontal",
                  backgroundColor: "#f5f5f5",
                  cornerRadius: "8px",
                  paddingAll: "10px",
                  margin: "none",
                  contents: [
                    { type: "text", text: "รายเดือน", size: "sm", color: "#333333", flex: 1 },
                    { type: "text", text: "99฿", weight: "bold", size: "md", color: "#7c4dff", align: "end" },
                  ],
                },
                {
                  type: "box",
                  layout: "horizontal",
                  backgroundColor: "#f5f5f5",
                  cornerRadius: "8px",
                  paddingAll: "10px",
                  margin: "sm",
                  contents: [
                    { type: "text", text: "3 เดือน", size: "sm", color: "#333333", flex: 1 },
                    {
                      type: "box",
                      layout: "vertical",
                      contents: [
                        { type: "text", text: "259฿", weight: "bold", size: "md", color: "#7c4dff", align: "end" },
                        { type: "text", text: "ประหยัด 12%", size: "xxs", color: "#888888", align: "end" },
                      ],
                    },
                  ],
                },
                {
                  type: "box",
                  layout: "horizontal",
                  backgroundColor: "#fff3e0",
                  cornerRadius: "8px",
                  paddingAll: "10px",
                  margin: "sm",
                  contents: [
                    {
                      type: "box",
                      layout: "horizontal",
                      flex: 1,
                      contents: [
                        { type: "text", text: "รายปี", size: "sm", color: "#e65100" },
                        { type: "text", text: "🔥", size: "sm", margin: "xs" },
                      ],
                    },
                    {
                      type: "box",
                      layout: "vertical",
                      contents: [
                        { type: "text", text: "699฿", weight: "bold", size: "md", color: "#e65100", align: "end" },
                        { type: "text", text: "คุ้มสุด! 1.9฿/วัน", size: "xxs", color: "#f57c00", align: "end" },
                      ],
                    },
                  ],
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
                  style: "primary",
                  color: "#7c4dff",
                  action: { type: "message", label: "เลือกแพ็คเกจนี้", text: "ดูแพ็คเกจส่วนตัว" },
                },
              ],
              paddingAll: "10px",
            },
          },
          // Card 2: Team Packages
          {
            type: "bubble",
            size: "kilo",
            header: {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "text", text: "🏢 แพ็คเกจทีม", weight: "bold", color: "#ffffff", size: "md" },
                { type: "text", text: "TEAM PLAN (5 USERS)", color: "#ffffffaa", size: "xxs" },
              ],
              backgroundColor: "#2e7d32",
              paddingAll: "15px",
            },
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "box",
                  layout: "horizontal",
                  backgroundColor: "#f5f5f5",
                  cornerRadius: "8px",
                  paddingAll: "10px",
                  margin: "none",
                  contents: [
                    { type: "text", text: "รายเดือน", size: "sm", color: "#333333", flex: 1 },
                    { type: "text", text: "399฿", weight: "bold", size: "md", color: "#2e7d32", align: "end" },
                  ],
                },
                {
                  type: "box",
                  layout: "horizontal",
                  backgroundColor: "#e8f5e9",
                  cornerRadius: "8px",
                  paddingAll: "10px",
                  margin: "sm",
                  contents: [
                    {
                      type: "box",
                      layout: "horizontal",
                      flex: 1,
                      contents: [
                        { type: "text", text: "รายปี", size: "sm", color: "#2e7d32" },
                        { type: "text", text: "🔥", size: "sm", margin: "xs" },
                      ],
                    },
                    {
                      type: "box",
                      layout: "vertical",
                      contents: [
                        { type: "text", text: "2,999฿", weight: "bold", size: "md", color: "#2e7d32", align: "end" },
                        { type: "text", text: "ประหยัด 37%", size: "xxs", color: "#4caf50", align: "end" },
                      ],
                    },
                  ],
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
                  style: "primary",
                  color: "#2e7d32",
                  action: { type: "message", label: "เลือกแพ็คเกจนี้", text: "ดูแพ็คเกจทีม" },
                },
              ],
              paddingAll: "10px",
            },
          },
        ],
      },
    };
  } catch (error) {
    console.error("Error creating premium package message:", error);
    return null;
  }
};

/**
 * 📊 CREATE HELP MENU FLEX MESSAGE v3.0
 * แสดงเมนูช่วยเหลือแบบ Interactive - ปุ่มกดใช้งานง่าย
 */
const createHelpMenuMessage = () => {
  try {
    return {
      type: "flex",
      altText: "📖 คู่มือการใช้งาน Wit365 - กดปุ่มเพื่อเริ่มใช้งาน!",
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
                // Logo Image
                {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {
                      type: "image",
                      url: "https://raw.githubusercontent.com/wizxbiz/affiliatepro-docs/main/images/loog.png",
                      size: "full",
                      aspectMode: "cover",
                      aspectRatio: "1:1",
                    },
                  ],
                  width: "50px",
                  height: "50px",
                  backgroundColor: "#ffffff33",
                  cornerRadius: "25px",
                  justifyContent: "center",
                  alignItems: "center",
                },
                {
                  type: "box",
                  layout: "vertical",
                  margin: "lg",
                  contents: [
                    { type: "text", text: "Wit365", weight: "bold", color: "#ffffff", size: "xl" },
                    { type: "text", text: "ผู้ช่วยวิศวกรรมพลาสติกอัจฉริยะ", color: "#FFD700", size: "sm", weight: "bold" },
                  ],
                },
              ],
              alignItems: "center",
            },
            {
              type: "text",
              text: "👇 กดปุ่มด้านล่างเพื่อเริ่มใช้งาน",
              size: "sm",
              color: "#ffffff",
              margin: "lg",
              align: "center",
            },
          ],
          backgroundColor: "#1e88e5",
          paddingAll: "20px",
        },
        body: {
          type: "box",
          layout: "vertical",
          spacing: "md",
          contents: [
            // Row 1: AI Vision + ฉีดพลาสติก
            {
              type: "box",
              layout: "horizontal",
              spacing: "sm",
              contents: [
                {
                  type: "button",
                  style: "primary",
                  color: "#1565c0",
                  height: "sm",
                  action: { type: "message", label: "📸 วิเคราะห์ภาพ", text: "วิเคราะห์ภาพ" },
                },
                {
                  type: "button",
                  style: "primary",
                  color: "#e65100",
                  height: "sm",
                  action: { type: "message", label: "🏭 ฉีดพลาสติก", text: "ปัญหา Short Shot แก้ยังไง" },
                },
              ],
            },
            // Row 2: คำนวณ + เกษตร
            {
              type: "box",
              layout: "horizontal",
              spacing: "sm",
              contents: [
                {
                  type: "button",
                  style: "primary",
                  color: "#2e7d32",
                  height: "sm",
                  action: { type: "message", label: "🔢 คำนวณ", text: "เมนูคำนวณ" },
                },
                {
                  type: "button",
                  style: "primary",
                  color: "#558b2f",
                  height: "sm",
                  action: { type: "message", label: "🌾 เกษตร", text: "ปรึกษาเรื่องเกษตรครับ" },
                },
              ],
            },
            // Row 3: 📚 Study Tools + 🎯 Category Tools
            {
              type: "box",
              layout: "horizontal",
              spacing: "sm",
              contents: [
                {
                  type: "button",
                  style: "primary",
                  color: "#7b1fa2",
                  height: "sm",
                  action: { type: "message", label: "📚 เครื่องมือเรียน", text: "/tools" },
                },
                {
                  type: "button",
                  style: "primary",
                  color: "#1976d2",
                  height: "sm",
                  action: { type: "message", label: "🎯 AI 18 หมวด", text: "/categories" },
                },
              ],
            },
            // Row 4: บัญชี + แปลภาษา
            {
              type: "box",
              layout: "horizontal",
              spacing: "sm",
              contents: [
                {
                  type: "button",
                  style: "primary",
                  color: "#f57c00",
                  height: "sm",
                  action: { type: "message", label: "💰 บัญชี", text: "วิธีใช้บัญชี" },
                },
                {
                  type: "button",
                  style: "primary",
                  color: "#00897b",
                  height: "sm",
                  action: { type: "message", label: "🌐 แปลภาษา", text: "ช่วยแปลภาษาหน่อย" },
                },
              ],
            },
            // Separator
            { type: "separator", margin: "md" },
            // คำอธิบายสั้นๆ
            {
              type: "text",
              text: "✨ หรือพิมพ์คำถามมาได้เลยครับ",
              size: "sm",
              color: "#666666",
              align: "center",
              margin: "md",
            },
            // ตัวอย่างคำถาม
            {
              type: "box",
              layout: "vertical",
              backgroundColor: "#f5f5f5",
              cornerRadius: "10px",
              paddingAll: "12px",
              margin: "sm",
              contents: [
                { type: "text", text: "💬 ตัวอย่างคำถาม:", weight: "bold", size: "xs", color: "#333333" },
                { type: "text", text: "• \"รอยไหม้เกิดจากอะไร\"", size: "xs", color: "#666666", margin: "xs" },
                { type: "text", text: "• \"คำนวณ cooling time หนา 3mm\"", size: "xs", color: "#666666" },
                { type: "text", text: "• \"ขายมะม่วง 50 กก. 1500 บาท\"", size: "xs", color: "#666666" },
                { type: "text", text: "• ส่งรูปมา = AI วิเคราะห์ให้!", size: "xs", color: "#1565c0", weight: "bold" },
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
            // Premium Button
            {
              type: "button",
              style: "secondary",
              color: "#ede7f6",
              height: "sm",
              action: { type: "message", label: "💎 ดูแพ็คเกจ Premium", text: "ดูแพ็คเกจทั้งหมด" },
            },
            // Footer text
            {
              type: "box",
              layout: "horizontal",
              margin: "md",
              justifyContent: "center",
              contents: [
                {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {
                      type: "image",
                      url: "https://raw.githubusercontent.com/wizxbiz/affiliatepro-docs/main/images/loog.png",
                      size: "full",
                      aspectMode: "cover",
                      aspectRatio: "1:1",
                    },
                  ],
                  width: "16px",
                  height: "16px",
                  cornerRadius: "8px",
                },
                {
                  type: "text",
                  text: "โดย อาจารย์ วิทยา",
                  size: "xxs",
                  color: "#aaaaaa",
                  margin: "sm",
                },
              ],
            },
          ],
          paddingAll: "12px",
          backgroundColor: "#fafafa",
        },
      },
    };
  } catch (error) {
    console.error("Error creating help menu message:", error);
    return null;
  }
};

// =====================================================
// 📱 DIGITAL LOGBOOK FLEX MESSAGES
// =====================================================

/**
 * 📱 สร้าง Flex Message สำหรับใบรายงานการผลิต (Production Report)
 * @param {Object} reportData - ข้อมูลรายงาน
 */
const createProductionReportMessage = (reportData) => {
  try {
    const {
      date = new Date().toLocaleDateString("th-TH"),
      time = new Date().toLocaleTimeString("th-TH"),
      shift = "เช้า",
      operator = "N/A",
      moldName = "N/A",
      totalShots = 0,
      goodParts = 0,
      rejectParts = 0,
      rejectRate = 0,
      efficiency = 0,
      rejectReason = "-",
      downtime = 0,
      downtimeReason = "-",
      verificationCode = "N/A",
      orgCode = null,
    } = reportData;

    // กำหนดสีตามประสิทธิภาพ
    let efficiencyColor = "#e74c3c"; // Red (< 80%)
    let efficiencyIcon = "🔴";
    let statusText = "ต้องปรับปรุง";
    let headerBg = "#e74c3c";

    if (efficiency >= 95) {
      efficiencyColor = "#27ae60";
      efficiencyIcon = "🏆";
      statusText = "ยอดเยี่ยม!";
      headerBg = "#27ae60";
    } else if (efficiency >= 90) {
      efficiencyColor = "#06c755";
      efficiencyIcon = "✅";
      statusText = "ดีมาก";
      headerBg = "#06c755";
    } else if (efficiency >= 80) {
      efficiencyColor = "#f39c12";
      efficiencyIcon = "⚠️";
      statusText = "ปกติ";
      headerBg = "#f39c12";
    }

    // กำหนดไอคอนกะ
    const shiftIcon = shift === "เช้า" ? "🌅" : shift === "บ่าย" ? "☀️" : "🌙";

    const bodyContents = [
      // Info Row
      {
        type: "box",
        layout: "horizontal",
        contents: [
          {
            type: "box",
            layout: "vertical",
            flex: 1,
            contents: [
              { type: "text", text: "📅 วันที่", size: "xxs", color: "#888888" },
              { type: "text", text: date, weight: "bold", size: "sm" },
            ],
          },
          {
            type: "box",
            layout: "vertical",
            flex: 1,
            contents: [
              { type: "text", text: "⏰ เวลา", size: "xxs", color: "#888888" },
              { type: "text", text: time, weight: "bold", size: "sm" },
            ],
          },
          {
            type: "box",
            layout: "vertical",
            flex: 1,
            contents: [
              { type: "text", text: `${shiftIcon} กะ`, size: "xxs", color: "#888888" },
              { type: "text", text: shift, weight: "bold", size: "sm" },
            ],
          },
        ],
        paddingBottom: "15px",
      },
      // Separator
      { type: "separator", color: "#eeeeee" },
      // Operator & Mold Info
      {
        type: "box",
        layout: "horizontal",
        contents: [
          {
            type: "box",
            layout: "vertical",
            flex: 1,
            contents: [
              { type: "text", text: "👤 พนักงาน", size: "xxs", color: "#888888" },
              { type: "text", text: operator, weight: "bold", size: "sm", wrap: true },
            ],
          },
          {
            type: "box",
            layout: "vertical",
            flex: 1,
            contents: [
              { type: "text", text: "🏭 แม่พิมพ์", size: "xxs", color: "#888888" },
              { type: "text", text: moldName, weight: "bold", size: "sm", wrap: true },
            ],
          },
        ],
        paddingTop: "15px",
        paddingBottom: "15px",
      },
      // Separator
      { type: "separator", color: "#eeeeee" },
      // Production Stats Title
      {
        type: "text",
        text: "📈 ผลการผลิต",
        weight: "bold",
        size: "sm",
        color: "#1e88e5",
        margin: "lg",
      },
      // Production Stats Grid
      {
        type: "box",
        layout: "horizontal",
        contents: [
          {
            type: "box",
            layout: "vertical",
            flex: 1,
            contents: [
              { type: "text", text: "Shot ทั้งหมด", size: "xxs", color: "#888888", align: "center" },
              { type: "text", text: totalShots.toLocaleString(), weight: "bold", size: "lg", align: "center", color: "#333333" },
              { type: "text", text: "ครั้ง", size: "xxs", color: "#888888", align: "center" },
            ],
            backgroundColor: "#f5f5f5",
            cornerRadius: "8px",
            paddingAll: "10px",
          },
          { type: "separator", color: "#ffffff00", margin: "sm" },
          {
            type: "box",
            layout: "vertical",
            flex: 1,
            contents: [
              { type: "text", text: "ชิ้นงานดี", size: "xxs", color: "#888888", align: "center" },
              { type: "text", text: goodParts.toLocaleString(), weight: "bold", size: "lg", align: "center", color: "#27ae60" },
              { type: "text", text: "ชิ้น", size: "xxs", color: "#888888", align: "center" },
            ],
            backgroundColor: "#e8f5e9",
            cornerRadius: "8px",
            paddingAll: "10px",
          },
          { type: "separator", color: "#ffffff00", margin: "sm" },
          {
            type: "box",
            layout: "vertical",
            flex: 1,
            contents: [
              { type: "text", text: "ของเสีย", size: "xxs", color: "#888888", align: "center" },
              { type: "text", text: rejectParts.toLocaleString(), weight: "bold", size: "lg", align: "center", color: rejectParts > 0 ? "#e74c3c" : "#27ae60" },
              { type: "text", text: `${rejectRate}%`, size: "xxs", color: rejectParts > 0 ? "#e74c3c" : "#888888", align: "center" },
            ],
            backgroundColor: rejectParts > 0 ? "#ffebee" : "#f5f5f5",
            cornerRadius: "8px",
            paddingAll: "10px",
          },
        ],
        margin: "md",
      },
      // Efficiency Bar
      {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: `${efficiencyIcon} ประสิทธิภาพ`, weight: "bold", size: "sm", flex: 1 },
              { type: "text", text: `${efficiency}%`, weight: "bold", size: "md", color: efficiencyColor, align: "end" },
            ],
          },
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "box",
                layout: "vertical",
                contents: [{ type: "filler" }],
                backgroundColor: efficiencyColor,
                height: "8px",
                width: `${Math.min(100, Math.max(0, efficiency))}%`,
                cornerRadius: "4px",
              },
            ],
            backgroundColor: "#eeeeee",
            height: "8px",
            cornerRadius: "4px",
            margin: "sm",
          },
          { type: "text", text: statusText, size: "xxs", color: efficiencyColor, align: "end", margin: "xs" },
        ],
        margin: "lg",
        paddingAll: "12px",
        backgroundColor: "#fafafa",
        cornerRadius: "8px",
      },
    ];

    // Add Reject Reason if any
    if (rejectParts > 0 && rejectReason !== "-") {
      bodyContents.push({
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: "❌ สาเหตุของเสีย", weight: "bold", size: "xs", color: "#e74c3c" },
          { type: "text", text: rejectReason, size: "xs", color: "#666666", wrap: true, margin: "xs" },
        ],
        margin: "md",
        paddingAll: "10px",
        backgroundColor: "#ffebee",
        cornerRadius: "6px",
      });
    }

    // Add Downtime if any
    if (downtime > 0) {
      bodyContents.push({
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: `⏰ Downtime: ${downtime} นาที`, weight: "bold", size: "xs", color: "#f39c12" },
          { type: "text", text: downtimeReason !== "-" ? `สาเหตุ: ${downtimeReason}` : "", size: "xs", color: "#666666", wrap: true, margin: "xs" },
        ],
        margin: "md",
        paddingAll: "10px",
        backgroundColor: "#fff3e0",
        cornerRadius: "6px",
      });
    }

    // Add Org Code if present
    if (orgCode) {
      bodyContents.push({
        type: "box",
        layout: "horizontal",
        contents: [
          { type: "text", text: "🏢", size: "sm", flex: 0 },
          { type: "text", text: `รหัสองค์กร: ${orgCode}`, size: "xs", color: "#5e35b1", flex: 1, margin: "sm" },
        ],
        margin: "md",
        paddingAll: "8px",
        backgroundColor: "#ede7f6",
        cornerRadius: "6px",
      });
    }

    return {
      type: "flex",
      altText: `📱 ใบรายงานผลิต | ${moldName} | ${efficiency}% | Ref: ${verificationCode}`,
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
                { type: "text", text: "📱", size: "xl", flex: 0 },
                {
                  type: "box",
                  layout: "vertical",
                  margin: "md",
                  flex: 1,
                  contents: [
                    { type: "text", text: "Digital Logbook", weight: "bold", color: "#ffffff", size: "lg" },
                    { type: "text", text: "ใบรายงานการผลิต", color: "#ffffff99", size: "xs" },
                  ],
                },
                {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    { type: "text", text: "✅", size: "xxl", align: "center" },
                    { type: "text", text: "บันทึกแล้ว", size: "xxs", color: "#ffffffcc", align: "center" },
                  ],
                  flex: 0,
                },
              ],
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: `🆔 Ref: ${verificationCode}`, size: "sm", color: "#ffffffdd", weight: "bold" },
              ],
              margin: "md",
              paddingAll: "8px",
              backgroundColor: "#ffffff22",
              cornerRadius: "6px",
            },
          ],
          backgroundColor: headerBg,
          paddingAll: "20px",
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: bodyContents,
          paddingAll: "20px",
        },
        footer: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "button",
                  action: { type: "message", text: "/summary" },
                  style: "secondary",
                  height: "sm",
                  flex: 1,
                },
                { type: "separator", color: "#ffffff00", margin: "sm" },
                {
                  type: "button",
                  action: { type: "message", text: "/report" },
                  style: "primary",
                  height: "sm",
                  flex: 1,
                  color: "#1e88e5",
                },
              ],
            },
            {
              type: "text",
              text: "🔒 ข้อมูลถูกเก็บบน Cloud อย่างปลอดภัย",
              size: "xxs",
              color: "#888888",
              align: "center",
              margin: "md",
            },
          ],
          paddingAll: "15px",
        },
      },
    };
  } catch (error) {
    console.error("Error creating production report message:", error);
    return null;
  }
};

/**
 * 📊 สร้าง Flex Message สำหรับสรุปรายงานการผลิต (Summary Dashboard)
 * @param {Array} reports - รายการรายงาน
 * @param {Object} options - ตัวเลือกเพิ่มเติม (orgCode, groupId)
 */
const createSummaryDashboardMessage = (reports, options = {}) => {
  try {
    const { orgCode = null, groupName = null } = options;
    const today = new Date().toLocaleDateString("th-TH", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

    if (!reports || reports.length === 0) {
      // Empty State
      return {
        type: "flex",
        altText: "📊 สรุปรายงาน - ไม่พบข้อมูล",
        contents: {
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
                  { type: "text", text: "📊", size: "xl", flex: 0 },
                  {
                    type: "box",
                    layout: "vertical",
                    margin: "md",
                    flex: 1,
                    contents: [
                      { type: "text", text: "สรุปรายงานการผลิต", weight: "bold", color: "#ffffff", size: "md" },
                      { type: "text", text: orgCode ? `🏢 ${orgCode}` : "วันนี้", color: "#ffffff99", size: "xs" },
                    ],
                  },
                ],
              },
            ],
            backgroundColor: "#546e7a",
            paddingAll: "18px",
          },
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              { type: "text", text: "📭", size: "xxl", align: "center", margin: "lg" },
              { type: "text", text: "ยังไม่มีรายงานในวันนี้", weight: "bold", align: "center", margin: "md", color: "#666666" },
              { type: "text", text: "รอพนักงานส่งรายงานเข้ามา", size: "sm", align: "center", color: "#888888", margin: "sm" },
            ],
            paddingAll: "20px",
          },
          footer: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "button",
                action: { type: "message", text: "/report" },
                style: "primary",
                height: "sm",
                color: "#1e88e5",
              },
              { type: "text", text: "กดเพื่อส่งรายงานใหม่", size: "xxs", color: "#888888", align: "center", margin: "sm" },
            ],
            paddingAll: "15px",
          },
        },
      };
    }

    // คำนวณสถิติรวม
    const totalShots = reports.reduce((sum, r) => sum + (parseInt(r.totalShots) || 0), 0);
    const totalGood = reports.reduce((sum, r) => sum + (parseInt(r.goodParts) || 0), 0);
    const totalReject = reports.reduce((sum, r) => sum + (parseInt(r.rejectParts) || 0), 0);
    const avgEfficiency = reports.length > 0 ?
      (reports.reduce((sum, r) => sum + (parseFloat(r.efficiency) || 0), 0) / reports.length).toFixed(1) :
      0;

    // กำหนดสีตามประสิทธิภาพเฉลี่ย
    let efficiencyColor = "#e74c3c";
    let statusEmoji = "🔴";
    let headerBg = "#e74c3c";

    if (avgEfficiency >= 95) {
      efficiencyColor = "#27ae60";
      statusEmoji = "🏆";
      headerBg = "#27ae60";
    } else if (avgEfficiency >= 90) {
      efficiencyColor = "#06c755";
      statusEmoji = "✅";
      headerBg = "#06c755";
    } else if (avgEfficiency >= 80) {
      efficiencyColor = "#f39c12";
      statusEmoji = "⚠️";
      headerBg = "#f39c12";
    }

    // สร้างรายการย่อ (แสดง 5 รายการล่าสุด)
    const recentReports = reports.slice(0, 5);
    const reportItems = recentReports.map((r, index) => ({
      type: "box",
      layout: "horizontal",
      contents: [
        { type: "text", text: `${index + 1}.`, size: "xs", color: "#888888", flex: 0 },
        {
          type: "box",
          layout: "vertical",
          flex: 3,
          margin: "sm",
          contents: [
            { type: "text", text: r.moldName || "N/A", weight: "bold", size: "xs", wrap: true },
            { type: "text", text: `👤 ${r.operator || "N/A"} | 🕐 ${r.time || "N/A"}`, size: "xxs", color: "#888888" },
          ],
        },
        {
          type: "box",
          layout: "vertical",
          flex: 1,
          contents: [
            {
              type: "text",
              text: `${r.efficiency || 0}%`,
              weight: "bold",
              size: "sm",
              align: "end",
              color: parseFloat(r.efficiency) >= 90 ? "#27ae60" : parseFloat(r.efficiency) >= 80 ? "#f39c12" : "#e74c3c",
            },
          ],
        },
      ],
      paddingAll: "8px",
      backgroundColor: index % 2 === 0 ? "#f8f9fa" : "#ffffff",
      cornerRadius: "4px",
      margin: index > 0 ? "xs" : "none",
    }));

    return {
      type: "flex",
      altText: `📊 สรุปรายงาน ${reports.length} รายการ | เฉลี่ย ${avgEfficiency}%`,
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
                { type: "text", text: "📊", size: "xl", flex: 0 },
                {
                  type: "box",
                  layout: "vertical",
                  margin: "md",
                  flex: 1,
                  contents: [
                    { type: "text", text: "สรุปรายงานการผลิต", weight: "bold", color: "#ffffff", size: "lg" },
                    { type: "text", text: orgCode ? `🏢 ${orgCode}` : "วันนี้", color: "#ffffff99", size: "xs" },
                  ],
                },
                {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    { type: "text", text: `${reports.length}`, size: "xxl", weight: "bold", color: "#ffffff", align: "center" },
                    { type: "text", text: "รายการ", size: "xxs", color: "#ffffffcc", align: "center" },
                  ],
                  flex: 0,
                },
              ],
            },
            { type: "text", text: today, size: "xxs", color: "#ffffffaa", margin: "md" },
          ],
          backgroundColor: headerBg,
          paddingAll: "20px",
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            // Stats Overview
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "box",
                  layout: "vertical",
                  flex: 1,
                  contents: [
                    { type: "text", text: "📦 Shot รวม", size: "xxs", color: "#888888", align: "center" },
                    { type: "text", text: totalShots.toLocaleString(), weight: "bold", size: "md", align: "center" },
                  ],
                  backgroundColor: "#f5f5f5",
                  cornerRadius: "8px",
                  paddingAll: "10px",
                },
                { type: "separator", color: "#ffffff00", margin: "sm" },
                {
                  type: "box",
                  layout: "vertical",
                  flex: 1,
                  contents: [
                    { type: "text", text: "✅ ชิ้นดี", size: "xxs", color: "#888888", align: "center" },
                    { type: "text", text: totalGood.toLocaleString(), weight: "bold", size: "md", align: "center", color: "#27ae60" },
                  ],
                  backgroundColor: "#e8f5e9",
                  cornerRadius: "8px",
                  paddingAll: "10px",
                },
                { type: "separator", color: "#ffffff00", margin: "sm" },
                {
                  type: "box",
                  layout: "vertical",
                  flex: 1,
                  contents: [
                    { type: "text", text: "❌ ของเสีย", size: "xxs", color: "#888888", align: "center" },
                    { type: "text", text: totalReject.toLocaleString(), weight: "bold", size: "md", align: "center", color: totalReject > 0 ? "#e74c3c" : "#27ae60" },
                  ],
                  backgroundColor: totalReject > 0 ? "#ffebee" : "#f5f5f5",
                  cornerRadius: "8px",
                  paddingAll: "10px",
                },
              ],
              paddingBottom: "15px",
            },
            // Average Efficiency
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: `${statusEmoji} ประสิทธิภาพเฉลี่ย`, weight: "bold", size: "sm", flex: 1 },
                { type: "text", text: `${avgEfficiency}%`, weight: "bold", size: "xl", color: efficiencyColor, align: "end" },
              ],
              paddingAll: "15px",
              backgroundColor: "#fafafa",
              cornerRadius: "8px",
              margin: "md",
            },
            // Separator
            { type: "separator", color: "#eeeeee", margin: "lg" },
            // Recent Reports Title
            { type: "text", text: "📋 รายงานล่าสุด", weight: "bold", size: "sm", margin: "lg" },
            // Report List
            {
              type: "box",
              layout: "vertical",
              contents: reportItems,
              margin: "md",
            },
            // Show more hint
            ...(reports.length > 5 ? [{
              type: "text",
              text: `และอีก ${reports.length - 5} รายการ...`,
              size: "xxs",
              color: "#888888",
              align: "center",
              margin: "md",
            }] : []),
          ],
          paddingAll: "20px",
        },
        footer: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "button",
                  action: { type: "message", text: "/report" },
                  style: "primary",
                  height: "sm",
                  flex: 1,
                  color: "#1e88e5",
                },
                { type: "separator", color: "#ffffff00", margin: "sm" },
                {
                  type: "button",
                  action: { type: "message", text: "ดูสถิติเพิ่มเติม" },
                  style: "secondary",
                  height: "sm",
                  flex: 1,
                },
              ],
            },
            {
              type: "text",
              text: "💎 อัพเกรด Premium เพื่อดู Dashboard แบบ Real-time",
              size: "xxs",
              color: "#7c4dff",
              align: "center",
              margin: "md",
            },
          ],
          paddingAll: "15px",
        },
      },
    };
  } catch (error) {
    console.error("Error creating summary dashboard message:", error);
    return null;
  }
};

/**
 * 📢 สร้าง Flex Message สำหรับประกาศในทีม (Team Announcement)
 * @param {Object} params - พารามิเตอร์
 */
const createTeamAnnouncementMessage = (params) => {
  try {
    const {
      orgCode = "TEAM",
      message = "",
      senderName = "หัวหน้าทีม",
      timestamp = new Date().toLocaleString("th-TH"),
    } = params;

    return {
      type: "flex",
      altText: `📢 ประกาศจาก ${orgCode}: ${message.substring(0, 50)}...`,
      contents: {
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
                { type: "text", text: "📢", size: "xl", flex: 0 },
                {
                  type: "box",
                  layout: "vertical",
                  margin: "md",
                  flex: 1,
                  contents: [
                    { type: "text", text: "ประกาศจากหัวหน้าทีม", weight: "bold", color: "#ffffff", size: "md" },
                    { type: "text", text: `🏢 ${orgCode}`, color: "#ffffff99", size: "xs" },
                  ],
                },
              ],
            },
          ],
          backgroundColor: "#ff5722",
          paddingAll: "18px",
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: message,
              wrap: true,
              size: "md",
              color: "#333333",
            },
            { type: "separator", color: "#eeeeee", margin: "lg" },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: `👤 ${senderName}`, size: "xs", color: "#888888", flex: 1 },
                { type: "text", text: `🕐 ${timestamp}`, size: "xs", color: "#888888", align: "end" },
              ],
              margin: "md",
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
              action: { type: "message", text: `${orgCode}/summary` },
              style: "secondary",
              height: "sm",
            },
          ],
          paddingAll: "15px",
        },
      },
    };
  } catch (error) {
    console.error("Error creating team announcement message:", error);
    return null;
  }
};

/**
 * 📢 สร้าง Flex Message แจ้งผลส่งประกาศ (Broadcast Result)
 * @param {Object} params - พารามิเตอร์
 */
const createBroadcastResultMessage = (params) => {
  try {
    const {
      orgCode = "TEAM",
      successCount = 0,
      message = "",
      failedCount = 0,
    } = params;

    const isSuccess = successCount > 0;

    return {
      type: "flex",
      altText: `✅ ส่งประกาศสำเร็จ ${successCount} คน`,
      contents: {
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
                { type: "text", text: isSuccess ? "✅" : "⚠️", size: "xl", flex: 0 },
                {
                  type: "box",
                  layout: "vertical",
                  margin: "md",
                  flex: 1,
                  contents: [
                    { type: "text", text: isSuccess ? "ส่งประกาศสำเร็จ" : "ส่งประกาศไม่สำเร็จ", weight: "bold", color: "#ffffff", size: "md" },
                    { type: "text", text: `🏢 ${orgCode}`, color: "#ffffff99", size: "xs" },
                  ],
                },
              ],
            },
          ],
          backgroundColor: isSuccess ? "#27ae60" : "#f39c12",
          paddingAll: "18px",
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
                  type: "box",
                  layout: "vertical",
                  flex: 1,
                  contents: [
                    { type: "text", text: "👥 ผู้รับ", size: "xxs", color: "#888888", align: "center" },
                    { type: "text", text: `${successCount}`, weight: "bold", size: "xxl", align: "center", color: "#27ae60" },
                    { type: "text", text: "คน", size: "xs", color: "#888888", align: "center" },
                  ],
                  backgroundColor: "#e8f5e9",
                  cornerRadius: "8px",
                  paddingAll: "15px",
                },
                { type: "separator", color: "#ffffff00", margin: "sm" },
                {
                  type: "box",
                  layout: "vertical",
                  flex: 1,
                  contents: [
                    { type: "text", text: "❌ ส่งไม่สำเร็จ", size: "xxs", color: "#888888", align: "center" },
                    { type: "text", text: `${failedCount}`, weight: "bold", size: "xxl", align: "center", color: failedCount > 0 ? "#e74c3c" : "#888888" },
                    { type: "text", text: "คน", size: "xs", color: "#888888", align: "center" },
                  ],
                  backgroundColor: failedCount > 0 ? "#ffebee" : "#f5f5f5",
                  cornerRadius: "8px",
                  paddingAll: "15px",
                },
              ],
            },
            { type: "separator", color: "#eeeeee", margin: "lg" },
            { type: "text", text: "📝 ข้อความที่ส่ง:", size: "xs", color: "#888888", margin: "md" },
            {
              type: "text",
              text: `"${message.length > 100 ? message.substring(0, 100) + "..." : message}"`,
              wrap: true,
              size: "sm",
              color: "#666666",
              margin: "sm",
              style: "italic",
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
              action: { type: "message", text: `${orgCode}/summary` },
              style: "secondary",
              height: "sm",
            },
          ],
          paddingAll: "15px",
        },
      },
    };
  } catch (error) {
    console.error("Error creating broadcast result message:", error);
    return null;
  }
};

/**
 * 🏢 สร้าง Flex Message แนะนำระบบ Organization Code
 */
const createOrgCodeGuideMessage = () => {
  try {
    return {
      type: "flex",
      altText: "🏢 แนะนำระบบรหัสองค์กร (Organization Code)",
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
                { type: "text", text: "🏢", size: "xl", flex: 0 },
                {
                  type: "box",
                  layout: "vertical",
                  margin: "md",
                  flex: 1,
                  contents: [
                    { type: "text", text: "ระบบรหัสองค์กร", weight: "bold", color: "#ffffff", size: "lg" },
                    { type: "text", text: "Organization Code System", color: "#ffffff99", size: "xs" },
                  ],
                },
                {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    { type: "text", text: "NEW", size: "xs", color: "#ffffff", align: "center", weight: "bold" },
                  ],
                  backgroundColor: "#ff5722",
                  cornerRadius: "10px",
                  paddingAll: "5px",
                  flex: 0,
                },
              ],
            },
          ],
          backgroundColor: "#5e35b1",
          paddingAll: "20px",
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            { type: "text", text: "ทำงานร่วมกันเป็นทีมได้ง่ายขึ้น!", weight: "bold", size: "md", color: "#333333" },
            { type: "text", text: "ไม่ต้องสร้างกลุ่ม LINE ใหม่ ใช้รหัสองค์กรนำหน้าคำสั่ง", size: "sm", color: "#666666", wrap: true, margin: "sm" },
            { type: "separator", color: "#eeeeee", margin: "lg" },
            // How to use
            { type: "text", text: "📖 วิธีใช้งาน", weight: "bold", size: "sm", margin: "lg", color: "#1e88e5" },
            // Command examples
            {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    { type: "text", text: "👷", size: "sm", flex: 0 },
                    {
                      type: "box",
                      layout: "vertical",
                      flex: 1,
                      margin: "sm",
                      contents: [
                        { type: "text", text: "พนักงานส่งรายงาน", weight: "bold", size: "xs" },
                        { type: "text", text: "KCTLINE01/report shift=เช้า ...", size: "xs", color: "#5e35b1", wrap: true },
                      ],
                    },
                  ],
                  paddingAll: "8px",
                  backgroundColor: "#f3e5f5",
                  cornerRadius: "6px",
                },
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    { type: "text", text: "👨‍🔧", size: "sm", flex: 0 },
                    {
                      type: "box",
                      layout: "vertical",
                      flex: 1,
                      margin: "sm",
                      contents: [
                        { type: "text", text: "หัวหน้าเช็คยอด", weight: "bold", size: "xs" },
                        { type: "text", text: "KCTLINE01/summary", size: "xs", color: "#5e35b1" },
                      ],
                    },
                  ],
                  paddingAll: "8px",
                  backgroundColor: "#ede7f6",
                  cornerRadius: "6px",
                  margin: "sm",
                },
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    { type: "text", text: "📢", size: "sm", flex: 0 },
                    {
                      type: "box",
                      layout: "vertical",
                      flex: 1,
                      margin: "sm",
                      contents: [
                        { type: "text", text: "ประกาศข่าวสาร", weight: "bold", size: "xs" },
                        { type: "text", text: "KCTLINE01/announce พรุ่งนี้ประชุม", size: "xs", color: "#5e35b1", wrap: true },
                      ],
                    },
                  ],
                  paddingAll: "8px",
                  backgroundColor: "#f3e5f5",
                  cornerRadius: "6px",
                  margin: "sm",
                },
              ],
              margin: "md",
            },
            { type: "separator", color: "#eeeeee", margin: "lg" },
            // Benefits
            { type: "text", text: "✨ ข้อดี", weight: "bold", size: "sm", margin: "md", color: "#27ae60" },
            {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "text", text: "• ข้อมูลรวมที่เดียว ไม่ว่าส่งจากที่ไหน", size: "xs", color: "#666666" },
                { type: "text", text: "• ไม่ต้องเชิญคนเข้ากลุ่มไลน์ใหม่", size: "xs", color: "#666666", margin: "xs" },
                { type: "text", text: "• หัวหน้าดูสรุปทีมได้ทุกที่ทุกเวลา", size: "xs", color: "#666666", margin: "xs" },
                { type: "text", text: "• ส่งประกาศถึงทีมได้ทันที", size: "xs", color: "#666666", margin: "xs" },
              ],
              margin: "sm",
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
              action: { type: "message", text: "สนใจสมัครแบบทีม" },
              style: "primary",
              height: "sm",
              color: "#5e35b1",
            },
            { type: "text", text: "🏢 Team Pack เริ่มต้น 399฿/เดือน (5 คน)", size: "xxs", color: "#888888", align: "center", margin: "sm" },
          ],
          paddingAll: "15px",
        },
      },
    };
  } catch (error) {
    console.error("Error creating org code guide message:", error);
    return null;
  }
};

/**
 * ✅ สร้าง Flex Message ยืนยันการส่งรายงานสำเร็จ (Quick Confirmation)
 */
const createReportSuccessQuickMessage = (verificationCode, moldName, efficiency) => {
  try {
    const effIcon = efficiency >= 95 ? "🏆" : efficiency >= 90 ? "✅" : efficiency >= 80 ? "⚠️" : "🔴";
    const effColor = efficiency >= 95 ? "#27ae60" : efficiency >= 90 ? "#06c755" : efficiency >= 80 ? "#f39c12" : "#e74c3c";

    return {
      type: "flex",
      altText: `✅ บันทึกสำเร็จ | ${moldName} | ${efficiency}%`,
      contents: {
        type: "bubble",
        size: "kilo",
        body: {
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "box",
              layout: "vertical",
              flex: 0,
              contents: [
                { type: "text", text: "✅", size: "xxl" },
              ],
              justifyContent: "center",
            },
            {
              type: "box",
              layout: "vertical",
              flex: 1,
              margin: "lg",
              contents: [
                { type: "text", text: "บันทึกสำเร็จ!", weight: "bold", size: "md" },
                { type: "text", text: `🆔 Ref: ${verificationCode}`, size: "xs", color: "#1e88e5", margin: "xs" },
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    { type: "text", text: `🏭 ${moldName}`, size: "xs", color: "#666666", flex: 1 },
                    { type: "text", text: `${effIcon} ${efficiency}%`, size: "xs", color: effColor, weight: "bold", align: "end" },
                  ],
                  margin: "sm",
                },
              ],
            },
          ],
          paddingAll: "15px",
          backgroundColor: "#e8f5e9",
          cornerRadius: "12px",
        },
      },
    };
  } catch (error) {
    console.error("Error creating quick success message:", error);
    return null;
  }
};

/**
 * 💳 PAYMENT INSTRUCTION FLEX MESSAGE
 * สำหรับแสดงข้อมูลการโอนเงินหลังเลือกแพ็คเกจ
 */
const createPaymentInstructionMessage = (packageName, price, isTeam = false) => {
  try {
    const bankAccount = "526-2-10038-5";
    const bankName = "กสิกรไทย";
    const accountName = "นายวิทยา พงษ์สำราญ";

    // สร้าง steps ตาม package type
    const steps = [
      { num: "1", text: "📸 ส่งสลิปการโอน (รูปภาพ)", color: "#059669" },
      { num: "2", text: "📧 พิมพ์ Email ของคุณส่งมา", color: "#0891b2" },
    ];

    if (isTeam) {
      steps.push({ num: "3", text: "🏢 ชื่อทีม/รหัสองค์กร (เช่น KCT2024)", color: "#7c3aed" });
    }

    return {
      type: "flex",
      altText: `✅ เลือกแพ็คเกจ: ${packageName} | โอนเงิน ${price} บาท`,
      contents: {
        type: "bubble",
        size: "mega",
        header: {
          type: "box",
          layout: "vertical",
          backgroundColor: "#10b981",
          paddingAll: "20px",
          contents: [
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "text",
                  text: "✅",
                  size: "xxl",
                  flex: 0,
                },
                {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {
                      type: "text",
                      text: "เลือกแพ็คเกจสำเร็จ",
                      weight: "bold",
                      color: "#ffffff",
                      size: "lg",
                    },
                    {
                      type: "text",
                      text: packageName,
                      color: "#d1fae5",
                      size: "sm",
                      margin: "xs",
                    },
                  ],
                  margin: "lg",
                },
              ],
            },
          ],
        },
        body: {
          type: "box",
          layout: "vertical",
          spacing: "lg",
          paddingAll: "20px",
          contents: [
            // 💳 ส่วนข้อมูลการโอนเงิน
            {
              type: "box",
              layout: "vertical",
              backgroundColor: "#f0fdf4",
              cornerRadius: "12px",
              paddingAll: "15px",
              contents: [
                {
                  type: "text",
                  text: "💳 ข้อมูลการโอนเงิน",
                  weight: "bold",
                  size: "md",
                  color: "#166534",
                },
                {
                  type: "separator",
                  margin: "md",
                  color: "#bbf7d0",
                },
                // ธนาคาร
                {
                  type: "box",
                  layout: "horizontal",
                  margin: "lg",
                  contents: [
                    {
                      type: "text",
                      text: "🏦 ธนาคาร",
                      size: "sm",
                      color: "#6b7280",
                      flex: 3,
                    },
                    {
                      type: "text",
                      text: bankName,
                      size: "sm",
                      color: "#1f2937",
                      weight: "bold",
                      flex: 4,
                      align: "end",
                    },
                  ],
                },
                // เลขบัญชี - กดคัดลอกได้
                {
                  type: "box",
                  layout: "horizontal",
                  margin: "md",
                  contents: [
                    {
                      type: "text",
                      text: "🔢 เลขบัญชี",
                      size: "sm",
                      color: "#6b7280",
                      flex: 3,
                    },
                    {
                      type: "text",
                      text: bankAccount,
                      size: "md",
                      color: "#059669",
                      weight: "bold",
                      flex: 4,
                      align: "end",
                      action: {
                        type: "clipboard",
                        clipboardText: bankAccount.replace(/-/g, ""),
                      },
                      decoration: "underline",
                    },
                  ],
                },
                // ชื่อบัญชี
                {
                  type: "box",
                  layout: "horizontal",
                  margin: "md",
                  contents: [
                    {
                      type: "text",
                      text: "👤 ชื่อบัญชี",
                      size: "sm",
                      color: "#6b7280",
                      flex: 3,
                    },
                    {
                      type: "text",
                      text: accountName,
                      size: "sm",
                      color: "#1f2937",
                      weight: "bold",
                      flex: 4,
                      align: "end",
                    },
                  ],
                },
                // จำนวนเงิน
                {
                  type: "box",
                  layout: "horizontal",
                  margin: "md",
                  backgroundColor: "#dcfce7",
                  cornerRadius: "8px",
                  paddingAll: "10px",
                  contents: [
                    {
                      type: "text",
                      text: "💰 จำนวน",
                      size: "md",
                      color: "#166534",
                      weight: "bold",
                      flex: 3,
                    },
                    {
                      type: "text",
                      text: `${price} บาท`,
                      size: "xl",
                      color: "#059669",
                      weight: "bold",
                      flex: 4,
                      align: "end",
                    },
                  ],
                },
                // ปุ่มคัดลอกเลขบัญชี
                {
                  type: "button",
                  style: "secondary",
                  margin: "lg",
                  height: "sm",
                  action: {
                    type: "clipboard",
                    label: "📋 คัดลอกเลขบัญชี",
                    clipboardText: bankAccount.replace(/-/g, ""),
                  },
                },
              ],
            },
            // 📝 ขั้นตอนหลังโอนเงิน
            {
              type: "box",
              layout: "vertical",
              backgroundColor: "#f8fafc",
              cornerRadius: "12px",
              paddingAll: "15px",
              contents: [
                {
                  type: "text",
                  text: "📝 หลังโอนเงินแล้ว กรุณาส่ง:",
                  weight: "bold",
                  size: "sm",
                  color: "#1f2937",
                },
                {
                  type: "separator",
                  margin: "md",
                  color: "#e2e8f0",
                },
                ...steps.map((step, index) => ({
                  type: "box",
                  layout: "horizontal",
                  margin: index === 0 ? "lg" : "md",
                  contents: [
                    {
                      type: "box",
                      layout: "vertical",
                      width: "24px",
                      height: "24px",
                      backgroundColor: step.color,
                      cornerRadius: "12px",
                      contents: [
                        {
                          type: "text",
                          text: step.num,
                          size: "xs",
                          color: "#ffffff",
                          weight: "bold",
                          align: "center",
                        },
                      ],
                      justifyContent: "center",
                      alignItems: "center",
                      flex: 0,
                    },
                    {
                      type: "text",
                      text: step.text,
                      size: "sm",
                      color: "#374151",
                      margin: "md",
                      flex: 1,
                    },
                  ],
                  alignItems: "center",
                })),
              ],
            },
          ],
        },
        footer: {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          paddingAll: "15px",
          backgroundColor: "#fefce8",
          contents: [
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "text",
                  text: "⏱️",
                  size: "sm",
                  flex: 0,
                },
                {
                  type: "text",
                  text: "แอดมินจะเปิดสิทธิ์ภายใน 24 ชม.",
                  size: "sm",
                  color: "#854d0e",
                  weight: "bold",
                  margin: "sm",
                },
              ],
            },
            {
              type: "text",
              text: "หากมีข้อสงสัย กรุณาติดต่อ Admin",
              size: "xs",
              color: "#a16207",
              margin: "sm",
            },
          ],
        },
        styles: {
          header: {
            separator: false,
          },
        },
      },
    };
  } catch (error) {
    console.error("Error creating payment instruction message:", error);
    return null;
  }
};

/**
 * 📧 EMAIL CONFIRMATION FLEX MESSAGE
 * สำหรับยืนยันการบันทึก Email
 */
const createEmailConfirmationMessage = (email) => {
  try {
    return {
      type: "flex",
      altText: `✅ บันทึก Email แล้ว: ${email}`,
      contents: {
        type: "bubble",
        size: "kilo",
        body: {
          type: "box",
          layout: "vertical",
          paddingAll: "20px",
          backgroundColor: "#ecfdf5",
          contents: [
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "text",
                  text: "✅",
                  size: "xxl",
                  flex: 0,
                },
                {
                  type: "box",
                  layout: "vertical",
                  margin: "lg",
                  contents: [
                    {
                      type: "text",
                      text: "บันทึก Email แล้ว!",
                      weight: "bold",
                      size: "md",
                      color: "#166534",
                    },
                    {
                      type: "text",
                      text: email,
                      size: "sm",
                      color: "#059669",
                      margin: "xs",
                      wrap: true,
                    },
                  ],
                },
              ],
            },
            {
              type: "separator",
              margin: "lg",
              color: "#bbf7d0",
            },
            {
              type: "box",
              layout: "horizontal",
              margin: "lg",
              contents: [
                {
                  type: "text",
                  text: "📸",
                  size: "lg",
                  flex: 0,
                },
                {
                  type: "box",
                  layout: "vertical",
                  margin: "md",
                  contents: [
                    {
                      type: "text",
                      text: "ขั้นตอนถัดไป",
                      weight: "bold",
                      size: "sm",
                      color: "#1f2937",
                    },
                    {
                      type: "text",
                      text: "กรุณาส่งสลิปการโอนเงิน",
                      size: "xs",
                      color: "#6b7280",
                      margin: "xs",
                    },
                    {
                      type: "text",
                      text: "(ส่งเป็นรูปภาพ)",
                      size: "xs",
                      color: "#9ca3af",
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    };
  } catch (error) {
    console.error("Error creating email confirmation message:", error);
    return null;
  }
};

// =====================================================
// 💰 ACCOUNTING GUIDE FLEX MESSAGE - WOW Experience
// =====================================================

/**
 * 💰 CREATE ACCOUNTING GUIDE MESSAGE v1.0
 * แสดงวิธีใช้ระบบบัญชีแบบว้าว - Interactive & Easy to use
 */
const createAccountingGuideMessage = () => {
  try {
    return {
      type: "flex",
      altText: "💰 วิธีใช้บัญชี WiT - จดบัญชีง่ายแค่พิมพ์ภาษาไทย!",
      contents: {
        type: "carousel",
        contents: [
          // ==========================================
          // 🎯 BUBBLE 1: Welcome & Overview
          // ==========================================
          {
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
                      type: "box",
                      layout: "vertical",
                      contents: [
                        { type: "text", text: "💰", size: "3xl", align: "center" },
                      ],
                      width: "60px",
                      height: "60px",
                      backgroundColor: "#ffffff33",
                      cornerRadius: "30px",
                      justifyContent: "center",
                      alignItems: "center",
                    },
                    {
                      type: "box",
                      layout: "vertical",
                      margin: "lg",
                      contents: [
                        { type: "text", text: "บัญชี WiT", weight: "bold", color: "#ffffff", size: "xl" },
                        { type: "text", text: "จดบัญชีง่าย แค่พิมพ์ไทย!", color: "#FFD700", size: "sm", weight: "bold" },
                      ],
                    },
                  ],
                  alignItems: "center",
                },
                {
                  type: "box",
                  layout: "horizontal",
                  margin: "lg",
                  contents: [
                    {
                      type: "box",
                      layout: "vertical",
                      contents: [
                        { type: "text", text: "🆓", size: "md", align: "center" },
                        { type: "text", text: "ฟรี!", size: "xxs", color: "#ffffff", align: "center" },
                      ],
                      flex: 1,
                    },
                    {
                      type: "box",
                      layout: "vertical",
                      contents: [
                        { type: "text", text: "⚡", size: "md", align: "center" },
                        { type: "text", text: "ทันที", size: "xxs", color: "#ffffff", align: "center" },
                      ],
                      flex: 1,
                    },
                    {
                      type: "box",
                      layout: "vertical",
                      contents: [
                        { type: "text", text: "☁️", size: "md", align: "center" },
                        { type: "text", text: "Cloud", size: "xxs", color: "#ffffff", align: "center" },
                      ],
                      flex: 1,
                    },
                    {
                      type: "box",
                      layout: "vertical",
                      contents: [
                        { type: "text", text: "📊", size: "md", align: "center" },
                        { type: "text", text: "สรุปอัตโนมัติ", size: "xxs", color: "#ffffff", align: "center" },
                      ],
                      flex: 1,
                    },
                  ],
                  backgroundColor: "#ffffff22",
                  cornerRadius: "12px",
                  paddingAll: "10px",
                },
              ],
              backgroundColor: "#F57C00",
              paddingAll: "20px",
            },
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "text", text: "✨ ทำไมต้องใช้บัญชี WiT?", weight: "bold", size: "md", color: "#333333" },
                {
                  type: "box",
                  layout: "vertical",
                  margin: "lg",
                  spacing: "md",
                  contents: [
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        { type: "text", text: "✅", size: "md", flex: 0 },
                        { type: "text", text: "ไม่ต้องเรียนรู้แอปใหม่", size: "sm", color: "#666666", margin: "md", flex: 1 },
                      ],
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        { type: "text", text: "✅", size: "md", flex: 0 },
                        { type: "text", text: "พิมพ์ภาษาไทยธรรมดา = จดบัญชี", size: "sm", color: "#666666", margin: "md", flex: 1 },
                      ],
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        { type: "text", text: "✅", size: "md", flex: 0 },
                        { type: "text", text: "AI เข้าใจและจัดหมวดหมู่ให้", size: "sm", color: "#666666", margin: "md", flex: 1 },
                      ],
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        { type: "text", text: "✅", size: "md", flex: 0 },
                        { type: "text", text: "ดูสรุปรายรับ-รายจ่ายได้ทันที", size: "sm", color: "#666666", margin: "md", flex: 1 },
                      ],
                    },
                  ],
                },
                { type: "separator", margin: "lg" },
                {
                  type: "text",
                  text: "👉 เลื่อนดูวิธีใช้งาน →",
                  size: "sm",
                  color: "#F57C00",
                  align: "center",
                  margin: "lg",
                  weight: "bold",
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
                  style: "primary",
                  color: "#F57C00",
                  action: { type: "message", label: "🚀 เริ่มใช้งานเลย!", text: "ขายมะม่วง 50 กก. 1500 บาท" },
                },
              ],
              paddingAll: "12px",
            },
          },
          // ==========================================
          // 📝 BUBBLE 2: บันทึกรายรับ
          // ==========================================
          {
            type: "bubble",
            size: "mega",
            header: {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "text", text: "📈 บันทึกรายรับ", weight: "bold", color: "#ffffff", size: "lg" },
                { type: "text", text: "พิมพ์แบบนี้เลย!", color: "#ffffffcc", size: "sm" },
              ],
              backgroundColor: "#27ae60",
              paddingAll: "20px",
            },
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "text", text: "💬 ตัวอย่างการพิมพ์:", weight: "bold", size: "sm", color: "#333333" },
                {
                  type: "box",
                  layout: "vertical",
                  margin: "md",
                  spacing: "sm",
                  contents: [
                    {
                      type: "box",
                      layout: "vertical",
                      backgroundColor: "#e8f5e9",
                      cornerRadius: "8px",
                      paddingAll: "12px",
                      contents: [
                        { type: "text", text: "\"ขายทุเรียน 100 กก. 15000\"", size: "sm", color: "#27ae60", weight: "bold" },
                        { type: "text", text: "→ รายรับ: ทุเรียน 15,000฿", size: "xs", color: "#666666", margin: "xs" },
                      ],
                    },
                    {
                      type: "box",
                      layout: "vertical",
                      backgroundColor: "#e8f5e9",
                      cornerRadius: "8px",
                      paddingAll: "12px",
                      contents: [
                        { type: "text", text: "\"รับเงินค่าจ้าง 5000\"", size: "sm", color: "#27ae60", weight: "bold" },
                        { type: "text", text: "→ รายรับ: ค่าจ้าง 5,000฿", size: "xs", color: "#666666", margin: "xs" },
                      ],
                    },
                    {
                      type: "box",
                      layout: "vertical",
                      backgroundColor: "#e8f5e9",
                      cornerRadius: "8px",
                      paddingAll: "12px",
                      contents: [
                        { type: "text", text: "\"ลูกค้าโอนมา 3500\"", size: "sm", color: "#27ae60", weight: "bold" },
                        { type: "text", text: "→ รายรับ: รับโอน 3,500฿", size: "xs", color: "#666666", margin: "xs" },
                      ],
                    },
                  ],
                },
                { type: "separator", margin: "lg" },
                {
                  type: "box",
                  layout: "horizontal",
                  margin: "md",
                  contents: [
                    { type: "text", text: "💡", size: "sm", flex: 0 },
                    { type: "text", text: "คำว่า ขาย, รับ, โอนมา = รายรับ", size: "xs", color: "#888888", margin: "sm", flex: 1, wrap: true },
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
                  color: "#27ae60",
                  action: { type: "message", label: "📈 ลองบันทึกรายรับ", text: "ขายผัก 200 บาท" },
                },
              ],
              paddingAll: "12px",
            },
          },
          // ==========================================
          // 📝 BUBBLE 3: บันทึกรายจ่าย
          // ==========================================
          {
            type: "bubble",
            size: "mega",
            header: {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "text", text: "📉 บันทึกรายจ่าย", weight: "bold", color: "#ffffff", size: "lg" },
                { type: "text", text: "พิมพ์แบบนี้เลย!", color: "#ffffffcc", size: "sm" },
              ],
              backgroundColor: "#e74c3c",
              paddingAll: "20px",
            },
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "text", text: "💬 ตัวอย่างการพิมพ์:", weight: "bold", size: "sm", color: "#333333" },
                {
                  type: "box",
                  layout: "vertical",
                  margin: "md",
                  spacing: "sm",
                  contents: [
                    {
                      type: "box",
                      layout: "vertical",
                      backgroundColor: "#ffebee",
                      cornerRadius: "8px",
                      paddingAll: "12px",
                      contents: [
                        { type: "text", text: "\"ซื้อปุ๋ย 2 กระสอบ 1200\"", size: "sm", color: "#e74c3c", weight: "bold" },
                        { type: "text", text: "→ รายจ่าย: ปุ๋ย 1,200฿", size: "xs", color: "#666666", margin: "xs" },
                      ],
                    },
                    {
                      type: "box",
                      layout: "vertical",
                      backgroundColor: "#ffebee",
                      cornerRadius: "8px",
                      paddingAll: "12px",
                      contents: [
                        { type: "text", text: "\"จ่ายค่าน้ำมัน 500\"", size: "sm", color: "#e74c3c", weight: "bold" },
                        { type: "text", text: "→ รายจ่าย: น้ำมัน 500฿", size: "xs", color: "#666666", margin: "xs" },
                      ],
                    },
                    {
                      type: "box",
                      layout: "vertical",
                      backgroundColor: "#ffebee",
                      cornerRadius: "8px",
                      paddingAll: "12px",
                      contents: [
                        { type: "text", text: "\"โอนค่าแรงคนงาน 3000\"", size: "sm", color: "#e74c3c", weight: "bold" },
                        { type: "text", text: "→ รายจ่าย: ค่าแรง 3,000฿", size: "xs", color: "#666666", margin: "xs" },
                      ],
                    },
                  ],
                },
                { type: "separator", margin: "lg" },
                {
                  type: "box",
                  layout: "horizontal",
                  margin: "md",
                  contents: [
                    { type: "text", text: "💡", size: "sm", flex: 0 },
                    { type: "text", text: "คำว่า ซื้อ, จ่าย, โอนไป = รายจ่าย", size: "xs", color: "#888888", margin: "sm", flex: 1, wrap: true },
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
                  color: "#e74c3c",
                  action: { type: "message", label: "📉 ลองบันทึกรายจ่าย", text: "ซื้อเมล็ดพันธุ์ 350 บาท" },
                },
              ],
              paddingAll: "12px",
            },
          },
          // ==========================================
          // 📊 BUBBLE 4: ดูสรุป & รายงาน
          // ==========================================
          {
            type: "bubble",
            size: "mega",
            header: {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "text", text: "📊 ดูสรุป & รายงาน", weight: "bold", color: "#ffffff", size: "lg" },
                { type: "text", text: "คำสั่งพิเศษ", color: "#ffffffcc", size: "sm" },
              ],
              backgroundColor: "#3498db",
              paddingAll: "20px",
            },
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "text", text: "🎯 คำสั่งที่ใช้บ่อย:", weight: "bold", size: "sm", color: "#333333" },
                {
                  type: "box",
                  layout: "vertical",
                  margin: "md",
                  spacing: "sm",
                  contents: [
                    {
                      type: "box",
                      layout: "horizontal",
                      backgroundColor: "#e3f2fd",
                      cornerRadius: "8px",
                      paddingAll: "12px",
                      contents: [
                        { type: "text", text: "📊", size: "lg", flex: 0 },
                        {
                          type: "box",
                          layout: "vertical",
                          margin: "md",
                          flex: 1,
                          contents: [
                            { type: "text", text: "\"สรุปบัญชี\"", weight: "bold", size: "sm", color: "#1565c0" },
                            { type: "text", text: "ดูยอดรวมวันนี้", size: "xs", color: "#666666" },
                          ],
                        },
                      ],
                      action: { type: "message", text: "สรุปบัญชี" },
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      backgroundColor: "#e3f2fd",
                      cornerRadius: "8px",
                      paddingAll: "12px",
                      contents: [
                        { type: "text", text: "📅", size: "lg", flex: 0 },
                        {
                          type: "box",
                          layout: "vertical",
                          margin: "md",
                          flex: 1,
                          contents: [
                            { type: "text", text: "\"สรุปบัญชีเดือนนี้\"", weight: "bold", size: "sm", color: "#1565c0" },
                            { type: "text", text: "รายงานประจำเดือน", size: "xs", color: "#666666" },
                          ],
                        },
                      ],
                      action: { type: "message", text: "สรุปบัญชีเดือนนี้" },
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      backgroundColor: "#e3f2fd",
                      cornerRadius: "8px",
                      paddingAll: "12px",
                      contents: [
                        { type: "text", text: "📜", size: "lg", flex: 0 },
                        {
                          type: "box",
                          layout: "vertical",
                          margin: "md",
                          flex: 1,
                          contents: [
                            { type: "text", text: "\"ดูรายการบัญชี\"", weight: "bold", size: "sm", color: "#1565c0" },
                            { type: "text", text: "ดูรายการที่บันทึกไว้", size: "xs", color: "#666666" },
                          ],
                        },
                      ],
                      action: { type: "message", text: "ดูรายการบัญชี" },
                    },
                  ],
                },
                { type: "separator", margin: "lg" },
                {
                  type: "box",
                  layout: "horizontal",
                  margin: "md",
                  contents: [
                    { type: "text", text: "💡", size: "sm", flex: 0 },
                    { type: "text", text: "กดที่กล่องด้านบนได้เลย!", size: "xs", color: "#888888", margin: "sm", flex: 1 },
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
                  color: "#3498db",
                  action: { type: "message", label: "📊 ดูสรุปบัญชีตอนนี้", text: "สรุปบัญชี" },
                },
              ],
              paddingAll: "12px",
            },
          },
          // ==========================================
          // 🎁 BUBBLE 5: Tips & Tricks
          // ==========================================
          {
            type: "bubble",
            size: "mega",
            header: {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "text", text: "🎁 เคล็ดลับการใช้งาน", weight: "bold", color: "#ffffff", size: "lg" },
                { type: "text", text: "ใช้งานให้เต็มประสิทธิภาพ", color: "#ffffffcc", size: "sm" },
              ],
              backgroundColor: "#9b59b6",
              paddingAll: "20px",
            },
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "box",
                  layout: "vertical",
                  spacing: "md",
                  contents: [
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        { type: "text", text: "1️⃣", size: "md", flex: 0 },
                        {
                          type: "box",
                          layout: "vertical",
                          margin: "md",
                          flex: 1,
                          contents: [
                            { type: "text", text: "ระบุจำนวนเงินชัดเจน", weight: "bold", size: "sm", color: "#333333" },
                            { type: "text", text: "เช่น 1500 หรือ 1,500 บาท", size: "xs", color: "#888888", wrap: true },
                          ],
                        },
                      ],
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        { type: "text", text: "2️⃣", size: "md", flex: 0 },
                        {
                          type: "box",
                          layout: "vertical",
                          margin: "md",
                          flex: 1,
                          contents: [
                            { type: "text", text: "บอกรายละเอียดสินค้า", weight: "bold", size: "sm", color: "#333333" },
                            { type: "text", text: "ช่วยให้สรุปหมวดหมู่ได้ดี", size: "xs", color: "#888888", wrap: true },
                          ],
                        },
                      ],
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        { type: "text", text: "3️⃣", size: "md", flex: 0 },
                        {
                          type: "box",
                          layout: "vertical",
                          margin: "md",
                          flex: 1,
                          contents: [
                            { type: "text", text: "บันทึกทันทีที่ทำรายการ", weight: "bold", size: "sm", color: "#333333" },
                            { type: "text", text: "ไม่ลืม ไม่ตกหล่น", size: "xs", color: "#888888", wrap: true },
                          ],
                        },
                      ],
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        { type: "text", text: "4️⃣", size: "md", flex: 0 },
                        {
                          type: "box",
                          layout: "vertical",
                          margin: "md",
                          flex: 1,
                          contents: [
                            { type: "text", text: "ดูสรุปเป็นประจำ", weight: "bold", size: "sm", color: "#333333" },
                            { type: "text", text: "รู้สถานะการเงินตลอดเวลา", size: "xs", color: "#888888", wrap: true },
                          ],
                        },
                      ],
                    },
                  ],
                },
                { type: "separator", margin: "lg" },
                {
                  type: "box",
                  layout: "vertical",
                  margin: "md",
                  backgroundColor: "#f3e5f5",
                  cornerRadius: "8px",
                  paddingAll: "10px",
                  contents: [
                    { type: "text", text: "🎯 เหมาะสำหรับ:", weight: "bold", size: "xs", color: "#9b59b6" },
                    { type: "text", text: "• เกษตรกร ชาวสวน ชาวไร่", size: "xs", color: "#666666" },
                    { type: "text", text: "• ร้านค้าปลีก ร้านขายของ", size: "xs", color: "#666666" },
                    { type: "text", text: "• Freelance รับงานอิสระ", size: "xs", color: "#666666" },
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
                  color: "#9b59b6",
                  action: { type: "message", label: "🚀 เริ่มจดบัญชีเลย!", text: "ขายของวันนี้ 2500 บาท" },
                },
                {
                  type: "box",
                  layout: "horizontal",
                  margin: "md",
                  justifyContent: "center",
                  contents: [
                    {
                      type: "box",
                      layout: "vertical",
                      contents: [
                        {
                          type: "image",
                          url: "https://raw.githubusercontent.com/wizxbiz/affiliatepro-docs/main/images/loog.png",
                          size: "full",
                          aspectMode: "cover",
                          aspectRatio: "1:1",
                        },
                      ],
                      width: "16px",
                      height: "16px",
                      cornerRadius: "8px",
                    },
                    { type: "text", text: "บัญชี WiT by อ.วิทยา", size: "xxs", color: "#aaaaaa", margin: "sm" },
                  ],
                },
              ],
              paddingAll: "12px",
            },
          },
        ],
      },
    };
  } catch (error) {
    console.error("Error creating accounting guide message:", error);
    return null;
  }
};

// =====================================================
// 🌡️ TEMPERATURE TABLE FLEX MESSAGE - Professional Edition
// =====================================================

/**
 * 🌡️ CREATE TEMPERATURE TABLE MESSAGE v2.0
 * ตารางอุณหภูมิวัสดุฉีดพลาสติกแบบครบถ้วน
 * - การฉีด (Barrel/Nozzle)
 * - อุณหภูมิแม่พิมพ์ (Mold Temp)
 * - การอบวัสดุ (Drying)
 * - Hot Runner
 * - วัสดุเพิ่มเติม: PPS, PVC, HDPE, LDPE
 */
const createTemperatureTableMessage = () => {
  try {
    return {
      type: "flex",
      altText: "🌡️ ตารางอุณหภูมิวัสดุฉีดพลาสติก - WiT Professional",
      contents: {
        type: "carousel",
        contents: [
          // ==========================================
          // 🎯 BUBBLE 1: Overview & Quick Reference
          // ==========================================
          {
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
                      type: "box",
                      layout: "vertical",
                      contents: [
                        { type: "text", text: "🌡️", size: "3xl", align: "center" },
                      ],
                      width: "60px",
                      height: "60px",
                      backgroundColor: "#ffffff33",
                      cornerRadius: "30px",
                      justifyContent: "center",
                      alignItems: "center",
                    },
                    {
                      type: "box",
                      layout: "vertical",
                      margin: "lg",
                      contents: [
                        { type: "text", text: "Temperature Guide", weight: "bold", color: "#ffffff", size: "lg" },
                        { type: "text", text: "ตารางอุณหภูมิฉีดพลาสติก", color: "#FFD700", size: "sm", weight: "bold" },
                      ],
                    },
                  ],
                  alignItems: "center",
                },
                {
                  type: "box",
                  layout: "horizontal",
                  margin: "lg",
                  contents: [
                    { type: "box", layout: "vertical", flex: 1, contents: [{ type: "text", text: "🔥", size: "md", align: "center" }, { type: "text", text: "Barrel", size: "xxs", color: "#ffffff", align: "center" }] },
                    { type: "box", layout: "vertical", flex: 1, contents: [{ type: "text", text: "🎯", size: "md", align: "center" }, { type: "text", text: "Mold", size: "xxs", color: "#ffffff", align: "center" }] },
                    { type: "box", layout: "vertical", flex: 1, contents: [{ type: "text", text: "💨", size: "md", align: "center" }, { type: "text", text: "Drying", size: "xxs", color: "#ffffff", align: "center" }] },
                    { type: "box", layout: "vertical", flex: 1, contents: [{ type: "text", text: "🔴", size: "md", align: "center" }, { type: "text", text: "HotRunner", size: "xxs", color: "#ffffff", align: "center" }] },
                  ],
                  backgroundColor: "#ffffff22",
                  cornerRadius: "12px",
                  paddingAll: "10px",
                },
              ],
              backgroundColor: "#d84315",
              paddingAll: "20px",
            },
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "text", text: "📊 วัสดุยอดนิยม (Quick View)", weight: "bold", size: "md", color: "#333333" },
                {
                  type: "box",
                  layout: "vertical",
                  margin: "md",
                  spacing: "sm",
                  contents: [
                    {
                      type: "box",
                      layout: "horizontal",
                      backgroundColor: "#fff3e0",
                      cornerRadius: "8px",
                      paddingAll: "10px",
                      contents: [
                        { type: "text", text: "PP", weight: "bold", size: "sm", color: "#d84315", flex: 2 },
                        { type: "text", text: "200-280°C", size: "xs", color: "#666666", flex: 3, align: "center" },
                        { type: "text", text: "40-80°C", size: "xs", color: "#666666", flex: 2, align: "end" },
                      ],
                      action: { type: "message", text: "อุณหภูมิ PP แบบละเอียด" },
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      backgroundColor: "#e3f2fd",
                      cornerRadius: "8px",
                      paddingAll: "10px",
                      contents: [
                        { type: "text", text: "ABS", weight: "bold", size: "sm", color: "#1565c0", flex: 2 },
                        { type: "text", text: "210-270°C", size: "xs", color: "#666666", flex: 3, align: "center" },
                        { type: "text", text: "50-80°C", size: "xs", color: "#666666", flex: 2, align: "end" },
                      ],
                      action: { type: "message", text: "อุณหภูมิ ABS แบบละเอียด" },
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      backgroundColor: "#e8f5e9",
                      cornerRadius: "8px",
                      paddingAll: "10px",
                      contents: [
                        { type: "text", text: "PC", weight: "bold", size: "sm", color: "#2e7d32", flex: 2 },
                        { type: "text", text: "280-320°C", size: "xs", color: "#666666", flex: 3, align: "center" },
                        { type: "text", text: "80-120°C", size: "xs", color: "#666666", flex: 2, align: "end" },
                      ],
                      action: { type: "message", text: "อุณหภูมิ PC แบบละเอียด" },
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      backgroundColor: "#fce4ec",
                      cornerRadius: "8px",
                      paddingAll: "10px",
                      contents: [
                        { type: "text", text: "PA6", weight: "bold", size: "sm", color: "#c2185b", flex: 2 },
                        { type: "text", text: "230-290°C", size: "xs", color: "#666666", flex: 3, align: "center" },
                        { type: "text", text: "60-90°C", size: "xs", color: "#666666", flex: 2, align: "end" },
                      ],
                      action: { type: "message", text: "อุณหภูมิ Nylon แบบละเอียด" },
                    },
                  ],
                },
                { type: "separator", margin: "lg" },
                {
                  type: "box",
                  layout: "horizontal",
                  margin: "md",
                  contents: [
                    { type: "text", text: "💡", size: "sm", flex: 0 },
                    { type: "text", text: "เลื่อนดูวัสดุเพิ่มเติม →", size: "xs", color: "#d84315", margin: "sm", flex: 1, weight: "bold" },
                  ],
                },
              ],
              paddingAll: "16px",
            },
            footer: {
              type: "box",
              layout: "horizontal",
              spacing: "sm",
              contents: [
                { type: "button", style: "primary", color: "#d84315", flex: 1, action: { type: "message", label: "🔥 การอบวัสดุ", text: "วิธีอบวัสดุพลาสติก" } },
                { type: "button", style: "secondary", flex: 1, action: { type: "message", label: "🔴 Hot Runner", text: "อุณหภูมิ Hot Runner" } },
              ],
              paddingAll: "12px",
            },
          },
          // ==========================================
          // 🔥 BUBBLE 2: Commodity Plastics (PP, PE, HDPE, LDPE, PVC)
          // ==========================================
          {
            type: "bubble",
            size: "mega",
            header: {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "text", text: "🔥 Commodity Plastics", weight: "bold", color: "#ffffff", size: "lg" },
                { type: "text", text: "PP | PE | HDPE | LDPE | PVC", color: "#ffffffcc", size: "sm" },
              ],
              backgroundColor: "#ff5722",
              paddingAll: "20px",
            },
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                // PP
                {
                  type: "box",
                  layout: "vertical",
                  backgroundColor: "#fff8e1",
                  cornerRadius: "12px",
                  paddingAll: "12px",
                  margin: "none",
                  contents: [
                    { type: "text", text: "🟠 PP (Polypropylene)", weight: "bold", size: "sm", color: "#e65100" },
                    {
                      type: "box",
                      layout: "horizontal",
                      margin: "sm",
                      contents: [
                        { type: "box", layout: "vertical", flex: 1, contents: [{ type: "text", text: "Barrel", size: "xxs", color: "#888888" }, { type: "text", text: "200-280°C", size: "xs", weight: "bold", color: "#333333" }] },
                        { type: "box", layout: "vertical", flex: 1, contents: [{ type: "text", text: "Mold", size: "xxs", color: "#888888" }, { type: "text", text: "40-80°C", size: "xs", weight: "bold", color: "#333333" }] },
                        { type: "box", layout: "vertical", flex: 1, contents: [{ type: "text", text: "Drying", size: "xxs", color: "#888888" }, { type: "text", text: "ไม่จำเป็น", size: "xs", weight: "bold", color: "#27ae60" }] },
                      ],
                    },
                  ],
                  action: { type: "message", text: "อุณหภูมิ PP แบบละเอียด" },
                },
                // HDPE
                {
                  type: "box",
                  layout: "vertical",
                  backgroundColor: "#e3f2fd",
                  cornerRadius: "12px",
                  paddingAll: "12px",
                  margin: "md",
                  contents: [
                    { type: "text", text: "🔵 HDPE (High Density PE)", weight: "bold", size: "sm", color: "#1565c0" },
                    {
                      type: "box",
                      layout: "horizontal",
                      margin: "sm",
                      contents: [
                        { type: "box", layout: "vertical", flex: 1, contents: [{ type: "text", text: "Barrel", size: "xxs", color: "#888888" }, { type: "text", text: "200-280°C", size: "xs", weight: "bold", color: "#333333" }] },
                        { type: "box", layout: "vertical", flex: 1, contents: [{ type: "text", text: "Mold", size: "xxs", color: "#888888" }, { type: "text", text: "20-60°C", size: "xs", weight: "bold", color: "#333333" }] },
                        { type: "box", layout: "vertical", flex: 1, contents: [{ type: "text", text: "Drying", size: "xxs", color: "#888888" }, { type: "text", text: "ไม่จำเป็น", size: "xs", weight: "bold", color: "#27ae60" }] },
                      ],
                    },
                  ],
                  action: { type: "message", text: "อุณหภูมิ HDPE แบบละเอียด" },
                },
                // LDPE
                {
                  type: "box",
                  layout: "vertical",
                  backgroundColor: "#e8f5e9",
                  cornerRadius: "12px",
                  paddingAll: "12px",
                  margin: "md",
                  contents: [
                    { type: "text", text: "🟢 LDPE (Low Density PE)", weight: "bold", size: "sm", color: "#2e7d32" },
                    {
                      type: "box",
                      layout: "horizontal",
                      margin: "sm",
                      contents: [
                        { type: "box", layout: "vertical", flex: 1, contents: [{ type: "text", text: "Barrel", size: "xxs", color: "#888888" }, { type: "text", text: "180-240°C", size: "xs", weight: "bold", color: "#333333" }] },
                        { type: "box", layout: "vertical", flex: 1, contents: [{ type: "text", text: "Mold", size: "xxs", color: "#888888" }, { type: "text", text: "20-50°C", size: "xs", weight: "bold", color: "#333333" }] },
                        { type: "box", layout: "vertical", flex: 1, contents: [{ type: "text", text: "Drying", size: "xxs", color: "#888888" }, { type: "text", text: "ไม่จำเป็น", size: "xs", weight: "bold", color: "#27ae60" }] },
                      ],
                    },
                  ],
                  action: { type: "message", text: "อุณหภูมิ LDPE แบบละเอียด" },
                },
                // PVC
                {
                  type: "box",
                  layout: "vertical",
                  backgroundColor: "#fce4ec",
                  cornerRadius: "12px",
                  paddingAll: "12px",
                  margin: "md",
                  contents: [
                    { type: "text", text: "🟣 PVC (Polyvinyl Chloride)", weight: "bold", size: "sm", color: "#c2185b" },
                    {
                      type: "box",
                      layout: "horizontal",
                      margin: "sm",
                      contents: [
                        { type: "box", layout: "vertical", flex: 1, contents: [{ type: "text", text: "Barrel", size: "xxs", color: "#888888" }, { type: "text", text: "160-200°C", size: "xs", weight: "bold", color: "#333333" }] },
                        { type: "box", layout: "vertical", flex: 1, contents: [{ type: "text", text: "Mold", size: "xxs", color: "#888888" }, { type: "text", text: "30-50°C", size: "xs", weight: "bold", color: "#333333" }] },
                        { type: "box", layout: "vertical", flex: 1, contents: [{ type: "text", text: "Drying", size: "xxs", color: "#888888" }, { type: "text", text: "70°C/2h", size: "xs", weight: "bold", color: "#e74c3c" }] },
                      ],
                    },
                    { type: "text", text: "⚠️ ระวัง: ไวต่อความร้อน อย่าให้เกิน 210°C", size: "xxs", color: "#e74c3c", margin: "sm", wrap: true },
                  ],
                  action: { type: "message", text: "อุณหภูมิ PVC แบบละเอียด" },
                },
              ],
              paddingAll: "16px",
              spacing: "none",
            },
            footer: {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "button", style: "primary", color: "#ff5722", action: { type: "message", label: "📋 ดู PE ทุกชนิด", text: "เปรียบเทียบ PE HDPE LDPE" } },
              ],
              paddingAll: "12px",
            },
          },
          // ==========================================
          // 🔧 BUBBLE 3: Engineering Plastics (ABS, PC, PA, POM)
          // ==========================================
          {
            type: "bubble",
            size: "mega",
            header: {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "text", text: "🔧 Engineering Plastics", weight: "bold", color: "#ffffff", size: "lg" },
                { type: "text", text: "ABS | PC | PA | POM | PBT", color: "#ffffffcc", size: "sm" },
              ],
              backgroundColor: "#1565c0",
              paddingAll: "20px",
            },
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                // ABS
                {
                  type: "box",
                  layout: "vertical",
                  backgroundColor: "#e3f2fd",
                  cornerRadius: "12px",
                  paddingAll: "12px",
                  margin: "none",
                  contents: [
                    { type: "text", text: "🔷 ABS", weight: "bold", size: "sm", color: "#1565c0" },
                    {
                      type: "box",
                      layout: "horizontal",
                      margin: "sm",
                      contents: [
                        { type: "box", layout: "vertical", flex: 1, contents: [{ type: "text", text: "Barrel", size: "xxs", color: "#888888" }, { type: "text", text: "210-270°C", size: "xs", weight: "bold", color: "#333333" }] },
                        { type: "box", layout: "vertical", flex: 1, contents: [{ type: "text", text: "Mold", size: "xxs", color: "#888888" }, { type: "text", text: "50-80°C", size: "xs", weight: "bold", color: "#333333" }] },
                        { type: "box", layout: "vertical", flex: 1, contents: [{ type: "text", text: "Drying", size: "xxs", color: "#888888" }, { type: "text", text: "80°C/2-4h", size: "xs", weight: "bold", color: "#e74c3c" }] },
                      ],
                    },
                  ],
                  action: { type: "message", text: "อุณหภูมิ ABS แบบละเอียด" },
                },
                // PC
                {
                  type: "box",
                  layout: "vertical",
                  backgroundColor: "#e8f5e9",
                  cornerRadius: "12px",
                  paddingAll: "12px",
                  margin: "md",
                  contents: [
                    { type: "text", text: "🟢 PC (Polycarbonate)", weight: "bold", size: "sm", color: "#2e7d32" },
                    {
                      type: "box",
                      layout: "horizontal",
                      margin: "sm",
                      contents: [
                        { type: "box", layout: "vertical", flex: 1, contents: [{ type: "text", text: "Barrel", size: "xxs", color: "#888888" }, { type: "text", text: "280-320°C", size: "xs", weight: "bold", color: "#333333" }] },
                        { type: "box", layout: "vertical", flex: 1, contents: [{ type: "text", text: "Mold", size: "xxs", color: "#888888" }, { type: "text", text: "80-120°C", size: "xs", weight: "bold", color: "#333333" }] },
                        { type: "box", layout: "vertical", flex: 1, contents: [{ type: "text", text: "Drying", size: "xxs", color: "#888888" }, { type: "text", text: "120°C/4h", size: "xs", weight: "bold", color: "#e74c3c" }] },
                      ],
                    },
                    { type: "text", text: "⚠️ ความชื้นต้อง < 0.02%", size: "xxs", color: "#e74c3c", margin: "sm" },
                  ],
                  action: { type: "message", text: "อุณหภูมิ PC แบบละเอียด" },
                },
                // PA6 (Nylon)
                {
                  type: "box",
                  layout: "vertical",
                  backgroundColor: "#fff3e0",
                  cornerRadius: "12px",
                  paddingAll: "12px",
                  margin: "md",
                  contents: [
                    { type: "text", text: "🟠 PA6 / PA66 (Nylon)", weight: "bold", size: "sm", color: "#e65100" },
                    {
                      type: "box",
                      layout: "horizontal",
                      margin: "sm",
                      contents: [
                        { type: "box", layout: "vertical", flex: 1, contents: [{ type: "text", text: "Barrel", size: "xxs", color: "#888888" }, { type: "text", text: "230-290°C", size: "xs", weight: "bold", color: "#333333" }] },
                        { type: "box", layout: "vertical", flex: 1, contents: [{ type: "text", text: "Mold", size: "xxs", color: "#888888" }, { type: "text", text: "60-90°C", size: "xs", weight: "bold", color: "#333333" }] },
                        { type: "box", layout: "vertical", flex: 1, contents: [{ type: "text", text: "Drying", size: "xxs", color: "#888888" }, { type: "text", text: "80°C/4-6h", size: "xs", weight: "bold", color: "#e74c3c" }] },
                      ],
                    },
                    { type: "text", text: "⚠️ ดูดความชื้นง่าย ต้องอบก่อนฉีด", size: "xxs", color: "#e74c3c", margin: "sm", wrap: true },
                  ],
                  action: { type: "message", text: "อุณหภูมิ Nylon แบบละเอียด" },
                },
                // POM
                {
                  type: "box",
                  layout: "vertical",
                  backgroundColor: "#fce4ec",
                  cornerRadius: "12px",
                  paddingAll: "12px",
                  margin: "md",
                  contents: [
                    { type: "text", text: "🟣 POM (Acetal)", weight: "bold", size: "sm", color: "#c2185b" },
                    {
                      type: "box",
                      layout: "horizontal",
                      margin: "sm",
                      contents: [
                        { type: "box", layout: "vertical", flex: 1, contents: [{ type: "text", text: "Barrel", size: "xxs", color: "#888888" }, { type: "text", text: "180-220°C", size: "xs", weight: "bold", color: "#333333" }] },
                        { type: "box", layout: "vertical", flex: 1, contents: [{ type: "text", text: "Mold", size: "xxs", color: "#888888" }, { type: "text", text: "60-90°C", size: "xs", weight: "bold", color: "#333333" }] },
                        { type: "box", layout: "vertical", flex: 1, contents: [{ type: "text", text: "Drying", size: "xxs", color: "#888888" }, { type: "text", text: "80°C/2-3h", size: "xs", weight: "bold", color: "#e74c3c" }] },
                      ],
                    },
                  ],
                  action: { type: "message", text: "อุณหภูมิ POM แบบละเอียด" },
                },
              ],
              paddingAll: "16px",
              spacing: "none",
            },
            footer: {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "button", style: "primary", color: "#1565c0", action: { type: "message", label: "📋 ดู PBT/PMMA", text: "อุณหภูมิ PBT PMMA" } },
              ],
              paddingAll: "12px",
            },
          },
          // ==========================================
          // ⚡ BUBBLE 4: High Performance Plastics (PPS, PEEK, PEI)
          // ==========================================
          {
            type: "bubble",
            size: "mega",
            header: {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "text", text: "⚡ High Performance", weight: "bold", color: "#ffffff", size: "lg" },
                { type: "text", text: "PPS | PEEK | PEI | LCP", color: "#ffffffcc", size: "sm" },
              ],
              backgroundColor: "#6a1b9a",
              paddingAll: "20px",
            },
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                // PPS
                {
                  type: "box",
                  layout: "vertical",
                  backgroundColor: "#f3e5f5",
                  cornerRadius: "12px",
                  paddingAll: "12px",
                  margin: "none",
                  contents: [
                    { type: "text", text: "⚡ PPS (Polyphenylene Sulfide)", weight: "bold", size: "sm", color: "#6a1b9a" },
                    {
                      type: "box",
                      layout: "horizontal",
                      margin: "sm",
                      contents: [
                        { type: "box", layout: "vertical", flex: 1, contents: [{ type: "text", text: "Barrel", size: "xxs", color: "#888888" }, { type: "text", text: "300-340°C", size: "xs", weight: "bold", color: "#333333" }] },
                        { type: "box", layout: "vertical", flex: 1, contents: [{ type: "text", text: "Mold", size: "xxs", color: "#888888" }, { type: "text", text: "120-150°C", size: "xs", weight: "bold", color: "#333333" }] },
                        { type: "box", layout: "vertical", flex: 1, contents: [{ type: "text", text: "Drying", size: "xxs", color: "#888888" }, { type: "text", text: "150°C/3h", size: "xs", weight: "bold", color: "#e74c3c" }] },
                      ],
                    },
                    { type: "text", text: "💡 ทนความร้อน/สารเคมีสูง เหมาะกับชิ้นส่วนยานยนต์", size: "xxs", color: "#6a1b9a", margin: "sm", wrap: true },
                  ],
                  action: { type: "message", text: "อุณหภูมิ PPS แบบละเอียด" },
                },
                // PEEK
                {
                  type: "box",
                  layout: "vertical",
                  backgroundColor: "#fff8e1",
                  cornerRadius: "12px",
                  paddingAll: "12px",
                  margin: "md",
                  contents: [
                    { type: "text", text: "🔶 PEEK", weight: "bold", size: "sm", color: "#ff6f00" },
                    {
                      type: "box",
                      layout: "horizontal",
                      margin: "sm",
                      contents: [
                        { type: "box", layout: "vertical", flex: 1, contents: [{ type: "text", text: "Barrel", size: "xxs", color: "#888888" }, { type: "text", text: "350-400°C", size: "xs", weight: "bold", color: "#333333" }] },
                        { type: "box", layout: "vertical", flex: 1, contents: [{ type: "text", text: "Mold", size: "xxs", color: "#888888" }, { type: "text", text: "150-180°C", size: "xs", weight: "bold", color: "#333333" }] },
                        { type: "box", layout: "vertical", flex: 1, contents: [{ type: "text", text: "Drying", size: "xxs", color: "#888888" }, { type: "text", text: "150°C/4h", size: "xs", weight: "bold", color: "#e74c3c" }] },
                      ],
                    },
                    { type: "text", text: "💎 Super Engineering Plastic - ราคาสูง", size: "xxs", color: "#ff6f00", margin: "sm", wrap: true },
                  ],
                  action: { type: "message", text: "อุณหภูมิ PEEK แบบละเอียด" },
                },
                // PEI
                {
                  type: "box",
                  layout: "vertical",
                  backgroundColor: "#e8eaf6",
                  cornerRadius: "12px",
                  paddingAll: "12px",
                  margin: "md",
                  contents: [
                    { type: "text", text: "🔷 PEI (Ultem)", weight: "bold", size: "sm", color: "#3949ab" },
                    {
                      type: "box",
                      layout: "horizontal",
                      margin: "sm",
                      contents: [
                        { type: "box", layout: "vertical", flex: 1, contents: [{ type: "text", text: "Barrel", size: "xxs", color: "#888888" }, { type: "text", text: "340-400°C", size: "xs", weight: "bold", color: "#333333" }] },
                        { type: "box", layout: "vertical", flex: 1, contents: [{ type: "text", text: "Mold", size: "xxs", color: "#888888" }, { type: "text", text: "140-175°C", size: "xs", weight: "bold", color: "#333333" }] },
                        { type: "box", layout: "vertical", flex: 1, contents: [{ type: "text", text: "Drying", size: "xxs", color: "#888888" }, { type: "text", text: "150°C/4-8h", size: "xs", weight: "bold", color: "#e74c3c" }] },
                      ],
                    },
                  ],
                  action: { type: "message", text: "อุณหภูมิ PEI แบบละเอียด" },
                },
                // LCP
                {
                  type: "box",
                  layout: "vertical",
                  backgroundColor: "#e0f2f1",
                  cornerRadius: "12px",
                  paddingAll: "12px",
                  margin: "md",
                  contents: [
                    { type: "text", text: "🌊 LCP (Liquid Crystal Polymer)", weight: "bold", size: "sm", color: "#00695c" },
                    {
                      type: "box",
                      layout: "horizontal",
                      margin: "sm",
                      contents: [
                        { type: "box", layout: "vertical", flex: 1, contents: [{ type: "text", text: "Barrel", size: "xxs", color: "#888888" }, { type: "text", text: "280-350°C", size: "xs", weight: "bold", color: "#333333" }] },
                        { type: "box", layout: "vertical", flex: 1, contents: [{ type: "text", text: "Mold", size: "xxs", color: "#888888" }, { type: "text", text: "70-120°C", size: "xs", weight: "bold", color: "#333333" }] },
                        { type: "box", layout: "vertical", flex: 1, contents: [{ type: "text", text: "Drying", size: "xxs", color: "#888888" }, { type: "text", text: "150°C/4h", size: "xs", weight: "bold", color: "#e74c3c" }] },
                      ],
                    },
                  ],
                  action: { type: "message", text: "อุณหภูมิ LCP แบบละเอียด" },
                },
              ],
              paddingAll: "16px",
              spacing: "none",
            },
            footer: {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "button", style: "primary", color: "#6a1b9a", action: { type: "message", label: "📖 คู่มือวัสดุพิเศษ", text: "คู่มือวัสดุ High Performance" } },
              ],
              paddingAll: "12px",
            },
          },
          // ==========================================
          // 💨 BUBBLE 5: Drying Guide (การอบวัสดุ)
          // ==========================================
          {
            type: "bubble",
            size: "mega",
            header: {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "text", text: "💨 คู่มือการอบวัสดุ", weight: "bold", color: "#ffffff", size: "lg" },
                { type: "text", text: "Drying Temperature & Time", color: "#ffffffcc", size: "sm" },
              ],
              backgroundColor: "#00838f",
              paddingAll: "20px",
            },
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "text", text: "⏱️ ตารางอบวัสดุ", weight: "bold", size: "md", color: "#333333" },
                {
                  type: "box",
                  layout: "vertical",
                  margin: "md",
                  spacing: "sm",
                  contents: [
                    // Header row
                    {
                      type: "box",
                      layout: "horizontal",
                      backgroundColor: "#00838f",
                      cornerRadius: "8px",
                      paddingAll: "8px",
                      contents: [
                        { type: "text", text: "วัสดุ", weight: "bold", size: "xs", color: "#ffffff", flex: 2 },
                        { type: "text", text: "อุณหภูมิ", weight: "bold", size: "xs", color: "#ffffff", flex: 2, align: "center" },
                        { type: "text", text: "เวลา", weight: "bold", size: "xs", color: "#ffffff", flex: 2, align: "end" },
                      ],
                    },
                    // Data rows
                    { type: "box", layout: "horizontal", paddingAll: "6px", contents: [{ type: "text", text: "ABS", size: "xs", color: "#333333", flex: 2, weight: "bold" }, { type: "text", text: "80°C", size: "xs", color: "#666666", flex: 2, align: "center" }, { type: "text", text: "2-4 ชม.", size: "xs", color: "#666666", flex: 2, align: "end" }] },
                    { type: "box", layout: "horizontal", paddingAll: "6px", backgroundColor: "#f5f5f5", contents: [{ type: "text", text: "PC", size: "xs", color: "#333333", flex: 2, weight: "bold" }, { type: "text", text: "120°C", size: "xs", color: "#666666", flex: 2, align: "center" }, { type: "text", text: "4 ชม.", size: "xs", color: "#666666", flex: 2, align: "end" }] },
                    { type: "box", layout: "horizontal", paddingAll: "6px", contents: [{ type: "text", text: "PA (Nylon)", size: "xs", color: "#333333", flex: 2, weight: "bold" }, { type: "text", text: "80°C", size: "xs", color: "#666666", flex: 2, align: "center" }, { type: "text", text: "4-6 ชม.", size: "xs", color: "#666666", flex: 2, align: "end" }] },
                    { type: "box", layout: "horizontal", paddingAll: "6px", backgroundColor: "#f5f5f5", contents: [{ type: "text", text: "POM", size: "xs", color: "#333333", flex: 2, weight: "bold" }, { type: "text", text: "80°C", size: "xs", color: "#666666", flex: 2, align: "center" }, { type: "text", text: "2-3 ชม.", size: "xs", color: "#666666", flex: 2, align: "end" }] },
                    { type: "box", layout: "horizontal", paddingAll: "6px", contents: [{ type: "text", text: "PBT", size: "xs", color: "#333333", flex: 2, weight: "bold" }, { type: "text", text: "120°C", size: "xs", color: "#666666", flex: 2, align: "center" }, { type: "text", text: "3-4 ชม.", size: "xs", color: "#666666", flex: 2, align: "end" }] },
                    { type: "box", layout: "horizontal", paddingAll: "6px", backgroundColor: "#f5f5f5", contents: [{ type: "text", text: "PPS", size: "xs", color: "#333333", flex: 2, weight: "bold" }, { type: "text", text: "150°C", size: "xs", color: "#666666", flex: 2, align: "center" }, { type: "text", text: "3 ชม.", size: "xs", color: "#666666", flex: 2, align: "end" }] },
                    { type: "box", layout: "horizontal", paddingAll: "6px", contents: [{ type: "text", text: "PEEK", size: "xs", color: "#333333", flex: 2, weight: "bold" }, { type: "text", text: "150°C", size: "xs", color: "#666666", flex: 2, align: "center" }, { type: "text", text: "4 ชม.", size: "xs", color: "#666666", flex: 2, align: "end" }] },
                  ],
                },
                { type: "separator", margin: "lg" },
                {
                  type: "box",
                  layout: "vertical",
                  margin: "md",
                  backgroundColor: "#fff3e0",
                  cornerRadius: "8px",
                  paddingAll: "10px",
                  contents: [
                    { type: "text", text: "💡 เคล็ดลับการอบ:", weight: "bold", size: "xs", color: "#e65100" },
                    { type: "text", text: "• ใช้ Dehumidifying Dryer สำหรับ PC, PA", size: "xxs", color: "#666666", wrap: true },
                    { type: "text", text: "• ความชื้นเป้าหมาย: < 0.02% สำหรับ PC", size: "xxs", color: "#666666", wrap: true },
                    { type: "text", text: "• PP, PE ไม่จำเป็นต้องอบ (Non-hygroscopic)", size: "xxs", color: "#666666", wrap: true },
                  ],
                },
              ],
              paddingAll: "16px",
            },
            footer: {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "button", style: "primary", color: "#00838f", action: { type: "message", label: "❓ ถาม AI เรื่องการอบ", text: "วิธีอบวัสดุพลาสติกที่ถูกต้อง" } },
              ],
              paddingAll: "12px",
            },
          },
          // ==========================================
          // 🔴 BUBBLE 6: Hot Runner Temperature
          // ==========================================
          {
            type: "bubble",
            size: "mega",
            header: {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "text", text: "🔴 Hot Runner Guide", weight: "bold", color: "#ffffff", size: "lg" },
                { type: "text", text: "อุณหภูมิ Manifold & Nozzle Tip", color: "#ffffffcc", size: "sm" },
              ],
              backgroundColor: "#b71c1c",
              paddingAll: "20px",
            },
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "text", text: "🔥 Hot Runner Temperature", weight: "bold", size: "md", color: "#333333" },
                {
                  type: "box",
                  layout: "vertical",
                  margin: "md",
                  spacing: "sm",
                  contents: [
                    // Header
                    {
                      type: "box",
                      layout: "horizontal",
                      backgroundColor: "#b71c1c",
                      cornerRadius: "8px",
                      paddingAll: "8px",
                      contents: [
                        { type: "text", text: "วัสดุ", weight: "bold", size: "xs", color: "#ffffff", flex: 2 },
                        { type: "text", text: "Manifold", weight: "bold", size: "xs", color: "#ffffff", flex: 2, align: "center" },
                        { type: "text", text: "Nozzle", weight: "bold", size: "xs", color: "#ffffff", flex: 2, align: "end" },
                      ],
                    },
                    { type: "box", layout: "horizontal", paddingAll: "6px", contents: [{ type: "text", text: "PP", size: "xs", color: "#333333", flex: 2, weight: "bold" }, { type: "text", text: "220-260°C", size: "xs", color: "#666666", flex: 2, align: "center" }, { type: "text", text: "230-270°C", size: "xs", color: "#666666", flex: 2, align: "end" }] },
                    { type: "box", layout: "horizontal", paddingAll: "6px", backgroundColor: "#ffebee", contents: [{ type: "text", text: "ABS", size: "xs", color: "#333333", flex: 2, weight: "bold" }, { type: "text", text: "220-250°C", size: "xs", color: "#666666", flex: 2, align: "center" }, { type: "text", text: "230-260°C", size: "xs", color: "#666666", flex: 2, align: "end" }] },
                    { type: "box", layout: "horizontal", paddingAll: "6px", contents: [{ type: "text", text: "PC", size: "xs", color: "#333333", flex: 2, weight: "bold" }, { type: "text", text: "280-310°C", size: "xs", color: "#666666", flex: 2, align: "center" }, { type: "text", text: "290-320°C", size: "xs", color: "#666666", flex: 2, align: "end" }] },
                    { type: "box", layout: "horizontal", paddingAll: "6px", backgroundColor: "#ffebee", contents: [{ type: "text", text: "PA", size: "xs", color: "#333333", flex: 2, weight: "bold" }, { type: "text", text: "250-280°C", size: "xs", color: "#666666", flex: 2, align: "center" }, { type: "text", text: "260-290°C", size: "xs", color: "#666666", flex: 2, align: "end" }] },
                    { type: "box", layout: "horizontal", paddingAll: "6px", contents: [{ type: "text", text: "POM", size: "xs", color: "#333333", flex: 2, weight: "bold" }, { type: "text", text: "190-210°C", size: "xs", color: "#666666", flex: 2, align: "center" }, { type: "text", text: "195-215°C", size: "xs", color: "#666666", flex: 2, align: "end" }] },
                    { type: "box", layout: "horizontal", paddingAll: "6px", backgroundColor: "#ffebee", contents: [{ type: "text", text: "PPS", size: "xs", color: "#333333", flex: 2, weight: "bold" }, { type: "text", text: "300-330°C", size: "xs", color: "#666666", flex: 2, align: "center" }, { type: "text", text: "310-340°C", size: "xs", color: "#666666", flex: 2, align: "end" }] },
                  ],
                },
                { type: "separator", margin: "lg" },
                {
                  type: "box",
                  layout: "vertical",
                  margin: "md",
                  backgroundColor: "#ffebee",
                  cornerRadius: "8px",
                  paddingAll: "10px",
                  contents: [
                    { type: "text", text: "⚠️ ข้อควรระวัง Hot Runner:", weight: "bold", size: "xs", color: "#b71c1c" },
                    { type: "text", text: "• Nozzle Tip สูงกว่า Manifold 5-15°C", size: "xxs", color: "#666666", wrap: true },
                    { type: "text", text: "• ตรวจสอบ Thermocouple สม่ำเสมอ", size: "xxs", color: "#666666", wrap: true },
                    { type: "text", text: "• POM ระวังเรื่อง Thermal Degradation", size: "xxs", color: "#666666", wrap: true },
                  ],
                },
              ],
              paddingAll: "16px",
            },
            footer: {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "button", style: "primary", color: "#b71c1c", action: { type: "message", label: "❓ ถาม AI เรื่อง Hot Runner", text: "ปัญหา Hot Runner แก้ยังไง" } },
              ],
              paddingAll: "12px",
            },
          },
          // ==========================================
          // 📊 BUBBLE 7: Special Materials (TPE, TPU, PMMA)
          // ==========================================
          {
            type: "bubble",
            size: "mega",
            header: {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "text", text: "🧪 Special Materials", weight: "bold", color: "#ffffff", size: "lg" },
                { type: "text", text: "TPE | TPU | PMMA | PBT", color: "#ffffffcc", size: "sm" },
              ],
              backgroundColor: "#00695c",
              paddingAll: "20px",
            },
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                // TPE
                {
                  type: "box",
                  layout: "vertical",
                  backgroundColor: "#e0f2f1",
                  cornerRadius: "12px",
                  paddingAll: "12px",
                  margin: "none",
                  contents: [
                    { type: "text", text: "🟢 TPE (Thermoplastic Elastomer)", weight: "bold", size: "sm", color: "#00695c" },
                    {
                      type: "box",
                      layout: "horizontal",
                      margin: "sm",
                      contents: [
                        { type: "box", layout: "vertical", flex: 1, contents: [{ type: "text", text: "Barrel", size: "xxs", color: "#888888" }, { type: "text", text: "180-230°C", size: "xs", weight: "bold", color: "#333333" }] },
                        { type: "box", layout: "vertical", flex: 1, contents: [{ type: "text", text: "Mold", size: "xxs", color: "#888888" }, { type: "text", text: "30-50°C", size: "xs", weight: "bold", color: "#333333" }] },
                        { type: "box", layout: "vertical", flex: 1, contents: [{ type: "text", text: "Drying", size: "xxs", color: "#888888" }, { type: "text", text: "70°C/2h", size: "xs", weight: "bold", color: "#e74c3c" }] },
                      ],
                    },
                  ],
                  action: { type: "message", text: "อุณหภูมิ TPE แบบละเอียด" },
                },
                // TPU
                {
                  type: "box",
                  layout: "vertical",
                  backgroundColor: "#e3f2fd",
                  cornerRadius: "12px",
                  paddingAll: "12px",
                  margin: "md",
                  contents: [
                    { type: "text", text: "🔵 TPU (Thermoplastic Polyurethane)", weight: "bold", size: "sm", color: "#1565c0" },
                    {
                      type: "box",
                      layout: "horizontal",
                      margin: "sm",
                      contents: [
                        { type: "box", layout: "vertical", flex: 1, contents: [{ type: "text", text: "Barrel", size: "xxs", color: "#888888" }, { type: "text", text: "180-220°C", size: "xs", weight: "bold", color: "#333333" }] },
                        { type: "box", layout: "vertical", flex: 1, contents: [{ type: "text", text: "Mold", size: "xxs", color: "#888888" }, { type: "text", text: "30-50°C", size: "xs", weight: "bold", color: "#333333" }] },
                        { type: "box", layout: "vertical", flex: 1, contents: [{ type: "text", text: "Drying", size: "xxs", color: "#888888" }, { type: "text", text: "80°C/3h", size: "xs", weight: "bold", color: "#e74c3c" }] },
                      ],
                    },
                  ],
                  action: { type: "message", text: "อุณหภูมิ TPU แบบละเอียด" },
                },
                // PMMA
                {
                  type: "box",
                  layout: "vertical",
                  backgroundColor: "#fff3e0",
                  cornerRadius: "12px",
                  paddingAll: "12px",
                  margin: "md",
                  contents: [
                    { type: "text", text: "🟠 PMMA (Acrylic)", weight: "bold", size: "sm", color: "#e65100" },
                    {
                      type: "box",
                      layout: "horizontal",
                      margin: "sm",
                      contents: [
                        { type: "box", layout: "vertical", flex: 1, contents: [{ type: "text", text: "Barrel", size: "xxs", color: "#888888" }, { type: "text", text: "220-260°C", size: "xs", weight: "bold", color: "#333333" }] },
                        { type: "box", layout: "vertical", flex: 1, contents: [{ type: "text", text: "Mold", size: "xxs", color: "#888888" }, { type: "text", text: "60-90°C", size: "xs", weight: "bold", color: "#333333" }] },
                        { type: "box", layout: "vertical", flex: 1, contents: [{ type: "text", text: "Drying", size: "xxs", color: "#888888" }, { type: "text", text: "80°C/4h", size: "xs", weight: "bold", color: "#e74c3c" }] },
                      ],
                    },
                    { type: "text", text: "💡 ใสเหมือนแก้ว เหมาะทำไฟ/จอแสดงผล", size: "xxs", color: "#e65100", margin: "sm", wrap: true },
                  ],
                  action: { type: "message", text: "อุณหภูมิ PMMA แบบละเอียด" },
                },
                // PBT
                {
                  type: "box",
                  layout: "vertical",
                  backgroundColor: "#fce4ec",
                  cornerRadius: "12px",
                  paddingAll: "12px",
                  margin: "md",
                  contents: [
                    { type: "text", text: "🟣 PBT (Polybutylene Terephthalate)", weight: "bold", size: "sm", color: "#c2185b" },
                    {
                      type: "box",
                      layout: "horizontal",
                      margin: "sm",
                      contents: [
                        { type: "box", layout: "vertical", flex: 1, contents: [{ type: "text", text: "Barrel", size: "xxs", color: "#888888" }, { type: "text", text: "230-270°C", size: "xs", weight: "bold", color: "#333333" }] },
                        { type: "box", layout: "vertical", flex: 1, contents: [{ type: "text", text: "Mold", size: "xxs", color: "#888888" }, { type: "text", text: "60-90°C", size: "xs", weight: "bold", color: "#333333" }] },
                        { type: "box", layout: "vertical", flex: 1, contents: [{ type: "text", text: "Drying", size: "xxs", color: "#888888" }, { type: "text", text: "120°C/4h", size: "xs", weight: "bold", color: "#e74c3c" }] },
                      ],
                    },
                  ],
                  action: { type: "message", text: "อุณหภูมิ PBT แบบละเอียด" },
                },
              ],
              paddingAll: "16px",
              spacing: "none",
            },
            footer: {
              type: "box",
              layout: "horizontal",
              spacing: "sm",
              contents: [
                { type: "button", style: "primary", color: "#00695c", flex: 1, action: { type: "message", label: "🏭 เมนูหลัก", text: "/plastic" } },
                { type: "button", style: "secondary", flex: 1, action: { type: "message", label: "🤖 ถาม AI", text: "แนะนำวัสดุฉีดพลาสติก" } },
              ],
              paddingAll: "12px",
            },
          },
        ],
      },
    };
  } catch (error) {
    console.error("Error creating temperature table message:", error);
    return null;
  }
};

// =====================================================
// 🌱 SMART FARM CONSULTATION MENU - Professional Edition
// =====================================================

/**
 * 🌱 CREATE SMART FARM MENU v1.0
 * เมนูปรึกษาเรื่องเกษตรอัจฉริยะแบบครบวงจร
 * - สูตรปุ๋ย
 * - การปลูกพืชเศรษฐกิจ
 * - การดูแลรักษา
 * - ต้นทุนและกำไร
 * - การวิเคราะห์
 * - เงินอุดหนุนภาครัฐ
 */
const createSmartFarmMenu = () => {
  try {
    return {
      type: "flex",
      altText: "🌱 Smart Farm - ศูนย์ปรึกษาเกษตรอัจฉริยะ",
      contents: {
        type: "carousel",
        contents: [
          // ==========================================
          // 🎯 BUBBLE 1: Main Menu Overview
          // ==========================================
          {
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
                      type: "box",
                      layout: "vertical",
                      contents: [
                        { type: "text", text: "🌱", size: "3xl", align: "center" },
                      ],
                      width: "70px",
                      height: "70px",
                      backgroundColor: "#ffffff33",
                      cornerRadius: "35px",
                      justifyContent: "center",
                      alignItems: "center",
                    },
                    {
                      type: "box",
                      layout: "vertical",
                      margin: "lg",
                      contents: [
                        { type: "text", text: "Smart Farm", weight: "bold", color: "#ffffff", size: "xl" },
                        { type: "text", text: "ศูนย์ปรึกษาเกษตรอัจฉริยะ", color: "#90EE90", size: "sm", weight: "bold" },
                      ],
                    },
                  ],
                  alignItems: "center",
                },
                {
                  type: "box",
                  layout: "horizontal",
                  margin: "lg",
                  contents: [
                    { type: "box", layout: "vertical", flex: 1, contents: [{ type: "text", text: "🧪", size: "md", align: "center" }, { type: "text", text: "สูตรปุ๋ย", size: "xxs", color: "#ffffff", align: "center" }] },
                    { type: "box", layout: "vertical", flex: 1, contents: [{ type: "text", text: "🌾", size: "md", align: "center" }, { type: "text", text: "พืชเศรษฐกิจ", size: "xxs", color: "#ffffff", align: "center" }] },
                    { type: "box", layout: "vertical", flex: 1, contents: [{ type: "text", text: "💰", size: "md", align: "center" }, { type: "text", text: "ต้นทุน", size: "xxs", color: "#ffffff", align: "center" }] },
                    { type: "box", layout: "vertical", flex: 1, contents: [{ type: "text", text: "🏛️", size: "md", align: "center" }, { type: "text", text: "เงินอุดหนุน", size: "xxs", color: "#ffffff", align: "center" }] },
                  ],
                  backgroundColor: "#ffffff22",
                  cornerRadius: "12px",
                  paddingAll: "10px",
                },
              ],
              backgroundColor: "#2e7d32",
              paddingAll: "20px",
            },
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "text", text: "🎯 เลือกหัวข้อที่สนใจ", weight: "bold", size: "md", color: "#333333" },
                {
                  type: "box",
                  layout: "vertical",
                  margin: "lg",
                  spacing: "md",
                  contents: [
                    {
                      type: "box",
                      layout: "horizontal",
                      backgroundColor: "#e8f5e9",
                      cornerRadius: "12px",
                      paddingAll: "12px",
                      contents: [
                        { type: "box", layout: "vertical", contents: [{ type: "text", text: "🧪", size: "xl" }], backgroundColor: "#4caf50", cornerRadius: "8px", width: "44px", height: "44px", justifyContent: "center", alignItems: "center", flex: 0 },
                        { type: "box", layout: "vertical", contents: [{ type: "text", text: "สูตรปุ๋ย & ธาตุอาหาร", weight: "bold", size: "sm", color: "#2e7d32" }, { type: "text", text: "NPK, ปุ๋ยหมัก, ฮอร์โมน", size: "xs", color: "#666666" }], margin: "md", flex: 1, justifyContent: "center" },
                      ],
                      action: { type: "message", text: "สูตรปุ๋ยสำหรับพืช" },
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      backgroundColor: "#fff3e0",
                      cornerRadius: "12px",
                      paddingAll: "12px",
                      contents: [
                        { type: "box", layout: "vertical", contents: [{ type: "text", text: "🌾", size: "xl" }], backgroundColor: "#ff9800", cornerRadius: "8px", width: "44px", height: "44px", justifyContent: "center", alignItems: "center", flex: 0 },
                        { type: "box", layout: "vertical", contents: [{ type: "text", text: "พืชเศรษฐกิจ", weight: "bold", size: "sm", color: "#e65100" }, { type: "text", text: "ทุเรียน, มะม่วง, ข้าว, ยาง", size: "xs", color: "#666666" }], margin: "md", flex: 1, justifyContent: "center" },
                      ],
                      action: { type: "message", text: "แนะนำพืชเศรษฐกิจ" },
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      backgroundColor: "#e3f2fd",
                      cornerRadius: "12px",
                      paddingAll: "12px",
                      contents: [
                        { type: "box", layout: "vertical", contents: [{ type: "text", text: "💰", size: "xl" }], backgroundColor: "#1976d2", cornerRadius: "8px", width: "44px", height: "44px", justifyContent: "center", alignItems: "center", flex: 0 },
                        { type: "box", layout: "vertical", contents: [{ type: "text", text: "วิเคราะห์ต้นทุน-กำไร", weight: "bold", size: "sm", color: "#1565c0" }, { type: "text", text: "คำนวณความคุ้มค่าการลงทุน", size: "xs", color: "#666666" }], margin: "md", flex: 1, justifyContent: "center" },
                      ],
                      action: { type: "message", text: "วิเคราะห์ต้นทุนการเกษตร" },
                    },
                  ],
                },
              ],
              paddingAll: "16px",
            },
            footer: {
              type: "box",
              layout: "horizontal",
              spacing: "sm",
              contents: [
                { type: "button", style: "primary", color: "#2e7d32", flex: 1, action: { type: "message", label: "🤖 ถาม AI", text: "ถามเรื่องการเกษตร" } },
                { type: "button", style: "secondary", flex: 1, action: { type: "message", label: "📊 บัญชีฟาร์ม", text: "/acc" } },
              ],
              paddingAll: "12px",
            },
          },
          // ==========================================
          // 🧪 BUBBLE 2: สูตรปุ๋ย & ธาตุอาหาร
          // ==========================================
          {
            type: "bubble",
            size: "mega",
            header: {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "text", text: "🧪 สูตรปุ๋ย & ธาตุอาหาร", weight: "bold", color: "#ffffff", size: "lg" },
                { type: "text", text: "Fertilizer & Nutrients Guide", color: "#ffffffcc", size: "sm" },
              ],
              backgroundColor: "#4caf50",
              paddingAll: "20px",
            },
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "text", text: "📋 เลือกประเภทปุ๋ย", weight: "bold", size: "md", color: "#333333" },
                {
                  type: "box",
                  layout: "vertical",
                  margin: "md",
                  spacing: "sm",
                  contents: [
                    {
                      type: "box",
                      layout: "horizontal",
                      backgroundColor: "#e8f5e9",
                      cornerRadius: "10px",
                      paddingAll: "12px",
                      contents: [
                        { type: "text", text: "🔵", size: "lg", flex: 0 },
                        { type: "box", layout: "vertical", margin: "md", flex: 1, contents: [{ type: "text", text: "ปุ๋ยเคมี NPK", weight: "bold", size: "sm", color: "#2e7d32" }, { type: "text", text: "15-15-15, 46-0-0, 16-20-0", size: "xs", color: "#666666" }] },
                      ],
                      action: { type: "message", text: "สูตรปุ๋ย NPK แนะนำ" },
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      backgroundColor: "#fff8e1",
                      cornerRadius: "10px",
                      paddingAll: "12px",
                      contents: [
                        { type: "text", text: "🟤", size: "lg", flex: 0 },
                        { type: "box", layout: "vertical", margin: "md", flex: 1, contents: [{ type: "text", text: "ปุ๋ยอินทรีย์/หมัก", weight: "bold", size: "sm", color: "#6d4c41" }, { type: "text", text: "มูลสัตว์, ปุ๋ยหมัก, โบกาฉิ", size: "xs", color: "#666666" }] },
                      ],
                      action: { type: "message", text: "วิธีทำปุ๋ยหมักอินทรีย์" },
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      backgroundColor: "#e3f2fd",
                      cornerRadius: "10px",
                      paddingAll: "12px",
                      contents: [
                        { type: "text", text: "💧", size: "lg", flex: 0 },
                        { type: "box", layout: "vertical", margin: "md", flex: 1, contents: [{ type: "text", text: "ปุ๋ยน้ำ/ฮอร์โมน", weight: "bold", size: "sm", color: "#1565c0" }, { type: "text", text: "น้ำหมักชีวภาพ, ไคโตซาน", size: "xs", color: "#666666" }] },
                      ],
                      action: { type: "message", text: "สูตรน้ำหมักชีวภาพ" },
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      backgroundColor: "#fce4ec",
                      cornerRadius: "10px",
                      paddingAll: "12px",
                      contents: [
                        { type: "text", text: "🌸", size: "lg", flex: 0 },
                        { type: "box", layout: "vertical", margin: "md", flex: 1, contents: [{ type: "text", text: "ปุ๋ยบำรุงดอก/ผล", weight: "bold", size: "sm", color: "#c2185b" }, { type: "text", text: "0-52-34, สูตรเร่งดอก", size: "xs", color: "#666666" }] },
                      ],
                      action: { type: "message", text: "ปุ๋ยเร่งดอกเร่งผล" },
                    },
                  ],
                },
                { type: "separator", margin: "lg" },
                {
                  type: "box",
                  layout: "vertical",
                  margin: "md",
                  backgroundColor: "#f1f8e9",
                  cornerRadius: "8px",
                  paddingAll: "10px",
                  contents: [
                    { type: "text", text: "💡 เคล็ดลับ: ตรวจดินก่อนใส่ปุ๋ย", weight: "bold", size: "xs", color: "#33691e" },
                    { type: "text", text: "ช่วยประหยัดต้นทุนและเพิ่มประสิทธิภาพ", size: "xs", color: "#666666", wrap: true },
                  ],
                },
              ],
              paddingAll: "16px",
            },
            footer: {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "button", style: "primary", color: "#4caf50", action: { type: "message", label: "🧮 คำนวณปุ๋ย", text: "คำนวณปริมาณปุ๋ยที่ต้องใช้" } },
              ],
              paddingAll: "12px",
            },
          },
          // ==========================================
          // 🌾 BUBBLE 3: พืชเศรษฐกิจ
          // ==========================================
          {
            type: "bubble",
            size: "mega",
            header: {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "text", text: "🌾 พืชเศรษฐกิจยอดนิยม", weight: "bold", color: "#ffffff", size: "lg" },
                { type: "text", text: "Cash Crops Guide", color: "#ffffffcc", size: "sm" },
              ],
              backgroundColor: "#ff9800",
              paddingAll: "20px",
            },
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "text", text: "🏆 พืชเศรษฐกิจแนะนำ", weight: "bold", size: "md", color: "#333333" },
                {
                  type: "box",
                  layout: "vertical",
                  margin: "md",
                  spacing: "sm",
                  contents: [
                    // Row 1: ทุเรียน & มะม่วง
                    {
                      type: "box",
                      layout: "horizontal",
                      spacing: "sm",
                      contents: [
                        {
                          type: "box",
                          layout: "vertical",
                          backgroundColor: "#fff8e1",
                          cornerRadius: "10px",
                          paddingAll: "10px",
                          flex: 1,
                          contents: [
                            { type: "text", text: "🍈", size: "xl", align: "center" },
                            { type: "text", text: "ทุเรียน", weight: "bold", size: "xs", align: "center", color: "#e65100" },
                            { type: "text", text: "กำไร: สูงมาก", size: "xxs", align: "center", color: "#666666" },
                          ],
                          action: { type: "message", text: "วิธีปลูกทุเรียนให้ได้ผลดี" },
                        },
                        {
                          type: "box",
                          layout: "vertical",
                          backgroundColor: "#fff3e0",
                          cornerRadius: "10px",
                          paddingAll: "10px",
                          flex: 1,
                          contents: [
                            { type: "text", text: "🥭", size: "xl", align: "center" },
                            { type: "text", text: "มะม่วง", weight: "bold", size: "xs", align: "center", color: "#ff6f00" },
                            { type: "text", text: "กำไร: สูง", size: "xxs", align: "center", color: "#666666" },
                          ],
                          action: { type: "message", text: "วิธีปลูกมะม่วงน้ำดอกไม้" },
                        },
                      ],
                    },
                    // Row 2: ยางพารา & ปาล์ม
                    {
                      type: "box",
                      layout: "horizontal",
                      spacing: "sm",
                      contents: [
                        {
                          type: "box",
                          layout: "vertical",
                          backgroundColor: "#e8f5e9",
                          cornerRadius: "10px",
                          paddingAll: "10px",
                          flex: 1,
                          contents: [
                            { type: "text", text: "🌳", size: "xl", align: "center" },
                            { type: "text", text: "ยางพารา", weight: "bold", size: "xs", align: "center", color: "#2e7d32" },
                            { type: "text", text: "รายได้: สม่ำเสมอ", size: "xxs", align: "center", color: "#666666" },
                          ],
                          action: { type: "message", text: "การปลูกยางพารา" },
                        },
                        {
                          type: "box",
                          layout: "vertical",
                          backgroundColor: "#f1f8e9",
                          cornerRadius: "10px",
                          paddingAll: "10px",
                          flex: 1,
                          contents: [
                            { type: "text", text: "🌴", size: "xl", align: "center" },
                            { type: "text", text: "ปาล์มน้ำมัน", weight: "bold", size: "xs", align: "center", color: "#558b2f" },
                            { type: "text", text: "รายได้: ต่อเนื่อง", size: "xxs", align: "center", color: "#666666" },
                          ],
                          action: { type: "message", text: "การปลูกปาล์มน้ำมัน" },
                        },
                      ],
                    },
                    // Row 3: ข้าว & อ้อย
                    {
                      type: "box",
                      layout: "horizontal",
                      spacing: "sm",
                      contents: [
                        {
                          type: "box",
                          layout: "vertical",
                          backgroundColor: "#fffde7",
                          cornerRadius: "10px",
                          paddingAll: "10px",
                          flex: 1,
                          contents: [
                            { type: "text", text: "🌾", size: "xl", align: "center" },
                            { type: "text", text: "ข้าว", weight: "bold", size: "xs", align: "center", color: "#f57f17" },
                            { type: "text", text: "พื้นฐาน: มั่นคง", size: "xxs", align: "center", color: "#666666" },
                          ],
                          action: { type: "message", text: "เทคนิคปลูกข้าวให้ได้ผลผลิตดี" },
                        },
                        {
                          type: "box",
                          layout: "vertical",
                          backgroundColor: "#e0f2f1",
                          cornerRadius: "10px",
                          paddingAll: "10px",
                          flex: 1,
                          contents: [
                            { type: "text", text: "🎋", size: "xl", align: "center" },
                            { type: "text", text: "อ้อย", weight: "bold", size: "xs", align: "center", color: "#00695c" },
                            { type: "text", text: "ตลาด: แน่นอน", size: "xxs", align: "center", color: "#666666" },
                          ],
                          action: { type: "message", text: "การปลูกอ้อยส่งโรงงาน" },
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
              layout: "horizontal",
              spacing: "sm",
              contents: [
                { type: "button", style: "primary", color: "#ff9800", flex: 1, action: { type: "message", label: "🌿 พืชอื่นๆ", text: "แนะนำพืชเศรษฐกิจอื่นๆ" } },
                { type: "button", style: "secondary", flex: 1, action: { type: "message", label: "📈 วิเคราะห์", text: "วิเคราะห์พืชที่เหมาะกับพื้นที่" } },
              ],
              paddingAll: "12px",
            },
          },
          // ==========================================
          // 🛡️ BUBBLE 4: การดูแลรักษาพืช
          // ==========================================
          {
            type: "bubble",
            size: "mega",
            header: {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "text", text: "🛡️ การดูแลรักษาพืช", weight: "bold", color: "#ffffff", size: "lg" },
                { type: "text", text: "Plant Care & Disease Control", color: "#ffffffcc", size: "sm" },
              ],
              backgroundColor: "#00897b",
              paddingAll: "20px",
            },
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "text", text: "🔧 หมวดการดูแล", weight: "bold", size: "md", color: "#333333" },
                {
                  type: "box",
                  layout: "vertical",
                  margin: "md",
                  spacing: "sm",
                  contents: [
                    {
                      type: "box",
                      layout: "horizontal",
                      backgroundColor: "#e0f2f1",
                      cornerRadius: "10px",
                      paddingAll: "12px",
                      contents: [
                        { type: "text", text: "🐛", size: "lg", flex: 0 },
                        { type: "box", layout: "vertical", margin: "md", flex: 1, contents: [{ type: "text", text: "โรค & แมลงศัตรูพืช", weight: "bold", size: "sm", color: "#00695c" }, { type: "text", text: "วินิจฉัย, ป้องกัน, กำจัด", size: "xs", color: "#666666" }] },
                      ],
                      action: { type: "message", text: "โรคและแมลงศัตรูพืช" },
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      backgroundColor: "#e3f2fd",
                      cornerRadius: "10px",
                      paddingAll: "12px",
                      contents: [
                        { type: "text", text: "💧", size: "lg", flex: 0 },
                        { type: "box", layout: "vertical", margin: "md", flex: 1, contents: [{ type: "text", text: "ระบบน้ำ & การให้น้ำ", weight: "bold", size: "sm", color: "#1565c0" }, { type: "text", text: "สปริงเกอร์, น้ำหยด, ท่วมขัง", size: "xs", color: "#666666" }] },
                      ],
                      action: { type: "message", text: "ระบบการให้น้ำพืช" },
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      backgroundColor: "#fff3e0",
                      cornerRadius: "10px",
                      paddingAll: "12px",
                      contents: [
                        { type: "text", text: "✂️", size: "lg", flex: 0 },
                        { type: "box", layout: "vertical", margin: "md", flex: 1, contents: [{ type: "text", text: "การตัดแต่งกิ่ง", weight: "bold", size: "sm", color: "#e65100" }, { type: "text", text: "ทรงพุ่ม, เสริมผลผลิต", size: "xs", color: "#666666" }] },
                      ],
                      action: { type: "message", text: "เทคนิคตัดแต่งกิ่ง" },
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      backgroundColor: "#fce4ec",
                      cornerRadius: "10px",
                      paddingAll: "12px",
                      contents: [
                        { type: "text", text: "🌞", size: "lg", flex: 0 },
                        { type: "box", layout: "vertical", margin: "md", flex: 1, contents: [{ type: "text", text: "สภาพอากาศ & ฤดูกาล", weight: "bold", size: "sm", color: "#c2185b" }, { type: "text", text: "การจัดการตามฤดู", size: "xs", color: "#666666" }] },
                      ],
                      action: { type: "message", text: "การดูแลพืชตามฤดูกาล" },
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
                { type: "button", style: "primary", color: "#00897b", action: { type: "message", label: "📷 ส่งรูปถามโรค", text: "ต้องการวินิจฉัยโรคพืชจากรูปภาพ" } },
              ],
              paddingAll: "12px",
            },
          },
          // ==========================================
          // 💰 BUBBLE 5: ต้นทุน & การวิเคราะห์
          // ==========================================
          {
            type: "bubble",
            size: "mega",
            header: {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "text", text: "💰 ต้นทุน & การวิเคราะห์", weight: "bold", color: "#ffffff", size: "lg" },
                { type: "text", text: "Cost Analysis & Profit Calculator", color: "#ffffffcc", size: "sm" },
              ],
              backgroundColor: "#1976d2",
              paddingAll: "20px",
            },
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "text", text: "📊 เครื่องมือวิเคราะห์", weight: "bold", size: "md", color: "#333333" },
                {
                  type: "box",
                  layout: "vertical",
                  margin: "md",
                  spacing: "sm",
                  contents: [
                    {
                      type: "box",
                      layout: "horizontal",
                      backgroundColor: "#e3f2fd",
                      cornerRadius: "10px",
                      paddingAll: "12px",
                      contents: [
                        { type: "text", text: "🧮", size: "lg", flex: 0 },
                        { type: "box", layout: "vertical", margin: "md", flex: 1, contents: [{ type: "text", text: "คำนวณต้นทุน/ไร่", weight: "bold", size: "sm", color: "#1565c0" }, { type: "text", text: "ปุ๋ย, ยา, แรงงาน, เครื่องจักร", size: "xs", color: "#666666" }] },
                      ],
                      action: { type: "message", text: "คำนวณต้นทุนการเกษตรต่อไร่" },
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      backgroundColor: "#e8f5e9",
                      cornerRadius: "10px",
                      paddingAll: "12px",
                      contents: [
                        { type: "text", text: "📈", size: "lg", flex: 0 },
                        { type: "box", layout: "vertical", margin: "md", flex: 1, contents: [{ type: "text", text: "วิเคราะห์กำไร", weight: "bold", size: "sm", color: "#2e7d32" }, { type: "text", text: "จุดคุ้มทุน, ROI, Break-even", size: "xs", color: "#666666" }] },
                      ],
                      action: { type: "message", text: "วิเคราะห์กำไรการเกษตร" },
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      backgroundColor: "#fff3e0",
                      cornerRadius: "10px",
                      paddingAll: "12px",
                      contents: [
                        { type: "text", text: "📋", size: "lg", flex: 0 },
                        { type: "box", layout: "vertical", margin: "md", flex: 1, contents: [{ type: "text", text: "เปรียบเทียบพืช", weight: "bold", size: "sm", color: "#e65100" }, { type: "text", text: "พืชไหนคุ้มค่ากว่ากัน", size: "xs", color: "#666666" }] },
                      ],
                      action: { type: "message", text: "เปรียบเทียบความคุ้มค่าพืช" },
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      backgroundColor: "#f3e5f5",
                      cornerRadius: "10px",
                      paddingAll: "12px",
                      contents: [
                        { type: "text", text: "🎯", size: "lg", flex: 0 },
                        { type: "box", layout: "vertical", margin: "md", flex: 1, contents: [{ type: "text", text: "วางแผนการเงิน", weight: "bold", size: "sm", color: "#7b1fa2" }, { type: "text", text: "งบประมาณ, สินเชื่อ", size: "xs", color: "#666666" }] },
                      ],
                      action: { type: "message", text: "วางแผนการเงินการเกษตร" },
                    },
                  ],
                },
              ],
              paddingAll: "16px",
            },
            footer: {
              type: "box",
              layout: "horizontal",
              spacing: "sm",
              contents: [
                { type: "button", style: "primary", color: "#1976d2", flex: 1, action: { type: "message", label: "📊 บันทึกบัญชี", text: "/acc" } },
                { type: "button", style: "secondary", flex: 1, action: { type: "message", label: "📑 รายงาน", text: "สรุปบัญชีเดือนนี้" } },
              ],
              paddingAll: "12px",
            },
          },
          // ==========================================
          // 🏛️ BUBBLE 6: เงินอุดหนุนภาครัฐ
          // ==========================================
          {
            type: "bubble",
            size: "mega",
            header: {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "text", text: "🏛️ เงินอุดหนุนภาครัฐ", weight: "bold", color: "#ffffff", size: "lg" },
                { type: "text", text: "Government Subsidies & Support", color: "#ffffffcc", size: "sm" },
              ],
              backgroundColor: "#5e35b1",
              paddingAll: "20px",
            },
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "text", text: "🎁 สิทธิประโยชน์เกษตรกร", weight: "bold", size: "md", color: "#333333" },
                {
                  type: "box",
                  layout: "vertical",
                  margin: "md",
                  spacing: "sm",
                  contents: [
                    {
                      type: "box",
                      layout: "horizontal",
                      backgroundColor: "#ede7f6",
                      cornerRadius: "10px",
                      paddingAll: "12px",
                      contents: [
                        { type: "text", text: "💳", size: "lg", flex: 0 },
                        { type: "box", layout: "vertical", margin: "md", flex: 1, contents: [{ type: "text", text: "เงินช่วยเหลือ ธ.ก.ส.", weight: "bold", size: "sm", color: "#5e35b1" }, { type: "text", text: "สินเชื่อดอกเบี้ยต่ำ, ประกันราคา", size: "xs", color: "#666666" }] },
                      ],
                      action: { type: "message", text: "สินเชื่อ ธกส สำหรับเกษตรกร" },
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      backgroundColor: "#e8f5e9",
                      cornerRadius: "10px",
                      paddingAll: "12px",
                      contents: [
                        { type: "text", text: "🌾", size: "lg", flex: 0 },
                        { type: "box", layout: "vertical", margin: "md", flex: 1, contents: [{ type: "text", text: "ประกันรายได้ชาวนา", weight: "bold", size: "sm", color: "#2e7d32" }, { type: "text", text: "โครงการประกันราคาข้าว", size: "xs", color: "#666666" }] },
                      ],
                      action: { type: "message", text: "โครงการประกันรายได้ชาวนา" },
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      backgroundColor: "#fff3e0",
                      cornerRadius: "10px",
                      paddingAll: "12px",
                      contents: [
                        { type: "text", text: "🏆", size: "lg", flex: 0 },
                        { type: "box", layout: "vertical", margin: "md", flex: 1, contents: [{ type: "text", text: "Smart Farmer", weight: "bold", size: "sm", color: "#e65100" }, { type: "text", text: "สิทธิประโยชน์เกษตรกรรุ่นใหม่", size: "xs", color: "#666666" }] },
                      ],
                      action: { type: "message", text: "สิทธิประโยชน์ Smart Farmer" },
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      backgroundColor: "#e3f2fd",
                      cornerRadius: "10px",
                      paddingAll: "12px",
                      contents: [
                        { type: "text", text: "📝", size: "lg", flex: 0 },
                        { type: "box", layout: "vertical", margin: "md", flex: 1, contents: [{ type: "text", text: "ขึ้นทะเบียนเกษตรกร", weight: "bold", size: "sm", color: "#1565c0" }, { type: "text", text: "กรมส่งเสริมการเกษตร", size: "xs", color: "#666666" }] },
                      ],
                      action: { type: "message", text: "วิธีขึ้นทะเบียนเกษตรกร" },
                    },
                  ],
                },
                { type: "separator", margin: "lg" },
                {
                  type: "box",
                  layout: "vertical",
                  margin: "md",
                  backgroundColor: "#f3e5f5",
                  cornerRadius: "8px",
                  paddingAll: "10px",
                  contents: [
                    { type: "text", text: "📞 สายด่วนเกษตร: 1170", weight: "bold", size: "xs", color: "#5e35b1", align: "center" },
                    { type: "text", text: "กรมส่งเสริมการเกษตร", size: "xs", color: "#666666", align: "center" },
                  ],
                },
              ],
              paddingAll: "16px",
            },
            footer: {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "button", style: "primary", color: "#5e35b1", action: { type: "message", label: "📋 เช็คสิทธิ์ทั้งหมด", text: "สิทธิประโยชน์เกษตรกรทั้งหมด" } },
              ],
              paddingAll: "12px",
            },
          },
          // ==========================================
          // 🤖 BUBBLE 7: AI Consultant & Quick Tools
          // ==========================================
          {
            type: "bubble",
            size: "mega",
            header: {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "text", text: "🤖 AI ที่ปรึกษาเกษตร", weight: "bold", color: "#ffffff", size: "lg" },
                { type: "text", text: "Smart Agriculture AI Assistant", color: "#ffffffcc", size: "sm" },
              ],
              backgroundColor: "#00838f",
              paddingAll: "20px",
            },
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "text", text: "💬 ถาม AI ได้ทุกเรื่อง", weight: "bold", size: "md", color: "#333333" },
                {
                  type: "box",
                  layout: "vertical",
                  margin: "md",
                  spacing: "sm",
                  contents: [
                    {
                      type: "box",
                      layout: "vertical",
                      backgroundColor: "#e0f7fa",
                      cornerRadius: "10px",
                      paddingAll: "12px",
                      contents: [
                        { type: "text", text: "💡 ตัวอย่างคำถาม:", weight: "bold", size: "sm", color: "#006064" },
                        { type: "text", text: "• ทุเรียนใบเหลืองเกิดจากอะไร", size: "xs", color: "#666666", margin: "sm" },
                        { type: "text", text: "• ปุ๋ยสูตรไหนเหมาะกับมะม่วง", size: "xs", color: "#666666" },
                        { type: "text", text: "• ปลูกอะไรดีในช่วงหน้าฝน", size: "xs", color: "#666666" },
                        { type: "text", text: "• ราคายางวันนี้เท่าไร", size: "xs", color: "#666666" },
                        { type: "text", text: "• วิธีกำจัดเพลี้ยแป้งในมันสำปะหลัง", size: "xs", color: "#666666" },
                      ],
                    },
                  ],
                },
                { type: "separator", margin: "lg" },
                { type: "text", text: "⚡ เครื่องมือด่วน", weight: "bold", size: "sm", color: "#333333", margin: "md" },
                {
                  type: "box",
                  layout: "horizontal",
                  margin: "md",
                  spacing: "sm",
                  contents: [
                    { type: "box", layout: "vertical", flex: 1, backgroundColor: "#e8f5e9", cornerRadius: "8px", paddingAll: "10px", contents: [{ type: "text", text: "📊", size: "lg", align: "center" }, { type: "text", text: "บัญชี", size: "xs", align: "center", color: "#2e7d32", weight: "bold" }], action: { type: "message", text: "/acc" } },
                    { type: "box", layout: "vertical", flex: 1, backgroundColor: "#fff3e0", cornerRadius: "8px", paddingAll: "10px", contents: [{ type: "text", text: "🧮", size: "lg", align: "center" }, { type: "text", text: "คำนวณ", size: "xs", align: "center", color: "#e65100", weight: "bold" }], action: { type: "message", text: "คำนวณต้นทุนการเกษตร" } },
                    { type: "box", layout: "vertical", flex: 1, backgroundColor: "#e3f2fd", cornerRadius: "8px", paddingAll: "10px", contents: [{ type: "text", text: "📈", size: "lg", align: "center" }, { type: "text", text: "ราคา", size: "xs", align: "center", color: "#1565c0", weight: "bold" }], action: { type: "message", text: "ราคาสินค้าเกษตรวันนี้" } },
                  ],
                },
              ],
              paddingAll: "16px",
            },
            footer: {
              type: "box",
              layout: "horizontal",
              spacing: "sm",
              contents: [
                { type: "button", style: "primary", color: "#00838f", flex: 1, action: { type: "message", label: "🏠 เมนูหลัก", text: "/welcome" } },
                { type: "button", style: "secondary", flex: 1, action: { type: "message", label: "❓ ช่วยเหลือ", text: "/help" } },
              ],
              paddingAll: "12px",
            },
          },
        ],
      },
    };
  } catch (error) {
    console.error("Error creating smart farm menu:", error);
    return null;
  }
};

module.exports = {
  createStatsDashboard,
  createCalculationDashboard,
  createQuotaLimitMessage,
  createWelcomeMessage,
  createPlasticConsultationMenu,
  createTemperatureTableMessage,
  createSmartFarmMenu,
  createPremiumPackageMessage,
  createHelpMenuMessage,
  // Package Details
  createPackageDetailMessage,
  createAllPackagesCarousel,
  // Digital Logbook
  createProductionReportMessage,
  createSummaryDashboardMessage,
  // Team Communication
  createTeamAnnouncementMessage,
  createBroadcastResultMessage,
  createOrgCodeGuideMessage,
  createReportSuccessQuickMessage,
  // Payment
  createPaymentInstructionMessage,
  createEmailConfirmationMessage,
  // Accounting Guide
  createAccountingGuideMessage,
};
