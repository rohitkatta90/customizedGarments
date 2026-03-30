import { Button } from "@/components/ui/Button";
import { getDictionary } from "@/lib/i18n/server";
import { siteConfig, telHref } from "@/lib/site";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export async function StickyMobileCta() {
  const dict = await getDictionary();
  const wa = buildWhatsAppUrl(dict.wa.hero.replace("{{name}}", siteConfig.name));
  const tel = telHref(siteConfig.designerPhone);

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border/80 bg-[#f7f3f0]/95 px-4 py-3 shadow-[0_-8px_30px_rgba(43,43,43,0.08)] backdrop-blur-md md:hidden"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="page-container flex max-w-[1200px] gap-3">
        <Button href={wa} external variant="primary" className="min-h-12 flex-1 text-sm font-semibold">
          {dict.stickyCta.whatsapp}
        </Button>
        <Button href={tel} variant="secondary" className="min-h-12 shrink-0 px-4 text-sm font-semibold">
          {dict.stickyCta.call}
        </Button>
      </div>
    </div>
  );
}
