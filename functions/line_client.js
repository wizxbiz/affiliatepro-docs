const line = require("@line/bot-sdk");

// ==========================================
// ENV-BASED CREDENTIALS (ไม่ใช้ Secret Manager)
// อ่านจาก functions/.env ไฟล์โดยตรง
// ==========================================

// Injection Molding Bot (Bot 1)
const injectionChannelSecret = { value: () => process.env.INJECTION_CHANNEL_SECRET || process.env.LINE_CHANNEL_SECRET || "" };
const injectionChannelAccessToken = { value: () => process.env.INJECTION_CHANNEL_ACCESS_TOKEN || process.env.LINE_CHANNEL_ACCESS_TOKEN || "" };

// TukTuk Thailand Bot (Bot 2)
const tuktukChannelSecret = { value: () => process.env.TUKTUK_CHANNEL_SECRET || "" };
const tuktukChannelAccessToken = { value: () => process.env.TUKTUK_CHANNEL_ACCESS_TOKEN || "" };

// ==========================================
// HELPER FUNCTIONS (อ่าน process.env โดยตรง)
// ==========================================

/**
 * Get Injection Molding Bot Client (call at runtime)
 */
function getInjectionClient() {
    try {
        return new line.messagingApi.MessagingApiClient({
            channelAccessToken: injectionChannelAccessToken.value()
        });
    } catch (error) {
        console.error("❌ Failed to create Injection Client:", error.message);
        return null;
    }
}

/**
 * Get TukTuk Thailand Bot Client (call at runtime)
 */
function getTuktukClient() {
    try {
        return new line.messagingApi.MessagingApiClient({
            channelAccessToken: tuktukChannelAccessToken.value()
        });
    } catch (error) {
        console.error("❌ Failed to create TukTuk Client:", error.message);
        return null;
    }
}

/**
 * Get Injection Bot Config (call at runtime)
 */
function getInjectionConfig() {
    return {
        channelAccessToken: injectionChannelAccessToken.value(),
        channelSecret: injectionChannelSecret.value(),
    };
}

/**
 * Get TukTuk Bot Config (call at runtime)
 */
function getTuktukConfig() {
    return {
        channelAccessToken: tuktukChannelAccessToken.value(),
        channelSecret: tuktukChannelSecret.value(),
    };
}

// ==========================================
// EXPORTS
// ==========================================
module.exports = {
    // Secret definitions (for function config)
    secrets: {
        injection: {
            channelSecret: injectionChannelSecret,
            channelAccessToken: injectionChannelAccessToken
        },
        tuktuk: {
            channelSecret: tuktukChannelSecret,
            channelAccessToken: tuktukChannelAccessToken
        }
    },

    // Runtime helper functions
    getInjectionClient,
    getTuktukClient,
    getInjectionConfig,
    getTuktukConfig,

    // Legacy exports (backward compatibility - will be created at runtime)
    get lineClient() {
        return getInjectionClient();
    },
    get lineConfig() {
        return getInjectionConfig();
    },
    get injectionClient() {
        return getInjectionClient();
    },
    get injectionConfig() {
        return getInjectionConfig();
    },
    get tuktukClient() {
        return getTuktukClient();
    },
    get tuktukConfig() {
        return getTuktukConfig();
    }
};
