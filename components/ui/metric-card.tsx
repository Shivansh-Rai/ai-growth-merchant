import * as React from "react";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MetricDelta {
  /** Percentage change against the comparison period. */
  value: number;
  label: string;
}

export interface MetricCardProps {
  label: string;
  /** The headline figure. Pass a placeholder such as "—" when unmeasured. */
  value: React.ReactNode;
  /** Short qualifier under the value, e.g. "across 42 orders". */
  hint?: string;
  delta?: MetricDelta;
  icon?: LucideIcon;
  className?: string;
}

/**
 * A single KPI tile. Deltas are coloured only when a real comparison exists;
 * an unmeasured metric shows a neutral placeholder instead of a fake zero.
 */
export function MetricCard({
  label,
  value,
  hint,
  delta,
  icon: Icon,
  className,
}: MetricCardProps) {
  const isUp = delta ? delta.value >= 0 : false;
  const DeltaIcon = isUp ? ArrowUpRight : ArrowDownRight;

  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-lg border border-line bg-white p-5",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-ink-muted">{label}</p>
        {Icon ? (
          <Icon className="size-4 shrink-0 text-ink-subtle" aria-hidden />
        ) : null}
      </div>

      <p className="tabular mt-3 text-[26px] leading-8 font-semibold tracking-tight text-navy">
        {value}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
        {delta ? (
          <span
            className={cn(
              "tabular inline-flex items-center gap-0.5 text-[13px] font-medium",
              isUp ? "text-positive" : "text-critical",
            )}
          >
            <DeltaIcon className="size-3.5" aria-hidden />
            {Math.abs(delta.value).toFixed(1)}%
          </span>
        ) : null}
        {(delta?.label ?? hint) ? (
          <span className="text-[13px] text-ink-muted">
            {delta?.label ?? hint}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/** Responsive grid for a row of metric tiles. */
export function MetricGrid({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4",
        className,
      )}
      {...props}
    />
  );
}
