const express = require("express");
const router = express.Router();
const handler = require("./payments.handler");
const { requireAuth } = require("../../middleware/auth");
const { validateBody, validateUUID } = require("../../middleware/validate");

router.use(requireAuth);

router.get("/", handler.list);
router.get("/:id", validateUUID(), handler.getById);
router.post(
  "/",
  validateBody(["order_id", "method", "amount"]),
  handler.create
);
router.post("/:id/refund", validateUUID(), handler.refund);

module.exports = router;
