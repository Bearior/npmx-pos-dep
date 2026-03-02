const express = require("express");
const router = express.Router();
const {
  getDashboardSummary,
  getRecentOrders,
  getAlerts,
} = require("./dashboard.handler");
const { requireAuth } = require("../../middleware/auth");

router.use(requireAuth);

router.get("/summary", getDashboardSummary);
router.get("/recent-orders", getRecentOrders);
router.get("/alerts", getAlerts);

module.exports = router;
