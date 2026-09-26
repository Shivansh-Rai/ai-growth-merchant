import Link from "next/link";

import type { StorefrontProduct } from "@/lib/storefront/product-projection";

import { AvailabilityBadge } from "./availability-badge";
import { Price } from "./price";
import { ProductImage } from "./product-image";

export function ProductCard({
  product,
  storeSlug,
}: {
  product: StorefrontProduct;
  storeSlug: string;
}) {
  return (
    <Link
      href={`/s/${storeSlug}/p/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-line bg-canvas transition-colors hover:border-brand-300"
    >
      <ProductImage
        image={product.primaryImage}
        fallbackLabel={product.name}
        className="aspect-square w-full"
      />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
          {product.brandName ?? product.categoryName}
        </p>
        <h2 className="text-sm font-semibold text-navy group-hover:text-brand-700">
          {product.name}
        </h2>
        <div className="mt-auto flex flex-col gap-2 pt-2">
          <Price
            sellingPricePaise={product.sellingPricePaise}
            mrpPaise={product.mrpPaise}
            discountPercent={product.discountPercent}
          />
          <div>
            <AvailabilityBadge availability={product.availability} />
          </div>
        </div>
      </div>
    </Link>
  );
}
