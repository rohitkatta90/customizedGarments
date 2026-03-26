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
  const catalogId = partial?.catalogId;
  const designSource =
    partial?.designSource ?? (catalogId ? "catalog" : "describe");
  return {
    id: newId(),
    service: "stitching",
    designSource,
    catalogId,
    notes: "",
    describeText: "",
  };
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
