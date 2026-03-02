const getInventoryV1 = require("./crud/getInventory.v1");
const getLowStockV1 = require("./crud/getLowStock.v1");
const getStockHistoryV1 = require("./crud/getStockHistory.v1");
const adjustStockV1 = require("./crud/adjustStock.v1");

exports.getInventory = getInventoryV1;
exports.getLowStock = getLowStockV1;
exports.getStockHistory = getStockHistoryV1;
exports.adjustStock = adjustStockV1;
