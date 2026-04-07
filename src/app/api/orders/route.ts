import { NextResponse } from "next/server";

import {
  buildQuickOrderLineItems,
  isQuickKidsWearRequest,
  quickRequestCustomerForApi,
  type QuickItemCount,
  type QuickMomAndMeChildKind,
  type QuickMomAndMeData,
  type QuickMomAndMePreference,
  type QuickServiceType,
} from "@/lib/order/quick-request";
import { validateOrderItems } from "@/lib/order/whatsapp";
import type { OrderItem } from "@/lib/order/types";
import { createStoredOrder, isFirestoreConfigured } from "@/lib/orders/firestore";
import { postOrdersSheetWebhook } from "@/lib/orders/sheet-webhook";
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
  /** Required when quick stitching notes indicate girls' wear (5–12 years). */
  childAgeYears?: number;
  /** True when the customer chose kids wear in the quick flow (alternative to note chip). */
  kidsWear?: boolean;
  /** Adult stitching: optional Mom & Me — requires kind + value + preference when true. */
  momAndMe?: boolean;
  momAndMeChildKind?: QuickMomAndMeChildKind;
  /** Required when momAndMeChildKind is "age". Whole years (1–18). */
  momAndMeChildAgeYears?: number;
  /** Required when momAndMeChildKind is "size". */
  momAndMeChildSize?: string;
  momAndMePreference?: QuickMomAndMePreference;
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
  /** Set only for validated quick girls' wear requests */
  let quickPersistedChildAge: number | null = null;
  let quickMomAndMe: QuickMomAndMeData | undefined;

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
    const rawNotes = typeof body.notes === "string" ? body.notes : "";
    const needsChildAge = isQuickKidsWearRequest(
      body.serviceType,
      rawNotes,
      body.kidsWear === true,
    );
    let childAgeYears: number | undefined;
    if (needsChildAge) {
      const age = body.childAgeYears;
      if (typeof age !== "number" || !Number.isInteger(age) || age < 5 || age > 12) {
        return NextResponse.json({ ok: false, error: "invalid_child_age" }, { status: 400 });
      }
      childAgeYears = age;
      quickPersistedChildAge = age;
    }

    if (body.momAndMe === true) {
      if (body.serviceType !== "stitching") {
        return NextResponse.json({ ok: false, error: "invalid_quick_request" }, { status: 400 });
      }
      const pref = body.momAndMePreference;
      if (pref !== "same" && pref !== "variation") {
        return NextResponse.json({ ok: false, error: "invalid_mom_and_me" }, { status: 400 });
      }
      const kind = body.momAndMeChildKind;
      if (kind === "age") {
        const age = body.momAndMeChildAgeYears;
        if (
          typeof age !== "number" ||
          !Number.isInteger(age) ||
          age < 1 ||
          age > 18
        ) {
          return NextResponse.json({ ok: false, error: "invalid_mom_and_me" }, { status: 400 });
        }
        quickMomAndMe = { childKind: "age", ageYears: age, preference: pref };
      } else if (kind === "size") {
        const size =
          typeof body.momAndMeChildSize === "string" ? body.momAndMeChildSize.trim() : "";
        if (!size || size.length > 120) {
          return NextResponse.json({ ok: false, error: "invalid_mom_and_me" }, { status: 400 });
        }
        quickMomAndMe = { childKind: "size", sizeText: size, preference: pref };
      } else {
        return NextResponse.json({ ok: false, error: "invalid_mom_and_me" }, { status: 400 });
      }
    }

    items = buildQuickOrderLineItems({
      serviceType: body.serviceType,
      itemCount: body.itemCount,
      preferredDeliveryDate: body.preferredDeliveryDate.trim(),
      notes: rawNotes,
      catalogId: typeof body.catalogId === "string" ? body.catalogId : undefined,
      exactPieceCount: exact,
      priorityRequested: body.priorityRequested === true,
      priorityImplied: body.priorityImplied === true && body.priorityRequested !== true,
      ...(childAgeYears !== undefined ? { childAgeYears } : {}),
      ...(quickMomAndMe ? { momAndMe: quickMomAndMe } : {}),
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

  const quickFlow = body.quick === true;
  const quickPriority =
    body.quick === true
      ? {
          priorityRequested: body.priorityRequested === true,
          priorityImplied:
            body.priorityImplied === true && body.priorityRequested !== true,
        }
      : { priorityRequested: false, priorityImplied: false };

  if (!isFirestoreConfigured()) {
    await postOrdersSheetWebhook({
      requestId: body.id,
      customerName: name,
      customerPhone: phone,
      items,
      requestedDeliveryDate,
      trackingUrl: null,
      quickFlow,
      ...quickPriority,
      quickChildAgeYears: quickPersistedChildAge,
    });
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
      quickChildAgeYears: quickPersistedChildAge,
    });
    const base = siteConfig.siteUrl.replace(/\/$/, "");
    const trackingUrl = `${base}/track/${trackingToken}`;
    await postOrdersSheetWebhook({
      requestId: body.id,
      customerName: name,
      customerPhone: phone,
      items,
      requestedDeliveryDate,
      trackingUrl,
      quickFlow,
      ...quickPriority,
      quickChildAgeYears: quickPersistedChildAge,
    });
    return NextResponse.json({ ok: true, saved: true, id: body.id, trackingUrl });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "persist_failed", message: String(err) },
      { status: 500 },
    );
  }
}
