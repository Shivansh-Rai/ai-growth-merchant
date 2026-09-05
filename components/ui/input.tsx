import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Optional leading icon, e.g. a magnifier on search fields. */
  icon?: LucideIcon;
  /** Applied to the wrapping element so callers can control width. */
  wrapperClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ className, icon: Icon, wrapperClassName, ...props }, ref) {
    return (
      <div className={cn("relative", wrapperClassName)}>
        {Icon ? (
          <Icon
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-subtle"
          />
        ) : null}
        <input
          ref={ref}
          className={cn(
            "h-9 w-full rounded-md border border-line-strong bg-white text-sm text-navy",
            "placeholder:text-ink-subtle",
            "transition-colors focus:border-brand-600 focus:outline-none",
            "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-subtle",
            Icon ? "pr-3 pl-9" : "px-3",
            className,
          )}
          {...props}
        />
      </div>
    );
  },
);

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-md border border-line-strong bg-white px-3 py-2 text-sm text-navy",
        "placeholder:text-ink-subtle",
        "transition-colors focus:border-brand-600 focus:outline-none",
        className,
      )}
      {...props}
    />
  );
});

export interface FieldProps {
  label: string;
  /** Guidance shown beneath the control. */
  description?: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}

/** Label + control + help text, used across the Settings page. */
export function Field({
  label,
  description,
  htmlFor,
  children,
  className,
}: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="block text-[13px] font-medium text-navy"
      >
        {label}
      </label>
      {children}
      {description ? (
        <p className="text-xs leading-5 text-ink-muted">{description}</p>
      ) : null}
    </div>
  );
}
