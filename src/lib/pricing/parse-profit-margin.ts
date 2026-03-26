import type { CostingMode, MarginBasis, ProfitMarginModel } from "./profit-margin-types";

const COSTING: CostingMode[] = ["effort_unit", "hourly"];
const BASIS: MarginBasis[] = ["revenue", "cost"];
const TIERS = ["basic", "standard", "premium"] as const;

function isCostingMode(v: unknown): v is CostingMode {
  return typeof v === "string" && (COSTING as readonly string[]).includes(v);
}

function isMarginBasis(v: unknown): v is MarginBasis {
  return typeof v === "string" && (BASIS as readonly string[]).includes(v);
}

export function parseProfitMarginModel(raw: unknown): ProfitMarginModel {
  if (!raw || typeof raw !== "object") {
    throw new Error("profit-margin: invalid root");
  }
  const o = raw as Record<string, unknown>;

  if (o.currency !== "INR") {
    throw new Error("profit-margin: currency must be INR");
  }
  if (typeof o.version !== "number") {
    throw new Error("profit-margin: version required");
  }

  const cc = o.costComponents;
  if (!cc || typeof cc !== "object") {
    throw new Error("profit-margin: costComponents missing");
  }
  const ccr = cc as Record<string, unknown>;
  if (!isCostingMode(ccr.costingMode)) {
    throw new Error("profit-margin: costComponents.costingMode invalid");
  }
  const mode = ccr.costingMode;

  const laborUnit =
    typeof ccr.laborRateInrPerEffortUnit === "number" && Number.isFinite(ccr.laborRateInrPerEffortUnit)
      ? ccr.laborRateInrPerEffortUnit
      : NaN;
  const laborHour =
    typeof ccr.laborRateInrPerHour === "number" && Number.isFinite(ccr.laborRateInrPerHour)
      ? ccr.laborRateInrPerHour
      : NaN;
  const hoursPerUnit =
    typeof ccr.laborHoursPerEffortUnit === "number" && Number.isFinite(ccr.laborHoursPerEffortUnit)
      ? ccr.laborHoursPerEffortUnit
      : NaN;

  if (mode === "effort_unit" && (laborUnit <= 0 || !Number.isFinite(laborUnit))) {
    throw new Error("profit-margin: laborRateInrPerEffortUnit must be > 0 for effort_unit mode");
  }
  if (mode === "hourly" && (laborHour <= 0 || !Number.isFinite(laborHour))) {
    throw new Error("profit-margin: laborRateInrPerHour must be > 0 for hourly mode");
  }
  if (!Number.isFinite(hoursPerUnit) || hoursPerUnit < 0) {
    throw new Error("profit-margin: laborHoursPerEffortUnit invalid");
  }
  if (typeof ccr.notes !== "string") {
    throw new Error("profit-margin: costComponents.notes must be a string");
  }

  const acc = o.accessories;
  if (!acc || typeof acc !== "object") {
    throw new Error("profit-margin: accessories missing");
  }
  const ar = acc as Record<string, unknown>;
  const markup =
    typeof ar.markupPercentOnSupplierCost === "number" && Number.isFinite(ar.markupPercentOnSupplierCost)
      ? ar.markupPercentOnSupplierCost
      : NaN;
  if (markup < 0 || markup > 200) {
    throw new Error("profit-margin: markupPercentOnSupplierCost invalid");
  }
  if (typeof ar.notes !== "string") {
    throw new Error("profit-margin: accessories.notes must be a string");
  }

  const oh = o.overhead;
  if (!oh || typeof oh !== "object") {
    throw new Error("profit-margin: overhead missing");
  }
  const ohr = oh as Record<string, unknown>;
  const pct =
    typeof ohr.percentOfDirectCost === "number" && Number.isFinite(ohr.percentOfDirectCost)
      ? ohr.percentOfDirectCost
      : NaN;
  if (pct < 0 || pct > 80) {
    throw new Error("profit-margin: overhead.percentOfDirectCost invalid");
  }
  if (typeof ohr.notes !== "string") {
    throw new Error("profit-margin: overhead.notes must be a string");
  }

  const mp = o.marginPolicy;
  if (!mp || typeof mp !== "object") {
    throw new Error("profit-margin: marginPolicy missing");
  }
  const mpr = mp as Record<string, unknown>;
  if (!isMarginBasis(mpr.basis)) {
    throw new Error("profit-margin: marginPolicy.basis invalid");
  }
  const minP = num(mpr.minimumPercentPerOrder, "marginPolicy.minimumPercentPerOrder", 0, 85);
  const tgtP = num(mpr.targetPercentPerOrder, "marginPolicy.targetPercentPerOrder", 0, 90);
  const highP = num(mpr.highMarginPercentThreshold, "marginPolicy.highMarginPercentThreshold", 0, 95);
  const lowP = num(mpr.lowMarginPercentThreshold, "marginPolicy.lowMarginPercentThreshold", 0, 95);
  if (highP <= lowP) {
    throw new Error("profit-margin: highMarginPercentThreshold must exceed lowMarginPercentThreshold");
  }

  const mon = o.monitoring;
  if (!mon || typeof mon !== "object") {
    throw new Error("profit-margin: monitoring missing");
  }
  const monr = mon as Record<string, unknown>;
  if (!Array.isArray(monr.highProfitServiceProfileIds) || monr.highProfitServiceProfileIds.length === 0) {
    throw new Error("profit-margin: monitoring.highProfitServiceProfileIds required");
  }
  for (const id of monr.highProfitServiceProfileIds) {
    if (typeof id !== "string" || !id.trim()) {
      throw new Error("profit-margin: monitoring.highProfitServiceProfileIds invalid entry");
    }
  }
  if (typeof monr.highProfitTier !== "string" || !(TIERS as readonly string[]).includes(monr.highProfitTier)) {
    throw new Error("profit-margin: monitoring.highProfitTier invalid");
  }
  if (!Array.isArray(monr.lowMarginWatchNotes) || monr.lowMarginWatchNotes.length === 0) {
    throw new Error("profit-margin: monitoring.lowMarginWatchNotes required");
  }
  for (const line of monr.lowMarginWatchNotes) {
    if (typeof line !== "string" || !line.trim()) {
      throw new Error("profit-margin: monitoring.lowMarginWatchNotes invalid entry");
    }
  }

  const opt = o.optimization;
  if (!opt || typeof opt !== "object") {
    throw new Error("profit-margin: optimization missing");
  }
  const optr = opt as Record<string, unknown>;
  const cadence = int(optr.reviewCadenceDays, "optimization.reviewCadenceDays", 1, 730);
  const infl = num(optr.fabricRateInflationReviewPercent, "optimization.fabricRateInflationReviewPercent", 0, 50);
  if (typeof optr.notes !== "string") {
    throw new Error("profit-margin: optimization.notes must be a string");
  }

  return {
    currency: "INR",
    version: o.version,
    costComponents: {
      costingMode: mode,
      laborRateInrPerEffortUnit: mode === "effort_unit" ? Math.round(laborUnit) : 0,
      laborRateInrPerHour: mode === "hourly" ? Math.round(laborHour) : Math.round(Number.isFinite(laborHour) ? laborHour : 0),
      laborHoursPerEffortUnit: hoursPerUnit,
      notes: ccr.notes,
    },
    accessories: {
      markupPercentOnSupplierCost: Math.round(markup),
      notes: ar.notes,
    },
    overhead: {
      percentOfDirectCost: Math.round(pct),
      notes: ohr.notes,
    },
    marginPolicy: {
      basis: mpr.basis,
      minimumPercentPerOrder: Math.round(minP),
      targetPercentPerOrder: Math.round(tgtP),
      highMarginPercentThreshold: Math.round(highP),
      lowMarginPercentThreshold: Math.round(lowP),
    },
    monitoring: {
      highProfitServiceProfileIds: monr.highProfitServiceProfileIds as string[],
      highProfitTier: monr.highProfitTier as "basic" | "standard" | "premium",
      lowMarginWatchNotes: monr.lowMarginWatchNotes as string[],
    },
    optimization: {
      reviewCadenceDays: cadence,
      fabricRateInflationReviewPercent: Math.round(infl),
      notes: optr.notes,
    },
  };
}

function num(
  v: unknown,
  label: string,
  min: number,
  max: number,
): number {
  if (typeof v !== "number" || !Number.isFinite(v)) {
    throw new Error(`profit-margin: ${label} invalid`);
  }
  if (v < min || v > max) {
    throw new Error(`profit-margin: ${label} out of range`);
  }
  return v;
}

function int(v: unknown, label: string, min: number, max: number): number {
  const n = num(v, label, min, max);
  return Math.round(n);
}
