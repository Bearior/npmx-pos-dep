const { supabaseAdmin } = require("../../../config/supabase");

/**
 * @desc    Get all payments with optional filters
 * @route   GET /api/payments?order_id=&method=
 * @access  Private
 */
module.exports = async (req, res) => {
  try {
    let query = supabaseAdmin
      .from("payments")
      .select("*, orders(order_number)")
      .order("created_at", { ascending: false })
      .limit(50);

    if (req.query.order_id) query = query.eq("order_id", req.query.order_id);
    if (req.query.method) query = query.eq("method", req.query.method);

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
