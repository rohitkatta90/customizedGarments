import { getDictionary } from "@/lib/i18n/server";
import { siteConfig } from "@/lib/site";

export async function PaymentOptions() {
  const dict = await getDictionary();

  return (
    <section className="border-y border-border/60 bg-white/50 py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">
          {dict.payment.title}
        </h2>
        <p className="mt-2 max-w-2xl text-muted">{dict.payment.subtitle}</p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="font-display text-xl font-semibold text-foreground">
              {dict.payment.onlineTitle}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{dict.payment.onlineBody}</p>
            <p className="mt-4 rounded-xl bg-background px-4 py-3 font-mono text-sm text-foreground">
              {dict.payment.upiLabel} {siteConfig.upiId}
            </p>
            <p className="mt-2 text-xs text-muted">{dict.payment.upiHint}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="font-display text-xl font-semibold text-foreground">
              {dict.payment.codTitle}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{dict.payment.codBody}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
