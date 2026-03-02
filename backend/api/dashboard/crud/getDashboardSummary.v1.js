const { supabaseAdmin } = require("../../../config/supabase");

/**
 * @desc    Get dashboard summary (today KPIs + month KPIs)
 * @route   GET /api/dashboard/summary
 * @access  Private
 */
module.exports = async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Today's orders
    const { data: todayOrders } = await supabaseAdmin
      .from("orders")
      .select("id, total, status")
      .gte("created_at", todayStart)
      .neq("status", "voided");

    // Month's orders
    const { data: monthOrders } = await supabaseAdmin
      .from("orders")
      .select("id, total, status")
      .gte("created_at", monthStart)
      .neq("status", "voided");

    // Active orders (pending / preparing)
    const { data: activeOrders } = await supabaseAdmin
      .from("orders")
      .select("id")
      .in("status", ["pending", "preparing"]);

    // Low stock count
    const { data: lowStockProducts } = await supabaseAdmin
      .from("products")
      .select("id")
      .eq("is_active", true)
      .filter("stock_quantity", "lte", "min_stock_level");

    const todayRevenue = (todayOrders || [])
      .filter((o) => o.status === "completed")
      .reduce((s, o) => s + o.total, 0);
    const monthRevenue = (monthOrders || [])
      .filter((o) => o.status === "completed")
      .reduce((s, o) => s + o.total, 0);

    const todayCompleted = (todayOrders || []).filter((o) => o.status === "completed").length;
    const avgOrderValue = todayCompleted > 0 ? todayRevenue / todayCompleted : 0;

    res.status(200).json({
      today: {
        total_orders: (todayOrders || []).length,
        completed_orders: todayCompleted,
        revenue: parseFloat(todayRevenue.toFixed(2)),
        avg_order_value: parseFloat(avgOrderValue.toFixed(2)),
      },
      month: {
        total_orders: (monthOrders || []).length,
        completed_orders: (monthOrders || []).filter((o) => o.status === "completed").length,
        revenue: parseFloat(monthRevenue.toFixed(2)),
      },
      active_orders: (activeOrders || []).length,
      low_stock_count: (lowStockProducts || []).length,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
