const { supabaseAdmin } = require("../../../config/supabase");

/**
 * @desc    Void an order and restore inventory
 * @route   DELETE /api/orders/:id
 * @access  Private (admin, manager)
 */
module.exports = async (req, res) => {
  try {
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", req.params.id)
      .single();

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Restore stock
    for (const item of order.order_items) {
      await supabaseAdmin.rpc("increment_stock", {
        p_product_id: item.product_id,
        p_quantity: item.quantity,
      });
    }

    const { error } = await supabaseAdmin
      .from("orders")
      .update({
        status: "voided",
        voided_by: req.user.id,
        voided_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", req.params.id);

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    res.status(200).json({ success: true, message: "Order voided" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
