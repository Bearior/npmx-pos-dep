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
} from "@mui/material";
import {
  TrendingUp as RevenueIcon,
  ShoppingCart as OrderIcon,
  Warning as AlertIcon,
  AttachMoney as AvgIcon,
} from "@mui/icons-material";
import { useAuth } from "@/providers/AuthProvider";
import api from "@/libs/api";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import LoadingScreen from "@/components/ui/LoadingScreen";
import type { DashboardSummary, DashboardAlert, Order } from "@/types";

export default function DashboardPage() {
  const { session } = useAuth();
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

  if (loading) return <LoadingScreen message="Loading dashboard..." />;

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} className="mb-4">
        Dashboard
      </Typography>

      {/* KPI Cards */}
      <Grid container spacing={2} className="mb-4">
        <Grid item xs={6} md={3}>
          <StatCard
            title="Today&apos;s Revenue"
            value={`฿${summary?.today.revenue.toLocaleString() || 0}`}
            subtitle={`${summary?.today.orders || 0} orders`}
            icon={<RevenueIcon />}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            title="Monthly Revenue"
            value={`฿${summary?.month.revenue.toLocaleString() || 0}`}
            subtitle={`${summary?.month.orders || 0} orders`}
            icon={<RevenueIcon />}
            color="#22c55e"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            title="Active Orders"
            value={summary?.active_orders || 0}
            icon={<OrderIcon />}
            color="#3b82f6"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            title="Avg. Order Value"
            value={`฿${summary?.average_order_value || 0}`}
            icon={<AvgIcon />}
            color="#8b5cf6"
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        {/* Recent Orders */}
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Recent Orders
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
                          {order.table_number && ` · Table ${order.table_number}`}
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
                    No recent orders
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
                  Alerts
                </Typography>
                {alerts.length > 0 && (
                  <Chip label={alerts.length} size="small" color="warning" />
                )}
              </Box>
              {alerts.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
                  No alerts — everything looks good!
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
