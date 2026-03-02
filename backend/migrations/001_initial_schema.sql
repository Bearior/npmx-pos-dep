-- ============================================================
-- NPMX POS – Supabase PostgreSQL Schema
-- Run this in the Supabase SQL Editor to set up all tables.
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------
-- 1. Profiles
-- ----------------------
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'cashier' CHECK (role IN ('admin', 'manager', 'cashier')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Service role full access on profiles"
  ON profiles FOR ALL USING (auth.role() = 'service_role');

-- ----------------------
-- 2. Categories
-- ----------------------
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read categories"
  ON categories FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
CREATE POLICY "Service role manages categories"
  ON categories FOR ALL USING (auth.role() = 'service_role');

-- ----------------------
-- 3. Products
-- ----------------------
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  cost_price NUMERIC(10,2),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  sku TEXT UNIQUE,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  track_inventory BOOLEAN DEFAULT false,
  stock_quantity INT DEFAULT 0,
  low_stock_threshold INT DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read products"
  ON products FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
CREATE POLICY "Service role manages products"
  ON products FOR ALL USING (auth.role() = 'service_role');

-- ----------------------
-- 4. Product Variants (size, add-ons, etc.)
-- ----------------------
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'size' CHECK (type IN ('size', 'add_on', 'color', 'custom')),
  price_modifier NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read variants"
  ON product_variants FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
CREATE POLICY "Service role manages variants"
  ON product_variants FOR ALL USING (auth.role() = 'service_role');

-- ----------------------
-- 5. Discounts / Promo Codes
-- ----------------------
CREATE TABLE IF NOT EXISTS discounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value NUMERIC(10,2) NOT NULL,
  max_discount NUMERIC(10,2),
  min_order_amount NUMERIC(10,2),
  max_uses INT,
  times_used INT DEFAULT 0,
  starts_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read discounts"
  ON discounts FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
CREATE POLICY "Service role manages discounts"
  ON discounts FOR ALL USING (auth.role() = 'service_role');

-- ----------------------
-- 6. Orders
-- ----------------------
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  parent_order_id UUID REFERENCES orders(id),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'preparing', 'ready', 'completed', 'cancelled', 'voided', 'split')),
  cashier_id UUID REFERENCES profiles(id),
  customer_name TEXT,
  table_number TEXT,
  notes TEXT,
  discount_id UUID REFERENCES discounts(id),
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(10,2) DEFAULT 0,
  tax_rate NUMERIC(5,4) DEFAULT 0.0700,
  tax_amount NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  voided_by UUID REFERENCES profiles(id),
  voided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at);
CREATE INDEX idx_orders_cashier ON orders(cashier_id);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read orders"
  ON orders FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
CREATE POLICY "Service role manages orders"
  ON orders FOR ALL USING (auth.role() = 'service_role');

-- ----------------------
-- 7. Order Items
-- ----------------------
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  variant_id UUID REFERENCES product_variants(id),
  variant_info TEXT,
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read order_items"
  ON order_items FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
CREATE POLICY "Service role manages order_items"
  ON order_items FOR ALL USING (auth.role() = 'service_role');

-- ----------------------
-- 8. Payments
-- ----------------------
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  method TEXT NOT NULL CHECK (method IN ('cash', 'qr', 'credit_card', 'transfer')),
  amount NUMERIC(10,2) NOT NULL,
  tendered NUMERIC(10,2),
  change_amount NUMERIC(10,2) DEFAULT 0,
  reference_number TEXT,
  status TEXT NOT NULL DEFAULT 'completed'
    CHECK (status IN ('completed', 'refunded', 'partially_refunded', 'failed')),
  processed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_method ON payments(method);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read payments"
  ON payments FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
CREATE POLICY "Service role manages payments"
  ON payments FOR ALL USING (auth.role() = 'service_role');

-- ----------------------
-- 9. Inventory Transactions
-- ----------------------
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('sale', 'restock', 'adjustment', 'waste', 'return')),
  quantity INT NOT NULL,
  previous_quantity INT NOT NULL,
  new_quantity INT NOT NULL,
  reason TEXT,
  performed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_inv_txn_product ON inventory_transactions(product_id);

ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read inv txn"
  ON inventory_transactions FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
CREATE POLICY "Service role manages inv txn"
  ON inventory_transactions FOR ALL USING (auth.role() = 'service_role');

-- ----------------------
-- 10. Tax Settings
-- ----------------------
CREATE TABLE IF NOT EXISTS tax_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL DEFAULT 'VAT',
  rate NUMERIC(5,4) NOT NULL DEFAULT 0.0700,
  is_inclusive BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE tax_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages tax"
  ON tax_settings FOR ALL USING (auth.role() = 'service_role');

-- ----------------------
-- Helper RPC Functions
-- ----------------------

-- Decrement stock (used on order creation)
CREATE OR REPLACE FUNCTION decrement_stock(p_product_id UUID, p_quantity INT)
RETURNS void AS $$
BEGIN
  UPDATE products
  SET stock_quantity = GREATEST(stock_quantity - p_quantity, 0),
      updated_at = now()
  WHERE id = p_product_id AND track_inventory = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment stock (used on order void)
CREATE OR REPLACE FUNCTION increment_stock(p_product_id UUID, p_quantity INT)
RETURNS void AS $$
BEGIN
  UPDATE products
  SET stock_quantity = stock_quantity + p_quantity,
      updated_at = now()
  WHERE id = p_product_id AND track_inventory = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
