import type { AlterationOrderItem, DesignSource, OrderItemId, StitchingOrderItem } from "./types";

function newId(): OrderItemId {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createStitchingItem(
  partial?: Partial<Pick<StitchingOrderItem, "designSource" | "catalogId">>,
): StitchingOrderItem {
  const catalogId = partial?.catalogId?.trim() || undefined;
  const designSource =
    partial?.designSource ?? (catalogId ? "catalog" : "describe");
  const item: StitchingOrderItem = {
    id: newId(),
    service: "stitching",
    designSource,
    notes: "",
    describeText: "",
  };
  if (catalogId) {
    item.catalogId = catalogId;
  }
  return item;
}

export function createAlterationItem(): AlterationOrderItem {
  return {
    id: newId(),
    service: "alteration",
    alterationType: "resize",
    notes: "",
  };
}

export function createItemForService(
  service: "stitching" | "alteration",
  opts?: { catalogId?: string; designSource?: DesignSource },
): StitchingOrderItem | AlterationOrderItem {
  if (service === "alteration") {
    return createAlterationItem();
  }
  return createStitchingItem({
    designSource: opts?.catalogId ? "catalog" : opts?.designSource ?? "describe",
    catalogId: opts?.catalogId,
  });
}
