"use client";

import React from "react";
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
} from "@mui/material";
import Modal from "@/components/ui/Modal";
import type { Product, ProductVariant } from "@/types";

interface Props {
  product: Product;
  open: boolean;
  onClose: () => void;
  onSelect: (variant?: ProductVariant) => void;
}

export default function VariantSelector({ product, open, onClose, onSelect }: Props) {
  const variants = product.product_variants?.filter((v) => v.is_active) || [];

  // Group variants by type
  const grouped: Record<string, ProductVariant[]> = {};
  for (const v of variants) {
    if (!grouped[v.type]) grouped[v.type] = [];
    grouped[v.type].push(v);
  }

  const typeLabels: Record<string, string> = {
    size: "Size",
    add_on: "Add-ons",
    color: "Color",
    custom: "Options",
  };

  return (
    <Modal open={open} onClose={onClose} title={product.name} maxWidth="xs">
      <Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Base price: ฿{product.price.toFixed(2)}
        </Typography>

        {Object.entries(grouped).map(([type, items]) => (
          <Box key={type} className="mb-4">
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              {typeLabels[type] || type}
            </Typography>
            <List disablePadding>
              {items.map((variant) => (
                <ListItem key={variant.id} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    onClick={() => onSelect(variant)}
                    sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider" }}
                  >
                    <ListItemText primary={variant.name} />
                    <Chip
                      label={
                        variant.price_modifier === 0
                          ? "Included"
                          : variant.price_modifier > 0
                          ? `+฿${variant.price_modifier}`
                          : `-฿${Math.abs(variant.price_modifier)}`
                      }
                      size="small"
                      color={variant.price_modifier === 0 ? "default" : "primary"}
                      variant="outlined"
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        ))}

        {/* Add without variant */}
        <Button fullWidth variant="outlined" onClick={() => onSelect(undefined)} sx={{ mt: 1 }}>
          Add without options (฿{product.price.toFixed(2)})
        </Button>
      </Box>
    </Modal>
  );
}
