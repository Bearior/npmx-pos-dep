-- ============================================================
-- Migration: Add visible_on_pos column to products table
-- ============================================================

ALTER TABLE products
ADD COLUMN IF NOT EXISTS visible_on_pos BOOLEAN DEFAULT true;

-- Update existing products to be visible by default
UPDATE products SET visible_on_pos = true WHERE visible_on_pos IS NULL;
