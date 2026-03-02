const { supabaseAdmin } = require("../../../config/supabase");

/**
 * @desc    Get a single product by ID
 * @route   GET /api/products/:id
 * @access  Private
 */
module.exports = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("*, categories(name), product_variants(*)")
      .eq("id", req.params.id)
      .single();

    if (error) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
