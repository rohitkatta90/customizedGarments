/**
 * Simple financial ledger fields for orders + expense categories.
 * See docs/FINANCIAL_LEDGER.md
 */

import type { OrderStatus } from "./status";

export const PAYMENT_MODES = ["UPI", "COD", "mixed", "cash", "other"] as const;
export type PaymentMode = (typeof PAYMENT_MODES)[number];

export function isPaymentMode(s: string): s is PaymentMode {
  return (PAYMENT_MODES as readonly string[]).includes(s);
}

/** Derived from total vs paid; stored on order for filtering. */
export const LEDGER_PAYMENT_STATUSES = ["pending", "partial", "paid", "none"] as const;
export type LedgerPaymentStatus = (typeof LEDGER_PAYMENT_STATUSES)[number];

export function isLedgerPaymentStatus(s: string): s is LedgerPaymentStatus {
  return (LEDGER_PAYMENT_STATUSES as readonly string[]).includes(s);
}

/**
 * `none` = cancelled / not applicable; `pending` = unpaid or total not set yet.
 */
export function computeLedgerPaymentStatus(
  totalInr: number | null | undefined,
  paidInr: number | null | undefined,
  orderStatus: OrderStatus,
): LedgerPaymentStatus {
  if (orderStatus === "cancelled") {
    return "none";
  }
  const total = totalInr != null && Number.isFinite(totalInr) ? Math.max(0, totalInr) : 0;
  const paid = paidInr != null && Number.isFinite(paidInr) ? Math.max(0, paidInr) : 0;

  if (total <= 0) {
    return "pending";
  }
  if (paid >= total) {
    return "paid";
  }
  if (paid > 0) {
    return "partial";
  }
  return "pending";
}

export function pendingAmountInr(
  totalInr: number | null | undefined,
  paidInr: number | null | undefined,
): number | null {
  if (totalInr == null || !Number.isFinite(totalInr)) return null;
  const paid = paidInr != null && Number.isFinite(paidInr) ? Math.max(0, paidInr) : 0;
  return Math.max(0, Math.round(totalInr) - paid);
}

export const EXPENSE_TYPES = [
  "fabric",
  "accessories",
  "labor",
  "rent",
  "utilities",
  "transport",
  "other",
] as const;
export type ExpenseType = (typeof EXPENSE_TYPES)[number];

export function isExpenseType(s: string): s is ExpenseType {
  return (EXPENSE_TYPES as readonly string[]).includes(s);
}
