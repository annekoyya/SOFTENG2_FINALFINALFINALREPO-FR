import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  CheckCircle,
  AlertCircle,
  Clock,
  User2,
  TrendingUp,
} from "lucide-react";
import { LiveWorkforceStatus } from "@/types/attendance";

interface LiveDashboardProps {
  status: LiveWorkforceStatus | null;
  isLoading?: boolean;
}

export function LiveDashboard({ status, isLoading = false }: LiveDashboardProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const stats = {
    clockedIn: status?.clocked_in?.length ?? 0,
    clockedOut: status?.clocked_out?.length ?? 0,
    notArrived: status?.not_arrived?.length ?? 0,
    onLeave: status?.on_leave?.length ?? 0,
    absent: status?.absent?.length ?? 0,
  };

  const total = Object.values(stats).reduce((a, b) => a + b, 0);
  const attendanceRate =
    total > 0 ? (((stats.clockedIn + stats.clockedOut) / total) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              Total Workforce
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-green-700 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Clocked In
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{stats.clockedIn}</div>
            <p className="text-xs text-green-600 mt-1">Currently working</p>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-yellow-700 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Not Arrived
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">{stats.notArrived}</div>
            <p className="text-xs text-yellow-600 mt-1">Expected to arrive</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-blue-700 flex items-center gap-1">
              <User2 className="h-3 w-3" />
              On Leave
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{stats.onLeave}</div>
            <p className="text-xs text-blue-600 mt-1">Approved leave</p>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-red-700 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Absent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{stats.absent}</div>
            <p className="text-xs text-red-600 mt-1">No record</p>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Rate */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Today's Attendance Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold">{attendanceRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{ width: `${attendanceRate}%` }}
                ></div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              {stats.clockedIn + stats.clockedOut} of {total} employees clocked in or out
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clocked In List */}
      {status?.clocked_in && status.clocked_in.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Currently Clocked In</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {status.clocked_in.map((item) => (
                <div
                  key={item.employee.id}
                  className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center">
                      <span className="font-semibold text-green-700">
                        {item.employee.first_name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">
                        {item.employee.first_name} {item.employee.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.employee.department}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-green-100 text-green-800 mb-1">
                      {item.status === "late" ? "Late" : "On Time"}
                    </Badge>
                    <p className="text-xs text-muted-foreground font-mono">
                      {item.time_in}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Not Arrived List */}
      {status?.not_arrived && status.not_arrived.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Not Yet Arrived</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {status.not_arrived.map((item) => (
                <div
                  key={item.employee.id}
                  className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-200 flex items-center justify-center">
                      <span className="font-semibold text-yellow-700">
                        {item.employee.first_name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">
                        {item.employee.first_name} {item.employee.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.employee.department}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">Expected</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
