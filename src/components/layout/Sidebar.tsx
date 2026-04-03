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
  BookOpen,
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
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Employees", path: "/employees", icon: Users, roles: ["Admin", "HR Manager", "Manager"] },
  { label: "Attendance", path: "/attendance", icon: Clock },
  { label: "Payroll", path: "/payroll", icon: DollarSign, roles: ["Admin", "Accountant", "HR Manager"] },
  { label: "Performance", path: "/performance", icon: BarChart3 },

  // ── HR Operations ─────────────────────────────────────────────────────────
  { label: "Recruitment", path: "/recruitment", icon: Briefcase, roles: ["Admin", "HR Manager"], divider: true },
  { label: "Training", path: "/training", icon: BookOpen, roles: ["Admin", "HR Manager"] },

  // ── Admin ─────────────────────────────────────────────────────────────────
  { label: "Archived employees", path: "/archived-employees", icon: Archive, roles: ["Admin", "HR Manager"], divider: true },
];

// ── Component ─────────────────────────────────────────────────────────────────

interface SidebarProps {
  onNavigate?: (path: string) => void;
}

export function Sidebar({ onNavigate }: SidebarProps = {}) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState<boolean>(false);

  const role = user?.role ?? "";

  const visibleItems = NAV_ITEMS.filter(
    (item: NavItem) => !item.roles || item.roles.includes(role)
  );

  const handleLinkClick = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    }
  };

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-yellow-400 bg-blue-900 transition-all duration-300 select-none h-screen sticky top-0",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex h-16 items-center border-b border-yellow-400 px-4 flex-shrink-0",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        {!collapsed && (
          <div>
            <p className="font-semibold text-sm text-yellow-300 leading-tight">Blue Lotus</p>
            <p className="text-xs text-yellow-200">HR Management</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 flex-shrink-0 text-yellow-300 hover:bg-blue-800 hover:text-yellow-200"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {visibleItems.map((item: NavItem) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.path ||
            (item.path !== "/" && pathname.startsWith(item.path));

          return (
            <div key={item.path}>
              {/* Divider */}
              {item.divider && !collapsed && (
                <div className="my-2 border-t border-yellow-600" />
              )}
              {item.divider && collapsed && <div className="my-1" />}

              <Link
                to={item.path}
                title={collapsed ? item.label : undefined}
                onClick={() => handleLinkClick(item.path)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-yellow-500 text-blue-900 shadow-sm"
                    : "text-yellow-200 hover:bg-blue-800 hover:text-yellow-300",
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
      <div className="border-t border-yellow-600 p-2 flex-shrink-0">
        {!collapsed && user && (
          <div className="mb-1 px-3 py-2">
            <p className="text-sm font-medium text-yellow-300 truncate">{user.name}</p>
            <p className="text-xs text-yellow-200">{user.role}</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "w-full text-yellow-300 hover:text-yellow-200 hover:bg-blue-800",
            collapsed ? "justify-center px-2" : "justify-start gap-3"
          )}
          onClick={() => logout()}
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </Button>
      </div>
    </aside>
  );
}