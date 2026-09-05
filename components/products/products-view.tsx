"use client";

import * as React from "react";
import { Package, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableEmptyRow,
  TableWrapper,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/components/ui/table";
import { ResultCount, Toolbar, ToolbarGroup } from "@/components/ui/toolbar";
import { useDemoCollection } from "@/components/demo/demo-data";
import { formatCurrency, formatNumber } from "@/lib/format";
import { PRODUCT_STATUS_LABELS } from "@/lib/labels";
import { demoProducts } from "@/lib/placeholder-data";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

const STATUS_OPTIONS = [
  { label: "All statuses", value: "all" },
  ...Object.entries(PRODUCT_STATUS_LABELS).map(([value, spec]) => ({
    value,
    label: spec.label,
  })),
];

const COLUMN_COUNT = 5;

/** Below this level a product is flagged so the merchant can restock. */
const LOW_STOCK_THRESHOLD = 20;

export interface ProductsViewProps {
  /** Real catalog rows. Empty until the product database is connected. */
  products: Product[];
}

export function ProductsView({ products }: ProductsViewProps) {
  const source = useDemoCollection(products, demoProducts);

  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState("all");

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase();

    return source.filter((product) => {
      if (status !== "all" && product.status !== status) return false;
      if (!needle) return true;

      return [product.name, product.sku, product.category].some((field) =>
        field.toLowerCase().includes(needle),
      );
    });
  }, [source, query, status]);

  const hasFilters = query !== "" || status !== "all";

  function clearFilters() {
    setQuery("");
    setStatus("all");
  }

  return (
    <Card>
      <Toolbar>
        <ToolbarGroup>
          <Input
            icon={Search}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, SKU or category"
            aria-label="Search products"
            wrapperClassName="w-full sm:w-72"
          />
          <Select
            options={STATUS_OPTIONS}
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            aria-label="Filter by status"
            wrapperClassName="w-full sm:w-44"
          />
          {hasFilters ? (
            <Button size="sm" variant="ghost" onClick={clearFilters}>
              Clear
            </Button>
          ) : null}
        </ToolbarGroup>

        <ResultCount
          count={filtered.length}
          noun={filtered.length === 1 ? "product" : "products"}
        />
      </Toolbar>

      <TableWrapper>
        <Table className="min-w-[840px]">
          <THead>
            <TR>
              <TH>Product</TH>
              <TH>Category</TH>
              <TH align="right">Price</TH>
              <TH align="right">Stock</TH>
              <TH>Status</TH>
            </TR>
          </THead>
          <TBody>
            {filtered.length === 0 ? (
              <TableEmptyRow colSpan={COLUMN_COUNT}>
                <EmptyState
                  icon={Package}
                  title={
                    source.length === 0
                      ? "No products yet"
                      : "No products match these filters"
                  }
                  description={
                    source.length === 0
                      ? "Your catalog will appear here once products are added. The AI agent uses price, stock and category to find alternatives worth recommending."
                      : "Try a different status, or clear the filters to see the full catalog."
                  }
                  action={
                    source.length > 0 && hasFilters ? (
                      <Button size="sm" onClick={clearFilters}>
                        Clear filters
                      </Button>
                    ) : null
                  }
                />
              </TableEmptyRow>
            ) : (
              filtered.map((product) => {
                const spec = PRODUCT_STATUS_LABELS[product.status];
                const lowStock =
                  product.stock > 0 && product.stock < LOW_STOCK_THRESHOLD;

                return (
                  <TR key={product.id} interactive>
                    <TD>
                      <span className="block font-medium">{product.name}</span>
                      <span className="tabular block text-xs text-ink-muted">
                        {product.sku}
                      </span>
                    </TD>
                    <TD className="text-[13px] text-ink-muted">
                      {product.category}
                    </TD>
                    <TD align="right" className="tabular font-medium">
                      {formatCurrency(product.price)}
                    </TD>
                    <TD
                      align="right"
                      className={cn(
                        "tabular",
                        product.stock === 0 && "text-critical",
                        lowStock && "text-caution",
                      )}
                    >
                      {formatNumber(product.stock)}
                    </TD>
                    <TD>
                      <Badge tone={spec.tone} dot>
                        {spec.label}
                      </Badge>
                    </TD>
                  </TR>
                );
              })
            )}
          </TBody>
        </Table>
      </TableWrapper>
    </Card>
  );
}
