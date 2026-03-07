const { supabaseAdmin } = require("../../../config/supabase");

/**
 * @desc    Create a new table
 * @route   POST /api/tables
 * @access  Private (admin, manager)
 */
module.exports = async (req, res) => {
  try {
    const { table_number, label, seats, is_active } = req.body;

    const { data, error } = await supabaseAdmin
      .from("restaurant_tables")
      .insert({
        table_number,
        label: label || null,
        seats: seats || 4,
        is_active: is_active !== undefined ? is_active : true,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return res.status(409).json({ success: false, message: "Table number already exists" });
      }
      return res.status(500).json({ success: false, message: error.message });
    }

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
