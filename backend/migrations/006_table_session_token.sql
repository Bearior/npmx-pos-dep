-- ============================================================
-- Migration 006: Add session_token to restaurant_tables
-- Prevents orders after bill is paid until QR is re-scanned.
-- ============================================================

ALTER TABLE restaurant_tables
  ADD COLUMN IF NOT EXISTS session_token TEXT DEFAULT encode(gen_random_bytes(16), 'hex');

-- Populate existing rows with unique tokens
UPDATE restaurant_tables SET session_token = encode(gen_random_bytes(16), 'hex') WHERE session_token IS NULL;

ALTER TABLE restaurant_tables ALTER COLUMN session_token SET NOT NULL;
