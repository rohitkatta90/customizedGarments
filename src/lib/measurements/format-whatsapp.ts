import type { LatestMeasurementByGarment } from "./types";

export type GarmentMeasurementChoice = "use" | "update";

/** Stored on quick-order API / echoed in WhatsApp for staff clarity. */
export type MeasurementPreferenceCode = "USE_SAVED" | "UPDATE_REQUIRED";

export type MeasurementSelectionPayload = {
  items: LatestMeasurementByGarment[];
  choices: Record<string, GarmentMeasurementChoice>;
  /** True once the customer has explicitly chosen Use or Update for every returned garment. */
  selectionComplete: boolean;
  /** ISO timestamps from sheet (`recordedAtIso`) per garment type. */
  lastMeasurementDatesByGarment: Record<string, string>;
};

export function preferenceCodeFromChoice(c: GarmentMeasurementChoice): MeasurementPreferenceCode {
  return c === "use" ? "USE_SAVED" : "UPDATE_REQUIRED";
}

const PREF_CODES = new Set<MeasurementPreferenceCode>(["USE_SAVED", "UPDATE_REQUIRED"]);

/**
 * Compact block for order line-item / sheet notes (server + clients).
 * Ignores entries that are not valid preference codes.
 */
export function buildMeasurementPreferenceOrderNotes(
  preferences: Record<string, string>,
  lastSavedAt?: Record<string, string> | null,
): string | null {
  const entries = Object.entries(preferences).filter(([, v]) =>
    PREF_CODES.has(v as MeasurementPreferenceCode),
  );
  if (entries.length === 0) return null;
  const lines: string[] = ["[Measurement preference]"];
  for (const [garment, code] of entries) {
    const when = lastSavedAt?.[garment]?.trim();
    lines.push(`• ${garment}: ${code}${when ? ` (last saved: ${when})` : ""}`);
  }
  return lines.join("\n");
}

export function buildMeasurementSelectionPayload(
  items: LatestMeasurementByGarment[],
  choices: Record<string, GarmentMeasurementChoice>,
): MeasurementSelectionPayload | null {
  if (!items.length) return null;
  const lastMeasurementDatesByGarment = Object.fromEntries(
    items.map((i) => [i.garmentType, i.recordedAtIso]),
  );
  const selectionComplete = items.every(
    (i) => choices[i.garmentType] === "use" || choices[i.garmentType] === "update",
  );
  return { items, choices, selectionComplete, lastMeasurementDatesByGarment };
}

/**
 * Append to WhatsApp body when customer confirms on-file measurements (never overwrites sheet).
 * Call only when `selectionComplete` is true for the payload.
 */
export function formatMeasurementsForWhatsApp(
  items: LatestMeasurementByGarment[],
  choices: Record<string, GarmentMeasurementChoice>,
): string | null {
  const useList = items.filter((i) => choices[i.garmentType] === "use");
  const updateList = items.filter((i) => choices[i.garmentType] === "update");

  if (useList.length === 0 && updateList.length === 0) return null;

  const prefLines: string[] = [];
  for (const it of items) {
    const c = choices[it.garmentType];
    if (c !== "use" && c !== "update") continue;
    const code = preferenceCodeFromChoice(c);
    prefLines.push(
      `• ${it.garmentType}: ${code} (last on file: ${it.recordedAtDisplay})`,
    );
  }

  const lines: string[] = ["", "--- Measurement preference ---", ...prefLines];

  if (useList.length > 0) {
    lines.push("", "--- Saved measurements (on file) ---");
    for (const m of useList) {
      const parts = Object.entries(m.measurements)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");
      lines.push(
        `• ${m.garmentType} (recorded ${m.recordedAtDisplay})${m.customerName ? ` — ${m.customerName}` : ""}: ${parts}`,
      );
    }
  }

  if (updateList.length > 0) {
    lines.push("", "We’ll take or confirm your measurements before stitching.");
  }

  return lines.join("\n");
}
