const { supabaseAdmin } = require("../config/supabase");

// Simple in-memory role cache — avoids a DB query on every authenticated request
// Entries expire after 5 minutes.
const ROLE_CACHE_TTL = 5 * 60 * 1000;
const roleCache = new Map();

/**
 * Middleware: Verify Supabase JWT and attach user to req.
 * Also eagerly fetches the user's role and caches it.
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

    // Check role cache
    const cached = roleCache.get(user.id);
    if (cached && Date.now() - cached.ts < ROLE_CACHE_TTL) {
      req.userRole = cached.role;
    } else {
      // Fetch role once and cache it
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (profile) {
        roleCache.set(user.id, { role: profile.role, ts: Date.now() });
        req.userRole = profile.role;
      }
    }

    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.status(500).json({ error: "Authentication failed" });
  }
}

/**
 * Middleware: Require specific role(s).
 * Uses the role already fetched and cached by requireAuth.
 */
function requireRole(...roles) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Role was already loaded by requireAuth — use it directly
    if (req.userRole) {
      if (!roles.includes(req.userRole)) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }
      return next();
    }

    // Fallback: fetch role if not cached (shouldn't normally happen)
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

    roleCache.set(req.user.id, { role: profile.role, ts: Date.now() });
    req.userRole = profile.role;
    next();
  };
}

module.exports = { requireAuth, requireRole };
