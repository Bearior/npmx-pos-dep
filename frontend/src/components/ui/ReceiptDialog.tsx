"use client";

import React, { useRef } from "react";
import {
  Box,
  Typography,
  Button,
  Divider,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Dialog,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material";
import {
  Print as PrintIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { useLanguage } from "@/providers/LanguageProvider";

interface ReceiptItem {
  name: string;
  variant?: string | null;
  quantity: number;
  unit_price: number;
  total: number;
  notes?: string | null;
}

interface ReceiptPayment {
  method: string;
  amount: number;
  tendered?: number | null;
  change: number;
  reference?: string | null;
  date: string;
}

export interface ReceiptData {
  order_number: string;
  date: string;
  cashier: string;
  customer_name?: string | null;
  table_number?: string | null;
  items: ReceiptItem[];
  subtotal: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  payments: ReceiptPayment[];
  status: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  receipt: ReceiptData | null;
}

const methodLabels: Record<string, { en: string; th: string }> = {
  cash: { en: "Cash", th: "เงินสด" },
  qr: { en: "PromptPay", th: "พร้อมเพย์" },
  credit_card: { en: "Credit Card", th: "บัตรเครดิต" },
  transfer: { en: "Transfer", th: "โอนเงิน" },
};

export default function ReceiptDialog({ open, onClose, receipt }: Props) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const { t, locale } = useLanguage();

  if (!receipt) return null;

  const handlePrint = () => {
    const content = receiptRef.current;
    if (!content) return;

    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${t("receipt.receipt")} - ${receipt.order_number}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Courier New', monospace;
              width: 80mm;
              padding: 4mm;
              font-size: 12px;
              color: #000;
            }
            .center { text-align: center; }
            .right { text-align: right; }
            .bold { font-weight: bold; }
            .divider {
              border-top: 1px dashed #000;
              margin: 6px 0;
            }
            table { width: 100%; border-collapse: collapse; }
            td { padding: 2px 0; vertical-align: top; }
            .item-name { width: 50%; }
            .item-qty { width: 15%; text-align: center; }
            .item-price { width: 35%; text-align: right; }
            .total-row td { padding-top: 4px; }
            .grand-total td {
              padding-top: 6px;
              font-size: 14px;
              font-weight: bold;
            }
            .footer { margin-top: 8px; font-size: 11px; }
            @media print {
              body { width: 80mm; }
              @page { margin: 0; size: 80mm auto; }
            }
          </style>
        </head>
        <body>
          ${content.innerHTML}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(locale === "th" ? "th-TH" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getMethodLabel = (method: string) => {
    const labels = methodLabels[method];
    return labels ? labels[locale] : method;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          pt: 2,
        }}
      >
        <Typography variant="h6" fontWeight={700}>
          {t("receipt.receipt")}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent>
        {/* Printable receipt content */}
        <Box
          ref={receiptRef}
          sx={{
            fontFamily: "'Courier New', monospace",
            fontSize: 13,
            bgcolor: "#fff",
            color: "#000",
            p: 2,
            border: "1px solid #e0e0e0",
            borderRadius: 1,
          }}
        >
          {/* Header */}
          <Box className="center" sx={{ textAlign: "center", mb: 1 }}>
            <Typography
              sx={{ fontFamily: "inherit", fontWeight: 700, fontSize: 16 }}
            >
              NPMX CAFÉ POS
            </Typography>
            <Typography sx={{ fontFamily: "inherit", fontSize: 11, color: "#666" }}>
              {t("receipt.receipt")}
            </Typography>
          </Box>

          <Divider sx={{ borderStyle: "dashed", my: 1 }} />

          {/* Order info */}
          <Box sx={{ fontSize: 12 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <span>{t("receipt.orderNo")}:</span>
              <strong>{receipt.order_number}</strong>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <span>{t("receipt.date")}:</span>
              <span>{formatDate(receipt.date)}</span>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <span>{t("receipt.cashier")}:</span>
              <span>{receipt.cashier}</span>
            </Box>
            {receipt.table_number && (
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <span>{t("receipt.table")}:</span>
                <span>{receipt.table_number}</span>
              </Box>
            )}
            {receipt.customer_name && (
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <span>{t("receipt.customer")}:</span>
                <span>{receipt.customer_name}</span>
              </Box>
            )}
          </Box>

          <Divider sx={{ borderStyle: "dashed", my: 1 }} />

          {/* Items */}
          <Table size="small" sx={{ "& td": { border: 0, py: 0.3, fontFamily: "inherit", fontSize: 12 } }}>
            <TableBody>
              {receipt.items.map((item, idx) => (
                <React.Fragment key={idx}>
                  <TableRow>
                    <TableCell sx={{ width: "50%" }}>
                      {item.name}
                      {item.variant && (
                        <Typography sx={{ fontSize: 10, color: "#666", fontFamily: "inherit" }}>
                          ({item.variant})
                        </Typography>
                      )}
                      {item.notes && (
                        <Typography sx={{ fontSize: 10, color: "#888", fontFamily: "inherit", fontStyle: "italic" }}>
                          {item.notes}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ width: "15%", textAlign: "center" }}>
                      x{item.quantity}
                    </TableCell>
                    <TableCell sx={{ width: "35%", textAlign: "right" }}>
                      ฿{item.total.toFixed(2)}
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>

          <Divider sx={{ borderStyle: "dashed", my: 1 }} />

          {/* Totals */}
          <Box sx={{ fontSize: 12 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <span>{t("receipt.subtotal")}:</span>
              <span>฿{receipt.subtotal.toFixed(2)}</span>
            </Box>
            {receipt.discount_amount > 0 && (
              <Box sx={{ display: "flex", justifyContent: "space-between", color: "green" }}>
                <span>{t("receipt.discount")}:</span>
                <span>-฿{receipt.discount_amount.toFixed(2)}</span>
              </Box>
            )}
            {receipt.tax_amount > 0 && (
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <span>{t("receipt.vat")} ({(receipt.tax_rate * 100).toFixed(0)}%):</span>
                <span>฿{receipt.tax_amount.toFixed(2)}</span>
              </Box>
            )}

            <Divider sx={{ borderStyle: "dashed", my: 0.5 }} />

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                fontWeight: 700,
                fontSize: 15,
                py: 0.5,
              }}
            >
              <span>{t("receipt.total")}:</span>
              <span>฿{receipt.total.toFixed(2)}</span>
            </Box>
          </Box>

          <Divider sx={{ borderStyle: "dashed", my: 1 }} />

          {/* Payment info */}
          <Box sx={{ fontSize: 12 }}>
            {receipt.payments.map((p, idx) => (
              <Box key={idx}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <span>{t("receipt.paidBy")} {getMethodLabel(p.method)}:</span>
                  <span>฿{p.amount.toFixed(2)}</span>
                </Box>
                {p.tendered && p.tendered > p.amount && (
                  <>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <span>{t("receipt.tendered")}:</span>
                      <span>฿{p.tendered.toFixed(2)}</span>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <span>{t("receipt.change")}:</span>
                      <span>฿{p.change.toFixed(2)}</span>
                    </Box>
                  </>
                )}
                {p.reference && (
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <span>{t("receipt.ref")}:</span>
                    <span>{p.reference}</span>
                  </Box>
                )}
              </Box>
            ))}
          </Box>

          <Divider sx={{ borderStyle: "dashed", my: 1 }} />

          {/* Footer */}
          <Box sx={{ textAlign: "center", fontSize: 11, color: "#666" }}>
            <Typography sx={{ fontFamily: "inherit", fontSize: 11 }}>
              {t("receipt.thankYou")}
            </Typography>
            <Typography sx={{ fontFamily: "inherit", fontSize: 10, mt: 0.5 }}>
              {t("receipt.powered")}
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">
          {t("common.close")}
        </Button>
        <Button
          variant="contained"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
        >
          {t("receipt.print")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
