const express = require("express");
const router = express.Router();
const tablesRoutes = require("./tables.routes");

router.use("/", tablesRoutes);

module.exports = router;
