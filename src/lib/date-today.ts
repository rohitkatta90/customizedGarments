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
