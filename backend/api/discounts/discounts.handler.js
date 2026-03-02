const getDiscountsV1 = require("./crud/getDiscounts.v1");
const getDiscountV1 = require("./crud/getDiscount.v1");
const validateDiscountV1 = require("./crud/validateDiscount.v1");
const createDiscountV1 = require("./crud/createDiscount.v1");
const updateDiscountV1 = require("./crud/updateDiscount.v1");
const deleteDiscountV1 = require("./crud/deleteDiscount.v1");

exports.getDiscounts = getDiscountsV1;
exports.getDiscount = getDiscountV1;
exports.validateDiscount = validateDiscountV1;
exports.createDiscount = createDiscountV1;
exports.updateDiscount = updateDiscountV1;
exports.deleteDiscount = deleteDiscountV1;
