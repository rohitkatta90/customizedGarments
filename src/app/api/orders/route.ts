import { NextResponse } from "next/server";

import {
  buildQuickOrderLineItems,
  quickRequestCustomerForApi,
  type QuickItemCount,
  type QuickServiceType,
} from "@/lib/order/quick-request";
import { validateOrderItems } from "@/lib/order/whatsapp";
import type { OrderItem } from "@/lib/order/types";
import { createStoredOrder, isFirestoreConfigured } from "@/lib/orders/firestore";
import { siteConfig } from "@/lib/site";
import { isPhonePlausible } from "@/lib/orders/phone";

export const runtime = "nodejs";

type StandardBody = {
  quick?: false;
  id: string;
  customerName?: string;
  customerPhone?: string;
  requestedDeliveryDate?: string | null;
  items?: OrderItem[];
};

type QuickBody = {
  quick: true;
  id: string;
  serviceType: QuickServiceType;
  itemCount: QuickItemCount;
  preferredDeliveryDate: string;
  notes?: string;
  catalogId?: string;
  /** When valid, stored on the order instead of the quick-request placeholder phone. */
  customerPhone?: string;
  /** When itemCount is "3plus", optional exact count (integer ≥ 3). */
  exactPieceCount?: number;
  priorityRequested?: boolean;
  priorityImplied?: boolean;
};

type Body = StandardBody | QuickBody;

function isValidIsoDate(d: string): boolean {
  const t = d.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return false;
  const ms = Date.parse(t);
  return !Number.isNaN(ms);
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  let items: OrderItem[];
  let name: string;
  let phone: string;
  let requestedDeliveryDate: string | null;

  if (body.quick === true) {
    if (
      !body.id ||
      (body.serviceType !== "stitching" && body.serviceType !== "alteration") ||
      (body.itemCount !== "1" && body.itemCount !== "2" && body.itemCount !== "3plus") ||
      !body.preferredDeliveryDate?.trim() ||
      !isValidIsoDate(body.preferredDeliveryDate)
    ) {
      return NextResponse.json({ ok: false, error: "invalid_quick_request" }, { status: 400 });
    }
    const exact =
      typeof body.exactPieceCount === "number" && Number.isInteger(body.exactPieceCount)
        ? body.exactPieceCount
        : undefined;
    if (exact !== undefined) {
      if (exact < 3 || body.itemCount !== "3plus") {
        return NextResponse.json({ ok: false, error: "invalid_quick_request" }, { status: 400 });
      }
    }
    items = buildQuickOrderLineItems({
      serviceType: body.serviceType,
      itemCount: body.itemCount,
      preferredDeliveryDate: body.preferredDeliveryDate.trim(),
      notes: typeof body.notes === "string" ? body.notes : "",
      catalogId: typeof body.catalogId === "string" ? body.catalogId : undefined,
      exactPieceCount: exact,
      priorityRequested: body.priorityRequested === true,
      priorityImplied: body.priorityImplied === true && body.priorityRequested !== true,
    });
    const cust = quickRequestCustomerForApi();
    name = cust.customerName;
    phone = cust.customerPhone;
    requestedDeliveryDate = cust.requestedDeliveryDate;
    if (typeof body.customerPhone === "string" && isPhonePlausible(body.customerPhone)) {
      phone = body.customerPhone.trim();
    }
  } else {
    name = body.customerName?.trim() ?? "";
    phone = body.customerPhone?.trim() ?? "";
    items = body.items ?? [];
    requestedDeliveryDate = body.requestedDeliveryDate ?? null;

    if (!body.id || !name || !phone || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { ok: false, error: "missing_fields" },
        { status: 400 },
      );
    }

    if (!isPhonePlausible(phone)) {
      return NextResponse.json({ ok: false, error: "invalid_phone" }, { status: 400 });
    }
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
      requestedDeliveryDate,
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
