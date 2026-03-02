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
import api from "@/libs/api";
import Modal from "@/components/ui/Modal";
import LoadingScreen from "@/components/ui/LoadingScreen";
import type { Discount } from "@/types";

export default function DiscountsPage() {
  const { session } = useAuth();
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
    if (!token) return;
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
    fetchDiscounts();
  }, [token]);

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
      setSnackbar({ open: true, message: "Discount created!", severity: "success" });
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
    if (!token || !confirm("Delete this discount?")) return;
    try {
      await api.delete(`/discounts/${id}`, token);
      fetchDiscounts();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <LoadingScreen message="Loading discounts..." />;

  return (
    <Box>
      <Box className="flex items-center justify-between mb-4">
        <Typography variant="h5" fontWeight={700}>
          Discounts & Promo Codes
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setFormOpen(true)}>
          New Discount
        </Button>
      </Box>

      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Value</TableCell>
                  <TableCell align="right">Used</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Expires</TableCell>
                  <TableCell>Actions</TableCell>
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
                        label={d.is_active ? "Active" : "Inactive"}
                        color={d.is_active ? "success" : "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {d.expires_at ? new Date(d.expires_at).toLocaleDateString() : "Never"}
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
        title="New Discount"
        actions={
          <>
            <Button onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSave} disabled={saving || !form.code || !form.value}>
              {saving ? "Creating..." : "Create"}
            </Button>
          </>
        }
      >
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <TextField
              label="Code"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              fullWidth
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              select
              label="Type"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as "percentage" | "fixed" })}
              fullWidth
            >
              <MenuItem value="percentage">Percentage (%)</MenuItem>
              <MenuItem value="fixed">Fixed Amount (฿)</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Value"
              type="number"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Max Discount (฿)"
              type="number"
              value={form.max_discount}
              onChange={(e) => setForm({ ...form, max_discount: e.target.value })}
              fullWidth
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Min Order Amount (฿)"
              type="number"
              value={form.min_order_amount}
              onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })}
              fullWidth
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Max Uses"
              type="number"
              value={form.max_uses}
              onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
              fullWidth
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Expires"
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
