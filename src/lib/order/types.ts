import type { AlterationType } from "@/lib/types";

/** Client-generated id for React keys and WhatsApp reference */
export type OrderItemId = string;

export type DesignSource = "catalog" | "upload" | "describe";

export type StitchingOrderItem = {
  id: OrderItemId;
  service: "stitching";
  designSource: DesignSource;
  /** Set when designSource === "catalog" */
  catalogId?: string;
  /** Filename hint when user picks upload */
  referenceFileName?: string;
  /** When designSource === "describe" */
  describeText?: string;
  /** Fabric, measurements, instructions */
  notes: string;
  /** Optional preferred delivery date (YYYY-MM-DD) */
  deliveryPreference?: string;
};

export type AlterationOrderItem = {
  id: OrderItemId;
  service: "alteration";
  alterationType: AlterationType;
  garmentImageName?: string;
  notes: string;
  deliveryPreference?: string;
};

export type OrderItem = StitchingOrderItem | AlterationOrderItem;

/**
 * One customer request (1:N items). No server persistence yet — used for UI + WhatsApp.
 * Future backend: `order.id` UUID, `items[].id` stable, `status` per item + derived order status.
 */
export type Order = {
  id: string;
  items: OrderItem[];
};
