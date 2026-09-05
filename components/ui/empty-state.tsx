import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon;
  title: string;
  description?: string;
  /** Optional call to action rendered beneath the description. */
  action?: React.ReactNode;
  /** `inline` suits an empty table body; `block` suits a whole panel. */
  size?: "inline" | "block";
}

/**
 * Shown wherever a collection is genuinely empty. Every table and list in the
 * dashboard renders one of these instead of a blank area, so an account with no
 * data yet still reads as a working product.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  size = "block",
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        size === "block" ? "px-6 py-14" : "px-6 py-10",
        className,
      )}
      {...props}
    >
      {Icon ? (
        <div className="mb-3 flex size-10 items-center justify-center rounded-lg border border-line bg-surface-muted">
          <Icon className="size-5 text-ink-subtle" aria-hidden />
        </div>
      ) : null}
      <p className="text-sm font-semibold text-navy">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-[13px] leading-5 text-ink-muted">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
