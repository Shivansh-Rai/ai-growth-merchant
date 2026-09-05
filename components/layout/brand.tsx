import Link from "next/link";
import { Store } from "lucide-react";
import { cn } from "@/lib/utils";

/** Product identity mark. Links home so it doubles as an escape hatch. */
export function Brand({ className }: { className?: string }) {
  return (
    <Link
      href="/overview"
      className={cn("flex items-center gap-2.5", className)}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-brand-600">
        <Store className="size-4 text-white" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm leading-tight font-semibold tracking-tight text-navy">
          The Next Gen Store
        </span>
        <span className="block truncate text-[11px] leading-tight text-ink-subtle">
          Merchant Dashboard
        </span>
      </span>
    </Link>
  );
}
