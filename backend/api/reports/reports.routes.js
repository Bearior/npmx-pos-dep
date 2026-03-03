const express = require("express");
const router = express.Router();
const {
  getSalesReport,
  getProductReport,
  getPaymentMethodReport,
  getHourlySalesReport,
  getCustomerBehavior,
} = require("./reports.handler");
const { requireAuth, requireRole } = require("../../middleware/auth");

router.use(requireAuth);
router.use(requireRole("admin", "manager"));

router.get("/sales", getSalesReport);
router.get("/products", getProductReport);
router.get("/payment-methods", getPaymentMethodReport);
router.get("/hourly", getHourlySalesReport);
router.get("/customer-behavior", getCustomerBehavior);

module.exports = router;
