/**
 * Today's date as YYYY-MM-DD in the user's local timezone.
 * Use for `<input type="date" min={...} />` so past calendar days aren't selectable.
 */
export function todayLocalISODate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * If value is a valid YYYY-MM-DD before minIso, returns minIso; otherwise returns value (or "" if empty).
 * Use when native `min` on `<input type="date">` is ignored (e.g. some iOS Safari builds).
 */
export function clampIsoDateToMin(value: string, minIso: string): string {
  const v = value.trim();
  if (!v) return "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || !/^\d{4}-\d{2}-\d{2}$/.test(minIso)) return v;
  return v < minIso ? minIso : v;
}

/** Add calendar days to a YYYY-MM-DD string in local time; returns YYYY-MM-DD. */
export function addCalendarDaysLocal(isoDate: string, days: number): string {
  const [y, mo, d] = isoDate.split("-").map(Number);
  const dt = new Date(y!, mo! - 1, d!);
  dt.setDate(dt.getDate() + days);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}
