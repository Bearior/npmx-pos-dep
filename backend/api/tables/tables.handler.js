const getTablesV1 = require("./crud/getTables.v1");
const getTableV1 = require("./crud/getTable.v1");
const createTableV1 = require("./crud/createTable.v1");
const updateTableV1 = require("./crud/updateTable.v1");
const deleteTableV1 = require("./crud/deleteTable.v1");
const getTableOrdersV1 = require("./crud/getTableOrders.v1");
const clearTableV1 = require("./crud/clearTable.v1");

exports.getTables = getTablesV1;
exports.getTable = getTableV1;
exports.createTable = createTableV1;
exports.updateTable = updateTableV1;
exports.deleteTable = deleteTableV1;
exports.getTableOrders = getTableOrdersV1;
exports.clearTable = clearTableV1;
