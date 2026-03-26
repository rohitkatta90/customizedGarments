"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import type { LedgerExpense } from "@/lib/orders/expenses-schema";
import { EXPENSE_TYPES } from "@/lib/orders/ledger";

export function ExpensesAdmin() {
  const [expenses, setExpenses] = useState<LedgerExpense[]>([]);
  const [warning, setWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expenseDate, setExpenseDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [expenseType, setExpenseType] = useState<string>("fabric");
  const [amountInr, setAmountInr] = useState("");
  const [vendorOrPayee, setVendorOrPayee] = useState("");
  const [linkedOrderId, setLinkedOrderId] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/expenses", { credentials: "include" });
    const data = (await res.json()) as { expenses?: LedgerExpense[]; warning?: string };
    setExpenses(data.expenses ?? []);
    setWarning(data.warning ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchExpenses();
  }, [fetchExpenses]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseInt(amountInr, 10);
    if (!Number.isFinite(amt) || amt < 0) {
      setMessage("Enter a valid amount.");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          expenseDate,
          expenseType,
          amountInr: amt,
          vendorOrPayee: vendorOrPayee.trim() || null,
          linkedOrderId: linkedOrderId.trim() || null,
          notes: notes.trim() || null,
        }),
      });
      if (!res.ok) {
        setMessage("Could not add expense.");
        return;
      }
      setAmountInr("");
      setVendorOrPayee("");
      setLinkedOrderId("");
      setNotes("");
      await fetchExpenses();
      setMessage("Expense added.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this expense row?")) return;
    const res = await fetch(`/api/admin/expenses/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      await fetchExpenses();
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    window.location.href = "/admin/login";
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h1 className="font-display text-3xl font-semibold text-foreground">Expense ledger</h1>
            <Link href="/admin/orders" className="text-sm font-medium text-accent hover:underline">
              ← Orders
            </Link>
            <Link href="/admin/payments" className="text-sm font-medium text-accent hover:underline">
              Payments & receivables →
            </Link>
          </div>
          <p className="mt-1 text-sm text-muted">
            Track fabric, labor, rent, and other outflows. Optional link to an order ID.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-white"
        >
          Log out
        </button>
      </div>

      {warning === "firestore_not_configured" ? (
        <div
          className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          role="status"
        >
          Firestore is not configured — expenses are not persisted.
        </div>
      ) : null}

      {message ? (
        <p className="mt-4 text-sm text-muted" role="status">
          {message}
        </p>
      ) : null}

      <form
        onSubmit={(e) => void handleAdd(e)}
        className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-sm"
      >
        <p className="text-sm font-semibold text-foreground">Add expense</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="text-xs text-muted" htmlFor="ed">
              Date
            </label>
            <input
              id="ed"
              type="date"
              required
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-muted" htmlFor="et">
              Type
            </label>
            <select
              id="et"
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={expenseType}
              onChange={(e) => setExpenseType(e.target.value)}
            >
              {EXPENSE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted" htmlFor="amt">
              Amount (₹)
            </label>
            <input
              id="amt"
              type="number"
              min={0}
              required
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={amountInr}
              onChange={(e) => setAmountInr(e.target.value)}
              placeholder="0"
            />
          </div>
          <div>
            <label className="text-xs text-muted" htmlFor="ven">
              Vendor / payee
            </label>
            <input
              id="ven"
              type="text"
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={vendorOrPayee}
              onChange={(e) => setVendorOrPayee(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-muted" htmlFor="loid">
              Linked order ID (optional)
            </label>
            <input
              id="loid"
              type="text"
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs"
              value={linkedOrderId}
              onChange={(e) => setLinkedOrderId(e.target.value)}
              placeholder="UUID…"
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="text-xs text-muted" htmlFor="en">
              Notes
            </label>
            <input
              id="en"
              type="text"
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="mt-4 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
        >
          {saving ? "Saving…" : "Add expense"}
        </button>
      </form>

      {loading ? (
        <p className="mt-10 text-sm text-muted">Loading…</p>
      ) : expenses.length === 0 ? (
        <p className="mt-10 text-sm text-muted">No expenses yet.</p>
      ) : (
        <div className="mt-10 overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-border bg-white/80 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Order link</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {expenses.map((x) => (
                <tr key={x.id} className="bg-background/50">
                  <td className="px-4 py-3 text-muted">{x.expenseDate}</td>
                  <td className="px-4 py-3 capitalize">{x.expenseType}</td>
                  <td className="px-4 py-3">₹{x.amountInr}</td>
                  <td className="px-4 py-3 text-muted">{x.vendorOrPayee || "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">
                    {x.linkedOrderId ? `${x.linkedOrderId.slice(0, 8)}…` : "—"}
                  </td>
                  <td className="max-w-[12rem] truncate px-4 py-3 text-muted">{x.notes || "—"}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => void handleDelete(x.id)}
                      className="text-xs font-medium text-red-700 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
