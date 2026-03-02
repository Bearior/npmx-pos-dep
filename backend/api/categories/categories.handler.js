const getCategoriesV1 = require("./crud/getCategories.v1");
const getCategoryV1 = require("./crud/getCategory.v1");
const createCategoryV1 = require("./crud/createCategory.v1");
const updateCategoryV1 = require("./crud/updateCategory.v1");
const deleteCategoryV1 = require("./crud/deleteCategory.v1");

exports.getCategories = getCategoriesV1;
exports.getCategory = getCategoryV1;
exports.createCategory = createCategoryV1;
exports.updateCategory = updateCategoryV1;
exports.deleteCategory = deleteCategoryV1;
