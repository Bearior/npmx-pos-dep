const express = require("express");
const router = express.Router();
const handler = require("./public.handler");

// Public routes — NO authentication required

// Get active menu (products with categories)
router.get("/menu", handler.getMenu);

// Validate a table by table number
router.get("/table/:tableNumber", handler.getTableByNumber);

// Place a public order (from QR ordering)
router.post("/order", handler.createPublicOrder);

module.exports = router;
