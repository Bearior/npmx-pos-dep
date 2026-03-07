"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Box, Typography, TextField, InputAdornment, Tabs, Tab, Button,
  Card, CardMedia, CardContent, IconButton, Badge, Fab,
  Dialog, DialogTitle, DialogContent, DialogActions, Slide,
  AppBar, Toolbar, Snackbar, Alert, Chip,
  List, ListItem, ListItemText, Divider, CircularProgress,
  useMediaQuery, useTheme, ToggleButton, ToggleButtonGroup,
  Table, TableHead, TableRow, TableCell, TableBody,
} from "@mui/material";
import {
  Search as SearchIcon, ShoppingCart as CartIcon, Close as CloseIcon,
  Add as AddIcon, Remove as RemoveIcon, Delete as DeleteIcon,
  CheckCircle as CheckIcon, Restaurant as RestaurantIcon,
  History as HistoryIcon,
} from "@mui/icons-material";
import type { TransitionProps } from "@mui/material/transitions";
import { useParams } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

interface PublicProduct {
  id: string;
  name: string;
  name_th?: string;
  description?: string;
  description_th?: string;
  price: number;
  category_id: string;
  image_url?: string;
  product_variants?: PublicVariant[];
}

interface PublicVariant {
  id: string;
  name: string;
  name_th?: string;
  price_modifier: number;
}

interface PublicCategory {
  id: string;
  name: string;
  name_th?: string;
  sort_order: number;
}

interface CartItem {
  id: string;
  product: PublicProduct;
  variant?: PublicVariant;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

interface OrderHistoryItem {
  id: string;
  order_number: string;
  status: string;
  customer_name?: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  created_at: string;
  order_items: { id: string; product_name: string; variant_info?: string; quantity: number; unit_price: number }[];
}

const SlideUp = React.forwardRef(function SlideUp(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function PublicOrderPage() {
  const params = useParams();
  const tableNumber = params.table as string;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Data
  const [tableInfo, setTableInfo] = useState<{ id: string; table_number: string; label?: string; seats: number } | null>(null);
  const [tableError, setTableError] = useState(false);
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [search, setSearch] = useState("");

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{ order_number: string; total: number } | null>(null);

  // Product detail modal
  const [selectedProduct, setSelectedProduct] = useState<PublicProduct | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<PublicVariant | null>(null);
  const [modalQty, setModalQty] = useState(1);
  const [itemNotes, setItemNotes] = useState("");

  // Order history
  const [historyOpen, setHistoryOpen] = useState(false);
  const [orderHistory, setOrderHistory] = useState<OrderHistoryItem[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" });

  // --- Load table + menu ---
  useEffect(() => {
    const load = async () => {
      try {
        const [tableRes, menuRes] = await Promise.all([
          fetch(`${API_BASE}/public/table/${encodeURIComponent(tableNumber)}`),
          fetch(`${API_BASE}/public/menu`),
        ]);

        if (!tableRes.ok) {
          setTableError(true);
          setLoading(false);
          return;
        }

        const tableData = await tableRes.json();
        const menuData = await menuRes.json();

        setTableInfo(tableData);
        setCategories(menuData.categories || []);
        setProducts(menuData.products || []);
      } catch {
        setTableError(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tableNumber]);

  // --- Fetch order history ---
  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`${API_BASE}/public/table/${encodeURIComponent(tableNumber)}/orders`);
      if (res.ok) {
        const data = await res.json();
        setOrderHistory(data.orders || []);
        setHistoryTotal(data.grand_total || 0);
      }
    } catch {
      // silent
    } finally {
      setHistoryLoading(false);
    }
  }, [tableNumber]);

  const filteredProducts = useMemo(() => {
    let filtered = products;
    if (selectedCategory !== "all") {
      filtered = filtered.filter((p) => p.category_id === selectedCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.name_th?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [products, selectedCategory, search]);

  // --- Product detail modal handlers ---
  const openProductModal = useCallback((product: PublicProduct) => {
    setSelectedProduct(product);
    setSelectedVariant(null);
    setModalQty(1);
    setItemNotes("");
  }, []);

  const handleAddToCart = useCallback(() => {
    if (!selectedProduct) return;
    const variant = selectedVariant || undefined;
    const unitPrice = selectedProduct.price + (variant?.price_modifier || 0);

    setCart((prev) => {
      // Check for existing identical item (same product + variant + no notes or same notes)
      const existingIdx = prev.findIndex(
        (item) => item.product.id === selectedProduct.id
          && item.variant?.id === variant?.id
          && (item.notes || "") === itemNotes
      );
      if (existingIdx >= 0 && !itemNotes) {
        const updated = [...prev];
        updated[existingIdx] = { ...updated[existingIdx], quantity: updated[existingIdx].quantity + modalQty };
        return updated;
      }
      return [...prev, {
        id: `${selectedProduct.id}-${variant?.id || "base"}-${Date.now()}`,
        product: selectedProduct,
        variant,
        quantity: modalQty,
        unitPrice,
        notes: itemNotes || undefined,
      }];
    });

    setSelectedProduct(null);
    setSnackbar({ open: true, message: "Added to cart!", severity: "success" });
  }, [selectedProduct, selectedVariant, modalQty, itemNotes]);

  const updateQty = useCallback((id: string, delta: number) => {
    setCart((prev) => prev.map((item) =>
      item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
    ).filter((item) => item.quantity > 0));
  }, []);

  const removeItem = useCallback((id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/public/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table_number: tableNumber,
          customer_name: customerName || undefined,
          items: cart.map((item) => ({
            product_id: item.product.id,
            variant_id: item.variant?.id || null,
            variant_info: item.variant?.name || null,
            quantity: item.quantity,
            notes: item.notes || null,
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Order failed");
      }

      const data = await res.json();
      setOrderSuccess({ order_number: data.order_number, total: data.total });
      setCart([]);
      setCartOpen(false);
      setCustomerName("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Order failed";
      setSnackbar({ open: true, message, severity: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  // --- Loading ---
  if (loading) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", flexDirection: "column", gap: 2 }}>
        <CircularProgress />
        <Typography>Loading menu...</Typography>
      </Box>
    );
  }

  // --- Invalid table ---
  if (tableError || !tableInfo) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", flexDirection: "column", gap: 2, p: 3 }}>
        <Typography variant="h5" fontWeight={700} color="error">
          Invalid or inactive table
        </Typography>
        <Typography color="text.secondary">
          Please scan a valid QR code at your table.
        </Typography>
      </Box>
    );
  }

  // --- Order success ---
  if (orderSuccess) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", flexDirection: "column", gap: 3, p: 3 }}>
        <CheckIcon sx={{ fontSize: 80, color: "success.main" }} />
        <Typography variant="h4" fontWeight={700}>
          Order Placed!
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Order: {orderSuccess.order_number}
        </Typography>
        <Typography variant="h5" fontWeight={600}>
          Total: ฿{orderSuccess.total.toFixed(2)}
        </Typography>
        <Typography color="text.secondary" textAlign="center">
          Your order has been sent to the kitchen. Please wait for your items to be prepared.
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button variant="contained" size="large" onClick={() => setOrderSuccess(null)}>
            Order More
          </Button>
          <Button
            variant="outlined"
            size="large"
            startIcon={<HistoryIcon />}
            onClick={() => { setOrderSuccess(null); setHistoryOpen(true); fetchHistory(); }}
          >
            View Orders
          </Button>
        </Box>
      </Box>
    );
  }

  // --- Cart panel ---
  const cartPanel = (
    <Box sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column" }}>
      <Typography variant="h6" fontWeight={700} mb={2}>
        Your Order
      </Typography>

      <TextField
        placeholder="Your Name (optional)"
        value={customerName}
        onChange={(e) => setCustomerName(e.target.value)}
        size="small"
        fullWidth
        sx={{ mb: 2 }}
      />

      <Box sx={{ flexGrow: 1, overflow: "auto" }}>
        {cart.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={4}>
            No items yet
          </Typography>
        ) : (
          <List disablePadding>
            {cart.map((item) => (
              <React.Fragment key={item.id}>
                <ListItem disablePadding sx={{ py: 1, pr: 0 }}>
                  <Box sx={{ width: "100%" }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <Box sx={{ flex: 1, minWidth: 0, mr: 1 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {item.product.name}
                          {item.variant && (
                            <Chip label={item.variant.name} size="small" sx={{ ml: 0.5, height: 20, fontSize: "0.7rem" }} />
                          )}
                        </Typography>
                        {item.notes && (
                          <Typography variant="caption" color="text.secondary" noWrap display="block">
                            Note: {item.notes}
                          </Typography>
                        )}
                      </Box>
                      <IconButton size="small" onClick={() => removeItem(item.id)} sx={{ flexShrink: 0 }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
                      <IconButton size="small" onClick={() => updateQty(item.id, -1)}>
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      <Typography variant="body2" fontWeight={600} sx={{ mx: 1 }}>{item.quantity}</Typography>
                      <IconButton size="small" onClick={() => updateQty(item.id, 1)}>
                        <AddIcon fontSize="small" />
                      </IconButton>
                      <Typography variant="body2" fontWeight={600} sx={{ ml: "auto" }}>
                        ฿{(item.unitPrice * item.quantity).toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>Total</Typography>
        <Typography variant="h6" fontWeight={700}>฿{cartTotal.toFixed(2)}</Typography>
      </Box>
      <Button
        variant="contained"
        size="large"
        fullWidth
        disabled={cart.length === 0 || submitting}
        onClick={handlePlaceOrder}
        sx={{ py: 1.5, fontWeight: 700, fontSize: "1.1rem" }}
      >
        {submitting ? <CircularProgress size={24} /> : "Place Order"}
      </Button>
    </Box>
  );

  const computedModalPrice = selectedProduct
    ? selectedProduct.price + (selectedVariant?.price_modifier || 0)
    : 0;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {/* Header */}
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar>
          <RestaurantIcon sx={{ mr: 1 }} />
          <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
            Menu
          </Typography>
          <IconButton
            onClick={() => { setHistoryOpen(true); fetchHistory(); }}
            sx={{ mr: 1 }}
          >
            <HistoryIcon />
          </IconButton>
          <Chip
            label={`Table ${tableInfo.table_number}${tableInfo.label ? ` - ${tableInfo.label}` : ""}`}
            color="primary"
            variant="outlined"
          />
        </Toolbar>
      </AppBar>

      <Box sx={{ display: "flex", height: "calc(100vh - 64px)" }}>
        {/* Products section */}
        <Box sx={{ flexGrow: 1, overflow: "auto", p: 2 }}>
          {/* Search */}
          <TextField
            placeholder="Search menu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            fullWidth
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />

          {/* Category tabs */}
          <Tabs
            value={selectedCategory}
            onChange={(_, v) => setSelectedCategory(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ mb: 2, minHeight: 36, "& .MuiTab-root": { minHeight: 36, py: 0 } }}
          >
            <Tab label="All" value="all" />
            {categories.map((c) => (
              <Tab key={c.id} label={c.name} value={c.id} />
            ))}
          </Tabs>

          {/* Product grid */}
          <Box sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, 1fr)",
              sm: "repeat(3, 1fr)",
              md: "repeat(3, 1fr)",
              lg: "repeat(4, 1fr)",
            },
            gap: 2,
            pb: isMobile ? 10 : 0,
          }}>
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                sx={{
                  cursor: "pointer",
                  transition: "transform 0.15s",
                  "&:hover": { transform: "scale(1.02)" },
                }}
                onClick={() => openProductModal(product)}
              >
                {product.image_url && (
                  <CardMedia
                    component="img"
                    height={120}
                    image={product.image_url}
                    alt={product.name}
                    loading="lazy"
                    sx={{ objectFit: "cover" }}
                  />
                )}
                <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                  <Typography variant="body2" fontWeight={600} noWrap>
                    {product.name}
                  </Typography>
                  {product.name_th && (
                    <Typography variant="caption" color="text.secondary" noWrap display="block">
                      {product.name_th}
                    </Typography>
                  )}
                  <Typography variant="body2" fontWeight={700} color="primary.main" mt={0.5}>
                    ฿{product.price.toFixed(2)}
                  </Typography>
                  {product.product_variants && product.product_variants.length > 0 && (
                    <Typography variant="caption" color="text.secondary">
                      +options
                    </Typography>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>

          {filteredProducts.length === 0 && (
            <Typography color="text.secondary" textAlign="center" py={8}>
              No products found
            </Typography>
          )}
        </Box>

        {/* Cart sidebar (desktop) */}
        {!isMobile && (
          <Box sx={{ width: 360, borderLeft: 1, borderColor: "divider", bgcolor: "background.paper", overflow: "auto" }}>
            {cartPanel}
          </Box>
        )}
      </Box>

      {/* Mobile cart FAB */}
      {isMobile && (
        <Fab
          color="primary"
          onClick={() => setCartOpen(true)}
          sx={{ position: "fixed", bottom: 24, right: 24, zIndex: 1000 }}
        >
          <Badge badgeContent={cartCount} color="error">
            <CartIcon />
          </Badge>
        </Fab>
      )}

      {/* Mobile cart dialog */}
      <Dialog open={cartOpen} onClose={() => setCartOpen(false)} fullScreen TransitionComponent={SlideUp}>
        <AppBar position="sticky" color="default" elevation={1}>
          <Toolbar>
            <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
              Your Order ({cartCount})
            </Typography>
            <IconButton onClick={() => setCartOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        {cartPanel}
      </Dialog>

      {/* Product detail modal */}
      <Dialog
        open={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        maxWidth="xs"
        fullWidth
      >
        {selectedProduct && (
          <>
            {selectedProduct.image_url && (
              <Box
                component="img"
                src={selectedProduct.image_url}
                alt={selectedProduct.name}
                sx={{ width: "100%", height: 200, objectFit: "cover" }}
              />
            )}
            <DialogTitle sx={{ pb: 0 }}>
              <Typography variant="h6" fontWeight={700}>{selectedProduct.name}</Typography>
              {selectedProduct.name_th && (
                <Typography variant="body2" color="text.secondary">{selectedProduct.name_th}</Typography>
              )}
              {selectedProduct.description && (
                <Typography variant="body2" color="text.secondary" mt={0.5}>{selectedProduct.description}</Typography>
              )}
              <Typography variant="h6" fontWeight={700} color="primary.main" mt={1}>
                ฿{computedModalPrice.toFixed(2)}
              </Typography>
            </DialogTitle>
            <DialogContent>
              {/* Variant selection */}
              {selectedProduct.product_variants && selectedProduct.product_variants.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight={600} mb={1}>Options</Typography>
                  <ToggleButtonGroup
                    value={selectedVariant?.id || ""}
                    exclusive
                    onChange={(_, val) => {
                      if (val === null || val === "") {
                        setSelectedVariant(null);
                      } else {
                        const v = selectedProduct.product_variants!.find((vr) => vr.id === val);
                        setSelectedVariant(v || null);
                      }
                    }}
                    sx={{ flexWrap: "wrap", gap: 1 }}
                  >
                    <ToggleButton value="" sx={{ textTransform: "none" }}>
                      Base
                    </ToggleButton>
                    {selectedProduct.product_variants.map((v) => (
                      <ToggleButton key={v.id} value={v.id} sx={{ textTransform: "none" }}>
                        {v.name}
                        {v.price_modifier !== 0 && (
                          <Typography variant="caption" sx={{ ml: 0.5 }}>
                            {v.price_modifier > 0 ? "+" : ""}฿{v.price_modifier.toFixed(0)}
                          </Typography>
                        )}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                </Box>
              )}

              {/* Quantity */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} mb={1}>Quantity</Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <IconButton
                    onClick={() => setModalQty((q) => Math.max(1, q - 1))}
                    disabled={modalQty <= 1}
                    size="small"
                    sx={{ border: 1, borderColor: "divider" }}
                  >
                    <RemoveIcon />
                  </IconButton>
                  <Typography variant="h6" fontWeight={700} sx={{ minWidth: 40, textAlign: "center" }}>
                    {modalQty}
                  </Typography>
                  <IconButton
                    onClick={() => setModalQty((q) => q + 1)}
                    size="small"
                    sx={{ border: 1, borderColor: "divider" }}
                  >
                    <AddIcon />
                  </IconButton>
                  {/* Quick quantity buttons */}
                  {[1, 2, 3, 5].map((n) => (
                    <Chip
                      key={n}
                      label={n}
                      variant={modalQty === n ? "filled" : "outlined"}
                      color={modalQty === n ? "primary" : "default"}
                      onClick={() => setModalQty(n)}
                      sx={{ cursor: "pointer" }}
                    />
                  ))}
                </Box>
              </Box>

              {/* Notes */}
              <TextField
                placeholder="Special instructions (e.g. no ice, extra spicy...)"
                value={itemNotes}
                onChange={(e) => setItemNotes(e.target.value)}
                size="small"
                fullWidth
                multiline
                rows={2}
              />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
              <Button onClick={() => setSelectedProduct(null)} sx={{ mr: 1 }}>Cancel</Button>
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleAddToCart}
                sx={{ fontWeight: 700 }}
              >
                Add to Cart — ฿{(computedModalPrice * modalQty).toFixed(2)}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Order history dialog */}
      <Dialog
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        TransitionComponent={isMobile ? SlideUp : undefined}
      >
        <AppBar position="sticky" color="default" elevation={1} sx={{ position: "relative" }}>
          <Toolbar>
            <HistoryIcon sx={{ mr: 1 }} />
            <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
              Order History — Table {tableNumber}
            </Typography>
            <IconButton onClick={() => setHistoryOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        <DialogContent>
          {historyLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : orderHistory.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={4}>
              No orders yet for this table
            </Typography>
          ) : (
            <>
              {orderHistory.map((order) => (
                <Card key={order.id} sx={{ mb: 2 }}>
                  <CardContent sx={{ pb: "12px !important" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                      <Box>
                        <Typography fontFamily="monospace" fontWeight={700}>
                          {order.order_number}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(order.created_at).toLocaleString()}
                        </Typography>
                      </Box>
                      <Chip
                        label={order.status}
                        size="small"
                        color={
                          order.status === "completed" ? "success" :
                          order.status === "pending" ? "warning" :
                          order.status === "preparing" ? "info" :
                          order.status === "ready" ? "success" : "default"
                        }
                      />
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    {order.order_items.map((item) => (
                      <Box key={item.id} sx={{ display: "flex", justifyContent: "space-between", py: 0.5 }}>
                        <Typography variant="body2">
                          {item.product_name}
                          {item.variant_info && ` (${item.variant_info})`}
                          {" "}x{item.quantity}
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          ฿{(item.unit_price * item.quantity).toFixed(2)}
                        </Typography>
                      </Box>
                    ))}
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2" fontWeight={700}>Order Total</Typography>
                      <Typography variant="body2" fontWeight={700}>฿{order.total.toFixed(2)}</Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))}

              {/* Grand total */}
              <Card sx={{ bgcolor: "primary.main", color: "primary.contrastText" }}>
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="h6" fontWeight={700}>
                      Total Bill ({orderHistory.length} order{orderHistory.length !== 1 ? "s" : ""})
                    </Typography>
                    <Typography variant="h5" fontWeight={800}>
                      ฿{historyTotal.toFixed(2)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </>
          )}
        </DialogContent>
      </Dialog>

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
