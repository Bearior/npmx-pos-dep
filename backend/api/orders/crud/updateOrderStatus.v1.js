const { supabaseAdmin } = require("../../../config/supabase");

/**
 * @desc    Update order status
 * @route   PUT /api/orders/:id/status
 * @access  Private
 */
module.exports = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["pending", "preparing", "ready", "served", "completed", "cancelled"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const { data, error } = await supabaseAdmin
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
