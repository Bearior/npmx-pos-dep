"use client";

import React from "react";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";

// ─── Shared building blocks ──────────────────────────

function SkeletonStatCard() {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Box className="flex items-start justify-between">
          <Box sx={{ flex: 1 }}>
            <Skeleton width={100} height={20} />
            <Skeleton width={120} height={40} sx={{ mt: 0.5 }} />
            <Skeleton width={80} height={16} sx={{ mt: 0.5 }} />
          </Box>
          <Skeleton variant="rounded" width={40} height={40} />
        </Box>
      </CardContent>
    </Card>
  );
}

function SkeletonTableRows({ columns, rows = 5 }: { columns: number; rows?: number }) {
  return (
    <TableBody>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: columns }).map((_, j) => (
            <TableCell key={j}>
              <Skeleton width={j === 0 ? 120 : 80} height={20} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  );
}

function SkeletonListItems({ count = 5 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Box
          key={i}
          className="flex items-center justify-between"
          sx={{ py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}
        >
          <Box sx={{ flex: 1 }}>
            <Skeleton width={160} height={20} />
            <Skeleton width={100} height={16} sx={{ mt: 0.5 }} />
          </Box>
          <Skeleton variant="rounded" width={70} height={26} />
        </Box>
      ))}
    </>
  );
}

// ─── Dashboard Skeleton ──────────────────────────────

export function DashboardSkeleton() {
  return (
    <Box>
      <Skeleton width={180} height={36} sx={{ mb: 3 }} />
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[0, 1, 2, 3].map((i) => (
          <Grid item xs={12} md={3} key={i}>
            <SkeletonStatCard />
          </Grid>
        ))}
      </Grid>
      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Skeleton width={160} height={28} sx={{ mb: 2 }} />
              <SkeletonListItems count={5} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Skeleton width={120} height={28} sx={{ mb: 2 }} />
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton
                  key={i}
                  variant="rounded"
                  height={48}
                  sx={{ mb: 1, borderRadius: 1 }}
                />
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

// ─── POS Skeleton ────────────────────────────────────

export function POSSkeleton() {
  return (
    <Box className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-48px)]">
      {/* Left: Products */}
      <Box className="flex-1 flex flex-col min-w-0">
        <Skeleton variant="rounded" height={40} sx={{ mb: 2 }} />
        <Box className="flex gap-2 mb-2 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" width={80} height={36} />
          ))}
        </Box>
        <Grid container spacing={1.5}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Grid item xs={6} sm={4} md={3} key={i}>
              <Card>
                <Skeleton variant="rectangular" height={120} />
                <CardContent sx={{ p: 1.5 }}>
                  <Skeleton width="80%" height={18} />
                  <Skeleton width={60} height={20} sx={{ mt: 0.5 }} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
      {/* Right: Cart (desktop) */}
      <Box
        sx={{
          width: 340,
          display: { xs: "none", lg: "flex" },
          flexDirection: "column",
        }}
      >
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Skeleton width={60} height={28} sx={{ mb: 2 }} />
            {Array.from({ length: 3 }).map((_, i) => (
              <Box key={i} className="flex items-center gap-2 mb-2">
                <Skeleton variant="rounded" width={48} height={48} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton width="70%" height={18} />
                  <Skeleton width={50} height={16} />
                </Box>
                <Skeleton width={60} height={18} />
              </Box>
            ))}
            <Box sx={{ mt: "auto", pt: 2, borderTop: "1px solid", borderColor: "divider" }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Box key={i} className="flex justify-between mb-1">
                  <Skeleton width={70} height={16} />
                  <Skeleton width={60} height={16} />
                </Box>
              ))}
              <Skeleton variant="rounded" height={44} sx={{ mt: 2 }} />
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

// ─── Orders Skeleton ─────────────────────────────────

export function OrdersSkeleton() {
  return (
    <Box>
      <Box className="flex items-center justify-between mb-4">
        <Skeleton width={180} height={36} />
        <Box className="flex gap-2">
          <Skeleton variant="rounded" width={140} height={40} />
          <Skeleton variant="circular" width={40} height={40} />
        </Box>
      </Box>
      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {["", "Order #", "Table", "Customer", "Status", "Total", "Created", "Actions"].map(
                    (h, i) => (
                      <TableCell key={i}>
                        <Skeleton width={i === 0 ? 30 : 70} height={18} />
                      </TableCell>
                    )
                  )}
                </TableRow>
              </TableHead>
              <SkeletonTableRows columns={8} rows={8} />
            </Table>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

// ─── Inventory Skeleton ──────────────────────────────

export function InventorySkeleton() {
  return (
    <Box>
      <Box className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <Skeleton width={220} height={36} />
        <Skeleton variant="rounded" width={150} height={40} />
      </Box>
      <Skeleton variant="rounded" height={40} sx={{ mb: 2 }} />
      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {["Product", "SKU", "Category", "Price", "Cost", "Stock", "Threshold", "Status", "POS", "Actions"].map(
                    (h, i) => (
                      <TableCell key={i}>
                        <Skeleton width={i === 0 ? 100 : 60} height={18} />
                      </TableCell>
                    )
                  )}
                </TableRow>
              </TableHead>
              <SkeletonTableRows columns={10} rows={6} />
            </Table>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

// ─── Reports Skeleton ────────────────────────────────

export function ReportsSkeleton() {
  return (
    <Box>
      <Skeleton width={220} height={36} sx={{ mb: 1 }} />
      <Box className="flex gap-2 mb-3">
        <Skeleton variant="rounded" width={120} height={40} />
        <Skeleton variant="rounded" width={120} height={40} />
        <Skeleton variant="rounded" width={100} height={40} />
      </Box>
      <Box className="flex gap-2 mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" width={100} height={36} />
        ))}
      </Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[0, 1].map((i) => (
          <Grid item xs={12} md={6} key={i}>
            <SkeletonStatCard />
          </Grid>
        ))}
      </Grid>
      <Card>
        <CardContent>
          <Skeleton width={180} height={28} sx={{ mb: 2 }} />
          <Skeleton variant="rounded" height={250} />
        </CardContent>
      </Card>
    </Box>
  );
}

// ─── Discounts Skeleton ──────────────────────────────

export function DiscountsSkeleton() {
  return (
    <Box>
      <Box className="flex items-center justify-between mb-4">
        <Skeleton width={240} height={36} />
        <Skeleton variant="rounded" width={140} height={40} />
      </Box>
      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {["Code", "Name", "Type", "Value", "Used", "Status", "Expires", "Actions"].map(
                    (h, i) => (
                      <TableCell key={i}>
                        <Skeleton width={i === 0 ? 100 : 65} height={18} />
                      </TableCell>
                    )
                  )}
                </TableRow>
              </TableHead>
              <SkeletonTableRows columns={8} rows={5} />
            </Table>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

// ─── Settings Skeleton ───────────────────────────────

export function SettingsSkeleton() {
  return (
    <Box>
      <Skeleton width={140} height={36} sx={{ mb: 3 }} />
      <Grid container spacing={3}>
        {/* Profile card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Skeleton width={100} height={24} sx={{ mb: 2 }} />
              <Skeleton variant="rounded" height={40} sx={{ mb: 2 }} />
              <Skeleton variant="rounded" height={40} sx={{ mb: 2 }} />
              <Skeleton variant="rounded" height={40} sx={{ mb: 2 }} />
              <Skeleton variant="rounded" width={140} height={40} />
            </CardContent>
          </Card>
        </Grid>
        {/* PromptPay card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Skeleton width={200} height={24} sx={{ mb: 1 }} />
              <Skeleton width="100%" height={16} sx={{ mb: 2 }} />
              <Skeleton variant="rounded" height={40} sx={{ mb: 2 }} />
              <Skeleton variant="rounded" width={140} height={40} />
            </CardContent>
          </Card>
        </Grid>
        {/* System info */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Skeleton width={160} height={24} sx={{ mb: 2 }} />
              {Array.from({ length: 4 }).map((_, i) => (
                <Box key={i} className="flex justify-between mb-2">
                  <Skeleton width={100} height={18} />
                  <Skeleton width={80} height={18} />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
        {/* DB status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Skeleton width={200} height={24} sx={{ mb: 2 }} />
              <Skeleton variant="rounded" height={60} sx={{ mb: 1 }} />
              <Skeleton variant="rounded" height={60} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

// ─── Tables Skeleton ─────────────────────────────────

export function TablesSkeleton() {
  return (
    <Box>
      <Box className="flex items-center justify-between mb-4">
        <Skeleton width={200} height={36} />
        <Skeleton variant="rounded" width={120} height={40} />
      </Box>
      <Grid container spacing={2}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
            <Card>
              <CardContent>
                <Box className="flex items-center justify-between mb-2">
                  <Skeleton width={80} height={28} />
                  <Skeleton variant="rounded" width={60} height={24} />
                </Box>
                <Skeleton width={100} height={16} sx={{ mb: 1 }} />
                <Skeleton width={70} height={16} sx={{ mb: 2 }} />
                <Box className="flex gap-1">
                  <Skeleton variant="rounded" width={80} height={32} />
                  <Skeleton variant="rounded" width={80} height={32} />
                  <Skeleton variant="rounded" width={40} height={32} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
