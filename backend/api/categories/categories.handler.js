const { asyncHandler } = require("../../middleware/errorHandler");
const crud = require("./crud/categoryCrud");

exports.list = asyncHandler(async (req, res) => {
  const data = await crud.listCategories();
  res.json(data);
});

exports.getById = asyncHandler(async (req, res) => {
  const data = await crud.getCategoryById(req.params.id);
  res.json(data);
});

exports.create = asyncHandler(async (req, res) => {
  const data = await crud.createCategory(req.body);
  res.status(201).json(data);
});

exports.update = asyncHandler(async (req, res) => {
  const data = await crud.updateCategory(req.params.id, req.body);
  res.json(data);
});

exports.remove = asyncHandler(async (req, res) => {
  await crud.deleteCategory(req.params.id);
  res.json({ message: "Category deleted" });
});
