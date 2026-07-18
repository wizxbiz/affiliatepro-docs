# Security Audit Status - TukTuk Social API

**Updated:** 2026-07-12
**Scope:** Cloudflare Workers API Gateway, Auth, DB compatibility shim, LINE/LIFF auth, OG preview.

## Current Status

Security hardening from the 2026-07-12 audit has been applied to the active codebase. This file replaces the earlier audit wording that marked planned work with checkmarks before every item was actually closed.

## Closed / Hardened

- C-1 SQL injection in `/api/db/*`: collection, field, and operator allowlists are enforced.
- H-1 public DB shim reads: public reads are limited to public feed/marketplace data; sensitive collections require a valid session and non-admin reads are scoped to owner rows.
- C-2 super-admin JWT verification: JWT payloads are verified with `hono/jwt.verify()`.
- C-3 LINE webhook signature verification: `TUKTUK_LINE_WEBHOOK_VERIFY_DISABLED` and `LINE_WEBHOOK_VERIFY_DISABLED` are set to `false`.
- H-2 JWT secret fallback: removed known-string fallback and fail fast when `JWT_SECRET` is missing.
- H-3 LINE channel secret fallback: removed hardcoded LINE credentials from OAuth code exchange.
- H-4 OG preview injection: product and community share templates escape user-derived values and URL-encode redirect ids.
- M-1/M-2 OTP abuse controls: request rate limit and wrong-code attempt limits are enforced through KV.
- M-3 webhook stack trace exposure: stack traces are logged internally only.
- M-4 LIFF/marketplace auth spoofing: `marketplace-line-auth` now requires a valid LINE access token, or an existing JWT whose user id matches the requested LINE user for legacy status checks; LIFF auto-login sends `liff.getAccessToken()`.
- L-2 CORS hardening: arbitrary `*.pages.dev` origins are no longer accepted; only tuktukfeed domains and local dev origins are allowed.
- L-7 JWT duration: new tokens now use a 7-day TTL.

## Operational Follow-Up

- Confirm Worker secrets exist in production: `JWT_SECRET`, `LINE_CHANNEL_ID`, `LINE_CHANNEL_SECRET`, `TUKTUK_CHANNEL_SECRET`.
- Rotate the LINE Channel Secret if the previously hardcoded secret was ever committed or deployed publicly.
- Run production smoke tests after deploy:
  - `POST /api/auth/marketplace-line-auth` without `accessToken` and without a matching bearer JWT returns 401.
  - LIFF auto-login inside LINE still receives a JWT.
  - `GET /api/db/users` without auth returns 401.
  - `GET /api/db/products?limit=1` remains public.
  - `POST /api/auth/phone/request-otp` rate-limits after repeated requests.
