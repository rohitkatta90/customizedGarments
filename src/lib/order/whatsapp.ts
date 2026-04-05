import type { CatalogItem } from "@/lib/types";

import { alterationTypeLabels } from "@/lib/request-copy";

import { formatIsoDateForWhatsApp, formatRequestIdForWhatsApp } from "./message-formatting";
import type { Order, OrderItem, StitchingOrderItem } from "./types";

function catalogTitle(catalog: CatalogItem[], catalogId: string | undefined): string {
  if (!catalogId) return "";
  const item = catalog.find((c) => c.id === catalogId);
  return item ? `${item.title} (ID: ${item.id})` : `(catalog ${catalogId})`;
}

function stitchingDesignSummary(item: StitchingOrderItem, catalog: CatalogItem[]): string {
  if (item.designSource === "catalog") {
    return catalogTitle(catalog, item.catalogId) || "Catalog design (not selected)";
  }
  if (item.designSource === "upload") {
    return item.referenceFileName
      ? `Reference (I’m sending this image in chat): ${item.referenceFileName}`
      : "Reference image — I’m attaching it in this chat";
  }
  return item.describeText?.trim()
    ? `Design idea: ${item.describeText.trim()}`
    : "Design described in notes / to follow in chat";
}

export function buildMultiItemOrderMessage(
  order: Order,
  catalog: CatalogItem[],
  customer?: {
    name: string;
    phone: string;
    requestedDeliveryDate?: string | null;
  },
  extras?: {
    /** Appended after the main request — e.g. saved measurements summary */
    measurementAppend?: string;
  },
): string {
  const lines: string[] = [];

  lines.push("Hi RC 😊", "", "I'd like to get the following stitched / serviced.", "");

  lines.push(`Request ID: ${formatRequestIdForWhatsApp(order.id)}`, "");

  if (customer?.name?.trim()) {
    lines.push(`Name: ${customer.name.trim()}`);
  }
  if (customer?.phone?.trim()) {
    lines.push(`Phone: ${customer.phone.trim()}`);
  }
  if (customer?.name?.trim() || customer?.phone?.trim()) {
    lines.push("");
  }

  lines.push(`Items: ${order.items.length}`, "");

  order.items.forEach((item, index) => {
    const n = index + 1;
    lines.push("---");
    if (item.service === "stitching") {
      const s = item as StitchingOrderItem;
      lines.push(`Item ${n} — Stitching`);
      lines.push(`Design / reference: ${stitchingDesignSummary(s, catalog)}`);
      lines.push(`Notes: ${s.notes.trim() || "—"}`);
      if (s.deliveryPreference) {
        lines.push(
          `Preferred delivery date: ${formatIsoDateForWhatsApp(s.deliveryPreference)}`,
        );
      }
    } else {
      lines.push(`Item ${n} — Alteration`);
      lines.push(`Type: ${alterationTypeLabels[item.alterationType]}`);
      if (item.garmentImageName) {
        lines.push(`Garment photo: ${item.garmentImageName}`);
      }
      lines.push(`Notes: ${item.notes.trim() || "—"}`);
      if (item.deliveryPreference) {
        lines.push(
          `Preferred delivery date: ${formatIsoDateForWhatsApp(item.deliveryPreference)}`,
        );
      }
    }
    lines.push("");
  });

  lines.push("I'll share the reference image(s) in this chat next.");

  if (extras?.measurementAppend?.trim()) {
    lines.push("", extras.measurementAppend.trim());
  }

  return lines.join("\n");
}

/** Compact lines for order receipts (WhatsApp / text). */
export function describeOrderItemLinesForReceipt(
  item: OrderItem,
  catalog: CatalogItem[],
  index: number,
): string[] {
  const n = index + 1;
  if (item.service === "stitching") {
    return [
      `Item ${n} — Stitching`,
      `  Design / reference: ${stitchingDesignSummary(item, catalog)}`,
      `  Notes: ${item.notes.trim() || "—"}`,
      ...(item.deliveryPreference ? [`  Preferred delivery: ${item.deliveryPreference}`] : []),
    ];
  }
  return [
    `Item ${n} — Alteration`,
    `  Type: ${alterationTypeLabels[item.alterationType]}`,
    ...(item.garmentImageName ? [`  Garment photo: ${item.garmentImageName}`] : []),
    `  Notes: ${item.notes.trim() || "—"}`,
    ...(item.deliveryPreference ? [`  Pickup / delivery: ${item.deliveryPreference}`] : []),
  ];
}

export function validateOrderItems(items: OrderItem[]): boolean {
  if (items.length === 0) return false;
  for (const item of items) {
    if (!item.deliveryPreference?.trim()) {
      return false;
    }
    if (item.service === "stitching") {
      const s = item as StitchingOrderItem;
      if (s.designSource === "catalog" && !s.catalogId?.trim()) {
        return false;
      }
      if (s.designSource === "upload" && !s.referenceFileName?.trim()) {
        return false;
      }
      // "Describe" mode: text optional. Notes optional.
    }
  }
  return true;
}
