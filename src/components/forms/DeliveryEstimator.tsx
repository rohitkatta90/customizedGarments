"use client";

import { useMemo, useState } from "react";

import { useI18n } from "@/components/i18n/I18nProvider";

const garmentIds = ["blouse", "kurti", "dress", "custom"] as const;
type UrgencyId = "standard" | "priority";

const baseDays: Record<(typeof garmentIds)[number], number> = {
  blouse: 7,
  kurti: 10,
  dress: 14,
  custom: 21,
};

const urgencyMult: Record<UrgencyId, number> = {
  standard: 1,
  priority: 0.75,
};

export function DeliveryEstimator() {
  const { dict } = useI18n();
  const d = dict.delivery;
  const [garment, setGarment] = useState<(typeof garmentIds)[number]>("kurti");
  const [urgency, setUrgency] = useState<UrgencyId>("standard");

  const estimate = useMemo(() => {
    const g = baseDays[garment];
    const u = urgencyMult[urgency];
    return Math.max(3, Math.round(g * u));
  }, [garment, urgency]);

  const garmentLabels: Record<(typeof garmentIds)[number], string> = {
    blouse: d.garments.blouse,
    kurti: d.garments.kurti,
    dress: d.garments.dress,
    custom: d.garments.custom,
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="font-display text-2xl font-semibold text-foreground">{d.title}</h2>
      <p className="mt-2 text-sm text-muted">{d.intro}</p>

      <label className="mt-6 block text-sm font-medium text-foreground" htmlFor="garment-type">
        {d.garmentLabel}
      </label>
      <select
        id="garment-type"
        value={garment}
        onChange={(e) => setGarment(e.target.value as (typeof garmentIds)[number])}
        className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none ring-accent focus:ring-2"
      >
        {garmentIds.map((id) => (
          <option key={id} value={id}>
            {garmentLabels[id]}
          </option>
        ))}
      </select>

      <label className="mt-4 block text-sm font-medium text-foreground" htmlFor="urgency">
        {d.timelineLabel}
      </label>
      <select
        id="urgency"
        value={urgency}
        onChange={(e) => setUrgency(e.target.value as UrgencyId)}
        className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none ring-accent focus:ring-2"
      >
        <option value="standard">{d.standard}</option>
        <option value="priority">{d.priority}</option>
      </select>

      <p className="mt-6 rounded-xl bg-background px-4 py-4 text-center font-display text-2xl font-semibold text-accent-dark">
        {d.estimate.replace("{{n}}", String(estimate))}
      </p>
    </div>
  );
}
