const { supabaseAdmin } = require("../../../config/supabase");

/**
 * @desc    Refund a payment
 * @route   POST /api/payments/:id/refund
 * @access  Private
 */
module.exports = async (req, res) => {
  try {
    const { data: payment } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }
    if (payment.status === "refunded") {
      return res.status(400).json({ success: false, message: "Payment already refunded" });
    }

    const refundAmount = req.body.amount ? parseFloat(req.body.amount) : payment.amount;
    if (refundAmount > payment.amount) {
      return res.status(400).json({ success: false, message: "Refund amount cannot exceed original payment" });
    }

    // Create refund record
    const { data: refund, error } = await supabaseAdmin
      .from("payments")
      .insert({
        order_id: payment.order_id,
        method: payment.method,
        amount: -refundAmount,
        status: "refunded",
        reference_number: `REFUND-${payment.id}`,
        processed_by: req.user.id,
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    // Update original payment status
    await supabaseAdmin
      .from("payments")
      .update({ status: refundAmount >= payment.amount ? "refunded" : "partially_refunded" })
      .eq("id", req.params.id);

    res.status(200).json({ success: true, data: refund });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
