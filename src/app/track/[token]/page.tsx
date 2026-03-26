import type { Metadata } from "next";

import { getPublicTrackingByToken, isFirestoreConfigured } from "@/lib/orders/firestore";

import { TrackingView } from "./tracking-view";

export const metadata: Metadata = {
  title: "Track order",
  robots: { index: false, follow: false },
};

type PageProps = { params: Promise<{ token: string }> };

export default async function TrackOrderPage({ params }: PageProps) {
  const { token } = await params;

  if (!isFirestoreConfigured()) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-muted">
        Order tracking is not available right now. Please message us on WhatsApp with your order
        reference.
      </div>
    );
  }

  const order = await getPublicTrackingByToken(token);

  if (!order) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-muted">
        We couldn&apos;t find this order link. Check the link or contact us on WhatsApp.
      </div>
    );
  }

  return <TrackingView order={order} />;
}
