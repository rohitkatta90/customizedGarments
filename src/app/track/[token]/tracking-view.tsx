"use client";

import type { PublicTrackingOrder } from "@/lib/orders/schema";
import {
  FULFILLMENT_STATUSES,
  ORDER_STATUS_LABELS,
  orderStatusStepIndex,
} from "@/lib/orders/status";

type Props = {
  order: PublicTrackingOrder;
};

export function TrackingView({ order }: Props) {
  if (order.status === "cancelled") {
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <p className="text-center font-display text-2xl font-semibold text-foreground">
          Order status
        </p>
        <p className="mt-2 text-center text-sm text-muted">
          Reference <span className="font-mono text-foreground">{order.orderRefShort}</span>
          {order.customerFirstName ? (
            <>
              {" "}
              · {order.customerFirstName}
            </>
          ) : null}
        </p>
        <div className="mt-10 rounded-2xl border border-border bg-card p-6 text-center">
          <p className="font-medium text-foreground">{ORDER_STATUS_LABELS.cancelled}</p>
          <p className="mt-3 text-sm text-muted">
            This order is no longer active. If you have questions, please reach out on WhatsApp.
          </p>
        </div>
        <p className="mt-6 text-center text-xs text-muted">
          Last updated {new Date(order.updatedAtIso).toLocaleString()}
        </p>
      </div>
    );
  }

  const current = orderStatusStepIndex(order.status);
  const isDelivered = order.status === "delivered";
  const steps = FULFILLMENT_STATUSES.map((s) => ({
    key: s,
    label: ORDER_STATUS_LABELS[s],
  }));

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <p className="text-center font-display text-2xl font-semibold text-foreground">
        Order status
      </p>
      <p className="mt-2 text-center text-sm text-muted">
        Reference <span className="font-mono text-foreground">{order.orderRefShort}</span>
        {order.customerFirstName ? (
          <>
            {" "}
            · {order.customerFirstName}
          </>
        ) : null}
      </p>

      <ol className="mt-10 space-y-0">
        {steps.map((step, index) => {
          const done = index < current || (isDelivered && index === current);
          const active = index === current && !isDelivered;
          return (
            <li key={step.key} className="relative flex gap-4">
              {index < steps.length - 1 ? (
                <span
                  className={`absolute left-[15px] top-8 h-[calc(100%+0.5rem)] w-px ${
                    done || active ? "bg-accent" : "bg-border"
                  }`}
                  aria-hidden
                />
              ) : null}
              <span
                className={`relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  done
                    ? "bg-accent text-white"
                    : active
                      ? "bg-accent/15 text-accent ring-2 ring-accent"
                      : "border border-border bg-card text-muted"
                }`}
              >
                {done ? "✓" : index + 1}
              </span>
              <div className="pb-8 pt-0.5">
                <p
                  className={`text-sm font-medium ${
                    active ? "text-foreground" : done ? "text-foreground/80" : "text-muted"
                  }`}
                >
                  {step.label}
                </p>
                {active ? (
                  <p className="mt-1 text-xs text-muted">Current step</p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-2 rounded-2xl border border-border bg-card p-4 text-sm text-muted">
        <p>
          <span className="font-medium text-foreground">Items in this order:</span> {order.itemCount}
        </p>
        {order.requestedDeliveryDate ? (
          <p className="mt-2">
            <span className="font-medium text-foreground">Request date:</span>{" "}
            {formatDate(order.requestedDeliveryDate)}
          </p>
        ) : null}
        {order.revisedDeliveryDate ? (
          <p className="mt-2 text-foreground">
            <span className="font-medium">Updated estimate:</span>{" "}
            {formatDate(order.revisedDeliveryDate)}
          </p>
        ) : null}
        <p className="mt-3 text-xs">
          Last updated {new Date(order.updatedAtIso).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

function formatDate(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return ymd;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
