import type { AlterationType } from "@/lib/types";

import type { ServiceRequestValidationMessages } from "@/lib/order/validate-service-request";

/**
 * English-only copy for the multi-item service request flow.
 * i18n can be wired here later without touching component structure.
 */
export const requestCopy = {
  pageTitle: "Service request",
  pageIntro:
    "Add one or more items (stitching and/or alteration). Each item can have its own design reference and optional delivery preference. Submit opens WhatsApp with a full summary — send photos there.",
  requiredSuffix: "*",
  requiredLegend: "Fields marked * are required.",
  customerSection: "Your details",
  customerName: "Full name",
  customerPhone: "Phone (WhatsApp)",
  customerHint:
    "We save your order to our system when configured, and send this summary on WhatsApp.",
  addItem: "Add another item",
  submit: "Submit order & open WhatsApp",
  reviewTitle: "Your order",
  emptyHint: "Add at least one item to continue.",
  itemLabel: (n: number) => `Item ${n}`,
  remove: "Remove",
  serviceType: "Service type",
  stitching: "Stitching",
  alteration: "Alteration",
  designSource: "Design reference",
  fromCatalog: "From catalog",
  uploadRef: "Upload reference (filename)",
  describe: "Describe in text",
  catalogSelect: "Catalog design",
  selectDesign: "Select a design…",
  browseGallery: "Browse gallery",
  describeLabel: "Describe your design",
  describePh: "Neckline, sleeves, length, occasion…",
  referenceFile: "Reference image",
  fileHintStitching:
    "Files stay on your device until you send them in WhatsApp after this step.",
  notes: "Notes (fabric, measurements, instructions)",
  notesPh: "Fabric, fit, special instructions…",
  deliveryOptional: "Preferred delivery date (optional)",
  alterationType: "Type of alteration",
  garmentPhoto: "Garment photo (optional filename)",
  altNotesPh: "What should change? Any damage we should know?",
  altDatePh: "Pickup / delivery preference (optional)",
  optionalTag: "(optional)",
  formErrorSummary: "Please review the highlighted fields below.",
  switchServiceWarning:
    "Switching service type clears this item’s fields for that service.",
} as const;

export const requestValidationMessages: ServiceRequestValidationMessages = {
  nameRequired: "Please enter your full name.",
  phoneRequired: "Please enter your phone number (WhatsApp).",
  phoneInvalid: "Enter a valid phone number with country code if needed (10–15 digits).",
  catalogRequired: "Please select a design from the catalog.",
  uploadRequired: "Please choose a reference image from your device.",
};

export const alterationTypeLabels: Record<AlterationType, string> = {
  resize: "Resize (tighter / looser)",
  length: "Length / hem",
  zipper: "Zipper / closure",
  embroidery: "Embroidery / patch",
  other: "Other",
};
