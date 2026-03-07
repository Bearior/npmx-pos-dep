"use client";

import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Button,
  Divider,
  TextField,
  Chip,
} from "@mui/material";
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  ShoppingCart as CartIcon,
  DeleteSweep as ClearIcon,
  DeliveryDining as DeliveryIcon,
  Receipt as ReceiptIcon,
  ReceiptLong as NoReceiptIcon,
} from "@mui/icons-material";
import type { CartItem, Discount, ProductVariant } from "@/types";
import { useLanguage } from "@/providers/LanguageProvider";

interface Props {
  cart: CartItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  discountCode: string;
  appliedDiscount: Discount | null;
  customerName: string;
  tableNumber: string;
  isGrab: boolean;
  includeVat: boolean;
  onDiscountCodeChange: (v: string) => void;
  onApplyDiscount: () => void;
  onRemoveDiscount: () => void;
  onCustomerNameChange: (v: string) => void;
  onTableNumberChange: (v: string) => void;
  onGrabChange: (v: boolean) => void;
  onIncludeVatChange: (v: boolean) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
}

export default function CartPanel({
  cart,
  subtotal,
  discountAmount,
  taxAmount,
  total,
  discountCode,
  appliedDiscount,
  customerName,
  tableNumber,
  isGrab,
  includeVat,
  onDiscountCodeChange,
  onApplyDiscount,
  onRemoveDiscount,
  onCustomerNameChange,
  onTableNumberChange,
  onGrabChange,
  onIncludeVatChange,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
}: Props) {
  const { t, locale } = useLanguage();

  // Helper to get localized variant name
  const variantName = (v: ProductVariant) =>
    locale === "th" && v.name_th ? v.name_th : v.name;

  return (
    <Card
      className="flex flex-col"
      sx={{
        width: { xs: "100%", lg: 380 },
        minWidth: { lg: 380 },
        maxHeight: { lg: "calc(100vh - 48px)" },
        boxShadow: { xs: "none", lg: undefined },
      }}
    >
      <CardContent className="flex flex-col flex-1 overflow-hidden p-0">
        {/* Header */}
        <Box className="flex items-center justify-between px-4 py-3">
          <Box className="flex items-center gap-2">
            <CartIcon color="primary" />
            <Typography variant="h6" fontWeight={700}>
              {t("cart.title")}
            </Typography>
            {cart.length > 0 && (
              <Chip
                label={cart.reduce((s, i) => s + i.quantity, 0)}
                size="small"
                color="primary"
              />
            )}
          </Box>
          {cart.length > 0 && (
            <IconButton size="small" color="error" onClick={onClearCart} title="Clear cart">
              <ClearIcon />
            </IconButton>
          )}
        </Box>

        <Divider />

        {/* Customer info */}
        <Box className="px-4 py-4">
          <Box className="flex gap-2 items-center mb-1">
            <TextField
              placeholder={t("cart.customer")}
              value={customerName}
              onChange={(e) => onCustomerNameChange(e.target.value)}
              size="small"
              className="flex-1"
            />
            <TextField
              placeholder={isGrab ? t("cart.orderNo") : t("cart.tableNo")}
              value={tableNumber}
              onChange={(e) => onTableNumberChange(e.target.value)}
              size="small"
              sx={{ width: isGrab ? 100 : 80 }}
            />
            <Chip
              icon={<DeliveryIcon />}
              size="medium"
              color={isGrab ? "success" : "default"}
              variant={isGrab ? "filled" : "outlined"}
              onClick={() => onGrabChange(!isGrab)}
              sx={{
                fontWeight: isGrab ? 700 : 400,
                cursor: "pointer",
                transition: "all 0.2s",
                padding: "20px 20px",
                textAlign: "center",
              }}
            />
          </Box>
        </Box>

        <Divider />

        {/* Cart items */}
        <Box className="flex-1 overflow-auto px-4 py-2" sx={{ maxHeight: { lg: "40vh" } }}>
          {cart.length === 0 ? (
            <Box className="flex flex-col items-center justify-center h-32 text-center">
              <CartIcon sx={{ fontSize: 48, opacity: 0.15, mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                {t("cart.empty")}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t("cart.addProducts")}
              </Typography>
            </Box>
          ) : (
            cart.map((item) => (
              <Box key={item.id} className="flex items-center gap-2 py-2">
                <Box className="flex-1 min-w-0">
                  <Typography variant="body2" fontWeight={600} noWrap>
                    {item.product.name}
                  </Typography>
                  {item.variants && item.variants.length > 0 && (
                    <Typography variant="caption" color="text.secondary">
                      {item.variants.map((v) => {
                        const mod = v.price_modifier > 0
                          ? ` (+฿${v.price_modifier})`
                          : v.price_modifier < 0
                          ? ` (-฿${Math.abs(v.price_modifier)})`
                          : "";
                        return variantName(v) + mod;
                      }).join(", ")}
                    </Typography>
                  )}
                  <Typography variant="caption" display="block" color="primary">
                    ฿{item.unitPrice.toFixed(2)} each
                  </Typography>
                </Box>

                {/* Quantity controls */}
                <Box className="flex items-center gap-1">
                  <IconButton size="small" onClick={() => onUpdateQuantity(item.id, -1)}>
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                  <Typography variant="body2" fontWeight={600} sx={{ minWidth: 24, textAlign: "center" }}>
                    {item.quantity}
                  </Typography>
                  <IconButton size="small" onClick={() => onUpdateQuantity(item.id, 1)}>
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Box>

                <Typography variant="body2" fontWeight={700} sx={{ minWidth: 70, textAlign: "right" }}>
                  ฿{(item.unitPrice * item.quantity).toFixed(2)}
                </Typography>

                <IconButton size="small" color="error" onClick={() => onRemoveItem(item.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))
          )}
        </Box>

        <Divider />

        {/* Discount code */}
        <Box className="px-4 py-2">
          {appliedDiscount ? (
            <Box className="flex items-center justify-between">
              <Chip
                label={`${appliedDiscount.code} (${
                  appliedDiscount.type === "percentage"
                    ? `${appliedDiscount.value}%`
                    : `฿${appliedDiscount.value}`
                })`}
                color="success"
                size="small"
                onDelete={onRemoveDiscount}
              />
            </Box>
          ) : (
            <Box className="flex gap-2">
              <TextField
                placeholder={t("cart.promoCode")}
                value={discountCode}
                onChange={(e) => onDiscountCodeChange(e.target.value.toUpperCase())}
                size="small"
                className="flex-1"
              />
              <Button
                variant="outlined"
                size="small"
                onClick={onApplyDiscount}
                disabled={!discountCode}
              >
                {t("cart.apply")}
              </Button>
            </Box>
          )}
        </Box>

        <Divider />

        {/* Totals */}
        <Box className="px-4 py-3 space-y-1">
          <Box className="flex justify-between">
            <Typography variant="body2" color="text.secondary">
              {t("cart.subtotal")}
            </Typography>
            <Typography variant="body2">฿{subtotal.toFixed(2)}</Typography>
          </Box>
          {discountAmount > 0 && (
            <Box className="flex justify-between">
              <Typography variant="body2" color="success.main">
                {t("cart.discount")}
              </Typography>
              <Typography variant="body2" color="success.main">
                -฿{discountAmount.toFixed(2)}
              </Typography>
            </Box>
          )}
          <Box className="flex justify-between">
            <Box className="flex items-center gap-1">
              <Typography variant="body2" color="text.secondary">
                {t("cart.vat")}
              </Typography>
              <Chip
                icon={includeVat ? <ReceiptIcon fontSize="small" /> : <NoReceiptIcon fontSize="small" />}
                label={includeVat ? t("cart.vatIncluded") : t("cart.noVat")}
                size="small"
                color={includeVat ? "primary" : "default"}
                variant={includeVat ? "filled" : "outlined"}
                onClick={() => onIncludeVatChange(!includeVat)}
                sx={{ cursor: "pointer", fontWeight: includeVat ? 700 : 400 }}
              />
            </Box>
            <Typography variant="body2">฿{taxAmount.toFixed(2)}</Typography>
          </Box>
          <Divider />
          <Box className="flex justify-between pt-1">
            <Typography variant="h6" fontWeight={700}>
              {t("cart.total")}
            </Typography>
            <Typography variant="h6" fontWeight={700} color="primary">
              ฿{total.toFixed(2)}
            </Typography>
          </Box>
        </Box>

        {/* Checkout button */}
        <Box className="px-4 pb-4">
          <Button
            variant="contained"
            fullWidth
            size="large"
            disabled={cart.length === 0}
            onClick={onCheckout}
            sx={{ py: 1.5, fontSize: "1rem" }}
          >
            {t("cart.charge")} ฿{total.toFixed(2)}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
