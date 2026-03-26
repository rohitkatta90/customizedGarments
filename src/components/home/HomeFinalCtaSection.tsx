import { Button } from "@/components/ui/Button";
import { getDictionary } from "@/lib/i18n/server";
import { siteConfig } from "@/lib/site";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export async function HomeFinalCtaSection() {
  const dict = await getDictionary();
  const s = dict.homeFinalCta;
  const wa = buildWhatsAppUrl(dict.wa.hero.replace("{{name}}", siteConfig.name));

  return (
    <section className="bg-gradient-to-br from-accent/10 via-[#fdf8f6] to-background py-14 sm:py-18">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">{s.title}</h2>
        <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">{s.body}</p>
        <ul className="mx-auto mt-8 max-w-md list-none space-y-2 text-left text-sm text-muted">
          {s.bullets.map((line) => (
            <li key={line} className="flex gap-2">
              <span className="text-accent-dark" aria-hidden>
                ✓
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button href={wa} external variant="primary" className="w-full sm:w-auto">
            {s.ctaPrimary}
          </Button>
          <Button href="/request" variant="secondary" className="w-full sm:w-auto">
            {s.ctaSecondary}
          </Button>
        </div>
      </div>
    </section>
  );
}
