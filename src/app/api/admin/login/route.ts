import { NextResponse } from "next/server";

import { isAdminConfigured } from "@/lib/orders/admin-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { ok: false, error: "admin_not_configured" },
      { status: 503 },
    );
  }

  let body: { password?: string };
  try {
    body = (await request.json()) as { password?: string };
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (body.password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("gs_admin", process.env.ADMIN_SESSION_TOKEN!, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
