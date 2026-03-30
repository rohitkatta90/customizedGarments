/** English UI strings for measurement lookup (client + docs). Boutique, warm tone — avoid system-error wording. */
export const measurementUiCopy = {
  sectionTitle: "Saved measurements",
  sectionHint:
    "If you’ve shared your measurements with us before, we can pull your latest numbers here.",
  findButton: "Find my measurements",
  searching: "Looking for your saved measurements…",
  phoneStaleHint: "Number changed — tap Find again to refresh for this number.",
  refreshLookup: "Refresh lookup",
  notConfiguredTitle: "We’ll take care of this on WhatsApp ✨",
  notConfiguredBody:
    "Saved measurement lookup isn’t connected here yet — that’s perfectly fine. Continue and we’ll guide you through everything in chat.",
  notFoundTitle: "Ohoo… looks like this is your first piece with us 😊",
  notFoundBody:
    "We’ll take your measurements and make sure everything fits just right.",
  foundHeadline: "Yay! We found your measurements 😊",
  foundSublineSingle: (date: string) =>
    `Last saved on ${date} — would you like to use them?`,
  foundSublineMulti:
    "Here are your latest saves by garment — would you like to use them?",
  useThese: "Use these",
  updateMeasurements: "Update measurements",
  perGarmentSaved: (garment: string, date: string) =>
    `${garment.replace(/_/g, " ")} · last saved ${date}`,
  kidsHint:
    "Little ones grow quickly — a quick double-check in WhatsApp is always a good idea.",
  errorSoftTitle: "Couldn’t peek at saved measurements just now",
  errorSoftBody: "No stress — we’ll confirm everything together on WhatsApp.",
  rateLimitedTitle: "One moment please",
  rateLimitedBody: "Let’s try again in a minute — we want to keep things smooth for everyone.",
} as const;
