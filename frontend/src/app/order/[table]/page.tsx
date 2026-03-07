"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Box, Typography, TextField, InputAdornment, Tabs, Tab, Button,
  Card, CardMedia, CardContent, IconButton, Badge, Fab,
  Dialog, Slide, AppBar, Toolbar, Snackbar, Alert, Chip,
  List, ListItem, ListItemText, Divider, CircularProgress,
  useMediaQuery, useTheme,
} from "@mui/material";
import {
  Search as SearchIcon, ShoppingCart as CartIcon, Close as CloseIcon,
  Add as AddIcon, Remove as RemoveIcon, Delete as DeleteIcon,
  CheckCircle as CheckIcon, Restaurant as RestaurantIcon,
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

  const [tableInfo, setTableInfo] = useState<{ id: string; table_number: string; label?: string; seats: number } | null>(null);
  const [tableError, setTableError] = useState(false);
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{ order_number: string; total: number } | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" });

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

  const addToCart = useCallback((product: PublicProduct, variant?: PublicVariant) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.product.id === product.id && item.variant?.id === variant?.id
      );
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = { ...updated[existingIdx], quantity: updated[existingIdx].quantity + 1 };
        return updated;
      }
      return [...prev, {
        id: `${product.id}-${variant?.id || "base"}-${Date.now()}`,
        product,
        variant,
        quantity: 1,
        unitPrice: product.price + (variant?.price_modifier || 0),
      }];
    });
  }, []);

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
          notes: notes || undefined,
          items: cart.map((item) => ({
            product_id: item.product.id,
            variant_id: item.variant?.id || null,
            variant_info: item.variant?.name || null,
            quantity: item.quantity,
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
      setNotes("");
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
        <Button variant="contained" size="large" onClick={() => setOrderSuccess(null)}>
          Order More
        </Button>
      </Box>
    );
  }

  // --- Main ordering UI ---
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
        sx={{ mb: 1 }}
      />
      <TextField
        placeholder="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        size="small"
        fullWidth
        multiline
        rows={2}
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
                <ListItem
                  disablePadding
                  sx={{ py: 1 }}
                  secondaryAction={
                    <IconButton size="small" onClick={() => removeItem(item.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  <ListItemText
                    primary={
                      <Typography variant="body2" fontWeight={600}>
                        {item.product.name}
                        {item.variant && <Chip label={item.variant.name} size="small" sx={{ ml: 1 }} />}
                      </Typography>
                    }
                    secondary={
                      <Box className="flex items-center gap-1 mt-1">
                        <IconButton size="small" onClick={() => updateQty(item.id, -1)}>
                          <RemoveIcon fontSize="small" />
                        </IconButton>
                        <Typography variant="body2" fontWeight={600}>{item.quantity}</Typography>
                        <IconButton size="small" onClick={() => updateQty(item.id, 1)}>
                          <AddIcon fontSize="small" />
                        </IconButton>
                        <Typography variant="body2" sx={{ ml: "auto" }}>
                          ฿{(item.unitPrice * item.quantity).toFixed(2)}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />
      <Box className="flex justify-between mb-2">
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

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {/* Header */}
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar>
          <RestaurantIcon sx={{ mr: 1 }} />
          <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
            Menu
          </Typography>
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
          }}>
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                sx={{
                  cursor: "pointer",
                  transition: "transform 0.15s",
                  "&:hover": { transform: "scale(1.02)" },
                }}
                onClick={() => {
                  if (product.product_variants && product.product_variants.length > 0) {
                    // For simplicity, add base product. Could enhance with variant selector modal.
                    addToCart(product);
                  } else {
                    addToCart(product);
                  }
                }}
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
      {isMobile && cart.length > 0 && (
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
      <Dialog
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        fullScreen
        TransitionComponent={SlideUp}
      >
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

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
