import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { resolveStoreBySlug } from "@/lib/store/resolve-store";
import { withAnonymousCookie } from "@/lib/storefront/session-cookie";

/**
 * Storefront proxy: establishes the per-store anonymous cookie on first
 * contact (ADR-2.8-003). Server Components cannot set cookies, so this is the
 * one place a storefront page request can.
 *
 * The store comes from the path segment only (PLT-3). An unknown store gets no
 * cookie; the route renders its 404.
 */
export async function proxy(request: NextRequest) {
  const storeSlug = request.nextUrl.pathname.split("/")[2] ?? "";
  const store = await resolveStoreBySlug(storeSlug);
  if (!store) return NextResponse.next();

  return withAnonymousCookie(request, store);
}

export const config = {
  matcher: ["/s/:storeSlug/:path*"],
};
