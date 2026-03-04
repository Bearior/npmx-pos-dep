"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Box, Typography, TextField, InputAdornment, Tabs, Tab, Snackbar, Alert } from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";
import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import api from "@/libs/api";
import type { Product, Category, CartItem, Discount, ProductVariant } from "@/types";
import ProductGrid from "./components/ProductGrid";
import CartPanel from "./components/CartPanel";
import PaymentDialog from "./components/PaymentDialog";
import VariantSelector from "./components/VariantSelector";
import LoadingScreen from "@/components/ui/LoadingScreen";

export default function POSPage() {
  const { session } = useAuth();
  const { t } = useLanguage();
  const token = session?.access_token;

  // Data
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<Discount | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [isGrab, setIsGrab] = useState(false);

  // Dialogs
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [variantProduct, setVariantProduct] = useState<Product | null>(null);

  // Notifications
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  // Fetch data
  useEffect(() => {
    if (!token) return;
    const fetchData = async () => {
      try {
        const [cats, prods] = await Promise.all([
          api.get<Category[]>("/categories", token),
          api.get<{ data: Product[] }>("/products", token, { limit: "200" }),
        ]);
        setCategories(cats);
        setProducts(prods.data);
      } catch (err) {
        console.error("Failed to load POS data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  // Filtered products — hidden from POS and out of stock sorted to bottom
  const filteredProducts = products
    .filter((p) => {
      if (!p.is_active) return false;
      if (p.visible_on_pos === false) return false;
      if (selectedCategory !== "all" && p.category_id !== selectedCategory) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      const aOut = a.track_inventory && a.stock_quantity <= 0 ? 1 : 0;
      const bOut = b.track_inventory && b.stock_quantity <= 0 ? 1 : 0;
      return aOut - bOut;
    });

  // Cart operations
  const addToCart = useCallback((product: Product, variants?: ProductVariant[]) => {
    setCart((prev) => {
      const variantKey = variants && variants.length > 0
        ? variants.map((v) => v.id).sort().join("+")
        : "base";

      const existingIdx = prev.findIndex(
        (item) => item.product.id === product.id &&
          (item.variants && item.variants.length > 0
            ? item.variants.map((v) => v.id).sort().join("+")
            : "base") === variantKey
      );

      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: updated[existingIdx].quantity + 1,
        };
        return updated;
      }

      const modifiers = variants?.reduce((sum, v) => sum + v.price_modifier, 0) || 0;
      const unitPrice = product.price + modifiers;
      return [
        ...prev,
        {
          id: `${product.id}-${variantKey}-${Date.now()}`,
          product,
          variants: variants && variants.length > 0 ? variants : undefined,
          quantity: 1,
          unitPrice,
        },
      ];
    });
  }, []);

  const handleProductClick = (product: Product) => {
    const variants = product.product_variants?.filter((v) => v.is_active);
    if (variants && variants.length > 0) {
      setVariantProduct(product);
    } else {
      addToCart(product);
    }
  };

  const updateCartQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === cartItemId ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const clearCart = () => {
    setCart([]);
    setAppliedDiscount(null);
    setDiscountCode("");
    setCustomerName("");
    setTableNumber("");
    setIsGrab(false);
  };

  // Discount
  const applyDiscount = async () => {
    if (!discountCode || !token) return;
    try {
      const result = await api.post<{ valid: boolean; discount?: Discount; message?: string }>(
        "/discounts/validate",
        { code: discountCode },
        token
      );
      if (result.valid && result.discount) {
        setAppliedDiscount(result.discount);
        setSnackbar({ open: true, message: `Discount "${result.discount.name}" applied!`, severity: "success" });
      } else {
        setSnackbar({ open: true, message: result.message || "Invalid code", severity: "error" });
      }
    } catch {
      setSnackbar({ open: true, message: "Failed to validate discount", severity: "error" });
    }
  };

  // Totals
  const subtotal = cart.reduce((s, item) => s + item.unitPrice * item.quantity, 0);
  let discountAmount = 0;
  if (appliedDiscount) {
    if (appliedDiscount.type === "percentage") {
      discountAmount = (subtotal * appliedDiscount.value) / 100;
      if (appliedDiscount.max_discount) discountAmount = Math.min(discountAmount, appliedDiscount.max_discount);
    } else {
      discountAmount = appliedDiscount.value;
    }
  }
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const taxRate = 0.07;
  const taxAmount = parseFloat((afterDiscount * taxRate).toFixed(2));
  const total = parseFloat((afterDiscount + taxAmount).toFixed(2));

  // Submit order
  const handleOrderComplete = async () => {
    setPaymentOpen(false);
    clearCart();
    setSnackbar({ open: true, message: t("pos.orderCompleted"), severity: "success" });
  };

  if (loading) return <LoadingScreen message={t("pos.loading")} />;

  return (
    <Box className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-48px)]">
      {/* Left: Product selection */}
      <Box className="flex-1 flex flex-col min-w-0">
        {/* Search */}
        <TextField
          placeholder={t("pos.searchProducts")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          className="mb-3"
          fullWidth
        />

        {/* Category tabs */}
        <Tabs
          value={selectedCategory}
          onChange={(_, v) => setSelectedCategory(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 2, minHeight: 42 }}
        >
          <Tab label={t("pos.all")} value="all" sx={{ minHeight: 42 }} />
          {categories.map((cat) => (
            <Tab key={cat.id} label={cat.name} value={cat.id} sx={{ minHeight: 42 }} />
          ))}
        </Tabs>

        {/* Products grid */}
        <Box className="flex-1 overflow-auto">
          {filteredProducts.length === 0 ? (
            <Box className="flex items-center justify-center h-40">
              <Typography color="text.secondary">{t("pos.noProducts")}</Typography>
            </Box>
          ) : (
            <ProductGrid products={filteredProducts} onProductClick={handleProductClick} />
          )}
        </Box>
      </Box>

      {/* Right: Cart */}
      <CartPanel
        cart={cart}
        subtotal={subtotal}
        discountAmount={discountAmount}
        taxAmount={taxAmount}
        total={total}
        discountCode={discountCode}
        appliedDiscount={appliedDiscount}
        customerName={customerName}
        tableNumber={tableNumber}
        onDiscountCodeChange={setDiscountCode}
        onApplyDiscount={applyDiscount}
        onRemoveDiscount={() => { setAppliedDiscount(null); setDiscountCode(""); }}
        onCustomerNameChange={setCustomerName}
        onTableNumberChange={setTableNumber}
        isGrab={isGrab}
        onGrabChange={(checked) => {
          setIsGrab(checked);
          setTableNumber("");
        }}
        onUpdateQuantity={updateCartQuantity}
        onRemoveItem={removeFromCart}
        onClearCart={clearCart}
        onCheckout={() => setPaymentOpen(true)}
      />

      {/* Variant selector dialog */}
      {variantProduct && (
        <VariantSelector
          product={variantProduct}
          open={!!variantProduct}
          onClose={() => setVariantProduct(null)}
          onConfirm={(variants) => {
            addToCart(variantProduct, variants);
            setVariantProduct(null);
          }}
        />
      )}

      {/* Payment dialog */}
      <PaymentDialog
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        cart={cart}
        subtotal={subtotal}
        discountAmount={discountAmount}
        discountCode={appliedDiscount?.code}
        taxAmount={taxAmount}
        total={total}
        customerName={customerName}
        tableNumber={tableNumber}
        onComplete={handleOrderComplete}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
