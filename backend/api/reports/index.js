const express = require("express");
const router = express.Router();
const handler = require("./reports.handler");
const { requireAuth, requireRole } = require("../../middleware/auth");

router.use(requireAuth);
router.use(requireRole("admin", "manager"));

router.get("/sales", handler.salesReport);
router.get("/products", handler.productReport);
router.get("/payments", handler.paymentReport);
router.get("/hourly", handler.hourlyReport);

module.exports = router;
