const express = require("express");
const router = express.Router();
const handler = require("./inventory.handler");
const { requireAuth, requireRole } = require("../../middleware/auth");
const { validateBody, validateUUID, validatePagination } = require("../../middleware/validate");

router.use(requireAuth);

router.get("/", validatePagination, handler.list);
router.get("/low-stock", handler.lowStock);
router.get("/:id/history", validateUUID(), handler.history);
router.post(
  "/adjust",
  requireRole("admin", "manager"),
  validateBody(["product_id", "quantity", "type"]),
  handler.adjust
);

module.exports = router;
