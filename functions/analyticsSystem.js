/**
 * 📊 Analytics Cloud Functions
 * เก็บข้อมูลผู้เยี่ยมชมลง Firestore
 */

const { onRequest } = require("firebase-functions/v2/https");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

// Note: admin.initializeApp() is called in index.js

const COLLECTIONS = {
    PAGE_VIEWS: "analytics_page_views",
    EVENTS: "analytics_events",
    DAILY_STATS: "analytics_daily_stats",
    VISITORS: "analytics_visitors"
};

// =====================================================
// 📄 TRACK PAGE VIEW
// =====================================================

exports.trackPageView = onRequest({
    region: "us-central1",
    cors: true, // Let Firebase handle standard CORS
    invoker: "public"
}, async (req, res) => {
    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    try {
        const db = getFirestore();
        const data = req.body;

        const ip = req.headers["x-forwarded-for"] || req.connection?.remoteAddress || "unknown";

        const pageView = {
            page: data.page || "/",
            pageTitle: data.pageTitle || "",
            pageUrl: data.pageUrl || "",
            referrer: data.referrer || "direct",
            visitorId: data.visitorId || "unknown",
            sessionId: data.sessionId || "unknown",
            deviceType: data.deviceType || "unknown",
            browser: data.browser || "unknown",
            screenWidth: data.screenWidth || 0,
            screenHeight: data.screenHeight || 0,
            language: data.language || "unknown",
            ipHash: hashIP(ip),
            timezone: data.timezone || "unknown",
            utmSource: data.utmSource || null,
            utmMedium: data.utmMedium || null,
            utmCampaign: data.utmCampaign || null,
            timestamp: FieldValue.serverTimestamp(),
            date: getDateString(),
            hour: new Date().getHours()
        };

        await db.collection(COLLECTIONS.PAGE_VIEWS).add(pageView);
        await updateDailyStats(db, data.page, data.visitorId);
        await updateVisitor(db, data.visitorId, data);

        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error tracking page view:", error);
        res.status(500).json({ error: "Internal error" });
    }
});

// =====================================================
// 🎯 TRACK EVENT
// =====================================================

exports.trackEvent = onRequest({
    region: "us-central1",
    cors: true,
    invoker: "public"
}, async (req, res) => {
    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    try {
        const db = getFirestore();
        const data = req.body;

        const event = {
            eventName: data.eventName || "unknown",
            eventData: data.eventData || {},
            page: data.page || "/",
            visitorId: data.visitorId || "unknown",
            sessionId: data.sessionId || "unknown",
            timestamp: FieldValue.serverTimestamp(),
            date: getDateString()
        };

        await db.collection(COLLECTIONS.EVENTS).add(event);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error tracking event:", error);
        res.status(500).json({ error: "Internal error" });
    }
});

// =====================================================
// 📈 GET ANALYTICS STATS
// =====================================================

exports.getAnalyticsStats = onRequest({
    region: "us-central1",
    cors: true,
    invoker: "public"
}, async (req, res) => {
    try {
        const db = getFirestore();
        const days = parseInt(req.query.days) || 7;

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const statsSnapshot = await db.collection(COLLECTIONS.DAILY_STATS)
            .where("date", ">=", getDateString(startDate))
            .where("date", "<=", getDateString(endDate))
            .orderBy("date", "desc")
            .get();

        const dailyStats = [];
        let totalPageViews = 0;
        let totalVisitors = new Set();

        statsSnapshot.forEach(doc => {
            const data = doc.data();
            dailyStats.push(data);
            totalPageViews += data.pageViews || 0;
            if (data.uniqueVisitors) {
                data.uniqueVisitors.forEach(v => totalVisitors.add(v));
            }
        });

        const topPagesSnapshot = await db.collection(COLLECTIONS.PAGE_VIEWS)
            .where("date", ">=", getDateString(startDate))
            .limit(500)
            .get();

        const pageCounts = {};
        topPagesSnapshot.forEach(doc => {
            const page = doc.data().page;
            pageCounts[page] = (pageCounts[page] || 0) + 1;
        });

        const topPages = Object.entries(pageCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([page, views]) => ({ page, views }));

        const allTimeSnapshot = await db.collection(COLLECTIONS.DAILY_STATS).get();
        let allTimePageViews = 0;
        allTimeSnapshot.forEach(doc => {
            allTimePageViews += doc.data().pageViews || 0;
        });

        const allTimeVisitorsSnapshot = await db.collection(COLLECTIONS.VISITORS).count().get();
        const allTimeUniqueVisitors = allTimeVisitorsSnapshot.data().count;

        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const onlineSnapshot = await db.collection(COLLECTIONS.VISITORS)
            .where("lastSeen", ">=", fiveMinutesAgo)
            .get();
        const onlineNow = onlineSnapshot.size;

        res.status(200).json({
            success: true,
            data: {
                summary: {
                    totalPageViews,
                    allTimePageViews,
                    onlineNow,
                    uniqueVisitors: totalVisitors.size,
                    allTimeUniqueVisitors,
                    avgPagesPerVisitor: totalVisitors.size > 0
                        ? (totalPageViews / totalVisitors.size).toFixed(2)
                        : 0
                },
                dailyStats,
                topPages
            }
        });

    } catch (error) {
        console.error("Error getting analytics:", error);
        res.status(500).json({ error: "Internal error" });
    }
});

// =====================================================
// 🔧 HELPER FUNCTIONS
// =====================================================

function getDateString(date = new Date()) {
    if (!(date instanceof Date) || isNaN(date)) date = new Date();
    return date.toISOString().split("T")[0];
}

function hashIP(ip) {
    let hash = 0;
    for (let i = 0; i < ip.length; i++) {
        const char = ip.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(16);
}

async function updateDailyStats(db, page, visitorId) {
    const dateStr = getDateString();
    const statsRef = db.collection(COLLECTIONS.DAILY_STATS).doc(dateStr);

    await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(statsRef);

        if (doc.exists) {
            const data = doc.data();
            const visitors = data.uniqueVisitors || [];
            if (!visitors.includes(visitorId)) {
                visitors.push(visitorId);
            }

            transaction.update(statsRef, {
                pageViews: FieldValue.increment(1),
                uniqueVisitors: visitors,
                lastUpdated: FieldValue.serverTimestamp()
            });
        } else {
            transaction.set(statsRef, {
                date: dateStr,
                pageViews: 1,
                uniqueVisitors: [visitorId],
                createdAt: FieldValue.serverTimestamp(),
                lastUpdated: FieldValue.serverTimestamp()
            });
        }
    });
}

async function updateVisitor(db, visitorId, data) {
    const visitorRef = db.collection(COLLECTIONS.VISITORS).doc(visitorId);

    await visitorRef.set({
        visitorId,
        lastSeen: FieldValue.serverTimestamp(),
        deviceType: data.deviceType || "unknown",
        browser: data.browser || "unknown",
        language: data.language || "unknown",
        timezone: data.timezone || "unknown",
        totalVisits: FieldValue.increment(1)
    }, { merge: true });
}

module.exports = {
    trackPageView: exports.trackPageView,
    trackEvent: exports.trackEvent,
    getAnalyticsStats: exports.getAnalyticsStats
};
