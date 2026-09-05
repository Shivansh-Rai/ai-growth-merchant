import { Brand } from "./brand";
import { SidebarNav } from "./sidebar-nav";

/**
 * Persistent desktop sidebar. Fixed so the navigation never scrolls away from
 * a long table; the mobile equivalent lives in mobile-nav.tsx.
 */
export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-white lg:flex">
      <div className="flex h-16 shrink-0 items-center border-b border-line px-4">
        <Brand />
      </div>
      <div className="flex-1 overflow-y-auto">
        <SidebarNav />
      </div>
    </aside>
  );
}
