function stripNonDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export const siteConfig = {
  name: process.env.NEXT_PUBLIC_BUSINESS_NAME ?? "Loom & Lace Atelier",
  /** E.164 digits only, no + (e.g. 9198xxxxxxxxx for India) */
  whatsappPhone: process.env.NEXT_PUBLIC_WHATSAPP_PHONE ?? "919876543210",
  /** Display / tel: link */
  designerPhone: process.env.NEXT_PUBLIC_DESIGNER_PHONE ?? "+91 98765 43210",
  /** Public site URL for OG / sitemap */
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  /** UPI placeholder shown to customers */
  upiId: process.env.NEXT_PUBLIC_UPI_ID ?? "yourname@paytm",
  /**
   * When false, Pricing is hidden from nav, footer, sitemap, and home/request CTAs.
   * `/pricing` remains reachable by direct URL (e.g. staff). Set env to `"true"` to show again.
   */
  showPublicPricing: process.env.NEXT_PUBLIC_SHOW_PRICING === "true",
} as const;

export function whatsappDigits(): string {
  return stripNonDigits(siteConfig.whatsappPhone);
}

export function telHref(phone: string): string {
  const n = stripNonDigits(phone);
  return n ? `tel:+${n}` : "tel:";
}
