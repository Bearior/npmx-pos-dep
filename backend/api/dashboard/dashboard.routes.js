const express = require("express");
const router = express.Router();
const {
  getDashboardSummary,
  getRecentOrders,
  getAlerts,
  getSupabaseStatus,
} = require("./dashboard.handler");
const { requireAuth } = require("../../middleware/auth");

router.use(requireAuth);

router.get("/summary", getDashboardSummary);
router.get("/recent-orders", getRecentOrders);
router.get("/alerts", getAlerts);
router.get("/supabase-status", getSupabaseStatus);

module.exports = router;
