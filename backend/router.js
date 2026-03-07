const express = require("express");
const router = express.Router();

// Module routers
const authRoutes = require("./api/auth");
const categoriesRoutes = require("./api/categories");
const productsRoutes = require("./api/products");
const ordersRoutes = require("./api/orders");
const paymentsRoutes = require("./api/payments");
const inventoryRoutes = require("./api/inventory");
const discountsRoutes = require("./api/discounts");
const reportsRoutes = require("./api/reports");
const dashboardRoutes = require("./api/dashboard");
const tablesRoutes = require("./api/tables");
const publicRoutes = require("./api/public");

// Mount routes
router.use("/auth", authRoutes);
router.use("/categories", categoriesRoutes);
router.use("/products", productsRoutes);
router.use("/orders", ordersRoutes);
router.use("/payments", paymentsRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/discounts", discountsRoutes);
router.use("/reports", reportsRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/tables", tablesRoutes);
router.use("/public", publicRoutes);

module.exports = router;
