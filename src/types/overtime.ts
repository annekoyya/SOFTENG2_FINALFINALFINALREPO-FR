export type OvertimeStatus = "pending" | "approved" | "rejected" | "paid";

export type OvertimeType =
  | "regular"      // weekday after hours  → 1.25x
  | "rest_day"     // scheduled day off    → 1.30x
  | "special_holiday"  //                 → 1.30x
  | "regular_holiday"; //                 → 2.00x

export interface OvertimeRequest {
  id: number;
  employee_id: number;
  employee_name?: string;
  department?: string;
  date: string;
  overtime_type: OvertimeType;
  hours_requested: number;
  hours_approved?: number;
  reason: string;
  status: OvertimeStatus;
  approved_by?: number;
  approved_by_name?: string;
  rejected_reason?: string;
  payslip_id?: number;          // set when included in payroll
  computed_amount?: number;     // calculated pay amount
  created_at: string;
}

export interface OvertimeStats {
  pending_count: number;
  approved_this_month: number;
  total_hours_this_month: number;
  total_amount_this_month: number;
}

// PH DOLE overtime multipliers
export const OT_MULTIPLIERS: Record<OvertimeType, number> = {
  regular:         1.25,
  rest_day:        1.30,
  special_holiday: 1.30,
  regular_holiday: 2.00,
};

export const OT_TYPE_LABELS: Record<OvertimeType, string> = {
  regular:         "Regular OT (1.25×)",
  rest_day:        "Rest day (1.30×)",
  special_holiday: "Special holiday (1.30×)",
  regular_holiday: "Regular holiday (2.00×)",
};