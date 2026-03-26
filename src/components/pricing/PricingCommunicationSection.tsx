import type { Dictionary } from "@/lib/i18n/types";

type Props = {
  dict: Dictionary;
};

export function PricingCommunicationSection({ dict }: Props) {
  const c = dict.pricing.communication;

  return (
    <section className="mt-12 rounded-2xl border border-accent/25 bg-gradient-to-b from-accent/5 to-card p-6 shadow-sm">
      <h2 className="font-display text-2xl font-semibold text-foreground">{c.title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">{c.intro}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground">{c.clarityTitle}</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
            {c.clarityBullets.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground">{c.toneTitle}</h3>
          <p className="mt-3 text-sm leading-relaxed text-muted">{c.toneBody}</p>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-border bg-white/70 p-5">
        <h3 className="font-display text-lg font-semibold text-foreground">{c.trustTitle}</h3>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-foreground">
          {c.trustBullets.map((line) => (
            <li key={line} className="marker:text-accent-dark">
              {line}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8">
        <h3 className="font-display text-lg font-semibold text-foreground">{c.breakdownTitle}</h3>
        <p className="mt-2 text-sm text-muted">{c.breakdownIntro}</p>
        <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted">{c.breakdownExampleLabel}</p>
        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-xl border border-dashed border-border bg-background/60 p-4 font-mono text-xs leading-relaxed text-foreground">
          {c.breakdownExample}
        </pre>
      </div>

      <div className="mt-8 rounded-xl border border-border bg-card p-5">
        <h3 className="font-display text-lg font-semibold text-foreground">{c.upsellTitle}</h3>
        <p className="mt-2 text-sm text-muted">{c.upsellIntro}</p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
          {c.upsellBullets.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>

      <div className="mt-10">
        <h3 className="font-display text-lg font-semibold text-foreground">{c.examplesTitle}</h3>
        <ul className="mt-4 space-y-4">
          {c.exampleItems.map((ex) => (
            <li key={ex.title} className="rounded-xl border border-border bg-background/40 px-4 py-3">
              <p className="text-sm font-semibold text-foreground">{ex.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{ex.body}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-10">
        <h3 className="font-display text-lg font-semibold text-foreground">{c.templatesTitle}</h3>
        <div className="mt-4 space-y-6">
          {c.templateItems.map((t) => (
            <div key={t.id} className="rounded-xl border border-border bg-white/80 p-4">
              <p className="text-sm font-semibold text-accent-dark">{t.title}</p>
              <pre className="mt-3 overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-muted">
                {t.body}
              </pre>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10">
        <h3 className="font-display text-lg font-semibold text-foreground">{c.uxTitle}</h3>
        <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-background/40">
          <table className="w-full min-w-[320px] text-left text-sm">
            <thead className="border-b border-border bg-white/90 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">{c.colUxPlace}</th>
                <th className="px-4 py-3">{c.colUxRole}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {c.uxItems.map((row) => (
                <tr key={row.where} className="bg-background/30">
                  <td className="px-4 py-3 font-medium text-foreground">{row.where}</td>
                  <td className="px-4 py-3 text-muted">{row.body}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-6 text-xs text-muted">{c.commFootnote}</p>
    </section>
  );
}
