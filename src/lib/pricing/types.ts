export type PricingTierId = "basic" | "standard" | "premium";

export type StitchingPricingKey = "blouses" | "kurtis" | "dresses" | "custom_designs";

/** Aligns with `STYLING_ELEMENT_PRESETS` ids in `styling-elements.ts` — indicative add-on bands. */
export const STYLING_EXTRA_PRICE_IDS = [
  "lace_border",
  "tassel_latkan",
  "buttons_zipper",
  "padding_cups",
  "embroidery",
  "dyeing_color",
  "extra_lining",
] as const;

export type StylingExtraId = (typeof STYLING_EXTRA_PRICE_IDS)[number];

export type PricingModel = {
  currency: string;
  version: number;
  tierOrder: PricingTierId[];
  stitching: Record<StitchingPricingKey, Record<PricingTierId, [number, number]>>;
  alterations: {
    minor: [number, number];
    major: [number, number];
  };
  /** Indicative INR ranges per add-on category (quantity / complexity / material affect final quote). */
  stylingExtras: Record<StylingExtraId, [number, number]>;
  staffAdjustmentPercent: {
    min: number;
    max: number;
  };
};
