/** Linear fulfillment steps (shown on customer tracking). */
export const FULFILLMENT_STATUSES = [
  "request_received",
  "confirmed",
  "in_progress",
  "ready",
  "delivered",
] as const;

/** All stored statuses including terminal / exceptional. */
export const ORDER_STATUSES = [...FULFILLMENT_STATUSES, "cancelled"] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Customer-safe labels (no internal jargon). */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  request_received: "Request received",
  confirmed: "Confirmed",
  in_progress: "In progress",
  ready: "Ready",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const LEGACY_STATUS_MAP: Record<string, OrderStatus> = {
  pending: "request_received",
  completed: "delivered",
};

export function isOrderStatus(s: string): s is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(s);
}

/** Normalize Firestore / legacy values when reading documents. */
export function normalizeOrderStatus(raw: string): OrderStatus {
  if (isOrderStatus(raw)) return raw;
  return LEGACY_STATUS_MAP[raw] ?? "request_received";
}

/** Index in the fulfillment stepper; `-1` for cancelled (no linear step). */
export function orderStatusStepIndex(status: OrderStatus): number {
  if (status === "cancelled") return -1;
  return FULFILLMENT_STATUSES.indexOf(
    status as (typeof FULFILLMENT_STATUSES)[number],
  );
}
