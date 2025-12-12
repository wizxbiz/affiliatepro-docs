/**
 * WiT AI Calculator Pro - Service Worker
 * Enhanced caching for offline support
 */

const CACHE_NAME = 'wit-calculator-v2';
const STATIC_CACHE = 'wit-static-v2';
const DYNAMIC_CACHE = 'wit-dynamic-v2';

// Static resources to cache immediately
const STATIC_URLS = [
  '/',
  '/index.html',
  '/calculator.html',
  '/marketplace.html',
  '/injection-molding.html',
  '/mobile-learning.html',
  '/about.html',
  '/styles.css',
  '/js/calculator-engines.js',
  '/js/calculator-integrations.js',
  '/manifest.json'
];

// External CDN resources
const CDN_URLS = [
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// Install event - cache static resources
self.addEventListener('install', event => {
  console.log('[SW] Installing Service Worker...');
  event.waitUntil(
    Promise.all([
      // Cache static files
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[SW] Caching static files');
        return cache.addAll(STATIC_URLS.map(url => {
          return new Request(url, { cache: 'reload' });
        })).catch(err => console.log('[SW] Static cache error:', err));
      }),
      // Cache CDN files
      caches.open(CACHE_NAME).then(cache => {
        console.log('[SW] Caching CDN files');
        return Promise.all(
          CDN_URLS.map(url => 
            fetch(url)
              .then(response => cache.put(url, response))
              .catch(err => console.log('[SW] CDN cache error:', url, err))
          )
        );
      })
    ]).then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating Service Worker...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME && name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip API calls - always fetch from network
  if (url.pathname.includes('/api/') || url.hostname.includes('a.run.app')) {
    event.respondWith(
      fetch(request)
        .catch(() => new Response(JSON.stringify({ error: 'Offline' }), {
          headers: { 'Content-Type': 'application/json' }
        }))
    );
    return;
  }

  // Cache-first strategy for static assets
  if (STATIC_URLS.some(staticUrl => url.pathname.endsWith(staticUrl) || url.pathname === staticUrl)) {
    event.respondWith(
      caches.match(request)
        .then(response => {
          if (response) return response;
          return fetch(request).then(networkResponse => {
            return caches.open(STATIC_CACHE).then(cache => {
              cache.put(request, networkResponse.clone());
              return networkResponse;
            });
          });
        })
        .catch(() => caches.match('/calculator.html'))
    );
    return;
  }

  // Network-first strategy for HTML pages
  if (request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => caches.match(request).then(response => response || caches.match('/calculator.html')))
    );
    return;
  }

  // Stale-while-revalidate for other resources
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      const fetchPromise = fetch(request).then(networkResponse => {
        caches.open(DYNAMIC_CACHE).then(cache => {
          cache.put(request, networkResponse.clone());
        });
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// Background sync for offline calculations
self.addEventListener('sync', event => {
  if (event.tag === 'sync-calculations') {
    event.waitUntil(syncCalculations());
  }
});

async function syncCalculations() {
  try {
    const pending = await getPendingCalculations();
    for (const calc of pending) {
      await fetch('/api/sync-calculation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(calc)
      });
    }
    console.log('[SW] Calculations synced successfully');
  } catch (error) {
    console.log('[SW] Sync failed, will retry later');
  }
}

async function getPendingCalculations() {
  // This would typically read from IndexedDB
  return [];
}

// Push notifications
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'มีการอัปเดตใหม่!',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      { action: 'explore', title: 'เปิดดู', icon: '/icons/checkmark.png' },
      { action: 'close', title: 'ปิด', icon: '/icons/xmark.png' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('WiT Calculator Pro', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/calculator.html')
    );
  }
});