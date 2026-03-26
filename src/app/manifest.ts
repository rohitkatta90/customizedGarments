import type { MetadataRoute } from "next";

import { dictionaries } from "@/lib/i18n/dictionaries";
import { siteConfig } from "@/lib/site";

const en = dictionaries.en;

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: siteConfig.name,
    description: en.meta.description,
    start_url: "/",
    display: "standalone",
    background_color: "#faf6f3",
    theme_color: "#c98b8d",
  };
}
