const { supabaseAdmin } = require("../../../config/supabase");

/**
 * @desc    Get all variants for a product
 * @route   GET /api/products/:id/variants
 * @access  Private
 */
module.exports = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("product_variants")
      .select("*")
      .eq("product_id", req.params.id)
      .order("sort_order", { ascending: true });

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
