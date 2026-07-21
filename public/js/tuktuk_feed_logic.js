// ================================================
// tuktuk_feed_logic.js - TukTuk Feed Engine V5
// TikTok-style + PC Grid + Near Me + Community
// Firebase + Go Engine Integration
// ================================================

// ================================================
// CONFIGURATION & CONSTANTS
// ================================================
const TUKTUK_FEED_CONFIG = {
    // Radius limits (km)
    NEAR_ME_RADIUS: 200,
    PRODUCT_RADIUS: 100,
    
    // Pagination limits
    POSTS_LIMIT: 50,
    PRODUCTS_LIMIT: 30,
    NEWS_LIMIT: 50,
    
    // Timing (ms)
    VIDEO_LOAD_TIMEOUT: 10000,
    AUTO_SCROLL_DELAY: 20000,
    PRODUCT_TIMER_DELAY: 15000,
    SEARCH_DEBOUNCE: 300,
    CACHE_TTL: 5 * 60 * 1000, // 5 minutes
    
    // Interleaving ratios (products : info)
    NEAR_ME_RATIO: { products: 5, info: 1 },
    DEFAULT_RATIO: { products: 1, info: 3 },
    
    // Thresholds
    INTERSECTION_THRESHOLD: 0.5,
    DISTANCE_SORT: true,
    
    // Feature flags
    ENABLE_GO_ENGINE: true,
    ENABLE_CACHE: true,
    ENABLE_VERIFICATION: true
};

// ================================================
// GLOBAL STATE (Namespaced)
// ================================================
window.TukTukFeed = window.TukTukFeed || {
    // State
    currentCategory: 'all',
    currentFeed: [],
    feedCache: {},
    cacheTimestamps: {},
    userLocation: null,
    selectedProvince: null,
    unsubscribe: null,

    // Pagination cursors per cacheKey (Firestore lastDoc snapshots)
    lastDocs: {},
    feedEnded: {},  // true when Firestore returned fewer rows than limit

    // Audio / playback state
    isMuted: (function(){ try { return localStorage.getItem('tuktuk_muted') !== 'false'; } catch(e){ return true; } })(), // default muted
    slideIndex: 0,

    // Flags
    isLoading: false,
    isPaused: false,
    didAutoInit: false,

    // Observers
    observers: [],
    timers: {},
    sidebarHideTimers: {},

    // Stats
    metrics: {
        loads: 0,
        errors: 0,
        cacheHits: 0
    }
};

window.TukTukFeed.diagnostics = Array.isArray(window.TukTukFeed.diagnostics)
    ? window.TukTukFeed.diagnostics
    : [];

function recordFeedDiagnostic(event, detail = {}) {
    const entry = {
        at: new Date().toISOString(),
        event,
        ...detail,
    };
    window.TukTukFeed.diagnostics.push(entry);
    while (window.TukTukFeed.diagnostics.length > 80) {
        window.TukTukFeed.diagnostics.shift();
    }

    if (/error|failed|timeout|empty|unavailable/i.test(event)) {
        console.warn('[TukTukFeed]', event, detail);
    }
    return entry;
}

// ================================================
// FIREBASE INITIALIZATION
// ================================================
if (typeof db === 'undefined' && typeof firebase !== 'undefined') {
    var db = firebase.firestore();
}

function getFeedFirebase() {
    if (typeof window !== 'undefined' && window.firebase) return window.firebase;
    if (typeof firebase !== 'undefined') return firebase;
    return null;
}

function getFeedFirestore() {
    if (typeof window !== 'undefined' && window.db) return window.db;
    if (typeof db !== 'undefined' && db) return db;

    const fb = getFeedFirebase();
    if (fb && fb.firestore) {
        const firestoreDb = fb.firestore();
        try {
            window.db = window.db || firestoreDb;
        } catch (_) {}
        return firestoreDb;
    }
    return null;
}

async function waitForFeedDb(timeoutMs = 5000) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
        const feedDb = getFeedFirestore();
        const fb = getFeedFirebase();
        if (feedDb && fb && fb.firestore) return feedDb;
        await new Promise(resolve => setTimeout(resolve, 150));
    }
    return getFeedFirestore();
}

// ================================================
// UTILITY FUNCTIONS
// ================================================

/**
 * Safe HTML escaping
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Format time ago (Thai)
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
 * Format number with commas
 */
function formatNumber(num) {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString();
}

/**
 * Debounce function for search
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
 * Show toast notification
 */
function showFeedToast(message, type = 'info', duration = 3000) {
    // Reuse global showToast if available
    if (typeof window.showToast === 'function') {
        window.showToast(message, type);
        return;
    }
    
    // Fallback toast system if global showToast is missing
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
                     'linear-gradient(135deg, #3b82f6, #2563eb)'};
        color: white;
        padding: 12px 24px;
        border-radius: 50px;
        font-weight: 600;
        z-index: 100000;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        animation: feedToastIn 0.3s ease;
        pointer-events: none;
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'feedToastOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Add toast animations
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
    `;
    document.head.appendChild(style);
}

// ================================================
// LOCATION SERVICES
// ================================================

/**
 * Get user location with caching
 */
async function getUserLocation(forceRefresh = false) {
    // Return cached if available and not expired (< 5 min)
    if (!forceRefresh && TukTukFeed.userLocation &&
        (Date.now() - TukTukFeed.userLocation.timestamp) < 300000) {
        return TukTukFeed.userLocation;
    }

    if (!navigator.geolocation) {
        console.warn('[TukTukFeed] Geolocation not supported');
        showFeedToast('เบราว์เซอร์ไม่รองรับการระบุตำแหน่ง', 'error');
        return null;
    }

    // Must be HTTPS (or localhost) for geolocation to work
    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        console.warn('[TukTukFeed] Geolocation requires HTTPS');
        showFeedToast('ต้องใช้ HTTPS สำหรับการระบุตำแหน่ง', 'error');
        return null;
    }

    // Check permission state if supported
    if (navigator.permissions) {
        try {
            const perm = await navigator.permissions.query({ name: 'geolocation' });
            if (perm.state === 'denied') {
                showFeedToast('กรุณาอนุญาตการเข้าถึงตำแหน่งในการตั้งค่าเบราว์เซอร์', 'warning');
                // Fallback: show province picker
                if (typeof showProvincePicker === 'function') showProvincePicker();
                return null;
            }
        } catch (_) { /* ignore — query not supported on some browsers */ }
    }

    try {
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 15000, // Increased to 15s
                maximumAge: 300000 // 5 min cache
            });
        }).catch(async (err) => {
            // Try again with low accuracy if high accuracy times out/fails
            if (err.code !== 1) { // 1 = Denied, no point retrying
                console.log('[TukTukFeed] Retrying with low accuracy...');
                return new Promise((res, rej) => {
                    navigator.geolocation.getCurrentPosition(res, rej, {
                        enableHighAccuracy: false,
                        timeout: 10000,
                        maximumAge: 600000
                    });
                });
            }
            throw err;
        });

        TukTukFeed.userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now()
        };

        return TukTukFeed.userLocation;
    } catch (error) {
        console.warn('[TukTukFeed] Location error:', error.code, error.message);
        
        // Suppress toast for timeout (code 3) to avoid annoying users
        if (error.code === 3) {
            console.log('[TukTukFeed] Geolocation timeout - continuing without location');
        } else {
            const msg = error.code === 1
                ? 'ถูกปฏิเสธการเข้าถึงตำแหน่ง — กรุณาอนุญาตในการตั้งค่า'
                : 'ไม่สามารถระบุตำแหน่งได้ในขณะนี้';
            showFeedToast(msg, 'error');
        }

        // Fallback: show province picker so user can select manually if no location and no province selected
        if (!TukTukFeed.selectedProvince && typeof showProvincePicker === 'function') {
            setTimeout(() => {
                const existing = document.querySelector('.province-picker-overlay');
                if (!existing) showProvincePicker();
            }, 1500);
        }
        return null;
    }
}

/**
 * Haversine distance calculation (km)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// ================================================
// PROVINCE PICKER (Premium Glassmorphism)
// ================================================

/**
 * Fetch provinces from API
 */
async function fetchProvinces() {
    try {
        // Static list — all 77 Thai provinces, no API call needed
        return [
            { code: '10', name_th: 'กรุงเทพมหานคร', name_en: 'Bangkok' },
            { code: '11', name_th: 'สมุทรปราการ', name_en: 'Samut Prakan' },
            { code: '12', name_th: 'นนทบุรี', name_en: 'Nonthaburi' },
            { code: '13', name_th: 'ปทุมธานี', name_en: 'Pathum Thani' },
            { code: '14', name_th: 'พระนครศรีอยุธยา', name_en: 'Ayutthaya' },
            { code: '15', name_th: 'อ่างทอง', name_en: 'Ang Thong' },
            { code: '16', name_th: 'ลพบุรี', name_en: 'Lopburi' },
            { code: '17', name_th: 'สิงห์บุรี', name_en: 'Sing Buri' },
            { code: '18', name_th: 'ชัยนาท', name_en: 'Chai Nat' },
            { code: '19', name_th: 'สระบุรี', name_en: 'Saraburi' },
            { code: '20', name_th: 'ชลบุรี', name_en: 'Chonburi' },
            { code: '21', name_th: 'ระยอง', name_en: 'Rayong' },
            { code: '22', name_th: 'จันทบุรี', name_en: 'Chanthaburi' },
            { code: '23', name_th: 'ตราด', name_en: 'Trat' },
            { code: '24', name_th: 'ฉะเชิงเทรา', name_en: 'Chachoengsao' },
            { code: '25', name_th: 'ปราจีนบุรี', name_en: 'Prachin Buri' },
            { code: '26', name_th: 'นครนายก', name_en: 'Nakhon Nayok' },
            { code: '27', name_th: 'สระแก้ว', name_en: 'Sa Kaeo' },
            { code: '30', name_th: 'นครราชสีมา', name_en: 'Nakhon Ratchasima' },
            { code: '31', name_th: 'บุรีรัมย์', name_en: 'Buri Ram' },
            { code: '32', name_th: 'สุรินทร์', name_en: 'Surin' },
            { code: '33', name_th: 'ศรีสะเกษ', name_en: 'Si Sa Ket' },
            { code: '34', name_th: 'อุบลราชธานี', name_en: 'Ubon Ratchathani' },
            { code: '35', name_th: 'ยโสธร', name_en: 'Yasothon' },
            { code: '36', name_th: 'ชัยภูมิ', name_en: 'Chaiyaphum' },
            { code: '37', name_th: 'อำนาจเจริญ', name_en: 'Amnat Charoen' },
            { code: '38', name_th: 'บึงกาฬ', name_en: 'Bueng Kan' },
            { code: '39', name_th: 'หนองบัวลำภู', name_en: 'Nong Bua Lam Phu' },
            { code: '40', name_th: 'ขอนแก่น', name_en: 'Khon Kaen' },
            { code: '41', name_th: 'อุดรธานี', name_en: 'Udon Thani' },
            { code: '42', name_th: 'เลย', name_en: 'Loei' },
            { code: '43', name_th: 'หนองคาย', name_en: 'Nong Khai' },
            { code: '44', name_th: 'มหาสารคาม', name_en: 'Maha Sarakham' },
            { code: '45', name_th: 'ร้อยเอ็ด', name_en: 'Roi Et' },
            { code: '46', name_th: 'กาฬสินธุ์', name_en: 'Kalasin' },
            { code: '47', name_th: 'สกลนคร', name_en: 'Sakon Nakhon' },
            { code: '48', name_th: 'นครพนม', name_en: 'Nakhon Phanom' },
            { code: '49', name_th: 'มุกดาหาร', name_en: 'Mukdahan' },
            { code: '50', name_th: 'เชียงใหม่', name_en: 'Chiang Mai' },
            { code: '51', name_th: 'ลำพูน', name_en: 'Lamphun' },
            { code: '52', name_th: 'ลำปาง', name_en: 'Lampang' },
            { code: '53', name_th: 'อุตรดิตถ์', name_en: 'Uttaradit' },
            { code: '54', name_th: 'แพร่', name_en: 'Phrae' },
            { code: '55', name_th: 'น่าน', name_en: 'Nan' },
            { code: '56', name_th: 'พะเยา', name_en: 'Phayao' },
            { code: '57', name_th: 'เชียงราย', name_en: 'Chiang Rai' },
            { code: '58', name_th: 'แม่ฮ่องสอน', name_en: 'Mae Hong Son' },
            { code: '60', name_th: 'นครสวรรค์', name_en: 'Nakhon Sawan' },
            { code: '61', name_th: 'อุทัยธานี', name_en: 'Uthai Thani' },
            { code: '62', name_th: 'กำแพงเพชร', name_en: 'Kamphaeng Phet' },
            { code: '63', name_th: 'ตาก', name_en: 'Tak' },
            { code: '64', name_th: 'สุโขทัย', name_en: 'Sukhothai' },
            { code: '65', name_th: 'พิษณุโลก', name_en: 'Phitsanulok' },
            { code: '66', name_th: 'พิจิตร', name_en: 'Phichit' },
            { code: '67', name_th: 'เพชรบูรณ์', name_en: 'Phetchabun' },
            { code: '70', name_th: 'ราชบุรี', name_en: 'Ratchaburi' },
            { code: '71', name_th: 'กาญจนบุรี', name_en: 'Kanchanaburi' },
            { code: '72', name_th: 'สุพรรณบุรี', name_en: 'Suphan Buri' },
            { code: '73', name_th: 'นครปฐม', name_en: 'Nakhon Pathom' },
            { code: '74', name_th: 'สมุทรสาคร', name_en: 'Samut Sakhon' },
            { code: '75', name_th: 'สมุทรสงคราม', name_en: 'Samut Songkhram' },
            { code: '76', name_th: 'เพชรบุรี', name_en: 'Phetchaburi' },
            { code: '77', name_th: 'ประจวบคีรีขันธ์', name_en: 'Prachuap Khiri Khan' },
            { code: '80', name_th: 'นครศรีธรรมราช', name_en: 'Nakhon Si Thammarat' },
            { code: '81', name_th: 'กระบี่', name_en: 'Krabi' },
            { code: '82', name_th: 'พังงา', name_en: 'Phang Nga' },
            { code: '83', name_th: 'ภูเก็ต', name_en: 'Phuket' },
            { code: '84', name_th: 'สุราษฎร์ธานี', name_en: 'Surat Thani' },
            { code: '85', name_th: 'ระนอง', name_en: 'Ranong' },
            { code: '86', name_th: 'ชุมพร', name_en: 'Chumphon' },
            { code: '90', name_th: 'สงขลา', name_en: 'Songkhla' },
            { code: '91', name_th: 'สตูล', name_en: 'Satun' },
            { code: '92', name_th: 'ตรัง', name_en: 'Trang' },
            { code: '93', name_th: 'พัทลุง', name_en: 'Phatthalung' },
            { code: '94', name_th: 'ปัตตานี', name_en: 'Pattani' },
            { code: '95', name_th: 'ยะลา', name_en: 'Yala' },
            { code: '96', name_th: 'นราธิวาส', name_en: 'Narathiwat' },
        ];
    } catch (error) {
        console.error('[TukTukFeed] Error fetching provinces:', error);
        return [];
    }
}

/**
 * Show province picker modal
 */
window.showProvincePicker = async function() {
    try {
        const list = await fetchProvinces();
        const sortedList = list.sort((a, b) => a.name_th.localeCompare(b.name_th, 'th'));
        
        // Remove existing picker
        const existing = document.querySelector('.province-picker-overlay');
        if (existing) existing.remove();
        
        const modal = document.createElement('div');
        modal.className = 'province-picker-overlay';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.85);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            z-index: 10000020;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            opacity: 0;
            transition: opacity 0.3s;
        `;
        
        // selectedProvince is stored as the Thai name (e.g. "กรุงเทพมหานคร")
        const selectedProvince = TukTukFeed.selectedProvince ||
            localStorage.getItem('selectedProvince') ||
            sessionStorage.getItem('selectedProvince');
        
        modal.innerHTML = `
            <div class="province-picker-card" style="
                background: rgba(30,30,30,0.7);
                width: 100%;
                max-width: 400px;
                border-radius: 24px;
                border: 1px solid rgba(255,255,255,0.15);
                display: flex;
                flex-direction: column;
                max-height: 80vh;
                box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
            ">
                <div style="padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; color: white; font-size: 1.2rem; font-weight: 700;">
                        <i class="fas fa-map-marker-alt" style="color: #22d3ee;"></i> เลือกจังหวัดใกล้คุณ
                    </h3>
                    <button class="picker-close-btn" style="background: rgba(255,255,255,0.1); border: none; color: white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div style="padding: 15px; position: relative;">
                    <i class="fas fa-search" style="position: absolute; left: 25px; top: 50%; transform: translateY(-50%); color: #aaa;"></i>
                    <input type="text" id="provSearch" placeholder="ค้นหาจังหวัด..." style="
                        width: 100%;
                        padding: 10px 10px 10px 35px;
                        border-radius: 12px;
                        background: rgba(255,255,255,0.05);
                        border: 1px solid rgba(255,255,255,0.1);
                        color: white;
                        outline: none;
                    ">
                </div>
                
                <div id="provList" style="flex: 1; overflow-y: auto; padding: 10px;">
                    <div class="prov-item" onclick="useCurrentLocation()" style="
                        padding: 15px;
                        border-radius: 12px;
                        color: #22d3ee;
                        cursor: pointer;
                        margin-bottom: 5px;
                        background: rgba(34, 211, 238, 0.1);
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    ">
                        <i class="fas fa-location-arrow"></i>
                        <span>ตำแหน่งปัจจุบัน</span>
                    </div>
                    
                    ${sortedList.map(p => `
                        <div class="prov-item" data-code="${p.code}" data-name="${p.name_th}" style="
                            padding: 15px;
                            border-radius: 12px;
                            color: white;
                            cursor: pointer;
                            margin-bottom: 5px;
                            transition: 0.2s;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            ${selectedProvince === p.name_th ? 'background: rgba(34, 211, 238, 0.2); border-left: 3px solid #22d3ee;' : ''}
                        ">
                            <span>${p.name_th}</span>
                            <small style="opacity: 0.5;">${p.name_en}</small>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        setTimeout(() => modal.style.opacity = '1', 10);

        // Search functionality
        const input = modal.querySelector('#provSearch');
        if (input) {
            input.focus();
            input.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                modal.querySelectorAll('.prov-item').forEach(item => {
                    if (item.dataset.name) {
                        const text = item.dataset.name.toLowerCase();
                        item.style.display = text.includes(term) ? 'flex' : 'none';
                    }
                });
            });
        }

        // Close functions
        const closePicker = () => {
            modal.style.opacity = '0';
            setTimeout(() => modal.remove(), 300);
        };

        // Click on X button
        const closeBtn = modal.querySelector('.picker-close-btn');
        if (closeBtn) closeBtn.onclick = closePicker;

        // Click outside (on the overlay background)
        modal.onclick = (e) => {
            if (e.target === modal) closePicker();
        };

        // Hover effect for close button
        if (closeBtn) {
            closeBtn.onmouseenter = () => closeBtn.style.background = 'rgba(255,255,255,0.2)';
            closeBtn.onmouseleave = () => closeBtn.style.background = 'rgba(255,255,255,0.1)';
        }

        // Bind province item clicks (data-code items)
        modal.querySelectorAll('.prov-item[data-code]').forEach(el => {
            el.onclick = () => window.selectProvince(el.dataset.code, el.dataset.name);
            el.onmouseenter = () => { if (!el.style.background.includes('0.2')) el.style.background = 'rgba(255,255,255,0.05)'; };
            el.onmouseleave = () => { if (!el.style.background.includes('0.2')) el.style.background = ''; };
        });
        
    } catch (error) {
        console.error('[TukTukFeed] Error showing province picker:', error);
        showFeedToast('ไม่สามารถแสดงรายการจังหวัดได้', 'error');
    }
};

/**
 * Select province
 */
window.selectProvince = function(code, name) {
    // Always store province NAME (not code) — used for Firestore field matching (sellerProvince)
    TukTukFeed.selectedProvince = name;
    localStorage.setItem('selectedProvince', name);
    localStorage.setItem('selectedProvinceName', name);
    sessionStorage.setItem('selectedProvince', name);

    // Update Near Me tab label
    const tab = document.querySelector('.mh-tab[data-cat="near_me"] span');
    if (tab) tab.textContent = name;

    // Close picker
    const overlay = document.querySelector('.province-picker-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 300);
    }

    // Refresh feed
    showFeedToast(`แสดงสินค้าในจังหวัด ${name}`, 'success');
    initTukTukFeed('near_me');
};

/**
 * Use current location
 */
window.useCurrentLocation = async function() {
    try {
        const overlay = document.querySelector('.province-picker-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 300);
        }
        
        showFeedToast('กำลังระบุตำแหน่ง...', 'info');
        await getUserLocation(true);
        
        // Try reverse geocoding
        if (TukTukFeed.userLocation) {
            const { lat, lng } = TukTukFeed.userLocation;
            
            // Use OpenStreetMap Nominatim (free, no API key)
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=th`
            );
            const data = await response.json();
            
            let province = null;
            if (data.address) {
                province = data.address.province || 
                          data.address.state || 
                          data.address.region ||
                          data.address.city;
            }
            
            if (province) {
                showFeedToast(`พบตำแหน่ง: ${province}`, 'success');
                // Find province code (simplified)
                const provinces = await fetchProvinces();
                const match = provinces.find(p => 
                    p.name_th.includes(province) || province.includes(p.name_th)
                );
                if (match) {
                    selectProvince(match.code, match.name_th);
                }
            }
        }
        
        // Refresh feed
        initTukTukFeed('near_me');
        
    } catch (error) {
        console.error('[TukTukFeed] Error using current location:', error);
        showFeedToast('ไม่สามารถระบุตำแหน่งได้', 'error');
    }
};

// ================================================
// DATA NORMALIZATION
// ================================================

/**
 * Normalize feed item (unified structure)
 */
function normalizeFeedItem(item, type, location) {
    if (!item) return null;
    // Skip draft/scheduled/private posts
    if (item.status === 'scheduled' || item.status === 'draft') return null;
    if (item.privacy === 'private' || item.visibility === 'private') return null;
    
    const result = {
        id: item.id || item._id || `item-${Date.now()}`,
        type: type || item.type || 'post',
        source: item.source || 'firebase',
        createdAt: item.createdAt || item.timestamp || null
    };
    
    // Extract coordinates — supports nested objects, flat fields, string "lat,lng", Firestore GeoPoint
    let pLat = null, pLng = null;
    const coordsSource = item.locationCoords || item.coords || item.location || item.gps || item.location_coords || item.geoPoint;

    if (coordsSource) {
        if (typeof coordsSource === 'string' && coordsSource.includes(',')) {
            const parts = coordsSource.split(',');
            pLat = parseFloat(parts[0].trim());
            pLng = parseFloat(parts[1].trim());
        } else if (typeof coordsSource === 'object') {
            pLat = parseFloat(coordsSource.latitude || coordsSource.lat || coordsSource._lat || '') || null;
            pLng = parseFloat(coordsSource.longitude || coordsSource.lng || coordsSource.lon || coordsSource._long || '') || null;
        }
    }
    // Fallback: flat top-level fields used by marketplace_items / win_riders
    if (!pLat) pLat = parseFloat(item.lat || item.sellerLat || item.seller_lat || item.shopLat || '') || null;
    if (!pLng) pLng = parseFloat(item.lng || item.sellerLng || item.seller_lng || item.shopLng || item.lon || '') || null;
    
    // Calculate distance
    let distance = Infinity;
    if (location && !isNaN(pLat) && !isNaN(pLng)) {
        distance = calculateDistance(location.lat, location.lng, pLat, pLng);
    }
    result.distance = distance;
    result.hasCoords = pLat !== null && pLng !== null && !isNaN(pLat) && !isNaN(pLng);
    result.coordinates = { lat: pLat, lng: pLng };
    
    // Extract media
    let image = 'assets/images/logo.png';
    let videoUrl = item.videoUrl || item.video_url || null;
    let youtubeUrl = null;
    let thumbnailUrl = null;
    
    if (item.images && Array.isArray(item.images) && item.images.length > 0) {
        // Find video
        const videoEntry = item.images.find(m => {
            if (typeof m === 'object' && m.type === 'video') return true;
            if (typeof m === 'object' && m.type === 'youtube') return true;
            const url = (typeof m === 'string' ? m : m.url || '').toLowerCase();
            return url.endsWith('.mp4') || url.endsWith('.mov') || url.endsWith('.webm') || url.includes('youtube.com') || url.includes('youtu.be');
        });
        
        if (videoEntry) {
            videoUrl = videoUrl || (typeof videoEntry === 'string' ? videoEntry : videoEntry.url);
            thumbnailUrl = (typeof videoEntry === 'object' && videoEntry.thumbnailUrl) || null;
            if (videoUrl && (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be'))) {
                youtubeUrl = videoUrl;
            }
        }
        
        // Find image
        const imageEntry = item.images.find(m => {
            if (typeof m === 'object' && m.type === 'video') return false;
            const url = (typeof m === 'string' ? m : m.url || '').toLowerCase();
            return !url.endsWith('.mp4') && !url.endsWith('.mov') && !url.endsWith('.webm');
        });
        
        if (imageEntry) {
            image = typeof imageEntry === 'string' ? imageEntry : (imageEntry.url || imageEntry.thumb || image);
        } else if (thumbnailUrl) {
            image = thumbnailUrl;
        }
    }

    // Special: Featured Seller Check
    if (item.type === 'featured_seller' || item.isFeatured) {
        result.type = 'featured_seller';
        result.shopName = item.shopName || item.storeName || item.displayAuthor || 'ร้านค้าแนะนำ';
        result.productName = item.productName || item.title || 'สินค้าพิเศษ';
        result.productId = item.productId || item.id;
    }

    // Special: Idea Lab Check (Matching Flutter brain integration)
    if (item.type === 'idea_lab' || item.isIdeaLab) {
        result.type = 'idea_lab';
        result.displayTitle = item.title || 'ห้องแล็บแห่งอนาคต';
        result.displayDesc = item.description || 'ใช้พลัง AI เพื่อช่วยคุณวิเคราะห์ข้อมูลและสร้างสรรค์ไอเดียใหม่ๆ';
        result.image = 'assets/images/brain_glow.png'; // Placeholder for AI effect
    }

    // Special: WinRider Check
    if (item.collection === 'win_riders' || item.isRider) {
        result.type = 'rider_profile';
        result.isOnline = item.isOnline || false;
        result.vehicleType = item.vehicleType || 'Motorcycle';
        result.rating = item.rating || 5.0;
    }
    
    // Special: WinRider Request Check
    if (item.collection === 'win_rider_requests' || item.isJob) {
        result.type = 'rider_job';
        result.jobType = item.jobType || 'Package';
        result.price = item.price || 0;
        result.status = item.status || 'searching';
    }

    // Unified Fields
    result.title = item.title || item.productTitle || item.productName || item.name || '';
    result.description = item.description || item.productDescription || item.content || '';
    result.price = item.price || item.productPrice || null;
    result.image = image;
    result.videoUrl = videoUrl;
    
    // Display variants (Thai-friendly labels)
    result.displayTitle = result.title;
    result.displayDesc = result.description;
    
    if (result.type === 'product') {
        result.badgeColor = '#FBBF24'; // Warning color (Amber)
        result.badgeText = '📍 ตลาดนัด';
    } else if (result.type === 'live') {
        result.badgeColor = '#EF4444'; // Red
        result.badgeText = '🔴 LIVE';
    } else if (result.type === 'idea_lab') {
        result.badgeColor = '#8B5CF6'; // Purple
        result.badgeText = '🧠 IDEA LAB';
    } else if (result.type === 'rider_profile' || result.type === 'rider_job') {
        result.badgeColor = '#10B981'; // Green
        result.badgeText = '🏍️ วินตุ๊กตุ๊ก';
    } else {
        result.badgeColor = '#3B82F6'; // Blue
        result.badgeText = '📽️ วิดีโอ';
    }
    
    // Special: Live Stream Check
    if (item.isLive || item.type === 'live') {
        result.type = 'live';
        result.viewerCount = item.viewerCount || 0;
    } else if (item.imageUrl || item.image || item.thumbnailUrl) {
        image = item.imageUrl || item.image || item.thumbnailUrl;
    }
    
    const isDirectVideo = (url) => /\.(mp4|webm|mov|m4v|m3u8|avi|mkv)(\?|$)/i.test(url || '') || /youtube\.com|youtu\.be/i.test(url || '');

    // Handle case where image is actually video, or cleanup poster image if it is a video URL
    if (typeof image === 'string' && isDirectVideo(image)) {
        if (!videoUrl) videoUrl = image;
        image = 'assets/images/logo.png';
    }
    
    // Final check for YouTube
    let isYouTube = false;
    let youtubeId = null;
    const finalVid = videoUrl || youtubeUrl;
    if (finalVid) {
        const ytMatch = finalVid.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|live\/))([\w-]{11})/);
        if (ytMatch) {
            isYouTube = true;
            youtubeId = ytMatch[1];
            videoUrl = finalVid;
            // Fetch thumbnail if missing
            if (image === 'assets/images/logo.png' || !image) {
                image = `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`;
            }
        }
    }

    result.displayImage = image;
    result.displayVideo = videoUrl;
    result.isYouTube = isYouTube;
    result.youtubeId = youtubeId;
    result.thumbnailUrl = thumbnailUrl;
    
    // Extract text content
    result.displayTitle = item.displayTitle || item.title || item.productName || item.name || item.topic || 'โพสต์ใหม่';
    result.displayDesc = item.displayDesc || item.text || item.content || item.description || item.productDescription || item.detail || item.summary || '';
    result.displayAuthor = item.displayAuthor || item.authorName || item.sellerName || item.source || 'TukTuk Member';
    result.authorAvatar = item.authorAvatar || item.authorPhotoURL || item.sellerAvatar || 'assets/images/logo.png';
    result.authorId = item.authorId || item.sellerId || null;

    // Province/location text — marketplace_items use sellerLocation or province (no GPS)
    result.sellerProvince = item.sellerLocation || item.province || item.sellerProvince || item.shopProvince || '';
    
    // Extract product data
    if (item.price !== undefined) {
        result.displayPrice = `฿${parseInt(item.price).toLocaleString()}`;
        result.price = item.price;
    } else if (item.productPrice) {
        result.displayPrice = `฿${parseInt(item.productPrice).toLocaleString()}`;
        result.price = item.productPrice;
    }
    
    // Stats
    result.likes = item.likes || item.likeCount || 0;
    result.comments = item.comments || item.commentCount || 0;
    result.views = item.views || item.viewCount || 0;
    
    // Flags
    result.pinned = item.pinned === true;
    result.verified = item.isVerified === true;
    result.published = item.published !== false;
    
    // Smart data
    if (item.smartScore !== undefined) result.smartScore = item.smartScore;
    if (item.sentiment) result.sentiment = item.sentiment;
    if (item.impactLevel) result.impactLevel = item.impactLevel;
    if (item.summaryPoints && Array.isArray(item.summaryPoints)) {
        result.summaryPoints = item.summaryPoints;
    }
    
    return result;
}

// ================================================
// FEED RENDERING
// ================================================

/**
 * Toggle mute/unmute for all feed videos. Syncs with TukTukEngine + localStorage.
 */
function toggleFeedMute() {
    const newMuted = !TukTukFeed.isMuted;
    TukTukFeed.isMuted = newMuted;
    if (window.TukTukEngine) TukTukEngine.isMuted = newMuted;
    localStorage.setItem('tuktuk_muted', newMuted ? 'true' : 'false');
    document.querySelectorAll('.tuktuk-slide-video').forEach(v => {
        if (v.tagName === 'VIDEO') {
            v.muted = newMuted;
            if (!newMuted && v.paused && !v.dataset.userPaused) {
                _playFeedVideo(v);
            }
        } else if (v.tagName === 'IFRAME') {
            const cmd = newMuted ? 'mute' : 'unMute';
            // iframe อาจยังโหลดไม่เสร็จ (contentWindow = null) → กัน crash
            if (v.contentWindow) {
                v.contentWindow.postMessage(`{"event":"command","func":"${cmd}","args":""}`, '*');
            }
        }
    });
    const iconClass = newMuted ? 'fa-volume-mute' : 'fa-volume-up';
    document.querySelectorAll('.feed-mute-btn i').forEach(i => { i.className = `fas ${iconClass}`; });
}
window.toggleFeedMute = toggleFeedMute;

function _isMobileFeedViewport() {
    return window.innerWidth < 992 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '');
}

function _syncFeedMuteButtons() {
    const iconClass = TukTukFeed.isMuted ? 'fa-volume-mute' : 'fa-volume-up';
    document.querySelectorAll('.feed-mute-btn i').forEach(i => { i.className = `fas ${iconClass}`; });
}

function _forceMutedAutoplayState() {
    TukTukFeed.isMuted = true;
    if (window.TukTukEngine) TukTukEngine.isMuted = true;
    localStorage.setItem('tuktuk_muted', 'true');
    _syncFeedMuteButtons();
}

function _playFeedVideo(video) {
    if (!video || video.tagName !== 'VIDEO') return Promise.resolve();

    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');

    let playPromise;
    try {
        playPromise = video.play();
    } catch (err) {
        playPromise = Promise.reject(err);
    }
    video._playPromise = playPromise;

    if (!playPromise || typeof playPromise.catch !== 'function') {
        return Promise.resolve();
    }

    return playPromise.catch((err) => {
        const blocked = !err || err.name === 'NotAllowedError';
        if (!blocked || video.dataset.userPaused) return Promise.reject(err);

        _forceMutedAutoplayState();
        video.muted = true;
        video.defaultMuted = true;
        video.setAttribute('muted', '');
        const retry = video.play();
        video._playPromise = retry;
        return retry || Promise.resolve();
    }).catch(() => {});
}

/** Brief tap-feedback animation (play/pause icon) in the center of a slide. */
function _showTapFeedback(slide, isPause) {
    const old = slide.querySelector('.feed-tap-icon');
    if (old) old.remove();
    const el = document.createElement('div');
    el.className = 'feed-tap-icon';
    el.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) scale(0.6);z-index:20;pointer-events:none;width:72px;height:72px;background:rgba(0,0,0,0.55);border-radius:50%;display:flex;align-items:center;justify-content:center;transition:transform 0.15s ease,opacity 0.35s ease;opacity:0;';
    el.innerHTML = `<i class="fas fa-${isPause ? 'pause' : 'play'}" style="font-size:26px;color:#fff;${isPause ? '' : 'margin-left:4px;'}"></i>`;
    slide.appendChild(el);
    requestAnimationFrame(() => { el.style.transform = 'translate(-50%,-50%) scale(1)'; el.style.opacity = '1'; });
    setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translate(-50%,-50%) scale(1.2)'; }, 350);
    setTimeout(() => { if (el.parentNode) el.remove(); }, 700);
}

/**
 * Render TikTok-style slides (mobile)
 */
/**
 * Feed scroll helper — works with CSS overflow-y:scroll + scroll-snap.
 * Does NOT use transform; native scroll handles slide movement.
 * Responsibilities:
 *   1. Sync TukTukFeed.slideIndex on scroll events (for video activation)
 *   2. Wheel → scroll to next/prev slide on desktop
 *   3. Velocity-based scrollTo on touchend for snappier feel on mid-range Android
 */
function setupFeedSwipe(container) {
    if (container._swipeBound) return;
    container._swipeBound = true;

    const slideH = () => container.clientHeight;

    // Scroll → sync active index + video
    let _scrollTimer = null;
    container.addEventListener('scroll', () => {
        clearTimeout(_scrollTimer);
        _scrollTimer = setTimeout(() => {
            const idx = Math.round(container.scrollTop / slideH());
            if (idx !== TukTukFeed.slideIndex) {
                TukTukFeed.slideIndex = idx;
                activateSlideByIndex(container, idx);
            }
        }, 80); // debounce — fire after scroll settles
    }, { passive: true });

    // Desktop: mouse wheel
    container.addEventListener('wheel', (e) => {
        e.preventDefault();
        const cur = TukTukFeed.slideIndex || 0;
        const next = cur + (e.deltaY > 0 ? 1 : -1);
        const slides = container.querySelectorAll('.tuktuk-video-item');
        const max = slides.length - 1;
        const target = Math.max(0, Math.min(next, max));
        container.scrollTo({ top: target * slideH(), behavior: 'smooth' });
    }, { passive: false });

    // Touch: velocity boost on touchend for snappier snap on slow devices
    let _touchStartY = 0;
    let _touchStartTime = 0;
    container.addEventListener('touchstart', (e) => {
        _touchStartY = e.touches[0].clientY;
        _touchStartTime = Date.now();
    }, { passive: true });

    container.addEventListener('touchend', (e) => {
        const dy = _touchStartY - e.changedTouches[0].clientY; // positive = swipe up
        const dt = Date.now() - _touchStartTime;
        const velocity = Math.abs(dy) / dt;  // px/ms
        // Only override CSS snap if swipe was fast and intentional (>0.3px/ms, >30px travel)
        if (velocity > 0.3 && Math.abs(dy) > 30) {
            const cur = TukTukFeed.slideIndex || 0;
            const slides = container.querySelectorAll('.tuktuk-video-item');
            const max = slides.length - 1;
            const next = Math.max(0, Math.min(cur + (dy > 0 ? 1 : -1), max));
            container.scrollTo({ top: next * slideH(), behavior: 'smooth' });
        }
    }, { passive: true });

    // Expose for external callers (tab switch, category change)
    container._goTo = (idx) => {
        const slides = container.querySelectorAll('.tuktuk-video-item');
        const max = Math.max(0, slides.length - 1);
        const target = Math.max(0, Math.min(idx, max));
        container.scrollTo({ top: target * slideH(), behavior: 'smooth' });
    };
}

function renderTukTukSlides(container, items) {
    if (!container) return;

    // Ensure comment modal exists before any click can happen
    // injectCommunityModals is only called by Tab 2 (Community) normally;
    // Tab 0/1 feeds need it too for the sidebar comment button to work.
    if (typeof injectCommunityModals === 'function') {
        injectCommunityModals();
    }

    // Reset scroll position and active slide for freshly rendered mobile feed
    container.scrollTop = 0;
    TukTukFeed.slideIndex = 0;

    // Clear existing slides
    container.querySelectorAll('.tuktuk-video-item, .no-results-msg').forEach(el => el.remove());

    if (!items || items.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'no-results-msg';
        empty.style.cssText = 'height:100vh;height:100dvh;display:flex;align-items:center;justify-content:center;color:#aaa;flex-direction:column;gap:16px;';
        empty.innerHTML = '<i class="fas fa-ghost fa-3x"></i><p style="margin:0">ไม่พบโพสต์ในขณะนี้</p>';
        container.appendChild(empty);
        return;
    }

    items.forEach((item, index) => {
        // Specialized Card Rendering
    if (item.type === 'idea_lab') {
        container.appendChild(renderIdeaLabCard(item)); return;
    } else if (item.type === 'rider_profile') {
        container.appendChild(renderRiderProfileCard(item)); return;
    } else if (item.type === 'rider_job') {
        container.appendChild(renderRiderJobCard(item)); return;
    } else if (item.type === 'featured_seller') {
        container.appendChild(renderFeaturedSellerCard(item)); return;
    }

    const slide = document.createElement('div');
        slide.className = 'tuktuk-video-item';
        slide.id = `tuktuk-${item.id || index}`;
        slide.dataset.index = index;
        slide.dataset.type = item.type || 'post';
        slide.dataset.postId = item.id || '';
        
        // Media background
        const safeImg = item.displayImage || 'assets/images/logo.png';
        const isMuted = TukTukFeed.isMuted; // synced global state (default true)

        let mediaBg = '';
        if (item.isYouTube && item.youtubeId) {
            // YouTube Iframe Implementation for Vertical Feed
            mediaBg = `
                <div class="youtube-container" style="position:absolute;top:0;left:0;width:100%;height:100%;z-index:1;background:#000;display:flex;align-items:center;justify-content:center;overflow:hidden;">
                    <iframe 
                        id="yt-player-${item.id}"
                        src="https://www.youtube.com/embed/${item.youtubeId}?enablejsapi=1&autoplay=0&mute=${(isMuted || _isMobileFeedViewport()) ? 1 : 0}&modestbranding=1&rel=0&loop=1&playlist=${item.youtubeId}" 
                        style="width: 100vw; height: 56.25vw; min-width: 177.77vh; min-height: 100vh; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); border: none; pointer-events: none; transition: opacity 0.5s; max-width: none; max-height: none;"
                        allow="autoplay; encrypted-media" 
                        loading="lazy"
                        class="tuktuk-slide-video youtube-iframe"
                        data-youtube-id="${item.youtubeId}">
                    </iframe>
                    <img src="${safeImg}" class="yt-poster" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;z-index:2; transition: opacity 0.5s;" onerror="this.style.display='none'">
                    <div class="yt-overlay" style="position:absolute;inset:0;z-index:3;background:transparent;"></div>
                </div>`;
        } else if (item.displayVideo) {
            mediaBg = `
                <video class="tuktuk-slide-video" src="${item.displayVideo}" poster="${safeImg}"
                    ${isMuted ? 'muted' : ''} playsinline webkit-playsinline preload="none" autoplay
                    onended="if(typeof handleTuktukVideoEnded === 'function') handleTuktukVideoEnded(this, '${item.id}'); else this.play();"
                    style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;z-index:1;will-change:transform;backface-visibility:hidden;transform:translateZ(0);"
                    onplay="this.parentElement.querySelectorAll('.yt-poster').forEach(i=>i.style.opacity='0')"
                    onerror="this.style.display='none'"></video>
                <img src="${safeImg}" class="yt-poster" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;z-index:0;"
                     onerror="this.src='assets/images/logo.png'" loading="lazy">`;
        } else {
            mediaBg = `<img src="${safeImg}" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;z-index:0;" 
                    onerror="this.src='assets/images/logo.png'" loading="lazy">`;
        }
        
        // Distance badge
        const distBadge = (item.distance !== undefined && item.distance !== Infinity && item.distance > 0)
            ? `<span class="tuktuk-slide-badge"><i class="fas fa-location-arrow" style="color:#22d3ee;"></i> ${item.distance.toFixed(1)} กม.</span>`
            : '';
        
        
        // Actions (Updated for real functionality)
        const safeTitle = (item.displayTitle || '').replace(/'/g, "\\'");
        const viewAction = `window.viewPostDetails('${item.id}')`;
        const shareAction = `window.sharePost('${item.id}', '${safeTitle}')`;
        
        // ── Right sidebar (shared across all types) ──────────────────────────
        const rightSidebar = `
            <div class="right-sidebar">
                <div class="avatar-wrapper" style="position:relative;margin-bottom:8px;cursor:pointer;">
                    <img src="${item.authorAvatar || 'assets/images/logo.png'}"
                         style="width:44px;height:44px;border-radius:50%;border:2px solid #fff;object-fit:cover;box-shadow:0 2px 10px rgba(0,0,0,0.6);"
                         onclick="window.location.href='channel.html?userId=${item.authorId}'" onerror="this.src='assets/images/logo.png'">
                    <div onclick="event.stopPropagation();followUser('${item.authorId}')"
                         style="position:absolute;bottom:-4px;left:50%;transform:translateX(-50%);width:18px;height:18px;background:#FF0050;border-radius:50%;color:#fff;display:flex;align-items:center;justify-content:center;font-size:9px;border:2px solid #fff;">
                        <i class="fas fa-plus"></i>
                    </div>
                </div>
                <div class="action-btn like-btn-${item.id}" onclick="event.stopPropagation();window.likePost('${item.id}')">
                    <div class="action-icon-wrapper"><i class="fas fa-heart action-icon ${item.isLiked ? 'liked' : ''}"></i></div>
                    <span class="action-text">${formatNumber(item.likes)}</span>
                </div>
                <div class="action-btn" onclick="event.stopPropagation();window.openComments('${item.id}')">
                    <div class="action-icon-wrapper"><i class="fas fa-comment-dots action-icon"></i></div>
                    <span class="action-text">${formatNumber(item.comments)}</span>
                </div>
                <div class="action-btn" onclick="event.stopPropagation();window.sharePost('${item.id}','${safeTitle}')">
                    <div class="action-icon-wrapper"><i class="fas fa-share action-icon"></i></div>
                    <span class="action-text">แชร์</span>
                </div>
                <div class="action-btn" onclick="event.stopPropagation();window.savePost('${item.id}')">
                    <div class="action-icon-wrapper"><i class="far fa-bookmark action-icon"></i></div>
                    <span class="action-text">บันทึก</span>
                </div>
                <div class="music-disc-wrapper" style="margin-top:4px;">
                    <div style="width:22px;height:22px;border-radius:50%;background:linear-gradient(45deg,#333,#000);display:flex;align-items:center;justify-content:center;border:2px solid #111;animation:rotateDisc 3s linear infinite;">
                        <img src="${item.authorAvatar || 'assets/images/logo.png'}" style="width:11px;height:11px;border-radius:50%;" onerror="this.src='assets/images/logo.png'">
                    </div>
                </div>
            </div>`;

        // ── PRODUCT card overlay ─────────────────────────────────────────────
        if (item.type === 'product') {
            const stars = item.rating ? Math.round(Math.min(item.rating, 5)) : 0;
            const starsHtml = stars > 0
                ? `<div style="display:flex;align-items:center;gap:3px;margin-bottom:8px;">
                     ${Array.from({length:5},(_,i)=>`<i class="fas fa-star" style="font-size:0.7rem;color:${i<stars?'#facc15':'rgba(255,255,255,0.2)'};"></i>`).join('')}
                     <span style="font-size:0.68rem;color:rgba(255,255,255,0.6);margin-left:4px;">(${item.rating.toFixed(1)})</span>
                   </div>` : '';
            const stockBadge = item.stock > 0
                ? `<span style="background:rgba(74,222,128,0.15);border:1px solid rgba(74,222,128,0.4);border-radius:12px;padding:2px 8px;font-size:0.65rem;color:#4ade80;font-weight:600;"><i class="fas fa-check-circle" style="font-size:0.6rem;"></i> มีสินค้า</span>` : '';
            slide.innerHTML = `
                ${mediaBg}
                <div style="position:absolute;inset:0;z-index:1;background:linear-gradient(160deg,transparent 30%,rgba(0,0,0,0.7) 65%,rgba(0,0,0,0.97) 100%);"></div>
                <div style="position:absolute;top:72px;left:12px;z-index:3;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                    <span style="background:linear-gradient(135deg,rgba(250,204,21,0.25),rgba(255,107,53,0.25));-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);border:1px solid rgba(250,204,21,0.6);border-radius:20px;padding:4px 12px;font-size:0.7rem;color:#facc15;font-weight:800;letter-spacing:0.5px;text-shadow:0 1px 4px rgba(0,0,0,0.5);">
                        <i class="fas fa-shopping-bag"></i> สินค้า
                    </span>
                    ${distBadge ? `<span style="background:rgba(0,0,0,0.5);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.2);border-radius:20px;padding:4px 10px;font-size:0.68rem;color:#fff;">${distBadge}</span>` : ''}
                    ${stockBadge}
                </div>
                ${rightSidebar}
                <div class="slide-product-panel">
                    <div class="slide-glass-card" style="border-top:2px solid rgba(250,204,21,0.6);">
                        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
                            <div style="display:flex;align-items:center;gap:8px;">
                                <img src="${item.authorAvatar || 'assets/images/logo.png'}" onerror="this.src='assets/images/logo.png'"
                                     style="width:32px;height:32px;border-radius:10px;object-fit:cover;border:1.5px solid rgba(250,204,21,0.4);">
                                <div>
                                    <div style="font-size:0.68rem;color:rgba(255,255,255,0.5);font-weight:500;line-height:1;">ร้านค้า</div>
                                    <div style="font-size:0.82rem;color:rgba(255,255,255,0.9);font-weight:700;">${escapeHtml(item.displayAuthor || 'ร้านค้า')}</div>
                                </div>
                            </div>
                            ${item.sellerProvince ? `<div style="display:flex;align-items:center;gap:4px;background:rgba(34,211,238,0.12);border:1px solid rgba(34,211,238,0.35);border-radius:20px;padding:3px 10px;">
                                <i class="fas fa-map-marker-alt" style="font-size:0.6rem;color:#22d3ee;"></i>
                                <span style="font-size:0.68rem;color:#22d3ee;font-weight:700;">${escapeHtml(item.sellerProvince)}</span>
                            </div>` : ''}
                        </div>
                        <div style="font-size:1.05rem;font-weight:800;color:#fff;line-height:1.35;margin-bottom:8px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;text-shadow:0 2px 8px rgba(0,0,0,0.6);">${escapeHtml(item.displayTitle || '')}</div>
                        ${starsHtml}
                        <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:14px;">
                            <div>
                                <div style="font-size:0.65rem;color:rgba(255,255,255,0.5);font-weight:500;margin-bottom:2px;">ราคา</div>
                                <div style="font-size:1.6rem;font-weight:900;color:#facc15;line-height:1;text-shadow:0 0 20px rgba(250,204,21,0.4);">${item.displayPrice || '—'}</div>
                            </div>
                            ${item.displayDesc ? `<div style="font-size:0.75rem;color:rgba(255,255,255,0.7);max-width:55%;text-align:right;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;line-height:1.4;">${escapeHtml(item.displayDesc)}</div>` : ''}
                        </div>
                        <button class="slide-full-cta slide-cta-product" onclick="window.location.href='product.html?id=${item.id}';event.stopPropagation();">
                            <i class="fas fa-info-circle"></i> ดูรายละเอียดเพิ่ม
                        </button>
                        <div class="product-timer-track" style="margin-top:10px;border-radius:4px;"><div class="product-timer-bar"></div></div>
                    </div>
                </div>`;

        // ── NEWS card overlay ────────────────────────────────────────────────
        } else if (item.type === 'news') {
            const readMin = item.displayDesc ? Math.max(1, Math.ceil(item.displayDesc.length / 300)) : 1;
            const timeAgo = item.createdAt ? formatTimeAgo(item.createdAt) : '';
            slide.innerHTML = `
                ${mediaBg}
                <div style="position:absolute;inset:0;z-index:1;background:linear-gradient(180deg,rgba(0,0,0,0.2) 0%,transparent 25%,transparent 40%,rgba(0,0,0,0.75) 65%,rgba(0,0,0,0.97) 100%);"></div>
                <div style="position:absolute;top:72px;left:12px;z-index:3;display:flex;align-items:center;gap:6px;">
                    <span style="background:linear-gradient(135deg,rgba(16,185,129,0.3),rgba(5,150,105,0.3));-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);border:1px solid rgba(16,185,129,0.6);border-radius:20px;padding:4px 12px;font-size:0.7rem;color:#10b981;font-weight:800;letter-spacing:0.5px;">
                        <i class="fas fa-newspaper"></i> ข่าวสาร
                    </span>
                    <span style="background:rgba(0,0,0,0.5);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.15);border-radius:20px;padding:4px 10px;font-size:0.68rem;color:rgba(255,255,255,0.8);">
                        <i class="fas fa-book-open" style="font-size:0.6rem;"></i> ${readMin} นาที
                    </span>
                </div>
                ${rightSidebar}
                <div class="slide-news-panel">
                    <div class="slide-glass-card" style="border-top:2px solid rgba(16,185,129,0.7);">
                        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
                            <img src="${item.authorAvatar || 'assets/images/logo.png'}" onerror="this.src='assets/images/logo.png'"
                                 style="width:28px;height:28px;border-radius:50%;object-fit:cover;border:2px solid rgba(16,185,129,0.7);box-shadow:0 0 8px rgba(16,185,129,0.3);">
                            <div style="flex:1;">
                                <div style="font-size:0.72rem;color:#10b981;font-weight:700;letter-spacing:0.3px;">${escapeHtml(item.displayAuthor || 'TukTuk News')}</div>
                                ${timeAgo ? `<div style="font-size:0.65rem;color:rgba(255,255,255,0.45);">${timeAgo}</div>` : ''}
                            </div>
                            <div style="background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.3);border-radius:8px;padding:3px 8px;font-size:0.62rem;color:#10b981;font-weight:600;">LIVE</div>
                        </div>
                        <div style="font-size:1.15rem;font-weight:900;color:#fff;line-height:1.4;margin-bottom:12px;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden;text-shadow:0 2px 10px rgba(0,0,0,0.8);">${escapeHtml(item.displayTitle || '')}</div>
                        ${item.displayDesc ? `<div style="font-size:0.82rem;color:rgba(255,255,255,0.7);line-height:1.6;margin-bottom:16px;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden;">${escapeHtml(item.displayDesc)}</div>` : '<div style="margin-bottom:16px;"></div>'}
                        <button class="slide-full-cta slide-cta-news" onclick="${viewAction};event.stopPropagation();">
                            <i class="fas fa-book-reader"></i> อ่านข่าวทั้งหมด <i class="fas fa-long-arrow-alt-right"></i>
                        </button>
                    </div>
                </div>`;

        // ── POST card overlay (default) ──────────────────────────────────────
        } else {
            slide.innerHTML = `
                ${mediaBg}
                <div class="tuktuk-slide-gradient"></div>
                ${item.verified ? `<span style="position:absolute;top:72px;left:12px;z-index:3;background:rgba(34,211,238,0.15);backdrop-filter:blur(8px);border:1px solid rgba(34,211,238,0.4);border-radius:20px;padding:3px 10px;font-size:0.68rem;color:#22d3ee;font-weight:700;"><i class="fas fa-check-circle"></i> Verified</span>` : ''}
                ${rightSidebar}
                <div class="tuktuk-slide-info">
                    <div class="tuktuk-slide-author">
                        <img src="${item.authorAvatar || 'assets/images/logo.png'}" onerror="this.src='assets/images/logo.png'"
                             style="width:34px;height:34px;border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,0.7);">
                        <span>${escapeHtml(item.displayAuthor || 'TukTuk')}</span>
                        ${distBadge}
                    </div>
                    <div class="tuktuk-slide-title" onclick="event.stopPropagation();${viewAction}" style="display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">${escapeHtml(item.displayTitle || '')}</div>
                    ${item.displayDesc ? `<div class="tuktuk-slide-desc" style="display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">${escapeHtml(item.displayDesc)}</div>` : ''}
                </div>`;
        }

        // ── Mute button (top-right corner, only for video slides) ─────────────
        if (item.displayVideo) {
            const muteBtn = document.createElement('button');
            muteBtn.className = 'feed-mute-btn';
            muteBtn.style.cssText = 'position:absolute;top:14px;right:12px;z-index:15;background:rgba(0,0,0,0.45);border:none;border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;color:#fff;cursor:pointer;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);touch-action:manipulation;';
            const mutedNow = TukTukFeed.isMuted;
            muteBtn.innerHTML = `<i class="fas fa-volume-${mutedNow ? 'mute' : 'up'}" style="font-size:15px;"></i>`;
            muteBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleFeedMute(); });
            slide.appendChild(muteBtn);
        }

        // ── Tap-to-pause / tap-to-play ────────────────────────────────────────
        slide.addEventListener('click', (e) => {
            // Ignore taps on interactive elements (buttons, links, action panels)
            if (e.target.closest('button, a, .right-sidebar, .slide-glass-card, .slide-product-panel, .slide-news-panel, .tuktuk-slide-info, .tuktuk-slide-author')) return;
            const video = slide.querySelector('video');
            if (!video) return;
            if (video.paused) {
                delete video.dataset.userPaused;
                _playFeedVideo(video);
                _showTapFeedback(slide, false); // play icon
            } else {
                video.dataset.userPaused = '1';
                const p = video._playPromise;
                if (p) p.then(() => video.pause()).catch(() => {}); else video.pause();
                _showTapFeedback(slide, true); // pause icon
            }
        }, { passive: true });

        container.appendChild(slide);
    });

    // Ensure YouTube API is ready if needed
    if (items.some(it => it.isYouTube) && typeof initYouTubeAPI === 'function') {
        initYouTubeAPI();
    }

    // Setup native-scroll swipe helper (video activation + desktop wheel)
    setupFeedSwipe(container);

    // Start TukTuk slide observer (plays active video, lazy-loads neighbors)
    setTimeout(() => initTukTukSlideObserver(container), 150);
}

// ================================================
// SLIDE AUTOPLAY + PRELOAD ENGINE (Matches Flutter isActive logic)
// ================================================

/**
 * IntersectionObserver for TukTuk vertical slides.
 * - Plays video only when slide is ≥50% visible (matches Flutter isActive)
 * - Pauses all other videos
 * - Updates preload attributes for neighbors
 */
/**
 * Activate a slide by index: play its video, pause all others, update preloads.
 * Called from goTo() — replaces IntersectionObserver (which doesn't fire in overflow:hidden).
 */
function activateSlideByIndex(container, idx) {
    const slides = Array.from(container.querySelectorAll('.tuktuk-video-item'));
    slides.forEach((slide, i) => {
        const video = slide.querySelector('video');
        const iframe = slide.querySelector('iframe.youtube-iframe');
        
        if (i === idx) {
            _updateNeighborPreloads(container, idx);
            _startProductTimer(slide);
            if (video) {
                video.preload = 'auto';
                _playFeedVideo(video);
            }
            if (iframe && iframe.contentWindow) {
                if (_isMobileFeedViewport() && !TukTukFeed.isMuted) _forceMutedAutoplayState();
                const muteCmd = TukTukFeed.isMuted ? 'mute' : 'unMute';
                iframe.contentWindow.postMessage(`{"event":"command","func":"${muteCmd}","args":""}`, '*');
                iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
                // Hide poster after a short delay
                setTimeout(() => {
                    slide.querySelectorAll('.yt-poster').forEach(img => img.style.opacity = '0');
                }, 1000);
            }
        } else {
            _stopProductTimer(slide);
            if (video && !video.paused) {
                const p = video._playPromise;
                if (p) { p.then(() => { try { video.pause(); } catch (_) {} }).catch(() => {}); }
                else { try { video.pause(); } catch (_) {} }
            }
            if (iframe && iframe.contentWindow) {
                // Pause YouTube
                iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
            }
        }
    });
}

function initTukTukSlideObserver(container) {
    if (!container) return;

    if (TukTukFeed._slideObserver) {
        TukTukFeed._slideObserver.disconnect();
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const slide = entry.target;
            const idx = parseInt(slide.dataset.index || '0');
            if (entry.isIntersecting) {
                TukTukFeed.slideIndex = idx;
                _updateNeighborPreloads(container, idx);
                _startProductTimer(slide);
                const video = slide.querySelector('video');
                const iframe = slide.querySelector('iframe.youtube-iframe');
                if (video) {
                    video.preload = 'auto';
                    _playFeedVideo(video);
                }
                if (iframe && iframe.contentWindow) {
                    if (_isMobileFeedViewport() && !TukTukFeed.isMuted) _forceMutedAutoplayState();
                    const muteCmd = TukTukFeed.isMuted ? 'mute' : 'unMute';
                    iframe.contentWindow.postMessage(`{"event":"command","func":"${muteCmd}","args":""}`, '*');
                    iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
                    setTimeout(() => {
                        slide.querySelectorAll('.yt-poster').forEach(img => img.style.opacity = '0');
                    }, 1000);
                }
                // Pagination: load more when within 5 slides of the end
                // Guard: only trigger once per total-count to prevent loop
                const allSlides = container.querySelectorAll('.tuktuk-video-item');
                const total = allSlides.length;
                if (total > 0 && idx >= total - 5 && !TukTukFeed.isLoading
                    && container._lastPaginationTotal !== total) {
                    container._lastPaginationTotal = total;
                    const mode = TukTukFeed.currentCategory || 'all';
                    appendMoreFeedItems(container, mode);
                }
            } else {
                _stopProductTimer(slide);
                const video = slide.querySelector('video');
                const iframe = slide.querySelector('iframe.youtube-iframe');
                if (video && !video.paused) {
                    const p = video._playPromise;
                    if (p) { p.then(() => { try { video.pause(); } catch (_) {} }).catch(() => {}); }
                    else { try { video.pause(); } catch (_) {} }
                }
                if (iframe && iframe.contentWindow) {
                    iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
                }
            }
        });
    }, { threshold: 0.6, root: container });

    TukTukFeed._slideObserver = observer;
    container.querySelectorAll('.tuktuk-video-item').forEach(s => observer.observe(s));
    setTimeout(() => activateSlideByIndex(container, TukTukFeed.slideIndex || 0), 50);
}

/**
 * Set preload attribute based on distance from active slide.
 * Current ±1: preload="auto" | ±2: preload="metadata" | farther: preload="none"
 */
function _updateNeighborPreloads(container, activeIdx) {
    container.querySelectorAll('.tuktuk-video-item').forEach(slide => {
        const video = slide.querySelector('video');
        if (!video) return;
        const dist = Math.abs(parseInt(slide.dataset.index || '0') - activeIdx);
        if (dist === 0)      video.preload = 'auto';
        else if (dist <= 1)  video.preload = 'auto';
        else if (dist <= 2)  video.preload = 'metadata';
        else                 video.preload = 'none';
    });
}

/**
 * 8-second countdown timer for product slides (matches Flutter _buildProductCard).
 * Auto-advances to next slide when timer expires.
 */
function _startProductTimer(slide) {
    if (slide.dataset.type !== 'product') return;
    _stopProductTimer(slide); // Clear any existing

    const timerBar = slide.querySelector('.product-timer-bar');
    if (!timerBar) return;

    const DURATION = 8000;
    let elapsed = 0;
    timerBar.style.width = '0%';
    timerBar.style.transition = 'none';

    slide._productTimer = setInterval(() => {
        elapsed += 100;
        const pct = Math.min((elapsed / DURATION) * 100, 100);
        timerBar.style.width = pct + '%';

        if (elapsed >= DURATION) {
            _stopProductTimer(slide);
            const next = slide.nextElementSibling;
            if (next && next.classList.contains('tuktuk-video-item')) {
                next.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }, 100);
}

function _stopProductTimer(slide) {
    if (slide._productTimer) {
        clearInterval(slide._productTimer);
        slide._productTimer = null;
    }
    const timerBar = slide.querySelector('.product-timer-bar');
    if (timerBar) timerBar.style.width = '0%';
}

/**
 * Render PC Social Feed Card — Hi-Fi Premium Design (ported from Claude Design prototypes)
 */
function createPCGridCard(item) {
    // 🖥️ Use Modern PC Engine if available
    if (window.pcEngine && typeof window.pcEngine.createPostCard === 'function') {
        return window.pcEngine.createPostCard(item);
    }

    // ── Legacy Fallback ────────────────────────────────────
    const div = document.createElement('div');
    div.className = 'pc-post-card-v3 pc-post-social-card card-premium-v3';
    div.id = `pc-post-${item.id}`;

    const timeStr   = item.createdAt ? formatTimeAgo(item.createdAt) : '';
    const avatar    = item.authorAvatar || 'assets/images/logo.png';
    const author    = escapeHtml(item.displayAuthor || 'สมาชิก TukTuk');
    const title     = escapeHtml(item.displayTitle  || '');
    const desc      = escapeHtml(item.displayDesc   || '');
    const liked     = !!item.isLiked;
    const likes     = (item.likes    || 0).toLocaleString();
    const comments  = (item.comments || 0).toLocaleString();
    const safeTitle = (item.displayTitle || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');

    // ── Category badge ─────────────────────────────────────
    const CAT_MAP = {
        product  : { icon: 'fa-shopping-bag', color: '#facc15', bg: 'rgba(250,204,21,0.15)',  label: 'MARKETPLACE' },
        news     : { icon: 'fa-newspaper',    color: '#10b981', bg: 'rgba(16,185,129,0.15)',  label: 'ข่าวสาร'     },
        video    : { icon: 'fa-play-circle',  color: '#6366f1', bg: 'rgba(99,102,241,0.15)',  label: 'วิดีโอ'      },
        update   : { icon: 'fa-bolt',         color: '#f97316', bg: 'rgba(249,115,22,0.15)',  label: 'อัปเดต'     },
        tip      : { icon: 'fa-lightbulb',    color: '#a855f7', bg: 'rgba(168,85,247,0.15)',  label: 'เคล็ดลับ'    },
        event    : { icon: 'fa-calendar-alt', color: '#22d3ee', bg: 'rgba(34,211,238,0.15)',  label: 'กิจกรรม'    },
        promo    : { icon: 'fa-rocket',       color: '#f43f5e', bg: 'rgba(244,63,94,0.15)',   label: 'โปรโมชั่น'   },
        community: { icon: 'fa-users',        color: '#ec4899', bg: 'rgba(236,72,153,0.15)',  label: 'ชุมชน'       },
    };
    const cat   = CAT_MAP[item.type] || { icon: 'fa-file-alt', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', label: (item.type||'').toUpperCase() };
    const badge = `<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700;background:${cat.bg};color:${cat.color};border:1px solid ${cat.color}33;"><i class="fas ${cat.icon}"></i>${cat.label}</span>`;

    // ── Distance ────────────────────────────────────────────
    const distHtml = (item.distance !== undefined && item.distance < Infinity && item.distance > 0)
        ? `<span style="color:var(--tt-g);font-weight:700;">• <i class="fas fa-location-arrow" style="font-size:9px;"></i> ${item.distance.toFixed(1)} กม.</span>`
        : '';

    // ── Online indicator ────────────────────────────────────
    const onlineDot = item.isOnline
        ? `<div style="position:absolute;bottom:-2px;right:-2px;width:13px;height:13px;background:var(--tt-g);border:2.5px solid var(--tt-card);border-radius:50%;"></div>`
        : '';

    // ── Media block ─────────────────────────────────────────
    let mediaHtml = '';
    if (item.isYouTube && item.youtubeId) {
        mediaHtml = `
        <div class="pc-post-media-v3" style="margin:0 20px; aspect-ratio:16/9; background:#000; border-radius:12px; overflow:hidden;">
            <iframe src="https://www.youtube.com/embed/${item.youtubeId}?autoplay=0&mute=1&modestbranding=1" 
                    style="width:100%; height:100%; border:none;" 
                    allow="autoplay;encrypted-media" allowfullscreen loading="lazy"></iframe>
        </div>`;
    } else if (item.displayVideo) {
        mediaHtml = `
        <div class="pc-post-media-v3" style="margin:0 20px;">
            <video src="${item.displayVideo}" poster="${item.displayImage||''}"
                   controls muted loop playsinline
                   style="max-height:500px;object-fit:contain;background:#000;"></video>
            ${item.price ? `<div class="pc-post-media-price-v3">${item.displayPrice}</div>` : ''}
        </div>`;
    } else if (item.displayImage) {
        mediaHtml = `
        <div class="pc-post-media-v3" style="margin:0 20px;">
            <img src="${item.displayImage}" alt="${title}"
                 style="max-height:580px;object-fit:cover;"
                 onerror="this.src='assets/images/logo.png'">
            ${item.price ? `<div class="pc-post-media-price-v3">${item.displayPrice}</div>` : ''}
        </div>`;
    }

    // ── Full card HTML ───────────────────────────────────────
    div.innerHTML = `
        <!-- Header -->
        <div class="pc-post-header-v3">
            <div style="position:relative;flex-shrink:0;cursor:pointer;"
                 onclick="window.location.href='channel.html?userId=${item.authorId||''}'">
                <img src="${avatar}" class="pc-post-avatar-v3"
                     onerror="this.src='assets/images/logo.png'">
                ${onlineDot}
            </div>
            <div class="pc-post-info" style="flex:1;min-width:0;">
                <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;">
                    <a href="channel.html?userId=${item.authorId||''}" class="pc-post-author-v3">${author}</a>
                    ${item.verified ? '<i class="fas fa-check-circle" style="color:var(--tt-s);font-size:13px;" title="ยืนยันแล้ว"></i>' : ''}
                    ${badge}
                </div>
                <div class="pc-post-meta-v3">
                    <i class="far fa-clock"></i> ${timeStr} ${distHtml}
                </div>
            </div>
            <button class="pc-post-more" title="ตัวเลือก"
                    style="color:var(--tt-tm);cursor:pointer;padding:8px 10px;border-radius:10px;border:none;background:transparent;font-size:16px;transition:0.2s;flex-shrink:0;"
                    onclick="event.stopPropagation();if(window.togglePostMenu)window.togglePostMenu('${item.id}',event)"
                    onmouseenter="this.style.background='rgba(255,255,255,0.07)'"
                    onmouseleave="this.style.background='transparent'">
                <i class="fas fa-ellipsis-h"></i>
            </button>
        </div>

        <!-- Content -->
        <div class="pc-post-content-v3">
            ${title ? `<div class="pc-post-title-v3">${title}</div>` : ''}
            ${desc  ? `<div class="pc-post-desc-v3">${desc}</div>` : ''}
        </div>

        <!-- Media -->
        ${mediaHtml}

        <!-- Stats row -->
        <div style="display:flex;justify-content:space-between;padding:10px 20px 0;font-size:12px;color:var(--tt-tm);">
            <div style="display:flex;align-items:center;gap:5px;">
                <div style="width:16px;height:16px;border-radius:50%;background:var(--tt-p);display:flex;align-items:center;justify-content:center;">
                    <i class="fas fa-thumbs-up" style="font-size:8px;color:#fff;"></i>
                </div>
                <span>${likes} ถูกใจ</span>
            </div>
            <div>${comments} ความคิดเห็น</div>
        </div>

        <!-- Divider -->
        <div style="height:1px;background:var(--tt-border);margin:10px 20px 0;"></div>

        <!-- Actions -->
        <div class="pc-post-actions-v3">
            <div class="pc-post-action-group">
                <button class="pill-button-v3 outline like-btn-${item.id}"
                        onclick="event.stopPropagation();if(window.likePost)window.likePost('${item.id}')"
                        style="background:${liked?'rgba(99,102,241,0.12)':'rgba(255,255,255,0.04)'};color:${liked?'#a5b4fc':'var(--tt-tm)'};border-color:${liked?'rgba(99,102,241,0.35)':'var(--tt-border)'};">
                    <i class="${liked?'fas':'far'} fa-thumbs-up"></i>
                    <span>ถูกใจ</span>
                </button>
                <button class="pill-button-v3 outline"
                        onclick="event.stopPropagation();if(window.openComments)window.openComments('${item.id}');else window.viewPostDetails('${item.id}')"
                        style="background:rgba(255,255,255,0.04);color:var(--tt-tm);">
                    <i class="far fa-comment-dots"></i>
                    <span>ความคิดเห็น</span>
                </button>
            </div>
            <div class="pc-post-action-group">
                <button class="pill-button-v3 outline"
                        onclick="event.stopPropagation();if(window.sharePost)window.sharePost('${item.id}','${safeTitle}')"
                        style="background:rgba(255,255,255,0.04);color:var(--tt-tm);">
                    <i class="fas fa-share-alt"></i>
                    <span>แชร์</span>
                </button>
                <button class="pill-button-v3 primary"
                        onclick="event.stopPropagation();window.viewPostDetails('${item.id}')">
                    ${item.type==='product' ? '<i class="fas fa-shopping-cart"></i> ซื้อเลย' : 'อ่านต่อ <i class="fas fa-chevron-right" style="font-size:9px;"></i>'}
                </button>
            </div>
        </div>
    `;

    return div;
}

/**
 * Render grid (PC mode)
 */
function renderGrid(container, items, renderHeader = true) {
    if (!container) return;
    
    const loader = document.getElementById('feedLoading');
    if (loader) loader.remove();
    
    // Clear old items
    container.querySelectorAll('.tuktuk-grid-card, .no-results-msg, .pc-post-social-card').forEach(el => el.remove());
    
    if (!items || items.length === 0) {
        const div = document.createElement('div');
        div.className = 'no-results-msg';
        div.style.cssText = 'grid-column:1/-1;text-align:center;padding:40px;color:#aaa;';
        div.innerHTML = `<i class="fas fa-search fa-3x mb-3"></i><br>ไม่พบรายการ`;
        container.appendChild(div);
        return;
    }
    
    const isPC = window.innerWidth >= 992; // matches @media (min-width: 992px) in CSS

    // Explicitly prevent mobile render if we are in the PC-specific container
    if (container.id === 'postsContainer') {
        console.log('[TukTukFeed] Rendering to postsContainer (PC Grid Force)');
        if (window.pcEngine && typeof window.pcEngine.renderGrid === 'function') {
            window.pcEngine.renderGrid(container, items, false);
        } else {
            items.forEach(item => container.appendChild(createPCGridCard(item)));
        }
        return;
    }

    if (!isPC) {
        // Phone/tablet (<992px): TikTok-style vertical feed
        container.style.display = 'block';
        renderTukTukSlides(container, items);
        return;
    }

    // PC (≥992px): Facebook-style cards (Modern PC Engine)
    if (window.pcEngine && typeof window.pcEngine.renderGrid === 'function') {
        console.log('[TukTukFeed] Delegating PC render to pcEngine');
        window.pcEngine.renderGrid(container, items, false);
        return;
    }

    // Legacy PC Fallback
    container.style.display = 'block';
    items.forEach(item => {
        container.appendChild(createPCGridCard(item));
    });
}

// ================================================
// DATA FETCHING (Go Engine + Firebase)
// ================================================

function asFeedArray(value) {
    if (Array.isArray(value)) return value;
    if (!value || typeof value !== 'object') return [];
    return Object.values(value).filter(Boolean);
}

function mapProductsToFeedItems(products, location) {
    return asFeedArray(products).map(product => normalizeFeedItem(product, 'product', location)).filter(Boolean);
}

/**
 * Fetch feed from Go Engine (2.5s timeout — short enough to not block Firebase fallback)
 */
async function fetchGoEngineFeed(userId, province, mode) {
    if (!TUKTUK_FEED_CONFIG.ENABLE_GO_ENGINE) return null;

    const hasRestClient = window.TukTukAPI && window.TukTukAPI.feed && window.TukTukAPI.products;
    const limit = TUKTUK_FEED_CONFIG.POSTS_LIMIT + TUKTUK_FEED_CONFIG.PRODUCTS_LIMIT;

    const fetchJsonWithTimeout = async (url, timeoutMs = 3000) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const response = await fetch(url, { signal: controller.signal });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } finally {
            clearTimeout(timeoutId);
        }
    };

    try {
        let feedData = {};
        let productsData = {};

        if (hasRestClient) {
            const [feedResult, productsResult] = await Promise.allSettled([
                window.TukTukAPI.feed.list({ userId: userId || 'guest', province: province || '', mode, limit, timeoutMs: 4500 }),
                window.TukTukAPI.products.list({ province: province || '', limit: TUKTUK_FEED_CONFIG.PRODUCTS_LIMIT, timeoutMs: 7500 })
            ]);

            if (feedResult.status === 'rejected') console.warn('[TukTukFeed] REST /feed unavailable:', feedResult.reason?.message || feedResult.reason);
            if (productsResult.status === 'rejected') console.warn('[TukTukFeed] REST /products unavailable:', productsResult.reason?.message || productsResult.reason);

            feedData = feedResult.status === 'fulfilled' ? feedResult.value : {};
            productsData = productsResult.status === 'fulfilled' ? productsResult.value : {};
        } else {
            const apiBase = (window.TUKTUK_LIFF && window.TUKTUK_LIFF.apiBase)
                ? window.TUKTUK_LIFF.apiBase
                : 'https://tuktuk-engine.fly.dev';
            const baseUrl = window.location.origin.includes('localhost') ? 'http://localhost:8080' : apiBase;
            const feedUrl = `${baseUrl}/api/v1/feed?userId=${encodeURIComponent(userId || 'guest')}&province=${encodeURIComponent(province || '')}&mode=${mode}&limit=${limit}`;
            const productsUrl = `${baseUrl}/api/v1/products?province=${encodeURIComponent(province || '')}&limit=${TUKTUK_FEED_CONFIG.PRODUCTS_LIMIT}`;

            const [feedResult, productsResult] = await Promise.allSettled([
                fetchJsonWithTimeout(feedUrl, 3000),
                fetchJsonWithTimeout(productsUrl, 6500)
            ]);

            if (feedResult.status === 'rejected') console.warn('[TukTukFeed] Go /feed unavailable:', feedResult.reason?.message || feedResult.reason);
            if (productsResult.status === 'rejected') console.warn('[TukTukFeed] Go /products unavailable:', productsResult.reason?.message || productsResult.reason);

            feedData = feedResult.status === 'fulfilled' ? feedResult.value : {};
            productsData = productsResult.status === 'fulfilled' ? productsResult.value : {};
        }

        const posts = asFeedArray(feedData.posts || feedData.items);
        const news = asFeedArray(feedData.news);
        const feedProducts = asFeedArray(feedData.products);
        const endpointProducts = asFeedArray(productsData.products || productsData.items)
            .map(product => hasRestClient && window.TukTukAPI.products.productToFeedItem
                ? window.TukTukAPI.products.productToFeedItem(product)
                : product)
            .filter(Boolean);
        const products = feedProducts.length > 0 ? feedProducts : endpointProducts;

        if (posts.length === 0 && news.length === 0 && products.length === 0) return null;

        return { posts, news, products, source: hasRestClient ? 'REST API v1' : 'Go Engine direct' };
    } catch (error) {
        console.warn('[TukTukFeed] REST/Go feed unavailable:', error.message);
        return null;
    }
}

async function fetchProductOnlyFeed(province, location) {
    const normalizeProducts = products => mapProductsToFeedItems(
        asFeedArray(products).map(product => window.TukTukAPI?.products?.productToFeedItem
            ? window.TukTukAPI.products.productToFeedItem(product)
            : product),
        location
    );

    if (window.TukTukAPI?.products?.list) {
        try {
            const data = await window.TukTukAPI.products.list({
                province: province || '',
                limit: TUKTUK_FEED_CONFIG.PRODUCTS_LIMIT,
                timeoutMs: 9000
            });
            const products = normalizeProducts(data.products || data.items);
            if (products.length) {
                recordFeedDiagnostic('product_only_success', {
                    source: 'rest-client',
                    count: products.length,
                    province: province || '',
                });
                return products;
            }
        } catch (err) {
            console.warn('[TukTukFeed] Product-only REST client fallback failed:', err.message || err);
            recordFeedDiagnostic('product_only_failed', {
                source: 'rest-client',
                message: err.message || String(err),
            });
        }
    }

    try {
        const url = new URL('/api/v1/products', window.location.origin);
        if (province) url.searchParams.set('province', province);
        url.searchParams.set('limit', String(TUKTUK_FEED_CONFIG.PRODUCTS_LIMIT));
        const response = await fetch(url.toString(), { headers: { Accept: 'application/json' }, credentials: 'omit' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const products = normalizeProducts(data.products || data.items);
        if (products.length) {
            recordFeedDiagnostic('product_only_success', {
                source: 'direct-fetch',
                count: products.length,
                province: province || '',
            });
        }
        return products;
    } catch (err) {
        console.warn('[TukTukFeed] Product-only direct fallback failed:', err.message || err);
        recordFeedDiagnostic('product_only_failed', {
            source: 'direct-fetch',
            message: err.message || String(err),
        });
        return [];
    }
}

/**
 * Fetch all feed data from Firebase in parallel (3 collections simultaneously).
 * @param {string} mode - feed mode
 * @param {object|null} location - user GPS {lat,lng} or null
 * @param {object} cursors - optional Firestore lastDoc cursors {posts, news, products}
 * @returns {{ posts, news, products, lastDocs, hasMore }}
 */
async function fetchFirebaseFeedData(mode, location, cursors = {}) {
    console.warn('[TukTukFeed] fetchFirebaseFeedData bypassed. Firestore is no longer used.');
    return { posts: [], news: [], products: [], lastDocs: {}, hasMore: false };
}
/* Bypassed Firestore implementation below */
async function _bypassed_fetchFirebaseFeedData(mode, location, cursors = {}) {
    const feedDb = getFeedFirestore();

    // Query without status/published filter — covers posts from both Flutter screens
    // ✅ Cloudflare D1 collections
    let communityQ = feedDb.collection('posts')
        .orderBy('createdAt', 'desc')
        .limit(TUKTUK_FEED_CONFIG.POSTS_LIMIT);
    if (cursors.posts) communityQ = communityQ.startAfter(cursors.posts);

    const newsThreshold = new Date(Date.now() - 48 * 60 * 60 * 1000);
    let newsQ = feedDb.collection('news_feed')
        .where('createdAt', '>=', fb.firestore.Timestamp.fromDate(newsThreshold))
        .orderBy('createdAt', 'desc')
        .limit(TUKTUK_FEED_CONFIG.NEWS_LIMIT);
    if (cursors.news) newsQ = newsQ.startAfter(cursors.news);

    let productsQ = feedDb.collection('products')
        .where('status', '==', 'active')
        .limit(TUKTUK_FEED_CONFIG.PRODUCTS_LIMIT);
    if (cursors.products) productsQ = productsQ.startAfter(cursors.products);

    const [postsSnap, newsSnap, productsSnap] = await Promise.allSettled([
        fetchFirebaseWithTimeout(communityQ, 6000),
        fetchFirebaseWithTimeout(newsQ, 6000),
        fetchFirebaseWithTimeout(productsQ, 6000)
    ]);

    const queryResults = [
        ['posts', postsSnap],
        ['news_feed', newsSnap],
        ['products', productsSnap]
    ];
    const failedQueries = queryResults.filter(([, result]) => result.status === 'rejected');
    failedQueries.forEach(([name, result]) => console.warn(`[TukTukFeed] D1 ${name} query failed:`, result.reason));
    if (failedQueries.length === queryResults.length) {
        throw new Error('All D1 feed queries failed');
    }

    const postsDocs  = postsSnap.status === 'fulfilled'    ? postsSnap.value.docs    : [];
    const newsDocs   = newsSnap.status === 'fulfilled'     ? newsSnap.value.docs     : [];
    const productDocs= productsSnap.status === 'fulfilled' ? productsSnap.value.docs : [];

    const posts    = postsDocs.map(d  => normalizeFeedItem({ id: d.id, ...d.data() }, 'post',    location)).filter(Boolean);
    const news     = newsDocs.map(d   => normalizeFeedItem({ id: d.id, ...d.data() }, 'news',    location)).filter(Boolean);
    const products = productDocs.map(d => normalizeFeedItem({ id: d.id, ...d.data() }, 'product', location)).filter(Boolean);

    // Track last docs for next-page cursor
    const nextLastDocs = {
        posts:    postsDocs.length    > 0 ? postsDocs[postsDocs.length - 1]       : (cursors.posts    || null),
        news:     newsDocs.length     > 0 ? newsDocs[newsDocs.length - 1]         : (cursors.news     || null),
        products: productDocs.length  > 0 ? productDocs[productDocs.length - 1]   : (cursors.products || null)
    };

    // hasMore = at least one collection returned a full page
    const hasMore = postsDocs.length >= TUKTUK_FEED_CONFIG.POSTS_LIMIT
        || productDocs.length >= TUKTUK_FEED_CONFIG.PRODUCTS_LIMIT
        || newsDocs.length    >= TUKTUK_FEED_CONFIG.NEWS_LIMIT;

    return { posts, news, products, lastDocs: nextLastDocs, hasMore };
}

/**
 * Fetch from Firebase with timeout
 */
async function fetchFirebaseWithTimeout(query, timeoutMs = 8000) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        
        // Firebase doesn't support abort natively, but we can race with a timeout
        const result = await Promise.race([
            query.get(),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Firebase timeout')), timeoutMs)
            )
        ]);
        
        clearTimeout(timeoutId);
        return result;
    } catch (error) {
        console.warn('[TukTukFeed] Firebase fetch error:', error.message);
        throw error;
    }
}

/**
 * Interleave posts / news / products into a single feed array.
 * near_me: sort by distance, ratio 5:1 (product:post)
 * all: round-robin post → product → news
 */
function _interleaveFeedItems(posts, news, products, mode) {
    const items = [];
    const province = TukTukFeed.selectedProvince || '';

    if (mode === 'near_me') {
        const radius = TUKTUK_FEED_CONFIG.NEAR_ME_RADIUS;
        const hasUserLoc = !!TukTukFeed.userLocation;
        // Soft sort: location-tagged items bubble to top, rest still visible.
        // Hard filter only when GPS is available (distance is known and reliable).
        const inRange = arr => {
            const valid = arr.filter(Boolean);
            if (hasUserLoc) {
                // GPS: hard filter by radius OR province match, then sort by distance
                const hit = valid.filter(p =>
                    (p.distance < Infinity && p.distance <= radius) ||
                    (province && p.sellerProvince && p.sellerProvince.includes(province)));
                return hit.sort((a, b) => (a.distance || 999999) - (b.distance || 999999));
            }
            // No GPS: soft sort — province-matched → has-any-location → rest
            if (province) {
                const exact   = valid.filter(p => p.sellerProvince && p.sellerProvince.includes(province));
                const withLoc = valid.filter(p => p.sellerProvince && !p.sellerProvince.includes(province));
                const noLoc   = valid.filter(p => !p.sellerProvince);
                return [...exact, ...withLoc, ...noLoc];
            }
            const withLoc = valid.filter(p => p.sellerProvince || p.hasCoords);
            const noLoc   = valid.filter(p => !p.sellerProvince && !p.hasCoords);
            return [...withLoc, ...noLoc];
        };
        const sortDist = arr => [...arr].sort((a, b) => (a.distance || 9999) - (b.distance || 9999));

        const fp = sortDist(inRange(posts));
        const fd = sortDist(inRange(products));
        const ratio = TUKTUK_FEED_CONFIG.NEAR_ME_RATIO;
        let pi = 0, ii = 0;

        while (pi < fd.length || ii < fp.length) {
            for (let i = 0; i < ratio.info && ii < fp.length; i++) items.push(fp[ii++]);
            for (let i = 0; i < ratio.products && pi < fd.length; i++) items.push(fd[pi++]);
        }
        items.push(...news.slice(0, 5));
    } else {
        // all mode: 3 posts → 1 product → 1 news (DEFAULT_RATIO 1:3)
        const ratio = TUKTUK_FEED_CONFIG.DEFAULT_RATIO;
        let pi = 0, ii = 0, ni = 0;
        while (pi < products.length || ii < posts.length || ni < news.length) {
            // Inject featured seller every 5 items
            if (items.length > 0 && items.length % 5 === 0 && pi < products.length) {
                items.push({ ...products[pi], type: 'featured_seller' });
            }
            for (let i = 0; i < ratio.info && ii < posts.length; i++) items.push(posts[ii++]);
            for (let i = 0; i < ratio.products && pi < products.length; i++) items.push(products[pi++]);
            if (ni < news.length) items.push(news[ni++]);
        }
    }
    return items;
}

/**
 * Append next page of items to an existing TikTok feed (load more).
 * Called when IntersectionObserver fires near the bottom of the feed.
 */
async function appendMoreFeedItems(container, mode) {
    if (!container) return;
    const cacheKey = `${mode}_${TukTukFeed.selectedProvince || 'all'}`;

    // Stop if we know there's no more data
    if (TukTukFeed.feedEnded[cacheKey]) {
        console.log('[TukTukFeed] Feed ended — no more pages');
        return;
    }
    if (TukTukFeed.isLoading) return;
    TukTukFeed.isLoading = true;

    // Show a subtle spinner at the bottom
    const spinner = document.createElement('div');
    spinner.id = 'feedLoadMore';
    spinner.style.cssText = 'text-align:center;padding:20px;color:#aaa;font-size:0.85rem;';
    spinner.innerHTML = '<i class="fas fa-spinner fa-spin"></i> โหลดเพิ่มเติม...';
    container.appendChild(spinner);

    try {
        const location = TukTukFeed.userLocation;
        const cursors = TukTukFeed.lastDocs[cacheKey] || {};
        const fbData = await fetchFirebaseFeedData(mode, location, cursors);

        spinner.remove();

        const { posts, news, products, lastDocs, hasMore } = fbData;
        if (!posts.length && !news.length && !products.length) {
            TukTukFeed.feedEnded[cacheKey] = true;
            console.log('[TukTukFeed] No more items — marking feed as ended');
            return;
        }

        // Store updated cursors
        TukTukFeed.lastDocs[cacheKey] = lastDocs;
        TukTukFeed.feedEnded[cacheKey] = !hasMore;

        const newItems = _interleaveFeedItems(posts, news, products, mode);
        if (!newItems.length) { TukTukFeed.feedEnded[cacheKey] = true; return; }

        // Append to in-memory feed + cache
        TukTukFeed.currentFeed = TukTukFeed.currentFeed.concat(newItems);
        if (TUKTUK_FEED_CONFIG.ENABLE_CACHE) {
            TukTukFeed.feedCache[cacheKey] = TukTukFeed.currentFeed;
            TukTukFeed.cacheTimestamps[cacheKey] = Date.now();
        }

        // Append slides to DOM (mobile TikTok mode)
        const existingSlides = container.querySelectorAll('.tuktuk-video-item');
        const startIndex = existingSlides.length;
        _appendTukTukSlides(container, newItems, startIndex);
        console.log(`[TukTukFeed] Appended ${newItems.length} items (total: ${TukTukFeed.currentFeed.length})`);

    } catch (err) {
        console.warn('[TukTukFeed] appendMore error:', err.message);
        spinner.remove();
    } finally {
        TukTukFeed.isLoading = false;
    }
}

/**
 * Append slides to an existing TikTok-style container without clearing existing content.
 * @param {Element} container - feed container
 * @param {Array}   items     - new items to append
 * @param {number}  startIndex - dataset.index offset (= existing slide count)
 */
function _appendTukTukSlides(container, items, startIndex) {
    const isPC = window.innerWidth >= 992;
    if (isPC) return; // PC uses grid, append not needed

    // Build each slide using the existing card-builder functions.
    // We can't call renderTukTukSlides directly (it clears + resets scroll),
    // so we delegate to a hidden tmp div then steal the node.
    items.forEach((item, i) => {
        const idx = startIndex + i;
        // Delegate to the same card builders used in renderTukTukSlides
        let el = null;
        if      (item.type === 'idea_lab')       el = typeof renderIdeaLabCard       === 'function' ? renderIdeaLabCard(item)       : null;
        else if (item.type === 'rider_profile')  el = typeof renderRiderProfileCard  === 'function' ? renderRiderProfileCard(item)  : null;
        else if (item.type === 'rider_job')      el = typeof renderRiderJobCard      === 'function' ? renderRiderJobCard(item)      : null;
        else if (item.type === 'featured_seller')el = typeof renderFeaturedSellerCard=== 'function' ? renderFeaturedSellerCard(item): null;

        if (el) {
            el.dataset.index = idx;
            container.appendChild(el);
        } else {
            // Re-use renderTukTukSlides in a temp div, then steal the node
            const tmp = document.createElement('div');
            renderTukTukSlides(tmp, [item]);
            const slide = tmp.querySelector('.tuktuk-video-item');
            if (slide) {
                slide.dataset.index = idx;
                container.appendChild(slide);
            }
        }

        // Observe new slide with existing observer
        const newSlide = container.querySelector(`[data-index="${idx}"]`);
        if (newSlide && TukTukFeed._slideObserver) {
            TukTukFeed._slideObserver.observe(newSlide);
        }
    });
}

/**
 * Load mixed feed (all/near_me)
 */
async function loadMixedFeed(container, mode, forceRefresh = false) {
    if (!container) return;
    
    console.log(`[TukTukFeed] Loading feed - Mode: ${mode}, Force: ${forceRefresh}`);
    TukTukFeed.isLoading = true;
    recordFeedDiagnostic('load_start', {
        mode,
        forceRefresh,
        province: TukTukFeed.selectedProvince || '',
    });
    
    // Check cache
    const cacheKey = `${mode}_${TukTukFeed.selectedProvince || 'all'}`;
    if (TUKTUK_FEED_CONFIG.ENABLE_CACHE && !forceRefresh && 
        TukTukFeed.feedCache[cacheKey] && 
        TukTukFeed.feedCache[cacheKey].length > 0 &&
        TukTukFeed.cacheTimestamps[cacheKey] &&
        (Date.now() - TukTukFeed.cacheTimestamps[cacheKey]) < TUKTUK_FEED_CONFIG.CACHE_TTL) {
        
        console.log(`[TukTukFeed] Cache hit for ${cacheKey}`);
        TukTukFeed.metrics.cacheHits++;
        recordFeedDiagnostic('cache_hit', {
            mode,
            cacheKey,
            count: TukTukFeed.feedCache[cacheKey].length,
        });
        
        // If container already has slides and it's from the SAME cacheKey, skip re-render.
        // This preserves scroll position and keeps videos playing when switching back.
        const existingSlides = container.querySelectorAll('.tuktuk-video-item');
        if (existingSlides.length > 0 && container.dataset.currentCacheKey === cacheKey) {
            console.log(`[TukTukFeed] Container already has content for ${cacheKey} — skip re-render`);
            TukTukFeed.isLoading = false;
            initTukTukSlideObserver(container);
            return;
        }

        renderGrid(container, TukTukFeed.feedCache[cacheKey]);
        container.dataset.currentCacheKey = cacheKey;
        TukTukFeed.isLoading = false;
        return;
    }
    
    // Show loading
    let headerHtml = '';
    if (mode === 'near_me') {
        const selectedName = localStorage.getItem('selectedProvinceName') || 'ใกล้ฉัน';
        headerHtml = `
            <div class="near-me-header" style="grid-column: 1/-1; margin-bottom: 10px; padding: 0 5px;">
                <div class="search-wrapper" style="position: relative;">
                    <i class="fas fa-search" style="position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: #aaa;"></i>
                    <input type="text" id="feedSearch" placeholder="ค้นหาโพสต์ สินค้า ร้านค้า..." 
                           style="width: 100%; padding: 12px 12px 12px 45px; border-radius: 50px; border: 1px solid rgba(255,255,255,0.2); background: rgba(30,30,30,0.8); color: white; backdrop-filter: blur(10px); outline: none;">
                </div>
                <div style="margin-top: 10px; font-size: 0.85rem; color: #cbd5e1; display: flex; align-items: center; gap: 6px;">
                    <i class="fas fa-map-marker-alt" style="color: #22d3ee;"></i>
                    <span>${selectedName}</span>
                    <button onclick="showProvincePicker()" style="background: none; border: none; color: #22d3ee; margin-left: 8px; padding: 4px 8px; border-radius: 4px;">
                        <i class="fas fa-pencil-alt"></i> เปลี่ยน
                    </button>
                </div>
            </div>
        `;
    }
    
    container.innerHTML = `
        ${headerHtml}
        <div id="feedLoading" style="grid-column: 1/-1; text-align: center; padding: 40px; color: white;">
            <i class="fas ${mode === 'near_me' ? 'fa-location-arrow' : 'fa-magic'} fa-spin fa-2x"></i>
            <p style="margin-top: 15px;">${mode === 'near_me' ? 'กำลังค้นหาสินค้าใกล้คุณ...' : 'กำลังโหลดฟีด...'}</p>
        </div>
    `;
    
    try {
        // Get location for near_me
        let location = null;
        if (mode === 'near_me') {
            location = await getUserLocation();
        }
        
        // Get user ID
        const userId = (typeof WizmobizAuth !== 'undefined' && WizmobizAuth.getUser) 
            ? WizmobizAuth.getUser()?.uid || 'guest' 
            : 'guest';
        
        const province = TukTukFeed.selectedProvince || '';

        const fetchFirebaseFallback = async () => {
            const feedDb = await waitForFeedDb(3500);
            if (!feedDb) throw new Error('Firebase is not ready.');
            return fetchFirebaseFeedData(mode, location);
        };

        const goResult = await fetchGoEngineFeed(userId, province, mode)
            .then(value => ({ status: 'fulfilled', value }))
            .catch(reason => ({ status: 'rejected', reason }));

        const goData = goResult.status === 'fulfilled' && goResult.value
            && ((goResult.value.posts || []).length > 0 || (goResult.value.news || []).length > 0 || (goResult.value.products || []).length > 0)
            ? goResult.value : null;

        if (goResult.status === 'rejected') {
            console.warn('[TukTukFeed] REST/Go feed failed:', goResult.reason);
            recordFeedDiagnostic('rest_feed_failed', {
                mode,
                message: goResult.reason?.message || String(goResult.reason),
            });
        }

        let fbData = null;
        if (!goData) {
            const fbResult = await fetchFirebaseFallback()
                .then(value => ({ status: 'fulfilled', value }))
                .catch(reason => ({ status: 'rejected', reason }));
            if (fbResult.status === 'rejected') {
                console.warn('[TukTukFeed] Firebase feed failed:', fbResult.reason);
                recordFeedDiagnostic('firebase_feed_failed', {
                    mode,
                    message: fbResult.reason?.message || String(fbResult.reason),
                });
            }
            fbData = fbResult.status === 'fulfilled' ? fbResult.value : null;
        }

        let productOnlyItems = [];
        if (!goData && !fbData) {
            productOnlyItems = await fetchProductOnlyFeed(province, location);
            recordFeedDiagnostic('product_only_rescue_attempt', {
                mode,
                count: productOnlyItems.length,
            });
            if (!productOnlyItems.length) {
                throw new Error('No feed data source returned data');
            }
        }

        const fbPosts = fbData ? asFeedArray(fbData.posts) : [];
        const fbNews = fbData ? asFeedArray(fbData.news) : [];
        const fbProducts = fbData ? asFeedArray(fbData.products) : [];
        const goPosts = goData ? asFeedArray(goData.posts).filter(p => p.authorId && p.authorId !== 'System') : [];
        const goNews = goData ? asFeedArray(goData.news).map(n => normalizeFeedItem(n, 'news', location)).filter(Boolean) : [];
        const goProducts = goData ? mapProductsToFeedItems(goData.products, location) : [];

        // Prefer Firebase posts because it preserves uploaded video images[], but use Go as a non-empty fallback.
        const posts = fbPosts.length > 0 ? fbPosts : goPosts.map(p => normalizeFeedItem(p, 'post', location)).filter(Boolean);
        const news = goNews.length > 0 ? goNews : fbNews;
        const products = goProducts.length > 0 ? goProducts : fbProducts;

        const src = goData ? ('REST API v1 feed (' + (goData.source || 'api') + ')') : 'Firebase fallback';
        console.log(`[TukTukFeed] ${src}`);
        recordFeedDiagnostic('source_selected', {
            mode,
            source: productOnlyItems.length ? 'Product-only rescue' : src,
            posts: posts.length,
            news: news.length,
            products: products.length,
        });
        var items = productOnlyItems.length ? productOnlyItems : _interleaveFeedItems(posts, news, products, mode);
        if (!items.length && products.length) {
            items = products;
        }
        if (!items.length) {
            const rescueProducts = await fetchProductOnlyFeed(province, location);
            if (rescueProducts.length) {
                items = rescueProducts;
                console.log(`[TukTukFeed] Product-only rescue loaded ${rescueProducts.length} items`);
                recordFeedDiagnostic('product_rescue_success', {
                    mode,
                    count: rescueProducts.length,
                });
            }
        }
        if (!items.length) {
            recordFeedDiagnostic('load_empty', {
                mode,
                posts: posts.length,
                news: news.length,
                products: products.length,
            });
            throw new Error('Feed returned no visible items');
        }
        
        // Update cache
        if (TUKTUK_FEED_CONFIG.ENABLE_CACHE) {
            TukTukFeed.feedCache[cacheKey] = items;
            TukTukFeed.cacheTimestamps[cacheKey] = Date.now();
        }

        // Store pagination cursors (Firebase only — Go Engine doesn't support cursors)
        if (fbData && fbData.lastDocs) {
            TukTukFeed.lastDocs[cacheKey] = fbData.lastDocs;
            TukTukFeed.feedEnded[cacheKey] = !fbData.hasMore;
        }

        TukTukFeed.currentFeed = items;
        TukTukFeed.metrics.loads++;

        // Render
        renderGrid(container, items);
        container.dataset.currentCacheKey = cacheKey;
        recordFeedDiagnostic('load_success', {
            mode,
            cacheKey,
            count: items.length,
        });
        
        // Setup search listener
        const searchInput = document.getElementById('feedSearch');
        if (searchInput) {
            const searchHandler = debounce((e) => {
                const term = e.target.value.toLowerCase();
                const filtered = TukTukFeed.currentFeed.filter(item =>
                    (item.displayTitle && item.displayTitle.toLowerCase().includes(term)) ||
                    (item.displayDesc && item.displayDesc.toLowerCase().includes(term)) ||
                    (item.displayAuthor && item.displayAuthor.toLowerCase().includes(term))
                );
                renderGrid(container, filtered, false);
            }, TUKTUK_FEED_CONFIG.SEARCH_DEBOUNCE);
            
            searchInput.addEventListener('input', searchHandler);
        }
        
    } catch (error) {
        console.error('[TukTukFeed] Load error:', error);
        TukTukFeed.metrics.errors++;
        recordFeedDiagnostic('load_error', {
            mode,
            message: error.message || String(error),
        });

        const errorHtml = `
            <div style="padding:20px;text-align:center;">
                <i class="fas fa-exclamation-triangle fa-2x" style="color:#fbbf24;"></i><br><br>
                โหลดฟีดไม่สำเร็จ<br>
                <small style="opacity:0.6;">${error.message}</small><br><br>
                <button onclick="initTukTukFeed('${mode}')" style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.3);color:#fff;padding:8px 20px;border-radius:20px;cursor:pointer;">
                    <i class="fas fa-sync-alt"></i> ลองอีกครั้ง
                </button>
            </div>`;
        const loader = document.getElementById('feedLoading');
        if (loader) {
            loader.innerHTML = errorHtml;
        } else {
            // loader was removed by renderGrid — create fresh error overlay
            container.querySelectorAll('.tuktuk-video-item, .no-results-msg').forEach(el => el.remove());
            const errDiv = document.createElement('div');
            errDiv.style.cssText = 'height:100vh;height:100dvh;display:flex;align-items:center;justify-content:center;color:#fff;flex-direction:column;';
            errDiv.innerHTML = errorHtml;
            container.appendChild(errDiv);
        }
    } finally {
        TukTukFeed.isLoading = false;
    }
}

// ================================================
// MAIN INITIALIZATION
// ================================================

/**
 * Initialize TukTuk feed
 */
function initTukTukFeed(category = 'all', forceRefresh = false) {
    const containers = {
        all: 'tuktukFeed',
        near_me: 'tuktukFeedNearMe',
        community: 'tuktukFeedCommunity'
    };
    
    const activeId = containers[category] || 'tuktukFeed';
    const feedContainer = document.getElementById(activeId);
    
    if (!feedContainer) {
        console.warn(`[TukTukFeed] Container ${activeId} not found`);
        return;
    }

    // Hide all other feed containers and pause their videos
    Object.values(containers).forEach(id => {
        const el = document.getElementById(id);
        if (el && id !== activeId) {
            el.style.display = 'none';
            // Stop any playing video in the hidden container
            el.querySelectorAll('video').forEach(v => {
                try { v.pause(); } catch(_) {}
            });
        }
    });

    // Ensure the active container is visible
    feedContainer.style.display = 'block';

    // Clear existing listeners (mainly for Firestore)
    if (TukTukFeed.unsubscribe) {
        TukTukFeed.unsubscribe();
        TukTukFeed.unsubscribe = null;
    }
    
    // Clear timers
    Object.values(TukTukFeed.timers).forEach(clearTimeout);
    TukTukFeed.timers = {};
    
    // Update state
    TukTukFeed.currentCategory = category;
    sessionStorage.setItem('tuktuk_last_category', category);
    
    // Update body class
    document.body.classList.add('feed-mode-active');
    document.documentElement.classList.add('feed-mode-active');
    
    // Reset classes on the active container
    feedContainer.classList.remove('feed-grid-mode', 'feed-community-mode');
    
    if (category === 'community') {
        feedContainer.classList.add('feed-community-mode');
        // Load community feed
        if (typeof initCommunityFeed === 'function') {
            initCommunityFeed(feedContainer);
            return;
        }
    }
    
    // Load mixed feed (will handle cache/re-render logic internally)
    loadMixedFeed(feedContainer, category, forceRefresh);
}

// ================================================
// TAB NAVIGATION
// ================================================

/**
 * Setup tab navigation
 */
function setupTabNavigation() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            const btn = e.currentTarget;
            const category = btn.getAttribute('data-category');
            
            if (TukTukFeed.currentCategory === category) return;
            
            tabs.forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            
            initTukTukFeed(category);
        });
    });
}

// Expose switchCategory globally — called by mobile-header.js switchCategoryMobile
window.switchCategory = initTukTukFeed;

// Consolidated to ui-helpers.js

    window.copyLink = function(postId) {
        const url = `${window.location.origin}${window.location.pathname}?post=${postId}`;
        navigator.clipboard.writeText(url).then(() => {
            showFeedToast('คัดลอกลิงก์แล้ว!', 'success');
        });
    };

// ================================================
// INITIALIZATION ON LOAD
// ================================================

document.addEventListener('DOMContentLoaded', function() {
    // Get category from URL or session
    const urlParams = new URLSearchParams(window.location.search);
    const targetPostId = urlParams.get('post') || urlParams.get('id') || urlParams.get('postId');
    const catParam = urlParams.get('category') || urlParams.get('cat');
    let lastCat = catParam || sessionStorage.getItem('tuktuk_last_category') || 'all';

    // If we have a target post ID, we MUST go to 'all' (Explore) feed
    if (targetPostId) {
        lastCat = 'all';
    }

    // Restore selected province
    // Migration: old code stored province CODE ("10","11"…); new code stores Thai name.
    // If it's a short numeric string, it's an old code — discard it so the user picks again.
    let savedProvince = localStorage.getItem('selectedProvince');
    if (savedProvince && /^\d{1,3}$/.test(savedProvince.trim())) {
        localStorage.removeItem('selectedProvince');
        localStorage.removeItem('selectedProvinceName');
        sessionStorage.removeItem('selectedProvince');
        savedProvince = null;
    }
    if (savedProvince) {
        TukTukFeed.selectedProvince = savedProvince;
        // Ensure selectedProvinceName is also set (back-fill from older saves that lacked it)
        if (!localStorage.getItem('selectedProvinceName')) {
            localStorage.setItem('selectedProvinceName', savedProvince);
        }
    }

    // Only auto-init TikTok feed on phones (<768px).
    // Tablets & desktops use PC social feed via app-init.js → pcInit().
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if ((window.innerWidth < 768 || isMobileDevice) && !TukTukFeed.didAutoInit) {
        TukTukFeed.didAutoInit = true;
        initTukTukFeed(lastCat);
    }
    setupTabNavigation();
    
    // 🎨 Deep Link Handler: Scroll to shared post
    if (targetPostId) {
        console.log('[TukTukFeed] Handling deep link for post:', targetPostId);
        let attempts = 0;
        const maxAttempts = 15;
        const findAndScroll = setInterval(() => {
            attempts++;
            const el = document.getElementById(`tuktuk-${targetPostId}`);
            if (el) {
                clearInterval(findAndScroll);
                setTimeout(() => {
                    el.scrollIntoView({ behavior: 'auto' });
                    console.log('[TukTukFeed] Scrolled to target:', targetPostId);
                    
                    // Trigger manual play for targeted post
                    const video = el.querySelector('video');
                    if (video) {
                        _playFeedVideo(video);
                    } else if (window.TukTukEngine && window.TukTukEngine.players[targetPostId]) {
                        const player = window.TukTukEngine.players[targetPostId];
                        if (player.unMute) player.unMute();
                        if (player.playVideo) player.playVideo();
                    }
                }, 300);
            } else if (attempts >= maxAttempts) {
                clearInterval(findAndScroll);
                console.warn('[TukTukFeed] Target post not found after timeout');
            }
        }, 500);
    }
    
    // Mark active tab
    const activeTab = document.querySelector(`.tab-btn[data-category="${lastCat}"]`);
    if (activeTab) {
        document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
        activeTab.classList.add('active');
    }
    
    // Auto-post weather (admin only)
    checkAndAutoPostWeather();
});

// ================================================
// WEATHER AUTOMATION (Admin Only)
// ================================================

/**
 * Check and auto-post weather (admin only)
 */
async function checkAndAutoPostWeather() {
    // Admin-only
    if (typeof WizmobizAuth === 'undefined') return;
    
    const user = WizmobizAuth.getUser();
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        return;
    }
    
    console.log('[TukTukFeed] Checking daily weather update...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    try {
        // Check if already posted today
        const snapshot = await db.collection('news_feed')
            .where('authorId', '==', 'system_weather')
            .where('createdAt', '>=', firebase.firestore.Timestamp.fromDate(today))
            .limit(1)
            .get();
        
        if (!snapshot.empty) {
            console.log('[TukTukFeed] Weather already posted today');
            return;
        }
        
        console.log('[TukTukFeed] Generating weather forecast...');
        
        // Fetch weather data
        const coords = { lat: 13.7563, lon: 100.5018 }; // Bangkok
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,rain_sum&timezone=Asia%2FBangkok`
        );
        
        if (!response.ok) throw new Error('Weather API failed');
        
        const data = await response.json();
        if (!data.daily) return;
        
        const daily = data.daily;
        const code = daily.weather_code[0];
        const maxTemp = daily.temperature_2m_max[0];
        const minTemp = daily.temperature_2m_min[0];
        const rain = daily.rain_sum[0] || 0;
        
        // Determine condition
        let condition = 'อากาศแจ่มใส';
        let icon = '☀️';
        if (code > 3) { condition = 'มีเมฆบางส่วน'; icon = '⛅'; }
        if (code > 50) { condition = 'ฝนตก'; icon = '🌧️'; }
        if (code > 80) { condition = 'พายุฝนฟ้าคะนอง'; icon = '⛈️'; }
        
        const dateStr = today.toLocaleDateString('th-TH', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });
        
        const weatherContent = `🌦️ พยากรณ์อากาศประจำวันที่ ${dateStr}\n` +
            `------------------------\n` +
            `${icon} สภาพอากาศ: ${condition}\n` +
            `🌡️ อุณหภูมิ: ${minTemp}°C - ${maxTemp}°C\n` +
            `☔ ปริมาณฝน: ${rain} มม.\n\n` +
            `อัปเดตโดย TukTuk Weather Intelligence System`;
        
        // Post to Firestore
        await db.collection('news_feed').add({
            authorName: 'TukTuk WeatherBot',
            authorId: 'system_weather',
            authorAvatar: 'https://cdn-icons-png.flaticon.com/512/4052/4052984.png',
            title: `พยากรณ์อากาศ ${today.toLocaleDateString('th-TH')}`,
            summary: `สภาพอากาศ: ${condition} (${minTemp}-${maxTemp}°C)`,
            text: weatherContent,
            category: 'weather',
            imageUrl: 'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b',
            pinned: true,
            isVerified: true,
            smartScore: 95,
            impactLevel: 'medium',
            sentiment: 'informative',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('[TukTukFeed] Weather posted successfully');
        
    } catch (error) {
        console.error('[TukTukFeed] Weather automation error:', error);
    }
}

// ================================================
// EXPORTS (Global functions)
// ================================================

// Core functions
// Detail view implementation
window.viewPostDetails = function(postId) {
    const item = (TukTukFeed.currentFeed || []).find(i => i.id === postId);
    if (!item) {
        if (typeof openComments === 'function') openComments(postId);
        return;
    }

    const container = document.getElementById('commentList');
    if (!container) return;

    // Show modal
    if (window.commentModal) window.commentModal.show();

    // Inject full content at the top
    const isNews = item.type === 'news';
    const detailHtml = `
        <div class="post-detail-view ${isNews ? 'news-detail-view' : ''}">
            <div style="display:flex; align-items:center; gap:12px; margin-bottom:18px;">
                <img src="${item.authorAvatar || 'assets/images/logo.png'}" 
                     style="width:44px; height:44px; border-radius:12px; border:2px solid rgba(255,255,255,0.15); object-fit:cover;"
                     onerror="this.src='assets/images/logo.png'">
                <div>
                    <div style="color:#fff; font-weight:700; font-size:1rem;">${escapeHtml(item.displayAuthor || 'TukTuk Member')}</div>
                    <div style="color:rgba(255,255,255,0.5); font-size:0.75rem;">${item.createdAt ? formatTimeAgo(item.createdAt) : 'เมื่อสักครู่'}</div>
                </div>
                ${isNews ? `<div style="margin-left:auto; background:rgba(16,185,129,0.1); color:#10b981; padding:4px 10px; border-radius:8px; font-size:0.7rem; font-weight:700; border:1px solid rgba(16,185,129,0.2);">ข่าวสาร</div>` : ''}
            </div>
            
            ${(isNews && item.displayImage && !item.displayImage.includes('logo.png')) ? `
                <div style="margin-bottom:20px; border-radius:16px; overflow:hidden; border:1px solid rgba(255,255,255,0.1); max-height:300px;">
                    <img src="${item.displayImage}" style="width:100%; height:auto; display:block;" onerror="this.style.display='none'">
                </div>
            ` : ''}

            <h2 class="post-detail-title" style="${isNews ? 'color:#10b981; font-size:1.5rem;' : ''}">${escapeHtml(item.displayTitle || '')}</h2>
            <div class="post-detail-desc">${escapeHtml(item.displayDesc || '')}</div>
        </div>
        <div id="loadingCommentsPlaceholder" class="text-center py-4">
            <div class="spinner-border spinner-border-sm text-danger" style="width:1.2rem;height:1.2rem;"></div>
            <div style="font-size:0.75rem;color:rgba(255,255,255,0.4);margin-top:8px;">กำลังโหลดความคิดเห็น...</div>
        </div>
    `;

    container.innerHTML = detailHtml;

    // Fetch comments but don't clear the container
    const commentsLimit = 20;
    const collection = isNews ? 'news_feed' : 'community_posts';
    db.collection(collection).doc(postId)
        .collection('comments')
        .orderBy('createdAt', 'desc')
        .limit(commentsLimit)
        .get()
        .then(snapshot => {
            const placeholder = document.getElementById('loadingCommentsPlaceholder');
            if (placeholder) placeholder.remove();

            const comments = [];
            snapshot.forEach(doc => comments.push({ id: doc.id, ...doc.data() }));

            const titleEl = document.getElementById('commentCountTitle');
            const isNews = item.type === 'news';
            if (titleEl) {
                if (isNews) {
                    titleEl.textContent = `รายละเอียดข่าว (${comments.length} ความคิดเห็น)`;
                } else {
                    titleEl.textContent = `ความคิดเห็น (${comments.length}${snapshot.size >= commentsLimit ? '+' : ''})`;
                }
            }

            if (comments.length === 0) {
                const emptyMsg = document.createElement('div');
                emptyMsg.className = 'text-center text-muted py-5';
                emptyMsg.style.fontSize = '0.9rem';
                emptyMsg.textContent = 'ยังไม่มีความคิดเห็น มาร่วมเป็นคนแรกที่แสดงความเห็น!';
                container.appendChild(emptyMsg);
                return;
            }

            comments.forEach(c => {
                const time = c.createdAt ? new Date(c.createdAt.toDate()).toLocaleString('th-TH') : 'เมื่อสักครู่';
                const commentEl = document.createElement('div');
                commentEl.className = 'comment-item';
                commentEl.innerHTML = `
                    <img src="${c.userAvatar || 'assets/images/logo.png'}" class="comment-avatar" onerror="this.src='assets/images/logo.png'">
                    <div class="comment-body">
                        <div class="comment-user">
                            ${escapeHtml(c.userName || 'ผู้ใช้งาน')}
                            <span class="comment-reply-btn" onclick="replyTo('${escapeHtml(c.userName)}')">ตอบกลับ</span>
                        </div>
                        <div class="comment-text">${escapeHtml(c.text)}</div>
                        <div class="comment-time">${time}</div>
                    </div>
                `;
                container.appendChild(commentEl);
            });
        })
        .catch(err => {
            console.warn('[TukTukFeed] Error loading comments for detail view:', err);
            const placeholder = document.getElementById('loadingCommentsPlaceholder');
            if (placeholder) placeholder.innerHTML = '<div class="text-danger small">ไม่สามารถโหลดความคิดเห็นได้</div>';
        });
};

window.initTukTukFeed = initTukTukFeed;
window.loadMixedFeed = loadMixedFeed;
window.appendMoreFeedItems = appendMoreFeedItems;
window.renderTukTukSlides = renderTukTukSlides;
window.createPCGridCard = createPCGridCard;
window.renderGrid = renderGrid;

// --- Global pauseAll helper สำหรับ TukTukFeedCoordinator ---
// coordinator จะเรียก window._pauseAllTukTukVideos() เมื่อ engine อื่นเริ่มทำงาน
// หรือเมื่อมีการเปิด overlay/modal ทับ
window._pauseAllTukTukVideos = function () {
    // 1. HTML5 video ทั้งหมดใน feed container
    document.querySelectorAll('#tuktukFeed video, #tuktukFeedNearMe video, .tuktuk-video-item video').forEach(function (v) {
        try { if (!v.paused) v.pause(); } catch (_) {}
    });
    // 2. YouTube iframes ใน feed container
    document.querySelectorAll('#tuktukFeed iframe[src*="youtube.com"], #tuktukFeedNearMe iframe[src*="youtube.com"]').forEach(function (frame) {
        try {
            frame.contentWindow?.postMessage(
                JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }),
                'https://www.youtube.com'
            );
        } catch (_) {}
    });
};

// Province picker
window.showProvincePicker = window.showProvincePicker || showProvincePicker;
window.selectProvince = window.selectProvince || selectProvince;
window.useCurrentLocation = window.useCurrentLocation || useCurrentLocation;

// Utilities
window.getUserLocation = getUserLocation;
window.calculateDistance = calculateDistance;
window.normalizeFeedItem = normalizeFeedItem;

/**
 * Clear ALL in-memory feed caches so the next load always hits Firestore.
 * Called by pull-to-refresh and the manual "ล้างแคช" drawer button.
 */
window.clearFeedCache = function() {
    // 1. TukTukFeed in-memory cache (tuktuk_feed_logic.js)
    TukTukFeed.feedCache       = {};
    TukTukFeed.cacheTimestamps = {};

    // 2. FeedRenderer in-memory cache (feed-renderer.js)
    if (window.FeedRenderer) {
        window.FeedRenderer.feedCache       = {};
        window.FeedRenderer.cacheTimestamps = {};
    }

    // 3. Author info cache (feed-renderer.js local Map, cleared via exposed handle)
    if (typeof window._clearAuthorCache === 'function') {
        window._clearAuthorCache();
    }

    // 4. Community feed cache (community_feed_integration.js may hold snapshot data)
    if (window._communityFeedCache) window._communityFeedCache = null;

    // 5. sessionStorage feed items
    try {
        Object.keys(sessionStorage)
            .filter(k => k.startsWith('tuktuk_') || k.startsWith('feed_'))
            .forEach(k => sessionStorage.removeItem(k));
    } catch (_) {}

    console.log('[clearFeedCache] All feed caches cleared');
};

/**
 * Like post logic
 */
window.likePost = async function(postId) {
    if (!postId) return;
    if (typeof triggerHaptic === 'function') triggerHaptic(15);
    else if (window.PWA?.haptic) window.PWA.haptic(15);

    const btn = document.querySelector(`.like-btn-${postId}`);
    if (!btn) return;

    const icon = btn.querySelector('.action-icon');
    const span = btn.querySelector('.action-text');
    const wasLiked = btn.classList.contains('liked');
    const prevCount = parseInt((span?.textContent || '0').replace(/,/g, '')) || 0;

    // Optimistic UI update (instant, matches Flutter optimistic like)
    btn.classList.toggle('liked');
    if (!wasLiked) {
        if (icon) { icon.classList.add('fas'); icon.classList.remove('far'); icon.style.color = '#ff0050'; }
        if (span) span.textContent = (prevCount + 1).toLocaleString();
    } else {
        if (icon) { icon.style.color = ''; }
        if (span) span.textContent = Math.max(0, prevCount - 1).toLocaleString();
    }

    // Backend update with rollback on failure
    if (typeof db !== 'undefined') {
        const collection = btn.dataset.origin || 'community_posts';
        const delta = wasLiked ? -1 : 1;
        try {
            await db.collection(collection).doc(postId).update({
                likes: firebase.firestore.FieldValue.increment(delta)
            });

            // Track in user_likes if authenticated
            const user = typeof WizmobizAuth !== 'undefined' ? WizmobizAuth.getUser() : null;
            if (user) {
                const arrayOp = !wasLiked
                    ? firebase.firestore.FieldValue.arrayUnion(postId)
                    : firebase.firestore.FieldValue.arrayRemove(postId);
                db.collection('user_likes').doc(user.uid).set({
                    postIds: arrayOp,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true }).catch(() => {});
            }
        } catch (err) {
            // Rollback on failure
            btn.classList.toggle('liked');
            if (icon) icon.style.color = wasLiked ? '#ff0050' : '';
            if (span) span.textContent = prevCount.toLocaleString();
            showFeedToast('เกิดข้อผิดพลาด ลองใหม่', 'error');
        }
    }
};

/**
 * Open options menu
 */
// Using global showActionSheet and openOptions from ui-helpers.js

/**
 * Follow user (Real implementation)
 */
window.followUser = async function(userId) {
    if (!userId) return;
    if (window.PWA?.haptic) window.PWA.haptic(30);
    
    // Check if handleFollow (from feed-renderer.js) is available
    if (typeof handleFollow === 'function') {
        const btn = document.querySelector(`.follow-plus-badge`); // Simple selector for current view
        await handleFollow(btn, userId);
    } else {
        // Fallback local logic
        showFeedToast('ติดตามแล้ว', 'success');
        if (typeof db !== 'undefined') {
            const user = typeof WizmobizAuth !== 'undefined' ? WizmobizAuth.getUser() : null;
            if (user) {
                db.collection('users').doc(user.uid).update({
                    following: firebase.firestore.FieldValue.arrayUnion(userId),
                    followingCount: firebase.firestore.FieldValue.increment(1)
                }).catch(() => {});
            }
        }
    }
};

/**
 * Save/Bookmark post
 */
window.savePost = function(postId) {
    if (window.PWA?.haptic) window.PWA.haptic(20);
    showFeedToast('บันทึกแล้ว', 'success');
    
    // Toggle icon state visually
    const btns = document.querySelectorAll(`[onclick*="savePost('${postId}')"]`);
    btns.forEach(btn => {
        const icon = btn.querySelector('.fa-bookmark');
        if (icon) {
            icon.classList.toggle('fas');
            icon.classList.toggle('far');
            icon.style.color = icon.classList.contains('fas') ? '#facc15' : 'white';
        }
    });

    if (typeof db !== 'undefined') {
        const user = typeof WizmobizAuth !== 'undefined' ? WizmobizAuth.getUser() : null;
        if (user) {
            db.collection('user_bookmarks').doc(user.uid).set({
                postIds: firebase.firestore.FieldValue.arrayUnion(postId),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true }).catch(() => {});
        }
    }
};

/**
 * Sidebar hide timer
 */
window.startSidebarTimer = function(slideId) {
    window.clearSidebarTimer(slideId);
    
    const slide = document.getElementById(slideId);
    if (!slide) return;
    
    const sidebar = slide.querySelector('.right-sidebar');
    if (!sidebar) return;
    
    TukTukFeed.sidebarHideTimers[slideId] = setTimeout(() => {
        sidebar.classList.add('actions-hidden');
    }, 8000); // 8 seconds professional standard
};

window.clearSidebarTimer = function(slideId) {
    if (TukTukFeed.sidebarHideTimers[slideId]) {
        clearTimeout(TukTukFeed.sidebarHideTimers[slideId]);
        delete TukTukFeed.sidebarHideTimers[slideId];
    }
};

// Debug
window.TukTukFeed = TukTukFeed;

/**
 * Render Idea Lab (Brain) specialized card
 */
function renderIdeaLabCard(item) {
    const slide = document.createElement('div');
    slide.className = 'tuktuk-video-item idea-lab-card';
    slide.setAttribute('data-id', item.id);
    
    slide.innerHTML = `
        <div class="idea-lab-gradient-bg"></div>
        <div class="idea-lab-content">
            <div class="brain-icon-wrapper">
                <div class="brain-pulse"></div>
                <!-- Generic brain SVG for high-tech look -->
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.5 2C7.57 2 6 3.57 6 5.5C6 6.09 6.15 6.64 6.42 7.12C5.12 7.84 4.25 9.24 4.25 10.84C4.25 12.21 4.88 13.43 5.86 14.23C5.59 14.71 5.44 15.26 5.44 15.84C5.44 17.77 7.01 19.34 8.94 19.34C9.53 19.34 10.08 19.19 10.56 18.92C11.16 20.73 12.87 22.06 14.88 22.06C17.09 22.06 18.88 20.27 18.88 18.06C18.88 17.5 18.77 16.97 18.56 16.48C19.75 15.68 20.53 14.36 20.53 12.84C20.53 11.33 19.75 10.01 18.56 9.21C18.77 8.72 18.88 8.19 18.88 7.63C18.88 5.42 17.09 3.63 14.88 3.63C14.32 3.63 13.79 3.74 13.3 3.95C12.5 2.76 11.18 1.98 9.66 1.98L9.5 2Z" fill="white"/>
                </svg>
            </div>
            <h2 class="idea-lab-title">${item.displayTitle}</h2>
            <p class="idea-lab-desc">${item.displayDesc}</p>
            <button class="idea-lab-cta" onclick="window.location.href='idea_lab.html'">
                <span>เริ่มต้นการสร้างสรรค์</span>
                <i class="fas fa-arrow-right"></i>
            </button>
        </div>
        <div class="right-sidebar">
             <div class="action-btn" onclick="sharePost('${item.id}')">
                <div class="action-icon-wrapper">
                    <i class="fas fa-share action-icon"></i>
                </div>
                <span class="action-text">แชร์</span>
            </div>
        </div>
    `;
    return slide;
}

/**
 * Render Rider Profile specialized card (Visible to Customers)
 */
function renderRiderProfileCard(item) {
    const slide = document.createElement('div');
    slide.className = 'tuktuk-video-item rider-profile-card';
    slide.setAttribute('data-id', item.id);
    
    slide.innerHTML = `
        <div class="rider-bg-blur" style="background-image: url('${item.authorAvatar}')"></div>
        <div class="rider-card-content">
            <div class="rider-info-main">
                <img src="${item.authorAvatar}" class="rider-avatar">
                <div class="rider-status-badge ${item.isOnline ? 'online' : 'offline'}">
                    ${item.isOnline ? 'พร้อมให้บริการ' : 'ไม่ว่าง'}
                </div>
                <h3 class="rider-name">${item.displayAuthor || 'พีวินตุ๊กตุ๊ก'}</h3>
                <div class="rider-stats">
                    <span><i class="fas fa-star"></i> ${item.rating || '5.0'}</span>
                    <span><i class="fas fa-motorcycle"></i> ${item.vehicleType || 'มอเตอร์ไซค์'}</span>
                </div>
            </div>
            <div class="rider-actions">
                <button class="call-rider-btn" onclick="window.location.href='tel:${item.phone || '#'}'">
                    <i class="fas fa-phone-alt"></i> โทรหา
                </button>
                <button class="chat-rider-btn" onclick="openChatWithRider('${item.authorId}')">
                    <i class="fas fa-comment"></i> เลือกไปกับพี่วิน
                </button>
            </div>
        </div>
    `;
    return slide;
}

/**
 * Render Rider Job specialized card (Visible to Riders)
 */
function renderRiderJobCard(item) {
    const slide = document.createElement('div');
    slide.className = 'tuktuk-video-item rider-job-card';
    slide.setAttribute('data-id', item.id);
    
    slide.innerHTML = `
        <div class="job-status-indicator">🔔 งานใหม่ใกล้ตัวคุณ</div>
        <div class="job-card-content">
            <div class="job-header">
                <div class="job-type-icon"><i class="fas fa-box-open"></i></div>
                <div class="job-price">฿${item.price || '45'}</div>
            </div>
            <div class="job-details">
                <div class="job-location">
                    <div class="loc-point start">
                        <i class="fas fa-circle"></i> <span>${item.startPoint || 'จุดรับของ'}</span>
                    </div>
                    <div class="loc-line"></div>
                    <div class="loc-point end">
                        <i class="fas fa-map-marker-alt"></i> <span>${item.endPoint || 'จุดส่งของ'}</span>
                    </div>
                </div>
                <div class="job-distance-info">
                    ระยะทางประมาณ: <strong>${((item.distance || 0) / 1000).toFixed(1)} กม.</strong>
                </div>
            </div>
            <button class="accept-job-btn" onclick="acceptRiderJob('${item.id}')">
                <span>กดรับงานนิ้</span>
                <div class="btn-shimmer"></div>
            </button>
        </div>
    `;
    return slide;
}

/**
 * Render Featured Seller specialized card (Matches Flutter FeaturedSellerCard)
 */
function renderFeaturedSellerCard(item) {
    const slide = document.createElement('div');
    slide.className = 'tuktuk-video-item featured-seller-card';
    slide.setAttribute('data-id', item.id);
    
    slide.innerHTML = `
        <div class="featured-bg" style="background-image: url('${item.image}')"></div>
        <div class="featured-gradient"></div>
        
        <div class="featured-banner">
            <i class="fas fa-store"></i>
            <span>✨ ร้านค้าแนะนำ</span>
        </div>
        
        <div class="featured-content">
            <div class="featured-shop-tag">🏪 ${item.shopName}</div>
            <h2 class="featured-product-title">${item.productName}</h2>
            ${item.price ? `<div class="featured-price-tag">฿${item.price}</div>` : ''}
            
            <div class="featured-actions">
                <button class="featured-buy-btn" onclick="window.location.href='product_detail.html?id=${item.productId}'">
                    🛍️ ดูสินค้า
                </button>
                <button class="featured-profile-btn" onclick="window.location.href='channel.html?userId=${item.authorId}'">
                    <i class="fas fa-user-circle"></i>
                </button>
            </div>
        </div>
        
        <div class="right-sidebar">
                <!-- 1. More Options -->
                <div class="action-btn" onclick="event.stopPropagation(); window.openOptions('${item.id}')">
                    <div class="action-icon-wrapper" style="height: 18px;">
                        <i class="fas fa-ellipsis-h" style="font-size: 0.7rem; opacity: 0.7;"></i>
                    </div>
                </div>

                <!-- 2. Follow -->
                <div class="action-btn" onclick="event.stopPropagation(); window.followUser('${item.authorId}')">
                    <div class="action-icon-wrapper">
                        <i class="fas fa-plus action-icon"></i>
                    </div>
                </div>

                <!-- 3. Share -->
                <div class="action-btn" onclick="event.stopPropagation(); window.sharePost('${item.id}', '${(item.productName || '').replace(/'/g, "\\'")}')">
                    <div class="action-icon-wrapper">
                        <i class="fas fa-share action-icon"></i>
                    </div>
                    <span class="action-text">แชร์</span>
                </div>
        </div>
    `;
    return slide;
}

function openChatWithRider(userId) {
    if (typeof openInChat === 'function') openInChat(userId);
    else showFeedToast('เข้าสู่ระบบเพื่อเริ่มแชท', 'info');
}

function acceptRiderJob(jobId) {
    if (window.PWA?.haptic) window.PWA.haptic(50);
    showFeedToast('รับงานสำเร็จ! กำลังติดต่อผู้ใช้...', 'success');
}