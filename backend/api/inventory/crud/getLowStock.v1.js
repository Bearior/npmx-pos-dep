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
      .select("id, name, sku, stock_quantity, low_stock_threshold, categories(name)")
      .eq("is_active", true)
      .order("stock_quantity");

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
