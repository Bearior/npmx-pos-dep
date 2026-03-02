const { supabaseAdmin } = require("../../../config/supabase");

/**
 * @desc    Register a new user (staff)
 * @route   POST /api/auth/register
 * @access  Public
 */
module.exports = async (req, res) => {
  try {
    const { email, password, full_name, role } = req.body;

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    // Create profile row
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: data.user.id,
        email,
        full_name,
        role: role || "cashier",
      })
      .select()
      .single();

    if (profileErr) {
      return res.status(500).json({ success: false, message: profileErr.message });
    }

    res.status(201).json({ success: true, user: data.user, profile });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
