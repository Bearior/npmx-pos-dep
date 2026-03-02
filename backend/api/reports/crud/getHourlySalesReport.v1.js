const { supabaseAdmin } = require("../../../config/supabase");

/**
 * @desc    Get hourly sales breakdown (24 hours)
 * @route   GET /api/reports/hourly?date=YYYY-MM-DD
 * @access  Private (admin, manager)
 */
module.exports = async (req, res) => {
  try {
    const dateStr = req.query.date || new Date().toISOString().split("T")[0];
    const dayStart = new Date(`${dateStr}T00:00:00.000Z`).toISOString();
    const dayEnd = new Date(`${dateStr}T23:59:59.999Z`).toISOString();

    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select("id, total, created_at")
      .gte("created_at", dayStart)
      .lte("created_at", dayEnd)
      .eq("status", "completed");

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    // Initialize 24-hour slots
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      label: `${String(i).padStart(2, "0")}:00`,
      order_count: 0,
      revenue: 0,
    }));

    (orders || []).forEach((order) => {
      const hour = new Date(order.created_at).getUTCHours();
      hours[hour].order_count++;
      hours[hour].revenue += order.total;
    });

    const report = hours.map((h) => ({
      ...h,
      revenue: parseFloat(h.revenue.toFixed(2)),
    }));

    res.status(200).json({
      date: dateStr,
      total_orders: (orders || []).length,
      total_revenue: parseFloat(
        (orders || []).reduce((s, o) => s + o.total, 0).toFixed(2)
      ),
      data: report,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
