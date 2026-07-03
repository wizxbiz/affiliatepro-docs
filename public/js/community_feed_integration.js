
// 🌟 Community Feed Integration - Powerful Google-Inspired Version
// Use var for db to avoid re-declaration conflicts
if (typeof db === 'undefined' && typeof firebase !== 'undefined' && firebase.firestore) {
    var db = firebase.firestore();
}

window.currentCommentPostId = null;
window.commentsUnsubscribe = null;
window.commentModal = null;
window.quickPostModal = null;

window.TukTukCommunityFeed = window.TukTukCommunityFeed || {};
window.TukTukCommunityFeed.diagnostics = Array.isArray(window.TukTukCommunityFeed.diagnostics)
    ? window.TukTukCommunityFeed.diagnostics
    : [];

function recordCommunityDiagnostic(event, detail = {}) {
    const entry = {
        at: new Date().toISOString(),
        event,
        ...detail,
    };
    window.TukTukCommunityFeed.diagnostics.push(entry);
    while (window.TukTukCommunityFeed.diagnostics.length > 80) {
        window.TukTukCommunityFeed.diagnostics.shift();
    }
    if (/error|failed|timeout|unavailable|not_ready/i.test(event)) {
        console.warn('[TukTukCommunityFeed]', event, detail);
    }
    return entry;
}

function getCommunityDb() {
    if (typeof window !== 'undefined' && window.db) return window.db;
    if (typeof db !== 'undefined' && db) return db;
    if (typeof firebase !== 'undefined' && firebase.firestore) {
        const firestoreDb = firebase.firestore();
        try {
            window.db = window.db || firestoreDb;
        } catch (_) {}
        return firestoreDb;
    }
    return null;
}

// Frame Configurations (Synced with Video Studio)
const frameConfigs = {
    banana: {
        type: 'shadow',
        style: (size) => `inset 0 0 0 ${size}px #FFE135, inset 0 0 0 ${parseInt(size) + 2}px #111`,
        shadow: '0 10px 30px rgba(255, 225, 53, 0.3)'
    },
    neon: {
        type: 'shadow',
        style: (size) => `inset 0 0 ${size}px #00ff88, inset 0 0 0 3px #00ff88`,
        shadow: '0 0 30px rgba(0, 255, 136, 0.4)'
    },
    cyber: {
        type: 'mask',
        background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)',
        shadow: '0 10px 30px rgba(79, 172, 254, 0.3)'
    },
    gold: {
        type: 'mask',
        background: 'linear-gradient(45deg, #F5D68F, #FCEABB, #E8C77D, #FBF5E0, #D9B86A)',
        shadow: '0 10px 30px rgba(245, 214, 143, 0.3)'
    },
    fire: {
        type: 'mask',
        background: 'linear-gradient(to right, #ff9966, #ff5e62)',
        shadow: '0 10px 30px rgba(255, 94, 98, 0.3)'
    },
    glass: {
        type: 'glass',
        background: 'rgba(255, 255, 255, 0.1)',
        shadow: '0 8px 32px rgba(31, 38, 135, 0.15)'
    },
    pastel: {
        type: 'mask',
        background: 'linear-gradient(135deg, #E0C3FC 0%, #8EC5FC 100%)',
        shadow: '0 10px 30px rgba(224, 195, 252, 0.4)'
    },
    mint: {
        type: 'mask',
        background: 'linear-gradient(135deg, #A8EDEA 0%, #FED6E3 100%)',
        shadow: '0 10px 30px rgba(168, 237, 234, 0.4)'
    },
    lavender: {
        type: 'mask',
        background: 'linear-gradient(135deg, #D299C2 0%, #FEF9D7 100%)',
        shadow: '0 10px 30px rgba(210, 153, 194, 0.4)'
    },
    peach: {
        type: 'mask',
        background: 'linear-gradient(135deg, #FFD3A5 0%, #FD6585 100%)',
        shadow: '0 10px 30px rgba(255, 211, 165, 0.4)'
    },
    ocean: {
        type: 'mask',
        background: 'linear-gradient(135deg, #89F7FE 0%, #66A6FF 100%)',
        shadow: '0 10px 30px rgba(137, 247, 254, 0.4)'
    },
    sunset: {
        type: 'mask',
        background: 'linear-gradient(135deg, #FAD961 0%, #F76B1C 100%)',
        shadow: '0 10px 30px rgba(250, 217, 97, 0.4)'
    }
};

function initCommunityFeed(container) {
    if (!container) return;

    // Render the Career Hub Grid exactly like CareerHubView in Flutter
    container.innerHTML = `
        <div class="career-hub-container animate__animated animate__fadeIn" style="padding: 24px; padding-top: 80px; padding-bottom: 120px; min-height: 100vh;">
            <div class="career-header mb-4">
                <div class="badge rounded-pill mb-3" style="background: rgba(255,167,38,0.12); border: 1px solid rgba(255,167,38,0.4); color: #ffa726; font-size: 0.7rem; padding: 6px 14px; font-weight: 800; letter-spacing: 1px;">
                    🚀 TukTuk Career Hub
                </div>
                <h2 class="text-white fw-bold mb-1" style="font-size: 2.2rem; line-height: 1.1; font-family: 'Kanit', sans-serif;">สร้างอาชีพ<br>& บริการ</h2>
                <p class="text-white-50 mt-2" style="font-size: 0.85rem;">เลือกหมวดหมู่และเริ่มสร้างรายได้วันนี้</p>
            </div>
            
            <div class="row g-3">
                <!-- Card 1: WIN RIDER -->
                <div class="col-6">
                    <div class="career-card" style="background: linear-gradient(135deg, #6C3FFF, #00D2FF); border-radius: 22px; padding: 16px; height: 180px; position: relative; overflow: hidden; cursor: pointer; box-shadow: 0 8px 18px rgba(108, 63, 255, 0.38); transition: transform 0.2s;" onclick="this.style.transform='scale(0.95)'; setTimeout(()=> { this.style.transform='scale(1)'; window.location.href='win-service.html'; }, 150);">
                        <div class="position-absolute" style="right: -10px; bottom: -14px; font-size: 72px; opacity: 0.09; pointer-events: none;">🏍️</div>
                        <div class="d-flex flex-column h-100 position-relative z-1">
                            <div class="badge rounded-pill text-white d-inline-block align-self-start mb-2" style="background: rgba(255,255,255,0.22); border: 1px solid rgba(255,255,255,0.4); font-size: 0.6rem; padding: 3px 8px; font-weight: 800;">HOT</div>
                            <div style="font-size: 36px; margin-bottom: auto;">🏍️</div>
                            <h6 class="text-white fw-bold mb-0 mt-2" style="font-size: 1.05rem; font-family: 'Kanit', sans-serif;">WIN RIDER</h6>
                            <p class="mb-2" style="font-size: 0.65rem; color: rgba(255,255,255,0.7);">รับส่งพัสดุ 24/7</p>
                            <div class="mt-auto d-flex align-items-center" style="font-size: 0.6rem; color: rgba(255,255,255,0.54);">
                                <i class="fas fa-users me-1"></i> <span class="flex-grow-1 text-truncate" id="live-stat-win">— วินออนไลน์</span>
                                <div class="rounded-circle d-flex align-items-center justify-content-center" style="background: rgba(255,255,255,0.2); width: 20px; height: 20px; flex-shrink: 0;"><i class="fas fa-arrow-right text-white" style="font-size: 0.6rem;"></i></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Card 2: Creator -->
                <div class="col-6">
                    <div class="career-card" style="background: linear-gradient(135deg, #FF0050, #FF6B35); border-radius: 22px; padding: 16px; height: 180px; position: relative; overflow: hidden; cursor: pointer; box-shadow: 0 8px 18px rgba(255, 0, 80, 0.38); transition: transform 0.2s;" onclick="this.style.transform='scale(0.95)'; setTimeout(()=> { this.style.transform='scale(1)'; window.location.href='seller-dashboard.html'; }, 150);">
                        <div class="position-absolute" style="right: -10px; bottom: -14px; font-size: 72px; opacity: 0.09; pointer-events: none;">📹</div>
                        <div class="d-flex flex-column h-100 position-relative z-1">
                            <div class="badge rounded-pill text-white d-inline-block align-self-start mb-2" style="background: rgba(255,255,255,0.22); border: 1px solid rgba(255,255,255,0.4); font-size: 0.6rem; padding: 3px 8px; font-weight: 800;">NEW</div>
                            <div style="font-size: 36px; margin-bottom: auto;">📹</div>
                            <h6 class="text-white fw-bold mb-0 mt-2" style="font-size: 1.05rem; font-family: 'Kanit', sans-serif;">Creator</h6>
                            <p class="mb-2" style="font-size: 0.65rem; color: rgba(255,255,255,0.7);">สร้างคอนเทนต์</p>
                            <div class="mt-auto d-flex align-items-center" style="font-size: 0.6rem; color: rgba(255,255,255,0.54);">
                                <i class="fas fa-users me-1"></i> <span class="flex-grow-1 text-truncate" id="live-stat-creator">— คอนเทนต์</span>
                                <div class="rounded-circle d-flex align-items-center justify-content-center" style="background: rgba(255,255,255,0.2); width: 20px; height: 20px; flex-shrink: 0;"><i class="fas fa-arrow-right text-white" style="font-size: 0.6rem;"></i></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Card 3: Community -->
                <div class="col-6">
                    <div class="career-card" style="background: linear-gradient(135deg, #10B981, #059669); border-radius: 22px; padding: 16px; height: 180px; position: relative; overflow: hidden; cursor: pointer; box-shadow: 0 8px 18px rgba(16, 185, 129, 0.38); transition: transform 0.2s;" onclick="this.style.transform='scale(0.95)'; const c = this.closest('.tuktuk-feed-container'); setTimeout(()=> { this.style.transform='scale(1)'; renderActualCommunityFeed(c); }, 150);">
                        <div class="position-absolute" style="right: -10px; bottom: -14px; font-size: 72px; opacity: 0.09; pointer-events: none;">🏘️</div>
                        <div class="d-flex flex-column h-100 position-relative z-1">
                            <div style="height: 20px; margin-bottom: 8px;"></div> <!-- Spacer matching tags -->
                            <div style="font-size: 36px; margin-bottom: auto;">🏘️</div>
                            <h6 class="text-white fw-bold mb-0 mt-2" style="font-size: 1.05rem; font-family: 'Kanit', sans-serif;">ชุมชน</h6>
                            <p class="mb-2" style="font-size: 0.65rem; color: rgba(255,255,255,0.7);">กลุ่มอาชีพคนไทย</p>
                            <div class="mt-auto d-flex align-items-center" style="font-size: 0.6rem; color: rgba(255,255,255,0.54);">
                                <i class="fas fa-users me-1"></i> <span class="flex-grow-1 text-truncate" id="live-stat-comm">— โพสต์</span>
                                <div class="rounded-circle d-flex align-items-center justify-content-center" style="background: rgba(255,255,255,0.2); width: 20px; height: 20px; flex-shrink: 0;"><i class="fas fa-arrow-right text-white" style="font-size: 0.6rem;"></i></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Card 4: Pro Service -->
                <div class="col-6">
                    <div class="career-card" style="background: linear-gradient(135deg, #F59E0B, #D97706); border-radius: 22px; padding: 16px; height: 180px; position: relative; overflow: hidden; cursor: pointer; box-shadow: 0 8px 18px rgba(245, 158, 11, 0.38); transition: transform 0.2s;" onclick="this.style.transform='scale(0.95)'; const c = this.closest('.tuktuk-feed-container'); setTimeout(()=> { this.style.transform='scale(1)'; renderActualCommunityFeed(c, 'eco_pros'); }, 150);">
                        <div class="position-absolute" style="right: -10px; bottom: -14px; font-size: 72px; opacity: 0.09; pointer-events: none;">🔧</div>
                        <div class="d-flex flex-column h-100 position-relative z-1">
                            <div style="height: 20px; margin-bottom: 8px;"></div> <!-- Spacer -->
                            <div style="font-size: 36px; margin-bottom: auto;">🔧</div>
                            <h6 class="text-white fw-bold mb-0 mt-2" style="font-size: 1.05rem; font-family: 'Kanit', sans-serif;">ช่าง & บริการ</h6>
                            <p class="mb-2" style="font-size: 0.65rem; color: rgba(255,255,255,0.7);">หาลูกค้าในพื้นที่</p>
                            <div class="mt-auto d-flex align-items-center" style="font-size: 0.6rem; color: rgba(255,255,255,0.54);">
                                <i class="fas fa-users me-1"></i> <span class="flex-grow-1 text-truncate" id="live-stat-pro">— ช่าง</span>
                                <div class="rounded-circle d-flex align-items-center justify-content-center" style="background: rgba(255,255,255,0.2); width: 20px; height: 20px; flex-shrink: 0;"><i class="fas fa-arrow-right text-white" style="font-size: 0.6rem;"></i></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Fetch live stats safely
    const statsDb = getCommunityDb();
    if (statsDb) {
        statsDb.collection('win_riders').where('isOnline', '==', true).get().then(snap => {
            const el = document.getElementById('live-stat-win');
            if (el) el.textContent = `${snap.size || 0} วินออนไลน์`;
        }).catch(() => null);

        statsDb.collection('tuktuk_posts').get().then(snap => {
            const el = document.getElementById('live-stat-creator');
            if (el) el.textContent = `${snap.size || 0} คอนเทนต์`;
        }).catch(() => null);

        statsDb.collection('community_posts').get().then(snap => {
            const el = document.getElementById('live-stat-comm');
            if (el) el.textContent = `${snap.size || 0} โพสต์`;

            // Sub count for pro
            const proCount = snap.docs.filter(d => d.data().category === 'eco_pros').length;
            const proEl = document.getElementById('live-stat-pro');
            if (proEl) proEl.textContent = `${proCount} ช่าง`;
        }).catch(() => null);
    }
}

function renderActualCommunityFeed(container, defaultFilter = 'all') {
    if (!container) return;

    // 1. Setup Modals
    injectCommunityModals();

    // 2. Build Structural UI
    container.innerHTML = `
        <div class="community-header animate__animated animate__fadeInDown px-3" style="padding-top: 80px;">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <div class="d-flex align-items-center">
                    <button class="btn btn-dark text-white rounded-circle me-3" style="width: 40px; height: 40px; background: rgba(255,255,255,0.1);" onclick="initCommunityFeed(this.closest('.tuktuk-feed-container'))">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <div>
                        <h5 class="text-white mb-0 fw-bold" style="font-family: 'Outfit', sans-serif; letter-spacing: -0.5px;">
                            ชุมชน <span style="font-weight: 300; opacity: 0.6;">Community</span>
                        </h5>
                        <div class="small text-white-50">แบ่งปันเรื่องราวและก้าวไปด้วยกัน</div>
                    </div>
                </div>
                <div class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-3 py-2 rounded-pill shadow-sm" style="font-size: 0.75rem;">
                    <i class="fas fa-globe-asia me-1"></i> สาธารณะ
                </div>
            </div>
            
            <!-- Google-Style Smart Widget -->
            <div class="create-post-wrapper mt-3">
                <div class="create-post-header-text">
                    <i class="fas fa-sparkles"></i> ช่วยบอกต่อและแชร์เรื่องราว
                </div>
                <div class="smart-input-box" onclick="openQuickPostModal()">
                    <img src="${getUserAvatar()}" class="rounded-circle" width="35" height="35" style="object-fit: cover;">
                    <div class="smart-input-text">เริ่มต้นบทสนทนาที่นี่...</div>
                    <div class="google-action-btn google-voice" onclick="event.stopPropagation(); startVoiceInput();">
                        <i class="fas fa-microphone"></i>
                    </div>
                    <div class="google-action-btn google-image" onclick="event.stopPropagation(); document.getElementById('quickPostFile').click();">
                        <i class="fas fa-image"></i>
                    </div>
                </div>
                <div class="smart-chips custom-scrollbar">
                    <div class="smart-chip ${defaultFilter === 'all' ? 'active' : ''}" onclick="filterCommunity('all')">
                        <div style="color: var(--google-blue)"><i class="fas fa-th-large"></i></div> ทั้งหมด
                    </div>
                    <div class="smart-chip" onclick="filterCommunity('groups')">
                        <div style="color: #a855f7"><i class="fas fa-users"></i></div> กลุ่ม (Groups)
                    </div>
                    <div class="smart-chip" onclick="filterCommunity('discussion')">
                        <div style="color: var(--google-green)"><i class="fas fa-comments"></i></div> ประเด็นพูดคุย
                    </div>
                    <div class="smart-chip ${defaultFilter === 'eco_pros' ? 'active' : ''}" onclick="filterCommunity('eco_pros')">
                        <div style="color: #F59E0B"><i class="fas fa-wrench"></i></div> ช่างบริการ
                    </div>
                    <div class="smart-chip" onclick="openQuickPostModal(); setTimeout(() => tryAiAssist(), 500);">
                        <i class="fas fa-magic text-warning animate__animated animate__pulse animate__infinite"></i> ให้ AI ช่วยคิด
                    </div>
                </div>
            </div>
        </div>
        
        <div id="community-feed-content" class="px-3 pb-5 mt-3">
            <div id="community-posts-loader" class="text-center py-5">
                <div class="spinner-grow text-primary" role="status"></div>
                <div class="mt-3 text-white-50 fw-light">กำลังเชื่อมต่อสังคม TukTuk...</div>
            </div>
        </div>
    `;

    // 3. Start Realtime Listener
    loadCommunityPosts(defaultFilter);
}


window.communityUnsubscribe = null;

function renderCommunityLoadError(container, filter = 'all', message = 'Community feed is unavailable') {
    if (!container) return;
    const safeFilter = String(filter || 'all').replace(/[^a-z_]/gi, '') || 'all';
    container.style.opacity = '1';
    container.innerHTML = `
        <div class="empty-community-state animate__animated animate__fadeIn" style="min-height: 320px;">
            <div class="empty-icon-circle">
                <i class="fas fa-wifi"></i>
            </div>
            <h5 class="text-white mb-2 fw-bold">Community feed is unavailable</h5>
            <p class="text-white-50 mb-4 px-4">${escapeHtml(message)}</p>
            <div class="d-flex justify-content-center gap-2 flex-wrap">
                <button class="btn btn-primary rounded-pill px-4 py-2 fw-bold" onclick="loadCommunityPosts('${safeFilter}')">
                    <i class="fas fa-sync-alt me-2"></i> Retry
                </button>
                <button class="btn btn-outline-light rounded-pill px-4 py-2 fw-bold" onclick="initCommunityFeed(this.closest('.tuktuk-feed-container'))">
                    <i class="fas fa-chevron-left me-2"></i> Back
                </button>
            </div>
        </div>
    `;
}

function loadCommunityPosts(filter = 'all') {
    const contentContainer = document.getElementById('community-feed-content');
    if (!contentContainer) return;

    const communityDb = getCommunityDb();
    if (!communityDb) {
        recordCommunityDiagnostic('db_not_ready', { filter });
        renderCommunityLoadError(contentContainer, filter, 'Community database is not ready. Please retry.');
        setTimeout(() => {
            if (getCommunityDb()) loadCommunityPosts(filter);
        }, 900);
        return;
    }

    if (window.communityUnsubscribe) {
        try {
            window.communityUnsubscribe();
        } catch (err) {
            recordCommunityDiagnostic('unsubscribe_failed', {
                filter,
                message: err.message || String(err),
            });
        }
        window.communityUnsubscribe = null;
    }

    recordCommunityDiagnostic('load_start', { filter });
    contentContainer.style.opacity = '1';
    contentContainer.innerHTML = `
        <div id="community-posts-loader" class="text-center py-5">
            <div class="spinner-grow text-primary" role="status"></div>
            <div class="mt-3 text-white-50 fw-light">Loading community feed...</div>
        </div>
    `;

    let query = communityDb.collection('community_posts');

    if (filter === 'groups') {
        query = query.where('category', '==', 'groups');
    } else if (filter === 'discussion') {
        query = query.where('category', 'in', ['discussion', 'topic']);
    } else if (filter === 'eco_pros') {
        query = query.where('category', '==', 'eco_pros');
    }

    window.communityUnsubscribe = query.orderBy('createdAt', 'desc')
        .limit(40)
        .onSnapshot(snapshot => {
            const loader = document.getElementById('community-posts-loader');
            if (loader) {
                // Keep structural container if it exists
                loader.innerHTML = '';
                loader.classList.remove('py-5');
            }

            contentContainer.innerHTML = '';
            contentContainer.style.opacity = '1';
            recordCommunityDiagnostic('load_success', {
                filter,
                count: snapshot.size || 0,
            });

            if (snapshot.empty) {
                renderEmptyState(contentContainer, filter);
                return;
            }

            snapshot.forEach(doc => {
                const post = { id: doc.id, ...doc.data() };
                contentContainer.appendChild(renderCommunityPostCard(post));
            });
        }, err => {
            console.error("Load Error:", err);
            recordCommunityDiagnostic('load_error', {
                filter,
                message: err.message || String(err),
                code: err.code || null,
            });
            renderCommunityLoadError(contentContainer, filter, err.message || 'Unable to load community feed.');
        });
}

function filterCommunity(filter) {
    // Update Chips UI
    document.querySelectorAll('.smart-chip').forEach(chip => {
        chip.classList.toggle('active', chip.getAttribute('onclick').includes(`'${filter}'`));
    });

    // Smooth loading state
    const content = document.getElementById('community-feed-content');
    if (content) content.style.opacity = '0.5';

    setTimeout(() => {
        try {
            loadCommunityPosts(filter);
        } catch (err) {
            recordCommunityDiagnostic('filter_load_error', {
                filter,
                message: err.message || String(err),
            });
            renderCommunityLoadError(content, filter, err.message || 'Unable to load community feed.');
        } finally {
            if (content) content.style.opacity = '1';
        }
    }, 200);
}

function renderCommunityPostCard(post) {
    const isPC = window.innerWidth >= 992;

    if (isPC) {
        const card = document.createElement('div');
        card.className = 'pc-post-social-card animate__animated animate__fadeInUp';

        const timestamp = post.createdAt ? new Date(post.createdAt.seconds * 1000) : new Date();
        const timeStr = timestamp.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
        const media = post.images || (post.imageUrl ? [post.imageUrl] : []);

        card.innerHTML = `
            <div class="pc-post-header">
                <img src="${post.authorAvatar || 'assets/images/logo.png'}" class="pc-post-author-img" onclick="window.location.href='channel.html?userId=${post.authorId}'" style="cursor: pointer;">
                <div class="pc-post-meta">
                    <span class="pc-post-author-name" onclick="window.location.href='channel.html?userId=${post.authorId}'" style="cursor: pointer;">${escapeHtml(post.authorName || 'สมาชิก')}</span>
                    <div class="pc-post-time">
                        <span>${timeStr}</span> • <i class="fas fa-globe-asia"></i>
                        <span class="badge" style="background: rgba(236,72,153,0.1); color: #ec4899; margin-left:8px;">${post.category || 'ทั่วไป'}</span>
                    </div>
                </div>
            </div>
            
            <div class="pc-post-content">
                ${post.title ? `<div style="font-weight: 700; font-size: 1.1rem; margin-bottom: 6px;">${escapeHtml(post.title)}</div>` : ''}
                <div style="color: #e4e6eb; opacity: 0.9; white-space: pre-wrap;">${formatContent(post.content)}</div>
            </div>

            ${(() => {
                const imgs = post.images || (post.imageUrl ? [post.imageUrl] : (post.image_url ? [post.image_url] : []));
                const video = post.videoUrl || post.video_url || post.youtubeUrl || post.youtube_url || '';

                // Enhanced Media Engine for PC Card
                const allMedia = [];
                if (post.images && Array.isArray(post.images)) {
                    post.images.forEach(m => {
                        const url = (typeof m === 'object' ? m.url : m) || '';
                        const type = (typeof m === 'object' ? m.type : (url.includes('.mp4') ? 'video' : 'image')) || 'image';
                        if (url) allMedia.push({ url, type });
                    });
                }

                const primaryVideo = allMedia.find(m => m.type === 'video' || m.type === 'youtube') || (video ? { url: video, type: video.includes('youtu') ? 'youtube' : 'video' } : null);
                const primaryImg = allMedia.find(m => m.type === 'image')?.url || (imgs.length > 0 ? (typeof imgs[0] === 'object' ? imgs[0].url : imgs[0]) : null);

                if (primaryVideo) {
                    const vid = primaryVideo.url;
                    const ytId = vid.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=))([\w-]+)/)?.[1];
                    if (primaryVideo.type === 'youtube' || ytId) {
                        return `<div class="pc-post-media-container" style="background: #000; position:relative; padding-bottom:56.25%; height:0;">
                            <iframe src="https://www.youtube.com/embed/${ytId || vid}?enablejsapi=1" style="position:absolute; top:0; left:0; width:100%; height:100%; border:0;" allowfullscreen></iframe>
                        </div>`;
                    } else {
                        return `<div class="pc-post-media-container" style="background: #111; position:relative;">
                            <video src="${vid}" poster="${primaryImg || ''}" controls muted loop playsinline style="width:100%; max-height:550px; display:block; background:#000;"></video>
                        </div>`;
                    }
                } else if (primaryImg) {
                    return `<div class="pc-post-media-container" style="background: #111; cursor:pointer;" onclick="viewImageFull('${primaryImg}')">
                        <img src="${primaryImg}" style="max-height: 600px; object-fit: contain; width:100%; display:block;">
                    </div>`;
                }
                return '';
            })()}

            <div class="pc-post-actions-summary">
                <div class="likes-count">
                    <i class="fas fa-thumbs-up" style="color: #2e89ff; font-size: 0.8rem;"></i>
                    <span>${post.likes || 0}</span>
                </div>
                <div class="comments-shares">
                    <span>${post.commentsCount || 0} ความคิดเห็น</span> • <span>${post.shareCount || 0} แชร์</span>
                </div>
            </div>

            <div class="pc-post-interaction-btns">
                <div class="pc-post-btn ${isPostLiked(post.id) ? 'active' : ''}" onclick="event.stopPropagation(); likeCommunityPost(this, '${post.id}')">
                    <i class="${isPostLiked(post.id) ? 'fas' : 'far'} fa-thumbs-up"></i> <span>ถูกใจ</span>
                </div>
                <div class="pc-post-btn" onclick="event.stopPropagation(); openComments('${post.id}')">
                    <i class="far fa-comment"></i> <span>แสดงความเห็น</span>
                </div>
                <div class="pc-post-btn" onclick="event.stopPropagation(); shareCommunityPost('${post.id}', '${escapeHtml(post.content || '')}')">
                    <i class="fas fa-share"></i> <span>แชร์</span>
                </div>
            </div>
        `;
        return card;
    }

    const card = document.createElement('div');
    card.className = 'community-feed-card animate__animated animate__fadeInUp';

    const timestamp = post.createdAt ? new Date(post.createdAt.seconds * 1000) : new Date();
    const timeStr = timestamp.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
    const fullTimeStr = timestamp.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

    // Media Logic (Refined Proportions)
    let mediaHtml = '';
    const imgs = post.images || (post.imageUrl ? [post.imageUrl] : (post.image_url ? [post.image_url] : []));
    const video = post.videoUrl || post.video_url || post.youtubeUrl || post.youtube_url || '';

    const allMedia = [];
    if (post.images && Array.isArray(post.images)) {
        post.images.forEach(m => {
            const url = (typeof m === 'object' ? m.url : m) || '';
            const type = (typeof m === 'object' ? m.type : (url.match(/\.(mp4|webm|ogg|mov)$/i) ? 'video' : 'image')) || 'image';
            if (url) allMedia.push({ url, type });
        });
    }

    if (allMedia.length === 0 && (post.imageUrl || post.image_url)) {
        allMedia.push({ url: post.imageUrl || post.image_url, type: 'image' });
    }

    const primaryVideo = allMedia.find(m => m.type === 'video' || m.type === 'youtube') || (video ? { url: video, type: video.includes('youtu') ? 'youtube' : 'video' } : null);
    const primaryImg = allMedia.find(m => m.type === 'image')?.url || (imgs.length > 0 ? (typeof imgs[0] === 'object' ? imgs[0].url : imgs[0]) : null);

    if (primaryVideo) {
        mediaUrl = primaryVideo.url;
        isVideo = true;
    } else if (primaryImg) {
        mediaUrl = primaryImg;
        isVideo = false;
    }

    if (mediaUrl) {
        if (isVideo) {
            // Check for YouTube
            const ytMatch = mediaUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);

            if (ytMatch) {
                // YouTube Embed
                const ytId = ytMatch[1];
                mediaHtml = `
                    <div class="community-post-media mt-2" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 12px;">
                        <iframe src="https://www.youtube.com/embed/${ytId}?enablejsapi=1&rel=0" 
                                style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowfullscreen></iframe>
                    </div>
                `;
            } else if (mediaUrl.includes('facebook.com')) {
                // Facebook Embed (Basic)
                const encodeUrl = encodeURIComponent(mediaUrl);
                mediaHtml = `
                    <div class="community-post-media mt-2" style="overflow: hidden; border-radius: 12px;">
                        <iframe src="https://www.facebook.com/plugins/video.php?href=${encodeUrl}&show_text=false&t=0" 
                                style="border:none;overflow:hidden;width:100%;height:450px;" 
                                scrolling="no" frameborder="0" allowfullscreen="true" 
                                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>
                    </div>
                `;
            } else {
                // Standard Video File (Native Player)
                // Check if Video Studio Frame exists
                let overlayStyles = '';
                let containerStyles = '';
                const studio = post.videoStudio;

                if (studio && studio.frame) {
                    const frame = frameConfigs[studio.frame] || frameConfigs['banana'];
                    const size = studio.frameSize || 25;

                    if (frame) {
                        if (frame.type === 'shadow') {
                            overlayStyles = `box-shadow: ${typeof frame.style === 'function' ? frame.style(size) : frame.style};`;
                        } else if (frame.type === 'mask') {
                            overlayStyles = `
                                box-sizing: border-box;
                                background: ${frame.background};
                                padding: ${size}px;
                                -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                                -webkit-mask-composite: xor;
                                mask-composite: exclude;
                            `;
                        } else if (frame.type === 'glass') {
                            overlayStyles = `
                                box-sizing: border-box;
                                border: 1px solid rgba(255,255,255,0.3);
                                box-shadow: inset 0 0 0 ${size}px rgba(255, 255, 255, 0.1);
                                backdrop-filter: blur(8px);
                                padding: ${size}px;
                                background: rgba(255, 255, 255, 0.15);
                                -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                                -webkit-mask-composite: xor;
                                mask-composite: exclude;
                            `;
                        }

                        // Container Shadow (Outer Glow)
                        if (frame.shadow) {
                            containerStyles = `box-shadow: ${frame.shadow};`;
                        }
                    }
                }

                mediaHtml = `
                    <div class="community-post-media mt-2 position-relative" style="${containerStyles} border-radius: 12px; overflow:hidden;">
                        <!-- Frame Overlay -->
                        ${overlayStyles ? `<div class="position-absolute top-0 start-0 w-100 h-100" style="pointer-events: none; z-index: 5; border-radius: 12px; ${overlayStyles}"></div>` : ''}
                        
                        <!-- Watermarks -->
                        ${(studio && studio.watermarkTop) ? `
                            <div class="position-absolute top-0 start-0 end-0 text-center py-2" style="background: linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%); z-index: 6; pointer-events: none;">
                                <span class="fw-bold text-white" style="font-size: 14px; text-shadow: 0 2px 5px rgba(0,0,0,0.8);">${escapeHtml(studio.watermarkTop)}</span>
                            </div>
                        ` : ''}

                        ${(studio && studio.watermarkBottom) ? `
                            <div class="position-absolute bottom-0 start-0 end-0 text-center py-2" style="background: linear-gradient(0deg, rgba(0,0,0,0.7) 0%, transparent 100%); z-index: 6; pointer-events: none;">
                                <span class="fw-bold text-white" style="font-size: 14px; text-shadow: 0 2px 5px rgba(0,0,0,0.8);">${escapeHtml(studio.watermarkBottom)}</span>
                            </div>
                        ` : ''}

                        <video controls playsinline preload="metadata" class="w-100" style="object-fit: contain; max-height: 500px; background: #000; display:block;">
                            <source src="${mediaUrl}">
                            Your browser does not support the video tag.
                        </video>
                    </div>
                `;
            }
        } else {
            // Image Logic
            const imageList = post.images || [];
            mediaHtml = `
                <div class="community-post-media mt-2" 
                     style="cursor: pointer; position: relative;"
                     onclick="viewImageFull('${mediaUrl}')">
                    <img src="${mediaUrl}" class="w-100" loading="lazy" style="object-fit: cover; max-height: 500px; border-radius: 12px;" onerror="this.src='assets/images/placeholder.jpg'">
                    ${imageList.length > 1 ? `<div class="position-absolute bottom-0 end-0 m-3 px-3 py-1 bg-dark bg-opacity-75 rounded-pill text-white small shadow-sm" style="backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.1); font-size: 0.7rem;">+${imageList.length - 1} รูปเพิ่มเติม</div>` : ''}
                </div>
            `;
        }
    }

    card.innerHTML = `
        <div class="p-3">
            <div class="d-flex align-items-center mb-2">
                <div class="card-author-avatar me-2" style="cursor: pointer; width: 42px; height: 42px;" onclick="window.location.href='channel.html?userId=${post.authorId}'">
                    <img src="${post.authorAvatar || 'assets/images/logo.png'}" class="rounded-circle w-100 h-100" style="object-fit: cover; border: 1px solid rgba(255,255,255,0.1);">
                </div>
                <div class="flex-grow-1">
                    <div class="d-flex align-items-center gap-2">
                        <div class="fw-bold text-white mb-0" style="font-size: 0.95rem; cursor: pointer;" onclick="window.location.href='channel.html?userId=${post.authorId}'">
                            ${escapeHtml(post.authorName || 'สมาชิก')}
                        </div>
                        <div class="category-badge py-0 px-2" style="font-size: 0.65rem; height: 18px; line-height: 18px;">${post.category || 'ทั่วไป'}</div>
                    </div>
                    <div class="text-white-50" style="font-size: 0.7rem; opacity: 0.7;">
                        ${timeStr} • ${fullTimeStr} • <i class="fas fa-globe-asia" style="font-size: 0.6rem;"></i>
                    </div>
                </div>
                <div class="dropdown">
                    <button class="btn btn-link text-white-50 p-1" data-bs-toggle="dropdown" style="font-size: 0.9rem;"><i class="fas fa-ellipsis-h"></i></button>
                    <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end shadow-lg border-0 bg-dark py-1" style="font-size: 0.85rem;">
                        <li><a class="dropdown-item py-2" href="#" onclick="copyPostLink('${post.id}')"><i class="fas fa-link me-2 text-primary" style="width: 16px;"></i>คัดลอกลิงก์</a></li>
                        <li><a class="dropdown-item py-2" href="#" onclick="reportPost('${post.id}')"><i class="fas fa-flag me-2 text-warning" style="width: 16px;"></i>รายงานโพสต์</a></li>
                    </ul>
                </div>
            </div>
            
            <div class="post-text-content px-0 mb-2">
                ${post.title ? `<h6 class="fw-bold text-white mb-1" style="font-size: 1.05rem; letter-spacing: -0.2px;">${escapeHtml(post.title)}</h6>` : ''}
                <div class="text-white-50" style="font-size: 0.92rem; line-height: 1.5; white-space: pre-wrap; color: rgba(255,255,255,0.85) !important;">${formatContent(post.content)}</div>
            </div>
            
            ${mediaHtml}
        </div>

        <div class="post-stats-row d-flex justify-content-between px-3 py-2 border-top border-bottom border-white border-opacity-10" style="font-size: 0.75rem; color: rgba(255,255,255,0.5);">
            <div class="d-flex align-items-center gap-1">
                <div class="d-flex align-items-center justify-content-center bg-primary rounded-circle" style="width: 16px; height: 16px; font-size: 0.5rem;">
                    <i class="fas fa-thumbs-up text-white"></i>
                </div>
                <span>${post.likes || 0}</span>
            </div>
            <div class="d-flex gap-2">
                <span>${post.commentsCount || 0} ความคิดเห็น</span>
                <span>•</span>
                <span>${post.shareCount || 0} แชร์</span>
            </div>
        </div>

        <div class="post-actions d-flex px-1 py-1">
            <button class="action-btn-row flex-grow-1 ${isPostLiked(post.id) ? 'liked' : ''}" onclick="event.stopPropagation(); likeCommunityPost(this, '${post.id}')">
                <i class="${isPostLiked(post.id) ? 'fas' : 'far'} fa-thumbs-up"></i>
                <span>ถูกใจ</span>
            </button>
            <button class="action-btn-row flex-grow-1" onclick="event.stopPropagation(); openComments('${post.id}')">
                <i class="far fa-comment-alt"></i>
                <span>ความเห็น</span>
            </button>
            <button class="action-btn-row flex-grow-1" onclick="event.stopPropagation(); shareCommunityPost('${post.id}', '${escapeHtml(post.content || '')}')">
                <i class="fas fa-share-alt"></i>
                <span>แชร์</span>
            </button>
        </div>
    `;
    return card;
}

function renderEmptyState(container, filter = 'all') {
    let title = 'เงียบเหงาจัง...';
    let msg = 'ยังไม่พบโพสต์ใหม่ในขณะนี้ มาสร้างสีสันให้กับชุมชนด้วยการเริ่มแชร์ความคิดเห็นของคุณกันเถอะ!';
    let btnText = 'เริ่มบทสนทนาแรก';

    if (filter === 'groups') {
        title = 'ยังไม่มีกลุ่ม';
        msg = 'ยังไม่มีกลุ่มลับหรือสาธารณะที่สร้างโดยผู้ขายในขณะนี้ อดใจรอฟังข่าววสารการเปิดกลุ่มเร็วๆ นี้';
        btnText = 'สร้างกลุ่มของฉัน (เร็วๆ นี้)';
    } else if (filter === 'discussion') {
        title = 'ไม่มีประเด็นพูดคุย';
        msg = 'ขณะนี้ยังไม่มีหัวข้อการสนทนาที่กำลังร้อนแรง มาร่วมสร้างหัวข้อที่น่าสนใจกันเถอะ';
    }

    container.innerHTML = `
        <div class="empty-community-state animate__animated animate__fadeIn">
            <div class="empty-icon-circle">
                <i class="fas ${filter === 'groups' ? 'fa-users-slash' : (filter === 'discussion' ? 'fa-comments' : 'fa-comment-slash')}"></i>
            </div>
            <h5 class="text-white mb-2 fw-bold">${title}</h5>
            <p class="text-white-50 mb-4 px-4">${msg}</p>
            <button class="btn btn-primary rounded-pill px-5 py-2 fw-bold shadow-lg" onclick="openQuickPostModal()">
                <i class="fas fa-plus-circle me-2"></i> ${btnText}
            </button>
        </div>
    `;
}

// --- Modals Integration ---
function injectCommunityModals() {
    if (!document.getElementById('commentModal')) {
        const commentModalHtml = `
        <div class="modal fade" id="commentModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-bottom modal-dialog-scrollable">
                <div class="modal-content rounded-top-5 border-0" style="background: #1e293b; color: white; box-shadow: 0 -10px 40px rgba(0,0,0,0.5);">
                    <div class="modal-header border-0 pb-0 px-4 pt-4">
                        <div class="w-100 text-center position-relative">
                            <div style="width: 40px; height: 4px; background: rgba(255,255,255,0.2); border-radius: 2px; margin: 0 auto 15px;"></div>
                            <h5 class="modal-title fw-bold"><i class="fas fa-comments me-2 text-primary"></i>ความคิดเห็น <span id="commentCountTitle" class="badge bg-primary rounded-pill ms-2" style="font-size: 0.6em;">0</span></h5>
                            <button type="button" class="btn-close btn-close-white position-absolute end-0 top-0" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                    </div>
                    <div class="modal-body p-0">
                        <div id="commentList" class="p-4" style="min-height: 250px;"></div>
                    </div>
                    <div class="modal-footer border-top border-secondary border-opacity-25 p-3" style="background: #0f172a;">
                        <div class="d-flex w-100 align-items-center gap-3">
                            <img src="${getUserAvatar()}" id="commentUserAvatar" class="rounded-circle border border-secondary" width="38" height="38" style="object-fit:cover;">
                            <div class="input-group">
                                <input type="text" id="commentInput" class="form-control rounded-pill bg-dark bg-opacity-50 text-white border-secondary px-3" placeholder="ตอบกลับสังคมที่นี่..." onkeypress="if(event.key==='Enter') submitComment()">
                                <button class="btn btn-primary rounded-circle ms-1 p-0 shadow-sm" type="button" onclick="submitComment()" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
                                    <i class="fas fa-arrow-up"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', commentModalHtml);
    }
    
    // Ensure window.commentModal is instantiated if not already
    const modalEl = document.getElementById('commentModal');
    if (modalEl && !window.commentModal) {
        window.commentModal = new bootstrap.Modal(modalEl);
    }

    if (!document.getElementById('quickPostModal')) {
        const quickPostHtml = `
        <div class="modal fade" id="quickPostModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content border-0 shadow-2xl" style="background: #111827; color: white; border-radius: 24px; overflow: hidden;">
                    <div class="modal-header border-bottom border-light border-opacity-10 px-4 py-3">
                        <h5 class="modal-title fw-bold"><i class="fas fa-pencil-alt me-2 text-primary"></i>สร้างโพสต์คุณภาพ</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body px-4 pt-4">
                        <div class="d-flex gap-3 mb-4">
                            <img id="quickPostAvatar" src="${getUserAvatar()}" class="rounded-circle ring ring-primary ring-opacity-20" width="48" height="48" style="object-fit: cover;">
                            <div>
                                <h6 id="quickPostName" class="mb-0 fw-bold">${getUserDisplayName()}</h6>
                                <div class="badge bg-secondary bg-opacity-20 text-white-50 px-3 mt-1 rounded-pill" style="font-size: 0.65rem;">📍 สาธารณะ</div>
                            </div>
                        </div>
                        <input type="text" id="quickPostTitle" class="form-control bg-dark bg-opacity-50 text-white border-0 py-2 mb-3" placeholder="ระบุหัวข้อที่น่าสนใจ..." style="border-radius: 12px; font-weight: 600;">
                        <textarea id="quickPostContent" class="form-control bg-dark bg-opacity-50 text-white border-0 py-3" rows="6" placeholder="เล่าเรื่องราวที่คุณอยากแชร์..." style="border-radius: 12px; resize: none;"></textarea>
                        
                        <div class="mt-2 px-2 py-1 bg-warning bg-opacity-10 border border-warning border-opacity-20 rounded-pill d-inline-flex align-items-center" style="font-size: 0.65rem; color: #fbbf24;">
                            <i class="fas fa-gavel me-1"></i> กฏชุมชน: ห้ามคำหยาบ / สิ่งผิดกฏหมาย / ไม่ยุ่งเกี่ยวกับสถาบัน
                        </div>
                        
                        <div id="quickPostImagePreview" class="mt-4 position-relative d-none animate__animated animate__zoomIn">
                            <img src="" class="w-100 rounded-3 shadow-lg" style="max-height: 250px; object-fit: contain; background: #000;">
                            <button class="btn btn-sm btn-danger rounded-circle position-absolute top-0 end-0 m-2 shadow-lg" onclick="clearQuickPostImage()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                    <div class="modal-footer border-top border-light border-opacity-10 px-4 py-3 justify-content-between">
                        <div class="d-flex gap-3">
                            <input type="file" id="quickPostFile" accept="image/*,video/*" class="d-none" onchange="handleQuickPostImage(this)">
                            <button class="btn btn-dark rounded-circle" style="width: 45px; height: 45px;" onclick="document.getElementById('quickPostFile').click()">
                                <i class="fas fa-image text-primary"></i>
                            </button>
                            <button class="btn btn-dark rounded-circle" style="width: 45px; height: 45px;" onclick="startVoiceInputForPost()">
                                <i class="fas fa-microphone text-danger"></i>
                            </button>
                            <button class="btn btn-dark rounded-circle" style="width: 45px; height: 45px;" onclick="tryAiAssist()">
                                <i class="fas fa-magic text-warning"></i>
                            </button>
                        </div>
                        <button class="btn btn-primary rounded-pill px-5 py-2 fw-bold shadow-lg" onclick="submitQuickPost()">เผยแพร่</button>
                    </div>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', quickPostHtml);
        window.quickPostModal = new bootstrap.Modal(document.getElementById('quickPostModal'));
    }
}

// --- Helper & Utility ---
function getUser() {
    if (typeof WizmobizAuth !== 'undefined' && WizmobizAuth.isLoggedIn()) return WizmobizAuth.getUser();
    if (firebase.auth().currentUser) return firebase.auth().currentUser;
    return null;
}

function getUserAvatar() {
    const u = getUser();
    return u?.pictureUrl || u?.photoURL || 'assets/images/logo.png';
}

function getUserDisplayName() {
    const u = getUser();
    return u?.displayName || u?.name || 'Guest User';
}

function isPostLiked(postId) {
    const likes = JSON.parse(localStorage.getItem('tuktuk_liked_posts') || '[]');
    return likes.includes(postId);
}

function escapeHtml(text) {
    if (!text) return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.toString().replace(/[&<>"']/g, m => map[m]);
}

function formatContent(text) {
    if (!text) return '';
    // Simple autolinker
    const urlPattern = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    return escapeHtml(text)
        .replace(urlPattern, '<a href="$1" target="_blank" style="color: var(--google-blue); text-decoration: none;">$1</a>')
        .replace(/\n/g, '<br>');
}

// --- Interaction Actions ---
function openQuickPostModal() {
    if (!getUser()) {
        if (typeof WizmobizAuth !== 'undefined') WizmobizAuth.showLoginModal();
        else alert("🔒 คุณต้องเข้าสู่ระบบเพื่อใช้งานฟีเจอร์นี้");
        return;
    }

    document.getElementById('quickPostTitle').value = '';
    document.getElementById('quickPostContent').value = '';
    clearQuickPostImage();
    window.quickPostModal.show();
}

function handleQuickPostImage(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = e => {
            const preview = document.getElementById('quickPostImagePreview');
            preview.classList.remove('d-none');
            preview.querySelector('img').src = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function clearQuickPostImage() {
    const preview = document.getElementById('quickPostImagePreview');
    preview.classList.add('d-none');
    document.getElementById('quickPostFile').value = '';
}

async function submitQuickPost() {
    const content = document.getElementById('quickPostContent').value.trim();
    const title = document.getElementById('quickPostTitle').value.trim();
    const file = document.getElementById('quickPostFile').files[0];

    if (!content && !file) return showToast('กรุณาระบุเนื้อหาหรือเลือกสื่อ', 'warning');

    const btn = document.querySelector('#quickPostModal .btn-primary');
    btn.disabled = true;
    // Content Moderation System
    if (typeof containsProfanity === 'function') {
        const hasBadWords = containsProfanity(content) || (title && containsProfanity(title));
        if (hasBadWords) {
            showToast('⚠️ เนื้อหาขัดต่อกฏการใช้งาน (ห้ามคำหยาบ/สิ่งผิดกฏหมาย/สถาบัน)', 'error');
            alert('🚫 ไม่สามารถเผยแพร่ได้: เนื้อหามีคำที่ไม่เหมาะสม หรือขัดต่อกฏการใช้งานชุมชน\n- ห้ามใช้คำหยาบคาย\n- ห้ามเกี่ยวข้องกับสถาบันฯ\n- ห้ามสิ่งผิดกฎหมายและการพนัน');
            btn.disabled = false;
            btn.textContent = 'เผยแพร่';
            return;
        }
    }

    try {
        const user = getUser();
        if (!user) {
            showToast('🔒 กรุณาเข้าสู่ระบบก่อนเผยแพร่โพสต์', 'warning');
            if (typeof WizmobizAuth !== 'undefined') WizmobizAuth.showLoginModal();
            return;
        }

        let imageUrl = null;
        if (file) {
            // Use R2 for uploads instead of Firebase Storage
            if (typeof uploadToR2 === 'function') {
                showToast('🚀 กำลังอัปโหลดสื่อไปที่ R2...', 'info');
                imageUrl = await uploadToR2(file, 'community', (pct) => {
                    // Optional: update progress UI if available
                    console.log(`Upload progress: ${pct}%`);
                });
            } else {
                // Fallback to Firebase if R2 helper isn't loaded
                const storage = firebase.storage();
                const ref = storage.ref(`community/${Date.now()}_${file.name}`);
                await ref.put(file);
                imageUrl = await ref.getDownloadURL();
            }
        }

        if (typeof db === 'undefined') {
            throw new Error('Database connection not ready');
        }

        await db.collection('community_posts').add({
            title,
            content,
            imageUrl,
            images: imageUrl ? [imageUrl] : [],
            authorId: user.uid || user.lineUserId,
            authorName: getUserDisplayName(),
            authorAvatar: getUserAvatar(),
            likes: 0,
            commentsCount: 0,
            category: 'general',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        window.quickPostModal.hide();
        showToast('🚀 เผยแพร่โพสต์ของคุณแล้ว!', 'success');
    } catch (e) {
        console.error(e);
        showToast('เกิดข้อผิดพลาดในการโหลดข้อมูล', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'เผยแพร่';
    }
}

function likeCommunityPost(btn, postId) {
    const likes = JSON.parse(localStorage.getItem('tuktuk_liked_posts') || '[]');
    const isLiked = likes.includes(postId);
    const countEl = btn.querySelector('span');
    let currentCount = parseInt(countEl.textContent || 0);

    if (isLiked) {
        localStorage.setItem('tuktuk_liked_posts', JSON.stringify(likes.filter(id => id !== postId)));
        btn.classList.remove('liked', 'animate__pulse');
        btn.querySelector('i').className = 'far fa-thumbs-up';
        currentCount = Math.max(0, currentCount - 1);
        db.collection('community_posts').doc(postId).update({ likes: firebase.firestore.FieldValue.increment(-1) });
    } else {
        localStorage.setItem('tuktuk_liked_posts', JSON.stringify([...likes, postId]));
        btn.classList.add('liked', 'animate__pulse');
        btn.querySelector('i').className = 'fas fa-thumbs-up';
        currentCount++;
        db.collection('community_posts').doc(postId).update({ likes: firebase.firestore.FieldValue.increment(1) });
    }
    countEl.textContent = currentCount;
}

function shareCommunityPost(postId, text) {
    const url = `${location.origin}/?post=${postId}`;
    // Track share count (fire & forget)
    if (window.db) {
        window.db.collection('community_posts').doc(postId).update({
            shareCount: firebase.firestore.FieldValue.increment(1)
        }).catch(() => {});
    }
    if (window.TukTukNotify && window.TukTukNotify.sharePost) {
        window.TukTukNotify.sharePost({ id: postId, text: text });
    } else if (navigator.share) {
        navigator.share({ title: 'TukTuk Thailand', text: text, url: url }).catch(() => {});
    } else {
        navigator.clipboard.writeText(url).then(() => {
            if (typeof showToast === 'function') showToast('📋 คัดลอกลิงก์แล้ว!', 'success');
        }).catch(() => {});
    }
}

// --- Voice & AI Placeholders ---
function startVoiceInput() {
    showToast('🎙️ กำลังเรียกใช้งานระบบจดจำเสียง...', 'primary');
    // Implement actual Web Speech API here if needed
}

async function tryAiAssist() {
    const titleEl = document.getElementById('quickPostTitle');
    const contentEl = document.getElementById('quickPostContent');
    if (!titleEl || !contentEl) return;

    const title = titleEl.value.trim();
    const content = contentEl.value.trim();

    if (!title && !content) {
        showToast('💡 กรุณาระบุหัวข้อหรือเนื้อหาก่อนใช้ AI ช่วยเขียน', 'warning');
        return;
    }

    // Show processing state
    const aiBtn = document.querySelector('#quickPostModal .btn-dark i.fa-magic').parentElement;
    const originalHtml = aiBtn.innerHTML;
    aiBtn.innerHTML = '<i class="fas fa-spinner fa-spin text-warning"></i>';
    aiBtn.disabled = true;

    showToast('🤖 AI กำลังประมวลผลความคิดสร้างสรรค์...', 'info');

    try {
        // Reuse the global callAiContentAssist from index.html (it should be available globally)
        // Default to 'refine' mode for general assistant
        if (typeof callAiContentAssist !== 'function') {
            throw new Error('AI Service not ready. Please try again.');
        }

        const result = await callAiContentAssist('refine', title, content, 'community');

        if (result.success) {
            if (result.title) titleEl.value = result.title;
            if (result.content) {
                // Remove HTML tags for the textarea
                contentEl.value = result.content.replace(/<[^>]*>/g, '').trim();
            }
            showToast('✨ AI ช่วยเขียนเสร็จแล้ว!', 'success');
        } else {
            throw new Error(result.error || 'AI processing failed');
        }
    } catch (error) {
        console.error('AI Error:', error);
        if (error.message.includes('429') || error.message.includes('quota') || error.message.includes('limit')) {
            showToast('💎 โควตา AI ฟรีเต็มแล้ว โปรดลองอีกครั้งภายหลัง', 'error');
            alert('💎 ขออภัยครับ โควตา AI สำหรับรุ่นทดลองใช้ฟรีเต็มแล้ว\n\nโปรดรอสักครู่แล้วลองใหม่ หรืออัปเกรดเป็น Premium เพื่อใช้งานได้ไม่จำกัดครับ');
        } else {
            showToast('❌ AI Error: ' + error.message, 'error');
        }
    } finally {
        aiBtn.innerHTML = originalHtml;
        aiBtn.disabled = false;
    }
}

window.openComments = function(postId) {
    // Safety check: Ensure modal elements exist (Use standard ID 'commentList')
    let commentsListElement = document.getElementById('commentList');
    
    if (!commentsListElement) {
        console.warn('Comments modal div missing, re-checking modal...');
        const modalEl = document.getElementById('commentModal');
        if (!modalEl) {
            console.warn('Comment modal completely missing, re-injecting...');
            injectCommunityModals();
            commentsListElement = document.getElementById('commentList');
        }
    }

    if (!commentsListElement) {
        console.error('Failed to initialize comments modal.');
        // Fallback alert for user
        if (typeof showToast === 'function') showToast('ระบบความเห็นขัดข้อง', 'error');
        return;
    }

    window.currentCommentPostId = postId;
    commentsListElement.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>';

    // Ensure Bootstrap modal instance exists and is assigned to window
    if (!window.commentModal) {
        const modalEl = document.getElementById('commentModal');
        if (modalEl) window.commentModal = new bootstrap.Modal(modalEl);
    }

    if (window.commentModal) window.commentModal.show();

    if (window.commentsUnsubscribe) window.commentsUnsubscribe();
    window.commentsUnsubscribe = db.collection('community_posts').doc(postId).collection('comments')
        .orderBy('createdAt', 'desc')
        .onSnapshot(snap => {
            const list = document.getElementById('commentList');
            const badge = document.getElementById('commentCountTitle');
            if (badge) {
                // Handle different label formats
                if (badge.tagName === 'SPAN') badge.textContent = snap.size;
                else badge.textContent = `ความคิดเห็น (${snap.size})`;
            }

            if (snap.empty) {
                list.innerHTML = `<div class="text-center text-white-50 py-5"><i class="far fa-comment-dots fa-3x mb-3"></i><p>ยังไม่มีความคิดเห็น มาฉลองกันเลย!</p></div>`;
                return;
            }

            let html = '';
            snap.forEach(doc => {
                const c = doc.data();
                html += `
                    <div class="d-flex gap-3 mb-4 animate__animated animate__fadeIn">
                        <img src="${c.authorAvatar}" class="rounded-circle border border-secondary" width="35" height="35" style="object-fit:cover;">
                        <div class="flex-grow-1">
                            <div class="bg-dark bg-opacity-25 rounded-4 p-3 border border-secondary border-opacity-10">
                                <div class="d-flex justify-content-between">
                                    <span class="fw-bold text-white small">${escapeHtml(c.authorName)}</span>
                                    <span class="text-white-50" style="font-size:0.65rem;">${c.createdAt ? new Date(c.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                                </div>
                                <div class="text-light mt-1" style="font-size: 0.9rem;">${escapeHtml(c.text)}</div>
                            </div>
                        </div>
                    </div>
                `;
            });
            list.innerHTML = html;
        });
}

async function submitComment() {
    const input = document.getElementById('commentInput');
    const text = input.value.trim();
    if (!text || !window.currentCommentPostId) return;

    // 🛡️ Content Moderation
    if (typeof containsProfanity === 'function' && containsProfanity(text)) {
        showToast('⚠️ ความเห็นของคุณมีคำที่ไม่เหมาะสม', 'error');
        return;
    }

    const user = getUser();
    if (!user) return WizmobizAuth.showLoginModal();

    input.value = '';
    await db.collection('community_posts').doc(window.currentCommentPostId).collection('comments').add({
        text,
        authorId: user.uid || user.lineUserId,
        authorName: getUserDisplayName(),
        authorAvatar: getUserAvatar(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    db.collection('community_posts').doc(window.currentCommentPostId).update({ commentsCount: firebase.firestore.FieldValue.increment(1) });
}

// Ensure functions are globally accessible and override older versions
window.openComments = openComments;
window.submitComment = submitComment;
window.likeCommunityPost = likeCommunityPost;
window.shareCommunityPost = shareCommunityPost;
window.openQuickPostModal = openQuickPostModal;
window.injectCommunityModals = injectCommunityModals;
