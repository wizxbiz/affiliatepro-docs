/**
 * 🎨 Index UI Initialization & Core Global Helpers
 */

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

// Global Toast CSS is now in index-core.css or similar
// But if not, we can keep the dynamic injection here or move it to a CSS file.

function initPullToRefresh() {
    if (window._ptrInitialized) return;
    window._ptrInitialized = true;

    let startY = 0;
    let isPulling = false;
    const ptrElement = document.getElementById('pullToRefresh');
    if (!ptrElement) return;

    // body has overflow:hidden — listen on document directly (touch events bubble up)
    // Drop the window.scrollY guard; instead track whether the feed is at its top.
    const getFeedScrollTop = () => {
        const feed = document.getElementById('tuktukFeed') ||
                     document.querySelector('.main-app-container') ||
                     document.body;
        return feed.scrollTop;
    };

    document.addEventListener('touchstart', (e) => {
        if (getFeedScrollTop() === 0) {
            startY = e.touches[0].pageY;
            isPulling = true;
        }
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
        if (!isPulling || getFeedScrollTop() > 0) return;
        const diff = e.touches[0].pageY - startY;
        if (diff > 120) ptrElement.classList.add('visible');
    }, { passive: true });

    document.addEventListener('touchend', async () => {
        if (!isPulling) return;
        isPulling = false;
        if (ptrElement.classList.contains('visible')) {
            ptrElement.classList.remove('visible');
            if (typeof loadPosts === 'function') {
                await loadPosts(false);
                if (typeof showToast === 'function') showToast('รีเฟรชสำเร็จ', 'success');
            }
        }
    });
}

// NOTE: initParticles, triggerWebGreeting, loadAds, loadPosts, checkAdminStatus
// are all called by app-init.js on window.load to prevent duplicate execution.
// Only register handlers here that are NOT covered by app-init.js.
window.addEventListener('load', () => {
    // Periodically refresh FB SDK (app-init.js does not do this)
    setInterval(() => {
        if (window.FB && window.FB.XFBML) window.FB.XFBML.parse();
    }, 10000);
});

// --- Profile image auto-update + PC Sidebar logic ---
window.addEventListener('load', () => {
    setTimeout(() => {
        try {
            const raw = localStorage.getItem('user_data') ||
                        localStorage.getItem('tuktuk_line_session') ||
                        localStorage.getItem('wizmobiz_session');
            const user = raw ? JSON.parse(raw) : null;
            if (!user) return;

            const avatar = user.photoURL || user.pictureUrl || user.picture || 'assets/images/logo.png';
            const name   = user.displayName || user.name || 'สมาชิก TukTuk';
            const uid    = user.lineUserId || user.uid || '';
            const handle = uid ? '@' + uid.substring(0, 10) : '@tuktuk';
            const tier   = user.subscriptionPlan?.tier || user.tier || 'member';
            const tierLabel = { trial: 'ทดลองฟรี', starter: 'Starter', premium: 'Premium', yearly_12m: 'Gold' }[tier] || 'สมาชิก';
            const tierGradient = tier === 'trial'
                ? 'linear-gradient(135deg,#6b7280,#4b5563)'
                : tier === 'starter'
                ? 'linear-gradient(135deg,#0ea5e9,#0284c7)'
                : tier === 'premium'
                ? 'linear-gradient(135deg,#8b5cf6,#6d28d9)'
                : tier === 'yearly_12m'
                ? 'linear-gradient(135deg,#f59e0b,#d97706)'
                : 'linear-gradient(135deg,#6366f1,#4f46e5)';

            // Avatar
            ['navProfileImg', 'pcProfileImg', 'pcTopProfileImg', 'pcCreateAvatar', 'drawerAvatar'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.src = avatar;
            });

            // Name
            ['pcProfileName', 'pcTopNavigatorName'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = name;
            });
            const drawerName = document.getElementById('drawerUserName');
            if (drawerName) drawerName.textContent = name;
            const drawerSub = document.getElementById('drawerUserPhone');
            if (drawerSub) drawerSub.textContent = handle;

            // Subscription badge
            const badge = document.getElementById('pcProfileBadgeText');
            if (badge) { badge.textContent = tierLabel; badge.style.background = tierGradient; }
            const usernameEl = document.getElementById('pcProfileUsername');
            if (usernameEl) usernameEl.textContent = handle;

        } catch (e) { /* silently ignore parse errors */ }
    }, 800);
});

// Unified Social Helpers (if not already global)
function getUserAvatar() {
    try { return window.currentUserAvatar || 'assets/images/logo.png'; } catch (e) { return 'assets/images/logo.png'; }
}
function getUserDisplayName() {
    try { return window.currentUserDisplayName || 'สมาชิก TukTuk'; } catch (e) { return 'สมาชิก TukTuk'; }
}
function formatContent(text) {
    if (!text) return "";
    return text.replace(/\n/g, '<br>');
}
function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
function isPostLiked(postId) {
    try {
        const likes = JSON.parse(localStorage.getItem('tuktuk_liked_posts') || '[]');
        return likes.includes(postId);
    } catch (e) { return false; }
}

// PC Sidebar Logic
function syncPCMenu(category, element) {
    // Toggle PC Social Content visibility (Stories/Create Post are usually only on Home/All)
    const pcSoc = document.getElementById('pcSocialContent');
    const feedContainer = document.getElementById('tuktukFeed');

    if (pcSoc) {
        if (category === 'all') {
            pcSoc.style.display = 'block';
        } else {
            pcSoc.style.display = 'none';
        }
    }

    // Find mobile tab btn and click it to trigger official logic
    const mobileBtn = document.querySelector(`.tab-btn[data-category="${category}"]`);
    if (mobileBtn) {
        mobileBtn.click();
    }

    // Sync PC UI classes
    if (element) {
        document.querySelectorAll('.pc-menu-item').forEach(i => i.classList.remove('active'));
        element.classList.add('active');
    } else {
        // Sync based on category if element not provided (e.g. from top nav)
        document.querySelectorAll('.pc-menu-item').forEach(i => {
            if (i.getAttribute('data-pc-category') === category) {
                i.classList.add('active');
            } else {
                i.classList.remove('active');
            }
        });
    }

    // Sync Top Nav Icons
    document.querySelectorAll('.pc-nav-icon').forEach(icon => {
        const title = icon.getAttribute('title');
        if ((category === 'all' && title === 'หน้าหลัก') || (category === 'community' && title === 'คอมมูนิตี้')) {
            icon.classList.add('active');
        } else {
            icon.classList.remove('active');
        }
    });
}

// Search logic for PC
document.addEventListener('DOMContentLoaded', () => {
    const pcSearch = document.querySelector('.pc-search-input');
    if (pcSearch) {
        pcSearch.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const mobileSearch = document.getElementById('feedSearch') || document.getElementById('nearMeSearch');
            if (mobileSearch) {
                mobileSearch.value = term;
                mobileSearch.dispatchEvent(new Event('input'));
            }
        });
    }

    // Stories + Contacts are loaded from Firestore by pcInit() in app-init.js
    // Set skeleton placeholders so the layout doesn't shift
    const storiesBar = document.getElementById('pcStoriesBar');
    if (storiesBar && !storiesBar.innerHTML.trim()) {
        storiesBar.innerHTML = `
            <div class="pc-story-add-btn" onclick="openPostModal ? openPostModal() : null">
                <div class="pc-story-add-btn-plus"><i class="fas fa-plus"></i></div>
                <div class="pc-story-add-label">เพิ่มเรื่องราว</div>
            </div>
            ${[1,2,3,4].map(() => `
                <div class="pc-story-card" style="background:#1e293b;">
                    <div class="pc-skeleton" style="width:100%;height:100%;border-radius:12px;"></div>
                </div>`).join('')}`;
    }

    // Handle UI Switching for PC
    if (window.innerWidth >= 992) {
        const pcSoc = document.getElementById('pcSocialContent');
        if (pcSoc) pcSoc.style.display = 'block';

        // Sync creation avatar
        const pcCreat = document.getElementById('pcCreateAvatar');
        if (pcCreat) pcCreat.src = getUserAvatar();
    }
});
