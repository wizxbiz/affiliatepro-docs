/**
 * 🖥️ TukTuk Premium V4 — PC Layout Runtime Interactions
 * Ported from inline script in public/index.html to a clean modular architecture.
 * Manages fallback stories, live chat simulation, and button click feedback.
 */

(function TukTukPremiumV4() {
    'use strict';

    // ── Design tokens ───────────────────────────────────────────
    const T = {
        p: '#6366f1', s: '#a855f7', g: '#10b981',
        o: '#f97316', y: '#facc15', r: '#f43f5e',
        t: '#f1f5f9', tm: 'rgba(255,255,255,0.45)',
    };

    // ── Stories seed data (until Firebase provides real ones) ───
    const SEED_STORIES = [
        { name: '@สวนมะพร้าว', emoji: '🥥', color: T.g,  live: false },
        { name: '@ส้มตำป้าแดง', emoji: '🌶️', color: T.o, live: true  },
        { name: '@ชุดไทย',     emoji: '👗', color: T.s,  live: false },
        { name: '@วินมอ',     emoji: '🛵', color: T.p,  live: false },
        { name: '@ตลาดนัด',   emoji: '🏪', color: T.y,  live: false },
    ];

    // ── Build a single story element ────────────────────────────
    function makeStoryEl(story) {
        const wrap = document.createElement('div');
        wrap.className = 'story-item-v3';

        const ringClass = story.live ? 'story-ring-v3 is-live' : 'story-ring-v3 is-unread';
        wrap.innerHTML = `
            <div style="position:relative;">
                <div class="${ringClass}">
                    <div class="story-inner-v3" style="font-size:22px;">${story.emoji}</div>
                </div>
                ${story.live ? '<div class="story-live-badge-v3">LIVE</div>' : ''}
            </div>
            <span class="story-name-v3">${story.name}</span>
        `;
        wrap.addEventListener('click', () => {
            if (typeof showToast === 'function') showToast(`📖 ${story.name} — เร็วๆ นี้`, 'info');
        });
        return wrap;
    }

    // Helper to escape HTML characters safely
    function esc(s) {
        const d = document.createElement('div');
        d.textContent = s || '';
        return d.innerHTML;
    }

    // ── Load and build Stories from Firestore or Fallback Seeds ───
    async function loadPremiumStories() {
        const pcBar = document.getElementById('pcStoriesBar');
        const mobBar = document.getElementById('mobileStoriesBar');
        if (!pcBar && !mobBar) return;

        // Fallback mock seeds if database is not loaded or query fails
        const renderSeeds = () => {
            if (pcBar) {
                // Ensure Add Story button is there
                let pcHtml = `<div class="pc-story-add-btn" onclick="openPostModal ? openPostModal() : null">
                        <div class="pc-story-add-btn-plus"><i class="fas fa-plus"></i></div>
                        <div class="pc-story-add-label">เพิ่มเรื่องราว</div>
                    </div>`;
                SEED_STORIES.forEach(s => {
                    pcHtml += `<div class="pc-story-card seed" onclick="if(typeof showToast === 'function') showToast('📖 ${s.name} — เร็วๆ นี้', 'info')">
                            <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#1e293b;font-size:36px;">${s.emoji}</div>
                            <div class="pc-story-overlay"></div>
                            <div class="pc-story-name">${s.name}</div>
                        </div>`;
                });
                pcBar.innerHTML = pcHtml;
            }
            if (mobBar) {
                mobBar.querySelectorAll('.story-item-v3:not(.add-story-btn)').forEach(el => el.remove());
                SEED_STORIES.forEach(s => {
                    const el = makeStoryEl(s);
                    el.classList.add('seed');
                    mobBar.appendChild(el);
                });
            }
        };

        if (!window.db) {
            renderSeeds();
            return;
        }

        try {
            const snap = await window.db.collection('posts')
                .where('published', '==', true)
                .orderBy('createdAt', 'desc')
                .limit(15)
                .get();

            const withImg = snap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .filter(p => {
                    const imgs = p.images || (p.imageUrl ? [p.imageUrl] : []);
                    return imgs.length > 0;
                })
                .slice(0, 8);

            if (!withImg.length) {
                renderSeeds();
                return;
            }

            // PC card stories rendering
            if (pcBar) {
                let pcHtml = `<div class="pc-story-add-btn" onclick="openPostModal ? openPostModal() : null">
                        <div class="pc-story-add-btn-plus"><i class="fas fa-plus"></i></div>
                        <div class="pc-story-add-label">เพิ่มเรื่องราว</div>
                    </div>`;
                withImg.forEach(post => {
                    const imgs = post.images || (post.imageUrl ? [post.imageUrl] : []);
                    const img = typeof imgs[0] === 'object' ? imgs[0].url : imgs[0];
                    const avatar = post.authorPhotoURL || post.authorAvatar || 'assets/images/logo.png';
                    const name = (post.authorName || 'ผู้ใช้').substring(0, 12);
                    pcHtml += `<div class="pc-story-card"
                            onclick="window.location.href='channel.html?postId=${post.id}'"
                            title="${esc(post.title || name)}">
                            <img src="${img}" onerror="this.src='assets/images/logo.png'" loading="lazy">
                            <div class="pc-story-overlay"></div>
                            <img src="${avatar}" class="pc-story-avatar" onerror="this.src='assets/images/logo.png'">
                            <div class="pc-story-name">${esc(name)}</div>
                        </div>`;
                });
                pcBar.innerHTML = pcHtml;
            }

            // Mobile circular stories rendering
            if (mobBar) {
                // Keep only the "+" (Add Story) button
                const addBtn = mobBar.querySelector('.story-item-v3.add-story-btn');
                mobBar.innerHTML = '';
                if (addBtn) {
                    mobBar.appendChild(addBtn);
                } else {
                    // Create if not exists
                    const newAddBtn = document.createElement('div');
                    newAddBtn.className = 'story-item-v3 add-story-btn';
                    newAddBtn.onclick = () => { if(typeof openPostModal === 'function') openPostModal(); };
                    newAddBtn.innerHTML = `
                        <div class="story-ring-v3 is-seen" style="background: rgba(255,255,255,0.06); border: 1.5px dashed rgba(255,255,255,0.25); display: flex; align-items: center; justify-content: center; color: var(--tt-p); font-size: 22px; width: 58px; height: 58px; border-radius: 50%;">
                            +
                        </div>
                        <span class="story-name-v3">ลงสตอรี่</span>
                    `;
                    mobBar.appendChild(newAddBtn);
                }

                withImg.forEach(post => {
                    const avatar = post.authorPhotoURL || post.authorAvatar || 'assets/images/logo.png';
                    const name = (post.authorName || 'ผู้ใช้').substring(0, 10);
                    const el = document.createElement('div');
                    el.className = 'story-item-v3';
                    el.innerHTML = `
                        <div style="position:relative;">
                            <div class="story-ring-v3 is-unread">
                                <img class="story-inner-v3" src="${avatar}" onerror="this.src='assets/images/logo.png'"
                                     style="width:100%;height:100%;border-radius:50%;object-fit:cover;">
                            </div>
                        </div>
                        <span class="story-name-v3">${esc(name)}</span>
                    `;
                    el.onclick = () => { window.location.href = `channel.html?postId=${post.id}`; };
                    mobBar.appendChild(el);
                });
            }

        } catch (e) {
            console.warn('[PremiumStories] Firestore load failed, falling back to seeds:', e);
            renderSeeds();
        }
    }

    // ── Live Chat send ───────────────────────────────────────────
    function setupLiveChat() {
        const panel    = document.getElementById('pcLiveChatPanel');
        const input    = document.getElementById('pcLiveChatInput');
        const msgs     = document.getElementById('pcLiveChatMessages');
        if (!panel || !input || !msgs) return;

        window._pcSendChat = function() {
            const text = (input.value || '').trim();
            if (!text) return;
            const msg = document.createElement('div');
            msg.className = 'pc-chat-msg';
            msg.style.animation = 'slideRight 0.25s ease';
            msg.innerHTML = `<span class="username" style="color:${T.g};">@คุณ</span> <span class="text">${text}</span>`;
            msgs.appendChild(msg);
            msgs.scrollTop = msgs.scrollHeight;
            input.value = '';
        };

        // Simulate incoming msgs
        const BOT_MSGS = [
            { u: '@แม่ค้า',   m: 'มีของอีกไหมคะ? 🛒' },
            { u: '@ลูกค้า',   m: 'คุณภาพดีมากเลย ⭐⭐⭐⭐⭐' },
            { u: '@ร้านค้า',  m: 'ส่งด่วน 2 ชม. ได้เลย 🚀' },
            { u: '@แฟนคลับ',  m: 'สุดยอด! 🔥🔥🔥' },
        ];
        let botIdx = 0;
        setInterval(() => {
            if (!panel.querySelector(':scope')) return;
            const b = BOT_MSGS[botIdx++ % BOT_MSGS.length];
            const msg = document.createElement('div');
            msg.className = 'pc-chat-msg';
            msg.style.animation = 'fadeIn 0.3s ease';
            msg.innerHTML = `<span class="username">${b.u}</span> <span class="text">${b.m}</span>`;
            msgs.appendChild(msg);
            // Keep only last 40 messages
            while (msgs.children.length > 40) msgs.removeChild(msgs.firstChild);
            msgs.scrollTop = msgs.scrollHeight;
        }, 7000);
    }

    // ── Like click bounce animation ──────────────────────────────
    function setupLikeAnimation() {
        document.addEventListener('click', e => {
            const btn = e.target.closest('[class*="like-btn-"]');
            if (!btn) return;
            btn.style.transform = 'scale(1.2)';
            setTimeout(() => { btn.style.transform = ''; }, 200);
        });
    }

    // ── Init ─────────────────────────────────────────────────────
    function init() {
        loadPremiumStories();
        setupLiveChat();
        setupLikeAnimation();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Re-build/load stories globally
    window.loadPremiumStories = loadPremiumStories;
    window._rebuildPremiumStories = loadPremiumStories;

})();
