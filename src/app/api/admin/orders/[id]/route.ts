import { randomUUID } from "crypto";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { verifyAdminSession } from "@/lib/orders/admin-auth";
import {
  getStoredOrderById,
  isFirestoreConfigured,
  updateOrderFields,
  updateOrderStatus,
} from "@/lib/orders/firestore";
import { normalizeDesignFolderUrl } from "@/lib/orders/folder-url";
import { isPaymentMode, type PaymentMode } from "@/lib/orders/ledger";
import type { FinancialPatch } from "@/lib/orders/payment-validation";
import { validateOrderPatch } from "@/lib/orders/payment-validation";
import { isOrderPriority } from "@/lib/orders/priority";
import type { PaymentAuditEntry } from "@/lib/orders/schema";
import { isOrderStatus, type OrderStatus } from "@/lib/orders/status";
import {
  isAccessoriesQuoteStatus,
  parseQuotedAccessoriesFromJson,
} from "@/lib/orders/styling-elements";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const c = await cookies();
  if (!verifyAdminSession(c.get("gs_admin")?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isFirestoreConfigured()) {
    return NextResponse.json({ error: "Firestore not configured" }, { status: 503 });
  }

  const { id } = await context.params;
  let body: {
    status?: string;
    delayReasonInternal?: string | null;
    revisedDeliveryDate?: string | null;
    priority?: string;
    scopeChangeNotesInternal?: string | null;
    reworkNotesInternal?: string | null;
    cancellationReasonInternal?: string | null;
    quotedAccessories?: unknown;
    accessoriesQuoteStatus?: string;
    accessoriesNotesInternal?: string | null;
    totalAmountInr?: number | null;
    paidAmountInr?: number;
    paymentModePrimary?: string | null;
    financialNotes?: string | null;
    designAssetsFolderUrl?: string | null;
    tailorHandoffNotesInternal?: string | null;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const hasStatus = body.status !== undefined && body.status !== "";
  const hasMeta =
    body.delayReasonInternal !== undefined ||
    body.revisedDeliveryDate !== undefined ||
    body.priority !== undefined ||
    body.scopeChangeNotesInternal !== undefined ||
    body.reworkNotesInternal !== undefined ||
    body.cancellationReasonInternal !== undefined ||
    body.quotedAccessories !== undefined ||
    body.accessoriesQuoteStatus !== undefined ||
    body.accessoriesNotesInternal !== undefined ||
    body.totalAmountInr !== undefined ||
    body.paidAmountInr !== undefined ||
    body.paymentModePrimary !== undefined ||
    body.financialNotes !== undefined ||
    body.designAssetsFolderUrl !== undefined ||
    body.tailorHandoffNotesInternal !== undefined;

  if (!hasStatus && !hasMeta) {
    return NextResponse.json({ error: "No updates" }, { status: 400 });
  }

  let nextStatus: OrderStatus | undefined;
  if (hasStatus) {
    if (!body.status || !isOrderStatus(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    nextStatus = body.status;
  }

  if (body.priority !== undefined && body.priority !== null && !isOrderPriority(body.priority)) {
    return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
  }

  if (
    body.accessoriesQuoteStatus !== undefined &&
    body.accessoriesQuoteStatus !== null &&
    !isAccessoriesQuoteStatus(body.accessoriesQuoteStatus)
  ) {
    return NextResponse.json({ error: "Invalid accessories quote status" }, { status: 400 });
  }

  const parsedAccessories =
    body.quotedAccessories !== undefined
      ? parseQuotedAccessoriesFromJson(body.quotedAccessories)
      : undefined;

  let totalAmountInr: number | null | undefined;
  if (body.totalAmountInr !== undefined) {
    if (body.totalAmountInr === null) {
      totalAmountInr = null;
    } else if (typeof body.totalAmountInr === "number" && Number.isFinite(body.totalAmountInr)) {
      totalAmountInr = Math.max(0, Math.round(body.totalAmountInr));
    } else {
      return NextResponse.json({ error: "Invalid totalAmountInr" }, { status: 400 });
    }
  }

  let paidAmountInr: number | undefined;
  if (body.paidAmountInr !== undefined) {
    if (typeof body.paidAmountInr === "number" && Number.isFinite(body.paidAmountInr)) {
      paidAmountInr = Math.max(0, Math.round(body.paidAmountInr));
    } else {
      return NextResponse.json({ error: "Invalid paidAmountInr" }, { status: 400 });
    }
  }

  let paymentModePrimary: PaymentMode | null | undefined;
  if (body.paymentModePrimary !== undefined) {
    if (body.paymentModePrimary === null || body.paymentModePrimary === "") {
      paymentModePrimary = null;
    } else if (isPaymentMode(body.paymentModePrimary)) {
      paymentModePrimary = body.paymentModePrimary;
    } else {
      return NextResponse.json({ error: "Invalid payment mode" }, { status: 400 });
    }
  }

  let designAssetsFolderUrl: string | null | undefined;
  if (body.designAssetsFolderUrl !== undefined) {
    if (body.designAssetsFolderUrl === null) {
      designAssetsFolderUrl = null;
    } else if (typeof body.designAssetsFolderUrl === "string") {
      const trimmed = body.designAssetsFolderUrl.trim();
      if (trimmed === "") {
        designAssetsFolderUrl = null;
      } else {
        const normalized = normalizeDesignFolderUrl(body.designAssetsFolderUrl);
        if (!normalized) {
          return NextResponse.json(
            { error: "invalid_folder_url", message: "Enter a valid http(s) folder link." },
            { status: 400 },
          );
        }
        designAssetsFolderUrl = normalized;
      }
    } else {
      return NextResponse.json({ error: "invalid_folder_url" }, { status: 400 });
    }
  }

  let tailorHandoffNotesInternal: string | null | undefined;
  if (body.tailorHandoffNotesInternal !== undefined) {
    if (body.tailorHandoffNotesInternal === null) {
      tailorHandoffNotesInternal = null;
    } else if (typeof body.tailorHandoffNotesInternal === "string") {
      tailorHandoffNotesInternal = body.tailorHandoffNotesInternal.trim() || null;
    } else {
      return NextResponse.json({ error: "invalid_tailor_notes" }, { status: 400 });
    }
  }

  const existing = await getStoredOrderById(id);
  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const touchesLedgerOrDelivery =
    hasStatus ||
    body.totalAmountInr !== undefined ||
    body.paidAmountInr !== undefined ||
    body.paymentModePrimary !== undefined ||
    body.financialNotes !== undefined;

  if (touchesLedgerOrDelivery) {
    const validationPatch: FinancialPatch = {};
    if (hasStatus) {
      validationPatch.status = nextStatus;
    }
    if (body.totalAmountInr !== undefined) {
      validationPatch.totalAmountInr = totalAmountInr ?? null;
    }
    if (body.paidAmountInr !== undefined) {
      validationPatch.paidAmountInr = paidAmountInr;
    }
    if (body.paymentModePrimary !== undefined) {
      validationPatch.paymentModePrimary = paymentModePrimary ?? null;
    }
    if (body.financialNotes !== undefined) {
      validationPatch.financialNotes = body.financialNotes;
    }

    const patchError = validateOrderPatch(existing, validationPatch);
    if (patchError) {
      return NextResponse.json(
        { error: patchError.code, message: patchError.message },
        { status: 400 },
      );
    }
  }

  let paymentAuditLog: PaymentAuditEntry[] | undefined;
  if (body.paidAmountInr !== undefined && paidAmountInr !== undefined) {
    if (paidAmountInr !== existing.paidAmountInr) {
      paymentAuditLog = [
        ...(existing.paymentAuditLog ?? []),
        {
          id: randomUUID(),
          recordedAtIso: new Date().toISOString(),
          previousPaidInr: existing.paidAmountInr,
          newPaidInr: paidAmountInr,
          deltaInr: paidAmountInr - existing.paidAmountInr,
        },
      ].slice(-100);
    }
  }

  try {
    if (nextStatus) {
      await updateOrderStatus(id, nextStatus);
    }
    if (hasMeta) {
      await updateOrderFields(id, {
        delayReasonInternal: body.delayReasonInternal,
        revisedDeliveryDate: body.revisedDeliveryDate,
        priority: body.priority !== undefined && isOrderPriority(body.priority) ? body.priority : undefined,
        scopeChangeNotesInternal: body.scopeChangeNotesInternal,
        reworkNotesInternal: body.reworkNotesInternal,
        cancellationReasonInternal: body.cancellationReasonInternal,
        quotedAccessories: parsedAccessories,
        accessoriesQuoteStatus:
          body.accessoriesQuoteStatus !== undefined && isAccessoriesQuoteStatus(body.accessoriesQuoteStatus)
            ? body.accessoriesQuoteStatus
            : undefined,
        accessoriesNotesInternal: body.accessoriesNotesInternal,
        totalAmountInr,
        paidAmountInr,
        paymentModePrimary,
        financialNotes: body.financialNotes,
        paymentAuditLog,
        designAssetsFolderUrl,
        tailorHandoffNotesInternal,
      });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: "update_failed", message: String(e) },
      { status: 500 },
    );
  }
}
