import type { Metadata } from "next";

import { FaqAccordion } from "@/components/faq/FaqAccordion";
import { getDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return {
    title: dict.faq.pageTitle,
    description:
      "Frequently asked questions about Radha Creations — custom stitching, alterations, payments, and delivery.",
  };
}

export default async function FaqPage() {
  const dict = await getDictionary();

  return (
    <div className="py-10 sm:py-14">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h1 className="font-display text-4xl font-semibold text-foreground sm:text-5xl">
          {dict.faq.pageTitle}
        </h1>
        <p className="mt-3 text-muted">{dict.faq.pageIntro}</p>
        <div className="mt-10">
          <FaqAccordion />
        </div>
      </div>
    </div>
  );
}
