const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const handler = require("./public.handler");

// Stricter rate limits for public endpoints
const publicReadLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute for menu/table lookups
  message: { success: false, message: "Too many requests, please try again shortly." },
  standardHeaders: true,
  legacyHeaders: false,
});

const publicOrderLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // 5 orders per minute per IP
  message: { success: false, message: "Too many orders, please wait before placing another." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes — NO authentication required

// Get active menu (products with categories)
router.get("/menu", publicReadLimiter, handler.getMenu);

// Validate a table by table number
router.get("/table/:tableNumber", publicReadLimiter, handler.getTableByNumber);

// Get orders for a table (public view)
router.get("/table/:tableNumber/orders", publicReadLimiter, handler.getTableOrdersPublic);

// Place a public order (from QR ordering)
router.post("/order", publicOrderLimiter, handler.createPublicOrder);

module.exports = router;
