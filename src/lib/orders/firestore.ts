import { randomBytes } from "crypto";

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import {
  FieldValue,
  getFirestore,
  type DocumentData,
  type Firestore,
  type Timestamp,
} from "firebase-admin/firestore";

import type { OrderItem } from "@/lib/order/types";

import { normalizeOrderPriority, type OrderPriority } from "./priority";
import type { PaymentAuditEntry, PublicTrackingOrder, StoredOrder } from "./schema";
import type { OrderStatus } from "./status";
import { normalizeOrderStatus } from "./status";
import { normalizeAccessoriesQuoteStatus, parseQuotedAccessoriesFromJson } from "./styling-elements";
import type { AccessoriesQuoteStatus, QuotedAccessoryLine } from "./styling-elements";
import { computeLedgerPaymentStatus } from "./ledger";
import type { PaymentMode } from "./ledger";
import { isPaymentMode } from "./ledger";
import { normalizePhone } from "./phone";

const COLLECTION = "garment_orders";

/** Firestore rejects `undefined`; client/quick payloads may omit optional fields as explicit undefined. */
function orderItemsForFirestore(items: OrderItem[]): OrderItem[] {
  return JSON.parse(JSON.stringify(items)) as OrderItem[];
}

function getFirebaseApp(): App | null {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }
  privateKey = privateKey.replace(/\\n/g, "\n");
  if (getApps().length > 0) {
    return getApps()[0]!;
  }
  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

export function isFirestoreConfigured(): boolean {
  return getFirebaseApp() !== null;
}

function db(): Firestore {
  const app = getFirebaseApp();
  if (!app) {
    throw new Error("Firestore is not configured");
  }
  return getFirestore(app);
}

/** For sibling modules (e.g. expenses ledger) that share the same DB. */
export function adminDb(): Firestore {
  return db();
}

function tsToIso(t: Timestamp | undefined | null): string | null {
  if (!t) return null;
  return t.toDate().toISOString();
}

function parsePaymentAuditLog(raw: unknown): PaymentAuditEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: PaymentAuditEntry[] = [];
  for (const r of raw) {
    if (!r || typeof r !== "object") continue;
    const o = r as Record<string, unknown>;
    if (
      typeof o.id === "string" &&
      typeof o.recordedAtIso === "string" &&
      typeof o.previousPaidInr === "number" &&
      Number.isFinite(o.previousPaidInr) &&
      typeof o.newPaidInr === "number" &&
      Number.isFinite(o.newPaidInr) &&
      typeof o.deltaInr === "number" &&
      Number.isFinite(o.deltaInr)
    ) {
      out.push({
        id: o.id,
        recordedAtIso: o.recordedAtIso,
        previousPaidInr: Math.round(o.previousPaidInr),
        newPaidInr: Math.round(o.newPaidInr),
        deltaInr: Math.round(o.deltaInr),
      });
    }
  }
  return out;
}

export function generateTrackingToken(): string {
  return randomBytes(24).toString("hex");
}

function mapDocToStoredOrder(id: string, d: DocumentData): StoredOrder {
  const rawStatus = (d.status as string) ?? "request_received";
  const status = normalizeOrderStatus(rawStatus);
  const legacyCompleted = tsToIso(d.completedAt as Timestamp | null);

  return {
    id,
    trackingToken: (d.trackingToken as string) ?? "",
    customerName: d.customerName as string,
    customerPhone: d.customerPhone as string,
    customerPhoneNormalized: (d.customerPhoneNormalized as string) ?? "",
    requestedDeliveryDate: (d.requestedDeliveryDate as string | null) ?? null,
    items: d.items as OrderItem[],
    status,
    createdAtIso: tsToIso(d.createdAt as Timestamp) ?? new Date().toISOString(),
    updatedAtIso: tsToIso(d.updatedAt as Timestamp) ?? new Date().toISOString(),
    confirmedAtIso: tsToIso(d.confirmedAt as Timestamp | null),
    inProgressAtIso: tsToIso(d.inProgressAt as Timestamp | null),
    readyAtIso: tsToIso(d.readyAt as Timestamp | null),
    deliveredAtIso: tsToIso(d.deliveredAt as Timestamp | null) ?? legacyCompleted,
    cancelledAtIso: tsToIso(d.cancelledAt as Timestamp | null),
    delayReasonInternal: (d.delayReasonInternal as string | null) ?? null,
    revisedDeliveryDate: (d.revisedDeliveryDate as string | null) ?? null,
    cancellationReasonInternal: (d.cancellationReasonInternal as string | null) ?? null,
    scopeChangeNotesInternal: (d.scopeChangeNotesInternal as string | null) ?? null,
    reworkNotesInternal: (d.reworkNotesInternal as string | null) ?? null,
    priority: normalizeOrderPriority(d.priority as string | undefined),
    quotedAccessories: parseQuotedAccessoriesFromJson(d.quotedAccessories),
    accessoriesQuoteStatus: normalizeAccessoriesQuoteStatus(d.accessoriesQuoteStatus as string | undefined),
    accessoriesNotesInternal: (d.accessoriesNotesInternal as string | null) ?? null,
    totalAmountInr:
      typeof d.totalAmountInr === "number" && Number.isFinite(d.totalAmountInr)
        ? Math.round(d.totalAmountInr)
        : null,
    paidAmountInr:
      typeof d.paidAmountInr === "number" && Number.isFinite(d.paidAmountInr)
        ? Math.max(0, Math.round(d.paidAmountInr))
        : 0,
    paymentModePrimary:
      d.paymentModePrimary != null &&
      typeof d.paymentModePrimary === "string" &&
      isPaymentMode(d.paymentModePrimary)
        ? d.paymentModePrimary
        : null,
    financialNotes: (d.financialNotes as string | null) ?? null,
    ledgerPaymentStatus: computeLedgerPaymentStatus(
      typeof d.totalAmountInr === "number" ? d.totalAmountInr : null,
      typeof d.paidAmountInr === "number" ? d.paidAmountInr : 0,
      status,
    ),
    paymentAuditLog: parsePaymentAuditLog(d.paymentAuditLog),
    designAssetsFolderUrl: (d.designAssetsFolderUrl as string | null) ?? null,
    tailorHandoffNotesInternal: (d.tailorHandoffNotesInternal as string | null) ?? null,
    quickChildAgeYears:
      typeof d.quickChildAgeYears === "number" &&
      Number.isInteger(d.quickChildAgeYears) &&
      d.quickChildAgeYears >= 5 &&
      d.quickChildAgeYears <= 12
        ? d.quickChildAgeYears
        : null,
  };
}

export async function createStoredOrder(input: {
  id: string;
  customerName: string;
  customerPhone: string;
  requestedDeliveryDate: string | null;
  items: OrderItem[];
  /** Quick girls' wear: whole years 5–12; omit or null otherwise */
  quickChildAgeYears?: number | null;
}): Promise<{ trackingToken: string }> {
  const firestore = db();
  const now = FieldValue.serverTimestamp();
  const normalized = normalizePhone(input.customerPhone);
  const trackingToken = generateTrackingToken();

  await firestore.collection(COLLECTION).doc(input.id).set({
    trackingToken,
    customerName: input.customerName.trim(),
    customerPhone: input.customerPhone.trim(),
    customerPhoneNormalized: normalized,
    requestedDeliveryDate: input.requestedDeliveryDate,
    items: orderItemsForFirestore(input.items),
    status: "request_received" satisfies OrderStatus,
    createdAt: now,
    updatedAt: now,
    confirmedAt: null,
    inProgressAt: null,
    readyAt: null,
    deliveredAt: null,
    delayReasonInternal: null,
    revisedDeliveryDate: null,
    priority: "standard" satisfies OrderPriority,
    cancelledAt: null,
    cancellationReasonInternal: null,
    scopeChangeNotesInternal: null,
    reworkNotesInternal: null,
    quotedAccessories: [],
    accessoriesQuoteStatus: "none",
    accessoriesNotesInternal: null,
    totalAmountInr: null,
    paidAmountInr: 0,
    paymentModePrimary: null,
    financialNotes: null,
    paymentAuditLog: [],
    designAssetsFolderUrl: null,
    tailorHandoffNotesInternal: null,
    quickChildAgeYears:
      typeof input.quickChildAgeYears === "number" &&
      Number.isInteger(input.quickChildAgeYears) &&
      input.quickChildAgeYears >= 5 &&
      input.quickChildAgeYears <= 12
        ? input.quickChildAgeYears
        : null,
  });

  return { trackingToken };
}

export async function listStoredOrders(): Promise<StoredOrder[]> {
  const firestore = db();
  const snap = await firestore
    .collection(COLLECTION)
    .orderBy("createdAt", "desc")
    .limit(500)
    .get();

  return snap.docs.map((doc) => mapDocToStoredOrder(doc.id, doc.data()));
}

export async function getStoredOrderById(id: string): Promise<StoredOrder | null> {
  const firestore = db();
  const ref = await firestore.collection(COLLECTION).doc(id).get();
  if (!ref.exists) return null;
  return mapDocToStoredOrder(ref.id, ref.data()!);
}

export async function getPublicTrackingByToken(
  token: string,
): Promise<PublicTrackingOrder | null> {
  if (!token.trim()) return null;
  const firestore = db();
  const snap = await firestore
    .collection(COLLECTION)
    .where("trackingToken", "==", token.trim())
    .limit(1)
    .get();

  if (snap.empty) return null;
  const doc = snap.docs[0]!;
  const d = doc.data();
  const stored = mapDocToStoredOrder(doc.id, d);
  const name = stored.customerName.trim();
  const firstName = name ? name.split(/\s+/)[0] ?? null : null;

  return {
    orderRefShort: stored.id.slice(0, 8),
    status: stored.status,
    requestedDeliveryDate: stored.requestedDeliveryDate,
    revisedDeliveryDate: stored.revisedDeliveryDate,
    itemCount: stored.items.length,
    updatedAtIso: stored.updatedAtIso,
    customerFirstName: firstName,
  };
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  const firestore = db();
  const ref = firestore.collection(COLLECTION).doc(id);
  const updates: Record<string, unknown> = {
    status,
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (status === "confirmed") {
    updates.confirmedAt = FieldValue.serverTimestamp();
  }
  if (status === "in_progress") {
    updates.inProgressAt = FieldValue.serverTimestamp();
  }
  if (status === "ready") {
    updates.readyAt = FieldValue.serverTimestamp();
  }
  if (status === "delivered") {
    updates.deliveredAt = FieldValue.serverTimestamp();
  }
  if (status === "cancelled") {
    updates.cancelledAt = FieldValue.serverTimestamp();
  } else {
    updates.cancelledAt = FieldValue.delete();
  }
  await ref.update(updates);
}

export async function updateOrderFields(
  id: string,
  patch: {
    delayReasonInternal?: string | null;
    revisedDeliveryDate?: string | null;
    priority?: OrderPriority;
    scopeChangeNotesInternal?: string | null;
    reworkNotesInternal?: string | null;
    cancellationReasonInternal?: string | null;
    quotedAccessories?: QuotedAccessoryLine[];
    accessoriesQuoteStatus?: AccessoriesQuoteStatus;
    accessoriesNotesInternal?: string | null;
    totalAmountInr?: number | null;
    paidAmountInr?: number;
    paymentModePrimary?: PaymentMode | null;
    financialNotes?: string | null;
    paymentAuditLog?: PaymentAuditEntry[];
    designAssetsFolderUrl?: string | null;
    tailorHandoffNotesInternal?: string | null;
  },
): Promise<void> {
  const firestore = db();
  const ref = firestore.collection(COLLECTION).doc(id);
  const updates: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (patch.delayReasonInternal !== undefined) {
    updates.delayReasonInternal = patch.delayReasonInternal;
  }
  if (patch.revisedDeliveryDate !== undefined) {
    updates.revisedDeliveryDate = patch.revisedDeliveryDate;
  }
  if (patch.priority !== undefined) {
    updates.priority = patch.priority;
  }
  if (patch.scopeChangeNotesInternal !== undefined) {
    updates.scopeChangeNotesInternal = patch.scopeChangeNotesInternal;
  }
  if (patch.reworkNotesInternal !== undefined) {
    updates.reworkNotesInternal = patch.reworkNotesInternal;
  }
  if (patch.cancellationReasonInternal !== undefined) {
    updates.cancellationReasonInternal = patch.cancellationReasonInternal;
  }
  if (patch.quotedAccessories !== undefined) {
    updates.quotedAccessories = patch.quotedAccessories;
  }
  if (patch.accessoriesQuoteStatus !== undefined) {
    updates.accessoriesQuoteStatus = patch.accessoriesQuoteStatus;
  }
  if (patch.accessoriesNotesInternal !== undefined) {
    updates.accessoriesNotesInternal = patch.accessoriesNotesInternal;
  }
  if (patch.totalAmountInr !== undefined) {
    updates.totalAmountInr = patch.totalAmountInr;
  }
  if (patch.paidAmountInr !== undefined) {
    updates.paidAmountInr = patch.paidAmountInr;
  }
  if (patch.paymentModePrimary !== undefined) {
    updates.paymentModePrimary = patch.paymentModePrimary;
  }
  if (patch.financialNotes !== undefined) {
    updates.financialNotes = patch.financialNotes;
  }
  if (patch.paymentAuditLog !== undefined) {
    updates.paymentAuditLog = patch.paymentAuditLog;
  }
  if (patch.designAssetsFolderUrl !== undefined) {
    updates.designAssetsFolderUrl = patch.designAssetsFolderUrl;
  }
  if (patch.tailorHandoffNotesInternal !== undefined) {
    updates.tailorHandoffNotesInternal = patch.tailorHandoffNotesInternal;
  }
  await ref.update(updates);
}
