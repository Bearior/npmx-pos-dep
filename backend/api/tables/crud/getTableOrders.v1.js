const { supabaseAdmin } = require("../../../config/supabase");

/**
 * @desc    Get active orders for a table
 * @route   GET /api/tables/:id/orders
 * @access  Private
 */
module.exports = async (req, res) => {
  try {
    // First get table info
    const { data: table, error: tableError } = await supabaseAdmin
      .from("restaurant_tables")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (tableError) {
      return res.status(404).json({ success: false, message: "Table not found" });
    }

    // Get orders for this table that are not voided/cancelled
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from("orders")
      .select("*, order_items(*)")
      .eq("table_number", table.table_number)
      .not("status", "in", '("voided","cancelled","completed")')
      .order("created_at", { ascending: false });

    if (ordersError) {
      return res.status(500).json({ success: false, message: ordersError.message });
    }

    res.status(200).json({ table, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
