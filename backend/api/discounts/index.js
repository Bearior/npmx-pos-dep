const express = require("express");
const router = express.Router();
const discountsRoutes = require("./discounts.routes");

router.use("/", discountsRoutes);

module.exports = router;
