const { supabaseAdmin } = require("../../../config/supabase");

/**
 * @desc    Get receipt data for a completed order
 * @route   GET /api/orders/:id/receipt
 * @access  Private
 */
module.exports = async (req, res) => {
  try {
    // Fetch order with items, payments, and cashier profile
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select(
        "*, order_items(*, products(name, image_url)), payments(*)"
      )
      .eq("id", req.params.id)
      .single();

    if (error || !order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Fetch cashier name
    const { data: cashierProfile } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", order.cashier_id)
      .single();

    const receipt = {
      order_number: order.order_number,
      date: order.created_at,
      cashier: cashierProfile?.full_name || "—",
      customer_name: order.customer_name || null,
      table_number: order.table_number || null,
      items: (order.order_items || []).map((item) => ({
        name: item.product_name || item.products?.name || "Unknown",
        variant: item.variant_info || null,
        quantity: item.quantity,
        unit_price: Number(item.unit_price),
        total: Number(item.unit_price) * item.quantity,
        notes: item.notes || null,
      })),
      subtotal: Number(order.subtotal),
      discount_amount: Number(order.discount_amount),
      tax_rate: Number(order.tax_rate),
      tax_amount: Number(order.tax_amount),
      total: Number(order.total),
      payments: (order.payments || []).map((p) => ({
        method: p.method,
        amount: Number(p.amount),
        tendered: p.tendered ? Number(p.tendered) : null,
        change: Number(p.change_amount),
        reference: p.reference_number || null,
        date: p.created_at,
      })),
      status: order.status,
    };

    res.status(200).json({ success: true, data: receipt });
  } catch (err) {
    console.error("Receipt error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
