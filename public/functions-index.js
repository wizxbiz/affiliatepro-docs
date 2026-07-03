/**
 * Firebase Cloud Functions for AI Chat Assistant
 * 
 * Functions:
 * 1. getGeminiResponse - รับคำตอบจาก Gemini AI
 * 2. checkSubscription - ตรวจสอบ Subscription และ Quota
 * 3. updateUserStats - อัพเดทสถิติการใช้งาน
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Initialize Gemini AI
// ⚠️ แทนที่ด้วย Gemini API Key ของคุณ
const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY_HERE';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// ========================================
// 1. Get Gemini Response
// ========================================
exports.getGeminiResponse = functions.https.onCall(async (data, context) => {
    // ตรวจสอบ Authentication
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'User must be authenticated'
        );
    }

    const userId = context.auth.uid;
    const { text } = data;

    // Validate input
    if (!text || typeof text !== 'string') {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Text is required and must be a string'
        );
    }

    if (text.length > 2000) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Text exceeds maximum length of 2000 characters'
        );
    }

    try {
        // ตรวจสอบ Quota
        const canAsk = await checkUserQuota(userId);
        if (!canAsk) {
            throw new functions.https.HttpsError(
                'resource-exhausted',
                'Daily question limit reached'
            );
        }

        // เรียก Gemini API
        const model = genAI.getGenerativeModel({ 
            model: 'gemini-pro',
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2048,
            }
        });

        // System Prompt สำหรับ Injection Molding Expert
        const systemPrompt = `คุณเป็นผู้เชี่ยวชาญด้าน Injection Molding (การฉีดพลาสติก) ที่มีประสบการณ์มากกว่า 20 ปี
        
คุณมีความรู้ครอบคลุมในเรื่อง:
- กระบวนการฉีดพลาสติก (Injection Molding Process)
- แม่พิมพ์และการออกแบบ (Mold Design)
- วัสดุพลาสติก (Plastic Materials)
- พารามิเตอร์การฉีด (Processing Parameters)
- การแก้ปัญหา Defects (Troubleshooting)
- การบำรุงรักษา (Maintenance)
- คุณภาพและมาตรฐาน (Quality Control)

รูปแบบการตอบ:
- ตอบเป็นภาษาไทยที่เข้าใจง่าย
- ให้คำแนะนำที่ปฏิบัติได้จริง
- ยกตัวอย่างประกอบ
- แนะนำพารามิเตอร์ที่เหมาะสม
- เตือนข้อควรระวัง

ถ้าคำถามไม่เกี่ยวกับ Injection Molding:
- ตอบได้แต่บอกว่าความเชี่ยวชาญหลักคือเรื่อง Injection Molding
- ชวนให้ถามเรื่อง Injection Molding

คำถามจากผู้ใช้:
${text}`;

        const result = await model.generateContent(systemPrompt);
        const response = await result.response;
        const textResponse = response.text();

        // บันทึกการใช้งาน
        await logUsage(userId, text, textResponse);

        // Return response
        return {
            text: textResponse,
            timestamp: Date.now()
        };

    } catch (error) {
        console.error('Gemini API Error:', error);
        
        // Handle specific errors
        if (error.message && error.message.includes('quota')) {
            throw new functions.https.HttpsError(
                'resource-exhausted',
                'API quota exceeded. Please try again later.'
            );
        }

        throw new functions.https.HttpsError(
            'internal',
            'Failed to get response from AI'
        );
    }
});

// ========================================
// 2. Check User Quota
// ========================================
async function checkUserQuota(userId) {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        
        if (!userDoc.exists) {
            return false;
        }

        const userData = userDoc.data();
        const today = new Date().toISOString().split('T')[0];

        // Premium users have unlimited quota
        if (userData.subscriptionType === 'premium') {
            return true;
        }

        // Check if new day
        if (userData.lastQuestionDate !== today) {
            // Reset counter for new day
            await db.collection('users').doc(userId).update({
                dailyQuestionCount: 0,
                lastQuestionDate: today
            });
            return true;
        }

        // Get app config
        const configDoc = await db.collection('config').doc('app_settings').get();
        const freeLimit = configDoc.exists ? configDoc.data().freeQuestionLimit : 10;

        // Check quota
        return userData.dailyQuestionCount < freeLimit;

    } catch (error) {
        console.error('Error checking quota:', error);
        return false;
    }
}

// ========================================
// 3. Log Usage
// ========================================
async function logUsage(userId, question, answer) {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // Update user stats
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            const isNewDay = userData.lastQuestionDate !== today;
            
            await userRef.update({
                dailyQuestionCount: isNewDay ? 1 : (userData.dailyQuestionCount || 0) + 1,
                totalQuestionsAsked: (userData.totalQuestionsAsked || 0) + 1,
                lastQuestionDate: today,
                lastActiveAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }

        // Log conversation (optional - for analytics)
        await db.collection('usage_logs').add({
            userId: userId,
            questionLength: question.length,
            answerLength: answer.length,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            date: today
        });

    } catch (error) {
        console.error('Error logging usage:', error);
        // Don't throw - this is not critical
    }
}

// ========================================
// 4. Get User Stats (Optional)
// ========================================
exports.getUserStats = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'User must be authenticated'
        );
    }

    try {
        const userId = context.auth.uid;
        const userDoc = await db.collection('users').doc(userId).get();
        
        if (!userDoc.exists) {
            throw new functions.https.HttpsError(
                'not-found',
                'User not found'
            );
        }

        const userData = userDoc.data();
        const configDoc = await db.collection('config').doc('app_settings').get();
        const freeLimit = configDoc.exists ? configDoc.data().freeQuestionLimit : 10;

        return {
            subscriptionType: userData.subscriptionType,
            dailyQuestionCount: userData.dailyQuestionCount || 0,
            totalQuestionsAsked: userData.totalQuestionsAsked || 0,
            freeLimit: freeLimit,
            remainingQuestions: userData.subscriptionType === 'premium' 
                ? -1 
                : Math.max(0, freeLimit - (userData.dailyQuestionCount || 0))
        };

    } catch (error) {
        console.error('Error getting user stats:', error);
        throw new functions.https.HttpsError('internal', 'Failed to get user stats');
    }
});

// ========================================
// 5. Update Subscription (Admin Only)
// ========================================
exports.updateSubscription = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'User must be authenticated'
        );
    }

    // Check if user is admin
    const adminDoc = await db.collection('admins').doc(context.auth.uid).get();
    if (!adminDoc.exists) {
        throw new functions.https.HttpsError(
            'permission-denied',
            'Only admins can update subscriptions'
        );
    }

    const { userId, subscriptionType } = data;

    if (!userId || !subscriptionType) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'userId and subscriptionType are required'
        );
    }

    if (!['free', 'premium'].includes(subscriptionType)) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Invalid subscription type'
        );
    }

    try {
        await db.collection('users').doc(userId).update({
            subscriptionType: subscriptionType,
            subscriptionUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return { success: true };
    } catch (error) {
        console.error('Error updating subscription:', error);
        throw new functions.https.HttpsError('internal', 'Failed to update subscription');
    }
});

// ========================================
// 6. Submit Feedback
// ========================================
exports.submitFeedback = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'User must be authenticated'
        );
    }

    const { rating, comment, category } = data;

    if (!rating || rating < 1 || rating > 5) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Valid rating (1-5) is required'
        );
    }

    try {
        await db.collection('feedback').add({
            userId: context.auth.uid,
            userEmail: context.auth.token.email || null,
            rating: rating,
            comment: comment || '',
            category: category || 'general',
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        return { success: true };
    } catch (error) {
        console.error('Error submitting feedback:', error);
        throw new functions.https.HttpsError('internal', 'Failed to submit feedback');
    }
});

// ========================================
// 7. Daily Quota Reset (Scheduled Function)
// ========================================
exports.resetDailyQuotas = functions.pubsub
    .schedule('0 0 * * *')
    .timeZone('Asia/Bangkok')
    .onRun(async (context) => {
        console.log('Running daily quota reset...');
        
        try {
            const today = new Date().toISOString().split('T')[0];
            const usersSnapshot = await db.collection('users').get();
            
            const batch = db.batch();
            let count = 0;
            
            usersSnapshot.forEach((doc) => {
                const userData = doc.data();
                
                // Only reset if not already reset today
                if (userData.lastQuestionDate !== today) {
                    batch.update(doc.ref, {
                        dailyQuestionCount: 0,
                        lastQuestionDate: today
                    });
                    count++;
                }
            });
            
            await batch.commit();
            console.log(`Reset quota for ${count} users`);
            
            return null;
        } catch (error) {
            console.error('Error resetting quotas:', error);
            return null;
        }
    });

// ========================================
// 8. Clean Old Logs (Scheduled Function)
// ========================================
exports.cleanOldLogs = functions.pubsub
    .schedule('0 2 * * 0')
    .timeZone('Asia/Bangkok')
    .onRun(async (context) => {
        console.log('Cleaning old logs...');
        
        try {
            // Delete logs older than 90 days
            const ninetyDaysAgo = new Date();
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
            
            const oldLogsSnapshot = await db.collection('usage_logs')
                .where('timestamp', '<', admin.firestore.Timestamp.fromDate(ninetyDaysAgo))
                .get();
            
            const batch = db.batch();
            let count = 0;
            
            oldLogsSnapshot.forEach((doc) => {
                batch.delete(doc.ref);
                count++;
            });
            
            await batch.commit();
            console.log(`Deleted ${count} old logs`);
            
            return null;
        } catch (error) {
            console.error('Error cleaning logs:', error);
            return null;
        }
    });