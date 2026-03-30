import { todayLocalISODate } from "@/lib/date-today";
import type { CatalogItem } from "@/lib/types";

import { createAlterationItem, createStitchingItem } from "./factory";
import type { Order, OrderItem } from "./types";

export type QuickServiceType = "stitching" | "alteration";
export type QuickItemCount = "1" | "2" | "3plus";

const QUICK_CUSTOMER_NAME = "Quick request (website)";
/** Placeholder until staff captures the real number from WhatsApp. */
export const QUICK_REQUEST_PLACEHOLDER_PHONE = "0000000000";

export function itemCountLabelForWhatsApp(count: QuickItemCount): string {
  return count === "3plus" ? "3+" : count;
}

export function buildQuickOrderLineItems(input: {
  serviceType: QuickServiceType;
  itemCount: QuickItemCount;
  preferredDeliveryDate: string;
  notes: string;
  catalogId?: string;
}): OrderItem[] {
  const pieces = `Pieces (quick request): ${itemCountLabelForWhatsApp(input.itemCount)}`;
  const userNotes = input.notes.trim();
  const combinedNotes = userNotes ? `${pieces}\n${userNotes}` : pieces;

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
  trackingUrl?: string;
  /** Plain-text block appended before tracking URL */
  measurementAppend?: string;
}): string {
  const cat = input.catalogId?.trim()
    ? input.catalog.find((c) => c.id === input.catalogId!.trim())
    : undefined;

  const lines: string[] = [];
  lines.push("Hi :)", "");

  if (input.serviceType === "stitching") {
    if (cat) {
      lines.push(`I'd like to get "${cat.title}" stitched.`, "");
    } else {
      lines.push("I'd like to get garment(s) stitched.", "");
    }
  } else {
    lines.push("I'd like to request an alteration.", "");
  }

  lines.push(
    `• Number of items: ${itemCountLabelForWhatsApp(input.itemCount)}`,
    `• Preferred delivery date: ${input.preferredDeliveryDate}`,
    `• Notes: ${input.notes.trim() || "—"}`,
    "",
  );

  if (cat) {
    lines.push(`• Design reference: "${cat.title}" (catalog ID: ${cat.id})`, "");
  }

  lines.push(`Order reference: ${input.order.id}`, "");

  lines.push(
    "I will share the reference image here in this chat.",
    "",
    "WhatsApp cannot attach photos from the website — I'll send the picture right after this message.",
  );

  if (input.measurementAppend?.trim()) {
    lines.push("", input.measurementAppend.trim());
  }

  if (input.trackingUrl?.trim()) {
    lines.push("", `Track my order: ${input.trackingUrl.trim()}`);
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
