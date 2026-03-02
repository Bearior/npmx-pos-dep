const express = require("express");
const router = express.Router();
const handler = require("./dashboard.handler");
const { requireAuth, requireRole } = require("../../middleware/auth");

router.use(requireAuth);
router.use(requireRole("admin", "manager"));

router.get("/summary", handler.summary);
router.get("/recent-orders", handler.recentOrders);
router.get("/alerts", handler.alerts);

module.exports = router;
