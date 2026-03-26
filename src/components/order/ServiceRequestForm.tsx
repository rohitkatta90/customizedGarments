"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { todayLocalISODate } from "@/lib/date-today";

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
  const [deliveryMin, setDeliveryMin] = useState("");

  useEffect(() => {
    setDeliveryMin(todayLocalISODate());
  }, []);

  const validation = useMemo(
    () =>
      validateServiceRequestForm(customerName, customerPhone, items, requestValidationMessages),
    [customerName, customerPhone, items],
  );

  const showErrors = submitAttempted && !validation.ok;

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

    let trackingUrl: string | undefined;
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: orderId,
          customerName: customer.name,
          customerPhone: customer.phone,
          requestedDeliveryDate: customer.requestedDeliveryDate,
          items,
        }),
      });
      const data = (await res.json()) as { trackingUrl?: string };
      if (data.trackingUrl) trackingUrl = data.trackingUrl;
    } catch {
      /* still open WhatsApp */
    }

    const msg = buildMultiItemOrderMessage(order, catalog, customer, { trackingUrl });
    window.location.href = buildWhatsAppUrl(msg);
  }

  return (
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
                className="rounded-2xl border border-border bg-background/80 p-4 sm:p-5"
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

  return (
    <div className="mt-4 space-y-4">
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
            className={`mt-2 block w-full text-sm text-muted file:mr-4 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-accent-dark ${hasDesignErr && item.designSource === "upload" ? "rounded-xl ring-1 ring-red-500/40" : ""}`}
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
        <label className="text-sm font-medium text-foreground" htmlFor={`del-${item.id}`}>
          {t.deliveryOptional} {t.optionalTag}
        </label>
        <input
          id={`del-${item.id}`}
          type="date"
          min={deliveryMin || undefined}
          value={item.deliveryPreference ?? ""}
          onChange={(e) => onChange({ deliveryPreference: e.target.value || undefined })}
          className={`mt-2 ${inputBase} ${inputNormal}`}
        />
      </div>
    </div>
  );
}

function AlterationFields({
  item,
  deliveryMin,
  onChange,
}: {
  item: AlterationOrderItem;
  deliveryMin: string;
  onChange: (p: Partial<AlterationOrderItem>) => void;
}) {
  return (
    <div className="mt-4 space-y-4">
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
          {t.garmentPhoto} {t.optionalTag}
        </label>
        <input
          id={`gph-${item.id}`}
          type="file"
          accept="image/*"
          className="mt-2 block w-full text-sm text-muted file:mr-4 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-accent-dark"
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
        <label className="text-sm font-medium text-foreground" htmlFor={`adate-${item.id}`}>
          {t.altDatePh} {t.optionalTag}
        </label>
        <input
          id={`adate-${item.id}`}
          type="date"
          min={deliveryMin || undefined}
          value={item.deliveryPreference ?? ""}
          onChange={(e) => onChange({ deliveryPreference: e.target.value || undefined })}
          className={`mt-2 ${inputBase} ${inputNormal}`}
        />
      </div>
    </div>
  );
}
