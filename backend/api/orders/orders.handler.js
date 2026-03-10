const getOrdersV1 = require("./crud/getOrders.v1");
const getOrderV1 = require("./crud/getOrder.v1");
const createOrderV1 = require("./crud/createOrder.v1");
const updateOrderStatusV1 = require("./crud/updateOrderStatus.v1");
const splitBillV1 = require("./crud/splitBill.v1");
const voidOrderV1 = require("./crud/voidOrder.v1");
const getReceiptV1 = require("./crud/getReceipt.v1");

exports.getOrders = getOrdersV1;
exports.getOrder = getOrderV1;
exports.createOrder = createOrderV1;
exports.updateOrderStatus = updateOrderStatusV1;
exports.splitBill = splitBillV1;
exports.voidOrder = voidOrderV1;
exports.getReceipt = getReceiptV1;
