const { supabaseAdmin } = require("../../../config/supabase");

const VALID_METHODS = ["cash", "qr", "credit_card", "transfer"];

/**
 * @desc    Create a payment for an order
 * @route   POST /api/payments
 * @access  Private
 */
module.exports = async (req, res) => {
  try {
    const { order_id, method, amount, reference_number } = req.body;

    if (!VALID_METHODS.includes(method)) {
      return res.status(400).json({
        success: false,
        message: `Invalid payment method. Must be: ${VALID_METHODS.join(", ")}`,
      });
    }

    // Get order
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, total, status")
      .eq("id", order_id)
      .single();

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    if (order.status === "voided") {
      return res.status(400).json({ success: false, message: "Cannot pay for a voided order" });
    }

    // Check existing payments
    const { data: existingPayments } = await supabaseAdmin
      .from("payments")
      .select("amount")
      .eq("order_id", order_id)
      .eq("status", "completed");

    const totalPaid = (existingPayments || []).reduce((s, p) => s + p.amount, 0);
    const remaining = order.total - totalPaid;

    if (remaining <= 0) {
      return res.status(400).json({ success: false, message: "Order is already fully paid" });
    }

    const paymentAmount = parseFloat(amount);
    const change = paymentAmount > remaining ? parseFloat((paymentAmount - remaining).toFixed(2)) : 0;

    const { data: payment, error } = await supabaseAdmin
      .from("payments")
      .insert({
        order_id,
        method,
        amount: Math.min(paymentAmount, remaining),
        tendered: paymentAmount,
        change_amount: change,
        reference_number: reference_number || null,
        status: "completed",
        processed_by: req.user.id,
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    // Check if order is now fully paid
    const newTotalPaid = totalPaid + Math.min(paymentAmount, remaining);
    if (newTotalPaid >= order.total) {
      await supabaseAdmin
        .from("orders")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .eq("id", order_id);
    }

    res.status(201).json({ success: true, ...payment, change });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
