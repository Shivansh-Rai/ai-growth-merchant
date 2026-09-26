import "server-only";

import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import type { Session } from "@/lib/generated/prisma";
import { anonymousIdSchema, mintAnonymousId } from "@/lib/identity/anonymous-id";
import { activityCutoff } from "@/lib/identity/session-state";
import { startSession } from "@/lib/identity/start-session";
import { touchSession } from "@/lib/identity/touch-session";
import { prisma } from "@/lib/prisma";
import type { ResolvedStore } from "@/lib/store/resolve-store";

/**
 * Token lifetime aligns with Event retention (ADR-2.7-010 → ADR-2.7-014,
 * ≥ 90 days). The 30-day identity-attribution window is enforced separately by
 * the backfill, not by cookie expiry.
 */
const ANONYMOUS_COOKIE_MAX_AGE_S = 90 * 24 * 60 * 60;

/** Cookie name is per-store so no token is shared across merchants (PLT-4). */
export function anonymousCookieName(storeId: string): string {
  return `ngs_anon_${storeId}`;
}

function isValidToken(value: string | undefined): value is string {
  return value !== undefined && anonymousIdSchema.safeParse(value).success;
}

/**
 * Runs in proxy.ts, before render — the only place a page request can write a
 * cookie in this Next.js version (Server Components cannot).
 *
 * Mints a token when the store's cookie is missing or malformed, and writes it
 * to BOTH the forwarded request (so this render sees it) and the response (so
 * the browser keeps it). The token is opaque and authorizes nothing
 * (ADR-2.7-010).
 */
export function withAnonymousCookie(request: NextRequest, store: ResolvedStore): NextResponse {
  const name = anonymousCookieName(store.id);
  if (isValidToken(request.cookies.get(name)?.value)) {
    return NextResponse.next();
  }

  const token = mintAnonymousId();
  request.cookies.set(name, token);
  const response = NextResponse.next({ request: { headers: request.headers } });
  response.cookies.set(name, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ANONYMOUS_COOKIE_MAX_AGE_S,
  });
  return response;
}

/**
 * Reads the token, starts a Session if needed, touches it otherwise.
 *
 * "Resume or open" is decided here (phase 3.5 left it to the caller): the most
 * recent ACTIVE Session on this (store, token) is resumed; if none is ACTIVE,
 * a new Session opens on the same token (ADR-2.7-008).
 */
export async function ensureStorefrontSession(store: ResolvedStore): Promise<Session> {
  const cookieStore = await cookies();
  const anonymousId = cookieStore.get(anonymousCookieName(store.id))?.value;
  if (!isValidToken(anonymousId)) {
    // proxy.ts guarantees the cookie on every /s/* request. Reaching here means
    // the proxy matcher and the route tree have drifted apart.
    throw new Error(`Storefront request for ${store.slug} arrived without an anonymous token`);
  }

  const active = await prisma.session.findFirst({
    where: {
      storeId: store.id,
      anonymousId,
      endedAt: null,
      lastActivityAt: { gte: activityCutoff(new Date()) },
    },
    orderBy: { lastActivityAt: "desc" },
  });

  if (active) {
    await touchSession(store.id, active.id);
    return active;
  }
  return startSession({ storeId: store.id, anonymousId });
}
