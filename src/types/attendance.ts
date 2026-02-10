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

export interface AttendanceStats {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  onLeaveToday: number;
  attendanceRate: number;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half-day' | 'on-leave';