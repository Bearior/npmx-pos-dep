const { supabaseAdmin } = require("../../../config/supabase");

/**
 * @desc    Update current user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
module.exports = async (req, res) => {
  try {
    const allowedFields = ["full_name", "phone", "avatar_url"];
    const filtered = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) filtered[key] = req.body[key];
    }

    if (Object.keys(filtered).length === 0) {
      return res.status(400).json({ success: false, message: "No valid fields to update" });
    }

    filtered.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update(filtered)
      .eq("id", req.user.id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
