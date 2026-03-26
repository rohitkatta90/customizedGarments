import Link from "next/link";

import { Hero } from "@/components/home/Hero";
import { CraftsmanshipSection } from "@/components/home/CraftsmanshipSection";
import { HomeEmotionalSection } from "@/components/home/HomeEmotionalSection";
import { HomeFinalCtaSection } from "@/components/home/HomeFinalCtaSection";
import { HomeHowItWorksSection } from "@/components/home/HomeHowItWorksSection";
import { HomeServicesSection } from "@/components/home/HomeServicesSection";
import { HomeTransparencySection } from "@/components/home/HomeTransparencySection";
import { PaymentOptions } from "@/components/home/PaymentOptions";
import { ReviewsSection } from "@/components/home/ReviewsSection";
import { TestimonialsPreview } from "@/components/home/TestimonialsPreview";
import { Button } from "@/components/ui/Button";
import { getReviews } from "@/lib/data";
import { getDictionary } from "@/lib/i18n/server";
import { siteConfig, telHref } from "@/lib/site";

export default async function HomePage() {
  const reviews = await getReviews();
  const dict = await getDictionary();

  return (
    <>
      <Hero />
      <HomeEmotionalSection />
      <HomeServicesSection />
      <CraftsmanshipSection />
      <TestimonialsPreview reviews={reviews} />
      <HomeHowItWorksSection />
      <HomeTransparencySection />

      <section className="py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col gap-6 rounded-3xl border border-border bg-gradient-to-br from-white to-[#fdf8f6] p-8 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-10">
            <div>
              <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
                {dict.home.talkTitle}
              </h2>
              <p className="mt-2 max-w-md text-sm text-muted">{dict.home.talkBody}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button href={telHref(siteConfig.designerPhone)} variant="primary">
                {dict.home.callDesigner}
              </Button>
              <Button href="/book" variant="secondary">
                {dict.home.bookAppointment}
              </Button>
            </div>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
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
                className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:border-accent/30 hover:shadow-md"
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
      <ReviewsSection reviews={reviews} />
      <HomeFinalCtaSection />
    </>
  );
}
