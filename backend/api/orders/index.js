const express = require("express");
const router = express.Router();
const handler = require("./orders.handler");
const { requireAuth, requireRole } = require("../../middleware/auth");
const { validateBody, validateUUID, validatePagination } = require("../../middleware/validate");

router.use(requireAuth);

router.get("/", validatePagination, handler.list);
router.get("/:id", validateUUID(), handler.getById);
router.post("/", validateBody(["items"]), handler.create);
router.put("/:id/status", validateUUID(), handler.updateStatus);
router.post("/:id/split", validateUUID(), handler.splitBill);
router.delete("/:id", requireRole("admin", "manager"), validateUUID(), handler.voidOrder);

module.exports = router;
