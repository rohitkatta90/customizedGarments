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
    <section className="border-b border-border/60 bg-white py-14 sm:py-18">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">{s.title}</h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">{s.intro}</p>
        <p className="mt-4 max-w-2xl rounded-xl border border-accent/20 bg-[#fff9f8] px-4 py-3 text-sm leading-relaxed text-foreground">
          {s.kidsLine}
        </p>

        <ul className="mt-10 grid gap-6 lg:grid-cols-3">
          {blocks.map((b) => (
            <li
              key={b.href}
              className="flex flex-col rounded-2xl border border-border bg-gradient-to-b from-card to-background/80 p-6 shadow-sm"
            >
              <h3 className="font-display text-xl font-semibold text-foreground">{b.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{b.body}</p>
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
          <div className="mt-10 flex justify-center">
            <Button href="/pricing" variant="secondary">
              {dict.nav.pricing}
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
