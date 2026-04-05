import type { OrderItem } from "@/lib/order/types";

import type { OrderPriority } from "./priority";
import type { OrderStatus } from "./status";
import type { LedgerPaymentStatus, PaymentMode } from "./ledger";
import type { AccessoriesQuoteStatus, QuotedAccessoryLine } from "./styling-elements";

/** Append-only audit row when `paidAmountInr` changes (reconciliation). */
export type PaymentAuditEntry = {
  id: string;
  /** ISO-8601 timestamp when the change was saved */
  recordedAtIso: string;
  previousPaidInr: number;
  newPaidInr: number;
  /** Positive = money in; negative = correction downward */
  deltaInr: number;
};

/**
 * Stored order document (Firestore / future SQL). Keeps items embedded for MVP simplicity.
 */
export type StoredOrder = {
  id: string;
  /** Secret segment for public tracking URL; omit in older documents */
  trackingToken: string;
  customerName: string;
  customerPhone: string;
  /** Digits only — used for exact-match search */
  customerPhoneNormalized: string;
  requestedDeliveryDate: string | null;
  items: OrderItem[];
  status: OrderStatus;
  /** Scheduling / intake priority — does not auto-change dates */
  priority: OrderPriority;
  createdAtIso: string;
  updatedAtIso: string;
  confirmedAtIso: string | null;
  inProgressAtIso: string | null;
  readyAtIso: string | null;
  deliveredAtIso: string | null;
  cancelledAtIso: string | null;
  /** Staff-only — never exposed on /track */
  delayReasonInternal: string | null;
  /** Optional revised date shown to customers when plans change */
  revisedDeliveryDate: string | null;
  /** When status is cancelled — staff-only */
  cancellationReasonInternal: string | null;
  /** Post-confirmation scope / spec changes — staff-only */
  scopeChangeNotesInternal: string | null;
  /** Measurement or quality rework — staff-only */
  reworkNotesInternal: string | null;
  /** Quoted add-ons (Additional Styling Elements); not auto-included in base price */
  quotedAccessories: QuotedAccessoryLine[];
  /** Customer approval state for quoted extras */
  accessoriesQuoteStatus: AccessoriesQuoteStatus;
  /** Staff notes on quoting extras — not shown on /track */
  accessoriesNotesInternal: string | null;
  /** Agreed order total (INR), incl. extras — null until quoted */
  totalAmountInr: number | null;
  /** Sum received so far (INR) */
  paidAmountInr: number;
  /** Primary / expected payment instrument */
  paymentModePrimary: PaymentMode | null;
  /** e.g. advance UPI, balance COD */
  financialNotes: string | null;
  /** Derived: pending / partial / paid / none (cancelled) */
  ledgerPaymentStatus: LedgerPaymentStatus;
  /** Optional audit trail for payment changes (older docs may omit) */
  paymentAuditLog?: PaymentAuditEntry[];
  /**
   * Shared folder link (e.g. Google Drive) containing renamed design images + notes.txt for this order.
   * Staff-maintained; not shown on public /track.
   */
  designAssetsFolderUrl: string | null;
  /**
   * Structured bullet notes for tailor / cutting master (normalized spec). Staff-only.
   */
  tailorHandoffNotesInternal: string | null;
  /**
   * Quick flow, girls' wear: customer-entered age in whole years (5–12). Null when not applicable.
   */
  quickChildAgeYears: number | null;
};

/** Minimal shape for the public tracking page (no PII beyond first name optional). */
export type PublicTrackingOrder = {
  orderRefShort: string;
  status: OrderStatus;
  requestedDeliveryDate: string | null;
  revisedDeliveryDate: string | null;
  itemCount: number;
  updatedAtIso: string;
  /** First word of customer name for greeting, or null */
  customerFirstName: string | null;
};
