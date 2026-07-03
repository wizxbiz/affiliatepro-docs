/**
 * 🛡️ Admin Controller & User State Management
 */

async function checkAdminStatus() {
    try {
        if (typeof WizmobizAuth === 'undefined') return;
        const user = WizmobizAuth.getUser();
        if (!user) return;

        const whitelistedIds = [
            'Ud9bec6d2ea945cf4330a69cb74ac93cf', // LINE ID
            'google_uid_here'
        ];

        if (user.role === 'admin' || user.role === 'super_admin' || whitelistedIds.includes(user.uid) || whitelistedIds.includes(user.lineUserId)) {
            window.isAdmin = true;
            const fab = document.getElementById('adminFab');
            if (fab) fab.style.setProperty('display', 'flex', 'important');
            console.log('Admin Access Granted');
        }

        window.currentUserId = user.uid;
        window.currentLineUserId = user.lineUserId;

        if (window.currentUserId) {
            const likedTab = document.getElementById('likedTabBtn');
            if (likedTab) likedTab.style.display = 'inline-flex';

            const doc = await db.collection('user_likes').doc(window.currentUserId).get();
            if (doc.exists) {
                window.userLikedIds = doc.data().postIds || [];
            }

            const userDoc = await db.collection('users').doc(window.currentUserId).get();
            if (userDoc.exists) {
                const data = userDoc.data();
                window.userFollowingIds = data.following || [];
                updateBottomNavProfile(data);
            } else {
                updateBottomNavProfile(user);
            }
        }
    } catch (error) {
        console.log('Admin check skipped:', error);
    }
}

function updateBottomNavProfile(userData) {
    const navItems = document.querySelectorAll('.bottom-nav-item');
    const channelBtn = Array.from(navItems).find(btn => btn.getAttribute('href') === 'channel' || btn.textContent.includes('ช่อง'));

    if (channelBtn) {
        const name = userData.displayName || userData.name || userData.username || 'ช่องของฉัน';
        const pic = userData.pictureUrl || userData.photoURL || userData.picture || userData.avatar;

        if (pic) {
            channelBtn.innerHTML = `
                <div style="width: 28px; height: 28px; border-radius: 50%; overflow: hidden; margin-bottom: 2px; border: 2px solid #ff6b35;">
                    <img src="${pic}" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <span style="font-size: 0.65rem;">${escapeHtml(name.split(' ')[0])}</span>
            `;
            if (channelBtn.classList.contains('active')) {
                const div = channelBtn.querySelector('div');
                if (div) div.style.transform = 'translateY(-5px) scale(1.1)';
            }
        } else {
            const span = channelBtn.querySelector('span');
            if (span) span.textContent = name.split(' ')[0];
        }
    }
}

function updateStats(posts) {
    window.totalPostsCount = posts.length;
    window.totalLikesCount = posts.reduce((sum, p) => sum + (p.likes || 0), 0);
    const totalProductsCount = posts.filter(p => p.linkedProductId).length;

    if (typeof animateNumber === 'function') {
        animateNumber('totalPosts', window.totalPostsCount);
        animateNumber('totalLikes', window.totalLikesCount);
        animateNumber('todayPosts', totalProductsCount);
    }
}



/* ── Admin FAB & Ads Manager ──────────────────────────── */

window.toggleAdminMenu = function () {
    const fab = document.getElementById('adminFab');
    if (fab) fab.classList.toggle('active');
};

let _adsManagerModal = null;
let _allAdsList = [];

window.openAdManager = function () {
    if (!_adsManagerModal && typeof bootstrap !== 'undefined') {
        const el = document.getElementById('adManagerModal');
        if (el) _adsManagerModal = new bootstrap.Modal(el);
    }
    if (_adsManagerModal) _adsManagerModal.show();

    const adminFab = document.getElementById('adminFab');
    if (adminFab) adminFab.classList.remove('active');
    loadAdsList();
};

async function loadAdsList() {
    const container = document.getElementById('adListContainer');
    if (!container || !window.db) return;

    container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-light"></div></div>';

    try {
        const snapshot = await window.db.collection('marketplace_ads').orderBy('order').get();
        _allAdsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderAdsList();
    } catch (err) {
        console.error('Error loading ads:', err);
        container.innerHTML = '<p class="text-center text-danger">โหลดข้อมูลล้มเหลว</p>';
    }
}

function renderAdsList() {
    const container = document.getElementById('adListContainer');
    if (!container) return;

    if (_allAdsList.length === 0) {
        container.innerHTML = '<p class="text-center text-muted py-5">ไม่มีโฆษณา</p>';
        return;
    }

    container.innerHTML = _allAdsList.map(ad => `
        <div class="ad-item-card">
            <img src="${ad.imageUrl}" class="ad-card-img" onerror="this.onerror=null; this.src='assets/images/logo.png'">
            <div style="flex:1;">
                <h6 class="mb-1 text-white">${ad.title || 'Untitled'}</h6>
                <div class="d-flex gap-2 align-items-center">
                    <span class="badge bg-secondary">${ad.type || 'banner'}</span>
                    <span class="ad-status-badge ${ad.isActive ? 'status-active' : 'status-inactive'}">
                        ${ad.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <small class="text-muted"><i class="fas fa-eye"></i> ${ad.views || 0} <i class="fas fa-mouse-pointer ms-2"></i> ${ad.clicks || 0}</small>
                </div>
            </div>
            <div class="d-flex gap-2">
                <button class="btn btn-sm btn-outline-primary" onclick="editAd('${ad.id}')"><i class="fas fa-pen"></i></button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteAd('${ad.id}')"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

window.showAdTab = function (tab) {
    document.querySelectorAll('.ad-nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.ad-view').forEach(view => view.classList.remove('active'));

    if (tab === 'list') {
        const btn = document.querySelector('.ad-nav-btn:nth-child(1)');
        const view = document.getElementById('adListView');
        if (btn) btn.classList.add('active');
        if (view) view.classList.add('active');
        loadAdsList();
    } else {
        const btn = document.querySelector('.ad-nav-btn:nth-child(2)');
        const view = document.getElementById('adFormView');
        if (btn) btn.classList.add('active');
        if (view) view.classList.add('active');
    }
};

window.resetAdForm = function () {
    const form = document.getElementById('adForm');
    if (form) form.reset();
    const idField = document.getElementById('editAdId');
    if (idField) idField.value = '';
    const img = document.getElementById('adImagePreview');
    if (img) img.style.display = 'none';
};

window.previewAdImage = function () {
    const urlField = document.getElementById('adImageUrl');
    const img = document.getElementById('adImagePreview');
    if (urlField && img) {
        const url = urlField.value;
        img.src = url || '';
        img.style.display = url ? 'block' : 'none';
    }
};

window.editAd = function (id) {
    const ad = _allAdsList.find(a => a.id === id);
    if (!ad) return;

    const fields = {
        'editAdId': ad.id,
        'adTitle': ad.title || '',
        'adType': ad.type || 'banner',
        'adOrder': ad.order || 0,
        'adImageUrl': ad.imageUrl || '',
        'adTargetUrl': ad.targetUrl || '',
        'adStartDate': ad.startDate || '',
        'adEndDate': ad.endDate || '',
        'adIsActive': ad.isActive !== false
    };

    for (const [key, val] of Object.entries(fields)) {
        const el = document.getElementById(key);
        if (el) {
            if (el.type === 'checkbox') el.checked = val;
            else el.value = val;
        }
    }

    window.previewAdImage();
    window.showAdTab('form');
};

window.handleSaveAd = async function (event) {
    if (event) event.preventDefault();
    if (!window.db) return;

    const id = document.getElementById('editAdId')?.value;
    const adData = {
        title: document.getElementById('adTitle')?.value,
        type: document.getElementById('adType')?.value,
        order: parseInt(document.getElementById('adOrder')?.value) || 0,
        imageUrl: document.getElementById('adImageUrl')?.value,
        targetUrl: document.getElementById('adTargetUrl')?.value,
        startDate: document.getElementById('adStartDate')?.value,
        endDate: document.getElementById('adEndDate')?.value,
        isActive: document.getElementById('adIsActive')?.checked,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        if (id) {
            await window.db.collection('marketplace_ads').doc(id).update(adData);
            alert('อัปเดตโฆษณาเรียบร้อย');
        } else {
            adData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            
            // Add createdBy for security rules
            const currentUser = typeof WizmobizAuth !== 'undefined' ? WizmobizAuth.getUser() : null;
            adData.createdBy = currentUser ? (currentUser.lineUserId || currentUser.uid) : 'admin';
            
            adData.views = 0;
            adData.clicks = 0;
            await window.db.collection('marketplace_ads').add(adData);
            alert('สร้างโฆษณาเรียบร้อย');
        }
        window.showAdTab('list');
    } catch (error) {
        alert('เกิดข้อผิดพลาด: ' + error.message);
    }
};

window.deleteAd = async function (id) {
    if (!confirm('ยืนยันที่จะลบโฆษณานี้?')) return;
    try {
        await window.db.collection('marketplace_ads').doc(id).delete();
        loadAdsList();
    } catch (error) {
        console.error('Error deleting ad:', error);
        alert('ลบไม่สำเร็จ');
    }
};
