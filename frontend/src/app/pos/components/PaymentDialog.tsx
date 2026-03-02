"use client";

import React, { useState } from "react";
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
import Modal from "@/components/ui/Modal";
import { useAuth } from "@/providers/AuthProvider";
import api from "@/libs/api";
import type { CartItem, PaymentMethod } from "@/types";

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

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { value: "cash", label: "Cash", icon: <CashIcon /> },
  { value: "qr", label: "QR Code", icon: <QrIcon /> },
  { value: "credit_card", label: "Card", icon: <CardIcon /> },
  { value: "transfer", label: "Transfer", icon: <TransferIcon /> },
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
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [tendered, setTendered] = useState("");
  const [reference, setReference] = useState("");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [change, setChange] = useState(0);
  const [error, setError] = useState("");

  const handlePay = async () => {
    if (!session?.access_token) return;
    setProcessing(true);
    setError("");

    try {
      // 1. Create order
      const orderBody = {
        items: cart.map((item) => ({
          product_id: item.product.id,
          variant_id: item.variant?.id,
          variant_info: item.variant?.name,
          quantity: item.quantity,
          notes: item.notes,
        })),
        discount_code: discountCode,
        discount_amount: discountCode ? undefined : discountAmount > 0 ? discountAmount : undefined,
        customer_name: customerName || undefined,
        table_number: tableNumber || undefined,
      };

      const order = await api.post<{ id: string }>("/orders", orderBody, session.access_token);

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
    onClose();
  };

  const quickAmounts = [20, 50, 100, 500, 1000];

  return (
    <Modal open={open} onClose={handleClose} title="Payment" maxWidth="sm">
      {success ? (
        <Box className="flex flex-col items-center py-6">
          <SuccessIcon sx={{ fontSize: 64, color: "success.main", mb: 2 }} />
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Payment Successful!
          </Typography>
          <Typography variant="h6" color="primary" fontWeight={700}>
            ฿{total.toFixed(2)}
          </Typography>
          {change > 0 && (
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              Change: ฿{change.toFixed(2)}
            </Typography>
          )}
          <Button variant="contained" sx={{ mt: 3 }} onClick={handleClose}>
            New Order
          </Button>
        </Box>
      ) : (
        <Box>
          {/* Total */}
          <Box className="text-center mb-4">
            <Typography variant="body2" color="text.secondary">
              Amount Due
            </Typography>
            <Typography variant="h3" fontWeight={700} color="primary">
              ฿{total.toFixed(2)}
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Payment method */}
          <Typography variant="body2" fontWeight={600} gutterBottom>
            Payment Method
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
                <Typography variant="caption">{pm.label}</Typography>
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          {/* Cash: tendered amount */}
          {method === "cash" && (
            <Box className="mb-3">
              <TextField
                label="Amount tendered"
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
                  Exact
                </Button>
              </Box>
              {tendered && parseFloat(tendered) >= total && (
                <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                  Change: ฿{(parseFloat(tendered) - total).toFixed(2)}
                </Typography>
              )}
            </Box>
          )}

          {/* QR / Card / Transfer: reference number */}
          {method !== "cash" && (
            <TextField
              label="Reference Number (optional)"
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
            {processing ? "Processing..." : `Pay ฿${total.toFixed(2)}`}
          </Button>
        </Box>
      )}
    </Modal>
  );
}
