import type { Review } from "@/lib/types";
import { getDictionary } from "@/lib/i18n/server";

import { StarRating } from "@/components/ui/StarRating";

type Props = {
  reviews: Review[];
};

export async function ReviewsSection({ reviews }: Props) {
  const dict = await getDictionary();
  const sorted = [...reviews].sort((a, b) => {
    if (a.featured === b.featured) return 0;
    return a.featured ? -1 : 1;
  });

  return (
    <section id="reviews" className="scroll-mt-24 py-14 sm:py-18">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">
          {dict.reviews.title}
        </h2>
        <p className="mt-2 max-w-2xl text-muted">{dict.reviews.subtitle}</p>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {sorted.map((r) => (
            <li
              key={r.id}
              className={`rounded-2xl border p-5 ${
                r.featured
                  ? "border-accent/40 bg-gradient-to-br from-[#fff9f8] to-card shadow-sm"
                  : "border-border bg-card"
              }`}
            >
              {r.featured ? (
                <p className="text-xs font-semibold uppercase tracking-wider text-accent-dark">
                  {dict.reviews.topBadge}
                </p>
              ) : null}
              <div className="mt-2 flex items-center gap-2">
                <StarRating rating={r.rating} ariaLabelTemplate={dict.ratingAria} />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-foreground">{r.comment}</p>
              <p className="mt-4 text-sm font-semibold text-foreground">— {r.name}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
