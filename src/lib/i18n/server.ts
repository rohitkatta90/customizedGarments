import { dictionaries } from "./dictionaries";
import type { Dictionary } from "./types";
import type { Locale } from "./types";

export async function getLocale(): Promise<Locale> {
  return "en";
}

export async function getDictionary(): Promise<Dictionary> {
  const locale = await getLocale();
  return dictionaries[locale];
}
