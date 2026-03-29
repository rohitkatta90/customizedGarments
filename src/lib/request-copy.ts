import type { AlterationType } from "@/lib/types";

import type { ServiceRequestValidationMessages } from "@/lib/order/validate-service-request";

/**
 * English-only copy for the multi-item service request flow.
 * i18n can be wired here later without touching component structure.
 */
export const requestCopy = {
  pageTitle: "Service request",
  pageIntro:
    "Add one or more items (stitching and/or alteration). Each item can have its own design reference and delivery date. You’ll confirm on the next step, then open WhatsApp — please attach reference photos there (WhatsApp cannot pull files from the website automatically).",
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
    "The file name is saved with your request only — the image itself is not sent until you attach it in WhatsApp (we’ll remind you on the next screen).",
  notes: "Notes (fabric, measurements, instructions)",
  notesPh:
    "Fabric, fit, special instructions. Tip: use short bullets (Garment: … / Back: … / Length: …) so staff can copy into tailor notes.",
  preferredDelivery: "Preferred delivery date",
  alterationType: "Type of alteration",
  garmentPhoto: "Garment photo (optional filename)",
  altNotesPh: "What should change? Any damage we should know?",
  optionalTag: "(optional)",
  formErrorSummary: "Please review the highlighted fields below.",
  switchServiceWarning:
    "Switching service type clears this item’s fields for that service.",
  /** Pre–WhatsApp handoff modal (English; mobile-first) */
  handoffTitle: "Almost there — open WhatsApp",
  handoffLead:
    "You’ll open WhatsApp next with your order summary ready to send. WhatsApp cannot attach images from our site automatically.",
  handoffAttachBold:
    "Please tap the attachment (paperclip) icon in WhatsApp and send your reference photo(s) in the same chat, right after you send the message.",
  handoffUploadExtra:
    "You chose a reference file on this form — make sure to attach that image (or a clearer one) in WhatsApp so we can see the design.",
  handoffAlterationExtra:
    "If you picked a garment photo on the form, attach it in WhatsApp too so we can assess the piece.",
  handoffCatalogExtra:
    "If you have extra angles or fabric close-ups, feel free to attach them in WhatsApp as well.",
  handoffOpenWhatsapp: "Open WhatsApp",
  handoffBackToForm: "Back to edit order",
} as const;

export const requestValidationMessages: ServiceRequestValidationMessages = {
  nameRequired: "Please enter your full name.",
  phoneRequired: "Please enter your phone number (WhatsApp).",
  phoneInvalid: "Enter a valid phone number with country code if needed (10–15 digits).",
  catalogRequired: "Please select a design from the catalog.",
  uploadRequired: "Please choose a reference image from your device.",
  deliveryRequired: "Please choose a preferred delivery date.",
};

export const alterationTypeLabels: Record<AlterationType, string> = {
  resize: "Resize (tighter / looser)",
  length: "Length / hem",
  zipper: "Zipper / closure",
  embroidery: "Embroidery / patch",
  other: "Other",
};
