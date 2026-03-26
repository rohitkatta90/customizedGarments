"use client";

import { useEffect, useState } from "react";

import type { StoredOrder } from "@/lib/orders/schema";
import Link from "next/link";

import { LEDGER_PAYMENT_STATUSES, pendingAmountInr } from "@/lib/orders/ledger";
import { ORDER_STATUSES, ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/orders/status";

export function OrdersAdmin() {
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [ledgerFilter, setLedgerFilter] = useState("");
  const [phoneFilter, setPhoneFilter] = useState("");
  const [warning, setWarning] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function fetchOrders() {
    setLoading(true);
    const q = new URLSearchParams();
    if (statusFilter) q.set("status", statusFilter);
    if (ledgerFilter) q.set("ledgerPayment", ledgerFilter);
    if (phoneFilter.trim()) q.set("phone", phoneFilter.trim());
    const res = await fetch(`/api/admin/orders?${q}`, { credentials: "include" });
    const data = (await res.json()) as {
      orders?: StoredOrder[];
      warning?: string;
    };
    setOrders(data.orders ?? []);
    setWarning(data.warning ?? null);
    setOrderError(null);
    setLoading(false);
  }

  useEffect(() => {
    void fetchOrders();
    // Intentionally mount-only; filters refetch via "Apply filters".
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchOrders closes over filters; we don't want auto-refetch on filter change
  }, []);

  async function updateStatus(id: string, status: OrderStatus) {
    setUpdatingId(id);
    setOrderError(null);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        await fetchOrders();
        return;
      }
      const err = (await res.json().catch(() => null)) as { message?: string } | null;
      setOrderError(err?.message ?? `Could not update status (${res.status}). Open order details to fix payment fields.`);
    } finally {
      setUpdatingId(null);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    window.location.href = "/admin/login";
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h1 className="font-display text-3xl font-semibold text-foreground">Orders</h1>
            <Link
              href="/admin/expenses"
              className="text-sm font-medium text-accent hover:underline"
            >
              Expense ledger →
            </Link>
            <Link
              href="/admin/payments"
              className="text-sm font-medium text-accent hover:underline"
            >
              Payments & receivables →
            </Link>
          </div>
          <p className="mt-1 text-sm text-muted">
            Filter by status, payment, or phone. Update status as work progresses.
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

      {orderError ? (
        <div
          className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
          role="status"
        >
          {orderError}
        </div>
      ) : null}

      {warning === "firestore_not_configured" ? (
        <div
          className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          role="status"
        >
          Firestore is not configured — orders are not persisted. Add Firebase credentials to your
          environment (see docs).
        </div>
      ) : null}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-muted" htmlFor="st">
            Status
          </label>
          <select
            id="st"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="mt-1 block w-full min-w-[10rem] rounded-xl border border-border bg-background px-3 py-2 text-sm sm:w-auto"
          >
            <option value="">All</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-muted" htmlFor="lp">
            Payment
          </label>
          <select
            id="lp"
            value={ledgerFilter}
            onChange={(e) => setLedgerFilter(e.target.value)}
            className="mt-1 block w-full min-w-[9rem] rounded-xl border border-border bg-background px-3 py-2 text-sm sm:w-auto"
          >
            <option value="">All</option>
            {LEDGER_PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[12rem]">
          <label className="text-xs font-medium uppercase tracking-wide text-muted" htmlFor="ph">
            Phone search
          </label>
          <input
            id="ph"
            type="search"
            placeholder="Digits or partial"
            value={phoneFilter}
            onChange={(e) => setPhoneFilter(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={() => void fetchOrders()}
          className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent-dark"
        >
          Apply filters
        </button>
      </div>

      {loading ? (
        <p className="mt-10 text-sm text-muted">Loading orders…</p>
      ) : orders.length === 0 ? (
        <p className="mt-10 text-sm text-muted">No orders found.</p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="border-b border-border bg-white/80 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Paid</th>
                <th className="px-4 py-3">Pending</th>
                <th className="px-4 py-3">Pay</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Request date</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((o) => (
                <tr key={o.id} className="bg-background/50">
                  <td className="px-4 py-3 font-mono text-xs text-muted">
                    {o.id.slice(0, 8)}…
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">{o.customerName}</td>
                  <td className="px-4 py-3 text-muted">{o.customerPhone}</td>
                  <td className="px-4 py-3 text-muted">
                    {o.totalAmountInr != null ? `₹${o.totalAmountInr}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted">₹{o.paidAmountInr ?? 0}</td>
                  <td className="px-4 py-3 text-muted">
                    {pendingAmountInr(o.totalAmountInr, o.paidAmountInr) == null
                      ? "—"
                      : `₹${pendingAmountInr(o.totalAmountInr, o.paidAmountInr)}`}
                  </td>
                  <td className="px-4 py-3 text-xs capitalize text-muted">
                    {o.ledgerPaymentStatus.replace(/_/g, " ")}
                  </td>
                  <td className="px-4 py-3">{o.items.length}</td>
                  <td className="px-4 py-3 text-muted">
                    {o.requestedDeliveryDate || "—"}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(o.createdAtIso).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={o.status}
                      disabled={updatingId === o.id}
                      onChange={(e) =>
                        void updateStatus(o.id, e.target.value as OrderStatus)
                      }
                      className="rounded-lg border border-border bg-background px-2 py-1 text-xs capitalize"
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {ORDER_STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="text-sm font-medium text-accent hover:underline"
                    >
                      Details
                    </Link>
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
