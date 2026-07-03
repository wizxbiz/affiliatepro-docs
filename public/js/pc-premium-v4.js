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

    // ── Populate stories bars ────────────────────────────────────
    function buildStoriesBars() {
        const bars = [
            document.getElementById('mobileStoriesBar'),
            document.getElementById('pcStoriesBar'),
        ];
        bars.forEach(bar => {
            if (!bar) return;
            // Remove old seeds if already added
            bar.querySelectorAll('.story-item-v3.seed').forEach(el => el.remove());
            SEED_STORIES.forEach(s => {
                const el = makeStoryEl(s);
                el.classList.add('seed');
                bar.appendChild(el);
            });
        });
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
        buildStoriesBars();
        setupLiveChat();
        setupLikeAnimation();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Re-build stories if feed reloads
    window._rebuildPremiumStories = buildStoriesBars;

})();
