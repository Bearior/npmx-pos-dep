"use client";

import React, { useEffect, useState, useMemo } from "react";
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
  InputAdornment,
  Switch,
  FormControlLabel,
  TableSortLabel,
  IconButton,
} from "@mui/material";
import {
  Warning as WarningIcon,
  Add as AddIcon,
  Inventory2 as InvIcon,
  Search as SearchIcon,
  SwapVert as AdjustIcon,
  History as HistoryIcon,
  Edit as EditIcon,
  CloudUpload as UploadIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import api from "@/libs/api";
import Modal from "@/components/ui/Modal";
import LoadingScreen from "@/components/ui/LoadingScreen";
import type { Product, Category, InventoryTransaction } from "@/types";

const emptyProductForm = {
  name: "",
  description: "",
  price: "",
  cost_price: "",
  category_id: "",
  sku: "",
  image_url: "",
  is_active: true,
  track_inventory: true,
  stock_quantity: "",
  low_stock_threshold: "10",
};

export default function InventoryPage() {
  const { session } = useAuth();
  const { t } = useLanguage();
  const token = session?.access_token;

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Search & Sort
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<"name" | "stock_quantity" | "price" | "cost_price">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Add Product dialog
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [savingProduct, setSavingProduct] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  // Edit Product dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editProductId, setEditProductId] = useState("");
  const [editForm, setEditForm] = useState(emptyProductForm);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editImageUploading, setEditImageUploading] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Adjust dialog
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState("");
  const [adjustProductName, setAdjustProductName] = useState("");
  const [adjustCurrentStock, setAdjustCurrentStock] = useState(0);
  const [adjustThreshold, setAdjustThreshold] = useState(0);
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
      const [inv, low, cats] = await Promise.all([
        api.get<Product[]>("/inventory", token, { limit: "200" }),
        api.get<{ count: number }>("/inventory/low-stock", token),
        api.get<Category[]>("/categories", token),
      ]);
      setProducts(inv);
      setLowStockCount(low.count);
      setCategories(cats);
    } catch (err) {
      console.error("Inventory load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // ---- Add New Product ----
  const uploadImage = async (file: File, target: "add" | "edit") => {
    if (!token) return;
    const setUploading = target === "add" ? setImageUploading : setEditImageUploading;
    setUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await api.post<{ url: string }>("/products/upload-image", { image: base64 }, token);
      if (target === "add") {
        setProductForm((f) => ({ ...f, image_url: res.url }));
      } else {
        setEditForm((f) => ({ ...f, image_url: res.url }));
      }
      setSnackbar({ open: true, message: "Image uploaded!", severity: "success" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setSnackbar({ open: true, message: msg, severity: "error" });
    } finally {
      setUploading(false);
    }
  };

  const handleAddProduct = async () => {
    if (!token || !productForm.name || !productForm.price) return;
    setSavingProduct(true);
    try {
      await api.post(
        "/products",
        {
          name: productForm.name,
          description: productForm.description || undefined,
          price: parseFloat(productForm.price),
          cost_price: productForm.cost_price ? parseFloat(productForm.cost_price) : undefined,
          category_id: productForm.category_id || undefined,
          sku: productForm.sku || undefined,
          image_url: productForm.image_url || undefined,
          is_active: productForm.is_active,
          track_inventory: productForm.track_inventory,
          stock_quantity: productForm.stock_quantity ? parseInt(productForm.stock_quantity) : 0,
          low_stock_threshold: productForm.low_stock_threshold ? parseInt(productForm.low_stock_threshold) : 10,
        },
        token
      );
      setSnackbar({ open: true, message: "Product created successfully!", severity: "success" });
      setProductFormOpen(false);
      setProductForm(emptyProductForm);
      fetchData();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create product";
      setSnackbar({ open: true, message, severity: "error" });
    } finally {
      setSavingProduct(false);
    }
  };

  // ---- Adjust Stock ----
  const openAdjustForProduct = (product: Product) => {
    setAdjustProduct(product.id);
    setAdjustProductName(product.name);
    setAdjustCurrentStock(product.stock_quantity);
    setAdjustThreshold(product.low_stock_threshold);
    setAdjustType("restock");
    setAdjustQty("");
    setAdjustReason("");
    setAdjustOpen(true);
  };

  // ---- Edit Product Info ----
  const openEditProduct = (product: Product) => {
    setEditProductId(product.id);
    setEditForm({
      name: product.name,
      description: product.description || "",
      price: String(product.price ?? ""),
      cost_price: product.cost_price ? String(product.cost_price) : "",
      category_id: product.category_id || "",
      sku: product.sku || "",
      image_url: product.image_url || "",
      is_active: product.is_active,
      track_inventory: product.track_inventory,
      stock_quantity: "",
      low_stock_threshold: String(product.low_stock_threshold ?? "10"),
    });
    setEditOpen(true);
  };

  const handleEditProduct = async () => {
    if (!token || !editProductId || !editForm.name || !editForm.price) return;
    setSavingEdit(true);
    try {
      await api.put(
        `/inventory/${editProductId}`,
        {
          name: editForm.name,
          description: editForm.description || null,
          price: parseFloat(editForm.price),
          cost_price: editForm.cost_price ? parseFloat(editForm.cost_price) : null,
          category_id: editForm.category_id || null,
          sku: editForm.sku || null,
          image_url: editForm.image_url || null,
          is_active: editForm.is_active,
          track_inventory: editForm.track_inventory,
          low_stock_threshold: editForm.low_stock_threshold ? parseInt(editForm.low_stock_threshold) : 10,
        },
        token
      );
      setSnackbar({ open: true, message: t("inv.productUpdated"), severity: "success" });
      setEditOpen(false);
      fetchData();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Update failed";
      setSnackbar({ open: true, message, severity: "error" });
    } finally {
      setSavingEdit(false);
    }
  };

  // ---- Delete Product ----
  const handleDeleteProduct = async () => {
    if (!token || !editProductId) return;
    setDeletingProduct(true);
    try {
      await api.delete(`/products/${editProductId}`, token);
      setSnackbar({ open: true, message: t("inv.productDeleted"), severity: "success" });
      setDeleteConfirmOpen(false);
      setEditOpen(false);
      fetchData();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Delete failed";
      setSnackbar({ open: true, message, severity: "error" });
    } finally {
      setDeletingProduct(false);
    }
  };

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
      setAdjustProductName("");
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
    try {
      const data = await api.get<InventoryTransaction[]>(`/inventory/${productId}/history`, token);
      setHistory(data);
    } catch {
      setHistory([]);
    }
  };

  // ---- Toggle visible on POS ----
  const toggleVisibleOnPos = async (product: Product) => {
    if (!token) return;
    const newVal = !(product.visible_on_pos ?? true);
    try {
      await api.put(`/inventory/${product.id}`, { visible_on_pos: newVal }, token);
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, visible_on_pos: newVal } : p))
      );
      setSnackbar({
        open: true,
        message: newVal ? t("inv.showOnPos") : t("inv.hideFromPos"),
        severity: "success",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update visibility";
      setSnackbar({ open: true, message, severity: "error" });
    }
  };

  // Search & Sort logic
  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const filteredProducts = useMemo(() => {
    let list = [...products];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.sku && p.sku.toLowerCase().includes(q)) ||
          (p.categories?.name && p.categories.name.toLowerCase().includes(q))
      );
    }
    list.sort((a, b) => {
      const valA = a[sortField] ?? 0;
      const valB = b[sortField] ?? 0;
      if (typeof valA === "string" && typeof valB === "string") {
        return sortDir === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortDir === "asc" ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });
    return list;
  }, [products, search, sortField, sortDir]);

  if (loading) return <LoadingScreen message="Loading inventory..." />;

  return (
    <Box>
      <Box className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <Typography variant="h5" fontWeight={700}>
          {t("inv.title")}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setProductFormOpen(true)}
        >
          {t("inv.addProduct")}
        </Button>
      </Box>

      {/* Low stock alerts */}
      {lowStockCount > 0 && (
        <Alert severity="warning" icon={<WarningIcon />} className="mb-4">
          {lowStockCount} {t("inv.lowStockAlert")}
        </Alert>
      )}

      {/* Search */}
      <Card className="mb-3">
        <CardContent sx={{ py: 1.5 }}>
          <TextField
            placeholder={t("inv.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </CardContent>
      </Card>

      {/* Inventory table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "grey.100" }}>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === "name"}
                      direction={sortField === "name" ? sortDir : "asc"}
                      onClick={() => handleSort("name")}
                    >
                      {t("inv.product")}
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>{t("inv.sku")}</TableCell>
                  <TableCell>{t("inv.category")}</TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={sortField === "price"}
                      direction={sortField === "price" ? sortDir : "asc"}
                      onClick={() => handleSort("price")}
                    >
                      {t("inv.price")}
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={sortField === "cost_price"}
                      direction={sortField === "cost_price" ? sortDir : "asc"}
                      onClick={() => handleSort("cost_price")}
                    >
                      {t("inv.cost")}
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={sortField === "stock_quantity"}
                      direction={sortField === "stock_quantity" ? sortDir : "asc"}
                      onClick={() => handleSort("stock_quantity")}
                    >
                      {t("inv.inStock")}
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">{t("inv.threshold")}</TableCell>
                  <TableCell>{t("inv.status")}</TableCell>
                  <TableCell align="center">{t("inv.visibleOnPos")}</TableCell>
                  <TableCell>{t("inv.actions")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProducts.map((product) => {
                  const isLow = product.stock_quantity <= product.low_stock_threshold;
                  const isOut = product.stock_quantity === 0;
                  const isVisibleOnPos = product.visible_on_pos ?? true;
                  return (
                    <TableRow key={product.id} hover sx={!isVisibleOnPos ? { opacity: 0.6 } : undefined}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {product.name}
                        </Typography>
                      </TableCell>
                      <TableCell>{product.sku || "—"}</TableCell>
                      <TableCell>{product.categories?.name || "—"}</TableCell>
                      <TableCell align="right">฿{(product.price ?? 0).toLocaleString()}</TableCell>
                      <TableCell align="right">
                        {product.cost_price ? `฿${product.cost_price.toLocaleString()}` : "—"}
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight={600} color={isOut ? "error" : isLow ? "warning.main" : "text.primary"}>
                          {product.stock_quantity}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{product.low_stock_threshold}</TableCell>
                      <TableCell>
                        <Chip
                          label={isOut ? t("inv.outOfStock") : isLow ? t("inv.lowStock") : t("inv.inStock")}
                          color={isOut ? "error" : isLow ? "warning" : "success"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => toggleVisibleOnPos(product)}
                          color={isVisibleOnPos ? "primary" : "default"}
                          title={isVisibleOnPos ? t("inv.hideFromPos") : t("inv.showOnPos")}
                        >
                          {isVisibleOnPos ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <Box className="flex gap-1 flex-wrap">
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            startIcon={<AdjustIcon fontSize="small" />}
                            onClick={() => openAdjustForProduct(product)}
                            sx={{ textTransform: "none", fontWeight: 600, minWidth: 80 }}
                          >
                            {t("inv.adjust")}
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            color="warning"
                            startIcon={<EditIcon fontSize="small" />}
                            onClick={() => openEditProduct(product)}
                            sx={{ textTransform: "none", fontWeight: 600, minWidth: 68 }}
                          >
                            {t("inv.edit")}
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="inherit"
                            startIcon={<HistoryIcon fontSize="small" />}
                            onClick={() => openHistory(product.id)}
                            sx={{ textTransform: "none", fontWeight: 600, minWidth: 80, bgcolor: "grey.50" }}
                          >
                            {t("inv.history")}
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                      <InvIcon sx={{ fontSize: 40, opacity: 0.2, mb: 1 }} />
                      <Typography color="text.secondary">
                        {search ? t("inv.noMatch") : t("inv.noProducts")}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </CardContent>
      </Card>

      {/* Add New Product Modal */}
      <Modal
        open={productFormOpen}
        onClose={() => setProductFormOpen(false)}
        title="Add New Product"
        maxWidth="sm"
        actions={
          <>
            <Button onClick={() => setProductFormOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleAddProduct}
              disabled={savingProduct || !productForm.name || !productForm.price}
            >
              {savingProduct ? "Creating..." : "Create Product"}
            </Button>
          </>
        }
      >
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Product Name"
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Description"
              value={productForm.description}
              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Price (฿)"
              type="number"
              value={productForm.price}
              onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
              fullWidth
              required
              inputProps={{ min: 0, step: "0.01" }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Cost Price (฿)"
              type="number"
              value={productForm.cost_price}
              onChange={(e) => setProductForm({ ...productForm, cost_price: e.target.value })}
              fullWidth
              inputProps={{ min: 0, step: "0.01" }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              select
              label="Category"
              value={productForm.category_id}
              onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
              fullWidth
            >
              <MenuItem value="">— None —</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="SKU"
              value={productForm.sku}
              onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <Box className="flex items-center gap-2">
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadIcon />}
                disabled={imageUploading}
                sx={{ textTransform: "none" }}
              >
                {imageUploading ? "Uploading..." : "Upload Image"}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadImage(file, "add");
                  }}
                />
              </Button>
              {productForm.image_url && (
                <Box
                  component="img"
                  src={productForm.image_url}
                  alt="Preview"
                  sx={{ height: 48, width: 48, objectFit: "cover", borderRadius: 1, border: "1px solid #ddd" }}
                />
              )}
              {productForm.image_url && (
                <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
                  {productForm.image_url.split("/").pop()}
                </Typography>
              )}
            </Box>
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Stock Quantity"
              type="number"
              value={productForm.stock_quantity}
              onChange={(e) => setProductForm({ ...productForm, stock_quantity: e.target.value })}
              fullWidth
              inputProps={{ min: 0 }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Low Stock Threshold"
              type="number"
              value={productForm.low_stock_threshold}
              onChange={(e) => setProductForm({ ...productForm, low_stock_threshold: e.target.value })}
              fullWidth
              inputProps={{ min: 0 }}
            />
          </Grid>
          <Grid item xs={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={productForm.track_inventory}
                  onChange={(e) => setProductForm({ ...productForm, track_inventory: e.target.checked })}
                />
              }
              label="Track Inventory"
            />
          </Grid>
          <Grid item xs={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={productForm.is_active}
                  onChange={(e) => setProductForm({ ...productForm, is_active: e.target.checked })}
                />
              }
              label="Active"
            />
          </Grid>
        </Grid>
      </Modal>

      {/* Adjust Stock Modal */}
      <Modal
        open={adjustOpen}
        onClose={() => setAdjustOpen(false)}
        title={`Adjust Stock — ${adjustProductName}`}
        actions={
          <>
            <Button onClick={() => setAdjustOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleAdjust} disabled={adjusting || !adjustProduct || !adjustQty}>
              {adjusting ? "Saving..." : "Save"}
            </Button>
          </>
        }
      >
        <Box sx={{ mb: 2, p: 1.5, borderRadius: 1, bgcolor: adjustCurrentStock === 0 ? "error.50" : adjustCurrentStock <= adjustThreshold ? "warning.50" : "success.50", border: 1, borderColor: adjustCurrentStock === 0 ? "error.200" : adjustCurrentStock <= adjustThreshold ? "warning.200" : "success.200" }}>
          <Box className="flex items-center justify-between">
            <Box>
              <Typography variant="body2" color="text.secondary">Current Stock</Typography>
              <Typography variant="h5" fontWeight={700} color={adjustCurrentStock === 0 ? "error.main" : adjustCurrentStock <= adjustThreshold ? "warning.main" : "text.primary"}>
                {adjustCurrentStock}
              </Typography>
            </Box>
            <Chip
              label={adjustCurrentStock === 0 ? "Out of Stock" : adjustCurrentStock <= adjustThreshold ? "Low Stock" : "In Stock"}
              color={adjustCurrentStock === 0 ? "error" : adjustCurrentStock <= adjustThreshold ? "warning" : "success"}
              size="small"
            />
          </Box>
          <Typography variant="caption" color="text.secondary">Threshold: {adjustThreshold}</Typography>
        </Box>
        <Grid container spacing={2}>
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

      {/* Edit Product Modal (info only, no stock) */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={t("product.editProduct")}
        maxWidth="sm"
        actions={
          <Box className="flex justify-between w-full">
            <Button
              color="error"
              variant="outlined"
              startIcon={<DeleteIcon />}
              onClick={() => setDeleteConfirmOpen(true)}
              sx={{ textTransform: "none" }}
            >
              {t("common.delete")}
            </Button>
            <Box className="flex gap-2">
              <Button onClick={() => setEditOpen(false)}>{t("common.cancel")}</Button>
              <Button
                variant="contained"
                onClick={handleEditProduct}
                disabled={savingEdit || !editForm.name || !editForm.price}
              >
                {savingEdit ? t("product.saving") : t("product.saveChanges")}
              </Button>
            </Box>
          </Box>
        }
      >
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Product Name"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Description"
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Price (฿)"
              type="number"
              value={editForm.price}
              onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
              fullWidth
              required
              inputProps={{ min: 0, step: "0.01" }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Cost Price (฿)"
              type="number"
              value={editForm.cost_price}
              onChange={(e) => setEditForm({ ...editForm, cost_price: e.target.value })}
              fullWidth
              inputProps={{ min: 0, step: "0.01" }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              select
              label="Category"
              value={editForm.category_id}
              onChange={(e) => setEditForm({ ...editForm, category_id: e.target.value })}
              fullWidth
            >
              <MenuItem value="">— None —</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="SKU"
              value={editForm.sku}
              onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <Box className="flex items-center gap-2">
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadIcon />}
                disabled={editImageUploading}
                sx={{ textTransform: "none" }}
              >
                {editImageUploading ? "Uploading..." : "Upload Image"}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadImage(file, "edit");
                  }}
                />
              </Button>
              {editForm.image_url && (
                <Box
                  component="img"
                  src={editForm.image_url}
                  alt="Preview"
                  sx={{ height: 48, width: 48, objectFit: "cover", borderRadius: 1, border: "1px solid #ddd" }}
                />
              )}
              {editForm.image_url && (
                <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
                  {editForm.image_url.split("/").pop()}
                </Typography>
              )}
            </Box>
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Low Stock Threshold"
              type="number"
              value={editForm.low_stock_threshold}
              onChange={(e) => setEditForm({ ...editForm, low_stock_threshold: e.target.value })}
              fullWidth
              inputProps={{ min: 0 }}
            />
          </Grid>
          <Grid item xs={3}>
            <FormControlLabel
              control={
                <Switch
                  checked={editForm.track_inventory}
                  onChange={(e) => setEditForm({ ...editForm, track_inventory: e.target.checked })}
                />
              }
              label="Track"
            />
          </Grid>
          <Grid item xs={3}>
            <FormControlLabel
              control={
                <Switch
                  checked={editForm.is_active}
                  onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                />
              }
              label="Active"
            />
          </Grid>
        </Grid>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title={t("inv.deleteConfirmTitle")}
        maxWidth="xs"
        actions={
          <>
            <Button onClick={() => setDeleteConfirmOpen(false)}>{t("common.cancel")}</Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleDeleteProduct}
              disabled={deletingProduct}
            >
              {deletingProduct ? t("common.loading") : t("common.delete")}
            </Button>
          </>
        }
      >
        <Typography>{t("inv.deleteConfirmMsg")}</Typography>
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
