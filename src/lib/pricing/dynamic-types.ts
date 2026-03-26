export type DynamicPricingModel = {
  currency: "INR";
  version: number;
  /**
   * Percent added to the agreed labour / quote when a faster-than-standard timeline is confirmed.
   * Express = faster queue; next-day / same-day = extreme slots.
   */
  urgencySurchargePercent: {
    express: number;
    nextDay: number;
    sameDay: number;
  };
  /** Multiplicative uplift on the reference quote during peak demand (pick a value inside the band). */
  demandMultiplierRange: {
    peakSeason: [number, number];
    highWorkload: [number, number];
  };
  /** Used for “standard timeline” alternative copy — indicative calendar days. */
  referenceStandardLeadDays: number;
};
