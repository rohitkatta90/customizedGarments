import type { Metadata } from "next";

import { PricingPageContent } from "@/components/pricing/PricingPageContent";
import {
  getDynamicPricing,
  getEffortPricing,
  getPricing,
  getProfitMarginModel,
  getStaffPricingPolicy,
} from "@/lib/data";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { getDictionary, getLocale } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = dictionaries[locale];
  return {
    title: dict.pricing.pageTitle,
    description: dict.pricing.metaDescription,
  };
}

export default async function PricingPage() {
  const [pricing, effort, dynamic, margin, staffPolicy, dict] = await Promise.all([
    getPricing(),
    getEffortPricing(),
    getDynamicPricing(),
    getProfitMarginModel(),
    getStaffPricingPolicy(),
    getDictionary(),
  ]);

  return (
    <PricingPageContent
      pricing={pricing}
      effort={effort}
      dynamic={dynamic}
      margin={margin}
      staffPolicy={staffPolicy}
      dict={dict}
    />
  );
}
