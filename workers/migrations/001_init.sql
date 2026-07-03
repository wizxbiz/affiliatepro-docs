-- =============================================================
-- D1 Database Schema — TukTuk Social Thailand
-- แทน Firestore collections ทั้งหมด
-- Run: wrangler d1 execute tuktukfeed-db --file=workers/migrations/001_init.sql
-- =============================================================

-- ── USERS ──────────────────────────────────────────────────────
-- แทน: 'users' + 'line_users' Firestore collections
CREATE TABLE IF NOT EXISTS users (
  id                  TEXT PRIMARY KEY,         -- LINE userId หรือ Google UID
  line_user_id        TEXT UNIQUE,
  firebase_uid        TEXT,
  display_name        TEXT NOT NULL DEFAULT '',
  email               TEXT,
  picture_url         TEXT,
  role                TEXT NOT NULL DEFAULT 'user',     -- user, admin, super_admin
  seller_status       TEXT NOT NULL DEFAULT 'none',     -- none, pending, verified
  is_premium          INTEGER NOT NULL DEFAULT 0,       -- 0=free, 1=premium
  subscription_status TEXT,                             -- active, expired, trial
  provider            TEXT DEFAULT 'line',              -- line, google
  created_at          INTEGER NOT NULL,
  updated_at          INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email        ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_line_user_id ON users(line_user_id);
CREATE INDEX IF NOT EXISTS idx_users_role         ON users(role);

-- ── POSTS ──────────────────────────────────────────────────────
-- แทน: 'posts' Firestore collection
CREATE TABLE IF NOT EXISTS posts (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL,
  content        TEXT,
  media_urls     TEXT,             -- JSON array of URLs
  category       TEXT DEFAULT 'general',  -- all, near_me, community, news, video
  status         TEXT DEFAULT 'active',   -- active, deleted, hidden
  likes_count    INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  views_count    INTEGER DEFAULT 0,
  created_at     INTEGER NOT NULL,
  updated_at     INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_posts_user_id   ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_category  ON posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_status    ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_created   ON posts(created_at DESC);

-- ── POST LIKES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS post_likes (
  post_id    TEXT NOT NULL,
  user_id    TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (post_id, user_id)
);

-- ── POST COMMENTS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS post_comments (
  id         TEXT PRIMARY KEY,
  post_id    TEXT NOT NULL,
  user_id    TEXT NOT NULL,
  content    TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (post_id) REFERENCES posts(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON post_comments(post_id);

-- ── PRODUCTS (Marketplace) ────────────────────────────────────
-- แทน: 'products' Firestore collection
CREATE TABLE IF NOT EXISTS products (
  id          TEXT PRIMARY KEY,
  seller_id   TEXT NOT NULL,
  title       TEXT NOT NULL,
  description TEXT,
  price       REAL NOT NULL DEFAULT 0,
  images      TEXT,              -- JSON array of image URLs
  category    TEXT DEFAULT 'general',
  status      TEXT DEFAULT 'active',   -- active, sold, deleted
  views_count INTEGER DEFAULT 0,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER,
  FOREIGN KEY (seller_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category  ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_status    ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_created   ON products(created_at DESC);

-- ── ORDERS ────────────────────────────────────────────────────
-- แทน: 'orders' Firestore collection
CREATE TABLE IF NOT EXISTS orders (
  id           TEXT PRIMARY KEY,
  buyer_id     TEXT NOT NULL,
  seller_id    TEXT NOT NULL,
  product_id   TEXT NOT NULL,
  amount       REAL NOT NULL,
  status       TEXT DEFAULT 'pending',   -- pending, paid, shipped, completed, cancelled
  payment_slip TEXT,                     -- URL to payment slip image
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER,
  FOREIGN KEY (buyer_id) REFERENCES users(id),
  FOREIGN KEY (seller_id) REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE INDEX IF NOT EXISTS idx_orders_buyer_id  ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status    ON orders(status);

-- ── ESCROW ────────────────────────────────────────────────────
-- แทน: 'escrow_records' Firestore collection
CREATE TABLE IF NOT EXISTS escrow_records (
  id         TEXT PRIMARY KEY,
  order_id   TEXT NOT NULL,
  buyer_id   TEXT NOT NULL,
  seller_id  TEXT NOT NULL,
  amount     REAL NOT NULL,
  status     TEXT DEFAULT 'held',    -- held, released, refunded
  created_at INTEGER NOT NULL,
  updated_at INTEGER,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- ── WEB PINs (LINE Login) ─────────────────────────────────────
-- แทน: 'web_pins' Firestore collection
CREATE TABLE IF NOT EXISTS web_pins (
  line_user_id TEXT PRIMARY KEY,
  pin          TEXT NOT NULL,
  expires_at   INTEGER NOT NULL,
  created_at   INTEGER NOT NULL
);

-- ── NOTIFICATIONS ─────────────────────────────────────────────
-- แทน: 'notifications' Firestore collection
CREATE TABLE IF NOT EXISTS notifications (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  type       TEXT NOT NULL,        -- like, comment, order, system
  title      TEXT,
  body       TEXT,
  is_read    INTEGER DEFAULT 0,
  data       TEXT,                 -- JSON extra data
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_notifs_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifs_is_read ON notifications(is_read);

-- ── MESSAGES (Chat) ───────────────────────────────────────────
-- แทน: 'messages' Firestore collection
CREATE TABLE IF NOT EXISTS messages (
  id            TEXT PRIMARY KEY,
  sender_id     TEXT NOT NULL,
  receiver_id   TEXT NOT NULL,
  content       TEXT,
  media_url     TEXT,
  is_read       INTEGER DEFAULT 0,
  created_at    INTEGER NOT NULL,
  FOREIGN KEY (sender_id)   REFERENCES users(id),
  FOREIGN KEY (receiver_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_messages_sender   ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created  ON messages(created_at DESC);

-- ── ANALYTICS ─────────────────────────────────────────────────
-- แทน: analytics Firestore collection
CREATE TABLE IF NOT EXISTS page_views (
  id         TEXT PRIMARY KEY,
  page       TEXT NOT NULL,
  user_id    TEXT,
  user_agent TEXT,
  country    TEXT,
  timestamp  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pv_timestamp ON page_views(timestamp);
CREATE INDEX IF NOT EXISTS idx_pv_page      ON page_views(page);

CREATE TABLE IF NOT EXISTS events (
  id        TEXT PRIMARY KEY,
  event     TEXT NOT NULL,
  category  TEXT,
  label     TEXT,
  value     TEXT,
  user_id   TEXT,
  timestamp INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ev_timestamp ON events(timestamp);
CREATE INDEX IF NOT EXISTS idx_ev_event     ON events(event);

-- ── CONTACTS (Buyer-Seller) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS contacts (
  id         TEXT PRIMARY KEY,
  buyer_id   TEXT NOT NULL,
  seller_id  TEXT NOT NULL,
  product_id TEXT,
  message    TEXT,
  created_at INTEGER NOT NULL
);

-- ── USER USAGE (Free tier limits) ────────────────────────────
CREATE TABLE IF NOT EXISTS user_usage (
  user_id        TEXT PRIMARY KEY,
  ai_chat        INTEGER DEFAULT 0,
  ai_generate    INTEGER DEFAULT 0,
  save_records   INTEGER DEFAULT 0,
  reset_date     TEXT,             -- YYYY-MM-DD
  updated_at     INTEGER
);

-- ── FEEDBACK ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feedbacks (
  id         TEXT PRIMARY KEY,
  user_id    TEXT,
  type       TEXT DEFAULT 'general',
  message    TEXT NOT NULL,
  page       TEXT,
  created_at INTEGER NOT NULL
);

-- ── PUSH SUBSCRIPTIONS (Web Push) ────────────────────────────
-- แทน: 'push_subscriptions' Firestore collection
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  endpoint   TEXT NOT NULL,
  keys       TEXT NOT NULL,         -- JSON { p256dh, auth }
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_push_user_id ON push_subscriptions(user_id);

-- ── WIN RIDER (มอเตอร์ไซค์รับจ้าง) ──────────────────────────
-- แทน: 'win_riders' + 'win_requests' Firestore collections
CREATE TABLE IF NOT EXISTS win_riders (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL,
  name         TEXT NOT NULL,
  phone        TEXT,
  location_lat REAL,
  location_lng REAL,
  status       TEXT DEFAULT 'offline',   -- online, offline, busy
  rating       REAL DEFAULT 0,
  total_trips  INTEGER DEFAULT 0,
  created_at   INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS win_requests (
  id               TEXT PRIMARY KEY,
  requester_id     TEXT NOT NULL,
  rider_id         TEXT,
  pickup_lat       REAL,
  pickup_lng       REAL,
  destination_lat  REAL,
  destination_lng  REAL,
  status           TEXT DEFAULT 'pending',  -- pending, accepted, completed, cancelled
  created_at       INTEGER NOT NULL,
  FOREIGN KEY (requester_id) REFERENCES users(id)
);

-- ── SUBSCRIPTION PLANS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  plan        TEXT NOT NULL,         -- monthly, quarterly, yearly
  amount      REAL NOT NULL,
  status      TEXT DEFAULT 'active', -- active, expired, cancelled
  starts_at   INTEGER NOT NULL,
  expires_at  INTEGER NOT NULL,
  created_at  INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_subs_user_id   ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subs_expires   ON subscriptions(expires_at);

-- =============================================================
-- DONE: Run next migration file for seed data
-- wrangler d1 execute tuktukfeed-db --file=workers/migrations/002_seed.sql
-- =============================================================
