"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { todayLocalISODate } from "@/lib/date-today";

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
import type { Order } from "@/lib/order/types";
import { quickRequestCopy as q, requestCopy } from "@/lib/request-copy";
import type { CatalogItem } from "@/lib/types";
import { isPhonePlausible } from "@/lib/orders/phone";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

type Props = {
  catalog: CatalogItem[];
  categoryLabel: string;
  pricingNotice: string;
};

function newOrderId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `ord-${Date.now()}`;
}

const inputBase =
  "w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition-colors focus:ring-2";
const inputNormal = "border-border ring-accent focus:ring-2";
const inputInvalid = "border-red-500 ring-1 ring-red-500/40 focus:border-red-500 focus:ring-red-500";

function CalendarGlyph({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={18}
      height={18}
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

export function QuickStitchRequestForm({ catalog, categoryLabel, pricingNotice }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const catalogIdFromUrl = searchParams.get("catalog") ?? undefined;
  const serviceFromUrl = searchParams.get("service") === "alteration" ? "alteration" : "stitching";

  const [orderId] = useState(newOrderId);
  const [serviceType, setServiceType] = useState<QuickServiceType>(serviceFromUrl);
  const [itemCount, setItemCount] = useState<QuickItemCount>("1");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [deliveryMin, setDeliveryMin] = useState("");
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [whatsappPendingMessage, setWhatsappPendingMessage] = useState<string | null>(null);
  const [customerPhone, setCustomerPhone] = useState("");
  const [measurementPayload, setMeasurementPayload] = useState<MeasurementSelectionPayload | null>(null);

  useEffect(() => {
    setDeliveryMin(todayLocalISODate());
  }, []);

  const selectedCatalogItem = useMemo(
    () => (catalogIdFromUrl ? catalog.find((c) => c.id === catalogIdFromUrl) : undefined),
    [catalog, catalogIdFromUrl],
  );

  const deliveryInvalid = submitAttempted && !deliveryDate.trim();

  useEffect(() => {
    if (!whatsappPendingMessage) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setWhatsappPendingMessage(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [whatsappPendingMessage]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!deliveryDate.trim()) {
      setSubmitAttempted(true);
      return;
    }

    const order: Order = {
      id: orderId,
      items: [],
    };

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
          preferredDeliveryDate: deliveryDate.trim(),
          notes,
          catalogId: selectedCatalogItem?.id,
          ...(isPhonePlausible(customerPhone) ? { customerPhone: customerPhone.trim() } : {}),
        }),
      });
      const data = (await res.json()) as { trackingUrl?: string };
      if (data.trackingUrl) trackingUrl = data.trackingUrl;
    } catch {
      /* still show handoff */
    }

    const measurementAppend =
      measurementPayload &&
      formatMeasurementsForWhatsApp(measurementPayload.items, measurementPayload.choices);
    const msg = buildQuickStitchWhatsAppMessage({
      order,
      catalog,
      serviceType,
      itemCount,
      preferredDeliveryDate: deliveryDate.trim(),
      notes,
      catalogId: selectedCatalogItem?.id,
      trackingUrl,
      measurementAppend: measurementAppend ?? undefined,
    });
    setWhatsappPendingMessage(msg);
  }

  const fullFormHref = useMemo(() => {
    const p = new URLSearchParams();
    p.set("full", "1");
    if (catalogIdFromUrl) p.set("catalog", catalogIdFromUrl);
    p.set("service", serviceType);
    return `/request?${p.toString()}`;
  }, [catalogIdFromUrl, serviceType]);

  return (
    <>
      {whatsappPendingMessage ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center"
          role="presentation"
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" aria-hidden />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="quick-handoff-title"
            className="relative z-[1] w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl sm:p-6"
          >
            <h2
              id="quick-handoff-title"
              className="font-display text-lg font-semibold text-foreground sm:text-xl"
            >
              {q.handoffTitle}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">{q.handoffLead}</p>
            <p className="mt-3 text-sm font-medium leading-relaxed text-foreground">{q.handoffBold}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse sm:justify-end">
              <Button
                type="button"
                className="w-full sm:w-auto"
                onClick={() => {
                  const msg = whatsappPendingMessage;
                  setWhatsappPendingMessage(null);
                  window.location.href = buildWhatsAppUrl(msg);
                }}
              >
                {q.continueWhatsapp}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={() => setWhatsappPendingMessage(null)}
              >
                {q.backEdit}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6" noValidate>
        <div className="rounded-2xl border border-amber-200/70 bg-amber-50/40 p-5 shadow-sm sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-900/75">
            {categoryLabel}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-amber-950/90">{pricingNotice}</p>
        </div>

        {selectedCatalogItem ? (
          <div className="rounded-2xl border border-accent/30 bg-[#fff9f8] px-4 py-3 text-sm text-foreground">
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

        {deliveryInvalid ? (
          <div
            className="rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-900"
            role="alert"
          >
            {q.deliveryRequired}
          </div>
        ) : null}

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6 space-y-5">
          <div>
            <label className="text-sm font-medium text-foreground" htmlFor="quick-phone">
              {q.measurementPhoneLabel}{" "}
              <span className="font-normal text-muted">{q.notesOptional}</span>
            </label>
            <input
              id="quick-phone"
              type="tel"
              name="customerPhone"
              autoComplete="tel"
              inputMode="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="e.g. 9876543210 or 919876543210"
              className={`mt-2 ${inputBase} ${inputNormal}`}
            />
            <p className="mt-1 text-xs text-muted">{q.measurementPhoneHint}</p>
            <div className="mt-4">
              <MeasurementLookupPanel phone={customerPhone} onSelectionChange={setMeasurementPayload} />
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-foreground">{q.serviceLabel}</p>
            <div className="mt-2 flex gap-2">
              {(
                [
                  ["stitching", requestCopy.stitching],
                  ["alteration", requestCopy.alteration],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setServiceType(value)}
                  className={`flex-1 rounded-xl border px-3 py-3 text-sm font-medium transition sm:flex-none sm:px-5 ${
                    serviceType === value
                      ? "border-accent bg-[#fff9f8] text-accent-dark"
                      : "border-border bg-background text-muted hover:border-accent/30"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-foreground">{q.itemsLabel}</p>
            <div className="mt-2 flex gap-2">
              {(
                [
                  ["1", q.item1],
                  ["2", q.item2],
                  ["3plus", q.item3plus],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setItemCount(value)}
                  className={`min-h-11 flex-1 rounded-xl border px-2 py-2 text-sm font-semibold transition ${
                    itemCount === value
                      ? "border-accent bg-[#fff9f8] text-accent-dark"
                      : "border-border bg-background text-muted hover:border-accent/30"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground" htmlFor="quick-delivery">
              {q.deliveryLabel} *
            </label>
            <div className="relative mt-2 w-full min-w-0">
              <input
                id="quick-delivery"
                type="date"
                min={deliveryMin || undefined}
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                aria-invalid={deliveryInvalid}
                className={`box-border ${inputBase} ${deliveryInvalid ? inputInvalid : inputNormal} w-full min-w-0 max-w-full py-3 pl-4 pr-11 [color-scheme:light]`}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 z-[1] -translate-y-1/2 text-muted opacity-80">
                <CalendarGlyph />
              </span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground" htmlFor="quick-notes">
              {q.notesLabel}{" "}
              <span className="font-normal text-muted">{q.notesOptional}</span>
            </label>
            <textarea
              id="quick-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={q.notesPh}
              className={`mt-2 ${inputBase} ${inputNormal}`}
            />
          </div>
        </div>

        <Button type="submit" className="w-full sm:w-auto">
          {q.submit}
        </Button>

        <p className="text-center text-sm text-muted">
          {q.switchToDetailed}{" "}
          <Link href={fullFormHref} className="font-medium text-accent hover:underline">
            {q.switchToDetailedLink}
          </Link>
        </p>
      </form>
    </>
  );
}
