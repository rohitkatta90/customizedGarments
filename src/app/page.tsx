import Link from "next/link";

import { CraftsmanshipSection } from "@/components/home/CraftsmanshipSection";
import { Hero } from "@/components/home/Hero";
import { HomeEmotionalSection } from "@/components/home/HomeEmotionalSection";
import { HomeFinalCtaSection } from "@/components/home/HomeFinalCtaSection";
import { HomeGalleryPreviewSection } from "@/components/home/HomeGalleryPreviewSection";
import { HomeHowItWorksSection } from "@/components/home/HomeHowItWorksSection";
import { HomeQuickActionsSection } from "@/components/home/HomeQuickActionsSection";
import { HomeServicesSection } from "@/components/home/HomeServicesSection";
import { HomeTransparencySection } from "@/components/home/HomeTransparencySection";
import { PaymentOptions } from "@/components/home/PaymentOptions";
import { ReviewsSection } from "@/components/home/ReviewsSection";
import { StickyMobileCta } from "@/components/home/StickyMobileCta";
import { TestimonialsPreview } from "@/components/home/TestimonialsPreview";
import { Button } from "@/components/ui/Button";
import { getCatalog, getReviews } from "@/lib/data";
import { getDictionary } from "@/lib/i18n/server";
import { siteConfig, telHref } from "@/lib/site";
import type { CatalogItem, Review } from "@/lib/types";

function womenFirstCatalog(catalog: CatalogItem[]) {
  return [...catalog].sort((a, b) => {
    const ag = a.audience === "girls" ? 1 : 0;
    const bg = b.audience === "girls" ? 1 : 0;
    return ag - bg;
  });
}

export default async function HomePage() {
  const [reviews, catalog, dict] = await Promise.all([
    siteConfig.showClientReviews ? getReviews() : Promise.resolve([] as Review[]),
    getCatalog(),
    getDictionary(),
  ]);
  const previewItems = womenFirstCatalog(catalog).slice(0, 5);

  return (
    <>
      <div className="pb-[calc(3.75rem+env(safe-area-inset-bottom))] md:pb-0">
        <Hero previewItems={previewItems} />
        <HomeGalleryPreviewSection items={previewItems} />
        <HomeQuickActionsSection />
        <HomeEmotionalSection />
        <HomeServicesSection />
        <CraftsmanshipSection />
        {siteConfig.showClientReviews ? <TestimonialsPreview reviews={reviews} /> : null}
        <HomeHowItWorksSection />
        <HomeTransparencySection />

        <section className="section-y border-b border-border/50 bg-background">
          <div className="page-container">
            <div className="ds-card flex flex-col gap-6 bg-gradient-to-br from-card to-[#fdf8f6] p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
              <div>
                <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
                  {dict.home.talkTitle}
                </h2>
                <p className="mt-2 max-w-md text-sm text-muted">{dict.home.talkBody}</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button href={telHref(siteConfig.designerPhone)} variant="primary" className="min-h-12">
                  {dict.home.callDesigner}
                </Button>
                <Button href="/book" variant="secondary" className="min-h-12">
                  {dict.home.bookAppointment}
                </Button>
              </div>
            </div>

            <div className="mt-10 grid gap-5 sm:grid-cols-3">
              {[
                {
                  title: dict.home.cardGalleryTitle,
                  text: dict.home.cardGalleryText,
                  href: "/gallery",
                },
                {
                  title: dict.home.cardRequestTitle,
                  text: dict.home.cardRequestText,
                  href: "/request",
                },
                {
                  title: dict.home.cardBookTitle,
                  text: dict.home.cardBookText,
                  href: "/book",
                },
              ].map((c) => (
                <Link
                  key={c.href}
                  href={c.href}
                  className="group ds-card transition hover:border-accent/30 hover:shadow-[0_8px_32px_-8px_rgba(43,43,43,0.12)]"
                >
                  <h3 className="font-display text-xl font-semibold text-foreground group-hover:text-accent-dark">
                    {c.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{c.text}</p>
                  <span className="mt-4 inline-block text-sm font-semibold text-accent-dark">
                    {dict.home.open}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <PaymentOptions />
        {siteConfig.showClientReviews ? <ReviewsSection reviews={reviews} /> : null}
        <HomeFinalCtaSection />
      </div>
      <StickyMobileCta />
    </>
  );
}
