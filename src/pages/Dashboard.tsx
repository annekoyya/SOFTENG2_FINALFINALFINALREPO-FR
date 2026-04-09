// src/pages/Dashboard.tsx
// REPLACE ENTIRE FILE

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { authFetch } from "@/hooks/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, CheckCircle, Clock, DollarSign, Briefcase,
  CalendarDays, UserPlus, Loader2, AlertCircle, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardData {
  total_employees: number;
  present_today: number;
  absent_today: number;
  pending_leaves: number;
  total_payroll_this_month: number;
  open_jobs: number;
  payroll_trend: { month: string; gross: number; net: number }[];
  attendance_today: { status: string; count: number }[];
  dept_headcount: { department: string; count: number }[];
  upcoming_birthdays: { id: number; full_name: string; department: string; birthday: string; days_until: number }[];
  recent_hires: { id: number; full_name: string; department: string; job_category: string; start_date: string }[];
  pending_leave_list: { id: number; employee: string; leave_type: string; start_date: string; end_date: string; reason: string }[];
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, sub, iconBg, to,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  iconBg: string;
  to?: string;
}) {
  const inner = (
    <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4 hover:border-border/80 hover:shadow-sm transition-all cursor-pointer">
      <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center shrink-0", iconBg)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{label}</p>
      </div>
    </div>
  );

  return to ? <Link to={to}>{inner}</Link> : <div>{inner}</div>;
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, icon: Icon, to, children }: {
  title: string; icon: React.ElementType; to?: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        </div>
        {to && (
          <Link to={to} className="text-xs text-blue-600 hover:underline flex items-center gap-0.5">
            View all <ChevronRight className="h-3 w-3" />
          </Link>
        )}
      </div>
      <div className="divide-y divide-border">{children}</div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user }                        = useAuth();
  const [data, setData]                 = useState<DashboardData | null>(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(false);

  useEffect(() => {
    authFetch("/api/dashboard/stats")
      .then(r => r.json())
      .then(body => {
        // Handle both { data: {...} } and flat response
        const d = body.data ?? body;
        setData(d);
      })
      .catch(() => setError(true))
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
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-3">
          <AlertCircle className="h-10 w-10" />
          <p>Could not load dashboard data.</p>
          <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </DashboardLayout>
    );
  }

  const attendanceRate = data.total_employees > 0
    ? Math.round((data.present_today / data.total_employees) * 100)
    : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {greeting()}, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Stat cards row 1 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Users} label="Total Employees"
            value={data.total_employees}
            iconBg="bg-blue-100 text-blue-600"
            to="/employees"
          />
          <StatCard
            icon={CheckCircle} label="Present Today"
            value={data.present_today}
            sub={`${attendanceRate}% attendance rate`}
            iconBg="bg-green-100 text-green-600"
            to="/attendance"
          />
          <StatCard
            icon={Clock} label="Pending Leaves"
            value={data.pending_leaves}
            sub={data.pending_leaves > 0 ? "Needs approval" : "All cleared"}
            iconBg={data.pending_leaves > 0 ? "bg-amber-100 text-amber-600" : "bg-muted text-muted-foreground"}
            to="/leave"
          />
          <StatCard
            icon={Briefcase} label="Open Positions"
            value={data.open_jobs}
            iconBg="bg-purple-100 text-purple-600"
            to="/recruitment"
          />
        </div>

        {/* Stat cards row 2 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={DollarSign} label="Payroll This Month"
            value={data.total_payroll_this_month > 0
              ? `₱${(data.total_payroll_this_month / 1000).toFixed(0)}k`
              : "₱0"}
            sub="Total net pay"
            iconBg="bg-teal-100 text-teal-600"
            to="/accounting"
          />
          <StatCard
            icon={Users} label="Absent Today"
            value={data.absent_today}
            iconBg="bg-red-100 text-red-600"
            to="/attendance"
          />
          <StatCard
            icon={UserPlus} label="Recent Hires"
            value={data.recent_hires?.length ?? 0}
            sub="Last 30 days"
            iconBg="bg-indigo-100 text-indigo-600"
            to="/employees"
          />
          <StatCard
            icon={CalendarDays} label="Upcoming Birthdays"
            value={data.upcoming_birthdays?.length ?? 0}
            sub="Next 30 days"
            iconBg="bg-pink-100 text-pink-600"
          />
        </div>

        {/* Attendance Today bar */}
        {data.total_employees > 0 && (
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Today's Attendance Overview</h3>
              <Link to="/attendance" className="text-xs text-blue-600 hover:underline">View details</Link>
            </div>
            <div className="flex h-3 rounded-full overflow-hidden bg-muted gap-0.5">
              {data.attendance_today.map(item => {
                const pct = data.total_employees > 0
                  ? (item.count / data.total_employees) * 100 : 0;
                if (pct === 0) return null;
                const colors: Record<string, string> = {
                  present: "bg-green-500", late: "bg-amber-400",
                  absent: "bg-red-400", on_leave: "bg-blue-400",
                };
                return (
                  <div
                    key={item.status}
                    className={cn("h-full transition-all", colors[item.status] ?? "bg-gray-400")}
                    style={{ width: `${pct}%` }}
                    title={`${item.status}: ${item.count}`}
                  />
                );
              })}
            </div>
            <div className="flex flex-wrap gap-4 mt-2">
              {data.attendance_today.map(item => (
                <div key={item.status} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className={cn("h-2 w-2 rounded-full", {
                    "bg-green-500": item.status === "present",
                    "bg-amber-400": item.status === "late",
                    "bg-red-400":   item.status === "absent",
                    "bg-blue-400":  item.status === "on_leave",
                  })} />
                  <span className="capitalize">{item.status.replace("_", " ")}: <strong>{item.count}</strong></span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Middle row: 3 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Pending Leave Requests */}
          <Section title="Pending Leave Requests" icon={Clock} to="/leave">
            {data.pending_leave_list && data.pending_leave_list.length > 0 ? (
              data.pending_leave_list.map(lr => (
                <div key={lr.id} className="flex items-center justify-between px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{lr.employee}</p>
                    <p className="text-xs text-muted-foreground">
                      {lr.leave_type?.replace("_", " ")} · {lr.start_date} → {lr.end_date}
                    </p>
                  </div>
                  <Badge className="ml-3 shrink-0 bg-amber-100 text-amber-700 border-0 text-xs">Pending</Badge>
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No pending leave requests 🎉
              </div>
            )}
          </Section>

          {/* Recent Hires */}
          <Section title="Recent Hires" icon={UserPlus} to="/employees">
            {data.recent_hires && data.recent_hires.length > 0 ? (
              data.recent_hires.map(hire => (
                <div key={hire.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                    {hire.full_name?.[0] ?? "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{hire.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {hire.job_category} · {hire.department}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground shrink-0 ml-auto">
                    {hire.start_date ? new Date(hire.start_date).toLocaleDateString("en-PH", { month: "short", day: "numeric" }) : "—"}
                  </p>
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">No new hires in the last 30 days</div>
            )}
          </Section>

          {/* Upcoming Birthdays */}
          <Section title="Upcoming Birthdays" icon={CalendarDays}>
            {data.upcoming_birthdays && data.upcoming_birthdays.length > 0 ? (
              data.upcoming_birthdays.map(emp => (
                <div key={emp.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="text-xl shrink-0">🎂</div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{emp.full_name}</p>
                    <p className="text-xs text-muted-foreground">{emp.department}</p>
                  </div>
                  <div className="ml-auto text-right shrink-0">
                    <p className="text-xs font-semibold text-pink-600">{emp.birthday}</p>
                    <p className="text-xs text-muted-foreground">
                      {emp.days_until === 0 ? "Today! 🎉" : `in ${emp.days_until}d`}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">No birthdays in the next 30 days</div>
            )}
          </Section>

        </div>

        {/* Quick Actions */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold mb-3">Quick Actions</h3>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/attendance"><Clock className="h-4 w-4 mr-2" /> View Attendance</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/leave"><CalendarDays className="h-4 w-4 mr-2" /> Approve Leaves</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/recruitment"><Briefcase className="h-4 w-4 mr-2" /> Open Positions</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/accounting"><DollarSign className="h-4 w-4 mr-2" /> Payroll</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/employees"><Users className="h-4 w-4 mr-2" /> Employees</Link>
            </Button>
          </div>
        </div>

        {/* Dept headcount */}
        {data.dept_headcount && data.dept_headcount.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold mb-4">Headcount by Department</h3>
            <div className="space-y-2">
              {data.dept_headcount.map(dept => {
                const max = Math.max(...data.dept_headcount.map(d => d.count));
                const pct = max > 0 ? (dept.count / max) * 100 : 0;
                return (
                  <div key={dept.department} className="flex items-center gap-3 text-sm">
                    <span className="w-36 text-muted-foreground truncate text-xs">{dept.department}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-6 text-right text-xs font-medium">{dept.count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}