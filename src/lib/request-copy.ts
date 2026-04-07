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

/** Lightweight quick stitch path (/request default) — English; mirrors tone of main request copy. */
export const quickRequestCopy = {
  pageTitle: "Quick stitching request",
  pageIntro:
    "A few taps and you’re done — we’ll open WhatsApp for photos and finer details. No account needed.",
  pageSubline:
    "Need several garments, file uploads, or to enter your name and phone on the site? Use the detailed request form.",
  designLockedHint: "Design from gallery — you don’t need to pick it again.",
  serviceLabel: "Service",
  itemsLabel: "How many pieces?",
  item1: "1",
  item2: "2",
  item3plus: "3+",
  deliveryLabel: "Preferred delivery date",
  notesLabel: "Additional notes",
  notesOptional: "(optional)",
  notesPh: "Any design details, fabric info, or special requests…",
  submit: "Continue",
  handoffTitle: "You're almost done! 😊",
  handoffLead:
    "Next, you'll open WhatsApp with your request ready to send. Please share your design photo there so we can understand the look and match it to your order.",
  handoffBold:
    "Tip: tap the paperclip in WhatsApp and attach your reference image right after you send the message.",
  continueWhatsapp: "Continue to WhatsApp",
  backEdit: "Back to edit",
  deliveryRequired: "Please choose a delivery date.",
  switchToDetailed: "Need multiple items, file uploads, or full details?",
  switchToDetailedLink: "Use the detailed request form",
  clearDesignLink: "Start without this design",
  backToQuickLink: "← Quick request",
  measurementPhoneLabel: "WhatsApp number",
  measurementPhoneHint:
    "Optional — enter if you want us to look up saved measurements and attach your real number to this order.",
} as const;

/** Guided multi-step quick request (WhatsApp-style flow). */
export const quickFlowCopy = {
  stepProgress: (n: number) => `Step ${n} of 5`,
  screen1Title: "What would you like to do?",
  stitchCardTitle: "Stitch a new outfit",
  stitchCardBody: "Create something from a design or idea",
  alterCardTitle: "Alter an existing dress",
  alterCardBody: "Fix fitting, length, or styling",
  kidsCardTitle: "Kids' wear stitching",
  kidsCardBody:
    "Party or festive looks for little girls (about ages 5–12) — we quote clearly when our schedule allows",
  /**
   * Added to the quick-request notes when the kids tile or ?for=kids is used.
   * WhatsApp copy also keys off this (and the legacy shorter tag) to add age context.
   */
  kidsNoteChip: "[Kids / girls' wear · stitching for little girls · ages 5–12]",
  /** Legacy marker still recognised so older bookmarks / pasted notes trigger kids WhatsApp lines */
  kidsNoteChipLegacy: "[Kids / girls' wear]",
  screen2Title: "How many pieces?",
  piecesQuick1: "1 piece",
  piecesQuick2: "2 pieces",
  piecesQuickMany: "3+ pieces",
  piecesQuick1Hint: "Fastest for a single garment",
  piecesQuick2Hint: "Two pieces, one order",
  piecesQuickManyHint: "Larger orders — set exact count below",
  piecesExactLabel: "How many pieces exactly?",
  piecesManyHint: "We'll confirm timeline based on number of pieces",
  piecesManyTapContinue: "Tap Continue → when your count looks right.",
  screen3Title: "When do you need it?",
  /** Adult stitching only — optional block at top of step 3 */
  momAndMeHook: "✨ Want matching outfits for you and your little one?",
  momAndMeCheckbox: "Yes — Mom & Me set",
  momAndMeHelper:
    "We'll plan both looks together on WhatsApp. If you haven't already, choose enough pieces on the previous step (often two — yours + hers).",
  momAndMeFitLabel: "How should we size her outfit?",
  momAndMeByAge: "Age (years)",
  momAndMeBySize: "Dress or kids' size",
  momAndMeAgeLabel: "Her age (years)",
  momAndMeAgePlaceholder: "e.g. 7",
  momAndMeSizeLabel: "Her size",
  momAndMeSizePlaceholder: "e.g. kids' 28, Size 8",
  momAndMePreferenceLabel: "How closely should they match?",
  momAndMeSame: "Same design",
  momAndMeVariation: "Slight variation",
  momAndMeIncomplete:
    "Please choose age or size, fill in the detail, and pick how you'd like the looks to match.",
  earliestLabel: "Earliest available:",
  dateHelper: "We'll confirm exact timeline on WhatsApp",
  selectDate: "Select date",
  screen4Title: "Anything we should know?",
  screen4Optional: "(optional)",
  screen4ChildAgeLabel: "Child's age (years)",
  screen4ChildAgeHint: "Whole years — our girls' wear band is about 5–12.",
  screen4ChildAgeError: "Please enter her age in years (5–12).",
  quickAdd: "Quick add:",
  chipDeepBack: "Deep back",
  chipElbow: "Elbow sleeves",
  chipStraight: "Straight fit",
  screen5Title: "Enter your WhatsApp number",
  screen5Optional: "(optional)",
  screen5Helper: "We'll use this to fetch saved measurements",
  finalTitle: "You're all set 😊",
  finalLead: "We'll open WhatsApp to continue",
  trustFast: "Fast replies",
  trustPricing: "Clear pricing",
  trustNoHidden: "No hidden charges",
  stickyContinue: "Continue →",
  stickyContinueWhatsapp: "Continue to WhatsApp 💬",
  dateRequiredToast: "Please pick a delivery date to continue.",
  backStep: "Back",
  dateStickyHint: "Pick a delivery date above, then tap Continue →.",
  /** Step 3 — short line directly under date picker */
  priorityDateHook:
    "⚡ Need it sooner? We can prioritise your order (additional charges may apply)",
  /** Step 3 — warm explainer card */
  priorityLongTitle: "Need it sooner? We can prioritise your order ✨",
  priorityLongBody:
    "We offer expedited stitching based on availability — additional charges may apply. We'll always confirm this with you before proceeding.",
  priorityCheckbox: "I may need this on priority",
  /** Shown when date is before standard lead and checkbox is off */
  priorityImpliedSoftNote:
    "We've noticed your date is on the quicker side of our usual timeline — we'll double-check what's possible when we chat.",
  trustPriority: "Priority options available for urgent needs",
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
