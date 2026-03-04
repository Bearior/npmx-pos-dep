"use client";

import React, { useState } from "react";
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
} from "@mui/material";
import { Save as SaveIcon, QrCode as QrIcon } from "@mui/icons-material";
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
