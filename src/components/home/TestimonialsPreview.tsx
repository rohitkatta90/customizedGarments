import Link from "next/link";

import type { Review } from "@/lib/types";
import { getDictionary } from "@/lib/i18n/server";

import { ReviewComment } from "@/components/home/ReviewComment";
import { StarRating } from "@/components/ui/StarRating";

type Props = {
  reviews: Review[];
};

export async function TestimonialsPreview({ reviews }: Props) {
  const dict = await getDictionary();
  const top = reviews.filter((r) => r.featured).slice(0, 3);
  const list = top.length ? top : reviews.slice(0, 3);

  return (
    <section className="border-b border-border/50 bg-background py-20 md:py-24 lg:py-[100px]">
      <div className="page-container">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {dict.testimonials.title}
            </h2>
            <p className="mt-2 max-w-xl text-muted">{dict.testimonials.subtitle}</p>
          </div>
          <Link
            href="/#reviews"
            className="mt-2 text-sm font-semibold text-accent-dark underline-offset-4 hover:underline sm:mt-0"
          >
            {dict.testimonials.seeAll}
          </Link>
        </div>

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((r) => (
            <li key={r.id} className="ds-card flex flex-col transition hover:shadow-[0_8px_32px_-8px_rgba(43,43,43,0.12)]">
              <StarRating rating={r.rating} ariaLabelTemplate={dict.ratingAria} />
              <p className="mt-3 flex-1 text-sm leading-relaxed text-foreground">
                &ldquo;
                <ReviewComment text={r.comment} />
                &rdquo;
              </p>
              <p className="mt-4 text-sm font-semibold text-foreground">{r.name}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
