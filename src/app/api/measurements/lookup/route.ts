import { NextResponse } from "next/server";

import { getCachedMeasurementRecords } from "@/lib/measurements/cache";
import { latestPerGarmentForPhone } from "@/lib/measurements/sheet-parse";
import {
  isMeasurementSheetsConfigured,
  measurementSheetsEnvPresence,
} from "@/lib/measurements/sheets-fetch";
import type { LatestMeasurementByGarment } from "@/lib/measurements/types";
import { isPhonePlausible, normalizePhone } from "@/lib/orders/phone";

export const runtime = "nodejs";

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 40;
const ipBuckets = new Map<string, number[]>();

function clientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    return xff.split(",")[0]!.trim() || "unknown";
  }
  return request.headers.get("x-real-ip")?.trim() || "local";
}

function rateAllowed(ip: string): boolean {
  const now = Date.now();
  const prev = ipBuckets.get(ip) ?? [];
  const fresh = prev.filter((t) => now - t < WINDOW_MS);
  if (fresh.length >= MAX_PER_WINDOW) return false;
  fresh.push(now);
  ipBuckets.set(ip, fresh);
  return true;
}

/** Pull a readable reason from googleapis / Gaxios errors for local debugging. */
function sheetErrorMessage(e: unknown): string {
  if (e instanceof Error && e.message) return e.message;
  if (typeof e === "object" && e !== null && "response" in e) {
    const res = (e as { response?: { data?: unknown } }).response;
    const data = res?.data as
      | { error?: { message?: string; errors?: { message?: string }[] } }
      | undefined;
    const g = data?.error;
    if (g?.message) return g.message;
    const first = g?.errors?.[0]?.message;
    if (first) return first;
  }
  return String(e);
}

export type MeasurementLookupResponse =
  | {
      ok: true;
      configured: true;
      phoneNormalized: string;
      found: boolean;
      latestByGarment: LatestMeasurementByGarment[];
    }
  | {
      ok: true;
      configured: false;
      found: false;
      /** Which env vars are non-empty (no secret values). Shown when Sheets is not wired. */
      configurationStatus?: {
        hasSpreadsheetId: boolean;
        hasClientEmail: boolean;
        hasPrivateKey: boolean;
      };
    }
  | {
      ok: false;
      error: "invalid_phone" | "rate_limited" | "sheet_error";
      message?: string;
    };

export async function POST(request: Request): Promise<NextResponse<MeasurementLookupResponse>> {
  if (!rateAllowed(clientIp(request))) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  let body: { phone?: string };
  try {
    body = (await request.json()) as { phone?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_phone" }, { status: 400 });
  }

  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  if (!isPhonePlausible(phone)) {
    return NextResponse.json({ ok: false, error: "invalid_phone" }, { status: 400 });
  }

  if (!isMeasurementSheetsConfigured()) {
    const configurationStatus = measurementSheetsEnvPresence();
    console.warn("[measurements/lookup] sheets env incomplete", configurationStatus);
    return NextResponse.json({
      ok: true,
      configured: false,
      found: false,
      configurationStatus,
    });
  }

  try {
    const records = await getCachedMeasurementRecords();
    const latestByGarment = latestPerGarmentForPhone(records, phone);
    return NextResponse.json({
      ok: true,
      configured: true,
      phoneNormalized: normalizePhone(phone),
      found: latestByGarment.length > 0,
      latestByGarment,
    });
  } catch (e) {
    const detail = sheetErrorMessage(e);
    console.error("[measurements/lookup]", detail, e);
    const expose =
      process.env.NODE_ENV === "development" || process.env.MEASUREMENT_LOOKUP_DEBUG === "1";
    return NextResponse.json(
      {
        ok: false,
        error: "sheet_error",
        message: expose ? detail : undefined,
      },
      { status: 502 },
    );
  }
}
