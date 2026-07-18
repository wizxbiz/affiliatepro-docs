/**
 * 📢 Ad System & Management (Campaigns, Banners, Manager UI)
 */

let adsManagerModal = null;
let allAdsList = [];

async function loadAds() {
    const banner = document.getElementById('adBanner');
    if (!banner) return;

    try {
        const snapshot = await db.collection('marketplace_ads')
            .where('isActive', '==', true)
            .orderBy('order')
            .get();

        if (snapshot.empty) {
            banner.style.display = 'none';
            return;
        }

        const ads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderAdBanner(ads);
    } catch (error) {
        console.error('Error loading ads:', error);
        banner.style.display = 'none';
    }
}

function renderAdBanner(ads) {
    const banner = document.getElementById('adBanner');
    if (!banner) return;

    banner.innerHTML = `
        <div id="adCarousel" class="carousel slide" data-bs-ride="carousel">
            <div class="carousel-inner">
                ${ads.map((ad, index) => `
                    <div class="carousel-item ${index === 0 ? 'active' : ''}" onclick="logAdClick('${ad.id}', '${ad.targetUrl}')">
                        <img src="${ad.imageUrl}" class="d-block w-100 banner-img" alt="${ad.title}">
                    </div>
                `).join('')}
            </div>
            ${ads.length > 1 ? `
                <button class="carousel-control-prev" type="button" data-bs-target="#adCarousel" data-bs-slide="prev">
                    <span class="carousel-control-prev-icon"></span>
                </button>
                <button class="carousel-control-next" type="button" data-bs-target="#adCarousel" data-bs-slide="next">
                    <span class="carousel-control-next-icon"></span>
                </button>
            ` : ''}
        </div>
    `;
    banner.style.display = 'block';
}

function logAdClick(adId, targetUrl) {
    db.collection('marketplace_ads').doc(adId).update({
        clicks: firebase.firestore.FieldValue.increment(1)
    });
    if (targetUrl) window.open(targetUrl, '_blank');
}

/* ── Ad Manager UI (Admin) ── */

function openAdManager() {
    if (!adsManagerModal) {
        const modalEl = document.getElementById('adManagerModal');
        if (modalEl) adsManagerModal = new bootstrap.Modal(modalEl);
    }
    if (adsManagerModal) adsManagerModal.show();

    // Close FAB menu if open
    const adminFab = document.getElementById('adminFab');
    if (adminFab) adminFab.classList.remove('active');

    loadAdsList();
}

async function loadAdsList() {
    const container = document.getElementById('adListContainer');
    if (!container) return;

    container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-light"></div></div>';

    try {
        const snapshot = await db.collection('marketplace_ads').orderBy('order').get();
        allAdsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderAdsList();
    } catch (err) {
        console.error('Error loading ads:', err);
        container.innerHTML = '<p class="text-center text-danger">โหลดข้อมูลล้มเหลว</p>';
    }
}

function renderAdsList() {
    const container = document.getElementById('adListContainer');
    if (!container) return;
    if (!allAdsList.length) {
        container.innerHTML = '<p class="text-center text-muted py-5">ไม่มีโฆษณา</p>';
        return;
    }
    container.innerHTML = allAdsList.map(ad => `
        <div class="ad-item-card">
            <img src="${ad.imageUrl}" class="ad-card-img"
                onerror="this.onerror=null; this.src='https://placehold.co/60'">
            <div style="flex:1;">
                <h6 class="mb-1 text-white">${ad.title || ''}</h6>
                <div class="d-flex gap-2 align-items-center">
                    <span class="badge bg-secondary">${ad.type || ''}</span>
                    <span class="ad-status-badge ${ad.isActive ? 'status-active' : 'status-inactive'}">
                        ${ad.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <small class="text-muted">
                        <i class="fas fa-eye"></i> ${ad.views || 0}
                        <i class="fas fa-mouse-pointer ms-2"></i> ${ad.clicks || 0}
                    </small>
                </div>
            </div>
            <div class="d-flex gap-2">
                <button class="btn btn-sm btn-outline-primary" onclick="editAd('${ad.id}')">
                    <i class="fas fa-pen"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteAd('${ad.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function startAdSlider(total) {
    if (window.promoSlideInterval) clearInterval(window.promoSlideInterval);
    if (total <= 1) return;
    window.promoSlideInterval = setInterval(() => nextAdSlide(), 5000);
}

function goToAdSlide(index) {
    const slider = document.getElementById('promoSlider');
    const dots = document.querySelectorAll('.promo-dot');
    const slides = slider ? slider.querySelectorAll('.promo-slide') : [];

    if (!slider || slides.length === 0) return;

    if (index < 0) index = slides.length - 1;
    if (index >= slides.length) index = 0;

    window.currentPromoSlide = index;
    slider.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
}

function nextAdSlide() {
    const slides = document.querySelectorAll('.promo-slide');
    if (slides.length > 0) goToAdSlide((window.currentPromoSlide + 1) % slides.length);
}

function prevAdSlide() {
    const slides = document.querySelectorAll('.promo-slide');
    if (slides.length > 0) goToAdSlide((window.currentPromoSlide - 1 + slides.length) % slides.length);
}

async function handleAdClick(adId, targetUrl) {
    try {
        await db.collection('marketplace_ads').doc(adId).update({
            clicks: firebase.firestore.FieldValue.increment(1)
        });
    } catch (e) {
        console.warn('Click tracking failed', e);
    } finally {
        if (targetUrl) window.open(targetUrl, '_blank');
    }
}

/* ── Admin UI Helpers ── */

function toggleAdminMenu() {
    const fab = document.getElementById('adminFab');
    if (fab) fab.classList.toggle('active');
}

function showAdTab(tab) {
    document.querySelectorAll('.ad-nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.ad-view').forEach(view => view.classList.remove('active'));
    if (tab === 'list') {
        const btn = document.querySelector('.ad-nav-btn:nth-child(1)');
        if (btn) btn.classList.add('active');
        const view = document.getElementById('adListView');
        if (view) view.classList.add('active');
        loadAdsList();
    } else {
        const btn = document.querySelector('.ad-nav-btn:nth-child(2)');
        if (btn) btn.classList.add('active');
        const view = document.getElementById('adFormView');
        if (view) view.classList.add('active');
    }
}

function resetAdForm() {
    const form = document.getElementById('adForm');
    if (form) form.reset();
    const editId = document.getElementById('editAdId');
    if (editId) editId.value = '';
    const preview = document.getElementById('adImagePreview');
    if (preview) preview.style.display = 'none';
}

function previewAdImage() {
    const url = document.getElementById('adImageUrl')?.value;
    const img = document.getElementById('adImagePreview');
    if (!img) return;
    if (url) { img.src = url; img.style.display = 'block'; }
    else { img.style.display = 'none'; }
}

function editAd(id) {
    const ad = allAdsList.find(a => a.id === id);
    if (!ad) return;
    document.getElementById('editAdId').value = ad.id;
    document.getElementById('adTitle').value = ad.title || '';
    document.getElementById('adType').value = ad.type || 'banner';
    document.getElementById('adOrder').value = ad.order || 0;
    document.getElementById('adImageUrl').value = ad.imageUrl || '';
    document.getElementById('adTargetUrl').value = ad.targetUrl || '';
    document.getElementById('adStartDate').value = ad.startDate || '';
    document.getElementById('adEndDate').value = ad.endDate || '';
    document.getElementById('adIsActive').checked = ad.isActive !== false;
    previewAdImage();
    showAdTab('form');
}

/** Ensure Firebase Auth is active before any admin write. */
async function _ensureFirebaseAuth() {
    if (firebase.auth().currentUser) return true;
    // Try to restore via refreshWebSession CF
    try {
        const raw = localStorage.getItem('wizmobiz_session') ||
                    localStorage.getItem('tuktuk_line_session');
        if (!raw) return false;
        const session = JSON.parse(raw);
        const userId = session.lineUserId || session.uid;
        if (!userId) return false;
        const API_BASE = '';
        const resp = await fetch(`${API_BASE}/api/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
        });
        const data = await resp.json();
        if (data.sessionToken) {
            await firebase.auth().signInWithCustomToken(data.sessionToken);
            return !!firebase.auth().currentUser;
        }
    } catch (e) {
        console.warn('[ad-system] _ensureFirebaseAuth failed:', e.message);
    }
    return false;
}

async function handleSaveAd(event) {
    event.preventDefault();
    const id = document.getElementById('editAdId').value;
    const adData = {
        title: document.getElementById('adTitle').value,
        type: document.getElementById('adType').value,
        order: parseInt(document.getElementById('adOrder').value) || 0,
        imageUrl: document.getElementById('adImageUrl').value,
        targetUrl: document.getElementById('adTargetUrl').value,
        startDate: document.getElementById('adStartDate').value,
        endDate: document.getElementById('adEndDate').value,
        isActive: document.getElementById('adIsActive').checked,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };
    try {
        // Ensure Firebase Auth is active (required by Firestore rules)
        const authed = await _ensureFirebaseAuth();
        if (!authed) {
            alert('⚠️ กรุณาออกจากระบบและเข้าสู่ระบบใหม่เพื่อใช้งานส่วนนี้ (Firebase Auth หมดอายุ)');
            return;
        }
        if (id) {
            await db.collection('marketplace_ads').doc(id).update(adData);
            alert('อัปเดตโฆษณาเรียบร้อย');
        } else {
            adData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            adData.views = 0; adData.clicks = 0;
            await db.collection('marketplace_ads').add(adData);
            alert('สร้างโฆษณาเรียบร้อย');
        }
        showAdTab('list');
    } catch (error) {
        if (error.code === 'permission-denied' || error.message.includes('permissions')) {
            alert('⚠️ ไม่มีสิทธิ์เขียนข้อมูล\nกรุณาออกจากระบบและเข้าสู่ระบบใหม่');
        } else {
            alert('เกิดข้อผิดพลาด: ' + error.message);
        }
    }
}

async function deleteAd(id) {
    if (!confirm('ยืนยันที่จะลบโฆษณานี้?')) return;
    try {
        await db.collection('marketplace_ads').doc(id).delete();
        loadAdsList();
    } catch (error) {
        console.error('Error deleting ad:', error);
        alert('ลบไม่สำเร็จ');
    }
}
