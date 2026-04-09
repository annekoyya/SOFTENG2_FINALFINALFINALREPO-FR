// src/types/employee.ts
// Single source of truth for the Employee type.
// Matches the backend Employee model exactly.

export interface Employee {
  id: number;
  new_hire_id: number | null;
  manager_id: number | null;
  role: "Employee" | "HR" | "Manager" | "Accountant" | "Admin";
  status: "active" | "on_leave" | "suspended" | "terminated";
  first_name: string;
  last_name: string;
  middle_name: string | null;
  name_extension: string | null;
  date_of_birth: string;
  email: string;
  phone_number: string;
  home_address: string;
  emergency_contact_name: string;
  emergency_contact_number: string;
  relationship: string;
  tin: string | null;
  sss_number: string | null;
  pagibig_number: string | null;
  philhealth_number: string | null;
  bank_name: string | null;
  account_name: string | null;
  account_number: string | null;
  start_date: string;
  end_date: string | null;
  department: string;
  job_category: string;
  employment_type: "regular" | "probationary" | "contractual" | "part_time" | "intern";
  shift_sched: "morning" | "afternoon" | "night";
  basic_salary: string;
  photo_path: string | null;
  full_name?: string;
  // Soft delete — null = active, string timestamp = archived
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmployeeFormData {
  first_name: string;
  last_name: string;
  middle_name?: string;
  name_extension?: string;
  date_of_birth: string;
  email: string;
  phone_number: string;
  home_address: string;
  emergency_contact_name: string;
  emergency_contact_number: string;
  relationship: string;
  tin?: string;
  sss_number?: string;
  pagibig_number?: string;
  philhealth_number?: string;
  bank_name?: string;
  account_name?: string;
  account_number?: string;
  start_date: string;
  end_date?: string;
  department: string;
  job_category: string;
  employment_type: Employee["employment_type"];
  shift_sched: Employee["shift_sched"];
  basic_salary: number;
  role?: Employee["role"];
  manager_id?: number;
}