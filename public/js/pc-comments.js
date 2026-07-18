/**
 * 💬 PC Comments System — Full Implementation
 * ทำงานได้ 100% : โหลดความเห็นจาก Firestore + ส่งความเห็นใหม่
 *
 * ⚠️ Override openComments เฉพาะ PC (≥ 992px) เท่านั้น
 *    มือถือยังคงใช้ feed-renderer.js Bootstrap Modal ตามเดิม
 */

(function () {
    'use strict';

    /* ─── PC-only guard ─────────────────────────────────────────
       ถ้าเป็น mobile (< 992px) ไม่ override openComments
       ปล่อยให้ feed-renderer.js และ tuktuk_feed_logic.js
       จัดการ mobile comment modal ตามปกติ
    ─────────────────────────────────────────────────────────── */
    const IS_PC = window.matchMedia('(min-width: 992px)').matches;

    let _activePostId = null;
    let _commentsUnsub = null;

    /* ─── openComments (entry point) ──────────────────────────── */
    window.openComments = function (postId) {
        if (!postId) return;

        // บน mobile → ส่งต่อให้ feed-renderer.js Bootstrap Modal (ถ้ามี)
        if (!window.matchMedia('(min-width: 992px)').matches) {
            if (window._mobileOpenComments) {
                window._mobileOpenComments(postId);
            }
            return;
        }

        _activePostId = postId;
        _showPanel(postId);
    };

    /* ─── Build Panel ─────────────────────────────────────────── */
    function _showPanel(postId) {
        // Remove existing
        const old = document.getElementById('pcCommentsOverlay');
        if (old) old.remove();
        if (_commentsUnsub) { _commentsUnsub(); _commentsUnsub = null; }

        const myAvatar = _getMyAvatar();

        const overlay = document.createElement('div');
        overlay.id = 'pcCommentsOverlay';
        overlay.className = 'pc-comments-overlay';
        overlay.innerHTML = `
            <div class="pc-comments-panel" id="pcCommentsPanel">
                <div class="pc-comments-header">
                    <h4><i class="fas fa-comment-dots" style="color:#6366f1;margin-right:8px;"></i>ความเห็น</h4>
                    <button class="pc-comments-close" onclick="window.closeComments()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="pc-comments-list" id="pcCommentsList">
                    <div class="pc-comment-empty">
                        <i class="fas fa-comment-dots"></i>
                        กำลังโหลดความเห็น...
                    </div>
                </div>
                <div class="pc-comments-input-row">
                    <img src="${myAvatar}" class="pc-comments-input-avatar" id="pcCommentMyAvatar"
                         onerror="this.src='assets/images/logo.png'">
                    <textarea class="pc-comments-input" id="pcCommentInput"
                              placeholder="เขียนความเห็น..."
                              rows="1"
                              onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();window.submitComment();}"></textarea>
                    <button class="pc-comments-send" id="pcCommentSendBtn" onclick="window.submitComment()">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Close on overlay click (outside panel)
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) window.closeComments();
        });

        // Auto-resize textarea
        const textarea = document.getElementById('pcCommentInput');
        if (textarea) {
            textarea.addEventListener('input', function () {
                this.style.height = 'auto';
                this.style.height = Math.min(this.scrollHeight, 100) + 'px';
            });
            setTimeout(() => textarea.focus(), 150);
        }

        // Load comments
        _loadComments(postId);
    }

    /* ─── Close ───────────────────────────────────────────────── */
    window.closeComments = function () {
        const overlay = document.getElementById('pcCommentsOverlay');
        if (overlay) {
            overlay.style.animation = 'fadeInOverlay 0.15s ease reverse';
            setTimeout(() => overlay.remove(), 150);
        }
        if (_commentsUnsub) { _commentsUnsub(); _commentsUnsub = null; }
        _activePostId = null;
    };

    /* ─── Load Comments (Worker D1 API — single source of truth) ── */
    function _loadComments(postId) {
        const list = document.getElementById('pcCommentsList');
        if (!list) return;

        fetch(`/api/v1/posts/${postId}/comments?limit=50`)
            .then(res => res.json())
            .then(data => _renderComments(Array.isArray(data.comments) ? data.comments : [], list))
            .catch(err => {
                console.warn('[comments] load error:', err);
                list.innerHTML = `<div class="pc-comment-empty"><i class="fas fa-comment-slash"></i>ไม่สามารถโหลดความเห็นได้</div>`;
            });
    }

    function _renderComments(comments, list) {
        if (!list) return;
        if (!comments || comments.length === 0) {
            list.innerHTML = `<div class="pc-comment-empty"><i class="fas fa-comment-dots"></i>ยังไม่มีความเห็น เป็นคนแรก!</div>`;
            return;
        }

        list.innerHTML = '';
        comments.forEach(c => {
            const avatar = c.authorAvatar || c.userAvatar || c.authorPhotoURL || 'assets/images/logo.png';
            const name   = _esc(c.authorName || c.userName || 'ผู้ใช้');
            const text   = _esc(c.text || c.content || c.comment || '');
            const time   = _fmtTime(c.createdAt);

            if (!text) return;

            const el = document.createElement('div');
            el.className = 'pc-comment-item';
            el.innerHTML = `
                <img src="${avatar}" class="pc-comment-avatar" onerror="this.src='assets/images/logo.png'">
                <div class="pc-comment-bubble">
                    <div class="pc-comment-author">${name}</div>
                    <div class="pc-comment-text">${text}</div>
                    <div class="pc-comment-time">${time}</div>
                </div>
            `;
            list.appendChild(el);
        });

        // Scroll to bottom
        list.scrollTop = list.scrollHeight;
    }

    /* ─── Submit Comment ──────────────────────────────────────── */
    window.submitComment = async function () {
        if (!_activePostId) return;

        const textarea = document.getElementById('pcCommentInput');
        const sendBtn  = document.getElementById('pcCommentSendBtn');
        if (!textarea || !sendBtn) return;

        const text = textarea.value.trim();
        if (!text) return;

        // Check login
        const uid  = window.currentUserId || (window.WizmobizAuth && window.WizmobizAuth.getUser()?.uid);
        const user = window.WizmobizAuth && window.WizmobizAuth.getUser();
        if (!uid) {
            if (typeof showToast === 'function') showToast('⚠️ กรุณาเข้าสู่ระบบก่อนแสดงความเห็น', 'warning');
            return;
        }

        sendBtn.disabled = true;
        sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

        try {
            const token = localStorage.getItem('tuktuk_token') || localStorage.getItem('tuktuk_jwt');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`/api/v1/posts/${_activePostId}/comments`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    text,
                    authorId: uid,
                    authorName: window.currentUserName || user?.displayName || user?.name || 'ผู้ใช้',
                    authorAvatar: user?.pictureUrl || user?.photoURL || 'assets/images/logo.png',
                }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            // Update count display on card
            const card = document.getElementById(`ppc-${_activePostId}`);
            if (card) {
                const countEl = card.querySelector('.pc4-stat-item i.fa-comment');
                if (countEl?.parentElement) {
                    const span = countEl.parentElement;
                    const cur  = parseInt(span.textContent.replace(/[^0-9]/g, '')) || 0;
                    span.innerHTML = `<i class="fas fa-comment"></i> ${cur + 1}`;
                }
            }

            textarea.value = '';
            textarea.style.height = 'auto';

            // Reload comments so the new one shows immediately
            _loadComments(_activePostId);

            if (typeof showToast === 'function') showToast('✅ ส่งความเห็นแล้ว!', 'success');

        } catch (e) {
            console.error('[comments] submit error:', e);
            if (typeof showToast === 'function') showToast('❌ ส่งความเห็นไม่สำเร็จ', 'error');
        } finally {
            sendBtn.disabled = false;
            sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
        }
    };

    /* ─── likePost back-compat (calls pcToggleLike) ──────────── */
    window.likePost = function (postId) {
        if (window.pcToggleLike) {
            // Find the like button on the card
            const card = document.getElementById(`ppc-${postId}`);
            if (card) {
                const btn = card.querySelector(`.like-btn-${postId}`);
                if (btn) { window.pcToggleLike(postId, btn); return; }
            }
        }
        // Fallback: delegate to handlePostLike
        if (typeof handlePostLike === 'function') {
            const el = document.querySelector(`[onclick*="likePost('${postId}')"]`);
            if (el) handlePostLike(postId, el);
        }
    };

    /* ─── sharePost ───────────────────────────────────────────── */
    window.sharePost = window.sharePost || function (postId, title) {
        const url = `${location.origin}/community-share?id=${postId}`;
        if (navigator.share) {
            navigator.share({ title: title || 'TukTuk โพสต์', url }).catch(() => {});
        } else {
            navigator.clipboard.writeText(url).then(() => {
                if (typeof showToast === 'function') showToast('📋 คัดลอกลิงก์แล้ว!', 'success');
            }).catch(() => {
                if (typeof showToast === 'function') showToast('📋 ' + url, 'info');
            });
        }
    };

    /* ─── Helpers ─────────────────────────────────────────────── */
    function _esc(s) {
        if (!s) return '';
        const d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }

    function _fmtTime(ts) {
        if (!ts) return '';
        let d;
        if (ts.seconds) d = new Date(ts.seconds * 1000);   // D1 API: { seconds }
        else if (ts.toDate) d = ts.toDate();                // Firestore Timestamp
        else d = new Date(ts);                              // epoch / ISO string
        if (isNaN(d)) return '';
        const diff = Math.floor((Date.now() - d) / 1000);
        if (diff < 60)    return 'เพิ่งโพสต์';
        if (diff < 3600)  return Math.floor(diff / 60) + ' นาทีที่แล้ว';
        if (diff < 86400) return Math.floor(diff / 3600) + ' ชั่วโมงที่แล้ว';
        return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
    }

    function _getMyAvatar() {
        const el = document.getElementById('pcCreateAvatar') ||
                   document.getElementById('pcTopProfileImg');
        return el?.src || 'assets/images/logo.png';
    }

    /* ─── ESC to close ────────────────────────────────────────── */
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && document.getElementById('pcCommentsOverlay')) {
            window.closeComments();
        }
    });

})();
