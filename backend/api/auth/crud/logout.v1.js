/**
 * @desc    Logout (client-side token clear)
 * @route   POST /api/auth/logout
 * @access  Private
 */
module.exports = async (req, res) => {
  try {
    // Supabase doesn't have admin sign-out; client clears the session.
    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
