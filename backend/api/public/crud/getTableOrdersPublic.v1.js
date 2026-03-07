const { supabaseAdmin } = require("../../../config/supabase");

/**
 * @desc    Get orders for a table (public view — no auth required)
 * @route   GET /api/public/table/:tableNumber/orders
 * @access  Public
 */
module.exports = async (req, res) => {
  try {
    const { tableNumber } = req.params;

    // Validate table exists and is active
    const { data: table, error: tableErr } = await supabaseAdmin
      .from("restaurant_tables")
      .select("id, table_number, label")
      .eq("table_number", tableNumber)
      .eq("is_active", true)
      .single();

    if (tableErr || !table) {
      return res.status(404).json({ success: false, message: "Table not found or inactive" });
    }

    // Get non-voided/cancelled orders for this table, with session_active flag
    const { data: orders, error: ordersErr } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, status, customer_name, subtotal, tax_amount, total, created_at, order_items(id, product_name, variant_info, quantity, unit_price)")
      .eq("table_number", table.table_number)
      .not("status", "in", '("voided","cancelled")')
      .order("created_at", { ascending: false });

    if (ordersErr) {
      return res.status(500).json({ success: false, message: ordersErr.message });
    }

    const grandTotal = (orders || []).reduce((sum, o) => sum + o.total, 0);

    res.status(200).json({
      table,
      orders: orders || [],
      grand_total: parseFloat(grandTotal.toFixed(2)),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
