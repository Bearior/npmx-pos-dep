const express = require("express");
const router = express.Router();
const productsRoutes = require("./products.routes");

router.use("/", productsRoutes);

module.exports = router;
