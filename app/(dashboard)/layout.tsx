import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";

/**
 * Wraps every merchant-facing route in the persistent shell. The `(dashboard)`
 * route group keeps URLs flat — this layout adds no path segment.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
