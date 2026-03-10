const { supabaseAdmin } = require("../../../config/supabase");

const VALID_ROLES = ["admin", "manager", "cashier"];

/**
 * @desc    Register a new user (staff) — admin/manager only
 * @route   POST /api/auth/register
 * @access  Private (admin, manager)
 */
module.exports = async (req, res) => {
  try {
    const { email, password, full_name, role } = req.body;

    // Password strength: min 8 chars, at least one letter and one number
    if (!password || password.length < 8 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters with at least one letter and one number",
      });
    }

    // Validate role
    const assignedRole = role || "cashier";
    if (!VALID_ROLES.includes(assignedRole)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Must be: ${VALID_ROLES.join(", ")}`,
      });
    }

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
        role: assignedRole,
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
