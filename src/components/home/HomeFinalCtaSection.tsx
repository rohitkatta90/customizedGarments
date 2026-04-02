import { TrustChips } from "@/components/home/TrustChips";
import { Button } from "@/components/ui/Button";
import { getDictionary } from "@/lib/i18n/server";
import { siteConfig } from "@/lib/site";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export async function HomeFinalCtaSection() {
  const dict = await getDictionary();
  const s = dict.homeFinalCta;
  const wa = buildWhatsAppUrl(dict.wa.hero.replace("{{name}}", siteConfig.name));

  return (
    <section className="section-y bg-gradient-to-b from-[#f5ebe6]/80 to-background">
      <div className="page-container max-w-3xl text-center">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {s.title}
        </h2>
        <p className="mt-4 text-lg text-muted">{s.body}</p>
        <ul className="mx-auto mt-8 max-w-md list-none space-y-3 text-left text-sm text-muted">
          {s.bullets.map((line) => (
            <li key={line} className="flex gap-3">
              <span className="text-accent-dark" aria-hidden>
                ✓
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
        <TrustChips className="mx-auto mt-8 justify-center" />
        <div className="mt-10 flex flex-col items-stretch justify-center gap-4 sm:flex-row sm:justify-center">
          <Button href={wa} external variant="primary" className="min-h-[52px] w-full sm:w-auto">
            {s.ctaPrimary}
          </Button>
          <Button href="/request" variant="secondary" className="min-h-[52px] w-full sm:w-auto">
            {s.ctaSecondary}
          </Button>
        </div>
      </div>
    </section>
  );
}
