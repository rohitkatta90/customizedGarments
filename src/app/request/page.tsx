import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { DeliveryEstimator } from "@/components/forms/DeliveryEstimator";
import { ServiceRequestForm } from "@/components/order/ServiceRequestForm";
import { getCatalog } from "@/lib/data";
import { getDictionary } from "@/lib/i18n/server";
import { requestCopy } from "@/lib/request-copy";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: requestCopy.pageTitle,
  description:
    "Place a multi-item service request for stitching and alterations. Submit opens WhatsApp with your full order summary.",
};

function FormFallback() {
  return (
    <div className="mx-auto max-w-2xl animate-pulse rounded-3xl border border-border bg-card p-8">
      <div className="h-6 w-1/3 rounded bg-border" />
      <div className="mt-4 h-40 rounded-xl bg-border" />
    </div>
  );
}

export default async function RequestPage() {
  const catalog = await getCatalog();
  const dict = await getDictionary();

  return (
    <div className="py-10 sm:py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h1 className="font-display text-4xl font-semibold text-foreground sm:text-5xl">
          {requestCopy.pageTitle}
        </h1>
        <p className="mt-3 max-w-2xl text-muted">{requestCopy.pageIntro}</p>
        <p className="mt-2 text-sm text-muted">
          {siteConfig.showPublicPricing ? (
            <>
              <Link href="/pricing" className="font-medium text-accent hover:underline">
                {dict.nav.pricing}
              </Link>
              {" — "}
            </>
          ) : null}
          {dict.pricing.requestPageBanner}
        </p>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{dict.pricing.communication.requestPageLine}</p>

        <div className="mt-10 grid min-w-0 gap-10 lg:grid-cols-[1fr_320px] lg:items-start">
          <Suspense fallback={<FormFallback />}>
            <div className="min-w-0">
            <ServiceRequestForm
              catalog={catalog}
              categoryLabel={dict.styling.categoryLabel}
              pricingNotice={dict.styling.pricingNotice}
            />
            </div>
          </Suspense>
          <aside className="min-w-0 lg:sticky lg:top-24">
            <DeliveryEstimator />
          </aside>
        </div>
      </div>
    </div>
  );
}
