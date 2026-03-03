const express = require("express");
const router = express.Router();
const {
  getInventory,
  getLowStock,
  getStockHistory,
  adjustStock,
  updateProduct,
} = require("./inventory.handler");
const { requireAuth, requireRole } = require("../../middleware/auth");
const { validateBody, validateUUID } = require("../../middleware/validate");

router.use(requireAuth);

router.get("/", getInventory);
router.get("/low-stock", getLowStock);
router.get("/history", getStockHistory);
router.get("/:id/history", getStockHistory);
router.put("/:id", requireRole("admin", "manager"), validateUUID(), updateProduct);
router.post(
  "/adjust",
  requireRole("admin", "manager"),
  validateBody(["product_id", "quantity", "type"]),
  adjustStock
);

module.exports = router;
