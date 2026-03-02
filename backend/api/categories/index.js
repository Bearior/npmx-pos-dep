const express = require("express");
const router = express.Router();
const categoriesRoutes = require("./categories.routes");

router.use("/", categoriesRoutes);

module.exports = router;
