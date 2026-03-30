import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { getDictionary } from "@/lib/i18n/server";
import { siteConfig } from "@/lib/site";

export async function HomeServicesSection() {
  const dict = await getDictionary();
  const s = dict.homeServices;

  const blocks = [
    {
      title: s.stitchingTitle,
      body: s.stitchingBody,
      href: "/request?service=stitching",
    },
    {
      title: s.alterationsTitle,
      body: s.alterationsBody,
      href: "/request?service=alteration",
    },
    {
      title: s.galleryTitle,
      body: s.galleryBody,
      href: "/gallery",
    },
  ] as const;

  return (
    <section className="border-b border-border/50 bg-background py-20 md:py-24 lg:py-[100px]">
      <div className="page-container">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {s.title}
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">{s.intro}</p>
        <p className="mt-5 max-w-2xl rounded-2xl border border-accent/25 bg-[#fff9f8] px-5 py-4 text-sm leading-relaxed text-foreground">
          {s.kidsLine}
        </p>

        <ul className="mt-12 grid gap-5 lg:grid-cols-3">
          {blocks.map((b) => (
            <li key={b.href} className="ds-card flex flex-col bg-gradient-to-b from-card to-background/60">
              <h3 className="font-display text-xl font-semibold text-foreground">{b.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{b.body}</p>
              <Link
                href={b.href}
                className="mt-5 inline-flex text-sm font-semibold text-accent-dark underline-offset-4 hover:underline"
              >
                {s.learnMore} →
              </Link>
            </li>
          ))}
        </ul>

        {siteConfig.showPublicPricing ? (
          <div className="mt-12 flex justify-center">
            <Button href="/pricing" variant="secondary">
              {dict.nav.pricing}
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
