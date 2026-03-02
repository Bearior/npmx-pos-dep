const express = require("express");
const router = express.Router();
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("./categories.handler");
const { requireAuth, requireRole } = require("../../middleware/auth");
const { validateBody, validateUUID } = require("../../middleware/validate");

router.use(requireAuth);

router.get("/", getCategories);
router.get("/:id", validateUUID(), getCategory);
router.post("/", requireRole("admin", "manager"), validateBody(["name"]), createCategory);
router.put("/:id", requireRole("admin", "manager"), validateUUID(), updateCategory);
router.delete("/:id", requireRole("admin", "manager"), validateUUID(), deleteCategory);

module.exports = router;
