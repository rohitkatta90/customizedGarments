import type { MarginBasis, ProfitMarginModel } from "./profit-margin-types";

/** Labour cost from effort units (internal rate). */
export function laborCostFromEffortUnits(units: number, model: ProfitMarginModel): number {
  if (model.costComponents.costingMode !== "effort_unit") {
    return 0;
  }
  const u = Math.max(0, units);
  const r = Math.max(0, model.costComponents.laborRateInrPerEffortUnit);
  return Math.round(u * r);
}

/** Labour cost from billable hours (internal rate). */
export function laborCostFromHours(hours: number, model: ProfitMarginModel): number {
  if (model.costComponents.costingMode !== "hourly") {
    return 0;
  }
  const h = Math.max(0, hours);
  const r = Math.max(0, model.costComponents.laborRateInrPerHour);
  return Math.round(h * r);
}

export function computeDirectCost(laborCostInr: number, accessoriesSupplierCostInr: number): number {
  return Math.max(0, laborCostInr) + Math.max(0, accessoriesSupplierCostInr);
}

export function computeOverheadAmount(directCostInr: number, overheadPercentOfDirect: number): number {
  const d = Math.max(0, directCostInr);
  const p = Math.max(0, overheadPercentOfDirect);
  return Math.round(d * (p / 100));
}

export function computeTotalCost(directCostInr: number, overheadPercentOfDirect: number): number {
  return directCostInr + computeOverheadAmount(directCostInr, overheadPercentOfDirect);
}

/**
 * Minimum quote so margin meets policy. For `revenue` basis: margin = (price − cost) / price.
 * For `cost` basis: margin = (price − cost) / cost.
 */
export function minimumPriceForMargin(totalCostInr: number, minimumPercent: number, basis: MarginBasis): number {
  const c = Math.max(0, totalCostInr);
  const m = Math.max(0, minimumPercent);
  if (c === 0) {
    return 0;
  }
  if (basis === "revenue") {
    const cap = Math.min(99, m);
    return Math.ceil(c / (1 - cap / 100));
  }
  return Math.ceil(c * (1 + m / 100));
}

export function isQuotedPriceAcceptable(
  quotedPriceInr: number,
  totalCostInr: number,
  model: ProfitMarginModel,
): boolean {
  const min = minimumPriceForMargin(
    totalCostInr,
    model.marginPolicy.minimumPercentPerOrder,
    model.marginPolicy.basis,
  );
  return quotedPriceInr >= min;
}

/** Gross margin as % of quoted price (revenue). */
export function grossMarginPercentOnRevenue(quotedPriceInr: number, totalCostInr: number): number | null {
  if (quotedPriceInr <= 0) {
    return null;
  }
  return ((quotedPriceInr - totalCostInr) / quotedPriceInr) * 100;
}

export type MarginBand = "high" | "ok" | "low";

export function classifyMarginBand(marginPercentOnRevenue: number, model: ProfitMarginModel): MarginBand {
  const { highMarginPercentThreshold, lowMarginPercentThreshold } = model.marginPolicy;
  if (marginPercentOnRevenue >= highMarginPercentThreshold) {
    return "high";
  }
  if (marginPercentOnRevenue < lowMarginPercentThreshold) {
    return "low";
  }
  return "ok";
}
