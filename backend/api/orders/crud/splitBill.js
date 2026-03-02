const { supabaseAdmin } = require("../../../config/supabase");
const { AppError } = require("../../../middleware/errorHandler");

/**
 * Split an existing order into multiple sub-orders (split bill).
 *
 * @param {string} orderId - Original order ID.
 * @param {Array} splits - Array of { items: [{ order_item_id, quantity }], payer_name? }
 *
 * Each split becomes a new child order linked to the parent.
 */
async function splitOrder(orderId, splits) {
  if (!splits || splits.length < 2) {
    throw new AppError("Must provide at least 2 splits", 400);
  }

  // Fetch original order
  const { data: original, error: fetchErr } = await supabaseAdmin
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", orderId)
    .single();

  if (fetchErr || !original) throw new AppError("Order not found", 404);
  if (original.status === "voided") throw new AppError("Cannot split a voided order", 400);

  const TAX_RATE = original.tax_rate || 0.07;
  const childOrders = [];

  for (let i = 0; i < splits.length; i++) {
    const split = splits[i];

    // Build line items for this split
    const lineItems = [];
    for (const si of split.items) {
      const origItem = original.order_items.find((oi) => oi.id === si.order_item_id);
      if (!origItem) throw new AppError(`Order item ${si.order_item_id} not found`, 404);

      lineItems.push({
        product_id: origItem.product_id,
        product_name: origItem.product_name,
        variant_id: origItem.variant_id,
        variant_info: origItem.variant_info,
        quantity: si.quantity || origItem.quantity,
        unit_price: origItem.unit_price,
        notes: origItem.notes,
      });
    }

    const subtotal = lineItems.reduce((s, li) => s + li.unit_price * li.quantity, 0);
    const taxAmount = parseFloat((subtotal * TAX_RATE).toFixed(2));
    const total = parseFloat((subtotal + taxAmount).toFixed(2));

    const splitNumber = `${original.order_number}-S${i + 1}`;

    const { data: childOrder, error: childErr } = await supabaseAdmin
      .from("orders")
      .insert({
        order_number: splitNumber,
        parent_order_id: orderId,
        status: "pending",
        cashier_id: original.cashier_id,
        customer_name: split.payer_name || null,
        table_number: original.table_number,
        subtotal: parseFloat(subtotal.toFixed(2)),
        discount_amount: 0,
        tax_rate: TAX_RATE,
        tax_amount: taxAmount,
        total,
      })
      .select()
      .single();

    if (childErr) throw new AppError(childErr.message, 500);

    // Insert child order items
    const itemRows = lineItems.map((li) => ({ ...li, order_id: childOrder.id }));
    await supabaseAdmin.from("order_items").insert(itemRows);

    childOrders.push({ ...childOrder, items: itemRows });
  }

  // Mark original order as split
  await supabaseAdmin
    .from("orders")
    .update({ status: "split", updated_at: new Date().toISOString() })
    .eq("id", orderId);

  return { original_order_id: orderId, splits: childOrders };
}

module.exports = { splitOrder };
