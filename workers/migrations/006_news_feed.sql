-- Public news feed managed by TukTuk admins and system publishers.
CREATE TABLE IF NOT EXISTS news_feed (
  id              TEXT PRIMARY KEY,
  title           TEXT NOT NULL,
  summary         TEXT DEFAULT '',
  content         TEXT DEFAULT '',
  source          TEXT DEFAULT '',
  province        TEXT DEFAULT 'Global',
  image_url       TEXT DEFAULT '',
  video_url       TEXT DEFAULT '',
  author_name     TEXT DEFAULT '',
  author_id       TEXT DEFAULT '',
  author_avatar   TEXT DEFAULT '',
  category        TEXT DEFAULT 'news',
  action_type     TEXT DEFAULT 'external',
  target_url      TEXT DEFAULT '',
  status          TEXT NOT NULL DEFAULT 'active',
  published       INTEGER NOT NULL DEFAULT 1,
  pinned          INTEGER NOT NULL DEFAULT 0,
  is_verified     INTEGER NOT NULL DEFAULT 0,
  smart_score     REAL NOT NULL DEFAULT 0,
  impact_level    TEXT DEFAULT '',
  sentiment       TEXT DEFAULT '',
  summary_points  TEXT DEFAULT '[]',
  likes_count     INTEGER NOT NULL DEFAULT 0,
  comments_count  INTEGER NOT NULL DEFAULT 0,
  views_count     INTEGER NOT NULL DEFAULT 0,
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER
);

CREATE INDEX IF NOT EXISTS idx_news_feed_public_created
  ON news_feed(status, published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_feed_category_created
  ON news_feed(category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_feed_author_created
  ON news_feed(author_id, created_at DESC);
