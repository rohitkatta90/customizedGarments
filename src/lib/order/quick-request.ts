import { todayLocalISODate } from "@/lib/date-today";
import type { CatalogItem } from "@/lib/types";

import { createAlterationItem, createStitchingItem } from "./factory";
import { formatIsoDateForWhatsApp, formatRequestIdForWhatsApp } from "./message-formatting";
import type { Order, OrderItem } from "./types";

export type QuickServiceType = "stitching" | "alteration";
export type QuickItemCount = "1" | "2" | "3plus";

const QUICK_CUSTOMER_NAME = "Quick request (website)";
/** Placeholder until staff captures the real number from WhatsApp. */
export const QUICK_REQUEST_PLACEHOLDER_PHONE = "0000000000";

export function itemCountLabelForWhatsApp(count: QuickItemCount, exactPieceCount?: number): string {
  if (count === "3plus") {
    if (
      typeof exactPieceCount === "number" &&
      Number.isFinite(exactPieceCount) &&
      exactPieceCount >= 3
    ) {
      return String(Math.floor(exactPieceCount));
    }
    return "3+";
  }
  return count;
}

export function buildQuickOrderLineItems(input: {
  serviceType: QuickServiceType;
  itemCount: QuickItemCount;
  preferredDeliveryDate: string;
  notes: string;
  catalogId?: string;
  /** When itemCount is "3plus", exact count (≥3) for order notes. */
  exactPieceCount?: number;
  priorityRequested?: boolean;
  priorityImplied?: boolean;
}): OrderItem[] {
  const pieces = `Pieces (quick request): ${itemCountLabelForWhatsApp(input.itemCount, input.exactPieceCount)}`;
  const userNotes = input.notes.trim();
  let combinedNotes = userNotes ? `${pieces}\n${userNotes}` : pieces;
  if (input.priorityRequested) {
    combinedNotes += "\n[Priority] Customer asked about expedited / priority stitching — confirm availability and fees in WhatsApp.";
  } else if (input.priorityImplied) {
    combinedNotes +=
      "\n[Priority] Preferred date is before typical standard lead — customer may need a quicker timeline; confirm in WhatsApp.";
  }

  if (input.serviceType === "alteration") {
    const item = createAlterationItem();
    item.alterationType = "other";
    item.notes = combinedNotes;
    item.deliveryPreference = input.preferredDeliveryDate;
    return [item];
  }

  const cid = input.catalogId?.trim();
  const stitching = createStitchingItem(
    cid ? { designSource: "catalog", catalogId: cid } : { designSource: "describe" },
  );
  stitching.notes = combinedNotes;
  stitching.deliveryPreference = input.preferredDeliveryDate;
  if (!cid) {
    stitching.describeText = "Details and reference photo to follow in WhatsApp.";
  }
  return [stitching];
}

export function buildQuickStitchWhatsAppMessage(input: {
  order: Order;
  catalog: CatalogItem[];
  serviceType: QuickServiceType;
  itemCount: QuickItemCount;
  preferredDeliveryDate: string;
  notes: string;
  catalogId?: string;
  /** Plain-text block appended after the main request (e.g. saved measurements). */
  measurementAppend?: string;
  exactPieceCount?: number;
  priorityRequested?: boolean;
  priorityImplied?: boolean;
}): string {
  const cat = input.catalogId?.trim()
    ? input.catalog.find((c) => c.id === input.catalogId!.trim())
    : undefined;

  const reqId = formatRequestIdForWhatsApp(input.order.id);
  const dateLabel = formatIsoDateForWhatsApp(input.preferredDeliveryDate);
  const serviceLabel = input.serviceType === "stitching" ? "Stitching" : "Alteration";
  const intentLine =
    input.serviceType === "stitching"
      ? "I'd like to get an outfit stitched."
      : "I'd like to get an outfit altered.";

  const lines: string[] = [
    "Hi :)",
    "",
    intentLine,
    "",
    `Request ID: ${reqId}`,
    "",
    `Service: ${serviceLabel}`,
    `Items: ${itemCountLabelForWhatsApp(input.itemCount, input.exactPieceCount)}`,
    `Preferred delivery date: ${dateLabel}`,
    `Notes: ${input.notes.trim() || "—"}`,
  ];

  if (cat) {
    lines.push("", `Design: "${cat.title}"`);
  }

  lines.push("", "I'll share the reference image in this chat next.");

  if (input.priorityRequested || input.priorityImplied) {
    lines.push(
      "",
      "[Priority] I may need this on priority — please let me know if that's possible.",
    );
  }

  if (input.measurementAppend?.trim()) {
    lines.push("", input.measurementAppend.trim());
  }

  return lines.join("\n");
}

export function quickRequestCustomerForApi(): {
  customerName: string;
  customerPhone: string;
  requestedDeliveryDate: string;
} {
  return {
    customerName: QUICK_CUSTOMER_NAME,
    customerPhone: QUICK_REQUEST_PLACEHOLDER_PHONE,
    requestedDeliveryDate: todayLocalISODate(),
  };
}
