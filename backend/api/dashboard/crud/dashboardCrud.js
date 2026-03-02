const { supabaseAdmin } = require("../../../config/supabase");
const { AppError } = require("../../../middleware/errorHandler");

/**
 * Dashboard summary: today's and this month's KPIs.
 */
async function getDashboardSummary() {
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = `${today.slice(0, 7)}-01`;

  // Today's orders
  const { data: todayOrders } = await supabaseAdmin
    .from("orders")
    .select("total, status")
    .gte("created_at", `${today}T00:00:00`)
    .lte("created_at", `${today}T23:59:59`)
    .in("status", ["completed", "split"]);

  // Month orders
  const { data: monthOrders } = await supabaseAdmin
    .from("orders")
    .select("total, status")
    .gte("created_at", `${monthStart}T00:00:00`)
    .in("status", ["completed", "split"]);

  // Active orders (pending / preparing)
  const { count: activeOrders } = await supabaseAdmin
    .from("orders")
    .select("*", { count: "exact", head: true })
    .in("status", ["pending", "preparing", "ready"]);

  // Low stock count
  const { data: lowStockItems } = await supabaseAdmin
    .from("products")
    .select("id")
    .eq("track_inventory", true)
    .eq("is_active", true)
    .filter("stock_quantity", "lte", "low_stock_threshold");

  const todayTotal = (todayOrders || []).reduce((s, o) => s + o.total, 0);
  const monthTotal = (monthOrders || []).reduce((s, o) => s + o.total, 0);

  return {
    today: {
      orders: (todayOrders || []).length,
      revenue: parseFloat(todayTotal.toFixed(2)),
    },
    month: {
      orders: (monthOrders || []).length,
      revenue: parseFloat(monthTotal.toFixed(2)),
    },
    active_orders: activeOrders || 0,
    low_stock_count: (lowStockItems || []).length,
    average_order_value:
      (todayOrders || []).length > 0
        ? parseFloat((todayTotal / todayOrders.length).toFixed(2))
        : 0,
  };
}

/**
 * Get last 10 orders for the live feed.
 */
async function getRecentOrders() {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("id, order_number, status, total, customer_name, table_number, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) throw new AppError(error.message, 500);
  return data;
}

/**
 * System alerts: low stock, pending orders, etc.
 */
async function getAlerts() {
  const alerts = [];

  // Low stock alerts
  const { data: lowStock } = await supabaseAdmin
    .from("products")
    .select("id, name, stock_quantity, low_stock_threshold")
    .eq("track_inventory", true)
    .eq("is_active", true)
    .filter("stock_quantity", "lte", "low_stock_threshold");

  if (lowStock) {
    for (const item of lowStock) {
      alerts.push({
        type: "low_stock",
        severity: item.stock_quantity === 0 ? "critical" : "warning",
        message: `${item.name}: ${item.stock_quantity} left (threshold: ${item.low_stock_threshold})`,
        product_id: item.id,
      });
    }
  }

  // Old pending orders (> 30 min)
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const { data: staleOrders } = await supabaseAdmin
    .from("orders")
    .select("id, order_number, created_at")
    .eq("status", "pending")
    .lt("created_at", thirtyMinAgo);

  if (staleOrders) {
    for (const order of staleOrders) {
      alerts.push({
        type: "stale_order",
        severity: "warning",
        message: `Order ${order.order_number} has been pending for over 30 minutes`,
        order_id: order.id,
      });
    }
  }

  return alerts;
}

module.exports = { getDashboardSummary, getRecentOrders, getAlerts };
