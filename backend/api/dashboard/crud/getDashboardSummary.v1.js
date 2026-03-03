const { supabaseAdmin } = require("../../../config/supabase");

/**
 * @desc    Get dashboard summary (today KPIs + month KPIs + profit)
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

    // Low stock count — PostgREST can't compare column vs column,
    // so fetch tracked products and filter in JS
    const { data: trackedProducts } = await supabaseAdmin
      .from("products")
      .select("id, stock_quantity, low_stock_threshold")
      .eq("is_active", true)
      .eq("track_inventory", true);

    const lowStockProducts = (trackedProducts || []).filter(
      (p) => p.stock_quantity <= p.low_stock_threshold
    );

    // Completed order sets
    const completedToday = (todayOrders || []).filter((o) => o.status === "completed");
    const completedMonth = (monthOrders || []).filter((o) => o.status === "completed");

    const todayRevenue = completedToday.reduce((s, o) => s + Number(o.total), 0);
    const monthRevenue = completedMonth.reduce((s, o) => s + Number(o.total), 0);

    const todayCompletedCount = completedToday.length;
    const monthCompletedCount = completedMonth.length;

    const todayAvg = todayCompletedCount > 0 ? todayRevenue / todayCompletedCount : 0;
    const monthAvg = monthCompletedCount > 0 ? monthRevenue / monthCompletedCount : 0;

    // --- Profit calculation (revenue - cost) ---
    let todayCost = 0;
    let monthCost = 0;

    const completedMonthIds = completedMonth.map((o) => o.id);
    const completedTodayIdSet = new Set(completedToday.map((o) => o.id));

    if (completedMonthIds.length > 0) {
      // Fetch order items with product cost_price for all completed month orders
      const { data: items } = await supabaseAdmin
        .from("order_items")
        .select("order_id, quantity, products(cost_price)")
        .in("order_id", completedMonthIds);

      for (const item of items || []) {
        const costPrice = Number(item.products?.cost_price) || 0;
        const itemCost = item.quantity * costPrice;
        monthCost += itemCost;
        if (completedTodayIdSet.has(item.order_id)) {
          todayCost += itemCost;
        }
      }
    }

    const todayProfit = todayRevenue - todayCost;
    const monthProfit = monthRevenue - monthCost;

    res.status(200).json({
      today: {
        total_orders: (todayOrders || []).length,
        completed_orders: todayCompletedCount,
        revenue: parseFloat(todayRevenue.toFixed(2)),
        profit: parseFloat(todayProfit.toFixed(2)),
        total_cost: parseFloat(todayCost.toFixed(2)),
        avg_order_value: parseFloat(todayAvg.toFixed(2)),
      },
      month: {
        total_orders: (monthOrders || []).length,
        completed_orders: monthCompletedCount,
        revenue: parseFloat(monthRevenue.toFixed(2)),
        profit: parseFloat(monthProfit.toFixed(2)),
        total_cost: parseFloat(monthCost.toFixed(2)),
        avg_order_value: parseFloat(monthAvg.toFixed(2)),
      },
      active_orders: (activeOrders || []).length,
      low_stock_count: (lowStockProducts || []).length,
    });
  } catch (err) {
    console.error("Dashboard summary error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
