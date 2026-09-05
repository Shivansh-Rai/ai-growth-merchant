import * as React from "react";
import { cn } from "@/lib/utils";

export type BadgeTone = "neutral" | "brand" | "positive" | "caution" | "critical";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-surface-muted text-ink-muted border-line",
  brand: "bg-brand-50 text-brand-700 border-brand-100",
  positive: "bg-positive-soft text-positive border-positive/15",
  caution: "bg-caution-soft text-caution border-caution/15",
  critical: "bg-critical-soft text-critical border-critical/15",
};

const DOT_TONES: Record<BadgeTone, string> = {
  neutral: "bg-ink-subtle",
  brand: "bg-brand-600",
  positive: "bg-positive",
  caution: "bg-caution",
  critical: "bg-critical",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  /** Renders a leading status dot — used for lifecycle states. */
  dot?: boolean;
}

/** Compact status label. Tones are semantic, never decorative. */
export function Badge({
  className,
  tone = "neutral",
  dot = false,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5",
        "text-xs font-medium whitespace-nowrap",
        TONES[tone],
        className,
      )}
      {...props}
    >
      {dot ? (
        <span
          aria-hidden
          className={cn("size-1.5 rounded-full", DOT_TONES[tone])}
        />
      ) : null}
      {children}
    </span>
  );
}
