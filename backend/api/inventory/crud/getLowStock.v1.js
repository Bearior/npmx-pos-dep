const { supabaseAdmin } = require("../../../config/supabase");

/**
 * @desc    Get products with stock below minimum level
 * @route   GET /api/inventory/low-stock
 * @access  Private
 */
module.exports = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("id, stock_quantity, low_stock_threshold")
      .eq("is_active", true)
      .eq("track_inventory", true);

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    const lowStockCount = (data || []).filter(
      (p) => p.stock_quantity <= p.low_stock_threshold
    ).length;

    res.status(200).json({ count: lowStockCount });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
