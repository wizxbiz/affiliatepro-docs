/**
 * PC Profile Dropdown & User Menu Controller
 * Encapsulates theme toggling, wallet syncing, and navigation for PC layout
 */
const PCUserMenu = {
    _open: false,
    _listenerAttached: false,   // FIX #3: prevent duplicate event listener

    toggle(e) {
        if (e) e.stopPropagation();
        this._open ? this.close() : this.open();
    },

    open() {
        this._open = true;
        const trigger = document.getElementById('pcUserMenuTrigger');
        const dropdown = document.getElementById('pcUserDropdown');
        if (trigger) trigger.classList.add('open');
        if (dropdown) dropdown.classList.add('open');
        
        this._syncHeader();
        this._syncWallet();
        this._syncTheme();
        
        // FIX #3: only add listener once
        if (!this._listenerAttached) {
            this._listenerAttached = true;
            setTimeout(() => document.addEventListener('click', this._outsideHandler), 0);
        }
    },

    close() {
        this._open = false;
        this._listenerAttached = false;
        const trigger = document.getElementById('pcUserMenuTrigger');
        const dropdown = document.getElementById('pcUserDropdown');
        if (trigger) trigger.classList.remove('open');
        if (dropdown) dropdown.classList.remove('open');
        document.removeEventListener('click', this._outsideHandler);
    },

    _outsideHandler: null,

    go(url) {
        this.close();
        if (window.navigateToSPA) window.navigateToSPA(url);
        else window.location.href = url;
    },

    createPost() {
        this.close();
        if (typeof window.openPostModal === 'function') window.openPostModal();
        else this.go('index.html?action=post');
    },

    logout() {
        this.close();
        if (typeof WizmobizAuth !== 'undefined') {
            WizmobizAuth.logout();
        } else {
            localStorage.clear();
            window.location.reload();
        }
    },

    toggleTheme() {
        const isDark = document.body.classList.toggle('dark-mode');
        localStorage.setItem('tuktuk_theme', isDark ? 'dark' : 'light');
        this._syncTheme();
    },

    _syncTheme() {
        const isDark = document.body.classList.contains('dark-mode');
        const toggle = document.getElementById('pudThemeToggle');
        const icon   = document.getElementById('pudThemeIcon');
        const label  = document.getElementById('pudThemeLabel');
        if (toggle) toggle.classList.toggle('on', isDark);
        if (icon)   icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
        if (label)  label.textContent = isDark ? 'โหมดกลางวัน' : 'โหมดกลางคืน';
    },

    _syncHeader() {
        try {
            const raw = localStorage.getItem('user_data') ||
                        localStorage.getItem('tuktuk_line_session') ||
                        localStorage.getItem('wizmobiz_session');
            if (!raw) return;
            const u = JSON.parse(raw);
            const name = u.displayName || u.name || u.userName || '';
            const pic  = u.pictureUrl  || u.photoURL || u.picture || u.avatar || '';
            const tier = u.subscriptionTier || u.tier || '';

            if (name) {
                // FIX #2: sync both dropdown header AND trigger button name
                ['pudName', 'pcTopNavigatorName'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.textContent = name;
                });
            }
            if (pic) {
                // FIX #2: sync both dropdown avatar AND trigger button avatar
                ['pudAvatar', 'pcTopProfileImg'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.src = pic;
                });
            }
            if (tier) {
                const tierMap = {
                    trial:        '⏱ ทดลองใช้งาน',
                    starter:      '⭐ สมาชิก Starter',
                    quarter_3m:   '🥈 แพ็กเกจ 3 เดือน',
                    half_6m:      '🥇 แพ็กเกจ 6 เดือน',
                    yearly_12m:   '💎 แพ็กเกจรายปี',
                    admin:        '🛡️ ผู้ดูแลระบบ',
                };
                const el = document.getElementById('pudTier');
                if (el) el.textContent = tierMap[tier] || '🙂 สมาชิก TukTuk';
            }
        } catch (_) {}
    },

    _syncWallet() {
        try {
            const raw = localStorage.getItem('user_data') ||
                        localStorage.getItem('tuktuk_line_session');
            if (!raw) return;
            const u = JSON.parse(raw);
            const bal = u.available_balance ?? u.balance ?? null;
            if (bal !== null) {
                const el = document.getElementById('pudBalance');
                if (el) el.textContent = '฿' + Number(bal).toLocaleString('th-TH', { minimumFractionDigits: 2 });
            }
        } catch (_) {}
    },

    init() {
        // Bind outside-click handler once (FIX #3: single reference, no duplicates)
        this._outsideHandler = (e) => {
            const trigger = document.getElementById('pcUserMenuTrigger');
            const dropdown = document.getElementById('pcUserDropdown');
            if (trigger && !trigger.contains(e.target) && dropdown && !dropdown.contains(e.target)) {
                this.close();
            }
        };
        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this._open) this.close();
        });
        // FIX #2: sync trigger button immediately on page load
        this._syncHeader();
        // Restore theme preference
        if (localStorage.getItem('tuktuk_theme') === 'dark') {
            document.body.classList.add('dark-mode');
            this._syncTheme();
        }
    }
};

// Auto-init on DOM load
document.addEventListener('DOMContentLoaded', () => PCUserMenu.init());

// Exposed hook for external auth sync
window.addEventListener('tuktuk:autologin', () => PCUserMenu._syncHeader());
