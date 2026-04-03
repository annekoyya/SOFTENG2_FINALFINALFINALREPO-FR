// src/pages/Attendance.tsx
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, Download, Users, UserCheck, UserX, Calendar, Check, X, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

// ─── Mock Data ─────────────────────────────────────────────────────────────────

// Mock live status data
const mockLiveStatus = {
  total_employees: 45,
  clocked_in: 32,
  on_break: 8,
  on_leave: 5,
  absent: 0,
  recent_clockins: [
    { id: 1, name: "Maria Santos", time: "08:00 AM", department: "Front Office", avatar: "MS" },
    { id: 2, name: "John Doe", time: "08:15 AM", department: "Housekeeping", avatar: "JD" },
    { id: 3, name: "Jane Smith", time: "08:30 AM", department: "Food & Beverage", avatar: "JS" },
    { id: 4, name: "Carlos Mendoza", time: "08:45 AM", department: "Engineering", avatar: "CM" },
    { id: 5, name: "Isabel Garcia", time: "09:00 AM", department: "Human Resources", avatar: "IG" },
  ],
  department_breakdown: [
    { department: "Front Office", clocked_in: 8, total: 12 },
    { department: "Housekeeping", clocked_in: 12, total: 18 },
    { department: "Food & Beverage", clocked_in: 6, total: 10 },
    { department: "Engineering", clocked_in: 3, total: 5 },
    { department: "Human Resources", clocked_in: 2, total: 3 },
    { department: "Finance", clocked_in: 1, total: 2 },
  ]
};

// Mock attendance history data
const mockAttendances = [
  { id: 1, date: "2026-04-03", time_in: "08:00 AM", time_out: "05:00 PM", hours_worked: 8.5, status: "present", minutes_late: 0 },
  { id: 2, date: "2026-04-02", time_in: "08:15 AM", time_out: "05:00 PM", hours_worked: 8.25, status: "late", minutes_late: 15 },
  { id: 3, date: "2026-04-01", time_in: "08:00 AM", time_out: "05:00 PM", hours_worked: 8.5, status: "present", minutes_late: 0 },
  { id: 4, date: "2026-03-31", time_in: "08:00 AM", time_out: "05:00 PM", hours_worked: 8.5, status: "present", minutes_late: 0 },
  { id: 5, date: "2026-03-30", time_in: "09:00 AM", time_out: "05:00 PM", hours_worked: 7.5, status: "late", minutes_late: 60 },
  { id: 6, date: "2026-03-29", time_in: null, time_out: null, hours_worked: 0, status: "absent", minutes_late: 0 },
  { id: 7, date: "2026-03-28", time_in: "08:00 AM", time_out: "05:00 PM", hours_worked: 8.5, status: "present", minutes_late: 0 },
  { id: 8, date: "2026-03-27", time_in: "08:10 AM", time_out: "05:00 PM", hours_worked: 8.33, status: "late", minutes_late: 10 },
];

// Mock leave requests for Admin view (all pending requests from all employees)
const mockAdminLeaveRequests = [
  { id: 1, employee_name: "Maria Santos", employee_id: 1, type: "vacation", start_date: "2026-04-10", end_date: "2026-04-12", days: 3, status: "pending", reason: "Family vacation" },
  { id: 2, employee_name: "John Doe", employee_id: 2, type: "sick", start_date: "2026-04-05", end_date: "2026-04-06", days: 2, status: "approved", reason: "Flu" },
  { id: 3, employee_name: "Jane Smith", employee_id: 3, type: "emergency", start_date: "2026-04-04", end_date: "2026-04-04", days: 1, status: "approved", reason: "Emergency" },
  { id: 4, employee_name: "Carlos Mendoza", employee_id: 4, type: "vacation", start_date: "2026-04-15", end_date: "2026-04-19", days: 5, status: "pending", reason: "Personal time off" },
  { id: 5, employee_name: "Isabel Garcia", employee_id: 5, type: "sick", start_date: "2026-04-08", end_date: "2026-04-09", days: 2, status: "pending", reason: "Doctor's appointment" },
  { id: 6, employee_name: "Roberto Cruz", employee_id: 6, type: "vacation", start_date: "2026-04-20", end_date: "2026-04-22", days: 3, status: "pending", reason: "Beach vacation" },
  { id: 7, employee_name: "Patricia Lim", employee_id: 7, type: "sick", start_date: "2026-04-12", end_date: "2026-04-13", days: 2, status: "pending", reason: "Dengue fever" },
];

// Mock leave requests for Employee view (only current user's requests)
const mockEmployeeLeaveRequests = [
  { id: 1, type: "vacation", start_date: "2026-04-10", end_date: "2026-04-12", days: 3, status: "pending", reason: "Family vacation" },
  { id: 2, type: "sick", start_date: "2026-03-05", end_date: "2026-03-06", days: 2, status: "approved", reason: "Flu" },
  { id: 3, type: "emergency", start_date: "2026-02-04", end_date: "2026-02-04", days: 1, status: "approved", reason: "Emergency" },
];

// Mock monthly stats
const mockMonthlyStats = {
  present: 18,
  late: 5,
  absent: 2,
  on_leave: 3,
  total_days: 28,
  total_hours: 148.5,
};

// ─── Live Dashboard Component ─────────────────────────────────────────────────

function LiveDashboardComponent() {
  const [status] = useState(mockLiveStatus);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Employees</p>
                <p className="text-2xl font-bold">{status.total_employees}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clocked In</p>
                <p className="text-2xl font-bold text-green-600">{status.clocked_in}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">On Leave</p>
                <p className="text-2xl font-bold text-yellow-600">{status.on_leave}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Absent</p>
                <p className="text-2xl font-bold text-red-600">{status.absent}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <UserX className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Clock-ins */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Clock-ins</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {status.recent_clockins.map((clockin) => (
              <div key={clockin.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-600">{clockin.avatar}</span>
                  </div>
                  <div>
                    <p className="font-medium">{clockin.name}</p>
                    <p className="text-xs text-muted-foreground">{clockin.department}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm">{clockin.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Department Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Department Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {status.department_breakdown.map((dept) => (
              <div key={dept.department}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{dept.department}</span>
                  <span>{dept.clocked_in}/{dept.total}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full"
                    style={{ width: `${(dept.clocked_in / dept.total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Clock In/Out Widget Component ───────────────────────────────────────────

function ClockInWidgetComponent() {
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<string | null>(null);
  const { toast } = useToast();

  const handleClockIn = () => {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setIsClockedIn(true);
    setClockInTime(timeString);
    toast({
      title: "Clocked In",
      description: `You clocked in at ${timeString}`,
    });
  };

  const handleClockOut = () => {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setIsClockedIn(false);
    toast({
      title: "Clocked Out",
      description: `You clocked out at ${timeString}. Have a great day!`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clock In/Out</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 mb-4">
            <Clock className="h-12 w-12 text-blue-600" />
          </div>
          {isClockedIn ? (
            <>
              <p className="text-lg font-semibold">You are clocked in</p>
              <p className="text-sm text-muted-foreground">Clocked in at {clockInTime}</p>
            </>
          ) : (
            <>
              <p className="text-lg font-semibold">Ready to start working?</p>
              <p className="text-sm text-muted-foreground">Click the button below to clock in</p>
            </>
          )}
        </div>

        <div className="flex gap-4">
          {!isClockedIn ? (
            <Button onClick={handleClockIn} className="flex-1 bg-green-600 hover:bg-green-700">
              <Clock className="mr-2 h-4 w-4" />
              Clock In
            </Button>
          ) : (
            <Button onClick={handleClockOut} className="flex-1 bg-red-600 hover:bg-red-700">
              <Clock className="mr-2 h-4 w-4" />
              Clock Out
            </Button>
          )}
        </div>

        <div className="border-t pt-4">
          <p className="text-xs text-center text-muted-foreground">
            Note: Clocking in after 8:00 AM will be marked as late.
            Please ensure you clock in/out accurately.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Attendance History Component ────────────────────────────────────────────

function AttendanceHistoryComponent() {
  const [attendances] = useState(mockAttendances);
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredAttendances = attendances.filter(record => {
    if (statusFilter !== "all" && record.status !== statusFilter) return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return <Badge className="bg-green-100 text-green-700">Present</Badge>;
      case "late":
        return <Badge className="bg-yellow-100 text-yellow-700">Late</Badge>;
      case "absent":
        return <Badge className="bg-red-100 text-red-700">Absent</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance History</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex gap-4 mb-4">
          <select 
            className="border rounded-md px-3 py-1 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="present">Present</option>
            <option value="late">Late</option>
            <option value="absent">Absent</option>
          </select>
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Clock In</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Clock Out</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Hours</th>
                <th className="px-4 py-3 text-center text-sm font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredAttendances.map((record) => (
                <tr key={record.id} className="border-t">
                  <td className="px-4 py-3 text-sm">{new Date(record.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm font-mono">{record.time_in || "—"}</td>
                  <td className="px-4 py-3 text-sm font-mono">{record.time_out || "—"}</td>
                  <td className="px-4 py-3 text-sm text-right">{record.hours_worked.toFixed(2)}h</td>
                  <td className="px-4 py-3 text-center">{getStatusBadge(record.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filteredAttendances.length} of {attendances.length} records
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Admin Leave Management Component (for Approving/Rejecting) ───────────────

function AdminLeaveManagementComponent() {
  const [leaveRequests, setLeaveRequests] = useState(mockAdminLeaveRequests);
  const { toast } = useToast();

  const handleApprove = (id: number) => {
    setLeaveRequests(prev =>
      prev.map(req =>
        req.id === id ? { ...req, status: "approved" } : req
      )
    );
    toast({
      title: "Leave Request Approved",
      description: "The leave request has been approved",
    });
  };

  const handleReject = (id: number) => {
    setLeaveRequests(prev =>
      prev.map(req =>
        req.id === id ? { ...req, status: "rejected" } : req
      )
    );
    toast({
      title: "Leave Request Rejected",
      description: "The leave request has been rejected",
    });
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "vacation":
        return <Badge className="bg-blue-100 text-blue-700">Vacation</Badge>;
      case "sick":
        return <Badge className="bg-green-100 text-green-700">Sick Leave</Badge>;
      case "emergency":
        return <Badge className="bg-red-100 text-red-700">Emergency</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-700">Approved</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-700">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingRequests = leaveRequests.filter(r => r.status === "pending");
  const otherRequests = leaveRequests.filter(r => r.status !== "pending");

  return (
    <div className="space-y-6">
      {/* Pending Requests Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            Pending Approval
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No pending leave requests</p>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{request.employee_name}</h3>
                        {getTypeBadge(request.type)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                        <span className="ml-2">({request.days} days)</span>
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Reason:</span> {request.reason}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleApprove(request.id)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(request.id)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Other Requests Section */}
      <Card>
        <CardHeader>
          <CardTitle>All Leave Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Employee</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Dates</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Days</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Status</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {otherRequests.map((request) => (
                  <tr key={request.id} className="border-t">
                    <td className="px-4 py-3 text-sm font-medium">{request.employee_name}</td>
                    <td className="px-4 py-3">{getTypeBadge(request.type)}</td>
                    <td className="px-4 py-3 text-sm">
                      {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-center text-sm">{request.days}</td>
                    <td className="px-4 py-3 text-center">{getStatusBadge(request.status)}</td>
                    <td className="px-4 py-3 text-center">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Employee Leave Request Component (for submitting/viewing own requests) ───

function EmployeeLeaveComponent() {
  const [leaveRequests] = useState(mockEmployeeLeaveRequests);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "vacation":
        return <Badge className="bg-blue-100 text-blue-700">Vacation</Badge>;
      case "sick":
        return <Badge className="bg-green-100 text-green-700">Sick Leave</Badge>;
      case "emergency":
        return <Badge className="bg-red-100 text-red-700">Emergency</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-700">Approved</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-700">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Leave Request Submitted",
      description: "Your request has been sent for approval",
    });
    setShowForm(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>My Leave Requests</CardTitle>
        <Button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700">
          + New Request
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Request Form */}
        {showForm && (
          <div className="border rounded-lg p-4 mb-4">
            <h3 className="font-semibold mb-3">Submit Leave Request</h3>
            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Leave Type</label>
                <select className="w-full border rounded-md px-3 py-2">
                  <option>Vacation Leave</option>
                  <option>Sick Leave</option>
                  <option>Emergency Leave</option>
                  <option>Unpaid Leave</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Start Date</label>
                  <input type="date" className="w-full border rounded-md px-3 py-2" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">End Date</label>
                  <input type="date" className="w-full border rounded-md px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Reason</label>
                <textarea rows={3} className="w-full border rounded-md px-3 py-2" placeholder="Please provide reason for leave..." />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Submit Request</Button>
              </div>
            </form>
          </div>
        )}

        {/* Leave Requests Table */}
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Dates</th>
                <th className="px-4 py-3 text-center text-sm font-semibold">Days</th>
                <th className="px-4 py-3 text-center text-sm font-semibold">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Reason</th>
              </tr>
            </thead>
            <tbody>
              {leaveRequests.map((request) => (
                <tr key={request.id} className="border-t">
                  <td className="px-4 py-3">{getTypeBadge(request.type)}</td>
                  <td className="px-4 py-3 text-sm">
                    {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-center text-sm">{request.days}</td>
                  <td className="px-4 py-3 text-center">{getStatusBadge(request.status)}</td>
                  <td className="px-4 py-3 text-sm">{request.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Import Component ─────────────────────────────────────────────────────────

function ImportComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Attendance Data</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <p className="text-muted-foreground mb-2">Upload CSV or Excel file</p>
          <Button variant="outline">Choose File</Button>
          <p className="text-xs text-muted-foreground mt-4">
            Supported formats: .csv, .xlsx, .xls
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Attendance Page ────────────────────────────────────────────────────

export default function Attendance() {
  const { user, isManager, isHR, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  // Check user role - Admin/HR sees management view, Employee sees personal view
  const isAdminOrHR = isAdmin?.() || isHR?.() || true; // Set to true for UI showcase
  
  // For demo purposes, we're showing Admin view. In production, this would be based on actual role
  const showAdminView = true; // Change to false to see Employee view

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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Live Dashboard</TabsTrigger>
          <TabsTrigger value="clock">Clock In/Out</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="leave">Leave Requests</TabsTrigger>
          <TabsTrigger value="import">Import</TabsTrigger>
        </TabsList>

        {/* Live Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <LiveDashboardComponent />
        </TabsContent>

        {/* Clock In/Out Tab */}
        <TabsContent value="clock">
          <ClockInWidgetComponent />
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <AttendanceHistoryComponent />
        </TabsContent>

        {/* Leave Requests Tab - Different view based on role */}
        <TabsContent value="leave">
          {showAdminView ? (
            <AdminLeaveManagementComponent />
          ) : (
            <EmployeeLeaveComponent />
          )}
        </TabsContent>

        {/* Import Tab */}
        <TabsContent value="import">
          <ImportComponent />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}