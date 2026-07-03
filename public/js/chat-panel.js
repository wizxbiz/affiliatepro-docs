/**
 * 💬 In-page Chat Panel Engine
 * Handles Real-time Firebase Conversations, Listeners, and UI updates.
 */
(function () {
    'use strict';

    /* ── State ── */
    let _open = false;
    let _currentView = 'list';           // 'list' | 'thread'
    let _currentConvId = null;
    let _currentCollection = 'conversations';
    let _myUid = null;
    let _unsubConvs = null;              // unsubscribe: conversation list
    let _unsubMsgs = null;              // unsubscribe: message thread
    let _unsubOnline = null;
    let _unsubTyping = null;
    let _allConvs = [];                 // cached for search filter
    let _typingTimeout = null;

    /* ── Helpers ── */
    function getMyUid() {
        if (_myUid) return _myUid;
        try {
            const u = typeof WizmobizAuth !== 'undefined' ? WizmobizAuth.getUser() : null;
            if (u) _myUid = u.uid || u.lineUserId || null;
        } catch (_) { }
        return _myUid;
    }

    function timeLabel(ts) {
        if (!ts) return '';
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        const now = new Date();
        const diff = now - d;
        if (diff < 60000) return 'เมื่อกี้';
        if (diff < 3600000) return Math.floor(diff / 60000) + ' นาที';
        if (diff < 86400000) return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
        return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
    }

    function scrollToBottom() {
        const area = document.getElementById('icMessages');
        if (area) {
            requestAnimationFrame(() => {
                area.scrollTop = area.scrollHeight;
            });
        }
    }

    /* ── Open / Close ── */
    window.openInChat = function () {
        const panel = document.getElementById('inChatPanel');
        const overlay = document.getElementById('inChatOverlay');
        if (!panel) return;
        panel.classList.add('open');
        overlay.classList.add('active');
        _open = true;
        if (_currentView === 'list') icStartListening();
    };

    window.closeInChat = function () {
        const panel = document.getElementById('inChatPanel');
        const overlay = document.getElementById('inChatOverlay');
        if (panel) panel.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
        _open = false;
    };

    /* ── Back to List ── */
    window.icBackToList = function () {
        if (_unsubMsgs) { _unsubMsgs(); _unsubMsgs = null; }
        if (_unsubOnline) { _unsubOnline(); _unsubOnline = null; }
        document.getElementById('icListView').style.display = 'flex';
        document.getElementById('icThreadView').style.display = 'none';
        _currentView = 'list';
        _currentConvId = null;
    };

    /* ── Listen to Conversation List ── */
    function icStartListening() {
        const uid = getMyUid();
        if (!uid || typeof TukTukChat === 'undefined') {
            showListEmpty();
            return;
        }
        if (_unsubConvs) return;

        let _dmConvs = [], _prodConvs = [];
        const merge = () => {
            const seen = new Set();
            _allConvs = [..._dmConvs, ..._prodConvs].filter(c => {
                if (seen.has(c.id)) return false;
                seen.add(c.id); return true;
            }).sort((a, b) => {
                const ta = a.lastMessageAt?.toMillis?.() || 0;
                const tb = b.lastMessageAt?.toMillis?.() || 0;
                return tb - ta;
            });
            icRenderList(_allConvs);
        };

        _unsubConvs = TukTukChat.listenConversations(uid, convs => {
            _dmConvs = convs.map(c => ({ ...c, _col: 'conversations' }));
            merge();
        });

        const unsubProd = TukTukChat.listenProductChats(uid, chats => {
            _prodConvs = chats.map(c => ({ ...c, _col: 'product_chats' }));
            merge();
        });
        const origUnsub = _unsubConvs;
        _unsubConvs = () => { origUnsub(); unsubProd(); };
    }

    function icRenderList(convs) {
        const loader = document.getElementById('icListLoader');
        const empty = document.getElementById('icListEmpty');
        const list = document.getElementById('icConvList');
        if (loader) loader.style.display = 'none';

        if (!convs.length) {
            if (empty) empty.style.display = 'flex';
            return;
        }
        if (empty) empty.style.display = 'none';

        const uid = getMyUid();
        list.querySelectorAll('.ic-conv-row').forEach(el => el.remove());

        convs.forEach(conv => {
            const col = conv._col || 'conversations';
            const isDM = col === 'conversations';
            const unread = isDM
                ? (conv[`unreadCount_${uid}`] || 0)
                : (conv._role === 'buyer' ? (conv.unreadCountBuyer || 0) : (conv.unreadCountSeller || 0));

            const otherUid = isDM
                ? (conv.participants || []).find(p => p !== uid) || ''
                : (conv._role === 'buyer' ? conv.sellerId : conv.buyerId) || '';

            const name = conv.otherName || conv.shopName || conv.sellerName || conv.buyerName || (otherUid ? otherUid.substring(0, 10) + '...' : 'ผู้ใช้');
            const preview = conv.lastMessage || (isDM ? 'เริ่มบทสนทนา...' : conv.productName || 'สินค้า');
            const timeStr = timeLabel(conv.lastMessageAt);
            const avatarUrl = conv.otherAvatar || conv.sellerAvatar || conv.buyerAvatar || '';
            const productName = !isDM ? (conv.productName || '') : '';

            const row = document.createElement('div');
            row.className = 'ic-conv-row' + (unread > 0 ? ' unread' : '');
            row.dataset.convId = conv.id;
            row.innerHTML = `
            <div class="ic-av">
                ${avatarUrl ? `<img src="${avatarUrl}" loading="lazy" onerror="this.style.display='none'">` : '<i class="fas fa-user"></i>'}
            </div>
            <div class="ic-conv-meta">
                <div class="ic-conv-name">${productName ? '🛒 ' + productName : name}</div>
                <div class="ic-conv-preview">${preview}</div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px;flex-shrink:0;">
                <div class="ic-conv-time">${timeStr}</div>
                ${unread > 0 ? `<div class="ic-conv-badge">${unread > 99 ? '99+' : unread}</div>` : ''}
            </div>`;
            row.addEventListener('click', () => icOpenThread(conv.id, col, productName || name, otherUid, avatarUrl));
            list.appendChild(row);
        });

        const totalUnread = convs.reduce((sum, c) => {
            const uid2 = getMyUid();
            const col = c._col || 'conversations';
            return sum + (col === 'conversations'
                ? (c[`unreadCount_${uid2}`] || 0)
                : (c._role === 'buyer' ? (c.unreadCountBuyer || 0) : (c.unreadCountSeller || 0)));
        }, 0);
        updateChatBadges(totalUnread);
    }

    function updateChatBadges(total) {
        const fab = document.getElementById('icFabBadge');
        if (fab) {
            if (total > 0) { fab.style.display = 'flex'; fab.textContent = total > 99 ? '99+' : total; }
            else { fab.style.display = 'none'; }
        }
        if (typeof window.updatePillChatCount === 'function') window.updatePillChatCount(total);
    }

    function showListEmpty() {
        const loader = document.getElementById('icListLoader');
        const empty = document.getElementById('icListEmpty');
        if (loader) loader.style.display = 'none';
        if (empty) empty.style.display = 'flex';
    }

    window.icFilterConvs = function (query) {
        const q = query.trim().toLowerCase();
        if (!q) { icRenderList(_allConvs); return; }
        const filtered = _allConvs.filter(c => {
            const name = (c.otherName || c.shopName || c.productName || '').toLowerCase();
            const preview = (c.lastMessage || '').toLowerCase();
            return name.includes(q) || preview.includes(q);
        });
        icRenderList(filtered);
    };

    window.icOpenThread = function (convId, collection, displayName, otherUid, avatarUrl) {
        _currentConvId = convId;
        _currentCollection = collection || 'conversations';
        _currentView = 'thread';

        document.getElementById('icListView').style.display = 'none';
        const threadView = document.getElementById('icThreadView');
        threadView.style.display = 'flex';

        document.getElementById('icThreadName').textContent = displayName || 'ผู้ใช้';
        document.getElementById('icThreadStatus').textContent = 'กำลังโหลด...';
        document.getElementById('icThreadStatus').className = 'ic-thread-status';
        const avEl = document.getElementById('icThreadAvatar');
        avEl.innerHTML = avatarUrl ? `<img src="${avatarUrl}" loading="lazy" onerror="this.innerHTML='<i class=\\"fas fa-user\\"></i>'">` : '<i class="fas fa-user"></i>';

        const msgInput = document.getElementById('icMsgInput');
        document.getElementById('icMessages').innerHTML = '';
        msgInput.value = (typeof TukTukChat !== 'undefined') ? TukTukChat.getDraft(convId) : '';

        const uid = getMyUid();
        if (uid && typeof TukTukChat !== 'undefined') {
            TukTukChat.markAsRead(convId, _currentCollection, uid);
        }

        if (_unsubOnline) { _unsubOnline(); _unsubOnline = null; }
        if (otherUid && typeof TukTukChat !== 'undefined') {
            _unsubOnline = TukTukChat.listenOnlineStatus(otherUid, isOnline => {
                const el = document.getElementById('icThreadStatus');
                if (!el) return;
                el.textContent = isOnline ? 'ออนไลน์อยู่' : 'ออฟไลน์';
                el.className = 'ic-thread-status' + (isOnline ? ' online' : '');
            });
        }

        if (_unsubMsgs) { _unsubMsgs(); _unsubMsgs = null; }
        if (typeof TukTukChat !== 'undefined') {
            let _firstLoad = true;
            _unsubMsgs = TukTukChat.listenMessages(convId, _currentCollection, msgs => {
                const prevCount = document.querySelectorAll('.ic-msg-bubble').length;
                icRenderMessages(msgs);
                if (!_firstLoad && msgs.length > prevCount) {
                    const lastMsg = msgs[msgs.length - 1];
                    if (lastMsg.senderId !== uid && typeof playNotifSound === 'function') {
                        playNotifSound();
                    }
                }
                _firstLoad = false;
            });
        }
    };

    function icRenderMessages(msgs) {
        const uid = getMyUid();
        const area = document.getElementById('icMessages');
        if (!area) return;

        const atBottom = area.scrollHeight - area.scrollTop - area.clientHeight < 80;
        area.innerHTML = '';
        let lastDateStr = '';

        msgs.forEach(msg => {
            const ts = msg.timestamp || msg.sentAt;
            const d = ts?.toDate ? ts.toDate() : (ts ? new Date(ts) : new Date());
            const dateStr = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });

            if (dateStr !== lastDateStr) {
                lastDateStr = dateStr;
                const div = document.createElement('div');
                div.className = 'ic-msg-date-divider';
                div.textContent = dateStr;
                area.appendChild(div);
            }

            const isMine = msg.senderId === uid;
            const bubble = document.createElement('div');
            bubble.className = 'ic-msg-bubble ' + (isMine ? 'mine' : 'theirs');
            const timeStr = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
            const status = msg.status || (msg.isRead ? 'read' : 'sent');
            const statusIcon = isMine ? `<i class="fas fa-check-double ic-status-icon ${status === 'read' ? 'read' : 'sent'}"></i>` : '';

            if (msg.type === 'image' && msg.imageUrl) {
                bubble.innerHTML = `<img src="${msg.imageUrl}" style="max-width:200px;border-radius:12px;display:block;box-shadow: 0 4px 15px rgba(0,0,0,0.2);" loading="lazy"><div class="ic-msg-time">${timeStr} ${statusIcon}</div>`;
            } else {
                bubble.innerHTML = `${(msg.text || '').replace(/</g, '&lt;').replace(/\n/g, '<br>')}<div class="ic-msg-time">${timeStr} ${statusIcon}</div>`;
            }
            area.appendChild(bubble);
        });
        if (atBottom || msgs.length <= 5) scrollToBottom();
    }

    window.icSend = function () {
        const input = document.getElementById('icMsgInput');
        const text = (input?.value || '').trim();
        if (!text || !_currentConvId) return;
        input.value = '';
        const session = typeof WizmobizAuth !== 'undefined' ? WizmobizAuth.getUser() : null;
        if (!session || typeof TukTukChat === 'undefined') return;
        TukTukChat.sendMessage(_currentConvId, _currentCollection, text, session).catch(err => console.warn('[chat] send failed:', err));
    };

    window.icOnType = function () {
        if (!_currentConvId) return;
        const input = document.getElementById('icMsgInput');
        const text = input.value;
        if (typeof TukTukChat !== 'undefined') TukTukChat.saveDraft(_currentConvId, text);
        if (_currentCollection !== 'conversations') return;
        const uid = getMyUid();
        if (uid && typeof TukTukChat !== 'undefined') TukTukChat.handleTypingInput(_currentConvId, _currentCollection, uid);
    };

    window.icHandleFileUpload = async function (input) {
        if (!input.files || !input.files[0] || !_currentConvId) return;
        const file = input.files[0];
        const sendBtn = document.getElementById('icSendBtn');
        const progressBar = document.getElementById('icUploadProgress');

        try {
            sendBtn.disabled = true;
            progressBar.style.display = 'block'; progressBar.style.width = '30%';
            const res = await TukTukChat.uploadFile(file);
            progressBar.style.width = '100%';
            const session = typeof WizmobizAuth !== 'undefined' ? WizmobizAuth.getUser() : null;
            await TukTukChat.sendMessage(_currentConvId, _currentCollection, '', session, res);
            setTimeout(() => { progressBar.style.display = 'none'; progressBar.style.width = '0'; }, 1000);
        } catch (err) {
            console.error('[chat] upload failed:', err);
            if (window.showNotification) showNotification('อัปโหลดล้มเหลว กรุณาลองใหม่', 'error');
        } finally {
            sendBtn.disabled = false; input.value = '';
        }
    };

    function icAutoInit() {
        const uid = getMyUid();
        if (!uid || typeof TukTukChat === 'undefined') return;
        TukTukChat.listenTotalUnread(uid, total => updateChatBadges(total));
    }

    let _initAttempts = 0;
    function waitAndInit() {
        if (getMyUid()) { icAutoInit(); return; }
        if (_initAttempts++ < 20) setTimeout(waitAndInit, 500);
    }
    setTimeout(waitAndInit, 1000);

    const pcChatIcon = document.querySelector('[onclick*="messages.html"]');
    if (pcChatIcon) {
        pcChatIcon.removeAttribute('href');
        pcChatIcon.addEventListener('click', e => { e.preventDefault(); window.openInChat(); });
    }

})();
