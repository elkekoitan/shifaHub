// Next.js 16 proxy.ts - replaces middleware.ts
// Network boundary for auth checks and route protection

import type { NextRequest } from "next/server";

const publicPaths = ["/", "/giris", "/kayit", "/api/health"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (publicPaths.some((path) => pathname === path || pathname.startsWith("/api/auth"))) {
    return;
  }

  // Check for auth token
  const token = request.cookies.get("access_token")?.value;
  if (!token) {
    return Response.redirect(new URL("/giris", request.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/).*)"],
};
