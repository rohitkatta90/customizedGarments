import { normalizePhone } from "@/lib/orders/phone";

import { phonesLooselyMatch } from "./phone-match";
import {
  SHEET_GARMENT_TYPES,
  type LatestMeasurementByGarment,
  type SheetGarmentType,
  type SheetMeasurementRecord,
} from "./types";

/**
 * Women’s measurement columns — entered directly in Google Sheets (no customer data-entry UI).
 * Headers are matched case-insensitively; spaces and underscores are equivalent (e.g. `SALWAR L` / `SALWAR_L`).
 */
export const MEASUREMENT_FIELD_KEYS = [
  "BP",
  "LW",
  "L",
  "B",
  "W",
  "H",
  "SH",
  "SL",
  "SR",
  "N",
  "XF",
  "XB",
  "AH",
  "SALWAR L",
  "SKIRT L",
  "PANT L",
] as const;

/** Row 1 headers the parser recognises (metadata + measurement columns). */
export const EXPECTED_HEADERS = [
  "Timestamp",
  "Phone_Number",
  "Customer_Name",
  "Garment_Type",
  ...MEASUREMENT_FIELD_KEYS,
] as const;

function normHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-+/g, "_");
}

function parseTimestampCell(cell: unknown): number | null {
  if (cell == null || cell === "") return null;
  if (typeof cell === "number" && Number.isFinite(cell)) {
    const epoch = Date.UTC(1899, 11, 30);
    const ms = epoch + Math.round(cell * 86400000);
    if (Number.isFinite(ms)) return ms;
  }
  if (typeof cell === "string") {
    const t = cell.trim();
    if (!t) return null;
    const parsed = Date.parse(t);
    if (!Number.isNaN(parsed)) return parsed;
    const d = new Date(t);
    if (!Number.isNaN(d.getTime())) return d.getTime();
  }
  return null;
}

function normalizeGarmentType(raw: string): SheetGarmentType | null {
  const key = raw
    .trim()
    .replace(/\s+/g, "_")
    .replace(/-+/g, "_");
  const lower = key.toLowerCase();
  const map: Record<string, SheetGarmentType> = {
    blouse: "Blouse",
    kurti: "Kurti",
    dress: "Dress",
    kids_blouse: "Kids_Blouse",
    kidsblouse: "Kids_Blouse",
    kids_dress: "Kids_Dress",
    kidsdress: "Kids_Dress",
  };
  if (map[lower]) return map[lower];
  for (const g of SHEET_GARMENT_TYPES) {
    if (g.toLowerCase().replace(/_/g, "") === lower.replace(/_/g, "")) return g;
  }
  return null;
}

function hasAnyMeasurement(values: Record<string, string>): boolean {
  return MEASUREMENT_FIELD_KEYS.some((k) => values[k]?.trim());
}

function formatDisplayDate(ms: number): string {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(ms));
  } catch {
    return new Date(ms).toISOString().slice(0, 10);
  }
}

/**
 * Parse Sheets `values` (including header row). Returns valid measurement rows only.
 */
export function parseMeasurementSheetValues(values: unknown[][]): SheetMeasurementRecord[] {
  if (!values.length) return [];

  const headerRow = values[0]!.map((c) => String(c ?? ""));
  const col: Record<string, number> = {};
  headerRow.forEach((h, i) => {
    const n = normHeader(h);
    for (const expected of EXPECTED_HEADERS) {
      if (normHeader(expected) === n) {
        col[expected] = i;
        break;
      }
    }
  });

  const need = ["Timestamp", "Phone_Number", "Garment_Type"] as const;
  for (const k of need) {
    if (col[k] === undefined) {
      return [];
    }
  }

  const out: SheetMeasurementRecord[] = [];

  const tsI = col["Timestamp"]!;
  const phoneI = col["Phone_Number"]!;
  const garmentI = col["Garment_Type"]!;

  for (let r = 1; r < values.length; r++) {
    const row = values[r]!;
    const tsMs = parseTimestampCell(row[tsI]);
    const phoneRaw = String(row[phoneI] ?? "").trim();
    const garmentRaw = String(row[garmentI] ?? "").trim();
    if (tsMs == null || !phoneRaw || !garmentRaw) continue;

    const phoneNormalized = normalizePhone(phoneRaw);
    if (phoneNormalized.length < 10) continue;

    const garmentType = normalizeGarmentType(garmentRaw);
    if (!garmentType) continue;

    const measurements: Record<string, string> = {};
    for (const key of MEASUREMENT_FIELD_KEYS) {
      const idx = col[key];
      if (idx === undefined) continue;
      const v = row[idx];
      const s = v == null ? "" : String(v).trim();
      if (s) measurements[key] = s;
    }

    if (!hasAnyMeasurement(measurements)) continue;

    const nameIdx = col["Customer_Name"];
    const customerName =
      nameIdx !== undefined ? String(row[nameIdx] ?? "").trim() : "";

    out.push({
      rowIndex: r + 1,
      timestampMs: tsMs,
      timestampIso: new Date(tsMs).toISOString(),
      phoneNormalized,
      customerName,
      garmentType,
      measurements,
    });
  }

  return out;
}

export function latestPerGarmentForPhone(
  records: SheetMeasurementRecord[],
  phoneInput: string,
): LatestMeasurementByGarment[] {
  const target = normalizePhone(phoneInput);
  if (target.length < 10) return [];

  const matching = records.filter((r) => phonesLooselyMatch(target, r.phoneNormalized));
  const byGarment = new Map<SheetGarmentType, SheetMeasurementRecord>();

  for (const rec of matching) {
    const prev = byGarment.get(rec.garmentType);
    if (!prev || rec.timestampMs > prev.timestampMs) {
      byGarment.set(rec.garmentType, rec);
    }
  }

  const list: LatestMeasurementByGarment[] = [...byGarment.values()].map((r) => ({
    garmentType: r.garmentType,
    recordedAtIso: r.timestampIso,
    recordedAtDisplay: formatDisplayDate(r.timestampMs),
    customerName: r.customerName,
    measurements: r.measurements,
  }));

  list.sort((a, b) => (a.garmentType < b.garmentType ? -1 : 1));
  return list;
}
