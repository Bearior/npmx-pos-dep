const { supabaseAdmin } = require("../../../config/supabase");

/**
 * @desc    Get all products with pagination, search, and filtering
 * @route   GET /api/products?search=&category_id=&is_active=&limit=&page=
 * @access  Private
 */
module.exports = async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.pagination || {};
    const { search, category_id, is_active } = req.query;

    let query = supabaseAdmin
      .from("products")
      .select("*, categories(name), product_variants(*)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) query = query.ilike("name", `%${search}%`);
    if (category_id) query = query.eq("category_id", category_id);
    if (is_active !== undefined) query = query.eq("is_active", is_active === "true");

    const { data, error, count } = await query;

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    res.status(200).json({ data, total: count, limit, offset });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
