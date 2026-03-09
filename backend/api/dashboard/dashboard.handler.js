const getDashboardSummaryV1 = require("./crud/getDashboardSummary.v1");
const getRecentOrdersV1 = require("./crud/getRecentOrders.v1");
const getAlertsV1 = require("./crud/getAlerts.v1");
const getSupabaseStatusV1 = require("./crud/getSupabaseStatus.v1");

exports.getDashboardSummary = getDashboardSummaryV1;
exports.getRecentOrders = getRecentOrdersV1;
exports.getAlerts = getAlertsV1;
exports.getSupabaseStatus = getSupabaseStatusV1;
