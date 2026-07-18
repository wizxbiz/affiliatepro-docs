-- =============================================================
-- Migration: Add missing fields for products and posts tables
-- =============================================================

-- 1. Add fields to products table
ALTER TABLE products ADD COLUMN seller_phone TEXT;
ALTER TABLE products ADD COLUMN seller_line_id TEXT;
ALTER TABLE products ADD COLUMN seller_facebook TEXT;
ALTER TABLE products ADD COLUMN seller_location TEXT;
ALTER TABLE products ADD COLUMN product_unit TEXT;
ALTER TABLE products ADD COLUMN product_stock INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN is_otop INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN is_organic INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN video_url TEXT;

-- 2. Add fields to posts table
ALTER TABLE posts ADD COLUMN title TEXT;
ALTER TABLE posts ADD COLUMN youtube_url TEXT;
ALTER TABLE posts ADD COLUMN video_embed TEXT;
ALTER TABLE posts ADD COLUMN linked_product_id TEXT;
ALTER TABLE posts ADD COLUMN product_name TEXT;
ALTER TABLE posts ADD COLUMN product_price REAL DEFAULT 0;
ALTER TABLE posts ADD COLUMN product_thumb TEXT;
ALTER TABLE posts ADD COLUMN pinned INTEGER DEFAULT 0;
ALTER TABLE posts ADD COLUMN published INTEGER DEFAULT 1;
