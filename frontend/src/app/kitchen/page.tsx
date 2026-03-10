"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { 
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Grid,
  Badge,
  Snackbar,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
  useTheme,
} from "@mui/material";
import {
  Timer as TimerIcon,
  CheckCircle as ReadyIcon,
  LocalFireDepartment as FireIcon,
  Notifications as NotifIcon,
  Restaurant as RestaurantIcon,
} from "@mui/icons-material";
import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import api from "@/libs/api";
import { KDSSkeleton } from "@/components/ui/Skeletons";
import type { OrderStatus } from "@/types";

interface KitchenOrderItem {
  id: string;
  product_name: string;
  variant_info: string | null;
  quantity: number;
  unit_price: number;
  notes: string | null;
}

interface KitchenOrder {
  id: string;
  order_number: string;
  status: OrderStatus;
  customer_name: string | null;
  table_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  order_items: KitchenOrderItem[];
}

const POLL_INTERVAL = 5000; // 5 seconds
const DELAY_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

function getElapsedMinutes(created: string): number {
  return Math.floor((Date.now() - new Date(created).getTime()) / 60000);
}

function isDelayed(order: KitchenOrder): boolean {
  return Date.now() - new Date(order.created_at).getTime() > DELAY_THRESHOLD_MS;
}

export default function KitchenPage() {
  const { session, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const theme = useTheme();
  const token = session?.access_token;

  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "preparing" | "ready">("all");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" as "info" | "success" });
  const prevOrderIds = useRef<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isFirstLoad = useRef(true);

  // Notification sound
  useEffect(() => {
    // Use a simple beep via AudioContext as fallback
    audioRef.current = null;
  }, []);

  const playNotification = useCallback(() => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = "sine";
      gain.gain.value = 0.3;
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
      // Second beep
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.frequency.value = 1100;
        osc2.type = "sine";
        gain2.gain.value = 0.3;
        osc2.start();
        osc2.stop(ctx.currentTime + 0.2);
      }, 250);
    } catch {
      // Audio not available
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.get<{ data: KitchenOrder[] }>("/orders/kitchen", token);
      const newOrders = res.data;

      // Check for new orders (notification)
      if (!isFirstLoad.current) {
        const currentIds = new Set(newOrders.map((o) => o.id));
        const newIds = Array.from(currentIds).filter((id) => !prevOrderIds.current.has(id));
        if (newIds.length > 0) {
          playNotification();
          const count = newIds.length;
          setSnackbar({
            open: true,
            message: count === 1
              ? t("kds.newOrder")
              : `${count} ${t("kds.newOrders")}`,
            severity: "info",
          });
        }
      }
      isFirstLoad.current = false;
      prevOrderIds.current = new Set(newOrders.map((o) => o.id));

      setOrders(newOrders);
    } catch (err) {
      console.error("KDS fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, [token, playNotification, t]);

  // Initial fetch + polling
  useEffect(() => {
    if (authLoading) return;
    fetchOrders();
    const interval = setInterval(fetchOrders, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchOrders, authLoading]);

  // Update elapsed timer every minute
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    if (!token) return;
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus }, token);
      setOrders((prev) =>
        newStatus === "served" || newStatus === "completed"
          ? prev.filter((o) => o.id !== orderId)
          : prev.map((o) => (o.id === orderId ? { ...o, status: newStatus, updated_at: new Date().toISOString() } : o))
      );
      setSnackbar({
        open: true,
        message: t("kds.statusUpdated"),
        severity: "success",
      });
    } catch (err) {
      console.error("Status update failed:", err);
    }
  };

  const getNextStatus = (status: OrderStatus): OrderStatus | null => {
    switch (status) {
      case "pending": return "preparing";
      case "preparing": return "ready";
      case "ready": return "served";
      default: return null;
    }
  };

  const getStatusColor = (status: OrderStatus): "warning" | "info" | "success" => {
    switch (status) {
      case "pending": return "warning";
      case "preparing": return "info";
      case "ready": return "success";
      default: return "info";
    }
  };

  const getStatusLabel = (status: OrderStatus): string => {
    switch (status) {
      case "pending": return t("orders.pending");
      case "preparing": return t("orders.preparing");
      case "ready": return t("orders.ready");
      default: return status;
    }
  };

  const getActionLabel = (status: OrderStatus): string => {
    switch (status) {
      case "pending": return t("kds.startPreparing");
      case "preparing": return t("kds.markReady");
      case "ready": return t("kds.markServed");
      default: return "";
    }
  };

  const getActionColor = (status: OrderStatus): "warning" | "primary" | "success" => {
    switch (status) {
      case "pending": return "warning";
      case "preparing": return "primary";
      case "ready": return "success";
      default: return "primary";
    }
  };

  const filteredOrders = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  // Counts for filter badges
  const counts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    preparing: orders.filter((o) => o.status === "preparing").length,
    ready: orders.filter((o) => o.status === "ready").length,
  };

  if (authLoading || loading) return <KDSSkeleton />;

  return (
    <Box>
      {/* Header */}
      <Box className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <Box className="flex items-center gap-2">
          <RestaurantIcon color="primary" />
          <Typography variant="h5" fontWeight={700}>
            {t("kds.title")}
          </Typography>
          <Chip
            label={`${orders.length} ${t("kds.activeOrders")}`}
            color="primary"
            size="small"
            variant="outlined"
          />
        </Box>
      </Box>

      {/* Filter tabs */}
      <ToggleButtonGroup
        value={filter}
        exclusive
        onChange={(_, v) => v && setFilter(v)}
        size="small"
        sx={{ mb: 2 }}
      >
        <ToggleButton value="all">
          <Badge badgeContent={counts.all} color="primary" sx={{ "& .MuiBadge-badge": { right: -8, top: -4 } }}>
            {t("kds.all")}
          </Badge>
        </ToggleButton>
        <ToggleButton value="pending">
          <Badge badgeContent={counts.pending} color="warning" sx={{ "& .MuiBadge-badge": { right: -8, top: -4 } }}>
            {t("orders.pending")}
          </Badge>
        </ToggleButton>
        <ToggleButton value="preparing">
          <Badge badgeContent={counts.preparing} color="info" sx={{ "& .MuiBadge-badge": { right: -8, top: -4 } }}>
            {t("orders.preparing")}
          </Badge>
        </ToggleButton>
        <ToggleButton value="ready">
          <Badge badgeContent={counts.ready} color="success" sx={{ "& .MuiBadge-badge": { right: -8, top: -4 } }}>
            {t("orders.ready")}
          </Badge>
        </ToggleButton>
      </ToggleButtonGroup>

      {/* Orders grid */}
      {filteredOrders.length === 0 ? (
        <Box className="flex flex-col items-center justify-center" sx={{ py: 12 }}>
          <RestaurantIcon sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
          <Typography color="text.secondary" variant="h6">
            {t("kds.noOrders")}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {filteredOrders.map((order) => {
            const elapsed = getElapsedMinutes(order.created_at);
            const delayed = isDelayed(order);
            const nextStatus = getNextStatus(order.status);

            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={order.id}>
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    borderTop: 4,
                    borderColor: delayed
                      ? "error.main"
                      : order.status === "ready"
                        ? "success.main"
                        : order.status === "preparing"
                          ? "info.main"
                          : "warning.main",
                    ...(delayed && {
                      animation: "pulse 2s infinite",
                      "@keyframes pulse": {
                        "0%, 100%": { boxShadow: `0 0 0 0 ${theme.palette.error.main}40` },
                        "50%": { boxShadow: `0 0 0 8px ${theme.palette.error.main}00` },
                      },
                    }),
                  }}
                >
                  <CardContent sx={{ flex: 1, pb: 1 }}>
                    {/* Order header */}
                    <Box className="flex items-center justify-between mb-1">
                      <Typography variant="h6" fontWeight={700} sx={{ fontSize: "1.1rem" }}>
                        #{order.order_number}
                      </Typography>
                      <Chip
                        label={getStatusLabel(order.status)}
                        color={getStatusColor(order.status)}
                        size="small"
                      />
                    </Box>

                    {/* Meta info */}
                    <Box className="flex items-center gap-2 flex-wrap mb-2">
                      {order.table_number && (
                        <Chip
                          label={`${t("kds.table")} ${order.table_number}`}
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 600 }}
                        />
                      )}
                      {order.customer_name && (
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {order.customer_name}
                        </Typography>
                      )}
                    </Box>

                    {/* Timer */}
                    <Box className="flex items-center gap-1 mb-2">
                      {delayed ? (
                        <FireIcon color="error" sx={{ fontSize: 18 }} />
                      ) : (
                        <TimerIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                      )}
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        color={delayed ? "error.main" : "text.secondary"}
                      >
                        {elapsed} {t("kds.min")}
                      </Typography>
                    </Box>

                    <Divider sx={{ mb: 1.5 }} />

                    {/* Order items */}
                    <Box sx={{ maxHeight: 200, overflowY: "auto" }}>
                      {order.order_items.map((item) => (
                        <Box key={item.id} sx={{ mb: 1 }}>
                          <Box className="flex items-start justify-between">
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography
                                variant="body2"
                                fontWeight={600}
                                noWrap
                                title={item.product_name}
                              >
                                {item.quantity}x {item.product_name}
                              </Typography>
                              {item.variant_info && (
                                <Typography variant="caption" color="text.secondary">
                                  {item.variant_info}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                          {item.notes && (
                            <Typography
                              variant="caption"
                              color="warning.main"
                              fontWeight={500}
                              sx={{ display: "block", fontStyle: "italic" }}
                            >
                              ⚠ {item.notes}
                            </Typography>
                          )}
                        </Box>
                      ))}
                    </Box>

                    {/* Order notes */}
                    {order.notes && (
                      <>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="caption" color="warning.main" fontWeight={500}>
                          📝 {order.notes}
                        </Typography>
                      </>
                    )}
                  </CardContent>

                  {/* Action button */}
                  {nextStatus && (
                    <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        color={getActionColor(order.status)}
                        size="large"
                        onClick={() => handleStatusChange(order.id, nextStatus)}
                        startIcon={
                          order.status === "ready" ? <ReadyIcon /> : order.status === "preparing" ? <ReadyIcon /> : undefined
                        }
                        sx={{
                          fontWeight: 700,
                          py: 1.2,
                          fontSize: "0.95rem",
                        }}
                      >
                        {getActionLabel(order.status)}
                      </Button>
                    </CardActions>
                  )}
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          variant="filled"
          icon={snackbar.severity === "info" ? <NotifIcon /> : undefined}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
