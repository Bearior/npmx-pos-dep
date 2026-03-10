const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const { login, register, logout, getProfile, updateProfile } = require("./auth.handler");
const { requireAuth, requireRole } = require("../../middleware/auth");
const { validateBody } = require("../../middleware/validate");

// Stricter rate limit for auth endpoints to prevent brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: { error: "Too many authentication attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public
router.post("/login", authLimiter, validateBody(["email", "password"]), login);
router.post("/register", authLimiter, requireAuth, requireRole("admin", "manager"), validateBody(["email", "password", "full_name"]), register);

// Protected
router.post("/logout", requireAuth, logout);
router.get("/profile", requireAuth, getProfile);
router.put("/profile", requireAuth, updateProfile);

module.exports = router;
