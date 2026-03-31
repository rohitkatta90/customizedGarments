import type { Metadata } from "next";

import { getDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return {
    title: dict.terms.pageTitle,
    description: dict.terms.metaDescription,
  };
}

export default async function TermsPage() {
  const dict = await getDictionary();
  const t = dict.terms;

  return (
    <div className="py-10 sm:py-14">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-dark">
          {dict.gallery.eyebrow}
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-foreground sm:text-5xl">
          {t.pageTitle}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">{t.lead}</p>

        <div className="mt-12 space-y-12 border-t border-border pt-12">
          {t.sections.map((section, i) => (
            <section key={i}>
              <h2 className="font-display text-xl font-semibold text-foreground sm:text-2xl">
                {section.heading}
              </h2>
              {section.paragraphs.map((p, j) => (
                <p
                  key={j}
                  className="mt-4 text-sm leading-relaxed text-muted sm:text-base"
                >
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
