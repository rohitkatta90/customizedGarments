import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { getDictionary } from "@/lib/i18n/server";
import { siteConfig } from "@/lib/site";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export async function HomeQuickActionsSection() {
  const dict = await getDictionary();
  const q = dict.homeQuickActions;
  const imm = dict.homeImmediate;
  const wa = buildWhatsAppUrl(dict.wa.hero.replace("{{name}}", siteConfig.name));

  const cards = [
    {
      title: q.stitchTitle,
      body: q.stitchBody,
      href: "/request?service=stitching",
    },
    {
      title: q.alterTitle,
      body: q.alterBody,
      href: "/request?service=alteration",
    },
    {
      title: q.kidsTitle,
      body: q.kidsBody,
      href: "/request",
    },
  ] as const;

  return (
    <section className="border-b border-border/50 bg-background py-20 md:py-24 lg:py-[100px]">
      <div className="page-container">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {imm.title}
        </h2>
        <p className="mt-3 max-w-2xl text-base text-muted">{imm.body}</p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button href="/request" variant="primary" className="min-h-[52px] w-full sm:w-auto">
            {imm.ctaRequest}
          </Button>
          <Button href={wa} external variant="secondary" className="min-h-[52px] w-full sm:w-auto">
            {imm.ctaWhatsapp}
          </Button>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {cards.map((c) => (
            <Link
              key={c.href + c.title}
              href={c.href}
              className="group ds-card transition hover:border-accent/35 hover:shadow-[0_8px_32px_-8px_rgba(43,43,43,0.12)]"
            >
              <h3 className="font-display text-xl font-semibold text-foreground group-hover:text-accent-dark">
                {c.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{c.body}</p>
              <span className="mt-5 inline-block text-sm font-semibold text-accent-dark">
                {dict.home.open}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
