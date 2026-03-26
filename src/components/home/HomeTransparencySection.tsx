import Link from "next/link";

import { getDictionary } from "@/lib/i18n/server";
import { siteConfig } from "@/lib/site";

export async function HomeTransparencySection() {
  const dict = await getDictionary();
  const s = dict.homeTransparency;

  return (
    <section className="border-b border-border/60 bg-white py-14 sm:py-18">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">{s.title}</h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">{s.intro}</p>
        <ul className="mt-8 list-disc space-y-3 pl-5 text-sm leading-relaxed text-muted sm:text-base">
          {s.bullets.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        {siteConfig.showPublicPricing ? (
          <p className="mt-8">
            <Link
              href="/pricing"
              className="text-sm font-semibold text-accent-dark underline-offset-4 hover:underline"
            >
              {s.linkText}
            </Link>
          </p>
        ) : null}
      </div>
    </section>
  );
}
