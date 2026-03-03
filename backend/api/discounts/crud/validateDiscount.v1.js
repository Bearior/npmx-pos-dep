const { supabaseAdmin } = require("../../../config/supabase");

/**
 * @desc    Validate a discount code
 * @route   POST /api/discounts/validate
 * @access  Private
 */
module.exports = async (req, res) => {
  try {
    const { code, order_total } = req.body;

    const { data: discount, error } = await supabaseAdmin
      .from("discounts")
      .select("*")
      .eq("code", code.toUpperCase())
      .eq("is_active", true)
      .single();

    if (error || !discount) {
      return res.status(404).json({ success: false, message: "Invalid discount code" });
    }

    const now = new Date();

    // Check date validity
    if (discount.starts_at && new Date(discount.starts_at) > now) {
      return res.status(400).json({ success: false, message: "Discount not yet active" });
    }
    if (discount.expires_at && new Date(discount.expires_at) < now) {
      return res.status(400).json({ success: false, message: "Discount has expired" });
    }

    // Check usage limit
    if (discount.max_uses && discount.times_used >= discount.max_uses) {
      return res.status(400).json({ success: false, message: "Discount usage limit reached" });
    }

    // Check minimum order
    if (discount.min_order_amount && order_total && order_total < discount.min_order_amount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount is ${discount.min_order_amount} THB`,
      });
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (discount.type === "percentage") {
      discountAmount = order_total ? (order_total * discount.value) / 100 : 0;
      if (discount.max_discount) {
        discountAmount = Math.min(discountAmount, discount.max_discount);
      }
    } else {
      discountAmount = discount.value;
    }

    res.status(200).json({
      success: true,
      valid: true,
      discount: {
        id: discount.id,
        name: discount.name,
        type: discount.type,
        value: discount.value,
        calculated_amount: parseFloat(discountAmount.toFixed(2)),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
