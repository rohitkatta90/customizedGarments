import { normalizePhone } from "@/lib/orders/phone";

/** Match full normalized digits or same last 10 digits (handles +91 vs local 10-digit entry). */
export function phonesLooselyMatch(inputPhone: string, storedNormalized: string): boolean {
  const a = normalizePhone(inputPhone);
  const b = storedNormalized;
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.length >= 10 && b.length >= 10 && a.slice(-10) === b.slice(-10)) return true;
  return false;
}
