const { supabaseAdmin } = require("../config/supabase");

/**
 * Middleware: Verify Supabase JWT and attach user to req.
 */
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid authorization header" });
    }

    const token = authHeader.split(" ")[1];
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    req.user = user;
    req.accessToken = token;
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.status(500).json({ error: "Authentication failed" });
  }
}

/**
 * Middleware: Require specific role(s).
 */
function requireRole(...roles) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Fetch profile to check role
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", req.user.id)
      .single();

    if (error || !profile) {
      return res.status(403).json({ error: "Profile not found" });
    }

    if (!roles.includes(profile.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    req.userRole = profile.role;
    next();
  };
}

module.exports = { requireAuth, requireRole };
