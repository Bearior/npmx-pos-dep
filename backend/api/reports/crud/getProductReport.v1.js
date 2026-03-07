const { supabaseAdmin } = require("../../../config/supabase");

/**
 * @desc    Get top-selling products report
 * @route   GET /api/reports/products?start_date=&end_date=&limit=20
 * @access  Private (admin, manager)
 */
module.exports = async (req, res) => {
  try {
    const {
      start_date,
      end_date,
      limit = 20,
    } = req.query;

    const startDate =
      start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = end_date || new Date().toISOString();

    // Single query: join order_items with orders to filter by date+status,
    // then aggregate in JS. Avoids fetching all order IDs first.
    const { data: items, error } = await supabaseAdmin
      .from("order_items")
      .select("product_id, product_name, quantity, unit_price, orders!inner(status, created_at)")
      .gte("orders.created_at", startDate)
      .lte("orders.created_at", endDate)
      .eq("orders.status", "completed");

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    if (!items || items.length === 0) {
      return res.status(200).json({ data: [] });
    }

    // Aggregate by product
    const productMap = {};
    items.forEach((item) => {
      if (!productMap[item.product_id]) {
        productMap[item.product_id] = {
          product_id: item.product_id,
          product_name: item.product_name,
          total_quantity: 0,
          total_revenue: 0,
          order_count: 0,
        };
      }
      productMap[item.product_id].total_quantity += item.quantity;
      productMap[item.product_id].total_revenue += item.quantity * item.unit_price;
      productMap[item.product_id].order_count++;
    });

    const report = Object.values(productMap)
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, parseInt(limit))
      .map((p) => ({
        ...p,
        total_revenue: parseFloat(p.total_revenue.toFixed(2)),
      }));

    res.status(200).json({
      start_date: startDate,
      end_date: endDate,
      data: report,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
