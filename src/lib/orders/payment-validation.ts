/**
 * Server-side rules for payment tracking and delivery reconciliation.
 * See docs/PAYMENT_RECONCILIATION.md
 */

import { computeLedgerPaymentStatus } from "./ledger";
import type { PaymentMode } from "./ledger";
import type { StoredOrder } from "./schema";
import type { OrderStatus } from "./status";

/** Max allowed overpayment (₹) before we treat it as a data entry error */
export const PAID_OVER_TOTAL_TOLERANCE_INR = 1;

export type PatchValidationError = {
  code: string;
  message: string;
};

export type FinancialPatch = {
  status?: string;
  totalAmountInr?: number | null;
  paidAmountInr?: number;
  paymentModePrimary?: string | null;
  financialNotes?: string | null;
};

export type MergedFinancialSnapshot = {
  status: OrderStatus;
  totalAmountInr: number | null;
  paidAmountInr: number;
  paymentModePrimary: PaymentMode | null;
};

/**
 * Merge existing order with optional PATCH fields (only defined keys override).
 */
export function mergeOrderFinancialPatch(
  existing: StoredOrder,
  patch: FinancialPatch,
): MergedFinancialSnapshot {
  const status =
    patch.status !== undefined && patch.status !== ""
      ? (patch.status as OrderStatus)
      : existing.status;
  const totalAmountInr =
    patch.totalAmountInr !== undefined ? patch.totalAmountInr : existing.totalAmountInr;
  const paidAmountInr =
    patch.paidAmountInr !== undefined ? patch.paidAmountInr : existing.paidAmountInr;
  const paymentModePrimary =
    patch.paymentModePrimary !== undefined
      ? patch.paymentModePrimary === "" || patch.paymentModePrimary === null
        ? null
        : (patch.paymentModePrimary as PaymentMode)
      : existing.paymentModePrimary;

  return {
    status,
    totalAmountInr,
    paidAmountInr: Math.max(0, Math.round(paidAmountInr)),
    paymentModePrimary,
  };
}

export function validatePaidAgainstTotal(
  totalAmountInr: number | null,
  paidAmountInr: number,
): PatchValidationError | undefined {
  if (paidAmountInr > 0 && (totalAmountInr == null || !Number.isFinite(totalAmountInr))) {
    return {
      code: "paid_without_total",
      message:
        "Amount received is set, but order total is missing. Enter the agreed total (₹) before recording payments.",
    };
  }
  if (totalAmountInr != null && totalAmountInr > 0) {
    if (paidAmountInr > totalAmountInr + PAID_OVER_TOTAL_TOLERANCE_INR) {
      return {
        code: "paid_exceeds_total",
        message: `Amount received (₹${paidAmountInr}) is higher than the order total (₹${Math.round(totalAmountInr)}). Fix the typo or adjust the total first.`,
      };
    }
  }
  return undefined;
}

/**
 * Block marking an order delivered until quote + payment mode + full settlement are recorded.
 * Applies to full payment, partial (balance cleared), and COD (cash collected at handover).
 */
export function validateDeliveryTransition(merged: MergedFinancialSnapshot): PatchValidationError | undefined {
  if (merged.status !== "delivered") {
    return undefined;
  }

  if (merged.totalAmountInr == null || merged.totalAmountInr <= 0) {
    return {
      code: "delivery_requires_total",
      message:
        "Cannot mark delivered without an agreed order total. Set Total (₹) on the order first.",
    };
  }

  if (merged.paymentModePrimary == null) {
    return {
      code: "delivery_requires_payment_mode",
      message:
        "Choose how payment was settled (UPI, COD, mixed, etc.) before marking delivered — it keeps the ledger accurate.",
    };
  }

  const ledger = computeLedgerPaymentStatus(
    merged.totalAmountInr,
    merged.paidAmountInr,
    merged.status,
  );
  if (ledger !== "paid") {
    const pending = Math.max(0, Math.round(merged.totalAmountInr) - merged.paidAmountInr);
    return {
      code: "delivery_requires_full_settlement",
      message: `Outstanding balance is ₹${pending}. Record the payment received (including COD at delivery) so paid matches the total, then mark delivered.`,
    };
  }

  return undefined;
}

export function validateOrderPatch(
  existing: StoredOrder,
  patch: FinancialPatch,
): PatchValidationError | undefined {
  const merged = mergeOrderFinancialPatch(existing, patch);
  const a = validatePaidAgainstTotal(merged.totalAmountInr, merged.paidAmountInr);
  if (a) return a;
  return validateDeliveryTransition(merged);
}
