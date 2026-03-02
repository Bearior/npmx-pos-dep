const { supabaseAdmin } = require("../../../config/supabase");

/**
 * @desc    Delete a category
 * @route   DELETE /api/categories/:id
 * @access  Private (admin, manager)
 */
module.exports = async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from("categories")
      .delete()
      .eq("id", req.params.id);

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    res.status(200).json({ success: true, message: "Category deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
