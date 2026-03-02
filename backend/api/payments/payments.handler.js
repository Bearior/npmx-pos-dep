const { asyncHandler } = require("../../middleware/errorHandler");
const paymentCrud = require("./crud/paymentCrud");

exports.list = asyncHandler(async (req, res) => {
  const data = await paymentCrud.listPayments(req.query);
  res.json(data);
});

exports.getById = asyncHandler(async (req, res) => {
  const data = await paymentCrud.getPaymentById(req.params.id);
  res.json(data);
});

exports.create = asyncHandler(async (req, res) => {
  const data = await paymentCrud.createPayment(req.body, req.user.id);
  res.status(201).json(data);
});

exports.refund = asyncHandler(async (req, res) => {
  const data = await paymentCrud.refundPayment(req.params.id, req.body, req.user.id);
  res.json(data);
});
