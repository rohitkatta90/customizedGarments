"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { setLocale } from "@/app/actions/locale";
import type { Locale } from "@/lib/i18n/types";

import { useI18n } from "./I18nProvider";

export function LanguageToggle() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { locale, dict } = useI18n();

  function select(next: Locale) {
    if (next === locale) return;
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  }

  return (
    <div
      className="relative z-10 flex min-h-9 min-w-[5.5rem] items-center justify-center gap-0.5 rounded-full border border-border/90 bg-card p-1 shadow-sm ring-1 ring-black/[0.04]"
      role="group"
      aria-label={dict.header.language}
    >
      <button
        type="button"
        onClick={() => select("en")}
        disabled={pending}
        className={`min-h-8 min-w-8 rounded-full px-2.5 py-1.5 text-xs font-semibold transition sm:min-w-9 ${
          locale === "en"
            ? "bg-accent text-white shadow-sm"
            : "text-muted hover:text-foreground"
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => select("hi")}
        disabled={pending}
        className={`min-h-8 min-w-8 rounded-full px-2.5 py-1.5 text-xs font-semibold transition sm:min-w-9 ${
          locale === "hi"
            ? "bg-accent text-white shadow-sm"
            : "text-muted hover:text-foreground"
        }`}
      >
        हि
      </button>
    </div>
  );
}
