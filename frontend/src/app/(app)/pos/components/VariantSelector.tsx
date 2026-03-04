"use client";

import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
  Checkbox,
  Divider,
} from "@mui/material";
import { CheckCircle } from "@mui/icons-material";
import Modal from "@/components/ui/Modal";
import { useLanguage } from "@/providers/LanguageProvider";
import type { Product, ProductVariant } from "@/types";
import type { TranslationKey } from "@/libs/i18n/translations";

// Types that allow single-select (pick one)
const SINGLE_SELECT_TYPES = new Set(["size", "color"]);

interface Props {
  product: Product;
  open: boolean;
  onClose: () => void;
  onConfirm: (variants: ProductVariant[]) => void;
}

export default function VariantSelector({ product, open, onClose, onConfirm }: Props) {
  const { t, locale } = useLanguage();
  const variants = product.product_variants?.filter((v) => v.is_active) || [];

  // Helper to get localized variant name
  const variantName = (v: ProductVariant) =>
    locale === "th" && v.name_th ? v.name_th : v.name;

  // Group variants by type
  const grouped: Record<string, ProductVariant[]> = useMemo(() => {
    const g: Record<string, ProductVariant[]> = {};
    for (const v of variants) {
      if (!g[v.type]) g[v.type] = [];
      g[v.type].push(v);
    }
    return g;
  }, [variants]);

  // Single-select state (size, color): store one selected id per type
  const [singleSelections, setSingleSelections] = useState<Record<string, string>>({});
  // Multi-select state (add_on, custom): store Set of selected ids per type
  const [multiSelections, setMultiSelections] = useState<Record<string, Set<string>>>({});

  const typeLabels: Record<string, TranslationKey> = {
    size: "variant.sizePickOne",
    add_on: "variant.addOnPickMany",
    color: "variant.colorPickOne",
    custom: "variant.optionsPickMany",
  };

  const isSingleSelect = (type: string) => SINGLE_SELECT_TYPES.has(type);

  const handleSingleSelect = (type: string, variantId: string) => {
    setSingleSelections((prev) => ({
      ...prev,
      [type]: prev[type] === variantId ? "" : variantId,
    }));
  };

  const handleMultiToggle = (type: string, variantId: string) => {
    setMultiSelections((prev) => {
      const current = new Set(prev[type] || []);
      if (current.has(variantId)) {
        current.delete(variantId);
      } else {
        current.add(variantId);
      }
      return { ...prev, [type]: current };
    });
  };

  const isSelected = (type: string, variantId: string) => {
    if (isSingleSelect(type)) {
      return singleSelections[type] === variantId;
    }
    return multiSelections[type]?.has(variantId) || false;
  };

  // Compute selected variants
  const selectedVariants = useMemo(() => {
    const result: ProductVariant[] = [];
    for (const [type, items] of Object.entries(grouped)) {
      if (isSingleSelect(type)) {
        const selected = items.find((v) => v.id === singleSelections[type]);
        if (selected) result.push(selected);
      } else {
        const selectedIds = multiSelections[type] || new Set();
        result.push(...items.filter((v) => selectedIds.has(v.id)));
      }
    }
    return result;
  }, [grouped, singleSelections, multiSelections]);

  // Compute total price
  const totalModifier = selectedVariants.reduce((sum, v) => sum + v.price_modifier, 0);
  const totalPrice = product.price + totalModifier;

  const handleConfirm = () => {
    onConfirm(selectedVariants);
  };

  const priceLabel = (variant: ProductVariant) => {
    if (variant.price_modifier === 0) return t("variant.included");
    if (variant.price_modifier > 0) return `+฿${variant.price_modifier}`;
    return `-฿${Math.abs(variant.price_modifier)}`;
  };

  return (
    <Modal open={open} onClose={onClose} title={product.name} maxWidth="xs">
      <Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {t("variant.basePrice")}: ฿{product.price.toFixed(2)}
        </Typography>

        {Object.entries(grouped).map(([type, items]) => (
          <Box key={type} className="mb-4">
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              {t(typeLabels[type] || (type as TranslationKey)) || type}
            </Typography>
            <List disablePadding>
              {items.map((variant) => {
                const selected = isSelected(type, variant.id);
                return (
                  <ListItem key={variant.id} disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      onClick={() =>
                        isSingleSelect(type)
                          ? handleSingleSelect(type, variant.id)
                          : handleMultiToggle(type, variant.id)
                      }
                      sx={{
                        borderRadius: 2,
                        border: "2px solid",
                        borderColor: selected ? "primary.main" : "divider",
                        bgcolor: selected ? "primary.50" : "transparent",
                      }}
                    >
                      {!isSingleSelect(type) && (
                        <Checkbox
                          checked={selected}
                          size="small"
                          sx={{ p: 0, mr: 1 }}
                          tabIndex={-1}
                          disableRipple
                        />
                      )}
                      {isSingleSelect(type) && selected && (
                        <CheckCircle color="primary" fontSize="small" sx={{ mr: 1 }} />
                      )}
                      <ListItemText primary={variantName(variant)} />
                      <Chip
                        label={priceLabel(variant)}
                        size="small"
                        color={variant.price_modifier === 0 ? "default" : "primary"}
                        variant="outlined"
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        ))}

        <Divider sx={{ my: 2 }} />

        {/* Summary */}
        <Box className="flex justify-between items-center mb-3">
          <Typography variant="body2" color="text.secondary">
            {t("variant.totalPrice")}
          </Typography>
          <Typography variant="h6" fontWeight={700} color="primary">
            ฿{totalPrice.toFixed(2)}
          </Typography>
        </Box>

        {selectedVariants.length > 0 && (
          <Box className="mb-3">
            <Typography variant="caption" color="text.secondary">
              {t("variant.selected")}: {selectedVariants.map((v) => variantName(v)).join(", ")}
            </Typography>
          </Box>
        )}

        {/* Confirm / Add without options */}
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleConfirm}
          sx={{ mb: 1, fontWeight: 700 }}
        >
          {selectedVariants.length > 0
            ? `${t("variant.confirm")} — ฿${totalPrice.toFixed(2)}`
            : `${t("variant.addWithoutOptions")} — ฿${product.price.toFixed(2)}`}
        </Button>
      </Box>
    </Modal>
  );
}
