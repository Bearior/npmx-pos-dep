const express = require("express");
const router = express.Router();
const handler = require("./auth.handler");
const { requireAuth } = require("../../middleware/auth");
const { validateBody } = require("../../middleware/validate");

// Public
router.post("/login", validateBody(["email", "password"]), handler.login);
router.post("/register", validateBody(["email", "password", "full_name"]), handler.register);
router.post("/logout", requireAuth, handler.logout);

// Protected
router.get("/profile", requireAuth, handler.getProfile);
router.put("/profile", requireAuth, handler.updateProfile);

module.exports = router;
