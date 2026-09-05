"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** Accessible name, required when no visible label is associated. */
  label: string;
  /** Hides the visible label but keeps it available to screen readers. */
  hideLabel?: boolean;
  disabled?: boolean;
  className?: string;
}

/** Minimal toggle. The only element in the system with a motion transition. */
export function Switch({
  checked,
  onCheckedChange,
  label,
  hideLabel = false,
  disabled = false,
  className,
}: SwitchProps) {
  return (
    <label
      className={cn(
        "inline-flex items-center gap-2",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        className,
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={hideLabel ? label : undefined}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors",
          checked
            ? "border-brand-600 bg-brand-600"
            : "border-line-strong bg-line",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "block size-3.5 rounded-full bg-white transition-transform",
            checked ? "translate-x-[18px]" : "translate-x-[3px]",
          )}
        />
      </button>
      {hideLabel ? null : (
        <span className="text-[13px] font-medium text-navy select-none">
          {label}
        </span>
      )}
    </label>
  );
}
