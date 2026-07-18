
/*
    TukTuk Persistent UI — v2.3 (REFRESH FIX)
    Matches Flutter TukTukFeedScreen bottom nav structure & visual design.
    Explicitly forces 5 tabs and clears stale UI.
*/

(function() {
    console.log('--- 🚀 PERSISTENT UI v2.3 LOADING ---');

    const PersistentUI = {
        isInitialized: false,

        init() {
            // Check shell/iframe context
            this.isEmbedded = window.self !== window.top || window.location.search.includes('embedded=true');
            if (this.isEmbedded) {
                console.log('--- 🚀 PERSISTENT UI: Embedded mode (iframe), skipping injection ---');
                document.body.classList.add('is-embedded');
                return;
            }

            console.log('--- 🚀 PERSISTENT UI: Shell mode, injecting 5 items ---');
            this.injectHTML();
            this.setActiveTab();
            this.updateProfileImage();
            this.setupNavigationGuards();
            
            this.isInitialized = true;
            window.PersistentUI = this; // Global export
            
            // Re-injection observer (to handle SPA page changes that might wipe body)
            this.startMutationObserver();
        },

        injectHTML() {
            // 1. Force remove any OLD/STALE nav items to prevent duplicates or old 4-item versions
            const oldNav = document.getElementById('bottomNav');
            const oldRoot = document.getElementById('persistent-ui-root');
            if (oldNav) oldNav.remove();
            if (oldRoot) oldRoot.remove();

            // 2. Create the wrapper
            const root = document.createElement('div');
            root.id = 'persistent-ui-root';

            // 5 FIXED ITEMS + creation hub overlay
            root.innerHTML = `
                <!-- Dark backdrop -->
                <div class="creation-overlay" id="creationOverlay"
                     onclick="PersistentUI.closeCreationHub()">
                    <div class="hub-close-btn"
                         onclick="event.stopPropagation(); PersistentUI.closeCreationHub()">
                        <i class="fas fa-times"></i>
                    </div>
                </div>

                <div class="center-hub-title" id="creationHubTitle">สร้างสรรค์ผลงาน</div>

                <!-- Radial creation hub — pointer-events managed by JS in _openHub/_closeHub -->
                <div class="creation-hub" id="creationHub" style="pointer-events:none">
                    <div class="creation-item item-post"
                         style="pointer-events:none;opacity:0;transform:translate(0,0) scale(0)"
                         onclick="PersistentUI.quickCreate('post')">
                        <div class="creation-circle" style="background:#4f46e5"><i class="fas fa-edit" style="color:#fff"></i></div>
                        <span class="creation-label">โพสต์</span>
                    </div>
                    <div class="creation-item item-video"
                         style="pointer-events:none;opacity:0;transform:translate(0,0) scale(0)"
                         onclick="PersistentUI.quickCreate('video')">
                        <div class="creation-circle" style="background:#e11d48"><i class="fas fa-play" style="color:#fff"></i></div>
                        <span class="creation-label">วิดีโอ</span>
                    </div>
                    <div class="creation-item item-camera"
                         style="pointer-events:none;opacity:0;transform:translate(0,0) scale(0)"
                         onclick="PersistentUI.quickCreate('camera')">
                        <div class="creation-circle" style="background:#0891b2"><i class="fas fa-satellite-dish" style="color:#fff"></i></div>
                        <span class="creation-label">ไลฟ์สด</span>
                    </div>
                    <div class="creation-item item-analytics"
                         style="pointer-events:none;opacity:0;transform:translate(0,0) scale(0)"
                         onclick="PersistentUI.quickCreate('deep_analytics')">
                        <div class="creation-circle" style="background:#1e293b"><i class="fas fa-chart-line" style="color:#fff"></i></div>
                        <span class="creation-label">ข้อมูลเชิงลึก</span>
                    </div>
                    <div class="creation-item item-shop"
                         style="pointer-events:none;opacity:0;transform:translate(0,0) scale(0)"
                         onclick="PersistentUI.safeNavigate('post-product.html')">
                        <div class="creation-circle" style="background:#d97706"><i class="fas fa-store" style="color:#fff"></i></div>
                        <span class="creation-label">ลงขาย</span>
                    </div>
                </div>

                <!-- Camera quick input -->
                <input type="file" id="quickCameraInput" accept="image/*" capture="camera"
                       style="display:none" onchange="PersistentUI.handleQuickCapture(this)">

                <div class="bottom-nav" id="bottomNav">
                    <!-- Home -->
                    <a href="index.html" class="bottom-nav-item" id="nav-home"
                       onclick="PersistentUI.safeNavigate('index.html', event)">
                        <i class="fas fa-home"></i>
                        <span>หน้าแรก</span>
                    </a>

                    <!-- Chat -->
                    <a href="messages.html" class="bottom-nav-item" id="nav-chat"
                       onclick="PersistentUI.safeNavigate('messages.html', event)">
                        <i class="fas fa-comment-dots"></i>
                        <span>แชท</span>
                    </a>

                    <!-- Center TukTuk hub (matches Flutter center hub button) -->
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

                    <!-- Marketplace -->
                    <a href="marketplace.html" class="bottom-nav-item" id="nav-market"
                       onclick="PersistentUI.safeNavigate('marketplace.html', event)">
                        <i class="fas fa-store"></i>
                        <span>ตลาด</span>
                    </a>

                    <!-- Profile/Channel -->
                    <a href="channel.html" class="bottom-nav-item" id="nav-profile"
                       onclick="PersistentUI.safeNavigate('channel.html', event)">
                        <div class="nav-profile-wrapper">
                            <img src="assets/images/logo.png" id="navProfileImg"
                                 onerror="this.src='assets/images/logo.png'">
                        </div>
                        <span>โปรไฟล์</span>
                    </a>
                </div>
            `;

            document.body.appendChild(root);
            console.log('--- 🚀 PERSISTENT UI: 5 items injected into DOM ---');
        },

        setActiveTab() {
            const path = window.location.pathname.toLowerCase();
            const cleanPath = path.split('/').pop().replace('.html', '');
            
            // Clear all
            document.querySelectorAll('.bottom-nav-item').forEach(n => n.classList.remove('active'));

            // Match logic (v1 compatibility + spa paths)
            if (cleanPath === 'index' || cleanPath === '' || cleanPath === '/' || cleanPath === 'tuktuk') {
                document.getElementById('nav-home')?.classList.add('active');
            } else if (cleanPath.includes('message') || cleanPath === 'chat') {
                document.getElementById('nav-chat')?.classList.add('active');
            } else if (cleanPath.includes('market')) {
                document.getElementById('nav-market')?.classList.add('active');
            } else if (cleanPath.includes('channel') || cleanPath.includes('profile')) {
                document.getElementById('nav-profile')?.classList.add('active');
            }
        },

        safeNavigate(url, event) {
            if (event) event.preventDefault();
            console.log('--- 🚀 PERSISTENT UI: Navigating to', url);
            
            // Close creation hub if open
            this.closeCreationHub();
            
            // Use window.navigateToSPA (from spa-router.js) if available
            if (typeof window.navigateToSPA === 'function') {
                window.navigateToSPA(url);
            } else if (window.self !== window.top) {
                // Running inside SPA iframe — ask parent to navigate
                window.top.postMessage({ type: 'NAVIGATE', href: url }, window.location.origin || '*');
            } else {
                window.location.href = url;
            }
        },

        _hubOpen: false,

        handleTukTukButtonClick() {
            if (this._hubOpen) {
                this.closeCreationHub();
            } else {
                this._openHub();
            }
        },

        _openHub() {
            const overlay = document.getElementById('creationOverlay');
            const hub    = document.getElementById('creationHub');
            const title  = document.getElementById('creationHubTitle');
            const btn    = document.getElementById('centerBtn');
            const nav    = document.getElementById('bottomNav');
            if (!overlay || !btn) return;

            this._hubOpen = true;
            if (window.PWA?.haptic) window.PWA.haptic(15);

            // Show overlay
            overlay.style.cssText = 'display:block;opacity:0;transition:opacity 0.35s ease;';
            requestAnimationFrame(() => { overlay.style.opacity = '1'; });

            // Enable hub item pointer-events directly (bypass CSS sibling selector + !important)
            if (hub) hub.style.setProperty('pointer-events', 'auto', 'important');
            if (title) { title.style.opacity = '1'; title.style.transform = 'translateX(-50%) scale(1)'; }

            // Animate items out from center
            document.querySelectorAll('#creationHub .creation-item').forEach((el, i) => {
                el.style.pointerEvents = 'auto';
                el.style.transition = `all 0.45s cubic-bezier(0.19,1,0.22,1) ${i * 40}ms`;
                const positions = [
                    'translate(-80px,-90px) scale(0.95)',
                    'translate(0px,-130px) scale(1.05)',
                    'translate(80px,-90px) scale(0.95)',
                    'translate(115px,-30px) scale(0.85)',
                    'translate(-115px,-30px) scale(0.85)'
                ];
                el.style.opacity = '1';
                el.style.transform = positions[i] || 'translate(0,0) scale(1)';
            });

            btn.classList.add('active');
            nav?.classList.add('overlay-active');
            window.dispatchEvent(new CustomEvent('TukTukHubOpened'));
        },

        closeCreationHub() {
            if (!this._hubOpen) return;
            this._hubOpen = false;

            const overlay = document.getElementById('creationOverlay');
            const hub    = document.getElementById('creationHub');
            const title  = document.getElementById('creationHubTitle');
            const btn    = document.getElementById('centerBtn');
            const nav    = document.getElementById('bottomNav');

            // Collapse items back to center
            document.querySelectorAll('#creationHub .creation-item').forEach(el => {
                el.style.pointerEvents = 'none';
                el.style.opacity = '0';
                el.style.transform = 'translate(0,0) scale(0)';
            });

            if (hub) hub.style.setProperty('pointer-events', 'none', 'important');
            if (title) { title.style.opacity = '0'; }

            // Fade out overlay
            if (overlay) {
                overlay.style.opacity = '0';
                setTimeout(() => { if (!this._hubOpen) overlay.style.display = 'none'; }, 380);
            }

            btn?.classList.remove('active');
            nav?.classList.remove('overlay-active');
            window.dispatchEvent(new CustomEvent('TukTukHubClosed'));
        },

        quickCreate(type) {
            if (window.PWA?.haptic) window.PWA.haptic(25);
            this.closeCreationHub();

            if (type === 'deep_analytics') {
                this.safeNavigate('analytics-dashboard.html');
                return;
            }
            if (type === 'post') {
                if (typeof window.openPostModal === 'function') {
                    window.openPostModal();
                } else if (typeof window.navigateToSPA === 'function') {
                    window.navigateToSPA('index.html?action=post');
                } else {
                    window.location.href = 'index.html?action=post';
                }
                return;
            }
            if (type === 'video') {
                if (typeof window.openPostModal === 'function') {
                    window.openPostModal();
                    setTimeout(() => {
                        const chip = Array.from(document.querySelectorAll('.cat-chip,.node-card'))
                            .find(c => c.textContent.includes('วีดีโอ'));
                        chip?.click();
                    }, 400);
                } else if (typeof window.navigateToSPA === 'function') {
                    window.navigateToSPA('index.html?action=video');
                } else {
                    window.location.href = 'index.html?action=video';
                }
                return;
            }
            if (type === 'camera') {
                document.getElementById('quickCameraInput')?.click();
            }
        },

        handleQuickCapture(input) {
            if (input.files?.[0]) {
                if (window.openPostModal && window.handleMultiMediaUpload) {
                    window.openPostModal();
                    window.handleMultiMediaUpload(input);
                }
            }
        },

        updateProfileImage() {
            const imgEl = document.getElementById('navProfileImg');
            if (!imgEl) return;

            // Multi-source image lookup (highest persistence first)
            const sources = [
                localStorage.getItem('wizmobiz_session'),
                localStorage.getItem('user_data'),
                localStorage.getItem('tuktuk_line_session')
            ];

            for (const raw of sources) {
                if (!raw) continue;
                try {
                    const data = JSON.parse(raw);
                    const pic = data.pictureUrl || data.photoURL || data.picture || data.avatar;
                    if (pic && pic.startsWith('http')) {
                        imgEl.src = pic;
                        return; // Found valid image
                    }
                } catch(e) {}
            }
        },

        setupNavigationGuards() {
            window.addEventListener('popstate', () => {
                this.setActiveTab();
                if (this._hubOpen) this.closeCreationHub();
            });
            window.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this._hubOpen) this.closeCreationHub();
            });
        },

        startMutationObserver() {
            const observer = new MutationObserver((mutations) => {
                const navExist = document.getElementById('bottomNav');
                if (!navExist && !this.isEmbedded) {
                    console.log('--- 🚀 PERSISTENT UI: Re-injecting missing nav ---');
                    this.injectHTML();
                    this.setActiveTab();
                    this.updateProfileImage();
                }
            });
            observer.observe(document.body, { childList: true });
        }
    };

    // Auto-init for fresh load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => PersistentUI.init());
    } else {
        PersistentUI.init();
    }

    // Global aliases for legacy inline onclick attributes
    window.handleTukTukButtonClick = () => window.PersistentUI?.handleTukTukButtonClick();
    window.closeCreationHub       = () => window.PersistentUI?.closeCreationHub();
    window.quickCreate            = (t) => window.PersistentUI?.quickCreate(t);
    window.handleQuickCapture     = (i) => window.PersistentUI?.handleQuickCapture(i);
    window.safeNavigate           = (url, event) => window.PersistentUI?.safeNavigate(url, event);
    window.PersistentUI = PersistentUI;

})();
