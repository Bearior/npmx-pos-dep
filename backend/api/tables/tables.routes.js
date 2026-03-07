const express = require("express");
const router = express.Router();
const {
  getTables,
  getTable,
  createTable,
  updateTable,
  deleteTable,
  getTableOrders,
  clearTable,
} = require("./tables.handler");
const { requireAuth, requireRole } = require("../../middleware/auth");
const { validateBody, validateUUID } = require("../../middleware/validate");

router.use(requireAuth);

router.get("/", getTables);
router.get("/:id", validateUUID(), getTable);
router.get("/:id/orders", validateUUID(), getTableOrders);
router.post("/", requireRole("admin", "manager"), validateBody(["table_number"]), createTable);
router.post("/:id/clear", requireRole("admin", "manager"), validateUUID(), clearTable);
router.put("/:id", requireRole("admin", "manager"), validateUUID(), updateTable);
router.delete("/:id", requireRole("admin", "manager"), validateUUID(), deleteTable);

module.exports = router;
