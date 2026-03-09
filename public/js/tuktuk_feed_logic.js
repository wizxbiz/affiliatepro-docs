// db is initialized globally in index.html or community_feed_integration.js
if (typeof db === 'undefined') {
    var db = firebase.firestore();
}

// 🚀 SMART STATE CACHE (Preserved across tab switches & back navigation)
window.globalFeedDataCache = window.globalFeedDataCache || {};
window.lastSelectedCategory = sessionStorage.getItem('tuktuk_last_category') || 'all';

document.addEventListener('DOMContentLoaded', function () {
    // Restore previous category if exists (Check URL params first then session storage)
    const urlParams = new URLSearchParams(window.location.search);
    const catParam = urlParams.get('category');
    const lastCat = catParam || window.lastSelectedCategory;

    window.currentCategory = lastCat; // Sycnc current state
    initTukTukFeed(lastCat);
    setupTabNavigation();

    // Mark active tab in UI
    const activeTab = document.querySelector(`.tab-btn[data-category="${lastCat}"]`);
    if (activeTab) {
        document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
        activeTab.classList.add('active');
    }

    checkAndAutoPostWeather();
});

let currentFeed = [];
let feedUnsubscribe = null;

// Distance Helper (Haversine Formula)
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

// User Location Cache
let cachedUserLoc = null;
async function fetchUserLocation() {
    if (cachedUserLoc) return cachedUserLoc;
    return new Promise((resolve) => {
        if (!navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                cachedUserLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                resolve(cachedUserLoc);
            },
            () => resolve(null),
            { timeout: 8000 }
        );
    });
}

function initTukTukFeed(category = 'all') {
    const feedContainer = document.getElementById('tuktukFeed');
    if (!feedContainer) return;

    // Clear existing real-time listener if any
    if (window.feedUnsubscribe) {
        window.feedUnsubscribe();
        window.feedUnsubscribe = null;
    }
    // Clean up community listeners if switching away
    if (window.commentsUnsubscribe) {
        window.commentsUnsubscribe();
        window.commentsUnsubscribe = null;
    }

    // Activate Feed Mode Styles (CSS)
    document.body.classList.add('feed-mode-active');

    // Toggle Grid Mode for Near Me (Responsive Powerful Layout)
    const bottomNav = document.getElementById('bottomNav');
    if (category === 'near_me') {
        feedContainer.classList.add('feed-grid-mode');
        feedContainer.classList.remove('feed-community-mode');
        if (bottomNav) bottomNav.classList.remove('community-active');
    } else if (category === 'community') {
        feedContainer.classList.remove('feed-grid-mode');
        feedContainer.classList.add('feed-community-mode');
        if (bottomNav) bottomNav.classList.add('community-active');
    } else {
        feedContainer.classList.remove('feed-grid-mode');
        feedContainer.classList.remove('feed-community-mode');
        if (bottomNav) bottomNav.classList.remove('community-active');
    }

    if (category === 'community') {
        initCommunityFeed(feedContainer);
        return;
    }

    // Unified Feed Loader
    if (category === 'near_me' || category === 'all') {
        loadMixedFeed(feedContainer, category);
        return;
    }

    // Default Fallback (should not be reached with current UI)
    loadMixedFeed(feedContainer, 'all');
}

async function loadMixedFeed(container, mode, forceRefresh = false) {
    console.log(`🚀 Starting loadMixedFeed (Mode: ${mode}, Force: ${forceRefresh})...`);

    // 0. Cache Check
    if (!forceRefresh && window.globalFeedDataCache[mode] && window.globalFeedDataCache[mode].length > 0) {
        console.log(`💎 Cache Hit for ${mode}`);
        renderGrid(container, window.globalFeedDataCache[mode]);
        return;
    }

    // 1. Get Location (only imperative for near_me)
    let loc = null;
    if (mode === 'near_me') {
        try {
            loc = await fetchUserLocation();
        } catch (e) {
            console.warn("Location fetch failed:", e);
        }
    }

    // 2. Prepare UI
    let headerHtml = '';
    if (mode === 'near_me') {
        headerHtml = `
            <div class="near-me-header" style="grid-column: 1/-1; margin-bottom: 10px; padding: 0 5px;">
                 <div class="search-wrapper" style="position: relative;">
                    <i class="fas fa-search" style="position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: #aaa;"></i>
                    <input type="text" id="feedSearch" placeholder="ค้นหาใกล้ฉัน..." 
                           style="width: 100%; padding: 12px 12px 12px 45px; border-radius: 50px; border: 1px solid rgba(255,255,255,0.2); background: rgba(30,30,30,0.8); color: white; backdrop-filter: blur(10px); outline: none;">
                 </div>
                 ${!loc ? '<div style="margin-top: 10px; font-size: 0.85rem; color: #cbd5e1; display: flex; align-items: center; gap: 6px;"><i class="fas fa-globe-asia"></i> <span>ไม่พบตำแหน่ง - แสดงข้อมูลทั้งหมด</span></div>' : ''}
            </div>
        `;
    }

    container.innerHTML = `
        ${headerHtml}
        <div id="feedLoading" style="grid-column: 1/-1; text-align: center; padding: 40px; color: white;">
            <i class="fas ${mode === 'near_me' ? 'fa-location-arrow' : 'fa-magic'} fa-spin fa-2x"></i>
            <p style="margin-top: 15px;">${mode === 'near_me' ? 'กำลังค้นหาเนื้อหาใกล้คุณ...' : 'กำลังคัดสรรเนื้อหาสำหรับคุณ...'}</p>
        </div>
    `;

    try {
        // 3. Parallel Fetching (Posts, News, Products)
        // INCREASED LIMITS for interleaving logic
        const [postsSnap, newsSnap, productsSnap] = await Promise.all([
            db.collection('community_posts').orderBy('createdAt', 'desc').limit(50).get(),
            db.collection('news_feed').orderBy('createdAt', 'desc').limit(50).get(),
            db.collection('marketplace_items').where('status', '==', 'active').limit(50).get()
        ]);

        let productItems = [];
        let infoItems = []; // News + Posts

        // Helper to normalize item structure
        const normalizeItem = (doc, type) => {
            const item = doc.data();
            item.id = doc.id;
            item.type = type;

            // Coordinate Parsing logic
            let pLat = NaN, pLng = NaN;
            const coordsSource = item.locationCoords || item.coords || item.location || item.gps || item.location_coords;
            if (coordsSource) {
                if (typeof coordsSource === 'string' && coordsSource.includes(',')) {
                    const parts = coordsSource.split(',');
                    pLat = parseFloat(parts[0].trim());
                    pLng = parseFloat(parts[1].trim());
                } else if (coordsSource.latitude && coordsSource.longitude) {
                    pLat = coordsSource.latitude;
                    pLng = coordsSource.longitude;
                }
            }

            let dist = Infinity;
            if (loc && !isNaN(pLat) && !isNaN(pLng)) {
                dist = getDistance(loc.lat, loc.lng, pLat, pLng);
            }

            // Image / Video Logic — supports R2 objects { url, type, thumbnailUrl }
            let image = 'assets/images/logo.png';
            let videoUrl = item.videoUrl || item.video_url || null;
            let thumbUrl = null;

            if (item.images && item.images.length > 0) {
                // Find video entry first
                const vidEntry = item.images.find(m => {
                    if (typeof m === 'object' && m.type === 'video') return true;
                    const u = (typeof m === 'string' ? m : m.url || '').toLowerCase();
                    return u.endsWith('.mp4') || u.endsWith('.mov') || u.endsWith('.webm');
                });
                if (vidEntry) {
                    videoUrl = videoUrl || (typeof vidEntry === 'string' ? vidEntry : vidEntry.url);
                    thumbUrl = (typeof vidEntry === 'object' && vidEntry.thumbnailUrl) || null;
                }
                // Pick first non-video image for thumbnail/poster
                const imgEntry = item.images.find(m => {
                    if (typeof m === 'object' && m.type === 'video') return false;
                    const u = (typeof m === 'string' ? m : m.url || '').toLowerCase();
                    return !u.endsWith('.mp4') && !u.endsWith('.mov') && !u.endsWith('.webm');
                });
                if (imgEntry) {
                    image = typeof imgEntry === 'string' ? imgEntry : (imgEntry.url || imgEntry.thumb || image);
                } else if (thumbUrl) {
                    image = thumbUrl; // use video thumbnail as displayImage
                }
            } else if (item.imageUrl) image = item.imageUrl;
            else if (item.image) image = item.image;

            if (!videoUrl && typeof image === 'string' &&
                (image.endsWith('.mp4') || image.endsWith('.mov') || image.endsWith('.webm'))) {
                videoUrl = image;
                image = 'assets/images/logo.png';
            }

            const title = item.title || item.name || item.topic || 'ไม่มีหัวข้อ';
            const desc = item.content || item.description || item.detail || '';
            const author = item.authorName || item.sellerName || item.source || 'TukTuk Member';

            return {
                ...item,
                pLat, pLng,
                distance: dist,
                displayVideo: videoUrl || undefined,
                displayImage: image,
                displayTitle: title,
                displayDesc: desc,
                displayAuthor: author,
                displayPrice: item.price ? `฿${parseInt(item.price).toLocaleString()}` : null
            };
        };

        // Process Collections
        const radiusLimit = 200; // Radius in KM

        postsSnap.forEach(doc => {
            const item = normalizeItem(doc, 'post');
            if (mode !== 'near_me' || !loc || item.distance <= radiusLimit) infoItems.push(item);
        });
        newsSnap.forEach(doc => {
            const item = normalizeItem(doc, 'news');
            // News is usually global, but if near_me mode and it has location, filter it
            if (mode !== 'near_me' || !loc || item.distance === Infinity || item.distance <= radiusLimit) infoItems.push(item);
        });
        productsSnap.forEach(doc => {
            const item = normalizeItem(doc, 'product');
            if (mode !== 'near_me' || !loc || item.distance <= radiusLimit) productItems.push(item);
        });

        console.log(`📍 Fetched (Mode: ${mode}): ${productItems.length} Products, ${infoItems.length} Content Items.`);

        // Sort items
        const sortFn = (a, b) => {
            if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
            if (mode === 'near_me' && loc && a.distance !== undefined && b.distance !== undefined) {
                if (Math.abs(a.distance - b.distance) > 5) return a.distance - b.distance; // Prioritize distance significantly
            }
            const dateA = a.createdAt ? (a.createdAt.seconds || 0) : 0;
            const dateB = b.createdAt ? (b.createdAt.seconds || 0) : 0;
            return dateB - dateA;
        };

        productItems.sort(sortFn);
        infoItems.sort(sortFn);

        // Interleave Strategy
        // For You: More balanced mix (e.g. 2 posts, 1 product)
        // Near Me: More products (e.g. 1 post, 2 products)
        let displayItems = [];
        let pIndex = 0;
        let iIndex = 0;

        const pRate = mode === 'near_me' ? 2 : 1;
        const iRate = mode === 'near_me' ? 1 : 3;

        while (pIndex < productItems.length || iIndex < infoItems.length) {
            for (let i = 0; i < iRate && iIndex < infoItems.length; i++) displayItems.push(infoItems[iIndex++]);
            for (let i = 0; i < pRate && pIndex < productItems.length; i++) displayItems.push(productItems[pIndex++]);
        }

        // Cache for searching & Tab switching
        window.nearMeItemsCache = displayItems;
        window.globalFeedDataCache[mode] = displayItems;

        renderGrid(container, displayItems);

        // Setup Search Listener
        const searchInput = document.getElementById('feedSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                const filtered = window.nearMeItemsCache.filter(item =>
                    (item.displayTitle && item.displayTitle.toLowerCase().includes(term)) ||
                    (item.displayDesc && item.displayDesc.toLowerCase().includes(term)) ||
                    (item.displayAuthor && item.displayAuthor.toLowerCase().includes(term))
                );
                renderGrid(container, filtered, false);
            });
        }

    } catch (err) {
        console.error("❌ Feed Load Error:", err);
        const loader = document.getElementById('feedLoading');
        if (loader) {
            loader.innerHTML = `
                <div style="padding: 20px;">
                    <i class="fas fa-exclamation-triangle fa-2x text-warning mb-3"></i><br>
                    โหลดข้อมูลไม่สำเร็จ (${err.message})<br>
                    <button onclick="initTukTukFeed('${mode}')" class="btn btn-sm btn-outline-light mt-3">ลองใหม่</button>
                </div>
            `;
        }
    }
}

function renderGrid(container, items, renderHeader = true) {
    const loader = document.getElementById('feedLoading');
    if (loader) loader.remove();

    // Clear old items (keep header)
    const existingItems = container.querySelectorAll('.tuktuk-grid-card, .no-results-msg, .pc-post-social-card');
    existingItems.forEach(el => el.remove());

    if (items.length === 0) {
        const div = document.createElement('div');
        div.className = 'no-results-msg';
        div.style.gridColumn = '1/-1';
        div.style.textAlign = 'center';
        div.style.padding = '40px';
        div.style.color = '#aaa';
        div.innerHTML = `<i class="fas fa-search fa-3x mb-3"></i><br>ไม่พบข้อมูล`;
        container.appendChild(div);
        return;
    }

    const isPC = window.innerWidth >= 992;

    items.forEach(item => {
        if (isPC) {
            container.appendChild(createPCGridCard(item));
        } else {
            container.appendChild(createNearMeGridCard(item));
        }
    });

    // On PC, ensure the container itself has proper layout if needed
    if (isPC) {
        container.style.display = 'block'; // List view on PC
    } else if (container.id === 'tuktukFeed' && window.currentCategory === 'near_me') {
        container.style.display = 'grid'; // Grid view on Mobile Near Me
    }
}

// 🌐 Professional PC Social Card Renderer (Facebook Style)
function createPCGridCard(item) {
    const div = document.createElement('div');
    div.className = 'pc-post-social-card animate__animated animate__fadeIn';
    div.id = `pc-post-${item.id}`;

    const timestamp = item.createdAt ? new Date(item.createdAt.seconds * 1000) : new Date();
    const timeStr = timestamp.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });

    // Category Color & Icon
    let catIcon = 'fa-file-alt';
    let catColor = '#2e89ff';
    if (item.type === 'product') { catIcon = 'fa-shopping-bag'; catColor = '#facc15'; }
    if (item.type === 'news') { catIcon = 'fa-newspaper'; catColor = '#10b981'; }

    const html = `
        <div class="pc-post-header">
            <img src="${item.authorAvatar || 'assets/images/logo.png'}" class="pc-post-author-img">
            <div class="pc-post-meta">
                <span class="pc-post-author-name">${item.displayAuthor || 'สมาชิก TukTuk'}</span>
                <div class="pc-post-time">
                    <span>${timeStr}</span> • <i class="fas ${item.distance !== Infinity ? 'fa-location-arrow' : 'fa-globe-asia'}"></i> 
                    ${item.distance !== Infinity ? `<span>${item.distance.toFixed(1)} km</span>` : ''}
                    <span class="badge" style="background: ${catColor}20; color: ${catColor}; margin-left: 8px; font-size: 0.65rem;">
                        <i class="fas ${catIcon} me-1"></i> ${item.type.toUpperCase()}
                    </span>
                </div>
            </div>
            <div class="pc-post-options">
                <i class="fas fa-ellipsis-h" style="color: #b0b3b8; cursor: pointer;"></i>
            </div>
        </div>
        
        <div class="pc-post-content">
            <div style="font-weight: 700; font-size: 1.1rem; margin-bottom: 8px;">${item.displayTitle}</div>
            <div style="color: #e4e6eb; opacity: 0.9;">${item.displayDesc}</div>
        </div>

        ${(item.displayVideo || item.displayImage) ? `
        <div class="pc-post-media-container" onclick="${item.type === 'product' ? `window.location.href='product.html?id=${item.id}'` : (item.displayVideo ? '' : `showNewsDetail('${item.id}')`)}" style="position: relative;">
            ${item.displayVideo ? `
                <video src="${item.displayVideo}" poster="${item.displayImage || ''}" controls muted loop playsinline style="width:100%; max-height:500px; border-radius:8px; background:#000;"></video>
            ` : `
                <img src="${item.displayImage}" onerror="this.src='assets/images/logo.png'">
            `}
            ${item.displayPrice ? `
                <div style="position: absolute; bottom: 15px; right: 15px; background: #2e89ff; color: white; padding: 6px 15px; border-radius: 8px; font-weight: 800; box-shadow: 0 4px 15px rgba(0,0,0,0.4);">
                    ${item.displayPrice}
                </div>
            ` : ''}
        </div>` : ''}

        <div class="pc-post-actions-summary">
            <div class="likes-count">
                <i class="fas fa-thumbs-up" style="color: #2e89ff; font-size: 0.8rem;"></i>
                <span>${Math.floor(Math.random() * 20) + 1}</span>
            </div>
            <div class="comments-shares">
                <span>${Math.floor(Math.random() * 10)} ความคิดเห็น</span> • <span>${Math.floor(Math.random() * 5)} แชร์</span>
            </div>
        </div>

        <div class="pc-post-interaction-btns">
            <div class="pc-post-btn" onclick="this.classList.toggle('active')">
                <i class="far fa-thumbs-up"></i> <span>ถูกใจ</span>
            </div>
            <div class="pc-post-btn" onclick="${item.type === 'product' ? `window.location.href='product.html?id=${item.id}'` : `showNewsDetail('${item.id}')`}">
                <i class="far fa-comment"></i> <span>แสดงความเห็น</span>
            </div>
            <div class="pc-post-btn" onclick="${item.type === 'product' ? `TukTukNotify.shareProduct({id: '${item.id}', productName: '${item.displayTitle}'})` : `TukTukNotify.sharePost({id: '${item.id}', text: '${item.displayTitle}'})`}">
                <i class="fas fa-share"></i> <span>แชร์</span>
            </div>
        </div>
    `;
    div.innerHTML = html;
    return div;
}

async function loadNearMeFeed(container) {
    console.log("📍 Starting loadNearMeFeed...");

    // 1. Get Location (with timeout fallback)
    let loc = null;
    try {
        loc = await fetchUserLocation();
    } catch (e) {
        console.warn("Location fetch failed:", e);
    }
    console.log("📍 User Location:", loc);

    // 2. Prepare UI with Search Bar
    container.innerHTML = `
        <div class="near-me-header" style="grid-column: 1/-1; margin-bottom: 10px; padding: 0 5px;">
             <div class="search-wrapper" style="position: relative;">
                <i class="fas fa-search" style="position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: #aaa;"></i>
                <input type="text" id="nearMeSearch" placeholder="ค้นหาข่าว, สินค้า, หรือโพสต์..." 
                       style="width: 100%; padding: 12px 12px 12px 45px; border-radius: 50px; border: 1px solid rgba(255,255,255,0.2); background: rgba(30,30,30,0.8); color: white; backdrop-filter: blur(10px); outline: none;">
             </div>
             ${!loc ? '<div style="margin-top: 10px; font-size: 0.85rem; color: #cbd5e1; display: flex; align-items: center; gap: 6px;"><i class="fas fa-globe-asia"></i> <span>ไม่พบตำแหน่ง - แสดงข้อมูลทั้งหมดในตลาด</span></div>' : ''}
        </div>
        <div id="nearMeLoading" style="grid-column: 1/-1; text-align: center; padding: 40px; color: white;">
            <i class="fas fa-circle-notch fa-spin fa-2x"></i>
            <p style="margin-top: 15px;">กำลังรวมข้อมูลข่าวสารและสินค้า...</p>
        </div>
    `;

    try {
        // 3. Parallel Fetching (Posts, News, Products)
        // INCREASED LIMITS for interleaving logic
        const [postsSnap, newsSnap, productsSnap] = await Promise.all([
            db.collection('community_posts').orderBy('createdAt', 'desc').limit(50).get(),
            db.collection('news_feed').orderBy('createdAt', 'desc').limit(50).get(),
            db.collection('marketplace_items').where('status', '==', 'active').limit(150).get()
        ]);

        let productItems = [];
        let infoItems = []; // News + Posts

        // Helper to normalize item structure
        const normalizeItem = (doc, type) => {
            const item = doc.data();
            item.id = doc.id;
            item.type = type;

            // Coordinate Parsing logic
            let pLat = NaN, pLng = NaN;
            // Expanded coordsSource to support more field variations (including community_posts legacy and Pro formats)
            const coordsSource = item.locationCoords || item.coords || item.location || item.gps || item.location_coords;
            if (coordsSource) {
                if (typeof coordsSource === 'string' && coordsSource.includes(',')) {
                    const parts = coordsSource.split(',');
                    pLat = parseFloat(parts[0].trim());
                    pLng = parseFloat(parts[1].trim());
                } else if (coordsSource.latitude && coordsSource.longitude) {
                    pLat = coordsSource.latitude;
                    pLng = coordsSource.longitude;
                }
            }

            let dist = Infinity;
            if (loc && !isNaN(pLat) && !isNaN(pLng)) {
                dist = getDistance(loc.lat, loc.lng, pLat, pLng);
            }

            // Image / Video Logic — supports R2 objects { url, type, thumbnailUrl }
            let image = 'assets/images/logo.png';
            let videoUrl = item.videoUrl || item.video_url || null;
            let thumbUrl = null;

            if (item.images && item.images.length > 0) {
                const vidEntry = item.images.find(m => {
                    if (typeof m === 'object' && m.type === 'video') return true;
                    const u = (typeof m === 'string' ? m : m.url || '').toLowerCase();
                    return u.endsWith('.mp4') || u.endsWith('.mov') || u.endsWith('.webm');
                });
                if (vidEntry) {
                    videoUrl = videoUrl || (typeof vidEntry === 'string' ? vidEntry : vidEntry.url);
                    thumbUrl = (typeof vidEntry === 'object' && vidEntry.thumbnailUrl) || null;
                }
                const imgEntry = item.images.find(m => {
                    if (typeof m === 'object' && m.type === 'video') return false;
                    const u = (typeof m === 'string' ? m : m.url || '').toLowerCase();
                    return !u.endsWith('.mp4') && !u.endsWith('.mov') && !u.endsWith('.webm');
                });
                if (imgEntry) {
                    image = typeof imgEntry === 'string' ? imgEntry : (imgEntry.url || imgEntry.thumb || image);
                } else if (thumbUrl) {
                    image = thumbUrl;
                }
            } else if (item.imageUrl) image = item.imageUrl;
            else if (item.image) image = item.image;

            if (!videoUrl && typeof image === 'string' &&
                (image.endsWith('.mp4') || image.endsWith('.mov') || image.endsWith('.webm'))) {
                videoUrl = image;
                image = 'assets/images/logo.png';
            }

            const title = item.title || item.name || item.topic || 'ไม่มีหัวข้อ';
            const desc = item.content || item.description || item.detail || '';
            const author = item.authorName || item.sellerName || item.source || 'TukTuk Member';

            return {
                ...item,
                pLat, pLng,
                distance: dist,
                displayVideo: videoUrl || undefined,
                displayImage: image,
                displayTitle: title,
                displayDesc: desc,
                displayAuthor: author,
                displayPrice: item.price ? `฿${parseInt(item.price).toLocaleString()}` : null
            };
        };

        // Process Collections & Filter by Distance (200km Radius)
        const radiusLimit = 200; // Radius in KM as per user requirement

        postsSnap.forEach(doc => {
            const item = normalizeItem(doc, 'post');
            if (!loc || item.distance <= radiusLimit) infoItems.push(item);
        });
        newsSnap.forEach(doc => {
            const item = normalizeItem(doc, 'news');
            // News might not have location, but if it does, filter it. 
            // If it doesn't have location (distance = Infinity), we show it if loc is missing or 
            // maybe we show news regardless of location if it's pinned/global?
            // Usually News is global, but let's check distance if exists.
            if (!loc || item.distance === Infinity || item.distance <= radiusLimit) infoItems.push(item);
        });
        productsSnap.forEach(doc => {
            const item = normalizeItem(doc, 'product');
            if (!loc || item.distance <= radiusLimit) productItems.push(item);
        });

        console.log(`📍 Fetched: ${productItems.length} Products, ${infoItems.length} Content Items.`);

        // Sort Both Lists
        const sortFn = (a, b) => {
            // 1. Priority 1: Pinned Posts (e.g. Weather, Announcements)
            if (a.pinned !== b.pinned) {
                return a.pinned ? -1 : 1;
            }

            if (loc) {
                // 2. Priority 2: Distance (Only for Near Me tab)
                if (a.distance !== b.distance) return a.distance - b.distance;
            }

            // 3. Priority 3: Freshness (Newest first)
            const dateA = a.createdAt ? (a.createdAt.seconds || 0) : 0;
            const dateB = b.createdAt ? (b.createdAt.seconds || 0) : 0;
            return dateB - dateA;
        };

        productItems.sort(sortFn);
        infoItems.sort(sortFn);

        // 4. Interleave: 5 Products -> 1 Info (Increased frequency for News/Posts)
        let displayItems = [];
        let pIndex = 0;
        let iIndex = 0;

        while (pIndex < productItems.length || iIndex < infoItems.length) {
            // Add up to 5 products
            for (let i = 0; i < 5; i++) {
                if (pIndex < productItems.length) {
                    displayItems.push(productItems[pIndex++]);
                }
            }
            // Add 1 Info Item (News or Community Post)
            if (iIndex < infoItems.length) {
                displayItems.push(infoItems[iIndex++]);
            }
        }

        // Store for searching
        window.nearMeItemsCache = displayItems;

        // 6. Render
        renderNearMeGrid(container, displayItems);

        // 7. Setup Search Listener
        const searchInput = document.getElementById('nearMeSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                const filtered = window.nearMeItemsCache.filter(item =>
                    (item.displayTitle && item.displayTitle.toLowerCase().includes(term)) ||
                    (item.displayDesc && item.displayDesc.toLowerCase().includes(term)) ||
                    (item.displayAuthor && item.displayAuthor.toLowerCase().includes(term))
                );
                renderNearMeGrid(container, filtered, false); // false = don't re-render header
            });
        }

    } catch (err) {
        console.error("❌ NearMe Load Error:", err);
        const loader = document.getElementById('nearMeLoading');
        if (loader) {
            loader.innerHTML = `
                <div style="padding: 20px;">
                    <i class="fas fa-exclamation-triangle fa-2x text-warning mb-3"></i><br>
                    โหลดข้อมูลไม่สำเร็จ (${err.message})<br>
                    <button onclick="initTukTukFeed('near_me')" class="btn btn-sm btn-outline-light mt-3">ลองใหม่</button>
                </div>
            `;
        }
    }
}

function renderNearMeGrid(container, items, renderHeader = true) {
    // Remove loading
    const loader = document.getElementById('nearMeLoading');
    if (loader) loader.remove();

    // Clear old items ONLY (keep header)
    const existingItems = container.querySelectorAll('.tuktuk-grid-card, .no-results-msg');
    existingItems.forEach(el => el.remove());

    if (items.length === 0) {
        const div = document.createElement('div');
        div.className = 'no-results-msg';
        div.style.gridColumn = '1/-1';
        div.style.textAlign = 'center';
        div.style.padding = '40px';
        div.style.color = '#aaa';
        div.innerHTML = `<i class="fas fa-search fa-3x mb-3"></i><br>ไม่พบข้อมูลที่ค้นหา`;
        container.appendChild(div);
        return;
    }

    items.forEach(item => {
        container.appendChild(createNearMeGridCard(item));
    });
}

// 🃏 New Grid Card Renderer
function createNearMeGridCard(item) {
    const div = document.createElement('div');
    div.className = 'tuktuk-grid-card';
    div.id = `grid-${item.id}`;

    // Improve image handling
    const safeImage = item.displayImage || 'assets/images/logo.png';

    // Distance Badge Logic
    let distBadge = '';
    if (item.distance !== Infinity && item.distance !== undefined) {
        distBadge = `${item.distance.toFixed(1)} km`;
    } else {
        distBadge = 'Online';
    }

    // Badge Color for Products vs News
    let badgeColor = '#4ade80'; // Green (Near)
    if (item.type === 'product') badgeColor = '#facc15'; // Yellow (Product)
    if (item.type === 'news') badgeColor = '#60a5fa'; // Blue (News)

    const mediaSrc = item.displayVideo || safeImage;
    const mediaEl = item.displayVideo
        ? `<video src="${item.displayVideo}" poster="${safeImage !== 'assets/images/logo.png' ? safeImage : ''}"
               class="grid-card-img" muted loop playsinline preload="none"
               onclick="this.paused ? this.play() : this.pause()" style="object-fit:cover;"></video>
           <div style="position:absolute;top:8px;left:8px;background:rgba(0,0,0,0.55);border-radius:6px;padding:2px 6px;font-size:0.7rem;color:#fff;">
               <i class="fas fa-play"></i> วิดีโอ</div>`
        : `<img src="${safeImage}" class="grid-card-img" onerror="this.src='assets/images/logo.png'" loading="lazy">`;

    const html = `
        <div class="grid-card-image-wrapper">
            ${mediaEl}
            <div class="grid-distance-badge" style="color: ${badgeColor}; border-color: ${badgeColor}40;">
                <i class="fas ${item.distance !== Infinity ? 'fa-location-arrow' : 'fa-globe'}"></i> ${distBadge}
            </div>
            ${item.displayPrice ? `<div style="position: absolute; bottom: 10px; right: 10px; background: #ef4444; color: white; padding: 4px 10px; border-radius: 12px; font-weight: 800; font-size: 0.9rem; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">${item.displayPrice}</div>` : ''}
        </div>
        <div class="grid-card-content">
            <div class="grid-card-title">${item.displayTitle}</div>
            <div class="grid-card-desc">${item.displayDesc}</div>
            <div class="grid-card-footer">
                <div class="grid-card-author">
                    <img src="assets/images/logo.png" class="grid-author-img">
                    <span style="max-width: 100px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.displayAuthor || 'สมาชิก TukTuk'}</span>
                </div>
                <button class="grid-action-btn me-1" onclick="event.stopPropagation(); ${item.type === 'product' ? `TukTukNotify.shareProduct({id: '${item.id}', productName: '${item.displayTitle}'})` : `TukTukNotify.sharePost({id: '${item.id}', text: '${item.displayTitle}'})`}">
                    <i class="fas fa-share-alt"></i>
                </button>
                <button class="grid-action-btn" onclick="${item.type === 'product' ? `window.location.href='product.html?id=${item.id}'` : `showNewsDetail('${item.id}')`}">
                    <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        </div>
    `;
    div.innerHTML = html;
    return div;
}

function setupTabNavigation() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            const btn = e.currentTarget;
            const category = btn.getAttribute('data-category');

            if (window.currentCategory === category) return; // Avoid redundant load

            tabs.forEach(t => t.classList.remove('active'));
            btn.classList.add('active');

            window.currentCategory = category;
            sessionStorage.setItem('tuktuk_last_category', category);

            initTukTukFeed(category);

            // Skip loadPosts for community as it has its own realtime listener in initCommunityFeed
            if (category === 'community') return;

            if (typeof window.loadPosts === 'function') {
                window.loadPosts(false);
            }
        });
    });
}
// Existing createNewsFeedItem below...

function createNewsFeedItem(item) {
    const div = document.createElement('div');
    div.className = 'tuktuk-video-item'; // Container for the whole screen slide
    div.id = `news-${item.id}`;

    // Check verification status
    const isVerified = item.isVerified !== false;
    const displaySummary = isVerified ? (item.summary || item.title) : "วิเคราะห์ AI กำลังดำเนินการ...";

    // Modern UI with Background Blur and Floating Card
    const html = `
        <!-- Background Blur Layer -->
        <div class="news-bg-blur" style="background-image: url('${item.imageUrl}')"></div>
        
        <!-- Dark Gradient Overlay -->
        <div class="news-dark-overlay"></div>

        <!-- Right Side Actions (Floating) -->
        <div class="right-sidebar">
             <div class="avatar-wrapper">
                <img src="assets/images/logo.png" class="avatar-img">
            </div>

            <button class="action-btn" onclick="toggleLike(this)">
                <div class="action-icon-wrapper">
                    <i class="fas fa-heart action-icon" style="color: white;"></i>
                </div>
                <span class="action-text">Like</span>
            </button>

             <button class="action-btn" onclick="toggleBookmark('${item.id}')">
                <div class="action-icon-wrapper">
                    <i class="fas fa-bookmark action-icon" id="bookmark-${item.id}" style="color: white;"></i>
                </div>
                <span class="action-text">Save</span>
            </button>

            <button class="action-btn" onclick="TukTukNotify.sharePost({id: '${item.id}', text: '${item.title}'})">
                <div class="action-icon-wrapper">
                    <i class="fas fa-share action-icon" style="color: white;"></i>
                </div>
                <span class="action-text">Share</span>
            </button>
        </div>

        <!-- Floating Glass Content Card -->
        <div class="news-glass-card">
            ${isVerified ? '<div class="news-trending-badge">TRENDING NOW</div>' : ''}
            
            <div class="news-source-time">
                <span>${item.source || 'News Source'}</span>
                <span>${item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
            </div>

            <div class="news-headline">${item.title}</div>

            <div class="news-summary-point">
                <i class="fas fa-star" style="color: #FFD700; margin-top: 4px;"></i>
                <span>${displaySummary}</span>
            </div>

            <button class="news-action-btn" onclick="showNewsDetail('${item.id}')">
                <span>${!isVerified ? 'ดูรายละเอียดข่าว' : 'ดูสรุปและวิเคราะห์ AI'}</span>
                <i class="fas ${!isVerified ? 'fa-newspaper' : 'fa-robot'}"></i>
            </button>
        </div>
    `;

    div.innerHTML = html;
    return div;
}

// In-App Detail View (Bottom Sheet)
window.showNewsDetail = function (newsId) {
    // 1. Find Item (Check standard feed first, then Near Me cache)
    let item = currentFeed.find(i => i.id === newsId);
    if (!item && window.nearMeItemsCache) {
        item = window.nearMeItemsCache.find(i => i.id === newsId);
    }

    if (!item) return;

    // Remove existing modal if any
    const existingModal = document.querySelector('.news-detail-modal');
    if (existingModal) existingModal.remove();
    const existingBackdrop = document.querySelector('.modal-backdrop');
    if (existingBackdrop) existingBackdrop.remove();

    const isVerified = item.isVerified !== false;
    const points = item.summaryPoints || [];

    // Normalize Display Data (Handle inconsistent field names from different sources)
    const title = item.displayTitle || item.title || 'รายละเอียด';
    const source = item.displayAuthor || item.source || 'ที่มา: ไม่ระบุ';
    const desc = item.displayDesc || item.content || item.description || '';
    const img = item.displayImage || item.imageUrl || item.image || 'assets/images/logo.png';

    // Helper: Generate points HTML with Gemini Intelligence Styling
    let contentHtml = '';

    // 1. Add Intelligence Dashboard (If available)
    if (item.smartScore) {
        const scoreColor = item.smartScore > 80 ? '#4ade80' : (item.smartScore > 50 ? '#facc15' : '#fb7185');
        const impactBadge = item.impactLevel === 'high' ? '<span style="background:rgba(192, 132, 252, 0.2); color:#c084fc; padding:2px 8px; border-radius:4px; font-size:0.7rem; border:1px solid rgba(192, 132, 252, 0.4);">HIGH IMPACT</span>' : '';

        contentHtml += `
            <div style="background:rgba(255,255,255,0.05); border-radius:12px; padding:15px; margin-bottom:20px; display:flex; align-items:center; justify-content:space-between;">
                <div style="display:flex; align-items:center; gap:10px;">
                    <div style="text-align:center;">
                        <div style="font-size:0.7rem; color:#aaa;">SMART SCORE</div>
                        <div style="font-size:1.2rem; font-weight:800; color:${scoreColor};">${item.smartScore}</div>
                    </div>
                    <div style="width:1px; height:30px; background:rgba(255,255,255,0.1);"></div>
                    <div style="text-align:center;">
                        <div style="font-size:0.7rem; color:#aaa;">SENTIMENT</div>
                        <div style="font-size:0.9rem; text-transform:capitalize; color:white;">${item.sentiment || 'Neutral'}</div>
                    </div>
                </div>
                ${impactBadge}
            </div>
        `;
    }

    // 2. Add Summary Points with Icons
    if (points.length > 0) {
        contentHtml += points.map(p => {
            let icon = 'fas fa-circle';
            let color = '#FF0050';
            let bg = 'rgba(255, 0, 80, 0.1)';
            let label = '';

            if (p.includes('[Insight]')) { icon = 'fas fa-lightbulb'; color = '#facc15'; bg = 'rgba(250, 204, 21, 0.1)'; label = 'INSIGHT'; }
            else if (p.includes('[Impact]')) { icon = 'fas fa-exclamation-triangle'; color = '#fb7185'; bg = 'rgba(251, 113, 133, 0.1)'; label = 'IMPACT'; }
            else if (p.includes('[Action]')) { icon = 'fas fa-rocket'; color = '#60a5fa'; bg = 'rgba(96, 165, 250, 0.1)'; label = 'ACTION'; }

            // Clean text (remove the [Prefix])
            const cleanText = p.replace(/\[.*?\]:?/, '').trim();

            return `
            <div style="margin-bottom:12px; background:${bg}; padding:12px; border-radius:8px; border-left:3px solid ${color};">
                <div style="display:flex; gap:10px; align-items:flex-start;">
                    <i class="${icon}" style="color:${color}; font-size:1rem; margin-top:3px;"></i>
                    <div>
                        ${label ? `<div style="font-size:0.65rem; font-weight:700; color:${color}; margin-bottom:2px; letter-spacing:0.5px;">${label}</div>` : ''}
                        <span style="color:#eee; font-size:0.95rem; line-height:1.5;">${cleanText}</span>
                    </div>
                </div>
            </div>
            `;
        }).join('');
    } else {
        // Fallback for items without summary points
        contentHtml += `
            <div style="color:#ddd; font-size:1rem; line-height:1.6; white-space: pre-wrap;">${desc}</div>
        `;
    }

    // Image Header for Modal
    const imageHeader = img !== 'assets/images/logo.png' ? `
        <div style="width:100%; height:200px; overflow:hidden; border-radius:15px; margin-bottom:20px;">
             <img src="${img}" style="width:100%; height:100%; object-fit:cover;">
        </div>
    ` : '';

    // Modal HTML
    const modalHtml = `
        <div class="modal-backdrop" onclick="closeNewsDetail()"></div>
        <div class="news-detail-modal">
            <div class="modal-drag-handle"></div>
            
            <div class="modal-content-scroll">
                ${imageHeader}
                
                <div style="text-align:center; margin-bottom:20px; padding-top:10px;">
                    <h3 style="color:white; font-size:1.4rem;">${isVerified && points.length > 0 ? 'บทสรุปโดย AI Gemini' : 'รายละเอียด'}</h3>
                    <div style="width:50px; height:3px; background:#FF0050; margin:10px auto;"></div>
                </div>

                <h4 style="color:white; font-size:1.1rem; margin-bottom:10px;">${title}</h4>
                <div style="color:#aaa; font-size:0.85rem; margin-bottom:20px;">${source}</div>

                ${contentHtml}
                
                ${(!isVerified && item.type === 'news') ? `
                    <div style="margin-top:20px; text-align:center; color:#888; font-size:0.9rem;">
                        <i class="fas fa-sync fa-spin"></i> ระบบ AI กำลังดำเนินการตรวจสอบ...
                    </div>
                ` : ''}

                <!-- Secondary Action: External Link -->
                ${item.sourceUrl ? `
                <a href="${item.sourceUrl}" target="_blank" style="
                    display:block; 
                    margin-top:30px; 
                    padding:15px; 
                    background:#333; 
                    color:white; 
                    text-align:center; 
                    border-radius:12px; 
                    text-decoration:none;
                    font-weight:600;">
                    <i class="fas fa-external-link-alt"></i> อ่านต่อจากต้นฉบับ
                </a>` : ''}
                
                <div style="height:50px;"></div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Animate In
    setTimeout(() => {
        document.querySelector('.modal-backdrop').classList.add('active');
        document.querySelector('.news-detail-modal').classList.add('active');
    }, 10);
};

window.closeNewsDetail = function () {
    const modal = document.querySelector('.news-detail-modal');
    const backdrop = document.querySelector('.modal-backdrop');
    if (modal) modal.classList.remove('active');
    if (backdrop) backdrop.classList.remove('active');

    setTimeout(() => {
        if (modal) modal.remove();
        if (backdrop) backdrop.remove();
    }, 400);
}

function toggleLike(btn) {
    const icon = btn.querySelector('i');
    icon.classList.toggle('heart-active');

    // Simulate like count if needed
    const countSpan = btn.querySelector('.action-text');
    if (icon.classList.contains('heart-active')) {
        // Simple haptic simulation
        if (window.navigator.vibrate) window.navigator.vibrate(10);
    }
}

window.toggleBookmark = async function (itemId) {
    const user = firebase.auth().currentUser || WizmobizAuth.getUser();
    if (!user) {
        alert('กรุณาเข้าสู่ระบบเพื่อบันทึกรายการ');
        return;
    }

    const uid = user.uid || user.lineUserId;
    const icon = document.getElementById(`bookmark-${itemId}`);
    if (!icon) return;

    // Check color or a data attribute for saved state
    const isSaved = icon.classList.contains('active') || icon.style.color === 'rgb(255, 152, 0)' || icon.style.color === 'orange' || icon.style.color === '#FF9800';

    try {
        const userRef = db.collection('users').doc(uid);
        if (!isSaved) {
            await userRef.set({
                savedItems: firebase.firestore.FieldValue.arrayUnion({
                    id: itemId,
                    type: 'news',
                    savedAt: new Date().toISOString()
                })
            }, { merge: true });

            icon.style.color = '#FF9800';
            icon.classList.add('active');
            showToast('บันทึกเรียบร้อยแล้ว');
        } else {
            const userDoc = await userRef.get();
            if (userDoc.exists) {
                const savedItems = userDoc.data().savedItems || [];
                const newSavedItems = savedItems.filter(item => item.id !== itemId);
                await userRef.update({ savedItems: newSavedItems });
            }

            icon.style.color = 'white';
            icon.classList.remove('active');
            showToast('เอาออกจากรายการบันทึกแล้ว');
        }
    } catch (e) {
        console.error('Bookmark error:', e);
        alert('เกิดข้อผิดพลาดในการบันทึก');
    }
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 10px 20px;
        border-radius: 50px;
        z-index: 10000;
        font-size: 0.9rem;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,0.1);
        animation: fadeInOut 2s forwards;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

// Add animation to head if not exists
if (!document.getElementById('toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.innerHTML = `
        @keyframes fadeInOut {
            0% { opacity: 0; transform: translate(-50%, 20px); }
            15% { opacity: 1; transform: translate(-50%, 0); }
            85% { opacity: 1; transform: translate(-50%, 0); }
            100% { opacity: 0; transform: translate(-50%, -20px); }
        }
    `;
    document.head.appendChild(style);
}

// --- INTELLIGENT SYSTEM AUTOMATION (Google-Powered Efficiency) ---

async function checkAndAutoPostWeather() {
    // 🛡️ Admin-only policy: Only authorized admins trigger system auto-posts
    if (typeof WizmobizAuth === 'undefined') return;
    const user = WizmobizAuth.getUser();
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        return;
    }

    console.log("🌦️ Checking for daily weather update...");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
        // Query if a system weather post for today already exists
        const snapshot = await db.collection('news_feed')
            .where('authorId', '==', 'system_weather')
            .where('createdAt', '>=', firebase.firestore.Timestamp.fromDate(today))
            .limit(1)
            .get();

        if (!snapshot.empty) {
            console.log("✅ Daily weather is already posted.");
            return;
        }

        console.log("🚀 System policy: Auto-generating weather forecast for today...");

        // 1. Fetch Real-time data from Open-Meteo API
        const province = "Bangkok"; // Default for system post
        const coords = { lat: 13.7563, lon: 100.5018 };

        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,rain_sum&timezone=Asia%2FBangkok`);
        const data = await response.json();

        if (!data.daily) return;

        const daily = data.daily;
        const code = daily.weather_code[0];
        const maxTemp = daily.temperature_2m_max[0];
        const minTemp = daily.temperature_2m_min[0];
        const rain = daily.rain_sum[0];

        let condition = 'แจ่มใส';
        let icon = '☀️';
        if (code > 3) { condition = 'มีเมฆมาก'; icon = '☁️'; }
        if (code > 50) { condition = 'มีฝนตก'; icon = '🌧️'; }
        if (code > 95) { condition = 'พายุฝนฟ้าคะนอง'; icon = '⛈️'; }

        const dateStr = new Date().toLocaleDateString('th-TH', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });

        const weatherContent = `🌦️ พยากรณ์อากาศกรุงเทพฯ ประจำวันที่ ${dateStr}\n` +
            `------------------------\n` +
            `${icon} สภาพอากาศ: ${condition}\n` +
            `🌡️ อุณหภูมิ: ${minTemp}°C - ${maxTemp}°C\n` +
            `💧 โอกาสเกิดฝน: ${rain} มม.\n\n` +
            `อัปเดตอัตโนมัติโดย TukTuk Weather Intelligence System`;

        // 2. Use Powerful Google Firestore to store the post
        await db.collection('news_feed').add({
            authorName: 'TukTuk WeatherBot',
            authorId: 'system_weather',
            authorAvatar: 'https://cdn-icons-png.flaticon.com/512/4052/4052984.png',
            title: `พยากรณ์อากาศประจำวันที่ ${new Date().toLocaleDateString('th-TH')}`,
            summary: `สภาพอากาศวันนี้: ${condition} (${minTemp}-${maxTemp}°C)`,
            text: weatherContent,
            category: 'weather',
            imageUrl: 'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?q=80&w=1000&auto=format&fit=crop',
            pinned: true, // Priority 1 visibility
            isVerified: true,
            smartScore: 95,
            impactLevel: 'medium',
            sentiment: 'informative',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log("🎯 Daily weather post generated successfully at full efficiency.");

    } catch (error) {
        console.error("❌ System Error in Weather Automation:", error);
    }
}
