import type { Dictionary } from "@/lib/i18n/types";
import type { DynamicPricingModel } from "@/lib/pricing/dynamic-types";
import { formatMultiplierRange } from "@/lib/pricing/format";

type Props = {
  model: DynamicPricingModel;
  dict: Dictionary;
};

export function DynamicPricingSection({ model, dict }: Props) {
  const d = dict.pricing.dynamic;
  const u = model.urgencySurchargePercent;
  const peak = model.demandMultiplierRange.peakSeason;
  const load = model.demandMultiplierRange.highWorkload;
  const days = model.referenceStandardLeadDays;

  const commPoints = d.commPoints.map((line) => line.replace("{{days}}", String(days)));

  return (
    <section className="mt-12 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="font-display text-2xl font-semibold text-foreground">{d.title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">{d.intro}</p>

      <h3 className="mt-10 font-display text-lg font-semibold text-foreground">{d.urgencyTitle}</h3>
      <p className="mt-2 text-sm text-muted">{d.urgencyIntro}</p>
      <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-background/40">
        <table className="w-full min-w-[360px] text-left text-sm">
          <thead className="border-b border-border bg-white/90 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">{d.colTimeline}</th>
              <th className="px-4 py-3">{d.colSurcharge}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <tr className="bg-background/30">
              <td className="px-4 py-3 font-medium text-foreground">{d.expressLabel}</td>
              <td className="px-4 py-3 text-muted">+{u.express}%</td>
            </tr>
            <tr className="bg-background/30">
              <td className="px-4 py-3 font-medium text-foreground">{d.nextDayLabel}</td>
              <td className="px-4 py-3 text-muted">+{u.nextDay}%</td>
            </tr>
            <tr className="bg-background/30">
              <td className="px-4 py-3 font-medium text-foreground">{d.sameDayLabel}</td>
              <td className="px-4 py-3 text-muted">+{u.sameDay}%</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted">{d.surchargeFootnote}</p>

      <h3 className="mt-10 font-display text-lg font-semibold text-foreground">{d.demandTitle}</h3>
      <p className="mt-2 text-sm text-muted">{d.demandIntro}</p>
      <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-background/40">
        <table className="w-full min-w-[360px] text-left text-sm">
          <thead className="border-b border-border bg-white/90 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">{d.colScenario}</th>
              <th className="px-4 py-3">{d.colMultiplier}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <tr className="bg-background/30">
              <td className="px-4 py-3 font-medium text-foreground">{d.peakLabel}</td>
              <td className="px-4 py-3 text-muted">{formatMultiplierRange(peak[0], peak[1])}</td>
            </tr>
            <tr className="bg-background/30">
              <td className="px-4 py-3 font-medium text-foreground">{d.workloadLabel}</td>
              <td className="px-4 py-3 text-muted">{formatMultiplierRange(load[0], load[1])}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted">{d.demandFootnote}</p>

      <div className="mt-8 rounded-xl border border-dashed border-border bg-white/60 p-4">
        <h4 className="text-sm font-semibold text-foreground">{d.capacityTitle}</h4>
        <p className="mt-2 text-sm text-muted">{d.capacityBody}</p>
      </div>

      <div className="mt-8 rounded-xl border border-accent/30 bg-accent/5 p-5">
        <h4 className="font-display text-lg font-semibold text-foreground">{d.commTitle}</h4>
        <p className="mt-2 text-sm text-muted">{d.commIntro}</p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted">
          {commPoints.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="mt-4 text-sm font-medium text-foreground">{d.commAlternative}</p>
      </div>

      <p className="mt-6 text-xs text-muted">{d.dynamicFootnote}</p>
    </section>
  );
}
