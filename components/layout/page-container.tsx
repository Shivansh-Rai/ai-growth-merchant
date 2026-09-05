import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Standard page frame: a capped, padded column that every route renders into.
 * Keeps gutters and vertical rhythm identical across the dashboard.
 */
export function PageContainer({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1400px] space-y-6 px-4 py-6 lg:px-6 lg:py-8",
        className,
      )}
      {...props}
    />
  );
}

export interface PageIntroProps {
  /**
   * One line explaining what the page is for. The page's `<h1>` already lives
   * in the header, so this deliberately does not repeat the title.
   */
  description: string;
  /** Page-level controls, e.g. a primary action or an export button. */
  actions?: React.ReactNode;
  className?: string;
}

export function PageIntro({ description, actions, className }: PageIntroProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <p className="max-w-2xl text-sm leading-6 text-ink-muted">{description}</p>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  );
}

/** Section label used to break a long page into named regions. */
export function SectionHeading({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-3",
        className,
      )}
    >
      <div className="space-y-1">
        <h2 className="text-[15px] font-semibold text-navy">{title}</h2>
        {description ? (
          <p className="text-[13px] text-ink-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
