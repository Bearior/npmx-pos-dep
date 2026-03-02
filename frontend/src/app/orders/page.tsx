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
import api from "@/libs/api";
import StatusBadge from "@/components/ui/StatusBadge";
import LoadingScreen from "@/components/ui/LoadingScreen";
import type { Order, OrderStatus } from "@/types";

function OrderRow({ order, token, onRefresh }: { order: Order; token?: string; onRefresh: () => void }) {
  const [open, setOpen] = useState(false);

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
              Start
            </Button>
          )}
          {order.status === "preparing" && (
            <Button size="small" color="success" onClick={() => updateStatus("ready")}>
              Ready
            </Button>
          )}
          {order.status === "ready" && (
            <Button size="small" color="success" onClick={() => updateStatus("completed")}>
              Complete
            </Button>
          )}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ py: 2, px: 2 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Items
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>Variant</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Unit Price</TableCell>
                    <TableCell align="right">Total</TableCell>
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
                  Subtotal: ฿{Number(order.subtotal).toFixed(2)}
                </Typography>
                {Number(order.discount_amount) > 0 && (
                  <Typography variant="caption" color="success.main">
                    Discount: -฿{Number(order.discount_amount).toFixed(2)}
                  </Typography>
                )}
                <Typography variant="caption">
                  Tax: ฿{Number(order.tax_amount).toFixed(2)}
                </Typography>
              </Box>
              {order.payments && order.payments.length > 0 && (
                <Box className="mt-2">
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Payments
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
  const { session } = useAuth();
  const token = session?.access_token;

  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchOrders = async () => {
    if (!token) return;
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
    fetchOrders();
  }, [token, statusFilter]);

  if (loading) return <LoadingScreen message="Loading orders..." />;

  return (
    <Box>
      <Box className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <Typography variant="h5" fontWeight={700}>
          Orders ({total})
        </Typography>
        <Box className="flex gap-2">
          <TextField
            select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            size="small"
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="all">All Statuses</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="preparing">Preparing</MenuItem>
            <MenuItem value="ready">Ready</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
            <MenuItem value="voided">Voided</MenuItem>
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
                  <TableCell>Order #</TableCell>
                  <TableCell>Table</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((order) => (
                  <OrderRow key={order.id} order={order} token={token} onRefresh={fetchOrders} />
                ))}
                {orders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No orders found</Typography>
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
