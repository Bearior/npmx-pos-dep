const { supabaseAdmin } = require("../../../config/supabase");

/**
 * @desc    Get a single order by ID with items and payments
 * @route   GET /api/orders/:id
 * @access  Private
 */
module.exports = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("*, order_items(*, products(name, image_url)), payments(*)")
      .eq("id", req.params.id)
      .single();

    if (error) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
