# Feed Reliability Phase 2

Date: 2026-07-01

## Scope

Phase 2 hardens the public feed so mobile tabs do not stay blank when REST API, Firebase, product fallback, or community feed is slow, empty, unauthorized, or not ready.

Touched files:

- `public/js/api-client.js`
- `public/js/tuktuk_feed_logic.js`
- `public/js/community_feed_integration.js`
- `public/index.html`
- `public/sw.js`

## Reliability changes

- Public feed/product calls continue to use unauthenticated REST requests so stale mobile tokens do not block guest feed rendering.
- API request diagnostics are available at `window.TukTukAPI.diagnostics`.
- Feed engine diagnostics are available at `window.TukTukFeed.diagnostics`.
- Community feed diagnostics are available at `window.TukTukCommunityFeed.diagnostics`.
- Fixed the nested product-only rescue branch that could still throw after a successful rescue.
- If `/api/v1/feed` and Firebase do not return visible items, the feed falls back to `/api/v1/products`.
- Community feed no longer returns silently when Firestore is not ready. It renders retry/back state and retries once when db becomes available.
- Asset version was bumped to `20260701h`; service worker cache was bumped to `v34`.

## Browser diagnostics

Run these in DevTools Console:

```js
window.TukTukAPI && window.TukTukAPI.diagnostics
window.TukTukFeed && window.TukTukFeed.diagnostics
window.TukTukCommunityFeed && window.TukTukCommunityFeed.diagnostics
```

Useful fields:

- `event`: lifecycle marker such as `load_start`, `load_success`, `load_error`, `product_rescue_success`, `timeout`.
- `durationMs`: API call duration where available.
- `count`: item count where available.
- `message`: error message where available.

## Smoke checks

Live API checks:

```text
/api/v1/feed?userId=guest&limit=80
/api/v1/products?limit=30
/api/v1/feed/trending?limit=20
```

Expected:

- `/api/v1/feed` may return zero posts; product fallback should still populate the mobile feed from `/api/v1/products`.
- `/api/v1/products` should return product rows for guest users.
- Mobile `Doo Plearn` should render feed/product cards instead of staying blank.
- `Career/Community` should render content, empty state, or retry state. It should not stay in an indefinite loader.
