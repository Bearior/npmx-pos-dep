const { asyncHandler } = require("../../middleware/errorHandler");
const dashboardCrud = require("./crud/dashboardCrud");

exports.summary = asyncHandler(async (_req, res) => {
  const data = await dashboardCrud.getDashboardSummary();
  res.json(data);
});

exports.recentOrders = asyncHandler(async (_req, res) => {
  const data = await dashboardCrud.getRecentOrders();
  res.json(data);
});

exports.alerts = asyncHandler(async (_req, res) => {
  const data = await dashboardCrud.getAlerts();
  res.json(data);
});
