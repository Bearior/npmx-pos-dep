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

    // Batch-fetch all products and variants in 2 queries instead of N+N
    const productIds = [...new Set(items.map((i) => i.product_id))];
    const variantIds = items.map((i) => i.variant_id).filter(Boolean);

    const [productsResult, variantsResult, orderNumber] = await Promise.all([
      supabaseAdmin.from("products").select("id, name, price").in("id", productIds),
      variantIds.length > 0
        ? supabaseAdmin.from("product_variants").select("id, price_modifier").in("id", variantIds)
        : Promise.resolve({ data: [] }),
      generateOrderNumber(),
    ]);

    const productMap = {};
    (productsResult.data || []).forEach((p) => { productMap[p.id] = p; });
    const variantMap = {};
    (variantsResult.data || []).forEach((v) => { variantMap[v.id] = v; });

    // Validate all products exist
    for (const item of items) {
      if (!productMap[item.product_id]) {
        return res.status(404).json({ success: false, message: `Product ${item.product_id} not found` });
      }
    }

    // Build line items from maps
    const lineItems = items.map((item) => {
      const product = productMap[item.product_id];
      const variantModifier = item.variant_id && variantMap[item.variant_id]
        ? variantMap[item.variant_id].price_modifier
        : 0;
      return {
        product_id: product.id,
        product_name: product.name,
        variant_id: item.variant_id || null,
        variant_info: item.variant_info || null,
        quantity: item.quantity,
        unit_price: product.price + variantModifier,
        notes: item.notes || null,
      };
    });

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

    // Deduct inventory — batch all stock decrements in parallel
    await Promise.all(
      items.map((item) =>
        supabaseAdmin.rpc("decrement_stock", {
          p_product_id: item.product_id,
          p_quantity: item.quantity,
        })
      )
    );

    res.status(201).json({ success: true, ...order, items: itemRows });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
