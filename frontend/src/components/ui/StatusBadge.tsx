"use client";

import React from "react";
import { Chip, type ChipProps } from "@mui/material";
import type { OrderStatus } from "@/types";

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: ChipProps["color"] }> = {
  pending: { label: "Pending", color: "warning" },
  preparing: { label: "Preparing", color: "info" },
  ready: { label: "Ready", color: "success" },
  served: { label: "Served", color: "primary" },
  completed: { label: "Completed", color: "success" },
  cancelled: { label: "Cancelled", color: "default" },
  voided: { label: "Voided", color: "error" },
  split: { label: "Split", color: "secondary" },
};

interface Props {
  status: OrderStatus;
  size?: "small" | "medium";
}

export default function StatusBadge({ status, size = "small" }: Props) {
  const config = STATUS_CONFIG[status] || { label: status, color: "default" as const };
  return <Chip label={config.label} color={config.color} size={size} />;
}
