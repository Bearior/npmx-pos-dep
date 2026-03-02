const express = require("express");
const router = express.Router();
const handler = require("./products.handler");
const { requireAuth, requireRole } = require("../../middleware/auth");
const { validateBody, validateUUID, validatePagination } = require("../../middleware/validate");

router.use(requireAuth);

router.get("/", validatePagination, handler.list);
router.get("/:id", validateUUID(), handler.getById);
router.post(
  "/",
  requireRole("admin", "manager"),
  validateBody(["name", "price", "category_id"]),
  handler.create
);
router.put("/:id", requireRole("admin", "manager"), validateUUID(), handler.update);
router.delete("/:id", requireRole("admin", "manager"), validateUUID(), handler.remove);

// Variants
router.get("/:id/variants", validateUUID(), handler.listVariants);
router.post(
  "/:id/variants",
  requireRole("admin", "manager"),
  validateUUID(),
  validateBody(["name", "price_modifier"]),
  handler.createVariant
);
router.put(
  "/:id/variants/:variantId",
  requireRole("admin", "manager"),
  handler.updateVariant
);
router.delete(
  "/:id/variants/:variantId",
  requireRole("admin", "manager"),
  handler.removeVariant
);

module.exports = router;
