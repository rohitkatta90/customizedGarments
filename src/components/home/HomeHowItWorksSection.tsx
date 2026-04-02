import { getDictionary } from "@/lib/i18n/server";

function IconShare() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconStitch() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14.5 4.5l-10 10M18 8l-6 6M4 20l4-4M12 4l8 8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="8" cy="8" r="1.2" fill="currentColor" />
    </svg>
  );
}

function IconDelivery() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 7h11v10H3V7zm11 5h3l3 3v2h-3M7 18.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm10 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const STEP_ICONS = [IconShare, IconCheck, IconStitch, IconDelivery];

export async function HomeHowItWorksSection() {
  const dict = await getDictionary();
  const s = dict.homeHowItWorks;

  return (
    <section className="section-y border-b border-border/50 bg-card">
      <div className="page-container">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {s.title}
        </h2>
        <p className="mt-3 max-w-2xl text-base text-muted sm:text-lg">{s.intro}</p>

        {/* Mobile / tablet: horizontal scroll stepper */}
        <ol className="mt-12 flex snap-x snap-mandatory items-stretch gap-3 overflow-x-auto pb-3 [-ms-overflow-style:none] [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden">
          {s.steps.map((step, i) => {
            const Icon = STEP_ICONS[i] ?? IconShare;
            const isLast = i === s.steps.length - 1;
            return (
              <li key={step.title} className="flex shrink-0 snap-center items-center gap-3">
                <div className="ds-card flex w-[min(78vw,260px)] flex-col items-center text-center sm:w-[240px]">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/25 bg-[#fdf8f6] text-accent-dark">
                    <Icon />
                  </div>
                  <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                    Step {i + 1}
                  </p>
                  <h3 className="mt-2 font-display text-lg font-semibold leading-snug text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{step.body}</p>
                </div>
                {!isLast ? (
                  <span className="shrink-0 text-lg font-light text-accent/45" aria-hidden>
                    →
                  </span>
                ) : null}
              </li>
            );
          })}
        </ol>

        {/* Desktop: horizontal row with dividers */}
        <ol className="mt-12 hidden grid-cols-4 gap-6 lg:grid">
          {s.steps.map((step, i) => {
            const Icon = STEP_ICONS[i] ?? IconShare;
            const isLast = i === s.steps.length - 1;
            return (
              <li
                key={`${step.title}-lg`}
                className={`relative flex flex-col items-center text-center ${!isLast ? "lg:border-r lg:border-accent/20 lg:pr-6" : ""}`}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/25 bg-[#fdf8f6] text-accent-dark">
                  <Icon />
                </div>
                <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                  Step {i + 1}
                </p>
                <h3 className="mt-2 font-display text-lg font-semibold leading-snug text-foreground">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{step.body}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
