"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Database, CalendarDays, BarChart3, Settings } from "lucide-react";

const routes = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Data Input", icon: Database, href: "/input" },
  { label: "Schedule", icon: CalendarDays, href: "/schedule" },
  { label: "Stats & Analytics", icon: BarChart3, href: "/stats" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-muted/40 border-r">
      <div className="flex h-16 items-center px-6 border-b font-semibold text-lg tracking-tight">
        GIK Scheduler
      </div>
      <div className="flex-1 overflow-auto py-4">
        <nav className="grid gap-1 px-4">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === route.href
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <route.icon className="h-4 w-4" />
              {route.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
