const { asyncHandler } = require("../../middleware/errorHandler");
const inventoryCrud = require("./crud/inventoryCrud");

exports.list = asyncHandler(async (req, res) => {
  const data = await inventoryCrud.listInventory(req.pagination);
  res.json(data);
});

exports.lowStock = asyncHandler(async (_req, res) => {
  const data = await inventoryCrud.getLowStockProducts();
  res.json(data);
});

exports.history = asyncHandler(async (req, res) => {
  const data = await inventoryCrud.getStockHistory(req.params.id);
  res.json(data);
});

exports.adjust = asyncHandler(async (req, res) => {
  const data = await inventoryCrud.adjustStock(req.body, req.user.id);
  res.json(data);
});
