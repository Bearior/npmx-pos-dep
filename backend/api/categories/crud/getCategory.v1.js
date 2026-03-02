const { supabaseAdmin } = require("../../../config/supabase");

/**
 * @desc    Get a single category by ID (with products)
 * @route   GET /api/categories/:id
 * @access  Private
 */
module.exports = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("categories")
      .select("*, products(*)")
      .eq("id", req.params.id)
      .single();

    if (error) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
