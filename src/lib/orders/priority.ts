export const ORDER_PRIORITIES = ["standard", "rush"] as const;

export type OrderPriority = (typeof ORDER_PRIORITIES)[number];

export function isOrderPriority(s: string): s is OrderPriority {
  return (ORDER_PRIORITIES as readonly string[]).includes(s);
}

export function normalizeOrderPriority(raw: string | undefined | null): OrderPriority {
  if (raw && isOrderPriority(raw)) return raw;
  return "standard";
}
