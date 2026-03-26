// src/components/layout/Sidebar.tsx
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Clock,
  DollarSign,
  Archive,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Briefcase,
  CalendarOff,
  Timer,
  CalendarDays,
  TrendingUp,
  BookOpen,
  AlertCircle,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

// ── Nav item definition ───────────────────────────────────────────────────────

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  /** Roles that can see this link. Undefined = all roles. */
  roles?: string[];
  /** Visual separator above this item */
  divider?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  // ── Core ──────────────────────────────────────────────────────────────────
  { label: "Dashboard",          path: "/",                   icon: LayoutDashboard },
  { label: "Employees",          path: "/employees",          icon: Users,          roles: ["Admin", "HR Manager", "Manager"] },
  { label: "Attendance",         path: "/attendance",         icon: Clock },
  { label: "Payroll",            path: "/payroll",            icon: DollarSign,     roles: ["Admin", "Accountant", "HR Manager"] },
  { label: "Performance",        path: "/performance",        icon: BarChart3 },

  // ── HR Operations (new) ───────────────────────────────────────────────────
  { label: "Recruitment",        path: "/recruitment",        icon: Briefcase,      roles: ["Admin", "HR Manager"],              divider: true },
  { label: "Leave",              path: "/leave",              icon: CalendarOff },
  { label: "Overtime",           path: "/overtime",           icon: Timer },
  { label: "Holidays",           path: "/holidays",           icon: CalendarDays,   roles: ["Admin", "HR Manager"] },
  { label: "Salary history",     path: "/salary-revisions",   icon: TrendingUp,     roles: ["Admin", "HR Manager"] },
  { label: "Training",           path: "/training",           icon: BookOpen,       roles: ["Admin", "HR Manager"] },
  { label: "Year-end tax",       path: "/year-end-tax",       icon: AlertCircle,    roles: ["Admin", "Accountant", "HR Manager"] },
  { label: "Shift management",   path: "/shifts",             icon: Settings,       roles: ["Admin", "Manager", "HR Manager"] },

  // ── Admin ─────────────────────────────────────────────────────────────────
  { label: "Archived employees", path: "/archived-employees", icon: Archive,        roles: ["Admin", "HR Manager"],              divider: true },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function Sidebar() {
  const { pathname }              = useLocation();
  const { user, logout }          = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const role = user?.role ?? "";

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(role)
  );

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-card transition-all duration-300 select-none",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex h-16 items-center border-b border-border px-4 flex-shrink-0",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        {!collapsed && (
          <div>
            <p className="font-semibold text-sm text-foreground leading-tight">Blue Lotus</p>
            <p className="text-xs text-muted-foreground">HR Management</p>
          </div>
        )}
        <Button
          variant="ghost" size="sm"
          className="h-8 w-8 p-0 flex-shrink-0"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed
            ? <ChevronRight className="h-4 w-4" />
            : <ChevronLeft  className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {visibleItems.map((item) => {
          const Icon     = item.icon;
          const isActive = pathname === item.path ||
            (item.path !== "/" && pathname.startsWith(item.path));

          return (
            <div key={item.path}>
              {/* Divider */}
              {item.divider && !collapsed && (
                <div className="my-2 border-t border-border/60" />
              )}
              {item.divider && collapsed && <div className="my-1" />}

              <Link
                to={item.path}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  collapsed && "justify-center px-2"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            </div>
          );
        })}
      </nav>

      {/* User info + Logout */}
      <div className="border-t border-border p-2 flex-shrink-0">
        {!collapsed && user && (
          <div className="mb-1 px-3 py-2">
            <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.role}</p>
          </div>
        )}
        <Button
          variant="ghost" size="sm"
          className={cn(
            "w-full text-muted-foreground hover:text-foreground",
            collapsed ? "justify-center px-2" : "justify-start gap-3"
          )}
          onClick={logout}
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </Button>
      </div>
    </aside>
  );
}