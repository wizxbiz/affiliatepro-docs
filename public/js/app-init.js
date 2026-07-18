/**
 * 🚀 App Initialization & General Bootstrap
 */

/**
 * Restore Firebase Authentication for users who are logged in via
 * WizmobizAuth (PIN/LINE session) but haven't signed into Firebase yet.
 * Calls the refreshWebSession CF to get a fresh custom token.
 */
async function _restoreFirebaseAuth() {
    try {
        if (!firebase || !firebase.auth) return;
        if (firebase.auth().currentUser) return; // already signed in

        // Check if there's a WizmobizAuth / LINE session
        const raw = localStorage.getItem('wizmobiz_session') ||
                    localStorage.getItem('tuktuk_line_session');
        if (!raw) return;

        const session = JSON.parse(raw);
        const userId = session.lineUserId || session.uid;
        if (!userId) return;

        // Request a fresh custom token from the server
        const API_BASE = 'https://us-central1-appinjproject.cloudfunctions.net';
        const resp = await fetch(`${API_BASE}/refreshWebSession`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
        });
        if (!resp.ok) return;
        const data = await resp.json();
        if (data.sessionToken) {
            await firebase.auth().signInWithCustomToken(data.sessionToken);
            console.log('[app-init] Firebase Auth restored for', userId);
        }
    } catch (e) {
        console.warn('[app-init] Firebase Auth restore skipped:', e.message);
    }
}

window.addEventListener('load', async () => {
    console.log('🚀 TukTuk App starting up...');

    // Restore Firebase Auth so Firestore rules work (admin operations, etc.)
    _restoreFirebaseAuth(); // fire & forget — non-blocking

    // Core Layout: Particles, Splash
    initParticles();
    triggerWebGreeting();

    // Data Load: Ads, Social Feed
    if (typeof loadAds === 'function') loadAds();
    const PC_BREAKPOINT = 992;
    const urlParams = new URLSearchParams(window.location.search);
    const targetPostId = urlParams.get('post') || urlParams.get('postId') || urlParams.get('id');
    const forceExplore = urlParams.get('category') === 'all' || urlParams.get('cat') === 'all';
    
    if (window.innerWidth < PC_BREAKPOINT) {
        const initialCat = targetPostId ? 'all' : (urlParams.get('category') || urlParams.get('cat') || sessionStorage.getItem('tuktuk_last_category') || 'all');
        if (typeof window.initTukTukFeed === 'function') {
            window.TukTukFeed = window.TukTukFeed || {};
            if (!window.TukTukFeed.didAutoInit) {
                window.TukTukFeed.didAutoInit = true;
                window.initTukTukFeed(initialCat, false);
            }
        } else if (typeof loadPosts === 'function') {
            loadPosts();
        }
    } else if (forceExplore || targetPostId) {
        if (typeof loadPosts === 'function') loadPosts();
    }

    // Start general observers after a short delay
    setTimeout(() => {
        if (typeof initAutoPlayObserver === 'function') initAutoPlayObserver();
        if (typeof initPullToRefresh === 'function') initPullToRefresh();
        if (typeof initNotifications === 'function') initNotifications();
    }, 800);

    // Background Tasks
    if (typeof checkAdminStatus === 'function') await checkAdminStatus();

    // Delayed UI: SDKs
    setTimeout(() => {
        if (typeof AOS !== 'undefined') AOS.init({ duration: 800, once: true });
        if (typeof initSocialSDKs === 'function') initSocialSDKs();
    }, 2000);

    // PC Mode: Re-check on resize crossing the threshold
    if (typeof pcInit === 'function') {
        let lastPCMode = window.innerWidth >= 992;
        window.addEventListener('resize', () => {
            const nowPC = window.innerWidth >= 992;
            if (nowPC && !lastPCMode) window.pcInit();
            else if (!nowPC && lastPCMode) {
                document.documentElement.classList.remove('pc-mode');
                document.body.classList.remove('pc-mode');
                const tf = document.getElementById('tuktukFeed');
                const sf = document.getElementById('standardFeed');
                if (tf) tf.style.display = '';
                if (sf) sf.style.display = 'none';
            }
            lastPCMode = nowPC;
        });
    }

    // Final UI Polish
    if (typeof animateNumber === 'function') {
        animateNumber('totalPosts', window.totalPostsCount || 0);
        animateNumber('totalLikes', window.totalLikesCount || 0);
        animateNumber('todayPosts', window.totalProductsCount || 0);
    }

    // PWA Install Prompt
    if (window.TukTukPWA) window.TukTukPWA.show();

    // Refresh SDKs occasionally
    setInterval(() => {
        if (window.FB && window.FB.XFBML) window.FB.XFBML.parse();
    }, 15000);
});

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
            element.textContent = Math.floor(target).toLocaleString();
            clearInterval(interval);
        } else {
            element.textContent = Math.floor(current).toLocaleString();
        }
    }, duration / steps);
}

function initParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    for (let i = 0; i < 15; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.left = Math.random() * 100 + '%';
        p.style.top = Math.random() * 100 + '%';
        p.style.animationDelay = Math.random() * 5 + 's';
        p.style.opacity = Math.random() * 0.3;
        container.appendChild(p);
    }
}

function triggerWebGreeting() {
    const splash = document.getElementById('welcomeSplash');
    const hub = document.getElementById('launchHubOverlay');
    if (!splash && !hub) return;

    setTimeout(() => {
        if (splash) splash.classList.add('fade-out');
        if (hub) hub.classList.add('fade-out');
        setTimeout(() => {
            if (splash) splash.remove();
            if (hub) hub.remove();
        }, 1000);
    }, 3000);
}

// --- 🎬 UNIFIED AUTOPLAY ENGINE (Matches Flutter VideoPlayer logic) ---
function initAutoPlayObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target.querySelector('video');
            const iframe = entry.target.querySelector('iframe');

            if (entry.isIntersecting) {
                // 1. Vertical Feed Video (.tuktuk-video-item) — handled by initTukTukSlideObserver
                //    in tuktuk_feed_logic.js; skip here to avoid double-play AbortError.
                if (entry.target.classList.contains('tuktuk-video-item')) {
                    if (typeof startSidebarTimer === 'function') {
                        startSidebarTimer(entry.target.id);
                    }
                    return;
                }

                // 2. Standard Feed Video (.news-video-container or .pc4-media)
                if (video && (entry.target.classList.contains('news-video-container') || entry.target.classList.contains('pc4-media') || entry.target.classList.contains('pc4-card'))) {
                    video.muted = true;
                    video.play().catch(e => console.warn("[Autoplay] Video Blocked:", e));
                }

                // 3. YouTube Embeds
                if (iframe && iframe.src.includes('youtube.com')) {
                    iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: '' }), '*');
                }
            } else {
                // Vertical Feed Sidebar Reset (still managed here, no play/pause)
                if (entry.target.classList.contains('tuktuk-video-item')) {
                    if (typeof clearSidebarTimer === 'function') clearSidebarTimer(entry.target.id);
                    const sidebar = entry.target.querySelector('.right-sidebar');
                    if (sidebar) sidebar.classList.remove('actions-hidden');
                    return; // play/pause handled by tuktuk_feed_logic.js
                }

                // Pause non-tuktuk videos when out of view
                // Guard: wait for pending play promise before pausing to avoid AbortError
                if (video && !video.paused) {
                    const p = video._playPromise;
                    if (p) { p.then(() => { try { video.pause(); } catch (_) {} }).catch(() => {}); }
                    else { try { video.pause(); } catch (_) {} }
                }
                if (iframe && iframe.src.includes('youtube.com')) {
                    try {
                        iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: '' }), '*');
                    } catch (_) { }
                }
            }
        });
    }, { threshold: 0.7 });

    // Global interaction state
    window.TukTukInteraction = window.TukTukInteraction || {
        hasInteracted: false,
        isMuted: true
    };

    // Handle Tap to reveal sidebar & Double tap to Like
    let lastTap = 0;
    document.addEventListener('click', (e) => {
        const item = e.target.closest('.tuktuk-video-item');
        if (!item) return;

        // Ignore clicks on sidebar, buttons, or links
        if (e.target.closest('.right-sidebar') || e.target.closest('a') || e.target.closest('button') || e.target.closest('.tuktuk-slide-info')) {
            return;
        }

        const now = Date.now();
        const video = item.querySelector('video');
        const sidebar = item.querySelector('.right-sidebar');
        const postId = item.id.replace('tuktuk-', '');

        // 1. Initial Interaction - Enable Sound
        if (!window.TukTukInteraction.hasInteracted) {
            window.TukTukInteraction.hasInteracted = true;
            window.TukTukInteraction.isMuted = false;
        }

        // 2. Double Tap Logic (Like)
        if (now - lastTap < 300) {
            if (typeof likePost === 'function') {
                const btn = item.querySelector('.action-btn[class*="like-btn-"]');
                if (btn && !btn.classList.contains('liked')) {
                    likePost(postId);
                }
                triggerHeartPop(item, e.clientX, e.clientY);
            }
            lastTap = 0;
            return;
        }
        lastTap = now;

        // 3. Single Tap Logic (Play/Pause + Unmute)
        if (video) {
            if (video.paused) {
                video.muted = window.TukTukInteraction.isMuted;
                video.play().catch(err => console.error("Play failed:", err));
                showPlayPauseIcon(item, 'play');
            } else {
                video.pause();
                showPlayPauseIcon(item, 'pause');
            }
        }

        // 4. Reveal Sidebar if hidden
        if (sidebar && sidebar.classList.contains('actions-hidden')) {
            sidebar.classList.remove('actions-hidden');
            if (typeof startSidebarTimer === 'function') startSidebarTimer(item.id);
        }
    });

    function showPlayPauseIcon(container, type) {
        let icon = container.querySelector('.play-pause-feedback');
        if (!icon) {
            icon = document.createElement('div');
            icon.className = 'play-pause-feedback';
            container.appendChild(icon);
        }
        icon.innerHTML = `<i class="fas fa-${type === 'play' ? 'play' : 'pause'}"></i>`;
        icon.style.opacity = '1';
        icon.style.transform = 'translate(-50%, -50%) scale(1.5)';
        
        setTimeout(() => {
            icon.style.opacity = '0';
            icon.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 500);
    }

    function triggerHeartPop(container, x, y) {
        const heart = document.createElement('div');
        heart.className = 'heart-pop-animation';
        heart.innerHTML = '<i class="fas fa-heart"></i>';
        
        // Ensure it's inside the container and centered
        heart.style.position = 'absolute';
        heart.style.zIndex = '100000';
        
        // If x/y provided (fixed pos relative to viewport), convert or use absolute center
        if (x && y) {
            const rect = container.getBoundingClientRect();
            heart.style.left = (x - rect.left) + 'px';
            heart.style.top = (y - rect.top) + 'px';
        } else {
            heart.style.left = '50%';
            heart.style.top = '50%';
        }
        
        container.appendChild(heart);
        setTimeout(() => heart.remove(), 800);
        if (window.PWA?.haptic) window.PWA.haptic(50);
    }

    // --- Global Mute Sync ---
    window.toggleTuktukGlobalMute = function(e) {
        if (e) e.stopPropagation();
        window.TukTukInteraction.isMuted = !window.TukTukInteraction.isMuted;
        
        // Sync all videos
        document.querySelectorAll('.tuktuk-video-item video').forEach(v => {
            v.muted = window.TukTukInteraction.isMuted;
        });

        // Update UI logic if exists (e.g. from tab-nav-controller)
        if (typeof window.syncVolume === 'function') window.syncVolume();
        
        showNotification(window.TukTukInteraction.isMuted ? 'ปิดเสียงแล้ว' : 'เปิดเสียงแล้ว', 'info');
    };

    const activeTargets = new Set();
    const track = () => {
        const els = document.querySelectorAll('.news-video-container, .tuktuk-video-item, .community-post-media, .pc4-media, .pc4-card');
        els.forEach(el => {
            if (!activeTargets.has(el)) {
                observer.observe(el);
                activeTargets.add(el);
            }
        });
    };

    track();
    setInterval(track, 2000); // Faster re-sync
}

function initSocialSDKs() {
    if (window.sdksInitialized) return;
    window.sdksInitialized = true;

    // Suppress FB SDK unresolved module warnings in LINE browser
    const _origOnError = window.onerror;
    window.onerror = (msg, src, line, col, err) => {
        if (src?.includes('sdk.js') && msg?.includes('unresolved')) return true;
        return _origOnError ? _origOnError(msg, src, line, col, err) : false;
    };

    // Load TikTok SDK
    if (!document.getElementById('tiktok-sdk')) {
        const s = document.createElement('script');
        s.id = 'tiktok-sdk'; s.src = 'https://www.tiktok.com/embed.js';
        s.async = true; document.body.appendChild(s);
    }

    // Load FB SDK (if not LINE or ad-blocked)
    const isLine = /Line/i.test(navigator.userAgent);
    if (!isLine && !document.getElementById('fb-sdk')) {
        const s = document.createElement('script');
        s.id = 'fb-sdk'; s.src = 'https://connect.facebook.net/th_TH/sdk.js';
        s.async = true; s.defer = true; s.crossOrigin = 'anonymous';
        s.onload = () => { if (window.FB) window.FB.init({ xfbml: true, version: 'v19.0' }); };
        document.body.appendChild(s);
    }
}


// --- Toast + SPA Navigation + Pull to Refresh (from index.html) ---
// quickCreate and handleQuickCapture logic moved to js/persistent-ui.js

function showNotification(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `custom-toast ${type}`;
    toast.innerHTML = `
            <i class="fas ${type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
            `;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// Toast CSS is injected by new-scripts.js — duplicate removed to prevent
// "toastStyle already declared" SyntaxError when both deferred scripts share global scope.

// Initialize Social SDKs once (Deferred)
window.addEventListener('load', () => {
    initSocialSDKs();
    initPullToRefresh();
    initNotifications(); // Activate notifications
});

// Pull to Refresh — TukTuk Taxi + Haptic only
function initPullToRefresh() {
    if (window._ptrInitialized) return;
    window._ptrInitialized = true;

    const ptr = document.getElementById('pullToRefresh');
    if (!ptr) return;

    const THRESHOLD   = 85;   // px — distance to trigger refresh
    const SHOW_AT     = 22;   // px — show icon
    const HAPTIC_STEP = 28;   // px — vibrate tick every N px pulled

    let startY       = 0;
    let pulling      = false;
    let isReady      = false;
    let lastHapticY  = 0;
    let refreshing   = false;

    function _haptic(pattern) {
        if (navigator.vibrate) navigator.vibrate(pattern);
    }

    function _setState(state) {
        ptr.classList.remove('ptr-pulling', 'ptr-ready', 'ptr-refreshing');
        if (state) ptr.classList.add(state);
    }

    function _hide() {
        ptr.classList.remove('ptr-show');
        _setState(null);
        pulling = false;
        isReady = false;
        refreshing = false;
    }

    // Check if user is at top of scroll (fixed-feed uses scrollTop, window stays 0)
    function _atTop() {
        if (window.scrollY > 2) return false;
        const feed = document.getElementById('tuktukFeed');
        // Don't trigger pull-to-refresh while TukTuk feed has slides (it owns its own scroll)
        if (feed && feed.querySelector('.tuktuk-video-item')) return false;
        if (feed && feed.scrollTop > 2) return false;
        return true;
    }

    document.addEventListener('touchstart', (e) => {
        if (refreshing) return;
        if (!_atTop()) return;
        startY      = e.touches[0].pageY;
        lastHapticY = 0;
        pulling     = true;
        isReady     = false;
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
        if (!pulling || refreshing) return;
        if (!_atTop()) { _hide(); return; }

        const pull = e.touches[0].pageY - startY;
        if (pull <= 0) { ptr.style.setProperty('--ptr-p', '0'); return; }

        // Update dual-line progress bar (0→1)
        ptr.style.setProperty('--ptr-p', Math.min(pull / THRESHOLD, 1).toFixed(3));

        // Show icon
        if (pull > SHOW_AT) {
            ptr.classList.add('ptr-show');
        }

        // Progressive haptic ticks while pulling
        if (pull > lastHapticY + HAPTIC_STEP) {
            lastHapticY = pull;
            _haptic(5);
        }

        if (pull >= THRESHOLD && !isReady) {
            // Threshold reached — ready state
            isReady = true;
            _setState('ptr-ready');
            _haptic([18, 10, 18]);   // double pulse
        } else if (pull < THRESHOLD && !isReady) {
            _setState('ptr-pulling');
        }
    }, { passive: true });

    document.addEventListener('touchend', async () => {
        if (!pulling || refreshing) return;
        pulling = false;

        if (!isReady) {
            // Not enough pull — dismiss
            _hide();
            return;
        }

        // Trigger refresh
        refreshing = true;
        isReady    = false;
        _setState('ptr-refreshing');
        _haptic([30, 15, 30, 15, 40]);   // confirm pattern

        try {
            // Always clear cache so PTR fetches fresh data from Firestore
            if (typeof window.clearFeedCache === 'function') window.clearFeedCache();

            const cat = sessionStorage.getItem('tuktuk_last_category') || 'all';
            if (typeof window.initTukTukFeed === 'function') await window.initTukTukFeed(cat, true);
            else if (typeof window.switchCategory === 'function') window.switchCategory(cat);
            else if (typeof loadPosts === 'function') await loadPosts(false);
        } catch (_) {}

        // Brief pause so "drive" animation plays then fade out
        await new Promise(r => setTimeout(r, 600));
        _hide();
    });

    // ── Expose PTR animation for programmatic triggers (e.g. drawer refresh) ──
    // window.triggerPTRRefresh(asyncCallback) — shows taxi animation, runs callback,
    // then hides. If PTR is already refreshing, callback still runs (no double anim).
    window.triggerPTRRefresh = async function(callback) {
        if (refreshing) {
            if (typeof callback === 'function') await callback();
            return;
        }
        refreshing = true;
        _setState('ptr-refreshing');
        ptr.classList.add('ptr-show');
        if (navigator.vibrate) navigator.vibrate([30, 15, 30, 15, 40]);

        try {
            if (typeof callback === 'function') await callback();
        } catch (_) {}

        await new Promise(r => setTimeout(r, 700));
        _hide();   // resets refreshing = false internally
    };
}

// --- Redundant SPA Logic Removed (Using dedicated js/spa-router.js) ---
const _RESERVED_APP_STATE = {};


// --- In-Page Chat Panel + SW Registration (from index.html) ---
(function () {
    'use strict';

    /* ── State ── */
    let _open = false;
    let _currentView = 'list';           // 'list' | 'thread'
    let _currentConvId = null;
    let _currentCollection = 'conversations';
    let _myUid = null;
    let _unsubConvs = null;              // unsubscribe: conversation list
    let _unsubMsgs = null;              // unsubscribe: message thread
    let _unsubOnline = null;
    let _unsubTyping = null;
    let _allConvs = [];                 // cached for search filter
    let _typingTimeout = null;

    /* ── Helpers ── */
    function getMyUid() {
        if (_myUid) return _myUid;
        try {
            const u = typeof WizmobizAuth !== 'undefined' ? WizmobizAuth.getUser() : null;
            if (u) _myUid = u.uid || u.lineUserId || null;
        } catch (_) { }
        return _myUid;
    }

    function timeLabel(ts) {
        if (!ts) return '';
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        const now = new Date();
        const diff = now - d;
        if (diff < 60000) return 'เมื่อกี้';
        if (diff < 3600000) return Math.floor(diff / 60000) + ' นาที';
        if (diff < 86400000) return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
        return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
    }

    function scrollToBottom() {
        const area = document.getElementById('icMessages');
        if (area) {
            requestAnimationFrame(() => {
                area.scrollTop = area.scrollHeight;
            });
        }
    }

    /* ── Open / Close ── */
    window.openInChat = function () {
        const panel = document.getElementById('inChatPanel');
        const overlay = document.getElementById('inChatOverlay');
        if (!panel) return;
        panel.classList.add('open');
        overlay.classList.add('active');
        _open = true;
        if (_currentView === 'list') icStartListening();
    };

    window.closeInChat = function () {
        const panel = document.getElementById('inChatPanel');
        const overlay = document.getElementById('inChatOverlay');
        if (panel) panel.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
        _open = false;
    };

    /* ── Back to List ── */
    window.icBackToList = function () {
        if (_unsubMsgs) { _unsubMsgs(); _unsubMsgs = null; }
        if (_unsubOnline) { _unsubOnline(); _unsubOnline = null; }
        document.getElementById('icListView').style.display = 'flex';
        document.getElementById('icThreadView').style.display = 'none';
        _currentView = 'list';
        _currentConvId = null;
    };

    /* ── Listen to Conversation List ── */
    function icStartListening() {
        const uid = getMyUid();
        if (!uid || typeof TukTukChat === 'undefined') {
            showListEmpty();
            return;
        }
        if (_unsubConvs) return; // already listening

        // Listen to DM conversations
        let _dmConvs = [], _prodConvs = [];
        const merge = () => {
            const seen = new Set();
            _allConvs = [..._dmConvs, ..._prodConvs].filter(c => {
                if (seen.has(c.id)) return false;
                seen.add(c.id); return true;
            }).sort((a, b) => {
                const ta = a.lastMessageAt?.toMillis?.() || 0;
                const tb = b.lastMessageAt?.toMillis?.() || 0;
                return tb - ta;
            });
            icRenderList(_allConvs);
        };

        _unsubConvs = TukTukChat.listenConversations(uid, convs => {
            _dmConvs = convs.map(c => ({ ...c, _col: 'conversations' }));
            merge();
        });

        // Also listen product chats
        const unsubProd = TukTukChat.listenProductChats(uid, chats => {
            _prodConvs = chats.map(c => ({ ...c, _col: 'product_chats' }));
            merge();
        });
        // Store combined unsub
        const origUnsub = _unsubConvs;
        _unsubConvs = () => { origUnsub(); unsubProd(); };
    }

    /* ── Render Conversation List ── */
    function icRenderList(convs) {
        const loader = document.getElementById('icListLoader');
        const empty = document.getElementById('icListEmpty');
        const list = document.getElementById('icConvList');
        if (loader) loader.style.display = 'none';

        if (!convs.length) {
            if (empty) empty.style.display = 'flex';
            return;
        }
        if (empty) empty.style.display = 'none';

        const uid = getMyUid();
        // Remove old rows (keep loader+empty)
        list.querySelectorAll('.ic-conv-row').forEach(el => el.remove());

        convs.forEach(conv => {
            const col = conv._col || 'conversations';
            const isDM = col === 'conversations';
            const unread = isDM
                ? (conv[`unreadCount_${uid}`] || 0)
                : (conv._role === 'buyer' ? (conv.unreadCountBuyer || 0) : (conv.unreadCountSeller || 0));

            const otherUid = isDM
                ? (conv.participants || []).find(p => p !== uid) || ''
                : (conv._role === 'buyer' ? conv.sellerId : conv.buyerId) || '';

            const name = conv.otherName || conv.shopName || conv.sellerName || conv.buyerName
                || (otherUid ? otherUid.substring(0, 10) + '...' : 'ผู้ใช้');
            const preview = conv.lastMessage || (isDM ? 'เริ่มบทสนทนา...' : conv.productName || 'สินค้า');
            const timeStr = timeLabel(conv.lastMessageAt);
            const avatarUrl = conv.otherAvatar || conv.sellerAvatar || conv.buyerAvatar || '';
            const productName = !isDM ? (conv.productName || '') : '';

            const row = document.createElement('div');
            row.className = 'ic-conv-row' + (unread > 0 ? ' unread' : '');
            row.dataset.convId = conv.id;
            row.innerHTML = `
                    <div class="ic-av">
                        ${avatarUrl ? `<img src="${avatarUrl}" loading="lazy" onerror="this.style.display='none'">` : '<i class="fas fa-user"></i>'}
                    </div>
                    <div class="ic-conv-meta">
                        <div class="ic-conv-name">${productName ? '🛒 ' + productName : name}</div>
                        <div class="ic-conv-preview">${preview}</div>
                    </div>
                    <div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px;flex-shrink:0;">
                        <div class="ic-conv-time">${timeStr}</div>
                        ${unread > 0 ? `<div class="ic-conv-badge">${unread > 99 ? '99+' : unread}</div>` : ''}
                    </div>`;
            row.addEventListener('click', () => icOpenThread(conv.id, col, productName || name, otherUid, avatarUrl));
            list.appendChild(row);
        });

        // Update FAB badge
        const total = convs.reduce((sum, c) => {
            const uid2 = getMyUid();
            const col = c._col || 'conversations';
            return sum + (col === 'conversations'
                ? (c[`unreadCount_${uid2}`] || 0)
                : (c._role === 'buyer' ? (c.unreadCountBuyer || 0) : (c.unreadCountSeller || 0)));
        }, 0);
        const fab = document.getElementById('icFabBadge');
        if (fab) {
            if (total > 0) { fab.style.display = 'flex'; fab.textContent = total > 99 ? '99+' : total; }
            else { fab.style.display = 'none'; }
        }
        if (typeof window.updatePillChatCount === 'function') window.updatePillChatCount(total);
    }

    function showListEmpty() {
        const loader = document.getElementById('icListLoader');
        const empty = document.getElementById('icListEmpty');
        if (loader) loader.style.display = 'none';
        if (empty) empty.style.display = 'flex';
    }

    /* ── Search / Filter ── */
    window.icFilterConvs = function (query) {
        const q = query.trim().toLowerCase();
        if (!q) { icRenderList(_allConvs); return; }
        const filtered = _allConvs.filter(c => {
            const name = (c.otherName || c.shopName || c.productName || '').toLowerCase();
            const preview = (c.lastMessage || '').toLowerCase();
            return name.includes(q) || preview.includes(q);
        });
        icRenderList(filtered);
    };

    /* ── Open Message Thread ── */
    window.icOpenThread = function (convId, collection, displayName, otherUid, avatarUrl) {
        _currentConvId = convId;
        _currentCollection = collection || 'conversations';
        _currentView = 'thread';

        // Switch view
        document.getElementById('icListView').style.display = 'none';
        const threadView = document.getElementById('icThreadView');
        threadView.style.display = 'flex';

        // Set header
        document.getElementById('icThreadName').textContent = displayName || 'ผู้ใช้';
        document.getElementById('icThreadStatus').textContent = 'กำลังโหลด...';
        document.getElementById('icThreadStatus').className = 'ic-thread-status';
        const avEl = document.getElementById('icThreadAvatar');
        if (avatarUrl) {
            avEl.innerHTML = `<img src="${avatarUrl}" loading="lazy" onerror="this.innerHTML='<i class=\\"fas fa-user\\"></i>'">`;
        } else {
            avEl.innerHTML = '<i class="fas fa-user"></i>';
        }

        // Clear old messages and load draft
        const msgInput = document.getElementById('icMsgInput');
        document.getElementById('icMessages').innerHTML = '';
        msgInput.value = (typeof TukTukChat !== 'undefined') ? TukTukChat.getDraft(convId) : '';

        // Mark as read
        const uid = getMyUid();
        if (uid && typeof TukTukChat !== 'undefined') {
            TukTukChat.markAsRead(convId, _currentCollection, uid);
        }

        // Online status
        if (_unsubOnline) { _unsubOnline(); _unsubOnline = null; }
        if (otherUid && typeof TukTukChat !== 'undefined') {
            _unsubOnline = TukTukChat.listenOnlineStatus(otherUid, isOnline => {
                const el = document.getElementById('icThreadStatus');
                if (!el) return;
                el.textContent = isOnline ? 'ออนไลน์อยู่' : 'ออฟไลน์';
                el.className = 'ic-thread-status' + (isOnline ? ' online' : '');
            });
        } else {
            const el = document.getElementById('icThreadStatus');
            if (el) { el.textContent = ''; }
        }

        // Listen to messages
        if (_unsubMsgs) { _unsubMsgs(); _unsubMsgs = null; }
        if (typeof TukTukChat !== 'undefined') {
            let _firstLoad = true;
            _unsubMsgs = TukTukChat.listenMessages(convId, _currentCollection, msgs => {
                const prevCount = document.querySelectorAll('.ic-msg-bubble').length;
                icRenderMessages(msgs);
                if (!_firstLoad && msgs.length > prevCount) {
                    const lastMsg = msgs[msgs.length - 1];
                    if (lastMsg.senderId !== uid) {
                        playNotifSound();
                    }
                }
                _firstLoad = false;
            });
        }


        // Listen typing (DM only)
        if (_unsubTyping) { _unsubTyping(); _unsubTyping = null; }
        if (_currentCollection === 'conversations' && otherUid) {
            _unsubTyping = db.collection('conversations').doc(convId)
                .onSnapshot(snap => {
                    const typing = snap.data()?.typing || {};
                    const theyTyping = typing[otherUid] === true;
                    const bar = document.getElementById('icTypingBar');
                    if (bar) bar.style.display = theyTyping ? 'flex' : 'none';
                }, () => { });
        }
    };

    /* ── Render Messages ── */
    function icRenderMessages(msgs) {
        const uid = getMyUid();
        const area = document.getElementById('icMessages');
        if (!area) return;

        const atBottom = area.scrollHeight - area.scrollTop - area.clientHeight < 80;
        area.innerHTML = '';
        let lastDateStr = '';

        msgs.forEach(msg => {
            const ts = msg.timestamp || msg.sentAt;
            const d = ts?.toDate ? ts.toDate() : (ts ? new Date(ts) : new Date());
            const dateStr = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });

            if (dateStr !== lastDateStr) {
                lastDateStr = dateStr;
                const div = document.createElement('div');
                div.className = 'ic-msg-date-divider';
                div.textContent = dateStr;
                area.appendChild(div);
            }

            const isMine = msg.senderId === uid;
            const bubble = document.createElement('div');
            bubble.className = 'ic-msg-bubble ' + (isMine ? 'mine' : 'theirs');
            const timeStr = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

            // Status icon (Seen logic)
            const status = msg.status || (msg.isRead ? 'read' : 'sent');
            const statusIcon = isMine ? `<i class="fas fa-check-double ic-status-icon ${status === 'read' ? 'read' : 'sent'}"></i>` : '';

            // Handle image messages
            if (msg.type === 'image' && msg.imageUrl) {
                bubble.innerHTML = `<img src="${msg.imageUrl}" style="max-width:200px;border-radius:12px;display:block;box-shadow: 0 4px 15px rgba(0,0,0,0.2);" loading="lazy">
                        <div class="ic-msg-time">${timeStr} ${statusIcon}</div>`;
            } else {
                bubble.innerHTML = `${(msg.text || '').replace(/</g, '&lt;').replace(/\n/g, '<br>')}
                        <div class="ic-msg-time">${timeStr} ${statusIcon}</div>`;
            }
            area.appendChild(bubble);
        });


        if (atBottom || msgs.length <= 5) scrollToBottom();
    }

    /* ── Send Message ── */
    window.icSend = function () {
        const input = document.getElementById('icMsgInput');
        const text = (input?.value || '').trim();
        if (!text || !_currentConvId) return;
        input.value = '';
        const session = typeof WizmobizAuth !== 'undefined' ? WizmobizAuth.getUser() : null;
        if (!session || typeof TukTukChat === 'undefined') return;
        TukTukChat.sendMessage(_currentConvId, _currentCollection, text, session)
            .catch(err => console.warn('[chat] send failed:', err));
    };

    /* ── Typing indicator & Drafts ──────────────────────── */
    window.icOnType = function () {
        if (!_currentConvId) return;
        const input = document.getElementById('icMsgInput');
        const text = input.value;

        // Save Draft
        if (typeof TukTukChat !== 'undefined') {
            TukTukChat.saveDraft(_currentConvId, text);
        }

        // Typing Indicator
        if (_currentCollection !== 'conversations') return;
        const uid = getMyUid();
        if (!uid || typeof TukTukChat === 'undefined') return;
        TukTukChat.handleTypingInput(_currentConvId, _currentCollection, uid);
    };

    /* ── File Upload ── */
    window.icHandleFileUpload = async function (input) {
        if (!input.files || !input.files[0] || !_currentConvId) return;
        const file = input.files[0];
        const sendBtn = document.getElementById('icSendBtn');
        const progressBar = document.getElementById('icUploadProgress');

        try {
            sendBtn.disabled = true;
            progressBar.style.display = 'block';
            progressBar.style.width = '30%';

            const res = await TukTukChat.uploadFile(file);
            progressBar.style.width = '100%';

            const session = typeof WizmobizAuth !== 'undefined' ? WizmobizAuth.getUser() : null;
            await TukTukChat.sendMessage(_currentConvId, _currentCollection, '', session, res);

            setTimeout(() => {
                progressBar.style.display = 'none';
                progressBar.style.width = '0';
            }, 1000);
        } catch (err) {
            console.error('[chat] upload failed:', err);
            showNotification('อัปโหลดล้มเหลว กรุณาลองใหม่', 'error');
        } finally {
            sendBtn.disabled = false;
            input.value = '';
        }
    };

    /* ── Init: auto-start listening for unread badge updates ── */
    function icAutoInit() {
        const uid = getMyUid();
        if (!uid || typeof TukTukChat === 'undefined') return;
        TukTukChat.listenTotalUnread(uid, total => {
            const fab = document.getElementById('icFabBadge');
            if (fab) {
                if (total > 0) { fab.style.display = 'flex'; fab.textContent = total > 99 ? '99+' : total; }
                else { fab.style.display = 'none'; }
            }
            if (typeof window.updatePillChatCount === 'function') window.updatePillChatCount(total);
        });
    }

    // Wait for auth
    let _initAttempts = 0;
    function waitAndInit() {
        if (getMyUid()) { icAutoInit(); return; }
        if (_initAttempts++ < 20) setTimeout(waitAndInit, 500);
    }
    setTimeout(waitAndInit, 1000);

    // PC nav chat icon click
    const pcChatIcon = document.querySelector('[onclick*="messages.html"]');
    if (pcChatIcon) {
        pcChatIcon.removeAttribute('href');
        pcChatIcon.addEventListener('click', e => { e.preventDefault(); openInChat(); });
    }

})();

// SW registration handled by pwa-manager.js

// --- PWA Init (from index.html) ---
document.addEventListener('DOMContentLoaded', () => {
    if (window.TukTukPWA) window.TukTukPWA.show();
});


// --- SW Message Handler (from index.html) ---
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', event => {
        const { type, url, action, data } = event.data || {};
        if (type !== 'NOTIF_CLICK') return;

        // Clear badge when user opens app from notification
        if (window.TukTukNotify) window.TukTukNotify.clearBadge();

        // If same-origin URL is different from current → navigate
        try {
            const target = new URL(url, location.origin);
            if (target.pathname !== location.pathname || target.search !== location.search) {
                location.href = url;
                return;
            }
        } catch (_) { }

        // Same page — open relevant panel
        if (action === 'reply' || (url && url.includes('messages'))) {
            if (typeof openInChat === 'function') openInChat();
        } else if (url && url.includes('seller-dashboard')) {
            location.href = url;
        }
    });
}


// --- PC Layout V2 JavaScript Engine (from index.html) ---
(function () {
    'use strict';

    /* ── Helpers ─────────────────────────────────────────── */
    function pcFmt(ts) {
        if (!ts) return '';
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        const diff = Math.floor((Date.now() - d) / 1000);
        if (diff < 60) return 'เพิ่งโพสต์';
        if (diff < 3600) return Math.floor(diff / 60) + ' นาทีที่แล้ว';
        if (diff < 86400) return Math.floor(diff / 3600) + ' ชั่วโมงที่แล้ว';
        return Math.floor(diff / 86400) + ' วันที่แล้ว';
    }
    function esc(s) {
        const d = document.createElement('div');
        d.textContent = s || '';
        return d.innerHTML;
    }

    /* ── Nav active helper ─ defined in pc-feed-engine.js ── */
    /* window.setPCNav removed: duplicate of pc-feed-engine.js:723 */

    /* ── Switch to TikTok video feed ─────────────────────── */
    window.pcSwitchToVideoFeed = function (category = 'all', explicitForceRefresh = false) {
        if (window.innerWidth < 768) return; // Only apply on tablet/desktop
        
        console.log('[PC-FEED] Switching to video feed:', category);

        // Reposition into the center column for Desktop layout
        const mainContent = document.querySelector('main.main-content');
        const containers = ['tuktukFeed', 'tuktukFeedNearMe', 'tuktukFeedCommunity'];
        
        if (mainContent) {
            containers.forEach(id => {
                const feedNode = document.getElementById(id);
                if (feedNode) {
                    if (feedNode.parentNode !== mainContent) {
                        feedNode.classList.add('in-pc-layout');
                        mainContent.appendChild(feedNode);
                    }
                }
            });
        }
        
        const sf = document.getElementById('standardFeed');
        const pc = document.getElementById('pcSocialContent');
        
        if (sf) sf.style.display = 'none';
        if (pc) pc.style.display = 'none';
        
        // Map category to accurate container ID
        const targetIdMap = {
            'all': 'tuktukFeed',
            'near_me': 'tuktukFeedNearMe',
            'community': 'tuktukFeedCommunity'
        };
        const activeId = targetIdMap[category] || 'tuktukFeed';

        // Visibility control: only show the one we want & force correct app layout for video feed
        containers.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                if (id === activeId) {
                    el.style.setProperty('display', 'flex', 'important');
                    el.style.setProperty('height', '100vh', 'important'); // force 100vh for video feed
                    el.classList.add('tuktuk-feed');
                } else {
                    el.style.setProperty('display', 'none', 'important');
                }
            }
        });

        // Hide PC standard wrapper padding when inside video feed
        const appContainer = document.querySelector('.main-app-container');
        if (appContainer) {
            appContainer.style.setProperty('padding', '0', 'important');
            // Remove overflow visible overrides to let the video feed snap scroll work
            document.documentElement.style.setProperty('overflow', 'hidden', 'important');
            document.body.style.setProperty('overflow', 'hidden', 'important');
        }

        // Ensure the feed initializes when switching to this view
        if (typeof window.initTukTukFeed === 'function') {
            const currentCat = window.sessionStorage.getItem('tuktuk_last_category');
            const forceRefresh = explicitForceRefresh || (currentCat !== category);

            window.sessionStorage.setItem('tuktuk_last_category', category);

            // PC: near_me requires a province to be selected first
            if (category === 'near_me') {
                const savedProvince = localStorage.getItem('selectedProvince');
                if (!savedProvince) {
                    if (typeof window.showProvincePicker === 'function') {
                        window.showProvincePicker();
                    }
                    return; // Wait for user to pick province before loading feed
                }
            }

            window.initTukTukFeed(category, forceRefresh);
        }
    };

    /* ── Build PC post card — uses pc4-card class to match pc-feed-fix.css ─── */
    function pcBuildPostCard(post) {
        const isLiked = (window.userLikedIds || []).includes(post.id);
        const avatar  = post.authorPhotoURL || post.authorAvatar || 'assets/images/logo.png';
        const name    = esc(post.authorName || post.authorDisplayName || 'ผู้ใช้ TukTuk');
        const time    = pcFmt(post.createdAt);
        const title   = esc(post.title || '');
        const content = esc((post.content || post.description || '').substring(0, 400));
        const likes   = (post.likes || 0).toLocaleString();
        const cmts    = (post.commentsCount || post.commentCount || post.comments || 0).toLocaleString();
        const views   = (post.views || post.viewCount || 0).toLocaleString();
        const aid     = post.authorId || '';

        /* ── Media ── */
        let mediaHtml = '';
        const allMedia = [];
        if (post.images && Array.isArray(post.images)) {
            post.images.forEach(m => {
                const url  = (typeof m === 'object' ? m.url : m) || '';
                const type = (typeof m === 'object' ? m.type : (url.toLowerCase().includes('.mp4') ? 'video' : 'image')) || 'image';
                if (url) allMedia.push({ url, type });
            });
        }
        const directVid = post.videoUrl || post.video_url || '';
        const ytVid     = post.youtubeUrl || post.youtube_url || '';
        if (ytVid) allMedia.unshift({ url: ytVid, type: 'youtube' });
        else if (directVid) allMedia.unshift({ url: directVid, type: 'video' });
        if (allMedia.length === 0 && (post.imageUrl || post.image_url))
            allMedia.push({ url: post.imageUrl || post.image_url, type: 'image' });

        const primaryVideo = allMedia.find(m => m.type === 'video' || m.type === 'youtube');
        const primaryImg   = allMedia.find(m => m.type === 'image')?.url || null;
        const extraImgs    = allMedia.filter(m => m.type === 'image').slice(1);

        if (primaryVideo) {
            const vid  = primaryVideo.url;
            const ytId = vid.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=))([\w-]+)/)?.[1];
            if (primaryVideo.type === 'youtube' || ytId) {
                mediaHtml = `<div class="pc4-media"><iframe src="https://www.youtube.com/embed/${ytId||vid}?autoplay=0&mute=1" allow="autoplay;encrypted-media" allowfullscreen loading="lazy"></iframe></div>`;
            } else {
                mediaHtml = `<div class="pc4-media"><video src="${vid}" ${primaryImg?`poster="${primaryImg}"`:''}controls muted loop playsinline></video></div>`;
            }
        } else if (allMedia.filter(m=>m.type==='image').length > 1) {
            const imgs = allMedia.filter(m=>m.type==='image');
            const gridClass = imgs.length===2?'grid-2':imgs.length===3?'grid-3':'grid-4';
            const cells = imgs.slice(0,4).map((m,i) =>
                `<div class="pc4-media-cell">${i===3&&imgs.length>4?`<div class="pc4-media-more">+${imgs.length-4}</div>`:''}<img src="${m.url}" loading="lazy" onerror="this.parentElement.style.display='none'"></div>`
            ).join('');
            mediaHtml = `<div class="pc4-media-grid ${gridClass}">${cells}</div>`;
        } else if (primaryImg) {
            mediaHtml = `<div class="pc4-media single" onclick="window.location.href='channel.html?userId=${aid}'"><img src="${primaryImg}" loading="lazy" onerror="this.parentElement.style.display='none'"></div>`;
        }

        const likedCls = isLiked ? 'liked' : '';
        const liIcon   = isLiked ? 'fas' : 'far';

        return `<div class="pc4-card" id="ppc-${post.id}">
            <div class="pc4-header">
                <div class="pc4-avatar-wrap" onclick="window.location.href='channel.html?userId=${aid}'">
                    <img class="pc4-avatar" src="${avatar}" onerror="this.src='assets/images/logo.png'">
                </div>
                <div class="pc4-meta">
                    <div class="pc4-author-row">
                        <a class="pc4-author" href="channel.html?userId=${aid}">${name}</a>
                    </div>
                    <div class="pc4-time"><i class="far fa-clock"></i> ${time}</div>
                </div>
                <button class="pc4-more" onclick="event.stopPropagation();if(window.togglePostMenu)window.togglePostMenu('${post.id}',event)" title="ตัวเลือก">
                    <i class="fas fa-ellipsis-h"></i>
                </button>
            </div>
            <div class="pc4-body">
                ${title   ? `<div class="pc4-title">${title}</div>` : ''}
                ${content ? `<div class="pc4-content">${content}</div>` : ''}
            </div>
            ${mediaHtml}
            <div class="pc4-stats">
                <div class="pc4-stats-left">
                    <div class="pc4-react-icon"><i class="fas fa-thumbs-up"></i></div>
                    <span class="pc4-stat-likes">${likes} ถูกใจ</span>
                </div>
                <div class="pc4-stats-right">
                    <span class="pc4-stat-item" onclick="event.stopPropagation();if(window.openComments)window.openComments('${post.id}')">
                        <i class="fas fa-comment"></i> ${cmts}
                    </span>
                    <span class="pc4-stat-item"><i class="fas fa-eye"></i> ${views}</span>
                </div>
            </div>
            <div class="pc4-divider"></div>
            <div class="pc4-actions">
                <button class="pc4-action-btn ${likedCls} like-btn-${post.id}"
                        onclick="event.stopPropagation();if(window.pcToggleLike)window.pcToggleLike('${post.id}',this)">
                    <i class="${liIcon} fa-thumbs-up"></i> ถูกใจ
                </button>
                <button class="pc4-action-btn"
                        onclick="event.stopPropagation();if(window.openComments)window.openComments('${post.id}')">
                    <i class="far fa-comment-dots"></i> ความเห็น
                </button>
                <button class="pc4-action-btn"
                        onclick="event.stopPropagation();if(window.sharePost)window.sharePost('${post.id}','${esc(post.title||'')}')">
                    <i class="fas fa-share-alt"></i> แชร์
                </button>
                <button class="pc4-action-btn primary"
                        onclick="event.stopPropagation();window.location.href='channel.html?postId=${post.id}'">
                    อ่านต่อ <i class="fas fa-chevron-right" style="font-size:9px;"></i>
                </button>
            </div>
        </div>`;
    }

    /* ── Like toggle ─────────────────────────────────────── */
    window.pcToggleLike = async function (postId, btn) {
        if (!window.db || !window.currentUserId) {
            alert('กรุณาเข้าสู่ระบบก่อนกดถูกใจ');
            return;
        }
        try {
            const ref = window.db.collection('posts').doc(postId);
            const liked = btn.classList.contains('liked');
            const delta = liked ? -1 : 1;
            await ref.update({ likes: window.firebase.firestore.FieldValue.increment(delta) });
            btn.classList.toggle('liked', !liked);

            const statsEl = document.querySelector(`#ppc-${postId} .ppc-stats-left span`);
            if (statsEl) {
                const cur = parseInt(statsEl.textContent) || 0;
                statsEl.textContent = (cur + delta).toLocaleString() + ' ถูกใจ';
            }
        } catch (e) { console.warn('pcToggleLike:', e); }
    };

    /* ── Share post ──────────────────────────────────────── */
    window.pcSharePost = function (postId, title) {
        const url = `${location.origin}${location.pathname}?postId=${postId}`;
        if (navigator.share) {
            navigator.share({ title: title || 'TukTuk โพสต์', url }).catch(() => { });
        } else {
            navigator.clipboard.writeText(url).then(() => {
                const t = document.createElement('div');
                t.textContent = '✅ คัดลอกลิงก์แล้ว';
                Object.assign(t.style, {
                    position: 'fixed', bottom: '80px', left: '50%',
                    transform: 'translateX(-50%)', background: '#1f2937', color: 'white',
                    padding: '10px 20px', borderRadius: '8px', zIndex: '99999',
                    fontFamily: 'Kanit,sans-serif', fontSize: '0.9rem'
                });
                document.body.appendChild(t);
                setTimeout(() => t.remove(), 2500);
            });
        }
    };

    /* ── Load & render PC social feed ────────────────────── */
    let _pcLastDoc = null;
    let _pcLoading = false;

    /* ── pcLoadSocialFeed is now handled entirely by pc-feed-engine.js ── */

    /* ── Stories from Firestore ──────────────────────────── */
    async function pcLoadStories() {
        const bar = document.getElementById('pcStoriesBar');
        if (!bar || !window.db) return;

        // Add Story button
        let html = `<div class="pc-story-add-btn" onclick="openPostModal ? openPostModal() : null">
                <div class="pc-story-add-btn-plus"><i class="fas fa-plus"></i></div>
                <div class="pc-story-add-label">เพิ่มเรื่องราว</div>
            </div>`;

        try {
            const snap = await window.db.collection('posts')
                .where('published', '==', true)
                .orderBy('createdAt', 'desc')
                .limit(15)
                .get();

            const withImg = snap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .filter(p => {
                    const imgs = p.images || (p.imageUrl ? [p.imageUrl] : []);
                    return imgs.length > 0;
                })
                .slice(0, 6);

            withImg.forEach(post => {
                const imgs = post.images || (post.imageUrl ? [post.imageUrl] : []);
                const img = typeof imgs[0] === 'object' ? imgs[0].url : imgs[0];
                const avatar = post.authorPhotoURL || post.authorAvatar || 'assets/images/logo.png';
                const name = (post.authorName || 'ผู้ใช้').substring(0, 12);
                html += `<div class="pc-story-card"
                        onclick="window.location.href='channel.html?postId=${post.id}'"
                        title="${esc(post.title || name)}">
                        <img src="${img}" onerror="this.src='assets/images/logo.png'" loading="lazy">
                        <div class="pc-story-overlay"></div>
                        <img src="${avatar}" class="pc-story-avatar" onerror="this.src='assets/images/logo.png'">
                        <div class="pc-story-name">${esc(name)}</div>
                    </div>`;
            });
        } catch (e) { console.warn('pcLoadStories:', e); }

        bar.innerHTML = html;
    }

    /* ── Trending sellers from Firestore ─────────────────── */
    async function pcLoadTrendingSellers() {
        const el = document.getElementById('pcTrendingSellers');
        if (!el || !window.db) return;
        try {
            const snap = await window.db.collection('seller_profiles')
                .where('isVerified', '==', true)
                .orderBy('totalSales', 'desc')
                .limit(5)
                .get();

            if (snap.empty) {
                el.innerHTML = '<div style="color:#9ca3af;font-size:0.82rem;text-align:center;padding:8px">ยังไม่มีข้อมูลร้านค้า</div>';
                return;
            }
            el.innerHTML = snap.docs.map(d => {
                const s = d.data();
                const avatar = s.logoUrl || s.profileImage || 'assets/images/logo.png';
                const name = esc(s.shopName || 'ร้านค้า');
                const sales = (s.totalSales || 0).toLocaleString();
                const stars = s.rating ? `⭐ ${parseFloat(s.rating).toFixed(1)}` : '';
                return `<div class="pc-seller-row" onclick="window.location.href='marketplace.html?seller=${d.id}'">
                        <img class="pc-seller-avatar" src="${avatar}" onerror="this.src='assets/images/logo.png'" loading="lazy">
                        <div class="pc-seller-info">
                            <div class="pc-seller-name">${name}</div>
                            <div class="pc-seller-meta">${stars ? stars + ' · ' : ''}${sales} ออเดอร์</div>
                        </div>
                    </div>`;
            }).join('');
        } catch (e) {
            // fallback: try without orderBy (index may not exist)
            el.innerHTML = '<div style="color:#9ca3af;font-size:0.82rem;text-align:center;padding:8px">โหลดร้านค้าไม่ได้</div>';
        }
    }

    /* ── Online contacts from Firestore ──────────────────── */
    async function pcLoadContacts() {
        const el = document.getElementById('pcContactList');
        if (!el || !window.db) return;
        try {
            const snap = await window.db.collection('users')
                .where('isOnline', '==', true)
                .limit(6)
                .get();

            if (snap.empty) {
                el.innerHTML = '<div style="color:#9ca3af;font-size:0.82rem;text-align:center;padding:8px">ไม่มีผู้ใช้ออนไลน์ขณะนี้</div>';
                return;
            }
            el.innerHTML = snap.docs.map(d => {
                const u = d.data();
                const avatar = u.photoURL || u.profileImage || 'assets/images/logo.png';
                const name = esc(u.displayName || u.name || 'ผู้ใช้');
                return `<div class="pc-contact-row" onclick="window.location.href='messages.html?userId=${d.id}'">
                        <img src="${avatar}" onerror="this.src='assets/images/logo.png'"
                            style="width:32px;height:32px;border-radius:50%;object-fit:cover;flex-shrink:0;" loading="lazy">
                        <span style="font-size:0.88rem;color:#e4e6eb;font-family:Kanit,sans-serif;">${name}</span>
                        <div class="pc-online-dot"></div>
                    </div>`;
            }).join('');
        } catch (e) {
            el.innerHTML = '<div style="color:#9ca3af;font-size:0.82rem;text-align:center;padding:8px">ไม่สามารถโหลดผู้ติดต่อได้</div>';
        }
    }

    /* ── PC Search live suggestions ──────────────────────── */
    function pcInitSearch() {
        const input = document.getElementById('pcSearchInput');
        const box = document.getElementById('pcSearchSuggestions');
        if (!input || !box) return;

        let debTimer;
        input.addEventListener('input', () => {
            clearTimeout(debTimer);
            const q = input.value.trim();
            if (q.length < 2) { box.style.display = 'none'; return; }
            debTimer = setTimeout(async () => {
                if (!window.db) return;
                try {
                    const snap = await window.db.collection('posts')
                        .where('published', '==', true)
                        .where('titleLower', '>=', q.toLowerCase())
                        .where('titleLower', '<', q.toLowerCase() + '\uf8ff')
                        .limit(6).get();

                    const results = snap.docs.map(d => d.data().title || '').filter(Boolean);
                    if (results.length === 0) { box.style.display = 'none'; return; }

                    box.innerHTML = results.map(r =>
                        `<div class="pc-search-suggestion-item" onclick="pcDoSearch('${esc(r)}')">
                                <i class="fas fa-search" style="color:#9ca3af;font-size:0.75rem"></i>
                                <span>${esc(r)}</span>
                            </div>`
                    ).join('');
                    box.style.display = 'block';
                } catch (_) { box.style.display = 'none'; }
            }, 300);
        });

        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                box.style.display = 'none';
                pcDoSearch(input.value.trim());
            }
            if (e.key === 'Escape') box.style.display = 'none';
        });

        document.addEventListener('click', e => {
            if (!input.contains(e.target) && !box.contains(e.target)) {
                box.style.display = 'none';
            }
        });
    }

    window.pcDoSearch = function (term) {
        const input = document.getElementById('pcSearchInput');
        if (input) input.value = term;
        document.getElementById('pcSearchSuggestions').style.display = 'none';
        // Sync to mobile search
        const mob = document.getElementById('feedSearch') || document.getElementById('nearMeSearch');
        if (mob) { mob.value = term; mob.dispatchEvent(new Event('input')); }
        // Also filter the PC feed in-place
        document.querySelectorAll('.pc-post-card-v3').forEach(card => {
            const text = card.textContent.toLowerCase();
            card.style.display = text.includes(term.toLowerCase()) ? '' : 'none';
        });
    };

    /* ── Notification badge updater ──────────────────────── */
    function pcUpdateBadges() {
        if (!window.db || !window.currentUserId) return;
        // Unread notifications
        window.db.collection('notifications')
            .where('userId', '==', window.currentUserId)
            .where('read', '==', false)
            .onSnapshot(snap => {
                const badge = document.getElementById('pcNotifBadge');
                if (!badge) return;
                const count = snap.size;
                const prevCount = parseInt(badge.textContent) || 0;
                badge.textContent = count > 99 ? '99+' : count;
                badge.style.display = count > 0 ? 'flex' : 'none';

                // Play sound on new notification
                if (count > prevCount && window.currentUserId) {
                    playNotifSound();
                }

                // Sync with Pill badge
                const pillNotif = document.getElementById('pillBadge');
                const pillNotifExp = document.getElementById('pillBadgeExp');
                if (pillNotif) {
                    pillNotif.style.display = count > 0 ? 'flex' : 'none';
                    pillNotif.textContent = count;
                }
                if (pillNotifExp) {
                    pillNotifExp.style.display = count > 0 ? 'flex' : 'none';
                    pillNotifExp.textContent = count;
                }
            }, () => { });
    }

    /* ── Global Sound Effects ────────────────────────── */
    window.playNotifSound = function () {
        try {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
            audio.volume = 0.4;
            audio.play().catch(() => { });
        } catch (e) { }
    };

    window.markAllNotifsRead = async function () {
        if (!window.db || !window.currentUserId) return;
        const snap = await window.db.collection('notifications')
            .where('userId', '==', window.currentUserId)
            .where('read', '==', false)
            .get();
        const batch = window.db.batch();
        snap.docs.forEach(doc => batch.update(doc.ref, { read: true }));
        await batch.commit();
    };


    /* ── News Section from Firestore ────────────────────────── */
    async function pcLoadNewsSection() {
        const el = document.getElementById('pcNewsSection');
        if (!el || !window.db) return;
        try {
            const snap = await window.db.collection('posts')
                .where('published', '==', true)
                .orderBy('createdAt', 'desc')
                .limit(5).get();
            if (snap.empty) { el.innerHTML = '<div style="color:#9ca3af;font-size:0.82rem;text-align:center;padding:8px">ยังไม่มีข่าวสาร</div>'; return; }
            el.innerHTML = snap.docs.map(d => {
                const p = d.data();
                const title = esc((p.title || p.description || 'ข่าวสาร').substring(0, 55));
                const time = pcFmt(p.createdAt);
                const imgs = p.images || (p.imageUrl ? [p.imageUrl] : []);
                const img = imgs.length ? (typeof imgs[0] === 'object' ? imgs[0].url : imgs[0]) : null;
                return `<div class="pc-news-item" onclick="window.location.href='channel.html?postId=${d.id}'" style="display:flex;gap:10px;align-items:center;padding:8px 0;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.05);">
                    ${img ? `<img src="${img}" style="width:52px;height:52px;border-radius:8px;object-fit:cover;flex-shrink:0;" onerror="this.style.display='none'" loading="lazy">` : ''}
                    <div style="overflow:hidden;">
                        <div style="font-size:0.83rem;color:#e4e6eb;font-family:Kanit,sans-serif;line-height:1.3;white-space:nowrap;text-overflow:ellipsis;overflow:hidden;">${title}</div>
                        <div style="font-size:0.72rem;color:#9ca3af;margin-top:2px;"><i class="fas fa-clock"></i> ${time}</div>
                    </div>
                </div>`;
            }).join('');
        } catch (e) { el.innerHTML = '<div style="color:#9ca3af;font-size:0.82rem;text-align:center;padding:8px">โหลดข่าวสารไม่ได้</div>'; }
    }

    /* ── Recommended Products from Firestore ─────────────────── */
    async function pcLoadRecommendedProducts() {
        const el = document.getElementById('pcRecommendedProducts');
        if (!el || !window.db) return;
        try {
            const snap = await window.db.collection('products')
                .where('status', '==', 'active')
                .orderBy('createdAt', 'desc')
                .limit(4).get();
            if (snap.empty) { el.innerHTML = '<div style="color:#9ca3af;font-size:0.82rem;text-align:center;padding:8px">ยังไม่มีสินค้า</div>'; return; }
            const items = snap.docs.map(d => {
                const item = d.data();
                const imgs = item.images || [];
                const img = imgs.length ? (typeof imgs[0] === 'object' ? imgs[0].url : imgs[0]) : (item.imageUrl || 'assets/images/logo.png');
                const name = esc((item.productName || 'สินค้า').substring(0, 18));
                const price = item.price ? `฿${Number(item.price).toLocaleString()}` : '';
                return `<div onclick="window.location.href='marketplace.html?product=${d.id}'"
                    style="border-radius:10px;overflow:hidden;background:#1e293b;cursor:pointer;transition:transform .15s;"
                    onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform=''">
                    <img src="${img}" style="width:100%;height:80px;object-fit:cover;" onerror="this.src='assets/images/logo.png'" loading="lazy">
                    <div style="padding:6px 8px;">
                        <div style="font-size:0.78rem;color:#e4e6eb;font-family:Kanit;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${name}</div>
                        ${price ? `<div style="font-size:0.75rem;color:#22c55e;font-weight:600;">${price}</div>` : ''}
                    </div>
                </div>`;
            }).join('');
            el.innerHTML = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">${items}</div>`;
        } catch (e) { el.innerHTML = '<div style="color:#9ca3af;font-size:0.82rem;text-align:center;padding:8px">ยังไม่มีสินค้า</div>'; }
    }

    /* ── Sponsor / Promo from Firestore ads collection ───────── */
    async function pcLoadSponsor() {
        const card = document.getElementById('pcSponsorCard');
        const content = document.getElementById('pcSponsorContent');
        if (!content || !window.db) return;
        try {
            const snap = await window.db.collection('ads')
                .where('type', '==', 'card')
                .where('active', '==', true)
                .orderBy('order', 'asc')
                .limit(1).get();
            if (snap.empty) return; // keep default static content
            const ad = snap.docs[0].data();
            window.pcSponsorUrl = ad.link || 'marketplace.html';
            if (card) card.onclick = () => window.location.href = window.pcSponsorUrl;
            content.innerHTML = `
                ${ad.imageUrl ? `<div style="border-radius:10px;overflow:hidden;margin-bottom:8px;">
                    <img src="${ad.imageUrl}" style="width:100%;height:110px;object-fit:cover;" onerror="this.parentElement.style.display='none'" loading="lazy">
                </div>` : ''}
                <div style="font-weight:600;font-size:0.88rem;color:#e4e6eb;margin-bottom:2px;">${esc(ad.title || 'TukTuk Marketplace')}</div>
                <div style="font-size:0.78rem;color:#b0b3b8;">${esc(ad.subtitle || 'เปิดร้านค้า รับลูกค้าใหม่ทุกวัน')}</div>`;
        } catch (e) { /* keep default content on error */ }
    }

    /* ── Main PC initializer ─────────────────────────────── */
    window.pcInit = function() {
        if (window.innerWidth < PC_BREAKPOINT) return; // 992px — aligns with CSS @media (min-width: 992px)
        console.log('🖥️ PC Mode Active - Forcing Scroll Resilience...');

        // 1. Force the most critical scroll classes
        document.documentElement.classList.add('pc-mode');
        document.body.classList.add('pc-mode');
        
        // 2. Aggressively reset overflows via inline styles to win over any other JS
        document.documentElement.style.setProperty('overflow', 'visible', 'important');
        document.documentElement.style.setProperty('overflow-y', 'scroll', 'important');
        document.body.style.setProperty('overflow', 'visible', 'important');
        document.body.style.setProperty('height', 'auto', 'important');

        // 3. Switch main layout to social feed mode
        const sf = document.getElementById('standardFeed');
        const pc = document.getElementById('pcSocialContent');
        const appContainer = document.querySelector('.main-app-container');

        if (sf) sf.style.display = 'block';
        if (pc) pc.style.display = 'block';
        
        // Hide all TukTuk feed variants
        ['tuktukFeed', 'tuktukFeedNearMe', 'tuktukFeedCommunity'].forEach(id => {
            const feedNode = document.getElementById(id);
            if (feedNode) feedNode.style.display = 'none';
        });

        if (appContainer) {
            appContainer.style.setProperty('overflow', 'visible', 'important');
            appContainer.style.setProperty('height', 'auto', 'important');
            appContainer.style.setProperty('display', 'block', 'important');
        }

        // 4. Sync profile avatar + name + badge from localStorage
        const av = (window.getUserAvatar && window.getUserAvatar()) || 'assets/images/logo.png';
        const nm = window.currentUserName || 'โปรไฟล์ของคุณ';
        ['pcTopProfileImg', 'pcProfileImg', 'pcCreateAvatar'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.src = av;
        });
        ['pcProfileName', 'pcTopNavigatorName'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = nm;
        });

        // 5. Load all PC data and specialized engines
        if (window.pcEngine && window.pcEngine.loadData) window.pcEngine.loadData();

        Promise.all([
            window.pcLoadSocialFeed ? window.pcLoadSocialFeed() : Promise.resolve(),
            pcLoadStories(),
            pcLoadTrendingSellers(),
            pcLoadContacts(),
            window.pcLoadSuggestedUsers ? window.pcLoadSuggestedUsers() : Promise.resolve(),
            pcLoadNewsSection(),
            pcLoadRecommendedProducts(),
            pcLoadSponsor(),
        ]).catch(e => console.warn('pcInit parallel load:', e));

        if (typeof pcInitSearch === 'function') pcInitSearch();
        if (typeof pcUpdateBadges === 'function') pcUpdateBadges();
    }

    /* ── Bootstrap ───────────────────────────────────────── */
    // Desktops (≥992px) use PC social feed + 3-column layout.
    // Phones & tablets (<992px) use TikTok-style vertical feed.
    const PC_BREAKPOINT = 992;

    function waitForFirebaseAndInit(tries) {
        if (tries <= 0) return;
        if (window.db) {
            const urlParams = new URLSearchParams(window.location.search);
            const targetPostId = urlParams.get('post') || urlParams.get('postId') || urlParams.get('id');
            const forceExplore = urlParams.get('category') === 'all' || urlParams.get('cat') === 'all';

            if (window.innerWidth >= PC_BREAKPOINT && !targetPostId && !forceExplore) {
                window.pcInit();
            } else {
                // Shared post ID OR forced Explore
                if (targetPostId || forceExplore) {
                    if (window.innerWidth >= PC_BREAKPOINT) {
                        // Desktop deep-linked to video -> Ensure layout wrapper exists, then switch to video panel
                        window.pcInit();
                        window.pcSwitchToVideoFeed('all');
                    } else {
                        // Mobile deep-linked to video -> Remove any residual desktop classes
                        const tf = document.getElementById('tuktukFeed');
                        const sf = document.getElementById('standardFeed');
                        const pc = document.getElementById('pcSocialContent');
                        if (tf) tf.style.display = 'block';
                        if (sf) sf.style.display = 'none';
                        if (pc) pc.style.display = 'none';
                        document.documentElement.classList.remove('pc-mode');
                        document.body.classList.remove('pc-mode');
                    }
                }
                mobileInit();
            }
        } else {
            setTimeout(() => waitForFirebaseAndInit(tries - 1), 400);
        }
    }

    function mobileInit() {
        // Skip if tuktuk_feed_logic.js DOMContentLoaded already handled init
        if (window.TukTukFeed && window.TukTukFeed.didAutoInit) return;
        const cat = sessionStorage.getItem('tuktuk_last_category') || 'all';
        if (typeof window.initTukTukFeed === 'function') {
            window.TukTukFeed.didAutoInit = true;
            window.initTukTukFeed(cat);
        } else {
            // tuktuk_feed_logic.js not yet loaded — retry once
            setTimeout(() => {
                if (window.TukTukFeed && window.TukTukFeed.didAutoInit) return;
                if (typeof window.initTukTukFeed === 'function') {
                    window.TukTukFeed.didAutoInit = true;
                    window.initTukTukFeed(cat);
                }
            }, 800);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => waitForFirebaseAndInit(15));
    } else {
        waitForFirebaseAndInit(15);
    }

    // Re-run on resize crossing the PC_BREAKPOINT threshold
    let _lastPCMode = window.innerWidth >= PC_BREAKPOINT;
    window.addEventListener('resize', () => {
        const nowPC = window.innerWidth >= PC_BREAKPOINT;
        if (nowPC && !_lastPCMode) { waitForFirebaseAndInit(5); }
        if (!nowPC && _lastPCMode) {
            document.body.classList.remove('pc-mode');
            const tf = document.getElementById('tuktukFeed');
            const sf = document.getElementById('standardFeed');
            if (tf) tf.style.display = '';
            if (sf) sf.style.display = 'none';
            mobileInit();
        }
        _lastPCMode = nowPC;
    });
})();
