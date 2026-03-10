const { supabaseAdmin } = require("../../../config/supabase");

/**
 * @desc    Get active kitchen orders (pending, preparing, ready) with items
 * @route   GET /api/orders/kitchen
 * @access  Private
 */
module.exports = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, status, customer_name, table_number, notes, created_at, updated_at, order_items(id, product_name, variant_info, quantity, unit_price, notes)")
      .in("status", ["pending", "preparing", "ready"])
      .order("created_at", { ascending: true });

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    res.status(200).json({ data });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
