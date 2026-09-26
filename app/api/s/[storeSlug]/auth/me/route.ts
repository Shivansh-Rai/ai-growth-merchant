import { authErrorResponse } from "@/lib/auth/errors";
import { requireCustomer } from "@/lib/auth/require-customer";
import { prisma } from "@/lib/prisma";
import { resolveStoreBySlug } from "@/lib/store/resolve-store";

/**
 * GET /api/s/[storeSlug]/auth/me — the signed-in customer, or 401.
 *
 * The first endpoint behind requireCustomer (INV-10): what the commerce routes
 * in 3.9+ will do at their entry point. Neither the anonymous token nor a
 * merchant cookie satisfies it.
 */
export async function GET(_request: Request, ctx: RouteContext<"/api/s/[storeSlug]/auth/me">) {
  const { storeSlug } = await ctx.params;
  const store = await resolveStoreBySlug(storeSlug);
  if (!store) return Response.json({ error: "Store not found" }, { status: 404 });

  try {
    const auth = await requireCustomer(store.id);
    const customer = await prisma.customer.findUniqueOrThrow({
      where: { storeId_id: { storeId: store.id, id: auth.customerId } },
      select: { id: true, email: true, name: true },
    });
    return Response.json({ customer, sessionId: auth.sessionId });
  } catch (error) {
    return authErrorResponse(error);
  }
}
