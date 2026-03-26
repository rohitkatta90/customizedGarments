"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { StoredOrder } from "@/lib/orders/schema";
import { ORDER_PRIORITIES, type OrderPriority } from "@/lib/orders/priority";
import { ORDER_STATUSES, ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/orders/status";
import {
  ACCESSORIES_QUOTE_STATUSES,
  buildAccessoriesConfirmationWhatsApp,
  STYLING_ELEMENT_PRESETS,
  STYLING_ELEMENTS_CATEGORY,
  type AccessoriesQuoteStatus,
  type QuotedAccessoryLine,
} from "@/lib/orders/styling-elements";
import {
  computeLedgerPaymentStatus,
  PAYMENT_MODES,
  pendingAmountInr,
  type PaymentMode,
} from "@/lib/orders/ledger";
import { buildWhatsAppReceiptText } from "@/lib/orders/receipt";
import { siteConfig } from "@/lib/site";
import type { CatalogItem } from "@/lib/types";

type Props = {
  order: StoredOrder;
  catalog: CatalogItem[];
};

export function OrderDetailForm({ order: initial, catalog }: Props) {
  const router = useRouter();
  const [order, setOrder] = useState(initial);
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [priority, setPriority] = useState<OrderPriority>(order.priority);
  const [delayReasonInternal, setDelayReasonInternal] = useState(order.delayReasonInternal ?? "");
  const [revisedDeliveryDate, setRevisedDeliveryDate] = useState(order.revisedDeliveryDate ?? "");
  const [cancellationReasonInternal, setCancellationReasonInternal] = useState(
    order.cancellationReasonInternal ?? "",
  );
  const [scopeChangeNotesInternal, setScopeChangeNotesInternal] = useState(
    order.scopeChangeNotesInternal ?? "",
  );
  const [reworkNotesInternal, setReworkNotesInternal] = useState(order.reworkNotesInternal ?? "");
  const [quotedAccessories, setQuotedAccessories] = useState<QuotedAccessoryLine[]>(
    order.quotedAccessories,
  );
  const [accessoriesQuoteStatus, setAccessoriesQuoteStatus] = useState<AccessoriesQuoteStatus>(
    order.accessoriesQuoteStatus,
  );
  const [accessoriesNotesInternal, setAccessoriesNotesInternal] = useState(
    order.accessoriesNotesInternal ?? "",
  );
  const [totalAmountStr, setTotalAmountStr] = useState(
    order.totalAmountInr != null ? String(order.totalAmountInr) : "",
  );
  const [paidAmountStr, setPaidAmountStr] = useState(String(order.paidAmountInr ?? 0));
  const [paymentModePrimary, setPaymentModePrimary] = useState(order.paymentModePrimary ?? "");
  const [financialNotes, setFinancialNotes] = useState(order.financialNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setOrder(initial);
    setStatus(initial.status);
    setPriority(initial.priority);
    setDelayReasonInternal(initial.delayReasonInternal ?? "");
    setRevisedDeliveryDate(initial.revisedDeliveryDate ?? "");
    setCancellationReasonInternal(initial.cancellationReasonInternal ?? "");
    setScopeChangeNotesInternal(initial.scopeChangeNotesInternal ?? "");
    setReworkNotesInternal(initial.reworkNotesInternal ?? "");
    setQuotedAccessories(initial.quotedAccessories ?? []);
    setAccessoriesQuoteStatus(initial.accessoriesQuoteStatus);
    setAccessoriesNotesInternal(initial.accessoriesNotesInternal ?? "");
    setTotalAmountStr(initial.totalAmountInr != null ? String(initial.totalAmountInr) : "");
    setPaidAmountStr(String(initial.paidAmountInr ?? 0));
    setPaymentModePrimary(initial.paymentModePrimary ?? "");
    setFinancialNotes(initial.financialNotes ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync when server order refreshes (updatedAtIso)
  }, [initial.updatedAtIso, initial.id]);

  const base = siteConfig.siteUrl.replace(/\/$/, "");
  const trackingUrl =
    order.trackingToken.trim() !== "" ? `${base}/track/${order.trackingToken}` : "";

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          status,
          priority,
          delayReasonInternal: delayReasonInternal.trim() || null,
          revisedDeliveryDate: revisedDeliveryDate.trim() || null,
          cancellationReasonInternal: cancellationReasonInternal.trim() || null,
          scopeChangeNotesInternal: scopeChangeNotesInternal.trim() || null,
          reworkNotesInternal: reworkNotesInternal.trim() || null,
          quotedAccessories: quotedAccessories.filter((l) => l.label.trim()),
          accessoriesQuoteStatus,
          accessoriesNotesInternal: accessoriesNotesInternal.trim() || null,
          totalAmountInr:
            totalAmountStr.trim() === "" ? null : Math.max(0, parseInt(totalAmountStr, 10) || 0),
          paidAmountInr: Math.max(0, parseInt(paidAmountStr, 10) || 0),
          paymentModePrimary: paymentModePrimary || null,
          financialNotes: financialNotes.trim() || null,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { message?: string } | null;
        setMessage(err?.message ?? "Could not save. Try again.");
        return;
      }
      setOrder((o) => ({
        ...o,
        status,
        priority,
        delayReasonInternal: delayReasonInternal.trim() || null,
        revisedDeliveryDate: revisedDeliveryDate.trim() || null,
        cancellationReasonInternal: cancellationReasonInternal.trim() || null,
        scopeChangeNotesInternal: scopeChangeNotesInternal.trim() || null,
        reworkNotesInternal: reworkNotesInternal.trim() || null,
        quotedAccessories: quotedAccessories.filter((l) => l.label.trim()),
        accessoriesQuoteStatus,
          accessoriesNotesInternal: accessoriesNotesInternal.trim() || null,
          totalAmountInr:
            totalAmountStr.trim() === "" ? null : Math.max(0, parseInt(totalAmountStr, 10) || 0),
          paidAmountInr: Math.max(0, parseInt(paidAmountStr, 10) || 0),
          paymentModePrimary: (paymentModePrimary === "" ? null : paymentModePrimary) as
            | PaymentMode
            | null,
          financialNotes: financialNotes.trim() || null,
          ledgerPaymentStatus: computeLedgerPaymentStatus(
            totalAmountStr.trim() === "" ? null : Math.max(0, parseInt(totalAmountStr, 10) || 0),
            Math.max(0, parseInt(paidAmountStr, 10) || 0),
            status,
          ),
          cancelledAtIso: status === "cancelled" ? o.cancelledAtIso ?? new Date().toISOString() : null,
      }));
      setMessage("Saved.");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  function addAccessoryRow() {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `acc-${Date.now()}`;
    setQuotedAccessories((prev) => [...prev, { id, label: "", amountInr: null }]);
  }

  function updateAccessoryRow(index: number, patch: Partial<QuotedAccessoryLine>) {
    setQuotedAccessories((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  }

  function removeAccessoryRow(index: number) {
    setQuotedAccessories((prev) => prev.filter((_, i) => i !== index));
  }

  async function copyAccessoriesWhatsApp() {
    const lines = quotedAccessories.filter((l) => l.label.trim());
    if (lines.length === 0) {
      setMessage("Add at least one accessory line with a label.");
      return;
    }
    const text = buildAccessoriesConfirmationWhatsApp({
      lines,
      orderRefShort: order.id.slice(0, 8),
    });
    try {
      await navigator.clipboard.writeText(text);
      setMessage("WhatsApp extras message copied — paste in chat.");
    } catch {
      setMessage("Could not copy — try again.");
    }
  }

  async function copyTrackingLink() {
    if (!trackingUrl) return;
    try {
      await navigator.clipboard.writeText(trackingUrl);
      setMessage("Tracking link copied.");
    } catch {
      setMessage("Copy failed — select the link manually.");
    }
  }

  async function copyWhatsAppReceipt() {
    const total =
      totalAmountStr.trim() === "" ? null : Math.max(0, parseInt(totalAmountStr, 10) || 0);
    const paid = Math.max(0, parseInt(paidAmountStr, 10) || 0);
    const text = buildWhatsAppReceiptText({
      businessName: siteConfig.name,
      order,
      catalog,
      ledgerOverrides: {
        totalAmountInr: total,
        paidAmountInr: paid,
        paymentModePrimary: paymentModePrimary === "" ? null : (paymentModePrimary as PaymentMode),
        financialNotes: financialNotes.trim() || null,
        status,
      },
      quotedAccessoriesOverride: quotedAccessories.filter((l) => l.label.trim()),
    });
    try {
      await navigator.clipboard.writeText(text);
      setMessage("WhatsApp receipt copied — paste in chat.");
    } catch {
      setMessage("Could not copy — try again.");
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <Link href="/admin/orders" className="text-sm font-medium text-accent hover:underline">
          ← All orders
        </Link>
        <Link href="/admin/expenses" className="text-sm font-medium text-accent hover:underline">
          Expense ledger
        </Link>
      </div>

      <h1 className="mt-4 font-display text-3xl font-semibold text-foreground">Order</h1>
      <p className="mt-1 font-mono text-sm text-muted">{order.id}</p>

      {message ? (
        <p className="mt-4 text-sm text-muted" role="status">
          {message}
        </p>
      ) : null}

      <div className="mt-8 space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-muted" htmlFor="st">
            Status
          </label>
          <select
            id="st"
            value={status}
            onChange={(e) => setStatus(e.target.value as OrderStatus)}
            className="mt-2 block w-full max-w-md rounded-xl border border-border bg-background px-3 py-2 text-sm"
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-muted" htmlFor="pri">
            Priority
          </label>
          <p className="mt-1 text-xs text-muted">
            Rush flags the job for planning — it does not change dates automatically.
          </p>
          <select
            id="pri"
            value={priority}
            onChange={(e) => setPriority(e.target.value as OrderPriority)}
            className="mt-2 block w-full max-w-md rounded-xl border border-border bg-background px-3 py-2 text-sm"
          >
            {ORDER_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p === "rush" ? "Rush / urgent" : "Standard"}
              </option>
            ))}
          </select>
        </div>

        <div className="border-t border-border pt-6">
          <p className="text-sm font-semibold text-foreground">Ledger (payment)</p>
          <p className="mt-1 text-xs text-muted">
            Total is the agreed quote (incl. extras). Paid accumulates; pending is derived. Payment status
            updates from amounts. Marking <strong className="font-medium text-foreground">Delivered</strong>{" "}
            requires a total, payment mode, and full settlement (record COD cash before or with delivery).
          </p>
          <p className="mt-2 text-xs text-muted">
            <Link
              href="/pricing"
              className="text-accent hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              Pricing guide
            </Link>{" "}
            — indicative tier bands on the public site (opens in a new tab).
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs text-muted" htmlFor="tot">
                Total (₹)
              </label>
              <input
                id="tot"
                type="number"
                min={0}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                value={totalAmountStr}
                onChange={(e) => setTotalAmountStr(e.target.value)}
                placeholder="Until quoted"
              />
            </div>
            <div>
              <label className="text-xs text-muted" htmlFor="paid">
                Paid (₹)
              </label>
              <input
                id="paid"
                type="number"
                min={0}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                value={paidAmountStr}
                onChange={(e) => setPaidAmountStr(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-muted" htmlFor="pmode">
                Primary payment mode
              </label>
              <select
                id="pmode"
                className="mt-1 w-full max-w-md rounded-lg border border-border bg-background px-3 py-2 text-sm"
                value={paymentModePrimary}
                onChange={(e) => setPaymentModePrimary(e.target.value)}
              >
                <option value="">Not set</option>
                {PAYMENT_MODES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-muted" htmlFor="fnotes">
                Payment notes
              </label>
              <input
                id="fnotes"
                type="text"
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                value={financialNotes}
                onChange={(e) => setFinancialNotes(e.target.value)}
                placeholder="e.g. ₹2k advance UPI, balance COD"
              />
            </div>
          </div>
          <p className="mt-4 text-sm text-muted">
            Pending:{" "}
            <span className="font-medium text-foreground">
              {(() => {
                const t =
                  totalAmountStr.trim() === ""
                    ? null
                    : Math.max(0, parseInt(totalAmountStr, 10) || 0);
                const p = Math.max(0, parseInt(paidAmountStr, 10) || 0);
                const pen = pendingAmountInr(t, p);
                return pen == null ? "—" : `₹${pen}`;
              })()}
            </span>
            {" · "}
            Payment status:{" "}
            <span className="font-medium capitalize text-foreground">
              {computeLedgerPaymentStatus(
                totalAmountStr.trim() === ""
                  ? null
                  : Math.max(0, parseInt(totalAmountStr, 10) || 0),
                Math.max(0, parseInt(paidAmountStr, 10) || 0),
                status,
              ).replace(/_/g, " ")}
            </span>
          </p>
          <button
            type="button"
            onClick={() => void copyWhatsAppReceipt()}
            className="mt-4 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-white"
          >
            Copy WhatsApp receipt
          </button>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Tracking</p>
          {trackingUrl ? (
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
              <code className="block flex-1 truncate rounded-lg bg-background px-3 py-2 text-xs text-muted">
                {trackingUrl}
              </code>
              <button
                type="button"
                onClick={() => void copyTrackingLink()}
                className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-white"
              >
                Copy link
              </button>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted">No tracking token (older order).</p>
          )}
        </div>

        <div className="border-t border-border pt-6">
          <p className="text-sm font-semibold text-foreground">{STYLING_ELEMENTS_CATEGORY}</p>
          <p className="mt-1 text-xs text-muted">
            Base quote covers standard stitching/alteration. List extras here; customer approves before you
            proceed. Not shown on public tracking.
          </p>

          <div className="mt-4 space-y-3">
            {quotedAccessories.map((row, index) => (
              <div
                key={row.id}
                className="flex flex-col gap-2 rounded-xl border border-border bg-background/60 p-3 sm:flex-row sm:flex-wrap sm:items-end"
              >
                <div className="min-w-[10rem] flex-1">
                  <label className="text-xs text-muted">Preset</label>
                  <select
                    className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
                    value=""
                    onChange={(e) => {
                      const v = e.target.value;
                      if (!v) return;
                      const p = STYLING_ELEMENT_PRESETS.find((x) => x.id === v);
                      if (p) updateAccessoryRow(index, { label: p.label });
                    }}
                  >
                    <option value="">Choose preset…</option>
                    {STYLING_ELEMENT_PRESETS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="min-w-[8rem] flex-[2]">
                  <label className="text-xs text-muted">Description</label>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
                    value={row.label}
                    onChange={(e) => updateAccessoryRow(index, { label: e.target.value })}
                    placeholder="e.g. Lace border"
                  />
                </div>
                <div className="w-24">
                  <label className="text-xs text-muted">₹ extra</label>
                  <input
                    type="number"
                    min={0}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
                    value={row.amountInr ?? ""}
                    placeholder="—"
                    onChange={(e) => {
                      const v = e.target.value;
                      updateAccessoryRow(index, {
                        amountInr: v === "" ? null : Math.max(0, parseInt(v, 10) || 0),
                      });
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeAccessoryRow(index)}
                  className="rounded-lg border border-border px-2 py-1 text-xs text-muted hover:bg-white"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addAccessoryRow}
              className="text-sm font-medium text-accent hover:underline"
            >
              + Add line
            </button>
          </div>

          <div className="mt-4">
            <label className="text-xs font-medium uppercase tracking-wide text-muted" htmlFor="aqs">
              Extras approval status
            </label>
            <select
              id="aqs"
              value={accessoriesQuoteStatus}
              onChange={(e) => setAccessoriesQuoteStatus(e.target.value as AccessoriesQuoteStatus)}
              className="mt-2 block w-full max-w-md rounded-xl border border-border bg-background px-3 py-2 text-sm"
            >
              {ACCESSORIES_QUOTE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4">
            <label className="text-xs font-medium uppercase tracking-wide text-muted" htmlFor="anotes">
              Notes (internal)
            </label>
            <textarea
              id="anotes"
              rows={2}
              value={accessoriesNotesInternal}
              onChange={(e) => setAccessoriesNotesInternal(e.target.value)}
              placeholder="Fabric sourcing, options discussed…"
              className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
          </div>

          <button
            type="button"
            onClick={() => void copyAccessoriesWhatsApp()}
            className="mt-4 rounded-full border border-accent bg-accent/10 px-4 py-2 text-sm font-medium text-accent-dark hover:bg-accent/15"
          >
            Copy WhatsApp confirmation (extras)
          </button>
        </div>

        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-muted" htmlFor="delay">
            Workload / delay (internal)
          </label>
          <p className="mt-1 text-xs text-muted">Not shown to customers.</p>
          <textarea
            id="delay"
            rows={3}
            value={delayReasonInternal}
            onChange={(e) => setDelayReasonInternal(e.target.value)}
            placeholder="e.g. queue backlog, material wait"
            className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-muted" htmlFor="rev">
            Revised delivery date (customer)
          </label>
          <p className="mt-1 text-xs text-muted">
            Shown on tracking as an &quot;updated estimate&quot; when set.
          </p>
          <input
            id="rev"
            type="date"
            value={revisedDeliveryDate}
            onChange={(e) => setRevisedDeliveryDate(e.target.value)}
            className="mt-2 max-w-xs rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-muted" htmlFor="scope">
            Scope change after confirmation (internal)
          </label>
          <p className="mt-1 text-xs text-muted">Customer changed spec — log what was agreed.</p>
          <textarea
            id="scope"
            rows={2}
            value={scopeChangeNotesInternal}
            onChange={(e) => setScopeChangeNotesInternal(e.target.value)}
            className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-muted" htmlFor="rework">
            Rework / measurement issue (internal)
          </label>
          <textarea
            id="rework"
            rows={2}
            value={reworkNotesInternal}
            onChange={(e) => setReworkNotesInternal(e.target.value)}
            className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-muted" htmlFor="cancel">
            Cancellation reason (internal)
          </label>
          <p className="mt-1 text-xs text-muted">Use when status is Cancelled — not shown on tracking.</p>
          <textarea
            id="cancel"
            rows={2}
            value={cancellationReasonInternal}
            onChange={(e) => setCancellationReasonInternal(e.target.value)}
            className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
