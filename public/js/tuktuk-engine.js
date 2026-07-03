// ================================================
// tuktuk-engine.js - TukTuk Video Feed Engine V5
// Vertical Reel + YouTube + Autoplay + Like/Share
// ================================================

// ================================================
// CONFIGURATION
// ================================================
const TUKTUK_ENGINE_CONFIG = {
    // Timing (ms)
    VIDEO_LOAD_TIMEOUT: 10000,
    PRODUCT_DELAY: 15000,
    AUTO_SCROLL_DELAY: 20000,
    DOUBLE_TAP_THRESHOLD: 300,
    VIEW_TRACK_DELAY: 2000,
    OBSERVER_THRESHOLD: 0.4,
    
    // Features
    ENABLE_LINE_FIX: true,
    ENABLE_OFFLINE_QUEUE: true,
    ENABLE_VIBRATION: true,
    
    // Limits
    MAX_RETRY_ATTEMPTS: 3,
    BLOB_CACHE_SIZE: 10,
    
    // URLs
    YT_API_URL: 'https://www.youtube.com/iframe_api'
};

// ================================================
// GLOBAL STATE (Namespaced)
// ================================================
window.TukTukEngine = window.TukTukEngine || {
    // Players
    players: {},
    videoLoadTimers: {},
    productTimers: {},
    productAutoScrollTimers: {},
    
    // State
    isMuted: localStorage.getItem('tuktuk_muted') !== 'false',
    isAutoScroll: localStorage.getItem('tuktuk_autoscroll') !== 'false',
    viewedPosts: new Set(),
    
    // Flags
    isYouTubeAPIReady: false,
    isInitialized: false,
    isLineApp: /Line\//i.test(navigator.userAgent),
    
    // Stats
    metrics: {
        plays: 0,
        errors: 0,
        likes: 0,
        shares: 0
    },
    
    // Offline queue
    offlineQueue: [],
    
    // Cleanup
    observers: [],
    intervals: [],
    timeouts: []
};

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
        console.warn('[TukTukEngine] localStorage error:', e);
        return defaultValue;
    }
}

/**
 * Show toast notification
 */
function showEngineToast(message, type = 'info', duration = 3000) {
    if (typeof window.showToast === 'function') {
        window.showToast(message, type);
        return;
    }
    
    const toast = document.createElement('div');
    toast.className = `engine-toast engine-toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? 'linear-gradient(135deg, #10b981, #059669)' : 
                     type === 'error' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 
                     'linear-gradient(135deg, #3b82f6, #2563eb)'};
        color: white;
        padding: 12px 24px;
        border-radius: 50px;
        font-weight: 600;
        z-index: 99999;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        animation: engineToastIn 0.3s ease;
    `;
    document.body.appendChild(toast);
    
    const timeout = setTimeout(() => {
        toast.style.animation = 'engineToastOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, duration);
    
    TukTukEngine.timeouts.push(timeout);
}

// Add toast styles
if (!document.getElementById('engine-toast-styles')) {
    const style = document.createElement('style');
    style.id = 'engine-toast-styles';
    style.textContent = `
        @keyframes engineToastIn {
            from { opacity: 0; transform: translate(-50%, 20px); }
            to { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes engineToastOut {
            from { opacity: 1; transform: translate(-50%, 0); }
            to { opacity: 0; transform: translate(-50%, -20px); }
        }
    `;
    document.head.appendChild(style);
}

/**
 * Haptic feedback
 */
function triggerHaptic(pattern = 10) {
    if (!TUKTUK_ENGINE_CONFIG.ENABLE_VIBRATION) return;
    if (window.navigator && window.navigator.vibrate) {
        try {
            window.navigator.vibrate(pattern);
        } catch (e) {
            // Ignore
        }
    }
}

/**
 * Format time for progress bar
 */
function formatTime(seconds) {
    if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// ================================================
// YOUTUBE PLAYER MANAGEMENT
// ================================================

/**
 * Initialize YouTube API
 */
function initYouTubeAPI() {
    if (window.YT && window.YT.Player) {
        TukTukEngine.isYouTubeAPIReady = true;
        initAllYouTubePlayers();
        return;
    }
    
    // Load API if not present
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement('script');
        tag.src = TUKTUK_ENGINE_CONFIG.YT_API_URL;
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
}

/**
 * YouTube API Ready Callback
 */
window.onYouTubeIframeAPIReady = function() {
    console.log('[TukTukEngine] YouTube API Ready');
    TukTukEngine.isYouTubeAPIReady = true;
    initAllYouTubePlayers();
};

/**
 * Initialize all YouTube players
 */
function initAllYouTubePlayers() {
    document.querySelectorAll('.yt-placeholder').forEach(el => {
        const postId = el.id.replace('yt-player-', '');
        if (!TukTukEngine.players[postId]) {
            initYoutubePlayer(postId, el);
        }
    });
}

/**
 * Initialize single YouTube player
 */
function initYoutubePlayer(postId, element) {
    if (!TukTukEngine.isYouTubeAPIReady || !window.YT || !window.YT.Player) {
        console.log('[TukTukEngine] YouTube API not ready for:', postId);
        return;
    }
    
    if (TukTukEngine.players[postId]) {
        console.log('[TukTukEngine] Player already exists for:', postId);
        return;
    }
    
    const videoId = element.dataset.videoId;
    if (!videoId) {
        console.warn('[TukTukEngine] No videoId for:', postId);
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
                mute: TukTukEngine.isMuted ? 1 : 0
            },
            events: {
                onReady: (e) => onPlayerReady(e, postId),
                onStateChange: (e) => onPlayerStateChange(e, postId),
                onError: (e) => onPlayerError(e, postId)
            }
        });
        
        TukTukEngine.players[postId] = player;
        console.log('[TukTukEngine] YouTube player created for:', postId);
        
    } catch (error) {
        console.error('[TukTukEngine] Error creating YouTube player:', error);
        TukTukEngine.metrics.errors++;
        handleVideoError(postId);
    }
}

/**
 * Player ready event
 */
function onPlayerReady(event, postId) {
    handleVideoLoaded(postId);
    
    // Apply mute state
    if (TukTukEngine.isMuted) {
        event.target.mute();
    } else {
        event.target.unMute();
        event.target.setVolume(100);
    }
    
    // Check if in view
    const rect = document.getElementById(`tuktuk-${postId}`)?.getBoundingClientRect();
    if (rect && rect.top < window.innerHeight && rect.bottom > 0) {
        event.target.playVideo();
        TukTukEngine.metrics.plays++;
    }
}

/**
 * Player state change event
 */
function onPlayerStateChange(event, postId) {
    switch (event.data) {
        case YT.PlayerState.ENDED:
            if (TukTukEngine.isAutoScroll) {
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
    console.warn('[TukTukEngine] YouTube error for', postId, ':', event.data);
    TukTukEngine.metrics.errors++;
    handleVideoError(postId);
}

// ================================================
// VIDEO LOADING & ERROR HANDLING
// ================================================

/**
 * Handle video loaded successfully
 */
function handleVideoLoaded(postId) {
    const wrapper = document.getElementById(`tuktuk-${postId}`);
    if (wrapper) {
        const loader = wrapper.querySelector('.video-loading-placeholder');
        const slowUI = wrapper.querySelector('.slow-connection-overlay');
        if (loader) loader.style.display = 'none';
        if (slowUI) slowUI.classList.remove('show');
    }
    
    if (TukTukEngine.videoLoadTimers[postId]) {
        clearTimeout(TukTukEngine.videoLoadTimers[postId]);
        delete TukTukEngine.videoLoadTimers[postId];
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
        if (typeof window.updateNetworkSpeedUI === 'function') {
            window.updateNetworkSpeedUI();
        }
    }
    
    const loader = wrapper.querySelector('.video-loading-placeholder');
    if (loader) loader.style.display = 'none';
    
    // Pause all players
    const video = wrapper.querySelector('video');
    if (video) video.pause();
    
    const ytPlayer = TukTukEngine.players[postId];
    if (ytPlayer && ytPlayer.pauseVideo) ytPlayer.pauseVideo();
}

/**
 * Start video load timer
 */
function startVideoLoadTimer(postId, type = 'video') {
    if (TukTukEngine.videoLoadTimers[postId]) {
        clearTimeout(TukTukEngine.videoLoadTimers[postId]);
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
            const player = TukTukEngine.players[postId];
            if (player && player.getPlayerState) {
                const state = player.getPlayerState();
                if (state === -1 || state === 3) {
                    handleVideoError(postId);
                }
            }
        }
    }, TUKTUK_ENGINE_CONFIG.VIDEO_LOAD_TIMEOUT);
    
    TukTukEngine.videoLoadTimers[postId] = timeout;
    TukTukEngine.timeouts.push(timeout);
}

/**
 * Retry video load
 */
async function retryVideoLoad(postId) {
    const wrapper = document.getElementById(`tuktuk-${postId}`);
    if (!wrapper) return;
    
    const video = wrapper.querySelector('video');
    const ytPlayer = TukTukEngine.players[postId];
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

/**
 * Load video source (with LINE fix)
 */
async function loadVideoSrc(video, url) {
    if (!url) return;
    
    try {
        // LINE browser fix for Firebase Storage
        if (TukTukEngine.isLineApp && 
            TUKTUK_ENGINE_CONFIG.ENABLE_LINE_FIX && 
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
        console.warn('[TukTukEngine] Failed to load video:', error.message);
        // Fallback to direct URL
        video.src = url;
    }
}

// ================================================
// INTERSECTION OBSERVER
// ================================================

/**
 * Create and configure intersection observer
 */
function createTuktukObserver() {
    const observer = new IntersectionObserver(
        async (entries) => {
            for (const entry of entries) {
                await handleIntersection(entry);
            }
        },
        { threshold: TUKTUK_ENGINE_CONFIG.OBSERVER_THRESHOLD }
    );
    
    TukTukEngine.observers.push(observer);
    return observer;
}

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
 * Handle product item intersection
 */
function handleProductIntersection(entry, wrapper, postId) {
    if (entry.isIntersecting) {
        wrapper.classList.add('active');
        if (TukTukEngine.isAutoScroll) {
            if (TukTukEngine.productAutoScrollTimers[postId]) {
                clearTimeout(TukTukEngine.productAutoScrollTimers[postId]);
            }
            
            const timeout = setTimeout(() => {
                scrollToNextTuktuk(postId);
            }, TUKTUK_ENGINE_CONFIG.AUTO_SCROLL_DELAY);
            
            TukTukEngine.productAutoScrollTimers[postId] = timeout;
            TukTukEngine.timeouts.push(timeout);
        }
    } else {
        wrapper.classList.remove('active');
        if (TukTukEngine.productAutoScrollTimers[postId]) {
            clearTimeout(TukTukEngine.productAutoScrollTimers[postId]);
            delete TukTukEngine.productAutoScrollTimers[postId];
        }
    }
}

/**
 * Handle video enter view
 */
async function handleVideoEnter(postId, wrapper, mediaItem, productCard) {
    // Track view
    trackView(postId);
    
    // Handle video playback
    if (mediaItem.tagName === 'VIDEO') {
        await handleVideoPlayback(postId, wrapper, mediaItem);
    } else if (TukTukEngine.players[postId]) {
        handleYouTubePlayback(postId, wrapper);
    }
    
    // Handle product card delay
    if (productCard && !productCard.classList.contains('show-delayed')) {
        const timeout = setTimeout(() => {
            productCard.classList.add('show-delayed');
        }, TUKTUK_ENGINE_CONFIG.PRODUCT_DELAY);
        
        TukTukEngine.productTimers[postId] = timeout;
        TukTukEngine.timeouts.push(timeout);
    }
}

/**
 * Handle video playback
 */
async function handleVideoPlayback(postId, wrapper, video) {
    startVideoLoadTimer(postId, 'video');
    
    // Add event listeners
    if (!video._hasListeners) {
        video.onwaiting = () => startVideoLoadTimer(postId, 'video');
        video.onplaying = () => handleVideoLoaded(postId);
        video.ontimeupdate = () => updateProgressBar(postId, video);
        video._hasListeners = true;
    }
    
    // Lazy load source
    if (video.dataset.src) {
        const src = video.dataset.src;
        delete video.dataset.src;
        await loadVideoSrc(video, src);
        video.load();
    }
    
    // Play video
    if (!video.dataset.userPaused) {
        video.muted = TukTukEngine.isMuted;
        try {
            await video.play();
            TukTukEngine.metrics.plays++;
        } catch (error) {
            if (error.name === 'NotAllowedError') {
                video.muted = true;
                video.play().catch(() => {});
                
                const guide = wrapper.querySelector('.tap-unmute-guide');
                if (guide) guide.classList.add('show');
            }
        }
    }
}

/**
 * Handle YouTube playback
 */
function handleYouTubePlayback(postId, wrapper) {
    startVideoLoadTimer(postId, 'youtube');
    
    const player = TukTukEngine.players[postId];
    const isUserPaused = wrapper.dataset.userPaused;
    
    if (!isUserPaused) {
        if (TukTukEngine.isMuted) player.mute();
        else player.unMute();
        
        player.playVideo();
        TukTukEngine.metrics.plays++;
    }
}

/**
 * Handle video exit view
 */
function handleVideoExit(postId, wrapper, mediaItem) {
    // Pause video
    if (mediaItem.tagName === 'VIDEO') {
        mediaItem.pause();
    } else if (TukTukEngine.players[postId] && TukTukEngine.players[postId].pauseVideo) {
        TukTukEngine.players[postId].pauseVideo();
    }
    
    // Clear product timer
    if (TukTukEngine.productTimers[postId]) {
        clearTimeout(TukTukEngine.productTimers[postId]);
        delete TukTukEngine.productTimers[postId];
    }
}

// ================================================
// VIEW TRACKING
// ================================================

/**
 * Track video view
 */
async function trackView(postId) {
    if (!postId) return;
    if (TukTukEngine.viewedPosts.has(postId)) return;
    
    // Mark as viewed
    TukTukEngine.viewedPosts.add(postId);
    
    // Check if offline
    if (!navigator.onLine && TUKTUK_ENGINE_CONFIG.ENABLE_OFFLINE_QUEUE) {
        TukTukEngine.offlineQueue.push({
            type: 'view',
            postId,
            timestamp: Date.now()
        });
        return;
    }
    
    try {
        // Delay to avoid counting accidental views
        setTimeout(async () => {
            try {
                await db.collection('community_posts').doc(postId).update({
                    views: firebase.firestore.FieldValue.increment(1)
                });
                console.log('[TukTukEngine] View tracked for:', postId);
            } catch (error) {
                if (error.code !== 'permission-denied') {
                    console.error('[TukTukEngine] Error tracking view:', error);
                }
            }
        }, TUKTUK_ENGINE_CONFIG.VIEW_TRACK_DELAY);
        
    } catch (error) {
        console.error('[TukTukEngine] Track view error:', error);
    }
}

// ================================================
// AUTO-SCROLL CONTROLS
// ================================================

/**
 * Toggle auto-scroll
 */
function toggleAutoScroll(event) {
    if (event) event.stopPropagation();
    
    TukTukEngine.isAutoScroll = !TukTukEngine.isAutoScroll;
    
    try {
        localStorage.setItem('tuktuk_autoscroll', TukTukEngine.isAutoScroll);
    } catch (e) {
        // Ignore
    }
    
    // Update UI
    document.querySelectorAll('[id^="autoscroll-icon-"]').forEach(icon => {
        icon.classList.toggle('text-warning', TukTukEngine.isAutoScroll);
    });
    
    document.querySelectorAll('[id^="autoscroll-text-"]').forEach(span => {
        span.textContent = `เล่นอัตโนมัติ: ${TukTukEngine.isAutoScroll ? 'เปิด' : 'ปิด'}`;
    });
    
    // Update bolt button
    if (typeof window.updateBoltUI === 'function') {
        window.updateBoltUI();
    }
    
    triggerHaptic(10);
    showEngineToast(`⚡ เล่นอัตโนมัติ: ${TukTukEngine.isAutoScroll ? 'เปิด' : 'ปิด'}`, 'info');
}

/**
 * Scroll to next video
 */
function scrollToNextTuktuk(currentPostId) {
    // Detect active container
    let containerId = 'tuktukFeed';
    if (window.TukTukFeed) {
        const cat = window.TukTukFeed.currentCategory;
        if (cat === 'near_me') containerId = 'tuktukFeedNearMe';
        else if (cat === 'community') containerId = 'tuktukFeedCommunity';
    }
    const container = document.getElementById(containerId);
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
function handleVideoEnded(video, postId) {
    if (TukTukEngine.isAutoScroll) {
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
function toggleMute(event) {
    if (event) event.stopPropagation();
    
    TukTukEngine.isMuted = !TukTukEngine.isMuted;
    syncVolume();
    
    try {
        localStorage.setItem('tuktuk_muted', TukTukEngine.isMuted);
    } catch (e) {
        // Ignore
    }
    
    if (typeof window.updateMuteUI === 'function') {
        window.updateMuteUI();
    }
    
    triggerHaptic(10);
}

/**
 * Sync volume across all players
 */
function syncVolume() {
    try {
        localStorage.setItem('tuktuk_muted', TukTukEngine.isMuted);
    } catch (e) {
        // Ignore
    }
    
    // Sync HTML5 videos
    document.querySelectorAll('.tuktuk-video').forEach(media => {
        if (media.tagName === 'VIDEO') {
            media.muted = TukTukEngine.isMuted;
            if (!TukTukEngine.isMuted) {
                media.volume = 1.0;
            }
        }
    });
    
    // Sync YouTube players
    Object.values(TukTukEngine.players).forEach(player => {
        if (player && player.mute && player.unMute) {
            if (TukTukEngine.isMuted) {
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
        icon.className = TukTukEngine.isMuted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
    }
    
    // Hide guides when unmuted
    if (!TukTukEngine.isMuted) {
        document.querySelectorAll('.tap-unmute-guide').forEach(g => g.classList.remove('show'));
    }
}

// ================================================
// PROGRESS BAR
// ================================================

/**
 * Update progress bar
 */
function updateProgressBar(postId, media) {
    const progressBar = document.getElementById(`progress-bar-${postId}`);
    if (!progressBar) return;
    
    if (media.tagName === 'VIDEO') {
        if (media.duration && !isNaN(media.duration)) {
            const progress = (media.currentTime / media.duration) * 100;
            progressBar.style.width = `${progress}%`;
        }
    }
}

// ================================================
// INTERACTIONS (Like, Share, Follow)
// ================================================

let lastVideoTap = 0;

/**
 * Toggle video play/pause with double-tap like
 */
async function toggleVideoPlay(postId) {
    const now = Date.now();
    
    if (now - lastVideoTap < TUKTUK_ENGINE_CONFIG.DOUBLE_TAP_THRESHOLD) {
        // Double tap -> like
        const card = document.getElementById(`card-${postId}`);
        if (window.userLikedIds && !window.userLikedIds.includes(postId)) {
            await likePost(postId);
        } else if (card) {
            triggerHeartPop(card);
        }
        
        // Undo single tap
        performToggle(postId);
        lastVideoTap = 0;
        return;
    }
    
    lastVideoTap = now;
    performToggle(postId);
}

/**
 * Perform toggle (play/pause)
 */
function performToggle(postId) {
    const wrapper = document.getElementById(`tuktuk-${postId}`);
    if (!wrapper) return;
    
    const media = wrapper.querySelector('.tuktuk-video') || wrapper.querySelector('video');
    if (!media) return;
    
    triggerHaptic(5);
    
    if (media.tagName === 'VIDEO') {
        if (media.paused) {
            media.play().catch(() => {});
            wrapper.dataset.userPaused = "";
            const icon = wrapper.querySelector('.video-play-icon');
            if (icon) icon.style.opacity = '0';
        } else {
            media.pause();
            wrapper.dataset.userPaused = "true";
            const icon = wrapper.querySelector('.video-play-icon');
            if (icon) icon.style.opacity = '1';
        }
    } else if (TukTukEngine.players[postId]) {
        const player = TukTukEngine.players[postId];
        const state = player.getPlayerState ? player.getPlayerState() : -1;
        
        if (state === 1) { // playing
            player.pauseVideo();
            wrapper.dataset.userPaused = "true";
            const icon = wrapper.querySelector('.video-play-icon');
            if (icon) icon.style.opacity = '1';
        } else {
            player.playVideo();
            wrapper.dataset.userPaused = "";
            const icon = wrapper.querySelector('.video-play-icon');
            if (icon) icon.style.opacity = '0';
        }
    }
}

/**
 * Like post
 */
async function likePost(postId) {
    if (!postId) return;
    
    triggerHaptic(50);
    
    const card = document.getElementById(`card-${postId}`);
    if (!card) return;
    
    const likeBtn = card.querySelector('.reel-action');
    if (!likeBtn) return;
    
    const icon = likeBtn.querySelector('i');
    const text = likeBtn.querySelector('span');
    
    // Sync with userLikedIds
    if (!window.userLikedIds) window.userLikedIds = [];
    const isLiked = window.userLikedIds.includes(postId);
    
    let newCount = parseInt(text?.textContent.replace(/,/g, '') || 0);
    
    if (isLiked) {
        // Unlike
        window.userLikedIds = window.userLikedIds.filter(id => id !== postId);
        likeBtn.classList.remove('liked');
        if (icon) icon.style.color = 'white';
        newCount = Math.max(0, newCount - 1);
        
        // Update DB
        if (typeof db !== 'undefined' && navigator.onLine) {
            db.collection('community_posts').doc(postId).update({
                likes: firebase.firestore.FieldValue.increment(-1)
            }).catch(() => {});
        }
        
        TukTukEngine.metrics.likes = Math.max(0, TukTukEngine.metrics.likes - 1);
        
    } else {
        // Like
        window.userLikedIds.push(postId);
        likeBtn.classList.add('liked');
        if (icon) icon.style.color = '#FF0050';
        newCount++;
        
        triggerHeartPop(card);
        
        // Update DB
        if (typeof db !== 'undefined' && navigator.onLine) {
            db.collection('community_posts').doc(postId).update({
                likes: firebase.firestore.FieldValue.increment(1)
            }).catch(() => {});
        }
        
        TukTukEngine.metrics.likes++;
    }
    
    if (text) text.textContent = newCount.toLocaleString();
}

/**
 * Trigger heart pop animation
 */
function triggerHeartPop(container) {
    const heart = document.createElement('div');
    heart.className = 'heart-pop-animation';
    heart.innerHTML = '<i class="fas fa-heart"></i>';
    heart.style.cssText = `
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        font-size: 5rem;
        color: #FF0050;
        z-index: 1000;
        pointer-events: none;
        animation: heartPop 0.8s ease-out forwards;
    `;
    
    const targetContainer = container.querySelector('.video-reel-container') || container;
    targetContainer.style.position = 'relative';
    targetContainer.appendChild(heart);
    
    setTimeout(() => heart.remove(), 800);
}

/**
 * Share post
 */
function sharePost(postId, title) {
    triggerHaptic(20);
    TukTukEngine.metrics.shares++;
    
    const url = `${window.location.origin}${window.location.pathname}?post=${postId}`;
    
    if (typeof window.TukTukNotify !== 'undefined' && window.TukTukNotify.sharePost) {
        window.TukTukNotify.sharePost({ id: postId, text: title });
        
    } else if (navigator.share) {
        navigator.share({
            title: title || 'TukTuk Video',
            url: url
        }).catch(() => {});
        
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(url).then(() => {
            showEngineToast('📋 คัดลอกลิงก์แล้ว!', 'success');
        }).catch(() => {
            showEngineToast('ไม่สามารถแชร์ได้', 'error');
        });
    }
}

/**
 * Toggle follow
 */
async function toggleFollow(authorId) {
    if (!authorId) return;
    
    triggerHaptic(50);
    
    // Optimistic UI
    document.querySelectorAll(`.author-avatar-${authorId}`).forEach(el => {
        const wrapper = el.closest('.avatar-wrapper');
        if (wrapper) {
            const plus = wrapper.querySelector('.follow-plus-badge');
            if (plus) {
                plus.innerHTML = '<i class="fas fa-check" style="color: white; font-size: 10px;"></i>';
                plus.style.background = '#00f2ea'; // TukTuk Cyan
            }
        }
    });
    
    showEngineToast('✅ ติดตามแล้ว!', 'success');
}

// ================================================
// UTILITY FUNCTIONS
// ================================================

/**
 * Extract YouTube ID from URL
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
 * Parse video embed URL
 */
function parseVideoEmbed(embedStr) {
    if (!embedStr) return null;
    
    if (embedStr.includes('<iframe')) return embedStr;
    
    if (embedStr.includes('tiktok.com')) {
        const tiktokId = embedStr.split('/').pop().split('?')[0];
        return `<iframe src="https://www.tiktok.com/embed/v2/${tiktokId}" style="width:100%; height:100%;" frameborder="0" allowfullscreen></iframe>`;
    }
    
    if (embedStr.includes('facebook.com') || embedStr.includes('fb.watch')) {
        return `<iframe src="https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(embedStr)}&show_text=0" style="width:100%; height:100%;" frameborder="0" allowfullscreen></iframe>`;
    }
    
    return null;
}

// ================================================
// EVENT HANDLERS (Offline/Online)
// ================================================

/**
 * Handle offline event
 */
function handleOffline() {
    console.log('[TukTukEngine] Offline');
    
    // Show error for visible videos
    document.querySelectorAll('.tuktuk-video-item').forEach(item => {
        const rect = item.getBoundingClientRect();
        if (rect.top >= 0 && rect.top <= window.innerHeight) {
            handleVideoError(item.id.replace('tuktuk-', ''));
        }
    });
}

/**
 * Handle online event
 */
function handleOnline() {
    console.log('[TukTukEngine] Online');
    
    // Retry visible videos
    document.querySelectorAll('.tuktuk-video-item').forEach(item => {
        const rect = item.getBoundingClientRect();
        if (rect.top >= 0 && rect.top <= window.innerHeight) {
            retryVideoLoad(item.id.replace('tuktuk-', ''));
        }
    });
    
    // Process offline queue
    if (TUKTUK_ENGINE_CONFIG.ENABLE_OFFLINE_QUEUE && TukTukEngine.offlineQueue.length > 0) {
        console.log('[TukTukEngine] Processing offline queue:', TukTukEngine.offlineQueue.length);
        
        TukTukEngine.offlineQueue.forEach(item => {
            if (item.type === 'view') {
                trackView(item.postId);
            }
        });
        
        TukTukEngine.offlineQueue = [];
    }
}

// ================================================
// INITIALIZATION
// ================================================

/**
 * Initialize engine
 */
function initTuktukEngine() {
    if (TukTukEngine.isInitialized) return;
    
    console.log('[TukTukEngine] Initializing...');
    
    // Create observer
    const observer = createTuktukObserver();
    
    // Observe existing items
    document.querySelectorAll('.tuktuk-video-item').forEach(el => {
        observer.observe(el);
    });
    
    // Initialize YouTube API
    initYouTubeAPI();
    
    // Sync initial volume
    syncVolume();
    
    // Add event listeners
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    window.addEventListener('load', syncVolume);
    
    // Add mutation observer for dynamically added items
    const mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1 && node.classList && node.classList.contains('tuktuk-video-item')) {
                    observer.observe(node);
                }
            });
        });
    });
    
    mutationObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    TukTukEngine.observers.push(mutationObserver);
    TukTukEngine.isInitialized = true;
    
    console.log('[TukTukEngine] Initialized');
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTuktukEngine);
} else {
    initTuktukEngine();
}

// ================================================
// EXPORTS (Global functions)
// ================================================

// Core
window.toggleMute = toggleMute;
window.toggleAutoScroll = toggleAutoScroll;
window.scrollToNextTuktuk = scrollToNextTuktuk;
window.handleVideoEnded = handleVideoEnded;
window.syncVolume = syncVolume;

// Video
window.toggleVideoPlay = toggleVideoPlay;
window.likePost = likePost;
window.sharePost = sharePost;
window.toggleFollow = toggleFollow;
window.retryVideoLoad = retryVideoLoad;
window.handleVideoLoaded = handleVideoLoaded;
window.handleVideoError = handleVideoError;

// YouTube
window.initYoutubePlayer = initYoutubePlayer;
window.extractYoutubeId = extractYoutubeId;
window.parseVideoEmbed = parseVideoEmbed;

// Progress
window.updateProgressBar = updateProgressBar;

// Debug
window.TukTukEngine = TukTukEngine;