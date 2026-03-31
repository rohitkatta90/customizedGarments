import type { Metadata } from "next";

import { PricingPageContent } from "@/components/pricing/PricingPageContent";
import {
  getDynamicPricing,
  getEffortPricing,
  getPricing,
  getProfitMarginModel,
  getStaffPricingPolicy,
} from "@/lib/data";
import { getDictionary } from "@/lib/i18n/server";
import { formatBrandText } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return {
    title: dict.pricing.pageTitle,
    description: formatBrandText(dict.pricing.metaDescription),
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
