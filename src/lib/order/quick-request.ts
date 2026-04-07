import { todayLocalISODate } from "@/lib/date-today";
import { quickFlowCopy } from "@/lib/request-copy";
import type { CatalogItem } from "@/lib/types";

import { createAlterationItem, createStitchingItem } from "./factory";
import { formatIsoDateForWhatsApp, formatRequestIdForWhatsApp } from "./message-formatting";
import type { Order, OrderItem } from "./types";

export type QuickServiceType = "stitching" | "alteration";
export type QuickItemCount = "1" | "2" | "3plus";
export type QuickMomAndMePreference = "same" | "variation";
export type QuickMomAndMeChildKind = "age" | "size";

export type QuickMomAndMeData = {
  childKind: QuickMomAndMeChildKind;
  /** Whole years when childKind is "age". */
  ageYears?: number;
  /** Free text when childKind is "size". */
  sizeText?: string;
  preference: QuickMomAndMePreference;
};

const QUICK_CUSTOMER_NAME = "Quick request (website)";
/** Placeholder until staff captures the real number from WhatsApp. */
export const QUICK_REQUEST_PLACEHOLDER_PHONE = "0000000000";

export function itemCountLabelForWhatsApp(count: QuickItemCount, exactPieceCount?: number): string {
  if (count === "3plus") {
    if (
      typeof exactPieceCount === "number" &&
      Number.isFinite(exactPieceCount) &&
      exactPieceCount >= 3
    ) {
      return String(Math.floor(exactPieceCount));
    }
    return "3+";
  }
  return count;
}

export function buildQuickOrderLineItems(input: {
  serviceType: QuickServiceType;
  itemCount: QuickItemCount;
  preferredDeliveryDate: string;
  notes: string;
  catalogId?: string;
  /** When itemCount is "3plus", exact count (≥3) for order notes. */
  exactPieceCount?: number;
  priorityRequested?: boolean;
  priorityImplied?: boolean;
  /** Girls' quick wear: whole years, 5–12 — echoed in line-item notes for staff. */
  childAgeYears?: number;
  /** Adult stitching: optional matching mother + daughter outfits. */
  momAndMe?: QuickMomAndMeData;
}): OrderItem[] {
  const pieces = `Pieces (quick request): ${itemCountLabelForWhatsApp(input.itemCount, input.exactPieceCount)}`;
  const userNotes = input.notes.trim();
  let combinedNotes = userNotes ? `${pieces}\n${userNotes}` : pieces;
  if (
    typeof input.childAgeYears === "number" &&
    Number.isInteger(input.childAgeYears) &&
    input.childAgeYears >= 5 &&
    input.childAgeYears <= 12
  ) {
    combinedNotes += `\nChild age (years): ${input.childAgeYears}`;
  }
  if (input.priorityRequested) {
    combinedNotes += "\n[Priority] Customer asked about expedited / priority stitching — confirm availability and fees in WhatsApp.";
  } else if (input.priorityImplied) {
    combinedNotes +=
      "\n[Priority] Preferred date is before typical standard lead — customer may need a quicker timeline; confirm in WhatsApp.";
  }

  if (input.momAndMe && input.serviceType === "stitching") {
    const prefLabel =
      input.momAndMe.preference === "same" ? "Same design" : "Slight variation";
    const childNote =
      input.momAndMe.childKind === "age" && typeof input.momAndMe.ageYears === "number"
        ? `Child age (years): ${input.momAndMe.ageYears}`
        : input.momAndMe.childKind === "size" && input.momAndMe.sizeText?.trim()
          ? `Child size: ${input.momAndMe.sizeText.trim()}`
          : "";
    if (childNote) {
      combinedNotes += `\n[Mom & Me] Matching outfits for mother + daughter.\n${childNote}\nStyle preference: ${prefLabel}`;
    }
  }

  if (input.serviceType === "alteration") {
    const item = createAlterationItem();
    item.alterationType = "other";
    item.notes = combinedNotes;
    item.deliveryPreference = input.preferredDeliveryDate;
    return [item];
  }

  const cid = input.catalogId?.trim();
  const stitching = createStitchingItem(
    cid ? { designSource: "catalog", catalogId: cid } : { designSource: "describe" },
  );
  stitching.notes = combinedNotes;
  stitching.deliveryPreference = input.preferredDeliveryDate;
  if (!cid) {
    stitching.describeText = "Details and reference photo to follow in WhatsApp.";
  }
  return [stitching];
}

/** Notes still carry the kids chip for older clients / pasted text. */
function notesIndicateKidsGirlsWear(notes: string): boolean {
  const n = notes.toLowerCase();
  return (
    n.includes(quickFlowCopy.kidsNoteChip.toLowerCase()) ||
    n.includes(quickFlowCopy.kidsNoteChipLegacy.toLowerCase())
  );
}

/**
 * True for girls' kids-wear quick stitching when explicitly flagged or when legacy note chips are present.
 */
export function isQuickKidsWearRequest(
  serviceType: QuickServiceType,
  notes: string,
  kidsWear?: boolean,
): boolean {
  if (serviceType !== "stitching") return false;
  if (kidsWear === true) return true;
  return notesIndicateKidsGirlsWear(notes);
}

/** @deprecated Prefer `isQuickKidsWearRequest` with explicit `kidsWear` when available. */
export function isKidsGirlsStitchQuickRequest(serviceType: QuickServiceType, notes: string): boolean {
  return isQuickKidsWearRequest(serviceType, notes, false);
}

export function buildQuickStitchWhatsAppMessage(input: {
  order: Order;
  catalog: CatalogItem[];
  serviceType: QuickServiceType;
  itemCount: QuickItemCount;
  preferredDeliveryDate: string;
  notes: string;
  catalogId?: string;
  /** Plain-text block appended after the main request (e.g. saved measurements). */
  measurementAppend?: string;
  exactPieceCount?: number;
  priorityRequested?: boolean;
  priorityImplied?: boolean;
  /** Confirmed child age for girls' wear quick path (5–12). */
  childAgeYears?: number;
  /** Set when the customer chose the kids wear card (no note chip required). */
  kidsWear?: boolean;
  /** Adult stitching: Mom & Me matching set. */
  momAndMe?: QuickMomAndMeData;
}): string {
  const cat = input.catalogId?.trim()
    ? input.catalog.find((c) => c.id === input.catalogId!.trim())
    : undefined;

  const reqId = formatRequestIdForWhatsApp(input.order.id);
  const dateLabel = formatIsoDateForWhatsApp(input.preferredDeliveryDate);
  const serviceLabel = input.serviceType === "stitching" ? "Stitching" : "Alteration";
  const kidsGirls = isQuickKidsWearRequest(input.serviceType, input.notes, input.kidsWear);

  const intentLine = kidsGirls
    ? "I'd like stitching for a little girl — party or festive girls' wear (not adult women's sizing)."
    : input.serviceType === "stitching"
      ? "I'd like to get an outfit stitched."
      : "I'd like to get an outfit altered.";

  const lines: string[] = ["Hi RC 😊", "", intentLine];

  if (
    kidsGirls &&
    typeof input.childAgeYears === "number" &&
    Number.isInteger(input.childAgeYears) &&
    input.childAgeYears >= 5 &&
    input.childAgeYears <= 12
  ) {
    lines.push("", `Child's age (as entered): ${input.childAgeYears} years.`);
  }

  if (!kidsGirls && input.serviceType === "stitching" && input.momAndMe) {
    const m = input.momAndMe;
    const daughterLine =
      m.childKind === "age" && typeof m.ageYears === "number"
        ? `For me + my daughter (age: ${m.ageYears})`
        : m.childKind === "size" && m.sizeText?.trim()
          ? `For me + my daughter (size: ${m.sizeText.trim()})`
          : "";
    if (daughterLine) {
      const pref = m.preference === "same" ? "Same design" : "Slight variation";
      lines.push("", "💖 This is a Mom & Me request", daughterLine, "", `Style preference: ${pref}`);
    }
  }

  lines.push(
    "",
    `Request ID: ${reqId}`,
    "",
    `Service: ${serviceLabel}`,
    `Items: ${itemCountLabelForWhatsApp(input.itemCount, input.exactPieceCount)}`,
    `Preferred delivery date: ${dateLabel}`,
    `Notes: ${input.notes.trim() || "—"}`,
  );

  if (cat) {
    lines.push("", `Design: "${cat.title}"`);
  }

  lines.push("", "I'll share the reference image in this chat next.");

  if (input.priorityRequested || input.priorityImplied) {
    lines.push(
      "",
      "[Priority] I may need this on priority — please let me know if that's possible.",
    );
  }

  if (input.measurementAppend?.trim()) {
    lines.push("", input.measurementAppend.trim());
  }

  return lines.join("\n");
}

export function quickRequestCustomerForApi(): {
  customerName: string;
  customerPhone: string;
  requestedDeliveryDate: string;
} {
  return {
    customerName: QUICK_CUSTOMER_NAME,
    customerPhone: QUICK_REQUEST_PLACEHOLDER_PHONE,
    requestedDeliveryDate: todayLocalISODate(),
  };
}
