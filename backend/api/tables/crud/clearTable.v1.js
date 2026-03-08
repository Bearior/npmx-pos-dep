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

    // Mark all active orders (pending/preparing/ready/served) as completed (paid)
    const { data, error } = await supabaseAdmin
      .from("orders")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("table_number", table.table_number)
      .in("status", ["pending", "preparing", "ready", "served"])
      .select("id, order_number, total");

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    const totalPaid = (data || []).reduce((sum, o) => sum + (o.total || 0), 0);

    // Rotate session token — invalidates existing QR sessions
    const newToken = require("crypto").randomBytes(16).toString("hex");
    await supabaseAdmin
      .from("restaurant_tables")
      .update({ session_token: newToken, updated_at: new Date().toISOString() })
      .eq("id", table.id);

    res.status(200).json({
      success: true,
      message: `Completed ${(data || []).length} order(s) for table ${table.table_number}`,
      cleared_count: (data || []).length,
      total_paid: totalPaid,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
