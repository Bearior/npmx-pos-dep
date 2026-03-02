const { supabaseAdmin } = require("../../../config/supabase");
const { AppError } = require("../../../middleware/errorHandler");

const VALID_METHODS = ["cash", "qr", "credit_card", "transfer"];

async function listPayments(query = {}) {
  let q = supabaseAdmin
    .from("payments")
    .select("*, orders(order_number)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (query.order_id) q = q.eq("order_id", query.order_id);
  if (query.method) q = q.eq("method", query.method);

  const { data, error } = await q;
  if (error) throw new AppError(error.message, 500);
  return data;
}

async function getPaymentById(id) {
  const { data, error } = await supabaseAdmin
    .from("payments")
    .select("*, orders(order_number, total)")
    .eq("id", id)
    .single();

  if (error) throw new AppError("Payment not found", 404);
  return data;
}

async function createPayment(body, userId) {
  const { order_id, method, amount, reference_number } = body;

  if (!VALID_METHODS.includes(method)) {
    throw new AppError(`Invalid payment method. Must be: ${VALID_METHODS.join(", ")}`, 400);
  }

  // Get order
  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("id, total, status")
    .eq("id", order_id)
    .single();

  if (!order) throw new AppError("Order not found", 404);
  if (order.status === "voided") throw new AppError("Cannot pay for a voided order", 400);

  // Check existing payments for this order
  const { data: existingPayments } = await supabaseAdmin
    .from("payments")
    .select("amount")
    .eq("order_id", order_id)
    .eq("status", "completed");

  const totalPaid = (existingPayments || []).reduce((s, p) => s + p.amount, 0);
  const remaining = order.total - totalPaid;

  if (remaining <= 0) {
    throw new AppError("Order is already fully paid", 400);
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
      processed_by: userId,
    })
    .select()
    .single();

  if (error) throw new AppError(error.message, 500);

  // Check if order is now fully paid
  const newTotalPaid = totalPaid + Math.min(paymentAmount, remaining);
  if (newTotalPaid >= order.total) {
    await supabaseAdmin
      .from("orders")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("id", order_id);
  }

  return { ...payment, change: change };
}

async function refundPayment(paymentId, body, userId) {
  const { data: payment } = await supabaseAdmin
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .single();

  if (!payment) throw new AppError("Payment not found", 404);
  if (payment.status === "refunded") throw new AppError("Payment already refunded", 400);

  const refundAmount = body.amount ? parseFloat(body.amount) : payment.amount;
  if (refundAmount > payment.amount) {
    throw new AppError("Refund amount cannot exceed original payment", 400);
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
      processed_by: userId,
    })
    .select()
    .single();

  if (error) throw new AppError(error.message, 500);

  // Update original payment status
  await supabaseAdmin
    .from("payments")
    .update({ status: refundAmount >= payment.amount ? "refunded" : "partially_refunded" })
    .eq("id", paymentId);

  return refund;
}

module.exports = { listPayments, getPaymentById, createPayment, refundPayment };
