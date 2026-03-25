// src/types/reports.ts

export type ReportType =
  | "payroll_register"
  | "attendance_report"
  | "leave_balance"
  | "tax_certificate"
  | "overtime_summary"
  | "government_remittance";

export interface ReportFilter {
  report_type: ReportType;
  year?: number;
  month?: number;
  payroll_period_id?: number;
  employee_id?: number;
  department?: string;
  date_from?: string;
  date_to?: string;
}

export interface ReportMeta {
  type: ReportType;
  label: string;
  description: string;
  icon: string;
  filters: ("period" | "year" | "month" | "employee" | "department" | "date_range")[];
  roles: string[]; // who can generate
}

export const REPORT_META: ReportMeta[] = [
  {
    type: "payroll_register",
    label: "Payroll register",
    description: "Full earnings & deductions for all employees in a pay period.",
    icon: "dollar",
    filters: ["period"],
    roles: ["Admin", "Accountant", "HR Manager"],
  },
  {
    type: "attendance_report",
    label: "Attendance report",
    description: "Daily attendance summary with present, absent, late, and leave counts.",
    icon: "clock",
    filters: ["month", "year", "department"],
    roles: ["Admin", "HR Manager", "Manager"],
  },
  {
    type: "leave_balance",
    label: "Leave balance report",
    description: "Remaining leave days per employee across all leave types.",
    icon: "calendar",
    filters: ["year", "department"],
    roles: ["Admin", "HR Manager"],
  },
  {
    type: "tax_certificate",
    label: "Tax certificate (BIR 2316)",
    description: "Annual tax certificate per employee for BIR filing.",
    icon: "file",
    filters: ["year", "employee"],
    roles: ["Admin", "Accountant"],
  },
  {
    type: "overtime_summary",
    label: "Overtime summary",
    description: "Approved overtime hours and computed pay per employee.",
    icon: "timer",
    filters: ["month", "year", "department"],
    roles: ["Admin", "HR Manager", "Accountant"],
  },
  {
    type: "government_remittance",
    label: "Government remittance",
    description: "SSS, PhilHealth, Pag-IBIG, and BIR totals for a pay period.",
    icon: "shield",
    filters: ["period"],
    roles: ["Admin", "Accountant"],
  },
];