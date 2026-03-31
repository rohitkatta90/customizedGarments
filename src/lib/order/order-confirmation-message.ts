import { formatIsoDateForWhatsApp } from "@/lib/order/message-formatting";

/**
 * Business → customer message after payment (UPI) or COD confirmation.
 * Use from admin / Sheets WhatsApp link — not prefilled on the initial catalog submit.
 */
export function buildOrderConfirmationWhatsAppMessage(input: {
  orderId: string;
  itemsCount: number;
  deliveryByIso: string;
  totalInr: number;
  trackingUrl: string;
}): string {
  const date = formatIsoDateForWhatsApp(input.deliveryByIso);
  const lines = [
    "Perfect 😊 Your order is confirmed!",
    "",
    `🧾 Order ID: ${input.orderId}`,
    `📦 Items: ${input.itemsCount}`,
    `📅 Delivery by: ${date}`,
    `💰 Total: ₹${input.totalInr}`,
    "",
    "You can track your order here:",
    input.trackingUrl.trim(),
    "",
    "We'll keep you updated ✨",
  ];
  return lines.join("\n");
}
