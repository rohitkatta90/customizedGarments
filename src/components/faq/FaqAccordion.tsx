"use client";

import { useState } from "react";

import { useI18n } from "@/components/i18n/I18nProvider";

export function FaqAccordion() {
  const { dict } = useI18n();
  const items = dict.faq.items;
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  return (
    <div className="divide-y divide-border rounded-2xl border border-border bg-card">
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div key={item.id}>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-foreground sm:px-6 sm:text-base"
              onClick={() => setOpenId(isOpen ? null : item.id)}
              aria-expanded={isOpen}
            >
              {item.q}
              <span className="text-accent" aria-hidden>
                {isOpen ? "−" : "+"}
              </span>
            </button>
            {isOpen ? (
              <div className="px-5 pb-5 text-sm leading-relaxed text-muted sm:px-6">
                {item.a}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
