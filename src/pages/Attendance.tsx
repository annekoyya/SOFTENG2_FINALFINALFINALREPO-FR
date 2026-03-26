// src/pages/Attendance.tsx
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, Download } from "lucide-react";
// Fix: ClockInWidget uses default export — import accordingly
import { ClockInWidget } from "@/components/attendance/ClockInWidget";
import { LiveDashboard } from "@/components/attendance/LiveDashboard";
import { AttendanceHistory } from "@/components/attendance/AttendanceHistory";
import { LeaveRequestPortal } from "@/components/attendance/LeaveRequestPortal";
import AttendanceImport from "@/components/attendance/AttendanceImport";
import { useToast } from "@/hooks/use-toast";
import { useAttendance } from "@/hooks/useAttendance";
import { useAuth } from "@/hooks/useAuth";

export default function Attendance() {
  const { toast }    = useToast();
  const { user, isManager, isHR, isAdmin } = useAuth();
  const {
    liveStatus,
    attendances,
    leaveRequests,
    isLoading: isLoadingStatus,
    fetchLiveStatus,
    fetchAttendance,
    createLeaveRequest,
    fetchLeaveRequests,
    approveLeaveRequest,
    rejectLeaveRequest,
    getMonthlyStats,
    monthlyStats,
  } = useAttendance();

  const [activeTab, setActiveTab] = useState("dashboard");

  // True if user can see the manager live dashboard
  const canSeeFullDashboard = isManager() || isHR() || isAdmin();

  // Today's attendance record for the current user
  const todayRecord = attendances.find((a) => {
    const today = new Date().toISOString().split("T")[0];
    return a.date === today;
  });

  useEffect(() => {
    fetchLiveStatus();
    fetchLeaveRequests();
    // Load this month's attendance for the current employee
    const now = new Date();
    fetchAttendance(
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`,
      new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0]
    );
    if (user?.id) {
      getMonthlyStats(now.getMonth() + 1, now.getFullYear());
    }
  }, []);

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-foreground">
            Attendance & Timekeeping
          </h1>
          <p className="mt-1 text-muted-foreground">
            Track work hours, manage leave, and monitor workforce status
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full ${canSeeFullDashboard ? "grid-cols-5" : "grid-cols-4"}`}>
          <TabsTrigger value="dashboard">Live Dashboard</TabsTrigger>
          <TabsTrigger value="clock">Clock In/Out</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="leave">Leave Requests</TabsTrigger>
          {canSeeFullDashboard && <TabsTrigger value="import">Import</TabsTrigger>}
        </TabsList>

        {/* Live Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {canSeeFullDashboard ? (
            <LiveDashboard status={liveStatus} isLoading={isLoadingStatus} />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Today's Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Clock In</span>
                      <span className="font-mono font-semibold text-lg">
                        {todayRecord?.time_in ?? "--:--"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Clock Out</span>
                      <span className="font-mono font-semibold text-lg">
                        {todayRecord?.time_out ?? "--:--"}
                      </span>
                    </div>
                    <div className="border-t border-border pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Hours Worked</span>
                        <span className="font-mono font-semibold text-lg">
                          {todayRecord?.hours_worked ?? "0.00"} hrs
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    This Month
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Present</span>
                      <Badge className="bg-green-100 text-green-800">
                        {monthlyStats?.present ?? 0} days
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Late</span>
                      <Badge className="bg-yellow-100 text-yellow-800">
                        {monthlyStats?.late ?? 0} days
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Absent</span>
                      <Badge className="bg-red-100 text-red-800">
                        {monthlyStats?.absent ?? 0} days
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Clock In/Out Tab */}
        <TabsContent value="clock">
          {!canSeeFullDashboard && user ? (
            <ClockInWidget
              employee={user}
              onSuccess={() => {
                fetchLiveStatus();
                fetchAttendance();
              }}
            />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Clock In/Out is only available for employees
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <AttendanceHistory
            attendances={attendances}
            isLoading={isLoadingStatus}
            onExport={() => {
              toast({ title: "Export Started", description: "Attendance report will download shortly" });
            }}
          />
        </TabsContent>

        {/* Leave Requests Tab */}
        <TabsContent value="leave">
          <LeaveRequestPortal
            leaveRequests={leaveRequests}
            isLoading={isLoadingStatus}
            isManager={canSeeFullDashboard}
            onSubmit={createLeaveRequest}
            onApprove={approveLeaveRequest}
            onReject={rejectLeaveRequest}
          />
        </TabsContent>

        {/* Import Tab - Admin/HR only */}
        {canSeeFullDashboard && (
          <TabsContent value="import">
            <AttendanceImport />
          </TabsContent>
        )}
      </Tabs>
    </DashboardLayout>
  );
}