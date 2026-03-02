const { supabaseAdmin } = require("../../../config/supabase");

/**
 * @desc    Delete (soft) a discount
 * @route   DELETE /api/discounts/:id
 * @access  Private (admin, manager)
 */
module.exports = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("discounts")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ success: false, message: "Discount not found" });
      }
      return res.status(500).json({ success: false, message: error.message });
    }

    res.status(200).json({ success: true, message: "Discount deactivated" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
