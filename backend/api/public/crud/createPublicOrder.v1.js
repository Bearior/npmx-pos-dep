const { supabaseAdmin } = require("../../../config/supabase");

const TAX_RATE = parseFloat(process.env.DEFAULT_TAX_RATE || "7") / 100;

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
 * @desc    Create a public order (from QR code ordering)
 * @route   POST /api/public/order
 * @access  Public
 */
module.exports = async (req, res) => {
  try {
    const { items, table_number, customer_name, notes, session_token } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: "Order must have at least one item" });
    }

    if (!table_number) {
      return res.status(400).json({ success: false, message: "Table number is required" });
    }

    // Validate table exists, is active, and session_token matches
    const { data: table, error: tableErr } = await supabaseAdmin
      .from("restaurant_tables")
      .select("id, table_number, session_token")
      .eq("table_number", table_number)
      .eq("is_active", true)
      .single();

    if (tableErr || !table) {
      return res.status(404).json({ success: false, message: "Table not found or inactive" });
    }

    // Validate session token — prevents ordering after bill is paid
    if (!session_token || session_token !== table.session_token) {
      return res.status(403).json({
        success: false,
        message: "Session expired. Please scan the QR code again.",
        code: "SESSION_EXPIRED",
      });
    }

    // Batch-fetch products and variants
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

    for (const item of items) {
      if (!productMap[item.product_id]) {
        return res.status(404).json({ success: false, message: `Product ${item.product_id} not found` });
      }
    }

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

    const subtotal = lineItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
    const taxAmount = parseFloat((subtotal * TAX_RATE).toFixed(2));
    const total = parseFloat((subtotal + taxAmount).toFixed(2));

    // Insert order with status "pending" and no cashier
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .insert({
        order_number: orderNumber,
        status: "pending",
        cashier_id: null,
        customer_name: customer_name || null,
        table_number,
        notes: notes || null,
        discount_id: null,
        subtotal: parseFloat(subtotal.toFixed(2)),
        discount_amount: 0,
        tax_rate: TAX_RATE,
        tax_amount: taxAmount,
        total,
      })
      .select()
      .single();

    if (orderErr) {
      return res.status(500).json({ success: false, message: orderErr.message });
    }

    const itemRows = lineItems.map((li) => ({ ...li, order_id: order.id }));
    const { error: itemsErr } = await supabaseAdmin.from("order_items").insert(itemRows);

    if (itemsErr) {
      return res.status(500).json({ success: false, message: itemsErr.message });
    }

    // Deduct inventory
    await Promise.all(
      items.map((item) =>
        supabaseAdmin.rpc("decrement_stock", {
          p_product_id: item.product_id,
          p_quantity: item.quantity,
        })
      )
    );

    res.status(201).json({ success: true, order_number: order.order_number, total: order.total });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
