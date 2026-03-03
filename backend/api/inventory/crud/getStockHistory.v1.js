const { supabaseAdmin } = require("../../../config/supabase");

/**
 * @desc    Get stock adjustment history
 * @route   GET /api/inventory/history?product_id=
 * @route   GET /api/inventory/:id/history
 * @access  Private
 */
module.exports = async (req, res) => {
  try {
    const productId = req.params.id || req.query.product_id;

    let query = supabaseAdmin
      .from("inventory_transactions")
      .select("*, profiles(full_name), products(name, sku)")
      .order("created_at", { ascending: false })
      .limit(100);

    if (productId) {
      query = query.eq("product_id", productId);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    res.status(200).json(data || []);
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
