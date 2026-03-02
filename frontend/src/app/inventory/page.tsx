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
  Chip,
  Button,
  TextField,
  MenuItem,
  Alert,
  Snackbar,
  Grid,
} from "@mui/material";
import {
  Warning as WarningIcon,
  Add as AddIcon,
  Inventory2 as InvIcon,
} from "@mui/icons-material";
import { useAuth } from "@/providers/AuthProvider";
import api from "@/libs/api";
import Modal from "@/components/ui/Modal";
import LoadingScreen from "@/components/ui/LoadingScreen";
import type { Product, InventoryTransaction } from "@/types";

export default function InventoryPage() {
  const { session } = useAuth();
  const token = session?.access_token;

  const [products, setProducts] = useState<Product[]>([]);
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Adjust dialog
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState("");
  const [adjustType, setAdjustType] = useState("restock");
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  // History dialog
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyProduct, setHistoryProduct] = useState<string | null>(null);
  const [history, setHistory] = useState<InventoryTransaction[]>([]);

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" });

  const fetchData = async () => {
    if (!token) return;
    try {
      const [inv, low] = await Promise.all([
        api.get<Product[]>("/inventory", token, { limit: "200" }),
        api.get<Product[]>("/inventory/low-stock", token),
      ]);
      setProducts(inv);
      setLowStock(low);
    } catch (err) {
      console.error("Inventory load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleAdjust = async () => {
    if (!token || !adjustProduct || !adjustQty) return;
    setAdjusting(true);
    try {
      await api.post(
        "/inventory/adjust",
        {
          product_id: adjustProduct,
          quantity: parseInt(adjustQty),
          type: adjustType,
          reason: adjustReason || undefined,
        },
        token
      );
      setSnackbar({ open: true, message: "Stock adjusted successfully", severity: "success" });
      setAdjustOpen(false);
      setAdjustProduct("");
      setAdjustQty("");
      setAdjustReason("");
      fetchData();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Adjustment failed";
      setSnackbar({ open: true, message, severity: "error" });
    } finally {
      setAdjusting(false);
    }
  };

  const openHistory = async (productId: string) => {
    if (!token) return;
    setHistoryProduct(productId);
    setHistoryOpen(true);
    const data = await api.get<InventoryTransaction[]>(`/inventory/${productId}/history`, token);
    setHistory(data);
  };

  if (loading) return <LoadingScreen message="Loading inventory..." />;

  return (
    <Box>
      <Box className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <Typography variant="h5" fontWeight={700}>
          Inventory Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setAdjustOpen(true)}
        >
          Adjust Stock
        </Button>
      </Box>

      {/* Low stock alerts */}
      {lowStock.length > 0 && (
        <Alert severity="warning" icon={<WarningIcon />} className="mb-4">
          {lowStock.length} product(s) are at or below their low stock threshold.
        </Alert>
      )}

      {/* Inventory table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell>SKU</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell align="right">In Stock</TableCell>
                  <TableCell align="right">Threshold</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((product) => {
                  const isLow = product.stock_quantity <= product.low_stock_threshold;
                  const isOut = product.stock_quantity === 0;
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {product.name}
                        </Typography>
                      </TableCell>
                      <TableCell>{product.sku || "—"}</TableCell>
                      <TableCell>{product.categories?.name || "—"}</TableCell>
                      <TableCell align="right">
                        <Typography fontWeight={600} color={isOut ? "error" : isLow ? "warning.main" : "text.primary"}>
                          {product.stock_quantity}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{product.low_stock_threshold}</TableCell>
                      <TableCell>
                        <Chip
                          label={isOut ? "Out of Stock" : isLow ? "Low Stock" : "In Stock"}
                          color={isOut ? "error" : isLow ? "warning" : "success"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Button size="small" onClick={() => openHistory(product.id)}>
                          History
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {products.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <InvIcon sx={{ fontSize: 40, opacity: 0.2, mb: 1 }} />
                      <Typography color="text.secondary">No inventory-tracked products</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </CardContent>
      </Card>

      {/* Adjust Stock Modal */}
      <Modal
        open={adjustOpen}
        onClose={() => setAdjustOpen(false)}
        title="Adjust Stock"
        actions={
          <>
            <Button onClick={() => setAdjustOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleAdjust} disabled={adjusting || !adjustProduct || !adjustQty}>
              {adjusting ? "Saving..." : "Save"}
            </Button>
          </>
        }
      >
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              select
              label="Product"
              value={adjustProduct}
              onChange={(e) => setAdjustProduct(e.target.value)}
              fullWidth
            >
              {products.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name} (current: {p.stock_quantity})
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField
              select
              label="Type"
              value={adjustType}
              onChange={(e) => setAdjustType(e.target.value)}
              fullWidth
            >
              <MenuItem value="restock">Restock</MenuItem>
              <MenuItem value="adjustment">Adjustment</MenuItem>
              <MenuItem value="waste">Waste</MenuItem>
              <MenuItem value="return">Return</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Quantity"
              type="number"
              value={adjustQty}
              onChange={(e) => setAdjustQty(e.target.value)}
              fullWidth
              inputProps={{ min: 1 }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Reason (optional)"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              fullWidth
              multiline
              rows={2}
            />
          </Grid>
        </Grid>
      </Modal>

      {/* History Modal */}
      <Modal
        open={historyOpen}
        onClose={() => { setHistoryOpen(false); setHistory([]); }}
        title="Stock History"
        maxWidth="md"
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="right">Qty</TableCell>
              <TableCell align="right">Before</TableCell>
              <TableCell align="right">After</TableCell>
              <TableCell>By</TableCell>
              <TableCell>Reason</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {history.map((txn) => (
              <TableRow key={txn.id}>
                <TableCell>{new Date(txn.created_at).toLocaleString()}</TableCell>
                <TableCell>
                  <Chip label={txn.type} size="small" variant="outlined" />
                </TableCell>
                <TableCell align="right">{txn.quantity}</TableCell>
                <TableCell align="right">{txn.previous_quantity}</TableCell>
                <TableCell align="right">{txn.new_quantity}</TableCell>
                <TableCell>{txn.profiles?.full_name || "—"}</TableCell>
                <TableCell>{txn.reason || "—"}</TableCell>
              </TableRow>
            ))}
            {history.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  No history records
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Modal>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
