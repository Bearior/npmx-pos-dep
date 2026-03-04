"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip,
  Alert,
  Divider,
} from "@mui/material";
import {
  TrendingUp as RevenueIcon,
  ShoppingCart as OrderIcon,
  Warning as AlertIcon,
  AttachMoney as AvgIcon,
} from "@mui/icons-material";
import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import api from "@/libs/api";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import LoadingScreen from "@/components/ui/LoadingScreen";
import type { DashboardSummary, DashboardAlert, Order } from "@/types";

export default function DashboardPage() {
  const { session } = useAuth();
  const { t } = useLanguage();
  const token = session?.access_token;

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    const fetchDashboard = async () => {
      try {
        const [sum, orders, al] = await Promise.all([
          api.get<DashboardSummary>("/dashboard/summary", token),
          api.get<Order[]>("/dashboard/recent-orders", token),
          api.get<DashboardAlert[]>("/dashboard/alerts", token),
        ]);
        setSummary(sum);
        setRecentOrders(orders);
        setAlerts(al);
      } catch (err) {
        console.error("Dashboard load failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [token]);

  if (loading) return <LoadingScreen message={t("dashboard.loading")} />;

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} className="mb-4">
        {t("dashboard.title")}
      </Typography>

      {/* KPI Cards */}
      <Grid container spacing={2} className="mb-4">
        {/* Today's Revenue — detailed */}
        <Grid item xs={12} md={3}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Box className="flex items-start justify-between">
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {t("dashboard.todayRevenue")}
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="#ea5c1f">
                    ฿{(summary?.today.revenue ?? 0).toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {summary?.today.completed_orders ?? 0} {t("dashboard.completedOrders")}
                  </Typography>
                </Box>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: "#ea5c1f14", color: "#ea5c1f", display: "flex" }}>
                  <RevenueIcon />
                </Box>
              </Box>
              <Divider sx={{ my: 1.5 }} />
              <Box className="flex flex-col gap-0.5">
                <Box className="flex justify-between">
                  <Typography variant="caption" color="text.secondary">Profit</Typography>
                  <Typography variant="caption" fontWeight={700} color={(summary?.today.profit ?? 0) >= 0 ? "success.main" : "error.main"}>
                    ฿{(summary?.today.profit ?? 0).toLocaleString()}
                  </Typography>
                </Box>
                <Box className="flex justify-between">
                  <Typography variant="caption" color="text.secondary">Avg / Order</Typography>
                  <Typography variant="caption" fontWeight={600}>
                    ฿{(summary?.today.avg_order_value ?? 0).toLocaleString()}
                  </Typography>
                </Box>
                <Box className="flex justify-between">
                  <Typography variant="caption" color="text.secondary">Total Orders</Typography>
                  <Typography variant="caption" fontWeight={600}>
                    {summary?.today.total_orders ?? 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Monthly Revenue — detailed */}
        <Grid item xs={12} md={3}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Box className="flex items-start justify-between">
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {t("dashboard.monthlyRevenue")}
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="#22c55e">
                    ฿{(summary?.month.revenue ?? 0).toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {summary?.month.completed_orders ?? 0} {t("dashboard.completedOrders")}
                  </Typography>
                </Box>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: "#22c55e14", color: "#22c55e", display: "flex" }}>
                  <RevenueIcon />
                </Box>
              </Box>
              <Divider sx={{ my: 1.5 }} />
              <Box className="flex flex-col gap-0.5">
                <Box className="flex justify-between">
                  <Typography variant="caption" color="text.secondary">Profit</Typography>
                  <Typography variant="caption" fontWeight={700} color={(summary?.month.profit ?? 0) >= 0 ? "success.main" : "error.main"}>
                    ฿{(summary?.month.profit ?? 0).toLocaleString()}
                  </Typography>
                </Box>
                <Box className="flex justify-between">
                  <Typography variant="caption" color="text.secondary">Avg / Order</Typography>
                  <Typography variant="caption" fontWeight={600}>
                    ฿{(summary?.month.avg_order_value ?? 0).toLocaleString()}
                  </Typography>
                </Box>
                <Box className="flex justify-between">
                  <Typography variant="caption" color="text.secondary">Total Orders</Typography>
                  <Typography variant="caption" fontWeight={600}>
                    {summary?.month.total_orders ?? 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} md={3}>
          <StatCard
            title={t("dashboard.activeOrders")}
            value={summary?.active_orders || 0}
            icon={<OrderIcon />}
            color="#3b82f6"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            title={t("dashboard.lowStockItems")}
            value={summary?.low_stock_count || 0}
            icon={<AlertIcon />}
            color="#ef4444"
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        {/* Recent Orders */}
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                {t("dashboard.recentOrders")}
              </Typography>
              <List disablePadding>
                {recentOrders.map((order) => (
                  <ListItem
                    key={order.id}
                    divider
                    secondaryAction={<StatusBadge status={order.status} />}
                  >
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight={600}>
                          {order.order_number}
                          {order.table_number && ` · ${t("dashboard.table")} ${order.table_number}`}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography variant="caption" color="primary" fontWeight={700}>
                            ฿{Number(order.total).toFixed(2)}
                          </Typography>
                          {" · "}
                          <Typography variant="caption" color="text.secondary">
                            {new Date(order.created_at).toLocaleTimeString()}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))}
                {recentOrders.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
                    {t("dashboard.noRecentOrders")}
                  </Typography>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Alerts */}
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Box className="flex items-center gap-2 mb-2">
                <AlertIcon color="warning" />
                <Typography variant="h6" fontWeight={600}>
                  {t("dashboard.alerts")}
                </Typography>
                {alerts.length > 0 && (
                  <Chip label={alerts.length} size="small" color="warning" />
                )}
              </Box>
              {alerts.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
                  {t("dashboard.noAlerts")}
                </Typography>
              ) : (
                alerts.map((alert, i) => (
                  <Alert
                    key={i}
                    severity={alert.severity === "critical" ? "error" : "warning"}
                    sx={{ mb: 1 }}
                  >
                    {alert.message}
                  </Alert>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
