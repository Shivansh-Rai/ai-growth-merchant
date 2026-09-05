import {
  BarChart3,
  LayoutDashboard,
  Package,
  ScrollText,
  Settings,
  Sparkles,
  Target,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Nested routes rendered as a group in the sidebar. */
  children?: NavItem[];
}

/**
 * The single source of truth for navigation.
 *
 * The sidebar renders from this list and the header derives the current page
 * title from it, so adding a section is a one-line change here plus a `page.tsx`.
 */
export const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/overview", icon: LayoutDashboard },
  { label: "Customers", href: "/customers", icon: Users },
  { label: "Products", href: "/products", icon: Package },
  {
    label: "AI Growth",
    href: "/growth",
    icon: Sparkles,
    children: [
      { label: "Opportunities", href: "/growth/opportunities", icon: Target },
      { label: "AI Actions", href: "/growth/actions", icon: Zap },
    ],
  },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Audit Logs", href: "/audit-logs", icon: ScrollText },
  { label: "Settings", href: "/settings", icon: Settings },
];

/** Flattened leaf routes — every item that maps to a real page. */
export const NAV_LEAVES: NavItem[] = NAV_ITEMS.flatMap((item) =>
  item.children ? item.children : [item],
);

/** True when `href` is the active route (or an ancestor of it). */
export function isActiveRoute(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Resolves the page title shown in the header for the current route. */
export function getPageTitle(pathname: string) {
  const match = NAV_LEAVES.find((item) => isActiveRoute(pathname, item.href));
  return match?.label ?? "The Next Gen Store";
}

/** Breadcrumb trail for nested routes, e.g. AI Growth → Opportunities. */
export function getBreadcrumbs(pathname: string): NavItem[] {
  for (const item of NAV_ITEMS) {
    if (item.children) {
      const child = item.children.find((c) => isActiveRoute(pathname, c.href));
      if (child) return [item, child];
    } else if (isActiveRoute(pathname, item.href)) {
      return [item];
    }
  }
  return [];
}
