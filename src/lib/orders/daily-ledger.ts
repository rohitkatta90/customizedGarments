/**
 * Aggregates for daily payment tracking & receivables (IST calendar day).
 */

import { pendingAmountInr } from "./ledger";
import type { PaymentAuditEntry, StoredOrder } from "./schema";

const IST = "Asia/Kolkata";

/** YYYY-MM-DD in IST for an instant (ISO string or Date). */
export function calendarDateInIST(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  return d.toLocaleDateString("en-CA", { timeZone: IST });
}

/** Today’s date string in IST (YYYY-MM-DD). */
export function todayIST(): string {
  return calendarDateInIST(new Date());
}

export type LedgerDailySummary = {
  /** Report date (IST), YYYY-MM-DD */
  reportDate: string;
  /** Sum of positive payment audit deltas on this date (IST), all orders */
  paymentsRecordedInr: number;
  /** Count of audit entries (positive delta) on this date */
  paymentEntryCount: number;
  /** Sum of pending balances across non-cancelled orders with a total set */
  pendingCollectionsInr: number;
  /** Orders contributing to pendingCollectionsInr */
  ordersWithReceivablesCount: number;
  /** Orders with status delivered whose deliveredAt falls on this IST day */
  deliveredCount: number;
  /** Sum of order totals for delivered-today (revenue recognized at delivery) */
  deliveredOrderValueInr: number;
};

function sumPositiveAuditsForDate(
  entries: PaymentAuditEntry[] | undefined,
  reportDate: string,
): { sum: number; count: number } {
  if (!entries?.length) return { sum: 0, count: 0 };
  let sum = 0;
  let count = 0;
  for (const e of entries) {
    if (e.deltaInr > 0 && calendarDateInIST(e.recordedAtIso) === reportDate) {
      sum += e.deltaInr;
      count += 1;
    }
  }
  return { sum, count };
}

/**
 * Build a daily snapshot from the current order list (typically last 500 orders).
 * Payment totals rely on `paymentAuditLog`; older orders without logs show ₹0 for “payments recorded”.
 */
export function computeLedgerDailySummary(
  orders: StoredOrder[],
  reportDate: string = todayIST(),
): LedgerDailySummary {
  let pendingCollectionsInr = 0;
  let ordersWithReceivablesCount = 0;
  let paymentsRecordedInr = 0;
  let paymentEntryCount = 0;
  let deliveredCount = 0;
  let deliveredOrderValueInr = 0;

  for (const o of orders) {
    if (o.status !== "cancelled") {
      const p = pendingAmountInr(o.totalAmountInr, o.paidAmountInr);
      if (p != null && p > 0) {
        pendingCollectionsInr += p;
        ordersWithReceivablesCount += 1;
      }
    }

    const audit = sumPositiveAuditsForDate(o.paymentAuditLog, reportDate);
    paymentsRecordedInr += audit.sum;
    paymentEntryCount += audit.count;

    if (o.status === "delivered" && o.deliveredAtIso) {
      if (calendarDateInIST(o.deliveredAtIso) === reportDate) {
        deliveredCount += 1;
        const t = o.totalAmountInr;
        if (t != null && Number.isFinite(t) && t > 0) {
          deliveredOrderValueInr += Math.round(t);
        }
      }
    }
  }

  return {
    reportDate,
    paymentsRecordedInr,
    paymentEntryCount,
    pendingCollectionsInr,
    ordersWithReceivablesCount,
    deliveredCount,
    deliveredOrderValueInr,
  };
}
