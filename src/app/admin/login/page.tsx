import { Suspense } from "react";

import { LoginForm } from "./login-form";
import { isAdminConfigured } from "@/lib/orders/admin-auth";

export default function AdminLoginPage() {
  if (!isAdminConfigured()) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-semibold text-foreground">Admin unavailable</h1>
        <p className="mt-3 text-sm text-muted">
          Set <code className="rounded bg-background px-1">ADMIN_PASSWORD</code> and{" "}
          <code className="rounded bg-background px-1">ADMIN_SESSION_TOKEN</code> in your environment.
          See docs for order management setup.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Suspense fallback={<p className="text-center text-sm text-muted">Loading…</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
