import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AvailabilityBadge } from "@/components/storefront/availability-badge";
import { Price } from "@/components/storefront/price";
import { ProductImage } from "@/components/storefront/product-image";
import { SpecList } from "@/components/storefront/spec-list";
import { TrackProductView } from "@/components/storefront/track-product-view";
import { findStoreContext, requireStoreContext } from "@/lib/store/store-context";
import { getStorefrontProduct } from "@/lib/storefront/product-projection";

export async function generateMetadata({
  params,
}: PageProps<"/s/[storeSlug]/p/[productSlug]">): Promise<Metadata> {
  const { storeSlug, productSlug } = await params;
  const store = await findStoreContext(storeSlug);
  const product = store ? await getStorefrontProduct(store, productSlug) : null;
  return { title: product?.name ?? "Product not found" };
}

/** Product detail by (storeId, slug). DRAFT / ARCHIVED → 404 (catalog §6). */
export default async function ProductDetailPage({
  params,
}: PageProps<"/s/[storeSlug]/p/[productSlug]">) {
  const { storeSlug, productSlug } = await params;
  const store = await requireStoreContext(storeSlug);
  const product = await getStorefrontProduct(store, productSlug);
  if (!product) notFound();

  return (
    <div className="flex flex-col gap-6">
      <TrackProductView storeSlug={store.slug} productId={product.id} />
      <Link href={`/s/${store.slug}`} className="text-sm text-brand-700 hover:underline">
        ← All products
      </Link>

      <div className="grid gap-8 md:grid-cols-2">
        <ProductImage
          image={product.primaryImage}
          fallbackLabel={product.name}
          className="aspect-square w-full rounded-lg border border-line"
        />

        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
              {product.brandName ? `${product.brandName} · ` : ""}
              {product.categoryName}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-navy">{product.name}</h1>
            <p className="mt-1 text-xs text-ink-subtle">SKU {product.sku}</p>
          </div>

          <Price
            sellingPricePaise={product.sellingPricePaise}
            mrpPaise={product.mrpPaise}
            discountPercent={product.discountPercent}
            size="lg"
          />

          <div className="flex items-center gap-3">
            <AvailabilityBadge availability={product.availability} />
            {!product.isPurchasable ? (
              <span className="text-sm text-ink-muted">Currently unavailable to buy</span>
            ) : null}
          </div>

          <p className="text-sm leading-relaxed text-navy">{product.description}</p>

          {product.specs ? (
            <section className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold text-navy">Specifications</h2>
              <SpecList specs={product.specs} />
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
