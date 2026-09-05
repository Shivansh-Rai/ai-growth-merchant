"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronDown, LogOut, ScrollText, Search, Settings } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverHeader,
  PopoverItem,
  PopoverSeparator,
} from "@/components/ui/popover";
import { DemoToggle } from "@/components/demo/demo-toggle";
import { getBreadcrumbs, getPageTitle } from "@/lib/nav";
import { MERCHANT_PROFILE } from "@/lib/merchant";
import { MobileNav } from "./mobile-nav";

const SEARCH_PLACEHOLDER = "Search customers, products, opportunities…";

function GlobalSearch({ className }: { className?: string }) {
  return (
    <Input
      type="search"
      icon={Search}
      aria-label="Search"
      placeholder={SEARCH_PLACEHOLDER}
      wrapperClassName={className}
    />
  );
}

function NotificationsMenu() {
  return (
    <Popover
      trigger={({ open }) => (
        <button
          type="button"
          aria-label="Notifications"
          className={`flex size-9 items-center justify-center rounded-md transition-colors hover:bg-surface-muted hover:text-navy ${
            open ? "bg-surface-muted text-navy" : "text-ink-muted"
          }`}
        >
          <Bell className="size-4.5" aria-hidden />
        </button>
      )}
      panelClassName="w-80"
    >
      <PopoverHeader>
        <p className="text-[13px] font-semibold text-navy">Notifications</p>
      </PopoverHeader>
      <EmptyState
        size="inline"
        icon={Bell}
        title="No notifications"
        description="Alerts about AI decisions and revenue events will appear here."
      />
    </Popover>
  );
}

function ProfileMenu() {
  const { name, email, storeName } = MERCHANT_PROFILE;

  return (
    <Popover
      trigger={({ open }) => (
        <button
          type="button"
          aria-label="Merchant menu"
          className={`flex items-center gap-2 rounded-md py-1 pr-1.5 pl-1 transition-colors hover:bg-surface-muted ${
            open ? "bg-surface-muted" : ""
          }`}
        >
          <Avatar name={name} />
          <span className="hidden min-w-0 text-left sm:block">
            <span className="block truncate text-[13px] leading-tight font-medium text-navy">
              {name}
            </span>
            <span className="block truncate text-[11px] leading-tight text-ink-subtle">
              {storeName}
            </span>
          </span>
          <ChevronDown className="size-3.5 shrink-0 text-ink-subtle" aria-hidden />
        </button>
      )}
      panelClassName="w-64"
    >
      <PopoverHeader className="block">
        <p className="truncate text-[13px] font-semibold text-navy">{name}</p>
        <p className="truncate text-xs text-ink-muted">{email}</p>
      </PopoverHeader>

      <div className="py-1">
        <Link href="/settings" className="block">
          <PopoverItem icon={<Settings aria-hidden />}>Settings</PopoverItem>
        </Link>
        <Link href="/audit-logs" className="block">
          <PopoverItem icon={<ScrollText aria-hidden />}>Audit logs</PopoverItem>
        </Link>

        <PopoverSeparator />

        <PopoverItem
          icon={<LogOut aria-hidden />}
          disabled
          title="Available once authentication is added"
          className="cursor-not-allowed opacity-50 hover:bg-transparent"
        >
          Sign out
        </PopoverItem>
      </div>
    </Popover>
  );
}

/**
 * Sticky top bar: current page title, global search, notifications and the
 * merchant menu. Search collapses to its own row below `md`.
 */
export function Header() {
  const pathname = usePathname();
  const title = getPageTitle(pathname);
  const breadcrumbs = getBreadcrumbs(pathname);
  const parent = breadcrumbs.length > 1 ? breadcrumbs[0] : null;

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur-sm">
      <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
        <MobileNav />

        <div className="min-w-0 flex-1">
          {parent ? (
            <p className="text-[11px] leading-tight font-medium tracking-wide text-ink-subtle uppercase">
              {parent.label}
            </p>
          ) : null}
          <h1 className="truncate text-[17px] leading-tight font-semibold tracking-tight text-navy">
            {title}
          </h1>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <GlobalSearch className="hidden w-52 md:block lg:w-72" />
          <DemoToggle className="hidden md:flex" />
          <NotificationsMenu />
          <ProfileMenu />
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-line px-4 py-2 md:hidden">
        <GlobalSearch className="min-w-0 flex-1" />
        <DemoToggle />
      </div>
    </header>
  );
}
