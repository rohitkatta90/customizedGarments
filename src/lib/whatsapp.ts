import { siteConfig, whatsappDigits } from "./site";

export { buildOrderConfirmationWhatsAppMessage } from "@/lib/order/order-confirmation-message";

/**
 * Opens WhatsApp with a prefilled message. `encodeURIComponent` uses UTF-8; current
 * WhatsApp clients generally render emoji in `text=` correctly (same as in-message).
 */
export function buildWhatsAppUrl(message: string): string {
  const phone = whatsappDigits();
  const text = encodeURIComponent(message.trim().normalize("NFC"));
  return `https://api.whatsapp.com/send?phone=${phone}&text=${text}`;
}

export function stitchingRequestTemplate(params: {
  designLabel: string;
  deliveryDate: string;
  notes: string;
  referenceImageName?: string;
}): string {
  const ref = params.referenceImageName
    ? ` Reference image attached in chat: ${params.referenceImageName}.`
    : "";
  return [
    "Hi, I want to request stitching.",
    `Design / inspiration: ${params.designLabel}.`,
    `Preferred delivery date: ${params.deliveryDate}.`,
    `Notes (fabric, measurements, deadline): ${params.notes || "—"}.${ref}`,
    "",
    "I'll share design images in this chat if needed.",
  ].join(" ");
}

export function alterationRequestTemplate(params: {
  alterationType: string;
  garmentImageName?: string;
  pickupOrDeliveryDate: string;
  notes: string;
}): string {
  const img = params.garmentImageName
    ? ` Garment photo filename: ${params.garmentImageName}.`
    : "";
  return [
    "Hi, I want to request an alteration.",
    `Type: ${params.alterationType}.`,
    `Pickup / delivery preference date: ${params.pickupOrDeliveryDate}.`,
    `Notes: ${params.notes || "—"}.${img}`,
  ].join(" ");
}

export function catalogInquiryTemplate(params: { itemTitle: string; itemId: string }): string {
  return `Hi, I'd like ${siteConfig.name} to stitch: "${params.itemTitle}" (catalog ID: ${params.itemId}). Please share next steps and timeline.`;
}

export function bookAppointmentTemplate(params: {
  preferredDate: string;
  timeWindow: string;
  notes: string;
}): string {
  return [
    "Hi, I'd like to book an appointment with the designer.",
    `Preferred date: ${params.preferredDate}.`,
    `Time window: ${params.timeWindow}.`,
    `Notes: ${params.notes || "—"}.`,
  ].join(" ");
}
