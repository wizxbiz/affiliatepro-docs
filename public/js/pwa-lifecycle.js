/**
 * 📱 PWA Lifecycle — utility functions only
 * SW registration is handled exclusively by pwa-manager.js
 */

function _showSwUpdateToast(worker) {
    const msg = '🆕 อัพเดทใหม่พร้อมใช้งาน!';
    if (typeof showToast === 'function') {
        showToast(msg + ' กำลังโหลดใหม่...', 'info');
        setTimeout(() => {
            worker.postMessage('skipWaiting');
            window.location.reload();
        }, 3000);
    } else {
        const banner = document.createElement('div');
        banner.style.cssText = 'position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:#6366f1;color:#fff;padding:12px 20px;border-radius:24px;z-index:99999;font-family:Kanit,sans-serif;font-size:14px;display:flex;align-items:center;gap:12px;box-shadow:0 8px 30px rgba(0,0,0,0.4);cursor:pointer';
        banner.innerHTML = `<span>${msg}</span><button style="background:rgba(255,255,255,0.25);border:none;color:#fff;padding:4px 12px;border-radius:12px;font-family:Kanit,sans-serif;cursor:pointer">โหลดใหม่</button>`;
        banner.querySelector('button').onclick = () => {
            worker.postMessage('skipWaiting');
            window.location.reload();
        };
        document.body.appendChild(banner);
        setTimeout(() => banner.remove(), 10000);
    }
}

function handleNotifClick(url, action) {
    if (window.TukTukNotify) window.TukTukNotify.clearBadge();

    if (action === 'reply' || (url && url.includes('messages'))) {
        if (typeof openInChat === 'function') openInChat();
        else if (url) window.location.href = url;
    } else if (url) {
        try {
            const target = new URL(url, location.origin);
            if (target.pathname !== location.pathname || target.search !== location.search) {
                window.location.href = url;
            }
        } catch (_) {
            window.location.href = url;
        }
    }
}

// Pull to Refresh Implementation (Shared)
function initPullToRefresh() {
    let startY = 0;
    let isPulling = false;
    const ptrElement = document.getElementById('pullToRefresh');
    if (!ptrElement) return;

    document.addEventListener('touchstart', (e) => {
        if (window.scrollY === 0) {
            startY = e.touches[0].pageY;
            isPulling = true;
        }
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
        if (!isPulling || window.scrollY > 0) return;
        const currentY = e.touches[0].pageY;
        const diff = currentY - startY;

        if (diff > 120) {
            ptrElement.classList.add('visible');
        }
    }, { passive: true });

    document.addEventListener('touchend', async (e) => {
        if (!isPulling) return;
        isPulling = false;

        const ptrVisible = ptrElement.classList.contains('visible');
        if (ptrVisible && window.scrollY === 0) {
            if (typeof loadPosts === 'function') {
                await loadPosts(false);
                if (typeof showToast === 'function') showToast('🔄 รีเฟรชข้อมูลแล้ว', 'success');
            }
            ptrElement.classList.remove('visible');
        } else {
            ptrElement.classList.remove('visible');
        }
    });
}
