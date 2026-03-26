export type EffortLevel = "low" | "medium" | "high" | "variable";

export const SERVICE_PROFILE_IDS = ["stitching_basic", "stitching_designer", "alteration"] as const;

export type ServiceProfileId = (typeof SERVICE_PROFILE_IDS)[number];

export type EffortPricingModel = {
  currency: "INR";
  version: number;
  /** Studio-wide anchor: price ≈ effort_units × base_rate (see docs). */
  baseRateInrPerEffortUnit: number;
  serviceProfiles: Record<
    ServiceProfileId,
    {
      effortLevel: EffortLevel;
      typicalUnitsRange: [number, number];
    }
  >;
  factors: {
    /** Extra effective units per additional garment in the same order (after the first). */
    additionalUnitsPerExtraPiece: number;
    complexityMultiplier: Record<"basic" | "standard" | "premium", number>;
    /** Rough units per add-on category quoted (lace, embroidery, etc.). */
    addOnEffortUnitsPerCategory: number;
    urgencyMultiplier: Record<"standard" | "rush", number>;
  };
};

/** Illustrative total for a single number of whole effort units (training / examples). */
export function priceFromEffortUnits(units: number, baseRateInrPerEffortUnit: number): number {
  const u = Math.max(0, units);
  const r = Math.max(0, baseRateInrPerEffortUnit);
  return Math.round(u * r);
}
