// src/pages/Dashboard.tsx
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { authFetch } from "@/hooks/api";
import {
  Users, DollarSign, CheckCircle, Timer,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface DashboardStats {
  total_employees: number;
  present_today: number;
  pending_leaves: number;
  pending_overtime: number;
  total_payroll_this_month: number;
  open_jobs: number;
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, sub, color, href,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  href?: string;
}) {
  const inner = (
    <div className="rounded-xl border border-border/60 bg-card p-4 flex items-center gap-4 hover:border-border transition-colors">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon style={{ width: 20, height: 20 }} />
      </div>
      <div>
        <p className="text-2xl font-semibold leading-none">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );

  return href
    ? <a href={href} className="block">{inner}</a>
    : <div>{inner}</div>;
}

// Chart card wrapper removed ─ charts feature to be implemented

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats]     = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Greeting */}
      <div>
        <h1 className="text-xl font-semibold">
          {greeting()}, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {new Date().toLocaleDateString("en-PH", { dateStyle: "full" })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={Users} label="Total employees"
          value={stats?.total_employees ?? "—"}
          color="bg-blue-50 text-blue-600"
          href="/employees"
        />
        <StatCard
          icon={CheckCircle} label="Present today"
          value={stats?.present_today ?? "—"}
          sub={stats ? `of ${stats.total_employees}` : undefined}
          color="bg-emerald-50 text-emerald-600"
          href="/attendance"
        />
        <StatCard
          icon={Timer} label="Pending leaves"
          value={stats?.pending_leaves ?? "—"}
          color={stats?.pending_leaves ? "bg-amber-50 text-amber-600" : "bg-muted text-muted-foreground"}
          href="/leave"
        />
        <StatCard
          icon={Timer} label="Pending overtime"
          value={stats?.pending_overtime ?? "—"}
          color={stats?.pending_overtime ? "bg-orange-50 text-orange-600" : "bg-muted text-muted-foreground"}
          href="/overtime"
        />
      </div>

      {/* Second row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={DollarSign} label="Payroll this month"
          value={stats
            ? `₱${(stats.total_payroll_this_month / 1000).toFixed(0)}k`
            : "—"}
          sub="total net pay"
          color="bg-violet-50 text-violet-600"
          href="/payroll"
        />
        <StatCard
          icon={Users} label="Open positions"
          value={stats?.open_jobs ?? "—"}
          color="bg-pink-50 text-pink-600"
          href="/recruitment"
        />
      </div>

      {/* Chart sections to be implemented */}
    </div>
  );
}