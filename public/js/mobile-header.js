// ==============================================
// MOBILE HEADER CONTROLLER V5 (TukTuk Premium)
// Handles: Tabs, Pill, Province Picker, Auto-scroll
// ==============================================

// State Management
let currentMobileCategory = 'all';
let isMhPillExpanded = false;
let isTuktukGlobalMuted = localStorage.getItem('tuktuk_muted') !== 'false';
let isTuktukAutoScroll = localStorage.getItem('tuktuk_autoscroll') !== 'false'; // default true

// Tab order for horizontal swipe navigation
const _TAB_ORDER = ['all', 'near_me', 'community'];

// Badge Counts
let mhNotifCount = 0;
let mhChatCount = 0;

// DOM Elements
const mhPill = document.getElementById('mhPill');
const mhPillNotif = document.getElementById('mhPillNotif');
const mhPillMute = document.getElementById('mhPillMute');
const mhNotifBadge = document.getElementById('mhPillNotifBadge');
const mhMuteIcon = document.getElementById('mhPillMuteIcon');
const mhMuteLabel = document.getElementById('mhPillMuteLabel');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initMobileHeader();
    syncMuteUI();
    syncAutoScrollUI();
    
    // Load saved province
    const savedProvince = localStorage.getItem('selectedProvince');
    if (savedProvince) {
        const nearMeTab = document.querySelector('.mh-tab[data-cat="near_me"] span');
        if (nearMeTab) nearMeTab.textContent = savedProvince;
    }
});

// ==============================================
// TAB NAVIGATION
// ==============================================

function switchCategoryMobile(category, element) {
    const isSameTab = currentMobileCategory === category;
    
    if (isSameTab) {
        // Special: Near Me tap when already active opens province picker
        if (category === 'near_me') {
            showProvincePicker();
        } else {
            // Scroll to top for other tabs
            window.scrollTo({ top: 0, behavior: 'smooth' });
            // Refresh the mobile feed through the TikTok feed engine first.
            if (typeof window.initTukTukFeed === 'function') {
                window.initTukTukFeed(category, true);
            } else if (typeof window.loadPosts === 'function') {
                window.loadPosts(false);
            }
        }
        return;
    }
    
    // Update active tab UI
    document.querySelectorAll('.mh-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    element.classList.add('active');
    
    currentMobileCategory = category;
    
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(5);
    
    // Near Me: ถ้ายังไม่เคยเลือกจังหวัด ให้แสดง province picker ก่อนโหลด feed
    if (category === 'near_me') {
        const savedProvince = localStorage.getItem('selectedProvince');
        if (!savedProvince) {
            // แสดง picker — selectProvince() จะ trigger initTukTukFeed ให้เอง
            showProvincePicker();
            // ยังคง switch tab UI ให้เสร็จ แต่ feed จะโหลดหลัง province ถูกเลือก
        }
    }

    // Prefer the REST-first TukTuk feed engine. switchCategory can be overwritten by older feed-renderer.js.
    if (typeof window.initTukTukFeed === 'function') {
        window.initTukTukFeed(category, false);
    } else if (typeof window.switchCategory === 'function') {
        window.switchCategory(category);
    } else {
        console.warn('No feed category handler found');
    }
    
    // Update URL without reload
    const url = new URL(window.location);
    url.searchParams.set('cat', category);
    window.history.replaceState({}, '', url);
}

// ==============================================
// PROVINCE PICKER (Match Flutter)
// ==============================================

const THAI_PROVINCES = [
    'กรุงเทพมหานคร', 'กระบี่', 'กาญจนบุรี', 'กาฬสินธุ์', 'กำแพงเพชร', 'ขอนแก่น',
    'จันทบุรี', 'ฉะเชิงเทรา', 'ชลบุรี', 'ชัยนาท', 'ชัยภูมิ', 'ชุมพร',
    'เชียงราย', 'เชียงใหม่', 'ตรัง', 'ตราด', 'ตาก', 'นครนายก',
    'นครปฐม', 'นครพนม', 'นครราชสีมา', 'นครศรีธรรมราช', 'นครสวรรค์', 'นนทบุรี',
    'นราธิวาส', 'น่าน', 'บึงกาฬ', 'บุรีรัมย์', 'ปทุมธานี', 'ประจวบคีรีขันธ์',
    'ปราจีนบุรี', 'ปัตตานี', 'พระนครศรีอยุธยา', 'พะเยา', 'พังงา', 'พัทลุง',
    'พิจิตร', 'พิษณุโลก', 'เพชรบุรี', 'เพชรบูรณ์', 'แพร่', 'ภูเก็ต',
    'มหาสารคาม', 'มุกดาหาร', 'แม่ฮ่องสอน', 'ยโสธร', 'ยะลา', 'ร้อยเอ็ด',
    'ระนอง', 'ระยอง', 'ราชบุรี', 'ลพบุรี', 'ลำปาง', 'ลำพูน',
    'เลย', 'ศรีสะเกษ', 'สกลนคร', 'สงขลา', 'สตูล', 'สมุทรปราการ',
    'สมุทรสงคราม', 'สมุทรสาคร', 'สระแก้ว', 'สระบุรี', 'สิงห์บุรี', 'สุโขทัย',
    'สุพรรณบุรี', 'สุราษฎร์ธานี', 'สุรินทร์', 'หนองคาย', 'หนองบัวลำภู', 'อ่างทอง',
    'อำนาจเจริญ', 'อุดรธานี', 'อุตรดิตถ์', 'อุทัยธานี', 'อุบลราชธานี'
];

function showProvincePicker() {
    // Remove existing picker if any
    const existing = document.querySelector('.province-picker-overlay');
    if (existing) existing.remove();
    
    const overlay = document.createElement('div');
    overlay.className = 'province-picker-overlay';
    
    const selectedProvince = localStorage.getItem('selectedProvince');
    
    overlay.innerHTML = `
        <div class="province-picker-modal">
            <div class="picker-header">
                <span>เลือกจังหวัดเพื่อหาสินค้าใกล้ตัว</span>
                <button class="picker-close" onclick="this.closest('.province-picker-overlay').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="picker-current-location" onclick="useCurrentLocation()">
                <i class="fas fa-location-arrow"></i>
                <span>ตำแหน่งปัจจุบัน</span>
            </div>
            <div class="picker-search">
                <i class="fas fa-search"></i>
                <input type="text" class="picker-search-input" placeholder="ค้นหาจังหวัด..." 
                       oninput="filterProvinces(this.value)">
            </div>
            <div class="picker-list" id="provinceList">
                ${THAI_PROVINCES.map(p => `
                    <div class="picker-item ${p === selectedProvince ? 'selected' : ''}" 
                         onclick="selectProvince('${p}')">
                        <span>${p}</span>
                        ${p === selectedProvince ? '<i class="fas fa-check"></i>' : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Animate in
    setTimeout(() => overlay.classList.add('active'), 10);
}

function filterProvinces(query) {
    const list = document.getElementById('provinceList');
    if (!list) return;
    
    const filtered = THAI_PROVINCES.filter(p => 
        p.toLowerCase().includes(query.toLowerCase())
    );
    
    const selectedProvince = localStorage.getItem('selectedProvince');
    
    list.innerHTML = filtered.map(p => `
        <div class="picker-item ${p === selectedProvince ? 'selected' : ''}" 
             onclick="selectProvince('${p}')">
            <span>${p}</span>
            ${p === selectedProvince ? '<i class="fas fa-check"></i>' : ''}
        </div>
    `).join('');
}

function selectProvince(province) {
    // Save to localStorage (province is always a Thai name string)
    localStorage.setItem('selectedProvince', province);
    localStorage.setItem('selectedProvinceName', province);

    // Update tab label
    const nearMeTab = document.querySelector('.mh-tab[data-cat="near_me"] span');
    if (nearMeTab) nearMeTab.textContent = province;
    
    // Close picker
    const overlay = document.querySelector('.province-picker-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
    }
    
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(10);
    
    // Refresh feed — use window reference to survive load-order race conditions
    if (typeof window.initTukTukFeed === 'function') {
        window.initTukTukFeed('near_me', true);
    } else if (typeof window.switchCategory === 'function') {
        window.switchCategory('near_me');
    }
    
    // Show toast
    if (typeof showToast === 'function') {
        showToast(`📍 แสดงสินค้าในจังหวัด ${province}`, 'success');
    }
}

async function useCurrentLocation() {
    if (!navigator.geolocation) {
        if (typeof showToast === 'function') {
            showToast('เบราว์เซอร์ของคุณไม่รองรับการระบุตำแหน่ง', 'error');
        }
        return;
    }
    
    const btn = document.querySelector('.picker-current-location');
    const originalHtml = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังหาตำแหน่ง...';
    
    try {
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 5000
            });
        });
        
        // Reverse geocoding using free API
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&accept-language=th`
        );
        const data = await response.json();
        
        let province = null;
        
        // Extract province from address
        if (data.address) {
            province = data.address.province || 
                      data.address.state || 
                      data.address.region ||
                      data.address.city;
        }
        
        if (province && THAI_PROVINCES.includes(province)) {
            selectProvince(province);
        } else {
            // Fallback to Bangkok
            selectProvince('กรุงเทพมหานคร');
            if (typeof showToast === 'function') {
                showToast('⚠️ ไม่พบข้อมูลจังหวัด ใช้กรุงเทพฯ เป็นค่าเริ่มต้น', 'warning');
            }
        }
    } catch (error) {
        console.error('Location error:', error);
        btn.innerHTML = originalHtml;
        if (typeof showToast === 'function') {
            showToast('❌ ไม่สามารถเข้าถึงตำแหน่งได้', 'error');
        }
    }
}

// ==============================================
// NOTIFICATION & MUTE PILL
// ==============================================

function toggleMhPill(event) {
    event.stopPropagation();
    
    if (isMhPillExpanded) {
        // Collapse
        mhPill.classList.remove('expanded');
        isMhPillExpanded = false;
    } else {
        // Expand
        mhPill.classList.add('expanded');
        isMhPillExpanded = true;
        
        // Auto-collapse after 4 seconds
        setTimeout(() => {
            if (isMhPillExpanded) {
                mhPill.classList.remove('expanded');
                isMhPillExpanded = false;
            }
        }, 4000);
    }
}

function handleMhNotifClick(event) {
    event.stopPropagation();
    
    if (isMhPillExpanded) {
        // Navigate to notifications
        if (typeof toggleNotifications === 'function') {
            toggleNotifications();
        }
        // Collapse pill
        mhPill.classList.remove('expanded');
        isMhPillExpanded = false;
    } else {
        // Not expanded? Expand it when user clicks the icon
        toggleMhPill(event);
    }
}

function handleMhMuteClick(event) {
    event.stopPropagation();
    
    // Toggle mute
    isTuktukGlobalMuted = !isTuktukGlobalMuted;
    localStorage.setItem('tuktuk_muted', isTuktukGlobalMuted);
    
    syncMuteUI();
    
    // Sync with video players
    if (window.TukTukInteraction) window.TukTukInteraction.isMuted = isTuktukGlobalMuted;
    if (window.FeedRenderer) window.FeedRenderer.isMuted = isTuktukGlobalMuted;

    if (typeof window.syncTuktukVolume === 'function') {
        window.syncTuktukVolume();
    }
    
    // Keep expanded if it was expanded
    if (!isMhPillExpanded) {
        mhPill.classList.add('expanded');
        isMhPillExpanded = true;
        
        // Reset auto-collapse timer
        setTimeout(() => {
            if (isMhPillExpanded) {
                mhPill.classList.remove('expanded');
                isMhPillExpanded = false;
            }
        }, 4000);
    }
}

function syncMuteUI() {
    if (isTuktukGlobalMuted) {
        mhMuteIcon.className = 'fas fa-volume-off';
        mhMuteLabel.textContent = 'ปิดเสียง';
        mhPillMute.classList.add('active');
    } else {
        mhMuteIcon.className = 'fas fa-volume-up';
        mhMuteLabel.textContent = 'เปิดเสียง';
        mhPillMute.classList.remove('active');
    }
}

// Update notification badge (called from feed-renderer.js)
function updateMhNotifBadge(count) {
    mhNotifCount = count;
    
    if (count > 0) {
        mhNotifBadge.textContent = count > 99 ? '99+' : count;
        mhNotifBadge.style.display = 'flex';
        mhPillNotif.classList.add('has-notif');
    } else {
        mhNotifBadge.style.display = 'none';
        mhPillNotif.classList.remove('has-notif');
    }
}

// Update chat badge (called from chat service)
function updateMhChatBadge(count) {
    mhChatCount = count;
    
    // Update bottom nav badge
    const navBadge = document.getElementById('navChatBadge');
    if (navBadge) {
        if (count > 0) {
            navBadge.textContent = count > 99 ? '99+' : count;
            navBadge.style.display = 'flex';
        } else {
            navBadge.style.display = 'none';
        }
    }
}

// ==============================================
// AUTO-SCROLL TOGGLE (no bolt button — called from speed menu)
// ==============================================

// No-op: bolt button removed; UI state synced via speed menu only
function syncAutoScrollUI() {}

function toggleAutoScrollMobile() {
    isTuktukAutoScroll = !isTuktukAutoScroll;
    localStorage.setItem('tuktuk_autoscroll', isTuktukAutoScroll);

    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(5);

    // Show toast
    if (typeof showToast === 'function') {
        showToast(
            isTuktukAutoScroll ? '⚡ เล่นอัตโนมัติเปิดแล้ว' : '⚡ เล่นอัตโนมัติปิดแล้ว',
            'info'
        );
    }

    // Cross-module sync
    if (window.FeedRenderer) window.FeedRenderer.isAutoScroll = isTuktukAutoScroll;

    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('tuktukAutoScrollChange', {
        detail: { enabled: isTuktukAutoScroll }
    }));
}

// ==============================================
// FEED GESTURES — Tap = Speed Menu | Long-press = 2× | Swipe L/R = Switch Tab
// ==============================================

let _fsmVisible = false;
let _fsmHideTimer = null;
let _is2x = false;
let _lp2xTimer = null;
let _touchStartTime = 0;
let _touchMoved = false;
let _touchStartX = 0;
let _touchStartY = 0;
let _touchEndX = 0;
let _touchEndY = 0;

const _SWIPE_MIN_X  = 40;   // minimum horizontal px to count as a swipe
const _SWIPE_RATIO  = 1.5;  // |dx| must be this many times |dy| (mostly horizontal)

function _initFeedGestures() {
    document.addEventListener('touchstart',  _onFeedTouchStart, { passive: true });
    document.addEventListener('touchmove',   _onFeedTouchMove,  { passive: true }); // passive = no e.preventDefault(), lets browser fast-path native scroll
    document.addEventListener('touchend',    _onFeedTouchEnd);
    document.addEventListener('touchcancel', _onFeedTouchEnd);

    // Block browser native long-press "save/download" menu on videos inside the feed
    document.addEventListener('contextmenu', (e) => {
        if (e.target.closest('.tuktuk-feed-container')) e.preventDefault();
    });
}

function _onFeedTouchStart(e) {
    const inFeed  = !!e.target.closest('.tuktuk-feed-container');
    const inTabs  = !!e.target.closest('.mh-tabs');
    if (!inFeed && !inTabs) return;

    // Always track start position — needed for swipe detection on ALL feed elements
    _touchStartTime = Date.now();
    _touchMoved = false;
    _touchStartX = e.touches[0].clientX;
    _touchStartY = e.touches[0].clientY;
    _touchEndX   = _touchStartX;
    _touchEndY   = _touchStartY;

    // Long-press 2× only for non-interactive elements
    if (!e.target.closest('button,a,input,textarea,.tuktuk-action-btn,.mh-tab')) {
        _lp2xTimer = setTimeout(() => { _activate2x(); }, 400);
    }
}

function _onFeedTouchMove(e) {
    if (_touchStartTime === 0) return; // no active feed touch — avoids stale DOM issues
    _touchMoved = true;
    _touchEndX = e.touches[0].clientX;
    _touchEndY = e.touches[0].clientY;
    clearTimeout(_lp2xTimer);
    if (_is2x) _deactivate2x();
}

function _onFeedTouchEnd(e) {
    if (_touchStartTime === 0) return; // no active feed touch
    clearTimeout(_lp2xTimer);

    if (_is2x) {
        _deactivate2x();
        _touchStartTime = 0;
        return;
    }

    // Use changedTouches to get the final position if move didn't fire lately
    if (e.changedTouches && e.changedTouches.length > 0) {
        _touchEndX = e.changedTouches[0].clientX;
        _touchEndY = e.changedTouches[0].clientY;
    }

    const dx = _touchEndX - _touchStartX;
    const dy = _touchEndY - _touchStartY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // ── Horizontal swipe → switch tab ──────────────────────────────────────
    if (absDx >= _SWIPE_MIN_X && absDx >= absDy * _SWIPE_RATIO) {
        _touchStartTime = 0;
        // dx < 0 = swipe LEFT = go to next tab; dx > 0 = swipe RIGHT = prev tab
        _handleTabSwipe(dx < 0 ? 1 : -1);
        return;
    }

    // ── Short tap → toggle speed menu (non-interactive elements only) ───────
    const elapsed = Date.now() - _touchStartTime;
    if (!_touchMoved && elapsed < 400 && elapsed > 0) {
        // Ignore interactive elements + video + pill buttons + embeds
        if (!e.target.closest('button,a,input,textarea,.tuktuk-action-btn,.mh-tab,video,.mh-pill-notif,.mh-pill-mute,#mhPill,iframe,blockquote')) {
            _toggleSpeedMenu();
        }
    }

    _touchStartTime = 0;
}

// Switch to the tab at (currentIndex + delta), clamped to valid range
function _handleTabSwipe(delta) {
    const idx  = _TAB_ORDER.indexOf(currentMobileCategory);
    const next = Math.max(0, Math.min(_TAB_ORDER.length - 1, idx + delta));
    if (next === idx) {
        // Edge — brief visual nudge so user knows there's no more tab
        _nudgeEdge(delta);
        return;
    }
    const cat = _TAB_ORDER[next];
    const tab = document.querySelector(`.mh-tab[data-cat="${cat}"]`);
    if (tab) {
        if (navigator.vibrate) navigator.vibrate(8);
        switchCategoryMobile(cat, tab);
        tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        _showSwipeIndicator(cat);
        // Re-sync active state after any async feed re-renders
        requestAnimationFrame(() => {
            document.querySelectorAll('.mh-tab').forEach(t => t.classList.remove('active'));
            const t = document.querySelector(`.mh-tab[data-cat="${cat}"]`);
            if (t) t.classList.add('active');
        });
    }
}

// Brief nudge animation on feed edge (no more tabs)
function _nudgeEdge(dir) {
    // Get the active container based on current category
    const activeId = (currentMobileCategory === 'near_me') ? 'tuktukFeedNearMe' : 
                     (currentMobileCategory === 'community') ? 'tuktukFeedCommunity' : 'tuktukFeed';
    const feed = document.getElementById(activeId);
    if (!feed) return;
    feed.style.transition = 'transform .15s ease';
    feed.style.transform  = `translateX(${dir > 0 ? -18 : 18}px)`;
    setTimeout(() => {
        feed.style.transform  = '';
        setTimeout(() => { feed.style.transition = ''; }, 160);
    }, 120);
}

// Small floating label showing the new tab name
function _showSwipeIndicator(cat) {
    // Read the label directly from the tab's <span> to always match the real UI
    const tabSpan = document.querySelector(`.mh-tab[data-cat="${cat}"] span`);
    const fallbacks = { all: 'ดูเพลิน', near_me: 'ใกล้ฉัน', community: 'อาชีพ' };
    const tabLabel = tabSpan?.textContent?.trim() || fallbacks[cat] || cat;
    let ind = document.getElementById('swipeTabIndicator');
    if (!ind) {
        ind = document.createElement('div');
        ind.id = 'swipeTabIndicator';
        ind.style.cssText = [
            'position:fixed','top:50%','left:50%',
            'transform:translate(-50%,-50%) scale(0.8)',
            'background:rgba(0,0,0,0.72)','color:#fff',
            'padding:10px 22px','border-radius:24px',
            'font-family:Kanit,sans-serif','font-size:16px','font-weight:700',
            'z-index:20000','pointer-events:none','opacity:0',
            'transition:opacity .18s ease, transform .18s cubic-bezier(0.34,1.56,0.64,1)',
        ].join(';');
        document.body.appendChild(ind);
    }
    ind.textContent = tabLabel;
    // Show
    requestAnimationFrame(() => {
        ind.style.opacity = '1';
        ind.style.transform = 'translate(-50%,-50%) scale(1)';
        clearTimeout(ind._timer);
        ind._timer = setTimeout(() => {
            ind.style.opacity = '0';
            ind.style.transform = 'translate(-50%,-50%) scale(0.8)';
        }, 900);
    });
}

// ── 2× speed ──────────────────────────────────────────────────────────────────
function _activate2x() {
    _is2x = true;
    document.querySelectorAll('video').forEach(v => v.playbackRate = 2);
    _showSpeedBadge('2×');
    if (navigator.vibrate) navigator.vibrate([15, 8, 15]);
}

function _deactivate2x() {
    _is2x = false;
    document.querySelectorAll('video').forEach(v => v.playbackRate = 1);
    _hideSpeedBadge();
}

function _showSpeedBadge(text) {
    let el = document.getElementById('speedBadge');
    if (!el) {
        el = document.createElement('div');
        el.id = 'speedBadge';
        el.className = 'speed-badge';
        document.body.appendChild(el);
    }
    el.textContent = text;
    el.classList.add('visible');
}

function _hideSpeedBadge() {
    document.getElementById('speedBadge')?.classList.remove('visible');
}

// ── Speed Menu ─────────────────────────────────────────────────────────────────
function _toggleSpeedMenu() {
    _fsmVisible ? _hideSpeedMenu() : _showSpeedMenu();
}

function _buildSpeedMenu() {
    const el = document.createElement('div');
    el.id = 'feedSpeedMenu';
    el.className = 'feed-speed-menu';
    el.innerHTML = `
        <button class="fsm-btn ${isTuktukAutoScroll ? 'active' : ''}" id="fsmAutoBtn" onclick="_fsmToggleAuto()">
            <span class="fsm-icon">⚡</span>
            <span class="fsm-label">Auto</span>
        </button>
        <button class="fsm-btn ${_is2x ? 'active' : ''}" id="fsm2xBtn" onclick="_fsm2xToggle()">
            <span class="fsm-icon" style="font-weight:900;font-family:'Kanit',sans-serif;">2×</span>
            <span class="fsm-label">เร็ว</span>
        </button>
        <button class="fsm-btn ${isTuktukGlobalMuted ? 'active' : ''}" id="fsmMuteBtn" onclick="_fsmToggleMute()">
            <span class="fsm-icon">${isTuktukGlobalMuted ? '🔇' : '🔊'}</span>
            <span class="fsm-label">เสียง</span>
        </button>
    `;
    document.body.appendChild(el);
    return el;
}

function _showSpeedMenu() {
    let menu = document.getElementById('feedSpeedMenu');
    if (!menu) {
        menu = _buildSpeedMenu();
    } else {
        // Sync states
        document.getElementById('fsmAutoBtn')?.classList.toggle('active', isTuktukAutoScroll);
        document.getElementById('fsm2xBtn')?.classList.toggle('active', _is2x);
        document.getElementById('fsmMuteBtn')?.classList.toggle('active', isTuktukGlobalMuted);
        const muteIcon = document.querySelector('#fsmMuteBtn .fsm-icon');
        if (muteIcon) muteIcon.textContent = isTuktukGlobalMuted ? '🔇' : '🔊';
    }

    menu.classList.add('visible');
    _fsmVisible = true;

    clearTimeout(_fsmHideTimer);
    _fsmHideTimer = setTimeout(_hideSpeedMenu, 3500);
}

function _hideSpeedMenu() {
    document.getElementById('feedSpeedMenu')?.classList.remove('visible');
    _fsmVisible = false;
    clearTimeout(_fsmHideTimer);
}

function _fsmToggleAuto() {
    toggleAutoScrollMobile();
    document.getElementById('fsmAutoBtn')?.classList.toggle('active', isTuktukAutoScroll);
    _resetFsmTimer();
}

function _fsm2xToggle() {
    if (_is2x) _deactivate2x(); else _activate2x();
    document.getElementById('fsm2xBtn')?.classList.toggle('active', _is2x);
    _resetFsmTimer();
}

function _fsmToggleMute() {
    isTuktukGlobalMuted = !isTuktukGlobalMuted;
    localStorage.setItem('tuktuk_muted', isTuktukGlobalMuted);
    
    // Cross-module sync
    if (window.TukTukInteraction) window.TukTukInteraction.isMuted = isTuktukGlobalMuted;
    if (window.FeedRenderer) window.FeedRenderer.isMuted = isTuktukGlobalMuted;

    syncMuteUI();
    
    // Sync with video players
    if (typeof window.syncTuktukVolume === 'function') {
        window.syncTuktukVolume();
    }

    const muteIcon = document.querySelector('#fsmMuteBtn .fsm-icon');
    if (muteIcon) muteIcon.textContent = isTuktukGlobalMuted ? '🔇' : '🔊';

    _resetFsmTimer();
}

function _resetFsmTimer() {
    clearTimeout(_fsmHideTimer);
    _fsmHideTimer = setTimeout(_hideSpeedMenu, 2500);
}

// ==============================================
// DRAWER
// ==============================================

function toggleMobileDrawer() {
    const drawer = document.getElementById('mobileDrawer');
    const overlay = document.getElementById('mobileDrawerOverlay');
    if (!drawer || !overlay) return;

    const isActive = drawer.classList.toggle('active');
    overlay.classList.toggle('active', isActive);
    
    // Fix for hit-testing: disable pointer events on main content when drawer is open
    document.body.classList.toggle('drawer-open', isActive);

    if (isActive) {
        _drawerSyncAll();
        if (navigator.vibrate) navigator.vibrate(5);
    }
}

function _drawerSyncAll() {
    _drawerSyncUser();
    _drawerSyncNotif();
    _drawerSyncTheme();
    _drawerSyncBalance();
}

// Sync logged-in user info into drawer header
function _drawerSyncUser() {
    const nameEl   = document.getElementById('drawerUserName');
    const tierEl   = document.getElementById('drawerUserTier');
    const avatarEl = document.getElementById('drawerAvatar');

    let user = null;
    if (typeof WizmobizAuth !== 'undefined' && typeof WizmobizAuth.getUser === 'function') {
        user = WizmobizAuth.getUser();
    }
    if (!user) {
        // Try raw localStorage fallback
        try {
            const raw = localStorage.getItem('wizmobiz_session') || localStorage.getItem('tuktuk_line_session');
            if (raw) user = JSON.parse(raw);
        } catch (_) {}
    }

    if (user) {
        if (nameEl)   nameEl.textContent   = user.displayName || user.name || 'TukTuk User';
        if (avatarEl) avatarEl.src          = user.pictureUrl  || user.photoURL || 'assets/images/logo.png';
        if (tierEl) {
            const tier = user.subscriptionPlan || user.tier || 'free';
            const tierMap = { premium: '⭐ Premium', pro: '💎 Pro', free: 'สมาชิก TukTuk' };
            tierEl.textContent = tierMap[tier] || tierMap.free;
        }
    } else {
        if (nameEl)   nameEl.textContent   = 'ยังไม่ได้เข้าสู่ระบบ';
        if (avatarEl) avatarEl.src          = 'assets/images/logo.png';
        if (tierEl)   tierEl.textContent   = 'กดเพื่อเข้าสู่ระบบ';
        const section = document.getElementById('drawerUserSection');
        if (section) section.onclick = () => { toggleMobileDrawer(); location.href = 'login.html'; };
    }
}

// Sync notification badge into drawer
function _drawerSyncNotif() {
    const badge = document.getElementById('drawerNotifBadge');
    const label = document.getElementById('drawerNotifLabel');
    if (!badge) return;
    if (mhNotifCount > 0) {
        badge.textContent = mhNotifCount > 99 ? '99+' : mhNotifCount;
        badge.style.display = 'inline-flex';
        if (label) label.textContent = 'แจ้งเตือน';
    } else {
        badge.style.display = 'none';
        if (label) label.textContent = 'แจ้งเตือน';
    }
}

// Sync dark-mode toggle chip
function _drawerSyncTheme() {
    const chip  = document.getElementById('drawerThemeChip');
    const icon  = document.getElementById('drawerThemeIcon');
    const label = document.getElementById('drawerThemeLabel');
    const isDark = document.body.classList.contains('dark-mode');
    if (chip)  chip.classList.toggle('dark-active', isDark);
    if (icon)  icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    if (label) label.textContent = isDark ? 'กลางวัน' : 'กลางคืน';
}

// Sync wallet balance (reads from PCUserMenu state if available)
function _drawerSyncBalance() {
    const el = document.getElementById('drawerBalance');
    if (!el) return;
    const pcBalance = document.getElementById('pudBalance');
    if (pcBalance && pcBalance.textContent && pcBalance.textContent !== '฿ —') {
        el.textContent = pcBalance.textContent;
    }
}

// ── Drawer Action Helpers (called from inline onclick in HTML) ──

function drawerGo(url) {
    toggleMobileDrawer();
    setTimeout(() => {
        if (typeof window.navigateToSPA === 'function') {
            window.navigateToSPA(url);
        } else {
            window.location.href = url;
        }
    }, 200);
}

function drawerSwitchTab(cat) {
    toggleMobileDrawer();
    setTimeout(() => {
        const tab = document.querySelector(`.mh-tab[data-cat="${cat}"]`);
        if (tab && typeof switchCategoryMobile === 'function') {
            switchCategoryMobile(cat, tab);
        }
    }, 250);
}

function drawerCreatePost() {
    toggleMobileDrawer();
    setTimeout(() => {
        // openQuickPostModal is exported by community_feed_integration.js
        const openFn = window['openQuickPostModal'] || window['openPostModal'];
        if (typeof openFn === 'function') {
            openFn();
        } else {
            // Fallback: open quickPostModal Bootstrap modal directly
            const el = document.getElementById('quickPostModal');
            if (el && window.bootstrap) {
                bootstrap.Modal.getOrCreateInstance(el).show();
            }
        }
    }, 250);
}

function drawerGoNotif() {
    toggleMobileDrawer();
    setTimeout(() => {
        if (typeof window.toggleNotifications === 'function') {
            window.toggleNotifications();
        }
    }, 200);
}

function drawerToggleTheme() {
    // Reuse PCUserMenu.toggleTheme if available, otherwise manual toggle
    if (typeof PCUserMenu !== 'undefined' && typeof PCUserMenu.toggleTheme === 'function') {
        PCUserMenu.toggleTheme();
    } else {
        const isDark = document.body.classList.toggle('dark-mode');
        localStorage.setItem('tuktuk_dark_mode', isDark ? '1' : '0');
    }
    _drawerSyncTheme();
}

function drawerLogout() {
    toggleMobileDrawer();
    setTimeout(() => {
        if (typeof WizmobizAuth !== 'undefined' && typeof WizmobizAuth.logout === 'function') {
            WizmobizAuth.logout();
        } else {
            localStorage.removeItem('wizmobiz_session');
            localStorage.removeItem('tuktuk_line_session');
            window.location.href = 'login.html';
        }
    }, 200);
}

function drawerClearCache() {
    // Close drawer first so animation is visible on feed
    toggleMobileDrawer();

    // Wait for drawer close transition (300ms) then fire PTR animation + reload
    setTimeout(() => {
        const cat = (typeof currentMobileCategory !== 'undefined' ? currentMobileCategory : null)
            || sessionStorage.getItem('tuktuk_last_category')
            || 'all';

        const doRefresh = async () => {
            if (typeof window.clearFeedCache === 'function') window.clearFeedCache();

            if (typeof window.initTukTukFeed === 'function') {
                await window.initTukTukFeed(cat);
            } else if (typeof window.switchCategory === 'function') {
                window.switchCategory(cat);
            }

            if (typeof showToast === 'function') showToast('🔄 โหลดฟีดใหม่แล้ว', 'success');
        };

        if (typeof window.triggerPTRRefresh === 'function') {
            // Use the taxi PTR animation + run refresh inside it
            window.triggerPTRRefresh(doRefresh);
        } else {
            // PTR not initialized (PC or script not loaded) — run directly
            doRefresh();
        }
    }, 320);
}

// ==============================================
// SEARCH
// ==============================================

function openUnifiedSearch() {
    if (typeof window.openSearchModal === 'function') {
        window.openSearchModal();
    } else {
        window.location.href = 'search.html';
    }
}

// ==============================================
// INITIALIZATION
// ==============================================

function initMobileHeader() {
    console.log('📱 Mobile Header V5 initialized');

    // Check URL params for category
    const urlParams = new URLSearchParams(window.location.search);
    const catParam = urlParams.get('cat');
    if (catParam && ['all', 'near_me', 'community'].includes(catParam)) {
        const tab = document.querySelector(`.mh-tab[data-cat="${catParam}"]`);
        if (tab) switchCategoryMobile(catParam, tab);
    }

    // Init feed tap/long-press gestures
    _initFeedGestures();

    // Add window functions for external calls
    window.updateMhNotifBadge   = updateMhNotifBadge;
    window.updateMhChatBadge    = updateMhChatBadge;
    window.showProvincePicker   = showProvincePicker;
    window.selectProvince       = selectProvince;
    window.useCurrentLocation   = useCurrentLocation;
    window.toggleAutoScrollMobile = toggleAutoScrollMobile;
    window._fsmToggleAuto       = _fsmToggleAuto;
    window._fsm2xToggle         = _fsm2xToggle;
    window._fsmToggleMute       = _fsmToggleMute;
    window._hideSpeedMenu       = _hideSpeedMenu;
    // Drawer helpers
    window.drawerGo             = drawerGo;
    window.drawerSwitchTab      = drawerSwitchTab;
    window.drawerCreatePost     = drawerCreatePost;
    window.drawerGoNotif        = drawerGoNotif;
    window.drawerToggleTheme    = drawerToggleTheme;
    window.drawerLogout         = drawerLogout;
    // Re-sync drawer when auth state changes (called by WizmobizAuth after login)
    window._drawerSyncUser      = _drawerSyncUser;
}

// Export functions
window.switchCategoryMobile = switchCategoryMobile;
window.toggleMobileDrawer = toggleMobileDrawer;
// Expose currentMobileCategory as a live getter so external scripts read the real value
try {
    Object.defineProperty(window, 'currentMobileCategory', {
        get() { return currentMobileCategory; },
        configurable: true,
    });
} catch(_) {}
window.toggleMhPill = toggleMhPill;
window.handleMhNotifClick = handleMhNotifClick;
window.handleMhMuteClick = handleMhMuteClick;
window.openUnifiedSearch = openUnifiedSearch;