import Link from "next/link";

import { getDictionary } from "@/lib/i18n/server";
import { siteConfig } from "@/lib/site";

export async function HomeTransparencySection() {
  const dict = await getDictionary();
  const s = dict.homeTransparency;

  return (
    <section className="section-y border-b border-border/50 bg-background">
      <div className="page-container">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {s.title}
        </h2>
        <p className="mt-3 max-w-2xl text-base text-muted sm:text-lg">{s.intro}</p>
        <ul className="mt-10 max-w-2xl space-y-4 text-sm leading-relaxed text-muted sm:text-base">
          {s.bullets.map((line) => (
            <li key={line} className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
              <span>{line}</span>
            </li>
          ))}
        </ul>
        {siteConfig.showPublicPricing ? (
          <p className="mt-10">
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
