# TukTuk REST API Contract - Phase 1

Last updated: 2026-07-01

This document defines the stable REST contract for the next frontend migration step. The goal is to stop new frontend code from depending directly on Firebase SDK or the temporary Firestore shim, while still allowing the current Cloudflare Worker and Go Engine to coexist.

## Scope

Phase 1 is a contract and migration boundary only. It standardizes endpoint names, request/response shapes, auth headers, pagination, and error envelopes for:

- Feed: `GET /api/v1/feed`
- Products: `GET /api/v1/products`, `GET /api/v1/products/{id}`, `POST /api/v1/products`
- Session: `GET /api/v1/auth/session`, `POST /api/v1/auth/session`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`
- Supporting auth flows: LINE PIN and phone OTP endpoints

## Runtime Mapping

| Contract endpoint | Current provider | Current endpoint | Phase 2 action |
| --- | --- | --- | --- |
| `GET /api/v1/feed` | Go Engine | `https://tuktuk-engine.fly.dev/api/v1/feed` | Keep as source of truth; Worker can proxy later if needed. |
| `GET /api/v1/products` | Go Engine + Worker fallback | Go: `/api/v1/products`, Worker: `/api/marketplace/products` | Standardize response and pagination. |
| `GET /api/v1/products/{id}` | Worker | `/api/marketplace/products/:id` | Add v1 alias in Worker. |
| `POST /api/v1/products` | Worker | `/api/marketplace/products` | Add v1 alias in Worker. |
| `GET /api/v1/auth/session` | Worker | `/api/auth/me` | Add v1 alias in Worker. |
| `POST /api/v1/auth/session` | Worker | `/api/auth/line-callback`, `/api/auth/marketplace-line-auth`, `/api/auth/verify-pin`, `/api/auth/phone/verify-otp` | Add unified session creation endpoint. |
| `POST /api/v1/auth/refresh` | Worker | `/api/auth/refresh` | Add v1 alias in Worker. |
| `POST /api/v1/auth/logout` | Worker | `/api/auth/logout` | Add v1 alias in Worker. |

## General Rules

Base URL for same-origin Pages frontend:

```text
https://v-4-ultra.tuktukfeed.pages.dev
```

Frontend code should call relative paths:

```text
/api/v1/feed
/api/v1/products
/api/v1/auth/session
```

Authentication:

```http
Authorization: Bearer <sessionToken>
Content-Type: application/json
```

Timestamp format:

- New contract fields use ISO 8601 strings when returned to frontend.
- Existing epoch millisecond values may be accepted during transition.

Pagination:

- Read endpoints use `limit`.
- Cursor pagination uses `afterId`.
- Offset pagination is legacy-only and should not be used in new frontend code.

Success envelope:

```json
{
  "status": "success",
  "data": {},
  "meta": {
    "requestId": "req_...",
    "executionTime": "12ms"
  }
}
```

Legacy-compatible responses may still return top-level arrays such as `products` or `posts`. New API client code should normalize both forms.

Error envelope:

```json
{
  "status": "error",
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authorization Bearer token required"
  },
  "meta": {
    "requestId": "req_..."
  }
}
```

## GET /api/v1/feed

Returns the mixed feed used by mobile "ดูเพลิน" and future SPA feed screens.

Query parameters:

| Name | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `userId` | string | no | `guest` | For personalization. Use authenticated uid when available. |
| `province` | string | no | empty | Province code or text filter. |
| `mode` | string | no | `all` | `all`, `video`, `marketplace`, `news`. |
| `limit` | integer | no | `20` | Contract max: `50`. Existing Go endpoint may ignore this until Phase 2. |
| `afterId` | string | no | empty | Cursor for future pagination. |

Response:

```json
{
  "status": "success",
  "posts": [
    {
      "id": "post_123",
      "type": "video",
      "authorId": "U...",
      "authorName": "Seller",
      "authorAvatar": "https://...",
      "content": "ข้อความโพสต์",
      "videoUrl": "https://...",
      "thumbnailUrl": "https://...",
      "category": "marketplace",
      "provinceCode": "TH-10",
      "likes": 12,
      "commentsCount": 3,
      "viewCount": 120,
      "createdAt": "2026-07-01T09:00:00.000Z"
    }
  ],
  "news": [],
  "unreadNotifications": [],
  "trendingTags": ["ตลาดสด", "ส่งด่วน"],
  "meta": {
    "nextCursor": "post_123",
    "executionTime": "18ms"
  }
}
```

Notes:

- Empty feed must return `200` with empty arrays, not `404`.
- If Go `/api/v1/feed` returns empty posts, frontend may request `/api/v1/products` and render products as feed cards during transition.
- Video URLs must be direct playable URLs or known embeddable providers; renderer owns final normalization.

## GET /api/v1/products

Returns marketplace products for feed and marketplace screens.

Query parameters:

| Name | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `limit` | integer | no | `40` | Contract max: `100`. |
| `afterId` | string | no | empty | Cursor. |
| `province` | string | no | empty | Province code. |
| `category` | string | no | empty | Product category. |
| `search` | string | no | empty | Search query. Worker fallback supports this. |

Response:

```json
{
  "status": "success",
  "products": [
    {
      "id": "prod_123",
      "productName": "สินค้า",
      "title": "สินค้า",
      "description": "รายละเอียด",
      "price": 1200,
      "imageUrl": "https://...",
      "images": ["https://..."],
      "sellerId": "U...",
      "sellerName": "ร้านค้า",
      "sellerPictureUrl": "https://...",
      "province": "กรุงเทพมหานคร",
      "provinceCode": "TH-10",
      "category": "general",
      "status": "active",
      "viewCount": 10,
      "createdAt": "2026-07-01T09:00:00.000Z"
    }
  ],
  "total": 1,
  "meta": {
    "nextCursor": "prod_123",
    "executionTime": "12ms"
  }
}
```

Field compatibility:

- `productName` is the canonical display name.
- `title` is kept for legacy cards and search indexing.
- `imageUrl` is the first item from `images`.
- `sellerPictureUrl` is preferred; legacy `seller_picture` must be normalized by the API client.

## GET /api/v1/products/{id}

Returns a single product.

Path parameters:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string | yes | Product id. |

Response:

```json
{
  "status": "success",
  "product": {
    "id": "prod_123",
    "productName": "สินค้า",
    "title": "สินค้า",
    "description": "รายละเอียด",
    "price": 1200,
    "images": ["https://..."],
    "sellerId": "U...",
    "sellerName": "ร้านค้า",
    "category": "general",
    "status": "active",
    "createdAt": "2026-07-01T09:00:00.000Z"
  }
}
```

## POST /api/v1/products

Creates a product after media has already been uploaded to R2.

Headers:

```http
Authorization: Bearer <sessionToken>
Content-Type: application/json
```

Request:

```json
{
  "productName": "สินค้า",
  "title": "สินค้า",
  "description": "รายละเอียด",
  "price": 1200,
  "images": ["https://..."],
  "category": "general",
  "provinceCode": "TH-10"
}
```

Response:

```json
{
  "status": "success",
  "productId": "prod_123"
}
```

Rules:

- Product creation does not accept base64 image payloads.
- Client must upload files through presigned R2 upload first, then send resulting URLs.
- Server derives `sellerId` from the session token.

## GET /api/v1/auth/session

Returns the current user session.

Headers:

```http
Authorization: Bearer <sessionToken>
```

Response:

```json
{
  "status": "success",
  "user": {
    "uid": "U...",
    "lineUserId": "U...",
    "firebaseUid": null,
    "displayName": "User",
    "email": null,
    "pictureUrl": "https://...",
    "role": "user",
    "sellerStatus": "none",
    "isPremium": false,
    "subscriptionStatus": null,
    "provider": "line",
    "phone": "0812345678",
    "createdAt": "2026-07-01T09:00:00.000Z",
    "updatedAt": "2026-07-01T09:00:00.000Z"
  }
}
```

Compatibility:

- Current Worker endpoint is `GET /api/auth/me`.
- Phase 2 should add `GET /api/v1/auth/session` as an alias.

## POST /api/v1/auth/session

Creates a session from one of the supported login methods.

Request for LINE profile login:

```json
{
  "provider": "line",
  "lineUserId": "U...",
  "displayName": "User",
  "pictureUrl": "https://..."
}
```

Request for LINE OAuth code:

```json
{
  "provider": "line_oauth",
  "code": "oauth-code",
  "redirectUri": "https://v-4-ultra.tuktukfeed.pages.dev/login.html"
}
```

Request for web PIN:

```json
{
  "provider": "line_pin",
  "pin": "123456",
  "lineUserId": "U..."
}
```

Request for phone OTP:

```json
{
  "provider": "phone_otp",
  "phone": "0812345678",
  "code": "123456"
}
```

Response:

```json
{
  "status": "success",
  "token": "jwt...",
  "sessionToken": "jwt...",
  "expiresIn": 2592000,
  "user": {
    "uid": "U...",
    "lineUserId": "U...",
    "displayName": "User",
    "pictureUrl": "https://...",
    "role": "user",
    "isPremium": false,
    "sellerStatus": "none",
    "provider": "line"
  }
}
```

Compatibility:

- Existing Worker endpoints remain valid during transition:
  - `POST /api/auth/line-callback`
  - `POST /api/auth/marketplace-line-auth`
  - `POST /api/auth/verify-pin`
  - `POST /api/auth/phone/verify-otp`
- New frontend code should call only `POST /api/v1/auth/session` after Phase 2 alias is implemented.

## POST /api/v1/auth/refresh

Refreshes token and user claims.

Headers:

```http
Authorization: Bearer <sessionToken>
```

Response:

```json
{
  "status": "success",
  "token": "jwt...",
  "sessionToken": "jwt...",
  "expiresIn": 2592000,
  "user": {
    "uid": "U...",
    "role": "user",
    "isPremium": false,
    "sellerStatus": "none"
  }
}
```

## POST /api/v1/auth/logout

Invalidates server-side session if KV is configured.

Headers:

```http
Authorization: Bearer <sessionToken>
```

Response:

```json
{
  "status": "success"
}
```

## Supporting Auth Endpoints

These are kept because the current login flow needs them.

### POST /api/v1/auth/phone/request-otp

Request:

```json
{
  "phone": "0812345678"
}
```

Response:

```json
{
  "status": "success",
  "message": "OTP sent",
  "sandbox": false
}
```

### POST /api/v1/auth/phone/verify-otp

Use `POST /api/v1/auth/session` with provider `phone_otp` for new clients. This endpoint can stay as a low-level compatibility endpoint.

## Frontend Migration Rule

New SPA code must not import Firebase directly for these domains:

- feed
- products
- auth session
- phone recovery

Instead, add a single API client layer:

```text
src/api/http.ts
src/api/feed.ts
src/api/products.ts
src/api/auth.ts
```

The API client may normalize legacy Worker/Go responses during the migration, but UI components should receive only the contract fields documented here.

## Phase 2 Implementation Checklist

- Add Worker aliases under `/api/v1/auth/*`.
- Add Worker aliases or proxy for `/api/v1/products/{id}` and `POST /api/v1/products`.
- Decide whether `/api/v1/products` always goes through Worker or Go Engine.
- Normalize all errors to the contract error envelope.
- Add `REST_API_CONTRACT_PHASE1.md` as the source of truth for frontend API client work.
- Keep `/api/db/*` only as temporary Firestore compatibility shim; do not use it in new UI code.
