const { supabaseAdmin } = require("../../../config/supabase");

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
 * @desc    Create a new order
 * @route   POST /api/orders
 * @access  Private
 */
module.exports = async (req, res) => {
  try {
    const { items, discount_code, discount_amount, customer_name, table_number, notes } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: "Order must have at least one item" });
    }

    // Resolve product prices and build line items
    const lineItems = [];
    for (const item of items) {
      const { data: product } = await supabaseAdmin
        .from("products")
        .select("id, name, price")
        .eq("id", item.product_id)
        .single();

      if (!product) {
        return res.status(404).json({ success: false, message: `Product ${item.product_id} not found` });
      }

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

    // Calculate totals
    const subtotal = lineItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
    const afterDiscount = Math.max(0, subtotal - finalDiscount);
    const taxAmount = parseFloat((afterDiscount * TAX_RATE).toFixed(2));
    const total = parseFloat((afterDiscount + taxAmount).toFixed(2));

    const orderNumber = await generateOrderNumber();

    // Insert order
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .insert({
        order_number: orderNumber,
        status: "pending",
        cashier_id: req.user.id,
        customer_name: customer_name || null,
        table_number: table_number || null,
        notes: notes || null,
        discount_id: appliedDiscountId,
        subtotal: parseFloat(subtotal.toFixed(2)),
        discount_amount: parseFloat(finalDiscount.toFixed(2)),
        tax_rate: TAX_RATE,
        tax_amount: taxAmount,
        total,
      })
      .select()
      .single();

    if (orderErr) {
      return res.status(500).json({ success: false, message: orderErr.message });
    }

    // Insert order items
    const itemRows = lineItems.map((li) => ({ ...li, order_id: order.id }));
    const { error: itemsErr } = await supabaseAdmin.from("order_items").insert(itemRows);

    if (itemsErr) {
      return res.status(500).json({ success: false, message: itemsErr.message });
    }

    // Deduct inventory for tracked products
    for (const item of items) {
      await supabaseAdmin.rpc("decrement_stock", {
        p_product_id: item.product_id,
        p_quantity: item.quantity,
      });
    }

    res.status(201).json({ success: true, ...order, items: itemRows });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
