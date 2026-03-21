// src/pages/Dashboard.tsx
import { useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { EmployeeOverview } from "@/components/dashboard/EmployeeOverview";
import { AttendanceChart } from "@/components/dashboard/AttendanceChart";
import { Users, UserCheck, Clock, DollarSign } from "lucide-react";
import { useEmployees } from "@/hooks/useEmployees";
import { useAttendance } from "@/hooks/useAttendance";
import { usePayroll } from "@/hooks/usePayroll";
import { useAuth } from "@/hooks/useAuth";

export default function Dashboard() {
  const { user } = useAuth();
  const { employees, fetchEmployees, pagination }         = useEmployees();
  const { liveStatus, leaveRequests, fetchLiveStatus, fetchLeaveRequests } = useAttendance();
  const { summary: payrollSummary, fetchSummary }         = usePayroll();

  useEffect(() => {
    fetchEmployees();
    fetchLiveStatus();
    fetchLeaveRequests();
    fetchSummary(new Date().getFullYear(), new Date().getMonth() + 1);
  }, []);

  // Derive real stats from live data
  const totalEmployees  = pagination?.total ?? employees.length;
  const presentToday    = (liveStatus?.clocked_in?.length ?? 0) + (liveStatus?.clocked_out?.length ?? 0);
  const totalActive     = totalEmployees > 0 ? totalEmployees : 1; // avoid div/0
  const attendancePct   = totalActive > 0 ? Math.round((presentToday / totalActive) * 100) : 0;
  const pendingLeaves   = leaveRequests.filter((l) => l.status === "pending").length;
  const payrollCost     = payrollSummary?.total_cost ?? 0;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP",
      notation: value >= 1_000_000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value);

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-foreground">
          Welcome back, {user?.name ?? "Admin"}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Here's what's happening today
        </p>
      </div>

      {/* Stats Grid — all real data */}
      <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Employees"
          value={totalEmployees}
          change={`${employees.filter(e => e.employment_type === "regular").length} regular`}
          changeType="positive"
          icon={Users}
          variant="primary"
        />
        <StatsCard
          title="Present Today"
          value={presentToday}
          change={`${attendancePct}% attendance`}
          changeType={attendancePct >= 90 ? "positive" : "neutral"}
          icon={UserCheck}
        />
        <StatsCard
          title="Pending Leaves"
          value={pendingLeaves}
          change={pendingLeaves > 0 ? `${pendingLeaves} need review` : "All clear"}
          changeType={pendingLeaves > 5 ? "negative" : "neutral"}
          icon={Clock}
          variant="gold"
        />
        <StatsCard
          title={`Payroll (${new Date().toLocaleString("default", { month: "short" })})`}
          value={formatCurrency(payrollCost)}
          change={payrollSummary ? `${payrollSummary.count} processed` : "No data yet"}
          changeType="neutral"
          icon={DollarSign}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <AttendanceChart />
          <EmployeeOverview />
        </div>
        <div className="space-y-6">
          <QuickActions />
          <RecentActivity />
        </div>
      </div>
    </DashboardLayout>
  );
}