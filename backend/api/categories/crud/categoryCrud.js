const { supabaseAdmin } = require("../../../config/supabase");
const { AppError } = require("../../../middleware/errorHandler");

async function listCategories() {
  const { data, error } = await supabaseAdmin
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw new AppError(error.message, 500);
  return data;
}

async function getCategoryById(id) {
  const { data, error } = await supabaseAdmin
    .from("categories")
    .select("*, products(*)")
    .eq("id", id)
    .single();

  if (error) throw new AppError("Category not found", 404);
  return data;
}

async function createCategory(body) {
  const { data, error } = await supabaseAdmin
    .from("categories")
    .insert({
      name: body.name,
      description: body.description || null,
      icon: body.icon || null,
      sort_order: body.sort_order || 0,
      is_active: body.is_active !== false,
    })
    .select()
    .single();

  if (error) throw new AppError(error.message, 500);
  return data;
}

async function updateCategory(id, body) {
  const { data, error } = await supabaseAdmin
    .from("categories")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new AppError(error.message, 500);
  return data;
}

async function deleteCategory(id) {
  const { error } = await supabaseAdmin.from("categories").delete().eq("id", id);
  if (error) throw new AppError(error.message, 500);
}

module.exports = {
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
