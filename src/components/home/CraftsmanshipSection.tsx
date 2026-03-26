import { getDictionary } from "@/lib/i18n/server";

type Props = {
  /** Compact block for gallery; full section for homepage */
  variant?: "full" | "compact";
};

export async function CraftsmanshipSection({ variant = "full" }: Props) {
  const dict = await getDictionary();
  const s = dict.homeCraftsmanship;

  if (variant === "compact") {
    return (
      <div className="mt-10 rounded-2xl border border-border/80 bg-gradient-to-br from-[#fdf8f6] to-card/90 px-5 py-6 shadow-sm sm:px-7 sm:py-7">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-dark">{s.eyebrow}</p>
        <h2 className="mt-2 font-display text-xl font-semibold text-foreground sm:text-2xl">{s.title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">{s.introShort}</p>
        <p className="mt-4 text-xs leading-relaxed text-muted sm:text-sm">{s.teamNote}</p>
      </div>
    );
  }

  return (
    <section className="border-b border-border/60 bg-gradient-to-b from-[#fdf8f6]/90 to-background py-14 sm:py-18">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-dark">{s.eyebrow}</p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-foreground sm:text-4xl">{s.title}</h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">{s.intro}</p>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">{s.detail}</p>
        <ul className="mt-8 max-w-2xl list-disc space-y-3 pl-5 text-sm leading-relaxed text-muted sm:text-base">
          {s.bullets.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="mt-8 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">{s.teamNote}</p>
      </div>
    </section>
  );
}
