/**
 * 📲 PWA & Service Worker Manager
 * Handles registration, update detection, and notification routing.
 */

(function () {
    'use strict';

    // 1. Service Worker Registration
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js', { scope: '/', updateViaCache: 'none' })
                .then(reg => {
                    console.log('[PWA] SW registered:', reg.scope);

                    // Detect new SW waiting (update available)
                    reg.addEventListener('updatefound', () => {
                        const newWorker = reg.installing;
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                showSwUpdateToast(newWorker);
                            }
                        });
                    });

                    // Handle NOTIF_CLICK from SW
                    navigator.serviceWorker.addEventListener('message', e => {
                        if (e.data?.type === 'NOTIF_CLICK' && e.data.url) {
                            handleNotificationClick(e.data);
                        }
                    });
                })
                .catch(err => console.warn('[PWA] SW failed:', err));
        });
    }

    // 2. Update Detection Toast
    function showSwUpdateToast(worker) {
        const msg = '🆕 อัพเดทใหม่พร้อมใช้งาน!';
        if (typeof showToast === 'function') {
            showToast(msg + ' กำลังโหลดใหม่...', 'info', 6000);
            setTimeout(() => {
                worker.postMessage('skipWaiting');
                window.location.reload();
            }, 5000);
        } else {
            const banner = document.createElement('div');
            banner.style.cssText = 'position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:#6366f1;color:#fff;padding:12px 20px;border-radius:24px;z-index:99999;font-family:Kanit,sans-serif;font-size:14px;display:flex;align-items:center;gap:12px;box-shadow:0 8px 30px rgba(0,0,0,0.4);cursor:pointer';
            banner.innerHTML = `<span>${msg}</span><button style="background:rgba(255,255,255,0.25);border:none;color:#fff;padding:4px 12px;border-radius:12px;font-family:Kanit,sans-serif;cursor:pointer">โหลดใหม่</button>`;
            banner.querySelector('button').onclick = () => {
                worker.postMessage('skipWaiting');
                window.location.reload();
            };
            document.body.appendChild(banner);
        }
    }

    // 3. Notification Routing
    function handleNotificationClick(data) {
        const url = data.url;
        const action = data.action;

        if (window.TukTukNotify) window.TukTukNotify.clearBadge();

        if (url) {
            try {
                const target = new URL(url, location.origin);
                if (target.pathname !== location.pathname || target.search !== location.search) {
                    location.href = url;
                    return;
                }
            } catch (_) { }
        }

        if (action === 'reply' || (url && url.includes('messages'))) {
            if (typeof openInChat === 'function') openInChat();
        } else if (url && url.includes('seller-dashboard')) {
            location.href = url;
        }
    }

    // 4. PWA Install Prompt
    document.addEventListener('DOMContentLoaded', () => {
        if (window.TukTukPWA) window.TukTukPWA.show();
    });

})();
