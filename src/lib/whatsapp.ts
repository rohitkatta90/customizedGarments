import type { Locale } from "@/lib/i18n/types";

import { whatsappDigits } from "./site";

export function buildWhatsAppUrl(message: string): string {
  const phone = whatsappDigits();
  const text = encodeURIComponent(message.trim());
  return `https://wa.me/${phone}?text=${text}`;
}

export function stitchingRequestTemplate(
  params: {
    designLabel: string;
    deliveryDate: string;
    notes: string;
    referenceImageName?: string;
  },
  locale: Locale,
): string {
  const ref =
    params.referenceImageName && locale === "en"
      ? ` Reference image attached in chat: ${params.referenceImageName}.`
      : params.referenceImageName && locale === "hi"
        ? ` चैट में संलग्न रेफरेंस: ${params.referenceImageName}।`
        : "";
  if (locale === "hi") {
    return [
      "नमस्ते, मैं सिलाई का अनुरोध करना चाहती हूँ।",
      `डिज़ाइन / प्रेरणा: ${params.designLabel}।`,
      `पसंदीदा डिलीवरी तिथि: ${params.deliveryDate}।`,
      `नोट्स (कपड़ा, नाप, डेडलाइन): ${params.notes || "—"}।${ref}`,
      "",
      "ज़रूरत हो तो इस चैट में डिज़ाइन फोटो भेजूँगी।",
    ].join(" ");
  }
  return [
    "Hi, I want to request stitching.",
    `Design / inspiration: ${params.designLabel}.`,
    `Preferred delivery date: ${params.deliveryDate}.`,
    `Notes (fabric, measurements, deadline): ${params.notes || "—"}.${ref}`,
    "",
    "I'll share design images in this chat if needed.",
  ].join(" ");
}

export function alterationRequestTemplate(
  params: {
    alterationType: string;
    garmentImageName?: string;
    pickupOrDeliveryDate: string;
    notes: string;
  },
  locale: Locale,
): string {
  const img =
    params.garmentImageName && locale === "en"
      ? ` Garment photo filename: ${params.garmentImageName}.`
      : params.garmentImageName && locale === "hi"
        ? ` कपड़े की फोटो फाइल: ${params.garmentImageName}।`
        : "";
  if (locale === "hi") {
    return [
      "नमस्ते, मैं अल्टरेशन का अनुरोध करना चाहती हूँ।",
      `प्रकार: ${params.alterationType}।`,
      `पिकअप / डिलीवरी पसंदीदा तिथि: ${params.pickupOrDeliveryDate}।`,
      `नोट्स: ${params.notes || "—"}।${img}`,
    ].join(" ");
  }
  return [
    "Hi, I want to request an alteration.",
    `Type: ${params.alterationType}.`,
    `Pickup / delivery preference date: ${params.pickupOrDeliveryDate}.`,
    `Notes: ${params.notes || "—"}.${img}`,
  ].join(" ");
}

export function catalogInquiryTemplate(
  params: {
    itemTitle: string;
    itemId: string;
  },
  locale: Locale,
): string {
  if (locale === "hi") {
    return `नमस्ते, मैं यह डिज़ाइन सिलवाना चाहती हूँ: "${params.itemTitle}" (ID: ${params.itemId})। कृपया अगले कदम और समय बताएँ।`;
  }
  return `Hi, I'd like to get this design stitched: "${params.itemTitle}" (ID: ${params.itemId}). Please share next steps and timeline.`;
}

export function bookAppointmentTemplate(
  params: {
    preferredDate: string;
    timeWindow: string;
    notes: string;
  },
  locale: Locale,
): string {
  if (locale === "hi") {
    return [
      "नमस्ते, मैं डिज़ाइनर से अपॉइंटमेंट बुक करना चाहती हूँ।",
      `पसंदीदा तिथि: ${params.preferredDate}।`,
      `समय स्लॉट: ${params.timeWindow}।`,
      `नोट्स: ${params.notes || "—"}।`,
    ].join(" ");
  }
  return [
    "Hi, I'd like to book an appointment with the designer.",
    `Preferred date: ${params.preferredDate}.`,
    `Time window: ${params.timeWindow}.`,
    `Notes: ${params.notes || "—"}.`,
  ].join(" ");
}
