-- =============================================================
-- Migration: Add Verified Seller Fields to Users Table
-- =============================================================

ALTER TABLE users ADD COLUMN line_oa_id TEXT;
ALTER TABLE users ADD COLUMN line_notify_token TEXT;
