const { supabaseAdmin } = require("../../../config/supabase");

/**
 * @desc    Customer behavior analytics — classify long-stay vs quick-purchase
 * @route   GET /api/reports/customer-behavior?date_from=&date_to=
 * @access  Private (admin, manager)
 *
 * ---------- Statistical methodology ----------
 *
 * Since we have NO external sensor/WiFi data, we infer customer dwell-time
 * by grouping orders that share the same (table_number + close timestamps)
 * into "sessions".  A session is a cluster of orders at the same table
 * where consecutive orders are ≤ SESSION_GAP minutes apart.
 *
 * Derived variables per session:
 *   1. session_duration   — time between first and last order (minutes)
 *   2. order_count        — total orders in the session (reorder indicator)
 *   3. avg_basket_value   — average order total in the session
 *   4. basket_value_cv    — coefficient of variation of basket values
 *   5. total_items        — sum of item quantities across session
 *   6. unique_categories  — number of distinct product categories
 *   7. category_diversity — unique_categories / total_items  (0-1 score)
 *   8. avg_time_gap       — avg minutes between consecutive orders
 *
 * Classification (rule-based + scoring):
 *   LONG-STAY  : session_duration ≥ 30 min  OR  order_count ≥ 3
 *   QUICK      : session with 1 order  AND  session_duration < 5 min
 *   MODERATE   : everything else
 *
 * A composite "dwell score" (0-100) is also computed:
 *   score = clamp(0,100,
 *           w1*norm(duration) + w2*norm(orders) + w3*norm(categories))
 *   where norm maps value to 0-1 using sigmoid around thresholds.
 *
 * Assumptions:
 *   • table_number reliably identifies a physical location or customer group.
 *   • Orders without table_number or customer_name are treated as individual
 *     quick-purchase sessions.
 *   • Time is server UTC; no timezone adjustment needed at analysis-level.
 *
 * Limitations:
 *   • If customer_name is blank, different people at the same table may
 *     be merged into one session — false positive for "long-stay".
 *   • Delivery/Grab orders should be excluded from dwell analysis.
 * -------------------------------------------------
 */

const SESSION_GAP_MINUTES = 60; // max gap between orders in same session

module.exports = async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    const startDate = date_from || new Date(Date.now() - 30 * 86400000).toISOString();
    const endDate = date_to || new Date().toISOString();

    // 1. Fetch completed orders with items in date range
    //    Only select fields needed for session analysis (not full order payload)
    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, table_number, customer_name, total, created_at, order_items(product_id, quantity)")
      .gte("created_at", startDate)
      .lte("created_at", endDate)
      .eq("status", "completed")
      .order("created_at");

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    if (!orders || orders.length === 0) {
      return res.status(200).json({
        sessions: [],
        summary: emptySum(),
        distribution: { long_stay: 0, moderate: 0, quick: 0 },
        kpis: emptyKPIs(),
        methodology: getMethodology(),
      });
    }

    // 2. Get product -> category mapping
    const productIds = [...new Set(orders.flatMap((o) => (o.order_items || []).map((i) => i.product_id)))];
    let categoryMap = {};
    if (productIds.length > 0) {
      const { data: products } = await supabaseAdmin
        .from("products")
        .select("id, category_id")
        .in("id", productIds);
      (products || []).forEach((p) => {
        categoryMap[p.id] = p.category_id;
      });
    }

    // 3. Build sessions: group by table_number (+ customer_name when available)
    //    then split by time-gap
    const sessionMap = {};

    orders.forEach((order) => {
      // Delivery orders → individual session each
      const tbl = order.table_number || "";
      const isDelivery = /grab/i.test(tbl);
      const key = isDelivery
        ? `__delivery__${order.id}`
        : tbl
        ? `table:${tbl}`
        : order.customer_name
        ? `customer:${order.customer_name}`
        : `__anon__${order.id}`;

      if (!sessionMap[key]) sessionMap[key] = [];
      sessionMap[key].push(order);
    });

    // 4. For each key, split into sub-sessions by time gap
    const allSessions = [];

    Object.entries(sessionMap).forEach(([key, ordersGroup]) => {
      const sorted = ordersGroup.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      let currentSession = [sorted[0]];

      for (let i = 1; i < sorted.length; i++) {
        const gapMin =
          (new Date(sorted[i].created_at).getTime() -
            new Date(sorted[i - 1].created_at).getTime()) /
          60000;

        if (gapMin <= SESSION_GAP_MINUTES && !key.startsWith("__")) {
          currentSession.push(sorted[i]);
        } else {
          allSessions.push({ key, orders: currentSession });
          currentSession = [sorted[i]];
        }
      }
      allSessions.push({ key, orders: currentSession });
    });

    // 5. Compute metrics per session
    const sessions = allSessions.map((s) => {
      const ords = s.orders;
      const timestamps = ords.map((o) => new Date(o.created_at).getTime());
      const firstTime = Math.min(...timestamps);
      const lastTime = Math.max(...timestamps);
      const durationMin = (lastTime - firstTime) / 60000;

      // Time gaps
      const gaps = [];
      for (let i = 1; i < timestamps.length; i++) {
        gaps.push((timestamps[i] - timestamps[i - 1]) / 60000);
      }
      const avgGap = gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;

      // Basket values
      const totals = ords.map((o) => parseFloat(o.total) || 0);
      const avgBasket = totals.reduce((a, b) => a + b, 0) / totals.length;
      const basketStd = Math.sqrt(
        totals.reduce((s, v) => s + (v - avgBasket) ** 2, 0) / totals.length
      );
      const basketCV = avgBasket > 0 ? basketStd / avgBasket : 0;

      // Items & categories
      const allItems = ords.flatMap((o) => o.order_items || []);
      const totalItems = allItems.reduce((s, i) => s + i.quantity, 0);
      const uniqueCats = new Set(allItems.map((i) => categoryMap[i.product_id]).filter(Boolean));
      const categoryDiversity = totalItems > 0 ? uniqueCats.size / totalItems : 0;

      // Dwell score (0-100)
      const wDur = 0.45;
      const wOrd = 0.35;
      const wCat = 0.20;
      const normDuration = sigmoid(durationMin, 30, 15); // midpoint 30min
      const normOrders = sigmoid(ords.length, 2.5, 1.2); // midpoint ~2.5 orders
      const normCat = sigmoid(uniqueCats.size, 2, 1);
      const dwellScore = Math.round(
        (wDur * normDuration + wOrd * normOrders + wCat * normCat) * 100
      );

      // Classification
      let classification;
      if (durationMin >= 30 || ords.length >= 3) {
        classification = "long_stay";
      } else if (ords.length === 1 && durationMin < 5) {
        classification = "quick";
      } else {
        classification = "moderate";
      }

      const isDelivery = s.key.startsWith("__delivery__");

      return {
        session_key: s.key,
        table_number: ords[0].table_number || null,
        customer_name: ords[0].customer_name || null,
        is_delivery: isDelivery,
        first_order_at: new Date(firstTime).toISOString(),
        last_order_at: new Date(lastTime).toISOString(),
        session_duration_min: parseFloat(durationMin.toFixed(1)),
        order_count: ords.length,
        total_items: totalItems,
        total_revenue: parseFloat(totals.reduce((a, b) => a + b, 0).toFixed(2)),
        avg_basket_value: parseFloat(avgBasket.toFixed(2)),
        basket_value_cv: parseFloat(basketCV.toFixed(3)),
        unique_categories: uniqueCats.size,
        category_diversity: parseFloat(categoryDiversity.toFixed(3)),
        avg_time_gap_min: parseFloat(avgGap.toFixed(1)),
        dwell_score: dwellScore,
        classification,
        order_numbers: ords.map((o) => o.order_number),
      };
    });

    // 6. Aggregate distribution
    const dist = { long_stay: 0, moderate: 0, quick: 0 };
    sessions.forEach((s) => dist[s.classification]++);

    // 7. Summary KPIs
    const nonDelivery = sessions.filter((s) => !s.is_delivery);
    const delivery = sessions.filter((s) => s.is_delivery);
    const longStay = nonDelivery.filter((s) => s.classification === "long_stay");
    const quick = nonDelivery.filter((s) => s.classification === "quick");

    const avg = (arr, fn) => (arr.length > 0 ? arr.reduce((s, i) => s + fn(i), 0) / arr.length : 0);

    const kpis = {
      total_sessions: sessions.length,
      dine_in_sessions: nonDelivery.length,
      delivery_sessions: delivery.length,
      avg_session_duration: parseFloat(avg(nonDelivery, (s) => s.session_duration_min).toFixed(1)),
      avg_orders_per_session: parseFloat(avg(nonDelivery, (s) => s.order_count).toFixed(2)),
      avg_basket_value: parseFloat(avg(sessions, (s) => s.avg_basket_value).toFixed(2)),
      long_stay_avg_revenue: parseFloat(avg(longStay, (s) => s.total_revenue).toFixed(2)),
      quick_avg_revenue: parseFloat(avg(quick, (s) => s.total_revenue).toFixed(2)),
      long_stay_pct: sessions.length > 0 ? parseFloat(((dist.long_stay / sessions.length) * 100).toFixed(1)) : 0,
      quick_pct: sessions.length > 0 ? parseFloat(((dist.quick / sessions.length) * 100).toFixed(1)) : 0,
      avg_dwell_score: parseFloat(avg(sessions, (s) => s.dwell_score).toFixed(1)),
      revenue_by_type: {
        long_stay: parseFloat(longStay.reduce((s, i) => s + i.total_revenue, 0).toFixed(2)),
        moderate: parseFloat(
          nonDelivery.filter((s) => s.classification === "moderate").reduce((s, i) => s + i.total_revenue, 0).toFixed(2)
        ),
        quick: parseFloat(quick.reduce((s, i) => s + i.total_revenue, 0).toFixed(2)),
        delivery: parseFloat(delivery.reduce((s, i) => s + i.total_revenue, 0).toFixed(2)),
      },
    };

    // 8. Hourly pattern by classification
    const hourlyPattern = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      long_stay: 0,
      moderate: 0,
      quick: 0,
    }));
    sessions.forEach((s) => {
      const h = new Date(s.first_order_at).getUTCHours();
      if (hourlyPattern[h]) hourlyPattern[h][s.classification]++;
    });

    res.status(200).json({
      date_from: startDate,
      date_to: endDate,
      sessions: sessions.sort((a, b) => b.dwell_score - a.dwell_score),
      summary: dist,
      kpis,
      hourly_pattern: hourlyPattern,
      methodology: getMethodology(),
    });
  } catch (err) {
    console.error("Customer behavior error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── Helpers ──

function sigmoid(x, midpoint, steepness) {
  return 1 / (1 + Math.exp(-(x - midpoint) / steepness));
}

function emptySum() {
  return { long_stay: 0, moderate: 0, quick: 0 };
}

function emptyKPIs() {
  return {
    total_sessions: 0,
    dine_in_sessions: 0,
    delivery_sessions: 0,
    avg_session_duration: 0,
    avg_orders_per_session: 0,
    avg_basket_value: 0,
    long_stay_avg_revenue: 0,
    quick_avg_revenue: 0,
    long_stay_pct: 0,
    quick_pct: 0,
    avg_dwell_score: 0,
    revenue_by_type: { long_stay: 0, moderate: 0, quick: 0, delivery: 0 },
  };
}

function getMethodology() {
  return {
    session_definition:
      "Orders sharing the same table_number within a 60-minute gap are grouped into a session. Delivery and anonymous orders form individual sessions.",
    derived_variables: [
      { name: "session_duration_min", formula: "(last_order_time - first_order_time) / 60000", description: "Total time span of a session in minutes" },
      { name: "order_count", formula: "count(orders in session)", description: "Number of orders placed — acts as reorder indicator" },
      { name: "avg_basket_value", formula: "sum(totals) / order_count", description: "Average order value within the session" },
      { name: "basket_value_cv", formula: "std(totals) / mean(totals)", description: "Coefficient of variation — higher = more varied spending" },
      { name: "category_diversity", formula: "unique_categories / total_items", description: "Normalized category diversity score (0-1)" },
      { name: "avg_time_gap_min", formula: "mean(time gaps between consecutive orders)", description: "Average gap between orders in minutes" },
      { name: "dwell_score", formula: "0.45*σ(duration,30,15) + 0.35*σ(orders,2.5,1.2) + 0.20*σ(categories,2,1) × 100", description: "Composite score (0-100) using weighted sigmoid-normalized variables" },
    ],
    classification_rules: {
      long_stay: "session_duration ≥ 30 min OR order_count ≥ 3",
      moderate: "Does not meet long_stay or quick criteria",
      quick: "order_count = 1 AND session_duration < 5 min",
    },
    model_suggestions: [
      "Rule-based thresholds (currently implemented) — fast, interpretable",
      "K-Means clustering (k=3) on [duration, order_count, basket_value] — data-driven groups",
      "Logistic regression scoring — P(long_stay | features) for probability-based classification",
    ],
    assumptions: [
      "table_number reliably identifies a physical location or customer group",
      "Delivery/Grab orders are excluded from dwell analysis (scored individually as 'quick')",
      "Server timestamps are accurate enough to infer session timing",
      "No explicit customer_id — table + time proximity is the best available proxy",
    ],
    limitations: [
      "Without unique customer_id, different customers at the same table may be merged",
      "Does not capture idle time (customer present but not ordering)",
      "Session gap threshold (60 min) is heuristic — may need tuning per venue",
      "Model cannot distinguish 'waiting for service' from 'choosing to stay'",
    ],
    validation: [
      "Compare dwell classification against staff observation logs (manual labeling)",
      "A/B test with different SESSION_GAP thresholds to find optimal split accuracy",
      "Compute silhouette score if using K-Means to validate cluster quality",
      "Track revenue-per-session-type over time to validate business insight",
    ],
  };
}
