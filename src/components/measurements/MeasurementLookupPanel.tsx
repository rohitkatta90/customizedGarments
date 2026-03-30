"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import type { GarmentMeasurementChoice } from "@/lib/measurements/format-whatsapp";
import { measurementUiCopy as m } from "@/lib/measurements/ui-copy";
import type { LatestMeasurementByGarment } from "@/lib/measurements/types";
import { isPhonePlausible, normalizePhone } from "@/lib/orders/phone";

export type MeasurementSelectionPayload = {
  items: LatestMeasurementByGarment[];
  choices: Record<string, GarmentMeasurementChoice>;
};

type Props = {
  phone: string;
  /** Called when lookup completes or choices change; null = no measurement block in WhatsApp */
  onSelectionChange: (payload: MeasurementSelectionPayload | null) => void;
};

export function MeasurementLookupPanel({ phone, onSelectionChange }: Props) {
  const [phase, setPhase] = useState<"idle" | "loading" | "ready">("idle");
  const [configured, setConfigured] = useState(true);
  const [items, setItems] = useState<LatestMeasurementByGarment[]>([]);
  const [choices, setChoices] = useState<Record<string, GarmentMeasurementChoice>>({});
  const [error, setError] = useState<string | null>(null);
  const [snapDigits, setSnapDigits] = useState("");

  const valid = isPhonePlausible(phone);
  const digits = normalizePhone(phone);
  const stale = Boolean(snapDigits && digits !== snapDigits);

  function emit(list: LatestMeasurementByGarment[], ch: Record<string, GarmentMeasurementChoice>) {
    if (!list.length) {
      onSelectionChange(null);
      return;
    }
    onSelectionChange({ items: list, choices: ch });
  }

  async function lookup() {
    if (!valid) return;
    setPhase("loading");
    setError(null);
    setItems([]);
    onSelectionChange(null);
    try {
      const res = await fetch("/api/measurements/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        configured?: boolean;
        latestByGarment?: LatestMeasurementByGarment[];
        error?: string;
      };

      if (!res.ok) {
        if (data.error === "rate_limited") setError(m.rateLimited);
        else setError(m.errorGeneric);
        setPhase("idle");
        return;
      }

      if (!data.configured) {
        setConfigured(false);
        setItems([]);
        setPhase("ready");
        setSnapDigits(digits);
        onSelectionChange(null);
        return;
      }

      setConfigured(true);
      const list = Array.isArray(data.latestByGarment) ? data.latestByGarment : [];
      setItems(list);
      const init: Record<string, GarmentMeasurementChoice> = {};
      for (const it of list) init[it.garmentType] = "use";
      setChoices(init);
      setPhase("ready");
      setSnapDigits(digits);
      emit(list, init);
    } catch {
      setError(m.errorGeneric);
      setPhase("idle");
    }
  }

  function setChoice(garmentType: string, c: GarmentMeasurementChoice) {
    setChoices((prev) => {
      const next = { ...prev, [garmentType]: c };
      emit(items, next);
      return next;
    });
  }

  const hasKids = items.some((i) => i.garmentType.startsWith("Kids"));

  return (
    <div className="rounded-2xl border border-border bg-background/60 p-4 sm:p-5">
      <h3 className="font-display text-base font-semibold text-foreground">{m.sectionTitle}</h3>
      <p className="mt-1 text-xs text-muted">{m.sectionHint}</p>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button
          type="button"
          variant="secondary"
          className="w-full sm:w-auto"
          disabled={!valid || phase === "loading"}
          onClick={() => void lookup()}
        >
          {phase === "loading" ? m.searching : m.findButton}
        </Button>
        {stale && phase === "ready" ? (
          <span className="text-xs text-amber-800">Phone changed — tap Find again to refresh.</span>
        ) : null}
      </div>

      {error ? (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {phase === "ready" && !configured ? (
        <p className="mt-3 text-sm text-muted">{m.notConfigured}</p>
      ) : null}

      {phase === "ready" && configured && !items.length ? (
        <p className="mt-3 text-sm text-muted">{m.notFound}</p>
      ) : null}

      {phase === "ready" && items.length > 0 ? (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-foreground">{m.foundIntro}</p>
          {hasKids ? <p className="text-xs text-amber-900/90">{m.kidsHint}</p> : null}
          {items.map((row) => (
            <div
              key={row.garmentType}
              className="rounded-xl border border-border bg-card p-3 text-sm shadow-sm"
            >
              <p className="font-medium text-foreground">
                {m.perGarmentDate(row.garmentType, row.recordedAtDisplay)}
              </p>
              {row.customerName ? (
                <p className="mt-0.5 text-xs text-muted">Name on file: {row.customerName}</p>
              ) : null}
              <ul className="mt-2 space-y-0.5 text-xs text-muted">
                {Object.entries(row.measurements).map(([k, v]) => (
                  <li key={k}>
                    <span className="text-foreground">{k}:</span> {v}
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <label className="flex cursor-pointer items-center gap-2 text-xs sm:text-sm">
                  <input
                    type="radio"
                    name={`meas-${row.garmentType}`}
                    checked={(choices[row.garmentType] ?? "use") === "use"}
                    onChange={() => setChoice(row.garmentType, "use")}
                    className="accent-accent"
                  />
                  {m.useThese}
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-xs sm:text-sm">
                  <input
                    type="radio"
                    name={`meas-${row.garmentType}`}
                    checked={choices[row.garmentType] === "update"}
                    onChange={() => setChoice(row.garmentType, "update")}
                    className="accent-accent"
                  />
                  {m.updateInWhatsApp}
                </label>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
