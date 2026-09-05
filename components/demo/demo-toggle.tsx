"use client";

import { Switch } from "@/components/ui/switch";
import { useDemoMode } from "./demo-data";

/**
 * Header control for the demo-data layer. Remove this alongside
 * components/demo/demo-data.ts once real data is wired up.
 */
export function DemoToggle({ className }: { className?: string }) {
  const { enabled, setEnabled } = useDemoMode();

  return (
    <div className={className}>
      <Switch
        checked={enabled}
        onCheckedChange={setEnabled}
        label="Demo data"
      />
    </div>
  );
}
