import type { Dictionary } from "@/lib/i18n/types";
import type { ProfitMarginModel } from "@/lib/pricing/profit-margin-types";

type Props = {
  model: ProfitMarginModel;
  dict: Dictionary;
};

function profileLabel(dict: Dictionary, id: string): string {
  const labels = dict.pricing.effort.profileLabels;
  if (id === "stitching_basic") {
    return labels.stitching_basic;
  }
  if (id === "stitching_designer") {
    return labels.stitching_designer;
  }
  if (id === "alteration") {
    return labels.alteration;
  }
  return id;
}

function tierLabel(dict: Dictionary, tier: ProfitMarginModel["monitoring"]["highProfitTier"]): string {
  switch (tier) {
    case "basic":
      return dict.pricing.colTierBasic;
    case "standard":
      return dict.pricing.colTierStandard;
    case "premium":
      return dict.pricing.colTierPremium;
    default:
      return tier;
  }
}

export function ProfitMarginSection({ model, dict }: Props) {
  const m = dict.pricing.margin;
  const cc = model.costComponents;
  const basisLabel = model.marginPolicy.basis === "revenue" ? m.basisRevenue : m.basisCost;

  const exampleUnits = 6;
  const exampleSupplierAccessories = 800;
  const labor = cc.costingMode === "effort_unit" ? Math.round(exampleUnits * cc.laborRateInrPerEffortUnit) : 0;
  const direct = labor + exampleSupplierAccessories;
  const overhead = Math.round(direct * (model.overhead.percentOfDirectCost / 100));
  const totalCost = direct + overhead;
  const minPrice =
    model.marginPolicy.basis === "revenue"
      ? Math.ceil(totalCost / (1 - model.marginPolicy.minimumPercentPerOrder / 100))
      : Math.ceil(totalCost * (1 + model.marginPolicy.minimumPercentPerOrder / 100));

  const exampleBody = m.exampleBody
    .replace("{{units}}", String(exampleUnits))
    .replace("{{labor}}", String(labor))
    .replace("{{acc}}", String(exampleSupplierAccessories))
    .replace("{{direct}}", String(direct))
    .replace("{{overhead}}", String(overhead))
    .replace("{{totalCost}}", String(totalCost))
    .replace("{{minPrice}}", String(minPrice));

  return (
    <section className="mt-12 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="font-display text-2xl font-semibold text-foreground">{m.title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">{m.intro}</p>

      <h3 className="mt-10 font-display text-lg font-semibold text-foreground">{m.costTitle}</h3>
      <p className="mt-2 text-sm text-muted">{m.costIntro}</p>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted">
        <li>
          <span className="font-medium text-foreground">{m.laborLabel}</span> —{" "}
          {cc.costingMode === "effort_unit"
            ? m.laborEffortLine
                .replace("{{rate}}", String(cc.laborRateInrPerEffortUnit))
                .replace("{{hours}}", String(cc.laborHoursPerEffortUnit))
                .replace("{{hourly}}", String(cc.laborRateInrPerHour))
            : m.laborHourlyLine.replace("{{hourly}}", String(cc.laborRateInrPerHour))}
        </li>
        <li>
          <span className="font-medium text-foreground">{m.accessoriesLabel}</span> —{" "}
          {m.accessoriesLine.replace("{{markup}}", String(model.accessories.markupPercentOnSupplierCost))}
        </li>
        <li>
          <span className="font-medium text-foreground">{m.overheadLabel}</span> —{" "}
          {m.overheadLine.replace("{{pct}}", String(model.overhead.percentOfDirectCost))}
        </li>
      </ul>

      <h3 className="mt-10 font-display text-lg font-semibold text-foreground">{m.marginTitle}</h3>
      <p className="mt-2 text-sm text-muted">{m.marginIntro}</p>
      <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-background/40">
        <table className="w-full min-w-[360px] text-left text-sm">
          <thead className="border-b border-border bg-white/90 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">{m.colPolicy}</th>
              <th className="px-4 py-3">{m.colPercent}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <tr className="bg-background/30">
              <td className="px-4 py-3 font-medium text-foreground">{m.rowMinimum}</td>
              <td className="px-4 py-3 text-muted">≥ {model.marginPolicy.minimumPercentPerOrder}%</td>
            </tr>
            <tr className="bg-background/30">
              <td className="px-4 py-3 font-medium text-foreground">{m.rowTarget}</td>
              <td className="px-4 py-3 text-muted">≈ {model.marginPolicy.targetPercentPerOrder}%</td>
            </tr>
            <tr className="bg-background/30">
              <td className="px-4 py-3 font-medium text-foreground">{m.rowBasis}</td>
              <td className="px-4 py-3 text-muted">{basisLabel}</td>
            </tr>
            <tr className="bg-background/30">
              <td className="px-4 py-3 font-medium text-foreground">{m.rowBands}</td>
              <td className="px-4 py-3 text-muted">
                {m.bandRange
                  .replace("{{low}}", String(model.marginPolicy.lowMarginPercentThreshold))
                  .replace("{{high}}", String(model.marginPolicy.highMarginPercentThreshold))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted">{m.marginBandsFootnote}</p>

      <h3 className="mt-10 font-display text-lg font-semibold text-foreground">{m.checkTitle}</h3>
      <p className="mt-2 text-sm text-muted">{m.checkIntro}</p>
      <pre className="mt-3 overflow-x-auto rounded-xl border border-dashed border-border bg-white/60 p-4 font-mono text-xs leading-relaxed text-foreground">
        {m.checkFormula}
      </pre>
      <p className="mt-3 text-sm text-muted">{exampleBody}</p>

      <h3 className="mt-10 font-display text-lg font-semibold text-foreground">{m.monitorTitle}</h3>
      <p className="mt-2 text-sm text-muted">{m.monitorIntro}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-background/40 p-4">
          <p className="text-sm font-semibold text-foreground">{m.highProfitTitle}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
            {model.monitoring.highProfitServiceProfileIds.map((id) => (
              <li key={id}>{profileLabel(dict, id)}</li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-muted">
            {m.highProfitTierLine.replace("{{tier}}", tierLabel(dict, model.monitoring.highProfitTier))}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-background/40 p-4">
          <p className="text-sm font-semibold text-foreground">{m.lowMarginTitle}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
            {model.monitoring.lowMarginWatchNotes.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      </div>

      <h3 className="mt-10 font-display text-lg font-semibold text-foreground">{m.optimizeTitle}</h3>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted">
        <li>{m.optimizeExperience}</li>
        <li>{m.optimizeDemand}</li>
        <li>
          {m.optimizeCosts
            .replace("{{days}}", String(model.optimization.reviewCadenceDays))
            .replace("{{pct}}", String(model.optimization.fabricRateInflationReviewPercent))}
        </li>
      </ul>

      <p className="mt-6 text-xs text-muted">{m.marginFootnote}</p>
    </section>
  );
}
