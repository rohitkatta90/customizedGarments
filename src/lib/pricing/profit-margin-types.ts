export type CostingMode = "effort_unit" | "hourly";

/** How minimum margin is interpreted (see docs/PROFIT_MARGIN.md). */
export type MarginBasis = "revenue" | "cost";

export type ProfitMarginModel = {
  currency: "INR";
  version: number;
  costComponents: {
    costingMode: CostingMode;
    /** Internal labour cost per effort unit (not the customer-facing base rate). */
    laborRateInrPerEffortUnit: number;
    /** Used when costingMode is hourly. */
    laborRateInrPerHour: number;
    /** Reference only: typical hours represented by one effort unit. */
    laborHoursPerEffortUnit: number;
    notes: string;
  };
  accessories: {
    markupPercentOnSupplierCost: number;
    notes: string;
  };
  overhead: {
    /** Percent of direct cost (labour + accessories at supplier cost). */
    percentOfDirectCost: number;
    notes: string;
  };
  marginPolicy: {
    basis: MarginBasis;
    minimumPercentPerOrder: number;
    targetPercentPerOrder: number;
    highMarginPercentThreshold: number;
    lowMarginPercentThreshold: number;
  };
  monitoring: {
    highProfitServiceProfileIds: string[];
    highProfitTier: "basic" | "standard" | "premium";
    lowMarginWatchNotes: string[];
  };
  optimization: {
    reviewCadenceDays: number;
    fabricRateInflationReviewPercent: number;
    notes: string;
  };
};
