const { supabaseAdmin } = require("../../../config/supabase");

/**
 * @desc    Get a single discount by ID
 * @route   GET /api/discounts/:id
 * @access  Private
 */
module.exports = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("discounts")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (error) {
      return res.status(404).json({ success: false, message: "Discount not found" });
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
