const express = require("express");
const router = express.Router();
const {
  getPayments,
  getPayment,
  createPayment,
  refundPayment,
} = require("./payments.handler");
const { requireAuth, requireRole } = require("../../middleware/auth");
const { validateBody, validateUUID } = require("../../middleware/validate");

router.use(requireAuth);

router.get("/", getPayments);
router.get("/:id", validateUUID(), getPayment);
router.post("/", validateBody(["order_id", "method", "amount"]), createPayment);
router.post("/:id/refund", requireRole("admin", "manager"), validateUUID(), refundPayment);

module.exports = router;
