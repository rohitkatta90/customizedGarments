export type Locale = "en" | "hi";

export type FaqItem = { id: string; q: string; a: string };

export type TermsSection = { heading: string; paragraphs: string[] };

export type Dictionary = {
  meta: { title: string; description: string };
  site: {
    tagline: string;
    /** Shown under the brand name in the header */
    headerTagline: string;
    description: string;
    businessHours: string;
    /** Service line under tagline (header / hero), single line */
    subtitle: string;
  };
  nav: {
    home: string;
    gallery: string;
    request: string;
    pricing: string;
    faq: string;
    book: string;
  };
  header: {
    whatsapp: string;
    menu: string;
    chatMobile: string;
    language: string;
  };
  hero: {
    eyebrow: string;
    /** Main H1 — memorable brand line */
    headline: string;
    body: string;
    /** Primary conversion CTA (usually WhatsApp) */
    startWhatsapp: string;
    explore: string;
    requestStitching: string;
    requestAlteration: string;
    messageWa: string;
    bookFitting: string;
    cardTitle: string;
    cardSubtitle: string;
    imageAria: string;
    /** Small trust line under hero CTAs */
    previewCaption: string;
  };
  homeTrustChips: {
    fastReply: string;
    noHidden: string;
    trusted: string;
  };
  homeImmediate: {
    title: string;
    body: string;
    ctaRequest: string;
    ctaWhatsapp: string;
  };
  homeGalleryPreview: {
    title: string;
    subtitle: string;
    /** Mobile-only teaser line 1: before / after hyperlink (`nav.gallery` → /gallery) */
    mobileTeaserLine1Before: string;
    mobileTeaserLine1After: string;
    /** Mobile-only teaser second paragraph */
    mobileTeaserLine2: string;
  };
  stickyCta: {
    whatsapp: string;
    call: string;
  };
  homeQuickActions: {
    stitchTitle: string;
    stitchBody: string;
    alterTitle: string;
    alterBody: string;
    kidsTitle: string;
    kidsBody: string;
  };
  homeEmotional: {
    title: string;
    intro: string;
    pillars: { title: string; body: string }[];
  };
  homeCraftsmanship: {
    eyebrow: string;
    title: string;
    /** Shown on gallery (compact) and as lead on home */
    introShort: string;
    intro: string;
    detail: string;
    bullets: string[];
    /** Icon highlights on home (precision, fit, experience) */
    highlights: { title: string; body: string }[];
    /** Subtle role mention — no names or photos */
    teamNote: string;
  };
  homeServices: {
    title: string;
    intro: string;
    kidsLine: string;
    stitchingTitle: string;
    stitchingBody: string;
    alterationsTitle: string;
    alterationsBody: string;
    galleryTitle: string;
    galleryBody: string;
    learnMore: string;
  };
  homeHowItWorks: {
    title: string;
    intro: string;
    steps: { title: string; body: string }[];
  };
  homeTransparency: {
    title: string;
    intro: string;
    bullets: string[];
    linkText: string;
  };
  homeFinalCta: {
    title: string;
    body: string;
    bullets: string[];
    ctaPrimary: string;
    ctaSecondary: string;
  };
  home: {
    talkTitle: string;
    talkBody: string;
    callDesigner: string;
    bookAppointment: string;
    cardGalleryTitle: string;
    cardGalleryText: string;
    cardRequestTitle: string;
    cardRequestText: string;
    cardBookTitle: string;
    cardBookText: string;
    cardKidsTitle: string;
    cardKidsText: string;
    open: string;
  };
  testimonials: {
    title: string;
    subtitle: string;
    seeAll: string;
  };
  reviews: {
    title: string;
    subtitle: string;
    /** Muted supporting line under subtitle */
    detail: string;
    topBadge: string;
    metricHappy: string;
    metricStars: string;
  };
  payment: {
    title: string;
    subtitle: string;
    onlineTitle: string;
    onlineBody: string;
    upiLabel: string;
    upiHint: string;
    codTitle: string;
    codBody: string;
  };
  pricing: {
    pageTitle: string;
    pageIntro: string;
    metaDescription: string;
    principlesTitle: string;
    principles: string[];
    tiersSectionTitle: string;
    tiersSectionIntro: string;
    basicName: string;
    basicDesc: string;
    standardName: string;
    standardDesc: string;
    premiumName: string;
    premiumDesc: string;
    howToChooseTitle: string;
    howToChoose: string[];
    stitchingTableTitle: string;
    stitchingTableIntro: string;
    alterationsTitle: string;
    alterationsIntro: string;
    minorLabel: string;
    minorExamples: string;
    majorLabel: string;
    majorExamples: string;
    colCategory: string;
    colTierBasic: string;
    colTierStandard: string;
    colTierPremium: string;
    staffTitle: string;
    staffBody: string;
    transparencyTitle: string;
    transparencyBody: string;
    footnote: string;
    /** Shown under Service request page intro */
    requestPageBanner: string;
    addOnsTitle: string;
    addOnsIntro: string;
    addOnsPositioning: string;
    addOnsFactorsTitle: string;
    addOnsFactors: string[];
    addOnsColCategory: string;
    addOnsColRange: string;
    addOnsApprovalTitle: string;
    addOnsApprovalBody: string;
    stylingExtraLabels: {
      lace_border: string;
      tassel_latkan: string;
      buttons_zipper: string;
      padding_cups: string;
      embroidery: string;
      dyeing_color: string;
      extra_lining: string;
    };
    effort: {
      title: string;
      intro: string;
      formulaTitle: string;
      formulaBody: string;
      baseRateLabel: string;
      profilesTitle: string;
      colService: string;
      colEffortLevel: string;
      colTypicalUnits: string;
      levelLow: string;
      levelMedium: string;
      levelHigh: string;
      levelVariable: string;
      factorsTitle: string;
      factorPieces: string;
      factorPiecesNote: string;
      factorComplexity: string;
      factorAddons: string;
      factorAddonsNote: string;
      factorUrgency: string;
      consistencyTitle: string;
      consistency: string[];
      guidelinesTitle: string;
      guidelines: string[];
      exampleTitle: string;
      exampleBody: string;
      effortFootnote: string;
      profileLabels: {
        stitching_basic: string;
        stitching_designer: string;
        alteration: string;
      };
    };
    dynamic: {
      title: string;
      intro: string;
      urgencyTitle: string;
      urgencyIntro: string;
      colTimeline: string;
      colSurcharge: string;
      expressLabel: string;
      nextDayLabel: string;
      sameDayLabel: string;
      surchargeFootnote: string;
      demandTitle: string;
      demandIntro: string;
      colScenario: string;
      colMultiplier: string;
      peakLabel: string;
      workloadLabel: string;
      demandFootnote: string;
      capacityTitle: string;
      capacityBody: string;
      commTitle: string;
      commIntro: string;
      commPoints: string[];
      commAlternative: string;
      dynamicFootnote: string;
    };
    margin: {
      title: string;
      intro: string;
      costTitle: string;
      costIntro: string;
      laborLabel: string;
      laborEffortLine: string;
      laborHourlyLine: string;
      accessoriesLabel: string;
      accessoriesLine: string;
      overheadLabel: string;
      overheadLine: string;
      marginTitle: string;
      marginIntro: string;
      colPolicy: string;
      colPercent: string;
      rowMinimum: string;
      rowTarget: string;
      rowBasis: string;
      rowBands: string;
      basisRevenue: string;
      basisCost: string;
      bandRange: string;
      marginBandsFootnote: string;
      checkTitle: string;
      checkIntro: string;
      checkFormula: string;
      exampleBody: string;
      monitorTitle: string;
      monitorIntro: string;
      highProfitTitle: string;
      highProfitTierLine: string;
      lowMarginTitle: string;
      optimizeTitle: string;
      optimizeExperience: string;
      optimizeDemand: string;
      optimizeCosts: string;
      marginFootnote: string;
    };
    communication: {
      title: string;
      intro: string;
      clarityTitle: string;
      clarityBullets: string[];
      toneTitle: string;
      toneBody: string;
      breakdownTitle: string;
      breakdownIntro: string;
      breakdownExampleLabel: string;
      breakdownExample: string;
      trustTitle: string;
      trustBullets: string[];
      upsellTitle: string;
      upsellIntro: string;
      upsellBullets: string[];
      templatesTitle: string;
      templateItems: { id: string; title: string; body: string }[];
      examplesTitle: string;
      exampleItems: { title: string; body: string }[];
      uxTitle: string;
      colUxPlace: string;
      colUxRole: string;
      uxItems: { where: string; body: string }[];
      requestPageLine: string;
      commFootnote: string;
    };
    internalGuidelines: {
      title: string;
      intro: string;
      standardizationTitle: string;
      standardizationIntro: string;
      alterationsStandardTitle: string;
      alterationsStandardIntro: string;
      adjustmentBandTitle: string;
      adjustmentBandBody: string;
      rulesTitle: string;
      rulesIntro: string;
      ruleSteps: { title: string; body: string }[];
      trainingTitle: string;
      trainingIntro: string;
      trainingBullets: string[];
      trainingReviewLine: string;
      exceptionsTitle: string;
      exceptionsIntro: string;
      exceptionsBullets: string[];
      authorityTitle: string;
      authorityIntro: string;
      colSituation: string;
      colWhoApproves: string;
      authorityCaseLabels: {
        within_tier_band: string;
        outside_adjustment_band: string;
        published_config_change: string;
      };
      authorityRoleLabels: {
        any_quoted_staff: string;
        owner_or_lead: string;
        owner_only: string;
      };
      documentationTitle: string;
      documentationIntro: string;
      colRecord: string;
      colChannel: string;
      colWhen: string;
      recordingLabels: {
        whatsapp_written_quote: string;
        admin_ledger_agrees: string;
        exception_internal_note: string;
      };
      channelLabels: {
        whatsapp: string;
        admin_order: string;
        order_notes: string;
      };
      whenLabels: {
        always_before_payment: string;
        always: string;
        override_escalation_or_unusual_scope: string;
      };
      fileRefsTitle: string;
      guidelinesFootnote: string;
    };
  };
  footer: {
    quickLinks: string;
    linkGallery: string;
    linkRequest: string;
    linkPricing: string;
    linkBook: string;
    linkTerms: string;
    contact: string;
    waChat: string;
    callPrefix: string;
    note: string;
    crafted: string;
  };
  gallery: {
    eyebrow: string;
    title: string;
    subtitlePrefix: string;
    subtitleSuffix: string;
    termsLink: string;
    termsHint: string;
    all: string;
    empty: string;
    paginationPrev: string;
    paginationNext: string;
    /** Use {{current}} and {{total}} for 1-based page numbers */
    paginationPageOf: string;
    /** Gallery filter by title, description, and searchKeywords */
    searchLabel: string;
    searchPlaceholder: string;
    /** When search (and optional filters) return nothing */
    searchNoResultsTitle: string;
    searchNoResultsBody: string;
    /** Short link label under empty search — usually goes to /request */
    searchNoResultsCta: string;
    searchClearFilters: string;
    /** Subtle line under Her Styles card — Mom & Me availability */
    herStylesMomMeHint: string;
    /** Subtle line under Little Princess card */
    littlePrincessMomMeHint: string;
    /** Decorative emoji + heading (emoji should be wrapped aria-hidden in UI) */
    momMeMomentsTitle: string;
    momMeMomentsBody: string;
    momMeMomentsCta: string;
    momMeMomentsImageAlt: string;
  };
  terms: {
    pageTitle: string;
    metaDescription: string;
    lead: string;
    sections: TermsSection[];
  };
  categories: {
    blouses: string;
    kurtis: string;
    dresses: string;
    skirtTop: string;
    southIndian: string;
    customDesigns: string;
  };
  /** Singular labels for gallery / cards (e.g. "Blouse") */
  categoriesSingular: {
    blouses: string;
    kurtis: string;
    dresses: string;
    skirtTop: string;
    southIndian: string;
    customDesigns: string;
  };
  catalog: {
    getStitched: string;
    /** Home gallery CTA with arrow */
    getStitchedArrow: string;
    addToRequest: string;
    /** Secondary CTA — open WhatsApp for a quick question (catalog card). */
    chatOnWhatsApp: string;
  };
  styling: {
    /** Category label for add-ons (laces, embroidery, etc.) */
    categoryLabel: string;
    /** Shown on gallery + request — extras pricing transparency */
    pricingNotice: string;
  };
  stitching: {
    pageTitle: string;
    pageIntro: string;
    formTitle: string;
    formIntro: string;
    designSource: string;
    sourceCatalog: string;
    sourceUpload: string;
    sourceDescribe: string;
    catalogItem: string;
    selectDesign: string;
    browseGallery: string;
    referenceImage: string;
    fileHint: string;
    describeLabel: string;
    describePh: string;
    notesLabel: string;
    notesPh: string;
    deliveryLabel: string;
    submit: string;
    designFallbackCatalog: string;
    designFallbackUploadNamed: string;
    designFallbackUpload: string;
    designFallbackDescribe: string;
  };
  alteration: {
    pageTitle: string;
    pageIntro: string;
    formTitle: string;
    formIntro: string;
    typeLabel: string;
    types: {
      resize: string;
      length: string;
      zipper: string;
      embroidery: string;
      other: string;
    };
    photoLabel: string;
    notesLabel: string;
    notesPh: string;
    dateLabel: string;
    submit: string;
  };
  book: {
    pageTitle: string;
    pageIntro: string;
    formTitle: string;
    formIntro: string;
    dateLabel: string;
    dateRequired: string;
    windowLabel: string;
    morning: string;
    midday: string;
    evening: string;
    notesLabel: string;
    notesPh: string;
    submit: string;
  };
  delivery: {
    title: string;
    intro: string;
    garmentLabel: string;
    garments: {
      blouse: string;
      kurti: string;
      dress: string;
      custom: string;
    };
    timelineLabel: string;
    standard: string;
    priority: string;
    estimate: string;
    /** Hint below estimator result — priority stitching */
    priorityEstimatorHint: string;
  };
  faq: {
    pageTitle: string;
    pageIntro: string;
    items: FaqItem[];
  };
  notFound: {
    title: string;
    body: string;
    home: string;
  };
  ratingAria: string;
  wa: {
    header: string;
    footer: string;
    hero: string;
  };
};
