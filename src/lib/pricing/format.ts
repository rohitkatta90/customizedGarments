/** Single INR amount for display. */
export function formatInr(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

/** Multiplier band for demand pricing, e.g. 1.08× – 1.2× */
export function formatMultiplierRange(low: number, high: number): string {
  const a = Math.min(low, high);
  const b = Math.max(low, high);
  return `${a}× – ${b}×`;
}

/** Format an inclusive INR range for display (Indian grouping). */
export function formatInrRange(low: number, high: number): string {
  const a = Math.min(low, high);
  const b = Math.max(low, high);
  if (a === b) {
    return `₹${a.toLocaleString("en-IN")}`;
  }
  return `₹${a.toLocaleString("en-IN")} – ₹${b.toLocaleString("en-IN")}`;
}
