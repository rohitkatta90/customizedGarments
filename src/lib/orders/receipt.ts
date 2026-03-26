import { describeOrderItemLinesForReceipt } from "@/lib/order/whatsapp";
import { siteConfig } from "@/lib/site";
import type { CatalogItem } from "@/lib/types";

import {
  computeLedgerPaymentStatus,
  pendingAmountInr,
  type LedgerPaymentStatus,
  type PaymentMode,
} from "./ledger";
import type { StoredOrder } from "./schema";
import type { OrderStatus } from "./status";
import type { QuotedAccessoryLine } from "./styling-elements";

export type ReceiptLedgerOverrides = {
  totalAmountInr: number | null;
  paidAmountInr: number;
  paymentModePrimary: PaymentMode | null;
  financialNotes: string | null;
  status: OrderStatus;
};

export function formatPaymentModeForReceipt(mode: PaymentMode | null | undefined): string {
  if (mode == null) return "Not specified";
  switch (mode) {
    case "UPI":
      return "UPI";
    case "COD":
      return "Cash on delivery (COD)";
    case "mixed":
      return "Mixed (e.g. UPI + cash / COD)";
    case "cash":
      return "Cash";
    case "other":
      return "Other";
    default:
      return String(mode);
  }
}

export function formatLedgerPaymentStatusForReceipt(status: LedgerPaymentStatus): string {
  switch (status) {
    case "paid":
      return "Paid in full";
    case "partial":
      return "Part paid — balance may be due";
    case "pending":
      return "Payment pending";
    case "none":
      return "N/A (cancelled)";
    default:
      return status;
  }
}

function formatInr(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}

function receiptDateLabel(order: StoredOrder, nowIso: string): { line: string } {
  if (order.deliveredAtIso?.trim()) {
    const d = new Date(order.deliveredAtIso);
    return {
      line: `Delivery / handover: ${d.toLocaleDateString("en-IN", { dateStyle: "long" })}`,
    };
  }
  const d = new Date(nowIso);
  return {
    line: `Receipt date: ${d.toLocaleDateString("en-IN", { dateStyle: "long" })}`,
  };
}

/**
 * WhatsApp-friendly plain-text receipt: business name, order ref, customer, line items,
 * totals, payment mode & status, date. Tone: friendly-professional.
 */
export function buildWhatsAppReceiptText(input: {
  businessName: string;
  order: StoredOrder;
  catalog: CatalogItem[];
  /** Current form values — when set, receipt reflects unsaved edits */
  ledgerOverrides?: ReceiptLedgerOverrides;
  quotedAccessoriesOverride?: QuotedAccessoryLine[];
  /** ISO timestamp for "today" when no delivery date */
  nowIso?: string;
}): string {
  const { businessName, order, catalog } = input;
  const nowIso = input.nowIso ?? new Date().toISOString();

  const total =
    input.ledgerOverrides?.totalAmountInr !== undefined
      ? input.ledgerOverrides.totalAmountInr
      : order.totalAmountInr;
  const paid =
    input.ledgerOverrides?.paidAmountInr !== undefined
      ? input.ledgerOverrides.paidAmountInr
      : order.paidAmountInr;
  const paymentMode =
    input.ledgerOverrides?.paymentModePrimary !== undefined
      ? input.ledgerOverrides.paymentModePrimary
      : order.paymentModePrimary;
  const financialNotes =
    input.ledgerOverrides?.financialNotes !== undefined
      ? input.ledgerOverrides.financialNotes
      : order.financialNotes;
  const status = input.ledgerOverrides?.status ?? order.status;

  const ledgerStatus = computeLedgerPaymentStatus(total, paid, status);
  const pending = pendingAmountInr(total, paid);

  const accessories =
    input.quotedAccessoriesOverride !== undefined
      ? input.quotedAccessoriesOverride
      : order.quotedAccessories;

  const lines: string[] = [
    `${businessName}`,
    "",
    "Thanks for choosing us — here’s your order summary.",
    "",
    `Order ID: ${order.id}`,
    `Customer: ${order.customerName.trim() || "—"}`,
    receiptDateLabel(order, nowIso).line,
    "",
    "— Services —",
  ];

  order.items.forEach((item, index) => {
    lines.push(...describeOrderItemLinesForReceipt(item, catalog, index));
    lines.push("");
  });

  const accLines = accessories.filter((l) => l.label.trim());
  if (accLines.length > 0) {
    lines.push("— Quoted extras —");
    accLines.forEach((row, i) => {
      const amt =
        row.amountInr != null && Number.isFinite(row.amountInr)
          ? ` (${formatInr(Math.max(0, row.amountInr))})`
          : "";
      lines.push(`${i + 1}. ${row.label.trim()}${amt}`);
    });
    lines.push("");
  }

  lines.push("— Payment —");

  if (total != null && Number.isFinite(total) && total > 0) {
    lines.push(`Order total: ${formatInr(Math.round(total))}`);
  } else {
    lines.push("Order total: (not set on file — confirm if needed)");
  }

  lines.push(`Amount received: ${formatInr(Math.round(Math.max(0, paid)))}`);

  if (ledgerStatus === "partial" || (ledgerStatus === "pending" && total != null && total > 0)) {
    if (pending != null && pending > 0) {
      lines.push(`Balance: ${formatInr(pending)}`);
    }
  }

  lines.push(`Payment mode: ${formatPaymentModeForReceipt(paymentMode)}`);
  lines.push(`Payment status: ${formatLedgerPaymentStatusForReceipt(ledgerStatus)}`);

  if (financialNotes?.trim()) {
    lines.push(`Note: ${financialNotes.trim()}`);
  }

  if (order.trackingToken.trim()) {
    const base = siteConfig.siteUrl.replace(/\/$/, "");
    if (base) {
      lines.push("");
      lines.push(`Track anytime: ${base}/track/${order.trackingToken}`);
    }
  }

  lines.push("");
  lines.push("We appreciate your trust. See you again soon!");

  return lines.join("\n");
}
