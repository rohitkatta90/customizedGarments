import { cookies } from "next/headers";

import { dictionaries } from "./dictionaries";
import type { Dictionary } from "./types";
import type { Locale } from "./types";

/** Cookie set by `setLocale` server action (`src/app/actions/locale.ts`). */
export const LOCALE_COOKIE = "gs.locale";

function parseLocale(raw: string | undefined): Locale {
  if (raw === "en" || raw === "hi") return raw;
  return "en";
}

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  return parseLocale(store.get(LOCALE_COOKIE)?.value);
}

export async function getDictionary(): Promise<Dictionary> {
  const locale = await getLocale();
  const pack = dictionaries[locale as keyof typeof dictionaries];
  return pack ?? dictionaries.en;
}
