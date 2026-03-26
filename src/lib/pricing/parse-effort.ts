import type { EffortLevel, EffortPricingModel, ServiceProfileId } from "./effort-types";
import { SERVICE_PROFILE_IDS } from "./effort-types";

const LEVELS: EffortLevel[] = ["low", "medium", "high", "variable"];

function isEffortLevel(s: string): s is EffortLevel {
  return (LEVELS as readonly string[]).includes(s);
}

function isTupleRange(v: unknown): v is [number, number] {
  return (
    Array.isArray(v) &&
    v.length === 2 &&
    typeof v[0] === "number" &&
    typeof v[1] === "number" &&
    Number.isFinite(v[0]) &&
    Number.isFinite(v[1]) &&
    v[0] >= 0 &&
    v[1] >= v[0]
  );
}

export function parseEffortPricingModel(raw: unknown): EffortPricingModel {
  if (!raw || typeof raw !== "object") {
    throw new Error("effort-pricing: invalid root");
  }
  const o = raw as Record<string, unknown>;

  if (o.currency !== "INR") {
    throw new Error("effort-pricing: currency must be INR");
  }
  if (typeof o.version !== "number") {
    throw new Error("effort-pricing: version required");
  }
  if (typeof o.baseRateInrPerEffortUnit !== "number" || !Number.isFinite(o.baseRateInrPerEffortUnit)) {
    throw new Error("effort-pricing: baseRateInrPerEffortUnit invalid");
  }
  const baseRate = Math.max(0, Math.round(o.baseRateInrPerEffortUnit));

  const sp = o.serviceProfiles;
  if (!sp || typeof sp !== "object") {
    throw new Error("effort-pricing: serviceProfiles missing");
  }

  const serviceProfiles = {} as EffortPricingModel["serviceProfiles"];
  for (const id of SERVICE_PROFILE_IDS) {
    const row = (sp as Record<string, unknown>)[id];
    if (!row || typeof row !== "object") {
      throw new Error(`effort-pricing: serviceProfiles.${id} missing`);
    }
    const r = row as Record<string, unknown>;
    const level = r.effortLevel;
    if (typeof level !== "string" || !isEffortLevel(level)) {
      throw new Error(`effort-pricing: serviceProfiles.${id}.effortLevel invalid`);
    }
    if (!isTupleRange(r.typicalUnitsRange)) {
      throw new Error(`effort-pricing: serviceProfiles.${id}.typicalUnitsRange invalid`);
    }
    serviceProfiles[id as ServiceProfileId] = {
      effortLevel: level,
      typicalUnitsRange: [Math.round(r.typicalUnitsRange[0]), Math.round(r.typicalUnitsRange[1])],
    };
  }

  const f = o.factors;
  if (!f || typeof f !== "object") {
    throw new Error("effort-pricing: factors missing");
  }
  const fac = f as Record<string, unknown>;

  if (typeof fac.additionalUnitsPerExtraPiece !== "number" || !Number.isFinite(fac.additionalUnitsPerExtraPiece)) {
    throw new Error("effort-pricing: factors.additionalUnitsPerExtraPiece invalid");
  }
  if (typeof fac.addOnEffortUnitsPerCategory !== "number" || !Number.isFinite(fac.addOnEffortUnitsPerCategory)) {
    throw new Error("effort-pricing: factors.addOnEffortUnitsPerCategory invalid");
  }

  const cm = fac.complexityMultiplier;
  if (!cm || typeof cm !== "object") {
    throw new Error("effort-pricing: factors.complexityMultiplier missing");
  }
  const c = cm as Record<string, unknown>;
  for (const tier of ["basic", "standard", "premium"] as const) {
    if (typeof c[tier] !== "number" || !Number.isFinite(c[tier]) || c[tier]! <= 0) {
      throw new Error(`effort-pricing: factors.complexityMultiplier.${tier} invalid`);
    }
  }

  const um = fac.urgencyMultiplier;
  if (!um || typeof um !== "object") {
    throw new Error("effort-pricing: factors.urgencyMultiplier missing");
  }
  const u = um as Record<string, unknown>;
  for (const key of ["standard", "rush"] as const) {
    if (typeof u[key] !== "number" || !Number.isFinite(u[key]) || u[key]! <= 0) {
      throw new Error(`effort-pricing: factors.urgencyMultiplier.${key} invalid`);
    }
  }

  return {
    currency: "INR",
    version: o.version,
    baseRateInrPerEffortUnit: baseRate,
    serviceProfiles,
    factors: {
      additionalUnitsPerExtraPiece: fac.additionalUnitsPerExtraPiece,
      complexityMultiplier: {
        basic: c.basic as number,
        standard: c.standard as number,
        premium: c.premium as number,
      },
      addOnEffortUnitsPerCategory: fac.addOnEffortUnitsPerCategory,
      urgencyMultiplier: {
        standard: u.standard as number,
        rush: u.rush as number,
      },
    },
  };
}
