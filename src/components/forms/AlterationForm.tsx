"use client";

import { useMemo, useState } from "react";

import { useI18n } from "@/components/i18n/I18nProvider";
import { clampIsoDateToMin, todayLocalISODate } from "@/lib/date-today";
import type { AlterationType } from "@/lib/types";
import { buildWhatsAppUrl, alterationRequestTemplate } from "@/lib/whatsapp";

import { Button } from "@/components/ui/Button";

export function AlterationForm() {
  const { dict } = useI18n();
  const d = dict.alteration;
  const pickupMinToday = useMemo(() => todayLocalISODate(), []);

  const types = useMemo(
    () =>
      (
        [
          ["resize", d.types.resize],
          ["length", d.types.length],
          ["zipper", d.types.zipper],
          ["embroidery", d.types.embroidery],
          ["other", d.types.other],
        ] as const
      ).map(([id, label]) => ({ id: id as AlterationType, label })),
    [d.types],
  );

  const [alterationType, setAlterationType] = useState<AlterationType>("resize");
  const [fileName, setFileName] = useState<string | undefined>();
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const safeDate = clampIsoDateToMin(date, pickupMinToday);
    if (!safeDate.trim()) return;
    const label = types.find((t) => t.id === alterationType)?.label ?? alterationType;
    const msg = alterationRequestTemplate({
      alterationType: label,
      garmentImageName: fileName,
      pickupOrDeliveryDate: safeDate,
      notes,
    });
    window.location.href = buildWhatsAppUrl(msg);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-2xl space-y-6 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8"
    >
      <div>
        <h2 className="font-display text-2xl font-semibold text-foreground">{d.formTitle}</h2>
        <p className="mt-2 text-sm text-muted">{d.formIntro}</p>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground" htmlFor="alt-type">
          {d.typeLabel}
        </label>
        <select
          id="alt-type"
          value={alterationType}
          onChange={(e) => setAlterationType(e.target.value as AlterationType)}
          className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none ring-accent focus:ring-2"
        >
          {types.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground" htmlFor="garment-photo">
          {d.photoLabel}
        </label>
        <input
          id="garment-photo"
          type="file"
          accept="image/*"
          className="mt-2 block w-full text-sm text-muted file:mr-4 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-accent-dark"
          onChange={(e) => setFileName(e.target.files?.[0]?.name)}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-foreground" htmlFor="alt-notes">
          {d.notesLabel}
        </label>
        <textarea
          id="alt-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none ring-accent focus:ring-2"
          placeholder={d.notesPh}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-foreground" htmlFor="pickup-date">
          {d.dateLabel}
        </label>
        <input
          id="pickup-date"
          type="date"
          min={pickupMinToday}
          required
          value={date}
          onChange={(e) => setDate(clampIsoDateToMin(e.target.value, pickupMinToday))}
          onBlur={() => setDate((p) => clampIsoDateToMin(p, pickupMinToday))}
          className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none ring-accent focus:ring-2"
        />
      </div>

      <Button type="submit" className="w-full sm:w-auto">
        {d.submit}
      </Button>
    </form>
  );
}
