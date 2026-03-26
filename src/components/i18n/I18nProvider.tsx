"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { Dictionary } from "@/lib/i18n/types";
import type { Locale } from "@/lib/i18n/types";

type Value = { locale: Locale; dict: Dictionary };

const I18nContext = createContext<Value | null>(null);

export function I18nProvider({
  children,
  locale,
  dict,
}: {
  children: ReactNode;
  locale: Locale;
  dict: Dictionary;
}) {
  return (
    <I18nContext.Provider value={{ locale, dict }}>{children}</I18nContext.Provider>
  );
}

export function useI18n(): Value {
  const v = useContext(I18nContext);
  if (!v) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return v;
}
