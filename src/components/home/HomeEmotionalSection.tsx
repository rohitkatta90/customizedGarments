import { getDictionary } from "@/lib/i18n/server";

export async function HomeEmotionalSection() {
  const dict = await getDictionary();
  const s = dict.homeEmotional;

  return (
    <section className="border-b border-border/60 bg-gradient-to-b from-background to-[#fdf8f6]/80 py-14 sm:py-18">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">{s.title}</h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">{s.intro}</p>
        <ul className="mt-10 grid gap-6 sm:grid-cols-3">
          {s.pillars.map((p) => (
            <li
              key={p.title}
              className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition hover:border-accent/25 hover:shadow-md"
            >
              <h3 className="font-display text-lg font-semibold text-foreground">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{p.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
