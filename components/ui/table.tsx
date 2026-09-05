import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Horizontal scroll container. Tables are information-dense, so on narrow
 * viewports they scroll inside this box rather than forcing the page to scroll.
 */
export function TableWrapper({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("w-full overflow-x-auto", className)} {...props} />;
}

export function Table({
  className,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <table
      className={cn("w-full min-w-[720px] border-collapse text-sm", className)}
      {...props}
    />
  );
}

export function THead({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn("border-b border-line bg-surface-muted", className)}
      {...props}
    />
  );
}

export function TBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("divide-y divide-line", className)} {...props} />;
}

export interface TRProps extends React.HTMLAttributes<HTMLTableRowElement> {
  /** Adds a hover treatment for rows that will become clickable. */
  interactive?: boolean;
}

export function TR({ className, interactive, ...props }: TRProps) {
  return (
    <tr
      className={cn(
        interactive && "transition-colors hover:bg-surface-muted",
        className,
      )}
      {...props}
    />
  );
}

export interface CellProps
  extends React.ThHTMLAttributes<HTMLTableCellElement> {
  align?: "left" | "right" | "center";
}

const ALIGN: Record<NonNullable<CellProps["align"]>, string> = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

export function TH({ className, align = "left", ...props }: CellProps) {
  return (
    <th
      scope="col"
      className={cn(
        "px-5 py-2.5 text-xs font-semibold tracking-wide text-ink-muted uppercase",
        ALIGN[align],
        className,
      )}
      {...props}
    />
  );
}

export function TD({ className, align = "left", ...props }: CellProps) {
  return (
    <td
      className={cn(
        "px-5 py-3.5 align-middle text-navy",
        ALIGN[align],
        className,
      )}
      {...props}
    />
  );
}

/** Full-width row used to host an EmptyState inside a table body. */
export function TableEmptyRow({
  colSpan,
  children,
}: {
  colSpan: number;
  children: React.ReactNode;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="p-0">
        {children}
      </td>
    </tr>
  );
}
