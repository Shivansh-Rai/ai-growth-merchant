"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { NAV_ITEMS, isActiveRoute, type NavItem } from "@/lib/nav";
import { cn } from "@/lib/utils";

const LINK_BASE =
  "group flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium transition-colors";
const LINK_IDLE = "text-ink-muted hover:bg-surface-muted hover:text-navy";
const LINK_ACTIVE = "bg-brand-50 text-brand-700";

function NavLink({
  item,
  active,
  nested = false,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  nested?: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(LINK_BASE, active ? LINK_ACTIVE : LINK_IDLE, nested && "pl-3")}
    >
      <Icon
        aria-hidden
        className={cn(
          "size-4 shrink-0",
          active ? "text-brand-600" : "text-ink-subtle group-hover:text-navy",
        )}
      />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function NavGroup({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
}) {
  const hasActiveChild = item.children!.some((child) =>
    isActiveRoute(pathname, child.href),
  );
  // Expanded by default — Opportunities is the section merchants live in, so it
  // should never be a click away behind a collapsed group.
  const [open, setOpen] = React.useState(true);
  const Icon = item.icon;

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className={cn(
          LINK_BASE,
          "w-full",
          hasActiveChild ? "text-navy" : LINK_IDLE,
        )}
      >
        <Icon
          aria-hidden
          className={cn(
            "size-4 shrink-0",
            hasActiveChild ? "text-brand-600" : "text-ink-subtle",
          )}
        />
        <span className="truncate">{item.label}</span>
        <ChevronDown
          aria-hidden
          className={cn(
            "ml-auto size-3.5 shrink-0 text-ink-subtle transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <ul className="mt-0.5 ml-[19px] space-y-0.5 border-l border-line pl-2.5">
          {item.children!.map((child) => (
            <li key={child.href}>
              <NavLink
                item={child}
                nested
                active={isActiveRoute(pathname, child.href)}
                onNavigate={onNavigate}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

/**
 * Renders the whole navigation tree from `NAV_ITEMS`.
 * `onNavigate` lets the mobile drawer close itself on selection.
 */
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="px-3 py-4">
      <ul className="space-y-0.5">
        {NAV_ITEMS.map((item) =>
          item.children ? (
            <NavGroup
              key={item.href}
              item={item}
              pathname={pathname}
              onNavigate={onNavigate}
            />
          ) : (
            <li key={item.href}>
              <NavLink
                item={item}
                active={isActiveRoute(pathname, item.href)}
                onNavigate={onNavigate}
              />
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}
