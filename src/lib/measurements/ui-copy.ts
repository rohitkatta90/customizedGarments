/** English UI strings for measurement lookup (client + docs). */
export const measurementUiCopy = {
  sectionTitle: "Saved measurements",
  sectionHint:
    "If you’ve submitted our Google measurement form before, we can pull your latest numbers here.",
  findButton: "Find my measurements",
  searching: "Looking…",
  notConfigured:
    "Saved measurement lookup isn’t set up on this site yet — you can still continue; we’ll confirm in WhatsApp.",
  notFound: "No previous measurements found. We’ll take fresh measurements for you.",
  foundIntro:
    "We found your previous measurements. Choose whether to use each set or send updates in WhatsApp.",
  useThese: "Use these",
  updateInWhatsApp: "I’ll send updates in WhatsApp",
  perGarmentDate: (garment: string, date: string) => `${garment} — last saved ${date}`,
  kidsHint:
    "Little ones grow quickly — please double-check kids’ measurements in WhatsApp even if you use these.",
  errorGeneric: "Couldn’t load measurements right now. You can still continue.",
  rateLimited: "Too many lookups. Please wait a minute and try again.",
} as const;
