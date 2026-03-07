const { supabaseAdmin } = require("../../../config/supabase");

/**
 * @desc    Get all orders with pagination and filtering
 * @route   GET /api/orders?status=&date_from=&date_to=&limit=&page=
 * @access  Private
 */
module.exports = async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.pagination || {};
    const { status, date_from, date_to } = req.query;

    let query = supabaseAdmin
      .from("orders")
      .select("id, order_number, status, total, subtotal, discount_amount, tax_amount, customer_name, table_number, created_at, updated_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq("status", status);
    if (date_from) query = query.gte("created_at", date_from);
    if (date_to) query = query.lte("created_at", date_to);

    const { data, error, count } = await query;

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    res.status(200).json({ data, total: count, limit, offset });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
