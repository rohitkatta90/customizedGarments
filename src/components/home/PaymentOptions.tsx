import { getDictionary } from "@/lib/i18n/server";
import { siteConfig } from "@/lib/site";

export async function PaymentOptions() {
  const dict = await getDictionary();

  return (
    <section className="section-y border-b border-border/50 bg-card">
      <div className="page-container">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {dict.payment.title}
        </h2>
        <p className="mt-3 max-w-2xl text-muted">{dict.payment.subtitle}</p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          <div className="ds-card">
            <h3 className="font-display text-xl font-semibold text-foreground">
              {dict.payment.onlineTitle}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">{dict.payment.onlineBody}</p>
            <p className="mt-5 rounded-2xl bg-background px-4 py-3 font-mono text-sm text-foreground">
              {dict.payment.upiLabel} {siteConfig.upiId}
            </p>
            <p className="mt-2 text-xs text-muted">{dict.payment.upiHint}</p>
          </div>
          <div className="ds-card">
            <h3 className="font-display text-xl font-semibold text-foreground">
              {dict.payment.codTitle}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">{dict.payment.codBody}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
