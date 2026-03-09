/**
 * 🔥 Firebase Configuration for WiT 365 Training Center
 * =====================================================
 * ไฟล์ตั้งค่า Firebase สำหรับระบบ Training
 * 
 * @version 1.0.5
 * @author WiT 365 Team
 */

// ===========================================
// 📋 Firebase Configuration
// ===========================================
const firebaseConfig = {
    apiKey: "AIzaSyBKL6HBLEndDX4LYo7APFNQ0IVICLJtaIE",
    authDomain: "appinjproject.firebaseapp.com",
    databaseURL: "https://appinjproject-default-rtdb.firebaseio.com",
    projectId: "appinjproject",
    storageBucket: "appinjproject.firebasestorage.app",
    messagingSenderId: "408718656984",
    appId: "1:408718656984:web:08bd8f084769d428251ead",
    measurementId: "G-7ZM9H01D6E"
};

// ===========================================
// 🚀 Initialize Firebase
// ===========================================
let app, auth, db, storage, analytics;

function initializeFirebase() {
    try {
        // Initialize Firebase App
        if (!firebase.apps.length) {
            app = firebase.initializeApp(firebaseConfig);
        } else {
            app = firebase.app();
        }

        // Initialize Services
        auth = firebase.auth();
        db = firebase.firestore();

        // Optimize connection settings - Fix for network timeouts
        try {
            db.settings({
                experimentalForceLongPolling: true
            });
        } catch (e) {
            console.warn('⚠️ Could not set Firestore settings:', e);
        }

        if (firebase.storage) {
            storage = firebase.storage();
        }

        // Initialize Analytics (if available)
        if (firebase.analytics) {
            analytics = firebase.analytics();
        }

        // Enable Firestore offline persistence
        db.enablePersistence({ synchronizeTabs: true })
            .catch((err) => {
                if (err.code === 'failed-precondition') {
                    console.warn('⚠️ Multiple tabs open, persistence enabled in first tab only');
                } else if (err.code === 'unimplemented') {
                    console.warn('⚠️ Browser doesn\'t support persistence');
                }
            });

        console.log('✅ Firebase initialized successfully');
        return true;
    } catch (error) {
        console.error('❌ Firebase initialization error:', error);
        return false;
    }
}

// ===========================================
// 📊 Firestore Collections Reference
// ===========================================
const COLLECTIONS = {
    // User Management
    USERS: 'training_users',
    USER_PROFILES: 'training_user_profiles',

    // Course & Learning
    COURSES: 'training_courses',
    MODULES: 'training_modules',
    LESSONS: 'training_lessons',

    // Progress Tracking
    PROGRESS: 'training_progress',
    MODULE_PROGRESS: 'training_module_progress',
    LESSON_PROGRESS: 'training_lesson_progress',

    // Quiz System
    QUIZZES: 'training_quizzes',
    QUESTIONS: 'training_questions',
    QUIZ_RESULTS: 'training_quiz_results',
    QUIZ_ANSWERS: 'training_quiz_answers',

    // Certificates
    CERTIFICATES: 'training_certificates',

    // Activity & Analytics
    ACTIVITY_LOG: 'training_activity_log',
    ANALYTICS: 'training_analytics',

    // Admin
    SETTINGS: 'training_settings',
    ANNOUNCEMENTS: 'training_announcements'
};

// ===========================================
// 🔐 Auth State Observer
// ===========================================
let currentUser = null;
let authStateListeners = [];

function onAuthStateChanged(callback) {
    authStateListeners.push(callback);

    // Immediate callback if user already exists
    if (currentUser !== null) {
        callback(currentUser);
    }
}

auth?.onAuthStateChanged((user) => {
    currentUser = user;
    authStateListeners.forEach(callback => callback(user));

    if (user) {
        console.log('👤 User signed in:', user.email);
        logActivity('login', { email: user.email });
    } else {
        console.log('👤 User signed out');
    }
});

// ===========================================
// 📝 Activity Logger
// ===========================================
async function logActivity(action, data = {}) {
    if (!db || !currentUser) return;

    try {
        await db.collection(COLLECTIONS.ACTIVITY_LOG).add({
            userId: currentUser.uid,
            userEmail: currentUser.email,
            action: action,
            data: data,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            userAgent: navigator.userAgent,
            platform: navigator.platform
        });
    } catch (error) {
        console.error('❌ Activity log error:', error);
    }
}

// ===========================================
// 🛠️ Utility Functions
// ===========================================

/**
 * Get Firestore Server Timestamp
 */
function serverTimestamp() {
    return firebase.firestore.FieldValue.serverTimestamp();
}

/**
 * Increment a field value
 */
function increment(value = 1) {
    return firebase.firestore.FieldValue.increment(value);
}

/**
 * Array Union - Add items to array
 */
function arrayUnion(...items) {
    return firebase.firestore.FieldValue.arrayUnion(...items);
}

/**
 * Array Remove - Remove items from array
 */
function arrayRemove(...items) {
    return firebase.firestore.FieldValue.arrayRemove(...items);
}

/**
 * Delete a field
 */
function deleteField() {
    return firebase.firestore.FieldValue.delete();
}

// ===========================================
// 🌐 Export for Global Use
// ===========================================
window.FirebaseConfig = {
    // Instances
    app,
    auth,
    db,
    storage,
    analytics,

    // Collections
    COLLECTIONS,

    // Current User
    get currentUser() { return currentUser; },

    // Auth State
    onAuthStateChanged,

    // Activity
    logActivity,

    // Utilities
    serverTimestamp,
    increment,
    arrayUnion,
    arrayRemove,
    deleteField,

    // Initialize
    init: initializeFirebase
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFirebase);
} else {
    initializeFirebase();
}

console.log('🔥 Firebase Config [V1.0.5] loaded - WiT 365 Training Center');
