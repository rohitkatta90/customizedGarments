"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { addCalendarDaysLocal, todayLocalISODate } from "@/lib/date-today";

import {
  MeasurementLookupPanel,
  type MeasurementSelectionPayload,
} from "@/components/measurements/MeasurementLookupPanel";
import { Button } from "@/components/ui/Button";
import { formatMeasurementsForWhatsApp } from "@/lib/measurements/format-whatsapp";
import {
  buildQuickStitchWhatsAppMessage,
  type QuickItemCount,
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
/** Auto-advance after quick pick 1 or 2 pieces (step 2). */
const STEP2_QUICK_ADVANCE_MS = 280;

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

export function QuickStitchRequestForm({ catalog, categoryLabel, pricingNotice }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const catalogIdFromUrl = searchParams.get("catalog") ?? undefined;
  const serviceFromUrl = searchParams.get("service") === "alteration" ? "alteration" : "stitching";

  const [orderId] = useState(newOrderId);
  const [step, setStep] = useState(1);
  const [serviceType, setServiceType] = useState<QuickServiceType>(serviceFromUrl);
  const [pieces, setPieces] = useState(1);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryMin, setDeliveryMin] = useState("");
  const [notes, setNotes] = useState("");
  const [dateTouched, setDateTouched] = useState(false);
  const [customerPhone, setCustomerPhone] = useState("");
  const [priorityMayNeed, setPriorityMayNeed] = useState(false);
  const [measurementPayload, setMeasurementPayload] = useState<MeasurementSelectionPayload | null>(null);
  const [preparedMessage, setPreparedMessage] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);

  const step2AdvanceRef = useRef<number | null>(null);

  const clearStep2Advance = useCallback(() => {
    if (step2AdvanceRef.current != null) {
      window.clearTimeout(step2AdvanceRef.current);
      step2AdvanceRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (step !== 2) clearStep2Advance();
  }, [step, clearStep2Advance]);

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
    setDeliveryMin(earliestISO);
  }, [earliestISO]);

  const itemCount = piecesToQuickCount(pieces);

  const selectedCatalogItem = useMemo(
    () => (catalogIdFromUrl ? catalog.find((c) => c.id === catalogIdFromUrl) : undefined),
    [catalog, catalogIdFromUrl],
  );

  const dateInvalid = dateTouched && step === 3 && !deliveryDate.trim();

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
    return `/request?${p.toString()}`;
  }, [catalogIdFromUrl, serviceType]);

  const finalize = useCallback(async () => {
    if (!deliveryDate.trim()) return;
    setFinalizing(true);
    const order: Order = { id: orderId, items: [] };
    let trackingUrl: string | undefined;
    try {
      const res = await fetch("/api/orders", {
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
        }),
      });
      const data = (await res.json()) as { trackingUrl?: string };
      if (data.trackingUrl) trackingUrl = data.trackingUrl;
    } catch {
      /* still hand off */
    }

    const measurementAppend =
      measurementPayload &&
      formatMeasurementsForWhatsApp(measurementPayload.items, measurementPayload.choices);
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
      trackingUrl,
      measurementAppend: measurementAppend ?? undefined,
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
  ]);

  function chooseQuickPieceCount(n: 1 | 2) {
    if (step !== 2) return;
    clearStep2Advance();
    setPieces(n);
    if (reduceMotion) return;
    step2AdvanceRef.current = window.setTimeout(() => {
      step2AdvanceRef.current = null;
      setStep((s) => (s === 2 ? 3 : s));
    }, STEP2_QUICK_ADVANCE_MS);
  }

  function chooseManyPiecesMode() {
    if (step !== 2) return;
    clearStep2Advance();
    setPieces((p) => (p < 3 ? 3 : p));
  }

  function bumpManyPieces(delta: number) {
    if (step !== 2) return;
    clearStep2Advance();
    setPieces((p) => Math.max(3, p + delta));
  }

  function selectService(type: QuickServiceType) {
    setServiceType(type);
  }

  function onDeliveryDateChange(value: string) {
    setDeliveryDate(value);
    setDateTouched(true);
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
      if (!deliveryDate.trim()) return;
      setStep(4);
      return;
    }
    if (step === 4) {
      setStep(5);
      return;
    }
    if (step === 5) {
      void finalize();
    }
  }

  function goBack() {
    clearStep2Advance();
    if (step > 1 && step < 6) {
      setStep((s) => s - 1);
    }
  }

  function goBackFromFinal() {
    setPreparedMessage(null);
    setStep(5);
  }

  const chips = [f.chipDeepBack, f.chipElbow, f.chipStraight] as const;

  const continueDisabled = (step === 3 && !deliveryDate.trim()) || finalizing;
  const showBackBtn = step >= 2 && (step < 6 || Boolean(preparedMessage));
  /** Step 2: Continue only for 3+ (explicit count) or reduced-motion; 1–2 auto-advance on tap. */
  const showContinueBtn =
    step >= 1 &&
    step <= 5 &&
    (step !== 2 || reduceMotion || pieces >= 3);
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
              <div className="grid gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => selectService("stitching")}
                  className={`flex min-h-[120px] w-full flex-col items-start rounded-2xl border-2 p-6 text-left shadow-sm transition-all duration-200 ease-out active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 ${
                    serviceType === "stitching"
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
                <button
                  type="button"
                  onClick={() => selectService("alteration")}
                  className={`flex min-h-[120px] w-full flex-col items-start rounded-2xl border-2 p-6 text-left shadow-sm transition-all duration-200 ease-out active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 ${
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
                    min={deliveryMin || undefined}
                    value={deliveryDate}
                    onChange={(e) => onDeliveryDateChange(e.target.value)}
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
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={q.notesPh}
                className={`${inputBase} ${inputNormal}`}
              />
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
