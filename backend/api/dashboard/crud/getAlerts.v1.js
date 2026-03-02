const { supabaseAdmin } = require("../../../config/supabase");

/**
 * @desc    Get alerts (low stock items + stale pending orders >30min)
 * @route   GET /api/dashboard/alerts
 * @access  Private
 */
module.exports = async (req, res) => {
  try {
    const alerts = [];

    // Low stock alerts
    const { data: lowStock } = await supabaseAdmin
      .from("products")
      .select("id, name, stock_quantity, min_stock_level")
      .eq("is_active", true)
      .filter("stock_quantity", "lte", "min_stock_level")
      .order("stock_quantity");

    (lowStock || []).forEach((p) => {
      alerts.push({
        type: "low_stock",
        severity: p.stock_quantity === 0 ? "critical" : "warning",
        message: `${p.name} has ${p.stock_quantity} items left (min: ${p.min_stock_level})`,
        product_id: p.id,
      });
    });

    // Stale orders (pending > 30 minutes)
    const staleThreshold = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: staleOrders } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, status, created_at")
      .in("status", ["pending"])
      .lt("created_at", staleThreshold);

    (staleOrders || []).forEach((o) => {
      const minutes = Math.round((Date.now() - new Date(o.created_at).getTime()) / 60000);
      alerts.push({
        type: "stale_order",
        severity: "warning",
        message: `Order ${o.order_number} has been pending for ${minutes} minutes`,
        order_id: o.id,
      });
    });

    res.status(200).json(alerts);
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
