import { parseMeasurementSheetValues } from "./sheet-parse";
import { fetchMeasurementSheetValues } from "./sheets-fetch";
import type { SheetMeasurementRecord } from "./types";

type CacheEntry = {
  fetchedAt: number;
  records: SheetMeasurementRecord[];
};

let cache: CacheEntry | null = null;

const DEFAULT_TTL_MS = 5 * 60 * 1000;

function ttlMs(): number {
  const raw = process.env.GOOGLE_SHEETS_CACHE_TTL_SECONDS;
  if (!raw) return DEFAULT_TTL_MS;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 30) return DEFAULT_TTL_MS;
  return Math.min(n * 1000, 60 * 60 * 1000);
}

export function invalidateMeasurementSheetCache(): void {
  cache = null;
}

export async function getCachedMeasurementRecords(): Promise<SheetMeasurementRecord[]> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < ttlMs()) {
    return cache.records;
  }

  const values = await fetchMeasurementSheetValues();
  const records = parseMeasurementSheetValues(values);
  cache = { fetchedAt: now, records };
  return records;
}
