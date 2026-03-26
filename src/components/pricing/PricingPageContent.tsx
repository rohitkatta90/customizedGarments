import type { Dictionary } from "@/lib/i18n/types";
import { DynamicPricingSection } from "@/components/pricing/DynamicPricingSection";
import { EffortPricingSection } from "@/components/pricing/EffortPricingSection";
import { PricingCommunicationSection } from "@/components/pricing/PricingCommunicationSection";
import { InternalPricingGuidelinesSection } from "@/components/pricing/InternalPricingGuidelinesSection";
import { ProfitMarginSection } from "@/components/pricing/ProfitMarginSection";
import type { DynamicPricingModel } from "@/lib/pricing/dynamic-types";
import type { EffortPricingModel } from "@/lib/pricing/effort-types";
import type { ProfitMarginModel } from "@/lib/pricing/profit-margin-types";
import type { StaffPricingPolicy } from "@/lib/pricing/staff-policy-types";
import { formatInrRange } from "@/lib/pricing/format";
import type {
  PricingModel,
  PricingTierId,
  StitchingPricingKey,
  StylingExtraId,
} from "@/lib/pricing/types";
import { STYLING_EXTRA_PRICE_IDS } from "@/lib/pricing/types";

type Props = {
  pricing: PricingModel;
  effort: EffortPricingModel;
  dynamic: DynamicPricingModel;
  margin: ProfitMarginModel;
  staffPolicy: StaffPricingPolicy;
  dict: Dictionary;
};

const STITCHING_ROW_KEYS: StitchingPricingKey[] = [
  "blouses",
  "kurtis",
  "dresses",
  "custom_designs",
];

function rowLabel(dict: Dictionary, key: StitchingPricingKey): string {
  switch (key) {
    case "blouses":
      return dict.categories.blouses;
    case "kurtis":
      return dict.categories.kurtis;
    case "dresses":
      return dict.categories.dresses;
    case "custom_designs":
      return dict.categories.customDesigns;
    default:
      return key;
  }
}

function extraLabel(dict: Dictionary, id: StylingExtraId): string {
  return dict.pricing.stylingExtraLabels[id];
}

function tierColumnTitle(dict: Dictionary, tier: PricingTierId): string {
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

export function PricingPageContent({ pricing, effort, dynamic, margin, staffPolicy, dict }: Props) {
  const p = dict.pricing;
  const { min, max } = pricing.staffAdjustmentPercent;

  return (
    <div className="py-10 sm:py-14">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <h1 className="font-display text-4xl font-semibold text-foreground sm:text-5xl">
          {p.pageTitle}
        </h1>
        <p className="mt-3 text-muted">{p.pageIntro}</p>

        <section className="mt-12 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-display text-xl font-semibold text-foreground">{p.principlesTitle}</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
            {p.principles.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>

        <PricingCommunicationSection dict={dict} />

        <EffortPricingSection model={effort} dict={dict} />

        <DynamicPricingSection model={dynamic} dict={dict} />

        <ProfitMarginSection model={margin} dict={dict} />

        <InternalPricingGuidelinesSection pricing={pricing} policy={staffPolicy} dict={dict} />

        <section className="mt-10">
          <h2 className="font-display text-2xl font-semibold text-foreground">{p.tiersSectionTitle}</h2>
          <p className="mt-2 text-sm text-muted">{p.tiersSectionIntro}</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-background/80 p-5">
              <p className="text-sm font-semibold text-accent-dark">{p.basicName}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{p.basicDesc}</p>
            </div>
            <div className="rounded-2xl border border-border bg-background/80 p-5">
              <p className="text-sm font-semibold text-accent-dark">{p.standardName}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{p.standardDesc}</p>
            </div>
            <div className="rounded-2xl border border-border bg-background/80 p-5 sm:col-span-1">
              <p className="text-sm font-semibold text-accent-dark">{p.premiumName}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{p.premiumDesc}</p>
            </div>
          </div>
          <div className="mt-8 rounded-2xl border border-dashed border-border bg-white/60 p-5">
            <p className="text-sm font-semibold text-foreground">{p.howToChooseTitle}</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted">
              {p.howToChoose.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold text-foreground">{p.stitchingTableTitle}</h2>
          <p className="mt-2 text-sm text-muted">{p.stitchingTableIntro}</p>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border bg-white/90 text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">{p.colCategory}</th>
                  {pricing.tierOrder.map((tier) => (
                    <th key={tier} className="px-4 py-3">
                      {tierColumnTitle(dict, tier)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {STITCHING_ROW_KEYS.map((key) => (
                  <tr key={key} className="bg-background/40">
                    <td className="px-4 py-3 font-medium text-foreground">{rowLabel(dict, key)}</td>
                    {pricing.tierOrder.map((tier) => {
                      const [low, high] = pricing.stitching[key][tier];
                      return (
                        <td key={tier} className="px-4 py-3 text-muted">
                          {formatInrRange(low, high)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-12 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-display text-xl font-semibold text-foreground">{p.alterationsTitle}</h2>
          <p className="mt-2 text-sm text-muted">{p.alterationsIntro}</p>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="font-medium text-foreground">{p.minorLabel}</p>
              <p className="mt-1 text-2xl font-semibold text-accent-dark">
                {formatInrRange(pricing.alterations.minor[0], pricing.alterations.minor[1])}
              </p>
              <p className="mt-2 text-sm text-muted">{p.minorExamples}</p>
            </div>
            <div>
              <p className="font-medium text-foreground">{p.majorLabel}</p>
              <p className="mt-1 text-2xl font-semibold text-accent-dark">
                {formatInrRange(pricing.alterations.major[0], pricing.alterations.major[1])}
              </p>
              <p className="mt-2 text-sm text-muted">{p.majorExamples}</p>
            </div>
          </div>
        </section>

        <section className="mt-12 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-display text-2xl font-semibold text-foreground">{p.addOnsTitle}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{p.addOnsIntro}</p>
          <p className="mt-4 rounded-xl border border-dashed border-accent/40 bg-accent/5 px-4 py-3 text-sm leading-relaxed text-foreground">
            {p.addOnsPositioning}
          </p>
          <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-muted">
            {p.addOnsFactorsTitle}
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
            {p.addOnsFactors.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <div className="mt-8 overflow-x-auto rounded-xl border border-border bg-background/40">
            <table className="w-full min-w-[400px] text-left text-sm">
              <thead className="border-b border-border bg-white/90 text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">{p.addOnsColCategory}</th>
                  <th className="px-4 py-3">{p.addOnsColRange}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {STYLING_EXTRA_PRICE_IDS.map((id) => {
                  const [low, high] = pricing.stylingExtras[id];
                  return (
                    <tr key={id} className="bg-background/30">
                      <td className="px-4 py-3 font-medium text-foreground">{extraLabel(dict, id)}</td>
                      <td className="px-4 py-3 text-muted">{formatInrRange(low, high)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-8 rounded-xl border border-border bg-white/70 p-5">
            <h3 className="font-display text-lg font-semibold text-foreground">{p.addOnsApprovalTitle}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{p.addOnsApprovalBody}</p>
          </div>
        </section>

        <section className="mt-10 space-y-6 rounded-2xl border border-border bg-white/70 p-6">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">{p.staffTitle}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {p.staffBody}{" "}
              <span className="font-medium text-foreground">
                ({min}% to +{max}%)
              </span>
            </p>
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">{p.transparencyTitle}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{p.transparencyBody}</p>
          </div>
        </section>

        <p className="mt-8 text-xs text-muted">{p.footnote}</p>
      </div>
    </div>
  );
}
