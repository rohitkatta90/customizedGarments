import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { verifyAdminSession } from "@/lib/orders/admin-auth";
import { createLedgerExpense, listLedgerExpenses } from "@/lib/orders/expenses-firestore";
import { isExpenseType } from "@/lib/orders/ledger";
import { isFirestoreConfigured } from "@/lib/orders/firestore";

export const runtime = "nodejs";

export async function GET() {
  const c = await cookies();
  if (!verifyAdminSession(c.get("gs_admin")?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isFirestoreConfigured()) {
    return NextResponse.json({ expenses: [], warning: "firestore_not_configured" });
  }
  const expenses = await listLedgerExpenses(500);
  return NextResponse.json({ expenses });
}

export async function POST(request: Request) {
  const c = await cookies();
  if (!verifyAdminSession(c.get("gs_admin")?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isFirestoreConfigured()) {
    return NextResponse.json({ error: "Firestore not configured" }, { status: 503 });
  }

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

  if (!body.expenseDate?.trim() || typeof body.amountInr !== "number" || !Number.isFinite(body.amountInr)) {
    return NextResponse.json({ error: "expenseDate and amountInr required" }, { status: 400 });
  }

  const expenseType = body.expenseType && isExpenseType(body.expenseType) ? body.expenseType : "other";

  try {
    const id = await createLedgerExpense({
      expenseDate: body.expenseDate.trim(),
      expenseType,
      amountInr: body.amountInr,
      vendorOrPayee: body.vendorOrPayee,
      linkedOrderId: body.linkedOrderId,
      notes: body.notes,
    });
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    return NextResponse.json({ error: "create_failed", message: String(e) }, { status: 500 });
  }
}
