"use client";

import React, { memo, useRef, useState, useEffect, useCallback } from "react";
import { Card, CardActionArea, CardContent, Typography, Box } from "@mui/material";
import type { Product } from "@/types";
import { useLanguage } from "@/providers/LanguageProvider";

interface Props {
  products: Product[];
  onProductClick: (product: Product) => void;
}

// Individual product card — memoised so only changed items re-render
const ProductCard = memo(function ProductCard({
  product,
  onProductClick,
}: {
  product: Product;
  onProductClick: (product: Product) => void;
}) {
  const { t } = useLanguage();
  const outOfStock = product.track_inventory && product.stock_quantity <= 0;
  const cardRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Card ref={cardRef} sx={{ height: "100%", opacity: outOfStock ? 0.5 : 1 }}>
      <CardActionArea
        onClick={() => !outOfStock && onProductClick(product)}
        disabled={outOfStock}
        sx={{ height: "100%" }}
      >
        {visible ? (
          product.image_url ? (
            <Box
              component="img"
              src={product.image_url}
              alt={product.name}
              loading="lazy"
              decoding="async"
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
          )
        ) : (
          <Box sx={{ width: "100%", height: 120, bgcolor: "grey.100" }} />
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
                {t("pos.options")}
              </Typography>
            )}
          </Box>
          {product.track_inventory && product.stock_quantity <= product.low_stock_threshold && (
            <Typography variant="caption" color="error" fontWeight={outOfStock ? 700 : 400}>
              {outOfStock ? t("pos.outOfStock") : t("pos.lowStock").replace("{0}", String(product.stock_quantity))}
            </Typography>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
});

export default function ProductGrid({ products, onProductClick }: Props) {
  return (
    <div className="pos-grid">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onProductClick={onProductClick}
        />
      ))}
    </div>
  );
}
