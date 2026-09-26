import { cn } from "@/lib/utils";

const wholeRupees = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
const withPaise = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Integer paise → "₹1,299" or "₹1,299.50". Division happens only here, at the
 * display edge; money stays integer paise everywhere else (ADR-2.7-020).
 */
export function formatPaise(paise: number): string {
  return paise % 100 === 0 ? wholeRupees.format(paise / 100) : withPaise.format(paise / 100);
}

export function Price({
  sellingPricePaise,
  mrpPaise,
  discountPercent,
  size = "md",
}: {
  sellingPricePaise: number;
  mrpPaise: number;
  discountPercent: number;
  size?: "md" | "lg";
}) {
  const discounted = sellingPricePaise < mrpPaise;

  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span className={cn("font-semibold text-navy", size === "lg" ? "text-2xl" : "text-base")}>
        {formatPaise(sellingPricePaise)}
      </span>
      {discounted ? (
        <>
          <span className="text-sm text-ink-subtle line-through">
            <span className="sr-only">MRP </span>
            {formatPaise(mrpPaise)}
          </span>
          {discountPercent > 0 ? (
            <span className="text-sm font-medium text-positive">{discountPercent}% off</span>
          ) : null}
        </>
      ) : (
        <span className="text-xs text-ink-subtle">MRP</span>
      )}
    </div>
  );
}
