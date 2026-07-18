-- Migration 005: Add raw_data JSON column for Firestore compatibility shimming
ALTER TABLE win_riders ADD COLUMN raw_data TEXT;
ALTER TABLE win_requests ADD COLUMN raw_data TEXT;
