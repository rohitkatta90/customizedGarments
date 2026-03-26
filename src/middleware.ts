import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/admin/login") {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith("/admin")) {
    const token = request.cookies.get("gs_admin")?.value;
    const expected = process.env.ADMIN_SESSION_TOKEN;
    if (!expected || token !== expected) {
      const login = new URL("/admin/login", request.url);
      login.searchParams.set("from", request.nextUrl.pathname);
      return NextResponse.redirect(login);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
