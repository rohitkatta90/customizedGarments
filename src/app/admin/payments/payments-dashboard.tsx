"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import type { LedgerDailySummary } from "@/lib/orders/daily-ledger";
import { todayIST } from "@/lib/orders/daily-ledger";

type ApiResponse = {
  summary?: LedgerDailySummary;
  orderCount?: number;
  note?: string | null;
};

function formatInr(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}

export function PaymentsDashboard() {
  const [date, setDate] = useState(todayIST);
  const [summary, setSummary] = useState<LedgerDailySummary | null>(null);
  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/ledger/summary?date=${encodeURIComponent(date)}`, {
      credentials: "include",
    });
    const data = (await res.json()) as ApiResponse;
    setSummary(data.summary ?? null);
    setOrderCount(data.orderCount ?? null);
    setNote(data.note ?? null);
    setLoading(false);
  }, [date]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h1 className="font-display text-3xl font-semibold text-foreground">Payments & receivables</h1>
        <Link href="/admin/orders" className="text-sm font-medium text-accent hover:underline">
          ← Orders
        </Link>
        <Link href="/admin/expenses" className="text-sm font-medium text-accent hover:underline">
          Expense ledger →
        </Link>
      </div>
      <p className="mt-2 text-sm text-muted">
        Daily snapshot (India time). “Payments recorded” sums positive changes saved in the order payment
        audit log. Compare with your UPI / cash book during reconciliation.
      </p>

      <div className="mt-8 flex flex-wrap items-end gap-4">
        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-muted" htmlFor="dt">
            Report date (IST)
          </label>
          <input
            id="dt"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-2 block rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent-dark"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="mt-10 text-sm text-muted">Loading…</p>
      ) : summary ? (
        <div className="mt-10 space-y-6">
          {note ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {note}
            </p>
          ) : null}
          {orderCount != null ? (
            <p className="text-xs text-muted">Orders in window: {orderCount}</p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Payments recorded (day)</p>
              <p className="mt-2 font-display text-2xl font-semibold text-foreground">
                {formatInr(summary.paymentsRecordedInr)}
              </p>
              <p className="mt-1 text-xs text-muted">
                {summary.paymentEntryCount} audit entr
                {summary.paymentEntryCount === 1 ? "y" : "ies"} (sum of increases)
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Pending collections</p>
              <p className="mt-2 font-display text-2xl font-semibold text-foreground">
                {formatInr(summary.pendingCollectionsInr)}
              </p>
              <p className="mt-1 text-xs text-muted">
                Across {summary.ordersWithReceivablesCount} active order
                {summary.ordersWithReceivablesCount === 1 ? "" : "s"} with a balance due
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Delivered (this day)</p>
              <p className="mt-2 font-display text-2xl font-semibold text-foreground">
                {summary.deliveredCount}
              </p>
              <p className="mt-1 text-xs text-muted">
                Order value (quoted total): {formatInr(summary.deliveredOrderValueInr)}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-10 text-sm text-muted">Could not load summary.</p>
      )}
    </div>
  );
}
