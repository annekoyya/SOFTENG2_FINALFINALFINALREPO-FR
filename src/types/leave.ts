export type LeaveType =
  | "vacation"
  | "sick"
  | "emergency"
  | "maternity"
  | "paternity"
  | "bereavement"
  | "solo_parent"
  | "unpaid";

export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface LeaveBalance {
  id: number;
  employee_id: number;
  employee_name?: string;
  leave_type: LeaveType;
  entitled_days: number;   // total days for the year
  used_days: number;
  pending_days: number;    // days in pending requests
  remaining_days: number;  // entitled - used - pending
  carried_over: number;    // from previous year (max 5)
  year: number;
}

export interface LeaveRequest {
  id: number;
  employee_id: number;
  employee_name?: string;
  department?: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  days_requested: number;
  reason: string;
  status: LeaveStatus;
  approved_by?: number;
  approved_by_name?: string;
  rejected_reason?: string;
  created_at: string;
}

export interface LeavePolicy {
  leave_type: LeaveType;
  label: string;
  days_per_year: number;
  is_accrued: boolean;       // true = earned monthly; false = granted upfront
  carry_over_max: number;    // max days that roll over (0 = no carry-over)
  requires_proof: boolean;   // e.g. sick leave > 3 days needs med cert
  paid: boolean;
}

// Default PH labor law entitlements
export const LEAVE_POLICIES: LeavePolicy[] = [
  { leave_type: "vacation",    label: "Vacation leave",    days_per_year: 15, is_accrued: true,  carry_over_max: 5, requires_proof: false, paid: true },
  { leave_type: "sick",        label: "Sick leave",        days_per_year: 15, is_accrued: true,  carry_over_max: 5, requires_proof: true,  paid: true },
  { leave_type: "emergency",   label: "Emergency leave",   days_per_year: 3,  is_accrued: false, carry_over_max: 0, requires_proof: false, paid: true },
  { leave_type: "maternity",   label: "Maternity leave",   days_per_year: 105,is_accrued: false, carry_over_max: 0, requires_proof: true,  paid: true },
  { leave_type: "paternity",   label: "Paternity leave",   days_per_year: 7,  is_accrued: false, carry_over_max: 0, requires_proof: true,  paid: true },
  { leave_type: "bereavement", label: "Bereavement leave", days_per_year: 3,  is_accrued: false, carry_over_max: 0, requires_proof: false, paid: true },
  { leave_type: "solo_parent", label: "Solo parent leave", days_per_year: 7,  is_accrued: false, carry_over_max: 0, requires_proof: true,  paid: true },
  { leave_type: "unpaid",      label: "Unpaid leave",      days_per_year: 0,  is_accrued: false, carry_over_max: 0, requires_proof: false, paid: false },
];

export const LEAVE_LABEL: Record<LeaveType, string> = Object.fromEntries(
  LEAVE_POLICIES.map((p) => [p.leave_type, p.label])
) as Record<LeaveType, string>;