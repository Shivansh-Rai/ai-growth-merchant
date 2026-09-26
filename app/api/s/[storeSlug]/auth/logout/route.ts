import { logoutCustomer } from "@/lib/auth/logout-customer";
import { resolveStoreBySlug } from "@/lib/store/resolve-store";

/** POST /api/s/[storeSlug]/auth/logout — ends the Session, clears the cookie. */
export async function POST(_request: Request, ctx: RouteContext<"/api/s/[storeSlug]/auth/logout">) {
  const { storeSlug } = await ctx.params;
  const store = await resolveStoreBySlug(storeSlug);
  if (!store) return Response.json({ error: "Store not found" }, { status: 404 });

  await logoutCustomer(store.id);
  return Response.json({ ok: true });
}
