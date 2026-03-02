const express = require("express");
const router = express.Router();
const {
  getDiscounts,
  getDiscount,
  validateDiscount,
  createDiscount,
  updateDiscount,
  deleteDiscount,
} = require("./discounts.handler");
const { requireAuth, requireRole } = require("../../middleware/auth");
const { validateBody, validateUUID } = require("../../middleware/validate");

router.use(requireAuth);

router.get("/", getDiscounts);
router.get("/:id", validateUUID(), getDiscount);
router.post("/validate", validateBody(["code"]), validateDiscount);
router.post(
  "/",
  requireRole("admin", "manager"),
  validateBody(["name", "type", "value"]),
  createDiscount
);
router.put(
  "/:id",
  requireRole("admin", "manager"),
  validateUUID(),
  updateDiscount
);
router.delete(
  "/:id",
  requireRole("admin", "manager"),
  validateUUID(),
  deleteDiscount
);

module.exports = router;
