import { describeOrderItemLinesForReceipt } from "@/lib/order/whatsapp";
import type { CatalogItem } from "@/lib/types";

import type { StoredOrder } from "./schema";

/**
 * Plain-text block for WhatsApp (or copy/paste) to tailor / cutting master.
 * Prefer sharing the Drive folder link; this message ties Order ID to folder + specs.
 */
export function buildTailorHandoffWhatsAppText(
  order: StoredOrder,
  catalog: CatalogItem[],
  overrides?: {
    designAssetsFolderUrl?: string | null;
    tailorHandoffNotesInternal?: string | null;
  },
): string {
  const folderUrl =
    overrides?.designAssetsFolderUrl !== undefined
      ? overrides.designAssetsFolderUrl
      : order.designAssetsFolderUrl;
  const tailorNotes =
    overrides?.tailorHandoffNotesInternal !== undefined
      ? overrides.tailorHandoffNotesInternal
      : order.tailorHandoffNotesInternal;

  const lines: string[] = [];
  const short = order.id.slice(0, 8);

  lines.push(
    "Tailor / cutting handoff",
    "",
    `Order ID (full): ${order.id}`,
    `Order ref (short): ${short}`,
    `Customer: ${order.customerName} | ${order.customerPhone}`,
    "",
  );

  if (folderUrl?.trim()) {
    lines.push("Design folder (images + notes.txt):", folderUrl.trim(), "");
  } else {
    lines.push("Design folder: (link not set in admin yet — add Google Drive / shared folder URL)", "");
  }

  lines.push("--- Line items (from website / intake) ---", "");
  order.items.forEach((item, index) => {
    lines.push(...describeOrderItemLinesForReceipt(item, catalog, index));
    lines.push("");
  });

  if (tailorNotes?.trim()) {
    lines.push("--- Structured tailor notes ---", tailorNotes.trim(), "");
  }

  lines.push(
    "Reminder: Final reference files should live in the shared folder under this Order ID, not only in WhatsApp.",
  );

  return lines.join("\n");
}
