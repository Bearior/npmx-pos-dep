const { asyncHandler } = require("../../middleware/errorHandler");
const discountCrud = require("./crud/discountCrud");

exports.list = asyncHandler(async (_req, res) => {
  const data = await discountCrud.listDiscounts();
  res.json(data);
});

exports.getById = asyncHandler(async (req, res) => {
  const data = await discountCrud.getDiscountById(req.params.id);
  res.json(data);
});

exports.validateCode = asyncHandler(async (req, res) => {
  const data = await discountCrud.validateDiscountCode(req.body.code);
  res.json(data);
});

exports.create = asyncHandler(async (req, res) => {
  const data = await discountCrud.createDiscount(req.body);
  res.status(201).json(data);
});

exports.update = asyncHandler(async (req, res) => {
  const data = await discountCrud.updateDiscount(req.params.id, req.body);
  res.json(data);
});

exports.remove = asyncHandler(async (req, res) => {
  await discountCrud.deleteDiscount(req.params.id);
  res.json({ message: "Discount deleted" });
});
