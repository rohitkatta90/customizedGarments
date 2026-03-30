"use client";

import { useSearchParams } from "next/navigation";

import type { CatalogItem } from "@/lib/types";

import { QuickStitchRequestForm } from "./QuickStitchRequestForm";
import { ServiceRequestForm } from "./ServiceRequestForm";

type Props = {
  catalog: CatalogItem[];
  categoryLabel: string;
  pricingNotice: string;
};

export function RequestFlowShell({ catalog, categoryLabel, pricingNotice }: Props) {
  const searchParams = useSearchParams();
  const detailed =
    searchParams.get("full") === "1" || searchParams.get("mode") === "detailed";

  if (detailed) {
    return (
      <div className="min-w-0">
        <ServiceRequestForm
          catalog={catalog}
          categoryLabel={categoryLabel}
          pricingNotice={pricingNotice}
        />
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <QuickStitchRequestForm
        catalog={catalog}
        categoryLabel={categoryLabel}
        pricingNotice={pricingNotice}
      />
    </div>
  );
}
