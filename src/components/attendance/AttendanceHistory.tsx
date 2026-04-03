import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Search } from "lucide-react";
import { Attendance } from "@/types/attendance";
import { format } from "date-fns";

interface AttendanceHistoryProps {
  attendances: Attendance[];
  isLoading?: boolean;
  onExport?: () => void;
}

export function AttendanceHistory({
  attendances,
  isLoading = false,
  onExport,
}: AttendanceHistoryProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [month, setMonth] = useState<string>(format(new Date(), "yyyy-MM"));
  const [filtered, setFiltered] = useState<Attendance[]>(attendances);

  useEffect(() => {
    let result = attendances;

    // Filter by month
    result = result.filter((record) => record.date?.startsWith(month));

    // Filter by status
    if (statusFilter !== "all") {
      result = result.filter((record) => record.status === statusFilter);
    }

    // Filter by search - add null safety checks
    if (search) {
      result = result.filter(
        (record) =>
          record.employee?.first_name?.toLowerCase().includes(search.toLowerCase()) ||
          record.employee?.last_name?.toLowerCase().includes(search.toLowerCase()) ||
          record.employee?.email?.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFiltered(result);
  }, [attendances, search, statusFilter, month]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-green-100 text-green-800";
      case "late":
        return "bg-yellow-100 text-yellow-800";
      case "absent":
        return "bg-red-100 text-red-800";
      case "on_leave":
        return "bg-blue-100 text-blue-800";
      case "half_day":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-2">Search Employee</label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Month</label>
            <Input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
                <SelectItem value="half_day">Half Day</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={onExport}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Summary */}
        <div className="text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filtered.length}</span> of{" "}
          <span className="font-semibold text-foreground">{attendances.length}</span> records
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Employee</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Clock In</TableHead>
                <TableHead>Clock Out</TableHead>
                <TableHead className="text-right">Hours Worked</TableHead>
                <TableHead className="text-center">Minutes Late</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <p className="text-muted-foreground">No records found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((record) => {
                  // Null safety check - if employee doesn't exist, show placeholder
                  if (!record.employee) {
                    return (
                      <TableRow key={`${record.id || Math.random()}-${record.date}`}>
                        <TableCell>
                          <div>
                            <p className="font-semibold">Unknown Employee</p>
                            <p className="text-xs text-muted-foreground">
                              Employee data not available
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {record.date ? format(new Date(record.date), "MMM dd, yyyy") : "-"}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {record.time_in || "-"}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {record.time_out || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {record.hours_worked ? `${record.hours_worked}h` : "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          {record.minutes_late ? (
                            <span className="font-semibold text-yellow-700">
                              {record.minutes_late}m
                            </span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={getStatusColor(record.status)}>
                            {getStatusLabel(record.status)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  }

                  // Normal rendering when employee exists
                  return (
                    <TableRow key={`${record.employee.id}-${record.date}`}>
                      <TableCell>
                        <div>
                          <p className="font-semibold">
                            {record.employee.first_name} {record.employee.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {record.employee.id || 'N/A'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {record.date ? format(new Date(record.date), "MMM dd, yyyy") : "-"}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {record.time_in || "-"}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {record.time_out || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {record.hours_worked ? `${record.hours_worked}h` : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {record.minutes_late ? (
                          <span className="font-semibold text-yellow-700">
                            {record.minutes_late}m
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={getStatusColor(record.status)}>
                          {getStatusLabel(record.status)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}