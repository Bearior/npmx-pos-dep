const { supabaseAdmin } = require("../../../config/supabase");

/**
 * @desc    Get payment method breakdown report
 * @route   GET /api/reports/payment-methods?start_date=&end_date=
 * @access  Private (admin, manager)
 */
module.exports = async (req, res) => {
  try {
    const {
      start_date,
      end_date,
    } = req.query;

    const startDate =
      start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = end_date || new Date().toISOString();

    const { data: payments, error } = await supabaseAdmin
      .from("payments")
      .select("method, amount, status")
      .gte("created_at", startDate)
      .lte("created_at", endDate)
      .eq("status", "completed");

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    const methodMap = {};
    (payments || []).forEach((p) => {
      if (!methodMap[p.method]) {
        methodMap[p.method] = { method: p.method, count: 0, total: 0 };
      }
      methodMap[p.method].count++;
      methodMap[p.method].total += p.amount;
    });

    const grandTotal = Object.values(methodMap).reduce((s, m) => s + m.total, 0);

    const report = Object.values(methodMap)
      .sort((a, b) => b.total - a.total)
      .map((m) => ({
        ...m,
        total: parseFloat(m.total.toFixed(2)),
        percentage: grandTotal > 0 ? parseFloat(((m.total / grandTotal) * 100).toFixed(1)) : 0,
      }));

    res.status(200).json({
      start_date: startDate,
      end_date: endDate,
      grand_total: parseFloat(grandTotal.toFixed(2)),
      data: report,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
