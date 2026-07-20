/**
 * 🖥️ PC Social Feed Engine 5.0 — Firebase-Free Edition
 * ───────────────────────────────────────────────────────
 * All data sourced from Cloudflare Worker REST API (/api/v1/*)
 * NO Firebase / Firestore dependencies.
 * Improvements:
 *  - Unified rich card renderer (product / news / post types)
 *  - Cursor-based infinite scroll (IntersectionObserver)
 *  - Realtime "new posts" banner via polling (30s interval)
 *  - Like toggle via POST /api/v1/posts/:id/like
 *  - Sidebar: trending sellers, news, contacts, suggested users — all from D1
 */

(function () {
    'use strict';

    const API = (typeof window !== 'undefined' && window.TUKTUK_API_BASE)
        ? window.TUKTUK_API_BASE
        : 'https://tuktukfeed-api.imtthailand2019.workers.dev';

    /* ─── State ──────────────────────────────────────────────── */
    let _pcCursor         = null;   // last post id for cursor pagination
    let _pcLoading        = false;
    let _pcEnded          = false;
    let _currentUserId    = null;
    let _userLikedIds     = [];
    let _sentinelObserver = null;
    let _newPostsCount    = 0;
    let _latestPostTs     = null;   // ms timestamp for polling
    let _pollTimer        = null;

    /* ─── Expose entry point ─────────────────────────────────── */
    window.pcEngine = {
        loadData() {
            _getUserData();
            _loadUserLikes();
            _buildStoriesFromPosts();
        },
        renderGrid(container, items, append = false) {
            if (!container) return;
            if (!append) container.innerHTML = '';
            items.forEach(item => container.appendChild(createPostCard(item)));
            _setupSentinel(container);
        },
        createPostCard(item) { return createPostCard(item); }
    };

    /* ─── API helper ─────────────────────────────────────────── */
    async function _apiFetch(path, options = {}) {
        try {
            const r = await fetch(`${API}${path}`, {
                headers: { 'Content-Type': 'application/json' },
                ...options,
            });
            if (!r.ok) return null;
            return await r.json();
        } catch (e) {
            console.warn('[pcEngine] fetch error:', path, e.message);
            return null;
        }
    }

    function _authHeaders() {
        const token = localStorage.getItem('tuktuk_jwt') ||
                      localStorage.getItem('wizmobiz_token') ||
                      (() => { try { return JSON.parse(localStorage.getItem('tuktuk_session') || '{}').token; } catch(_) { return null; } })();
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }

    /* ─── Helpers ────────────────────────────────────────────── */
    function _esc(s) {
        if (!s) return '';
        const d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }

    function _fmtTime(ts) {
        if (!ts) return '';
        const d    = new Date(typeof ts === 'object' && ts.seconds ? ts.seconds * 1000 : ts);
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
        const m = TYPE_META[type] || { icon: 'fa-file-alt', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', label: (type || 'โพสต์') };
        return `<span class="pc4-type-badge" style="background:${m.bg};color:${m.color};border:1px solid ${m.color}33;"><i class="fas ${m.icon}"></i>${m.label}</span>`;
    }

    function _normalize(post) {
        const p = { ...post };
        p.id      = post.id || '';
        p.title   = post.title   || post.displayTitle || post.productTitle || post.name || '';
        p.content = post.content || post.displayDesc  || post.description || post.text || post.detail || '';
        p.author  = post.displayAuthor || post.authorName || post.display_name || post.sellerName || 'สมาชิก TukTuk';
        p.avatar  = post.authorAvatar || post.authorPhotoURL || post.picture_url || post.author_picture || 'assets/images/logo.png';
        p.aid     = post.authorId || post.userId || post.user_id || post.sellerId || '';
        
        const isDirectVideoUrl = (url) => /\.(mp4|webm|mov|m4v|m3u8|avi|mkv)(\?|$)/i.test(url || '') || /youtube\.com|youtu\.be/i.test(url || '');
        p.type    = post.type || post.category || (isDirectVideoUrl(post.videoUrl || post.displayVideo || post.video_url) ? 'video' : 'post');

        // Media mapping — v1 API returns media as array of {type, url} objects
        const mediaArr = Array.isArray(post.media) ? post.media
                       : Array.isArray(post.mediaUrls) ? post.mediaUrls
                       : [];
        
        // Clean up: make sure media array items have correct types
        const cleanedMedia = mediaArr.map(m => {
            if (m && m.url) {
                const isVid = isDirectVideoUrl(m.url);
                return {
                    ...m,
                    type: isVid ? (m.type === 'youtube' ? 'youtube' : 'video') : 'image'
                };
            }
            return m;
        }).filter(Boolean);

        const videoItem = cleanedMedia.find(m => m.type === 'video' || m.type === 'youtube');
        const imageItem = cleanedMedia.find(m => m.type === 'image');
        
        // Prefer explicit videoUrl, then derive from media array
        const derivedVideoUrl = videoItem ? videoItem.url : null;
        p.videoUrl  = post.videoUrl || post.displayVideo || post.video_url || derivedVideoUrl || null;
        p.embedUrl  = videoItem?.embedUrl || post.videoEmbed || post.video_embed || null;
        
        let rawImg = post.imageUrl || post.thumbnailUrl || post.displayImage || post.thumbnail || (imageItem ? imageItem.url : null);
        if (rawImg && isDirectVideoUrl(rawImg)) {
            rawImg = null; // Do not use video as poster/image
        }
        p.imageUrl  = rawImg;
        p.images    = cleanedMedia.filter(m => m.type === 'image').map(m => m.url);

        p.price   = post.price || post.displayPrice || null;
        p.likes   = post.likes || post.likes_count || post.likeCount || 0;
        p.cmts    = post.commentsCount || post.comments_count || post.commentCount || 0;
        p.views   = post.viewCount || post.views_count || post.views || 0;
        p.time    = _fmtTime(post.createdAt || post.created_at);
        return p;
    }

    function _mediaBlock(post) {
        const p = _normalize(post);
        // YouTube embed
        if (p.embedUrl) {
            return `<div class="pc4-media"><iframe src="${p.embedUrl}?autoplay=0&mute=1&modestbranding=1" allow="autoplay;encrypted-media" allowfullscreen loading="lazy"></iframe></div>`;
        }
        if (p.videoUrl) {
            const ytId = (p.videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=))([\w-]{11})/) || [])[1];
            if (ytId) {
                return `<div class="pc4-media"><iframe src="https://www.youtube.com/embed/${ytId}?autoplay=0&mute=1&modestbranding=1" allow="autoplay;encrypted-media" allowfullscreen loading="lazy"></iframe></div>`;
            }
            const posterAttr = p.imageUrl ? `poster="${p.imageUrl}"` : '';
            return `<div class="pc4-media"><video src="${p.videoUrl}" controls muted loop playsinline preload="metadata" ${posterAttr} style="background:#000; width:100%; height:100%;"></video></div>`;
        }

        const urls = p.images.length ? p.images : (p.imageUrl ? [p.imageUrl] : []);
        if (!urls.length) return '';

        if (urls.length === 1) {
            return `<div class="pc4-media single" onclick="window.location.href='channel.html?postId=${_esc(p.id)}'">
                        <img src="${urls[0]}" loading="lazy" onerror="this.closest('.pc4-media').style.display='none'">
                    </div>`;
        }
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
        return `
            <div class="pc4-product-panel">
                <div class="pc4-product-price">${price}</div>
                <button class="pc4-buy-btn" onclick="event.stopPropagation();window.location.href='marketplace.html?product=${_esc(post.id)}'">
                    <i class="fas fa-shopping-cart"></i> สั่งซื้อเลย
                </button>
            </div>`;
    }

    function createPostCard(post) {
        const p        = _normalize(post);
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
                        <a class="pc4-author" href="channel.html?userId=${p.aid}">${_esc(p.author)}</a>
                        ${post.verified || post.isVerified ? '<i class="fas fa-check-circle pc4-verified"></i>' : ''}
                        ${_typeBadge(p.type)}
                    </div>
                    <div class="pc4-time"><i class="far fa-clock"></i> ${p.time} ${post.sellerProvince ? `<span class="pc4-loc">• <i class="fas fa-map-marker-alt"></i> ${_esc(post.sellerProvince)}</span>` : ''}</div>
                </div>
                <button class="pc4-more" onclick="window.pcTogglePostMenu('${p.id}', event)">
                    <i class="fas fa-ellipsis-h"></i>
                </button>
            </div>
            <div class="pc4-body">
                ${p.title   ? `<div class="pc4-title">${_esc(p.title)}</div>` : ''}
                ${p.content ? `<div class="pc4-content">${_esc(p.content)}</div>` : ''}
            </div>

            ${_mediaBlock(post)}
            ${p.type === 'product' ? _productPanel(post) : ''}

            <div class="pc4-stats">
                <div class="pc4-stats-left">
                    <div class="pc4-react-icon"><i class="fas fa-thumbs-up"></i></div>
                    <span class="pc4-stat-likes">${Number(p.likes).toLocaleString()} ถูกใจ</span>
                </div>
                <div class="pc4-stats-right">
                    <span class="pc4-stat-item" onclick="if(window.openComments)window.openComments('${p.id}')">
                        <i class="fas fa-comment"></i> ${Number(p.cmts).toLocaleString()}
                    </span>
                    <span class="pc4-stat-item"><i class="fas fa-eye"></i> ${Number(p.views).toLocaleString()}</span>
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

    /* ─── Social Feed — cursor-based pagination ──────────────── */
    window.pcLoadSocialFeed = async function (append = false) {
        if (_pcLoading) return;
        if (append && _pcEnded) return;
        _pcLoading = true;

        const container = document.getElementById('postsContainer');
        if (!container) { _pcLoading = false; return; }

        if (!append) {
            _pcCursor  = null;
            _pcEnded   = false;
            _newPostsCount = 0;
            _stopRealtime();
            container.innerHTML = _genSkeletons(3);
        }

        try {
            const params = new URLSearchParams({ limit: 12 });
            if (append && _pcCursor) params.set('cursor', _pcCursor);

            const data = await _apiFetch(`/api/v1/posts?${params}`);
            const posts = data?.posts || [];

            if (posts.length === 0 && !append) {
                container.innerHTML = '<div class="pc4-empty"><i class="fas fa-rss fa-2x"></i><p>ยังไม่มีโพสต์ในขณะนี้</p></div>';
                _pcLoading = false;
                return;
            }

            _pcEnded = posts.length < 12;

            // Update cursor to last post id
            if (posts.length > 0) {
                _pcCursor    = posts[posts.length - 1].id;
                const firstTs = append ? _latestPostTs : (posts[0].createdAt || posts[0].created_at);
                if (!append) _latestPostTs = firstTs;
            }

            if (!append) container.innerHTML = '';

            posts.forEach(p => {
                if (p.status === 'draft' || p.status === 'scheduled') return;
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

    /* ─── Realtime Poll (replaces onSnapshot) ────────────────── */
    function _startRealtime() {
        if (!_latestPostTs) return;
        _pollTimer = setInterval(async () => {
            try {
                const params = new URLSearchParams({ since: _latestPostTs, limit: 10 });
                const data = await _apiFetch(`/api/v1/posts?${params}`);
                const n = (data?.posts || []).filter(p => p.status !== 'draft').length;
                if (n > 0) {
                    _newPostsCount += n;
                    _showBanner(_newPostsCount);
                    // advance timestamp so next poll only gets newer posts
                    const latest = data.posts[0];
                    if (latest) _latestPostTs = latest.createdAt || latest.created_at || _latestPostTs;
                }
            } catch (_) {}
        }, 30000); // poll every 30 seconds
    }

    function _stopRealtime() {
        if (_pollTimer) { clearInterval(_pollTimer); _pollTimer = null; }
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

    /* ─── Like / Unlike via REST API ────────────────────────── */
    window.pcToggleLike = async function (postId, btn) {
        if (!_currentUserId) {
            // Allow optimistic toggle but persist userId from localStorage guest key
            const guestId = localStorage.getItem('tuktuk_guest_id') || (() => {
                const id = 'guest_' + Math.random().toString(36).slice(2);
                localStorage.setItem('tuktuk_guest_id', id);
                return id;
            })();
            // Proceed with guestId so guests can like
            _doLikeToggle(postId, btn, guestId);
            return;
        }
        _doLikeToggle(postId, btn, _currentUserId);
    };

    async function _doLikeToggle(postId, btn, userId) {
        try {
            const isLiked = btn.classList.contains('liked');
            const delta   = isLiked ? -1 : 1;

            // Optimistic UI
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

            // Call REST API
            const res = await fetch(`${API}/api/v1/posts/${postId}/like`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ..._authHeaders(),
                },
                body: JSON.stringify({ userId }),
            });
            const data = await res.json().catch(() => ({}));

            // Sync real count from server
            if (data?.likes !== undefined && card) {
                const el = card.querySelector('.pc4-stat-likes');
                if (el) el.textContent = Number(data.likes).toLocaleString() + ' ถูกใจ';
            }

            // Update localStorage liked list
            if (!isLiked) { if (!_userLikedIds.includes(postId)) _userLikedIds.push(postId); }
            else { const i = _userLikedIds.indexOf(postId); if (i > -1) _userLikedIds.splice(i, 1); }
            localStorage.setItem('tuktuk_liked_posts', JSON.stringify(_userLikedIds));
            window.userLikedIds = _userLikedIds;

        } catch (e) { console.warn('[pcEngine] like:', e); }
    }

    // Back-compat alias
    window.toggleLike = window.pcToggleLike;

    /* ─── Stories from recent posts ──────────────────────────── */
    window.pcLoadStories = async function () {
        const bar = document.getElementById('pcStoriesBar');
        if (!bar) return;
        try {
            const data = await _apiFetch('/api/v1/posts?published=true&limit=20');
            const posts = data?.posts || [];

            const seen  = new Set();
            const users = [];
            for (const p of posts) {
                const aid = p.authorId || p.userId || p.user_id;
                if (aid && !seen.has(aid) && users.length < 8) {
                    seen.add(aid);
                    users.push({
                        id:     aid,
                        avatar: p.authorAvatar || p.authorPhotoURL || p.picture_url || 'assets/images/logo.png',
                        name:   (p.authorName || p.display_name || 'ผู้ใช้').substring(0, 10),
                        postId: p.id,
                    });
                }
            }
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

    /* ─── Sidebar: Trending Sellers (products) ───────────────── */
    window.pcLoadTrendingSellers = async function () {
        const el = document.getElementById('pcTrendingSellers');
        if (!el) return;
        try {
            const data = await _apiFetch('/api/v1/products?status=active&limit=5');
            const items = data?.items || data?.products || data?.data || [];

            if (!items.length) { el.innerHTML = '<div class="pc4-sidebar-empty">ยังไม่มีสินค้า</div>'; return; }
            el.innerHTML = items.map(d => {
                const imgs = Array.isArray(d.images) ? d.images : [];
                const img  = imgs.length ? (typeof imgs[0] === 'object' ? imgs[0].url : imgs[0]) : (d.imageUrl || d.thumbnailUrl || 'assets/images/logo.png');
                const name = _esc((d.productName || d.title || 'สินค้า').substring(0, 32));
                const price= d.price ? `<span class="pc4-price">฿${Number(d.price).toLocaleString()}</span>` : '';
                const shop = _esc(d.shopName || d.sellerName || '');
                const sold = d.soldCount ? `<span class="pc4-sold">${d.soldCount} ขายแล้ว</span>` : '';
                return `
                    <div class="pc4-seller-row" onclick="window.location.href='marketplace.html?product=${d.id}'">
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

    /* ─── Sidebar: News (type=news from posts table) ─────────── */
    window.pcLoadNewsSection = async function () {
        const el = document.getElementById('pcNewsSection');
        if (!el) return;
        try {
            const data = await _apiFetch('/api/v1/posts?type=news&limit=5');
            const posts = data?.posts || [];

            if (!posts.length) { el.innerHTML = '<div class="pc4-sidebar-empty">ยังไม่มีข่าวสาร</div>'; return; }

            el.innerHTML = posts.map(d => {
                const p     = _normalize(d);
                const title = _esc((p.title || p.content || 'ไม่มีหัวข้อ').substring(0, 60));
                const time  = p.time;
                const img   = p.imageUrl;
                const href  = d.link || `channel.html?postId=${d.id}`;
                return `
                    <div class="pc4-news-item" onclick="window.location.href='${href}'">
                        ${img ? `<img src="${img}" class="pc4-news-thumb" onerror="this.style.display='none'" loading="lazy">` : ''}
                        <div class="pc4-news-body">
                            <div class="pc4-news-title">${title}</div>
                            <div class="pc4-news-meta"><i class="far fa-clock"></i> ${time}</div>
                        </div>
                    </div>`;
            }).join('');
        } catch (e) { el.innerHTML = '<div class="pc4-sidebar-empty">โหลดข่าวไม่สำเร็จ</div>'; }
    };

    /* ─── Sidebar: Contacts (recent active users from posts) ──── */
    window.pcLoadContacts = async function () {
        const el = document.getElementById('pcContactList');
        if (!el) return;
        try {
            const data  = await _apiFetch('/api/v1/posts?limit=30');
            const posts = data?.posts || [];

            const seen  = new Set();
            const users = [];
            for (const p of posts) {
                const aid = p.authorId || p.userId || p.user_id;
                if (aid && !seen.has(aid) && users.length < 6) {
                    seen.add(aid);
                    users.push({
                        id:     aid,
                        avatar: p.authorAvatar || p.picture_url || 'assets/images/logo.png',
                        name:   p.authorName || p.display_name || 'ผู้ใช้',
                    });
                }
            }

            if (!users.length) { el.innerHTML = '<div class="pc4-sidebar-empty">ไม่พบผู้ใช้</div>'; return; }

            el.innerHTML = users.map(u => `
                <div class="pc4-contact-row" onclick="window.pcStartChat('${u.id}','${_esc(u.name).replace(/'/g,"\\'")}')" >
                    <div style="position:relative;flex-shrink:0;">
                        <img class="pc4-contact-avatar" src="${u.avatar}" onerror="this.src='assets/images/logo.png'" loading="lazy">
                    </div>
                    <span class="pc4-contact-name">${_esc(u.name)}</span>
                    <button class="pc4-contact-msg" onclick="event.stopPropagation();window.location.href='messages.html?uid=${u.id}'" title="ส่งข้อความ">
                        <i class="fas fa-comment-dots"></i>
                    </button>
                </div>`).join('');
        } catch (e) { el.innerHTML = '<div class="pc4-sidebar-empty">โหลดผู้ติดต่อไม่สำเร็จ</div>'; }
    };

    /* ─── Sidebar: Recommended Products ─────────────────────── */
    window.pcLoadRecommendedProducts = async function () {
        const el = document.getElementById('pcRecommendedProducts');
        if (!el) return;
        try {
            const data  = await _apiFetch('/api/v1/products?status=active&limit=4');
            const items = data?.items || data?.products || data?.data || [];

            if (!items.length) { el.innerHTML = '<div class="pc4-sidebar-empty">ยังไม่มีสินค้า</div>'; return; }

            let g = '<div class="pc4-product-grid">';
            items.forEach(d => {
                const imgs = Array.isArray(d.images) ? d.images : [];
                const img  = imgs.length ? (typeof imgs[0] === 'object' ? imgs[0].url : imgs[0]) : (d.imageUrl || d.thumbnailUrl || 'assets/images/logo.png');
                const name = _esc((d.productName || d.title || 'สินค้า').substring(0, 20));
                const price= d.price ? `฿${Number(d.price).toLocaleString()}` : '';
                g += `
                    <div class="pc4-product-cell" onclick="window.location.href='marketplace.html?product=${d.id}'">
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
        if (!el) return;
        try {
            const data  = await _apiFetch('/api/v1/posts?limit=50');
            const posts = data?.posts || [];

            const seen  = new Set([_currentUserId].filter(Boolean));
            const users = [];
            const sorted = [...posts].sort((a, b) => (b.likes || b.likes_count || 0) - (a.likes || a.likes_count || 0));

            for (const p of sorted) {
                const aid = p.authorId || p.userId || p.user_id;
                if (aid && !seen.has(aid) && users.length < 5) {
                    seen.add(aid);
                    users.push({
                        id:     aid,
                        name:   p.authorName || p.display_name || 'สมาชิก TukTuk',
                        avatar: p.authorAvatar || p.picture_url || 'assets/images/logo.png',
                        likes:  p.likes || p.likes_count || 0,
                    });
                }
            }

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
        btn.textContent = 'ติดตามแล้ว';
        btn.classList.add('following');
        btn.disabled = true;
        // Store locally; full follow system to be implemented via /api/v1/users/:id/follow
        try {
            const follows = JSON.parse(localStorage.getItem('tuktuk_following') || '[]');
            if (!follows.includes(userId)) { follows.push(userId); localStorage.setItem('tuktuk_following', JSON.stringify(follows)); }
        } catch (_) {}
        _toast('ติดตามแล้ว!', 'success');
    };

    /* ─── Notification Badges (auth-gated) ───────────────────── */
    async function _setupNotificationBadges() {
        if (!_currentUserId) return;
        try {
            const data = await _apiFetch('/api/v1/notifications/unread-count', {
                headers: { 'Content-Type': 'application/json', ..._authHeaders() },
            });
            const n = data?.unread || 0;
            const badge = document.getElementById('pcNotifBadge');
            if (badge) { badge.textContent = n > 99 ? '99+' : n; badge.style.display = n > 0 ? 'flex' : 'none'; }
            ['pillBadge','pillBadgeExp','mhPillNotifBadge'].forEach(id => {
                const el = document.getElementById(id);
                if (el) { el.textContent = n; el.style.display = n > 0 ? 'flex' : 'none'; }
            });
        } catch (_) {}
    }

    /* ─── Search (client-side over loaded posts) ─────────────── */
    function _initSearch() {
        const input = document.getElementById('pcSearchInput');
        const sugg  = document.getElementById('pcSearchSuggestions');
        if (!input || !sugg) return;
        let timer;
        input.addEventListener('input', () => {
            clearTimeout(timer);
            const q = input.value.trim();
            if (q.length < 2) { sugg.classList.remove('show'); return; }
            timer = setTimeout(() => {
                // Search over DOM-rendered cards (no extra API call)
                const cards = document.querySelectorAll('.pc4-card .pc4-title, .pc4-card .pc4-content');
                const matches = [];
                cards.forEach(el => {
                    const txt = el.textContent || '';
                    if (txt.toLowerCase().includes(q.toLowerCase())) {
                        matches.push(txt.trim().substring(0, 60));
                    }
                });
                if (!matches.length) { sugg.classList.remove('show'); return; }
                sugg.innerHTML = [...new Set(matches)].slice(0, 5).map(t =>
                    `<div class="pc4-sugg-item" onclick="window.doSearch('${_esc(t)}')" ><i class="fas fa-search"></i><span>${_esc(t)}</span></div>`
                ).join('');
                sugg.classList.add('show');
            }, 200);
        });

        // Keyboard navigation
        input.addEventListener('keydown', e => {
            const items = sugg.querySelectorAll('.pc4-sugg-item');
            if (!sugg.classList.contains('show') || !items.length) return;
            let activeIdx = [...items].findIndex(i => i.classList.contains('active'));
            if (e.key === 'ArrowDown')  { e.preventDefault(); if (activeIdx !== -1) items[activeIdx].classList.remove('active'); activeIdx = (activeIdx + 1) % items.length; items[activeIdx].classList.add('active'); }
            else if (e.key === 'ArrowUp')   { e.preventDefault(); if (activeIdx !== -1) items[activeIdx].classList.remove('active'); activeIdx = (activeIdx - 1 + items.length) % items.length; items[activeIdx].classList.add('active'); }
            else if (e.key === 'Enter'  && activeIdx !== -1) { e.preventDefault(); items[activeIdx].click(); }
            else if (e.key === 'Escape') { sugg.classList.remove('show'); input.blur(); }
        });

        document.addEventListener('keydown', e => {
            if (e.key === '/') {
                const active = document.activeElement;
                if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return;
                e.preventDefault(); input.focus(); input.select();
            }
        });
        document.addEventListener('click', e => {
            if (!input.contains(e.target) && !sugg.contains(e.target)) sugg.classList.remove('show');
        });
    }

    window.doSearch = function (term) {
        const input = document.getElementById('pcSearchInput');
        if (input) input.value = term;
        document.getElementById('pcSearchSuggestions')?.classList.remove('show');
        document.querySelectorAll('.pc4-card').forEach(card => {
            card.style.display = card.textContent.toLowerCase().includes(term.toLowerCase()) ? '' : 'none';
        });
    };

    /* ─── Utilities ──────────────────────────────────────────── */
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

    /* ─── Stories init ───────────────────────────────────────── */
    function _buildStoriesFromPosts() {
        // No longer depends on window.db — just call directly
        window.pcLoadStories();
    }

    /* ─── Notification badge init ────────────────────────────── */
    // Expose for external callers too
    window.pcSetupNotifications = _setupNotificationBadges;
    _setupNotificationBadges();

})();
