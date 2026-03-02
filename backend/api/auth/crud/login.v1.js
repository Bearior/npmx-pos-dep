const { supabaseAdmin } = require("../../../config/supabase");

/**
 * @desc    Login with email + password
 * @route   POST /api/auth/login
 * @access  Public
 */
module.exports = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ success: false, message: error.message });
    }

    // Fetch profile
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();

    res.status(200).json({
      success: true,
      user: data.user,
      session: data.session,
      profile,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
