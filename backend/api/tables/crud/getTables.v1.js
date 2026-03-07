const { supabaseAdmin } = require("../../../config/supabase");

/**
 * @desc    Get all tables
 * @route   GET /api/tables
 * @access  Private
 */
module.exports = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("restaurant_tables")
      .select("*")
      .order("table_number");

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
