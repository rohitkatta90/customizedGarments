/** Canonical garment labels as stored in Google Sheet `Garment_Type` column (after normalization). */
export const SHEET_GARMENT_TYPES = [
  "Blouse",
  "Kurti",
  "Dress",
  "Kids_Blouse",
  "Kids_Dress",
] as const;

export type SheetGarmentType = (typeof SHEET_GARMENT_TYPES)[number];

export type SheetMeasurementRecord = {
  /** Original row index in sheet (1-based, for debugging only — not sent to client in production if desired) */
  rowIndex: number;
  timestampMs: number;
  timestampIso: string;
  phoneNormalized: string;
  customerName: string;
  garmentType: SheetGarmentType;
  measurements: Record<string, string>;
};

/** One row per garment type — latest by timestamp for a phone. */
export type LatestMeasurementByGarment = {
  garmentType: SheetGarmentType;
  recordedAtIso: string;
  recordedAtDisplay: string;
  customerName: string;
  measurements: Record<string, string>;
};
