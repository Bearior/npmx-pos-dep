"use client";

import React from "react";
import { Card, CardActionArea, CardContent, Typography, Box } from "@mui/material";
import type { Product } from "@/types";

interface Props {
  products: Product[];
  onProductClick: (product: Product) => void;
}

export default function ProductGrid({ products, onProductClick }: Props) {
  return (
    <div className="pos-grid">
      {products.map((product) => {
        const outOfStock = product.track_inventory && product.stock_quantity <= 0;
        return (
          <Card key={product.id} sx={{ height: "100%", opacity: outOfStock ? 0.5 : 1 }}>
            <CardActionArea
              onClick={() => !outOfStock && onProductClick(product)}
              disabled={outOfStock}
              sx={{ height: "100%" }}
            >
              {/* Image placeholder */}
              {product.image_url ? (
                <Box
                  component="img"
                  src={product.image_url}
                  alt={product.name}
                  sx={{
                    width: "100%",
                    height: 120,
                    objectFit: "cover",
                    filter: outOfStock ? "grayscale(1)" : "none",
                  }}
                />
              ) : (
                <Box
                  sx={{
                    width: "100%",
                    height: 120,
                    bgcolor: "primary.50",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography variant="h4" sx={{ opacity: 0.3 }}>
                    ☕
                  </Typography>
                </Box>
              )}

              <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                <Typography variant="body2" fontWeight={600} noWrap>
                  {product.name}
                </Typography>
                <Box className="flex items-center justify-between mt-1">
                  <Typography variant="body2" color="primary" fontWeight={700}>
                    ฿{product.price.toFixed(2)}
                  </Typography>
                  {product.product_variants && product.product_variants.length > 0 && (
                    <Typography variant="caption" color="text.secondary">
                      +options
                    </Typography>
                  )}
                </Box>
                {product.track_inventory && product.stock_quantity <= product.low_stock_threshold && (
                  <Typography variant="caption" color="error" fontWeight={outOfStock ? 700 : 400}>
                    {outOfStock ? "Out of stock" : `Low: ${product.stock_quantity} left`}
                  </Typography>
                )}
              </CardContent>
            </CardActionArea>
          </Card>
        );
      })}
    </div>
  );
}
