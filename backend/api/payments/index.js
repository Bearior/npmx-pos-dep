const express = require("express");
const router = express.Router();
const paymentsRoutes = require("./payments.routes");

router.use("/", paymentsRoutes);

module.exports = router;
