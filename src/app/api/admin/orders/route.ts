import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { verifyAdminSession } from "@/lib/orders/admin-auth";
import { isFirestoreConfigured, listStoredOrders } from "@/lib/orders/firestore";
import { normalizePhone } from "@/lib/orders/phone";
import { isLedgerPaymentStatus } from "@/lib/orders/ledger";
import { isOrderStatus } from "@/lib/orders/status";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const c = await cookies();
  if (!verifyAdminSession(c.get("gs_admin")?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isFirestoreConfigured()) {
    return NextResponse.json({
      orders: [] as unknown[],
      warning: "firestore_not_configured",
    });
  }

  let orders = await listStoredOrders();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const phone = searchParams.get("phone")?.trim();
  const ledgerPayment = searchParams.get("ledgerPayment")?.trim();

  if (status && isOrderStatus(status)) {
    orders = orders.filter((o) => o.status === status);
  }
  if (ledgerPayment && isLedgerPaymentStatus(ledgerPayment)) {
    orders = orders.filter((o) => o.ledgerPaymentStatus === ledgerPayment);
  }
  if (phone) {
    const n = normalizePhone(phone);
    orders = orders.filter(
      (o) =>
        o.customerPhoneNormalized === n ||
        o.customerPhoneNormalized.endsWith(n) ||
        o.customerPhone.includes(phone),
    );
  }

  return NextResponse.json({ orders });
}
