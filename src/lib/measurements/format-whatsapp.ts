import type { LatestMeasurementByGarment } from "./types";

export type GarmentMeasurementChoice = "use" | "update";

/**
 * Append to WhatsApp body when customer confirms on-file measurements (never overwrites sheet).
 */
export function formatMeasurementsForWhatsApp(
  items: LatestMeasurementByGarment[],
  choices: Record<string, GarmentMeasurementChoice>,
): string | null {
  const useList = items.filter((i) => (choices[i.garmentType] ?? "use") === "use");
  const updateList = items.filter((i) => choices[i.garmentType] === "update");

  if (useList.length === 0 && updateList.length === 0) return null;

  const lines: string[] = [""];

  if (useList.length > 0) {
    lines.push("--- Saved measurements (on file) ---");
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
    lines.push(
      "",
      `I'll send updated measurements in WhatsApp for: ${updateList.map((i) => i.garmentType).join(", ")}.`,
    );
  }

  return lines.join("\n");
}
