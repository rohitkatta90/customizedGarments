import { addCalendarDaysLocal } from "@/lib/date-today";

/**
 * Calendar days from today treated as a typical “standard” lead window.
 * Keep in sync with `public/data/dynamic-pricing.json` → `referenceStandardLeadDays`.
 */
export const PRIORITY_STANDARD_LEAD_DAYS = 14;

/** True when the chosen date is strictly before (today + standard lead days). */
export function isPreferredDateEarlierThanStandardLead(
  preferredIso: string,
  todayIso: string,
): boolean {
  const t = preferredIso.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return false;
  const cutoff = addCalendarDaysLocal(todayIso, PRIORITY_STANDARD_LEAD_DAYS);
  return t < cutoff;
}
