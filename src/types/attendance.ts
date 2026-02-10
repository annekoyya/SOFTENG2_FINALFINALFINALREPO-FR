export interface Attendance {
  id: string;
  employee_id: string;
  employee?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    department: string;
  };
  date: string;
  time_in: string | null;
  time_out: string | null;
  status: "present" | "late" | "absent" | "on_leave" | "half_day";
  minutes_late: number;
  hours_worked: number;
  recorded_by: string;
  notes?: string;
  within_grace_period: boolean;
  clock_in_ip?: string;
  clock_out_ip?: string;
  device_info?: string;
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  employee_name: string;
  department_name: string;
  date: string;
  check_in_time?: string;
  check_out_time?: string;
  status: 'present' | 'absent' | 'late' | 'half-day' | 'on-leave';
  hours_worked?: number;
  location?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AttendanceSummary {
  total_days: number;
  present: number;
  late: number;
  absent: number;
  on_leave: number;
  half_day: number;
  total_hours: number;
  total_minutes_late: number;
  records: Attendance[];
}

export interface MonthlyStatistics {
  month: number;
  year: number;
  total_working_days: number;
  present: number;
  late: number;
  absent: number;
  on_leave: number;
  total_hours: number;
  total_minutes_late: number;
  attendance_percentage: number;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  employee?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  start_date: string;
  end_date: string;
  leave_type: "vacation" | "sick" | "emergency" | "unpaid" | "maternity" | "paternity";
  status: "pending" | "approved" | "rejected" | "cancelled";
  number_of_days: number;
  hours_requested: number;
  approver_id?: string;
  approver?: {
    id: string;
    name: string;
  };
  approved_at?: string;
  approval_reason?: string;
  reason: string;
  contact_person?: string;
  contact_phone?: string;
  created_at: string;
  updated_at: string;
}

export interface LiveWorkforceStatus {
  clocked_in: Array<{
    employee: any;
    record: Attendance;
    status: string;
    color: string;
    time_in: string;
  }>;
  clocked_out: Array<{
    employee: any;
    record: Attendance;
    status: string;
    color: string;
    time_in: string;
    time_out: string;
  }>;
  not_arrived: Array<{
    employee: any;
    status: string;
    color: string;
  }>;
  on_leave: Array<{
    employee: any;
    status: string;
    color: string;
  }>;
  absent: Array<{
    employee: any;
    status: string;
    color: string;
  }>;
}

export interface AttendanceStats {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  onLeaveToday: number;
  attendanceRate: number;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half-day' | 'on-leave';