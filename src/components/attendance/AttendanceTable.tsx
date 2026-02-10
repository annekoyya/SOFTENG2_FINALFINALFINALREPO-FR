import { AttendanceRecord } from "@/types/attendance";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface AttendanceTableProps {
  records: AttendanceRecord[];
}

const statusStyles = {
  present: "bg-success/10 text-success border-success/20",
  absent: "bg-destructive/10 text-destructive border-destructive/20",
  late: "bg-warning/10 text-warning border-warning/20",
  "half-day": "bg-orange/10 text-orange-600 border-orange/20",
  "on-leave": "bg-blue/10 text-blue-600 border-blue/20",
};

const statusLabels = {
  present: "Present",
  absent: "Absent",
  late: "Late",
  "half-day": "Half Day",
  "on-leave": "On Leave",
};

export function AttendanceTable({ records }: AttendanceTableProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const formatTime = (time?: string) => {
    if (!time) return "-";
    return time;
  };

  const formatHours = (hours?: number) => {
    if (!hours) return "-";
    return `${hours}h`;
  };

  return (
    <div className="rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Check In</TableHead>
            <TableHead>Check Out</TableHead>
            <TableHead>Hours Worked</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {getInitials(record.employee_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{record.employee_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {record.employee_id}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>{record.department_name}</TableCell>
              <TableCell>{formatTime(record.check_in_time)}</TableCell>
              <TableCell>{formatTime(record.check_out_time)}</TableCell>
              <TableCell>{formatHours(record.hours_worked)}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn("font-medium", statusStyles[record.status])}
                >
                  {statusLabels[record.status]}
                </Badge>
              </TableCell>
              <TableCell>{record.location || "-"}</TableCell>
              <TableCell>
                <div className="max-w-[200px] truncate text-sm text-muted-foreground">
                  {record.notes || "-"}
                </div>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Record
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Clock className="mr-2 h-4 w-4" />
                      Mark Time
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {records.length === 0 && (
        <div className="flex h-32 items-center justify-center text-muted-foreground">
          No attendance records found for the selected date.
        </div>
      )}
    </div>
  );
}