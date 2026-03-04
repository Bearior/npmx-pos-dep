const { supabaseAdmin } = require("../../../config/supabase");

/**
 * @desc    Get all products with stock information
 * @route   GET /api/inventory
 * @access  Private
 */
module.exports = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("id, name, sku, price, cost_price, stock_quantity, is_active, track_inventory, low_stock_threshold, category_id, visible_on_pos, image_url, description, categories(name)")
      .eq("is_active", true)
      .order("name");

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
