import { getDictionary } from "@/lib/i18n/server";

export async function HomeEmotionalSection() {
  const dict = await getDictionary();
  const s = dict.homeEmotional;

  return (
    <section className="section-y border-b border-border/50 bg-card">
      <div className="page-container">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {s.title}
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">{s.intro}</p>
        <ul className="mt-12 grid gap-5 sm:grid-cols-3">
          {s.pillars.map((p) => (
            <li key={p.title} className="ds-card transition hover:border-accent/25">
              <h3 className="font-display text-lg font-semibold text-foreground">{p.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{p.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
