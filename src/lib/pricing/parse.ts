import type { PricingModel, PricingTierId, StitchingPricingKey, StylingExtraId } from "./types";
import { STYLING_EXTRA_PRICE_IDS } from "./types";

const STITCHING_KEYS: StitchingPricingKey[] = [
  "blouses",
  "kurtis",
  "dresses",
  "custom_designs",
];

const TIER_IDS: PricingTierId[] = ["basic", "standard", "premium"];

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

export function parsePricingModel(raw: unknown): PricingModel {
  if (!raw || typeof raw !== "object") {
    throw new Error("pricing: invalid root");
  }
  const o = raw as Record<string, unknown>;

  if (o.currency !== "INR") {
    throw new Error("pricing: currency must be INR");
  }
  if (typeof o.version !== "number") {
    throw new Error("pricing: version required");
  }

  const tierOrder = o.tierOrder;
  if (!Array.isArray(tierOrder) || tierOrder.length !== TIER_IDS.length) {
    throw new Error("pricing: tierOrder invalid");
  }
  for (let i = 0; i < TIER_IDS.length; i++) {
    if (tierOrder[i] !== TIER_IDS[i]) {
      throw new Error("pricing: tierOrder must be basic, standard, premium");
    }
  }

  const stitchingIn = o.stitching;
  if (!stitchingIn || typeof stitchingIn !== "object") {
    throw new Error("pricing: stitching missing");
  }
  const stitching: PricingModel["stitching"] = {
    blouses: { basic: [0, 0], standard: [0, 0], premium: [0, 0] },
    kurtis: { basic: [0, 0], standard: [0, 0], premium: [0, 0] },
    dresses: { basic: [0, 0], standard: [0, 0], premium: [0, 0] },
    custom_designs: { basic: [0, 0], standard: [0, 0], premium: [0, 0] },
  };

  for (const key of STITCHING_KEYS) {
    const cat = (stitchingIn as Record<string, unknown>)[key];
    if (!cat || typeof cat !== "object") {
      throw new Error(`pricing: stitching.${key} missing`);
    }
    for (const tier of TIER_IDS) {
      const range = (cat as Record<string, unknown>)[tier];
      if (!isTupleRange(range)) {
        throw new Error(`pricing: stitching.${key}.${tier} invalid range`);
      }
      stitching[key][tier] = [Math.round(range[0]), Math.round(range[1])];
    }
  }

  const alt = o.alterations;
  if (!alt || typeof alt !== "object") {
    throw new Error("pricing: alterations missing");
  }
  const a = alt as Record<string, unknown>;
  if (!isTupleRange(a.minor) || !isTupleRange(a.major)) {
    throw new Error("pricing: alterations.minor/major invalid");
  }

  const se = o.stylingExtras;
  if (!se || typeof se !== "object") {
    throw new Error("pricing: stylingExtras missing");
  }
  const stylingExtras = {} as PricingModel["stylingExtras"];
  for (const id of STYLING_EXTRA_PRICE_IDS) {
    const range = (se as Record<string, unknown>)[id];
    if (!isTupleRange(range)) {
      throw new Error(`pricing: stylingExtras.${id} invalid range`);
    }
    stylingExtras[id as StylingExtraId] = [Math.round(range[0]), Math.round(range[1])];
  }

  const staff = o.staffAdjustmentPercent;
  if (!staff || typeof staff !== "object") {
    throw new Error("pricing: staffAdjustmentPercent missing");
  }
  const s = staff as Record<string, unknown>;
  if (typeof s.min !== "number" || typeof s.max !== "number" || s.min > s.max) {
    throw new Error("pricing: staffAdjustmentPercent invalid");
  }

  return {
    currency: "INR",
    version: o.version,
    tierOrder: tierOrder as PricingTierId[],
    stitching,
    alterations: {
      minor: [Math.round(a.minor[0]), Math.round(a.minor[1])],
      major: [Math.round(a.major[0]), Math.round(a.major[1])],
    },
    stylingExtras,
    staffAdjustmentPercent: {
      min: Math.round(s.min),
      max: Math.round(s.max),
    },
  };
}
