-- ============================================================
-- NPMX POS – Seed Data (development / demo)
-- ============================================================

-- Default tax setting
INSERT INTO tax_settings (name, rate, is_inclusive, is_active)
VALUES ('VAT 7%', 0.0700, false, true)
ON CONFLICT DO NOTHING;

-- Categories
INSERT INTO categories (id, name, description, icon, sort_order) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Hot Coffee', 'Freshly brewed hot coffee', 'coffee', 1),
  ('a1000000-0000-0000-0000-000000000002', 'Iced Coffee', 'Cold coffee drinks', 'coffee', 2),
  ('a1000000-0000-0000-0000-000000000003', 'Tea & Matcha', 'Tea and matcha beverages', 'leaf', 3),
  ('a1000000-0000-0000-0000-000000000004', 'Smoothies', 'Fruit smoothies and blended', 'cup-soda', 4),
  ('a1000000-0000-0000-0000-000000000005', 'Bakery', 'Pastries, cakes, and bakery items', 'cake', 5),
  ('a1000000-0000-0000-0000-000000000006', 'Snacks', 'Light bites and snacks', 'utensils', 6)
ON CONFLICT DO NOTHING;

-- Products
INSERT INTO products (id, name, description, price, cost_price, category_id, sku, track_inventory, stock_quantity, low_stock_threshold) VALUES
  -- Hot Coffee
  ('b1000000-0000-0000-0000-000000000001', 'Americano', 'Classic black coffee', 65.00, 15.00, 'a1000000-0000-0000-0000-000000000001', 'HOT-001', false, 0, 0),
  ('b1000000-0000-0000-0000-000000000002', 'Latte', 'Espresso with steamed milk', 75.00, 20.00, 'a1000000-0000-0000-0000-000000000001', 'HOT-002', false, 0, 0),
  ('b1000000-0000-0000-0000-000000000003', 'Cappuccino', 'Espresso with foam', 75.00, 20.00, 'a1000000-0000-0000-0000-000000000001', 'HOT-003', false, 0, 0),
  ('b1000000-0000-0000-0000-000000000004', 'Mocha', 'Coffee with chocolate', 85.00, 25.00, 'a1000000-0000-0000-0000-000000000001', 'HOT-004', false, 0, 0),

  -- Iced Coffee
  ('b1000000-0000-0000-0000-000000000005', 'Iced Americano', 'Cold black coffee', 70.00, 15.00, 'a1000000-0000-0000-0000-000000000002', 'ICE-001', false, 0, 0),
  ('b1000000-0000-0000-0000-000000000006', 'Iced Latte', 'Cold latte', 80.00, 20.00, 'a1000000-0000-0000-0000-000000000002', 'ICE-002', false, 0, 0),
  ('b1000000-0000-0000-0000-000000000007', 'Iced Mocha', 'Cold mocha', 90.00, 25.00, 'a1000000-0000-0000-0000-000000000002', 'ICE-003', false, 0, 0),
  ('b1000000-0000-0000-0000-000000000008', 'Cold Brew', 'Slow-drip cold brew', 85.00, 18.00, 'a1000000-0000-0000-0000-000000000002', 'ICE-004', false, 0, 0),

  -- Tea & Matcha
  ('b1000000-0000-0000-0000-000000000009', 'Matcha Latte', 'Japanese matcha with milk', 90.00, 30.00, 'a1000000-0000-0000-0000-000000000003', 'TEA-001', false, 0, 0),
  ('b1000000-0000-0000-0000-000000000010', 'Thai Tea', 'Traditional Thai iced tea', 65.00, 12.00, 'a1000000-0000-0000-0000-000000000003', 'TEA-002', false, 0, 0),
  ('b1000000-0000-0000-0000-000000000011', 'Green Tea', 'Hot Japanese green tea', 55.00, 10.00, 'a1000000-0000-0000-0000-000000000003', 'TEA-003', false, 0, 0),

  -- Smoothies
  ('b1000000-0000-0000-0000-000000000012', 'Mango Smoothie', 'Fresh mango blended', 95.00, 30.00, 'a1000000-0000-0000-0000-000000000004', 'SMT-001', true, 50, 10),
  ('b1000000-0000-0000-0000-000000000013', 'Berry Smoothie', 'Mixed berries blended', 95.00, 35.00, 'a1000000-0000-0000-0000-000000000004', 'SMT-002', true, 40, 10),

  -- Bakery
  ('b1000000-0000-0000-0000-000000000014', 'Croissant', 'Butter croissant', 55.00, 18.00, 'a1000000-0000-0000-0000-000000000005', 'BAK-001', true, 30, 5),
  ('b1000000-0000-0000-0000-000000000015', 'Chocolate Cake', 'Rich chocolate cake slice', 85.00, 25.00, 'a1000000-0000-0000-0000-000000000005', 'BAK-002', true, 20, 5),
  ('b1000000-0000-0000-0000-000000000016', 'Banana Bread', 'Homemade banana bread', 60.00, 15.00, 'a1000000-0000-0000-0000-000000000005', 'BAK-003', true, 25, 5),

  -- Snacks
  ('b1000000-0000-0000-0000-000000000017', 'Cookie', 'Chocolate chip cookie', 35.00, 8.00, 'a1000000-0000-0000-0000-000000000006', 'SNK-001', true, 50, 10),
  ('b1000000-0000-0000-0000-000000000018', 'Brownie', 'Rich chocolate brownie', 55.00, 15.00, 'a1000000-0000-0000-0000-000000000006', 'SNK-002', true, 35, 10)
ON CONFLICT DO NOTHING;

-- Product Variants (sizes and add-ons for drinks)
INSERT INTO product_variants (product_id, name, type, price_modifier, sort_order) VALUES
  -- Size variants for all coffee
  ('b1000000-0000-0000-0000-000000000001', 'Small', 'size', -10.00, 1),
  ('b1000000-0000-0000-0000-000000000001', 'Regular', 'size', 0.00, 2),
  ('b1000000-0000-0000-0000-000000000001', 'Large', 'size', 15.00, 3),

  ('b1000000-0000-0000-0000-000000000002', 'Small', 'size', -10.00, 1),
  ('b1000000-0000-0000-0000-000000000002', 'Regular', 'size', 0.00, 2),
  ('b1000000-0000-0000-0000-000000000002', 'Large', 'size', 15.00, 3),

  ('b1000000-0000-0000-0000-000000000005', 'Small', 'size', -10.00, 1),
  ('b1000000-0000-0000-0000-000000000005', 'Regular', 'size', 0.00, 2),
  ('b1000000-0000-0000-0000-000000000005', 'Large', 'size', 15.00, 3),

  ('b1000000-0000-0000-0000-000000000006', 'Small', 'size', -10.00, 1),
  ('b1000000-0000-0000-0000-000000000006', 'Regular', 'size', 0.00, 2),
  ('b1000000-0000-0000-0000-000000000006', 'Large', 'size', 15.00, 3),

  -- Add-on variants
  ('b1000000-0000-0000-0000-000000000002', 'Extra Shot', 'add_on', 20.00, 10),
  ('b1000000-0000-0000-0000-000000000002', 'Oat Milk', 'add_on', 15.00, 11),
  ('b1000000-0000-0000-0000-000000000002', 'Vanilla Syrup', 'add_on', 10.00, 12),

  ('b1000000-0000-0000-0000-000000000006', 'Extra Shot', 'add_on', 20.00, 10),
  ('b1000000-0000-0000-0000-000000000006', 'Oat Milk', 'add_on', 15.00, 11),
  ('b1000000-0000-0000-0000-000000000006', 'Caramel Syrup', 'add_on', 10.00, 12),

  ('b1000000-0000-0000-0000-000000000009', 'Regular', 'size', 0.00, 1),
  ('b1000000-0000-0000-0000-000000000009', 'Large', 'size', 20.00, 2)
ON CONFLICT DO NOTHING;

-- Sample Discounts
INSERT INTO discounts (code, name, type, value, max_discount, min_order_amount, max_uses, is_active) VALUES
  ('WELCOME10', 'Welcome 10% off', 'percentage', 10.00, 50.00, 100.00, 100, true),
  ('FLAT20', 'Flat ฿20 off', 'fixed', 20.00, NULL, 80.00, NULL, true),
  ('VIP15', 'VIP 15% discount', 'percentage', 15.00, 100.00, NULL, NULL, true)
ON CONFLICT DO NOTHING;
