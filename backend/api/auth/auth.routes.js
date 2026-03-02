const express = require("express");
const router = express.Router();
const { login, register, logout, getProfile, updateProfile } = require("./auth.handler");
const { requireAuth } = require("../../middleware/auth");
const { validateBody } = require("../../middleware/validate");

// Public
router.post("/login", validateBody(["email", "password"]), login);
router.post("/register", validateBody(["email", "password", "full_name"]), register);

// Protected
router.post("/logout", requireAuth, logout);
router.get("/profile", requireAuth, getProfile);
router.put("/profile", requireAuth, updateProfile);

module.exports = router;
