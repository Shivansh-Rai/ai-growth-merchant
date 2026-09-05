import * as React from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

/**
 * Persistent chrome for every dashboard route: fixed sidebar, sticky header,
 * and the scrolling content column. Pages render into `children`.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    /* Crisp White canvas throughout — hierarchy comes from borders, not fills. */
    <div className="min-h-screen bg-canvas">
      <Sidebar />
      <div className="flex min-h-screen flex-col lg:pl-64">
        <Header />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
