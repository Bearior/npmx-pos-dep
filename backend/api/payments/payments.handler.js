const getPaymentsV1 = require("./crud/getPayments.v1");
const getPaymentV1 = require("./crud/getPayment.v1");
const createPaymentV1 = require("./crud/createPayment.v1");
const refundPaymentV1 = require("./crud/refundPayment.v1");

exports.getPayments = getPaymentsV1;
exports.getPayment = getPaymentV1;
exports.createPayment = createPaymentV1;
exports.refundPayment = refundPaymentV1;
