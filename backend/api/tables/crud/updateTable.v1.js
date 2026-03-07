const { supabaseAdmin } = require("../../../config/supabase");

/**
 * @desc    Update a table
 * @route   PUT /api/tables/:id
 * @access  Private (admin, manager)
 */
module.exports = async (req, res) => {
  try {
    const { table_number, label, seats, is_active } = req.body;

    const updates = { updated_at: new Date().toISOString() };
    if (table_number !== undefined) updates.table_number = table_number;
    if (label !== undefined) updates.label = label;
    if (seats !== undefined) updates.seats = seats;
    if (is_active !== undefined) updates.is_active = is_active;

    const { data, error } = await supabaseAdmin
      .from("restaurant_tables")
      .update(updates)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return res.status(409).json({ success: false, message: "Table number already exists" });
      }
      return res.status(500).json({ success: false, message: error.message });
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
