import type { NextRequest } from "next/server";

import { writeCustomerAuth } from "@/lib/auth/customer-session";
import { authErrorResponse } from "@/lib/auth/errors";
import { registerCustomer } from "@/lib/auth/register-customer";
import { resolveStoreBySlug } from "@/lib/store/resolve-store";
import { ensureStorefrontSession, readAnonymousToken } from "@/lib/storefront/session-cookie";

/**
 * POST /api/s/[storeSlug]/auth/register — create a Customer in THIS store and
 * sign them in on the running Session. Any storeId in the body is ignored.
 */
export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/s/[storeSlug]/auth/register">,
) {
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
    const { email, password, name } = body as Record<string, unknown>;
    const auth = await registerCustomer({
      storeId: store.id,
      sessionId: session.id,
      email,
      password,
      name: name === "" ? null : name,
    });
    await writeCustomerAuth(auth);
    return Response.json({ customerId: auth.customerId }, { status: 201 });
  } catch (error) {
    return authErrorResponse(error);
  }
}
