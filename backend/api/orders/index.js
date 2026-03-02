const express = require("express");
const router = express.Router();
const ordersRoutes = require("./orders.routes");

router.use("/", ordersRoutes);

module.exports = router;
