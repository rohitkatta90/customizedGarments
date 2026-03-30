import type { Review } from "@/lib/types";
import { getDictionary } from "@/lib/i18n/server";

import { ReviewComment } from "@/components/home/ReviewComment";
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
    <section id="reviews" className="scroll-mt-24 border-b border-border/50 bg-card py-20 md:py-24 lg:py-[100px]">
      <div className="page-container">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {dict.reviews.title}
        </h2>
        <p className="mt-2 text-lg font-semibold text-foreground">{dict.reviews.subtitle}</p>
        <p className="mt-3 max-w-2xl text-sm text-muted">{dict.reviews.detail}</p>

        <ul className="mt-12 grid gap-5 sm:grid-cols-2">
          {sorted.map((r) => (
            <li
              key={r.id}
              className={`ds-card ${
                r.featured
                  ? "border-accent/30 bg-gradient-to-br from-[#fff9f8] to-card"
                  : ""
              }`}
            >
              {r.featured ? (
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-dark">
                  {dict.reviews.topBadge}
                </p>
              ) : null}
              <div className={r.featured ? "mt-2" : ""}>
                <StarRating rating={r.rating} ariaLabelTemplate={dict.ratingAria} />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-foreground">
                <ReviewComment text={r.comment} />
              </p>
              <p className="mt-4 text-sm font-semibold text-foreground">— {r.name}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
