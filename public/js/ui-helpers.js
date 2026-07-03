/**
 * ✨ UI Helpers & Card Renderers
 */

function renderPostCard(post) {
    const time = post.createdAt ? new Date(post.createdAt.toDate()).toLocaleString('th-TH') : 'เมื่อสักครู่';
    const author = getAuthorInfo(post);
    const isLiked = window.userLikedIds.includes(post.id);
    const images = post.images || (post.imageUrl ? [post.imageUrl] : []);

    return `
        <div class="news-card mb-4" data-aos="fade-up">
            <div class="news-header">
                <img src="${author.avatar}" class="news-avatar author-avatar-${post.authorId}">
                <div class="news-info">
                    <div class="news-author author-name-${post.authorId}">${escapeHtml(author.name)}</div>
                    <div class="news-time">${time}</div>
                </div>
            </div>
            <div class="news-content">
                <h5 class="fw-bold">${escapeHtml(post.title)}</h5>
                <p class="mb-3">${escapeHtml(filterProfanity(post.content || '')).replace(/\n/g, '<br>')}</p>
                ${renderMediaGallery(post, images)}
            </div>
            <div class="news-footer">
                <div class="footer-action ${isLiked ? 'liked' : ''}" onclick="likePost('${post.id}')">
                    <i class="fa${isLiked ? 's' : 'r'} fa-heart"></i>
                    <span>${(post.likes || 0).toLocaleString()}</span>
                </div>
                <div class="footer-action" onclick="openComments('${post.id}')">
                    <i class="far fa-comment-alt"></i>
                    <span>${(post.commentsCount || 0).toLocaleString()}</span>
                </div>
                <div class="footer-action" onclick="sharePost('${post.id}', '${escapeHtml(post.title)}')">
                    <i class="far fa-share-square"></i>
                </div>
            </div>
        </div>
    `;
}

function renderMediaGallery(post, images) {
    if (images.length === 0) return '';

    if (images.length === 1) {
        const img = typeof images[0] === 'object' ? images[0].url : images[0];
        return `<div class="news-media single"><img src="${img}" class="img-fluid rounded-3" loading="lazy"></div>`;
    }

    // Grid for multiple images
    const gridCount = Math.min(images.length, 4);
    let html = `<div class="news-media-grid grid-${gridCount}">`;
    images.slice(0, gridCount).forEach((img, i) => {
        const url = typeof img === 'object' ? img.url : img;
        const more = (i === 3 && images.length > 4) ? `<div class="more-overlay">+${images.length - 4}</div>` : '';
        html += `<div class="grid-item">${more}<img src="${url}" loading="lazy"></div>`;
    });
    html += '</div>';
    return html;
}

function renderNewsFeedCard(news) {
    return `
        <div class="news-interleaved-card mb-4" onclick="window.location.href='${news.link || '#'}'">
            <div class="badge bg-danger mb-2">HOT NEWS</div>
            <h5 class="fw-bold">${escapeHtml(news.title)}</h5>
            <p class="small text-muted mb-0">${escapeHtml(news.summary)}</p>
        </div>
    `;
}

function renderInterleavedProduct(prod) {
    return `
        <div class="product-interleaved-card mb-4" onclick="window.location.href='product.html?id=${prod.id}'">
            <div class="badge bg-primary mb-2">RECOMMENDED</div>
            <div class="d-flex gap-3">
                <img src="${prod.imageUrl || 'assets/images/logo.png'}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 12px;">
                <div>
                    <h6 class="fw-bold mb-1">${escapeHtml(prod.name)}</h6>
                    <div class="text-primary fw-bold">฿${(prod.price || 0).toLocaleString()}</div>
                </div>
            </div>
        </div>
    `;
}

function renderEmptyState(message) {
    return `
        <div class="text-center py-5">
            <div class="mb-3"><i class="fas fa-ghost fa-3x opacity-25"></i></div>
            <p class="text-muted">${message}</p>
        </div>
    `;
}
function getAuthorInfo(post) {
    return {
        name: post.authorName || 'สมาชิกรถตุ๊กตุ๊ก',
        avatar: post.authorAvatar || 'assets/images/logo.png'
    };
}

// Namespace object — main-feed-engine.js calls UIHelpers.renderPostCard(...)
window.UIHelpers = {
    renderPostCard,
    renderMediaGallery,
    renderNewsFeedCard,
    renderInterleavedProduct,
    renderEmptyState,
    getAuthorInfo
};
/**
 * 📱 Real Implementation of Action Sheet (Bottom Sheet)
 */
window.showActionSheet = function(data) {
    const { title, options } = data;
    
    // Remove existing
    const existing = document.querySelector('.action-sheet-overlay');
    if (existing) existing.remove();
    
    const overlay = document.createElement('div');
    overlay.className = 'action-sheet-overlay';
    overlay.innerHTML = `
        <div class="action-sheet-container">
            <div class="action-sheet-handle"></div>
            ${title ? `<div class="action-sheet-title">${title}</div>` : ''}
            <div class="action-sheet-list">
                ${options.map((opt, idx) => `
                    <div class="action-sheet-item ${opt.cancel ? 'cancel' : ''}" id="as-item-${idx}" style="color: ${opt.color || 'inherit'}">
                        <i class="${opt.icon || 'fas fa-circle'}"></i>
                        <span>${opt.label}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Animate in
    setTimeout(() => overlay.classList.add('active'), 10);
    
    // Bind events
    options.forEach((opt, idx) => {
        const el = document.getElementById(`as-item-${idx}`);
        if (el) {
            el.onclick = () => {
                if (opt.action) opt.action();
                closeActionSheet();
            };
        }
    });
    
    overlay.onclick = (e) => {
        if (e.target === overlay) closeActionSheet();
    };
    
    function closeActionSheet() {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
    }
};

/**
 * 🔘 Generic Open Options Menu
 */
window.openOptions = function(postId) {
    if (window.PWA?.haptic) window.PWA.haptic(20);
    
    if (typeof window.showActionSheet === 'function') {
        window.showActionSheet({
            title: 'โพสต์ #' + (postId ? postId.substring(0, 6) : ''),
            options: [
                { label: 'ไม่สนใจโพสต์นี้', icon: 'fas fa-eye-slash', action: () => showToast('เราจะลดการแสดงผลแนวนี้ลง') },
                { label: 'บันทึกวิดีโอ', icon: 'fas fa-download', action: () => showToast('เริ่มดาวน์โหลด...') },
                { label: 'รายงานพฤติกรรมไม่เหมาะสม', icon: 'fas fa-flag', color: '#ff4444', action: () => showToast('ขอบคุณสำหรับรายงาน จะดำเนินการตรวจสอบ') },
                { label: 'ยกเลิก', icon: 'fas fa-times', cancel: true }
            ]
        });
    } else {
        alert('ตัวเลือกสำหรับโพสต์: ' + postId);
    }
};
