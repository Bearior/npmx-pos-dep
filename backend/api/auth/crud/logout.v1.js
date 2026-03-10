const { supabaseAdmin } = require("../../../config/supabase");

/**
 * @desc    Logout – invalidate user session server-side
 * @route   POST /api/auth/logout
 * @access  Private (any role)
 */
module.exports = async (req, res) => {
  try {
    // Sign out the user from all sessions using the admin API
    const { error } = await supabaseAdmin.auth.admin.signOut(req.user.id, "global");

    if (error) {
      console.error("Supabase signOut error:", error.message);
      // Still return success – client will clear its session regardless
    }

    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
