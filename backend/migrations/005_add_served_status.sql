-- ============================================================
-- Migration 005: Add 'served' to orders.status CHECK constraint
-- ============================================================

-- PostgreSQL doesn't support ALTER TABLE ... ALTER COLUMN ... ADD CHECK directly
-- to an existing named constraint, so we drop and recreate it.

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'preparing', 'ready', 'served', 'completed', 'cancelled', 'voided', 'split'));
