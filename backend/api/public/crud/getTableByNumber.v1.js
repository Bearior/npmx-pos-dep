const { supabaseAdmin } = require("../../../config/supabase");

/**
 * @desc    Get table info by table number (validates table exists and is active)
 * @route   GET /api/public/table/:tableNumber
 * @access  Public
 */
module.exports = async (req, res) => {
  try {
    const { tableNumber } = req.params;

    const { data, error } = await supabaseAdmin
      .from("restaurant_tables")
      .select("id, table_number, label, seats, session_token")
      .eq("table_number", tableNumber)
      .eq("is_active", true)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, message: "Table not found or inactive" });
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
