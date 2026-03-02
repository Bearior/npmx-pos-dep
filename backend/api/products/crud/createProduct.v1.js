const { supabaseAdmin } = require("../../../config/supabase");

/**
 * @desc    Create a new product
 * @route   POST /api/products
 * @access  Private (admin, manager)
 */
module.exports = async (req, res) => {
  try {
    const { name, description, price, cost_price, category_id, sku, image_url, is_active, track_inventory, stock_quantity, low_stock_threshold } = req.body;

    const { data, error } = await supabaseAdmin
      .from("products")
      .insert({
        name,
        description: description || null,
        price: parseFloat(price),
        cost_price: cost_price ? parseFloat(cost_price) : null,
        category_id,
        sku: sku || null,
        image_url: image_url || null,
        is_active: is_active !== false,
        track_inventory: track_inventory || false,
        stock_quantity: stock_quantity || 0,
        low_stock_threshold: low_stock_threshold || 10,
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
