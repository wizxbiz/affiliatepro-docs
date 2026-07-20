// ================================================
// new-scripts.js - รวม JavaScript ที่เหลือจาก index.html
// Generated: 2026-03-12
// ================================================

// ================================================
// PWA Lifecycle & Native Bridge Simulation
// ================================================
const PWA = {
    init() {
        this.handleShareTarget();
        this.setupWakeLock();
        this.detectInstallState();
    },

    handleShareTarget() {
        const params = new URLSearchParams(window.location.search);
        const action = params.get('action');

        // ?action=post — auto-open create post modal (from persistent-ui quickCreate on non-index pages)
        if (action === 'post' || action === 'video') {
            setTimeout(() => {
                if (typeof window.openPostModal === 'function') {
                    window.openPostModal();
                    // For video action, click the video category chip
                    if (action === 'video') {
                        setTimeout(() => {
                            const chip = Array.from(document.querySelectorAll('.cat-chip,.node-card'))
                                .find(c => c.textContent.includes('วีดีโอ') || c.textContent.includes('video'));
                            chip?.click();
                        }, 400);
                    }
                    // Clean URL so refresh doesn't re-open
                    history.replaceState({}, '', window.location.pathname);
                }
            }, 1800);
        }

        if (action === 'share') {
            const text = params.get('text') || '';
            const title = params.get('title') || '';
            const url = params.get('url') || '';
            console.log("[PWA] Shared Content Received:", { title, text, url });
            setTimeout(() => {
                if (window.openPostModal) {
                    window.openPostModal();
                    const desc = document.getElementById('productDescription');
                    if (desc) desc.value = `${title}\n${text}\n${url}`.trim();
                }
            }, 2000);
        }
    },

    async setupWakeLock() {
        let wakeLock = null;
        const requestWakeLock = async () => {
            if ('wakeLock' in navigator) {
                try {
                    wakeLock = await navigator.wakeLock.request('screen');
                    console.log('[PWA] Wake Lock Active');
                } catch (err) {
                    console.warn('[PWA] Wake Lock Failed:', err.message);
                }
            }
        };
        document.addEventListener('visibilitychange', () => {
            if (wakeLock !== null && document.visibilityState === 'visible') {
                requestWakeLock();
            }
        });
        requestWakeLock();
    },

    detectInstallState() {
        const isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
        if (isPWA) {
            document.body.classList.add('pwa-mode');
            console.log("[PWA] Running as installed app.");
        }
    },

    haptic(pattern = 10) {
        if ('vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => PWA.init());

// ================================================
// PC Sidebar Logic
// ================================================
function syncPCMenu(category, element) {
    const pcSoc = document.getElementById('pcSocialContent');
    const feedContainer = document.getElementById('tuktukFeed');
    if (pcSoc) pcSoc.style.display = category === 'all' ? 'block' : 'none';
    const mobileBtn = document.querySelector(`.tab-btn[data-category="${category}"]`);
    if (mobileBtn) mobileBtn.click();
    if (element) {
        document.querySelectorAll('.pc-menu-card').forEach(i => i.classList.remove('active'));
        element.classList.add('active');
    } else {
        document.querySelectorAll('.pc-menu-card').forEach(i => {
            i.classList.toggle('active', i.getAttribute('data-pc-category') === category);
        });
    }
    document.querySelectorAll('.pc-nav-icon').forEach(icon => {
        const nav = icon.getAttribute('data-pc-nav');
        icon.classList.toggle('active',
            (category === 'all' && nav === 'home') ||
            (category === 'near_me' && nav === 'near_me')
        );
    });
}

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

    const stories = [
        { name: 'เพิ่มเรื่องราว', img: 'assets/images/logo.png', avatar: 'assets/images/logo.png', isAdd: true },
        { name: 'แอนดรูว์ ชัยชนะ', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200', avatar: 'https://i.pravatar.cc/150?u=1' },
        { name: 'สุรีย์รัตน์ มีเงิน', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200', avatar: 'https://i.pravatar.cc/150?u=2' },
        { name: 'สมเกียรติ พัฒนา', img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200', avatar: 'https://i.pravatar.cc/150?u=3' },
        { name: 'วิลาวัลย์ สุขใจ', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200', avatar: 'https://i.pravatar.cc/150?u=4' }
    ];
    const storiesBar = document.getElementById('pcStoriesBar');
    if (storiesBar) {
        storiesBar.innerHTML = stories.map(s => `
            <div class="pc-story-card" onclick="${s.isAdd ? 'openPostModal()' : ''}">
                <img src="${s.img}">
                <div class="pc-story-overlay"></div>
                ${s.isAdd ?
                `<div style="position: absolute; bottom: 35px; left: 50%; transform: translateX(-50%); background: #2e89ff; width: 32px; height: 32px; border-radius: 50%; border: 4px solid #242526; display: flex; align-items: center; justify-content: center; color: white;">
                        <i class="fas fa-plus"></i>
                    </div>` :
                `<img src="${s.avatar}" class="pc-story-avatar">`
            }
                <div class="pc-story-name">${s.name}</div>
            </div>
        `).join('');
    }

    const contacts = [
        { name: 'แอนดรูว์ ชัยชนะ', img: 'https://i.pravatar.cc/150?u=1' },
        { name: 'สุรีย์รัตน์ มีเงิน', img: 'https://i.pravatar.cc/150?u=2' },
        { name: 'สมเกียรติ พัฒนา', img: 'https://i.pravatar.cc/150?u=3' },
        { name: 'วิลาวัลย์ สุขใจ', img: 'https://i.pravatar.cc/150?u=4' },
        { name: 'ธนากรณ์ รุ่งเรือง', img: 'https://i.pravatar.cc/150?u=5' }
    ];
    const contactList = document.getElementById('pcContactList');
    if (contactList) {
        contactList.innerHTML = contacts.map(c => `
            <div class="pc-menu-item">
                <img src="${c.img}" style="width: 32px; height: 32px; border-radius: 50%; margin-right: 12px; object-fit: cover;">
                <span style="font-size: 0.9rem;">${c.name}</span>
                <div style="width: 8px; height: 8px; background: #31a24c; border-radius: 50%; margin-left: auto;"></div>
            </div>
        `).join('');
    }

    if (window.innerWidth >= 992) {
        const pcSoc = document.getElementById('pcSocialContent');
        if (pcSoc) pcSoc.style.display = 'block';
        const pcCreat = document.getElementById('pcCreateAvatar');
        if (pcCreat) pcCreat.src = getUserAvatar();
    }
});

// ================================================
// Core Utilities
// ================================================
function getUserAvatar() {
    try { return window.currentUserAvatar || 'assets/images/logo.png'; } catch (e) { return 'assets/images/logo.png'; }
}
function getUserDisplayName() {
    try { return window.currentUserDisplayName || 'สมาชิก TukTuk'; } catch (e) { return 'สมาชิก TukTuk'; }
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

// Profanity filtering now handled by core-utils.js


// showToast and showNotification are defined in core-utils.js and index-ui-init.js respectively

const toastStyle = document.createElement('style');
toastStyle.textContent = `
    .custom-toast {
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
        z-index: 9999999;
        box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        animation: slideUpToast 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        border: 1px solid rgba(255,255,255,0.1);
        transition: all 0.5s ease;
    }
    .custom-toast.warning i { color: #f59e0b; }
    .custom-toast.error i { color: #ef4444; }
    @keyframes slideUpToast {
        from { transform: translateX(-50%) translateY(100px); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
    }
    @keyframes slideIn {
        from { transform: translateX(40px); opacity: 0; }
        to   { transform: translateX(0);    opacity: 1; }
    }
`;
document.head.appendChild(toastStyle);

// ================================================
// Global Variables
// ================================================
// (Global variables are already declared in firebase-init.js)


document.addEventListener('DOMContentLoaded', () => {
    const commentEl = document.getElementById('commentModal');
    const postEl = document.getElementById('postModal');
    const deleteEl = document.getElementById('deleteModal');
    if (commentEl) window.commentModal = bootstrap.Modal.getOrCreateInstance(commentEl);
    if (postEl) window.postModal = bootstrap.Modal.getOrCreateInstance(postEl);
    if (deleteEl) window.deleteModal = bootstrap.Modal.getOrCreateInstance(deleteEl);
});

var categoryLabels = window.categoryLabels || {
    news: '📰 ข่าวสาร',
    video: '🎬 วิดีโอ/บันเทิง',
    update: '🔄 อัปเดต',
    tip: '💡 เคล็ดลับ',
    event: '📅 กิจกรรม',
    promo: '🏷️ โปรโมชั่น'
};

// ================================================
// Author Cache
// ================================================
var authorCache = window.authorCache || new Map();
window.authorCache = authorCache;

function getAuthorInfo(post) {
    const authorId = post.authorId || 'admin';
    const session = WizmobizAuth.getUser();
    if (authorId === currentUserId && session) {
        return {
            name: session.displayName || session.name || session.username || 'Member',
            avatar: session.pictureUrl || session.photoURL || 'assets/images/logo.png'
        };
    }
    if (authorCache.has(authorId)) {
        const cached = authorCache.get(authorId);
        return {
            name: cached.displayName || cached.name || cached.username || 'Member',
            avatar: cached.pictureUrl || cached.photoURL || '/images/logo.png'
        };
    }
    if (authorId === 'admin') {
        return { name: 'TukTuk Team', avatar: 'assets/images/logo.png' };
    }
    return {
        name: post.authorName || 'Member',
        avatar: post.authorAvatar || post.authorPictureUrl || 'assets/images/logo.png'
    };
}

async function fetchAuthorProfile(authorId) {
    if (!authorId || authorId === 'admin') return;
    try {
        const doc = await db.collection('users').doc(authorId).get();
        if (doc.exists) {
            const data = doc.data();
            authorCache.set(authorId, data);
            const name = data.displayName || data.name || 'สมาชิก';
            const avatar = data.pictureUrl || data.photoURL || 'assets/images/logo.png';
            const fCount = data.followerCount || 0;
            const vCount = data.totalViews || 0;
            document.querySelectorAll(`.author-name-${authorId}`).forEach(el => el.textContent = name);
            document.querySelectorAll(`.author-avatar-${authorId}`).forEach(el => {
                if (el.tagName === 'IMG') el.src = avatar;
            });
            document.querySelectorAll(`.follower-count-${authorId}`).forEach(el => {
                el.textContent = fCount.toLocaleString();
            });
            document.querySelectorAll(`.total-views-${authorId}`).forEach(el => {
                el.textContent = vCount.toLocaleString();
            });
        } else {
            authorCache.set(authorId, { name: 'Member', avatar: '/images/logo.png' });
        }
    } catch (e) {
        authorCache.set(authorId, { name: 'Member', avatar: '/images/logo.png' });
    }
}

// ================================================
// Stats Display
// ================================================
function updateStats(posts) {
    window.totalPostsCount = posts.length;
    window.totalLikesCount = posts.reduce((sum, p) => sum + (p.likes || 0), 0);
    const totalProductsCount = posts.filter(p => p.linkedProductId).length;
    animateNumber('totalPosts', window.totalPostsCount);
    animateNumber('totalLikes', window.totalLikesCount);
    animateNumber('todayPosts', totalProductsCount);
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
}

// ================================================
// Admin Status Check
// ================================================
async function checkAdminStatus() {
    try {
        const user = WizmobizAuth.getUser();
        if (!user) return;
        // Admin จาก server-verified role เท่านั้น (ไม่มี hardcoded ID list)
        if (user.role === 'admin' || user.role === 'super_admin') {
            isAdmin = true;
            const fab = document.getElementById('adminFab');
            if (fab) fab.style.setProperty('display', 'flex', 'important');
            console.log('Admin Access Granted');
        }
        currentUserId = user.uid;
        currentLineUserId = user.lineUserId;
        if (currentUserId) {
            const likedTab = document.getElementById('likedTabBtn');
            if (likedTab) likedTab.style.display = 'inline-flex';
            const doc = await db.collection('user_likes').doc(currentUserId).get();
            if (doc.exists) {
                userLikedIds = doc.data().postIds || [];
            }
            const userDoc = await db.collection('users').doc(currentUserId).get();
            if (userDoc.exists) {
                const data = userDoc.data();
                userFollowingIds = data.following || [];
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
// Pull to Refresh
// ================================================
function initPullToRefresh() {
    let startY = 0;
    let isPulling = false;
    const ptrElement = document.getElementById('pullToRefresh');
    const content = document.body;
    content.addEventListener('touchstart', (e) => {
        if (window.scrollY === 0) {
            startY = e.touches[0].pageY;
            isPulling = true;
        }
    }, { passive: true });
    content.addEventListener('touchmove', (e) => {
        if (!isPulling || window.scrollY > 0) return;
        const currentY = e.touches[0].pageY;
        const diff = currentY - startY;
        if (diff > 120) {
            ptrElement.classList.add('visible');
        }
    }, { passive: true });
    content.addEventListener('touchend', async (e) => {
        if (!isPulling) return;
        isPulling = false;
        const ptrVisible = ptrElement.classList.contains('visible');
        if (ptrVisible && window.scrollY === 0) {
            if (typeof loadPosts === 'function') {
                await loadPosts(false);
                if (typeof triggerHaptic === 'function') triggerHaptic('medium');
            }
            ptrElement.classList.remove('visible');
        } else {
            ptrElement.classList.remove('visible');
        }
    });
}
// SPA Navigation now handled exclusively by spa-router.js

// ================================================
// Social SDKs — handled by feed-renderer.js / app-init.js
// (duplicate removed to prevent "sdksInitialized already declared" SyntaxError)
// ================================================

// [PWA SW registration moved to pwa-manager.js to avoid redundancy]

// ================================================
// PWA Install
// ================================================
document.addEventListener('DOMContentLoaded', () => {
    if (window.TukTukPWA) window.TukTukPWA.show();
});

// ================================================
// SW Message Handler
// ================================================
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', event => {
        const { type, url, action, data } = event.data || {};
        if (type !== 'NOTIF_CLICK') return;
        if (window.TukTukNotify) window.TukTukNotify.clearBadge();
        try {
            const target = new URL(url, location.origin);
            if (target.pathname !== location.pathname || target.search !== location.search) {
                location.href = url;
                return;
            }
        } catch (_) { }
        if (action === 'reply' || (url && url.includes('messages'))) {
            if (typeof openInChat === 'function') openInChat();
        } else if (url && url.includes('seller-dashboard')) {
            location.href = url;
        }
    });
}

// ================================================
// Initialize everything
// ================================================
window.addEventListener('load', () => {
    initSocialSDKs();
    initPullToRefresh();
    if (typeof initNotifications === 'function') initNotifications();
});