"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { addCalendarDaysLocal, clampIsoDateToMin, todayLocalISODate } from "@/lib/date-today";

import { MeasurementLookupPanel } from "@/components/measurements/MeasurementLookupPanel";
import { formatMeasurementsForWhatsApp } from "@/lib/measurements/format-whatsapp";
import type { MeasurementSelectionPayload } from "@/lib/measurements/format-whatsapp";
import { Button } from "@/components/ui/Button";
import {
  buildQuickStitchWhatsAppMessage,
  type QuickItemCount,
  type QuickMomAndMeChildKind,
  type QuickMomAndMeData,
  type QuickServiceType,
} from "@/lib/order/quick-request";
import { isPreferredDateEarlierThanStandardLead } from "@/lib/order/priority";
import type { Order } from "@/lib/order/types";
import { quickFlowCopy as f, quickRequestCopy as q } from "@/lib/request-copy";
import type { CatalogItem } from "@/lib/types";
import { isPhonePlausible } from "@/lib/orders/phone";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

type Props = {
  catalog: CatalogItem[];
  categoryLabel: string;
  pricingNotice: string;
};

const EARLIEST_LEAD_DAYS = 7;
/** Brief delay before advancing after choosing a service on step 1. */
const STEP1_QUICK_ADVANCE_MS = 280;

function newOrderId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `ord-${Date.now()}`;
}

const inputBase =
  "w-full rounded-2xl border bg-background px-4 py-3.5 text-base outline-none transition-colors focus:ring-2 sm:text-sm";
const inputNormal = "border-border ring-accent focus:ring-2";
const inputInvalid = "border-red-500 ring-1 ring-red-500/40 focus:border-red-500 focus:ring-red-500";

function CalendarGlyph({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}

function piecesToQuickCount(p: number): QuickItemCount {
  if (p >= 3) return "3plus";
  if (p === 2) return "2";
  return "1";
}

function appendNoteChip(current: string, chip: string): string {
  const t = current.trim();
  if (!t) return chip;
  if (t.toLowerCase().includes(chip.toLowerCase())) return t;
  return `${t}, ${chip}`;
}

function stripNoteChip(current: string, chip: string): string {
  return current
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.toLowerCase() !== chip.toLowerCase())
    .join(", ");
}

export function QuickStitchRequestForm({ catalog, categoryLabel, pricingNotice }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const catalogIdFromUrl = searchParams.get("catalog") ?? undefined;
  const serviceFromUrl = searchParams.get("service") === "alteration" ? "alteration" : "stitching";
  const forKidsFromUrl = searchParams.get("for") === "kids";

  const [orderId] = useState(newOrderId);
  const [step, setStep] = useState(1);
  const [serviceType, setServiceType] = useState<QuickServiceType>(serviceFromUrl);
  const [pieces, setPieces] = useState(1);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [dateTouched, setDateTouched] = useState(false);
  const [customerPhone, setCustomerPhone] = useState("");
  const [priorityMayNeed, setPriorityMayNeed] = useState(false);
  const [measurementPayload, setMeasurementPayload] = useState<MeasurementSelectionPayload | null>(null);
  const [preparedMessage, setPreparedMessage] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const [childAgeInput, setChildAgeInput] = useState("");
  const [childAgeError, setChildAgeError] = useState(false);
  const [kidsWearIntent, setKidsWearIntent] = useState(forKidsFromUrl);
  const [momAndMeEnabled, setMomAndMeEnabled] = useState(false);
  const [momAndMeChildKind, setMomAndMeChildKind] = useState<QuickMomAndMeChildKind | null>(null);
  const [momAndMeAgeInput, setMomAndMeAgeInput] = useState("");
  const [momAndMeSizeInput, setMomAndMeSizeInput] = useState("");
  const [momAndMePreference, setMomAndMePreference] = useState<"same" | "variation" | null>(null);
  const [momAndMeError, setMomAndMeError] = useState(false);

  const step1AdvanceRef = useRef<number | null>(null);
  const momMeUrlAppliedRef = useRef(false);

  const clearStep1Advance = useCallback(() => {
    if (step1AdvanceRef.current != null) {
      window.clearTimeout(step1AdvanceRef.current);
      step1AdvanceRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (step !== 1) clearStep1Advance();
  }, [step, clearStep1Advance]);

  useEffect(() => {
    if (!forKidsFromUrl) return;
    setServiceType("stitching");
    setKidsWearIntent(true);
  }, [forKidsFromUrl]);

  const isKidsPath = kidsWearIntent && serviceType === "stitching";
  const isAdultStitchPath = serviceType === "stitching" && !kidsWearIntent;

  const momAndMeAgeParsed = useMemo(() => {
    const t = momAndMeAgeInput.trim();
    if (!t) return null;
    const n = parseInt(t, 10);
    if (!Number.isInteger(n) || n < 1 || n > 18) return null;
    return n;
  }, [momAndMeAgeInput]);

  const momAndMeStep3Incomplete =
    isAdultStitchPath &&
    momAndMeEnabled &&
    (momAndMeChildKind === null ||
      momAndMePreference === null ||
      (momAndMeChildKind === "age" && momAndMeAgeParsed === null) ||
      (momAndMeChildKind === "size" && !momAndMeSizeInput.trim()));

  const childAgeParsed = useMemo(() => {
    const t = childAgeInput.trim();
    if (!t) return null;
    const n = parseInt(t, 10);
    if (!Number.isInteger(n) || n < 5 || n > 12) return null;
    return n;
  }, [childAgeInput]);

  useEffect(() => {
    if (!isKidsPath) {
      setChildAgeInput("");
      setChildAgeError(false);
    }
  }, [isKidsPath]);

  useEffect(() => {
    if (!isAdultStitchPath) {
      setMomAndMeEnabled(false);
      setMomAndMeChildKind(null);
      setMomAndMeAgeInput("");
      setMomAndMeSizeInput("");
      setMomAndMePreference(null);
      setMomAndMeError(false);
    }
  }, [isAdultStitchPath]);

  useEffect(() => {
    if (!isAdultStitchPath || searchParams.get("momAndMe") !== "1" || momMeUrlAppliedRef.current) return;
    momMeUrlAppliedRef.current = true;
    setMomAndMeEnabled(true);
  }, [isAdultStitchPath, searchParams]);

  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const today = useMemo(() => todayLocalISODate(), []);
  const earliestISO = useMemo(() => addCalendarDaysLocal(today, EARLIEST_LEAD_DAYS), [today]);
  const earliestDisplay = useMemo(() => {
    const d = new Date(`${earliestISO}T12:00:00`);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  }, [earliestISO]);

  useEffect(() => {
    if (step !== 3 || !deliveryDate.trim()) return;
    const clamped = clampIsoDateToMin(deliveryDate, earliestISO);
    if (clamped !== deliveryDate) setDeliveryDate(clamped);
  }, [step, deliveryDate, earliestISO]);

  const itemCount = piecesToQuickCount(pieces);

  const selectedCatalogItem = useMemo(
    () => (catalogIdFromUrl ? catalog.find((c) => c.id === catalogIdFromUrl) : undefined),
    [catalog, catalogIdFromUrl],
  );

  const dateInvalid =
    dateTouched &&
    step === 3 &&
    (!deliveryDate.trim() || deliveryDate < earliestISO);

  const priorityImpliedByDate = useMemo(
    () =>
      Boolean(
        deliveryDate.trim() &&
          isPreferredDateEarlierThanStandardLead(deliveryDate.trim(), today),
      ),
    [deliveryDate, today],
  );

  const priorityRequestedForPayload = priorityMayNeed;
  const priorityImpliedForPayload = priorityImpliedByDate && !priorityMayNeed;

  const fullFormHref = useMemo(() => {
    const p = new URLSearchParams();
    p.set("full", "1");
    if (catalogIdFromUrl) p.set("catalog", catalogIdFromUrl);
    p.set("service", serviceType);
    if (kidsWearIntent && serviceType === "stitching") p.set("for", "kids");
    return `/request?${p.toString()}`;
  }, [catalogIdFromUrl, serviceType, kidsWearIntent]);

  const momAndMeDataForSubmit = useMemo((): QuickMomAndMeData | null => {
    if (
      !isAdultStitchPath ||
      !momAndMeEnabled ||
      momAndMeChildKind === null ||
      momAndMePreference === null
    ) {
      return null;
    }
    if (momAndMeChildKind === "age") {
      if (momAndMeAgeParsed === null) return null;
      return {
        childKind: "age",
        ageYears: momAndMeAgeParsed,
        preference: momAndMePreference,
      };
    }
    const size = momAndMeSizeInput.trim();
    if (!size) return null;
    return {
      childKind: "size",
      sizeText: size,
      preference: momAndMePreference,
    };
  }, [
    isAdultStitchPath,
    momAndMeEnabled,
    momAndMeChildKind,
    momAndMePreference,
    momAndMeAgeParsed,
    momAndMeSizeInput,
  ]);

  const momAndMeApiPayload = useMemo(() => {
    if (!momAndMeDataForSubmit) return null;
    const d = momAndMeDataForSubmit;
    return {
      momAndMe: true as const,
      momAndMeChildKind: d.childKind,
      ...(d.childKind === "age"
        ? { momAndMeChildAgeYears: d.ageYears }
        : { momAndMeChildSize: d.sizeText }),
      momAndMePreference: d.preference,
    };
  }, [momAndMeDataForSubmit]);

  const finalize = useCallback(async () => {
    if (!deliveryDate.trim() || deliveryDate < earliestISO) return;
    setFinalizing(true);
    const order: Order = { id: orderId, items: [] };
    try {
      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quick: true,
          id: orderId,
          serviceType,
          itemCount,
          ...(pieces >= 3 ? { exactPieceCount: pieces } : {}),
          priorityRequested: priorityRequestedForPayload,
          priorityImplied: priorityImpliedForPayload,
          preferredDeliveryDate: deliveryDate.trim(),
          notes,
          catalogId: selectedCatalogItem?.id,
          ...(isPhonePlausible(customerPhone) ? { customerPhone: customerPhone.trim() } : {}),
          ...(isKidsPath && childAgeParsed != null ? { childAgeYears: childAgeParsed } : {}),
          ...(isKidsPath ? { kidsWear: true } : {}),
          ...(momAndMeApiPayload ?? {}),
          ...(measurementPayload?.selectionComplete
            ? {
                measurementPreferences: Object.fromEntries(
                  measurementPayload.items.map((i) => [
                    i.garmentType,
                    measurementPayload.choices[i.garmentType] === "use"
                      ? "USE_SAVED"
                      : "UPDATE_REQUIRED",
                  ]),
                ) as Record<string, "USE_SAVED" | "UPDATE_REQUIRED">,
                measurementLastSavedAt: measurementPayload.lastMeasurementDatesByGarment,
              }
            : {}),
        }),
      });
    } catch {
      /* still hand off */
    }

    const measurementAppend =
      measurementPayload?.selectionComplete
        ? formatMeasurementsForWhatsApp(measurementPayload.items, measurementPayload.choices)
        : null;
    const msg = buildQuickStitchWhatsAppMessage({
      order,
      catalog,
      serviceType,
      itemCount,
      exactPieceCount: pieces >= 3 ? pieces : undefined,
      priorityRequested: priorityRequestedForPayload,
      priorityImplied: priorityImpliedForPayload,
      preferredDeliveryDate: deliveryDate.trim(),
      notes,
      catalogId: selectedCatalogItem?.id,
      measurementAppend: measurementAppend ?? undefined,
      ...(childAgeParsed != null ? { childAgeYears: childAgeParsed } : {}),
      ...(isKidsPath ? { kidsWear: true } : {}),
      ...(momAndMeDataForSubmit ? { momAndMe: momAndMeDataForSubmit } : {}),
    });
    setPreparedMessage(msg);
    setStep(6);
    setFinalizing(false);
  }, [
    orderId,
    serviceType,
    itemCount,
    deliveryDate,
    notes,
    selectedCatalogItem,
    customerPhone,
    measurementPayload,
    catalog,
    pieces,
    priorityRequestedForPayload,
    priorityImpliedForPayload,
    earliestISO,
    childAgeParsed,
    isKidsPath,
    momAndMeApiPayload,
    momAndMeDataForSubmit,
  ]);

  function scheduleAdvanceFromStep1() {
    clearStep1Advance();
    if (reduceMotion) {
      setStep(2);
      return;
    }
    step1AdvanceRef.current = window.setTimeout(() => {
      step1AdvanceRef.current = null;
      setStep((s) => (s === 1 ? 2 : s));
    }, STEP1_QUICK_ADVANCE_MS);
  }

  function chooseQuickPieceCount(n: 1 | 2) {
    if (step !== 2) return;
    setPieces(n);
  }

  function chooseManyPiecesMode() {
    if (step !== 2) return;
    setPieces((p) => (p < 3 ? 3 : p));
  }

  function bumpManyPieces(delta: number) {
    if (step !== 2) return;
    setPieces((p) => Math.max(3, p + delta));
  }

  function selectAdultStitching() {
    setKidsWearIntent(false);
    setServiceType("stitching");
    setNotes((n) => stripNoteChip(stripNoteChip(n, f.kidsNoteChip), f.kidsNoteChipLegacy));
    scheduleAdvanceFromStep1();
  }

  function selectKidsWearStitching() {
    setKidsWearIntent(true);
    setServiceType("stitching");
    scheduleAdvanceFromStep1();
  }

  function selectAlteration() {
    setKidsWearIntent(false);
    setServiceType("alteration");
    setNotes((n) => stripNoteChip(stripNoteChip(n, f.kidsNoteChip), f.kidsNoteChipLegacy));
    scheduleAdvanceFromStep1();
  }

  function onDeliveryDateChange(value: string) {
    setDateTouched(true);
    setDeliveryDate(clampIsoDateToMin(value, earliestISO));
  }

  function goNext() {
    if (step === 1) {
      setStep(2);
      return;
    }
    if (step === 2) {
      setStep(3);
      return;
    }
    if (step === 3) {
      setDateTouched(true);
      if (!deliveryDate.trim() || deliveryDate < earliestISO) return;
      if (momAndMeStep3Incomplete) {
        setMomAndMeError(true);
        return;
      }
      setMomAndMeError(false);
      setStep(4);
      return;
    }
    if (step === 4) {
      if (isKidsPath) {
        if (childAgeParsed === null) {
          setChildAgeError(true);
          return;
        }
        setChildAgeError(false);
      }
      setStep(5);
      return;
    }
    if (step === 5) {
      void finalize();
    }
  }

  function goBack() {
    clearStep1Advance();
    if (step > 1 && step < 6) {
      setStep((s) => s - 1);
    }
  }

  function goBackFromFinal() {
    setPreparedMessage(null);
    setStep(5);
  }

  const chips = [f.chipDeepBack, f.chipElbow, f.chipStraight] as const;

  const measurementStepNeedsChoice =
    step === 5 &&
    measurementPayload != null &&
    measurementPayload.items.length > 0 &&
    !measurementPayload.selectionComplete;

  const continueDisabled =
    (step === 3 && (!deliveryDate.trim() || deliveryDate < earliestISO)) ||
    finalizing ||
    measurementStepNeedsChoice;
  const showBackBtn = step >= 2 && (step < 6 || Boolean(preparedMessage));
  /** Step 1 advances on card tap; from step 2 onward use Continue for a consistent pattern. */
  const showContinueBtn = step >= 2 && step <= 5;
  const showWhatsappBtn = step === 6 && Boolean(preparedMessage);
  const showNavRow = showBackBtn || showContinueBtn || showWhatsappBtn;

  return (
    <div className="pb-6 md:pb-8">
      <div className="rounded-2xl border border-amber-200/70 bg-amber-50/40 p-5 shadow-sm sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-900/75">
          {categoryLabel}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-amber-950/90">{pricingNotice}</p>
      </div>

      {selectedCatalogItem ? (
        <div className="mt-5 rounded-2xl border border-accent/30 bg-[#fff9f8] px-4 py-3 text-sm text-foreground">
          <span className="font-medium">{selectedCatalogItem.title}</span>
          <p className="mt-1 text-xs text-muted">{q.designLockedHint}</p>
          <button
            type="button"
            className="mt-2 text-xs font-medium text-accent-dark underline-offset-4 hover:underline"
            onClick={() => router.push("/request")}
          >
            {q.clearDesignLink}
          </button>
        </div>
      ) : null}

      {step === 1 ? (
        <p className="mt-6 text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
          {q.pageTitle}
        </p>
      ) : null}
      {step >= 1 && step <= 5 ? (
        <p
          className={`text-center text-sm font-medium text-accent-dark ${step === 1 ? "mt-2" : "mt-6"}`}
        >
          {f.stepProgress(step)}
        </p>
      ) : null}

      <div className="relative mt-8 min-h-[280px] overflow-hidden sm:min-h-[320px]">
        <div key={step} className="animate-step-in motion-reduce:animate-none">
          {step === 1 ? (
            <div className="space-y-4">
              <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
                {f.screen1Title}
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={selectAdultStitching}
                  className={`flex min-h-[120px] w-full flex-col items-start rounded-2xl border-2 p-6 text-left shadow-sm transition-all duration-200 ease-out active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 ${
                    serviceType === "stitching" && !kidsWearIntent
                      ? "border-accent bg-[#fff9f8] shadow-lg ring-2 ring-accent/25"
                      : "border-border bg-card hover:border-accent/35 hover:shadow-md"
                  }`}
                >
                  <span className="text-2xl" aria-hidden>
                    🧵
                  </span>
                  <span className="mt-3 font-display text-lg font-semibold text-foreground">
                    {f.stitchCardTitle}
                  </span>
                  <span className="mt-2 text-sm text-muted">{f.stitchCardBody}</span>
                </button>
                <button type="button" onClick={selectAlteration} className={`flex min-h-[120px] w-full flex-col items-start rounded-2xl border-2 p-6 text-left shadow-sm transition-all duration-200 ease-out active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 ${
                    serviceType === "alteration"
                      ? "border-accent bg-[#fff9f8] shadow-lg ring-2 ring-accent/25"
                      : "border-border bg-card hover:border-accent/35 hover:shadow-md"
                  }`}
                >
                  <span className="text-2xl" aria-hidden>
                    ✂️
                  </span>
                  <span className="mt-3 font-display text-lg font-semibold text-foreground">
                    {f.alterCardTitle}
                  </span>
                  <span className="mt-2 text-sm text-muted">{f.alterCardBody}</span>
                </button>
                <button
                  type="button"
                  onClick={selectKidsWearStitching}
                  className={`flex min-h-[120px] w-full flex-col items-start rounded-2xl border-2 p-6 text-left shadow-sm transition-all duration-200 ease-out active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 ${
                    serviceType === "stitching" && kidsWearIntent
                      ? "border-accent bg-[#fff9f8] shadow-lg ring-2 ring-accent/25"
                      : "border-border bg-card hover:border-accent/35 hover:shadow-md"
                  }`}
                >
                  <span className="text-2xl" aria-hidden>
                    👗
                  </span>
                  <span className="mt-3 font-display text-lg font-semibold text-foreground">
                    {f.kidsCardTitle}
                  </span>
                  <span className="mt-2 text-sm text-muted">{f.kidsCardBody}</span>
                </button>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-6">
              <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
                {f.screen2Title}
              </h2>
              <div className="grid gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => chooseQuickPieceCount(1)}
                  className={`flex min-h-[100px] flex-col items-start rounded-2xl border-2 p-5 text-left shadow-sm transition-all duration-200 ease-out active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 ${
                    pieces === 1
                      ? "border-accent bg-[#fff9f8] shadow-lg ring-2 ring-accent/25"
                      : "border-border bg-card hover:border-accent/35 hover:shadow-md"
                  }`}
                >
                  <span className="font-display text-lg font-semibold text-foreground">{f.piecesQuick1}</span>
                  <span className="mt-1 text-xs text-muted">{f.piecesQuick1Hint}</span>
                </button>
                <button
                  type="button"
                  onClick={() => chooseQuickPieceCount(2)}
                  className={`flex min-h-[100px] flex-col items-start rounded-2xl border-2 p-5 text-left shadow-sm transition-all duration-200 ease-out active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 ${
                    pieces === 2
                      ? "border-accent bg-[#fff9f8] shadow-lg ring-2 ring-accent/25"
                      : "border-border bg-card hover:border-accent/35 hover:shadow-md"
                  }`}
                >
                  <span className="font-display text-lg font-semibold text-foreground">{f.piecesQuick2}</span>
                  <span className="mt-1 text-xs text-muted">{f.piecesQuick2Hint}</span>
                </button>
                <button
                  type="button"
                  onClick={chooseManyPiecesMode}
                  className={`flex min-h-[100px] flex-col items-start rounded-2xl border-2 p-5 text-left shadow-sm transition-all duration-200 ease-out active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 ${
                    pieces >= 3
                      ? "border-accent bg-[#fff9f8] shadow-lg ring-2 ring-accent/25"
                      : "border-border bg-card hover:border-accent/35 hover:shadow-md"
                  }`}
                >
                  <span className="font-display text-lg font-semibold text-foreground">{f.piecesQuickMany}</span>
                  <span className="mt-1 text-xs text-muted">{f.piecesQuickManyHint}</span>
                </button>
              </div>
              {pieces >= 3 ? (
                <div
                  key="many-expanded"
                  className="animate-step-in motion-reduce:animate-none space-y-4 rounded-2xl border border-accent/25 bg-[#fdf8f6]/80 p-5 shadow-sm"
                >
                  <p className="text-center text-sm font-medium text-foreground">{f.piecesExactLabel}</p>
                  <div className="flex items-center justify-center gap-8">
                    <button
                      type="button"
                      aria-label="Decrease count"
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-border bg-card text-2xl font-semibold text-foreground transition-all duration-200 hover:border-accent hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 motion-reduce:active:scale-100"
                      disabled={pieces <= 3}
                      onClick={() => bumpManyPieces(-1)}
                    >
                      −
                    </button>
                    <div className="min-w-[4.5rem] text-center font-display text-4xl font-semibold tabular-nums text-foreground">
                      {pieces}
                    </div>
                    <button
                      type="button"
                      aria-label="Increase count"
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-border bg-card text-2xl font-semibold text-foreground transition-all duration-200 hover:border-accent hover:shadow-md active:scale-95 motion-reduce:active:scale-100"
                      onClick={() => bumpManyPieces(1)}
                    >
                      +
                    </button>
                  </div>
                  <p className="text-center text-xs leading-relaxed text-muted">{f.piecesManyHint}</p>
                  {!reduceMotion ? (
                    <p className="text-center text-xs font-medium text-accent-dark">{f.piecesManyTapContinue}</p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-5">
              <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
                {f.screen3Title}
              </h2>
              {isAdultStitchPath ? (
                <div className="space-y-4 rounded-2xl border border-rose-200/55 bg-gradient-to-b from-rose-50/50 to-transparent px-4 py-4 shadow-sm sm:px-5 sm:py-5">
                  <p className="text-sm font-medium leading-snug text-foreground">{f.momAndMeHook}</p>
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-white/70 px-3 py-3 ring-1 ring-rose-100/80">
                    <input
                      type="checkbox"
                      checked={momAndMeEnabled}
                      onChange={(e) => {
                        const on = e.target.checked;
                        setMomAndMeEnabled(on);
                        setMomAndMeError(false);
                        if (!on) {
                          setMomAndMeChildKind(null);
                          setMomAndMeAgeInput("");
                          setMomAndMeSizeInput("");
                          setMomAndMePreference(null);
                        }
                      }}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-accent"
                    />
                    <span className="text-sm font-medium text-foreground">{f.momAndMeCheckbox}</span>
                  </label>
                  {momAndMeEnabled ? (
                    <div className="space-y-4 border-t border-rose-100/80 pt-4">
                      <fieldset className="space-y-2">
                        <legend className="mb-2 text-sm font-medium text-foreground">
                          {f.momAndMeFitLabel}
                          <span className="text-red-600"> *</span>
                        </legend>
                        <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-white/70 px-3 py-2.5 ring-1 ring-rose-100/60">
                          <input
                            type="radio"
                            name="momAndMeChildKind"
                            value="age"
                            checked={momAndMeChildKind === "age"}
                            onChange={() => {
                              setMomAndMeChildKind("age");
                              setMomAndMeSizeInput("");
                              setMomAndMeError(false);
                            }}
                            className="mt-1 h-4 w-4 shrink-0 border-border accent-accent"
                          />
                          <span className="text-sm text-foreground">{f.momAndMeByAge}</span>
                        </label>
                        <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-white/70 px-3 py-2.5 ring-1 ring-rose-100/60">
                          <input
                            type="radio"
                            name="momAndMeChildKind"
                            value="size"
                            checked={momAndMeChildKind === "size"}
                            onChange={() => {
                              setMomAndMeChildKind("size");
                              setMomAndMeAgeInput("");
                              setMomAndMeError(false);
                            }}
                            className="mt-1 h-4 w-4 shrink-0 border-border accent-accent"
                          />
                          <span className="text-sm text-foreground">{f.momAndMeBySize}</span>
                        </label>
                      </fieldset>
                      {momAndMeChildKind === "age" ? (
                        <div>
                          <label
                            htmlFor="wizard-mom-me-age"
                            className="mb-2 block text-sm font-medium text-foreground"
                          >
                            {f.momAndMeAgeLabel}
                            <span className="text-red-600"> *</span>
                          </label>
                          <input
                            id="wizard-mom-me-age"
                            type="number"
                            inputMode="numeric"
                            min={1}
                            max={18}
                            step={1}
                            value={momAndMeAgeInput}
                            onChange={(e) => {
                              setMomAndMeAgeInput(e.target.value);
                              setMomAndMeError(false);
                            }}
                            placeholder={f.momAndMeAgePlaceholder}
                            aria-invalid={momAndMeError && momAndMeChildKind === "age" && momAndMeAgeParsed === null}
                            className={`box-border w-full min-w-0 ${inputBase} ${momAndMeError && momAndMeChildKind === "age" && momAndMeAgeParsed === null ? inputInvalid : inputNormal}`}
                          />
                        </div>
                      ) : null}
                      {momAndMeChildKind === "size" ? (
                        <div>
                          <label
                            htmlFor="wizard-mom-me-size"
                            className="mb-2 block text-sm font-medium text-foreground"
                          >
                            {f.momAndMeSizeLabel}
                            <span className="text-red-600"> *</span>
                          </label>
                          <input
                            id="wizard-mom-me-size"
                            type="text"
                            value={momAndMeSizeInput}
                            onChange={(e) => {
                              setMomAndMeSizeInput(e.target.value);
                              setMomAndMeError(false);
                            }}
                            placeholder={f.momAndMeSizePlaceholder}
                            aria-invalid={momAndMeError && !momAndMeSizeInput.trim()}
                            className={`box-border w-full min-w-0 ${inputBase} ${momAndMeError && !momAndMeSizeInput.trim() ? inputInvalid : inputNormal}`}
                          />
                        </div>
                      ) : null}
                      <fieldset className="space-y-2">
                        <legend className="mb-2 text-sm font-medium text-foreground">
                          {f.momAndMePreferenceLabel}
                          <span className="text-red-600"> *</span>
                        </legend>
                        <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-white/70 px-3 py-2.5 ring-1 ring-rose-100/60">
                          <input
                            type="radio"
                            name="momAndMePreference"
                            value="same"
                            checked={momAndMePreference === "same"}
                            onChange={() => {
                              setMomAndMePreference("same");
                              setMomAndMeError(false);
                            }}
                            className="mt-1 h-4 w-4 shrink-0 border-border accent-accent"
                          />
                          <span className="text-sm text-foreground">{f.momAndMeSame}</span>
                        </label>
                        <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-white/70 px-3 py-2.5 ring-1 ring-rose-100/60">
                          <input
                            type="radio"
                            name="momAndMePreference"
                            value="variation"
                            checked={momAndMePreference === "variation"}
                            onChange={() => {
                              setMomAndMePreference("variation");
                              setMomAndMeError(false);
                            }}
                            className="mt-1 h-4 w-4 shrink-0 border-border accent-accent"
                          />
                          <span className="text-sm text-foreground">{f.momAndMeVariation}</span>
                        </label>
                      </fieldset>
                      {momAndMeError ? (
                        <p className="text-sm text-red-700" role="alert">
                          {f.momAndMeIncomplete}
                        </p>
                      ) : null}
                      <p className="text-xs leading-relaxed text-muted">{f.momAndMeHelper}</p>
                    </div>
                  ) : null}
                </div>
              ) : null}
              <p className="text-sm text-muted">
                <span className="font-medium text-foreground">{f.earliestLabel}</span>{" "}
                <span className="text-accent-dark">{earliestDisplay}</span>
              </p>
              <div>
                <label
                  htmlFor="wizard-delivery"
                  className="mb-2 block text-sm font-medium text-foreground"
                >
                  {f.selectDate} 📅
                </label>
                <div className="relative">
                  <input
                    id="wizard-delivery"
                    type="date"
                    min={earliestISO}
                    value={deliveryDate}
                    onChange={(e) => onDeliveryDateChange(e.target.value)}
                    onBlur={() =>
                      setDeliveryDate((prev) => clampIsoDateToMin(prev, earliestISO))
                    }
                    aria-invalid={dateInvalid}
                    className={`box-border w-full min-w-0 ${inputBase} ${dateInvalid ? inputInvalid : inputNormal} py-3.5 pr-12 [color-scheme:light]`}
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted">
                    <CalendarGlyph />
                  </span>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-foreground">{f.priorityDateHook}</p>
              <div className="animate-meas-feedback space-y-3 rounded-2xl border border-[#e8dfd9] bg-[#fdf6f3] px-4 py-4 motion-reduce:animate-none">
                <p className="font-display text-base font-semibold leading-snug text-foreground">
                  {f.priorityLongTitle}
                </p>
                <p className="text-sm leading-relaxed text-muted">{f.priorityLongBody}</p>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-white/50 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={priorityMayNeed}
                    onChange={(e) => setPriorityMayNeed(e.target.checked)}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-border accent-accent"
                  />
                  <span className="text-sm font-medium text-foreground">{f.priorityCheckbox}</span>
                </label>
                {priorityImpliedByDate && !priorityMayNeed ? (
                  <p className="text-xs leading-relaxed text-muted">{f.priorityImpliedSoftNote}</p>
                ) : null}
              </div>
              {dateInvalid ? (
                <p className="text-sm text-red-700" role="alert">
                  {q.deliveryRequired}
                </p>
              ) : null}
              <p className="rounded-2xl bg-[#fdf8f6] px-4 py-3 text-sm text-muted">💡 {f.dateHelper}</p>
              {step === 3 && !deliveryDate.trim() ? (
                <p className="text-center text-xs text-muted">{f.dateStickyHint}</p>
              ) : null}
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-5">
              <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
                {f.screen4Title}{" "}
                <span className="text-base font-normal text-muted">{f.screen4Optional}</span>
              </h2>
              {isKidsPath ? (
                <div>
                  <label
                    htmlFor="wizard-child-age"
                    className="mb-2 block text-sm font-medium text-foreground"
                  >
                    {f.screen4ChildAgeLabel}
                    <span className="text-red-600"> *</span>
                  </label>
                  <input
                    id="wizard-child-age"
                    type="number"
                    inputMode="numeric"
                    min={5}
                    max={12}
                    step={1}
                    value={childAgeInput}
                    onChange={(e) => {
                      setChildAgeInput(e.target.value);
                      setChildAgeError(false);
                    }}
                    placeholder="e.g. 7"
                    aria-invalid={childAgeError}
                    className={`box-border w-full min-w-0 ${inputBase} ${childAgeError ? inputInvalid : inputNormal}`}
                  />
                  <p className="mt-1.5 text-xs text-muted">{f.screen4ChildAgeHint}</p>
                  {childAgeError ? (
                    <p className="mt-2 text-sm text-red-700" role="alert">
                      {f.screen4ChildAgeError}
                    </p>
                  ) : null}
                </div>
              ) : null}
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={q.notesPh}
                className={`${inputBase} ${inputNormal}`}
              />
              {!isKidsPath ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">{f.quickAdd}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {chips.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNotes((n) => appendNoteChip(n, c))}
                        className="rounded-full border border-accent/30 bg-[#fff9f8] px-4 py-2.5 text-sm font-medium text-accent-dark transition-all duration-200 hover:border-accent hover:shadow-sm active:scale-[0.98] motion-reduce:active:scale-100"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {step === 5 ? (
            <div className="space-y-5">
              <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
                {f.screen5Title}{" "}
                <span className="text-base font-normal text-muted">{f.screen5Optional}</span>
              </h2>
              <p className="text-sm text-muted">{f.screen5Helper}</p>
              <input
                type="tel"
                name="customerPhone"
                autoComplete="tel"
                inputMode="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="9876543210"
                className={`${inputBase} ${inputNormal}`}
              />
              <MeasurementLookupPanel
                phone={customerPhone}
                onSelectionChange={setMeasurementPayload}
                autoLookup
                embedded
              />
            </div>
          ) : null}

          {step === 6 && preparedMessage ? (
            <div className="space-y-6 text-center">
              <h2 className="font-display text-3xl font-semibold text-foreground">{f.finalTitle}</h2>
              <p className="text-base text-muted">{f.finalLead}</p>
              <ul className="mx-auto flex max-w-sm flex-col gap-2 text-left text-sm text-muted">
                <li className="flex gap-2">
                  <span className="text-accent-dark">✔</span>
                  {f.trustFast}
                </li>
                <li className="flex gap-2">
                  <span className="text-accent-dark">✔</span>
                  {f.trustPricing}
                </li>
                <li className="flex gap-2">
                  <span className="text-accent-dark">✔</span>
                  {f.trustNoHidden}
                </li>
                <li className="flex gap-2">
                  <span className="text-accent-dark">✔</span>
                  {f.trustPriority}
                </li>
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      {step === 5 && measurementStepNeedsChoice ? (
        <p className="mt-6 text-center text-sm text-muted">{f.measurementPickToContinue}</p>
      ) : null}

      {showNavRow ? (
        <div
          className={`mt-8 flex min-h-[52px] flex-wrap items-center gap-4 ${
            (showContinueBtn || showWhatsappBtn) && showBackBtn
              ? "justify-between"
              : showContinueBtn || showWhatsappBtn
                ? "justify-end"
                : "justify-start"
          }`}
        >
          {showBackBtn ? (
            <button
              type="button"
              onClick={step === 6 ? goBackFromFinal : goBack}
              className={`shrink-0 py-2 text-left text-sm font-medium underline-offset-4 hover:underline ${
                step === 2
                  ? "text-muted hover:text-foreground"
                  : "text-accent-dark"
              }`}
            >
              ← {f.backStep}
            </button>
          ) : null}
          {showContinueBtn ? (
            <Button
              type="button"
              variant="primary"
              className="min-h-[52px] min-w-[160px] px-8 text-base font-semibold sm:min-w-[200px]"
              disabled={continueDisabled}
              onClick={goNext}
            >
              {finalizing ? "…" : f.stickyContinue}
            </Button>
          ) : null}
          {showWhatsappBtn ? (
            <Button
              type="button"
              variant="primary"
              className="min-h-[52px] min-w-[160px] px-8 text-base font-semibold sm:min-w-[220px]"
              onClick={() => {
                window.location.href = buildWhatsAppUrl(preparedMessage!);
              }}
            >
              {f.stickyContinueWhatsapp}
            </Button>
          ) : null}
        </div>
      ) : null}

      <p className="mt-8 text-center text-sm text-muted">
        {q.switchToDetailed}{" "}
        <Link href={fullFormHref} className="font-medium text-accent hover:underline">
          {q.switchToDetailedLink}
        </Link>
      </p>
    </div>
  );
}
