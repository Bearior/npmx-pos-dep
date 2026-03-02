const { supabaseAdmin } = require("../../../config/supabase");
const { AppError } = require("../../../middleware/errorHandler");

/**
 * Sales report – totals grouped by day, week, or month.
 */
async function getSalesReport(dateFrom, dateTo, groupBy = "day") {
  const from = dateFrom || new Date(Date.now() - 30 * 86400000).toISOString();
  const to = dateTo || new Date().toISOString();

  const { data: orders, error } = await supabaseAdmin
    .from("orders")
    .select("created_at, subtotal, discount_amount, tax_amount, total, status")
    .gte("created_at", from)
    .lte("created_at", to)
    .in("status", ["completed", "split"]);

  if (error) throw new AppError(error.message, 500);

  // Group in memory
  const grouped = {};
  for (const order of orders) {
    let key;
    const d = new Date(order.created_at);
    if (groupBy === "month") {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    } else if (groupBy === "week") {
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      key = weekStart.toISOString().slice(0, 10);
    } else {
      key = d.toISOString().slice(0, 10);
    }

    if (!grouped[key]) {
      grouped[key] = { date: key, orders: 0, subtotal: 0, discounts: 0, tax: 0, total: 0 };
    }
    grouped[key].orders++;
    grouped[key].subtotal += order.subtotal;
    grouped[key].discounts += order.discount_amount;
    grouped[key].tax += order.tax_amount;
    grouped[key].total += order.total;
  }

  const result = Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));

  // Round values
  for (const r of result) {
    r.subtotal = parseFloat(r.subtotal.toFixed(2));
    r.discounts = parseFloat(r.discounts.toFixed(2));
    r.tax = parseFloat(r.tax.toFixed(2));
    r.total = parseFloat(r.total.toFixed(2));
  }

  return {
    period: { from, to },
    group_by: groupBy,
    data: result,
    summary: {
      total_orders: orders.length,
      total_revenue: parseFloat(orders.reduce((s, o) => s + o.total, 0).toFixed(2)),
      total_tax: parseFloat(orders.reduce((s, o) => s + o.tax_amount, 0).toFixed(2)),
      total_discounts: parseFloat(orders.reduce((s, o) => s + o.discount_amount, 0).toFixed(2)),
    },
  };
}

/**
 * Top-selling products report.
 */
async function getProductReport(dateFrom, dateTo, limit = 20) {
  const from = dateFrom || new Date(Date.now() - 30 * 86400000).toISOString();
  const to = dateTo || new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("order_items")
    .select("product_id, product_name, quantity, unit_price, orders!inner(created_at, status)")
    .gte("orders.created_at", from)
    .lte("orders.created_at", to)
    .in("orders.status", ["completed", "split"]);

  if (error) throw new AppError(error.message, 500);

  // Aggregate by product
  const productMap = {};
  for (const item of data) {
    if (!productMap[item.product_id]) {
      productMap[item.product_id] = {
        product_id: item.product_id,
        product_name: item.product_name,
        total_quantity: 0,
        total_revenue: 0,
      };
    }
    productMap[item.product_id].total_quantity += item.quantity;
    productMap[item.product_id].total_revenue += item.unit_price * item.quantity;
  }

  return Object.values(productMap)
    .sort((a, b) => b.total_quantity - a.total_quantity)
    .slice(0, limit)
    .map((p) => ({ ...p, total_revenue: parseFloat(p.total_revenue.toFixed(2)) }));
}

/**
 * Payment method breakdown.
 */
async function getPaymentMethodReport(dateFrom, dateTo) {
  const from = dateFrom || new Date(Date.now() - 30 * 86400000).toISOString();
  const to = dateTo || new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("payments")
    .select("method, amount")
    .eq("status", "completed")
    .gte("created_at", from)
    .lte("created_at", to);

  if (error) throw new AppError(error.message, 500);

  const methods = {};
  for (const p of data) {
    if (!methods[p.method]) methods[p.method] = { method: p.method, count: 0, total: 0 };
    methods[p.method].count++;
    methods[p.method].total += p.amount;
  }

  return Object.values(methods).map((m) => ({
    ...m,
    total: parseFloat(m.total.toFixed(2)),
  }));
}

/**
 * Hourly sales breakdown for a given day.
 */
async function getHourlySalesReport(date) {
  const targetDate = date || new Date().toISOString().slice(0, 10);
  const from = `${targetDate}T00:00:00`;
  const to = `${targetDate}T23:59:59`;

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("created_at, total")
    .gte("created_at", from)
    .lte("created_at", to)
    .in("status", ["completed", "split"]);

  if (error) throw new AppError(error.message, 500);

  // Group by hour
  const hours = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    orders: 0,
    total: 0,
  }));

  for (const order of data) {
    const h = new Date(order.created_at).getHours();
    hours[h].orders++;
    hours[h].total += order.total;
  }

  return {
    date: targetDate,
    data: hours.map((h) => ({ ...h, total: parseFloat(h.total.toFixed(2)) })),
  };
}

module.exports = { getSalesReport, getProductReport, getPaymentMethodReport, getHourlySalesReport };
