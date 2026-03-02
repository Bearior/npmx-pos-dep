const express = require("express");
const router = express.Router();
const {
  getOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  splitBill,
  voidOrder,
} = require("./orders.handler");
const { requireAuth, requireRole } = require("../../middleware/auth");
const { validateBody, validateUUID, validatePagination } = require("../../middleware/validate");

router.use(requireAuth);

router.get("/", validatePagination, getOrders);
router.get("/:id", validateUUID(), getOrder);
router.post("/", validateBody(["items"]), createOrder);
router.put("/:id/status", validateUUID(), updateOrderStatus);
router.post("/:id/split", validateUUID(), splitBill);
router.delete("/:id", requireRole("admin", "manager"), validateUUID(), voidOrder);

module.exports = router;
