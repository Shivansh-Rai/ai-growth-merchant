import type { Metadata } from "next";
import {
  PageContainer,
  PageIntro,
} from "@/components/layout/page-container";
import { ProductsView } from "@/components/products/products-view";

export const metadata: Metadata = { title: "Products" };

export default function ProductsPage() {
  // Catalog rows will be fetched here once the product database is connected.
  return (
    <PageContainer>
      <PageIntro description="Your catalog, including the price and stock levels the agent reads when it looks for alternatives to recommend." />
      <ProductsView products={[]} />
    </PageContainer>
  );
}
