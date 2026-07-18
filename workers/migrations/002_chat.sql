-- ── CHAT SYSTEM TABLES ─────────────────────────────────────────

-- 1. conversations (Direct Messages)
CREATE TABLE IF NOT EXISTS conversations (
  id              TEXT PRIMARY KEY,
  participants    TEXT NOT NULL,            -- JSON array of user IDs ['uid1', 'uid2']
  last_message    TEXT,
  last_message_at INTEGER,
  last_sender_id  TEXT,
  unread_counts   TEXT DEFAULT '{}',        -- JSON object {"uid1": 0, "uid2": 0}
  status          TEXT DEFAULT 'pending',   -- pending, accepted
  request_by      TEXT,
  created_at      INTEGER NOT NULL,
  platform        TEXT DEFAULT 'web',
  typing          TEXT DEFAULT '{}'         -- JSON object {"uid1": false, "uid2": false}
);

-- 2. product_chats (Product Marketplace Chats)
CREATE TABLE IF NOT EXISTS product_chats (
  id                  TEXT PRIMARY KEY,
  buyer_id            TEXT NOT NULL,
  seller_id           TEXT NOT NULL,
  line_user_id        TEXT,
  product_id          TEXT NOT NULL,
  product_name        TEXT,
  product_image_url   TEXT,
  price               REAL,
  last_message        TEXT,
  last_message_at     INTEGER,
  last_sender_id      TEXT,
  unread_count_buyer  INTEGER DEFAULT 0,
  unread_count_seller INTEGER DEFAULT 0,
  status              TEXT DEFAULT 'active',
  created_at          INTEGER NOT NULL,
  typing              TEXT DEFAULT '{}'     -- JSON object {"uid1": false, "uid2": false}
);

-- 3. chat_messages (Message sub-collection shim)
CREATE TABLE IF NOT EXISTS chat_messages (
  id              TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,            -- References conversations(id) or product_chats(id)
  sender_id       TEXT NOT NULL,
  sender_name     TEXT,
  text            TEXT,
  timestamp       INTEGER NOT NULL,
  type            TEXT DEFAULT 'text',      -- text, image
  image_url       TEXT,
  status          TEXT DEFAULT 'sent'       -- sent, read
);

-- 4. user_chat_settings (Pinned and archived chat settings)
CREATE TABLE IF NOT EXISTS user_chat_settings (
  user_id   TEXT PRIMARY KEY,
  pinned    TEXT DEFAULT '[]',              -- JSON array of conversation/chat IDs
  archived  TEXT DEFAULT '[]'               -- JSON array of conversation/chat IDs
);

CREATE INDEX IF NOT EXISTS idx_chat_msgs_conv ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_msgs_time ON chat_messages(timestamp ASC);
