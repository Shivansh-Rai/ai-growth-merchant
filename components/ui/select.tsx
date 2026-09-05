import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  wrapperClassName?: string;
}

/** Native select styled to match the system — used for table filters. */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ className, options, wrapperClassName, ...props }, ref) {
    return (
      <div className={cn("relative", wrapperClassName)}>
        <select
          ref={ref}
          className={cn(
            "h-9 w-full appearance-none rounded-md border border-line-strong bg-white",
            "py-0 pr-8 pl-3 text-sm text-navy",
            "transition-colors focus:border-brand-600 focus:outline-none",
            className,
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-ink-subtle"
        />
      </div>
    );
  },
);
