const { supabaseAdmin } = require("../../../config/supabase");

/**
 * @desc    Delete a product variant
 * @route   DELETE /api/products/:id/variants/:variantId
 * @access  Private (admin, manager)
 */
module.exports = async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from("product_variants")
      .delete()
      .eq("id", req.params.variantId);

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    res.status(200).json({ success: true, message: "Variant deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
