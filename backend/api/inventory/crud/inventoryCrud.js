const { supabaseAdmin } = require("../../../config/supabase");
const { AppError } = require("../../../middleware/errorHandler");

async function listInventory({ limit = 20, offset = 0 } = {}) {
  const { data, error, count } = await supabaseAdmin
    .from("products")
    .select("id, name, sku, stock_quantity, low_stock_threshold, track_inventory, category_id, categories(name)", {
      count: "exact",
    })
    .eq("track_inventory", true)
    .eq("is_active", true)
    .order("name")
    .range(offset, offset + limit - 1);

  if (error) throw new AppError(error.message, 500);
  return { data, total: count, limit, offset };
}

async function getLowStockProducts() {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("id, name, sku, stock_quantity, low_stock_threshold, categories(name)")
    .eq("track_inventory", true)
    .eq("is_active", true)
    .filter("stock_quantity", "lte", "low_stock_threshold");

  if (error) throw new AppError(error.message, 500);
  return data;
}

async function getStockHistory(productId) {
  const { data, error } = await supabaseAdmin
    .from("inventory_transactions")
    .select("*, profiles(full_name)")
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw new AppError(error.message, 500);
  return data;
}

async function adjustStock(body, userId) {
  const { product_id, quantity, type, reason } = body;
  const validTypes = ["restock", "adjustment", "waste", "return"];

  if (!validTypes.includes(type)) {
    throw new AppError(`Invalid type. Must be: ${validTypes.join(", ")}`, 400);
  }

  const qty = parseInt(quantity);

  // Get current stock
  const { data: product } = await supabaseAdmin
    .from("products")
    .select("id, stock_quantity, name")
    .eq("id", product_id)
    .single();

  if (!product) throw new AppError("Product not found", 404);

  const previousQty = product.stock_quantity || 0;
  let newQty;

  if (type === "restock" || type === "return") {
    newQty = previousQty + Math.abs(qty);
  } else {
    newQty = previousQty - Math.abs(qty);
  }

  if (newQty < 0) throw new AppError("Insufficient stock", 400);

  // Update product stock
  const { error: updateErr } = await supabaseAdmin
    .from("products")
    .update({ stock_quantity: newQty, updated_at: new Date().toISOString() })
    .eq("id", product_id);

  if (updateErr) throw new AppError(updateErr.message, 500);

  // Record transaction
  const { data: txn, error: txnErr } = await supabaseAdmin
    .from("inventory_transactions")
    .insert({
      product_id,
      type,
      quantity: qty,
      previous_quantity: previousQty,
      new_quantity: newQty,
      reason: reason || null,
      performed_by: userId,
    })
    .select()
    .single();

  if (txnErr) throw new AppError(txnErr.message, 500);
  return txn;
}

module.exports = { listInventory, getLowStockProducts, getStockHistory, adjustStock };
