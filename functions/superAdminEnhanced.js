/**
 * 👑 SUPER ADMIN ENHANCED DASHBOARD
 * ระบบควบคุมขั้นสูงสำหรับ Super Admin
 *
 * Features:
 * - System Control Panel (เปิด/ปิดระบบ, Maintenance Mode)
 * - Advanced Analytics (สถิติเชิงลึก, Trends)
 * - Emergency Controls (Emergency Shutdown, Rollback)
 * - AI Management (AI Settings, Knowledge Base Control)
 * - User Management (Bulk Actions, Advanced Filters)
 * - Database Management (Backup, Restore, Cleanup)
 * - Performance Monitoring (CPU, Memory, Response Time)
 */

/**
 * Create Enhanced Super Admin Control Panel
 * Dashboard หลักที่ให้ Super Admin ควบคุมได้ทุกมิติ
 */
const createEnhancedSuperAdminDashboard = (stats = {}, adminUser = {}) => {
  const systemStats = {
    // System Health
    systemStatus: stats.systemStatus || "online",
    cpuUsage: stats.cpuUsage || 0,
    memoryUsage: stats.memoryUsage || 0,
    responseTime: stats.responseTime || 0,

    // Users
    totalUsers: stats.totalUsers || 0,
    activeToday: stats.activeToday || 0,
    premiumUsers: stats.premiumUsers || 0,
    bannedUsers: stats.bannedUsers || 0,
    onlineNow: stats.onlineNow || 0,

    // Knowledge Base
    knowledgeItems: stats.knowledgeItems || 0,
    verifiedKnowledge: stats.verifiedKnowledge || 0,
    pendingKnowledge: stats.pendingKnowledge || 0,
    knowledgeCategories: stats.knowledgeCategories || 8,

    // AI & Hybrid
    aiQueries: stats.aiQueries || 0,
    hybridQueries: stats.hybridQueries || 0,
    aiSuccessRate: stats.aiSuccessRate || 0,

    // Features
    totalFeatureUsage: stats.totalFeatureUsage || 0,
    visionUsage: stats.visionUsage || 0,
    calculatorUsage: stats.calculatorUsage || 0,

    // Database
    dbSize: stats.dbSize || "0 MB",
    lastBackup: stats.lastBackup || "ไม่มีข้อมูล",

    // Alerts
    criticalAlerts: stats.criticalAlerts || 0,
    warnings: stats.warnings || 0,
  };

  return {
    type: "flex",
    altText: "👑 Enhanced Super Admin Control Center",
    contents: {
      type: "carousel",
      contents: [
        // =================== BUBBLE 1: SYSTEM CONTROL ===================
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
                  {type: "text", text: "⚡", size: "3xl", flex: 0},
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {type: "text", text: "SYSTEM CONTROL", weight: "bold", size: "xl", color: "#ffffff"},
                      {type: "text", text: "ศูนย์ควบคุมระบบหลัก", size: "xs", color: "#ffffff99", margin: "xs"},
                    ],
                    margin: "md",
                  },
                ],
              },
              // Status Bar
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "box",
                    layout: "baseline",
                    contents: [
                      {type: "text", text: systemStats.systemStatus === "online" ? "🟢" : "🔴", size: "sm"},
                      {type: "text", text: systemStats.systemStatus.toUpperCase(), color: "#ffffff", size: "xs", margin: "sm", weight: "bold"},
                    ],
                    flex: 1,
                  },
                  {type: "text", text: `CPU: ${systemStats.cpuUsage}%`, size: "xxs", color: "#ffffff", flex: 1, align: "center"},
                  {type: "text", text: `RAM: ${systemStats.memoryUsage}%`, size: "xxs", color: "#ffffff", flex: 1, align: "end"},
                ],
                margin: "lg",
              },
            ],
            background: {
              type: "linearGradient",
              angle: "135deg",
              startColor: "#dc2626",
              endColor: "#b91c1c",
            },
            paddingAll: "20px",
          },
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              // System Status Cards
              {type: "text", text: "📊 System Health", weight: "bold", size: "sm", color: "#1f2937"},
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {type: "text", text: `${systemStats.responseTime}ms`, size: "lg", weight: "bold", color: "#10b981", align: "center"},
                      {type: "text", text: "Response Time", size: "xxs", color: "#6b7280", align: "center", margin: "xs"},
                    ],
                    backgroundColor: "#ecfdf5",
                    cornerRadius: "10px",
                    paddingAll: "12px",
                    flex: 1,
                  },
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {type: "text", text: systemStats.onlineNow.toString(), size: "lg", weight: "bold", color: "#3b82f6", align: "center"},
                      {type: "text", text: "Online Now", size: "xxs", color: "#6b7280", align: "center", margin: "xs"},
                    ],
                    backgroundColor: "#eff6ff",
                    cornerRadius: "10px",
                    paddingAll: "12px",
                    flex: 1,
                    margin: "sm",
                  },
                ],
                margin: "sm",
              },
              {type: "separator", margin: "lg"},

              // Emergency Controls
              {type: "text", text: "🚨 Emergency Controls", weight: "bold", size: "sm", color: "#dc2626", margin: "lg"},
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "button",
                    action: {type: "message", label: "🔄 Maintenance Mode", text: "/system maintenance toggle"},
                    style: "secondary",
                    color: "#f59e0b",
                    height: "sm",
                  },
                  {
                    type: "button",
                    action: {type: "message", label: "⏸️ Pause All Services", text: "/system pause"},
                    style: "secondary",
                    color: "#ef4444",
                    height: "sm",
                    margin: "sm",
                  },
                  {
                    type: "button",
                    action: {type: "message", label: "🔄 Restart Functions", text: "/system restart"},
                    style: "link",
                    height: "sm",
                    margin: "sm",
                  },
                ],
                margin: "sm",
              },
              {type: "separator", margin: "lg"},

              // System Actions
              {type: "text", text: "⚙️ System Actions", weight: "bold", size: "sm", color: "#1f2937", margin: "lg"},
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {type: "text", text: "💾", size: "xl", align: "center"},
                      {type: "text", text: "Backup", size: "xxs", color: "#6b7280", align: "center", margin: "xs"},
                    ],
                    flex: 1,
                    backgroundColor: "#f0fdf4",
                    cornerRadius: "8px",
                    paddingAll: "10px",
                    action: {type: "message", label: "Backup", text: "/system backup"},
                  },
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {type: "text", text: "🗑️", size: "xl", align: "center"},
                      {type: "text", text: "Cleanup", size: "xxs", color: "#6b7280", align: "center", margin: "xs"},
                    ],
                    flex: 1,
                    backgroundColor: "#fef3c7",
                    cornerRadius: "8px",
                    paddingAll: "10px",
                    margin: "sm",
                    action: {type: "message", label: "Cleanup", text: "/system cleanup"},
                  },
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {type: "text", text: "📈", size: "xl", align: "center"},
                      {type: "text", text: "Logs", size: "xxs", color: "#6b7280", align: "center", margin: "xs"},
                    ],
                    flex: 1,
                    backgroundColor: "#eff6ff",
                    cornerRadius: "8px",
                    paddingAll: "10px",
                    margin: "sm",
                    action: {type: "message", label: "Logs", text: "/system logs"},
                  },
                ],
                margin: "sm",
              },
            ],
            paddingAll: "20px",
          },
          footer: {
            type: "box",
            layout: "horizontal",
            contents: [
              {type: "text", text: "⚠️ Use with caution", size: "xxs", color: "#dc2626", flex: 1},
              {type: "text", text: "1/5", size: "xxs", color: "#9ca3af", align: "end"},
            ],
            paddingAll: "12px",
          },
        },

        // =================== BUBBLE 2: ADVANCED ANALYTICS ===================
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
                  {type: "text", text: "📊", size: "3xl", flex: 0},
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {type: "text", text: "ANALYTICS", weight: "bold", size: "xl", color: "#ffffff"},
                      {type: "text", text: "สถิติเชิงลึกและการวิเคราะห์", size: "xs", color: "#ffffff99", margin: "xs"},
                    ],
                    margin: "md",
                  },
                ],
              },
            ],
            background: {
              type: "linearGradient",
              angle: "135deg",
              startColor: "#6366f1",
              endColor: "#4f46e5",
            },
            paddingAll: "20px",
          },
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              // User Analytics
              {type: "text", text: "👥 User Analytics", weight: "bold", size: "sm", color: "#1f2937"},
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {type: "text", text: systemStats.totalUsers.toLocaleString(), size: "xl", weight: "bold", color: "#6366f1", align: "center"},
                      {type: "text", text: "Total Users", size: "xxs", color: "#6b7280", align: "center", margin: "xs"},
                    ],
                    flex: 1,
                    backgroundColor: "#eff6ff",
                    cornerRadius: "10px",
                    paddingAll: "12px",
                  },
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {type: "text", text: systemStats.activeToday.toString(), size: "xl", weight: "bold", color: "#10b981", align: "center"},
                      {type: "text", text: "Active Today", size: "xxs", color: "#6b7280", align: "center", margin: "xs"},
                    ],
                    flex: 1,
                    backgroundColor: "#ecfdf5",
                    cornerRadius: "10px",
                    paddingAll: "12px",
                    margin: "sm",
                  },
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {type: "text", text: systemStats.premiumUsers.toString(), size: "xl", weight: "bold", color: "#8b5cf6", align: "center"},
                      {type: "text", text: "Premium", size: "xxs", color: "#6b7280", align: "center", margin: "xs"},
                    ],
                    flex: 1,
                    backgroundColor: "#faf5ff",
                    cornerRadius: "10px",
                    paddingAll: "12px",
                    margin: "sm",
                  },
                ],
                margin: "sm",
              },
              {type: "separator", margin: "lg"},

              // AI & Knowledge Analytics
              {type: "text", text: "🤖 AI & Knowledge", weight: "bold", size: "sm", color: "#1f2937", margin: "lg"},
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      {type: "text", text: "📚 Knowledge Base", size: "xs", color: "#4b5563", flex: 1},
                      {type: "text", text: `${systemStats.knowledgeItems} items`, size: "xs", color: "#10b981", weight: "bold", align: "end"},
                    ],
                  },
                  {
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      {type: "text", text: "✅ Verified", size: "xs", color: "#4b5563", flex: 1},
                      {type: "text", text: systemStats.verifiedKnowledge.toString(), size: "xs", color: "#10b981", weight: "bold", align: "end"},
                    ],
                    margin: "sm",
                  },
                  {
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      {type: "text", text: "⏳ Pending", size: "xs", color: "#4b5563", flex: 1},
                      {type: "text", text: systemStats.pendingKnowledge.toString(), size: "xs", color: "#f59e0b", weight: "bold", align: "end"},
                    ],
                    margin: "sm",
                  },
                  {
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      {type: "text", text: "🤖 AI Success Rate", size: "xs", color: "#4b5563", flex: 1},
                      {type: "text", text: `${systemStats.aiSuccessRate}%`, size: "xs", color: "#6366f1", weight: "bold", align: "end"},
                    ],
                    margin: "sm",
                  },
                ],
                backgroundColor: "#f9fafb",
                cornerRadius: "8px",
                paddingAll: "12px",
                margin: "sm",
              },
              {type: "separator", margin: "lg"},

              // Analytics Actions
              {type: "text", text: "📈 Reports & Insights", weight: "bold", size: "sm", color: "#1f2937", margin: "lg"},
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "button",
                    action: {type: "message", label: "📊 User Trends", text: "/analytics users"},
                    style: "primary",
                    color: "#6366f1",
                    height: "sm",
                  },
                  {
                    type: "button",
                    action: {type: "message", label: "🧠 Knowledge Insights", text: "/analytics knowledge"},
                    style: "primary",
                    color: "#8b5cf6",
                    height: "sm",
                    margin: "sm",
                  },
                  {
                    type: "button",
                    action: {type: "message", label: "🤖 AI Performance", text: "/analytics ai"},
                    style: "link",
                    height: "sm",
                    margin: "sm",
                  },
                ],
                margin: "sm",
              },
            ],
            paddingAll: "20px",
          },
          footer: {
            type: "box",
            layout: "horizontal",
            contents: [
              {type: "text", text: "📊 Real-time data", size: "xxs", color: "#6366f1", flex: 1},
              {type: "text", text: "2/5", size: "xxs", color: "#9ca3af", align: "end"},
            ],
            paddingAll: "12px",
          },
        },

        // =================== BUBBLE 3: AI & KNOWLEDGE CONTROL ===================
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
                  {type: "text", text: "🧠", size: "3xl", flex: 0},
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {type: "text", text: "AI CONTROL", weight: "bold", size: "xl", color: "#ffffff"},
                      {type: "text", text: "จัดการ AI และความรู้", size: "xs", color: "#ffffff99", margin: "xs"},
                    ],
                    margin: "md",
                  },
                ],
              },
              // Knowledge Stats
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {type: "text", text: `📚 ${systemStats.knowledgeItems} items`, size: "xs", color: "#ffffff", flex: 1},
                  {type: "text", text: `${systemStats.knowledgeCategories} categories`, size: "xs", color: "#ffffff99", align: "end"},
                ],
                margin: "lg",
              },
            ],
            background: {
              type: "linearGradient",
              angle: "135deg",
              startColor: "#8b5cf6",
              endColor: "#7c3aed",
            },
            paddingAll: "20px",
          },
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              // Knowledge Management
              {type: "text", text: "📚 Knowledge Management", weight: "bold", size: "sm", color: "#1f2937"},
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {type: "text", text: "📖", size: "xxl", align: "center"},
                      {type: "text", text: "View All", size: "xxs", color: "#6b7280", align: "center", margin: "xs"},
                    ],
                    flex: 1,
                    backgroundColor: "#f0fdf4",
                    cornerRadius: "8px",
                    paddingAll: "10px",
                    action: {type: "message", label: "View All", text: "ดูความรู้ทั้งหมด"},
                  },
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {type: "text", text: "➕", size: "xxl", align: "center"},
                      {type: "text", text: "Add New", size: "xxs", color: "#10b981", align: "center", margin: "xs", weight: "bold"},
                    ],
                    flex: 1,
                    backgroundColor: "#ecfdf5",
                    cornerRadius: "8px",
                    paddingAll: "10px",
                    margin: "sm",
                    action: {type: "message", label: "Add", text: "เพิ่มความรู้"},
                  },
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {type: "text", text: "✅", size: "xxl", align: "center"},
                      {type: "text", text: "Verify", size: "xxs", color: "#6b7280", align: "center", margin: "xs"},
                    ],
                    flex: 1,
                    backgroundColor: "#eff6ff",
                    cornerRadius: "8px",
                    paddingAll: "10px",
                    margin: "sm",
                    action: {type: "message", label: "Verify", text: "verify ความรู้"},
                  },
                ],
                margin: "sm",
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {type: "text", text: "🧪", size: "xxl", align: "center"},
                      {type: "text", text: "Test Hybrid", size: "xxs", color: "#6b7280", align: "center", margin: "xs"},
                    ],
                    flex: 1,
                    backgroundColor: "#fef3c7",
                    cornerRadius: "8px",
                    paddingAll: "10px",
                    action: {type: "message", label: "Test", text: "ทดสอบ hybrid ABS รอยยุบ"},
                  },
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {type: "text", text: "🔧", size: "xxl", align: "center"},
                      {type: "text", text: "Optimize", size: "xxs", color: "#6b7280", align: "center", margin: "xs"},
                    ],
                    flex: 1,
                    backgroundColor: "#fef2f2",
                    cornerRadius: "8px",
                    paddingAll: "10px",
                    margin: "sm",
                    action: {type: "message", label: "Optimize", text: "ปรับปรุงคลัง"},
                  },
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {type: "text", text: "📊", size: "xxl", align: "center"},
                      {type: "text", text: "Stats", size: "xxs", color: "#6b7280", align: "center", margin: "xs"},
                    ],
                    flex: 1,
                    backgroundColor: "#faf5ff",
                    cornerRadius: "8px",
                    paddingAll: "10px",
                    margin: "sm",
                    action: {type: "message", label: "Stats", text: "/hybridstats"},
                  },
                ],
                margin: "sm",
              },
              {type: "separator", margin: "lg"},

              // AI Settings
              {type: "text", text: "🤖 AI Settings", weight: "bold", size: "sm", color: "#1f2937", margin: "lg"},
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "button",
                    action: {type: "message", label: "⚙️ AI Configuration", text: "/ai config"},
                    style: "primary",
                    color: "#8b5cf6",
                    height: "sm",
                  },
                  {
                    type: "button",
                    action: {type: "message", label: "🎯 Strategy Settings", text: "/ai strategy"},
                    style: "secondary",
                    height: "sm",
                    margin: "sm",
                  },
                  {
                    type: "button",
                    action: {type: "message", label: "📝 Prompt Management", text: "/ai prompts"},
                    style: "link",
                    height: "sm",
                    margin: "sm",
                  },
                ],
                margin: "sm",
              },
            ],
            paddingAll: "20px",
          },
          footer: {
            type: "box",
            layout: "horizontal",
            contents: [
              {type: "text", text: "🧠 AI powered", size: "xxs", color: "#8b5cf6", flex: 1},
              {type: "text", text: "3/5", size: "xxs", color: "#9ca3af", align: "end"},
            ],
            paddingAll: "12px",
          },
        },

        // =================== BUBBLE 4: USER MANAGEMENT ===================
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
                  {type: "text", text: "👥", size: "3xl", flex: 0},
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {type: "text", text: "USER CONTROL", weight: "bold", size: "xl", color: "#ffffff"},
                      {type: "text", text: "จัดการผู้ใช้ขั้นสูง", size: "xs", color: "#ffffff99", margin: "xs"},
                    ],
                    margin: "md",
                  },
                ],
              },
              // User Stats
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {type: "text", text: `👥 ${systemStats.totalUsers} users`, size: "xs", color: "#ffffff", flex: 1},
                  {type: "text", text: `${systemStats.onlineNow} online`, size: "xs", color: "#ffffff99", align: "end"},
                ],
                margin: "lg",
              },
            ],
            background: {
              type: "linearGradient",
              angle: "135deg",
              startColor: "#f59e0b",
              endColor: "#d97706",
            },
            paddingAll: "20px",
          },
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              // User Overview
              {type: "text", text: "👥 User Overview", weight: "bold", size: "sm", color: "#1f2937"},
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {type: "text", text: systemStats.activeToday.toString(), size: "lg", weight: "bold", color: "#10b981", align: "center"},
                      {type: "text", text: "Active", size: "xxs", color: "#6b7280", align: "center", margin: "xs"},
                    ],
                    flex: 1,
                    backgroundColor: "#ecfdf5",
                    cornerRadius: "8px",
                    paddingAll: "10px",
                  },
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {type: "text", text: systemStats.premiumUsers.toString(), size: "lg", weight: "bold", color: "#8b5cf6", align: "center"},
                      {type: "text", text: "Premium", size: "xxs", color: "#6b7280", align: "center", margin: "xs"},
                    ],
                    flex: 1,
                    backgroundColor: "#faf5ff",
                    cornerRadius: "8px",
                    paddingAll: "10px",
                    margin: "sm",
                  },
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {type: "text", text: systemStats.bannedUsers.toString(), size: "lg", weight: "bold", color: "#ef4444", align: "center"},
                      {type: "text", text: "Banned", size: "xxs", color: "#6b7280", align: "center", margin: "xs"},
                    ],
                    flex: 1,
                    backgroundColor: "#fef2f2",
                    cornerRadius: "8px",
                    paddingAll: "10px",
                    margin: "sm",
                  },
                ],
                margin: "sm",
              },
              {type: "separator", margin: "lg"},

              // User Actions
              {type: "text", text: "⚙️ User Management", weight: "bold", size: "sm", color: "#1f2937", margin: "lg"},
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "button",
                    action: {type: "message", label: "📋 View All Users", text: "/users all"},
                    style: "primary",
                    color: "#f59e0b",
                    height: "sm",
                  },
                  {
                    type: "button",
                    action: {type: "message", label: "🔍 Search User", text: "/user search"},
                    style: "secondary",
                    height: "sm",
                    margin: "sm",
                  },
                  {
                    type: "button",
                    action: {type: "message", label: "⏳ Pending Approvals", text: "/pending"},
                    style: "link",
                    height: "sm",
                    margin: "sm",
                  },
                ],
                margin: "sm",
              },
              {type: "separator", margin: "lg"},

              // Bulk Actions
              {type: "text", text: "🎯 Bulk Actions", weight: "bold", size: "sm", color: "#1f2937", margin: "lg"},
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {type: "text", text: "✉️", size: "xl", align: "center"},
                      {type: "text", text: "Message", size: "xxs", color: "#6b7280", align: "center", margin: "xs"},
                    ],
                    flex: 1,
                    backgroundColor: "#eff6ff",
                    cornerRadius: "8px",
                    paddingAll: "8px",
                    action: {type: "message", label: "Broadcast", text: "/broadcast"},
                  },
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {type: "text", text: "🔄", size: "xl", align: "center"},
                      {type: "text", text: "Reset Quota", size: "xxs", color: "#6b7280", align: "center", margin: "xs"},
                    ],
                    flex: 1,
                    backgroundColor: "#fef3c7",
                    cornerRadius: "8px",
                    paddingAll: "8px",
                    margin: "sm",
                    action: {type: "message", label: "Reset", text: "/bulk resetquota"},
                  },
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {type: "text", text: "🚫", size: "xl", align: "center"},
                      {type: "text", text: "Bulk Ban", size: "xxs", color: "#6b7280", align: "center", margin: "xs"},
                    ],
                    flex: 1,
                    backgroundColor: "#fef2f2",
                    cornerRadius: "8px",
                    paddingAll: "8px",
                    margin: "sm",
                    action: {type: "message", label: "Ban", text: "/bulk ban"},
                  },
                ],
                margin: "sm",
              },
            ],
            paddingAll: "20px",
          },
          footer: {
            type: "box",
            layout: "horizontal",
            contents: [
              {type: "text", text: "👥 User management", size: "xxs", color: "#f59e0b", flex: 1},
              {type: "text", text: "4/5", size: "xxs", color: "#9ca3af", align: "end"},
            ],
            paddingAll: "12px",
          },
        },

        // =================== BUBBLE 5: DATABASE & MONITORING ===================
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
                  {type: "text", text: "💾", size: "3xl", flex: 0},
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {type: "text", text: "DATABASE", weight: "bold", size: "xl", color: "#ffffff"},
                      {type: "text", text: "จัดการฐานข้อมูลและ Monitoring", size: "xs", color: "#ffffff99", margin: "xs"},
                    ],
                    margin: "md",
                  },
                ],
              },
              // DB Stats
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {type: "text", text: `💾 ${systemStats.dbSize}`, size: "xs", color: "#ffffff", flex: 1},
                  {type: "text", text: `Last backup: ${systemStats.lastBackup}`, size: "xxs", color: "#ffffff99", align: "end"},
                ],
                margin: "lg",
              },
            ],
            background: {
              type: "linearGradient",
              angle: "135deg",
              startColor: "#10b981",
              endColor: "#059669",
            },
            paddingAll: "20px",
          },
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              // Database Management
              {type: "text", text: "💾 Database Management", weight: "bold", size: "sm", color: "#1f2937"},
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "button",
                    action: {type: "message", label: "💾 Create Backup", text: "/db backup create"},
                    style: "primary",
                    color: "#10b981",
                    height: "sm",
                  },
                  {
                    type: "button",
                    action: {type: "message", label: "📥 Restore Database", text: "/db restore"},
                    style: "secondary",
                    height: "sm",
                    margin: "sm",
                  },
                  {
                    type: "button",
                    action: {type: "message", label: "🗑️ Cleanup Old Data", text: "/db cleanup"},
                    style: "link",
                    height: "sm",
                    margin: "sm",
                  },
                ],
                margin: "sm",
              },
              {type: "separator", margin: "lg"},

              // Performance Monitoring
              {type: "text", text: "📈 Performance", weight: "bold", size: "sm", color: "#1f2937", margin: "lg"},
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      {type: "text", text: "⚡ Response Time", size: "xs", color: "#4b5563", flex: 1},
                      {type: "text", text: `${systemStats.responseTime}ms`, size: "xs", color: "#10b981", weight: "bold", align: "end"},
                    ],
                  },
                  {
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      {type: "text", text: "💻 CPU Usage", size: "xs", color: "#4b5563", flex: 1},
                      {type: "text", text: `${systemStats.cpuUsage}%`, size: "xs", color: systemStats.cpuUsage > 80 ? "#ef4444" : "#10b981", weight: "bold", align: "end"},
                    ],
                    margin: "sm",
                  },
                  {
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      {type: "text", text: "🧠 Memory Usage", size: "xs", color: "#4b5563", flex: 1},
                      {type: "text", text: `${systemStats.memoryUsage}%`, size: "xs", color: systemStats.memoryUsage > 80 ? "#ef4444" : "#10b981", weight: "bold", align: "end"},
                    ],
                    margin: "sm",
                  },
                ],
                backgroundColor: "#f9fafb",
                cornerRadius: "8px",
                paddingAll: "12px",
                margin: "sm",
              },
              {type: "separator", margin: "lg"},

              // Alerts & Logs
              {type: "text", text: "🚨 Alerts & Logs", weight: "bold", size: "sm", color: "#1f2937", margin: "lg"},
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {type: "text", text: systemStats.criticalAlerts.toString(), size: "xl", weight: "bold", color: "#ef4444", align: "center"},
                      {type: "text", text: "Critical", size: "xxs", color: "#6b7280", align: "center", margin: "xs"},
                    ],
                    flex: 1,
                    backgroundColor: "#fef2f2",
                    cornerRadius: "8px",
                    paddingAll: "10px",
                    action: {type: "message", label: "Alerts", text: "/alerts critical"},
                  },
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {type: "text", text: systemStats.warnings.toString(), size: "xl", weight: "bold", color: "#f59e0b", align: "center"},
                      {type: "text", text: "Warnings", size: "xxs", color: "#6b7280", align: "center", margin: "xs"},
                    ],
                    flex: 1,
                    backgroundColor: "#fef3c7",
                    cornerRadius: "8px",
                    paddingAll: "10px",
                    margin: "sm",
                    action: {type: "message", label: "Warnings", text: "/alerts warnings"},
                  },
                ],
                margin: "sm",
              },
              {
                type: "button",
                action: {type: "message", label: "📋 View Full Logs", text: "/system logs full"},
                style: "link",
                height: "sm",
                margin: "md",
              },
            ],
            paddingAll: "20px",
          },
          footer: {
            type: "box",
            layout: "horizontal",
            contents: [
              {type: "text", text: "💾 Database & monitoring", size: "xxs", color: "#10b981", flex: 1},
              {type: "text", text: "5/5", size: "xxs", color: "#9ca3af", align: "end"},
            ],
            paddingAll: "12px",
          },
        },
      ],
    },
  };
};

module.exports = {
  createEnhancedSuperAdminDashboard,
};
