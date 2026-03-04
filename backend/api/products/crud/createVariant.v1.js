const { supabaseAdmin } = require("../../../config/supabase");

/**
 * @desc    Create a variant for a product
 * @route   POST /api/products/:id/variants
 * @access  Private (admin, manager)
 */
module.exports = async (req, res) => {
  try {
    const { name, name_th, type, price_modifier, is_active, sort_order } = req.body;

    const { data, error } = await supabaseAdmin
      .from("product_variants")
      .insert({
        product_id: req.params.id,
        name,
        name_th: name_th || null,
        type: type || "size",
        price_modifier: parseFloat(price_modifier),
        is_active: is_active !== false,
        sort_order: sort_order || 0,
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
