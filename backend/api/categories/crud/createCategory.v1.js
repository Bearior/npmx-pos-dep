const { supabaseAdmin } = require("../../../config/supabase");

/**
 * @desc    Create a new category
 * @route   POST /api/categories
 * @access  Private (admin, manager)
 */
module.exports = async (req, res) => {
  try {
    const { name, description, icon, sort_order, is_active } = req.body;

    const { data, error } = await supabaseAdmin
      .from("categories")
      .insert({
        name,
        description: description || null,
        icon: icon || null,
        sort_order: sort_order || 0,
        is_active: is_active !== false,
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
