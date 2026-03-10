"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Divider,
  Avatar,
  Snackbar,
  Alert,
  LinearProgress,
  Chip,
  CircularProgress,
} from "@mui/material";
import {
  Save as SaveIcon,
  QrCode as QrIcon,
  Storage as StorageIcon,
  Refresh as RefreshIcon,
  Receipt as ReceiptIcon,
} from "@mui/icons-material";
import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import api from "@/libs/api";

export default function SettingsPage() {
  const { profile, session, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const token = session?.access_token;

  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" });

  // Supabase status
  interface SupabaseStatus {
    tier: string;
    database: { used_mb: number; max_mb: number; percentage: number };
    storage: { used_mb: number; max_gb: number; max_mb: number; percentage: number };
  }
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const fetchSupabaseStatus = useCallback(async () => {
    if (!token) return;
    setStatusLoading(true);
    try {
      const data = await api.get<SupabaseStatus>("/dashboard/supabase-status", token);
      setSupabaseStatus(data);
    } catch {
      setSnackbar({ open: true, message: t("settings.dbStatusError"), severity: "error" });
    } finally {
      setStatusLoading(false);
    }
  }, [token, t]);

  useEffect(() => {
    fetchSupabaseStatus();
  }, [fetchSupabaseStatus]);

  // Bill capacity
  interface BillCapacity {
    current_bills: number;
    current_items: number;
    items_per_bill: number;
    bytes_per_bill: number;
    total_bills_can_create: number;
    db_used_mb: number;
    db_max_mb: number;
    db_remaining_mb: number;
    avg_bills_per_day: number;
    avg_bills_per_month: number;
    days_of_operation: number;
    estimated_days_remaining: number | null;
    estimated_months_remaining: number | null;
  }
  const [billCapacity, setBillCapacity] = useState<BillCapacity | null>(null);
  const [billCapLoading, setBillCapLoading] = useState(false);

  const fetchBillCapacity = useCallback(async () => {
    if (!token) return;
    setBillCapLoading(true);
    try {
      const data = await api.get<BillCapacity>("/dashboard/bill-capacity", token);
      setBillCapacity(data);
    } catch {
      setSnackbar({ open: true, message: t("settings.billCapacityError"), severity: "error" });
    } finally {
      setBillCapLoading(false);
    }
  }, [token, t]);

  useEffect(() => {
    fetchBillCapacity();
  }, [fetchBillCapacity]);

  // PromptPay config (localStorage)
  const [promptPayId, setPromptPayId] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("promptpay_id") || "" : ""
  );

  const handleSavePromptPay = () => {
    const cleaned = promptPayId.replace(/[^0-9]/g, "");
    if (cleaned.length !== 10 && cleaned.length !== 13) {
      setSnackbar({ open: true, message: t("settings.promptPayInvalid"), severity: "error" });
      return;
    }
    localStorage.setItem("promptpay_id", cleaned);
    setPromptPayId(cleaned);
    setSnackbar({ open: true, message: t("settings.promptPaySaved"), severity: "success" });
  };

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    try {
      await api.put("/auth/profile", { full_name: fullName, phone }, token);
      await refreshProfile();
      setSnackbar({ open: true, message: t("settings.profileUpdated"), severity: "success" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Update failed";
      setSnackbar({ open: true, message, severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} className="mb-4">
        {t("settings.title")}
      </Typography>

      <Grid container spacing={3}>
        {/* Profile */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                {t("settings.profile")}
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Box className="flex items-center gap-3 mb-4">
                <Avatar sx={{ width: 56, height: 56, bgcolor: "primary.main", fontSize: 24 }}>
                  {profile?.full_name?.charAt(0) || "U"}
                </Avatar>
                <Box>
                  <Typography fontWeight={600}>{profile?.full_name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {profile?.email}
                  </Typography>
                  <Typography variant="caption" className="capitalize" color="primary">
                    {profile?.role}
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label={t("settings.fullName")}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label={t("settings.phone")}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField label={t("settings.email")} value={profile?.email || ""} fullWidth disabled />
                </Grid>
              </Grid>

              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={saving}
                sx={{ mt: 3 }}
              >
                {saving ? t("settings.saving") : t("settings.saveChanges")}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* PromptPay Config */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box className="flex items-center gap-2 mb-1">
                <QrIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  {t("settings.promptPay")}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t("settings.promptPayDesc")}
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <TextField
                label={t("settings.promptPayId")}
                value={promptPayId}
                onChange={(e) => setPromptPayId(e.target.value)}
                fullWidth
                placeholder={t("settings.promptPayPlaceholder")}
                helperText={promptPayId ? `${promptPayId.replace(/[^0-9]/g, "").length} ${t("settings.digits")}` : ""}
              />

              <Button
                variant="contained"
                color="success"
                startIcon={<SaveIcon />}
                onClick={handleSavePromptPay}
                sx={{ mt: 2 }}
              >
                {t("settings.savePromptPay")}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Supabase Database Status */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box className="flex items-center justify-between mb-1">
                <Box className="flex items-center gap-2">
                  <StorageIcon color="primary" />
                  <Typography variant="h6" fontWeight={600}>
                    {t("settings.dbStatus")}
                  </Typography>
                  {supabaseStatus && (
                    <Chip
                      label={`${supabaseStatus.tier} ${t("settings.tier")}`}
                      color="primary"
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>
                <Button
                  size="small"
                  startIcon={<RefreshIcon />}
                  onClick={fetchSupabaseStatus}
                  disabled={statusLoading}
                >
                  {t("settings.refresh")}
                </Button>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t("settings.dbStatusDesc")}
              </Typography>
              <Divider sx={{ mb: 3 }} />

              {statusLoading && !supabaseStatus ? (
                <Box className="flex justify-center py-4">
                  <CircularProgress size={32} />
                </Box>
              ) : supabaseStatus ? (
                <Grid container spacing={3}>
                  {/* Database Size */}
                  <Grid item xs={12} md={6}>
                    <Box>
                      <Box className="flex justify-between mb-1">
                        <Typography variant="body2" fontWeight={600}>
                          {t("settings.databaseSize")}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {supabaseStatus.database.used_mb} MB / {supabaseStatus.database.max_mb} MB
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(supabaseStatus.database.percentage, 100)}
                        sx={{
                          height: 10,
                          borderRadius: 5,
                          bgcolor: "grey.200",
                          "& .MuiLinearProgress-bar": {
                            borderRadius: 5,
                            bgcolor:
                              supabaseStatus.database.percentage > 90
                                ? "error.main"
                                : supabaseStatus.database.percentage > 70
                                ? "warning.main"
                                : "success.main",
                          },
                        }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                        {supabaseStatus.database.percentage}% {t("settings.used")}
                      </Typography>
                    </Box>
                  </Grid>

                  {/* File Storage */}
                  <Grid item xs={12} md={6}>
                    <Box>
                      <Box className="flex justify-between mb-1">
                        <Typography variant="body2" fontWeight={600}>
                          {t("settings.fileStorage")}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {supabaseStatus.storage.used_mb < 1024
                            ? `${supabaseStatus.storage.used_mb} MB`
                            : `${(supabaseStatus.storage.used_mb / 1024).toFixed(2)} GB`}{" "}
                          / {supabaseStatus.storage.max_gb} GB
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(supabaseStatus.storage.percentage, 100)}
                        sx={{
                          height: 10,
                          borderRadius: 5,
                          bgcolor: "grey.200",
                          "& .MuiLinearProgress-bar": {
                            borderRadius: 5,
                            bgcolor:
                              supabaseStatus.storage.percentage > 90
                                ? "error.main"
                                : supabaseStatus.storage.percentage > 70
                                ? "warning.main"
                                : "success.main",
                          },
                        }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                        {supabaseStatus.storage.percentage}% {t("settings.used")}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {t("settings.dbStatusUnavailable")}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Bill Capacity */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box className="flex items-center justify-between mb-1">
                <Box className="flex items-center gap-2">
                  <ReceiptIcon color="primary" />
                  <Typography variant="h6" fontWeight={600}>
                    {t("settings.billCapacity")}
                  </Typography>
                </Box>
                <Button
                  size="small"
                  startIcon={<RefreshIcon />}
                  onClick={fetchBillCapacity}
                  disabled={billCapLoading}
                >
                  {t("settings.refresh")}
                </Button>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t("settings.billCapacityDesc")}
              </Typography>
              <Divider sx={{ mb: 3 }} />

              {billCapLoading && !billCapacity ? (
                <Box className="flex justify-center py-4">
                  <CircularProgress size={32} />
                </Box>
              ) : billCapacity ? (
                <Grid container spacing={3}>
                  {/* Bills remaining */}
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: "center", p: 2, bgcolor: "success.50", borderRadius: 2, border: "1px solid", borderColor: "success.200" }}>
                      <Typography variant="h4" fontWeight={700} color="success.main">
                        {billCapacity.total_bills_can_create.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t("settings.billsRemaining")}
                      </Typography>
                    </Box>
                  </Grid>

                  {/* Bills created */}
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: "center", p: 2, bgcolor: "primary.50", borderRadius: 2, border: "1px solid", borderColor: "primary.200" }}>
                      <Typography variant="h4" fontWeight={700} color="primary.main">
                        {billCapacity.current_bills.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t("settings.billsCreated")}
                      </Typography>
                    </Box>
                  </Grid>

                  {/* DB remaining */}
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: "center", p: 2, bgcolor: "grey.50", borderRadius: 2, border: "1px solid", borderColor: "grey.300" }}>
                      <Typography variant="h4" fontWeight={700} color="text.primary">
                        {billCapacity.db_remaining_mb} <Typography component="span" variant="body2">MB</Typography>
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t("settings.databaseSize")} ({billCapacity.db_used_mb} / {billCapacity.db_max_mb} MB)
                      </Typography>
                    </Box>
                  </Grid>

                  {/* Stats table */}
                  <Grid item xs={12}>
                    <Divider sx={{ mb: 2 }} />
                    {billCapacity.days_of_operation > 0 ? (
                      <Grid container spacing={2}>
                        <Grid item xs={6} sm={3}>
                          <Box>
                            <Typography variant="caption" color="text.secondary">{t("settings.avgPerDay")}</Typography>
                            <Typography variant="h6" fontWeight={600}>
                              {billCapacity.avg_bills_per_day} {t("settings.bills")}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Box>
                            <Typography variant="caption" color="text.secondary">{t("settings.avgPerMonth")}</Typography>
                            <Typography variant="h6" fontWeight={600}>
                              {billCapacity.avg_bills_per_month} {t("settings.bills")}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Box>
                            <Typography variant="caption" color="text.secondary">{t("settings.daysOperation")}</Typography>
                            <Typography variant="h6" fontWeight={600}>
                              {billCapacity.days_of_operation} {t("settings.days")}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Box>
                            <Typography variant="caption" color="text.secondary">{t("settings.estimatedRemaining")}</Typography>
                            <Typography variant="h6" fontWeight={600}>
                              {billCapacity.estimated_months_remaining !== null
                                ? `${billCapacity.estimated_months_remaining} ${t("settings.months")}`
                                : "—"}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 1 }}>
                        {t("settings.noOrdersYet")}
                      </Typography>
                    )}
                  </Grid>
                </Grid>
              ) : null}
            </CardContent>
          </Card>
        </Grid>

        {/* System Info */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                {t("settings.systemInfo")}
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Box className="space-y-2">
                <Box className="flex justify-between">
                  <Typography variant="body2" color="text.secondary">{t("settings.application")}</Typography>
                  <Typography variant="body2" fontWeight={600}>NPMX POS v1.0.0</Typography>
                </Box>
                <Box className="flex justify-between">
                  <Typography variant="body2" color="text.secondary">{t("settings.taxRate")}</Typography>
                  <Typography variant="body2" fontWeight={600}>7% (VAT)</Typography>
                </Box>
                <Box className="flex justify-between">
                  <Typography variant="body2" color="text.secondary">{t("settings.currency")}</Typography>
                  <Typography variant="body2" fontWeight={600}>THB (฿)</Typography>
                </Box>
                <Box className="flex justify-between">
                  <Typography variant="body2" color="text.secondary">{t("settings.environment")}</Typography>
                  <Typography variant="body2" fontWeight={600}>{process.env.NODE_ENV}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
