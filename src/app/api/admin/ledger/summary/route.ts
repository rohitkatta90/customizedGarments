import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { verifyAdminSession } from "@/lib/orders/admin-auth";
import { computeLedgerDailySummary, todayIST } from "@/lib/orders/daily-ledger";
import { isFirestoreConfigured, listStoredOrders } from "@/lib/orders/firestore";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const c = await cookies();
  if (!verifyAdminSession(c.get("gs_admin")?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isFirestoreConfigured()) {
    return NextResponse.json({ error: "Firestore not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("date")?.trim();
  const date = raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : todayIST();

  const orders = await listStoredOrders();
  const summary = computeLedgerDailySummary(orders, date);

  return NextResponse.json({
    summary,
    orderCount: orders.length,
    note:
      orders.length >= 500
        ? "List is capped at 500 orders; totals may omit older jobs."
        : null,
  });
}
