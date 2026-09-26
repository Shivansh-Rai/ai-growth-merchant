import type { NextRequest } from "next/server";

import { writeCustomerAuth } from "@/lib/auth/customer-session";
import { authErrorResponse } from "@/lib/auth/errors";
import { loginCustomer } from "@/lib/auth/login-customer";
import { resolveStoreBySlug } from "@/lib/store/resolve-store";
import { ensureStorefrontSession, readAnonymousToken } from "@/lib/storefront/session-cookie";

/**
 * POST /api/s/[storeSlug]/auth/login — customer login (3.8 login sequence).
 *
 * storeId from the slug; the running Session from this store's anonymous
 * cookie. Login does not end that Session and does not rotate the token.
 */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/s/[storeSlug]/auth/login">) {
  const { storeSlug } = await ctx.params;
  const store = await resolveStoreBySlug(storeSlug);
  if (!store) return Response.json({ error: "Store not found" }, { status: 404 });

  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return Response.json({ error: "Expected application/json" }, { status: 415 });
  }
  const body: unknown = await request.json().catch(() => null);
  if (typeof body !== "object" || body === null) {
    return Response.json({ error: "Body is not valid JSON" }, { status: 400 });
  }

  if ((await readAnonymousToken(store.id)) === null) {
    return Response.json({ error: "No storefront session for this store" }, { status: 400 });
  }

  try {
    const session = await ensureStorefrontSession(store);
    const { email, password } = body as Record<string, unknown>;
    const result = await loginCustomer({ storeId: store.id, sessionId: session.id, email, password });
    await writeCustomerAuth(result.auth);
    return Response.json({
      customerId: result.auth.customerId,
      attributedSessionCount: result.attributedSessionCount,
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
