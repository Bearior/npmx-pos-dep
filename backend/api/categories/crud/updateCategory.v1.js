const { supabaseAdmin } = require("../../../config/supabase");

/**
 * @desc    Update a category
 * @route   PUT /api/categories/:id
 * @access  Private (admin, manager)
 */
module.exports = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("categories")
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
