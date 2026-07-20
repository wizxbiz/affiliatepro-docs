-- live_sessions table for Go backend /api/v1/live endpoint
-- Columns match d1_repo.go GetLiveSessions / StartLiveSession queries
CREATE TABLE IF NOT EXISTS live_sessions (
  id            TEXT PRIMARY KEY,
  title         TEXT,
  description   TEXT,
  thumbnail     TEXT,
  playback_url  TEXT,
  agency_name   TEXT,
  is_official   INTEGER DEFAULT 0,
  verify_type   TEXT,
  viewer_count  INTEGER DEFAULT 0,
  status        TEXT DEFAULT 'ended',
  headlines     TEXT,
  created_at    INTEGER
);

CREATE INDEX IF NOT EXISTS idx_live_sessions_status_created
  ON live_sessions (status, created_at DESC);
