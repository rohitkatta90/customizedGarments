"use client";

import Link from "next/link";

import { useI18n } from "@/components/i18n/I18nProvider";
import { formatBrandText, siteConfig, telHref } from "@/lib/site";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export function SiteFooter() {
  const { dict } = useI18n();
  const wa = buildWhatsAppUrl(
    dict.wa.footer.replace("{{name}}", siteConfig.name),
  );

  return (
    <footer className="mt-auto border-t border-border bg-card/80">
      <div className="page-container grid gap-10 py-12 lg:grid-cols-3">
        <div>
          <p className="font-display text-2xl font-semibold text-foreground">
            {siteConfig.name}
          </p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
            {formatBrandText(dict.site.description)}
          </p>
          <p className="mt-3 text-xs text-muted">{dict.site.businessHours}</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{dict.footer.quickLinks}</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>
              <Link href="/gallery" className="hover:text-accent-dark">
                {dict.footer.linkGallery}
              </Link>
            </li>
            <li>
              <Link href="/request" className="hover:text-accent-dark">
                {dict.footer.linkRequest}
              </Link>
            </li>
            {siteConfig.showPublicPricing ? (
              <li>
                <Link href="/pricing" className="hover:text-accent-dark">
                  {dict.footer.linkPricing}
                </Link>
              </li>
            ) : null}
            <li>
              <Link href="/book" className="hover:text-accent-dark">
                {dict.footer.linkBook}
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-accent-dark">
                {dict.footer.linkTerms}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{dict.footer.contact}</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>
              <a
                href={wa}
                className="hover:text-accent-dark"
                target="_blank"
                rel="noopener noreferrer"
              >
                {dict.footer.waChat}
              </a>
            </li>
            <li>
              <a href={telHref(siteConfig.designerPhone)} className="hover:text-accent-dark">
                {dict.footer.callPrefix} {siteConfig.designerPhone}
              </a>
            </li>
          </ul>
          <p className="mt-4 text-xs leading-relaxed text-muted">{dict.footer.note}</p>
        </div>
      </div>
      <div className="border-t border-border/80 py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} {siteConfig.name}. {dict.footer.crafted}
      </div>
    </footer>
  );
}
