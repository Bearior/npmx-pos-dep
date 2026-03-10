-- Function to get orders and order_items table sizes and row counts
CREATE OR REPLACE FUNCTION get_table_sizes()
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'orders_size_bytes', pg_total_relation_size('orders'),
    'order_items_size_bytes', pg_total_relation_size('order_items'),
    'orders_count', (SELECT COUNT(*) FROM orders),
    'order_items_count', (SELECT COUNT(*) FROM order_items),
    'first_order_at', (SELECT MIN(created_at) FROM orders),
    'db_size_bytes', pg_database_size(current_database())
  );
$$;
