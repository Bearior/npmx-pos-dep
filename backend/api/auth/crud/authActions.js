const { supabaseAdmin } = require("../../../config/supabase");
const { AppError } = require("../../../middleware/errorHandler");

/**
 * Login with email + password.
 */
async function login(email, password) {
  const { data, error } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw new AppError(error.message, 401);

  // Fetch profile
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .single();

  return {
    user: data.user,
    session: data.session,
    profile,
  };
}

/**
 * Register a new user.
 */
async function register(email, password, fullName, role = "cashier") {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (error) throw new AppError(error.message, 400);

  // Create profile row
  const { data: profile, error: profileErr } = await supabaseAdmin
    .from("profiles")
    .insert({
      id: data.user.id,
      email,
      full_name: fullName,
      role,
    })
    .select()
    .single();

  if (profileErr) throw new AppError(profileErr.message, 500);

  return { user: data.user, profile };
}

/**
 * Logout (invalidate token server-side).
 */
async function logout(accessToken) {
  // Supabase does not have admin sign-out; client-side clears the session.
  return { success: true };
}

module.exports = { login, register, logout };
