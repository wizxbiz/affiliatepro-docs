/**
 * 👑 ENHANCED ADMIN HANDLERS
 * Handler สำหรับคำสั่งใน Enhanced Super Admin Dashboard
 *
 * Categories:
 * 1. System Control
 * 2. Analytics
 * 3. AI Management
 * 4. User Management
 * 5. Database & Monitoring
 */

const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { createSimpleMessage } = require("./adminFlexMessages");
const {
  createUsersListFlex,
  createAnalyticsUsersFlex,
  createAIConfigFlex,
  createAIStrategyFlex,
} = require("./enhancedAdminFlex");

// =================== 1. SYSTEM CONTROL HANDLERS ===================

/**
 * Toggle Maintenance Mode
 * คำสั่ง: /system maintenance toggle
 */
async function handleMaintenanceToggle(db, userId, lineClient, replyToken) {
  try {
    const systemRef = db.collection("system_config").doc("settings");
    const systemDoc = await systemRef.get();

    const currentMode = systemDoc.exists ? (systemDoc.data().maintenanceMode || false) : false;
    const newMode = !currentMode;

    await systemRef.set({
      maintenanceMode: newMode,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: userId,
      reason: newMode ? "Manual toggle by Super Admin" : "System resumed",
    }, { merge: true });

    const message = newMode ?
      "🔧 **Maintenance Mode: ON**\n\n⏸️ ระบบหยุดให้บริการชั่วคราว\n👥 ผู้ใช้จะได้รับแจ้งเตือน\n⏰ กลับมาให้บริการเร็วๆ นี้\n\n✅ เปิด Maintenance Mode สำเร็จ" :
      "✅ **Maintenance Mode: OFF**\n\n🟢 ระบบกลับมาให้บริการปกติ\n👥 ผู้ใช้สามารถใช้งานได้แล้ว\n\n✅ ปิด Maintenance Mode สำเร็จ";

    await lineClient.replyMessage({
      replyToken: replyToken,
      messages: [createSimpleMessage(message, true)]
    });
    return true;
  } catch (error) {
    console.error("Error toggling maintenance:", error);
    await lineClient.replyMessage({
      replyToken: replyToken,
      messages: [createSimpleMessage(`❌ เกิดข้อผิดพลาด: ${error.message}`, false)]
    });
    return false;
  }
}

/**
 * Pause All Services
 * คำสั่ง: /system pause
 */
async function handleSystemPause(db, userId, lineClient, replyToken) {
  try {
    const systemRef = db.collection("system_config").doc("settings");

    await systemRef.set({
      servicesPaused: true,
      pausedAt: FieldValue.serverTimestamp(),
      pausedBy: userId,
      aiEnabled: false,
      visionEnabled: false,
      calculatorEnabled: false,
    }, { merge: true });

    const message = "⏸️ **All Services Paused**\n\n❌ AI: Disabled\n❌ Vision: Disabled\n❌ Calculator: Disabled\n\n⚠️ ระบบหยุดให้บริการทั้งหมดชั่วคราว\n\n💡 พิมพ์ '/system resume' เพื่อเปิดใช้งาน";

    await lineClient.replyMessage({
      replyToken: replyToken,
      messages: [createSimpleMessage(message, false)]
    });
    return true;
  } catch (error) {
    console.error("Error pausing services:", error);
    await lineClient.replyMessage({
      replyToken: replyToken,
      messages: [createSimpleMessage(`❌ เกิดข้อผิดพลาด: ${error.message}`, false)]
    });
    return false;
  }
}

/**
 * Resume All Services
 * คำสั่ง: /system resume
 */
async function handleSystemResume(db, userId, lineClient, replyToken) {
  try {
    const systemRef = db.collection("system_config").doc("settings");

    await systemRef.set({
      servicesPaused: false,
      resumedAt: FieldValue.serverTimestamp(),
      resumedBy: userId,
      aiEnabled: true,
      visionEnabled: true,
      calculatorEnabled: true,
    }, { merge: true });

    const message = "▶️ **All Services Resumed**\n\n✅ AI: Enabled\n✅ Vision: Enabled\n✅ Calculator: Enabled\n\n🟢 ระบบกลับมาให้บริการปกติ";

    await lineClient.replyMessage({
      replyToken: replyToken,
      messages: [createSimpleMessage(message, true)]
    });
    return true;
  } catch (error) {
    console.error("Error resuming services:", error);
    await lineClient.replyMessage({
      replyToken: replyToken,
      messages: [createSimpleMessage(`❌ เกิดข้อผิดพลาด: ${error.message}`, false)]
    });
    return false;
  }
}

/**
 * System Backup
 * คำสั่ง: /system backup
 */
async function handleSystemBackup(db, userId, lineClient, replyToken) {
  try {
    const backupId = `backup_${Date.now()}`;
    const backupRef = db.collection("system_backups").doc(backupId);

    // นับจำนวนข้อมูลในแต่ละ collection
    const usersCount = (await db.collection("users").count().get()).data().count;
    const knowledgeCount = (await db.collection("hyper_knowledge").count().get()).data().count;
    const logsCount = (await db.collection("hybrid_usage_logs").limit(1000).get()).size;

    await backupRef.set({
      backupId,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: userId,
      collections: {
        users: usersCount,
        knowledge: knowledgeCount,
        logs: logsCount,
      },
      status: "completed",
      type: "manual",
    });

    const message = `💾 **Backup สำเร็จ**\n\n📦 Backup ID: ${backupId}\n📊 สรุป:\n  • Users: ${usersCount}\n  • Knowledge: ${knowledgeCount}\n  • Logs: ${logsCount}\n\n✅ สำรองข้อมูลเรียบร้อย`;

    await lineClient.replyMessage({
      replyToken: replyToken,
      messages: [createSimpleMessage(message, true)]
    });
    return true;
  } catch (error) {
    console.error("Error creating backup:", error);
    await lineClient.replyMessage({
      replyToken: replyToken,
      messages: [createSimpleMessage(`❌ Backup failed: ${error.message}`, false)]
    });
    return false;
  }
}

/**
 * System Cleanup
 * คำสั่ง: /system cleanup
 */
async function handleSystemCleanup(db, userId, lineClient, replyToken) {
  try {
    console.log("🗑️ Starting system cleanup...");
    const startTime = Date.now();

    // ลบ logs เก่ากว่า 30 วัน
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const oldLogsSnapshot = await db.collection("hybrid_usage_logs")
      .where("timestamp", "<", thirtyDaysAgo)
      .get();

    let deletedCount = 0;
    const batch = db.batch();

    oldLogsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
      deletedCount++;
    });

    if (deletedCount > 0) {
      await batch.commit();
    }

    const performedAt = new Date();

    // บันทึกการทำความสะอาด
    await db.collection("system_logs").add({
      type: "cleanup",
      performedBy: userId,
      performedAt: FieldValue.serverTimestamp(),
      itemsDeleted: deletedCount,
      scope: "hybrid_usage_logs > 30 days",
      duration: Date.now() - startTime,
    });

    // สร้าง Flex Message
    const { createSystemCleanupFlex } = require("./adminFlexMessages");
    const cleanupResult = {
      deletedCount,
      scope: "hybrid_usage_logs > 30 days",
      performedAt,
      estimatedSpaceSaved: deletedCount * 1024, // bytes
    };

    const flexMessage = createSystemCleanupFlex(cleanupResult);
    await lineClient.replyMessage({
      replyToken: replyToken,
      messages: [flexMessage]
    });

    console.log(`✅ Cleanup completed: ${deletedCount} items deleted in ${Date.now() - startTime}ms`);
    return true;
  } catch (error) {
    console.error("Error cleaning up:", error);
    await lineClient.replyMessage({
      replyToken: replyToken,
      messages: [createSimpleMessage(`❌ Cleanup failed: ${error.message}`, false)]
    });
    return false;
  }
}

/**
 * View System Logs
 * คำสั่ง: /system logs
 */
async function handleSystemLogs(db, userId, lineClient, replyToken, showFull = false) {
  try {
    console.log(`📋 Fetching system logs (full: ${showFull})...`);

    const limit = showFull ? 50 : 10;
    const logsSnapshot = await db.collection("system_logs")
      .orderBy("performedAt", "desc")
      .limit(limit)
      .get();

    const logs = [];
    const byType = {};

    logsSnapshot.forEach((doc) => {
      const data = doc.data();
      logs.push({
        id: doc.id,
        type: data.type || "info",
        scope: data.scope || "",
        description: data.description || "",
        performedBy: data.performedBy || "system",
        performedAt: data.performedAt?.toDate() || new Date(),
        itemsDeleted: data.itemsDeleted || 0,
      });

      byType[data.type || "info"] = (byType[data.type || "info"] || 0) + 1;
    });

    // สร้าง Flex Message
    const { createSystemLogsFlex } = require("./adminFlexMessages");
    const logsData = {
      logs,
      stats: {
        total: logs.length,
        byType,
      },
      showFull,
    };

    const flexMessage = createSystemLogsFlex(logsData);
    await lineClient.replyMessage({
      replyToken: replyToken,
      messages: [flexMessage]
    });

    console.log(`✅ Sent ${logs.length} system logs`);
    return true;
  } catch (error) {
    console.error("Error fetching logs:", error);
    await lineClient.replyMessage({
      replyToken: replyToken,
      messages: [createSimpleMessage(`❌ Error: ${error.message}`, false)]
    });
    return false;
  }
}

// =================== 2. ANALYTICS HANDLERS ===================

/**
 * User Analytics
 * คำสั่ง: /analytics users
 */
async function handleAnalyticsUsers(db, userId, lineClient, replyToken) {
  try {
    // ดึงข้อมูลจาก line_users collection (LINE User IDs จริง)
    const lineUsersSnapshot = await db.collection("line_users").get();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let stats = {
      total: lineUsersSnapshot.size,
      premium: 0,
      trial: 0,
      banned: 0,
      activeToday: 0,
      active7Days: 0,
      active30Days: 0,
      newToday: 0,
      new7Days: 0,
    };

    console.log(`📊 Analyzing ${stats.total} LINE users...`);

    lineUsersSnapshot.forEach((doc) => {
      const data = doc.data();

      if (data.isPremium) stats.premium++;
      if (data.trialStatus === "active") stats.trial++;
      if (data.banned) stats.banned++;

      const lastActive = data.lastActiveAt?.toDate();
      if (lastActive) {
        if (lastActive >= today) stats.activeToday++;
        if (lastActive >= sevenDaysAgo) stats.active7Days++;
        if (lastActive >= thirtyDaysAgo) stats.active30Days++;
      }

      const createdAt = data.createdAt?.toDate();
      if (createdAt) {
        if (createdAt >= today) stats.newToday++;
        if (createdAt >= sevenDaysAgo) stats.new7Days++;
      }
    });

    console.log(`✅ Analytics: Total=${stats.total}, Premium=${stats.premium}, Active7d=${stats.active7Days}`);

    // Create beautiful Flex Message
    const flexMessage = createAnalyticsUsersFlex(stats);

    await lineClient.replyMessage({
      replyToken: replyToken,
      messages: [flexMessage]
    });
    return true;
  } catch (error) {
    console.error("❌ Error analytics users:", error);
    await lineClient.replyMessage({
      replyToken: replyToken,
      messages: [createSimpleMessage(`❌ Error: ${error.message}`, false)]
    });
    return false;
  }
}

/**
 * Knowledge Analytics
 * คำสั่ง: /analytics knowledge
 */
async function handleAnalyticsKnowledge(db, userId, lineClient, replyToken) {
  try {
    const knowledgeSnapshot = await db.collection("hyper_knowledge").get();

    let stats = {
      total: knowledgeSnapshot.size,
      verified: 0,
      pending: 0,
      byCategory: {},
      avgUseCount: 0,
      topUsed: [],
    };

    const allKnowledge = [];

    knowledgeSnapshot.forEach((doc) => {
      const data = doc.data();

      if (data.verified) {
        stats.verified++;
      } else {
        stats.pending++;
      }

      const category = data.category || "uncategorized";
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;

      allKnowledge.push({
        id: doc.id,
        problem: data.problem,
        useCount: data.useCount || 0,
      });
    });

    // คำนวณ average use count
    const totalUseCount = allKnowledge.reduce((sum, k) => sum + k.useCount, 0);
    stats.avgUseCount = stats.total > 0 ? (totalUseCount / stats.total).toFixed(1) : 0;

    // Top 3 most used
    stats.topUsed = allKnowledge
      .sort((a, b) => b.useCount - a.useCount)
      .slice(0, 3)
      .map((k) => `${k.problem.substring(0, 30)}... (${k.useCount} ครั้ง)`);

    let message = `🧠 **Knowledge Analytics**\n\n` +
      `📚 **Overview:**\n` +
      `  • Total: ${stats.total}\n` +
      `  • Verified: ${stats.verified}\n` +
      `  • Pending: ${stats.pending}\n` +
      `  • Avg Use: ${stats.avgUseCount} ครั้ง\n\n` +
      `📁 **By Category:**\n`;

    Object.entries(stats.byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([cat, count]) => {
        message += `  • ${cat}: ${count}\n`;
      });

    message += `\n🏆 **Top Used:**\n`;
    stats.topUsed.forEach((item, i) => {
      message += `  ${i + 1}. ${item}\n`;
    });

    await lineClient.replyMessage({
      replyToken: replyToken,
      messages: [createSimpleMessage(message, true)]
    });
    return true;
  } catch (error) {
    console.error("Error analytics knowledge:", error);
    await lineClient.replyMessage({
      replyToken: replyToken,
      messages: [createSimpleMessage(`❌ Error: ${error.message}`, false)]
    });
    return false;
  }
}

/**
 * AI Performance Analytics
 * คำสั่ง: /analytics ai
 */
async function handleAnalyticsAI(db, userId, lineClient, replyToken) {
  try {
    const logsSnapshot = await db.collection("hybrid_usage_logs")
      .orderBy("timestamp", "desc")
      .limit(500)
      .get();

    let stats = {
      total: logsSnapshot.size,
      byStrategy: {
        local_primary: 0,
        balanced_hybrid: 0,
        ai_primary: 0,
        best_effort: 0,
      },
      avgConfidence: 0,
      successRate: 0,
      avgResponseTime: 0,
    };

    let totalConfidence = 0;
    let totalResponseTime = 0;
    let successCount = 0;

    logsSnapshot.forEach((doc) => {
      const data = doc.data();

      const strategy = data.strategy || "best_effort";
      stats.byStrategy[strategy]++;

      if (data.confidence) totalConfidence += data.confidence;
      if (data.responseTime) totalResponseTime += data.responseTime;
      if (data.helpful !== false && data.confidence > 0.6) successCount++;
    });

    stats.avgConfidence = stats.total > 0 ? ((totalConfidence / stats.total) * 100).toFixed(1) : 0;
    stats.avgResponseTime = stats.total > 0 ? (totalResponseTime / stats.total).toFixed(0) : 0;
    stats.successRate = stats.total > 0 ? ((successCount / stats.total) * 100).toFixed(1) : 0;

    // Use Flex Message
    const { createAIAnalyticsFlex } = require("./adminFlexMessages");
    const flexMessage = createAIAnalyticsFlex(stats);

    await lineClient.replyMessage({
      replyToken: replyToken,
      messages: [flexMessage]
    });
    return true;
  } catch (error) {
    console.error("Error analytics AI:", error);
    await lineClient.replyMessage({
      replyToken: replyToken,
      messages: [createSimpleMessage(`❌ Error: ${error.message}`, false)]
    });
    return false;
  }
}

// =================== 3. AI MANAGEMENT HANDLERS ===================

/**
 * AI Configuration
 * คำสั่ง: /ai config
 */
async function handleAIConfig(db, userId, lineClient, replyToken) {
  try {
    const configRef = db.collection("system_config").doc("ai_settings");
    const configDoc = await configRef.get();

    const config = configDoc.exists ? configDoc.data() : {
      enabled: true,
      model: "gemini-pro",
      temperature: 0.7,
      maxTokens: 2048,
      topP: 0.9,
      topK: 40,
    };

    // Create beautiful Flex Message
    const flexMessage = createAIConfigFlex(config);

    await lineClient.replyMessage({
      replyToken: replyToken,
      messages: [flexMessage]
    });
    return true;
  } catch (error) {
    console.error("Error AI config:", error);
    await lineClient.replyMessage({
      replyToken: replyToken,
      messages: [createSimpleMessage(`❌ Error: ${error.message}`, false)]
    });
    return false;
  }
}

/**
 * AI Strategy Settings
 * คำสั่ง: /ai strategy
 */
async function handleAIStrategy(db, userId, lineClient, replyToken) {
  try {
    const strategyRef = db.collection("system_config").doc("hybrid_strategy");
    const strategyDoc = await strategyRef.get();

    const strategy = strategyDoc.exists ? strategyDoc.data() : {
      defaultStrategy: "balanced_hybrid",
      localConfidenceThreshold: 0.7,
      aiConfidenceThreshold: 0.6,
      balancedThreshold: 0.4,
      enableFallback: true,
    };

    // Create beautiful Flex Message
    const flexMessage = createAIStrategyFlex(strategy);

    await lineClient.replyMessage(replyToken, flexMessage);
    return true;
  } catch (error) {
    console.error("Error AI strategy:", error);
    await lineClient.replyMessage({
      replyToken: replyToken,
      messages: [createSimpleMessage(`❌ Error: ${error.message}`, false)]
    });
    return false;
  }
}

/**
 * AI Prompt Management
 * คำสั่ง: /ai prompts
 */
async function handleAIPrompts(db, userId, lineClient, replyToken) {
  try {
    console.log("📝 Fetching AI prompts...");

    const promptsSnapshot = await db.collection("ai_prompts").get();

    const prompts = [];
    const byType = {};
    let totalLength = 0;

    promptsSnapshot.forEach((doc) => {
      const data = doc.data();
      const promptLength = (data.prompt || "").length;

      prompts.push({
        id: doc.id,
        type: data.type || "general",
        prompt: data.prompt || "",
        updatedAt: data.updatedAt?.toDate() || new Date(),
      });

      byType[data.type || "general"] = (byType[data.type || "general"] || 0) + 1;
      totalLength += promptLength;
    });

    // Sort by updated date
    prompts.sort((a, b) => b.updatedAt - a.updatedAt);

    // สร้าง Flex Message
    const { createAIPromptsFlex } = require("./adminFlexMessages");
    const promptsData = {
      prompts,
      stats: {
        total: prompts.length,
        byType,
        avgLength: prompts.length > 0 ? Math.round(totalLength / prompts.length) : 0,
      },
    };

    const flexMessage = createAIPromptsFlex(promptsData);
    await lineClient.replyMessage({
      replyToken: replyToken,
      messages: [flexMessage]
    });

    console.log(`✅ Sent ${prompts.length} AI prompts`);
    return true;
  } catch (error) {
    console.error("Error AI prompts:", error);
    await lineClient.replyMessage({
      replyToken: replyToken,
      messages: [createSimpleMessage(`❌ Error: ${error.message}`, false)]
    });
    return false;
  }
}

// =================== 4. USER MANAGEMENT HANDLERS ===================

/**
 * View All Users (with pagination)
 * คำสั่ง: /users all
 */
async function handleUsersAll(db, userId, lineClient, replyToken) {
  try {
    console.log("📊 Fetching all users from LINE API...");

    // 1. ดึงข้อมูลจาก line_users collection (เก็บ LINE User IDs จริง)
    const lineUsersSnapshot = await db.collection("line_users").get();

    const lineUserIds = [];
    const lineUsersData = {};

    lineUsersSnapshot.forEach((doc) => {
      const lineUserId = doc.id; // LINE User ID (Uxxxxxxxxxxxx)
      lineUserIds.push(lineUserId);
      lineUsersData[lineUserId] = doc.data();
    });

    console.log(`📦 Found ${lineUserIds.length} LINE users in Firestore`);

    // 2. ดึงข้อมูล Profile จริงจาก LINE Messaging API
    const users = [];
    const stats = { premium: 0, trial: 0, banned: 0, online: 0, total: 0 };
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    for (const lineUserId of lineUserIds) {
      try {
        // ดึง Profile จริงจาก LINE API
        const profile = await lineClient.getProfile(lineUserId);
        const userData = lineUsersData[lineUserId] || {};

        // คำนวณ isActive
        const lastActiveAt = userData.lastActiveAt?.toDate();
        const isActiveNow = lastActiveAt && lastActiveAt >= fiveMinutesAgo;

        users.push({
          id: lineUserId, // LINE User ID จริง (Uxxxxxxxxxxxx)
          displayName: profile.displayName, // ชื่อจริงจาก LINE
          pictureUrl: profile.pictureUrl,
          isPremium: userData.isPremium || false,
          trialStatus: userData.trialStatus || "none",
          banned: userData.banned || false,
          isActive: isActiveNow,
          fromLINE: true,
          createdAt: userData.createdAt?.toDate().toLocaleDateString("th-TH") || "N/A",
        });

        // Calculate stats
        if (userData.isPremium) stats.premium++;
        if (userData.trialStatus === "active") stats.trial++;
        if (userData.banned) stats.banned++;
        if (isActiveNow) stats.online++;
        stats.total++;

        console.log(`✅ Got profile: ${profile.displayName} (${lineUserId})`);
      } catch (err) {
        // User อาจ unfollow หรือ block bot แล้ว
        console.log(`⚠️ Cannot get profile for ${lineUserId}: ${err.message}`);

        const userData = lineUsersData[lineUserId] || {};
        users.push({
          id: lineUserId,
          displayName: userData.displayName || "Unfollowed User",
          isPremium: userData.isPremium || false,
          trialStatus: userData.trialStatus || "none",
          banned: userData.banned || false,
          isActive: false,
          fromLINE: false,
          createdAt: userData.createdAt?.toDate().toLocaleDateString("th-TH") || "N/A",
        });

        if (userData.isPremium) stats.premium++;
        if (userData.trialStatus === "active") stats.trial++;
        if (userData.banned) stats.banned++;
        stats.total++;
      }
    }

    console.log(`✅ Total users: ${users.length}`);
    console.log(`📊 Stats: Premium=${stats.premium}, Trial=${stats.trial}, Banned=${stats.banned}, Online=${stats.online}`);

    // Create beautiful Flex Message
    const flexMessage = createUsersListFlex(users, stats);

    await lineClient.replyMessage({
      replyToken: replyToken,
      messages: [flexMessage]
    });
    return true;
  } catch (error) {
    console.error("❌ Error users all:", error);
    await lineClient.replyMessage({
      replyToken: replyToken,
      messages: [createSimpleMessage(`❌ Error: ${error.message}`, false)]
    });
    return false;
  }
}

/**
 * Search User
 * คำสั่ง: /user search
 */
async function handleUserSearch(db, userId, lineClient, replyToken) {
  try {
    const message = `🔍 **Search User**\n\n` +
      `วิธีใช้:\n` +
      `  • /user [userId] - ค้นหาด้วย ID\n` +
      `  • /search [name] - ค้นหาด้วยชื่อ\n\n` +
      `ตัวอย่าง:\n` +
      `  /user U1234567890\n` +
      `  /search วิทยา`;

    await lineClient.replyMessage({
      replyToken: replyToken,
      messages: [createSimpleMessage(message, false)]
    });
    return true;
  } catch (error) {
    console.error("Error user search:", error);
    return false;
  }
}

/**
 * Bulk Reset Quota
 * คำสั่ง: /bulk resetquota
 */
async function handleBulkResetQuota(db, userId, lineClient, replyToken) {
  try {
    const usersSnapshot = await db.collection("users").get();

    const batch = db.batch();
    let count = 0;

    usersSnapshot.forEach((doc) => {
      batch.update(doc.ref, {
        quotaUsed: 0,
        quotaResetAt: FieldValue.serverTimestamp(),
        quotaResetBy: userId,
      });
      count++;
    });

    await batch.commit();

    // Log
    await db.collection("system_logs").add({
      type: "bulk_reset_quota",
      performedBy: userId,
      performedAt: FieldValue.serverTimestamp(),
      affectedUsers: count,
    });

    const message = `🔄 **Bulk Reset Quota สำเร็จ**\n\n` +
      `📊 รีเซ็ต quota ผู้ใช้: ${count} คน\n` +
      `✅ ทุกคนสามารถใช้งานได้เต็มที่\n\n` +
      `⏰ ${new Date().toLocaleString("th-TH")}`;

    await lineClient.replyMessage({
      replyToken: replyToken,
      messages: [createSimpleMessage(message, true)]
    });
    return true;
  } catch (error) {
    console.error("Error bulk reset quota:", error);
    await lineClient.replyMessage({
      replyToken: replyToken,
      messages: [createSimpleMessage(`❌ Error: ${error.message}`, false)]
    });
    return false;
  }
}

// =================== 5. DATABASE HANDLERS ===================

/**
 * Database Backup (Full)
 * คำสั่ง: /db backup create
 */
async function handleDatabaseBackup(db, userId, lineClient, replyToken) {
  return await handleSystemBackup(db, userId, lineClient, replyToken);
}

/**
 * View Alerts
 * คำสั่ง: /alerts critical, /alerts warnings
 */
async function handleAlerts(db, userId, lineClient, replyToken, type = "all") {
  try {
    const alertsSnapshot = await db.collection("system_alerts")
      .where("status", "==", "active")
      .orderBy("createdAt", "desc")
      .limit(10)
      .get();

    let message = `🚨 **System Alerts**\n\n`;
    let count = { critical: 0, warning: 0, info: 0 };

    alertsSnapshot.forEach((doc) => {
      const data = doc.data();
      const severity = data.severity || "info";

      if (type !== "all" && severity !== type) return;

      count[severity]++;

      const icon = severity === "critical" ? "🔴" : (severity === "warning" ? "🟡" : "🔵");
      message += `${icon} **${data.title || "Alert"}**\n`;
      message += `  ${data.message || "No details"}\n`;
      message += `  ⏰ ${data.createdAt?.toDate().toLocaleString("th-TH") || "N/A"}\n\n`;
    });

    message += `📊 Summary:\n`;
    message += `  🔴 Critical: ${count.critical}\n`;
    message += `  🟡 Warning: ${count.warning}\n`;
    message += `  🔵 Info: ${count.info}`;

    if (alertsSnapshot.empty) {
      message = "✅ No active alerts";
    }

    await lineClient.replyMessage({
      replyToken: replyToken,
      messages: [createSimpleMessage(message, count.critical === 0)]
    });
    return true;
  } catch (error) {
    console.error("Error alerts:", error);
    await lineClient.replyMessage({
      replyToken: replyToken,
      messages: [createSimpleMessage(`❌ Error: ${error.message}`, false)]
    });
    return false;
  }
}

// =================== EXPORTS ===================

module.exports = {
  // System Control
  handleMaintenanceToggle,
  handleSystemPause,
  handleSystemResume,
  handleSystemBackup,
  handleSystemCleanup,
  handleSystemLogs,

  // Analytics
  handleAnalyticsUsers,
  handleAnalyticsKnowledge,
  handleAnalyticsAI,

  // AI Management
  handleAIConfig,
  handleAIStrategy,
  handleAIPrompts,

  // User Management
  handleUsersAll,
  handleUserSearch,
  handleBulkResetQuota,

  // Database
  handleDatabaseBackup,
  handleAlerts,
};
