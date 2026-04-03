// src/components/layout/Sidebar.tsx
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Clock,
  DollarSign,
  BarChart3,
  Briefcase,
  ChevronLeft,
  LogOut,
  Settings,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ── Nav item definition ───────────────────────────────────────────────────────

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  roles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Employee", path: "/employees", icon: Users, roles: ["Admin", "HR Manager", "Manager"] },
  { label: "Attendance", path: "/attendance", icon: Clock },
  { label: "Payroll", path: "/payroll", icon: DollarSign, roles: ["Admin", "Accountant", "HR Manager"] },
  { label: "Performance", path: "/performance", icon: BarChart3 },
  { label: "Recruitment", path: "/recruitment", icon: Briefcase, roles: ["Admin", "HR Manager"] },
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
  const userInitials = user?.name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "SA";

  const visibleItems = NAV_ITEMS.filter(
    (item: NavItem) => !item.roles || item.roles.includes(role)
  );

  const handleLinkClick = (path: string) => {
    if (onNavigate) onNavigate(path);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <aside
      className={cn(
        "flex flex-col bg-blue-900 transition-all duration-300 h-screen sticky top-0 shadow-xl",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo Section - Blue Lotus Hotel */}
      <div
        className={cn(
          "flex h-24 items-center px-5 border-b border-yellow-500/20 flex-shrink-0",
          collapsed ? "justify-center" : "justify-start"
        )}
      >
        {!collapsed ? (
          <div className="flex flex-col">
            <div className="flex items-center gap-2">

              <div>
               <p className="font-bold text-white text-base">BLUE LOTUS HOTEL</p>
<p className="text-[11px] text-white/70 font-medium tracking-wide">Employee Management System</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">

          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-8 px-3">
        <TooltipProvider delayDuration={300}>
          <div className="space-y-1">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.path ||
                (item.path !== "/" && pathname.startsWith(item.path));

              const NavLink = () => (
                <Link
                  to={item.path}
                  onClick={() => handleLinkClick(item.path)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-yellow-500 text-blue-900 shadow-md"
                      : "text-white/70 hover:bg-blue-800 hover:text-white",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <Icon className={cn(
                    "h-5 w-5 shrink-0 transition-all",
                    isActive ? "text-blue-900" : "text-yellow-400/80"
                  )} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.path}>
                    <TooltipTrigger asChild>
                      <NavLink />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-yellow-500 text-blue-900 font-medium border-none">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return <NavLink key={item.path} />;
            })}
          </div>
        </TooltipProvider>
      </nav>

      {/* Bottom Section - User & Actions */}
      <div className="border-t border-yellow-500/20 p-3 space-y-3">
        {/* User Profile */}
        <div
          className={cn(
            "rounded-lg transition-all duration-200",
            !collapsed ? "bg-blue-800/50 p-2" : "p-1"
          )}
        >
          <div className={cn(
            "flex items-center gap-3",
            collapsed && "justify-center"
          )}>
            <div className="h-9 w-9 rounded-full bg-yellow-500 flex items-center justify-center shadow-md">
              <span className="text-sm font-bold text-blue-900">
                {userInitials}
              </span>
            </div>
            
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.name || "System Admin"}
                </p>
                <p className="text-xs text-yellow-500/70">
                  {user?.role || "Admin"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Settings & Help & Logout */}
        {!collapsed && (
          <div className="flex items-center justify-between px-2 py-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-white/60 hover:text-yellow-400 hover:bg-blue-800"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-white/60 hover:text-yellow-400 hover:bg-blue-800"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
            <div className="w-px h-4 bg-yellow-500/20" />
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-white/60 hover:text-red-400 hover:bg-red-500/10"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Collapsed version of actions */}
        {collapsed && (
          <div className="flex flex-col items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-white/60 hover:text-yellow-400 hover:bg-blue-800"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-yellow-500 text-blue-900 border-none">
                Settings
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-white/60 hover:text-yellow-400 hover:bg-blue-800"
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-yellow-500 text-blue-900 border-none">
                Help
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-white/60 hover:text-red-400 hover:bg-red-500/10"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-yellow-500 text-blue-900 border-none">
                Logout
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Collapse Toggle Button */}
        <div className="flex justify-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 w-7 p-0 text-white/60 hover:text-yellow-400 hover:bg-blue-800",
              collapsed && "rotate-180"
            )}
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}