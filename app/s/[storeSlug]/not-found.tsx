/**
 * Unknown store, or an unknown / non-ACTIVE product within a known one.
 *
 * Rendered inside the storefront layout: with the store's frame (and its link
 * home) when the store exists, bare when it does not. Deliberately does not
 * distinguish "draft" from "never existed" — both are simply not for sale.
 */
export default function StorefrontNotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center gap-2 px-4 text-center">
      <p className="text-sm font-semibold text-brand-700">404</p>
      <h1 className="text-xl font-bold text-navy">We couldn&apos;t find that page</h1>
      <p className="text-sm text-ink-muted">
        The store or product you&apos;re looking for isn&apos;t available.
      </p>
    </div>
  );
}
