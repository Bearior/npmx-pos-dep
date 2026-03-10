"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Tabs,
  Tab,
  Chip,
  LinearProgress,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Tooltip as MuiTooltip,
  TableContainer,
  Paper,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
} from "recharts";
import {
  ExpandMore as ExpandIcon,
  Psychology as BrainIcon,
  TrendingUp as TrendIcon,
  Timer as TimerIcon,
  People as PeopleIcon,
  Speed as SpeedIcon,
  Restaurant as DineIcon,
  DeliveryDining as DeliveryIcon,
  Science as ScienceIcon,
  Lightbulb as InsightIcon,
  Assessment as AssessmentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import api from "@/libs/api";
import { ReportsSkeleton } from "@/components/ui/Skeletons";
import type {
  SalesReportRow,
  SalesReportResponse,
  ProductReportRow,
  ProductReportResponse,
  PaymentMethodRow,
  PaymentMethodResponse,
  HourlyRow,
  HourlyResponse,
  CustomerBehaviorResponse,
} from "@/types";

const PIE_COLORS = ["#ea5c1f", "#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899"];
const CLASS_COLORS: Record<string, string> = {
  long_stay: "#22c55e",
  moderate: "#3b82f6",
  quick: "#f59e0b",
  delivery: "#8b5cf6",
};
const CLASS_LABELS: Record<string, string> = {
  long_stay: "Long-Stay",
  moderate: "Moderate",
  quick: "Quick Purchase",
};

export default function ReportsPage() {
  const { session, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const token = session?.access_token;

  const [tab, setTab] = useState(0);
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day");
  const [dateFrom, setDateFrom] = useState(
    new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
  );
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));

  const [salesData, setSalesData] = useState<SalesReportRow[]>([]);
  const [salesSummary, setSalesSummary] = useState<{ total_revenue: number; total_orders: number }>({
    total_revenue: 0,
    total_orders: 0,
  });
  const [productData, setProductData] = useState<ProductReportRow[]>([]);
  const [paymentData, setPaymentData] = useState<PaymentMethodRow[]>([]);
  const [hourlyData, setHourlyData] = useState<HourlyRow[]>([]);
  const [behaviorData, setBehaviorData] = useState<CustomerBehaviorResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!token) { setLoading(false); return; }
    const fetchReports = async () => {
      setLoading(true);
      try {
        const params = { date_from: dateFrom, date_to: dateTo, group_by: groupBy };
        const [sales, products, payments, hourly, behavior] = await Promise.all([
          api.get<SalesReportResponse>("/reports/sales", token, params),
          api.get<ProductReportResponse>("/reports/products", token, { date_from: dateFrom, date_to: dateTo }),
          api.get<PaymentMethodResponse>("/reports/payment-methods", token, { date_from: dateFrom, date_to: dateTo }),
          api.get<HourlyResponse>("/reports/hourly", token, { date: new Date().toISOString().slice(0, 10) }),
          api.get<CustomerBehaviorResponse>("/reports/customer-behavior", token, { date_from: dateFrom, date_to: dateTo }),
        ]);
        setSalesData(sales.data);
        setSalesSummary({ total_revenue: sales.total_revenue, total_orders: sales.total_orders });
        setProductData(products.data);
        setPaymentData(payments.data);
        setHourlyData(hourly.data);
        setBehaviorData(behavior);
      } catch (err) {
        console.error("Reports load failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [token, dateFrom, dateTo, groupBy, authLoading]);

  if (authLoading || loading) return <ReportsSkeleton />;

  const kpis = behaviorData?.kpis;
  const methodology = behaviorData?.methodology;

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} className="mb-4">
        {t("reports.title")}
      </Typography>

      {/* Filters */}
      <Card className="mb-4">
        <CardContent>
          <Box className="flex flex-wrap items-center gap-3">
            <TextField
              label={t("reports.from")}
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
            <TextField
              label={t("reports.to")}
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
            <ToggleButtonGroup
              value={groupBy}
              exclusive
              onChange={(_, v) => v && setGroupBy(v)}
              size="small"
            >
              <ToggleButton value="day">{t("reports.daily")}</ToggleButton>
              <ToggleButton value="week">{t("reports.weekly")}</ToggleButton>
              <ToggleButton value="month">{t("reports.monthly")}</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} className="mb-3" variant="scrollable" scrollButtons="auto">
        <Tab icon={<TrendIcon />} iconPosition="start" label={t("reports.salesOverview")} />
        <Tab icon={<AssessmentIcon />} iconPosition="start" label={t("reports.topProducts")} />
        <Tab icon={<PeopleIcon />} iconPosition="start" label={t("reports.payments")} />
        <Tab icon={<TimerIcon />} iconPosition="start" label={t("reports.hourly")} />
        <Tab icon={<BrainIcon />} iconPosition="start" label={t("reports.customerBehavior")} />
      </Tabs>

      {/* ================================================================ */}
      {/* Tab 0: Sales Overview */}
      {/* ================================================================ */}
      {tab === 0 && (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  {t("reports.revenueTrend")}
                </Typography>
                <Box className="flex gap-6 mb-4 flex-wrap">
                  <Box>
                    <Typography variant="caption" color="text.secondary">{t("reports.totalRevenue")}</Typography>
                    <Typography variant="h6" fontWeight={700} color="primary">
                      ฿{(salesSummary.total_revenue || 0).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">{t("reports.totalOrders")}</Typography>
                    <Typography variant="h6" fontWeight={700}>{salesSummary.total_orders || 0}</Typography>
                  </Box>
                </Box>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `฿${value.toLocaleString()}`} />
                    <Bar dataKey="revenue" fill="#ea5c1f" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* ================================================================ */}
      {/* Tab 1: Top Products */}
      {/* ================================================================ */}
      {tab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              {t("reports.topSelling")}
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>{t("reports.product")}</TableCell>
                  <TableCell align="right">{t("reports.qtySold")}</TableCell>
                  <TableCell align="right">{t("reports.revenue")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {productData.map((row, i) => (
                  <TableRow key={row.product_id}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{row.product_name}</TableCell>
                    <TableCell align="right">{row.total_quantity}</TableCell>
                    <TableCell align="right">฿{(row.total_revenue ?? 0).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ================================================================ */}
      {/* Tab 2: Payment Methods */}
      {/* ================================================================ */}
      {tab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              {t("reports.paymentBreakdown")}
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentData}
                  dataKey="total"
                  nameKey="method"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ method, total }: { method: string; total: number }) =>
                    `${method}: ฿${total.toLocaleString()}`
                  }
                >
                  {paymentData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip formatter={(value: number) => `฿${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* ================================================================ */}
      {/* Tab 3: Hourly Trends */}
      {/* ================================================================ */}
      {tab === 3 && (
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              {t("reports.hourlySales")}
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={hourlyData.filter((h) => h.order_count > 0 || (h.hour >= 6 && h.hour <= 22))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} />
                <YAxis />
                <Tooltip labelFormatter={(h) => `${h}:00`} formatter={(value: number) => `฿${value.toLocaleString()}`} />
                <Line type="monotone" dataKey="revenue" stroke="#ea5c1f" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* ================================================================ */}
      {/* Tab 4: Customer Behavior AI Analysis */}
      {/* ================================================================ */}
      {tab === 4 && behaviorData && kpis && methodology && (
        <Box className="space-y-4">
          {/* ---- KPI Summary Cards ---- */}
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Card sx={{ borderTop: 3, borderColor: "primary.main" }}>
                <CardContent className="text-center">
                  <PeopleIcon color="primary" />
                  <Typography variant="h4" fontWeight={700}>{kpis.total_sessions}</Typography>
                  <Typography variant="caption" color="text.secondary">{t("reports.totalSessions")}</Typography>
                  <Box className="flex justify-center gap-2 mt-1">
                    <Chip icon={<DineIcon />} label={kpis.dine_in_sessions} size="small" variant="outlined" />
                    <Chip icon={<DeliveryIcon />} label={kpis.delivery_sessions} size="small" variant="outlined" color="secondary" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} md={3}>
              <Card sx={{ borderTop: 3, borderColor: "#22c55e" }}>
                <CardContent className="text-center py-8">
                  <TimerIcon sx={{ color: "#22c55e" }} />
                  <Typography variant="h4" fontWeight={700}>
                    {kpis.avg_session_duration}
                    <Typography component="span" variant="body2"> min</Typography>
                  </Typography>
                  <Typography variant="caption" color="text.secondary">{t("reports.avgSessionDuration")}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} md={3}>
              <Card sx={{ borderTop: 3, borderColor: "#f59e0b" }}>
                <CardContent className="text-center py-8">
                  <SpeedIcon sx={{ color: "#f59e0b" }} />
                  <Typography variant="h4" fontWeight={700}>{kpis.avg_dwell_score}</Typography>
                  <Typography variant="caption" color="text.secondary">{t("reports.avgDwellScore")}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} md={3}>
              <Card sx={{ borderTop: 3, borderColor: "#8b5cf6" }}>
                <CardContent className="text-center py-8">
                  <TrendIcon sx={{ color: "#8b5cf6" }} />
                  <Typography variant="h4" fontWeight={700}>฿{kpis.avg_basket_value}</Typography>
                  <Typography variant="caption" color="text.secondary">{t("reports.avgBasketValue")}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* ---- Classification Distribution ---- */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={5}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    <BrainIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                    {t("reports.customerClassification")}
                  </Typography>
                  {(behaviorData.summary.long_stay + behaviorData.summary.moderate + behaviorData.summary.quick) === 0 ? (
                    <Box sx={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Typography color="text.secondary" variant="body2">{t("reports.noSessionData")}</Typography>
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Long-Stay", value: behaviorData.summary.long_stay, fill: CLASS_COLORS.long_stay },
                            { name: "Moderate", value: behaviorData.summary.moderate, fill: CLASS_COLORS.moderate },
                            { name: "Quick", value: behaviorData.summary.quick, fill: CLASS_COLORS.quick },
                          ].filter((d) => d.value > 0)}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={90}
                          paddingAngle={3}
                          label={({ name, value }: { name: string; value: number }) => `${name}: ${value}`}
                        >
                          {[
                            { value: behaviorData.summary.long_stay, color: CLASS_COLORS.long_stay },
                            { value: behaviorData.summary.moderate, color: CLASS_COLORS.moderate },
                            { value: behaviorData.summary.quick, color: CLASS_COLORS.quick },
                          ]
                            .filter((d) => d.value > 0)
                            .map((d, i) => (
                              <Cell key={i} fill={d.color} />
                            ))}
                        </Pie>
                        <Legend />
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                  <Box className="mt-2 space-y-1">
                    <Box className="flex justify-between items-center">
                      <Typography variant="body2">{t("reports.longStayPct")}</Typography>
                      <Box className="flex items-center gap-2" sx={{ width: "60%" }}>
                        <LinearProgress
                          variant="determinate"
                          value={kpis.long_stay_pct}
                          sx={{ flex: 1, height: 8, borderRadius: 4, "& .MuiLinearProgress-bar": { backgroundColor: CLASS_COLORS.long_stay } }}
                        />
                        <Typography variant="body2" fontWeight={600}>{kpis.long_stay_pct}%</Typography>
                      </Box>
                    </Box>
                    <Box className="flex justify-between items-center">
                      <Typography variant="body2">{t("reports.quickPct")}</Typography>
                      <Box className="flex items-center gap-2" sx={{ width: "60%" }}>
                        <LinearProgress
                          variant="determinate"
                          value={kpis.quick_pct}
                          sx={{ flex: 1, height: 8, borderRadius: 4, "& .MuiLinearProgress-bar": { backgroundColor: CLASS_COLORS.quick } }}
                        />
                        <Typography variant="body2" fontWeight={600}>{kpis.quick_pct}%</Typography>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={7}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Revenue by Customer Type
                  </Typography>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={[
                        { type: "Long-Stay", revenue: kpis.revenue_by_type.long_stay, fill: CLASS_COLORS.long_stay },
                        { type: "Moderate", revenue: kpis.revenue_by_type.moderate, fill: CLASS_COLORS.moderate },
                        { type: "Quick", revenue: kpis.revenue_by_type.quick, fill: CLASS_COLORS.quick },
                        { type: "Delivery", revenue: kpis.revenue_by_type.delivery, fill: CLASS_COLORS.delivery },
                      ]}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tickFormatter={(v) => `฿${v.toLocaleString()}`} />
                      <YAxis type="category" dataKey="type" width={90} />
                      <Tooltip formatter={(v: number) => `฿${v.toLocaleString()}`} />
                      <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                        {[CLASS_COLORS.long_stay, CLASS_COLORS.moderate, CLASS_COLORS.quick, CLASS_COLORS.delivery].map(
                          (c, i) => <Cell key={i} fill={c} />
                        )}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <Box className="flex gap-4 mt-2 justify-center flex-wrap">
                    <MuiTooltip title="Average revenue per long-stay session">
                      <Chip
                        label={`Long-Stay avg: ฿${kpis.long_stay_avg_revenue}`}
                        sx={{ bgcolor: CLASS_COLORS.long_stay, color: "#fff" }}
                        size="small"
                      />
                    </MuiTooltip>
                    <MuiTooltip title="Average revenue per quick-purchase session">
                      <Chip
                        label={`Quick avg: ฿${kpis.quick_avg_revenue}`}
                        sx={{ bgcolor: CLASS_COLORS.quick, color: "#fff" }}
                        size="small"
                      />
                    </MuiTooltip>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* ---- Hourly Pattern Stacked Area ---- */}
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                {t("reports.hourlyPattern")}
              </Typography>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={(behaviorData.hourly_pattern || []).filter((h) => h.hour >= 6 && h.hour <= 23)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} />
                  <YAxis allowDecimals={false} />
                  <Tooltip labelFormatter={(h) => `${h}:00`} />
                  <Legend />
                  <Area type="monotone" dataKey="long_stay" stackId="1" name="Long-Stay" stroke={CLASS_COLORS.long_stay} fill={CLASS_COLORS.long_stay} fillOpacity={0.6} />
                  <Area type="monotone" dataKey="moderate" stackId="1" name="Moderate" stroke={CLASS_COLORS.moderate} fill={CLASS_COLORS.moderate} fillOpacity={0.6} />
                  <Area type="monotone" dataKey="quick" stackId="1" name="Quick" stroke={CLASS_COLORS.quick} fill={CLASS_COLORS.quick} fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* ---- Scatter Plot: Dwell Score vs Revenue ---- */}
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                {t("reports.dwellVsRevenue")}
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dwell_score" name="Dwell Score" type="number" domain={[0, 100]} />
                  <YAxis dataKey="total_revenue" name="Revenue" tickFormatter={(v) => `฿${v}`} />
                  <Tooltip
                    formatter={(value: number, name: string) =>
                      name === "Revenue" ? `฿${value.toLocaleString()}` : value
                    }
                    labelFormatter={() => ""}
                  />
                  <Legend />
                  <Scatter
                    name="Long-Stay"
                    data={behaviorData.sessions.filter((s) => s.classification === "long_stay")}
                    fill={CLASS_COLORS.long_stay}
                    opacity={0.7}
                  />
                  <Scatter
                    name="Moderate"
                    data={behaviorData.sessions.filter((s) => s.classification === "moderate")}
                    fill={CLASS_COLORS.moderate}
                    opacity={0.7}
                  />
                  <Scatter
                    name="Quick"
                    data={behaviorData.sessions.filter((s) => s.classification === "quick")}
                    fill={CLASS_COLORS.quick}
                    opacity={0.7}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* ---- Session Detail Table ---- */}
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                {t("reports.sessionDetails")}
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 420 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t("reports.tableCustomer")}</TableCell>
                      <TableCell>{t("reports.type")}</TableCell>
                      <TableCell align="right">{t("reports.score")}</TableCell>
                      <TableCell align="right">{t("reports.duration")}</TableCell>
                      <TableCell align="right">{t("reports.orders")}</TableCell>
                      <TableCell align="right">{t("reports.items")}</TableCell>
                      <TableCell align="right">{t("reports.revenue")}</TableCell>
                      <TableCell align="right">{t("reports.avgBasket")}</TableCell>
                      <TableCell align="right">{t("reports.categories")}</TableCell>
                      <TableCell>{t("reports.time")}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {behaviorData.sessions.slice(0, 50).map((s, i) => (
                      <TableRow key={i} hover>
                        <TableCell>
                          {s.table_number ? `Table ${s.table_number}` : s.customer_name || "—"}
                          {s.is_delivery && <Chip label="Delivery" size="small" color="secondary" sx={{ ml: 0.5 }} />}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={CLASS_LABELS[s.classification] || s.classification}
                            size="small"
                            sx={{
                              bgcolor: CLASS_COLORS[s.classification],
                              color: "#fff",
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography fontWeight={700} color={s.dwell_score >= 60 ? "success.main" : s.dwell_score >= 30 ? "primary.main" : "text.secondary"}>
                            {s.dwell_score}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{s.session_duration_min} min</TableCell>
                        <TableCell align="right">{s.order_count}</TableCell>
                        <TableCell align="right">{s.total_items}</TableCell>
                        <TableCell align="right">฿{s.total_revenue.toLocaleString()}</TableCell>
                        <TableCell align="right">฿{s.avg_basket_value}</TableCell>
                        <TableCell align="right">{s.unique_categories}</TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {new Date(s.first_order_at).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* ================================================================ */}
          {/* SUGGESTION BOX — Methodology & Data Science Documentation */}
          {/* ================================================================ */}
          <Card sx={{ border: 2, borderColor: "primary.main", borderStyle: "dashed" }}>
            <CardContent>
              <Box className="flex items-center gap-2 mb-3">
                <ScienceIcon color="primary" fontSize="large" />
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    {t("reports.methodology")}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t("reports.methodologyDesc")}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ mb: 2 }} />

              {/* Session Definition */}
              <Alert severity="info" sx={{ mb: 2 }} icon={<InfoIcon />}>
                <Typography variant="body2" fontWeight={600}>{t("reports.sessionDefinition")}</Typography>
                <Typography variant="body2">{methodology.session_definition}</Typography>
              </Alert>

              {/* Derived Variables */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandIcon />}>
                  <Box className="flex items-center gap-1">
                    <AssessmentIcon color="primary" />
                    <Typography fontWeight={600}>{t("reports.derivedVariables")}</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>{t("reports.variable")}</strong></TableCell>
                        <TableCell><strong>{t("reports.formula")}</strong></TableCell>
                        <TableCell><strong>{t("reports.description")}</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {methodology.derived_variables.map((v) => (
                        <TableRow key={v.name}>
                          <TableCell>
                            <Typography variant="body2" fontFamily="monospace" fontWeight={600} color="primary">
                              {v.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontFamily="monospace" sx={{ fontSize: "0.75rem" }}>
                              {v.formula}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{v.description}</Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </AccordionDetails>
              </Accordion>

              {/* Classification Rules */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandIcon />}>
                  <Box className="flex items-center gap-1">
                    <BrainIcon color="primary" />
                    <Typography fontWeight={600}>{t("reports.classificationRules")}</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    {Object.entries(methodology.classification_rules).map(([key, rule]) => (
                      <Grid item xs={12} md={4} key={key}>
                        <Card variant="outlined" sx={{ borderLeft: 4, borderLeftColor: CLASS_COLORS[key] || "grey.400" }}>
                          <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                            <Chip
                              label={CLASS_LABELS[key] || key}
                              size="small"
                              sx={{ bgcolor: CLASS_COLORS[key], color: "#fff", fontWeight: 700, mb: 1 }}
                            />
                            <Typography variant="body2" fontFamily="monospace">
                              {rule}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                  <Alert severity="success" sx={{ mt: 2 }} icon={<InsightIcon />}>
                    <Typography variant="body2" fontWeight={600}>Dwell Score Formula</Typography>
                    <Typography variant="body2" fontFamily="monospace" sx={{ fontSize: "0.8rem" }}>
                      score = 0.45 * sigmoid(duration, 30, 15) + 0.35 * sigmoid(orders, 2.5, 1.2) + 0.20 * sigmoid(categories, 2, 1) * 100
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      Sigmoid normalization ensures smooth 0-1 mapping with configurable midpoints and steepness for each feature.
                    </Typography>
                  </Alert>
                </AccordionDetails>
              </Accordion>

              {/* Model Suggestions */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandIcon />}>
                  <Box className="flex items-center gap-1">
                    <InsightIcon color="primary" />
                    <Typography fontWeight={600}>{t("reports.modelSuggestions")}</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    {methodology.model_suggestions.map((sug, i) => (
                      <Grid item xs={12} key={i}>
                        <Alert
                          severity={i === 0 ? "success" : "info"}
                          icon={i === 0 ? <CheckIcon /> : <InsightIcon />}
                        >
                          <Typography variant="body2">
                            <strong>Approach {i + 1}:</strong> {sug}
                          </Typography>
                        </Alert>
                      </Grid>
                    ))}
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* Assumptions */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandIcon />}>
                  <Box className="flex items-center gap-1">
                    <CheckIcon color="success" />
                    <Typography fontWeight={600}>{t("reports.assumptions")}</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                    {methodology.assumptions.map((a, i) => (
                      <Typography component="li" variant="body2" key={i} sx={{ mb: 0.5 }}>
                        {a}
                      </Typography>
                    ))}
                  </Box>
                </AccordionDetails>
              </Accordion>

              {/* Limitations */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandIcon />}>
                  <Box className="flex items-center gap-1">
                    <WarningIcon color="warning" />
                    <Typography fontWeight={600}>{t("reports.limitations")}</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                    {methodology.limitations.map((l, i) => (
                      <Typography component="li" variant="body2" key={i} sx={{ mb: 0.5 }} color="text.secondary">
                        {l}
                      </Typography>
                    ))}
                  </Box>
                </AccordionDetails>
              </Accordion>

              {/* Validation */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandIcon />}>
                  <Box className="flex items-center gap-1">
                    <ScienceIcon color="primary" />
                    <Typography fontWeight={600}>{t("reports.validation")}</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box component="ol" sx={{ m: 0, pl: 2.5 }}>
                    {methodology.validation.map((v, i) => (
                      <Typography component="li" variant="body2" key={i} sx={{ mb: 0.5 }}>
                        {v}
                      </Typography>
                    ))}
                  </Box>
                </AccordionDetails>
              </Accordion>

              {/* Suggested KPIs */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandIcon />}>
                  <Box className="flex items-center gap-1">
                    <TrendIcon color="primary" />
                    <Typography fontWeight={600}>{t("reports.suggestedKPIs")}</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={1}>
                    {[
                      { name: "Long-Stay Ratio", desc: "% of sessions classified as long-stay — target: increasing over time" },
                      { name: "Revenue per Dwell-Minute", desc: "total_revenue / session_duration — efficiency of monetizing time spent" },
                      { name: "Reorder Rate", desc: "Sessions with order_count > 1 / total sessions — customer engagement" },
                      { name: "Category Diversity Index", desc: "Avg category_diversity across sessions — menu exploration health" },
                      { name: "Dwell Score Trend", desc: "Moving average of avg_dwell_score over weeks — behavioral shift detection" },
                      { name: "Delivery vs Dine-In Split", desc: "delivery_sessions / total_sessions — channel mix monitoring" },
                    ].map((kpi) => (
                      <Grid item xs={12} md={6} key={kpi.name}>
                        <Card variant="outlined" sx={{ p: 1.5 }}>
                          <Typography variant="body2" fontWeight={700} color="primary">
                            {kpi.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {kpi.desc}
                          </Typography>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </AccordionDetails>
              </Accordion>

            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
}
