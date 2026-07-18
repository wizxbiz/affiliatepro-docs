// TukTuk /app — Service Worker  (v3 — fix redirect-mode error)
// Error fixed: "redirected response used for request whose redirect mode is not follow"
// Root cause: fetch(request) inside SW uses redirect:'manual' by default; 3xx responses
// were surfaced as opaque redirects → network error.  Fix: explicit redirect:'follow' +
// navigate requests go network-first (never serve stale HTML for OAuth callbacks).

const CACHE   = 'tuktuk-app-v3'
const SHELL_ASSETS = [
  '/app/manifest.webmanifest',
  '/app/icons/icon-192.png',
  '/app/icons/icon-512.png',
]

// ── Install ───────────────────────────────────────────────────
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  )
})

// ── Activate: remove old caches ──────────────────────────────
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  )
})

// ── Fetch ────────────────────────────────────────────────────
self.addEventListener('fetch', (e) => {
  const { request } = e
  const url = new URL(request.url)

  // Only handle same-origin GET requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  // NAVIGATE: always go network-first with redirect:follow.
  // This ensures OAuth callbacks (?code=&state=) and any server-side
  // redirects are handled correctly by the browser — never serve stale
  // HTML that might break in-flight auth flows.
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request, { redirect: 'follow' })
        .catch(() => caches.match('/app/index.html'))  // offline fallback only
    )
    return
  }

  // API calls: network-first with timeout → cached fallback
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(networkFirstWithTimeout(request, 5000))
    return
  }

  // Static /app assets (JS, CSS, icons, fonts): stale-while-revalidate
  if (url.pathname.startsWith('/app/')) {
    e.respondWith(staleWhileRevalidate(request))
  }
})

// ── Helpers ──────────────────────────────────────────────────
async function networkFirstWithTimeout(request, ms) {
  const cached  = await caches.match(request)
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('timeout')), ms)
  )
  try {
    const response = await Promise.race([
      fetch(request, { redirect: 'follow' }),   // ← explicit redirect:follow
      timeout,
    ])
    if (response.ok && response.status < 300) {
      const cache = await caches.open(CACHE)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return cached || new Response(
      JSON.stringify({ status: 'error', error: { code: 'OFFLINE' } }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request)
  const fetchPromise = fetch(request, { redirect: 'follow' })   // ← explicit
    .then(async (response) => {
      if (response.ok && response.type !== 'opaqueredirect') {
        const cache = await caches.open(CACHE)
        cache.put(request, response.clone())
      }
      return response
    })
    .catch(() => cached)
  return cached || fetchPromise
}
