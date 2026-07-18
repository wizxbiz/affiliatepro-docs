export function rewriteRequest(c, targetPath) {
  const url = new URL(c.req.url);
  url.pathname = targetPath;
  return new Request(url.toString(), c.req.raw);
}

export function rewriteJsonRequest(c, targetPath, body) {
  const url = new URL(c.req.url);
  url.pathname = targetPath;

  const headers = new Headers(c.req.raw.headers);
  headers.set('Content-Type', 'application/json');

  return new Request(url.toString(), {
    method: c.req.method,
    headers,
    body: JSON.stringify(body || {}),
  });
}