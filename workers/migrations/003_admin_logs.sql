-- ════════════════════════════════════════════════════════════
-- Admin Logs & Security Tables
-- Migration: 003_admin_logs.sql
-- Run: npx wrangler d1 execute tuktukfeed-db --file=workers/migrations/003_admin_logs.sql
-- ════════════════════════════════════════════════════════════

-- ── ADMIN LOGS ─────────────────────────────────────────────
-- Audit trail for all admin actions
CREATE TABLE IF NOT EXISTS admin_logs (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id      TEXT NOT NULL,
  action        TEXT NOT NULL,        -- update_user, delete_post, ban_user, etc.
  target        TEXT,                 -- Target ID (user_id, post_id, etc.)
  result        TEXT NOT NULL,        -- SUCCESS, FORBIDDEN, ERROR
  timestamp     INTEGER NOT NULL,
  ip            TEXT,
  user_agent    TEXT,
  details       TEXT                  -- JSON extra data
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_timestamp ON admin_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);

-- ── SECURITY EVENTS ────────────────────────────────────────
-- Track security-related events
CREATE TABLE IF NOT EXISTS security_events (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type    TEXT NOT NULL,        -- login_failed, rate_limit, ip_blocked
  user_id       TEXT,
  ip            TEXT,
  timestamp     INTEGER NOT NULL,
  details       TEXT                  -- JSON details
);

CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_timestamp ON security_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_ip ON security_events(ip);

-- ── RATE LIMIT CACHE ───────────────────────────────────────
-- Track rate limits per user/IP (can also use Workers KV)
CREATE TABLE IF NOT EXISTS rate_limits (
  key           TEXT PRIMARY KEY,     -- Format: "ratelimit:userId:ip"
  count         INTEGER NOT NULL DEFAULT 1,
  window_start  INTEGER NOT NULL,
  expires_at    INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_expires ON rate_limits(expires_at);

-- ── IP WHITELIST ───────────────────────────────────────────
-- Optional: IP whitelist for super admin access
CREATE TABLE IF NOT EXISTS ip_whitelist (
  ip            TEXT PRIMARY KEY,
  description   TEXT,                 -- "Office", "Home", "VPN"
  added_by      TEXT NOT NULL,
  added_at      INTEGER NOT NULL,
  is_active     INTEGER NOT NULL DEFAULT 1
);

-- ── BANNED IPS ─────────────────────────────────────────────
-- Block malicious IPs
CREATE TABLE IF NOT EXISTS banned_ips (
  ip            TEXT PRIMARY KEY,
  reason        TEXT NOT NULL,
  banned_by     TEXT NOT NULL,
  banned_at     INTEGER NOT NULL,
  expires_at    INTEGER              -- NULL = permanent
);

CREATE INDEX IF NOT EXISTS idx_banned_ips_expires ON banned_ips(expires_at);

-- ── SESSION TOKENS ─────────────────────────────────────────
-- Track active admin sessions (optional, can use KV instead)
CREATE TABLE IF NOT EXISTS admin_sessions (
  session_id    TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL,
  token_hash    TEXT NOT NULL,       -- SHA-256 hash of JWT
  created_at    INTEGER NOT NULL,
  expires_at    INTEGER NOT NULL,
  last_seen     INTEGER,
  ip            TEXT,
  user_agent    TEXT
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_id ON admin_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);

-- ══════════════════════════════════════════════════════════
-- SEED DATA
-- ══════════════════════════════════════════════════════════

-- Add system admin log
INSERT INTO admin_logs (admin_id, action, target, result, timestamp, ip)
VALUES ('system', 'init_security_tables', NULL, 'SUCCESS', unixepoch() * 1000, '127.0.0.1');

-- ══════════════════════════════════════════════════════════
-- CLEANUP TRIGGER
-- ══════════════════════════════════════════════════════════

-- Auto-cleanup expired rate limits
CREATE TRIGGER IF NOT EXISTS cleanup_expired_rate_limits
AFTER INSERT ON rate_limits
BEGIN
  DELETE FROM rate_limits WHERE expires_at < unixepoch() * 1000;
END;

-- Auto-cleanup expired bans
CREATE TRIGGER IF NOT EXISTS cleanup_expired_bans
AFTER INSERT ON banned_ips
BEGIN
  DELETE FROM banned_ips WHERE expires_at IS NOT NULL AND expires_at < unixepoch() * 1000;
END;

-- ══════════════════════════════════════════════════════════
-- DONE
-- ══════════════════════════════════════════════════════════
