const { supabaseAdmin } = require("../../../config/supabase");

/**
 * @desc    Update a discount
 * @route   PUT /api/discounts/:id
 * @access  Private (admin, manager)
 */
module.exports = async (req, res) => {
  try {
    const allowed = [
      "name",
      "code",
      "type",
      "value",
      "min_order_amount",
      "max_discount_amount",
      "max_uses",
      "start_date",
      "end_date",
      "is_active",
    ];
    const updates = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    });

    if (updates.code) updates.code = updates.code.toUpperCase();
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("discounts")
      .update(updates)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ success: false, message: "Discount not found" });
      }
      if (error.code === "23505") {
        return res.status(409).json({ success: false, message: "Discount code already exists" });
      }
      return res.status(500).json({ success: false, message: error.message });
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
