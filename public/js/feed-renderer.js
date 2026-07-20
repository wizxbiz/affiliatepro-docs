// ================================================
// feed-renderer.js - TukTuk Feed Renderer V5
// Complete Version - Video Player + Feed Renderers + Post CRUD + R2 Upload + Creator Panel
// ================================================

// ================================================
// CONFIGURATION & CONSTANTS
// ================================================
const FEED_RENDERER_CONFIG = {
    // Timing (ms)
    VIDEO_LOAD_TIMEOUT: 10000,
    PRODUCT_DELAY: 15000,
    AUTO_SCROLL_DELAY: 20000,
    DOUBLE_TAP_THRESHOLD: 300,
    VIEW_TRACK_DELAY: 2000,
    OBSERVER_THRESHOLD: 0.5,
    WELCOME_CARD_DURATION: 6000,
    SPLASH_DURATION: 3000,
    NETWORK_SPEED_INTERVAL: 5000,
    VIEW_TRACK_DELAY: 2000,
    
    // Limits
    MAX_UPLOAD_FILES: 10,
    MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
    MAX_VIDEO_SIZE: 25 * 1024 * 1024, // 25MB
    MAX_CONTENT_LENGTH: 5000,
    POSTS_PER_PAGE: 20,
    NEWS_PER_PAGE: 10,
    PRODUCTS_PER_PAGE: 50,
    
    // Features
    ENABLE_LINE_FIX: true,
    ENABLE_OFFLINE_QUEUE: true,
    ENABLE_CACHE: true,
    ENABLE_VERIFICATION: true,
    ENABLE_AI_ASSISTANT: true,
    
    // URLs
    // ✅ ใช้ Cloudflare Workers API แทน Cloud Function
    R2_PRESIGN_URL: '/api/utility/r2-presigned-url',
    AI_ASSIST_URL: 'https://aicontentassist-47mhcx3iqq-uc.a.run.app',
    GO_ENGINE_URL: window.location.origin.includes('localhost') 
        ? 'http://localhost:8080' 
        : (window.TUKTUK_LIFF?.apiBase || 'https://tuktuk-engine.fly.dev'),
    
    // ✅ Collections (Cloudflare D1)
    COLLECTIONS: {
        POSTS: 'posts',
        NEWS: 'news_feed',
        PRODUCTS: 'products',
        USERS: 'users',
        NOTIFICATIONS: 'notifications',
        LIKES: 'post_likes'
    }
};

// ================================================
// GLOBAL STATE (Namespaced)
// ================================================
window.FeedRenderer = window.FeedRenderer || {
    // Players
    players: {},
    videoLoadTimers: {},
    productTimers: {},
    productAutoScrollTimers: {},
    
    // Feed data
    currentFeed: [],
    allPostsData: [],
    marketplaceProducts: [],
    latestNewsFeed: [],
    communityGroups: [],
    
    // State
    currentCategory: 'all',
    currentUserId: null,
    currentLineUserId: null,
    userLikedIds: [],
    userFollowingIds: [],
    isAdmin: false,
    isMuted: localStorage.getItem('tuktuk_muted') !== 'false',
    isAutoScroll: localStorage.getItem('tuktuk_autoscroll') !== 'false',
    
    // Pagination
    lastVisibleDoc: null,
    isLoadingMore: false,
    hasMore: true,
    
    // Cache
    feedCache: {},
    cacheTimestamps: {},
    viewedPosts: new Set(),
    
    // Flags
    isLineApp: /Line\//i.test(navigator.userAgent),
    isYouTubeAPIReady: false,
    isInitialized: false,
    
    // Stats
    metrics: {
        loads: 0,
        errors: 0,
        cacheHits: 0,
        views: 0,
        likes: 0,
        shares: 0
    },
    
    // Observers
    observers: [],
    intervals: [],
    timeouts: [],
    
    // Upload queue
    uploadQueue: [],
    isUploading: false
};

// Alias for backward compatibility
window.tuktukPlayers = window.FeedRenderer.players;
window.videoLoadTimers = window.FeedRenderer.videoLoadTimers;
window.productTimers = window.FeedRenderer.productTimers;
window.productAutoScrollTimers = window.FeedRenderer.productAutoScrollTimers;
window.viewedPosts = window.FeedRenderer.viewedPosts;
window._isLineApp = window.FeedRenderer.isLineApp;
window.isTuktukGlobalMuted = window.FeedRenderer.isMuted;
window.isTuktukAutoScroll = window.FeedRenderer.isAutoScroll;

// ================================================
// PROFANITY LIST (Check if already defined)
// ================================================
if (typeof window.PROFANITY_LIST === 'undefined') {
    window.PROFANITY_LIST = [
        "ไอ้เหี้ย", "ไอ้สัส", "ไอ้สัตว์", "ควย", "หี", "แตด", "เย็ด", "มึง", "กู", "ส้นตีน", "ตีน",
        "หัวควย", "กระหรี่", "ร่าน", "บ้า", "โง่", "ควาย", "เหี้ย", "สัส", "จัญไร", "ระยำ",
        "ชั่ว", "เลว", "กาก", "ขยะ", "ดอกทอง", "กะหรี่", "สันดาน", "อีควาย", "อีตัว",
        "112", "สถาบัน", "กษัตริย์", "ในหลวง", "ราชวงศ์", "เบื้องสูง", "มาตรา 112", "ปฏิรูปสถาบัน",
        "ล้มล้าง", "หมิ่น", "หมิ่นพระบรม", "ล้มเจ้า", "ปฏิวัติ",
        "การพนัน", "เว็บพนัน", "สล็อต", "บาคาร่า", "แทงบอล", "หวยออนไลน์", "UFA", "คาสิโนออนไลน์",
        "ยาบ้า", "ยาไอซ์", "กัญชา", "เฮโรอีน", "โคเคน", "ยาเค", "ยาเสพติด", "ขายบริการ", "ไซด์ไลน์",
        "โสเภณี", "ค้าประเวณี", "อาวุธปืน", "ปืนเถื่อน", "ระเบิด", "ฆ่า", "ข่มขืน", "รุมโทรม",
        "fuck", "shit", "asshole", "bitch", "cunt", "damn", "hell", "pussy", "dick", "bastard",
        "motherfucker", "fucker", "slut", "whore", "nigger", "faggot", "porn", "sex", "anal", "oral",
        "hee", "hum"
    ];
}

// ================================================
// CATEGORY LABELS
// ================================================
var categoryLabels = window.categoryLabels || {
    news: '📰 ข่าวสาร',
    video: '🎬 วิดีโอ/บันเทิง',
    update: '🔄 อัปเดต',
    tip: '💡 เคล็ดลับ',
    event: '📅 กิจกรรม',
    promo: '🏷️ โปรโมชั่น',
    weather: '🌦️ สภาพอากาศ',
    product: '🛒 สินค้า'
};

// ================================================
// AUTHOR CACHE
// ================================================
var authorCache = window.authorCache || new Map();
window.authorCache = authorCache; // Expose to window for other scripts to share the same cache

// ================================================
// UTILITY FUNCTIONS
// ================================================

/**
 * Safe localStorage access
 */
function safeLocalStorage(key, defaultValue = null) {
    try {
        const value = localStorage.getItem(key);
        return value !== null ? value : defaultValue;
    } catch (e) {
        console.warn('[FeedRenderer] localStorage error:', e);
        return defaultValue;
    }
}

/**
 * Safe sessionStorage access
 */
function safeSessionStorage(key, defaultValue = null) {
    try {
        const value = sessionStorage.getItem(key);
        return value !== null ? value : defaultValue;
    } catch (e) {
        console.warn('[FeedRenderer] sessionStorage error:', e);
        return defaultValue;
    }
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info', duration = 3000) {
    // Remove existing toast
    const existing = document.querySelector('.feed-toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = `feed-toast feed-toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? 'linear-gradient(135deg, #10b981, #059669)' : 
                     type === 'error' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 
                     type === 'warning' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 
                     'linear-gradient(135deg, #3b82f6, #2563eb)'};
        color: white;
        padding: 12px 24px;
        border-radius: 50px;
        font-weight: 600;
        z-index: 99999;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        animation: feedToastIn 0.3s ease;
    `;
    document.body.appendChild(toast);
    
    const timeout = setTimeout(() => {
        toast.style.animation = 'feedToastOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, duration);
    
    FeedRenderer.timeouts.push(timeout);
}

/**
 * Show notification (alternative)
 */
function showNotification(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `custom-toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    toast.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        padding: 12px 25px;
        background: rgba(15, 23, 42, 0.9);
        backdrop-filter: blur(15px);
        color: white;
        border-radius: 50px;
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 99999;
        box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        animation: slideUpToast 0.4s ease;
        border: 1px solid rgba(255,255,255,0.1);
        transition: all 0.5s ease;
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Format time ago
 */
function formatTimeAgo(timestamp) {
    if (!timestamp) return 'เมื่อสักครู่';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 60) return 'เมื่อสักครู่';
    if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
    if (diffHour < 24) return `${diffHour} ชั่วโมงที่แล้ว`;
    if (diffDay < 7) return `${diffDay} วันที่แล้ว`;
    
    return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Format notification time
 */
function formatNotifTime(timestamp) {
    if (!timestamp) return 'เมื่อสักครู่';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const seconds = Math.floor((Date.now() - date) / 1000);
    
    if (seconds < 60) return 'เมื่อสักครู่';
    if (seconds < 3600) return Math.floor(seconds / 60) + ' นาทีที่แล้ว';
    if (seconds < 86400) return Math.floor(seconds / 3600) + ' ชั่วโมงที่แล้ว';
    
    return date.toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short'
    });
}

/**
 * Format content (with HTML detection)
 */
function formatContent(content) {
    if (!content) return '';
    
    const hasHTML = /<[a-z][\s\S]*>/i.test(content);
    if (hasHTML) {
        return content;
    }
    
    return escapeHtml(content).replace(/\n/g, '<br>');
}

/**
 * Format time for video progress
 */
function formatTime(seconds) {
    if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

/**
 * Format number with commas
 */
function formatNumber(num) {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString();
}

/**
 * Contains profanity check
 */
function containsProfanity(text) {
    if (!text) return false;
    const lowerText = text.toLowerCase();
    return window.PROFANITY_LIST.some(word => lowerText.includes(word));
}

/**
 * Filter profanity
 */
function filterProfanity(text) {
    if (!text) return '';
    let filtered = text;
    window.PROFANITY_LIST.forEach(word => {
        const reg = new RegExp(word, 'gi');
        filtered = filtered.replace(reg, '*'.repeat(word.length));
    });
    return filtered;
}

/**
 * Debounce function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Haptic feedback
 */
function triggerHaptic(pattern = 10) {
    if (window.navigator && window.navigator.vibrate) {
        try {
            window.navigator.vibrate(pattern);
        } catch (e) {
            // Ignore
        }
    }
}

// ================================================
// TOAST STYLES
// ================================================
if (!document.getElementById('feed-toast-styles')) {
    const style = document.createElement('style');
    style.id = 'feed-toast-styles';
    style.textContent = `
        @keyframes feedToastIn {
            from { opacity: 0; transform: translate(-50%, 20px); }
            to { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes feedToastOut {
            from { opacity: 1; transform: translate(-50%, 0); }
            to { opacity: 0; transform: translate(-50%, -20px); }
        }
        @keyframes slideUpToast {
            from { transform: translateX(-50%) translateY(100px); opacity: 0; }
            to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
        .custom-toast.warning i { color: #f59e0b; }
        .custom-toast.error i { color: #ef4444; }
    `;
    document.head.appendChild(style);
}

// ================================================
// VIDEO LOADING & ERROR HANDLING
// ================================================

/**
 * Load video source (with LINE fix)
 */
async function loadVideoSrc(video, url) {
    if (!url) return;
    
    try {
        // LINE browser fix for Firebase Storage
        if (FeedRenderer.isLineApp && 
            FEED_RENDERER_CONFIG.ENABLE_LINE_FIX && 
            url.includes('firebasestorage')) {
            
            const response = await fetch(url, { cache: 'no-store' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            video.src = blobUrl;
            
            // Cleanup blob on ended
            const cleanup = () => {
                URL.revokeObjectURL(blobUrl);
                video.removeEventListener('ended', cleanup);
            };
            video.addEventListener('ended', cleanup, { once: true });
            
            return;
        }
        
        video.src = url;
    } catch (error) {
        console.warn('[FeedRenderer] Failed to load video:', error.message);
        // Fallback to direct URL
        video.src = url;
    }
}

/**
 * Handle video loaded
 */
function handleVideoLoaded(postId) {
    const wrapper = document.getElementById(`tuktuk-${postId}`);
    if (wrapper) {
        const loader = wrapper.querySelector('.video-loading-placeholder');
        const slowUI = wrapper.querySelector('.slow-connection-overlay');
        if (loader) loader.style.display = 'none';
        if (slowUI) slowUI.classList.remove('show');
    }
    
    if (FeedRenderer.videoLoadTimers[postId]) {
        clearTimeout(FeedRenderer.videoLoadTimers[postId]);
        delete FeedRenderer.videoLoadTimers[postId];
    }
}

/**
 * Handle video error
 */
function handleVideoError(postId) {
    const wrapper = document.getElementById(`tuktuk-${postId}`);
    if (!wrapper) return;
    
    const slowUI = wrapper.querySelector('.slow-connection-overlay');
    if (slowUI) {
        slowUI.classList.add('show');
        if (typeof updateNetworkSpeedUI === 'function') {
            updateNetworkSpeedUI();
        }
    }
    
    const loader = wrapper.querySelector('.video-loading-placeholder');
    if (loader) loader.style.display = 'none';
    
    // Pause all players
    const video = wrapper.querySelector('video');
    if (video) video.pause();
    
    const ytPlayer = FeedRenderer.players[postId];
    if (ytPlayer && ytPlayer.pauseVideo) ytPlayer.pauseVideo();
}

/**
 * Start video load timer
 */
function startVideoLoadTimer(postId, type = 'video') {
    if (FeedRenderer.videoLoadTimers[postId]) {
        clearTimeout(FeedRenderer.videoLoadTimers[postId]);
    }
    
    const timeout = setTimeout(() => {
        const wrapper = document.getElementById(`tuktuk-${postId}`);
        if (!wrapper) return;
        
        if (type === 'video') {
            const video = wrapper.querySelector('video');
            if (video && video.readyState < 3) {
                handleVideoError(postId);
            }
        } else if (type === 'youtube') {
            const player = FeedRenderer.players[postId];
            if (player && player.getPlayerState) {
                const state = player.getPlayerState();
                if (state === -1 || state === 3) {
                    handleVideoError(postId);
                }
            }
        }
    }, FEED_RENDERER_CONFIG.VIDEO_LOAD_TIMEOUT);
    
    FeedRenderer.videoLoadTimers[postId] = timeout;
    FeedRenderer.timeouts.push(timeout);
}

/**
 * Retry video load
 */
async function retryVideoLoad(postId) {
    const wrapper = document.getElementById(`tuktuk-${postId}`);
    if (!wrapper) return;
    
    const video = wrapper.querySelector('video');
    const ytPlayer = FeedRenderer.players[postId];
    const slowUI = wrapper.querySelector('.slow-connection-overlay');
    const loader = wrapper.querySelector('.video-loading-placeholder');
    
    if (slowUI) slowUI.classList.remove('show');
    if (loader) loader.style.display = 'flex';
    
    if (video) {
        const src = video.dataset.src || video.getAttribute('src') || '';
        if (src) {
            delete video.dataset.src;
            await loadVideoSrc(video, src);
        }
        video.load();
        video.play().catch(() => {});
        startVideoLoadTimer(postId, 'video');
    } else if (ytPlayer && ytPlayer.playVideo) {
        ytPlayer.playVideo();
        startVideoLoadTimer(postId, 'youtube');
    }
}

// ================================================
// NETWORK SPEED UTILITIES
// ================================================

/**
 * Get network speed
 */
function getNetworkSpeed() {
    if (window.navigator && window.navigator.connection) {
        const speed = window.navigator.connection.downlink;
        return speed ? speed.toFixed(1) : '?.?';
    }
    return '?.?';
}

/**
 * Update network speed UI
 */
function updateNetworkSpeedUI() {
    const speed = getNetworkSpeed();
    document.querySelectorAll('.speed-value').forEach(el => {
        el.innerText = speed;
    });
}

// Auto-update speed
const speedInterval = setInterval(() => {
    if (document.querySelector('.slow-connection-overlay.show')) {
        updateNetworkSpeedUI();
    }
}, FEED_RENDERER_CONFIG.NETWORK_SPEED_INTERVAL);
FeedRenderer.intervals.push(speedInterval);

// ================================================
// OFFLINE/ONLINE HANDLERS
// ================================================

window.addEventListener('offline', () => {
    document.querySelectorAll('.tuktuk-video-item').forEach(item => {
        const rect = item.getBoundingClientRect();
        if (rect.top >= 0 && rect.top <= window.innerHeight) {
            handleVideoError(item.id.replace('tuktuk-', ''));
        }
    });
});

window.addEventListener('online', () => {
    document.querySelectorAll('.tuktuk-video-item').forEach(item => {
        const rect = item.getBoundingClientRect();
        if (rect.top >= 0 && rect.top <= window.innerHeight) {
            retryVideoLoad(item.id.replace('tuktuk-', ''));
        }
    });
});

// ================================================
// YOUTUBE PLAYER MANAGEMENT
// ================================================

/**
 * Initialize YouTube API
 */
function initYouTubeAPI() {
    if (window.YT && window.YT.Player) {
        FeedRenderer.isYouTubeAPIReady = true;
        initAllYouTubePlayers();
        return;
    }
    
    // Load API if not present
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
}

/**
 * YouTube API Ready Callback
 */
window.onYouTubeIframeAPIReady = function() {
    console.log('[FeedRenderer] YouTube API Ready');
    FeedRenderer.isYouTubeAPIReady = true;
    initAllYouTubePlayers();
};

/**
 * Initialize all YouTube players
 */
function initAllYouTubePlayers() {
    document.querySelectorAll('.yt-placeholder').forEach(el => {
        const postId = el.id.replace('yt-player-', '');
        if (!FeedRenderer.players[postId]) {
            initYoutubePlayer(postId, el);
        }
    });
}

/**
 * Initialize single YouTube player
 */
function initYoutubePlayer(postId, element) {
    if (!FeedRenderer.isYouTubeAPIReady || !window.YT || !window.YT.Player) {
        console.log('[FeedRenderer] YouTube API not ready for:', postId);
        return;
    }
    
    if (FeedRenderer.players[postId]) {
        console.log('[FeedRenderer] Player already exists for:', postId);
        return;
    }
    
    const videoId = element.dataset.videoId;
    if (!videoId) {
        console.warn('[FeedRenderer] No videoId for:', postId);
        return;
    }
    
    element.classList.remove('yt-placeholder');
    
    try {
        const player = new YT.Player(element.id, {
            videoId: videoId,
            playerVars: {
                autoplay: 1,
                controls: 0,
                modestbranding: 1,
                rel: 0,
                iv_load_policy: 3,
                enablejsapi: 1,
                origin: window.location.origin,
                playlist: videoId,
                loop: 1,
                widget_referrer: window.location.origin,
                mute: FeedRenderer.isMuted ? 1 : 0
            },
            events: {
                onReady: (e) => onPlayerReady(e, postId),
                onStateChange: (e) => onPlayerStateChange(e, postId),
                onError: (e) => onPlayerError(e, postId)
            }
        });
        
        FeedRenderer.players[postId] = player;
        console.log('[FeedRenderer] YouTube player created for:', postId);
        
    } catch (error) {
        console.error('[FeedRenderer] Error creating YouTube player:', error);
        FeedRenderer.metrics.errors++;
        handleVideoError(postId);
    }
}

/**
 * Player ready event
 */
function onPlayerReady(event, postId) {
    handleVideoLoaded(postId);
    
    // Apply mute state
    if (FeedRenderer.isMuted) {
        event.target.mute();
    } else {
        event.target.unMute();
        event.target.setVolume(100);
    }
    
    // Check if in view
    const rect = document.getElementById(`tuktuk-${postId}`)?.getBoundingClientRect();
    if (rect && rect.top < window.innerHeight && rect.bottom > 0) {
        event.target.playVideo();
        FeedRenderer.metrics.plays++;
    }
}

/**
 * Player state change event
 */
function onPlayerStateChange(event, postId) {
    switch (event.data) {
        case YT.PlayerState.ENDED:
            if (FeedRenderer.isAutoScroll) {
                scrollToNextTuktuk(postId);
            } else {
                event.target.playVideo(); // Loop
            }
            break;
            
        case YT.PlayerState.BUFFERING:
            startVideoLoadTimer(postId, 'youtube');
            break;
            
        case YT.PlayerState.PLAYING:
            handleVideoLoaded(postId);
            break;
    }
}

/**
 * Player error event
 */
function onPlayerError(event, postId) {
    console.warn('[FeedRenderer] YouTube error for', postId, ':', event.data);
    FeedRenderer.metrics.errors++;
    handleVideoError(postId);
}

// ================================================
// VIDEO PROGRESS & SEEKING
// ================================================

/**
 * Update video progress
 */
function updateVideoProgress(video, postId) {
    const currentTime = video.currentTime;
    const duration = video.duration;
    
    if (!duration || isNaN(duration)) return;
    
    const progress = (currentTime / duration) * 100;
    const progressBar = document.getElementById(`progress-${postId}`);
    if (progressBar) {
        progressBar.style.width = progress + '%';
    }
    
    const timeIndicator = document.getElementById(`time-indicator-${postId}`);
    if (timeIndicator) {
        timeIndicator.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;
    }
    
    // Auto-hide actions
    const item = document.getElementById(`tuktuk-${postId}`);
    if (item) {
        const actions = item.querySelector('.tuktuk-actions');
        if (actions) {
            if (currentTime > 5 && currentTime < duration - 3) {
                actions.classList.add('hidden-right');
            } else {
                actions.classList.remove('hidden-right');
            }
        }
    }
}

/**
 * Handle video seek
 */
function handleVideoSeek(event, postId) {
    event.stopPropagation();
    
    const container = event.currentTarget;
    const rect = container.getBoundingClientRect();
    const pos = (event.clientX - rect.left) / rect.width;
    
    const item = document.getElementById(`tuktuk-${postId}`);
    const video = item?.querySelector('video');
    
    if (video && video.duration) {
        video.currentTime = pos * video.duration;
    } else if (FeedRenderer.players[postId] && FeedRenderer.players[postId].seekTo) {
        const duration = FeedRenderer.players[postId].getDuration();
        if (duration) {
            FeedRenderer.players[postId].seekTo(pos * duration, true);
        }
    }
}

// Update YouTube progress periodically
const progressInterval = setInterval(() => {
    Object.keys(FeedRenderer.players).forEach(postId => {
        const player = FeedRenderer.players[postId];
        if (player && player.getCurrentTime && player.getDuration) {
            const currentTime = player.getCurrentTime();
            const duration = player.getDuration();
            
            if (duration > 0) {
                const progress = (currentTime / duration) * 100;
                const progressBar = document.getElementById(`progress-${postId}`);
                if (progressBar) {
                    progressBar.style.width = progress + '%';
                }
                
                const timeIndicator = document.getElementById(`time-indicator-${postId}`);
                if (timeIndicator) {
                    timeIndicator.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;
                }
                
                // Auto-hide actions
                const item = document.getElementById(`tuktuk-${postId}`);
                if (item) {
                    const actions = item.querySelector('.tuktuk-actions');
                    if (actions) {
                        if (currentTime > 5 && currentTime < duration - 3) {
                            actions.classList.add('hidden-right');
                        } else {
                            actions.classList.remove('hidden-right');
                        }
                    }
                }
            }
        }
    });
}, 500);
FeedRenderer.intervals.push(progressInterval);

// ================================================
// HEART ANIMATION
// ================================================

/**
 * Show heart animation
 */
function showHeartAnimation(postId, x, y) {
    const item = document.getElementById(`tuktuk-${postId}`);
    if (!item) return;
    
    const heart = document.createElement('i');
    heart.className = 'fas fa-heart heart-pop-animation';
    
    const posX = x || item.offsetWidth / 2;
    const posY = y || item.offsetHeight / 2;
    
    heart.style.cssText = `
        position: absolute;
        top: ${posY}px;
        left: ${posX}px;
        transform: translate(-50%, -50%);
        font-size: 5.5rem;
        z-index: 200;
        pointer-events: none;
        color: #FF0050;
        animation: heartPopEnhanced 0.8s ease-out forwards;
    `;
    
    item.appendChild(heart);
    setTimeout(() => heart.remove(), 800);
}

// ================================================
// PLAYBACK CONTROLS
// ================================================

let lastClickTime = 0;

/**
 * Toggle playback (with double-tap like)
 */
function toggleTukTukPlayback(postId, event) {
    const now = Date.now();
    const item = document.getElementById(`tuktuk-${postId}`);
    const guide = document.getElementById(`guide-${postId}`);
    const video = item?.querySelector('video');
    const player = FeedRenderer.players[postId];
    
    // Determine if locally muted
    let isLocallyMuted = false;
    if (video) isLocallyMuted = video.muted;
    else if (player && player.isMuted) isLocallyMuted = player.isMuted();
    
    // Handle mute first
    if (FeedRenderer.isMuted || isLocallyMuted) {
        // Unmute
        FeedRenderer.isMuted = false;
        localStorage.setItem('tuktuk_muted', 'false');
        syncTuktukVolume();
        if (guide) guide.classList.remove('show');
        
        // Don't toggle if already playing
        if (video && !video.paused) return;
        if (player && player.getPlayerState?.() === 1) return;
    }
    
    // Double tap -> like
    if (now - lastClickTime < FEED_RENDERER_CONFIG.DOUBLE_TAP_THRESHOLD) {
        if (guide) guide.classList.remove('show');
        likePost(postId);
        
        const rect = item.getBoundingClientRect();
        const x = event ? event.clientX - rect.left : rect.width / 2;
        const y = event ? event.clientY - rect.top : rect.height / 2;
        showHeartAnimation(postId, x, y);
        
        return;
    }
    
    lastClickTime = now;
    
    // Toggle play/pause
    if (video) {
        if (guide) guide.classList.remove('show');
        if (video.paused) {
            video.dataset.userPaused = "";
            video.play().catch(e => console.log('Manual play failed:', e));
        } else {
            video.dataset.userPaused = "true";
            video.pause();
        }
    } else if (player && player.getPlayerState) {
        if (guide) guide.classList.remove('show');
        const state = player.getPlayerState();
        if (state === 1) { // playing
            item.dataset.userPaused = "true";
            player.pauseVideo();
        } else {
            item.dataset.userPaused = "";
            player.playVideo();
        }
    }
}

/**
 * Toggle fullscreen
 */
function toggleFullscreen() {
    const elem = document.getElementById('tuktukFeed');
    if (!elem) return;
    
    if (!document.fullscreenElement && !document.webkitFullscreenElement &&
        !document.mozFullScreenElement && !document.msFullscreenElement) {
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
}

// ================================================
// AUTO-SCROLL CONTROLS
// ================================================

/**
 * Toggle auto-scroll
 */
function toggleTuktukAutoScroll(event, postId) {
    if (event) event.stopPropagation();
    
    FeedRenderer.isAutoScroll = !FeedRenderer.isAutoScroll;
    localStorage.setItem('tuktuk_autoscroll', FeedRenderer.isAutoScroll);
    
    // Update UI
    document.querySelectorAll('[id^="autoscroll-icon-"]').forEach(icon => {
        icon.classList.toggle('text-warning', FeedRenderer.isAutoScroll);
    });
    
    document.querySelectorAll('[id^="autoscroll-text-"]').forEach(span => {
        span.textContent = `เล่นอัตโนมัติ: ${FeedRenderer.isAutoScroll ? 'เปิด' : 'ปิด'}`;
    });
    
    // Update bolt button
    if (typeof window.updateBoltUI === 'function') {
        window.updateBoltUI();
    }
    
    triggerHaptic(10);
    showToast(`⚡ เล่นอัตโนมัติ: ${FeedRenderer.isAutoScroll ? 'เปิด' : 'ปิด'}`, 'info');
}

/**
 * Scroll to next video
 */
function scrollToNextTuktuk(currentPostId) {
    const container = document.getElementById('tuktukFeed');
    if (!container) return;
    
    const items = Array.from(container.querySelectorAll('.tuktuk-video-item'));
    let currentIndex = -1;
    
    if (currentPostId) {
        currentIndex = items.findIndex(item => item.id === `tuktuk-${currentPostId}`);
    } else {
        // Find currently visible item
        currentIndex = items.findIndex(item => {
            const rect = item.getBoundingClientRect();
            return rect.top >= -50 && rect.top <= 50;
        });
    }
    
    if (currentIndex !== -1 && currentIndex < items.length - 1) {
        const nextItem = items[currentIndex + 1];
        nextItem.scrollIntoView({ behavior: 'smooth' });
        
        const nextPostId = nextItem.id.replace('tuktuk-', '');
        if (nextPostId) trackView(nextPostId);
    }
}

/**
 * Handle video ended
 */
function handleTuktukVideoEnded(video, postId) {
    if (FeedRenderer.isAutoScroll) {
        scrollToNextTuktuk(postId);
    } else {
        video.play().catch(() => {});
    }
}

// ================================================
// MUTE CONTROLS
// ================================================

/**
 * Toggle global mute
 */
function toggleTuktukMute(event, postId) {
    if (event) event.stopPropagation();
    
    FeedRenderer.isMuted = !FeedRenderer.isMuted;
    localStorage.setItem('tuktuk_muted', FeedRenderer.isMuted);
    
    syncTuktukVolume();
    
    if (typeof window.updateMuteUI === 'function') {
        window.updateMuteUI();
    }
    
    triggerHaptic(10);
}

/**
 * Sync volume across all players
 */
function syncTuktukVolume() {
    localStorage.setItem('tuktuk_muted', FeedRenderer.isMuted);
    
    // Sync HTML5 videos
    document.querySelectorAll('.tuktuk-video').forEach(media => {
        if (media.tagName === 'VIDEO') {
            media.muted = FeedRenderer.isMuted;
            if (!FeedRenderer.isMuted) {
                media.volume = 1.0;
            }
        }
    });
    
    // Sync YouTube players
    Object.values(FeedRenderer.players).forEach(player => {
        if (player && player.mute && player.unMute) {
            if (FeedRenderer.isMuted) {
                player.mute();
            } else {
                player.unMute();
                if (player.setVolume) player.setVolume(100);
            }
        }
    });
    
    // Update global icon
    const icon = document.getElementById('global-mute-icon');
    if (icon) {
        icon.className = FeedRenderer.isMuted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
    }
    
    // Hide guides when unmuted
    if (!FeedRenderer.isMuted) {
        document.querySelectorAll('.tap-unmute-guide').forEach(g => g.classList.remove('show'));
    }
}

// ================================================
// AUTHOR INFO
// ================================================

/**
 * Get author info (with cache)
 */
function getAuthorInfo(post) {
    const authorId = post.authorId || 'admin';
    const session = typeof WizmobizAuth !== 'undefined' ? WizmobizAuth.getUser() : null;
    
    // If viewing own post, use session data
    if (authorId === FeedRenderer.currentUserId && session) {
        return {
            name: session.displayName || session.name || session.username || 'Member',
            avatar: session.pictureUrl || session.photoURL || 'assets/images/logo.png'
        };
    }
    
    // Check cache
    if (authorCache.has(authorId)) {
        const cached = authorCache.get(authorId);
        return {
            name: cached.displayName || cached.name || cached.username || 'Member',
            avatar: cached.pictureUrl || cached.photoURL || 'assets/images/logo.png'
        };
    }
    
    // System defaults
    if (authorId === 'admin') {
        return { name: 'TukTuk Team', avatar: 'assets/images/logo.png' };
    }
    
    // Fetch async (don't await)
    fetchAuthorProfile(authorId);
    
    return {
        name: post.authorName || 'Member',
        avatar: post.authorAvatar || post.authorPictureUrl || 'assets/images/logo.png'
    };
}

/**
 * Fetch author profile
 */
async function fetchAuthorProfile(authorId) {
    if (!authorId || authorId === 'admin' || authorId === 'system_weather') return;
    
    try {
        const doc = await db.collection(FEED_RENDERER_CONFIG.COLLECTIONS.USERS).doc(authorId).get();
        if (doc.exists) {
            const data = doc.data();
            authorCache.set(authorId, data);
            
            // Update UI
            const name = data.displayName || data.name || 'สมาชิก';
            const avatar = data.pictureUrl || data.photoURL || 'assets/images/logo.png';
            const fCount = data.followerCount || 0;
            const vCount = data.totalViews || 0;
            
            document.querySelectorAll(`.author-name-${authorId}`).forEach(el => {
                el.textContent = name;
            });
            
            document.querySelectorAll(`.author-avatar-${authorId}`).forEach(el => {
                if (el.tagName === 'IMG') el.src = avatar;
            });
            
            document.querySelectorAll(`.follower-count-${authorId}`).forEach(el => {
                el.textContent = formatNumber(fCount);
            });
            
            document.querySelectorAll(`.total-views-${authorId}`).forEach(el => {
                el.textContent = formatNumber(vCount);
            });
        } else {
            authorCache.set(authorId, { name: 'Member', avatar: 'assets/images/logo.png' });
        }
    } catch (error) {
        console.warn('[FeedRenderer] Error fetching author:', error);
        authorCache.set(authorId, { name: 'Member', avatar: 'assets/images/logo.png' });
    }
}

// ================================================
// VIEW TRACKING
// ================================================

/**
 * Track view
 */
async function trackView(postId) {
    if (!postId) return;
    if (FeedRenderer.viewedPosts.has(postId)) return;
    
    // Mark as viewed
    FeedRenderer.viewedPosts.add(postId);
    sessionStorage.setItem(`viewed_${postId}`, 'true');
    
    // Optimistic UI update
    document.querySelectorAll(`[class*="view-count-${postId}"]`).forEach(el => {
        const current = parseInt(el.textContent.replace(/,/g, '')) || 0;
        el.textContent = (current + 1).toLocaleString();
    });
    
    // Check if offline
    if (!navigator.onLine && FEED_RENDERER_CONFIG.ENABLE_OFFLINE_QUEUE) {
        FeedRenderer.offlineQueue = FeedRenderer.offlineQueue || [];
        FeedRenderer.offlineQueue.push({
            type: 'view',
            postId,
            timestamp: Date.now()
        });
        return;
    }
    
    try {
        // Determine collection
        const wrapper = document.getElementById(`tuktuk-${postId}`);
        const isProduct = wrapper && wrapper.classList.contains('product-interleaved-item');
        const collectionName = isProduct ? FEED_RENDERER_CONFIG.COLLECTIONS.PRODUCTS : FEED_RENDERER_CONFIG.COLLECTIONS.POSTS;
        const viewField = isProduct ? 'viewCount' : 'views';
        
        // Save interest for personalization
        const post = FeedRenderer.allPostsData.find(p => p.id === postId);
        if (post && post.category) {
            saveInterest(post.category);
        }
        
        // Increment view count
        await db.collection(collectionName).doc(postId).update({
            [viewField]: firebase.firestore.FieldValue.increment(1)
        }).catch(e => {
            if (e.code !== 'permission-denied' && e.code !== 'not-found') {
                console.warn('[FeedRenderer] View count error:', e);
            }
        });
        
        // Increment author's total views
        if (!isProduct && post && post.authorId && post.authorId !== 'admin') {
            db.collection(FEED_RENDERER_CONFIG.COLLECTIONS.USERS).doc(post.authorId).update({
                totalViews: firebase.firestore.FieldValue.increment(1)
            }).catch(() => {});
        }
        
        FeedRenderer.metrics.views++;
        
    } catch (error) {
        console.warn('[FeedRenderer] Track view error:', error);
    }
}

/**
 * Save interest category
 */
function saveInterest(category) {
    try {
        let interests = JSON.parse(localStorage.getItem('tuktuk_interests') || '{}');
        interests[category] = (interests[category] || 0) + 1;
        localStorage.setItem('tuktuk_interests', JSON.stringify(interests));
    } catch (e) {
        // Ignore
    }
}

// ================================================
// INTERSECTION OBSERVER
// ================================================

// Create observer
const tuktukObserver = new IntersectionObserver(async (entries) => {
    for (const entry of entries) {
        await handleIntersection(entry);
    }
}, { threshold: FEED_RENDERER_CONFIG.OBSERVER_THRESHOLD });
FeedRenderer.observers.push(tuktukObserver);

/**
 * Handle intersection entry
 */
async function handleIntersection(entry) {
    const wrapper = entry.target;
    const mediaItem = wrapper.querySelector('.tuktuk-video');
    const postId = wrapper.id.replace('tuktuk-', '');
    const productCard = wrapper.querySelector('.shoppable-card');
    
    // Handle product interleaved items
    if (wrapper.classList.contains('product-interleaved-item')) {
        handleProductIntersection(entry, wrapper, postId);
        return;
    }
    
    if (!mediaItem) return;
    
    if (entry.isIntersecting) {
        await handleVideoEnter(postId, wrapper, mediaItem, productCard);
    } else {
        handleVideoExit(postId, wrapper, mediaItem);
    }
}

/**
 * Handle product intersection
 */
function handleProductIntersection(entry, wrapper, postId) {
    if (entry.isIntersecting) {
        wrapper.classList.add('active');
        if (FeedRenderer.isAutoScroll) {
            if (FeedRenderer.productAutoScrollTimers[postId]) {
                clearTimeout(FeedRenderer.productAutoScrollTimers[postId]);
            }
            
            const timeout = setTimeout(() => {
                scrollToNextTuktuk(postId);
            }, FEED_RENDERER_CONFIG.AUTO_SCROLL_DELAY);
            
            FeedRenderer.productAutoScrollTimers[postId] = timeout;
            FeedRenderer.timeouts.push(timeout);
        }
    } else {
        wrapper.classList.remove('active');
        if (FeedRenderer.productAutoScrollTimers[postId]) {
            clearTimeout(FeedRenderer.productAutoScrollTimers[postId]);
            delete FeedRenderer.productAutoScrollTimers[postId];
        }
    }
}

/**
 * Handle video enter
 */
async function handleVideoEnter(postId, wrapper, mediaItem, productCard) {
    // Start load timer
    if (mediaItem.tagName === 'VIDEO') {
        startVideoLoadTimer(postId, 'video');
        
        // Add event listeners
        if (!mediaItem._hasListeners) {
            mediaItem.onwaiting = () => startVideoLoadTimer(postId, 'video');
            mediaItem.onplaying = () => handleVideoLoaded(postId);
            mediaItem._hasListeners = true;
        }
        
        // Preload adjacent items
        preloadAdjacentItems(wrapper);
        
        // Lazy load source
        if (mediaItem.dataset.src) {
            const src = mediaItem.dataset.src;
            delete mediaItem.dataset.src;
            await loadVideoSrc(mediaItem, src);
            mediaItem.load();
        }
        
        // Play video
        if (!mediaItem.dataset.userPaused) {
            mediaItem.muted = FeedRenderer.isMuted;
            try {
                await mediaItem.play();
                FeedRenderer.metrics.plays++;
            } catch (error) {
                if (error.name === 'NotAllowedError') {
                    mediaItem.muted = true;
                    mediaItem.play().catch(() => {});
                    
                    const guide = wrapper.querySelector('.tap-unmute-guide');
                    if (guide) guide.classList.add('show');
                }
            }
        }
    } else {
        // Check for YouTube placeholder
        const ytPlaceholder = wrapper.querySelector('.yt-placeholder');
        if (ytPlaceholder) {
            initYoutubePlayer(postId, ytPlaceholder);
        } else if (FeedRenderer.players[postId] && FeedRenderer.players[postId].playVideo) {
            startVideoLoadTimer(postId, 'youtube');
            const isUserPaused = wrapper.dataset.userPaused;
            
            if (!isUserPaused) {
                if (FeedRenderer.isMuted) {
                    FeedRenderer.players[postId].mute();
                } else {
                    FeedRenderer.players[postId].unMute();
                }
                FeedRenderer.players[postId].playVideo();
                FeedRenderer.metrics.plays++;
            }
        }
    }
    
    // Track view
    trackView(postId);
    
    // Start product timer
    if (productCard && !productCard.classList.contains('show-delayed')) {
        const timeout = setTimeout(() => {
            productCard.classList.add('show-delayed');
        }, FEED_RENDERER_CONFIG.PRODUCT_DELAY);
        
        FeedRenderer.productTimers[postId] = timeout;
        FeedRenderer.timeouts.push(timeout);
    }
}

/**
 * Preload adjacent items
 */
function preloadAdjacentItems(wrapper) {
    const nextItem = wrapper.nextElementSibling;
    const prevItem = wrapper.previousElementSibling;
    
    [nextItem, prevItem].forEach(adj => {
        if (adj && adj.classList.contains('tuktuk-video-item')) {
            const adjVideo = adj.querySelector('video');
            const adjYt = adj.querySelector('.yt-placeholder');
            
            if (adjVideo && adjVideo.dataset.src) {
                // Skip preload in LINE browser
                if (!FeedRenderer.isLineApp) {
                    adjVideo.src = adjVideo.dataset.src;
                    adjVideo.load();
                }
                delete adjVideo.dataset.src;
            }
            
            if (adjYt) {
                const adjId = adj.id.replace('tuktuk-', '');
                initYoutubePlayer(adjId, adjYt);
            }
        }
    });
}

/**
 * Handle video exit
 */
function handleVideoExit(postId, wrapper, mediaItem) {
    if (mediaItem.tagName === 'VIDEO') {
        mediaItem.pause();
    } else if (FeedRenderer.players[postId] && FeedRenderer.players[postId].pauseVideo) {
        FeedRenderer.players[postId].pauseVideo();
    }
    
    // Clear product timer
    if (FeedRenderer.productTimers[postId]) {
        clearTimeout(FeedRenderer.productTimers[postId]);
        delete FeedRenderer.productTimers[postId];
    }
}

// ================================================
// YOUTUBE UTILITIES
// ================================================

/**
 * Extract YouTube ID
 */
function extractYoutubeId(url) {
    if (!url) return null;
    
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([^&\n?#]+)/,
        /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[2] && match[2].length === 11) return match[2];
        if (match && match[1] && match[1].length === 11) return match[1];
    }
    
    return null;
}

/**
 * Parse video embed
 */
function parseVideoEmbed(url) {
    if (!url) return null;
    
    // Normalize URL
    url = url.trim();
    if (url.startsWith('//')) url = 'https:' + url;
    
    // YouTube
    const ytId = extractYoutubeId(url);
    if (ytId) {
        const origin = window.location.origin && window.location.origin !== 'null' 
            ? encodeURIComponent(window.location.origin) : '';
        let embedUrl = `https://www.youtube.com/embed/${ytId}?playsinline=1&enablejsapi=1&rel=0&modestbranding=1`;
        if (origin) embedUrl += `&origin=${origin}`;
        return `<iframe src="${embedUrl}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
    }
    
    // TikTok
    const tiktokMatch = url.match(/tiktok\.com\/(?:.*\/video\/|.*v=)(\d+)/) ||
        url.match(/tiktok\.com\/(?:t|v)\/([\w\d]+)/) ||
        url.match(/(?:vm|vt)\.tiktok\.com\/([\w\d]+)/);
    
    if (tiktokMatch) {
        const videoId = tiktokMatch[1];
        return `<iframe src="https://www.tiktok.com/player/v1/${videoId}?music_info=1&description=1" 
            allow="autoplay; fullscreen" style="width: 100%; height: 100%;" allowfullscreen></iframe>`;
    }
    
    // Facebook
    if (url.includes('facebook.com') || url.includes('fb.watch') || url.includes('fb.com')) {
        return `<iframe src="https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0&width=500"
            style="border:none;overflow:hidden;width:100%;height:100%;" scrolling="no" frameborder="0" 
            allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>`;
    }
    
    // Direct MP4
    if (url.match(/\.(mp4|webm|mov|ogg)$/i)) {
        return `<video controls playsinline webkit-playsinline preload="metadata"
            style="width: 100%; height: 100%; object-fit: contain;">
            <source src="${url}" type="video/mp4">
            Your browser does not support the video tag.
        </video>`;
    }
    
    return null;
}

// ================================================
// WELCOME CARD
// ================================================

/**
 * Check if welcome card should be shown
 */
function shouldShowWelcome() {
    const lastShown = safeLocalStorage('tuktuk_welcome_last_shown');
    const today = new Date().toISOString().split('T')[0];
    if (lastShown === today) return false;
    
    localStorage.setItem('tuktuk_welcome_last_shown', today);
    return true;
}

/**
 * Render welcome card
 */
function renderWelcomeCard(container) {
    const welcomeCard = document.createElement('div');
    welcomeCard.className = 'tuktuk-video-item welcome-card-item';
    welcomeCard.style.cssText = 'background: #000; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; z-index: 1000;';
    
    welcomeCard.innerHTML = `
        <div id="welcomeTuktukStage"
            style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden; padding: 0 16px;">
            <!-- Circular Frame -->
            <div id="welcomeTuktukEmblem"
                style="position: relative; width: min(240px, 65vw); height: min(240px, 65vw); display: flex; align-items: center; justify-content: center; margin: 0 auto; flex-shrink: 0; transition: transform 1.2s cubic-bezier(0.45, -0.15, 0.55, 0.95), opacity 0.8s ease;">
                <!-- Rotating Glow Border -->
                <div
                    style="position: absolute; inset: -8px; border-radius: 50%; background: linear-gradient(135deg, #FF9500, #FFD700, #FF6B35); animation: rotate-gradient-slow 4s linear infinite; filter: blur(3px);">
                </div>
                <!-- Black Inner Frame -->
                <div
                    style="position: absolute; inset: 2px; border-radius: 50%; background: #000; border: 2px solid rgba(255,255,255,0.1); z-index: 1;">
                </div>
                <!-- Central Glow Pulse -->
                <div
                    style="position: absolute; inset: -20px; background: radial-gradient(circle, rgba(255, 193, 7, 0.2) 0%, transparent 70%); animation: pulse-glow 3s infinite; border-radius: 50%;">
                </div>

                <img src="assets/images/tuktuk.png" class="hero-title-icon"
                    style="width: 85%; height: 85%; border-radius: 50%; object-fit: cover; position: relative; z-index: 2; filter: drop-shadow(0 10px 20px rgba(0,0,0,0.9)); border: 4px solid rgba(255,255,255,0.15); animation: float-logo 4s ease-in-out infinite;">
            </div>

            <!-- Text Container -->
            <div id="welcomeTuktukText" class="mt-4 text-center"
                style="animation: fadeIn 1.5s ease; position: relative; z-index: 10; transition: transform 0.8s ease, opacity 0.8s ease; width: 100%;">
                <h2
                    style="color: white; font-weight: 900; letter-spacing: 4px; font-size: clamp(1.8rem, 6vw, 2.8rem); margin: 0; text-shadow: 0 0 30px rgba(255,255,255,0.4);">
                    TUKTUK</h2>
                <p
                    style="color: #ffc107; font-size: clamp(0.8rem, 3vw, 1.1rem); font-weight: 800; margin-top: 8px; text-transform: uppercase; letter-spacing: 4px; opacity: 0.9;">
                    Thailand's Next GEN</p>
            </div>

            <!-- Quick Actions -->
            <div class="d-flex gap-3 justify-content-center mt-3"
                style="width: 100%; max-width: 280px; z-index: 20; position: relative;">
                <button id="btnExplore" class="btn flex-grow-1 py-2 border-0 text-white fw-bold"
                    style="background: linear-gradient(135deg, #FF6B35, #FFAA00); border-radius: 15px; box-shadow: 0 5px 15px rgba(255, 107, 53, 0.4); transition: transform 0.2s; font-size: 0.9rem;">
                    <i class="fas fa-compass me-1"></i>สำรวจ
                </button>
                <button id="btnCreate" class="btn flex-grow-1 py-2 border-0 text-white fw-bold"
                    style="background: linear-gradient(135deg, #00D9FF, #00F2EA); border-radius: 15px; box-shadow: 0 5px 15px rgba(0, 217, 255, 0.4); transition: transform 0.2s; font-size: 0.9rem;">
                    <i class="fas fa-plus-circle me-1"></i>สร้าง
                </button>
            </div>

            <!-- Scroll Tip -->
            <div class="mt-3" style="opacity: 0.6; animation: bounce 2s infinite;">
                <i class="fas fa-chevron-up text-white"></i>
                <div style="color: white; font-size: 0.7rem; letter-spacing: 2px; margin-top: 4px;">
                    เลื่อนขึ้นเพื่อเริ่มต้น</div>
            </div>
        </div>
    `;
    
    container.appendChild(welcomeCard);
    
    // Drive off animation
    const driveOff = () => {
        const emblem = document.getElementById('welcomeTuktukEmblem');
        const text = document.getElementById('welcomeTuktukText');
        
        if (emblem && !emblem.dataset.driving) {
            emblem.dataset.driving = 'true';
            
            // Car starts engine
            emblem.style.transform = 'scale(0.92) translateX(-50px) rotate(-10deg)';
            
            setTimeout(() => {
                // Car drives off
                emblem.style.transform = 'translateX(200vw) scale(1.1) rotate(5deg)';
                emblem.style.opacity = '0.5';
                
                // Text follows
                setTimeout(() => {
                    if (text) {
                        text.style.transform = 'translateY(50px) scale(0.9)';
                        text.style.opacity = '0';
                    }
                    welcomeCard.style.transition = 'background 1.5s ease';
                    welcomeCard.style.background = 'transparent';
                    
                    setTimeout(() => {
                        if (welcomeCard.parentNode) {
                            welcomeCard.remove();
                        }
                    }, 1200);
                }, 500);
            }, 400);
        }
    };
    
    // Attach events
    const btnExplore = welcomeCard.querySelector('#btnExplore');
    const btnCreate = welcomeCard.querySelector('#btnCreate');
    
    if (btnExplore) {
        btnExplore.addEventListener('click', (e) => {
            e.stopPropagation();
            driveOff();
        });
    }
    
    if (btnCreate && typeof handleTukTukButtonClick === 'function') {
        btnCreate.addEventListener('click', (e) => {
            e.stopPropagation();
            handleTukTukButtonClick();
        });
    }
    
    // Auto-warp
    const autoWarpTimeout = setTimeout(driveOff, FEED_RENDERER_CONFIG.WELCOME_CARD_DURATION);
    FeedRenderer.timeouts.push(autoWarpTimeout);
    
    // Scroll triggers drive off
    const onScroll = () => {
        clearTimeout(autoWarpTimeout);
        driveOff();
        window.removeEventListener('scroll', onScroll);
    };
    window.addEventListener('scroll', onScroll, { once: true });
}

// ================================================
// RENDER FUNCTIONS - PRODUCT CARDS
// ================================================

/**
 * Render TukTuk product item (full screen)
 */
function renderTukTukProductItem(prod) {
    const price = parseFloat(prod.price || 0).toLocaleString();
    const imageUrl = prod.imageUrl || (prod.images && prod.images[0]) || 'https://placehold.co/400';
    const sellerName = prod.sellerName || 'ร้านค้าพาร์ทเนอร์';
    const sellerPic = prod.sellerPictureUrl || 'assets/images/logo.png';
    const title = prod.title || prod.productName || prod.name || 'สินค้าแนะนำ';
    const desc = prod.description || prod.detail || '';
    
    return `
        <div class="tuktuk-product-card"
            onclick="window.location.href='product.html?id=${prod.id}'">
            <div class="product-countdown-bar"></div>
            <div class="tuktuk-product-bg">
                <img src="${imageUrl}" class="bg-blur">
            </div>

            <div class="tuktuk-product-main">
                <div class="product-visual-wrapper">
                    <span class="tuktuk-promo-badge">RECOMMENDED</span>
                    <img src="${imageUrl}" class="product-hero-img">
                </div>

                <div class="product-info-overlay">
                    <div class="seller-mini-info">
                        <img src="${sellerPic}" class="seller-avatar">
                        <span>${escapeHtml(sellerName)}</span>
                    </div>
                    <h3 class="product-title">
                        ${escapeHtml(title)}</h3>
                    <div class="product-price-tag">
                        <span class="currency">฿</span>
                        <span class="amount">${price}</span>
                    </div>
                    <p class="product-description">
                        ${escapeHtml(desc).substring(0, 100)}...
                    </p>

                    <button class="buy-now-btn">
                        <i class="fas fa-shopping-cart me-2"></i>
                        ดูรายละเอียดสินค้า
                    </button>
                </div>
            </div>

            <div class="tuktuk-actions" style="opacity: 1;">
                <div class="tuktuk-action-btn">
                    <i class="fas fa-shopping-bag text-warning"
                        style="font-size: 1.8rem;"></i>
                    <span style="font-size: 0.7rem;">ซื้อเลย</span>
                </div>
                <div class="tuktuk-action-btn"
                    onclick="event.stopPropagation(); sharePost('${prod.id}')">
                    <i class="fas fa-share"></i>
                    <span style="font-size: 0.7rem;">แชร์</span>
                </div>
            </div>
        </div>
    `;
}

/**
 * Render interleaved product card
 */
function renderInterleavedProduct(prod) {
    const price = parseFloat(prod.price || 0).toLocaleString();
    const imageUrl = prod.imageUrl || (prod.images && prod.images[0]) || 'https://placehold.co/200';
    const title = prod.title || prod.productName || prod.name || 'สินค้า';
    
    return `
        <div class="interleaved-product-card"
            onclick="window.location.href='product.html?id=${prod.id}'">
            <span class="product-promo-badge">สินค้ายอดนิยม</span>
            <div class="product-image-container">
                <img src="${imageUrl}" alt="${title}">
            </div>
            <div class="product-details">
                <div class="product-name">
                    ${escapeHtml(title)}</div>
                <div class="product-price-row">
                    <div class="product-price">฿${price}</div>
                    <button class="product-btn shadow-sm">ดูรายละเอียด</button>
                </div>
            </div>
        </div>
    `;
}

// ================================================
// RENDER FUNCTIONS - NEWS CARDS
// ================================================

/**
 * Render news feed card
 */
function renderNewsFeedCard(news) {
    const points = (news.summaryPoints || []).map(p => `<li>${escapeHtml(p)}</li>`).join('');
    const timeAgo = formatTimeAgo(news.createdAt);
    
    return `
        <div class="news-feed-card" onclick="trackNewsClick('${news.id}')">
            <div class="news-feed-label">BREAKING NEWS</div>
            <img src="${news.imageUrl}" class="news-feed-img"
                onerror="this.src='https://placehold.co/800x450?text=News'">
            <div class="news-feed-body">
                <div class="news-feed-source">
                    <i class="fas fa-globe me-1"></i>
                    ${escapeHtml(news.source || 'Breaking News')} • ${timeAgo}
                </div>
                <h3 class="news-feed-title">
                    ${escapeHtml(news.title)}</h3>
                <p class="news-feed-summary">
                    ${escapeHtml(news.summary || '')}</p>
                ${points ? `<ul class="news-feed-points">${points}</ul>` : ''}

                <div class="news-feed-actions">
                    <button class="news-action-btn ${news.actionType}"
                        onclick="handleNewsAction('${news.actionType}', '${news.actionLabel}')">
                        ${escapeHtml(news.actionLabel || 'อ่านต่อ')}
                        <i class="fas fa-arrow-right ms-2"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Render TukTuk news item (full screen)
 */
function renderTukTukNewsItem(news) {
    const timeAgo = formatTimeAgo(news.createdAt);
    const pointsHtml = (news.summaryPoints || []).slice(0, 3).map(p =>
        `<div class="ai-point"><i class="fas fa-check-circle me-2"></i>${escapeHtml(p)}</div>`
    ).join('');
    
    return `
        <div class="tuktuk-product-card news-interleaved-card"
            onclick="trackNewsClick('${news.id}')">
            <div class="product-countdown-bar" style="background: #4285F4;">
            </div>
            <div class="tuktuk-product-bg">
                <img src="${news.imageUrl}" class="bg-blur">
            </div>

            <div class="tuktuk-product-main">
                <div class="product-visual-wrapper">
                    <span class="tuktuk-promo-badge"
                        style="background: linear-gradient(45deg, #4285F4, #EA4335);">
                        <i class="fab fa-google me-1"></i> NEWS 4.0
                    </span>
                    <img src="${news.imageUrl}" class="product-hero-img">

                    <!-- Overlay Stats -->
                    <div class="news-overlay-stats">
                        <span><i class="fas fa-chart-line text-warning"></i> Trending</span>
                        <span><i class="fas fa-robot text-info"></i> AI Verified</span>
                    </div>
                </div>

                <div class="product-info-overlay glass-morphism-pro">
                    <div class="seller-mini-info">
                        <div
                            style="width:24px; height:24px; background:white; border-radius:50%; display:flex; align-items:center; justify-content:center; margin-right:8px;">
                            <i class="fab fa-google"
                                style="color:#4285F4; font-size:0.8rem;"></i>
                        </div>
                        <span>${escapeHtml(news.source || 'Breaking News')} •
                            ${timeAgo}</span>
                    </div>
                    <h3 class="product-title"
                        style="font-size: 1.4rem; margin-bottom: 12px; background: linear-gradient(90deg, #fff, #e0e0e0); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                        ${escapeHtml(news.title)}
                    </h3>

                    ${pointsHtml ? `<div class="ai-summary-box">${pointsHtml}</div>` :
                        `<p class="product-description">${escapeHtml(news.summary || '')}</p>`}

                    <div class="d-flex gap-2 mt-3">
                        <button
                            class="news-action-btn ${news.actionType} flex-grow-1"
                            onclick="handleNewsAction('${news.actionType}', '${news.actionLabel}')">
                            <i class="fas fa-book-open me-2"></i>
                            ${escapeHtml(news.actionLabel || 'อ่านต่อ')}
                        </button>
                        <button class="news-action-btn secondary"
                            onclick="event.stopPropagation(); sharePost('${news.id}', '${escapeHtml(news.title)}')">
                            <i class="fas fa-share-alt"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ================================================
// RENDER FUNCTIONS - GROUP RECOMMENDATION
// ================================================

/**
 * Render group recommendation
 */
function renderTukTukGroupRecommendation(group) {
    return `
        <div class="tuktuk-group-recommendation" onclick="window.location.href='community.html?category=groups&id=${group.id}'">
            <div class="group-rec-header">
                <i class="fas fa-users text-warning mb-2 fa-2x"></i>
                <h5>แนะนำกลุ่มชุมชน</h5>
                <p class="small text-white-50">เข้าร่วมเพื่อคุยกับเพื่อนสมาชิก</p>
            </div>
            
            <div class="group-rec-content glass-morphism p-3 rounded-4 mb-3" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.1);">
                <div class="d-flex align-items-center mb-2">
                     <div class="group-rec-icon me-2">
                        <i class="fas fa-users text-primary"></i>
                     </div>
                     <div class="flex-grow-1">
                        <div class="text-white fw-bold">${group.name}</div>
                        <div class="text-white-50 smaller">${group.memberIds?.length || 0} สมาชิก</div>
                     </div>
                </div>
                <div class="smaller text-white-50 line-clamp-2">${group.description || ''}</div>
            </div>

            <button class="btn btn-primary w-100 rounded-pill mb-2">
                <i class="fas fa-plus me-2"></i> เข้าร่วมกลุ่มเลย
            </button>
        </div>
    `;
}

// ================================================
// RENDER FUNCTIONS - WEATHER CARD
// ================================================

/**
 * Render weather card
 */
function renderTukTukWeatherCard(post) {
    let bgGradient = 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
    const text = (post.text || '').toLowerCase();
    let icon = '☀️';
    let temp = '--';
    
    if (text.includes('rain') || text.includes('ฝน')) {
        bgGradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        icon = '🌧️';
    } else if (text.includes('sun') || text.includes('แดด')) {
        bgGradient = 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)';
        icon = '☀️';
    } else if (text.includes('cloud') || text.includes('เมฆ')) {
        bgGradient = 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)';
        icon = '☁️';
    } else if (text.includes('thunder') || text.includes('พายุ')) {
        bgGradient = 'linear-gradient(135deg, #141E30 0%, #243B55 100%)';
        icon = '⛈️';
    }
    
    const tempMatch = post.text?.match(/(\d+)\s*°/);
    if (tempMatch) temp = tempMatch[1];
    
    return `
        <div class="tuktuk-weather-card" style="background: ${bgGradient}; width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 30px; color: white; text-align: center; position: relative; overflow: hidden;">
             
             <!-- Ambient Background Elements -->
             <div style="position: absolute; top: -10%; right: -10%; font-size: 15rem; opacity: 0.1;">${icon}</div>
             <div style="position: absolute; bottom: -10%; left: -10%; font-size: 10rem; opacity: 0.1;">WEATHER</div>

             <div class="weather-icon-large mb-2 animate__animated animate__pulse animate__infinite" style="font-size: 8rem; filter: drop-shadow(0 10px 20px rgba(0,0,0,0.2));">
                ${icon}
             </div>
             
             <div class="display-1 fw-bold mb-2" style="font-size: 6rem; letter-spacing: -2px;">${temp}°</div>
             
             <div class="weather-location badge bg-white text-primary mb-4 shadow-sm" style="font-size: 1.2rem; padding: 10px 25px; border-radius: 50px;">
                <i class="fas fa-map-marker-alt me-2 text-danger"></i>${post.location || post.province || 'Bangkok'}
             </div>

             <div class="weather-content glass-morphism p-4 rounded-4 shadow-lg text-start mx-auto" style="background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2); max-width: 90%; width: 100%;">
                 <p style="white-space: pre-line; font-size: 1.1rem; line-height: 1.6; margin: 0; font-weight: 500;">${post.text}</p>
             </div>
             
             <div class="mt-4 opacity-75 small font-monospace">
                <i class="fas fa-clock me-1"></i> อัปเดตเมื่อ: ${post.createdAt && post.createdAt.toDate ? post.createdAt.toDate().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : 'Today'}
             </div>
        </div>
    `;
}

// ================================================
// RENDER FUNCTIONS - POST CARD
// ================================================

/**
 * Render post card (standard)
 */
function renderPostCard(post) {
    // Track view automatically
    if (post.id) trackView(post.id);
    
    const timeAgo = formatTimeAgo(post.createdAt);
    const categoryClass = `category-${post.category}`;
    const pinnedClass = post.pinned ? 'pinned' : '';
    
    // Post management logic
    const isOwner = FeedRenderer.currentUserId && post.authorId === FeedRenderer.currentUserId;
    const canManage = FeedRenderer.isAdmin || isOwner;
    
    const optionsMenu = canManage ? `
        <div class="post-options-container">
            <div class="post-options-btn"
                onclick="togglePostMenu('${post.id}', event)">
                <i class="fas fa-ellipsis-v"></i>
            </div>
            <div class="post-options-menu" id="menu-${post.id}">
                ${(isAdmin || isOwner) ? `
                <button class="post-option-item"
                    onclick="togglePin('${post.id}', ${!post.pinned})">
                    <i class="fas fa-thumbtack ${post.pinned ? 'text-warning' : ''}"></i>
                    ${post.pinned ? 'เลิกปักหมุด' : 'ปักหมุดในช่อง'}
                </button>
                ` : ''}
                ${(isAdmin || isOwner) ? `
                <button class="post-option-item" onclick="editPost('${post.id}')">
                    <i class="fas fa-edit"></i>
                    แก้ไขโพสต์
                </button>
                ` : ''}
                <button class="post-option-item delete"
                    onclick="confirmDelete('${post.id}')">
                    <i class="fas fa-trash"></i>
                    ลบโพสต์
                </button>
            </div>
        </div>
    ` : '';
    
    // SPECIAL RENDER FOR VIDEO CATEGORY (TikTok Style)
    if ((post.category === 'video' || post.videoEmbed) && post.videoEmbed) {
        const isTuktukChoice = post.isTuktukChoice || post.featured || false;
        const authorInfo = getAuthorInfo(post);
        
        return `
            <div class="news-card ${pinnedClass} video-reel-mode" id="card-${post.id}" data-post-id="${post.id}">
                ${optionsMenu}
                <div class="video-reel-container">
                    <div class="news-video-container" style="height: 100%;">
                        ${post.videoEmbed}
                    </div>

                    <!-- Premium Overlays -->
                    <div class="video-reel-overlay" onclick="toggleTukTukPlayback('${post.id}')" style="cursor: pointer;">
                        <!-- Play/Pause Icon Indicator -->
                        <div class="video-play-icon" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 60px; color: rgba(255,255,255,0.6); opacity: 0; pointer-events: none; transition: opacity 0.2s;">
                            <i class="fas fa-play"></i>
                        </div>

                        <!-- Top Left: TukTuk Choice Badge -->
                        ${isTuktukChoice ? `
                        <div class="tuktuk-choice-tag" style="position: absolute; top: 15px; left: 15px;">
                            <div class="dot"></div>
                            <span>TukTuk Choice</span>
                        </div>
                        ` : ''}

                        <!-- Bottom Left: Caption Section -->
                        <div class="video-reel-caption" style="position: absolute; bottom: 90px; left: 15px; right: 90px; pointer-events: auto;">
                            <div class="video-reel-author" style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                                <div class="news-avatar" style="width: 40px; height: 40px; border: 2px solid #ff9800; border-radius: 50%; overflow: hidden; background: #222;">
                                    <img src="${authorInfo.avatar}" class="author-avatar-${post.authorId || 'admin'}" style="width: 100%; height: 100%; object-fit: cover;">
                                </div>
                                <div class="author-details">
                                    <div class="author-name-verified" style="display: flex; align-items: center; gap: 4px;">
                                        <span style="font-weight: 700; font-size: 15px; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">${escapeHtml(authorInfo.name)}</span>
                                        <i class="fas fa-check-circle" style="color: #ff9800; font-size: 14px;"></i>
                                    </div>
                                    <div class="author-stats-row" style="display: flex; align-items: center; gap: 8px; font-size: 11px; color: rgba(255, 255, 255, 0.7); margin-top: 2px;">
                                        <span>${formatNumber(post.followersCount || 0)} ผู้ติดตาม • ${formatNumber(post.views || 0)} ดู</span>
                                        <span class="online-status" style="color: #00f2ea; font-weight: 800; font-size: 10px;">• ออนไลน์ตอนนี้</span>
                                    </div>
                                </div>
                            </div>

                            <h3 class="news-title" style="color: white; margin-bottom: 8px; font-size: 1.05rem; font-weight: 500; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                                ${escapeHtml(post.title)}
                            </h3>

                            <div class="video-reel-text" style="font-size: 0.9rem; opacity: 0.9; margin-bottom: 8px;">
                                ${formatContent(post.content || '')}
                            </div>

                            <div class="music-marquee-container" style="display: flex; align-items: center; gap: 8px; margin-top: 8px; overflow: hidden; max-width: 200px;">
                                <i class="fas fa-music" style="color: #fff; font-size: 14px;"></i>
                                <div class="music-scroller">
                                    <span>${escapeHtml(authorInfo.name)} - Original Sound (${timeAgo})</span>
                                </div>
                            </div>
                        </div>

                        <!-- Right Side: Actions Sidebar -->
                        <div class="video-reel-actions" style="position: absolute; right: 10px; bottom: 110px; display: flex; flex-direction: column; align-items: center; gap: 18px; pointer-events: auto;">
                            
                            <!-- Avatar with Follow Plus -->
                            <div class="avatar-wrapper" style="position: relative; margin-bottom: 5px; cursor: pointer;" onclick="event.stopPropagation(); window.location.href='channel.html?userId=${post.authorId || 'admin'}'">
                                <img src="${authorInfo.avatar}" class="avatar-img" style="width: 48px; height: 48px; border-radius: 50%; border: 2px solid white; object-fit: cover;">
                                <div class="follow-plus-badge" style="position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%); width: 22px; height: 22px; background: #FF0050; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white;">
                                    <i class="fas fa-plus" style="color: white; font-size: 10px;"></i>
                                </div>
                            </div>

                            <!-- Like -->
                            <div class="reel-action ${FeedRenderer.userLikedIds.includes(post.id) ? 'liked' : ''}" onclick="likePost('${post.id}')" style="display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer;">
                                <div class="action-icon-wrapper" style="width: 45px; height: 45px; background: rgba(255,255,255,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2);">
                                    <i class="fas fa-heart" style="font-size: 24px; color: ${FeedRenderer.userLikedIds.includes(post.id) ? '#FF0050' : 'white'};"></i>
                                </div>
                                <span style="color: white; font-size: 11px; font-weight: 600;">${formatNumber(post.likes)}</span>
                            </div>

                            <!-- Comment -->
                            <div class="reel-action" onclick="openComments('${post.id}')" style="display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer;">
                                <div class="action-icon-wrapper" style="width: 45px; height: 45px; background: rgba(255,255,255,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2);">
                                    <i class="fas fa-comment-dots" style="font-size: 22px; color: white;"></i>
                                </div>
                                <span style="color: white; font-size: 11px; font-weight: 600;">${formatNumber(post.commentsCount)}</span>
                            </div>

                            <!-- Share -->
                            <div class="reel-action" onclick="sharePost('${post.id}', '${escapeHtml(post.title)}')" style="display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer;">
                                <div class="action-icon-wrapper" style="width: 45px; height: 45px; background: rgba(255,255,255,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2);">
                                    <i class="fas fa-share-alt" style="font-size: 20px; color: white;"></i>
                                </div>
                                <span style="color: white; font-size: 11px; font-weight: 600;">แชร์</span>
                            </div>

                            <!-- Music Disc -->
                            <div class="tuktuk-music-disc spinning">
                            </div>
                        </div>

                        <!-- Progress Bar -->
                        <div class="tuktuk-progress-bar">
                            <div class="tuktuk-progress-fill" id="progress-bar-${post.id}"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Standard Render for other categories
    let mediaHtml = '';
    const rawImages = post.images || (post.imageUrl ? [post.imageUrl] : []);
    
    // Normalize media types
    const allMedia = rawImages.map(item => {
        if (typeof item === 'object') return item;
        if (item.match(/\.(mp4|webm|ogg|mov)$/i)) return { type: 'video', url: item };
        return { type: 'image', url: item };
    });
    
    const youtubeUrl = post.youtubeUrl || '';
    const youtubeId = extractYoutubeId(youtubeUrl);
    if (youtubeId) {
        const existingIdx = allMedia.findIndex(m => m.type === 'youtube');
        if (existingIdx === -1) {
            allMedia.push({ type: 'youtube', url: youtubeId });
        }
    }
    
    const totalMedia = allMedia.length;
    
    if (totalMedia > 0) {
        if (totalMedia === 1) {
            const first = allMedia[0];
            if (first.type === 'image') {
                mediaHtml = `<img src="${first.url}" class="news-image" alt="${post.title}"
                    onerror="this.style.display='none'" loading="lazy">`;
            } else if (first.type === 'video') {
                mediaHtml = `
                    <div class="news-video-container">
                        <video controls playsinline webkit-playsinline preload="metadata" class="w-100">
                            <source src="${first.url}" type="video/mp4">
                        </video>
                    </div>`;
            } else if (first.type === 'youtube') {
                const origin = window.location.origin && window.location.origin !== 'null'
                    ? encodeURIComponent(window.location.origin) : '';
                let ytSrc = `https://www.youtube.com/embed/${first.url}?enablejsapi=1`;
                if (origin) ytSrc += `&origin=${origin}`;
                mediaHtml = `
                    <div class="news-video-container">
                        <iframe src="${ytSrc}" allowfullscreen loading="lazy"></iframe>
                    </div>`;
            }
        } else {
            const firstMedia = allMedia[0];
            let mainContent = '';
            if (firstMedia.type === 'image') {
                mainContent = `<img src="${firstMedia.url}" alt="${post.title}"
                    id="gallery-main-${post.id}" loading="lazy">`;
            } else if (firstMedia.type === 'video') {
                mainContent = `<video controls playsinline webkit-playsinline preload="metadata"
                    id="gallery-main-${post.id}" class="w-100">
                    <source src="${firstMedia.url}">
                </video>`;
            } else {
                const origin = encodeURIComponent(window.location.origin);
                mainContent = `<iframe
                    src="https://www.youtube.com/embed/${firstMedia.url}?enablejsapi=1&origin=${origin}"
                    allowfullscreen id="gallery-main-${post.id}" loading="lazy"></iframe>`;
            }
            
            const thumbnails = allMedia.map((media, index) => {
                let thumbSrc = '';
                if (media.type === 'image') thumbSrc = media.url;
                else if (media.type === 'youtube') thumbSrc = `https://img.youtube.com/vi/${media.url}/mqdefault.jpg`;
                else thumbSrc = 'https://placehold.co/100x100?text=Video';
                
                return `<div
                    class="gallery-thumb ${media.type !== 'image' ? 'video' : ''} ${index === 0 ? 'active' : ''}"
                    onclick="changeGalleryMedia('${post.id}', ${index}, '${media.url}', '${media.type}')">
                    <img src="${thumbSrc}" alt="media ${index + 1}">
                </div>`;
            }).join('');
            
            mediaHtml = `
                <div class="news-media-gallery" data-post-id="${post.id}"
                    data-media='${JSON.stringify(allMedia)}'>
                    <div class="media-gallery-main" id="gallery-container-${post.id}">
                        ${mainContent}
                        ${totalMedia > 1 ? `
                        <button class="gallery-nav-btn prev"
                            onclick="navigateGallery('${post.id}', -1)">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <button class="gallery-nav-btn next"
                            onclick="navigateGallery('${post.id}', 1)">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                        <div class="gallery-counter">
                            <span id="gallery-index-${post.id}">1</span>/${totalMedia}
                        </div>
                        ` : ''}
                    </div>
                    <div class="gallery-thumbnails">${thumbnails}</div>
                </div>`;
        }
    } else if (post.videoEmbed) {
        // Ensure videoEmbed has JS API enabled
        let embed = post.videoEmbed;
        if (embed.includes('youtube.com') || embed.includes('youtu.be')) {
            const origin = window.location.origin && window.location.origin !== 'null'
                ? encodeURIComponent(window.location.origin) : '';
            
            if (!embed.includes('enablejsapi=1')) {
                embed = embed.replace(/src="([^"]+)"/, (match, src) => {
                    const separator = src.includes('?') ? '&' : '?';
                    let newSrc = `${src}${separator}enablejsapi=1`;
                    if (origin) newSrc += `&origin=${origin}`;
                    return `src="${newSrc}"`;
                });
            }
            
            embed = embed.replace(/width="[^"]*"/, 'width="100%"').replace(/height="[^"]*"/, 'height="100%"');
        }
        
        mediaHtml = `<div class="news-video-container">${embed}</div>`;
    }
    
    const contentLength = post.content?.length || 0;
    const isLongContent = contentLength > 300;
    const truncatedClass = isLongContent ? 'truncated' : '';
    const readMoreBtn = isLongContent ? `
        <button class="read-more-btn" onclick="toggleReadMore(this, '${post.id}')">
            <i class="fas fa-chevron-down"></i>
            <span>อ่านเพิ่มเติม</span>
        </button>
    ` : '';
    
    return `
        <div class="news-card ${pinnedClass}" id="card-${post.id}">
            ${optionsMenu}
            <div class="news-header"
                onclick="window.location.href='channel.html?userId=${post.authorId || 'admin'}'"
                style="cursor: pointer;">
                <div class="news-avatar"
                    style="border-radius: 50%; overflow: hidden; background: #eee;">
                    <img src="${getAuthorInfo(post).avatar}"
                        class="author-avatar-${post.authorId || 'admin'}"
                        style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <div class="news-meta">
                    <p class="news-author author-name-${post.authorId || 'admin'}">
                        ${escapeHtml(getAuthorInfo(post).name)}
                    </p>
                    <span class="news-time"><i
                            class="far fa-clock me-1"></i>${timeAgo}</span>
                </div>
                <span
                    class="news-category ${categoryClass}">${categoryLabels[post.category] || post.category}</span>
            </div>
            
            ${mediaHtml}
            
            <h3 class="news-title" style="margin-top: 20px;">
                ${escapeHtml(post.title)}</h3>
            <div class="news-content ${truncatedClass}" id="content-${post.id}">
                ${formatContent(post.content)}</div>
            ${readMoreBtn}
            
            <div class="news-actions">
                <button
                    class="action-btn ${FeedRenderer.userLikedIds.includes(post.id) ? 'liked' : ''}"
                    onclick="likePost('${post.id}')">
                    <i class="fas fa-heart"></i>
                    <span>${formatNumber(post.likes)}</span>
                </button>
                <button class="action-btn" onclick="openComments('${post.id}')">
                    <i class="fas fa-comment"></i>
                    <span>${post.commentsCount || 0}</span>
                </button>
                <button class="action-btn"
                    onclick="sharePost('${post.id}', '${escapeHtml(post.title)}')">
                    <i class="fas fa-share-alt"></i>
                    <span>แชร์</span>
                </button>
                <div class="ms-auto text-muted small pe-3">
                    <i class="fas fa-eye"></i><span
                        class="view-count-${post.id}">${formatNumber(post.views)}</span>
                </div>
            </div>
        </div>
    `;
}

// ================================================
// RENDER FUNCTIONS - EMPTY STATE
// ================================================

/**
 * Render empty state
 */
function renderEmptyState(message) {
    return `
        <div class="empty-state text-center"
            style="padding: 80px 20px; animation: fadeIn 0.8s ease;">
            <div
                style="width: 100px; height: 100px; background: rgba(255,255,255,0.03); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 25px; border: 1px solid rgba(255,255,255,0.05);">
                <i class="fas fa-ghost"
                    style="font-size: 3rem; background: linear-gradient(135deg, #6366f1, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent;"></i>
            </div>
            <h3
                style="color: #f8fafc; font-weight: 700; margin-bottom: 15px; letter-spacing: -0.5px;">
                ${message}</h3>
            <p
                style="color: #94a3b8; max-width: 300px; margin: 0 auto 30px; font-size: 0.95rem;">
                ลองสำรวจหมวดหมู่อื่นๆ
                เพื่อค้นหาคอนเทนต์ที่น่าสนใจเพิ่มเติม</p>
            <button class="btn px-4 py-2" onclick="switchCategory('all')"
                style="background: var(--primary-gradient); color: white; border-radius: 50px; border: none; font-weight: 600; box-shadow: 0 10px 20px rgba(99, 102, 241, 0.3);">ไปที่ฟีดหลัก</button>
        </div>
    `;
}

// ================================================
// RENDER FUNCTIONS - TUKTUK FEED
// ================================================

/**
 * Render TukTuk UI Feed
 */
function renderTukTukFeed(posts, append = false) {
    // tuktuk_feed_logic.js (new system) owns #tuktukFeed when loaded — skip old renderer
    if (typeof window.renderTukTukSlides === 'function') return;

    const tokTokContainer = document.getElementById('tuktukFeed');
    if (!tokTokContainer) return;

    if (!append) {
        tokTokContainer.innerHTML = '';
        // Inject Welcome Hero Card
        if (FeedRenderer.currentCategory !== 'near_me' && shouldShowWelcome()) {
            renderWelcomeCard(tokTokContainer);
        }
    }
    
    // Filter for video posts
    const videoPosts = posts.filter(p => {
        if (p.type === 'product' || p.category === 'weather' || p.type === 'weather' || p.category === 'news') return true;
        const hasYoutube = p.videoEmbed?.includes('youtube.com') || p.youtubeUrl || p.videoUrl;
        const hasDirectVideo = p.images?.some(img => 
            (typeof img === 'object' && img.type === 'video') || 
            (typeof img === 'string' && img.endsWith('.mp4'))
        );
        return p.category === 'video' || p.type === 'video' || hasYoutube || hasDirectVideo;
    });
    
    let productIdx = Math.floor(Math.random() * FeedRenderer.marketplaceProducts.length);
    
    videoPosts.forEach((post, index) => {
        // Interleave every 4 videos
        if (index > 0 && index % 4 === 0) {
            const interEl = document.createElement('div');
            interEl.className = 'tuktuk-video-item product-interleaved-item';
            
            if (index % 20 === 0 && FeedRenderer.communityGroups && FeedRenderer.communityGroups.length > 0) {
                // Group Recommendation
                const group = FeedRenderer.communityGroups[Math.floor(index / 20) % FeedRenderer.communityGroups.length];
                interEl.id = `tuktuk-group-${group.id}`;
                interEl.innerHTML = renderTukTukGroupRecommendation(group);
                tokTokContainer.appendChild(interEl);
            } else if (FeedRenderer.latestNewsFeed.length > 0 && (index / 4) % 2 === 1) {
                // News Feed Interleaving
                const news = FeedRenderer.latestNewsFeed[Math.floor(index / 4) % FeedRenderer.latestNewsFeed.length];
                interEl.id = `tuktuk-news-${news.id}`;
                interEl.innerHTML = renderTukTukNewsItem(news);
                tokTokContainer.appendChild(interEl);
            } else if (FeedRenderer.marketplaceProducts.length > 0) {
                // Product Interleaving
                const prod = FeedRenderer.marketplaceProducts[productIdx % FeedRenderer.marketplaceProducts.length];
                interEl.id = `tuktuk-${prod.id}`;
                interEl.innerHTML = renderTukTukProductItem(prod);
                tokTokContainer.appendChild(interEl);
                productIdx++;
            }
        }
        
        const videoItem = document.createElement('div');
        videoItem.className = 'tuktuk-video-item';
        videoItem.id = `tuktuk-${post.id}`;
        
        if (post.type === 'product') {
            videoItem.innerHTML = renderTukTukProductItem(post);
            tokTokContainer.appendChild(videoItem);
            tuktukObserver.observe(videoItem);
            return;
        } else if (post.category === 'weather' || post.type === 'weather') {
            videoItem.innerHTML = renderTukTukWeatherCard(post);
            tokTokContainer.appendChild(videoItem);
            tuktukObserver.observe(videoItem);
            return;
        } else if (post.category === 'news') {
            const newsData = {
                ...post,
                imageUrl: post.imageUrl || (post.images && post.images.length > 0 ? 
                    (typeof post.images[0] === 'string' ? post.images[0] : post.images[0].url) : null) || post.image,
                source: post.authorName || 'News',
                summary: post.description || post.content
            };
            videoItem.innerHTML = renderTukTukNewsItem(newsData);
            tokTokContainer.appendChild(videoItem);
            tuktukObserver.observe(videoItem);
            return;
        }
        
        let mediaHtml = '';
        const embedUrl = post.videoEmbed || post.youtubeUrl;
        
        if (embedUrl && (embedUrl.includes('youtube.com') || embedUrl.includes('youtu.be'))) {
            const videoId = extractYoutubeId(embedUrl);
            mediaHtml = `
                <div class="iframe-protection" onclick="toggleTukTukPlayback('${post.id}')"></div>
                <div id="yt-player-${post.id}" class="tuktuk-video yt-placeholder" data-video-id="${videoId}"></div>
                <div class="video-loading-placeholder">
                    <div class="spinner-border text-light" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
                <div class="slow-connection-overlay" id="slow-conn-${post.id}">
                    <img src="assets/images/tuknet.png" class="sad-tuktuk-img" alt="Slow Internet">
                    <div class="slow-text-main">เน็ตช้าก็เหมือนตุ๊กตุ๊กไม่มีน้ำมัน</div>
                    <div class="slow-text-sub">รออีกสักนิดนะครับ...</div>
                    <button class="retry-load-btn" onclick="retryVideoLoad('${post.id}')">
                        <i class="fas fa-redo-alt me-2"></i> ลองโหลดอีกครั้ง
                    </button>
                </div>
                <div class="video-progress-container" onclick="handleVideoSeek(event, '${post.id}')">
                    <div class="video-progress-bar" id="progress-${post.id}">
                        <div class="video-progress-thumb"></div>
                    </div>
                </div>
                <div class="tap-unmute-guide" id="guide-${post.id}">
                    <i class="fas fa-volume-up"></i> แตะเพื่อเปิดเสียง
                </div>
            `;
        } else if (embedUrl) {
            const embedResult = parseVideoEmbed(embedUrl);
            if (embedResult) {
                mediaHtml = `
                    <div class="iframe-protection" onclick="toggleTukTukPlayback('${post.id}')"></div>
                    <div class="tuktuk-media-content" style="width:100%; height:100%;">
                        ${embedResult.replace('<iframe', `<iframe class="tuktuk-video" id="iframe-${post.id}"
                            onload="handleVideoLoaded('${post.id}')" `)}</div>
                    <div class="video-loading-placeholder">
                        <div class="spinner-border text-light" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                    </div>
                    <div class="slow-connection-overlay" id="slow-conn-${post.id}">
                        <img src="assets/images/tuknet.png" class="sad-tuktuk-img" alt="Slow Internet">
                        <div class="slow-text-main">เน็ตช้าก็เหมือนตุ๊กตุ๊กไม่มีน้ำมัน</div>
                        <button class="retry-load-btn" onclick="retryVideoLoad('${post.id}')">
                            <i class="fas fa-redo-alt me-2"></i> ลองโหลดอีกครั้ง
                        </button>
                    </div>
                `;
            }
        } else {
            const videoFile = post.images?.find(img => {
                const url = (typeof img === 'object' ? img.url : img).toLowerCase();
                return (typeof img === 'object' && img.type === 'video') ||
                    url.endsWith('.mp4') || url.endsWith('.mov') ||
                    url.endsWith('.webm') || url.endsWith('.m3u8');
            }) || post.videoUrl;
            
            const videoUrl = typeof videoFile === 'object' ? videoFile.url : videoFile;
            let videoPoster = (typeof videoFile === 'object' && videoFile.thumbnailUrl)
                ? videoFile.thumbnailUrl
                : (post.thumbnailUrl || '');

            const isDirectVideoUrl = (url) => /\.(mp4|webm|mov|m4v|m3u8|avi|mkv)(\?|$)/i.test(url || '') || /youtube\.com|youtu\.be/i.test(url || '');
            if (videoPoster && isDirectVideoUrl(videoPoster)) {
                videoPoster = '';
            }
            
            if (videoUrl) {
                mediaHtml = `
                    <div class="iframe-protection" onclick="toggleTukTukPlayback('${post.id}')">
                    </div>
                    <div class="video-loading-placeholder">
                        <div class="spinner-border text-light" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                    </div>
                    <div class="slow-connection-overlay" id="slow-conn-${post.id}">
                        <img src="assets/images/tuknet.png" class="sad-tuktuk-img" alt="Slow Internet">
                        <div class="slow-text-main">เน็ตช้าก็เหมือนตุ๊กตุ๊กไม่มีน้ำมัน</div>
                        <button class="retry-load-btn" onclick="retryVideoLoad('${post.id}')">
                            <i class="fas fa-redo-alt me-2"></i> ลองโหลดอีกครั้ง
                        </button>
                    </div>
                    <video class="tuktuk-video" playsinline preload="none" data-src="${videoUrl}"
                        ${videoPoster ? `poster="${videoPoster}"` : ''}
                        onclick="toggleTukTukPlayback('${post.id}')"
                        ontimeupdate="updateVideoProgress(this, '${post.id}')"
                        onloadeddata="handleVideoLoaded('${post.id}')"
                        onended="handleTuktukVideoEnded(this, '${post.id}')"
                        onerror="handleVideoError('${post.id}')">
                        <source src="" type="video/mp4">
                    </video>
                    <div class="video-progress-container" onclick="handleVideoSeek(event, '${post.id}')">
                        <div class="video-progress-bar" id="progress-${post.id}">
                            <div class="video-progress-thumb"></div>
                        </div>
                        <div class="video-time-indicator" id="time-indicator-${post.id}">0:00
                        </div>
                    </div>
                `;
            }
        }
        
        if (!mediaHtml) return;
        
        videoItem.innerHTML = `
            <div class="tuktuk-media-wrapper">
                ${mediaHtml}
            </div>

            <div class="tuktuk-overlay">
                <div class="tuktuk-info">
                    <div class="tuktuk-author"
                        onclick="event.stopPropagation(); window.location.href='channel.html?userId=${post.authorId || 'admin'}'"
                        style="cursor: pointer;">
                        <img src="${getAuthorInfo(post).avatar}"
                            class="tuktuk-avatar author-avatar-${post.authorId || 'admin'}" alt="Author">
                        <span
                            class="author-name-${post.authorId || 'admin'}">${escapeHtml(getAuthorInfo(post).name)}</span>
                        <div class="author-stats-mini ms-1" style="font-size: 0.65rem; opacity: 0.8;">
                            <span class="follower-count-${post.authorId || 'admin'}">0</span>
                            ผู้ติดตาม •
                            <span class="total-views-${post.authorId || 'admin'}">0</span>
                            การดู
                        </div>
                        ${(FeedRenderer.currentUserId && post.authorId !== FeedRenderer.currentUserId) ? `
                        <button
                            class="btn btn-sm btn-outline-light rounded-pill ms-2 follow-btn ${(FeedRenderer.userFollowingIds.includes(post.authorId)) ? 'active' : ''}"
                            onclick="event.stopPropagation(); handleFollow(this, '${post.authorId || 'admin'}')"
                            style="font-size: 0.7rem;">
                            ${(FeedRenderer.userFollowingIds.includes(post.authorId)) ? 'กำลังติดตาม' : 'ติดตาม'}
                        </button>
                        ` : ''}
                    </div>
                    <div class="tuktuk-desc">
                        <strong>${escapeHtml(post.title || post.description?.substring(0, 50) || 'วิดีโอใหม่')}</strong>
                        ${post.locationName || post.location ? `<div class="post-location-badge"><i
                                class="fas fa-map-marker-alt"></i>
                            ${escapeHtml(post.locationName || post.location)}</div>` : ''}
                        <div class="mt-1">${formatContent(post.content || post.description)}</div>
                    </div>

                    <!-- Music Identity -->
                    <div class="tuktuk-music">
                        <i class="fas fa-music"></i>
                        <div class="music-marquee">
                            <span>${escapeHtml(getAuthorInfo(post).name)} - Original Sound • ${escapeHtml(post.title)}</span>
                        </div>
                    </div>

                    ${post.linkedProductId ? `
                    <a href="product.html?id=${post.linkedProductId}" class="shoppable-card"
                        onclick="trackProductClick('${post.id}', '${post.linkedProductId}')">
                        <img src="${post.productThumb || 'https://placehold.co/100?text=Product'}"
                            class="shoppable-img">
                        <div class="shoppable-info">
                            <div style="font-size: 0.75rem; font-weight: 700; color: #333;">
                                สินค้าในวิดีโอ</div>
                            <div class="shoppable-price">฿${(post.productPrice || 0).toLocaleString()}</div>
                            <div style="font-size: 0.65rem; color: #666;">
                                แตะเพื่อดูรายละเอียด</div>
                        </div>
                        <div class="shoppable-btn"><i class="fas fa-shopping-cart"></i>
                        </div>
                    </a>
                    ` : ''}
                </div>
            </div>

            <div class="tuktuk-actions">
                <div class="tuktuk-action-btn" onclick="togglePostMenu('${post.id}', event, 'tuktuk')">
                    <i class="fas fa-ellipsis-h" style="font-size: 1.4rem;"></i>
                    <div class="post-options-menu tuktuk-post-options" id="menu-tuktuk-${post.id}">
                        ${((FeedRenderer.currentUserId && post.authorId === FeedRenderer.currentUserId) ||
                            (FeedRenderer.currentLineUserId && post.authorId === FeedRenderer.currentLineUserId) ||
                            FeedRenderer.isAdmin) ? `
                        <button class="post-option-item" onclick="togglePin('${post.id}', ${!post.pinned})">
                            <i class="fas fa-thumbtack ${post.pinned ? 'text-warning' : ''}"></i>
                            ${post.pinned ? 'เลิกปักหมุด' : 'ปักหมุด'}
                        </button>
                        <button class="post-option-item" onclick="editPost('${post.id}')">
                            <i class="fas fa-edit"></i>
                            แก้ไข
                        </button>
                        <button class="post-option-item text-danger" onclick="confirmDelete('${post.id}')">
                            <i class="fas fa-trash-alt"></i>
                            ลบโพสต์
                        </button>
                        ` : ''}
                        <button class="post-option-item"
                            onclick="toggleTuktukAutoScroll(event, '${post.id}')">
                            <i class="fas fa-magic ${FeedRenderer.isAutoScroll ? 'text-warning' : ''}"
                                id="autoscroll-icon-${post.id}"></i>
                            <span id="autoscroll-text-${post.id}">เล่นอัตโนมัติ:
                                ${FeedRenderer.isAutoScroll ? 'เปิด' : 'ปิด'}</span>
                        </button>
                        <button class="post-option-item" onclick="sharePost('${post.id}')">
                            <i class="fas fa-share"></i>
                            แชร์วิดีโอ
                        </button>
                    </div>
                </div>

                <div class="tuktuk-action-btn" onclick="openAuthorProfile('${post.authorId || 'admin'}')">
                    <div style="position: relative;">
                        <img src="${getAuthorInfo(post).avatar}"
                            style="width: 45px; height: 45px; border-radius: 50%; border: 2px solid #fff; object-fit: cover;">
                        ${(FeedRenderer.currentUserId && post.authorId !== FeedRenderer.currentUserId &&
                            !FeedRenderer.userFollowingIds.includes(post.authorId)) ? `
                        <div style="position: absolute; bottom: -5px; left: 50%; transform: translateX(-50%); background: #fe2c55; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #000;"
                            onclick="event.stopPropagation(); handleFollow(this, '${post.authorId || 'admin'}')">
                            <i class="fas fa-plus" style="font-size: 0.6rem; color: #fff;"></i>
                        </div>
                        ` : ''}
                    </div>
                </div>

                <div class="tuktuk-action-btn ${FeedRenderer.userLikedIds.includes(post.id) ? 'liked' : ''}"
                    onclick="likePost('${post.id}')">
                    <i class="fas fa-heart ${FeedRenderer.userLikedIds.includes(post.id) ? 'text-danger' : ''}"></i>
                    <span style="font-size: 0.75rem;">${formatNumber(post.likes)}</span>
                </div>

                <div class="tuktuk-action-btn" onclick="openComments('${post.id}')">
                    <i class="fas fa-comment-dots"></i>
                    <span style="font-size: 0.75rem;">${formatNumber(post.commentsCount)}</span>
                </div>

                <div class="tuktuk-action-btn" onclick="sharePost('${post.id}')">
                    <i class="fas fa-share"></i>
                    <span style="font-size: 0.75rem;">แชร์</span>
                </div>

                <!-- Spinning Record -->
                <div class="spinning-record">
                    <i class="fas fa-compact-disc"></i>
                </div>
            </div>
        `;
        
        tokTokContainer.appendChild(videoItem);
        tuktukObserver.observe(videoItem);
    });
    
    // Performance boost: preload first 2 videos
    if (!append && videoPosts.length > 0) {
        videoPosts.slice(0, 2).forEach(post => {
            const videoItem = document.getElementById(`tuktuk-${post.id}`);
            if (videoItem) {
                const video = videoItem.querySelector('video');
                const ytEl = videoItem.querySelector('.yt-placeholder');
                
                if (video && video.dataset.src) {
                    console.log('Proactive Preload (Video):', post.id);
                    video.src = video.dataset.src;
                    video.load();
                    delete video.dataset.src;
                } else if (ytEl) {
                    console.log('Proactive Preload (YouTube):', post.id);
                    initYoutubePlayer(post.id, ytEl);
                }
            }
        });
    }
    
    // Handle landing on specific postId
    const urlParams = new URLSearchParams(window.location.search);
    const targetPostId = urlParams.get('post') || urlParams.get('postId') || urlParams.get('id');
    
    if (targetPostId) {
        setTimeout(() => {
            const targetEl = document.getElementById(`tuktuk-${targetPostId}`);
            if (targetEl) {
                targetEl.scrollIntoView({ behavior: 'auto' });
                console.log('Scrolled to target post:', targetPostId);
            }
        }, 500);
    }
}

// ================================================
// NOTIFICATION FUNCTIONS
// ================================================

let unreadNotifCount = 0;
let notifListener = null;

/**
 * Toggle notifications panel
 */
function toggleNotifications() {
    if (typeof WizmobizAuth !== 'undefined' && !WizmobizAuth.isLoggedIn()) {
        showNotification('กรุณาเข้าสู่ระบบเพื่อดูการแจ้งเตือน', 'warning');
        return;
    }
    
    const panel = document.getElementById('notificationPanel');
    if (!panel) return;
    const isShowing = panel.classList.toggle('show');
    
    if (isShowing) {
        const badge = document.getElementById('notifBadge');
        if (badge) badge.style.display = 'none';
        markAllNotificationsRead();
    }
}

/**
 * Initialize notifications
 */
async function initNotifications() {
    const user = typeof WizmobizAuth !== 'undefined' ? WizmobizAuth.getUser() : null;
    if (!user) return;
    
    const userId = user.uid || user.lineUserId;
    const notifList = document.getElementById('notificationList');
    const notifBadge = document.getElementById('notifBadge');
    
    if (notifListener) notifListener();
    
    try {
        notifListener = db.collection(FEED_RENDERER_CONFIG.COLLECTIONS.NOTIFICATIONS)
            .where('recipientId', '==', userId)
            .orderBy('createdAt', 'desc')
            .limit(20)
            .onSnapshot(snapshot => {
                const subtitle = document.getElementById('notifSubtitle');
                
                if (snapshot.empty) {
                    notifList.innerHTML = `
                        <div class="text-center" style="padding: 50px 20px; color: rgba(255,255,255,0.3);">
                            <div style="font-size:2.5rem; margin-bottom:12px; opacity:0.4;">🔔</div>
                            <div style="font-size:0.85rem; font-weight:600; color:rgba(255,255,255,0.4);">
                                ยังไม่มีการแจ้งเตือน</div>
                            <div style="font-size:0.72rem; margin-top:6px; color:rgba(255,255,255,0.2);">
                                การแจ้งเตือนใหม่จะปรากฏที่นี่</div>
                        </div>
                    `;
                    if (notifBadge) notifBadge.style.display = 'none';
                    if (subtitle) subtitle.textContent = 'ไม่มีการแจ้งเตือน';
                    return;
                }
                
                let html = '';
                unreadNotifCount = 0;
                
                snapshot.forEach(doc => {
                    if (!doc.data().read) unreadNotifCount++;
                });
                
                if (window.updatePillNotifCount) {
                    window.updatePillNotifCount(unreadNotifCount);
                }
                
                const iconColors = {
                    'fa-motorcycle': 'linear-gradient(135deg,#FF6B35,#FF9500)',
                    'fa-star': 'linear-gradient(135deg,#f59e0b,#fbbf24)',
                    'fa-heart': 'linear-gradient(135deg,#ef4444,#f87171)',
                    'fa-comment': 'linear-gradient(135deg,#06b6d4,#38bdf8)',
                    'fa-store': 'linear-gradient(135deg,#10b981,#34d399)',
                    'fa-shopping-cart': 'linear-gradient(135deg,#8b5cf6,#a78bfa)',
                    'fa-bell': 'linear-gradient(135deg,#667eea,#764ba2)',
                };
                
                snapshot.forEach(doc => {
                    const n = doc.data();
                    const timeLabel = formatNotifTime(n.createdAt);
                    const icon = n.icon || 'fa-bell';
                    const bgStyle = iconColors[icon] || (n.color ? 
                        `linear-gradient(135deg,${n.color},${n.color}cc)` : 
                        'linear-gradient(135deg,#667eea,#764ba2)');
                    
                    html += `
                        <div class="notif-item ${n.read ? 'read' : 'unread'}"
                            onclick="handleNotifClick('${doc.id}', '${n.link || '#'}')">
                            <div class="notif-icon" style="background: ${bgStyle}; color:#fff;">
                                <i class="fas ${icon}"></i>
                            </div>
                            <div class="notif-content">
                                <div class="notif-title">${escapeHtml(n.title)}</div>
                                <div class="notif-text">${escapeHtml(n.text || '')}</div>
                                <div class="notif-time"><i class="fas fa-clock"
                                        style="margin-right:4px;font-size:0.6rem;"></i>${timeLabel}
                                </div>
                            </div>
                            ${!n.read ? '<div class="unread-dot"></div>' : ''}
                        </div>
                    `;
                });
                
                notifList.innerHTML = html;
                
                const total = snapshot.size;
                if (subtitle) {
                    subtitle.textContent = unreadNotifCount > 0
                        ? `${unreadNotifCount} ยังไม่ได้อ่าน จาก ${total} รายการ`
                        : `อ่านแล้วทั้งหมด (${total} รายการ)`;
                }
                
                // Update all notification badges
                const badges = [
                    document.getElementById('notifBadge'),
                    document.getElementById('pillBadge'),
                    document.getElementById('pillBadgeExp')
                ];
                
                badges.forEach(b => {
                    if (!b) return;
                    if (unreadNotifCount > 0) {
                        b.style.display = 'flex';
                        b.textContent = unreadNotifCount > 99 ? '99+' : unreadNotifCount;
                    } else {
                        b.style.display = 'none';
                    }
                });
                
                if (typeof window.updatePillNotifCount === 'function') {
                    window.updatePillNotifCount(unreadNotifCount);
                }
            });
    } catch (error) {
        console.error('[FeedRenderer] Error initializing notifications:', error);
    }
}

/**
 * Mark all notifications as read
 */
async function markAllNotificationsRead() {
    const user = typeof WizmobizAuth !== 'undefined' ? WizmobizAuth.getUser() : null;
    if (!user) return;
    
    const userId = user.uid || user.lineUserId;
    
    try {
        const batch = db.batch();
        const unreadDocs = await db.collection(FEED_RENDERER_CONFIG.COLLECTIONS.NOTIFICATIONS)
            .where('recipientId', '==', userId)
            .where('read', '==', false)
            .get();
        
        unreadDocs.forEach(doc => {
            batch.update(doc.ref, { read: true });
        });
        
        await batch.commit();
    } catch (error) {
        console.error('[FeedRenderer] Error marking notifications read:', error);
    }
}

/**
 * Handle notification click
 */
function handleNotifClick(id, link) {
    if (link && link !== '#') {
        window.location.href = link;
    }
}

// ================================================
// CHAT NOTIFICATIONS INTEGRATION
// ================================================

let lastChatUnreadCount = 0;

/**
 * Initialize chat notifications
 */
function initChatNotifications() {
    const user = typeof WizmobizAuth !== 'undefined' ? WizmobizAuth.getUser() : null;
    if (!user || typeof TukTukChat === 'undefined') return;
    
    const userId = user.uid || user.lineUserId;
    
    TukTukChat.listenTotalUnread(userId, (chatUnreadCount) => {
        window.updatePillChatCount(chatUnreadCount);
        
        const chatBadges = [
            document.getElementById('pillChatBadge'),
            document.getElementById('pillChatBadgeExp'),
            document.getElementById('bottomChatBadge')
        ];
        
        chatBadges.forEach(b => {
            if (!b) return;
            if (chatUnreadCount > 0) {
                b.style.display = 'flex';
                b.textContent = chatUnreadCount > 99 ? '99+' : chatUnreadCount;
            } else {
                b.style.display = 'none';
            }
        });
        
        if (chatUnreadCount > lastChatUnreadCount) {
            showToast('💬 คุณมีข้อความใหม่', 'info');
        }
        
        lastChatUnreadCount = chatUnreadCount;
    });
}

// ================================================
// NEWS FUNCTIONS
// ================================================

/**
 * Handle news action
 */
async function handleNewsAction(type, label) {
    if (type === 'marketplace') {
        switchCategory('all');
        showToast('🛒 ยินดีต้อนรับสู่ตลาดชุมชน!', 'success');
    } else if (type === 'map') {
        showToast('📍 กำลังนำทางไปยังจุดเกิดเหตุ...', 'info');
    }
}

/**
 * Track news click
 */
async function trackNewsClick(newsId) {
    try {
        await db.collection(FEED_RENDERER_CONFIG.COLLECTIONS.NEWS).doc(newsId).update({
            clicks: firebase.firestore.FieldValue.increment(1)
        });
    } catch (error) {
        // Ignore
    }
}

// ================================================
// SHOPPABLE ANALYTICS
// ================================================

/**
 * Track product click
 */
async function trackProductClick(postId, productId) {
    try {
        db.collection(FEED_RENDERER_CONFIG.COLLECTIONS.POSTS).doc(postId).update({
            productClicks: firebase.firestore.FieldValue.increment(1)
        });
        
        db.collection(FEED_RENDERER_CONFIG.COLLECTIONS.PRODUCTS).doc(productId).update({
            viewCount: firebase.firestore.FieldValue.increment(1)
        });
        
        console.log('Product click tracked:', productId);
    } catch (error) {
        console.log('Analytics error');
    }
}

// ================================================
// POST INTERACTIONS
// ================================================

/**
 * Open author profile
 */
function openAuthorProfile(userId) {
    if (!userId) return;
    window.location.href = `channel.html?userId=${userId}`;
}

/**
 * Handle follow
 */
async function handleFollow(btn, targetUserId) {
    if (!FeedRenderer.currentUserId) {
        showToast('🔒 กรุณาเข้าสู่ระบบเพื่อติดตาม', 'warning');
        return;
    }
    
    if (!targetUserId || targetUserId === FeedRenderer.currentUserId) return;
    
    const isFollowing = btn.classList.contains('active') || 
                        btn.textContent === 'กำลังติดตาม' || 
                        btn.textContent === 'ติดตามแล้ว';
    
    // Optimistic UI update
    if (isFollowing) {
        btn.classList.remove('active', 'bg-white', 'text-dark');
        btn.classList.add('btn-outline-light');
        btn.textContent = 'ติดตาม';
        btn.style.opacity = '1';
        
        const idx = FeedRenderer.userFollowingIds.indexOf(targetUserId);
        if (idx > -1) FeedRenderer.userFollowingIds.splice(idx, 1);
        
        document.querySelectorAll(`.follower-count-${targetUserId}`).forEach(el => {
            const current = parseInt(el.textContent.replace(/,/g, '')) || 0;
            el.textContent = Math.max(0, current - 1).toLocaleString();
        });
    } else {
        btn.classList.add('active', 'bg-white', 'text-dark');
        btn.classList.remove('btn-outline-light');
        btn.textContent = 'กำลังติดตาม';
        btn.style.opacity = '0.9';
        
        if (!FeedRenderer.userFollowingIds.includes(targetUserId)) {
            FeedRenderer.userFollowingIds.push(targetUserId);
        }
        
        document.querySelectorAll(`.follower-count-${targetUserId}`).forEach(el => {
            const current = parseInt(el.textContent.replace(/,/g, '')) || 0;
            el.textContent = (current + 1).toLocaleString();
        });
    }
    
    try {
        const userRef = db.collection(FEED_RENDERER_CONFIG.COLLECTIONS.USERS).doc(FeedRenderer.currentUserId);
        const targetRef = db.collection(FEED_RENDERER_CONFIG.COLLECTIONS.USERS).doc(targetUserId);
        
        const userUpdate = isFollowing ? {
            following: firebase.firestore.FieldValue.arrayRemove(targetUserId),
            followingCount: firebase.firestore.FieldValue.increment(-1),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        } : {
            following: firebase.firestore.FieldValue.arrayUnion(targetUserId),
            followingCount: firebase.firestore.FieldValue.increment(1),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        try {
            await userRef.set(userUpdate, { merge: true });
        } catch (userErr) {
            console.error('CRITICAL: User following list update failed:', userErr);
            throw new Error(`User doc update failed: ${userErr.message}`);
        }
        
        try {
            await targetRef.set({
                followerCount: firebase.firestore.FieldValue.increment(isFollowing ? -1 : 1)
            }, { merge: true });
        } catch (targetErr) {
            console.warn('NON-CRITICAL: Target follower count update rejected:', targetErr);
        }
        
        if (!isFollowing) {
            showToast('✅ ติดตามเรียบร้อย', 'success');
        }
    } catch (error) {
        console.error('FOLLOW SYSTEM ERROR:', error);
        
        if (error.message.includes('User doc update failed')) {
            showToast('🔒 ไม่สามารถอัปเดตสถานะของคุณได้ (สิทธิ์ล้มเหลว)', 'warning');
        } else {
            showToast('⚠️ ระบบติดขัดชั่วคราว กรุณาลองใหม่', 'error');
        }
    }
}

// ================================================
// POST MENU FUNCTIONS
// ================================================

/**
 * Toggle post menu
 */
function togglePostMenu(postId, event, type = 'standard') {
    if (event) event.stopPropagation();
    
    const menuId = type === 'tuktuk' ? `menu-tuktuk-${postId}` : `menu-${postId}`;
    const allMenus = document.querySelectorAll('.post-options-menu');
    const targetMenu = document.getElementById(menuId);
    
    if (!targetMenu) return;
    
    const isShowing = targetMenu.classList.contains('show');
    
    allMenus.forEach(m => m.classList.remove('show'));
    
    if (!isShowing) {
        targetMenu.classList.add('show');
    }
}

// Close menus on click outside
window.addEventListener('click', () => {
    document.querySelectorAll('.post-options-menu').forEach(m => m.classList.remove('show'));
});

/**
 * Toggle read more
 */
function toggleReadMore(btn, postId) {
    const content = document.getElementById(`content-${postId}`);
    const isExpanded = !content.classList.contains('truncated');
    
    if (isExpanded) {
        content.classList.add('truncated');
        btn.innerHTML = '<i class="fas fa-chevron-down"></i><span>อ่านเพิ่มเติม</span>';
    } else {
        content.classList.remove('truncated');
        btn.innerHTML = '<i class="fas fa-chevron-up"></i><span>ย่อเนื้อหา</span>';
    }
}

// ================================================
// LIKE POST
// ================================================

/**
 * Like post
 */
async function likePost(postId) {
    triggerHaptic(50);

    try {
        // Member
        if (FeedRenderer.currentUserId) {
            const alreadyLiked = FeedRenderer.userLikedIds.includes(postId);
            const delta = alreadyLiked ? -1 : 1;

            await db.collection(FEED_RENDERER_CONFIG.COLLECTIONS.POSTS).doc(postId).update({
                likes: firebase.firestore.FieldValue.increment(delta)
            });

            if (alreadyLiked) {
                FeedRenderer.userLikedIds = FeedRenderer.userLikedIds.filter(id => id !== postId);
                updateHeartUI(postId, false);
                // Sync shared localStorage key
                const stored = JSON.parse(localStorage.getItem('tuktuk_liked_posts') || '[]');
                localStorage.setItem('tuktuk_liked_posts', JSON.stringify(stored.filter(id => id !== postId)));
            } else {
                await db.collection(FEED_RENDERER_CONFIG.COLLECTIONS.LIKES).doc(FeedRenderer.currentUserId).set({
                    postIds: firebase.firestore.FieldValue.arrayUnion(postId),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
                FeedRenderer.userLikedIds.push(postId);
                updateHeartUI(postId, true);
                showToast('💖 บันทึกไว้ในรายการที่ชอบแล้ว', 'success');
                // Sync shared localStorage key
                const stored = JSON.parse(localStorage.getItem('tuktuk_liked_posts') || '[]');
                if (!stored.includes(postId)) stored.push(postId);
                localStorage.setItem('tuktuk_liked_posts', JSON.stringify(stored));
            }
            FeedRenderer.metrics.likes++;
            return;
        }

        // Guest — toggle via sessionStorage
        const guestLikes = JSON.parse(sessionStorage.getItem('guestLikes') || '[]');
        const guestAlreadyLiked = guestLikes.includes(postId);
        const delta = guestAlreadyLiked ? -1 : 1;

        await db.collection(FEED_RENDERER_CONFIG.COLLECTIONS.POSTS).doc(postId).update({
            likes: firebase.firestore.FieldValue.increment(delta)
        });

        if (guestAlreadyLiked) {
            sessionStorage.setItem('guestLikes', JSON.stringify(guestLikes.filter(id => id !== postId)));
            updateHeartUI(postId, false);
        } else {
            guestLikes.push(postId);
            sessionStorage.setItem('guestLikes', JSON.stringify(guestLikes));
            updateHeartUI(postId, true);
            showToast('❤️ ขอบคุณที่ถูกใจ! สมัครสมาชิกเพื่อเก็บวิดีโอนี้ไว้ดูภายหลังได้นะครับ', 'info');
        }
        FeedRenderer.metrics.likes++;

    } catch (error) {
        console.error('[FeedRenderer] Error liking post:', error);
    }
}

/**
 * Update heart UI
 */
function updateHeartUI(postId, liked) {
    const elements = document.querySelectorAll(`[onclick*="likePost('${postId}')"]`);
    elements.forEach(el => {
        const icon = el.querySelector('i');
        const span = el.querySelector('span');
        if (liked) {
            el.classList.add('liked');
            if (icon) icon.className = 'fas fa-heart text-danger';
            if (span) {
                const current = parseInt(span.textContent.replace(/,/g, '')) || 0;
                span.textContent = (current + 1).toLocaleString();
            }
        } else {
            el.classList.remove('liked');
            if (icon) icon.className = 'far fa-heart';
            if (span) {
                const current = parseInt(span.textContent.replace(/,/g, '')) || 0;
                span.textContent = Math.max(0, current - 1).toLocaleString();
            }
        }
    });
}

// ================================================
// SHARE POST
// ================================================

/**
 * Share post
 */
function sharePost(postId, title) {
    triggerHaptic(20);
    FeedRenderer.metrics.shares++;

    const url = `${location.origin}/?post=${postId}`;

    // Track share count in Firestore (fire & forget)
    if (window.db) {
        window.db.collection(FEED_RENDERER_CONFIG.COLLECTIONS.POSTS).doc(postId).update({
            shareCount: firebase.firestore.FieldValue.increment(1)
        }).catch(() => {});
    }

    if (navigator.share) {
        navigator.share({
            title: title || 'TukTuk Thailand',
            text: `${title || ''} - TukTuk Community`,
            url: url
        }).catch(() => {});
    } else {
        navigator.clipboard.writeText(url).then(() => {
            showToast('📋 คัดลอกลิงก์แล้ว!', 'success');
        }).catch(() => {
            showToast('ไม่สามารถแชร์ได้', 'error');
        });
    }
}

// ================================================
// POST CRUD FUNCTIONS
// ================================================

// Modals
window.commentModal = window.commentModal || null;
// (Global variables are managed via window object in firebase-init.js)
// Using var here to avoid "already declared" errors while ensuring they are available in this script
var postModal = window.postModal || null;
var deleteModal = window.deleteModal || null;
var currentCommentPostId = window.currentCommentPostId || null;
var postToDelete = window.postToDelete || null;

document.addEventListener('DOMContentLoaded', () => {
    const commentEl = document.getElementById('commentModal');
    const postEl = document.getElementById('postModal');
    const deleteEl = document.getElementById('deleteModal');
    
    if (commentEl && !window.commentModal) window.commentModal = new bootstrap.Modal(commentEl);
    if (postEl) postModal = new bootstrap.Modal(postEl);
    if (deleteEl) deleteModal = new bootstrap.Modal(deleteEl);
});

/**
 * Open post modal
 */
function openPostModal() {
    document.getElementById('postForm').reset();
    document.getElementById('postId').value = '';
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-edit me-2"></i>สร้างโพสต์ใหม่';
    
    if (quill) quill.setContents([]);
    
    resetUploadArea();
    
    if (postModal) postModal.show();
}

/**
 * Edit post
 */
async function editPost(postId) {
    try {
        const doc = await db.collection(FEED_RENDERER_CONFIG.COLLECTIONS.POSTS).doc(postId).get();
        
        if (doc.exists) {
            const post = doc.data();
            
            document.getElementById('postId').value = postId;
            document.getElementById('postCategory').value = post.category;
            document.getElementById('postTitle').value = post.title;
            
            if (quill) {
                quill.root.innerHTML = post.content || '';
            } else {
                document.getElementById('postContent').value = post.content || '';
            }
            
            document.getElementById('postPinned').checked = !!post.pinned;
            document.getElementById('postPublished').checked = post.published !== false;
            document.getElementById('postPrivacy').value = post.privacy || 'public';
            document.getElementById('modalTitle').innerHTML = '<i class="fas fa-edit me-2"></i>แก้ไขโพสต์';
            
            if (post.images && Array.isArray(post.images)) {
                uploadedImages = [...post.images];
                renderUploadedMedia();
            }
            
            const linkedId = post.linkedProductId || '';
            document.getElementById('linkedProductId').value = linkedId;
            if (linkedId) verifyLinkedProduct(linkedId);
            
            if (post.youtubeUrl || post.videoUrl) {
                const vUrl = post.youtubeUrl || post.videoUrl;
                document.getElementById('postYoutubeUrl').value = vUrl;
                previewVideoLink(vUrl);
            } else {
                const previewArea = document.getElementById('videoPreviewArea');
                if (previewArea) {
                    previewArea.style.display = 'none';
                    previewArea.innerHTML = '';
                }
            }
            
            document.getElementById('postLocation').value = post.locationName || '';
            document.getElementById('postCoordinates').value = post.locationCoords || '';
            
            if (postModal) postModal.show();
        }
    } catch (error) {
        console.error('[FeedRenderer] Error loading post:', error);
        alert('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    }
}

/**
 * Submit post form
 */
document.getElementById('postForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (!FeedRenderer.currentUserId) {
        showToast('🔒 กรุณาเข้าสู่ระบบก่อนเผยแพร่โพสต์', 'warning');
        return;
    }
    
    const btn = this.querySelector('button[type="submit"]');
    const originalBtnContent = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> กำลังบันทึก...';
    btn.disabled = true;
    
    const postId = document.getElementById('postId').value;
    
    let images = [];
    const imagesJson = document.getElementById('postImages').value;
    if (imagesJson) {
        try {
            images = JSON.parse(imagesJson);
        } catch (e) {
            console.log('No images array');
        }
    }
    
    if (images.length === 0 && uploadedImages.length > 0) {
        images = uploadedImages;
    }
    
    const youtubeUrl = document.getElementById('postYoutubeUrl')?.value?.trim() || '';
    const videoEmbed = parseVideoEmbed(youtubeUrl);
    
    const hasVideo = images.some(img => img.type === 'video') || !!youtubeUrl;
    const videoUrl = youtubeUrl || (images.find(img => img.type === 'video')?.url || '');
    
    const postData = {
        category: document.getElementById('postCategory')?.value || (hasVideo ? 'video' : 'all'),
        type: hasVideo ? 'video' : 'image',
        title: document.getElementById('postTitle')?.value?.trim() || '',
        content: quill ? (quill.getText().trim() === '' ? '' : quill.root.innerHTML) : (document.getElementById('postContent')?.value?.trim() || ''),
        images: images.filter(img => img !== undefined && img !== null),
        imageUrl: (images.length > 0 && typeof images[0] === 'string' ? images[0] : (images.length > 0 && images[0].type === 'image' ? images[0].url : (images.length > 0 ? images[0].url : ''))) || '',
        videoUrl: videoUrl || '',
        youtubeUrl: youtubeUrl || '',
        videoEmbed: videoEmbed || '',
        linkedProductId: document.getElementById('linkedProductId')?.value?.trim() || '',
        productName: window.lastVerifiedProduct?.name || '',
        productPrice: window.lastVerifiedProduct?.price || 0,
        productThumb: window.lastVerifiedProduct?.imageUrl || '',
        pinned: document.getElementById('postPinned')?.checked || false,
        published: document.getElementById('postPublished')?.checked !== false,
        privacy: document.getElementById('postPrivacy')?.value || 'public',
        locationName: document.getElementById('postLocation')?.value?.trim() || '',
        locationCoords: document.getElementById('postCoordinates')?.value || '',
        originCollection: 'community_posts',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // Remove any undefined properties to prevent Firestore 400 errors
    Object.keys(postData).forEach(key => postData[key] === undefined && delete postData[key]);
    
    if (!postId) {
        postData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        postData.authorId = FeedRenderer.currentUserId;
    }
    
    const hasMedia = postData.images.length > 0 || postData.youtubeUrl;
    
    if (!postData.title || (!postData.content && !hasMedia)) {
        alert('⚠️ กรุณากรอกหัวข้อ และเนื้อหาหรืออัปโหลดรูปภาพ/วิดีโอ');
        btn.innerHTML = originalBtnContent;
        btn.disabled = false;
        return;
    }
    
    if (containsProfanity(postData.title) || containsProfanity(postData.content)) {
        showToast('⚠️ เนื้อหาของคุณขัดต่อกฏการใช้งาน', 'warning');
        alert('🚫 ไม่สามารถเผยแพร่ได้: เนื้อหามีคำที่ไม่เหมาะสม');
        btn.innerHTML = originalBtnContent;
        btn.disabled = false;
        return;
    }
    
    try {
        if (postId) {
            await db.collection(FEED_RENDERER_CONFIG.COLLECTIONS.POSTS).doc(postId).update(postData);
            showToast('✅ อัปเดตโพสต์เรียบร้อยแล้ว!', 'success');
        } else {
            const user = typeof WizmobizAuth !== 'undefined' ? WizmobizAuth.getUser() : null;
            postData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            postData.likes = 0;
            postData.authorId = FeedRenderer.currentUserId;
            
            let bestName = user?.displayName || user?.name;
            if (!bestName || bestName === 'User' || bestName === 'Member') {
                try {
                    const userDoc = await db.collection(FEED_RENDERER_CONFIG.COLLECTIONS.USERS).doc(FeedRenderer.currentUserId).get();
                    if (userDoc.exists) bestName = userDoc.data().displayName || userDoc.data().name;
                } catch (e) {}
            }
            
            postData.authorName = bestName || 'Member';
            postData.authorAvatar = user?.pictureUrl || 'assets/images/logo.png';
            
            await db.collection(FEED_RENDERER_CONFIG.COLLECTIONS.POSTS).add(postData);
            showToast('✅ เผยแพร่โพสต์เรียบร้อยแล้ว!', 'success');
        }
        
        if (document.activeElement) document.activeElement.blur();
        if (postModal) postModal.hide();
        
        resetUploadAreaMulti();
        
    } catch (error) {
        console.error('[FeedRenderer] Error saving post:', error);
        alert('❌ เกิดข้อผิดพลาด: ' + error.message);
    } finally {
        btn.innerHTML = originalBtnContent;
        btn.disabled = false;
    }
});

/**
 * Toggle pin
 */
async function togglePin(postId, pinned) {
    try {
        await db.collection(FEED_RENDERER_CONFIG.COLLECTIONS.POSTS).doc(postId).update({ pinned });
    } catch (error) {
        console.error('[FeedRenderer] Error toggling pin:', error);
    }
}

/**
 * Confirm delete
 */
function confirmDelete(postId) {
    postToDelete = postId;
    if (deleteModal) deleteModal.show();
}

/**
 * Delete post
 */
document.getElementById('confirmDeleteBtn')?.addEventListener('click', async function() {
    if (postToDelete) {
        try {
            await db.collection(FEED_RENDERER_CONFIG.COLLECTIONS.POSTS).doc(postToDelete).delete();
            if (deleteModal) deleteModal.hide();
            postToDelete = null;
        } catch (error) {
            console.error('[FeedRenderer] Error deleting post:', error);
            alert('❌ เกิดข้อผิดพลาดในการลบ');
        }
    }
});

// ================================================
// GALLERY NAVIGATION FUNCTIONS
// ================================================

const galleryIndexes = {};

/**
 * Change gallery media
 */
function changeGalleryMedia(postId, index, url, type) {
    galleryIndexes[postId] = index;
    
    const container = document.getElementById(`gallery-container-${postId}`);
    const indexEl = document.getElementById(`gallery-index-${postId}`);
    
    if (type === 'image') {
        container.querySelector('img, iframe, video').outerHTML = `<img src="${url}" alt="Gallery Image" id="gallery-main-${postId}">`;
    } else if (type === 'video') {
        container.querySelector('img, iframe, video').outerHTML = `<video src="${url}" controls playsinline webkit-playsinline id="gallery-main-${postId}" class="w-100"></video>`;
    } else if (type === 'youtube') {
        const origin = encodeURIComponent(window.location.origin);
        container.querySelector('img, iframe, video').outerHTML = `<iframe src="https://www.youtube.com/embed/${url}?enablejsapi=1&origin=${origin}" allowfullscreen id="gallery-main-${postId}"></iframe>`;
    }
    
    if (indexEl) indexEl.textContent = index + 1;
    
    const gallery = container.closest('.news-media-gallery');
    gallery.querySelectorAll('.gallery-thumb').forEach((thumb, i) => {
        thumb.classList.toggle('active', i === index);
    });
}

/**
 * Navigate gallery
 */
function navigateGallery(postId, direction) {
    const gallery = document.querySelector(`.news-media-gallery[data-post-id="${postId}"]`);
    if (!gallery) return;
    
    const allMedia = JSON.parse(gallery.dataset.media);
    const currentIndex = galleryIndexes[postId] || 0;
    let newIndex = currentIndex + direction;
    
    if (newIndex < 0) newIndex = allMedia.length - 1;
    if (newIndex >= allMedia.length) newIndex = 0;
    
    const media = allMedia[newIndex];
    changeGalleryMedia(postId, newIndex, media.url, media.type);
}

// ================================================
// MULTI-UPLOAD FUNCTIONS
// ================================================

let uploadedImages = [];
let uploadedYoutubeUrl = '';

/**
 * Generate video thumbnail
 */
async function generateVideoThumbnail(file) {
    return new Promise((resolve) => {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        video.autoplay = false;
        video.muted = true;
        video.src = URL.createObjectURL(file);
        
        video.onloadeddata = () => {
            video.currentTime = 1;
        };
        
        video.onseeked = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            URL.revokeObjectURL(video.src);
            resolve(dataUrl);
        };
        
        video.onerror = () => {
            URL.revokeObjectURL(video.src);
            resolve(null);
        };
    });
}

/**
 * DataURL to Blob
 */
function dataURLtoBlob(dataurl) {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[arr.length - 1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new Blob([u8arr], { type: mime });
}

/**
 * Compress image
 */
async function compressImage(file, maxWidth = 1200, quality = 0.8) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                if (width > maxWidth) {
                    height = (maxWidth / width) * height;
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob((blob) => {
                    resolve(new File([blob], file.name, {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                    }));
                }, 'image/jpeg', quality);
            };
        };
    });
}

/**
 * Upload to R2
 */
async function uploadToR2(file, folder = 'posts', onProgress = null) {
    const contentType = file.type || 'video/mp4';
    const safeFilename = file.name.replace(/\s+/g, '_');
    
    let authHeaders = {};
    let lineUserId = null;
    
    try {
        const fbUser = firebase.auth().currentUser;
        if (fbUser) {
            const token = await fbUser.getIdToken();
            authHeaders['Authorization'] = `Bearer ${token}`;
        }
    } catch (_) {}
    
    if (!authHeaders['Authorization']) {
        const session = typeof WizmobizAuth !== 'undefined' ? WizmobizAuth.getSession() : null;
        lineUserId = session?.lineUserId || session?.uid || null;
    }
    
    const cfRes = await fetch(FEED_RENDERER_CONFIG.R2_PRESIGN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ folder, filename: safeFilename, contentType, lineUserId })
    });
    
    if (!cfRes.ok) {
        const err = await cfRes.json().catch(() => ({ error: cfRes.statusText }));
        throw new Error(`R2 presign failed: ${err.error || cfRes.status}`);
    }
    
    const { uploadUrl, publicUrl } = await cfRes.json();
    
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', contentType);
        
        if (onProgress && xhr.upload) {
            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) onProgress((e.loaded / e.total) * 100);
            };
        }
        
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(publicUrl);
            } else {
                reject(new Error(`R2 Upload failed: ${xhr.status} ${xhr.responseText}`));
            }
        };
        
        xhr.onerror = () => reject(new Error('R2 Upload network error'));
        xhr.send(file);
    });
}

/**
 * Handle multi-media upload
 */
async function handleMultiMediaUpload(input) {
    const files = Array.from(input.files);
    if (files.length === 0) return;
    
    if (uploadedImages.length + files.length > FEED_RENDERER_CONFIG.MAX_UPLOAD_FILES) {
        alert(`⚠️ สามารถอัปโหลดได้สูงสุด ${FEED_RENDERER_CONFIG.MAX_UPLOAD_FILES} ไฟล์`);
        return;
    }
    
    const progressEl = document.getElementById('uploadProgress');
    const progressBar = document.getElementById('progressBar');
    progressEl.style.display = 'block';
    
    let uploaded = 0;
    
    for (const file of files) {
        const isVideo = file.type.startsWith('video/');
        const isImage = file.type.startsWith('image/');
        
        if (!isVideo && !isImage) {
            showToast(`⚠️ ไฟล์ ${file.name} ไม่รองรับ`, 'error');
            continue;
        }
        
        const maxSize = isVideo ? FEED_RENDERER_CONFIG.MAX_VIDEO_SIZE : FEED_RENDERER_CONFIG.MAX_IMAGE_SIZE;
        
        if (file.size > maxSize) {
            showToast(`⚠️ ไฟล์ ${file.name} ใหญ่เกินไป (จำกัด ${isVideo ? '25MB' : '5MB'})`, 'error');
            continue;
        }
        
        try {
            const progressLabel = document.querySelector('#uploadProgress span');
            if (progressLabel) progressLabel.innerText = `⚙️ กำลังเตรียมไฟล์...`;
            
            let fileToUpload = file;
            
            if (isImage) {
                fileToUpload = await compressImage(file);
                console.log('Image compressed:', file.size, '->', fileToUpload.size);
            }
            
            let url = null;
            url = await uploadToR2(fileToUpload, 'community_posts', (pct) => {
                progressBar.style.width = pct + '%';
                if (progressLabel) progressLabel.innerText = `📦 กำลังอัปโหลด... ${Math.round(pct)}%`;
            });
            
            if (!url) throw new Error('R2 upload returned no URL');
            
            let thumbUrl = null;
            
            if (isVideo) {
                try {
                    const thumbData = await generateVideoThumbnail(file);
                    if (thumbData) {
                        const thumbBlob = dataURLtoBlob(thumbData);
                        const thumbFile = new File([thumbBlob], 'thumb.jpg', { type: 'image/jpeg' });
                        thumbUrl = await uploadToR2(thumbFile, 'community_posts/thumbs', null);
                    }
                } catch (e) {
                    console.warn('Thumb gen failed', e);
                }
            }
            
            if (isVideo) {
                uploadedImages.push({ url, type: 'video', thumbnailUrl: thumbUrl, name: file.name });
            } else {
                uploadedImages.push({ url, type: 'image', name: file.name });
            }
            
            uploaded++;
        } catch (error) {
            console.error('Upload error:', error);
            showToast(`❌ อัปโหลด ${file.name} ล้มเหลว`, 'error');
        }
    }
    
    progressEl.style.display = 'none';
    progressBar.style.width = '0%';
    
    if (uploaded > 0) {
        showToast(`✅ อัปโหลด ${uploaded} ไฟล์สำเร็จ`, 'success');
        renderUploadedMedia();
    }
    
    input.value = '';
}

/**
 * Render uploaded media
 */
function renderUploadedMedia() {
    const grid = document.getElementById('uploadedMediaGrid');
    
    let html = uploadedImages.map((item, index) => {
        const url = typeof item === 'object' ? item.url : item;
        const thumbUrl = typeof item === 'object' ? item.thumbnailUrl : null;
        const isVideo = typeof item === 'object' && item.type === 'video';
        
        return `
            <div class="uploaded-media-item ${index === 0 ? 'main-image' : ''}" data-index="${index}">
                ${isVideo ? `
                <div class="video-preview-placeholder">
                    ${thumbUrl ? `<img src="${thumbUrl}" style="opacity: 0.5;">` : '<i class="fas fa-video"></i>'}
                    <span class="small d-block" style="position: absolute; z-index: 2;">วิดีโอ</span>
                </div>
                ` : `<img src="${url}" alt="รูปที่ ${index + 1}">`}
                <button class="remove-btn" onclick="removeUploadedImage(${index})" type="button">
                    <i class="fas fa-times"></i>
                </button>
                ${isVideo ? `<div class="media-type-badge"><i class="fas fa-play"></i></div>` : ''}
            </div>
        `;
    }).join('');
    
    if (uploadedImages.length < FEED_RENDERER_CONFIG.MAX_UPLOAD_FILES) {
        html += `
            <div class="add-media-btn-pro" onclick="document.getElementById('postMediaFiles').click()">
                <i class="fas fa-plus"></i>
                <span>ADD MEDIA</span>
            </div>
        `;
    }
    
    grid.innerHTML = html;
    
    const postImagesInput = document.getElementById('postImages');
    if (postImagesInput) {
        postImagesInput.value = JSON.stringify(uploadedImages);
    }
}

/**
 * Remove uploaded image
 */
function removeUploadedImage(index) {
    uploadedImages.splice(index, 1);
    renderUploadedMedia();
}

/**
 * Remove YouTube video
 */
function removeYoutubeVideo() {
    document.getElementById('postYoutubeUrl').value = '';
    const previewArea = document.getElementById('videoPreviewArea');
    if (previewArea) {
        previewArea.style.display = 'none';
        previewArea.innerHTML = '';
    }
    uploadedYoutubeUrl = '';
}

/**
 * Select post category
 */
function selectPostCategory(category, element) {
    const input = document.getElementById('postCategory');
    if (input) input.value = category;
    
    document.querySelectorAll('.node-card').forEach(card => card.classList.remove('active'));
    if (element) element.classList.add('active');
}

/**
 * Reset upload area (multi)
 */
function resetUploadAreaMulti() {
    uploadedImages = [];
    uploadedYoutubeUrl = '';
    
    if (document.getElementById('postImages')) document.getElementById('postImages').value = '';
    if (document.getElementById('postYoutubeUrl')) document.getElementById('postYoutubeUrl').value = '';
    if (document.getElementById('postLocation')) document.getElementById('postLocation').value = '';
    if (document.getElementById('postCoordinates')) document.getElementById('postCoordinates').value = '';
    
    const previewArea = document.getElementById('videoPreviewArea');
    if (previewArea) {
        previewArea.style.display = 'none';
        previewArea.innerHTML = '';
    }
    
    renderUploadedMedia();
}

/**
 * Reset upload area
 */
function resetUploadArea() {
    if (typeof resetUploadAreaMulti === 'function') {
        resetUploadAreaMulti();
    }
}

/**
 * Get current location
 */
function getCurrentLocation(event) {
    const btn = event ? event.currentTarget : document.activeElement;
    if (!btn) return;
    const originalIcon = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    btn.disabled = true;
    
    if (!navigator.geolocation) {
        showToast("⚠️ เบราว์เซอร์ไม่รองรับการระบุตำแหน่ง", "warning");
        btn.innerHTML = originalIcon;
        btn.disabled = false;
        return;
    }
    
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            document.getElementById('postCoordinates').value = `${lat},${lon}`;
            
            try {
                const locInput = document.getElementById('postLocation');
                if (!locInput.value) {
                    locInput.value = "📍 ปักหมุดพิกัดสำเร็จ";
                }
                showToast("📍 บันทึกพิกัดเรียบร้อย", "success");
            } catch (e) {
                console.error(e);
            }
            
            btn.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => {
                btn.innerHTML = '<i class="fas fa-location-arrow"></i>';
                btn.disabled = false;
            }, 2000);
        },
        (error) => {
            console.error(error);
            showToast("❌ ไม่สามารถเข้าถึงพิกัดได้ (สิทธิ์ถูกปฏิเสธ)", "error");
            btn.innerHTML = originalIcon;
            btn.disabled = false;
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
}

// ================================================
// VIDEO LINK PREVIEW
// ================================================

/**
 * Preview video link
 */
function previewVideoLink(url) {
    const previewArea = document.getElementById('videoPreviewArea');
    const embed = parseVideoEmbed(url);
    
    if (embed) {
        previewArea.innerHTML = embed;
        previewArea.style.display = 'block';
        
        if (url.includes('youtube') || url.includes('youtu.be')) {
            previewArea.style.aspectRatio = '16/9';
        } else {
            previewArea.style.aspectRatio = '9/16';
        }
    } else {
        previewArea.style.display = 'none';
    }
}

// ================================================
// VERIFY LINKED PRODUCT
// ================================================

/**
 * Verify linked product
 */
async function verifyLinkedProduct(idOverride) {
    const id = idOverride || document.getElementById('linkedProductId').value.trim();
    const preview = document.getElementById('linkedProductPreview');
    
    if (!id) return;
    
    try {
        const doc = await db.collection(FEED_RENDERER_CONFIG.COLLECTIONS.PRODUCTS).doc(id).get();
        
        if (doc.exists) {
            const product = doc.data();
            window.lastVerifiedProduct = product;
            
            preview.innerHTML = `
                <div class="alert alert-success d-flex align-items-center gap-3 py-2 mb-0">
                    <img src="${product.imageUrl}" style="width: 40px; height: 40px; border-radius: 5px; object-fit: cover;">
                    <div>
                        <div class="small fw-bold">${product.name}</div>
                        <div class="small">ราคา ฿${(product.price || 0).toLocaleString()}</div>
                    </div>
                </div>
            `;
            
            preview.style.display = 'block';
        } else {
            preview.innerHTML = `<div class="text-danger small mt-1">❌ ไม่พบสินค้า ID นี้</div>`;
            preview.style.display = 'block';
            window.lastVerifiedProduct = null;
        }
    } catch (e) {
        console.log('Error verifying product');
    }
}

// ================================================
// AI ASSISTANT FUNCTIONS
// ================================================

let quill;

/**
 * Toggle AI options
 */
function toggleAiOptions() {
    const options = document.getElementById('aiOptions');
    options.style.display = options.style.display === 'none' ? 'grid' : 'none';
}

/**
 * AI assist
 */
async function aiAssist(mode) {
    if (!FEED_RENDERER_CONFIG.ENABLE_AI_ASSISTANT) {
        alert('AI Assistant is disabled');
        return;
    }
    
    const btn = document.getElementById('aiAssistantBtn');
    const titleEl = document.getElementById('postTitle');
    const categoryEl = document.getElementById('postCategory');
    
    const content = quill ? quill.root.innerHTML : document.getElementById('postContent').value;
    const title = titleEl.value.trim();
    const category = categoryEl.value;
    
    if (!content && !title) {
        alert('⚠️ กรุณาใส่หัวข้อหรือเนื้อหาก่อนใช้ AI');
        return;
    }
    
    const originalBtnText = btn.innerHTML;
    btn.innerHTML = '<div class="ai-loading"><div class="spinner"></div><span>🤖 AI กำลังคิด...</span></div>';
    btn.disabled = true;
    
    try {
        const result = await callAiContentAssist(mode, title, content, category);
        
        if (result.success) {
            if (result.title) {
                titleEl.value = result.title;
            }
            
            if (result.content) {
                if (quill) {
                    const formattedResult = result.content.replace(/\n/g, '<br>');
                    quill.root.innerHTML = formattedResult;
                } else {
                    const postContentEl = document.getElementById('postContent');
                    if (postContentEl) postContentEl.value = result.content;
                }
            }
            
            const aiOptions = document.getElementById('aiOptions');
            if (aiOptions) aiOptions.style.display = 'none';
            
            showToast('✨ AI ช่วยเขียนเสร็จแล้ว!', 'success');
        } else {
            throw new Error(result.error || 'Unknown error');
        }
    } catch (error) {
        console.error('AI Error:', error);
        
        if (error.message.includes('429') || error.message.includes('quota') || error.message.includes('limit')) {
            alert('💎 ขออภัยครับ โควตา AI สำหรับรุ่นทดลองใช้ฟรีเต็มแล้ว\n\nโปรดรอสักครู่แล้วลองใหม่ หรืออัปเกรดเป็น Premium เพื่อใช้งานได้ไม่จำกัดครับ');
        } else {
            alert('❌ เกิดข้อผิดพลาดกับ AI: ' + error.message);
        }
    } finally {
        btn.innerHTML = originalBtnText;
        btn.disabled = false;
    }
}

/**
 * Call AI Content Assist
 */
async function callAiContentAssist(mode, title, content, category) {
    const cleanContent = content.replace(/<[^>]*>/g, '\n').replace(/\n\n+/g, '\n').trim();
    
    const response = await fetch(FEED_RENDERER_CONFIG.AI_ASSIST_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, title, content: cleanContent, category })
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'การเชื่อมต่อ AI ล้มเหลว');
    }
    
    return await response.json();
}

// ================================================
// INITIALIZE QUILL
// ================================================

document.addEventListener('DOMContentLoaded', function() {
    const editorContainer = document.getElementById('editor-container');
    
    if (editorContainer && typeof Quill !== 'undefined') {
        quill = new Quill('#editor-container', {
            theme: 'snow',
            placeholder: 'เขียนเนื้อหาข่าวสารที่นี่... (รองรับการคัดลอกจากที่อื่น)',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    [{ 'size': ['small', false, 'large', 'huge'] }],
                    [{ 'font': [] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'color': [] }, { 'background': [] }],
                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                    [{ 'indent': '-1' }, { 'indent': '+1' }],
                    [{ 'align': [] }],
                    ['link', 'image', 'video'],
                    ['blockquote', 'code-block'],
                    ['clean']
                ],
                clipboard: { matchVisual: false }
            }
        });
        
        quill.clipboard.addMatcher(Node.ELEMENT_NODE, function(node, delta) {
            if (node.style && node.style.fontSize) {
                const fontSize = node.style.fontSize;
                const sizeNum = parseInt(fontSize);
                
                delta.ops.forEach(op => {
                    if (op.insert && typeof op.insert === 'string') {
                        op.attributes = op.attributes || {};
                        
                        if (sizeNum <= 12) {
                            op.attributes.size = 'small';
                        } else if (sizeNum >= 20 && sizeNum <= 24) {
                            op.attributes.size = 'large';
                        } else if (sizeNum >= 25) {
                            op.attributes.size = 'huge';
                        }
                    }
                });
            }
            
            return delta;
        });
    }
    
    // Initialize
    checkAdminStatus();
    loadAds();
    
    // Do NOT auto-load standard feed on PC unless forced, because pcEngine handles it.
    const PC_BREAKPOINT = 992;
    const urlParams = new URLSearchParams(window.location.search);
    const targetPostId = urlParams.get('post') || urlParams.get('postId') || urlParams.get('id');
    const forceExplore = urlParams.get('category') === 'all' || urlParams.get('cat') === 'all';
    
    const mobileFeedEngineReady = window.innerWidth < PC_BREAKPOINT && typeof window.initTukTukFeed === 'function';
    if (!mobileFeedEngineReady && (window.innerWidth < PC_BREAKPOINT || forceExplore || targetPostId)) {
        loadPosts();
    }
});

// ================================================
// GALLERY FUNCTIONS (Continued)
// ================================================

// Already defined above: galleryIndexes, changeGalleryMedia, navigateGallery

// ================================================
// MULTI-UPLOAD FUNCTIONS (Continued)
// ================================================

// Already defined above: uploadedImages, uploadedYoutubeUrl, generateVideoThumbnail, 
// dataURLtoBlob, compressImage, uploadToR2, handleMultiMediaUpload, renderUploadedMedia,
// removeUploadedImage, removeYoutubeVideo, selectPostCategory, resetUploadAreaMulti,
// resetUploadArea, getCurrentLocation

// ================================================
// OVERRIDE OPEN POST MODAL
// ================================================

const originalOpenPostModal = window.openPostModal;

window.openPostModal = function() {
    resetUploadAreaMulti();
    
    const adminFab = document.getElementById('adminFab');
    if (adminFab) adminFab.classList.remove('active');
    
    if (originalOpenPostModal) {
        originalOpenPostModal();
        document.getElementById('modalTitle').innerHTML = 'สตูดิโอสร้างสรรค์ระดับโปร';
    } else {
        document.getElementById('postId').value = '';
        document.getElementById('postForm').reset();
        if (quill) quill.root.innerHTML = '';
        document.getElementById('modalTitle').innerHTML = 'สตูดิโอสร้างสรรค์ระดับโปร';
        if (postModal) postModal.show();
    }
};

// ================================================
// SMART VIDEO PARSER (Already defined above)
// ================================================

// Already defined: previewVideoLink, parseVideoEmbed

// ================================================
// SOCIAL SDKs
// ================================================

let sdksInitialized = false;

function initSocialSDKs() {
    if (sdksInitialized) return;
    
    const _origOnError = window.onerror;
    window.onerror = function(msg, src, line, col, err) {
        if (src && src.includes('sdk.js') && msg && msg.includes('unresolved')) {
            console.warn('[SDK] Suppressed FB/LIFF ModuleError:', msg);
            return true;
        }
        return _origOnError ? _origOnError(msg, src, line, col, err) : false;
    };
    
    try {
        if (!document.getElementById('tiktok-sdk') && !window.tiktokEmbed) {
            const s = document.createElement('script');
            s.id = 'tiktok-sdk';
            s.src = 'https://www.tiktok.com/embed.js';
            s.async = true;
            s.onerror = () => console.warn('TikTok SDK failed to load, using iframe fallback');
            document.body.appendChild(s);
        }
        
        if (!FeedRenderer.isLineApp && !document.getElementById('fb-sdk') && !window.FB) {
            const s = document.createElement('script');
            s.id = 'fb-sdk';
            s.src = 'https://connect.facebook.net/th_TH/sdk.js';
            s.async = true;
            s.defer = true;
            s.crossOrigin = 'anonymous';
            s.onerror = () => {
                console.warn('Facebook SDK blocked/failed — iframe embeds will be used instead');
                document.getElementById('fb-sdk')?.remove();
            };
            s.onload = () => {
                try {
                    if (window.FB && window.FB.init) {
                        window.FB.init({ xfbml: true, version: 'v19.0' });
                        console.log('Facebook SDK initialized');
                    }
                } catch (e) {
                    console.warn('FB.init failed:', e.message);
                }
            };
            document.body.appendChild(s);
        }
        
        sdksInitialized = true;
        console.log('Social SDKs initialization started');
    } catch (error) {
        console.error('Error initializing social SDKs:', error);
    }
}

// ================================================
// AUTO-PLAY OBSERVER
// ================================================

function initAutoPlayObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target.querySelector('video');
            const iframe = entry.target.querySelector('iframe');
            
            if (!entry.isIntersecting) {
                if (video && !video.paused) {
                    try { video.pause(); } catch (e) {}
                }
                if (iframe && iframe.contentWindow) {
                    const isYoutube = iframe.src.includes('youtube.com') || iframe.src.includes('youtube-nocookie.com');
                    if (isYoutube && iframe.src.includes('enablejsapi=1') && iframe.classList.contains('api-controlled')) {
                        try {
                            if (document.body.contains(iframe)) {
                                iframe.contentWindow.postMessage(JSON.stringify({
                                    event: 'command',
                                    func: 'pauseVideo',
                                    args: ''
                                }), '*');
                            }
                        } catch (e) {}
                    }
                }
            }
        });
    }, { threshold: 0.4 });
    
    FeedRenderer.observers.push(observer);
    
    const observeTargets = () => {
        document.querySelectorAll('.news-video-container, .community-post-media').forEach(container => {
            observer.observe(container);
        });
    };
    
    observeTargets();
    
    const interval = setInterval(() => {
        if (document.visibilityState === 'visible') observeTargets();
    }, 3000);
    
    FeedRenderer.intervals.push(interval);
    
    window.addEventListener('unload', () => clearInterval(interval));
}

// ================================================
// PARTICLES
// ================================================

function initParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    
    for (let i = 0; i < 25; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.left = Math.random() * 100 + '%';
        p.style.top = Math.random() * 100 + '%';
        p.style.animationDelay = Math.random() * 10 + 's';
        p.style.opacity = Math.random() * 0.5;
        container.appendChild(p);
    }
}

// ================================================
// LOAD POSTS (Data Fetching)
// ================================================

let postsUnsubscribe = null;
let lastVisibleDoc = null;
let isLoadingMore = false;
let allPostsData = [];

const PAGE_SIZE = 20;

async function loadPosts(append = false) {
    if (isLoadingMore) return;
    isLoadingMore = true;
    
    const container = document.getElementById('postsContainer');
    const tuktukContainer = document.getElementById('tuktukFeed');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const emptyState = document.getElementById('emptyState');
    
    if (!append) {
        if (container) container.innerHTML = '';
        // Don't clear #tuktukFeed — tuktuk_feed_logic.js (new system) owns it on mobile
        if (tuktukContainer && typeof window.renderTukTukSlides !== 'function') {
            tuktukContainer.innerHTML = '';
        }
        lastVisibleDoc = null;
        allPostsData = [];
        FeedRenderer.allPostsData = [];
    }
    
    if (loadingSpinner) loadingSpinner.style.display = 'block';
    
    try {
        // Load news in parallel
        if (!append) await loadNewsFeed();
        
        let query = db.collection(FEED_RENDERER_CONFIG.COLLECTIONS.POSTS)
            .where('published', '==', true);
        
        // Category filtering
        if (FeedRenderer.currentCategory === 'trending') {
            query = query.orderBy('views', 'desc').orderBy('createdAt', 'desc');
        } else if (FeedRenderer.currentCategory === 'liked') {
            if (!FeedRenderer.currentUserId) {
                if (loadingSpinner) loadingSpinner.style.display = 'none';
                if (container) container.innerHTML = renderEmptyState('เข้าสู่ระบบเพื่อดูโพสต์ที่คุณชอบ');
                isLoadingMore = false;
                return;
            }
            
            const targetIds = FeedRenderer.userLikedIds || [];
            if (targetIds.length === 0) {
                if (loadingSpinner) loadingSpinner.style.display = 'none';
                if (container) container.innerHTML = renderEmptyState('คุณยังไม่มีโพสต์ที่ชอบ');
                isLoadingMore = false;
                return;
            }
            
            query = db.collection(FEED_RENDERER_CONFIG.COLLECTIONS.POSTS)
                .where(firebase.firestore.FieldPath.documentId(), 'in', targetIds.slice(0, 10));
                
        } else if (FeedRenderer.currentCategory === 'following') {
            if (!FeedRenderer.currentUserId) {
                if (loadingSpinner) loadingSpinner.style.display = 'none';
                if (container) container.innerHTML = renderEmptyState('เข้าสู่ระบบเพื่อดูสิ่งที่คุณติดตาม');
                isLoadingMore = false;
                return;
            }
            
            const targetIds = FeedRenderer.userFollowingIds || [];
            if (targetIds.length === 0) {
                if (loadingSpinner) loadingSpinner.style.display = 'none';
                if (container) container.innerHTML = renderEmptyState('คุณยังไม่ได้ติดตามใคร');
                isLoadingMore = false;
                return;
            }
            
            query = query.where('authorId', 'in', targetIds.slice(0, 30)).orderBy('createdAt', 'desc');
            
        } else if (FeedRenderer.currentCategory !== 'all') {
            query = query.where('category', '==', FeedRenderer.currentCategory).orderBy('createdAt', 'desc');
        } else {
            query = query.orderBy('createdAt', 'desc');
        }
        
        if (lastVisibleDoc && !append) {
            query = query.startAfter(lastVisibleDoc);
        }
        
        query = query.limit(PAGE_SIZE);
        
        const snapshot = await query.get();
        
        if (loadingSpinner) loadingSpinner.style.display = 'none';
        
        if (snapshot.empty && !append) {
            if (emptyState) emptyState.style.display = 'block';
            updateStats([]);
            isLoadingMore = false;
            return;
        }
        
        if (emptyState) emptyState.style.display = 'none';
        lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1];
        
        const batchPosts = [];
        
        snapshot.forEach(doc => {
            const post = { id: doc.id, ...doc.data() };
            
            if (post.privacy === 'private' && post.authorId !== FeedRenderer.currentUserId) {
                return;
            }
            
            batchPosts.push(post);
            
            if (!allPostsData.find(p => p.id === post.id)) {
                allPostsData.push(post);
                FeedRenderer.allPostsData.push(post);
            }
        });
        
        if (FeedRenderer.currentCategory === 'video' || FeedRenderer.currentCategory === 'all') {
            renderTukTukFeed(batchPosts, append);
        }
        
        renderStandardFeed(batchPosts, append);
        updateStats(allPostsData);
        setupInfiniteScroll();
        
    } catch (error) {
        console.error('[FeedRenderer] Error loading posts:', error);
        if (loadingSpinner) loadingSpinner.innerHTML = '<p class="text-white">เชื่อมต่อล้มเหลว กรุณาลองใหม่</p>';
    } finally {
        isLoadingMore = false;
    }
}

function renderStandardFeed(posts, append) {
    const container = document.getElementById('postsContainer');
    if (!container) return;
    
    const adCards = allAds.filter(ad => ad.type === 'card' && ad.isActive);
    let itemIndex = Math.floor(Math.random() * 20);
    
    posts.forEach((post, index) => {
        if (index > 0 && index % 4 === 0) {
            const adEl = document.createElement('div');
            
            if (FeedRenderer.latestNewsFeed.length > 0 && (index / 4) % 3 === 1) {
                const news = FeedRenderer.latestNewsFeed[Math.floor(index / 4) % FeedRenderer.latestNewsFeed.length];
                adEl.innerHTML = renderNewsFeedCard(news);
                container.appendChild(adEl);
            } else if (adCards.length > 0 && (index / 4) % 3 === 2) {
                const ad = adCards[itemIndex % adCards.length];
                adEl.innerHTML = renderInlineAdCard(ad);
                container.appendChild(adEl);
            } else if (FeedRenderer.marketplaceProducts.length > 0) {
                const prod = FeedRenderer.marketplaceProducts[itemIndex % FeedRenderer.marketplaceProducts.length];
                adEl.innerHTML = renderInterleavedProduct(prod);
                container.appendChild(adEl);
            }
            itemIndex++;
        }
        
        const card = document.createElement('div');
        card.innerHTML = renderPostCard(post);
        container.appendChild(card.firstElementChild);
    });
    
    if (typeof AOS !== 'undefined') AOS.refresh();
}

function renderInlineAdCard(ad) {
    return `
        <div class="inline-ad-card" onclick="handleAdClick('${ad.id}', '${ad.targetUrl || ''}')">
            <span class="inline-ad-badge">${ad.sponsor ? 'Sponsored' : 'Promotion'}</span>
            <img class="inline-ad-image" src="${ad.imageUrl || 'https://placehold.co/100x100?text=Ad'}" 
                 onerror="this.onerror=null; this.src='https://placehold.co/100x100?text=No+Image'">
            <div class="inline-ad-content">
                <div class="inline-ad-title">${ad.title}</div>
                <div class="inline-ad-desc">${ad.description || ''}</div>
                <div class="inline-ad-cta">ดูรายละเอียดเพิ่มเติม <i class="fas fa-arrow-right"></i></div>
            </div>
        </div>
    `;
}

function updateStats(posts) {
    const totalPosts = posts.length;
    const totalLikes = posts.reduce((sum, p) => sum + (p.likes || 0), 0);
    const totalProducts = posts.filter(p => p.linkedProductId).length;
    
    animateNumber('totalPosts', totalPosts);
    animateNumber('totalLikes', totalLikes);
    animateNumber('todayPosts', totalProducts);
}

function animateNumber(elementId, target) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const duration = 1000;
    const steps = 30;
    const stepValue = target / steps;
    let current = 0;
    
    const interval = setInterval(() => {
        current += stepValue;
        if (current >= target) {
            element.textContent = target;
            clearInterval(interval);
        } else {
            element.textContent = Math.floor(current);
        }
    }, duration / steps);
    
    FeedRenderer.intervals.push(interval);
}

let globalScrollListener = null;

function setupInfiniteScroll() {
    const feed = document.getElementById('tuktukFeed');
    
    if (globalScrollListener) {
        window.removeEventListener('scroll', globalScrollListener);
        window.removeEventListener('touchmove', globalScrollListener);
        if (feed) {
            feed.removeEventListener('scroll', globalScrollListener);
            feed.removeEventListener('touchmove', globalScrollListener);
        }
    }
    
    globalScrollListener = () => {
        if (isLoadingMore) return;
        
        let isBottom = false;
        if (FeedRenderer.currentCategory === 'video' && feed) {
            isBottom = feed.scrollHeight - feed.scrollTop <= feed.clientHeight + 100;
        } else {
            isBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 500;
        }
        
        if (isBottom && lastVisibleDoc) {
            loadPosts(true);
        }
    };
    
    const options = { passive: true };
    window.addEventListener('scroll', globalScrollListener, options);
    window.addEventListener('touchmove', globalScrollListener, options);
    if (feed) {
        feed.addEventListener('scroll', globalScrollListener, options);
        feed.addEventListener('touchmove', globalScrollListener, options);
    }
}

// ================================================
// ADS LOADING
// ================================================

let allAds = [];

async function loadAds() {
    try {
        const now = new Date().toISOString().split('T')[0];
        const snapshot = await db.collection('marketplace_ads')
            .where('isActive', '==', true)
            .orderBy('order', 'asc')
            .get();
        
        allAds = [];
        
        snapshot.forEach(doc => {
            const ad = { id: doc.id, ...doc.data() };
            if (ad.startDate && ad.startDate > now) return;
            if (ad.endDate && ad.endDate < now) return;
            allAds.push(ad);
        });
        
        const banners = allAds.filter(ad => ad.type === 'banner');
        renderAdBanners(banners);
        
    } catch (error) {
        console.error('Error loading ads:', error);
    }
}

function renderAdBanners(banners) {
    const section = document.getElementById('promoBannerSection');
    const slider = document.getElementById('promoSlider');
    const dots = document.getElementById('promoDots');
    
    if (!section || banners.length === 0) {
        if (section) section.classList.remove('has-banners');
        return;
    }
    
    section.classList.add('has-banners');
    slider.innerHTML = banners.map((banner, i) => `
        <div class="promo-slide" onclick="handleAdClick('${banner.id}', '${banner.targetUrl || ''}')" data-index="${i}">
            <img src="${banner.imageUrl || 'https://placehold.co/800x200?text=Promo'}" 
                 alt="${banner.title}"
                 onerror="this.onerror=null; this.src='https://placehold.co/800x200?text=No+Image'">
            ${banner.sponsor ? `<span class="promo-sponsor">Sponsored by ${banner.sponsor}</span>` : ''}
            <div class="promo-slide-overlay">
                <div class="promo-slide-title">${banner.title}</div>
                ${banner.description ? `<div class="promo-slide-desc">${banner.description}</div>` : ''}
            </div>
        </div>
    `).join('');
    
    dots.innerHTML = banners.map((_, i) => `
        <button class="promo-dot ${i === 0 ? 'active' : ''}" onclick="goToAdSlide(${i})"></button>
    `).join('');
    
    currentPromoSlide = 0;
    startAdSlider(banners.length);
}

let currentPromoSlide = 0;
let promoSlideInterval = null;

function startAdSlider(total) {
    if (promoSlideInterval) clearInterval(promoSlideInterval);
    if (total <= 1) return;
    promoSlideInterval = setInterval(() => nextAdSlide(), 5000);
    FeedRenderer.intervals.push(promoSlideInterval);
}

function goToAdSlide(index) {
    const slider = document.getElementById('promoSlider');
    const dots = document.querySelectorAll('.promo-dot');
    const slides = slider.querySelectorAll('.promo-slide');
    
    if (index < 0) index = slides.length - 1;
    if (index >= slides.length) index = 0;
    
    currentPromoSlide = index;
    slider.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
}

function nextAdSlide() {
    const slides = document.querySelectorAll('.promo-slide');
    if (slides.length > 0) goToAdSlide((currentPromoSlide + 1) % slides.length);
}

function prevAdSlide() {
    const slides = document.querySelectorAll('.promo-slide');
    if (slides.length > 0) goToAdSlide((currentPromoSlide - 1 + slides.length) % slides.length);
}

async function handleAdClick(adId, targetUrl) {
    try {
        await db.collection('marketplace_ads').doc(adId).update({
            clicks: firebase.firestore.FieldValue.increment(1)
        });
        if (targetUrl) window.open(targetUrl, '_blank');
    } catch (e) {
        if (targetUrl) window.open(targetUrl, '_blank');
    }
}

// ================================================
// LOAD INTERLEAVED DATA
// ================================================

async function loadInterleavedData() {
    // firebase-init.js sets window.db after defer execution; guard against early call
    const _db = window.db || (typeof db !== 'undefined' ? db : null);
    if (!_db) { console.warn('Interleaved data fetch skipped: db not ready'); return; }
    try {
        const prodSnapshot = await _db.collection(FEED_RENDERER_CONFIG.COLLECTIONS.PRODUCTS)
            .where('status', '==', 'active')
            .limit(20)
            .get();

        FeedRenderer.marketplaceProducts = prodSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        FeedRenderer.marketplaceProducts.sort(() => Math.random() - 0.5);

        const groupSnapshot = await _db.collection('community_groups')
            .where('status', '==', 'active')
            .where('privacy', '==', 'public')
            .limit(10)
            .get();

        FeedRenderer.communityGroups = groupSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    } catch (e) {
        console.warn('Interleaved data fetch failed:', e);
    }
}

// Defer first call until after deferred scripts (firebase-init.js) have run
window.addEventListener('load', () => {
    loadInterleavedData();
    setInterval(loadInterleavedData, 60000);
});

// ================================================
// LOAD NEWS FEED
// ================================================

async function loadNewsFeed() {
    return new Promise((resolve) => {
        const timeout = setTimeout(() => {
            console.warn('News feed fetch timed out');
            resolve([]);
        }, 5000);
        
        db.collection(FEED_RENDERER_CONFIG.COLLECTIONS.NEWS)
            .orderBy('createdAt', 'desc')
            .limit(5)
            .get()
            .then(snapshot => {
                clearTimeout(timeout);
                FeedRenderer.latestNewsFeed = [];
                snapshot.forEach(doc => FeedRenderer.latestNewsFeed.push({ id: doc.id, ...doc.data() }));
                console.log('News feed loaded:', FeedRenderer.latestNewsFeed.length);
                resolve(FeedRenderer.latestNewsFeed);
            })
            .catch(err => {
                clearTimeout(timeout);
                console.error('Error fetching news:', err);
                resolve([]);
            });
    });
}

// ================================================
// CHECK ADMIN STATUS
// ================================================

async function checkAdminStatus() {
    try {
        const user = typeof WizmobizAuth !== 'undefined' ? WizmobizAuth.getUser() : null;
        if (!user) return;
        
        // Admin จาก server-verified role เท่านั้น (ไม่มี hardcoded ID list)
        if (user.role === 'admin' || user.role === 'super_admin') {
            FeedRenderer.isAdmin = true;
            const fab = document.getElementById('adminFab');
            if (fab) fab.style.setProperty('display', 'flex', 'important');
            console.log('Admin Access Granted');
        }
        
        FeedRenderer.currentUserId = user.uid;
        FeedRenderer.currentLineUserId = user.lineUserId;
        
        if (FeedRenderer.currentUserId) {
            const likedTab = document.getElementById('likedTabBtn');
            if (likedTab) likedTab.style.display = 'inline-flex';
            
            const doc = await db.collection(FEED_RENDERER_CONFIG.COLLECTIONS.LIKES).doc(FeedRenderer.currentUserId).get();
            if (doc.exists) {
                FeedRenderer.userLikedIds = doc.data().postIds || [];
            }
            
            const userDoc = await db.collection(FEED_RENDERER_CONFIG.COLLECTIONS.USERS).doc(FeedRenderer.currentUserId).get();
            if (userDoc.exists) {
                const data = userDoc.data();
                FeedRenderer.userFollowingIds = data.following || [];
                updateBottomNavProfile(data);
            } else {
                updateBottomNavProfile(user);
            }
        }
    } catch (error) {
        console.log('Admin check skipped:', error);
    }
}

function updateBottomNavProfile(userData) {
    const navItems = document.querySelectorAll('.bottom-nav-item');
    const channelBtn = navItems[navItems.length - 1];
    
    if (channelBtn && channelBtn.getAttribute('href') === 'channel') {
        const name = userData.displayName || userData.name || userData.username || 'ช่องของฉัน';
        const pic = userData.pictureUrl || userData.photoURL || userData.picture || userData.avatar;
        
        if (pic) {
            channelBtn.innerHTML = `
                <div style="width: 28px; height: 28px; border-radius: 50%; overflow: hidden; margin-bottom: 2px; border: 2px solid #ff6b35;">
                    <img src="${pic}" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <span style="font-size: 0.65rem;">${escapeHtml(name.split(' ')[0])}</span>
            `;
            
            if (channelBtn.classList.contains('active')) {
                channelBtn.querySelector('div').style.transform = 'translateY(-5px) scale(1.1)';
            }
        } else {
            channelBtn.querySelector('span').textContent = name.split(' ')[0];
        }
    }
}

// ================================================
// TAB NAVIGATION
// ================================================

const categoryList = ['all', 'near_me', 'community'];

function switchCategory(category) {
    if (FeedRenderer.currentCategory === category) return;

    FeedRenderer.currentCategory = category;

    const tuktuk = document.getElementById('tuktukFeed');
    const standard = document.getElementById('standardFeed');
    const loader = document.getElementById('loadingSpinner');
    const hero = document.querySelector('.hero-section');
    const promo = document.getElementById('promoBannerSection');

    // Sync legacy .tab-btn tabs (PC / old layout)
    document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.category === category);
        if (b.dataset.category === category) {
            b.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    });

    // Sync mobile header .mh-tab pill (ดูเพลิน / ใกล้ฉัน / อาชีพ)
    document.querySelectorAll('.mh-tab').forEach(t => t.classList.remove('active'));
    const mhTab = document.querySelector(`.mh-tab[data-cat="${category}"]`);
    if (mhTab) mhTab.classList.add('active');
    
    const isCommunity = (category === 'community');
    const isTuktukMode = (category === 'all' || category === 'video' || category === 'following' || category === 'liked' || category === 'near_me' || isCommunity);
    
    if (tuktuk) {
        tuktuk.style.display = isTuktukMode ? 'block' : 'none';
        tuktuk.classList.toggle('feed-community-mode', isCommunity);
    }
    
    if (standard) standard.style.display = isTuktukMode ? 'none' : 'block';
    
    if (hero) hero.style.display = isTuktukMode ? 'none' : 'block';
    if (promo) promo.style.display = 'block';
    
    if (isTuktukMode) {
        document.body.classList.add('feed-mode-active');
        document.documentElement.classList.add('feed-mode-active'); // Chrome 90-104 :has() fallback
    }

    if (isCommunity) {
        if (typeof initCommunityFeed === 'function') {
            initCommunityFeed(tuktuk);
        }
        if (loader) loader.style.display = 'none';
        return;
    }
    
    if (loader) loader.style.display = 'block';
    
    const container = document.getElementById('postsContainer');
    if (container) container.innerHTML = '';
    
    if (typeof initTukTukFeed === 'function') {
        initTukTukFeed(category);
    } else {
        loadPosts();
    }
}

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        switchCategory(this.dataset.category);
    });
});

// ================================================
// SWIPE NAVIGATION
// ================================================

let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

document.addEventListener('touchstart', e => {
    // Skip when mobile-header.js swipe system is active (feed-mode-active)
    if (document.body.classList.contains('feed-mode-active')) return;
    if (e.target.closest('.media-gallery-main') || e.target.closest('.promo-slider') || e.target.closest('iframe')) return;
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, { passive: true });

document.addEventListener('touchend', e => {
    // Skip when mobile-header.js swipe system is active (feed-mode-active)
    if (document.body.classList.contains('feed-mode-active')) return;
    if (e.target.closest('.media-gallery-main') || e.target.closest('.promo-slider') || e.target.closest('iframe')) return;
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
}, { passive: true });

function handleSwipe() {
    const threshold = 100;
    const diff = touchEndX - touchStartX;
    const diffY = Math.abs(touchEndY - touchStartY);

    // If vertical movement is dominant (diagonal scroll), ignore as horizontal swipe
    if (diffY > Math.abs(diff) * 0.8) return;
    
    if (Math.abs(diff) < threshold) return;
    
    const isTuktukMode = (FeedRenderer.currentCategory === 'all' || FeedRenderer.currentCategory === 'video' || FeedRenderer.currentCategory === 'following' || FeedRenderer.currentCategory === 'liked' || FeedRenderer.currentCategory === 'near_me');
    
    if (isTuktukMode && diff < -threshold) {
        const visibleItem = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
        const videoItem = visibleItem?.closest('.tuktuk-video-item');
        
        if (videoItem) {
            const postId = videoItem.id.replace('tuktuk-', '');
            const post = allPostsData.find(p => p.id === postId);
            
            if (post && post.authorId) {
                openAuthorProfile(post.authorId);
                return;
            }
        }
    }
    
    const currentIndex = categoryList.indexOf(FeedRenderer.currentCategory);
    if (currentIndex === -1) return;
    
    if (diff < 0 && currentIndex < categoryList.length - 1) {
        switchCategory(categoryList[currentIndex + 1]);
    } else if (diff > 0 && currentIndex > 0) {
        switchCategory(categoryList[currentIndex - 1]);
    }
}

// ================================================
// OPEN COMMENTS
// ================================================

function openComments(postId) {
    currentCommentPostId = postId;
    const container = document.getElementById('commentList');
    if (!container) return;
    
    container.innerHTML = '<div class="text-center py-4"><div class="spinner-border spinner-border-sm text-danger"></div></div>';
    
    const input = document.getElementById('commentInput');
    if (input) input.value = '';
    
    if (window.commentModal) {
        const modalEl = document.getElementById('commentModal');
        if (window.innerWidth <= 768) {
            modalEl.classList.add('bottom-sheet');
        } else {
            modalEl.classList.remove('bottom-sheet');
        }
        window.commentModal.show();
    }
    
    db.collection(FEED_RENDERER_CONFIG.COLLECTIONS.POSTS).doc(postId)
        .collection('comments')
        .orderBy('createdAt', 'desc')
        .get()
        .then(snapshot => {
            container.innerHTML = '';
            const comments = [];
            snapshot.forEach(doc => comments.push({ id: doc.id, ...doc.data() }));
            
            const titleEl = document.getElementById('commentCountTitle');
            if (titleEl) titleEl.textContent = `ความคิดเห็น (${comments.length})`;
            
            if (comments.length === 0) {
                container.innerHTML = '<div class="text-center text-muted py-5">ยังไม่มีความคิดเห็น มาร่วมแสดงความคิดเห็นคนแรกกัน!</div>';
                return;
            }
            
            comments.forEach(c => {
                const time = c.createdAt ? new Date(c.createdAt.toDate()).toLocaleString('th-TH') : 'เมื่อสักครู่';
                const item = document.createElement('div');
                item.className = 'comment-item';
                item.innerHTML = `
                    <img src="${c.userAvatar || 'assets/images/logo.png'}" class="comment-avatar">
                    <div class="comment-body">
                        <div class="comment-user">
                            ${escapeHtml(c.userName || 'ผู้ใช้งาน')}
                            <span class="comment-reply-btn" onclick="replyTo('${escapeHtml(c.userName)}')">ตอบกลับ</span>
                        </div>
                        <div class="comment-text">${escapeHtml(filterProfanity(c.text))}</div>
                        <div class="comment-time">${time}</div>
                    </div>
                `;
                container.appendChild(item);
            });
        })
        .catch(error => {
            console.error("Error fetching comments:", error);
            container.innerHTML = '<div class="text-center text-danger py-4">ไม่สามารถโหลดความคิดเห็นได้</div>';
        });
}

function replyTo(username) {
    const input = document.getElementById('commentInput');
    if (input) {
        input.value = `@${username} ` + input.value;
        input.focus();
    }
}

function submitComment() {
    const input = document.getElementById('commentInput');
    const text = input ? input.value.trim() : '';
    
    if (!text || !currentCommentPostId) return;
    
    if (containsProfanity(text)) {
        showToast('⚠️ ความคิดเห็นขัดต่อกฏการใช้งาน', 'warning');
        alert('⚠️ ความคิดเห็นของคุณมีเนื้อหาที่ไม่เหมาะสม หรือขัดต่อกฏชุมชน');
        return;
    }
    
    const user = typeof WizmobizAuth !== 'undefined' ? WizmobizAuth.getUser() : null;
    if (!user) {
        alert('⚠️ กรุณาเข้าสู่ระบบก่อนแสดงความคิดเห็น');
        return;
    }
    
    const sendBtn = document.getElementById('sendCommentBtn');
    if (sendBtn) sendBtn.disabled = true;
    
    const commentData = {
        text: text,
        userId: user.uid || user.lineUserId,
        userName: user.displayName || user.name || 'ผู้ใช้งาน',
        userAvatar: user.pictureUrl || user.photoURL || 'assets/images/logo.png',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    db.collection(FEED_RENDERER_CONFIG.COLLECTIONS.POSTS).doc(currentCommentPostId)
        .collection('comments').add(commentData)
        .then(() => {
            return db.collection(FEED_RENDERER_CONFIG.COLLECTIONS.POSTS).doc(currentCommentPostId).update({
                commentsCount: firebase.firestore.FieldValue.increment(1)
            });
        })
        .then(() => {
            if (input) input.value = '';
            openComments(currentCommentPostId);
        })
        .catch(error => {
            console.error("Error posting comment:", error);
            alert('❌ ไม่สามารถส่งความคิดเห็นได้');
        })
        .finally(() => {
            if (sendBtn) sendBtn.disabled = false;
        });
}

// ================================================
// INITIALIZATION
// ================================================

window.addEventListener('load', async () => {
    initParticles();
    loadAds();
    if (!(window.innerWidth < 992 && typeof window.initTukTukFeed === 'function')) {
        loadPosts();
    }
    await checkAdminStatus();
    setTimeout(initAutoPlayObserver, 2000);
    setTimeout(triggerWebGreeting, 1200);
    
    setInterval(() => {
        if (window.FB && window.FB.XFBML) window.FB.XFBML.parse();
    }, 10000);
});

function triggerWebGreeting() {
    const splash = document.getElementById('welcomeSplash');
    if (!splash) return;
    
    setTimeout(() => {
        splash.classList.add('fade-out');
        setTimeout(() => splash.remove(), 1000);
    }, 3000);
}

// ================================================
// CLEANUP
// ================================================

window.addEventListener('unload', () => {
    FeedRenderer.intervals.forEach(clearInterval);
    FeedRenderer.timeouts.forEach(clearTimeout);
    FeedRenderer.observers.forEach(observer => {
        if (observer.disconnect) observer.disconnect();
    });
});

// ================================================
// EXPORTS (Global functions)
// ================================================

// Video & Player
window.loadVideoSrc = loadVideoSrc;
window.handleVideoError = handleVideoError;
window.retryVideoLoad = retryVideoLoad;
window.startVideoLoadTimer = startVideoLoadTimer;
window.handleVideoLoaded = handleVideoLoaded;
window.toggleTukTukPlayback = toggleTukTukPlayback;
window.toggleFullscreen = toggleFullscreen;
window.updateVideoProgress = updateVideoProgress;
window.handleVideoSeek = handleVideoSeek;
window.showHeartAnimation = showHeartAnimation;
window.toggleTuktukMute = toggleTuktukMute;
window.toggleTuktukAutoScroll = toggleTuktukAutoScroll;
window.scrollToNextTuktuk = scrollToNextTuktuk;
window.handleTuktukVideoEnded = handleTuktukVideoEnded;
window.syncTuktukVolume = syncTuktukVolume;
window.initYoutubePlayer = initYoutubePlayer;
window.extractYoutubeId = extractYoutubeId;
window.parseVideoEmbed = parseVideoEmbed;

// Feed Renderers
window.renderTukTukFeed = renderTukTukFeed;
window.renderWelcomeCard = renderWelcomeCard;
window.renderTukTukProductItem = renderTukTukProductItem;
window.renderInterleavedProduct = renderInterleavedProduct;
window.renderNewsFeedCard = renderNewsFeedCard;
window.renderTukTukNewsItem = renderTukTukNewsItem;
window.renderTukTukGroupRecommendation = renderTukTukGroupRecommendation;
window.renderTukTukWeatherCard = renderTukTukWeatherCard;
window.renderPostCard = renderPostCard;
window.renderEmptyState = renderEmptyState;

// Notifications
window.toggleNotifications = toggleNotifications;
window.initNotifications = initNotifications;
window.markAllNotificationsRead = markAllNotificationsRead;
window.handleNotifClick = handleNotifClick;

// News
window.handleNewsAction = handleNewsAction;
window.trackNewsClick = trackNewsClick;

// Interactions
window.likePost = likePost;
window.sharePost = sharePost;
window.openComments = openComments;
// ── Mobile fallback: save reference BEFORE pc-comments.js overrides on PC ──
window._mobileOpenComments = openComments;
window.replyTo = replyTo;
window.submitComment = submitComment;
window.openAuthorProfile = openAuthorProfile;
window.handleFollow = handleFollow;
window.togglePostMenu = togglePostMenu;
window.toggleReadMore = toggleReadMore;

// Post CRUD
window.openPostModal = openPostModal;
window.editPost = editPost;
window.togglePin = togglePin;
window.confirmDelete = confirmDelete;

// Gallery
window.changeGalleryMedia = changeGalleryMedia;
window.navigateGallery = navigateGallery;

// Upload
window.handleMultiMediaUpload = handleMultiMediaUpload;
window.removeUploadedImage = removeUploadedImage;
window.removeYoutubeVideo = removeYoutubeVideo;
window.selectPostCategory = selectPostCategory;
window.resetUploadAreaMulti = resetUploadAreaMulti;
window.resetUploadArea = resetUploadArea;
window.getCurrentLocation = getCurrentLocation;
window.previewVideoLink = previewVideoLink;
window.verifyLinkedProduct = verifyLinkedProduct;

// AI
window.toggleAiOptions = toggleAiOptions;
window.aiAssist = aiAssist;

// Network
window.getNetworkSpeed = getNetworkSpeed;
window.updateNetworkSpeedUI = updateNetworkSpeedUI;

// Utilities
window.formatTimeAgo = formatTimeAgo;
window.formatNotifTime = formatNotifTime;
window.formatContent = formatContent;
window.escapeHtml = escapeHtml;
window.filterProfanity = filterProfanity;
window.containsProfanity = containsProfanity;
window.showToast = showToast;
window.showNotification = showNotification;

// Data loading
window.loadPosts = loadPosts;
window.loadAds = loadAds;
window.switchCategory = switchCategory;
window.checkAdminStatus = checkAdminStatus;

// SDK
window.initSocialSDKs = initSocialSDKs;
window.initAutoPlayObserver = initAutoPlayObserver;

// Welcome
window.shouldShowWelcome = shouldShowWelcome;
window.triggerWebGreeting = triggerWebGreeting;

// Cache clear helper (called by window.clearFeedCache in tuktuk_feed_logic.js)
window._clearAuthorCache = function() { authorCache.clear(); };