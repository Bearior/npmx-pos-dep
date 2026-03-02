const { supabaseAdmin } = require("../../../config/supabase");

/**
 * @desc    Delete a product (soft-delete)
 * @route   DELETE /api/products/:id
 * @access  Private (admin, manager)
 */
module.exports = async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from("products")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", req.params.id);

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    res.status(200).json({ success: true, message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
