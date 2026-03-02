const { supabaseAdmin } = require("../../../config/supabase");

const VALID_TYPES = ["restock", "adjustment", "waste", "return"];

/**
 * @desc    Adjust stock for a product
 * @route   POST /api/inventory/adjust
 * @access  Private (admin, manager)
 */
module.exports = async (req, res) => {
  try {
    const { product_id, quantity, type, reason } = req.body;

    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid type. Must be: ${VALID_TYPES.join(", ")}`,
      });
    }

    // Get current stock
    const { data: product } = await supabaseAdmin
      .from("products")
      .select("id, name, stock_quantity")
      .eq("id", product_id)
      .single();

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const qty = parseInt(quantity);
    const delta = type === "waste" ? -Math.abs(qty) : qty;
    const newStock = product.stock_quantity + delta;

    if (newStock < 0) {
      return res.status(400).json({ success: false, message: "Insufficient stock for this adjustment" });
    }

    // Update product stock
    const { error: updateError } = await supabaseAdmin
      .from("products")
      .update({ stock_quantity: newStock, updated_at: new Date().toISOString() })
      .eq("id", product_id);

    if (updateError) {
      return res.status(500).json({ success: false, message: updateError.message });
    }

    // Record transaction
    const { data: transaction, error: txError } = await supabaseAdmin
      .from("stock_transactions")
      .insert({
        product_id,
        type,
        quantity: delta,
        previous_stock: product.stock_quantity,
        new_stock: newStock,
        reason: reason || null,
        performed_by: req.user.id,
      })
      .select()
      .single();

    if (txError) {
      return res.status(500).json({ success: false, message: txError.message });
    }

    res.status(200).json({
      success: true,
      data: {
        product_id,
        product_name: product.name,
        previous_stock: product.stock_quantity,
        adjustment: delta,
        new_stock: newStock,
        transaction,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
