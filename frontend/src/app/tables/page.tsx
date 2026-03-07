"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Box, Typography, Card, CardContent, CardActions, Button, Grid, IconButton,
  Chip, TextField, Switch, FormControlLabel, Snackbar, Alert, Dialog,
  DialogTitle, DialogContent, DialogActions as MuiDialogActions, Table,
  TableHead, TableRow, TableCell, TableBody, Tooltip,
} from "@mui/material";
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  QrCode2 as QrCodeIcon, Receipt as ReceiptIcon, Download as DownloadIcon,
  EventSeat as SeatIcon, Payment as PaymentIcon,
} from "@mui/icons-material";
import { QRCodeCanvas } from "qrcode.react";
import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import api from "@/libs/api";
import Modal from "@/components/ui/Modal";
import LoadingScreen from "@/components/ui/LoadingScreen";
import TablePaymentDialog from "./TablePaymentDialog";
import type { RestaurantTable, Order } from "@/types";

const PUBLIC_URL = typeof window !== "undefined" ? window.location.origin : "";

export default function TablesPage() {
  const { session, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const token = session?.access_token;

  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ table_number: "", label: "", seats: "4", is_active: true });

  const [qrTable, setQrTable] = useState<RestaurantTable | null>(null);
  const [ordersModal, setOrdersModal] = useState<{ table: RestaurantTable; orders: Order[] } | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" });

  const qrRef = useRef<HTMLCanvasElement>(null);

  const fetchTables = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const data = await api.get<RestaurantTable[]>("/tables", token);
      setTables(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (authLoading) return;
    fetchTables();
  }, [token, authLoading, fetchTables]);

  const openCreateForm = () => {
    setEditingTable(null);
    setForm({ table_number: "", label: "", seats: "4", is_active: true });
    setFormOpen(true);
  };

  const openEditForm = (table: RestaurantTable) => {
    setEditingTable(table);
    setForm({
      table_number: table.table_number,
      label: table.label || "",
      seats: String(table.seats),
      is_active: table.is_active,
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const payload = {
        table_number: form.table_number,
        label: form.label || null,
        seats: parseInt(form.seats) || 4,
        is_active: form.is_active,
      };
      if (editingTable) {
        await api.put(`/tables/${editingTable.id}`, payload, token);
        setSnackbar({ open: true, message: t("tables.updated"), severity: "success" });
      } else {
        await api.post("/tables", payload, token);
        setSnackbar({ open: true, message: t("tables.created"), severity: "success" });
      }
      setFormOpen(false);
      fetchTables();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed";
      setSnackbar({ open: true, message, severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (table: RestaurantTable) => {
    if (!token || !confirm(t("tables.deleteConfirm"))) return;
    try {
      await api.delete(`/tables/${table.id}`, token);
      setSnackbar({ open: true, message: t("tables.deleted"), severity: "success" });
      fetchTables();
    } catch {
      // ignore
    }
  };

  const handleViewOrders = async (table: RestaurantTable) => {
    if (!token) return;
    try {
      const data = await api.get<{ table: RestaurantTable; orders: Order[] }>(`/tables/${table.id}/orders`, token);
      setOrdersModal({ table: data.table, orders: data.orders });
    } catch {
      // ignore
    }
  };

  const handleOpenPayment = () => {
    if (!ordersModal) return;
    setPaymentOpen(true);
  };

  const handlePaymentComplete = (message: string) => {
    setPaymentOpen(false);
    setOrdersModal(null);
    setSnackbar({ open: true, message, severity: "success" });
    fetchTables();
  };

  const downloadQR = () => {
    const canvas = qrRef.current;
    if (!canvas || !qrTable) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `table-${qrTable.table_number}-qr.png`;
    a.click();
  };

  if (authLoading || loading) return <LoadingScreen message={t("tables.loading")} />;

  return (
    <Box>
      <Box className="flex items-center justify-between mb-4">
        <Typography variant="h5" fontWeight={700}>
          {t("tables.title")}
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateForm}>
          {t("tables.addTable")}
        </Button>
      </Box>

      {tables.length === 0 ? (
        <Typography color="text.secondary" textAlign="center" py={8}>
          {t("tables.noTables")}
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {tables.map((table) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={table.id}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  opacity: table.is_active ? 1 : 0.6,
                  border: table.is_active ? "2px solid" : "1px solid",
                  borderColor: table.is_active ? "primary.main" : "divider",
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box className="flex items-center justify-between mb-2">
                    <Typography variant="h4" fontWeight={800} color="primary.main">
                      {table.table_number}
                    </Typography>
                    <Chip
                      label={table.is_active ? t("tables.active") : t("tables.inactive")}
                      color={table.is_active ? "success" : "default"}
                      size="small"
                    />
                  </Box>
                  {table.label && (
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      {table.label}
                    </Typography>
                  )}
                  <Box className="flex items-center gap-1" color="text.secondary">
                    <SeatIcon fontSize="small" />
                    <Typography variant="body2">{table.seats} {t("tables.seats")}</Typography>
                  </Box>
                </CardContent>
                <CardActions sx={{ justifyContent: "space-between", px: 2, pb: 2 }}>
                  <Box>
                    <Tooltip title={t("tables.qrCode")}>
                      <IconButton size="small" onClick={() => setQrTable(table)}>
                        <QrCodeIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t("tables.viewOrders")}>
                      <IconButton size="small" onClick={() => handleViewOrders(table)}>
                        <ReceiptIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Box>
                    <Tooltip title={t("tables.editTable")}>
                      <IconButton size="small" onClick={() => openEditForm(table)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t("tables.deleteTable")}>
                      <IconButton size="small" color="error" onClick={() => handleDelete(table)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create / Edit Table Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingTable ? t("tables.editTable") : t("tables.addTable")}
        actions={
          <>
            <Button onClick={() => setFormOpen(false)}>{t("common.cancel")}</Button>
            <Button variant="contained" onClick={handleSave} disabled={saving || !form.table_number}>
              {saving ? "..." : editingTable ? t("common.save") : t("common.create")}
            </Button>
          </>
        }
      >
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <TextField
              label={t("tables.tableNumber")}
              value={form.table_number}
              onChange={(e) => setForm({ ...form, table_number: e.target.value })}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label={t("tables.label")}
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              fullWidth
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label={t("tables.seats")}
              type="number"
              value={form.seats}
              onChange={(e) => setForm({ ...form, seats: e.target.value })}
              fullWidth
              inputProps={{ min: 1 }}
            />
          </Grid>
          <Grid item xs={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                />
              }
              label={t("tables.active")}
              sx={{ mt: 1 }}
            />
          </Grid>
        </Grid>
      </Modal>

      {/* QR Code Modal */}
      <Dialog open={!!qrTable} onClose={() => setQrTable(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{t("tables.qrCode")} — {qrTable?.table_number}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, pt: 2 }}>
          {qrTable && (
            <>
              <QRCodeCanvas
                ref={qrRef}
                value={`${PUBLIC_URL}/order/${qrTable.table_number}`}
                size={256}
                level="H"
                includeMargin
              />
              <Typography variant="body2" color="text.secondary" textAlign="center">
                {PUBLIC_URL}/order/{qrTable.table_number}
              </Typography>
            </>
          )}
        </DialogContent>
        <MuiDialogActions>
          <Button onClick={() => setQrTable(null)}>{t("common.close")}</Button>
          <Button variant="contained" startIcon={<DownloadIcon />} onClick={downloadQR}>
            {t("tables.downloadQr")}
          </Button>
        </MuiDialogActions>
      </Dialog>

      {/* Orders Modal */}
      <Dialog open={!!ordersModal} onClose={() => setOrdersModal(null)} maxWidth="md" fullWidth>
        <DialogTitle>
          {t("tables.orders")} — {ordersModal?.table.table_number}
          {ordersModal?.table.label && ` (${ordersModal.table.label})`}
        </DialogTitle>
        <DialogContent>
          {ordersModal && ordersModal.orders.length === 0 ? (
            <Typography color="text.secondary" py={4} textAlign="center">
              {t("tables.noOrders")}
            </Typography>
          ) : (
            <>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t("cart.orderNo")}</TableCell>
                    <TableCell>{t("inv.status")}</TableCell>
                    <TableCell>{t("order.items")}</TableCell>
                    <TableCell align="right">{t("cart.total")}</TableCell>
                    <TableCell>{t("order.orderNumber")}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ordersModal?.orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Typography fontFamily="monospace" fontWeight={600}>
                          {order.order_number}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={order.status} size="small" color={
                          order.status === "completed" ? "success" :
                          order.status === "served" ? "success" :
                          order.status === "pending" ? "warning" :
                          order.status === "preparing" ? "info" :
                          order.status === "ready" ? "primary" : "default"
                        } />
                      </TableCell>
                      <TableCell>
                        {order.order_items?.map((item) => (
                          <Typography key={item.id} variant="body2">
                            {item.product_name} x{item.quantity}
                          </Typography>
                        ))}
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight={600}>฿{order.total.toFixed(2)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(order.created_at).toLocaleTimeString()}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Box sx={{ mt: 2, textAlign: "right" }}>
                <Typography variant="h6" fontWeight={700}>
                  {t("tables.totalBill")}: ฿
                  {ordersModal?.orders
                    .filter((o) => o.status !== "cancelled" && o.status !== "voided")
                    .reduce((sum, o) => sum + o.total, 0)
                    .toFixed(2)}
                </Typography>
              </Box>
            </>
          )}
        </DialogContent>
        <MuiDialogActions>
          <Button onClick={() => setOrdersModal(null)}>{t("common.close")}</Button>
          {ordersModal && ordersModal.orders.length > 0 && (
            <Button
              variant="contained"
              color="success"
              startIcon={<PaymentIcon />}
              onClick={handleOpenPayment}
            >
              Pay & Complete — ฿
              {ordersModal.orders
                .filter((o) => o.status !== "cancelled" && o.status !== "voided")
                .reduce((sum, o) => sum + o.total, 0)
                .toFixed(2)}
            </Button>
          )}
        </MuiDialogActions>
      </Dialog>

      {/* Table Payment Dialog */}
      {ordersModal && token && (
        <TablePaymentDialog
          open={paymentOpen}
          onClose={() => setPaymentOpen(false)}
          table={ordersModal.table}
          orders={ordersModal.orders}
          total={ordersModal.orders
            .filter((o) => o.status !== "cancelled" && o.status !== "voided")
            .reduce((sum, o) => sum + o.total, 0)}
          token={token}
          onComplete={handlePaymentComplete}
        />
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
