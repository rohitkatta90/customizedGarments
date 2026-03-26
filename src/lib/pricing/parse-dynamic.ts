import type { DynamicPricingModel } from "./dynamic-types";

function isTupleRange(v: unknown): v is [number, number] {
  return (
    Array.isArray(v) &&
    v.length === 2 &&
    typeof v[0] === "number" &&
    typeof v[1] === "number" &&
    Number.isFinite(v[0]) &&
    Number.isFinite(v[1]) &&
    v[1] >= v[0]
  );
}

export function parseDynamicPricingModel(raw: unknown): DynamicPricingModel {
  if (!raw || typeof raw !== "object") {
    throw new Error("dynamic-pricing: invalid root");
  }
  const o = raw as Record<string, unknown>;

  if (o.currency !== "INR") {
    throw new Error("dynamic-pricing: currency must be INR");
  }
  if (typeof o.version !== "number") {
    throw new Error("dynamic-pricing: version required");
  }

  const u = o.urgencySurchargePercent;
  if (!u || typeof u !== "object") {
    throw new Error("dynamic-pricing: urgencySurchargePercent missing");
  }
  const ur = u as Record<string, unknown>;
  for (const key of ["express", "nextDay", "sameDay"] as const) {
    if (typeof ur[key] !== "number" || !Number.isFinite(ur[key]) || ur[key]! < 0 || ur[key]! > 100) {
      throw new Error(`dynamic-pricing: urgencySurchargePercent.${key} invalid`);
    }
  }

  const d = o.demandMultiplierRange;
  if (!d || typeof d !== "object") {
    throw new Error("dynamic-pricing: demandMultiplierRange missing");
  }
  const dr = d as Record<string, unknown>;
  if (!isTupleRange(dr.peakSeason) || dr.peakSeason[0] < 1) {
    throw new Error("dynamic-pricing: demandMultiplierRange.peakSeason invalid");
  }
  if (!isTupleRange(dr.highWorkload) || dr.highWorkload[0] < 1) {
    throw new Error("dynamic-pricing: demandMultiplierRange.highWorkload invalid");
  }

  if (typeof o.referenceStandardLeadDays !== "number" || !Number.isFinite(o.referenceStandardLeadDays) || o.referenceStandardLeadDays < 1) {
    throw new Error("dynamic-pricing: referenceStandardLeadDays invalid");
  }

  return {
    currency: "INR",
    version: o.version,
    urgencySurchargePercent: {
      express: Math.round(ur.express as number),
      nextDay: Math.round(ur.nextDay as number),
      sameDay: Math.round(ur.sameDay as number),
    },
    demandMultiplierRange: {
      peakSeason: [dr.peakSeason[0], dr.peakSeason[1]],
      highWorkload: [dr.highWorkload[0], dr.highWorkload[1]],
    },
    referenceStandardLeadDays: Math.round(o.referenceStandardLeadDays),
  };
}
