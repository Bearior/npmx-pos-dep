const express = require("express");
const router = express.Router();
const handler = require("./categories.handler");
const { requireAuth, requireRole } = require("../../middleware/auth");
const { validateBody, validateUUID } = require("../../middleware/validate");

router.use(requireAuth);

router.get("/", handler.list);
router.get("/:id", validateUUID(), handler.getById);
router.post("/", requireRole("admin", "manager"), validateBody(["name"]), handler.create);
router.put("/:id", requireRole("admin", "manager"), validateUUID(), handler.update);
router.delete("/:id", requireRole("admin", "manager"), validateUUID(), handler.remove);

module.exports = router;
