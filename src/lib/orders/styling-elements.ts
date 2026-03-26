/**
 * "Additional Styling Elements" — extras beyond base stitching/alteration.
 * Never auto-billed; staff quotes and customer approves before work proceeds.
 */

export const STYLING_ELEMENTS_CATEGORY = "Additional Styling Elements";

/** Preset labels staff can pick from; custom lines are allowed. */
export const STYLING_ELEMENT_PRESETS = [
  { id: "lace_border", label: "Laces / borders" },
  { id: "tassel_latkan", label: "Tassels / latkans" },
  { id: "buttons_zipper", label: "Buttons / zippers" },
  { id: "padding_cups", label: "Padding / cups" },
  { id: "embroidery", label: "Embroidery" },
  { id: "dyeing_color", label: "Dyeing / colour matching" },
  { id: "extra_lining", label: "Extra lining or layers" },
] as const;

export type QuotedAccessoryLine = {
  id: string;
  label: string;
  /** Whole rupees; null = price to be confirmed */
  amountInr: number | null;
};

export const ACCESSORIES_QUOTE_STATUSES = [
  "none",
  "pending_customer",
  "approved",
  "declined",
] as const;

export type AccessoriesQuoteStatus = (typeof ACCESSORIES_QUOTE_STATUSES)[number];

export function isAccessoriesQuoteStatus(s: string): s is AccessoriesQuoteStatus {
  return (ACCESSORIES_QUOTE_STATUSES as readonly string[]).includes(s);
}

export function normalizeAccessoriesQuoteStatus(
  raw: string | undefined | null,
): AccessoriesQuoteStatus {
  if (raw && isAccessoriesQuoteStatus(raw)) return raw;
  return "none";
}

export function parseQuotedAccessoriesFromJson(input: unknown): QuotedAccessoryLine[] {
  if (!Array.isArray(input)) return [];
  const out: QuotedAccessoryLine[] = [];
  for (const row of input) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const id = typeof r.id === "string" && r.id.trim() ? r.id : `acc-${out.length}`;
    const label = typeof r.label === "string" ? r.label.trim() : "";
    if (!label) continue;
    const amount = r.amountInr;
    let amountInr: number | null = null;
    if (typeof amount === "number" && Number.isFinite(amount)) {
      amountInr = Math.max(0, Math.round(amount));
    } else if (amount === null || amount === undefined) {
      amountInr = null;
    }
    out.push({ id, label, amountInr });
  }
  return out;
}

export function buildAccessoriesConfirmationWhatsApp(params: {
  lines: QuotedAccessoryLine[];
  orderRefShort: string;
}): string {
  const lines = params.lines.filter((l) => l.label.trim());
  if (lines.length === 0) {
    return "";
  }

  const parts: string[] = [];
  parts.push("Additional styling elements (quote):");
  for (const line of lines) {
    const amt =
      line.amountInr != null && Number.isFinite(line.amountInr)
        ? ` (+₹${line.amountInr})`
        : " (amount TBD)";
    parts.push(`• ${line.label.trim()}${amt}`);
  }

  const withAmounts = lines.filter((l) => l.amountInr != null && Number.isFinite(l.amountInr));
  if (withAmounts.length > 0) {
    const total = withAmounts.reduce((s, l) => s + (l.amountInr as number), 0);
    parts.push("");
    parts.push(`Total extras: +₹${total}`);
  }

  parts.push("");
  parts.push(`Order ref: ${params.orderRefShort}`);
  parts.push("");
  parts.push("Shall we proceed with these add-ons?");
  return parts.join("\n");
}
