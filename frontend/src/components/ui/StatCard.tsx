"use client";

import React from "react";
import { Card, CardContent, Typography, Box } from "@mui/material";
import type { SxProps } from "@mui/material";

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: string;
  sx?: SxProps;
}

export default function StatCard({ title, value, subtitle, icon, color = "#ea5c1f", sx }: Props) {
  return (
    <Card sx={{ height: "100%", ...sx }}>
      <CardContent>
        <Box className="flex items-start justify-between">
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ color }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          {icon && (
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                bgcolor: `${color}14`,
                color,
                display: "flex",
              }}
            >
              {icon}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
