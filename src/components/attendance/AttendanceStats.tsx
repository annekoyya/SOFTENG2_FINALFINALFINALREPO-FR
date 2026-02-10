import { AttendanceStats as AttendanceStatsType } from "@/types/attendance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserX, Clock, Calendar } from "lucide-react";

interface AttendanceStatsProps {
  stats: AttendanceStatsType;
}

export function AttendanceStats({ stats }: AttendanceStatsProps) {
  const statCards = [
    {
      title: "Total Employees",
      value: stats.totalEmployees,
      icon: Users,
      variant: "primary" as const,
    },
    {
      title: "Present Today",
      value: stats.presentToday,
      icon: UserCheck,
      variant: "success" as const,
    },
    {
      title: "Absent Today",
      value: stats.absentToday,
      icon: UserX,
      variant: "destructive" as const,
    },
    {
      title: "Late Today",
      value: stats.lateToday,
      icon: Clock,
      variant: "warning" as const,
    },
    {
      title: "On Leave",
      value: stats.onLeaveToday,
      icon: Calendar,
      variant: "secondary" as const,
    },
    {
      title: "Attendance Rate",
      value: `${stats.attendanceRate}%`,
      icon: UserCheck,
      variant: "primary" as const,
    },
  ];

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {statCards.map((stat) => (
        <Card key={stat.title} className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}