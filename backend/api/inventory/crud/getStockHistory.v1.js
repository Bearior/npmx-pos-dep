const { supabaseAdmin } = require("../../../config/supabase");

/**
 * @desc    Get stock adjustment history
 * @route   GET /api/inventory/history?product_id=
 * @access  Private
 */
module.exports = async (req, res) => {
  try {
    let query = supabaseAdmin
      .from("stock_transactions")
      .select("*, products(name, sku)")
      .order("created_at", { ascending: false })
      .limit(100);

    if (req.query.product_id) {
      query = query.eq("product_id", req.query.product_id);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
