import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { EmployeeOverview } from "@/components/dashboard/EmployeeOverview";
import { AttendanceChart } from "@/components/dashboard/AttendanceChart";
import { Users, UserCheck, Clock, DollarSign } from "lucide-react";

export default function Dashboard() {
  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-foreground">
          Welcome back, Admin
        </h1>
        <p className="mt-1 text-muted-foreground">
          Here's what's happening at Blue Lotus Hotel today
        </p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Employees"
          value={158}
          change="+12 this month"
          changeType="positive"
          icon={Users}
          variant="primary"
        />
        <StatsCard
          title="Present Today"
          value={145}
          change="92% attendance"
          changeType="positive"
          icon={UserCheck}
        />
        <StatsCard
          title="Pending Leaves"
          value={8}
          change="3 urgent"
          changeType="neutral"
          icon={Clock}
          variant="gold"
        />
        <StatsCard
          title="Payroll (Jan)"
          value="₱2.4M"
          change="+5% vs last month"
          changeType="neutral"
          icon={DollarSign}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Charts & Tables */}
        <div className="lg:col-span-2 space-y-6">
          <AttendanceChart />
          <EmployeeOverview />
        </div>

        {/* Right Column - Activity & Actions */}
        <div className="space-y-6">
          <QuickActions />
          <RecentActivity />
        </div>
      </div>
    </DashboardLayout>
  );
}
