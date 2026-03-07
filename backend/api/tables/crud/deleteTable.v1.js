const { supabaseAdmin } = require("../../../config/supabase");

/**
 * @desc    Delete a table
 * @route   DELETE /api/tables/:id
 * @access  Private (admin, manager)
 */
module.exports = async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from("restaurant_tables")
      .delete()
      .eq("id", req.params.id);

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    res.status(200).json({ success: true, message: "Table deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
