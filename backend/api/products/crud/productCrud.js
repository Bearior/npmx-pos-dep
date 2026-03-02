const { supabaseAdmin } = require("../../../config/supabase");
const { AppError } = require("../../../middleware/errorHandler");

async function listProducts({ limit = 20, offset = 0, search, category_id, is_active }) {
  let query = supabaseAdmin
    .from("products")
    .select("*, categories(name), product_variants(*)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }
  if (category_id) {
    query = query.eq("category_id", category_id);
  }
  if (is_active !== undefined) {
    query = query.eq("is_active", is_active === "true");
  }

  const { data, error, count } = await query;
  if (error) throw new AppError(error.message, 500);

  return { data, total: count, limit, offset };
}

async function getProductById(id) {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("*, categories(name), product_variants(*)")
    .eq("id", id)
    .single();

  if (error) throw new AppError("Product not found", 404);
  return data;
}

async function createProduct(body) {
  const { data, error } = await supabaseAdmin
    .from("products")
    .insert({
      name: body.name,
      description: body.description || null,
      price: parseFloat(body.price),
      cost_price: body.cost_price ? parseFloat(body.cost_price) : null,
      category_id: body.category_id,
      sku: body.sku || null,
      image_url: body.image_url || null,
      is_active: body.is_active !== false,
      track_inventory: body.track_inventory || false,
      stock_quantity: body.stock_quantity || 0,
      low_stock_threshold: body.low_stock_threshold || 10,
    })
    .select()
    .single();

  if (error) throw new AppError(error.message, 500);
  return data;
}

async function updateProduct(id, body) {
  const { data, error } = await supabaseAdmin
    .from("products")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new AppError(error.message, 500);
  return data;
}

async function deleteProduct(id) {
  // Soft-delete by setting is_active = false
  const { error } = await supabaseAdmin
    .from("products")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new AppError(error.message, 500);
}

module.exports = {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
