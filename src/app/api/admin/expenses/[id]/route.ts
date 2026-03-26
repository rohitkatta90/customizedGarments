import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { verifyAdminSession } from "@/lib/orders/admin-auth";
import { deleteLedgerExpense, updateLedgerExpense } from "@/lib/orders/expenses-firestore";
import { isExpenseType } from "@/lib/orders/ledger";
import { isFirestoreConfigured } from "@/lib/orders/firestore";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Ctx) {
  const c = await cookies();
  if (!verifyAdminSession(c.get("gs_admin")?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isFirestoreConfigured()) {
    return NextResponse.json({ error: "Firestore not configured" }, { status: 503 });
  }

  const { id } = await context.params;
  let body: {
    expenseDate?: string;
    expenseType?: string;
    amountInr?: number;
    vendorOrPayee?: string | null;
    linkedOrderId?: string | null;
    notes?: string | null;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.expenseType !== undefined && body.expenseType !== null && !isExpenseType(body.expenseType)) {
    return NextResponse.json({ error: "Invalid expense type" }, { status: 400 });
  }

  try {
    await updateLedgerExpense(id, body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "update_failed", message: String(e) }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: Ctx) {
  const c = await cookies();
  if (!verifyAdminSession(c.get("gs_admin")?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isFirestoreConfigured()) {
    return NextResponse.json({ error: "Firestore not configured" }, { status: 503 });
  }

  const { id } = await context.params;
  try {
    await deleteLedgerExpense(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "delete_failed", message: String(e) }, { status: 500 });
  }
}
