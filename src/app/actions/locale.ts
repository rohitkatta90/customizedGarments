"use server";

import { cookies } from "next/headers";

import { LOCALE_COOKIE } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/types";

export async function setLocale(locale: Locale) {
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
