const { supabaseAdmin } = require("../../../config/supabase");

/**
 * @desc    Update product information (excluding stock_quantity — use /adjust for that)
 * @route   PUT /api/inventory/:id
 * @access  Private (admin, manager)
 */
module.exports = async (req, res) => {
  try {
    const { id } = req.params;

    // Whitelist allowed fields — stock_quantity is NOT here
    const allowed = [
      "name",
      "description",
      "price",
      "cost_price",
      "category_id",
      "sku",
      "image_url",
      "is_active",
      "track_inventory",
      "low_stock_threshold",
    ];

    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: "No valid fields to update" });
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("products")
      .update(updates)
      .eq("id", id)
      .select("*, categories(name)")
      .single();

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    if (!data) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.status(200).json(data);
  } catch (err) {
    console.error("Inventory updateProduct error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
