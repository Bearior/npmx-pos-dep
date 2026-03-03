const express = require("express");
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getVariants,
  createVariant,
  updateVariant,
  deleteVariant,
  uploadImage,
} = require("./products.handler");
const { requireAuth, requireRole } = require("../../middleware/auth");
const { validateBody, validateUUID, validatePagination } = require("../../middleware/validate");

router.use(requireAuth);

// Products
router.get("/", validatePagination, getProducts);
router.get("/:id", validateUUID(), getProduct);
router.post("/", requireRole("admin", "manager"), validateBody(["name", "price", "category_id"]), createProduct);
router.post("/upload-image", requireRole("admin", "manager"), uploadImage);
router.put("/:id", requireRole("admin", "manager"), validateUUID(), updateProduct);
router.delete("/:id", requireRole("admin", "manager"), validateUUID(), deleteProduct);

// Variants
router.get("/:id/variants", validateUUID(), getVariants);
router.post("/:id/variants", requireRole("admin", "manager"), validateUUID(), validateBody(["name", "price_modifier"]), createVariant);
router.put("/:id/variants/:variantId", requireRole("admin", "manager"), updateVariant);
router.delete("/:id/variants/:variantId", requireRole("admin", "manager"), deleteVariant);

module.exports = router;
