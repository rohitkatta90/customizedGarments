"use client";

import { useCallback, useEffect, useState } from "react";

import type { CatalogItem } from "@/lib/types";

type Props = {
  items: CatalogItem[];
  fallbackSrc: string;
  fallbackAlt: string;
};

export function HeroCarousel({ items, fallbackSrc, fallbackAlt }: Props) {
  const slides: { src: string; alt: string }[] =
    items.length > 0
      ? items.map((i) => ({ src: i.image.src, alt: i.image.alt }))
      : [{ src: fallbackSrc, alt: fallbackAlt }];

  const [index, setIndex] = useState(0);
  const len = slides.length;

  const go = useCallback(
    (next: number) => {
      setIndex(((next % len) + len) % len);
    },
    [len],
  );

  useEffect(() => {
    if (len <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % len);
    }, 4000);
    return () => window.clearInterval(id);
  }, [len]);

  const current = slides[index]!;

  return (
    <div className="relative w-full">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-border bg-card shadow-[0_16px_48px_-12px_rgba(43,43,43,0.18)]">
        {slides.map((slide, i) => (
          <img
            key={`${slide.src}-${i}`}
            src={slide.src}
            alt={slide.alt}
            width={800}
            height={1000}
            loading={i === 0 ? "eager" : "lazy"}
            decoding="async"
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
              i === index ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          />
        ))}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
      </div>

      {len > 1 ? (
        <div className="mt-4 flex items-center justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i)}
              className={`h-2 rounded-full transition-all ${
                i === index ? "w-8 bg-accent" : "w-2 bg-border hover:bg-muted"
              }`}
              aria-label={`Slide ${i + 1}`}
              aria-current={i === index}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
