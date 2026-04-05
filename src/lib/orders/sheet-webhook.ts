import { formatRequestIdForWhatsApp } from "@/lib/order/message-formatting";
import type { OrderItem } from "@/lib/order/types";

/**
 * JSON body POSTed to `ORDERS_SHEET_WEBHOOK_URL` (Make, Zapier, Apps Script, etc.)
 * Map these keys to your Google Sheet columns in the automation.
 */
export type OrdersSheetWebhookPayload = {
  source: "garment-services-catalog";
  schemaVersion: 1;
  /** ISO-8601 UTC */
  submittedAt: string;
  /** YYYY-MM-DD in Asia/Kolkata (for sheet "Date" column) */
  dateLocalIN: string;
  /** Client order id (UUID) — correlates with WhatsApp / tracking */
  requestId: string;
  /**
   * Same REQ-YYYY-NNN as in the catalog WhatsApp request message (`formatRequestIdForWhatsApp`).
   * Map to your Request_ID column so the sheet matches chat.
   */
  requestIdFriendly: string;
  customerName: string;
  customerPhone: string;
  /** Stitching | Alteration | Mixed */
  serviceType: string;
  itemsCount: number;
  /** YYYY-MM-DD or "" */
  deliveryDate: string;
  notes: string;
  trackingUrl: string | null;
  quickFlow: boolean;
  /** Quick flow only: customer checked “may need priority”. */
  priorityRequested: boolean;
  /** Quick flow only: date is earlier than standard lead (and not overridden by checkbox). */
  priorityImplied: boolean;
  /** Quick girls' wear: whole years 5–12, or null */
  quickChildAgeYears: number | null;
};

function deriveServiceTypeLabel(items: OrderItem[]): string {
  const set = new Set(items.map((i) => i.service));
  if (set.size === 1) {
    return set.has("stitching") ? "Stitching" : "Alteration";
  }
  return "Mixed";
}

function firstDeliveryDate(items: OrderItem[], requestedDeliveryDate: string | null): string {
  for (const item of items) {
    const d = item.deliveryPreference?.trim();
    if (d) return d;
  }
  return requestedDeliveryDate?.trim() ?? "";
}

function aggregateNotes(items: OrderItem[]): string {
  const parts = items.map((i) => i.notes?.trim()).filter(Boolean) as string[];
  return parts.join(" · ");
}

function dateInKolkata(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

/**
 * Sends one row-shaped payload to an external webhook so Make/Zapier/Apps Script
 * can append to Google Sheets. Failures are swallowed; does nothing if env unset.
 */
export async function postOrdersSheetWebhook(args: {
  requestId: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  requestedDeliveryDate: string | null;
  trackingUrl?: string | null;
  quickFlow: boolean;
  /** Always set; false when not quick flow. */
  priorityRequested: boolean;
  /** Always set; false when not quick flow. */
  priorityImplied: boolean;
  quickChildAgeYears?: number | null;
}): Promise<void> {
  const url = process.env.ORDERS_SHEET_WEBHOOK_URL?.trim();
  if (!url) return;

  const payload: OrdersSheetWebhookPayload = {
    source: "garment-services-catalog",
    schemaVersion: 1,
    submittedAt: new Date().toISOString(),
    dateLocalIN: dateInKolkata(),
    requestId: args.requestId,
    requestIdFriendly: formatRequestIdForWhatsApp(args.requestId),
    customerName: args.customerName,
    customerPhone: args.customerPhone,
    serviceType: deriveServiceTypeLabel(args.items),
    itemsCount: args.items.length,
    deliveryDate: firstDeliveryDate(args.items, args.requestedDeliveryDate),
    notes: aggregateNotes(args.items),
    trackingUrl: args.trackingUrl ?? null,
    quickFlow: args.quickFlow,
    priorityRequested: args.priorityRequested === true,
    priorityImplied: args.priorityImplied === true,
    quickChildAgeYears:
      typeof args.quickChildAgeYears === "number" &&
      Number.isInteger(args.quickChildAgeYears) &&
      args.quickChildAgeYears >= 5 &&
      args.quickChildAgeYears <= 12
        ? args.quickChildAgeYears
        : null,
  };

  const useForm =
    process.env.ORDERS_SHEET_WEBHOOK_USE_FORM === "1" ||
    process.env.ORDERS_SHEET_WEBHOOK_USE_FORM === "true";

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 8000);
  try {
    if (useForm) {
      const params = new URLSearchParams();
      const entries = Object.entries(payload) as [keyof OrdersSheetWebhookPayload, unknown][];
      for (const [key, val] of entries) {
        if (val === null || val === undefined) {
          params.set(String(key), "");
        } else if (typeof val === "boolean") {
          params.set(String(key), val ? "true" : "false");
        } else if (typeof val === "number") {
          params.set(String(key), String(val));
        } else {
          params.set(String(key), String(val));
        }
      }
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: params.toString(),
        signal: ctrl.signal,
      });
    } else {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: ctrl.signal,
      });
    }
  } catch {
    /* non-blocking for customers */
  } finally {
    clearTimeout(timeout);
  }
}
