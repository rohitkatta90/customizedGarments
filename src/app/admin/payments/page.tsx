import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { verifyAdminSession } from "@/lib/orders/admin-auth";
import { isFirestoreConfigured } from "@/lib/orders/firestore";

import { PaymentsDashboard } from "./payments-dashboard";

export default async function AdminPaymentsPage() {
  const c = await cookies();
  if (!verifyAdminSession(c.get("gs_admin")?.value)) {
    redirect("/admin/login?from=/admin/payments");
  }

  if (!isFirestoreConfigured()) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-sm text-muted">
        Firestore is not configured.
      </div>
    );
  }

  return <PaymentsDashboard />;
}
