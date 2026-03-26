import { getDictionary } from "@/lib/i18n/server";

export async function HomeHowItWorksSection() {
  const dict = await getDictionary();
  const s = dict.homeHowItWorks;

  return (
    <section className="border-b border-border/60 bg-gradient-to-br from-[#fdf8f6] to-background py-14 sm:py-18">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">{s.title}</h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">{s.intro}</p>
        <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {s.steps.map((step, i) => (
            <li
              key={step.title}
              className="relative rounded-2xl border border-border bg-card p-5 shadow-sm"
            >
              <span className="font-display text-3xl font-semibold text-accent/40">{i + 1}</span>
              <h3 className="mt-2 font-display text-lg font-semibold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
