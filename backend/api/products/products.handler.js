const { asyncHandler } = require("../../middleware/errorHandler");
const productCrud = require("./crud/productCrud");
const variantCrud = require("./crud/variantCrud");

exports.list = asyncHandler(async (req, res) => {
  const { search, category_id, is_active } = req.query;
  const data = await productCrud.listProducts({
    ...req.pagination,
    search,
    category_id,
    is_active,
  });
  res.json(data);
});

exports.getById = asyncHandler(async (req, res) => {
  const data = await productCrud.getProductById(req.params.id);
  res.json(data);
});

exports.create = asyncHandler(async (req, res) => {
  const data = await productCrud.createProduct(req.body);
  res.status(201).json(data);
});

exports.update = asyncHandler(async (req, res) => {
  const data = await productCrud.updateProduct(req.params.id, req.body);
  res.json(data);
});

exports.remove = asyncHandler(async (req, res) => {
  await productCrud.deleteProduct(req.params.id);
  res.json({ message: "Product deleted" });
});

// --- Variants ---

exports.listVariants = asyncHandler(async (req, res) => {
  const data = await variantCrud.listVariants(req.params.id);
  res.json(data);
});

exports.createVariant = asyncHandler(async (req, res) => {
  const data = await variantCrud.createVariant(req.params.id, req.body);
  res.status(201).json(data);
});

exports.updateVariant = asyncHandler(async (req, res) => {
  const data = await variantCrud.updateVariant(req.params.variantId, req.body);
  res.json(data);
});

exports.removeVariant = asyncHandler(async (req, res) => {
  await variantCrud.deleteVariant(req.params.variantId);
  res.json({ message: "Variant deleted" });
});
