const { asyncHandler } = require("../../middleware/errorHandler");
const orderCrud = require("./crud/orderCrud");
const splitBill = require("./crud/splitBill");

exports.list = asyncHandler(async (req, res) => {
  const { status, date_from, date_to } = req.query;
  const data = await orderCrud.listOrders({
    ...req.pagination,
    status,
    date_from,
    date_to,
  });
  res.json(data);
});

exports.getById = asyncHandler(async (req, res) => {
  const data = await orderCrud.getOrderById(req.params.id);
  res.json(data);
});

exports.create = asyncHandler(async (req, res) => {
  const data = await orderCrud.createOrder(req.body, req.user.id);
  res.status(201).json(data);
});

exports.updateStatus = asyncHandler(async (req, res) => {
  const data = await orderCrud.updateOrderStatus(req.params.id, req.body.status);
  res.json(data);
});

exports.splitBill = asyncHandler(async (req, res) => {
  const { splits } = req.body;
  const data = await splitBill.splitOrder(req.params.id, splits);
  res.json(data);
});

exports.voidOrder = asyncHandler(async (req, res) => {
  await orderCrud.voidOrder(req.params.id, req.user.id);
  res.json({ message: "Order voided" });
});
