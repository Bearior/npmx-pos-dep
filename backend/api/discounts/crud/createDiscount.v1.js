const { supabaseAdmin } = require("../../../config/supabase");

/**
 * @desc    Create a new discount
 * @route   POST /api/discounts
 * @access  Private (admin, manager)
 */
module.exports = async (req, res) => {
  try {
    const {
      name,
      code,
      type,
      value,
      min_order_amount,
      max_discount,
      max_uses,
      starts_at,
      expires_at,
    } = req.body;

    if (!["percentage", "fixed"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Type must be 'percentage' or 'fixed'",
      });
    }

    if (type === "percentage" && (value < 0 || value > 100)) {
      return res.status(400).json({
        success: false,
        message: "Percentage value must be between 0 and 100",
      });
    }

    const { data, error } = await supabaseAdmin
      .from("discounts")
      .insert({
        code: code ? code.toUpperCase() : null,
        name,
        type,
        value: parseFloat(value),
        max_discount: max_discount ? parseFloat(max_discount) : null,
        min_order_amount: min_order_amount ? parseFloat(min_order_amount) : null,
        max_uses: max_uses ? parseInt(max_uses) : null,
        times_used: 0,
        starts_at: starts_at || new Date().toISOString(),
        expires_at: expires_at || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return res.status(409).json({ success: false, message: "Discount code already exists" });
      }
      return res.status(500).json({ success: false, message: error.message });
    }

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
