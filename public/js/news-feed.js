/**
 * 📰 News Feed & Community Posts Engine
 */

async function loadNewsFeed() {
    return new Promise((resolve) => {
        const timeout = setTimeout(() => resolve([]), 5000);
        db.collection('news_feed')
            .orderBy('createdAt', 'desc')
            .limit(5)
            .get()
            .then(snapshot => {
                clearTimeout(timeout);
                const feed = [];
                snapshot.forEach(doc => feed.push({ id: doc.id, ...doc.data() }));
                resolve(feed);
            })
            .catch(() => {
                clearTimeout(timeout);
                resolve([]);
            });
    });
}

function updateHeartUI(postId, liked) {
    const elements = document.querySelectorAll(`[onclick*="likePost('${postId}')"]`);
    elements.forEach(el => {
        const icon = el.querySelector('i');
        const span = el.querySelector('span');
        if (liked) {
            el.classList.add('liked');
            if (icon) icon.className = 'fas fa-heart text-danger';
            if (span) {
                const current = parseInt(span.textContent.replace(/,/g, '')) || 0;
                span.textContent = (current + 1).toLocaleString();
            }
        }
    });
}

async function likePost(postId) {
    try {
        if (window.currentUserId) {
            if (window.userLikedIds.includes(postId)) {
                if (typeof showToast === 'function') showToast('ℹ️ คุณกดถูกใจโพสต์นี้ไปแล้วครับ', 'info');
                return;
            }
            await db.collection('community_posts').doc(postId).update({
                likes: firebase.firestore.FieldValue.increment(1)
            });
            await db.collection('user_likes').doc(window.currentUserId).set({
                postIds: firebase.firestore.FieldValue.arrayUnion(postId),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            window.userLikedIds.push(postId);
            updateHeartUI(postId, true);
            if (typeof showToast === 'function') showToast('💖 บันทึกไว้ในรายการที่ชอบแล้ว', 'success');
            return;
        }

        const guestLikes = JSON.parse(sessionStorage.getItem('guestLikes') || '[]');
        if (guestLikes.includes(postId)) {
            if (typeof showToast === 'function') showToast('ℹ️ คุณกดถูกใจโพสต์นี้ในรอบการเยี่ยมชมนี้ไปแล้วครับ', 'info');
            return;
        }
        await db.collection('community_posts').doc(postId).update({
            likes: firebase.firestore.FieldValue.increment(1)
        });
        guestLikes.push(postId);
        sessionStorage.setItem('guestLikes', JSON.stringify(guestLikes));
        updateHeartUI(postId, true);
        if (typeof showToast === 'function') showToast('❤️ ขอบคุณที่ถูกใจ! สมัครสมาชิกเพื่อเก็บวิดีโอนี้ไว้ดูภายหลังได้นะครับ', 'info');
    } catch (error) {
        console.error('Error liking post:', error);
    }
}

function sharePost(postId, title) {
    const url = `https://tuktukfeed.com/community-share?id=${postId}`;
    if (navigator.share) {
        navigator.share({ title: title, text: `${title} - Wizmobiz Community`, url: url });
    } else {
        navigator.clipboard.writeText(url).then(() => {
            alert('📋 คัดลอกลิงก์แล้ว!');
        });
    }
}

async function openComments(postId) {
    window.currentCommentPostId = postId;
    const container = document.getElementById('commentList');
    if (!container) return;

    container.innerHTML = '<div class="text-center py-4"><div class="spinner-border spinner-border-sm text-danger"></div></div>';
    const input = document.getElementById('commentInput');
    if (input) input.value = '';

    if (window.commentModal) window.commentModal.show();

    try {
        const snapshot = await db.collection('community_posts').doc(postId)
            .collection('comments').orderBy('createdAt', 'desc').get();

        container.innerHTML = '';
        const comments = [];
        snapshot.forEach(doc => comments.push({ id: doc.id, ...doc.data() }));

        const titleEl = document.getElementById('commentCountTitle');
        if (titleEl) titleEl.textContent = `ความคิดเห็น (${comments.length})`;

        if (comments.length === 0) {
            container.innerHTML = '<div class="text-center text-muted py-5">ยังไม่มีความคิดเห็น มาร่วมแสดงความคิดเห็นคนแรกกัน!</div>';
            return;
        }

        comments.forEach(c => {
            const time = c.createdAt ? new Date(c.createdAt.toDate()).toLocaleString('th-TH') : 'เมื่อสักครู่';
            const item = document.createElement('div');
            item.className = 'comment-item';
            item.innerHTML = `
                <img src="${c.userAvatar || 'assets/images/logo.png'}" class="comment-avatar">
                <div class="comment-body">
                    <div class="comment-user">
                        ${typeof escapeHtml === 'function' ? escapeHtml(c.userName || 'ผู้ใช้งาน') : (c.userName || 'ผู้ใช้งาน')}
                        <span class="comment-reply-btn" onclick="replyTo('${escapeHtml(c.userName)}')">ตอบกลับ</span>
                    </div>
                    <div class="comment-text">${typeof filterProfanity === 'function' ? escapeHtml(filterProfanity(c.text)) : escapeHtml(c.text)}</div>
                    <div class="comment-time">${time}</div>
                </div>
            `;
            container.appendChild(item);
        });
    } catch (error) {
        container.innerHTML = '<div class="text-center text-danger py-4">ไม่สามารถโหลดความคิดเห็นได้</div>';
    }
}

function replyTo(username) {
    const input = document.getElementById('commentInput');
    if (input) {
        input.value = `@${username} ` + input.value;
        input.focus();
    }
}

async function submitComment() {
    const input = document.getElementById('commentInput');
    const text = input ? input.value.trim() : '';
    if (!text || !window.currentCommentPostId) return;

    if (typeof containsProfanity === 'function' && containsProfanity(text)) {
        if (typeof showToast === 'function') showToast('⚠️ ความคิดเห็นขัดต่อกฏการใช้งาน', 'warning');
        return;
    }

    const user = typeof WizmobizAuth !== 'undefined' ? WizmobizAuth.getUser() : null;
    if (!user) {
        alert('⚠️ กรุณาเข้าสู่ระบบก่อนแสดงความคิดเห็น');
        return;
    }

    const sendBtn = document.getElementById('sendCommentBtn');
    if (sendBtn) sendBtn.disabled = true;

    try {
        const commentData = {
            text: text,
            userId: user.uid || user.lineUserId,
            userName: user.displayName || user.name || 'ผู้ใช้งาน',
            userAvatar: user.pictureUrl || user.photoURL || 'assets/images/logo.png',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('community_posts').doc(window.currentCommentPostId).collection('comments').add(commentData);
        await db.collection('community_posts').doc(window.currentCommentPostId).update({
            commentsCount: firebase.firestore.FieldValue.increment(1)
        });

        if (input) input.value = '';
        openComments(window.currentCommentPostId);
    } catch (error) {
        alert('❌ ไม่สามารถส่งความคิดเห็นได้');
    } finally {
        if (sendBtn) sendBtn.disabled = false;
    }
}
