const express = require("express");
const router = express.Router();
const reportsRoutes = require("./reports.routes");

router.use("/", reportsRoutes);

module.exports = router;
