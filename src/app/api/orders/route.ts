import { NextResponse } from "next/server";

import { validateOrderItems } from "@/lib/order/whatsapp";
import type { OrderItem } from "@/lib/order/types";
import { createStoredOrder, isFirestoreConfigured } from "@/lib/orders/firestore";
import { siteConfig } from "@/lib/site";
import { isPhonePlausible } from "@/lib/orders/phone";

export const runtime = "nodejs";

type Body = {
  id: string;
  customerName?: string;
  customerPhone?: string;
  requestedDeliveryDate?: string | null;
  items?: OrderItem[];
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const name = body.customerName?.trim() ?? "";
  const phone = body.customerPhone?.trim() ?? "";
  const items = body.items;

  if (!body.id || !name || !phone || !items || !Array.isArray(items)) {
    return NextResponse.json(
      { ok: false, error: "missing_fields" },
      { status: 400 },
    );
  }

  if (!isPhonePlausible(phone)) {
    return NextResponse.json({ ok: false, error: "invalid_phone" }, { status: 400 });
  }

  if (!validateOrderItems(items)) {
    return NextResponse.json({ ok: false, error: "invalid_items" }, { status: 400 });
  }

  if (!isFirestoreConfigured()) {
    return NextResponse.json({
      ok: true,
      saved: false,
      reason: "firestore_not_configured",
    });
  }

  try {
    const { trackingToken } = await createStoredOrder({
      id: body.id,
      customerName: name,
      customerPhone: phone,
      requestedDeliveryDate: body.requestedDeliveryDate ?? null,
      items,
    });
    const base = siteConfig.siteUrl.replace(/\/$/, "");
    const trackingUrl = `${base}/track/${trackingToken}`;
    return NextResponse.json({ ok: true, saved: true, id: body.id, trackingUrl });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "persist_failed", message: String(err) },
      { status: 500 },
    );
  }
}
