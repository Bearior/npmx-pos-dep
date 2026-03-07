const { supabaseAdmin } = require("../../../config/supabase");

/**
 * @desc    Clear table session — marks all active orders for a table as completed
 * @route   POST /api/tables/:id/clear
 * @access  Private (admin, manager)
 */
module.exports = async (req, res) => {
  try {
    // Get table info
    const { data: table, error: tableErr } = await supabaseAdmin
      .from("restaurant_tables")
      .select("id, table_number")
      .eq("id", req.params.id)
      .single();

    if (tableErr || !table) {
      return res.status(404).json({ success: false, message: "Table not found" });
    }

    // Update all pending/preparing/ready orders for this table to "completed"
    const { data, error } = await supabaseAdmin
      .from("orders")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("table_number", table.table_number)
      .in("status", ["pending", "preparing", "ready"])
      .select("id");

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    res.status(200).json({
      success: true,
      message: `Cleared ${(data || []).length} order(s) for table ${table.table_number}`,
      cleared_count: (data || []).length,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
