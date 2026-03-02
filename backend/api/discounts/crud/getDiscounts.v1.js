const { supabaseAdmin } = require("../../../config/supabase");

/**
 * @desc    Get all discounts
 * @route   GET /api/discounts
 * @access  Private
 */
module.exports = async (req, res) => {
  try {
    let query = supabaseAdmin
      .from("discounts")
      .select("*")
      .order("created_at", { ascending: false });

    if (req.query.active === "true") {
      query = query
        .eq("is_active", true)
        .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
