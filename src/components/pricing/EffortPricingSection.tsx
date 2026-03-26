import type { Dictionary } from "@/lib/i18n/types";
import {
  priceFromEffortUnits,
  SERVICE_PROFILE_IDS,
  type EffortLevel,
  type EffortPricingModel,
  type ServiceProfileId,
} from "@/lib/pricing/effort-types";
import { formatInr, formatInrRange } from "@/lib/pricing/format";

type Props = {
  model: EffortPricingModel;
  dict: Dictionary;
};

function effortLevelLabel(dict: Dictionary, level: EffortLevel): string {
  const e = dict.pricing.effort;
  switch (level) {
    case "low":
      return e.levelLow;
    case "medium":
      return e.levelMedium;
    case "high":
      return e.levelHigh;
    case "variable":
      return e.levelVariable;
    default:
      return level;
  }
}

function profileLabel(dict: Dictionary, id: ServiceProfileId): string {
  return dict.pricing.effort.profileLabels[id];
}

export function EffortPricingSection({ model, dict }: Props) {
  const e = dict.pricing.effort;
  const f = model.factors;
  const exampleAmount = formatInr(priceFromEffortUnits(6, model.baseRateInrPerEffortUnit));

  const factorPieces = e.factorPieces.replace("{{units}}", String(f.additionalUnitsPerExtraPiece));
  const factorComplexity = e.factorComplexity
    .replace("{{b}}", String(f.complexityMultiplier.basic))
    .replace("{{s}}", String(f.complexityMultiplier.standard))
    .replace("{{p}}", String(f.complexityMultiplier.premium));
  const factorAddons = e.factorAddons.replace("{{per}}", String(f.addOnEffortUnitsPerCategory));
  const factorUrgency = e.factorUrgency
    .replace("{{std}}", String(f.urgencyMultiplier.standard))
    .replace("{{rush}}", String(f.urgencyMultiplier.rush));

  return (
    <section className="mt-12 rounded-2xl border border-border bg-gradient-to-b from-accent/5 to-card p-6 shadow-sm">
      <h2 className="font-display text-2xl font-semibold text-foreground">{e.title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">{e.intro}</p>

      <div className="mt-8 rounded-xl border border-border bg-white/80 p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">{e.formulaTitle}</h3>
        <p className="mt-2 text-sm leading-relaxed text-foreground">{e.formulaBody}</p>
        <p className="mt-4 font-display text-2xl font-semibold text-accent-dark">
          {e.baseRateLabel}: {formatInr(model.baseRateInrPerEffortUnit)}
        </p>
      </div>

      <h3 className="mt-10 font-display text-lg font-semibold text-foreground">{e.profilesTitle}</h3>
      <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-background/40">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="border-b border-border bg-white/90 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">{e.colService}</th>
              <th className="px-4 py-3">{e.colEffortLevel}</th>
              <th className="px-4 py-3">{e.colTypicalUnits}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {SERVICE_PROFILE_IDS.map((id) => {
              const row = model.serviceProfiles[id];
              const [lo, hi] = row.typicalUnitsRange;
              return (
                <tr key={id} className="bg-background/30">
                  <td className="px-4 py-3 font-medium text-foreground">{profileLabel(dict, id)}</td>
                  <td className="px-4 py-3 text-muted">{effortLevelLabel(dict, row.effortLevel)}</td>
                  <td className="px-4 py-3 text-muted">{formatInrRange(lo, hi)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h3 className="mt-10 font-display text-lg font-semibold text-foreground">{e.factorsTitle}</h3>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted">
        <li>{factorPieces}</li>
        <li className="text-xs text-muted/90">{e.factorPiecesNote}</li>
        <li>{factorComplexity}</li>
        <li>{factorAddons}</li>
        <li className="text-xs text-muted/90">{e.factorAddonsNote}</li>
        <li>{factorUrgency}</li>
      </ul>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-white/70 p-4">
          <h4 className="text-sm font-semibold text-foreground">{e.consistencyTitle}</h4>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted">
            {e.consistency.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-white/70 p-4">
          <h4 className="text-sm font-semibold text-foreground">{e.guidelinesTitle}</h4>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted">
            {e.guidelines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-dashed border-accent/40 bg-accent/5 p-4">
        <h4 className="text-sm font-semibold text-foreground">{e.exampleTitle}</h4>
        <p className="mt-2 text-sm text-muted">
          {e.exampleBody.replace("{{amount}}", exampleAmount)}
        </p>
      </div>

      <p className="mt-6 text-xs text-muted">{e.effortFootnote}</p>
    </section>
  );
}
