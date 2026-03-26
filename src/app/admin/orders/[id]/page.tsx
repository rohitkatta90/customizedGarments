import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { getCatalog } from "@/lib/data";
import { verifyAdminSession } from "@/lib/orders/admin-auth";
import { getStoredOrderById, isFirestoreConfigured } from "@/lib/orders/firestore";

import { OrderDetailForm } from "./order-detail-form";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const c = await cookies();
  if (!verifyAdminSession(c.get("gs_admin")?.value)) {
    redirect(`/admin/login?from=${encodeURIComponent(`/admin/orders/${id}`)}`);
  }

  if (!isFirestoreConfigured()) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-sm text-muted">
        Firestore is not configured.
      </div>
    );
  }

  const [order, catalog] = await Promise.all([getStoredOrderById(id), getCatalog()]);
  if (!order) {
    notFound();
  }

  return <OrderDetailForm order={order} catalog={catalog} />;
}
