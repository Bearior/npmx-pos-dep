const express = require("express");
const router = express.Router();
const inventoryRoutes = require("./inventory.routes");

router.use("/", inventoryRoutes);

module.exports = router;
