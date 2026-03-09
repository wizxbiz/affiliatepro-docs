/**
 * TukTuk Persistent UI Engine v2
 * Bottom Nav + Creation Hub — matches Flutter TukTukFeedScreen structure.
 */

const PersistentUI = {

    _hubOpen: false, // single source of truth

    init() {
        const isEmbedded = window.self !== window.top ||
            window.location.search.includes('embedded=true');

        if (isEmbedded) {
            document.body.classList.add('is-embedded');
            return;
        }

        this.injectHTML();
        this.setActiveTab();
        this.updateProfileImage();
        this.setupNavigationGuards();
    },

    // ── Navigation guards ──────────────────────────────────────────────────
    setupNavigationGuards() {
        // Hardware back button / browser back (PWA / Android)
        window.addEventListener('popstate', () => {
            if (this._hubOpen) this._closeHubDirect();
        });

        // Escape key (desktop)
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this._hubOpen) this.closeCreationHub();
        });
    },

    // ── HTML injection ─────────────────────────────────────────────────────
    injectHTML() {
        if (document.getElementById('bottomNav')) return;

        const html = `
            <!-- Dark backdrop — tap anywhere to close -->
            <div class="creation-overlay" id="creationOverlay"
                 onclick="PersistentUI.closeCreationHub()">
                <div class="hub-close-btn"
                     onclick="event.stopPropagation(); PersistentUI.closeCreationHub()">
                    <i class="fas fa-times"></i>
                </div>
            </div>

            <div class="center-hub-title" id="creationHubTitle">สร้างสรรค์ผลงาน</div>

            <div class="creation-hub" id="creationHub">
                <div class="creation-item item-post"
                     onclick="PersistentUI.quickCreate('post')">
                    <div class="creation-circle"><i class="fas fa-edit"></i></div>
                    <span class="creation-label">โพสต์</span>
                </div>
                <div class="creation-item item-video"
                     onclick="PersistentUI.quickCreate('video')">
                    <div class="creation-circle"><i class="fas fa-play"></i></div>
                    <span class="creation-label">วิดีโอ</span>
                </div>
                <div class="creation-item item-camera"
                     onclick="PersistentUI.quickCreate('camera')">
                    <div class="creation-circle"><i class="fas fa-satellite-dish"></i></div>
                    <span class="creation-label">ไลฟ์สด</span>
                </div>
                <div class="creation-item item-analytics"
                     onclick="PersistentUI.quickCreate('deep_analytics')">
                    <div class="creation-circle"><i class="fas fa-chart-line"></i></div>
                    <span class="creation-label">ข้อมูลเชิงลึก</span>
                </div>
                <div class="creation-item item-shop"
                     onclick="window.location.href='post-product.html'">
                    <div class="creation-circle"><i class="fas fa-store"></i></div>
                    <span class="creation-label">ลงขาย</span>
                </div>
            </div>

            <!-- Camera quick input -->
            <input type="file" id="quickCameraInput" accept="image/*" capture="camera"
                   style="display:none" onchange="PersistentUI.handleQuickCapture(this)">

            <!-- Bottom Navigation — 5 tabs, matches Flutter -->
            <div class="bottom-nav" id="bottomNav">
                <a href="index.html" class="bottom-nav-item" id="nav-home">
                    <i class="fas fa-home"></i>
                    <span>หน้าแรก</span>
                </a>

                <a href="javascript:void(0)" class="bottom-nav-item" id="nav-chat"
                   onclick="PersistentUI.handleChatClick()">
                    <i class="fas fa-comment-dots"></i>
                    <span>แชท</span>
                </a>

                <!-- Center TukTuk button: gradient outer + white inner circle -->
                <a href="javascript:void(0)" id="centerBtn"
                   onclick="PersistentUI.handleTukTukButtonClick()"
                   class="bottom-nav-item center-btn">
                    <div class="center-btn-outer">
                        <div class="center-btn-white">
                            <img src="assets/images/tuktuk.png" class="tuktuk-brand-icon"
                                 onerror="this.src='assets/images/logo.png'">
                        </div>
                    </div>
                </a>

                <a href="marketplace.html" class="bottom-nav-item" id="nav-market">
                    <i class="fas fa-store"></i>
                    <span>ตลาด</span>
                </a>

                <a href="channel.html" class="bottom-nav-item" id="nav-profile">
                    <div class="nav-profile-wrapper">
                        <img src="assets/images/logo.png" id="navProfileImg">
                    </div>
                    <span>โปรไฟล์</span>
                </a>
            </div>
        `;

        const container = document.createElement('div');
        container.id = 'persistent-ui-root';
        container.innerHTML = html;
        document.body.appendChild(container);

        // Global aliases for backward compatibility
        window.handleTukTukButtonClick = () => PersistentUI.handleTukTukButtonClick();
        window.closeCreationHub = () => PersistentUI.closeCreationHub();
        window.quickCreate = (t) => PersistentUI.quickCreate(t);
        window.handleQuickCapture = (i) => PersistentUI.handleQuickCapture(i);
    },

    // ── Active tab highlight ───────────────────────────────────────────────
    setActiveTab() {
        const path = window.location.pathname;
        document.querySelectorAll('.bottom-nav-item')
            .forEach(el => el.classList.remove('active'));

        if (path.includes('index.html') || path === '/' || path.endsWith('/')) {
            document.getElementById('nav-home')?.classList.add('active');
        } else if (path.includes('messages.html')) {
            document.getElementById('nav-chat')?.classList.add('active');
        } else if (path.includes('marketplace.html')) {
            document.getElementById('nav-market')?.classList.add('active');
        } else if (path.includes('channel.html')) {
            document.getElementById('nav-profile')?.classList.add('active');
        }
    },

    // ── Profile image from localStorage ───────────────────────────────────
    updateProfileImage() {
        try {
            const user = JSON.parse(localStorage.getItem('user_data') || 'null');
            const src = user?.photoURL || user?.pictureUrl;
            if (src) {
                const img = document.getElementById('navProfileImg');
                if (img) img.src = src;
            }
        } catch (_) { }
    },

    // ── Center button click ────────────────────────────────────────────────
    handleTukTukButtonClick() {
        if (typeof WizmobizAuth !== 'undefined' && !WizmobizAuth.isLoggedIn()) {
            if (window['showNotification']) {
                window['showNotification']('กรุณาเข้าสู่ระบบเพื่อใช้งานส่วนนี้', 'warning');
            } else {
                alert('กรุณาเข้าสู่ระบบก่อนใช้งาน');
            }
            setTimeout(() => WizmobizAuth.redirectToLogin(), 1500);
            return;
        }

        if (this._hubOpen) {
            this.closeCreationHub();
        } else {
            this._openHub();
        }
    },

    // ── Open hub ──────────────────────────────────────────────────────────
    _openHub() {
        const overlay = document.getElementById('creationOverlay');
        const btn = document.getElementById('centerBtn');
        const nav = document.getElementById('bottomNav');
        if (!overlay || !btn) return;

        this._hubOpen = true;

        // Haptic (PWA)
        if (window.PWA?.haptic) window.PWA.haptic(15);

        // Show overlay then trigger CSS transition on next frame
        // No history.pushState — avoids Safari's 100-push limit and navigation lock
        overlay.style.display = 'block';
        requestAnimationFrame(() => requestAnimationFrame(() => {
            overlay.classList.add('active', 'active-overlay');
            btn.classList.add('active');
            nav?.classList.add('overlay-active');
        }));
    },

    // ── Close hub (called by overlay click, X button, ESC, quickCreate) ───
    closeCreationHub() {
        // Pure CSS class removal — no history manipulation
        this._closeHubDirect();
    },

    // ── Direct DOM close (also called by popstate) ────────────────────────
    _closeHubDirect() {
        if (!this._hubOpen) return;
        this._hubOpen = false;

        const overlay = document.getElementById('creationOverlay');
        const btn = document.getElementById('centerBtn');
        const nav = document.getElementById('bottomNav');

        overlay?.classList.remove('active', 'active-overlay');
        btn?.classList.remove('active');
        nav?.classList.remove('overlay-active');

        // Hide after CSS transition finishes
        setTimeout(() => {
            if (overlay && !this._hubOpen) overlay.style.display = 'none';
        }, 420);
    },

    // ── Creation hub item actions ─────────────────────────────────────────
    quickCreate(type) {
        if (window.PWA?.haptic) window.PWA.haptic(25);

        this.closeCreationHub();

        if (type === 'deep_analytics') {
            window.location.href = 'analytics-dashboard.html';
            return;
        }

        if (type === 'post') {
            if (window.openPostModal) window.openPostModal();
            else window.location.href = 'index.html?action=post';
            return;
        }

        if (type === 'video') {
            if (window.openPostModal) {
                window.openPostModal();
                setTimeout(() => {
                    const chip = Array.from(document.querySelectorAll('.cat-chip'))
                        .find(c => c.textContent.includes('วีดีโอ'));
                    chip?.click();
                    document.getElementById('postMediaFiles')?.click();
                }, 500);
            } else {
                window.location.href = 'index.html?action=video';
            }
            return;
        }

        if (type === 'camera') {
            document.getElementById('quickCameraInput')?.click();
        }
    },

    // ── Chat interaction ──────────────────────────────────────────────────
    handleChatClick() {
        if (window.PWA?.haptic) window.PWA.haptic(10);

        // 1. If we have the in-page chat panel (e.g. on index.html)
        if (typeof window.openInChat === 'function') {
            window.openInChat();
            return;
        }

        // 2. Otherwise, treat as normal navigation
        window.location.href = 'messages.html';
    },

    handleQuickCapture(input) {
        if (input.files?.[0]) {
            if (window.openPostModal && window.handleMultiMediaUpload) {
                window.openPostModal();
                window.handleMultiMediaUpload(input);
            }
        }
    }
};

// Auto-init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => PersistentUI.init());
} else {
    PersistentUI.init();
}
