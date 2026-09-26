import { ProductCard } from "@/components/storefront/product-card";
import { requireStoreContext } from "@/lib/store/store-context";
import { listStorefrontProducts } from "@/lib/storefront/product-projection";

/** Product listing: ACTIVE products of this store only (catalog §6). */
export default async function StorefrontHomePage({ params }: PageProps<"/s/[storeSlug]">) {
  const { storeSlug } = await params;
  const store = await requireStoreContext(storeSlug);
  const products = await listStorefrontProducts(store);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">{store.name}</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {products.length} {products.length === 1 ? "product" : "products"}
        </p>
      </div>

      {products.length === 0 ? (
        <p className="rounded-lg border border-line bg-canvas p-8 text-center text-sm text-ink-muted">
          Nothing on the shelves yet.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <li key={product.id} className="flex">
              <ProductCard product={product} storeSlug={store.slug} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
