"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  TextField,
  MenuItem,
  Chip,
  IconButton,
  Collapse,
  Grid,
} from "@mui/material";
import {
  KeyboardArrowDown,
  KeyboardArrowUp,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import api from "@/libs/api";
import StatusBadge from "@/components/ui/StatusBadge";
import LoadingScreen from "@/components/ui/LoadingScreen";
import type { Order, OrderStatus } from "@/types";

function OrderRow({ order, token, onRefresh }: { order: Order; token?: string; onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();

  const updateStatus = async (status: OrderStatus) => {
    if (!token) return;
    try {
      await api.put(`/orders/${order.id}/status`, { status }, token);
      onRefresh();
    } catch (err) {
      console.error("Status update failed:", err);
    }
  };

  return (
    <>
      <TableRow sx={{ "& > *": { borderBottom: "unset" } }}>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Typography variant="body2" fontWeight={600}>
            {order.order_number}
          </Typography>
        </TableCell>
        <TableCell>{order.table_number || "—"}</TableCell>
        <TableCell>{order.customer_name || "—"}</TableCell>
        <TableCell>
          <StatusBadge status={order.status} />
        </TableCell>
        <TableCell align="right">
          <Typography fontWeight={600} color="primary">
            ฿{Number(order.total).toFixed(2)}
          </Typography>
        </TableCell>
        <TableCell>{new Date(order.created_at).toLocaleString()}</TableCell>
        <TableCell>
          {order.status === "pending" && (
            <Button size="small" onClick={() => updateStatus("preparing")}>
              {t("orders.start")}
            </Button>
          )}
          {order.status === "preparing" && (
            <Button size="small" color="success" onClick={() => updateStatus("ready")}>
              {t("orders.ready")}
            </Button>
          )}
          {order.status === "ready" && (
            <Button size="small" color="success" onClick={() => updateStatus("completed")}>
              {t("orders.complete")}
            </Button>
          )}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ py: 2, px: 2 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                {t("orders.items")}
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t("orders.product")}</TableCell>
                    <TableCell>{t("orders.variant")}</TableCell>
                    <TableCell align="right">{t("orders.qty")}</TableCell>
                    <TableCell align="right">{t("orders.unitPrice")}</TableCell>
                    <TableCell align="right">{t("orders.total")}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(order.order_items || []).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.product_name}</TableCell>
                      <TableCell>{item.variant_info || "—"}</TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell align="right">฿{Number(item.unit_price).toFixed(2)}</TableCell>
                      <TableCell align="right">
                        ฿{(Number(item.unit_price) * item.quantity).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Box className="flex gap-4 mt-2">
                <Typography variant="caption">
                  {t("orders.subtotal")}: ฿{Number(order.subtotal).toFixed(2)}
                </Typography>
                {Number(order.discount_amount) > 0 && (
                  <Typography variant="caption" color="success.main">
                    {t("orders.discount")}: -฿{Number(order.discount_amount).toFixed(2)}
                  </Typography>
                )}
                <Typography variant="caption">
                  {t("orders.tax")}: ฿{Number(order.tax_amount).toFixed(2)}
                </Typography>
              </Box>
              {order.payments && order.payments.length > 0 && (
                <Box className="mt-2">
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    {t("orders.payments")}
                  </Typography>
                  {order.payments.map((p) => (
                    <Chip
                      key={p.id}
                      label={`${p.method.toUpperCase()}: ฿${Number(p.amount).toFixed(2)}`}
                      size="small"
                      variant="outlined"
                      sx={{ mr: 1 }}
                    />
                  ))}
                </Box>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export default function OrdersPage() {
  const { session, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const token = session?.access_token;

  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchOrders = async () => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: "50" };
      if (statusFilter !== "all") params.status = statusFilter;

      const res = await api.get<{ data: Order[]; total: number }>("/orders", token, params);
      setOrders(res.data);
      setTotal(res.total);
    } catch (err) {
      console.error("Orders load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    fetchOrders();
  }, [token, statusFilter, authLoading]);

  if (authLoading || loading) return <LoadingScreen message={t("orders.loading")} />;

  return (
    <Box>
      <Box className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <Typography variant="h5" fontWeight={700}>
          {t("orders.title")} ({total})
        </Typography>
        <Box className="flex gap-2">
          <TextField
            select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            size="small"
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="all">{t("orders.allStatuses")}</MenuItem>
            <MenuItem value="pending">{t("orders.pending")}</MenuItem>
            <MenuItem value="preparing">{t("orders.preparing")}</MenuItem>
            <MenuItem value="ready">{t("orders.ready")}</MenuItem>
            <MenuItem value="completed">{t("orders.completed")}</MenuItem>
            <MenuItem value="cancelled">{t("orders.cancelled")}</MenuItem>
            <MenuItem value="voided">{t("orders.voided")}</MenuItem>
          </TextField>
          <IconButton onClick={fetchOrders} title="Refresh">
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell width={50} />
                  <TableCell>{t("orders.orderNo")}</TableCell>
                  <TableCell>{t("orders.table")}</TableCell>
                  <TableCell>{t("orders.customer")}</TableCell>
                  <TableCell>{t("orders.status")}</TableCell>
                  <TableCell align="right">{t("orders.total")}</TableCell>
                  <TableCell>{t("orders.created")}</TableCell>
                  <TableCell>{t("orders.actions")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((order) => (
                  <OrderRow key={order.id} order={order} token={token} onRefresh={fetchOrders} />
                ))}
                {orders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">{t("orders.noOrders")}</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
