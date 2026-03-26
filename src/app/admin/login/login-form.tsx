"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError("Invalid password.");
        setPending(false);
        return;
      }
      const dest = searchParams.get("from") || "/admin/orders";
      router.push(dest);
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto mt-16 max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm"
    >
      <h1 className="font-display text-2xl font-semibold text-foreground">Admin login</h1>
      <p className="mt-2 text-sm text-muted">Order management — password from your deployment env.</p>
      <label className="mt-6 block text-sm font-medium text-foreground" htmlFor="pw">
        Password
      </label>
      <input
        id="pw"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none ring-accent focus:ring-2"
      />
      {error ? (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-6 w-full rounded-full bg-accent py-3 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
