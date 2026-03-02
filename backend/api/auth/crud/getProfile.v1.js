const { supabaseAdmin } = require("../../../config/supabase");

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/profile
 * @access  Private
 */
module.exports = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", req.user.id)
      .single();

    if (error) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
