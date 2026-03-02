const { asyncHandler } = require("../../middleware/errorHandler");
const reportCrud = require("./crud/reportCrud");

exports.salesReport = asyncHandler(async (req, res) => {
  const { date_from, date_to, group_by } = req.query;
  const data = await reportCrud.getSalesReport(date_from, date_to, group_by);
  res.json(data);
});

exports.productReport = asyncHandler(async (req, res) => {
  const { date_from, date_to, limit } = req.query;
  const data = await reportCrud.getProductReport(date_from, date_to, parseInt(limit) || 20);
  res.json(data);
});

exports.paymentReport = asyncHandler(async (req, res) => {
  const { date_from, date_to } = req.query;
  const data = await reportCrud.getPaymentMethodReport(date_from, date_to);
  res.json(data);
});

exports.hourlyReport = asyncHandler(async (req, res) => {
  const { date } = req.query;
  const data = await reportCrud.getHourlySalesReport(date);
  res.json(data);
});
