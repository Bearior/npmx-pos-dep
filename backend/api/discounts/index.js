const express = require("express");
const router = express.Router();
const handler = require("./discounts.handler");
const { requireAuth, requireRole } = require("../../middleware/auth");
const { validateBody, validateUUID } = require("../../middleware/validate");

router.use(requireAuth);

router.get("/", handler.list);
router.get("/:id", validateUUID(), handler.getById);
router.post("/validate", validateBody(["code"]), handler.validateCode);
router.post(
  "/",
  requireRole("admin", "manager"),
  validateBody(["code", "type", "value"]),
  handler.create
);
router.put("/:id", requireRole("admin", "manager"), validateUUID(), handler.update);
router.delete("/:id", requireRole("admin", "manager"), validateUUID(), handler.remove);

module.exports = router;
