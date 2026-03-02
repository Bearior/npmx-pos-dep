const { supabaseAdmin } = require("../../../config/supabase");

/**
 * @desc    Get sales report grouped by day/week/month
 * @route   GET /api/reports/sales?start_date=&end_date=&group_by=day|week|month
 * @access  Private (admin, manager)
 */
module.exports = async (req, res) => {
  try {
    const {
      start_date,
      end_date,
      group_by = "day",
    } = req.query;

    const startDate =
      start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = end_date || new Date().toISOString();

    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select("id, total, subtotal, tax, discount_amount, status, created_at")
      .gte("created_at", startDate)
      .lte("created_at", endDate)
      .eq("status", "completed")
      .order("created_at");

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    // Group orders by period
    const grouped = {};
    (orders || []).forEach((order) => {
      const date = new Date(order.created_at);
      let key;

      if (group_by === "month") {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      } else if (group_by === "week") {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split("T")[0];
      } else {
        key = date.toISOString().split("T")[0];
      }

      if (!grouped[key]) {
        grouped[key] = { period: key, total_orders: 0, revenue: 0, tax: 0, discounts: 0 };
      }
      grouped[key].total_orders++;
      grouped[key].revenue += order.total;
      grouped[key].tax += order.tax || 0;
      grouped[key].discounts += order.discount_amount || 0;
    });

    const report = Object.values(grouped).map((g) => ({
      ...g,
      revenue: parseFloat(g.revenue.toFixed(2)),
      tax: parseFloat(g.tax.toFixed(2)),
      discounts: parseFloat(g.discounts.toFixed(2)),
      avg_order_value: parseFloat((g.revenue / g.total_orders).toFixed(2)),
    }));

    res.status(200).json({
      start_date: startDate,
      end_date: endDate,
      group_by,
      total_revenue: parseFloat(
        (orders || []).reduce((s, o) => s + o.total, 0).toFixed(2)
      ),
      total_orders: (orders || []).length,
      data: report,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
