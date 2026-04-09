"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Menu, X, ChevronLeft, ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  group?: string;
}

interface SidebarProps {
  items: NavItem[];
  role: string;
  userName?: string;
}

export function Sidebar({ items, role, userName }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Gruplama
  const groups = new Map<string, NavItem[]>();
  for (const item of items) {
    const g = item.group || "";
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g)!.push(item);
  }

  const roleLabel = role === "egitmen" ? "Egitmen" : role === "admin" ? "Admin" : "Danisan";
  const sidebarWidth = collapsed ? "w-16" : "w-64";

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const isActive =
      pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"));

    const linkContent = (
      <Link
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-[3px] border-primary pl-[9px]"
            : "text-sidebar-foreground hover:bg-sidebar-accent/50 border-l-[3px] border-transparent pl-[9px]",
          collapsed && "justify-center px-2 pl-2",
        )}
      >
        <Icon
          className={cn("shrink-0", isActive ? "text-primary" : "text-muted-foreground")}
          size={18}
        />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip key={item.href} delayDuration={0}>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return <div key={item.href}>{linkContent}</div>;
  };

  return (
    <>
      {/* Mobil hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-3 left-3 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg lg:hidden"
        aria-label="Menu ac"
      >
        <Menu size={20} />
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen border-r bg-sidebar-background transition-all duration-300 flex flex-col",
          sidebarWidth,
          "lg:translate-x-0",
          mobileOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center justify-between border-b px-4">
          <Link href="/" className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
              S
            </div>
            {(!collapsed || mobileOpen) && (
              <span className="text-lg font-bold text-foreground truncate">ShifaHub</span>
            )}
          </Link>
          {/* Mobile close */}
          <button
            onClick={() => setMobileOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-sidebar-accent lg:hidden"
            aria-label="Menu kapat"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-4">
          {Array.from(groups.entries()).map(([groupName, groupItems]) => (
            <div key={groupName}>
              {groupName && !collapsed && (
                <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {groupName}
                </p>
              )}
              {groupName && collapsed && <div className="my-2 mx-2 border-t" />}
              <div className="space-y-0.5">{groupItems.map(renderNavItem)}</div>
            </div>
          ))}
        </nav>

        {/* Bottom: collapse toggle + user info */}
        <div className="border-t p-2 space-y-2">
          {/* Collapse toggle (desktop only) */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-sidebar-accent/50 transition-colors"
          >
            {collapsed ? (
              <ChevronRight size={16} />
            ) : (
              <>
                <ChevronLeft size={16} />
                <span>Daralt</span>
              </>
            )}
          </button>

          {/* User info */}
          <div className={cn("rounded-lg bg-sidebar-accent/50 p-2", collapsed && "p-1")}>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                {(userName || roleLabel).charAt(0).toUpperCase()}
              </div>
              {(!collapsed || mobileOpen) && (
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{userName || roleLabel}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{roleLabel}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* CSS variable for main content margin */}
      <style>{`:root { --sidebar-width: ${collapsed ? "4rem" : "16rem"}; }`}</style>
    </>
  );
}
