const API_ORIGIN = 'https://tuktukfeed-api.imtthailand2019.workers.dev';

const API_PATHS = new Set([
  '/share',
  '/community-share',
  '/lineLoginCallback',
  '/marketplaceLineAuth',
  '/verifyWebPin',
  '/checkFreeUsage',
  '/r2PresignedUrl',
  '/marketplaceAIGeneratePost',
]);

function shouldProxyToWorker(pathname) {
  return pathname === '/api' || pathname.startsWith('/api/')
    || pathname.startsWith('/s/')   // share hub — OG preview + redirect
    || API_PATHS.has(pathname);
}

function spaRewritePath(pathname) {
  // React shell (Phase 3): deep route ของ shell (เช่น /app/feed) → /app/
  // ตัว /app/ เอง Pages เสิร์ฟ index.html ให้อยู่แล้ว ห้าม rewrite เป็น index.html ตรงๆ (จะ 308 วนลูป)
  if (pathname.startsWith('/app/') && pathname !== '/app/' && !pathname.startsWith('/app/assets/') && !/\.[a-z0-9]+$/i.test(pathname)) {
    return '/app/';
  }
  if (pathname.startsWith('/marketplace/')) return '/marketplace.html';
  if (pathname.startsWith('/seller-dashboard/')) return '/seller-dashboard.html';
  if (pathname.startsWith('/win-service/')) return '/win-service.html';
  if (pathname.startsWith('/tuktuk/')) return '/tuktuk/index.html';
  if (pathname.startsWith('/training/hot-runner/')) return '/training/hot-runner/index.html';
  return pathname;
}

async function proxyToWorker(request) {
  const sourceUrl = new URL(request.url);
  const targetUrl = new URL(sourceUrl.pathname + sourceUrl.search, API_ORIGIN);
  const headers = new Headers(request.headers);
  headers.set('X-Forwarded-Host', sourceUrl.host);
  headers.set('X-Forwarded-Proto', sourceUrl.protocol.replace(':', ''));
  headers.delete('Host');

  const init = {
    method: request.method,
    headers,
    redirect: 'manual',
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = request.body;
  }

  return fetch(new Request(targetUrl.toString(), init));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/training/hotrunner') {
      return Response.redirect(new URL('/training/hot-runner', url), 301);
    }
    if (url.pathname.startsWith('/training/hotrunner/')) {
      const nextUrl = new URL(url);
      nextUrl.pathname = url.pathname.replace('/training/hotrunner', '/training/hot-runner');
      return Response.redirect(nextUrl, 301);
    }

    if (shouldProxyToWorker(url.pathname)) {
      return proxyToWorker(request);
    }

    const rewrittenPath = spaRewritePath(url.pathname);
    if (rewrittenPath !== url.pathname) {
      const assetUrl = new URL(url);
      assetUrl.pathname = rewrittenPath;
      return env.ASSETS.fetch(new Request(assetUrl.toString(), request));
    }

    return env.ASSETS.fetch(request);
  },
};