const getSalesReportV1 = require("./crud/getSalesReport.v1");
const getProductReportV1 = require("./crud/getProductReport.v1");
const getPaymentMethodReportV1 = require("./crud/getPaymentMethodReport.v1");
const getHourlySalesReportV1 = require("./crud/getHourlySalesReport.v1");

exports.getSalesReport = getSalesReportV1;
exports.getProductReport = getProductReportV1;
exports.getPaymentMethodReport = getPaymentMethodReportV1;
exports.getHourlySalesReport = getHourlySalesReportV1;
