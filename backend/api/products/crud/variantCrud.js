const { supabaseAdmin } = require("../../../config/supabase");
const { AppError } = require("../../../middleware/errorHandler");

async function listVariants(productId) {
  const { data, error } = await supabaseAdmin
    .from("product_variants")
    .select("*")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true });

  if (error) throw new AppError(error.message, 500);
  return data;
}

async function createVariant(productId, body) {
  const { data, error } = await supabaseAdmin
    .from("product_variants")
    .insert({
      product_id: productId,
      name: body.name,
      type: body.type || "size", // size | add_on | color
      price_modifier: parseFloat(body.price_modifier),
      is_active: body.is_active !== false,
      sort_order: body.sort_order || 0,
    })
    .select()
    .single();

  if (error) throw new AppError(error.message, 500);
  return data;
}

async function updateVariant(variantId, body) {
  const { data, error } = await supabaseAdmin
    .from("product_variants")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", variantId)
    .select()
    .single();

  if (error) throw new AppError(error.message, 500);
  return data;
}

async function deleteVariant(variantId) {
  const { error } = await supabaseAdmin
    .from("product_variants")
    .delete()
    .eq("id", variantId);

  if (error) throw new AppError(error.message, 500);
}

module.exports = { listVariants, createVariant, updateVariant, deleteVariant };
