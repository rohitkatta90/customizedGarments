import { randomBytes } from "crypto";

import {
  FieldValue,
  type DocumentData,
  type Timestamp,
} from "firebase-admin/firestore";

import type { LedgerExpense } from "./expenses-schema";
import { adminDb } from "./firestore";
import { isExpenseType } from "./ledger";

const COLLECTION = "studio_expenses";

function tsToIso(t: Timestamp | undefined | null): string | null {
  if (!t) return null;
  return t.toDate().toISOString();
}

function mapExpenseDoc(id: string, d: DocumentData): LedgerExpense {
  return {
    id,
    expenseDate: (d.expenseDate as string) ?? "",
    expenseType: isExpenseType(d.expenseType as string) ? d.expenseType : "other",
    amountInr: typeof d.amountInr === "number" && Number.isFinite(d.amountInr) ? Math.round(d.amountInr) : 0,
    vendorOrPayee: (d.vendorOrPayee as string | null) ?? null,
    linkedOrderId: (d.linkedOrderId as string | null) ?? null,
    notes: (d.notes as string | null) ?? null,
    createdAtIso: tsToIso(d.createdAt as Timestamp) ?? new Date().toISOString(),
    updatedAtIso: tsToIso(d.updatedAt as Timestamp) ?? new Date().toISOString(),
  };
}

export async function listLedgerExpenses(limit = 500): Promise<LedgerExpense[]> {
  const firestore = adminDb();
  const snap = await firestore
    .collection(COLLECTION)
    .orderBy("expenseDate", "desc")
    .limit(limit)
    .get();
  return snap.docs.map((doc) => mapExpenseDoc(doc.id, doc.data()));
}

export async function createLedgerExpense(input: {
  expenseDate: string;
  expenseType: string;
  amountInr: number;
  vendorOrPayee?: string | null;
  linkedOrderId?: string | null;
  notes?: string | null;
}): Promise<string> {
  const firestore = adminDb();
  const id = randomBytes(12).toString("hex");
  const now = FieldValue.serverTimestamp();
  await firestore.collection(COLLECTION).doc(id).set({
    expenseDate: input.expenseDate,
    expenseType: isExpenseType(input.expenseType) ? input.expenseType : "other",
    amountInr: Math.max(0, Math.round(input.amountInr)),
    vendorOrPayee: input.vendorOrPayee?.trim() || null,
    linkedOrderId: input.linkedOrderId?.trim() || null,
    notes: input.notes?.trim() || null,
    createdAt: now,
    updatedAt: now,
  });
  return id;
}

export async function updateLedgerExpense(
  id: string,
  patch: {
    expenseDate?: string;
    expenseType?: string;
    amountInr?: number;
    vendorOrPayee?: string | null;
    linkedOrderId?: string | null;
    notes?: string | null;
  },
): Promise<void> {
  const firestore = adminDb();
  const ref = firestore.collection(COLLECTION).doc(id);
  const updates: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
  if (patch.expenseDate !== undefined) updates.expenseDate = patch.expenseDate;
  if (patch.expenseType !== undefined) {
    updates.expenseType = isExpenseType(patch.expenseType) ? patch.expenseType : "other";
  }
  if (patch.amountInr !== undefined) {
    updates.amountInr = Math.max(0, Math.round(patch.amountInr));
  }
  if (patch.vendorOrPayee !== undefined) updates.vendorOrPayee = patch.vendorOrPayee;
  if (patch.linkedOrderId !== undefined) updates.linkedOrderId = patch.linkedOrderId;
  if (patch.notes !== undefined) updates.notes = patch.notes;
  await ref.update(updates);
}

export async function deleteLedgerExpense(id: string): Promise<void> {
  const firestore = adminDb();
  await firestore.collection(COLLECTION).doc(id).delete();
}
