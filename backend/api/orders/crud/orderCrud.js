const { supabaseAdmin } = require("../../../config/supabase");
const { AppError } = require("../../../middleware/errorHandler");

const TAX_RATE = parseFloat(process.env.DEFAULT_TAX_RATE || "7") / 100;

/**
 * Generate a human-readable order number: ORD-YYYYMMDD-XXXX
 */
async function generateOrderNumber() {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  const { count } = await supabaseAdmin
    .from("orders")
    .select("*", { count: "exact", head: true })
    .gte("created_at", new Date().toISOString().slice(0, 10));

  const seq = String((count || 0) + 1).padStart(4, "0");
  return `ORD-${today}-${seq}`;
}

/**
 * Calculate order totals from line items.
 */
function calculateTotals(items, discountAmount = 0) {
  const subtotal = items.reduce((sum, item) => {
    const itemTotal = item.unit_price * item.quantity;
    return sum + itemTotal;
  }, 0);

  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const taxAmount = parseFloat((afterDiscount * TAX_RATE).toFixed(2));
  const total = parseFloat((afterDiscount + taxAmount).toFixed(2));

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    discount_amount: parseFloat(discountAmount.toFixed(2)),
    tax_rate: TAX_RATE,
    tax_amount: taxAmount,
    total,
  };
}

async function listOrders({ limit = 20, offset = 0, status, date_from, date_to }) {
  let query = supabaseAdmin
    .from("orders")
    .select("*, order_items(*), payments(*)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("status", status);
  if (date_from) query = query.gte("created_at", date_from);
  if (date_to) query = query.lte("created_at", date_to);

  const { data, error, count } = await query;
  if (error) throw new AppError(error.message, 500);
  return { data, total: count, limit, offset };
}

async function getOrderById(id) {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*, order_items(*, products(name, image_url)), payments(*)")
    .eq("id", id)
    .single();

  if (error) throw new AppError("Order not found", 404);
  return data;
}

async function createOrder(body, userId) {
  const { items, discount_code, discount_amount, customer_name, table_number, notes } = body;

  if (!items || items.length === 0) {
    throw new AppError("Order must have at least one item", 400);
  }

  // Resolve product prices and build line items
  const lineItems = [];
  for (const item of items) {
    const { data: product } = await supabaseAdmin
      .from("products")
      .select("id, name, price")
      .eq("id", item.product_id)
      .single();

    if (!product) throw new AppError(`Product ${item.product_id} not found`, 404);

    let variantModifier = 0;
    if (item.variant_id) {
      const { data: variant } = await supabaseAdmin
        .from("product_variants")
        .select("price_modifier")
        .eq("id", item.variant_id)
        .single();

      if (variant) variantModifier = variant.price_modifier;
    }

    lineItems.push({
      product_id: product.id,
      product_name: product.name,
      variant_id: item.variant_id || null,
      variant_info: item.variant_info || null,
      quantity: item.quantity,
      unit_price: product.price + variantModifier,
      notes: item.notes || null,
    });
  }

  // Apply discount
  let finalDiscount = 0;
  let appliedDiscountId = null;

  if (discount_code) {
    const { data: disc } = await supabaseAdmin
      .from("discounts")
      .select("*")
      .eq("code", discount_code.toUpperCase())
      .eq("is_active", true)
      .single();

    if (disc) {
      if (disc.type === "percentage") {
        const subtotal = lineItems.reduce((s, i) => s + i.unit_price * i.quantity, 0);
        finalDiscount = (subtotal * disc.value) / 100;
        if (disc.max_discount) finalDiscount = Math.min(finalDiscount, disc.max_discount);
      } else {
        finalDiscount = disc.value;
      }
      appliedDiscountId = disc.id;

      // Increment usage
      await supabaseAdmin
        .from("discounts")
        .update({ times_used: (disc.times_used || 0) + 1 })
        .eq("id", disc.id);
    }
  } else if (discount_amount) {
    finalDiscount = parseFloat(discount_amount);
  }

  const totals = calculateTotals(lineItems, finalDiscount);
  const orderNumber = await generateOrderNumber();

  // Insert order
  const { data: order, error: orderErr } = await supabaseAdmin
    .from("orders")
    .insert({
      order_number: orderNumber,
      status: "pending",
      cashier_id: userId,
      customer_name: customer_name || null,
      table_number: table_number || null,
      notes: notes || null,
      discount_id: appliedDiscountId,
      ...totals,
    })
    .select()
    .single();

  if (orderErr) throw new AppError(orderErr.message, 500);

  // Insert order items
  const itemRows = lineItems.map((li) => ({ ...li, order_id: order.id }));
  const { error: itemsErr } = await supabaseAdmin.from("order_items").insert(itemRows);
  if (itemsErr) throw new AppError(itemsErr.message, 500);

  // Deduct inventory for tracked products
  for (const item of items) {
    await supabaseAdmin.rpc("decrement_stock", {
      p_product_id: item.product_id,
      p_quantity: item.quantity,
    });
  }

  return { ...order, items: itemRows };
}

async function updateOrderStatus(id, status) {
  const validStatuses = ["pending", "preparing", "ready", "completed", "cancelled"];
  if (!validStatuses.includes(status)) {
    throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(", ")}`, 400);
  }

  const { data, error } = await supabaseAdmin
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new AppError(error.message, 500);
  return data;
}

async function voidOrder(id, userId) {
  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .single();

  if (!order) throw new AppError("Order not found", 404);

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
      voided_by: userId,
      voided_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new AppError(error.message, 500);
}

module.exports = {
  listOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  voidOrder,
};
