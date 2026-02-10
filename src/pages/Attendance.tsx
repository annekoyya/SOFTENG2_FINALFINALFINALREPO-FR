import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
// import { AttendanceTable } from "@/components/attendance/AttendanceTable";
// import { AttendanceStats } from "@/components/attendance/AttendanceStats";
// import { AttendanceFilters } from "@/components/attendance/AttendanceFilters";
import { mockAttendanceRecords, mockAttendanceStats } from "@/data/mockAttendance";
import { AttendanceRecord } from "@/types/attendance";
import { Button } from "@/components/ui/button";
import { CalendarDays, Download, Plus } from "lucide-react";

export default function Attendance() {
  const [records] = useState<AttendanceRecord[]>(mockAttendanceRecords);
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>(mockAttendanceRecords);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    // In a real app, this would fetch records for the selected date
    // For now, we'll just filter the mock data
    const filtered = records.filter(record => record.date === date);
    setFilteredRecords(filtered.length > 0 ? filtered : records);
  };

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-foreground">
            Attendance Management
          </h1>
          <p className="mt-1 text-muted-foreground">
            Track and manage employee attendance records
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Mark Attendance
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-8">
        {/* <AttendanceStats stats={mockAttendanceStats} /> */}
      </div>

      {/* Filters */}
      <div className="mb-6">
        {/* <AttendanceFilters
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
        /> */}
      </div>

      {/* Attendance Table */}
      {/* <AttendanceTable records={filteredRecords} /> */}
    </DashboardLayout>
  );
}