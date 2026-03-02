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
} from "recharts";
import { useAuth } from "@/providers/AuthProvider";
import api from "@/libs/api";
import LoadingScreen from "@/components/ui/LoadingScreen";
import type { SalesReportRow, ProductReportRow } from "@/types";

const PIE_COLORS = ["#ea5c1f", "#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6"];

export default function ReportsPage() {
  const { session } = useAuth();
  const token = session?.access_token;

  const [tab, setTab] = useState(0);
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day");
  const [dateFrom, setDateFrom] = useState(
    new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
  );
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));

  const [salesData, setSalesData] = useState<SalesReportRow[]>([]);
  const [salesSummary, setSalesSummary] = useState<Record<string, number>>({});
  const [productData, setProductData] = useState<ProductReportRow[]>([]);
  const [paymentData, setPaymentData] = useState<{ method: string; count: number; total: number }[]>([]);
  const [hourlyData, setHourlyData] = useState<{ hour: number; orders: number; total: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    const fetchReports = async () => {
      setLoading(true);
      try {
        const params = { date_from: dateFrom, date_to: dateTo, group_by: groupBy };
        const [sales, products, payments, hourly] = await Promise.all([
          api.get<{ data: SalesReportRow[]; summary: Record<string, number> }>("/reports/sales", token, params),
          api.get<ProductReportRow[]>("/reports/products", token, { date_from: dateFrom, date_to: dateTo }),
          api.get<{ method: string; count: number; total: number }[]>("/reports/payments", token, { date_from: dateFrom, date_to: dateTo }),
          api.get<{ data: { hour: number; orders: number; total: number }[] }>("/reports/hourly", token, { date: new Date().toISOString().slice(0, 10) }),
        ]);
        setSalesData(sales.data);
        setSalesSummary(sales.summary);
        setProductData(products);
        setPaymentData(payments);
        setHourlyData(hourly.data);
      } catch (err) {
        console.error("Reports load failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [token, dateFrom, dateTo, groupBy]);

  if (loading) return <LoadingScreen message="Loading reports..." />;

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} className="mb-4">
        Reports & Analytics
      </Typography>

      {/* Filters */}
      <Card className="mb-4">
        <CardContent>
          <Box className="flex flex-wrap items-center gap-3">
            <TextField
              label="From"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="To"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <ToggleButtonGroup
              value={groupBy}
              exclusive
              onChange={(_, v) => v && setGroupBy(v)}
              size="small"
            >
              <ToggleButton value="day">Daily</ToggleButton>
              <ToggleButton value="week">Weekly</ToggleButton>
              <ToggleButton value="month">Monthly</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </CardContent>
      </Card>

      {/* Tab navigation */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} className="mb-3">
        <Tab label="Sales Overview" />
        <Tab label="Top Products" />
        <Tab label="Payment Methods" />
        <Tab label="Hourly Trends" />
      </Tabs>

      {/* Tab 0: Sales Overview */}
      {tab === 0 && (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Revenue Trend
                </Typography>
                <Box className="flex gap-6 mb-4 flex-wrap">
                  <Box>
                    <Typography variant="caption" color="text.secondary">Total Revenue</Typography>
                    <Typography variant="h6" fontWeight={700} color="primary">
                      ฿{(salesSummary.total_revenue || 0).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Total Orders</Typography>
                    <Typography variant="h6" fontWeight={700}>{salesSummary.total_orders || 0}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Total Tax</Typography>
                    <Typography variant="h6" fontWeight={700}>฿{(salesSummary.total_tax || 0).toLocaleString()}</Typography>
                  </Box>
                </Box>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `฿${value.toLocaleString()}`} />
                    <Bar dataKey="total" fill="#ea5c1f" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tab 1: Top Products */}
      {tab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Top Selling Products
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell align="right">Qty Sold</TableCell>
                  <TableCell align="right">Revenue</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {productData.map((row, i) => (
                  <TableRow key={row.product_id}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{row.product_name}</TableCell>
                    <TableCell align="right">{row.total_quantity}</TableCell>
                    <TableCell align="right">฿{row.total_revenue.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Payment Methods */}
      {tab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Payment Method Breakdown
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
                  label={({ method, total }) => `${method}: ฿${total.toLocaleString()}`}
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

      {/* Tab 3: Hourly Trends */}
      {tab === 3 && (
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Today&apos;s Hourly Sales
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={hourlyData.filter((h) => h.orders > 0 || h.hour >= 6 && h.hour <= 22)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} />
                <YAxis />
                <Tooltip labelFormatter={(h) => `${h}:00`} formatter={(value: number) => `฿${value.toLocaleString()}`} />
                <Line type="monotone" dataKey="total" stroke="#ea5c1f" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
