const express = require("express");
const router = express.Router();
const {
  getOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  splitBill,
  voidOrder,
  getReceipt,
  getKitchenOrders,
} = require("./orders.handler");
const { requireAuth, requireRole } = require("../../middleware/auth");
const { validateBody, validateUUID, validatePagination } = require("../../middleware/validate");

router.use(requireAuth);

router.get("/", validatePagination, getOrders);
router.get("/kitchen", getKitchenOrders);
router.get("/:id", validateUUID(), getOrder);
router.get("/:id/receipt", validateUUID(), getReceipt);
router.post("/", validateBody(["items"]), createOrder);
router.put("/:id/status", validateUUID(), updateOrderStatus);
router.post("/:id/split", validateUUID(), splitBill);
router.delete("/:id", requireRole("admin", "manager"), validateUUID(), voidOrder);

module.exports = router;
