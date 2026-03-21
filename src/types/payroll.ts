// src/types/payroll.ts
// Fix: id fields changed from string → number to match backend auto-increment PKs

export interface Payroll {
  id: number;                // was string — backend returns integer
  employee_id: number;       // was string — FK is integer
  employee?: {
    id: number;              // was string
    first_name: string;
    last_name: string;
    email: string;
    job_category: string;
    department: string;
  };
  pay_period_start: string;
  pay_period_end: string;
  base_salary: number;
  overtime_pay: number;
  bonuses: number;
  allowances: number;
  gross_salary: number;
  sss_contribution: number;
  philhealth_contribution: number;
  pagibig_contribution: number;
  tax_withholding: number;
  other_deductions: number;
  total_deductions: number;
  net_salary: number;
  status: "draft" | "pending_approval" | "approved" | "processed" | "paid" | "failed";
  notes?: string;
  calculation_breakdown?: {
    earnings: {
      base_salary?: { label: string; amount: number };
      overtime_pay?: { label: string; amount: number };
      bonuses?: { label: string; amount: number };
      allowances?: { label: string; amount: number };
    };
    deductions: {
      sss_contribution?: { label: string; amount: number };
      philhealth_contribution?: { label: string; amount: number };
      pagibig_contribution?: { label: string; amount: number };
      tax_withholding?: { label: string; amount: number };
      other_deductions?: { label: string; amount: number };
    };
  };
  created_by?: number;
  approved_by?: number;
  approved_at?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PayrollSummary {
  total_cost: number;
  total_net: number;
  total_deductions: number;
  count: number;
  pending_approval: number;
  paid: number;                        // was missing — added to match API
  statuses: Record<string, number>;
}