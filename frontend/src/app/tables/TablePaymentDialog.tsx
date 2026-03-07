"use client";

import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  Divider,
  Alert,
} from "@mui/material";
import {
  Payments as CashIcon,
  QrCode as QrIcon,
  CreditCard as CardIcon,
  AccountBalance as TransferIcon,
  CheckCircle as SuccessIcon,
} from "@mui/icons-material";
import { QRCodeSVG } from "qrcode.react";
import generatePayload from "promptpay-qr";
import Modal from "@/components/ui/Modal";
import { useLanguage } from "@/providers/LanguageProvider";
import api from "@/libs/api";
import type { PaymentMethod, RestaurantTable, Order } from "@/types";
import type { TranslationKey } from "@/libs/i18n/translations";

interface Props {
  open: boolean;
  onClose: () => void;
  table: RestaurantTable;
  orders: Order[];
  total: number;
  token: string;
  onComplete: (message: string) => void;
}

const PAYMENT_METHODS: { value: PaymentMethod; labelKey: TranslationKey; icon: React.ReactNode }[] = [
  { value: "cash", labelKey: "payment.cash", icon: <CashIcon /> },
  { value: "qr", labelKey: "payment.promptPay", icon: <QrIcon /> },
  { value: "credit_card", labelKey: "payment.card", icon: <CardIcon /> },
  { value: "transfer", labelKey: "payment.transfer", icon: <TransferIcon /> },
];

export default function TablePaymentDialog({ open, onClose, table, orders, total, token, onComplete }: Props) {
  const { t } = useLanguage();
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [tendered, setTendered] = useState("");
  const [reference, setReference] = useState("");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [change, setChange] = useState(0);
  const [error, setError] = useState("");

  const promptPayId = typeof window !== "undefined" ? localStorage.getItem("promptpay_id") || "" : "";
  const qrPayload = useMemo(() => {
    if (!promptPayId || total <= 0) return "";
    try {
      return generatePayload(promptPayId, { amount: total });
    } catch {
      return "";
    }
  }, [promptPayId, total]);

  const handlePay = async () => {
    if (!token) return;
    setProcessing(true);
    setError("");
    try {
      // Mark all active orders as completed
      await api.post(`/tables/${table.id}/clear`, {}, token);

      // Calculate change for cash
      const tenderedAmt = parseFloat(tendered) || total;
      const calculatedChange = method === "cash" ? Math.max(0, tenderedAmt - total) : 0;
      setChange(calculatedChange);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    if (success) {
      onComplete(`Payment completed — ฿${total.toFixed(2)} via ${method}`);
    }
    setMethod("cash");
    setTendered("");
    setReference("");
    setSuccess(false);
    setChange(0);
    setError("");
    onClose();
  };

  const quickAmounts = [20, 50, 100, 500, 1000];

  // Order breakdown
  const billLines = orders.filter((o) => o.status !== "cancelled" && o.status !== "voided");

  return (
    <Modal open={open} onClose={handleClose} title={`${t("payment.title")} — Table ${table.table_number}`} maxWidth="sm">
      {success ? (
        <Box className="flex flex-col items-center py-6">
          <SuccessIcon sx={{ fontSize: 64, color: "success.main", mb: 2 }} />
          <Typography variant="h5" fontWeight={700} gutterBottom>
            {t("payment.success")}
          </Typography>
          <Typography variant="h6" color="primary" fontWeight={700}>
            ฿{total.toFixed(2)}
          </Typography>
          {change > 0 && (
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              {t("payment.change")}: ฿{change.toFixed(2)}
            </Typography>
          )}
          <Button variant="contained" sx={{ mt: 3 }} onClick={handleClose}>
            Done
          </Button>
        </Box>
      ) : (
        <Box>
          {/* Bill Summary */}
          <Box sx={{ mb: 2, p: 1.5, bgcolor: "grey.50", borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Bill Summary — Table {table.table_number}
              {table.label ? ` (${table.label})` : ""}
            </Typography>
            {billLines.map((order) => (
              <Box key={order.id} sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  {order.order_number}
                  {order.order_items && order.order_items.length > 0 && (
                    <span style={{ marginLeft: 6, fontSize: "0.75rem" }}>
                      ({order.order_items.map((i) => `${i.product_name} ×${i.quantity}`).join(", ")})
                    </span>
                  )}
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  ฿{order.total.toFixed(2)}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Amount Due */}
          <Box className="text-center mb-3">
            <Typography variant="body2" color="text.secondary">
              {t("payment.amountDue")}
            </Typography>
            <Typography variant="h3" fontWeight={700} color="primary">
              ฿{total.toFixed(2)}
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Payment Method */}
          <Typography variant="body2" fontWeight={600} gutterBottom>
            {t("payment.method")}
          </Typography>
          <ToggleButtonGroup
            value={method}
            exclusive
            onChange={(_, v) => v && setMethod(v)}
            fullWidth
            sx={{ mb: 3 }}
          >
            {PAYMENT_METHODS.map((pm) => (
              <ToggleButton
                key={pm.value}
                value={pm.value}
                sx={{ py: 1.5, flexDirection: "column", gap: 0.5 }}
              >
                {pm.icon}
                <Typography variant="caption">{t(pm.labelKey)}</Typography>
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          {/* Cash */}
          {method === "cash" && (
            <Box className="mb-3">
              <TextField
                label={t("payment.amountTendered")}
                value={tendered}
                onChange={(e) => setTendered(e.target.value)}
                type="number"
                fullWidth
                inputProps={{ min: total, step: "0.01" }}
              />
              <Box className="flex gap-1 mt-2 flex-wrap">
                {quickAmounts.map((amt) => (
                  <Button key={amt} variant="outlined" size="small" onClick={() => setTendered(String(amt))}>
                    ฿{amt}
                  </Button>
                ))}
                <Button
                  variant="outlined"
                  size="small"
                  color="success"
                  onClick={() => setTendered(String(Math.ceil(total)))}
                >
                  {t("payment.exact")}
                </Button>
              </Box>
              {tendered && parseFloat(tendered) >= total && (
                <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                  {t("payment.change")}: ฿{(parseFloat(tendered) - total).toFixed(2)}
                </Typography>
              )}
            </Box>
          )}

          {/* QR PromptPay */}
          {method === "qr" && (
            <Box className="mb-3">
              {!promptPayId ? (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  {t("payment.promptPayNotSet")}
                </Alert>
              ) : !qrPayload ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {t("payment.qrError")}
                </Alert>
              ) : (
                <Box className="flex flex-col items-center">
                  <Box
                    sx={{
                      p: 2.5,
                      bgcolor: "#fff",
                      borderRadius: 3,
                      border: "2px solid",
                      borderColor: "primary.main",
                      display: "inline-flex",
                      mb: 2,
                    }}
                  >
                    <QRCodeSVG value={qrPayload} size={220} level="M" marginSize={1} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {t("payment.scanQr")}
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color="primary">
                    ฿{total.toFixed(2)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                    PromptPay: {promptPayId.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3")}
                  </Typography>
                </Box>
              )}
              <TextField
                label={t("payment.reference")}
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                fullWidth
                size="small"
                sx={{ mt: 2 }}
              />
            </Box>
          )}

          {/* Card / Transfer */}
          {method !== "cash" && method !== "qr" && (
            <TextField
              label={t("payment.referenceNumber")}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              fullWidth
              className="mb-3"
              sx={{ mb: 3 }}
            />
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={handlePay}
            disabled={
              processing ||
              (method === "cash" && tendered !== "" && parseFloat(tendered) < total)
            }
            sx={{ py: 1.5, mt: 1 }}
          >
            {processing ? t("payment.processing") : `${t("payment.pay")} ฿${total.toFixed(2)}`}
          </Button>
        </Box>
      )}
    </Modal>
  );
}
