"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface PopoverProps {
  /** The element that opens the panel. Receives the open state for styling. */
  trigger: (props: { open: boolean }) => React.ReactNode;
  children: React.ReactNode;
  align?: "start" | "end";
  className?: string;
  panelClassName?: string;
}

/**
 * Small anchored panel used by the header menus.
 *
 * Hand-rolled rather than pulled from a dependency: the dashboard needs exactly
 * one dismissible popover behaviour (outside click, Escape, focus return), and
 * keeping it here avoids committing the project to a headless-UI library before
 * the real interaction requirements are known.
 */
export function Popover({
  trigger,
  children,
  align = "end",
  className,
  panelClassName,
}: PopoverProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent | TouchEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div onClick={() => setOpen((value) => !value)}>{trigger({ open })}</div>

      {open ? (
        <div
          className={cn(
            "absolute top-[calc(100%+8px)] z-50 min-w-56 rounded-lg border border-line bg-white",
            "shadow-[0_8px_24px_-8px_rgba(15,23,42,0.18)]",
            align === "end" ? "right-0" : "left-0",
            panelClassName,
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function PopoverHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-b border-line px-4 py-3",
        className,
      )}
      {...props}
    />
  );
}

export interface PopoverItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
}

export function PopoverItem({
  className,
  icon,
  children,
  ...props
}: PopoverItemProps) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center gap-2.5 px-4 py-2 text-left text-[13px] text-navy",
        "transition-colors hover:bg-surface-muted",
        "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-ink-subtle",
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}

export function PopoverSeparator() {
  return <div className="my-1 h-px bg-line" />;
}
