"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";

import { clampIsoDateToMin, todayLocalISODate } from "@/lib/date-today";

import { MeasurementLookupPanel } from "@/components/measurements/MeasurementLookupPanel";
import {
  formatMeasurementsForWhatsApp,
  preferenceCodeFromChoice,
} from "@/lib/measurements/format-whatsapp";
import type { MeasurementSelectionPayload } from "@/lib/measurements/format-whatsapp";
import { Button } from "@/components/ui/Button";
import {
  createAlterationItem,
  createItemForService,
  createStitchingItem,
} from "@/lib/order/factory";
import { buildMultiItemOrderMessage } from "@/lib/order/whatsapp";
import type {
  AlterationOrderItem,
  DesignSource,
  Order,
  OrderItem,
  StitchingOrderItem,
} from "@/lib/order/types";
import type { ItemErrors } from "@/lib/order/validate-service-request";
import { validateServiceRequestForm } from "@/lib/order/validate-service-request";
import { alterationTypeLabels, requestCopy as t, requestValidationMessages } from "@/lib/request-copy";
import type { AlterationType, CatalogItem } from "@/lib/types";
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

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-sm text-red-700" role="alert">
      {message}
    </p>
  );
}

function emitDateInputChange(
  e: ChangeEvent<HTMLInputElement>,
  next: string,
  onChange: (e: ChangeEvent<HTMLInputElement>) => void,
) {
  if (next === e.target.value) {
    onChange(e);
    return;
  }
  onChange({
    ...e,
    target: { ...e.target, value: next },
    currentTarget: { ...e.currentTarget, value: next },
  } as ChangeEvent<HTMLInputElement>);
}

/** Calendar icon for date fields — iOS Safari often omits desktop-style picker chrome. */
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

function DatePickerField({
  id,
  label,
  min,
  value,
  onChange,
  invalid,
  errorId,
}: {
  id: string;
  label: string;
  min?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  invalid?: boolean;
  errorId?: string;
}) {
  return (
    <div className="min-w-0">
      <label className="text-sm font-medium text-foreground" htmlFor={id}>
        {label}
      </label>
      <div className="relative mt-2 w-full min-w-0">
        <input
          id={id}
          type="date"
          min={min}
          value={value}
          onChange={(e) => {
            const raw = e.target.value;
            const next = min ? clampIsoDateToMin(raw, min) : raw;
            emitDateInputChange(e, next, onChange);
          }}
          onBlur={(e) => {
            if (!min || !value) return;
            const next = clampIsoDateToMin(value, min);
            if (next === value) return;
            onChange({
              ...e,
              target: { ...e.target, value: next },
              currentTarget: { ...e.currentTarget, value: next },
            } as ChangeEvent<HTMLInputElement>);
          }}
          required
          aria-invalid={invalid}
          aria-describedby={invalid && errorId ? errorId : undefined}
          className={`box-border ${inputBase} ${invalid ? inputInvalid : inputNormal} w-full min-w-0 max-w-full py-3 pl-4 pr-11 [color-scheme:light]`}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 z-[1] -translate-y-1/2 text-muted opacity-80">
          <CalendarGlyph />
        </span>
      </div>
    </div>
  );
}

export function ServiceRequestForm({ catalog, categoryLabel, pricingNotice }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultService =
    searchParams.get("service") === "alteration" ? "alteration" : "stitching";
  const defaultCatalogId = searchParams.get("catalog") ?? undefined;

  const [orderId] = useState(newOrderId);
  const [items, setItems] = useState<OrderItem[]>(() => [
    createItemForService(defaultService, {
      catalogId: defaultCatalogId,
      designSource: defaultCatalogId ? "catalog" : undefined,
    }),
  ]);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [deliveryMin] = useState(() => todayLocalISODate());
  /** Built after successful submit; opening WhatsApp clears it */
  const [whatsappPendingMessage, setWhatsappPendingMessage] = useState<string | null>(null);
  const [measurementPayload, setMeasurementPayload] = useState<MeasurementSelectionPayload | null>(null);

  const validation = useMemo(
    () =>
      validateServiceRequestForm(
        customerName,
        customerPhone,
        items,
        requestValidationMessages,
        measurementPayload,
      ),
    [customerName, customerPhone, items, measurementPayload],
  );

  const showErrors = submitAttempted && !validation.ok;

  const handoffExtras = useMemo(() => {
    let upload = false;
    let alteration = false;
    let catalog = false;
    for (const item of items) {
      if (item.service === "stitching") {
        const s = item as StitchingOrderItem;
        if (s.designSource === "upload") upload = true;
        if (s.designSource === "catalog" || s.designSource === "describe") catalog = true;
      } else if (item.garmentImageName?.trim()) {
        alteration = true;
      }
    }
    return { upload, alteration, catalog };
  }, [items]);

  useEffect(() => {
    if (!whatsappPendingMessage) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setWhatsappPendingMessage(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [whatsappPendingMessage]);

  const setServiceForItem = useCallback((id: string, service: "stitching" | "alteration") => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        if (service === "stitching") {
          return { ...createStitchingItem(), id };
        }
        return { ...createAlterationItem(), id };
      }),
    );
  }, []);

  const updateItem = useCallback((id: string, patch: Partial<OrderItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? ({ ...item, ...patch } as OrderItem) : item)),
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const addItem = useCallback(() => {
    setItems((prev) => [...prev, createStitchingItem()]);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validation.ok) {
      setSubmitAttempted(true);
      return;
    }
    const order: Order = { id: orderId, items };
    const customer = {
      name: customerName.trim(),
      phone: customerPhone.trim(),
      requestedDeliveryDate: todayLocalISODate(),
    };

    try {
      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: orderId,
          customerName: customer.name,
          customerPhone: customer.phone,
          requestedDeliveryDate: customer.requestedDeliveryDate,
          items,
          ...(measurementPayload?.selectionComplete
            ? {
                measurementPreferences: Object.fromEntries(
                  measurementPayload.items.map((i) => {
                    const ch = measurementPayload.choices[i.garmentType];
                    return [
                      i.garmentType,
                      preferenceCodeFromChoice(ch === "update" ? "update" : "use"),
                    ];
                  }),
                ) as Record<string, "USE_SAVED" | "UPDATE_REQUIRED">,
                measurementLastSavedAt: measurementPayload.lastMeasurementDatesByGarment,
              }
            : {}),
        }),
      });
    } catch {
      /* still open WhatsApp */
    }

    const measurementAppend =
      measurementPayload?.selectionComplete
        ? formatMeasurementsForWhatsApp(measurementPayload.items, measurementPayload.choices)
        : null;
    const msg = buildMultiItemOrderMessage(order, catalog, customer, {
      measurementAppend: measurementAppend ?? undefined,
    });
    setWhatsappPendingMessage(msg);
  }

  return (
    <>
    {whatsappPendingMessage ? (
      <div
        className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center"
        role="presentation"
      >
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
          aria-hidden
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="handoff-title"
          className="relative z-[1] w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl sm:p-6"
        >
          <h2 id="handoff-title" className="font-display text-lg font-semibold text-foreground sm:text-xl">
            {t.handoffTitle}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">{t.handoffLead}</p>
          <p className="mt-3 text-sm font-medium leading-relaxed text-foreground">{t.handoffAttachBold}</p>
          {handoffExtras.upload ? (
            <p className="mt-3 text-sm leading-relaxed text-muted">{t.handoffUploadExtra}</p>
          ) : null}
          {handoffExtras.alteration ? (
            <p className="mt-3 text-sm leading-relaxed text-muted">{t.handoffAlterationExtra}</p>
          ) : null}
          {handoffExtras.catalog ? (
            <p className="mt-3 text-sm leading-relaxed text-muted">{t.handoffCatalogExtra}</p>
          ) : null}
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
              {t.handoffOpenWhatsapp}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={() => setWhatsappPendingMessage(null)}
            >
              {t.handoffBackToForm}
            </Button>
          </div>
        </div>
      </div>
    ) : null}

    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      <div className="rounded-2xl border border-amber-200/70 bg-amber-50/40 p-5 shadow-sm sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-900/75">
          {categoryLabel}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-amber-950/90">{pricingNotice}</p>
      </div>

      {showErrors ? (
        <div
          className="rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-900"
          role="alert"
        >
          {t.formErrorSummary}
        </div>
      ) : null}

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <h2 className="font-display text-xl font-semibold text-foreground">{t.customerSection}</h2>
        <p className="mt-2 text-sm text-muted">{t.customerHint}</p>
        <p className="mt-1 text-xs text-muted">{t.requiredLegend}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-1">
            <label className="text-sm font-medium text-foreground" htmlFor="cust-name">
              {t.customerName} {t.requiredSuffix}
            </label>
            <input
              id="cust-name"
              name="customerName"
              autoComplete="name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              aria-invalid={showErrors && Boolean(validation.customer.name)}
              aria-describedby={showErrors && validation.customer.name ? "err-cust-name" : undefined}
              className={`mt-2 ${inputBase} ${showErrors && validation.customer.name ? inputInvalid : inputNormal}`}
            />
            <FieldError id="err-cust-name" message={showErrors ? validation.customer.name : undefined} />
          </div>
          <div className="sm:col-span-1">
            <label className="text-sm font-medium text-foreground" htmlFor="cust-phone">
              {t.customerPhone} {t.requiredSuffix}
            </label>
            <input
              id="cust-phone"
              name="customerPhone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              aria-invalid={showErrors && Boolean(validation.customer.phone)}
              aria-describedby={showErrors && validation.customer.phone ? "err-cust-phone" : undefined}
              className={`mt-2 ${inputBase} ${showErrors && validation.customer.phone ? inputInvalid : inputNormal}`}
            />
            <FieldError id="err-cust-phone" message={showErrors ? validation.customer.phone : undefined} />
          </div>
          <div className="sm:col-span-2">
            <MeasurementLookupPanel
              phone={customerPhone}
              onSelectionChange={setMeasurementPayload}
              autoLookup
            />
            <FieldError
              id="err-measurement-choice"
              message={showErrors ? validation.customer.measurement : undefined}
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <h2 className="font-display text-xl font-semibold text-foreground">{t.reviewTitle}</h2>
        <p className="mt-1 text-sm text-muted">
          {items.length} {items.length === 1 ? "item" : "items"}
        </p>

        <ul className="mt-6 space-y-6">
          {items.map((item, index) => {
            const itemErr = validation.itemErrors[item.id];
            const showItemErrors = showErrors && itemErr;
            return (
              <li
                key={item.id}
                className="min-w-0 rounded-2xl border border-border bg-background/80 p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    {t.itemLabel(index + 1)}
                  </h3>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="text-sm font-medium text-accent-dark underline-offset-4 hover:underline"
                    disabled={items.length <= 1}
                    aria-disabled={items.length <= 1}
                  >
                    {t.remove}
                  </button>
                </div>

                <div className="mt-4">
                  <p className="text-sm font-medium text-foreground">
                    {t.serviceType} {t.requiredSuffix}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-3">
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name={`service-${item.id}`}
                        checked={item.service === "stitching"}
                        onChange={() => setServiceForItem(item.id, "stitching")}
                        className="accent-accent"
                      />
                      {t.stitching}
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name={`service-${item.id}`}
                        checked={item.service === "alteration"}
                        onChange={() => setServiceForItem(item.id, "alteration")}
                        className="accent-accent"
                      />
                      {t.alteration}
                    </label>
                  </div>
                </div>

                {item.service === "stitching" ? (
                  <StitchingFields
                    item={item}
                    catalog={catalog}
                    deliveryMin={deliveryMin}
                    errors={showItemErrors ? itemErr : undefined}
                    onChange={(patch) => updateItem(item.id, patch)}
                    onBrowseGallery={() => router.push("/gallery")}
                  />
                ) : (
                  <AlterationFields
                    item={item}
                    deliveryMin={deliveryMin}
                    errors={showItemErrors ? itemErr : undefined}
                    onChange={(patch) => updateItem(item.id, patch)}
                  />
                )}
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          onClick={addItem}
          className="mt-6 w-full rounded-xl border border-dashed border-accent/50 bg-[#fff9f8] py-3 text-sm font-semibold text-accent-dark transition hover:bg-[#fff4f2] sm:w-auto sm:px-6"
        >
          + {t.addItem}
        </button>
      </div>

      <Button type="submit" className="w-full sm:w-auto">
        {t.submit}
      </Button>
    </form>
    </>
  );
}

function StitchingFields({
  item,
  catalog,
  deliveryMin,
  errors,
  onChange,
  onBrowseGallery,
}: {
  item: StitchingOrderItem;
  catalog: CatalogItem[];
  deliveryMin: string;
  errors?: ItemErrors;
  onChange: (p: Partial<StitchingOrderItem>) => void;
  onBrowseGallery: () => void;
}) {
  const setSource = (designSource: DesignSource) => {
    onChange({
      designSource,
      catalogId: designSource === "catalog" ? item.catalogId : undefined,
      referenceFileName: designSource === "upload" ? item.referenceFileName : undefined,
      describeText: designSource === "describe" ? item.describeText : undefined,
    });
  };

  const hasDesignErr = Boolean(errors?.designReference);
  const hasDeliveryErr = Boolean(errors?.deliveryDate);

  return (
    <div className="mt-4 min-w-0 space-y-4">
      <div>
        <p className="text-sm font-medium text-foreground">
          {t.designSource} {t.requiredSuffix}
        </p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {(
            [
              ["catalog", t.fromCatalog],
              ["upload", t.uploadRef],
              ["describe", t.describe],
            ] as const
          ).map(([value, label]) => (
            <label
              key={value}
              className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                item.designSource === value
                  ? "border-accent bg-[#fff9f8]"
                  : "border-border bg-card"
              }`}
            >
              <input
                type="radio"
                name={`src-${item.id}`}
                checked={item.designSource === value}
                onChange={() => setSource(value)}
                className="accent-accent"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      {item.designSource === "catalog" ? (
        <div>
          <label className="text-sm font-medium text-foreground" htmlFor={`cat-${item.id}`}>
            {t.catalogSelect} {t.requiredSuffix}
          </label>
          <select
            id={`cat-${item.id}`}
            value={item.catalogId ?? ""}
            onChange={(e) => onChange({ catalogId: e.target.value })}
            aria-invalid={hasDesignErr && item.designSource === "catalog"}
            aria-describedby={hasDesignErr && item.designSource === "catalog" ? `err-${item.id}-design` : undefined}
            className={`mt-2 ${inputBase} ${hasDesignErr && item.designSource === "catalog" ? inputInvalid : inputNormal}`}
          >
            <option value="">{t.selectDesign}</option>
            {catalog.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="mt-2 text-sm font-medium text-accent-dark underline-offset-4 hover:underline"
            onClick={onBrowseGallery}
          >
            {t.browseGallery}
          </button>
          <FieldError id={`err-${item.id}-design`} message={errors?.designReference} />
        </div>
      ) : null}

      {item.designSource === "upload" ? (
        <div>
          <label className="text-sm font-medium text-foreground" htmlFor={`file-${item.id}`}>
            {t.referenceFile} {t.requiredSuffix}
          </label>
          <input
            id={`file-${item.id}`}
            type="file"
            accept="image/*"
            aria-invalid={hasDesignErr && item.designSource === "upload"}
            aria-describedby={
              hasDesignErr && item.designSource === "upload" ? `err-${item.id}-design-upload` : undefined
            }
            className={`mt-2 block w-full min-w-0 max-w-full text-sm text-muted file:mr-4 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-accent-dark ${hasDesignErr && item.designSource === "upload" ? "rounded-xl ring-1 ring-red-500/40" : ""}`}
            onChange={(e) =>
              onChange({ referenceFileName: e.target.files?.[0]?.name })
            }
          />
          <p className="mt-2 text-xs text-muted">{t.fileHintStitching}</p>
          <FieldError id={`err-${item.id}-design-upload`} message={errors?.designReference} />
        </div>
      ) : null}

      {item.designSource === "describe" ? (
        <div>
          <label className="text-sm font-medium text-foreground" htmlFor={`desc-${item.id}`}>
            {t.describeLabel} {t.optionalTag}
          </label>
          <textarea
            id={`desc-${item.id}`}
            value={item.describeText ?? ""}
            onChange={(e) => onChange({ describeText: e.target.value })}
            rows={3}
            className={`mt-2 ${inputBase} ${inputNormal}`}
            placeholder={t.describePh}
          />
        </div>
      ) : null}

      <div>
        <label className="text-sm font-medium text-foreground" htmlFor={`notes-${item.id}`}>
          {t.notes} {t.optionalTag}
        </label>
        <textarea
          id={`notes-${item.id}`}
          value={item.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          rows={3}
          className={`mt-2 ${inputBase} ${inputNormal}`}
          placeholder={t.notesPh}
        />
      </div>

      <div>
        <DatePickerField
          id={`del-${item.id}`}
          label={`${t.preferredDelivery} ${t.requiredSuffix}`}
          min={deliveryMin}
          value={item.deliveryPreference ?? ""}
          onChange={(e) => onChange({ deliveryPreference: e.target.value || undefined })}
          invalid={hasDeliveryErr}
          errorId={`err-${item.id}-delivery`}
        />
        <FieldError id={`err-${item.id}-delivery`} message={errors?.deliveryDate} />
      </div>
    </div>
  );
}

function AlterationFields({
  item,
  deliveryMin,
  errors,
  onChange,
}: {
  item: AlterationOrderItem;
  deliveryMin: string;
  errors?: ItemErrors;
  onChange: (p: Partial<AlterationOrderItem>) => void;
}) {
  const hasDeliveryErr = Boolean(errors?.deliveryDate);

  return (
    <div className="mt-4 min-w-0 space-y-4">
      <div>
        <label className="text-sm font-medium text-foreground" htmlFor={`atype-${item.id}`}>
          {t.alterationType} {t.requiredSuffix}
        </label>
        <select
          id={`atype-${item.id}`}
          value={item.alterationType}
          onChange={(e) =>
            onChange({ alterationType: e.target.value as AlterationType })
          }
          className={`mt-2 ${inputBase} ${inputNormal}`}
        >
          {(Object.keys(alterationTypeLabels) as AlterationType[]).map((k) => (
            <option key={k} value={k}>
              {alterationTypeLabels[k]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground" htmlFor={`gph-${item.id}`}>
          {t.garmentPhoto}
        </label>
        <input
          id={`gph-${item.id}`}
          type="file"
          accept="image/*"
          className="mt-2 block w-full min-w-0 max-w-full text-sm text-muted file:mr-4 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-accent-dark"
          onChange={(e) => onChange({ garmentImageName: e.target.files?.[0]?.name })}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-foreground" htmlFor={`anotes-${item.id}`}>
          {t.notes} {t.optionalTag}
        </label>
        <textarea
          id={`anotes-${item.id}`}
          value={item.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          rows={4}
          className={`mt-2 ${inputBase} ${inputNormal}`}
          placeholder={t.altNotesPh}
        />
      </div>

      <div>
        <DatePickerField
          id={`adate-${item.id}`}
          label={`${t.preferredDelivery} ${t.requiredSuffix}`}
          min={deliveryMin}
          value={item.deliveryPreference ?? ""}
          onChange={(e) => onChange({ deliveryPreference: e.target.value || undefined })}
          invalid={hasDeliveryErr}
          errorId={`err-alt-${item.id}-delivery`}
        />
        <FieldError id={`err-alt-${item.id}-delivery`} message={errors?.deliveryDate} />
      </div>
    </div>
  );
}
