import type { Dictionary } from "@/lib/i18n/types";
import { formatInrRange } from "@/lib/pricing/format";
import type {
  AuthorityCaseId,
  AuthorityRoleId,
  RecordingChannelId,
  RecordingRowId,
  RecordingWhenId,
  StaffPricingPolicy,
} from "@/lib/pricing/staff-policy-types";
import type { PricingModel, PricingTierId, StitchingPricingKey } from "@/lib/pricing/types";

type Props = {
  pricing: PricingModel;
  policy: StaffPricingPolicy;
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

function tierTitle(dict: Dictionary, tier: PricingTierId): string {
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

function caseLabel(dict: Dictionary, id: AuthorityCaseId): string {
  return dict.pricing.internalGuidelines.authorityCaseLabels[id];
}

function roleLabel(dict: Dictionary, id: AuthorityRoleId): string {
  return dict.pricing.internalGuidelines.authorityRoleLabels[id];
}

function recLabel(dict: Dictionary, id: RecordingRowId): string {
  return dict.pricing.internalGuidelines.recordingLabels[id];
}

function channelLabel(dict: Dictionary, id: RecordingChannelId): string {
  return dict.pricing.internalGuidelines.channelLabels[id];
}

function whenLabel(dict: Dictionary, id: RecordingWhenId): string {
  return dict.pricing.internalGuidelines.whenLabels[id];
}

export function InternalPricingGuidelinesSection({ pricing, policy, dict }: Props) {
  const g = dict.pricing.internalGuidelines;
  const { min, max } = pricing.staffAdjustmentPercent;
  const months = policy.trainingReviewCadenceMonths;
  const trainingLine = g.trainingReviewLine.replace("{{months}}", String(months));

  return (
    <section className="mt-12 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="font-display text-2xl font-semibold text-foreground">{g.title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">{g.intro}</p>

      <h3 className="mt-10 font-display text-lg font-semibold text-foreground">{g.standardizationTitle}</h3>
      <p className="mt-2 text-sm text-muted">{g.standardizationIntro}</p>
      <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-background/40">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border bg-white/90 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">{dict.pricing.colCategory}</th>
              {pricing.tierOrder.map((tier) => (
                <th key={tier} className="px-4 py-3">
                  {tierTitle(dict, tier)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {STITCHING_ROW_KEYS.map((key) => (
              <tr key={key} className="bg-background/30">
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
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-background/40 p-4">
          <p className="text-sm font-semibold text-foreground">{g.alterationsStandardTitle}</p>
          <p className="mt-2 text-sm text-muted">{g.alterationsStandardIntro}</p>
          <p className="mt-2 text-sm font-medium text-accent-dark">
            {dict.pricing.minorLabel}: {formatInrRange(pricing.alterations.minor[0], pricing.alterations.minor[1])}
          </p>
          <p className="mt-1 text-sm font-medium text-accent-dark">
            {dict.pricing.majorLabel}: {formatInrRange(pricing.alterations.major[0], pricing.alterations.major[1])}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-background/40 p-4">
          <p className="text-sm font-semibold text-foreground">{g.adjustmentBandTitle}</p>
          <p className="mt-2 text-sm text-muted">
            {g.adjustmentBandBody.replace("{{min}}", String(min)).replace("{{max}}", String(max))}
          </p>
        </div>
      </div>

      <h3 className="mt-10 font-display text-lg font-semibold text-foreground">{g.rulesTitle}</h3>
      <p className="mt-2 text-sm text-muted">{g.rulesIntro}</p>
      <ol className="mt-4 list-decimal space-y-4 pl-5 text-sm leading-relaxed text-muted">
        {g.ruleSteps.map((step) => (
          <li key={step.title}>
            <span className="font-medium text-foreground">{step.title}</span>
            <span className="block mt-1">{step.body}</span>
          </li>
        ))}
      </ol>

      <h3 className="mt-10 font-display text-lg font-semibold text-foreground">{g.trainingTitle}</h3>
      <p className="mt-2 text-sm text-muted">{g.trainingIntro}</p>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted">
        {g.trainingBullets.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <p className="mt-4 text-sm font-medium text-foreground">{trainingLine}</p>

      <h3 className="mt-10 font-display text-lg font-semibold text-foreground">{g.exceptionsTitle}</h3>
      <p className="mt-2 text-sm text-muted">{g.exceptionsIntro}</p>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted">
        {g.exceptionsBullets.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      <h3 className="mt-10 font-display text-lg font-semibold text-foreground">{g.authorityTitle}</h3>
      <p className="mt-2 text-sm text-muted">{g.authorityIntro}</p>
      <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-background/40">
        <table className="w-full min-w-[360px] text-left text-sm">
          <thead className="border-b border-border bg-white/90 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">{g.colSituation}</th>
              <th className="px-4 py-3">{g.colWhoApproves}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {policy.authority.map((row) => (
              <tr key={row.caseId} className="bg-background/30">
                <td className="px-4 py-3 text-muted">{caseLabel(dict, row.caseId)}</td>
                <td className="px-4 py-3 font-medium text-foreground">{roleLabel(dict, row.roleId)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="mt-10 font-display text-lg font-semibold text-foreground">{g.documentationTitle}</h3>
      <p className="mt-2 text-sm text-muted">{g.documentationIntro}</p>
      <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-background/40">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="border-b border-border bg-white/90 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">{g.colRecord}</th>
              <th className="px-4 py-3">{g.colChannel}</th>
              <th className="px-4 py-3">{g.colWhen}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {policy.recording.map((row) => (
              <tr key={row.id} className="bg-background/30">
                <td className="px-4 py-3 font-medium text-foreground">{recLabel(dict, row.id)}</td>
                <td className="px-4 py-3 text-muted">{channelLabel(dict, row.channelId)}</td>
                <td className="px-4 py-3 text-muted">{whenLabel(dict, row.whenId)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 rounded-xl border border-dashed border-border bg-white/60 p-4">
        <p className="text-sm font-semibold text-foreground">{g.fileRefsTitle}</p>
        <ul className="mt-2 font-mono text-xs text-muted">
          <li>{policy.rangeAnchorFiles.stitchingAlterationsExtras}</li>
          <li>{policy.rangeAnchorFiles.effortModel}</li>
          <li>{policy.rangeAnchorFiles.rushPeak}</li>
          <li>{policy.rangeAnchorFiles.marginFloor}</li>
        </ul>
      </div>

      <p className="mt-6 text-xs text-muted">{g.guidelinesFootnote}</p>
    </section>
  );
}
