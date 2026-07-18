/**
 * 🔥 Firebase Initialization & Global Configuration
 */

if (typeof window.firebaseConfig === 'undefined') {
    window.firebaseConfig = {
        apiKey: "AIzaSyBKL6HBLEndDX4LYo7APFNQ0IVICLJtaIE",
        authDomain: "appinjproject.firebaseapp.com",
        projectId: "appinjproject",
        storageBucket: "appinjproject.firebasestorage.app",
        messagingSenderId: "408718656984",
        appId: "1:408718656984:web:08bd8f084769d428251ead"
    };
}

// Cloudflare Migration: Unconditionally load cloudflare-client.js to override Firebase SDK and route all database/auth calls to Workers
console.log('[Cloudflare Migration] Injecting cloudflare-client.js to override Firebase SDK...');
try {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', '/js/cloudflare-client.js?v=20260713a', false); // synchronous request
    xhr.send(null);
    if (xhr.status === 200) {
        const script = document.createElement('script');
        script.text = xhr.responseText;
        document.head.appendChild(script);
        console.log('✅ Cloudflare Client shim injected successfully');
    } else {
        throw new Error(`HTTP ${xhr.status}`);
    }
} catch (e) {
    console.error('[Cloudflare Migration] CRITICAL: Failed to load Cloudflare Client:', e);
}

// Expose Services to window for global access (Conditional)
// Auth
if (typeof firebase.auth === 'function') {
    window.auth = firebase.auth();
} else {
    console.warn('[Firebase] Auth SDK missing. window.auth will not be available.');
}

// Firestore (Database)
if (typeof firebase.firestore === 'function') {
    window.db = firebase.firestore();
    // Optimize Firestore connection
    try {
        window.db.settings({
            experimentalAutoDetectLongPolling: true,
            merge: true
        });
    } catch (e) {
        // Already initialized elsewhere or setting not supported
    }
} else {
    console.warn('[Firebase] Firestore SDK missing. window.db will not be available.');
}

// Storage (Assets)
if (typeof firebase.storage === 'function') {
    window.storage = firebase.storage();
} else {
    console.warn('[Firebase] Storage SDK missing. window.storage will not be available.');
}

// Global State Variables
window.currentCategory = 'all';
window.isAdmin = false;
window.currentUserId = null;
window.currentLineUserId = null;
window.userLikedIds = [];
window.userFollowingIds = [];
window.postToDelete = null;
window.totalPostsCount = 0;
window.totalLikesCount = 0;
window.allAds = [];
window.marketplaceProducts = [];
window.communityGroups = [];
window.isTuktukAutoScroll = localStorage.getItem('tuktuk_autoscroll') !== 'false';
window.currentPromoSlide = 0;
window.promoSlideInterval = null;

// Modals
window.commentModal = null;
window.postModal = null;
window.deleteModal = null;
window.currentCommentPostId = null;

// Category Labels
window.categoryLabels = {
    news: '📰 ข่าวสาร',
    video: '🎬 วิดีโอ/บันเทิง',
    update: '🔄 อัปเดต',
    tip: '💡 เคล็ดลับ',
    event: '📅 กิจกรรม',
    promo: '🏷️ โปรโมชั่น'
};
