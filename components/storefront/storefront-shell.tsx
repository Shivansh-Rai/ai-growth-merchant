import Link from "next/link";
import type { ReactNode } from "react";

import { AccountControls } from "./account-controls";

/**
 * Customer-facing frame for one store. Deliberately separate from the merchant
 * dashboard's AppShell — the two surfaces share nothing but design tokens.
 */
export function StorefrontShell({
  storeName,
  storeSlug,
  customerName,
  children,
}: {
  storeName: string;
  storeSlug: string;
  /** The signed-in customer's display name, or null for a guest. */
  customerName: string | null;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-surface-muted">
      <header className="border-b border-line bg-canvas">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href={`/s/${storeSlug}`} className="text-lg font-bold tracking-tight text-navy">
            {storeName}
          </Link>
          <AccountControls storeSlug={storeSlug} customerName={customerName} />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
      <footer className="border-t border-line bg-canvas">
        <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-ink-subtle sm:px-6">
          Prices in INR, inclusive of GST.
        </div>
      </footer>
    </div>
  );
}
