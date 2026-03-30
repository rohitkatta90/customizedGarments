"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
  /** Debounced auto-fetch when phone is valid (e.g. guided request step 5). */
  autoLookup?: boolean;
  /** Lighter layout for inline wizard steps. */
  embedded?: boolean;
};

const MEAS_KEY_ORDER = [
  "Bust",
  "Waist",
  "Garment_Length",
  "Hip",
  "Shoulder",
  "Sleeve_Length",
  "Neck_Style",
  "Notes",
] as const;

function displayLabelForKey(key: string): string {
  if (key === "Garment_Length") return "Length";
  if (key === "Sleeve_Length") return "Sleeve length";
  return key.replace(/_/g, " ");
}

function orderedMeasurementEntries(rec: Record<string, string>): [string, string][] {
  const keys = new Set(Object.keys(rec));
  const ordered: [string, string][] = [];
  for (const k of MEAS_KEY_ORDER) {
    if (keys.has(k) && rec[k]?.trim()) ordered.push([k, rec[k]!]);
    keys.delete(k);
  }
  for (const k of keys) {
    if (rec[k]?.trim()) ordered.push([k, rec[k]!]);
  }
  return ordered;
}

type SoftIssue = "rate" | "generic" | null;

export function MeasurementLookupPanel({
  phone,
  onSelectionChange,
  autoLookup = false,
  embedded = false,
}: Props) {
  const [phase, setPhase] = useState<"idle" | "loading" | "ready">("idle");
  const [configured, setConfigured] = useState(true);
  const [items, setItems] = useState<LatestMeasurementByGarment[]>([]);
  const [choices, setChoices] = useState<Record<string, GarmentMeasurementChoice>>({});
  const [softIssue, setSoftIssue] = useState<SoftIssue>(null);
  const [snapDigits, setSnapDigits] = useState("");

  const valid = isPhonePlausible(phone);
  const digits = normalizePhone(phone);
  const stale = Boolean(snapDigits && digits !== snapDigits);

  const onSelectionChangeRef = useRef(onSelectionChange);
  onSelectionChangeRef.current = onSelectionChange;

  function emit(list: LatestMeasurementByGarment[], ch: Record<string, GarmentMeasurementChoice>) {
    if (!list.length) {
      onSelectionChangeRef.current(null);
      return;
    }
    onSelectionChangeRef.current({ items: list, choices: ch });
  }

  const lookup = useCallback(async () => {
    if (!isPhonePlausible(phone)) return;
    const d = normalizePhone(phone);
    setPhase("loading");
    setSoftIssue(null);
    setItems([]);
    onSelectionChangeRef.current(null);
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
        if (data.error === "rate_limited") setSoftIssue("rate");
        else setSoftIssue("generic");
        setPhase("idle");
        return;
      }

      if (!data.configured) {
        setConfigured(false);
        setItems([]);
        setPhase("ready");
        setSnapDigits(d);
        onSelectionChangeRef.current(null);
        return;
      }

      setConfigured(true);
      const list = Array.isArray(data.latestByGarment) ? data.latestByGarment : [];
      setItems(list);
      const init: Record<string, GarmentMeasurementChoice> = {};
      for (const it of list) init[it.garmentType] = "use";
      setChoices(init);
      setPhase("ready");
      setSnapDigits(d);
      emit(list, init);
    } catch {
      setSoftIssue("generic");
      setPhase("idle");
    }
  }, [phone]);

  useEffect(() => {
    if (!autoLookup || !valid) return;
    const id = window.setTimeout(() => {
      void lookup();
    }, 650);
    return () => window.clearTimeout(id);
  }, [autoLookup, valid, digits, lookup]);

  function setChoice(garmentType: string, c: GarmentMeasurementChoice) {
    setChoices((prev) => {
      const next = { ...prev, [garmentType]: c };
      emit(items, next);
      return next;
    });
  }

  const hasKids = items.some((i) => i.garmentType.startsWith("Kids"));

  const shellClass = embedded
    ? "rounded-2xl border border-border/80 bg-[#fdf8f6]/80 p-4"
    : "rounded-2xl border border-border bg-background/60 p-4 sm:p-5";

  const feedbackKey = `${phase}-${snapDigits}-${items.length}-${configured}-${softIssue ?? "ok"}`;

  return (
    <div className={shellClass}>
      {!embedded ? (
        <>
          <h3 className="font-display text-base font-semibold text-foreground">{m.sectionTitle}</h3>
          <p className="mt-1 text-xs text-muted">{m.sectionHint}</p>
        </>
      ) : null}

      {!autoLookup ? (
        <div className={`${embedded ? "" : "mt-3"} flex flex-col gap-2 sm:flex-row sm:items-center`}>
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
            <span className="text-xs text-muted">{m.phoneStaleHint}</span>
          ) : null}
        </div>
      ) : (
        <div className="mt-1 min-h-[1.25rem] text-xs text-muted">
          {valid && phase === "loading" ? <span>{m.searching}</span> : null}
          {autoLookup && stale && phase === "ready" ? (
            <button
              type="button"
              className="font-medium text-accent-dark underline-offset-4 hover:underline"
              onClick={() => void lookup()}
            >
              {m.refreshLookup}
            </button>
          ) : null}
        </div>
      )}

      {softIssue ? (
        <div
          key={`issue-${feedbackKey}`}
          className="animate-meas-feedback mt-4 rounded-2xl border border-[#ead5d5]/50 bg-[#FDF6F6] px-4 py-4 text-foreground shadow-sm"
          role="status"
        >
          <p className="text-sm font-medium leading-snug text-foreground">
            {softIssue === "rate" ? m.rateLimitedTitle : m.errorSoftTitle}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {softIssue === "rate" ? m.rateLimitedBody : m.errorSoftBody}
          </p>
        </div>
      ) : null}

      {phase === "ready" && !configured ? (
        <div
          key={`nc-${feedbackKey}`}
          className="animate-meas-feedback mt-4 rounded-2xl border border-[#ead5d5]/40 bg-[#FDF6F6] px-4 py-4 text-foreground shadow-sm"
          role="status"
        >
          <p className="text-lg" aria-hidden>
            ✨
          </p>
          <p className="mt-1 font-display text-base font-semibold leading-snug text-foreground">
            {m.notConfiguredTitle}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted">{m.notConfiguredBody}</p>
        </div>
      ) : null}

      {phase === "ready" && configured && !items.length && valid ? (
        <div
          key={`nf-${feedbackKey}`}
          className="animate-meas-feedback mt-4 rounded-2xl border border-[#ead5d5]/40 bg-[#FDF6F6] px-4 py-4 text-foreground shadow-sm"
          role="status"
        >
          <p className="text-lg" aria-hidden>
            😊
          </p>
          <p className="mt-1 font-display text-base font-semibold leading-snug text-foreground">
            {m.notFoundTitle}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted">{m.notFoundBody}</p>
        </div>
      ) : null}

      {phase === "ready" && items.length > 0 ? (
        <div
          key={`found-${feedbackKey}`}
          className="animate-meas-feedback mt-4 space-y-4 rounded-2xl border border-emerald-200/45 bg-[#F3FBF6] p-4 shadow-sm sm:p-5"
          role="region"
          aria-label="Saved measurements"
        >
          <div>
            <p className="font-display text-base font-semibold leading-snug text-foreground">
              {m.foundHeadline}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {items.length === 1
                ? m.foundSublineSingle(items[0]!.recordedAtDisplay)
                : m.foundSublineMulti}
            </p>
          </div>

          {hasKids ? (
            <p className="rounded-xl border border-amber-200/60 bg-amber-50/80 px-3 py-2 text-xs leading-relaxed text-amber-950/85">
              {m.kidsHint}
            </p>
          ) : null}

          {items.map((row) => {
            const choice = choices[row.garmentType] ?? "use";
            const entries = orderedMeasurementEntries(row.measurements);
            return (
              <div
                key={row.garmentType}
                className="rounded-xl border border-emerald-200/35 bg-white/70 p-4 shadow-sm backdrop-blur-[2px]"
              >
                <p className="text-sm font-semibold text-foreground">
                  {m.perGarmentSaved(row.garmentType, row.recordedAtDisplay)}
                </p>
                {row.customerName ? (
                  <p className="mt-1 text-xs text-muted">On file as {row.customerName}</p>
                ) : null}
                <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                  {entries.map(([key, val]) => (
                    <div key={key} className="flex flex-col rounded-lg bg-[#F3FBF6]/90 px-3 py-2">
                      <dt className="text-[11px] font-medium uppercase tracking-wide text-muted">
                        {displayLabelForKey(key)}
                      </dt>
                      <dd className="mt-0.5 font-display text-lg font-semibold tabular-nums text-foreground">
                        {val}
                      </dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:gap-3">
                  <Button
                    type="button"
                    variant={choice === "use" ? "primary" : "secondary"}
                    className="min-h-[48px] flex-1 text-sm font-semibold"
                    onClick={() => setChoice(row.garmentType, "use")}
                  >
                    {m.useThese}
                  </Button>
                  <Button
                    type="button"
                    variant={choice === "update" ? "primary" : "secondary"}
                    className="min-h-[48px] flex-1 text-sm font-semibold"
                    onClick={() => setChoice(row.garmentType, "update")}
                  >
                    {m.updateMeasurements}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
