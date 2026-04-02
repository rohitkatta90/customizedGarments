import { getDictionary } from "@/lib/i18n/server";

type Props = {
  /** Compact block for gallery; full section for homepage */
  variant?: "full" | "compact";
};

function IconPrecision() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 20l6-6m2-8l4 4m-2-2l4 4M8 8l4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconFit() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3c-2.5 3-4 6.5-4 10a8 8 0 1016 0c0-3.5-1.5-7-4-10z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconMasters() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 11c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM4 20v-1a4 4 0 014-4h4a4 4 0 014 4v1M16 7a3 3 0 100-6M20 10a2 2 0 100-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconWomenFirst() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 15c2.5 0 4.5-2 4.5-4.5S14.5 6 12 6 7.5 8 7.5 10.5 9.5 15 12 15z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M12 15v6M9 21h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const HIGHLIGHT_ICONS = [IconPrecision, IconFit, IconMasters, IconWomenFirst];

export async function CraftsmanshipSection({ variant = "full" }: Props) {
  const dict = await getDictionary();
  const s = dict.homeCraftsmanship;

  if (variant === "compact") {
    return (
      <div className="ds-card border-border/80 bg-gradient-to-br from-[#fdf8f6] to-card">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-dark">{s.eyebrow}</p>
        <h2 className="mt-2 font-display text-xl font-semibold text-foreground sm:text-2xl">{s.title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">{s.introShort}</p>
        <p className="mt-4 text-xs leading-relaxed text-muted sm:text-sm">{s.teamNote}</p>
      </div>
    );
  }

  return (
    <section className="section-y border-b border-border/50 bg-background">
      <div className="page-container">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-dark">{s.eyebrow}</p>
        <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {s.title}
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted sm:text-lg line-clamp-3">
          {s.intro}
        </p>

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {s.highlights.map((h, i) => {
            const Icon = HIGHLIGHT_ICONS[i] ?? IconPrecision;
            return (
              <li key={h.title} className="ds-card flex gap-4 text-left sm:flex-col sm:gap-0 sm:text-center">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-accent/25 bg-[#fdf8f6] text-accent-dark sm:mx-auto sm:h-14 sm:w-14">
                  <Icon />
                </div>
                <div className="min-w-0 sm:mt-5">
                  <h3 className="font-display text-lg font-semibold text-foreground">{h.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{h.body}</p>
                </div>
              </li>
            );
          })}
        </ul>

        <p className="mt-12 max-w-2xl text-sm leading-relaxed text-muted">{s.teamNote}</p>
      </div>
    </section>
  );
}
