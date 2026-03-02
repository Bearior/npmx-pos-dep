const { supabaseAdmin } = require("../../../config/supabase");
const { AppError } = require("../../../middleware/errorHandler");

async function listDiscounts() {
  const { data, error } = await supabaseAdmin
    .from("discounts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new AppError(error.message, 500);
  return data;
}

async function getDiscountById(id) {
  const { data, error } = await supabaseAdmin
    .from("discounts")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new AppError("Discount not found", 404);
  return data;
}

async function validateDiscountCode(code) {
  const { data, error } = await supabaseAdmin
    .from("discounts")
    .select("*")
    .eq("code", code.toUpperCase())
    .eq("is_active", true)
    .single();

  if (error || !data) {
    return { valid: false, message: "Invalid or expired promo code" };
  }

  // Check expiration
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { valid: false, message: "Promo code has expired" };
  }

  // Check usage limit
  if (data.max_uses && data.times_used >= data.max_uses) {
    return { valid: false, message: "Promo code usage limit reached" };
  }

  return {
    valid: true,
    discount: data,
  };
}

async function createDiscount(body) {
  const { data, error } = await supabaseAdmin
    .from("discounts")
    .insert({
      code: body.code.toUpperCase(),
      name: body.name || body.code,
      type: body.type, // "percentage" | "fixed"
      value: parseFloat(body.value),
      max_discount: body.max_discount ? parseFloat(body.max_discount) : null,
      min_order_amount: body.min_order_amount ? parseFloat(body.min_order_amount) : null,
      max_uses: body.max_uses || null,
      times_used: 0,
      starts_at: body.starts_at || new Date().toISOString(),
      expires_at: body.expires_at || null,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw new AppError(error.message, 500);
  return data;
}

async function updateDiscount(id, body) {
  const { data, error } = await supabaseAdmin
    .from("discounts")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new AppError(error.message, 500);
  return data;
}

async function deleteDiscount(id) {
  const { error } = await supabaseAdmin.from("discounts").delete().eq("id", id);
  if (error) throw new AppError(error.message, 500);
}

module.exports = {
  listDiscounts,
  getDiscountById,
  validateDiscountCode,
  createDiscount,
  updateDiscount,
  deleteDiscount,
};
