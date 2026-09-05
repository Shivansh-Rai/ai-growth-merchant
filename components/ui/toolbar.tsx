import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * The filter/search strip that sits above a table. Search sits on the left and
 * filters collapse below it on narrow screens.
 */
export function Toolbar({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-line px-5 py-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
      {...props}
    />
  );
}

export function ToolbarGroup({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-wrap items-center gap-2", className)}
      {...props}
    />
  );
}

/** Right-aligned count, e.g. "12 opportunities". */
export function ResultCount({
  count,
  noun,
  className,
}: {
  count: number;
  noun: string;
  className?: string;
}) {
  return (
    <p className={cn("text-[13px] whitespace-nowrap text-ink-muted", className)}>
      <span className="tabular font-medium text-navy">{count}</span> {noun}
    </p>
  );
}
