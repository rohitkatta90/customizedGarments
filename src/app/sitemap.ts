import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.siteUrl.replace(/\/$/, "");
  const paths = [
    "",
    "/gallery",
    "/request",
    ...(siteConfig.showPublicPricing ? ["/pricing"] : []),
    "/faq",
    "/book",
    "/terms",
  ];
  const now = new Date();

  return paths.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.8,
  }));
}
