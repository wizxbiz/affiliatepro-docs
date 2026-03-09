/**
 * TukTuk Thailand Service Worker v11 - PWA & Offline Support
 * Strategy: Cache-first for static assets, Network-first for HTML/API
 */

const CACHE_VERSION = 'v15';
const CACHE_NAME = 'tuktuk-app-' + CACHE_VERSION;
const STATIC_CACHE = 'tuktuk-static-' + CACHE_VERSION;
const OFFLINE_URL = '/offline.html';

// Static assets — Cache-first (CSS, JS, images, fonts)
const STATIC_URLS = [
    '/offline.html',
    '/favicon.ico',
    '/manifest.json',
    '/assets/images/icon-192.png',
    '/assets/images/icon-512.png',
    '/assets/images/icon-192-maskable.png',
    '/assets/images/icon-512-maskable.png',
    '/assets/images/logo.png',
    '/assets/images/tuktuk.png',
    '/css/pc-layout.css',
    '/css/tab-nav.css',
    '/js/liff-config.js',
    '/js/pwa-install.js',
    '/js/push-notifications.js',
    '/js/search.js',
    '/js/chat-web.js',
    '/js/r2-upload.js',
    '/js/firebase-config.js',
    '/js/tuktuk-api.js'
];

// HTML pages — Network-first (always fresh)
const PRECACHE_URLS = [
    '/',
    '/index.html',
    '/login.html',
    '/marketplace.html',
    '/community.html',
    '/channel.html',
    '/win-rider.html',
    '/seller-dashboard.html',
    '/messages.html'
];

// ── Install: pre-cache static assets ──────────────────────────────────────
self.addEventListener('install', event => {
    console.log('[SW v15] Installing...');
    event.waitUntil(
        Promise.all([
            caches.open(STATIC_CACHE).then(cache => {
                return Promise.allSettled(
                    STATIC_URLS.map(url => cache.add(url).catch(e => {
                        console.warn('[SW v15] Static pre-cache skip:', url, e.message);
                    }))
                );
            }),
            caches.open(CACHE_NAME).then(cache => {
                return Promise.allSettled(
                    PRECACHE_URLS.map(url => cache.add(url).catch(e => {
                        console.warn('[SW v15] Page pre-cache skip:', url, e.message);
                    }))
                );
            })
        ]).then(() => self.skipWaiting())
    );
});

// ── Activate: clear old caches ─────────────────────────────────────────────
self.addEventListener('activate', event => {
    console.log('[SW v15] Activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME && name !== STATIC_CACHE)
                    .map(name => {
                        console.log('[SW v15] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        }).then(() => {
            console.log('[SW v15] Claiming clients');
            return self.clients.claim();
        })
    );
});

// ── Fetch handler ──────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
    // Skip non-GET and Range requests (video streaming)
    if (event.request.method !== 'GET' || event.request.headers.get('Range')) return;

    const url = new URL(event.request.url);

    // Skip: Firebase, APIs, Cloudflare, CDNs, cross-origin non-assets
    const skipHosts = [
        'firestore.googleapis.com',
        'firebase.googleapis.com',
        'googleapis.com',
        'firebasestorage.app',
        'cloudflarestorage.com',
        'r2.dev',
        'cloudfunctions.net',
        'line.me',
        'lineapp.com'
    ];
    if (skipHosts.some(h => url.hostname.includes(h))) return;
    if (url.pathname.includes('/api/')) return;
    // Never intercept auth pages — Safari redirect-chain fix
    if (url.pathname === '/login.html' || url.pathname === '/auth.html') return;

    // Skip video files — streaming bypass
    const ext = url.pathname.toLowerCase().split('?')[0].split('.').pop();
    if (['mp4', 'mov', 'webm', 'm3u8', 'avi', 'mkv', 'ts'].includes(ext)) return;

    // ── Strategy 1: Cache-first for static assets (CSS/JS/images/fonts) ──
    const isStatic = [
        'css', 'js', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp',
        'ico', 'woff', 'woff2', 'ttf', 'otf', 'json'
    ].includes(ext) && url.origin === self.location.origin;

    if (isStatic) {
        event.respondWith(
            caches.open(STATIC_CACHE).then(cache =>
                cache.match(event.request).then(cached => {
                    if (cached) return cached;
                    return fetch(event.request).then(resp => {
                        // Never cache 206 Partial Content — causes ERR_CACHE_OPERATION_NOT_SUPPORTED
                        if (resp.status === 200 && resp.type !== 'opaque') {
                            cache.put(event.request, resp.clone());
                        }
                        return resp;
                    }).catch(() => null);
                })
            )
        );
        return;
    }

    // ── Strategy 2: Network-first for HTML pages ──
    event.respondWith(
        fetch(event.request)
            .then(response => {
                if (response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return response;
            })
            .catch(() =>
                caches.match(event.request).then(cached => {
                    if (cached) return cached;
                    if (event.request.headers.get('accept')?.includes('text/html')) {
                        return caches.match(OFFLINE_URL);
                    }
                    return null;
                })
            )
    );
});

// ── Push: receive and show notification ────────────────────────────────────
self.addEventListener('push', event => {
    if (!event.data) return;

    let payload;
    try { payload = event.data.json(); } catch (_) {
        payload = { title: 'TukTuk Thailand', body: event.data.text(), icon: '/assets/images/icon-192.png' };
    }

    const {
        title = 'TukTuk Thailand',
        body = '',
        icon = '/assets/images/icon-192.png',
        badge = '/assets/images/icon-192-maskable.png',
        tag = 'tuktuk-default',
        data = {},
        actions = [],
        image,
    } = payload;

    const options = {
        body, icon, badge, tag, data,
        vibrate: [100, 50, 100],
        requireInteraction: false,
        renotify: true,
    };
    if (actions.length) options.actions = actions;
    if (image) options.image = image;

    // Update App Badge if supported
    if (payload.badgeCount !== undefined && 'setAppBadge' in self.navigator) {
        if (payload.badgeCount > 0) {
            self.navigator.setAppBadge(payload.badgeCount).catch(() => { });
        } else {
            self.navigator.clearAppBadge().catch(() => { });
        }
    }

    event.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification click: focus or open app ─────────────────────────────────
self.addEventListener('notificationclick', event => {
    event.notification.close();

    const action = event.action;
    const notifData = event.notification.data || {};
    let targetUrl = notifData.url || '/';

    // Action-specific routing
    if (action === 'reply') targetUrl = notifData.url || '/messages.html';
    if (action === 'view') targetUrl = notifData.url || '/seller-dashboard.html';
    if (action === 'dismiss') return;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            // Focus existing tab if open
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.postMessage({ type: 'NOTIF_CLICK', url: targetUrl, action, data: notifData });
                    return client.focus();
                }
            }
            return clients.openWindow(targetUrl);
        })
    );
});

// ── Message handler ────────────────────────────────────────────────────────
self.addEventListener('message', event => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
    // Force cache refresh for a specific URL
    if (event.data?.type === 'CLEAR_CACHE' && event.data.url) {
        caches.open(CACHE_NAME).then(c => c.delete(event.data.url));
        caches.open(STATIC_CACHE).then(c => c.delete(event.data.url));
    }
});
