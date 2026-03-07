-- ============================================================
-- NPMX POS – Tables Management
-- Adds a restaurant_tables table for QR-based ordering.
-- ============================================================

CREATE TABLE IF NOT EXISTS restaurant_tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_number TEXT UNIQUE NOT NULL,
  label TEXT,                           -- e.g. "Window Seat", "Patio 3"
  seats INT DEFAULT 4,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tables_number ON restaurant_tables(table_number);

ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;

-- Authenticated users (admins) can read
CREATE POLICY "Authenticated users can read tables"
  ON restaurant_tables FOR SELECT
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Service role manages tables
CREATE POLICY "Service role manages tables"
  ON restaurant_tables FOR ALL
  USING (auth.role() = 'service_role');

-- Allow anonymous reads for QR ordering (public menu)
CREATE POLICY "Anon can read active tables"
  ON restaurant_tables FOR SELECT
  USING (auth.role() = 'anon' AND is_active = true);
