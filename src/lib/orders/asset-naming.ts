import type { AlterationOrderItem, OrderItem, StitchingOrderItem } from "@/lib/order/types";

const NON_SAFE = /[^a-zA-Z0-9._-]+/g;

/** Compact token from order UUID for filenames (no hyphens, fixed length). */
export function orderRefTokenForFiles(orderId: string): string {
  return orderId.replace(/-/g, "").slice(0, 12).toLowerCase();
}

function slugPart(s: string, maxLen: number): string {
  const x = s.replace(NON_SAFE, "_").replace(/_+/g, "_").toLowerCase().replace(/^_|_$/g, "");
  return (x || "design").slice(0, maxLen);
}

/**
 * Basename without extension, e.g. order_755bf2e54707_item1_design_ref
 * Staff should rename customer uploads (IMG_1234.jpg) to this pattern inside the order folder.
 */
export function suggestedDesignAssetBasename(
  orderId: string,
  itemIndex1Based: number,
  role: string,
): string {
  const token = orderRefTokenForFiles(orderId);
  return `order_${token}_item${itemIndex1Based}_${slugPart(role, 40)}`;
}

export function extensionFromFilename(name: string | undefined): string {
  if (!name?.trim()) return "jpg";
  const m = /\.([a-zA-Z0-9]+)$/.exec(name.trim());
  return m ? m[1].toLowerCase() : "jpg";
}

export type SuggestedAssetFilename = {
  itemIndex: number;
  suggestedFilename: string;
  /** Why this suggestion (for UI) */
  hint: string;
};

/** One suggested rename per order line — for admin checklist when saving to Drive. */
export function listSuggestedAssetFilenames(orderId: string, items: OrderItem[]): SuggestedAssetFilename[] {
  return items.map((item, i) => {
    const n = i + 1;
    if (item.service === "stitching") {
      const s = item as StitchingOrderItem;
      if (s.designSource === "upload" && s.referenceFileName?.trim()) {
        const ext = extensionFromFilename(s.referenceFileName);
        return {
          itemIndex: n,
          suggestedFilename: `${suggestedDesignAssetBasename(orderId, n, "design_ref")}.${ext}`,
          hint: `Rename uploaded ref (was: ${s.referenceFileName})`,
        };
      }
      if (s.designSource === "catalog") {
        return {
          itemIndex: n,
          suggestedFilename: `${suggestedDesignAssetBasename(orderId, n, "catalog_screenshot")}.jpg`,
          hint: "Optional: save catalog reference screenshot from gallery",
        };
      }
      return {
        itemIndex: n,
        suggestedFilename: `${suggestedDesignAssetBasename(orderId, n, "design_from_notes")}.jpg`,
        hint: "Text-only design — photo optional if customer sends later",
      };
    }
    const a = item as AlterationOrderItem;
    if (a.garmentImageName?.trim()) {
      const ext = extensionFromFilename(a.garmentImageName);
      return {
        itemIndex: n,
        suggestedFilename: `${suggestedDesignAssetBasename(orderId, n, "garment")}.${ext}`,
        hint: `Rename garment photo (was: ${a.garmentImageName})`,
      };
    }
    return {
      itemIndex: n,
      suggestedFilename: `${suggestedDesignAssetBasename(orderId, n, "garment")}.jpg`,
      hint: "Garment photo optional — add if received on WhatsApp",
    };
  });
}
