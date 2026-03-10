const { supabaseAdmin } = require("../../../config/supabase");

// Estimated average row sizes (bytes) — used as fallback when tables are empty
const EST_ORDER_ROW_BYTES = 400;
const EST_ORDER_ITEM_ROW_BYTES = 250;
const ITEMS_PER_BILL = 3;

// Supabase tier limits
const TIER_LIMITS = {
  free: { db_mb: 500 },
  pro: { db_mb: 8192 },
  team: { db_mb: 8192 },
  enterprise: { db_mb: 16384 },
};

module.exports = async (req, res) => {
  try {
    const { data: tableSizes, error: tsError } = await supabaseAdmin.rpc("get_table_sizes");

    if (tsError) {
      console.error("get_table_sizes error:", tsError);
      return res.status(500).json({ error: "Failed to fetch table sizes" });
    }

    const ordersCount = Number(tableSizes.orders_count) || 0;
    const orderItemsCount = Number(tableSizes.order_items_count) || 0;
    const ordersSizeBytes = Number(tableSizes.orders_size_bytes) || 0;
    const orderItemsSizeBytes = Number(tableSizes.order_items_size_bytes) || 0;
    const dbSizeBytes = Number(tableSizes.db_size_bytes) || 0;
    const firstOrderAt = tableSizes.first_order_at || null;

    // Calculate average row sizes (use estimates if tables are empty)
    const avgOrderRowBytes =
      ordersCount > 0 ? ordersSizeBytes / ordersCount : EST_ORDER_ROW_BYTES;
    const avgOrderItemRowBytes =
      orderItemsCount > 0 ? orderItemsSizeBytes / orderItemsCount : EST_ORDER_ITEM_ROW_BYTES;

    // One bill = 1 order row + 3 order_item rows
    const bytesPerBill = avgOrderRowBytes + ITEMS_PER_BILL * avgOrderItemRowBytes;

    // Determine tier and max DB size
    const tier = process.env.SUPABASE_TIER || "free";
    const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;
    const maxDbBytes = limits.db_mb * 1024 * 1024;

    // Remaining space
    const remainingBytes = Math.max(0, maxDbBytes - dbSizeBytes);
    const totalBillsCanCreate = Math.floor(remainingBytes / bytesPerBill);

    // Historical average: bills per day / month
    let avgBillsPerDay = 0;
    let avgBillsPerMonth = 0;
    let daysOfOperation = 0;

    if (firstOrderAt && ordersCount > 0) {
      const firstDate = new Date(firstOrderAt);
      const now = new Date();
      const diffMs = now.getTime() - firstDate.getTime();
      daysOfOperation = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      avgBillsPerDay = ordersCount / daysOfOperation;
      avgBillsPerMonth = avgBillsPerDay * 30;
    }

    // Estimate how many days/months remaining at current rate
    const estimatedDaysRemaining =
      avgBillsPerDay > 0 ? Math.floor(totalBillsCanCreate / avgBillsPerDay) : null;
    const estimatedMonthsRemaining =
      estimatedDaysRemaining !== null ? Math.round((estimatedDaysRemaining / 30) * 10) / 10 : null;

    res.json({
      current_bills: ordersCount,
      current_items: orderItemsCount,
      items_per_bill: ITEMS_PER_BILL,
      bytes_per_bill: Math.round(bytesPerBill),
      total_bills_can_create: totalBillsCanCreate,
      db_used_mb: Math.round((dbSizeBytes / (1024 * 1024)) * 100) / 100,
      db_max_mb: limits.db_mb,
      db_remaining_mb: Math.round((remainingBytes / (1024 * 1024)) * 100) / 100,
      avg_bills_per_day: Math.round(avgBillsPerDay * 100) / 100,
      avg_bills_per_month: Math.round(avgBillsPerMonth * 100) / 100,
      days_of_operation: daysOfOperation,
      estimated_days_remaining: estimatedDaysRemaining,
      estimated_months_remaining: estimatedMonthsRemaining,
    });
  } catch (err) {
    console.error("getBillCapacity error:", err);
    res.status(500).json({ error: "Failed to compute bill capacity" });
  }
};
