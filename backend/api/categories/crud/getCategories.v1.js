const { supabaseAdmin } = require("../../../config/supabase");

/**
 * @desc    Get all categories
 * @route   GET /api/categories
 * @access  Private
 */
module.exports = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    // Categories rarely change — allow clients to cache for 5 minutes
    res.set("Cache-Control", "private, max-age=300");
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
