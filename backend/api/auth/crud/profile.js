const { supabaseAdmin } = require("../../../config/supabase");
const { AppError } = require("../../../middleware/errorHandler");

/**
 * Get user profile by ID.
 */
async function getProfile(userId) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) throw new AppError("Profile not found", 404);
  return data;
}

/**
 * Update user profile.
 */
async function updateProfile(userId, updates) {
  const allowedFields = ["full_name", "phone", "avatar_url"];
  const filtered = {};
  for (const key of allowedFields) {
    if (updates[key] !== undefined) filtered[key] = updates[key];
  }

  if (Object.keys(filtered).length === 0) {
    throw new AppError("No valid fields to update", 400);
  }

  filtered.updated_at = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .update(filtered)
    .eq("id", userId)
    .select()
    .single();

  if (error) throw new AppError(error.message, 500);
  return data;
}

module.exports = { getProfile, updateProfile };
