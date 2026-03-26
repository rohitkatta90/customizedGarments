/** Normalize for search / dedupe (digits only). */
export function normalizePhone(input: string): string {
  return input.replace(/\D/g, "");
}

export function isPhonePlausible(input: string): boolean {
  const n = normalizePhone(input);
  return n.length >= 10 && n.length <= 15;
}
