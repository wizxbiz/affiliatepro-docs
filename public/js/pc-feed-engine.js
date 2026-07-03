/**
 * 🖥️ PC Social Feed Engine 4.0
 * Improvements over v3:
 *  - Unified rich card renderer (product / news / post types)
 *  - Infinite scroll via IntersectionObserver (no Load More button)
 *  - Real-time "new posts" banner via onSnapshot
 *  - News sidebar queries news_feed collection (no duplicate with main feed)
 *  - Contacts: recent active users with lastSeen fallback
 *  - Suggested users "Who to Follow" widget
 *  - Stories loaded from real Firestore authors
 *  - toggleLike uses showToast (no alert)
 */

(function () {
    'use strict';

    /* ─── State ──────────────────────────────────────────────── */
    let _pcLastDoc        = null;
    let _pcLoading        = false;
    let _pcEnded          = false;
    let _currentUserId    = null;
    let _userLikedIds     = [];
    let _realtimeUnsub    = null;
    let _sentinelObserver = null;
    let _newPostsCount    = 0;
    let _latestPostTs     = null;

    /* ─── Expose entry point ─────────────────────────────────── */
    window.pcEngine = {
        loadData() {
            _getUserData();
            _loadUserLikes();
            _setupNotificationBadges();
            _initSearch();
            _buildStoriesFromFirestore();
        },
        renderGrid(container, items, append = false) {
            if (!container) return;
            if (!append) container.innerHTML = '';
            items.forEach(item => {
                container.appendChild(createPostCard(item));
            });
            _setupSentinel(container);
        },
        createPostCard: function(item) {
            return createPostCard(item);
        }
    };

    /* ─── Helpers ────────────────────────────────────────────── */
    function _esc(s) {
        if (!s) return '';
        const d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }

    function _fmtTime(ts) {
        if (!ts) return '';
        const d    = ts.toDate ? ts.toDate() : new Date(ts);
        const diff = Math.floor((Date.now() - d) / 1000);
        if (diff < 60)     return 'เพิ่งโพสต์';
        if (diff < 3600)   return Math.floor(diff / 60) + ' นาทีที่แล้ว';
        if (diff < 86400)  return Math.floor(diff / 3600) + ' ชั่วโมงที่แล้ว';
        if (diff < 604800) return Math.floor(diff / 86400) + ' วันที่แล้ว';
        return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
    }

    function _toast(msg, type) {
        if (typeof showToast === 'function')          showToast(msg, type || 'info');
        else if (typeof showFeedToast === 'function') showFeedToast(msg, type || 'info');
    }

    /* ─── User Data ──────────────────────────────────────────── */
    function _getUserData() {
        try {
            if (typeof WizmobizAuth !== 'undefined') {
                const user = WizmobizAuth.getUser();
                if (user) {
                    _currentUserId         = user.uid || user.lineUserId;
                    window.currentUserId   = _currentUserId;
                    window.currentUserName = user.displayName || user.name || 'โปรไฟล์ของคุณ';
                    _updateProfileImages(user);
                }
            }
        } catch (e) { console.warn('[pcEngine] getUserData:', e); }
    }

    function _updateProfileImages(user) {
        const avatar = user?.pictureUrl || user?.photoURL || 'assets/images/logo.png';
        const name   = user?.displayName || user?.name || 'โปรไฟล์ของคุณ';
        ['pcTopProfileImg','pcProfileImg','pcCreateAvatar','drawerAvatar'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.src = avatar;
        });
        const nameEl = document.getElementById('pcProfileName');
        if (nameEl) nameEl.textContent = name;
        const phEl = document.getElementById('pcCreateInputPlaceholder');
        if (phEl && name && name !== 'โปรไฟล์ของคุณ') {
            phEl.textContent = `คุณมีไอเดียอะไรอยู่ ${name.split(' ')[0]} ?`;
        }
    }

    function _loadUserLikes() {
        try {
            const raw = localStorage.getItem('tuktuk_liked_posts');
            if (raw) { _userLikedIds = JSON.parse(raw); window.userLikedIds = _userLikedIds; }
        } catch (_) {}
    }

    /* ─── CARD RENDERER ─────────────────────────────────────── */
    const TYPE_META = {
        product  : { icon: 'fa-shopping-bag', color: '#facc15', bg: 'rgba(250,204,21,0.12)', label: 'สินค้า'    },
        news     : { icon: 'fa-newspaper',    color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'ข่าวสาร'   },
        video    : { icon: 'fa-play-circle',  color: '#6366f1', bg: 'rgba(99,102,241,0.12)', label: 'วิดีโอ'    },
        update   : { icon: 'fa-bolt',         color: '#f97316', bg: 'rgba(249,115,22,0.12)', label: 'อัปเดต'    },
        tip      : { icon: 'fa-lightbulb',    color: '#a855f7', bg: 'rgba(168,85,247,0.12)', label: 'เคล็ดลับ'  },
        event    : { icon: 'fa-calendar-alt', color: '#22d3ee', bg: 'rgba(34,211,238,0.12)', label: 'กิจกรรม'   },
        promo    : { icon: 'fa-rocket',       color: '#f43f5e', bg: 'rgba(244,63,94,0.12)',  label: 'โปรโมชั่น' },
        community: { icon: 'fa-users',        color: '#ec4899', bg: 'rgba(236,72,153,0.12)', label: 'ชุมชน'     },
    };

    function _typeBadge(type) {
        const m = TYPE_META[type] || { icon: 'fa-file-alt', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', label: (type || 'โพสต์').toUpperCase() };
        return `<span class="pc4-type-badge" style="background:${m.bg};color:${m.color};border:1px solid ${m.color}33;"><i class="fas ${m.icon}"></i>${m.label}</span>`;
    }

    function _normalize(post) {
        // Handle both Firestore raw data and normalized items from Go/Mobile logic
        const p = { ...post };
        p.id      = post.id || post._id || (typeof post.id === 'string' ? post.id : null);
        p.title   = post.title   || post.displayTitle || post.productTitle || post.name || '';
        p.content = post.content || post.displayDesc  || post.description || post.text || post.detail || '';
        p.author  = post.displayAuthor || post.authorName || post.sellerName || 'สมาชิก TukTuk';
        p.avatar  = post.authorAvatar || post.authorPhotoURL || post.sellerAvatar || 'assets/images/logo.png';
        p.aid     = post.authorId || post.sellerId || '';
        
        // Media mapping
        p.videoUrl = post.videoUrl || post.displayVideo || post.video_url || null;
        p.imageUrl = post.imageUrl || post.displayImage || post.image || post.thumbnail || post.videoThumbnail || post.displayThumbnail || null;
        
        // Handle images array
        if (!p.videoUrl && Array.isArray(post.images)) {
             const v = post.images.find(m => {
                 const u = (typeof m === 'string' ? m : m.url || '').toLowerCase();
                 return u.endsWith('.mp4') || u.endsWith('.mov') || u.endsWith('.webm');
             });
             if (v) p.videoUrl = typeof v === 'string' ? v : v.url;
        }
        if (!p.imageUrl && Array.isArray(post.images)) {
             const img = post.images.find(m => {
                 const u = (typeof m === 'string' ? m : m.url || '').toLowerCase();
                 return !u.endsWith('.mp4') && !u.endsWith('.mov') && !u.endsWith('.webm');
             });
             if (img) p.imageUrl = typeof img === 'string' ? img : img.url;
        }

        p.price   = post.price || post.displayPrice || null;
        p.likes   = post.likes || post.likeCount || 0;
        p.cmts    = post.comments || post.commentCount || 0;
        p.views   = post.views || post.viewCount || 0;
        p.time    = post.createdAt ? (typeof formatTimeAgo === 'function' ? formatTimeAgo(post.createdAt) : 'เมื่อสักครู่') : 'เมื่อสักครู่';
        
        return p;
    }

    function _mediaBlock(post) {
        const p = _normalize(post);
        if (post.youtubeUrl || post.youtube_url) {
            const url = post.youtubeUrl || post.youtube_url;
            const ytId = (url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=))([\w-]{11})/) || [])[1];
            if (ytId) return `<div class="pc4-media"><iframe src="https://www.youtube.com/embed/${ytId}?autoplay=0&mute=1&modestbranding=1" allow="autoplay;encrypted-media" allowfullscreen loading="lazy"></iframe></div>`;
        }
        
        if (p.videoUrl) {
            const posterAttr = p.imageUrl ? `poster="${p.imageUrl}"` : '';
            return `<div class="pc4-media"><video src="${p.videoUrl}" controls muted loop playsinline preload="auto" ${posterAttr} style="background:#000;"></video></div>`;
        }

        if (!p.imageUrl && (!post.images || !post.images.length)) return '';
        
        const urls = Array.isArray(post.images) 
            ? post.images.map(i => (typeof i === 'object' ? i.url : i)).filter(u => u && !u.toLowerCase().endsWith('.mp4'))
            : [p.imageUrl].filter(Boolean);

        if (urls.length === 1) {
            return `<div class="pc4-media single" onclick="window.location.href='channel.html?postId=${_esc(p.id)}'">
                        <img src="${urls[0]}" loading="lazy" onerror="this.closest('.pc4-media').style.display='none'">
                    </div>`;
        }
        if (urls.length === 0) return '';

        const cnt = Math.min(urls.length, 4);
        let g = `<div class="pc4-media-grid grid-${cnt}">`;
        urls.slice(0, cnt).forEach((u, i) => {
            const more = (i === 3 && urls.length > 4) ? `<div class="pc4-media-more">+${urls.length - 4}</div>` : '';
            g += `<div class="pc4-media-cell">${more}<img src="${u}" loading="lazy" onerror="this.closest('.pc4-media-cell').style.display='none'"></div>`;
        });
        return g + '</div>';
    }

    function _productPanel(post) {
        if (!post.price && !post.productName) return '';
        const price = post.price ? `฿${Number(post.price).toLocaleString()}` : '';
        const stars = post.rating ? Math.round(Math.min(post.rating, 5)) : 0;
        const starsHtml = stars > 0
            ? Array.from({length:5}, (_,i) => `<i class="fas fa-star" style="font-size:11px;color:${i<stars?'#facc15':'#d1d5db'};"></i>`).join('')
              + `<span style="font-size:11px;color:#6b7280;margin-left:4px;">(${post.rating.toFixed(1)})</span>`
            : '';
        const stock = post.stock > 0 ? `<span class="pc4-stock-badge"><i class="fas fa-check-circle"></i> มีสินค้า</span>` : '';
        return `
            <div class="pc4-product-panel">
                <div class="pc4-product-price">${price}</div>
                ${starsHtml ? `<div class="pc4-product-stars">${starsHtml}</div>` : ''}
                ${stock}
                <button class="pc4-buy-btn" onclick="event.stopPropagation();window.location.href='marketplace.html?product=${_esc(post.id)}'">
                    <i class="fas fa-shopping-cart"></i> สั่งซื้อเลย
                </button>
            </div>`;
    }

    function createPostCard(post) {
        const p = _normalize(post);
        const isLiked  = _userLikedIds.includes(p.id);
        const likedCls = isLiked ? 'liked' : '';
        const liIcon   = isLiked ? 'fas' : 'far';

        const card = document.createElement('div');
        card.className = 'pc4-card';
        card.id = `ppc-${p.id}`;

        card.innerHTML = `
            <div class="pc4-header">
                <div class="pc4-avatar-wrap" onclick="window.location.href='channel.html?userId=${p.aid}'">
                    <img class="pc4-avatar" src="${p.avatar}" onerror="this.src='assets/images/logo.png'">
                    ${post.isOnline ? '<div class="pc4-online-dot"></div>' : ''}
                </div>
                <div class="pc4-meta">
                    <div class="pc4-author-row">
                        <a class="pc4-author" href="channel.html?userId=${p.aid}">${p.author}</a>
                        ${post.verified || post.isVerified ? '<i class="fas fa-check-circle pc4-verified"></i>' : ''}
                        ${_typeBadge(p.type)}
                    </div>
                    <div class="pc4-time"><i class="far fa-clock"></i> ${p.time} ${post.sellerProvince ? `<span class="pc4-loc">• <i class="fas fa-map-marker-alt"></i> ${post.sellerProvince}</span>` : ''}</div>
                </div>
                <button class="pc4-more" onclick="window.pcTogglePostMenu('${p.id}', event)">
                    <i class="fas fa-ellipsis-h"></i>
                </button>
            </div>
            <div class="pc4-body">
                ${p.title ? `<div class="pc4-title">${p.title}</div>` : ''}
                ${p.content ? `<div class="pc4-content">${p.content}</div>` : ''}
            </div>

            ${_mediaBlock(post)}
            ${p.type === 'product' ? _productPanel(post) : ''}

            <div class="pc4-stats">
                <div class="pc4-stats-left">
                    <div class="pc4-react-icon"><i class="fas fa-thumbs-up"></i></div>
                    <span class="pc4-stat-likes">${p.likes.toLocaleString()} ถูกใจ</span>
                </div>
                <div class="pc4-stats-right">
                    <span class="pc4-stat-item" onclick="if(window.openComments)window.openComments('${p.id}')">
                        <i class="fas fa-comment"></i> ${p.cmts.toLocaleString()}
                    </span>
                    <span class="pc4-stat-item"><i class="fas fa-eye"></i> ${p.views.toLocaleString()}</span>
                </div>
            </div>

            <div class="pc4-divider"></div>

            <div class="pc4-actions">
                <button class="pc4-action-btn ${likedCls} like-btn-${p.id}"
                        onclick="event.stopPropagation();window.pcToggleLike('${p.id}',this)">
                    <i class="${liIcon} fa-thumbs-up"></i> ถูกใจ
                </button>
                <button class="pc4-action-btn"
                        onclick="event.stopPropagation();if(window.openComments)window.openComments('${p.id}');else window.location.href='channel.html?postId=${p.id}'">
                    <i class="far fa-comment-dots"></i> ความเห็น
                </button>
                <button class="pc4-action-btn"
                        onclick="event.stopPropagation();if(window.sharePost)window.sharePost('${p.id}')">
                    <i class="fas fa-share-alt"></i> แชร์
                </button>
                <button class="pc4-action-btn primary" onclick="window.location.href='channel.html?postId=${p.id}'">
                    ${p.type === 'product' ? 'ซื้อเลย' : 'อ่านต่อ'} <i class="fas fa-chevron-right" style="font-size:9px;"></i>
                </button>
            </div>
        `;
        return card;
    }

    /* ─── Social Feed ────────────────────────────────────────── */
    window.pcLoadSocialFeed = async function (append = false) {
        if (_pcLoading) return;
        if (append && _pcEnded) return;
        _pcLoading = true;

        const container = document.getElementById('postsContainer');
        if (!container) { _pcLoading = false; return; }

        if (!append) {
            _pcLastDoc = null;
            _pcEnded   = false;
            _newPostsCount = 0;
            container.innerHTML = _genSkeletons(3);
            _stopRealtime();
        }

        try {
            let q = window.db.collection('posts')
                .orderBy('createdAt', 'desc')
                .limit(12);
            if (append && _pcLastDoc) q = q.startAfter(_pcLastDoc);

            const snap = await q.get();

            if (snap.empty && !append) {
                container.innerHTML = '<div class="pc4-empty"><i class="fas fa-rss fa-2x"></i><p>ยังไม่มีโพสต์ในขณะนี้</p></div>';
                _pcLoading = false;
                return;
            }

            _pcLastDoc = snap.docs[snap.docs.length - 1] || null;
            _pcEnded   = snap.docs.length < 12;

            if (!append) {
                const first = snap.docs[0];
                if (first) _latestPostTs = first.data().createdAt;
                container.innerHTML = '';
            }

            snap.docs.forEach(doc => {
                const p = { id: doc.id, ...doc.data() };
                if (p.status === 'draft' || p.status === 'scheduled') return;
                if (p.privacy === 'private') return;
                container.appendChild(createPostCard(p));
            });

            _setupSentinel(container);
            if (!append) _startRealtime();

        } catch (e) {
            console.warn('[pcEngine] feed:', e);
            if (!append) container.innerHTML = `
                <div class="pc4-empty error">
                    <i class="fas fa-exclamation-triangle fa-2x"></i>
                    <p>โหลดโพสต์ไม่สำเร็จ</p>
                    <button onclick="window.pcLoadSocialFeed()" style="margin-top:12px;padding:8px 20px;background:#6366f1;color:#fff;border:none;border-radius:20px;cursor:pointer;">ลองใหม่</button>
                </div>`;
        }
        _pcLoading = false;
    };

    /* ─── Infinite Scroll ────────────────────────────────────── */
    function _setupSentinel(container) {
        if (_sentinelObserver) { _sentinelObserver.disconnect(); _sentinelObserver = null; }
        if (_pcEnded) return;

        let s = document.getElementById('pcFeedSentinel');
        if (!s) { s = document.createElement('div'); s.id = 'pcFeedSentinel'; s.style.height = '10px'; }
        container.appendChild(s);

        _sentinelObserver = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) window.pcLoadSocialFeed(true);
        }, { threshold: 0.1 });
        _sentinelObserver.observe(s);
    }

    /* ─── Real-time New Posts Banner ─────────────────────────── */
    function _startRealtime() {
        if (!window.db || !_latestPostTs) return;
        _realtimeUnsub = window.db.collection('posts')
            .where('createdAt', '>', _latestPostTs)
            .onSnapshot(snap => {
                const n = snap.docs.filter(d => {
                    const s = d.data().status;
                    return s !== 'draft' && s !== 'scheduled';
                }).length;
                if (n > 0) {
                    _newPostsCount += n;
                    _showBanner(_newPostsCount);
                    const last = snap.docs[snap.docs.length - 1];
                    if (last) _latestPostTs = last.data().createdAt;
                }
            }, () => {});
    }

    function _stopRealtime() {
        if (_realtimeUnsub) { _realtimeUnsub(); _realtimeUnsub = null; }
        const b = document.getElementById('pcNewPostsBanner');
        if (b) b.remove();
        _newPostsCount = 0;
    }

    function _showBanner(count) {
        let b = document.getElementById('pcNewPostsBanner');
        if (!b) {
            b = document.createElement('div');
            b.id = 'pcNewPostsBanner';
            b.className = 'pc4-new-banner';
            b.onclick = () => { window.pcLoadSocialFeed(false); b.remove(); };
            const c = document.getElementById('postsContainer');
            if (c) c.parentNode.insertBefore(b, c);
        }
        b.innerHTML = `<i class="fas fa-arrow-up"></i> มีโพสต์ใหม่ ${count} รายการ — คลิกเพื่อรีเฟรช`;
    }

    /* ─── Skeletons ─────────────────────────────────────────── */
    function _genSkeletons(n) {
        let h = '';
        for (let i = 0; i < n; i++) {
            h += `<div class="pc4-skeleton-card">
                    <div style="display:flex;gap:12px;margin-bottom:14px;">
                        <div class="pc4-sk-circle"></div>
                        <div style="flex:1;">
                            <div class="pc4-sk-line" style="width:45%;margin-bottom:8px;"></div>
                            <div class="pc4-sk-line" style="width:28%;height:10px;"></div>
                        </div>
                    </div>
                    <div class="pc4-sk-line" style="margin-bottom:8px;"></div>
                    <div class="pc4-sk-line" style="width:80%;margin-bottom:12px;"></div>
                    <div class="pc4-sk-block"></div>
                    <div style="display:flex;gap:8px;margin-top:14px;">
                        <div class="pc4-sk-line" style="width:22%;height:32px;border-radius:8px;"></div>
                        <div class="pc4-sk-line" style="width:22%;height:32px;border-radius:8px;"></div>
                        <div class="pc4-sk-line" style="width:22%;height:32px;border-radius:8px;"></div>
                    </div>
                  </div>`;
        }
        return h;
    }

    /* ─── Like / Unlike ─────────────────────────────────────── */
    window.pcToggleLike = async function (postId, btn) {
        if (!_currentUserId) { _toast('กรุณาเข้าสู่ระบบก่อนกดถูกใจ', 'warning'); return; }
        try {
            const isLiked = btn.classList.contains('liked');
            const delta   = isLiked ? -1 : 1;

            btn.classList.toggle('liked', !isLiked);
            btn.querySelector('i').className = !isLiked ? 'fas fa-thumbs-up' : 'far fa-thumbs-up';
            btn.style.transform = 'scale(1.2)';
            setTimeout(() => { btn.style.transform = ''; }, 180);

            const card = document.getElementById(`ppc-${postId}`);
            if (card) {
                const el = card.querySelector('.pc4-stat-likes');
                if (el) {
                    const cur = parseInt(el.textContent.replace(/[^0-9]/g, '')) || 0;
                    el.textContent = (cur + delta).toLocaleString() + ' ถูกใจ';
                }
            }

            if (window.db) {
                const ref = window.db.collection('posts').doc(postId);
                await ref.update({
                    likes: firebase.firestore.FieldValue.increment(delta)
                });
            }

            if (!isLiked) { if (!_userLikedIds.includes(postId)) _userLikedIds.push(postId); }
            else { const i = _userLikedIds.indexOf(postId); if (i > -1) _userLikedIds.splice(i, 1); }
            localStorage.setItem('tuktuk_liked_posts', JSON.stringify(_userLikedIds));
            window.userLikedIds = _userLikedIds;

        } catch (e) { console.warn('[pcEngine] like:', e); }
    };

    // Back-compat alias
    window.toggleLike = window.pcToggleLike;

    /* ─── Stories from Firestore ─────────────────────────────── */
    window.pcLoadStories = async function () {
        const bar = document.getElementById('pcStoriesBar');
        if (!bar || !window.db) return;
        try {
            const snap = await window.db.collection('posts')
                .where('published', '==', true)
                .orderBy('createdAt', 'desc')
                .limit(15)
                .get();

            const seen = new Set();
            const users = [];
            snap.docs.forEach(doc => {
                const d = doc.data();
                if (d.authorId && !seen.has(d.authorId) && users.length < 8) {
                    seen.add(d.authorId);
                    users.push({ id: d.authorId, avatar: d.authorAvatar || d.authorPhotoURL || 'assets/images/logo.png', name: (d.authorName || 'ผู้ใช้').substring(0, 10), postId: doc.id });
                }
            });
            if (!users.length) return;

            bar.querySelectorAll('.story-item-v3.seed').forEach(el => el.remove());
            users.forEach(u => {
                const el = document.createElement('div');
                el.className = 'story-item-v3';
                el.innerHTML = `
                    <div style="position:relative;">
                        <div class="story-ring-v3 is-unread">
                            <img class="story-inner-v3" src="${_esc(u.avatar)}" onerror="this.src='assets/images/logo.png'"
                                 style="width:100%;height:100%;border-radius:50%;object-fit:cover;">
                        </div>
                    </div>
                    <span class="story-name-v3">${_esc(u.name)}</span>
                `;
                el.onclick = () => { window.location.href = `channel.html?postId=${u.postId}`; };
                bar.appendChild(el);
            });
        } catch (e) { console.warn('[pcEngine] stories:', e); }
    };

    /* ─── Sidebar: Trending Sellers ─────────────────────────── */
    window.pcLoadTrendingSellers = async function () {
        const el = document.getElementById('pcTrendingSellers');
        if (!el || !window.db) return;
        try {
            const snap = await window.db.collection('products')
                .where('status', '==', 'active')
                .orderBy('createdAt', 'desc')
                .limit(5)
                .get();

            if (snap.empty) { el.innerHTML = '<div class="pc4-sidebar-empty">ยังไม่มีสินค้า</div>'; return; }
            el.innerHTML = snap.docs.map(doc => {
                const d    = doc.data();
                const imgs = d.images || [];
                const img  = imgs.length ? (typeof imgs[0] === 'object' ? imgs[0].url : imgs[0]) : (d.imageUrl || 'assets/images/logo.png');
                const name = _esc((d.productName || 'สินค้า').substring(0, 32));
                const price= d.price ? `<span class="pc4-price">฿${Number(d.price).toLocaleString()}</span>` : '';
                const shop = _esc(d.shopName || d.sellerName || '');
                const sold = d.soldCount ? `<span class="pc4-sold">${d.soldCount} ขายแล้ว</span>` : '';
                return `
                    <div class="pc4-seller-row" onclick="window.location.href='marketplace.html?product=${doc.id}'">
                        <img class="pc4-seller-thumb" src="${img}" onerror="this.src='assets/images/logo.png'" loading="lazy">
                        <div class="pc4-seller-info">
                            <div class="pc4-seller-name">${name}</div>
                            <div class="pc4-seller-meta">${price}${shop ? ' · ' + shop : ''}${sold}</div>
                        </div>
                        <i class="fas fa-chevron-right pc4-seller-arrow"></i>
                    </div>`;
            }).join('');
        } catch (e) { el.innerHTML = '<div class="pc4-sidebar-empty">โหลดข้อมูลไม่สำเร็จ</div>'; }
    };

    /* ─── Sidebar: News (queries news_feed first) ────────────── */
    window.pcLoadNewsSection = async function () {
        const el = document.getElementById('pcNewsSection');
        if (!el || !window.db) return;
        try {
            const threshold = new Date(Date.now() - 72 * 3600 * 1000);
            let snap = await window.db.collection('news_feed')
                .where('createdAt', '>=', firebase.firestore.Timestamp.fromDate(threshold))
                .orderBy('createdAt', 'desc')
                .limit(5)
                .get();

            // Fallback: community_posts of type news
            if (snap.empty) {
                snap = await window.db.collection('posts')
                    .where('type', '==', 'news')
                    .orderBy('createdAt', 'desc')
                    .limit(5)
                    .get();
            }

            if (snap.empty) { el.innerHTML = '<div class="pc4-sidebar-empty">ยังไม่มีข่าวสาร</div>'; return; }

            el.innerHTML = snap.docs.map(doc => {
                const d     = doc.data();
                const title = _esc((d.title || d.headline || 'ไม่มีหัวข้อ').substring(0, 60));
                const time  = _fmtTime(d.createdAt);
                const imgs  = d.images || (d.imageUrl ? [d.imageUrl] : []);
                const img   = imgs.length ? (typeof imgs[0] === 'object' ? imgs[0].url : imgs[0]) : null;
                const src   = _esc(d.sourceName || d.source || '');
                const href  = d.link || `channel.html?postId=${doc.id}`;
                return `
                    <div class="pc4-news-item" onclick="window.location.href='${href}'">
                        ${img ? `<img src="${img}" class="pc4-news-thumb" onerror="this.style.display='none'" loading="lazy">` : ''}
                        <div class="pc4-news-body">
                            <div class="pc4-news-title">${title}</div>
                            <div class="pc4-news-meta">${src ? src + ' · ' : ''}<i class="far fa-clock"></i> ${time}</div>
                        </div>
                    </div>`;
            }).join('');
        } catch (e) { el.innerHTML = '<div class="pc4-sidebar-empty">โหลดข่าวไม่สำเร็จ</div>'; }
    };

    /* ─── Sidebar: Contacts (recent active users) ───────────── */
    window.pcLoadContacts = async function () {
        const el = document.getElementById('pcContactList');
        if (!el || !window.db) return;
        try {
            let snap;
            try {
                // Try users collection ordered by lastSeen
                snap = await window.db.collection('users').orderBy('lastSeen', 'desc').limit(6).get();
            } catch (_) {
                snap = { docs: [] };
            }

            // Fallback: derive unique users from recent posts
            if (!snap.docs.length) {
                const pSnap = await window.db.collection('posts').orderBy('createdAt', 'desc').limit(30).get();
                const seen  = new Set();
                const fake  = [];
                pSnap.docs.forEach(d => {
                    const p = d.data();
                    if (p.authorId && !seen.has(p.authorId) && fake.length < 6) {
                        seen.add(p.authorId);
                        fake.push({ id: p.authorId, data: () => ({ displayName: p.authorName, photoURL: p.authorAvatar || p.authorPhotoURL }) });
                    }
                });
                snap = { docs: fake };
            }

            if (!snap.docs.length) { el.innerHTML = '<div class="pc4-sidebar-empty">ไม่พบผู้ใช้</div>'; return; }

            el.innerHTML = snap.docs.map(doc => {
                const u      = doc.data();
                const avatar = u.photoURL || u.profileImage || u.pictureUrl || 'assets/images/logo.png';
                const name   = _esc(u.displayName || u.name || 'ผู้ใช้');
                const uid    = doc.id;
                const online = u.isOnline || (u.lastSeen?.toDate && (Date.now() - u.lastSeen.toDate() < 300000));
                return `
                    <div class="pc4-contact-row" onclick="window.pcStartChat('${uid}','${name.replace(/'/g,"\\'")}')">
                        <div style="position:relative;flex-shrink:0;">
                            <img class="pc4-contact-avatar" src="${avatar}" onerror="this.src='assets/images/logo.png'" loading="lazy">
                            ${online ? '<div class="pc4-contact-online"></div>' : ''}
                        </div>
                        <span class="pc4-contact-name">${name}</span>
                        <button class="pc4-contact-msg" onclick="event.stopPropagation();window.location.href='messages.html?uid=${uid}'" title="ส่งข้อความ">
                            <i class="fas fa-comment-dots"></i>
                        </button>
                    </div>`;
            }).join('');
        } catch (e) { el.innerHTML = '<div class="pc4-sidebar-empty">โหลดผู้ติดต่อไม่สำเร็จ</div>'; }
    };

    /* ─── Sidebar: Recommended Products ─────────────────────── */
    window.pcLoadRecommendedProducts = async function () {
        const el = document.getElementById('pcRecommendedProducts');
        if (!el || !window.db) return;
        try {
            const snap = await window.db.collection('products')
                .where('status', '==', 'active')
                .orderBy('createdAt', 'desc')
                .limit(4)
                .get();

            if (snap.empty) { el.innerHTML = '<div class="pc4-sidebar-empty">ยังไม่มีสินค้า</div>'; return; }

            let g = '<div class="pc4-product-grid">';
            snap.docs.forEach(doc => {
                const d    = doc.data();
                const imgs = d.images || [];
                const img  = imgs.length ? (typeof imgs[0] === 'object' ? imgs[0].url : imgs[0]) : (d.imageUrl || 'assets/images/logo.png');
                const name = _esc((d.productName || 'สินค้า').substring(0, 20));
                const price= d.price ? `฿${Number(d.price).toLocaleString()}` : '';
                g += `
                    <div class="pc4-product-cell" onclick="window.location.href='marketplace.html?product=${doc.id}'">
                        <div class="pc4-product-img-wrap"><img src="${img}" onerror="this.src='assets/images/logo.png'" loading="lazy"></div>
                        <div class="pc4-product-cell-name">${name}</div>
                        ${price ? `<div class="pc4-product-cell-price">${price}</div>` : ''}
                    </div>`;
            });
            el.innerHTML = g + '</div>';
        } catch (e) { el.innerHTML = '<div class="pc4-sidebar-empty">ยังไม่มีสินค้า</div>'; }
    };

    /* ─── Sidebar: Suggested Users (Who to Follow) ──────────── */
    window.pcLoadSuggestedUsers = async function () {
        const el = document.getElementById('pcSuggestedUsers');
        if (!el || !window.db) return;
        try {
            // ⚠️ Single-field orderBy only — remove where('published') to avoid
            //    FirebaseError: composite index required (published + likes).
            //    Sort by likes client-side from recent 50 posts instead.
            const snap = await window.db.collection('posts')
                .orderBy('createdAt', 'desc')
                .limit(50)
                .get();

            const seen  = new Set([_currentUserId].filter(Boolean));
            const users = [];
            const sorted = snap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .sort((a, b) => (b.likes || 0) - (a.likes || 0));

            sorted.forEach(p => {
                if (p.authorId && !seen.has(p.authorId) && users.length < 5) {
                    seen.add(p.authorId);
                    users.push({ id: p.authorId, name: p.authorName || 'สมาชิก TukTuk', avatar: p.authorAvatar || p.authorPhotoURL || 'assets/images/logo.png', likes: p.likes || 0 });
                }
            });

            if (!users.length) { el.closest?.('.pc-sidebar-card')?.remove(); return; }

            el.innerHTML = users.map(u => `
                <div class="pc4-suggest-row">
                    <img class="pc4-suggest-avatar" src="${_esc(u.avatar)}" onerror="this.src='assets/images/logo.png'"
                         onclick="window.location.href='channel.html?userId=${_esc(u.id)}'">
                    <div class="pc4-suggest-info" onclick="window.location.href='channel.html?userId=${_esc(u.id)}'">
                        <div class="pc4-suggest-name">${_esc(u.name)}</div>
                        <div class="pc4-suggest-meta"><i class="fas fa-heart" style="color:#f43f5e;font-size:10px;"></i> ${u.likes.toLocaleString()}</div>
                    </div>
                    <button class="pc4-follow-btn" onclick="event.stopPropagation();window._pcFollowUser('${_esc(u.id)}',this)">ติดตาม</button>
                </div>
            `).join('');
        } catch (e) { console.warn('[pcEngine] suggestedUsers:', e); }
    };

    window._pcFollowUser = function (userId, btn) {
        if (!_currentUserId) { _toast('กรุณาเข้าสู่ระบบก่อน', 'warning'); return; }
        btn.textContent  = 'ติดตามแล้ว';
        btn.classList.add('following');
        btn.disabled     = true;
        if (window.db) {
            window.db.collection('users').doc(_currentUserId).update({
                following: firebase.firestore.FieldValue.arrayUnion(userId)
            }).catch(() => {});
        }
        _toast('ติดตามแล้ว!', 'success');
    };

    /* ─── Notification Badges ────────────────────────────────── */
    function _setupNotificationBadges() {
        if (!window.db || !_currentUserId) return;
        window.db.collection('notifications')
            .where('recipientId', '==', _currentUserId)
            .where('read', '==', false)
            .onSnapshot(snap => {
                const n = snap.size;
                const badge = document.getElementById('pcNotifBadge');
                if (badge) { badge.textContent = n > 99 ? '99+' : n; badge.style.display = n > 0 ? 'flex' : 'none'; }
                ['pillBadge','pillBadgeExp','mhPillNotifBadge'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) { el.textContent = n; el.style.display = n > 0 ? 'flex' : 'none'; }
                });
            }, () => {});
    }

    /* ─── Search ─────────────────────────────────────────────── */
    function _initSearch() {
        const input = document.getElementById('pcSearchInput');
        const sugg  = document.getElementById('pcSearchSuggestions');
        if (!input || !sugg) return;
        let timer;
        input.addEventListener('input', () => {
            clearTimeout(timer);
            const q = input.value.trim();
            if (q.length < 2) { sugg.classList.remove('show'); return; }
            timer = setTimeout(async () => {
                try {
                    // ⚠️ Single-field orderBy only — no where() to avoid composite index requirement
                    const snap = await window.db.collection('posts')
                        .orderBy('title').startAt(q).endAt(q + '\uf8ff').limit(5).get();
                    if (snap.empty) { sugg.classList.remove('show'); return; }
                    sugg.innerHTML = snap.docs.map(d => {
                        const t = d.data().title;
                        return t ? `<div class="pc4-sugg-item" onclick="window.doSearch('${_esc(t)}')"><i class="fas fa-search"></i><span>${_esc(t)}</span></div>` : '';
                    }).join('');
                    sugg.classList.add('show');
                } catch (_) {}
            }, 300);
        });

        // Keyboard navigation for autocomplete suggestions
        input.addEventListener('keydown', e => {
            const items = sugg.querySelectorAll('.pc4-sugg-item');
            if (!sugg.classList.contains('show') || items.length === 0) return;

            let activeIdx = -1;
            items.forEach((item, idx) => {
                if (item.classList.contains('active')) {
                    activeIdx = idx;
                }
            });

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (activeIdx !== -1) items[activeIdx].classList.remove('active');
                activeIdx = (activeIdx + 1) % items.length;
                items[activeIdx].classList.add('active');
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (activeIdx !== -1) items[activeIdx].classList.remove('active');
                activeIdx = (activeIdx - 1 + items.length) % items.length;
                items[activeIdx].classList.add('active');
            } else if (e.key === 'Enter') {
                if (activeIdx !== -1) {
                    e.preventDefault();
                    items[activeIdx].click();
                }
            } else if (e.key === 'Escape') {
                sugg.classList.remove('show');
                input.blur();
            }
        });

        // Global hotkey '/' to focus search input (with form element exclusion)
        document.addEventListener('keydown', e => {
            if (e.key === '/') {
                const active = document.activeElement;
                if (active && (
                    active.tagName === 'INPUT' || 
                    active.tagName === 'TEXTAREA' || 
                    active.isContentEditable
                )) {
                    return; // Ignore when user is actively typing in a form field
                }
                e.preventDefault();
                input.focus();
                input.select();
            }
        });

        document.addEventListener('click', e => {
            if (!input.contains(e.target) && !sugg.contains(e.target)) sugg.classList.remove('show');
        });
    }

    window.doSearch = function (term) {
        const input = document.getElementById('pcSearchInput');
        if (input) input.value = term;
        const sugg = document.getElementById('pcSearchSuggestions');
        if (sugg) sugg.classList.remove('show');
        document.querySelectorAll('.pc4-card').forEach(card => {
            card.style.display = card.textContent.toLowerCase().includes(term.toLowerCase()) ? '' : 'none';
        });
    };

    /* ─── Utilities ─────────────────────────────────────────── */
    /* ─── Social Actions (Aliases) ──────────────────────────── */
    window.toggleLike = window.pcToggleLike;

    window.pcTogglePostMenu = function (postId, event) {
        event?.stopPropagation();
        const id = `pcmenu-${postId}`;
        let menu = document.getElementById(id);
        if (!menu) {
            menu = document.createElement('div');
            menu.id = id;
            menu.className = 'pc4-post-menu';
            menu.innerHTML = `
                <div class="pc4-menu-item" onclick="event.stopPropagation();if(window.sharePost)window.sharePost('${postId}')"><i class="fas fa-share"></i> แชร์โพสต์</div>
                <div class="pc4-menu-item" onclick="event.stopPropagation();if(window.copyLink)window.copyLink('${postId}')"><i class="fas fa-link"></i> คัดลอกลิงก์</div>
                <div class="pc4-menu-item danger" onclick="event.stopPropagation();_toast('รายงานแล้ว ขอบคุณ','success')"><i class="fas fa-flag"></i> รายงาน</div>
            `;
            const btn = event?.target?.closest('.pc4-more');
            if (btn) { btn.style.position = 'relative'; btn.appendChild(menu); }
        }
        menu.classList.toggle('show');
        setTimeout(() => {
            const close = () => { menu.classList.remove('show'); document.removeEventListener('click', close); };
            document.addEventListener('click', close);
        }, 0);
    };

    window.pcStartChat = function (userId) {
        if (!userId || userId === window.currentUserId) return;
        window.location.href = `messages.html?uid=${userId}`;
    };

    window.syncPCMenu = function (category, element) {
        document.querySelectorAll('.pc-menu-card').forEach(c => c.classList.remove('active'));
        if (element) element.classList.add('active');
    };

    window.setPCNav = function (key, element) {
        document.querySelectorAll('.pc-nav-icon').forEach(i => i.classList.remove('active'));
        if (element) element.classList.add('active');
    };

    /* ─── Stories init (waits for DB) ───────────────────────── */
    function _buildStoriesFromFirestore() {
        if (window.db) { window.pcLoadStories(); return; }
        let tries = 0;
        const t = setInterval(() => {
            if (window.db || ++tries > 20) { clearInterval(t); if (window.db) window.pcLoadStories(); }
        }, 300);
    }

})();
