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
  CircularProgress,
} from "@mui/material";
import {
  Payments as CashIcon,
  QrCode as QrIcon,
  CreditCard as CardIcon,
  AccountBalance as TransferIcon,
  CheckCircle as SuccessIcon,
  Receipt as ReceiptIcon,
} from "@mui/icons-material";
import { QRCodeSVG } from "qrcode.react";
import generatePayload from "promptpay-qr";
import Modal from "@/components/ui/Modal";
import ReceiptDialog from "@/components/ui/ReceiptDialog";
import type { ReceiptData } from "@/components/ui/ReceiptDialog";
import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import api from "@/libs/api";
import type { CartItem, PaymentMethod } from "@/types";
import type { TranslationKey } from "@/libs/i18n/translations";

interface Props {
  open: boolean;
  onClose: () => void;
  cart: CartItem[];
  subtotal: number;
  discountAmount: number;
  discountCode?: string;
  taxAmount: number;
  total: number;
  customerName: string;
  tableNumber: string;
  onComplete: () => void;
}

const PAYMENT_METHODS: { value: PaymentMethod; labelKey: TranslationKey; icon: React.ReactNode }[] = [
  { value: "cash", labelKey: "payment.cash", icon: <CashIcon /> },
  { value: "qr", labelKey: "payment.promptPay", icon: <QrIcon /> },
  { value: "credit_card", labelKey: "payment.card", icon: <CardIcon /> },
  { value: "transfer", labelKey: "payment.transfer", icon: <TransferIcon /> },
];

export default function PaymentDialog({
  open,
  onClose,
  cart,
  subtotal,
  discountAmount,
  discountCode,
  taxAmount,
  total,
  customerName,
  tableNumber,
  onComplete,
}: Props) {
  const { session } = useAuth();
  const { t } = useLanguage();
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [tendered, setTendered] = useState("");
  const [reference, setReference] = useState("");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [change, setChange] = useState(0);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  // PromptPay QR payload
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
    if (!session?.access_token) return;
    setProcessing(true);
    setError("");

    try {
      // 1. Create order
      const orderBody = {
        items: cart.map((item) => ({
          product_id: item.product.id,
          variant_id: item.variants?.[0]?.id,
          variant_info: item.variants?.map((v) => v.name).join(", "),
          quantity: item.quantity,
          notes: item.notes,
        })),
        discount_code: discountCode,
        discount_amount: discountCode ? undefined : discountAmount > 0 ? discountAmount : undefined,
        customer_name: customerName || undefined,
        table_number: tableNumber || undefined,
      };

      const order = await api.post<{ id: string }>("/orders", orderBody, session.access_token);
      setOrderId(order.id);

      // 2. Create payment
      const paymentBody = {
        order_id: order.id,
        method,
        amount: method === "cash" ? parseFloat(tendered || String(total)) : total,
        reference_number: reference || undefined,
      };

      const payment = await api.post<{ change: number }>("/payments", paymentBody, session.access_token);

      setChange(payment.change || 0);
      setSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Payment failed";
      setError(message);
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    if (success) {
      onComplete();
    }
    setMethod("cash");
    setTendered("");
    setReference("");
    setSuccess(false);
    setChange(0);
    setError("");
    setOrderId(null);
    setReceiptData(null);
    onClose();
  };

  const handlePrintReceipt = async () => {
    if (!orderId || !session?.access_token) return;
    try {
      const res = await api.get<{ success: boolean; data: ReceiptData }>(
        `/orders/${orderId}/receipt`,
        session.access_token
      );
      setReceiptData(res.data);
      setReceiptOpen(true);
    } catch (err) {
      console.error("Failed to load receipt:", err);
    }
  };

  const quickAmounts = [20, 50, 100, 500, 1000];

  return (
    <>
    <Modal open={open} onClose={handleClose} title={t("payment.title")} maxWidth="sm">
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
          <Box className="flex gap-2 mt-3">
            <Button
              variant="outlined"
              startIcon={<ReceiptIcon />}
              onClick={handlePrintReceipt}
            >
              {t("receipt.print")}
            </Button>
            <Button variant="contained" onClick={handleClose}>
              {t("payment.newOrder")}
            </Button>
          </Box>
        </Box>
      ) : (
        <Box>
          {/* Total */}
          <Box className="text-center mb-4">
            <Typography variant="body2" color="text.secondary">
              {t("payment.amountDue")}
            </Typography>
            <Typography variant="h3" fontWeight={700} color="primary">
              ฿{total.toFixed(2)}
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Payment method */}
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
              <ToggleButton key={pm.value} value={pm.value} sx={{ py: 1.5, flexDirection: "column", gap: 0.5 }}>
                {pm.icon}
                <Typography variant="caption">{t(pm.labelKey)}</Typography>
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          {/* Cash: tendered amount */}
          {method === "cash" && (
            <Box className="mb-3">
              <TextField
                label={t("payment.amountTendered")}
                value={tendered}
                onChange={(e) => setTendered(e.target.value)}
                type="number"
                fullWidth
                inputProps={{ min: total }}
              />
              <Box className="flex gap-1 mt-2 flex-wrap">
                {quickAmounts.map((amt) => (
                  <Button
                    key={amt}
                    variant="outlined"
                    size="small"
                    onClick={() => setTendered(String(amt))}
                  >
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
                    <QRCodeSVG
                      value={qrPayload}
                      size={220}
                      level="M"
                      marginSize={1}
                    />
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

          {/* Card / Transfer: reference number */}
          {method !== "cash" && method !== "qr" && (
            <TextField
              label={t("payment.referenceNumber")}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              fullWidth
              className="mb-3"
            />
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Pay button */}
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

    <ReceiptDialog
      open={receiptOpen}
      onClose={() => setReceiptOpen(false)}
      receipt={receiptData}
    />
    </>
  );
}
