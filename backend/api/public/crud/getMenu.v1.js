const { supabaseAdmin } = require("../../../config/supabase");

/**
 * @desc    Get active menu for public ordering (products + categories)
 * @route   GET /api/public/menu
 * @access  Public
 */
module.exports = async (req, res) => {
  try {
    const [categoriesResult, productsResult] = await Promise.all([
      supabaseAdmin
        .from("categories")
        .select("id, name, name_th, sort_order")
        .eq("is_active", true)
        .order("sort_order"),
      supabaseAdmin
        .from("products")
        .select("id, name, name_th, description, description_th, price, category_id, image_url, product_variants(id, name, name_th, price_modifier)")
        .eq("is_active", true)
        .eq("visible_on_pos", true)
        .order("name"),
    ]);

    if (categoriesResult.error) {
      return res.status(500).json({ success: false, message: categoriesResult.error.message });
    }
    if (productsResult.error) {
      return res.status(500).json({ success: false, message: productsResult.error.message });
    }

    res.status(200).json({
      categories: categoriesResult.data,
      products: productsResult.data,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
