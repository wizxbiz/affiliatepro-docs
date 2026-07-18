# TukTuk Social Ecosystem — Agent Handoff & Development Guide

Welcome! This document outlines the architecture, directory structure, configurations, and key flows of the TukTuk Social platform (AffiliatePro/TukTuk Feed). Use this guide to quickly understand the codebase and maintain consistency during development.

---

## 1. Project Overview & Tech Stack

TukTuk Social is a mobile and web-based marketplace ecosystem. It was migrated from a legacy Firebase architecture to a fully serverless, edge-optimized Cloudflare stack.

- **Frontend (Web):** Static HTML5 pages with Vanilla JS, styled with Bootstrap 5 and custom CSS. Hosted on **Cloudflare Pages**.
- **Backend (API Gateway):** A lightweight **Cloudflare Worker** running Hono.js.
- **Database:** **Cloudflare D1** (Edge SQLite database).
- **Authentication:** Custom JWT-based authentication shim (replacing Firebase Auth) integrated with LINE Login and Google Identity Services.
- **Storage:** **Cloudflare R2** (for image, video, and media assets).
- **Mobile (App):** Flutter application (Dart).

---

## 2. Directory Structure Map

```text
├── lib/                     # Flutter mobile application codebase (Dart)
├── public/                  # Web Frontend pages (HTML, CSS, JS)
│   ├── js/
│   │   ├── cloudflare-client.js  # Shim replacing Firebase SDK logic with Worker fetches
│   │   ├── auth.js               # WizmobizAuth (session management, persistent storage)
│   │   └── admin-controller.js   # Client controller logic for dashboard portals
│   ├── super-admin.html     # Super admin portal page
│   └── _redirects           # Cloudflare Pages routing & API proxy rules
├── workers/                 # Cloudflare Workers codebase (Backend Hono API)
│   ├── index.js             # Worker entry point & route gateway
│   ├── wrangler.toml        # Wrangler configuration file
│   ├── handlers/            # Hono API routers
│   │   ├── auth.js          # Google/LINE/PIN authentication & tokens
│   │   ├── line-webhook.js  # LINE Webhook handling, bot commands, PIN requests
│   │   ├── admin.js         # Super Admin controls & database inspection
│   │   └── marketplace.js   # Products, posts, likes, and feed queries
│   └── lib/                 # Database helpers, AI wrappers, and broadcast utils
│       └── db.js            # D1 database client query bindings
```

---

## 3. Database Architecture (D1 SQL Shim)

To avoid breaking legacy frontend pages that were written using Firebase Firestore SDK, the project uses a **Firestore-compatible D1 Shim**.

### Firestore Collections to SQLite Table Mapping
`window.db` (configured in `cloudflare-client.js`) intercepts Firestore calls and sends HTTP requests to the Worker at `/api/db/:collection`. The Worker maps collection names to D1 tables:

| Firestore Collection | D1 SQL Table Name | Description |
| :--- | :--- | :--- |
| `products` / `marketplace_items` | `products` | E-commerce products listing |
| `posts` / `community_posts` | `posts` | Social feed posts |
| `users` / `line_users` | `users` | User profiles, roles, premium flags |
| `conversations` | `conversations` | Chat rooms between users |
| `messages` | `chat_messages` | Individual chat messages |
| `win_riders` | `win_riders` | Motorcycle taxi drivers |
| `win_requests` | `win_requests` | Ride requests |

### Security & Restrictions
To prevent SQL Injection and unauthorized access, the DB Shim has strict rules (`workers/index.js`):
1. **Allowed Collections Whitelist:** Only collections defined in `ALLOWED_COLLECTIONS` are queried.
2. **Column Filter Whitelist:** Only specific columns defined in `ALLOWED_FILTER_FIELDS` are allowed in `WHERE` and `ORDER BY` clauses. Unlisted fields are rejected.
3. **Read/Write Access Controls:** 
   - Public tables (`products`, `posts`) can be read anonymously.
   - Private tables (`users`, `conversations`, `chat_messages`, `win_requests`) require authentication and restrict queries to rows owned by or related to the logged-in user.
   - Non-admin users cannot write to other users' rows.

---

## 4. Key Flows & Auth Handlers

### A. Web PIN Login Flow
To log in as a Super Admin or user without LIFF redirect loops:
1. **Request PIN:** User opens the LINE official account (LINE OA) and types **"ขอรหัสผ่าน"** (or similar request text).
2. **Webhook Event:** `workers/handlers/line-webhook.js` intercepts this, generates a random 6-digit PIN, replies to the user with a LINE Flex Message, and saves it into the `web_pins` D1 table.
3. **Submit PIN:** User enters the PIN on `/super-admin.html`.
4. **Verification:** The page calls `/api/auth/verify-pin`. The Worker queries D1 table `web_pins`. If valid and not expired, it returns a signed JWT token and deletes the PIN record (One-Time PIN).
5. **Session Persistence:** `public/js/auth.js` (`WizmobizAuth`) receives the JWT token, standardizes the session object, and saves it in `wizmobiz_session` in localStorage.

### B. Authorization
Super Admin privileges are granted if:
- The user's `uid` is hardcoded in the `SUPER_ADMIN_IDS` array in `public/super-admin.html`:
  ```javascript
  const SUPER_ADMIN_IDS = [
      'Ud9bec6d2ea945cf4330a69cb74ac93cf',
      'U9b40807cbcc8182928a12e3b6b73330e'
  ];
  ```
- Or the user's role in the D1 `users` table is `admin` or `super_admin`.

---

## 5. Development & Deployment Command Cheat Sheet

Make sure to run commands from the project root. Since Wrangler versions may vary, use `npx wrangler@3` to avoid compatibility warnings.

### Frontend (Cloudflare Pages)
- **Deploy Frontend to Production (`main` branch):**
  ```bash
  npx wrangler@3 pages deploy public --project-name=tuktukfeed --commit-dirty=true --branch main
  ```
- **Deploy Frontend to Preview/Staging:**
  ```bash
  npx wrangler@3 pages deploy public --project-name=tuktukfeed --commit-dirty=true
  ```

### Backend (Cloudflare Workers)
- **Deploy Worker Code:**
  ```bash
  npx wrangler@3 deploy --config workers/wrangler.toml
  ```
- **Tail Live Worker Logs:**
  ```bash
  npx wrangler@3 tail --config workers/wrangler.toml
  ```

### Database (D1 SQL Commands)
- **Inspect Live D1 Database (Remote):**
  ```bash
  # List all tables
  npx wrangler@3 d1 execute tuktukfeed-db --remote --command="SELECT name FROM sqlite_master WHERE type='table';"
  
  # Select active PINs
  npx wrangler@3 d1 execute tuktukfeed-db --remote --command="SELECT * FROM web_pins;"
  ```

---

## 6. Tips & Guidelines for AI Agents

1. **Keep Shims Intact:** Always use `window.cfApi` and `window.db` instead of raw `firebase` SDK calls when writing web frontends, as the Firebase SDK is disabled/redirected.
2. **Signature Soft-Fails:** LINE signature verification can sometimes fail in testing. Check `TUKTUK_LINE_WEBHOOK_SIGNATURE_SOFT_FAIL` and `LINE_WEBHOOK_SIGNATURE_SOFT_FAIL` in `wrangler.toml`.
3. **One-Time PINs:** If you get a `404` error on `/api/auth/verify-pin`, remember that web PINs are deleted immediately after the first login check (even if checkAuth fails afterwards). Request a new PIN via the bot to retry.
4. **Preserve Comments:** When modifying handlers or shims, do not strip existing code comments or security warnings.
