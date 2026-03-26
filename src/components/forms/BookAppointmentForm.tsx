"use client";

import { useEffect, useState } from "react";

import { useI18n } from "@/components/i18n/I18nProvider";
import { todayLocalISODate } from "@/lib/date-today";
import { buildWhatsAppUrl, bookAppointmentTemplate } from "@/lib/whatsapp";

import { Button } from "@/components/ui/Button";

export function BookAppointmentForm() {
  const { locale, dict } = useI18n();
  const d = dict.book;
  const [preferredDate, setPreferredDate] = useState("");
  const [timeWindow, setTimeWindow] = useState(d.morning);
  const [notes, setNotes] = useState("");
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [dateMin, setDateMin] = useState("");

  useEffect(() => {
    setDateMin(todayLocalISODate());
  }, []);

  const dateError = submitAttempted && !preferredDate.trim() ? d.dateRequired : undefined;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!preferredDate.trim()) {
      setSubmitAttempted(true);
      return;
    }
    const msg = bookAppointmentTemplate({ preferredDate, timeWindow, notes }, locale);
    window.location.href = buildWhatsAppUrl(msg);
  }

  const windows = [d.morning, d.midday, d.evening];

  const inputBase =
    "w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition-colors focus:ring-2";
  const inputOk = "border-border ring-accent focus:ring-2";
  const inputErr = "border-red-500 ring-1 ring-red-500/40 focus:border-red-500 focus:ring-red-500";

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-2xl space-y-6 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8"
      noValidate
    >
      <div>
        <h2 className="font-display text-2xl font-semibold text-foreground">{d.formTitle}</h2>
        <p className="mt-2 text-sm text-muted">{d.formIntro}</p>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground" htmlFor="appt-date">
          {d.dateLabel} *
        </label>
        <input
          id="appt-date"
          type="date"
          min={dateMin || undefined}
          value={preferredDate}
          onChange={(e) => setPreferredDate(e.target.value)}
          aria-invalid={Boolean(dateError)}
          aria-describedby={dateError ? "err-appt-date" : undefined}
          className={`mt-2 ${inputBase} ${dateError ? inputErr : inputOk}`}
        />
        {dateError ? (
          <p id="err-appt-date" className="mt-1.5 text-sm text-red-700" role="alert">
            {dateError}
          </p>
        ) : null}
      </div>

      <div>
        <label className="text-sm font-medium text-foreground" htmlFor="window">
          {d.windowLabel}
        </label>
        <select
          id="window"
          value={timeWindow}
          onChange={(e) => setTimeWindow(e.target.value)}
          className={`mt-2 ${inputBase} ${inputOk}`}
        >
          {windows.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground" htmlFor="appt-notes">
          {d.notesLabel}
        </label>
        <textarea
          id="appt-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className={`mt-2 ${inputBase} ${inputOk}`}
          placeholder={d.notesPh}
        />
      </div>

      <Button type="submit" className="w-full sm:w-auto">
        {d.submit}
      </Button>
    </form>
  );
}
