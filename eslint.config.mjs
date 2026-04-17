import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  /**
   * Catalog / hero images use remote URLs from JSON; SiteHeader uses a static public path.
   * Switching everything to next/image is tracked separately — suppress noisy rule here.
   */
  {
    files: [
      "src/components/catalog/CatalogCard.tsx",
      "src/components/catalog/GalleryClient.tsx",
      "src/components/home/HeroCarousel.tsx",
      "src/components/home/HomeGalleryPreviewSection.tsx",
      "src/components/layout/SiteHeader.tsx",
    ],
    rules: {
      "@next/next/no-img-element": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
