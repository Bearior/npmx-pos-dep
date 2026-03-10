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
  Chip,
  TextField,
  MenuItem,
  Grid,
  IconButton,
  Snackbar,
  Alert,
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from "@mui/icons-material";
import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import api from "@/libs/api";
import Modal from "@/components/ui/Modal";
import { DiscountsSkeleton } from "@/components/ui/Skeletons";
import type { Discount } from "@/types";

export default function DiscountsPage() {
  const { session, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const token = session?.access_token;

  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form
  const [form, setForm] = useState({
    code: "",
    name: "",
    type: "percentage" as "percentage" | "fixed",
    value: "",
    max_discount: "",
    min_order_amount: "",
    max_uses: "",
    expires_at: "",
  });

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" });

  const fetchDiscounts = async () => {
    if (!token) { setLoading(false); return; }
    try {
      const data = await api.get<Discount[]>("/discounts", token);
      setDiscounts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    fetchDiscounts();
  }, [token, authLoading]);

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    try {
      await api.post(
        "/discounts",
        {
          code: form.code,
          name: form.name || form.code,
          type: form.type,
          value: parseFloat(form.value),
          max_discount: form.max_discount ? parseFloat(form.max_discount) : undefined,
          min_order_amount: form.min_order_amount ? parseFloat(form.min_order_amount) : undefined,
          max_uses: form.max_uses ? parseInt(form.max_uses) : undefined,
          expires_at: form.expires_at || undefined,
        },
        token
      );
      setSnackbar({ open: true, message: t("discounts.created"), severity: "success" });
      setFormOpen(false);
      setForm({ code: "", name: "", type: "percentage", value: "", max_discount: "", min_order_amount: "", max_uses: "", expires_at: "" });
      fetchDiscounts();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create";
      setSnackbar({ open: true, message, severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token || !confirm(t("discounts.deleteConfirm"))) return;
    try {
      await api.delete(`/discounts/${id}`, token);
      fetchDiscounts();
    } catch (err) {
      console.error(err);
    }
  };

  if (authLoading || loading) return <DiscountsSkeleton />;

  return (
    <Box>
      <Box className="flex items-center justify-between mb-4">
        <Typography variant="h5" fontWeight={700}>
          {t("discounts.title")}
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setFormOpen(true)}>
          {t("discounts.newDiscount")}
        </Button>
      </Box>

      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t("discounts.code")}</TableCell>
                  <TableCell>{t("discounts.name")}</TableCell>
                  <TableCell>{t("discounts.type")}</TableCell>
                  <TableCell align="right">{t("discounts.value")}</TableCell>
                  <TableCell align="right">{t("discounts.used")}</TableCell>
                  <TableCell>{t("discounts.status")}</TableCell>
                  <TableCell>{t("discounts.expires")}</TableCell>
                  <TableCell>{t("discounts.actions")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {discounts.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <Typography fontWeight={600} fontFamily="monospace">
                        {d.code}
                      </Typography>
                    </TableCell>
                    <TableCell>{d.name}</TableCell>
                    <TableCell>
                      <Chip
                        label={d.type === "percentage" ? "%" : "฿"}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      {d.type === "percentage" ? `${d.value}%` : `฿${d.value}`}
                    </TableCell>
                    <TableCell align="right">
                      {d.times_used}{d.max_uses ? `/${d.max_uses}` : ""}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={d.is_active ? t("discounts.active") : t("discounts.inactive")}
                        color={d.is_active ? "success" : "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {d.expires_at ? new Date(d.expires_at).toLocaleDateString() : t("discounts.never")}
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" color="error" onClick={() => handleDelete(d.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={t("discounts.newDiscount")}
        actions={
          <>
            <Button onClick={() => setFormOpen(false)}>{t("common.cancel")}</Button>
            <Button variant="contained" onClick={handleSave} disabled={saving || !form.code || !form.value}>
              {saving ? t("discounts.creating") : t("common.create")}
            </Button>
          </>
        }
      >
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <TextField
              label={t("discounts.code")}
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label={t("discounts.name")}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              fullWidth
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              select
              label={t("discounts.type")}
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as "percentage" | "fixed" })}
              fullWidth
            >
              <MenuItem value="percentage">{t("discounts.percentage")}</MenuItem>
              <MenuItem value="fixed">{t("discounts.fixedAmount")}</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField
              label={t("discounts.value")}
              type="number"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label={t("discounts.maxDiscount")}
              type="number"
              value={form.max_discount}
              onChange={(e) => setForm({ ...form, max_discount: e.target.value })}
              fullWidth
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label={t("discounts.minOrderAmount")}
              type="number"
              value={form.min_order_amount}
              onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })}
              fullWidth
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label={t("discounts.maxUses")}
              type="number"
              value={form.max_uses}
              onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
              fullWidth
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label={t("discounts.expires")}
              type="date"
              value={form.expires_at}
              onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </Modal>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
