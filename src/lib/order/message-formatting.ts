/**
 * Human-facing labels for WhatsApp request messages (REQ-style id, readable dates).
 */

/** REQ-YYYY-NNN derived from order UUID — stable for the same id (aligns with sheet-style refs). */
export function formatRequestIdForWhatsApp(orderId: string): string {
  const y = new Date().getFullYear();
  const hex = orderId.replace(/-/g, "");
  const slice = (hex.slice(-12) || hex).padStart(8, "0");
  const n = Number.parseInt(slice.slice(0, 8), 16);
  const seq = Number.isFinite(n) ? n % 1000 : 0;
  return `REQ-${y}-${String(seq).padStart(3, "0")}`;
}

/** e.g. "15 Apr 2026" */
export function formatIsoDateForWhatsApp(iso: string): string {
  const t = iso.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const d = new Date(`${t}T12:00:00`);
  if (Number.isNaN(d.getTime())) return t;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
