import { dictionaries } from "./dictionaries";
import type { Dictionary } from "./types";
import type { Locale } from "./types";

export const LOCALE_COOKIE = "gs_locale";

export async function getLocale(): Promise<Locale> {
  // English-only UI for now; restore cookie reading when multilingual returns.
  return "en";
}

export async function getDictionary(): Promise<Dictionary> {
  const locale = await getLocale();
  return dictionaries[locale];
}
