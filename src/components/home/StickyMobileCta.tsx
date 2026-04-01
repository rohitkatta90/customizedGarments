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
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border/80 bg-[#f7f3f0]/96 px-3 py-2 shadow-[0_-6px_28px_-4px_rgba(43,43,43,0.14)] backdrop-blur-md md:hidden"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      <div className="page-container flex max-w-[1200px] gap-2.5">
        <Button
          href={wa}
          external
          variant="primary"
          className="min-h-[2.75rem] flex-1 rounded-xl text-sm font-semibold shadow-[0_2px_10px_-2px_rgba(196,138,138,0.45)]"
        >
          {dict.stickyCta.whatsapp}
        </Button>
        <Button
          href={tel}
          variant="secondary"
          className="min-h-[2.75rem] shrink-0 rounded-xl px-4 text-sm font-semibold"
        >
          {dict.stickyCta.call}
        </Button>
      </div>
    </div>
  );
}
