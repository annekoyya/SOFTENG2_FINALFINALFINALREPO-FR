// src/hooks/usePayslip.ts
import { useState, useCallback } from "react";
import { authFetch } from "./api";

export interface PayrollPeriod {
  id: number;
  type: "semi_monthly" | "monthly";
  period_start: string;
  period_end: string;
  label: string;
  status: "open" | "processing" | "computed" | "approved" | "paid";
  notes?: string;
  approved_by?: number;
  approved_at?: string;
  processed_by?: number;
  processed_at?: string;
  created_at: string;
  updated_at: string;
  payslips_count?: number;
}

export interface Payslip {
  id: number;
  payroll_period_id: number;
  employee_id: number;
  employee?: {
    id: number;
    first_name: string;
    last_name: string;
    department: string;
    job_category: string;
    basic_salary: number;
  };
  period?: PayrollPeriod;
  
  // Attendance Summary
  working_days_in_period: number;
  days_worked: number;
  days_absent: number;
  days_on_leave: number;
  days_unpaid_leave: number;
  minutes_late: number;
  overtime_hours: number;
  
  // Earnings
  basic_pay: number;
  overtime_pay: number;
  transport_allowance: number;
  meal_allowance: number;
  other_allowances: number;
  bonuses: number;
  thirteenth_month_pay: number;
  gross_pay: number;
  
  // Deductions
  late_deduction: number;
  absent_deduction: number;
  unpaid_leave_deduction: number;
  sss_employee: number;
  philhealth_employee: number;
  pagibig_employee: number;
  bir_withholding_tax: number;
  sss_loan_deduction: number;
  pagibig_loan_deduction: number;
  company_loan_deduction: number;
  other_deductions: number;
  total_deductions: number;
  
  // Employer Contributions
  sss_employer: number;
  philhealth_employer: number;
  pagibig_employer: number;
  
  // Net Pay
  net_pay: number;
  
  // Workflow
  status: "draft" | "computed" | "approved" | "paid" | "cancelled";
  adjustments_note?: string;
  pdf_path?: string;
  email_sent: boolean;
  email_sent_at?: string;
  
  // Audit
  computed_by?: number;
  computed_at?: string;
  approved_by?: number;
  approved_at?: string;
  
  created_at: string;
  updated_at: string;
  
  // Relations
  line_items?: PayslipLineItem[];
  earnings?: PayslipLineItem[];
  deductions?: PayslipLineItem[];
}

export interface PayslipLineItem {
  id: number;
  payslip_id: number;
  category: "earning" | "deduction";
  label: string;
  amount: number;
  description?: string;
  order: number;
  is_manual: boolean;
}

export interface PayslipSummary {
  period: PayrollPeriod;
  total_employees: number;
  total_gross: number;
  total_deductions: number;
  total_net: number;
  total_sss_employee: number;
  total_sss_employer: number;
  total_philhealth_employee: number;
  total_philhealth_employer: number;
  total_pagibig_employee: number;
  total_pagibig_employer: number;
  total_bir: number;
  by_department: Record<string, { count: number; gross: number; net: number }>;
}

export interface AuditLog {
  id: number;
  entity_type: string;
  entity_id: number;
  action: string;
  user_id: number;
  performer?: {
    id: number;
    name: string;
    email: string;
  };
  before_values?: any;
  after_values?: any;
  description?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface ComputeAllResult {
  success: Array<{ employee_id: number; name: string; net_pay: number }>;
  failed: Array<{ employee_id?: number; name: string; error: string }>;
}

interface UsePayslipReturn {
  periods: PayrollPeriod[];
  payslips: Payslip[];
  selectedPayslip: Payslip | null;
  summary: PayslipSummary | null;
  auditLogs: AuditLog[];
  isLoading: boolean;
  error: string | null;
  
  // Periods
  fetchPeriods: () => Promise<void>;
  createPeriod: (data: { type: string; period_start: string; period_end: string; label: string }) => Promise<PayrollPeriod>;
  generateNextPeriod: (type?: string) => Promise<PayrollPeriod>;
  
  // Payslips
  fetchPayslips: (periodId?: number) => Promise<void>;
  fetchPayslip: (id: number) => Promise<void>;
  computeSingle: (employeeId: number, periodId: number) => Promise<Payslip>;
  computeAll: (periodId: number) => Promise<ComputeAllResult>;
  addAdjustment: (payslipId: number, category: "earning" | "deduction", label: string, amount: number, note: string) => Promise<Payslip>;
  approvePayslip: (id: number) => Promise<void>;
  markAsPaid: (id: number) => Promise<void>;
  approveAll: (periodId: number) => Promise<{ message: string; count: number }>;
  
  // Summary & Audit
  fetchSummary: (periodId: number) => Promise<void>;
  fetchAuditLogs: (periodId?: number) => Promise<void>;
  
  // Email & PDF
  sendEmail: (payslipId: number) => Promise<void>;
  bulkSendEmail: (periodId: number) => Promise<{ sent_count: number; failed_count: number }>;
  
  // Utils
  clearSelected: () => void;
  clearError: () => void;
}

export function usePayslip(): UsePayslipReturn {
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [summary, setSummary] = useState<PayslipSummary | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = (err: unknown) => {
    const message = err instanceof Error ? err.message : "An error occurred";
    setError(message);
    console.error("Payslip error:", err);
  };

  // ─── Periods ────────────────────────────────────────────────────────────────

  const fetchPeriods = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/payroll-periods");
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to fetch periods");
      setPeriods(body.data?.data ?? body.data ?? []);
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createPeriod = useCallback(async (data: { type: string; period_start: string; period_end: string; label: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/payroll-periods", {
        method: "POST",
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to create period");
      const newPeriod = body.data;
      setPeriods((prev) => [newPeriod, ...prev]);
      return newPeriod;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateNextPeriod = useCallback(async (type: string = "semi_monthly") => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authFetch(`/api/payroll-periods/generate-next?type=${type}`, {
        method: "POST",
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to generate next period");
      const newPeriod = body.data;
      setPeriods((prev) => [newPeriod, ...prev]);
      return newPeriod;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ─── Payslips ───────────────────────────────────────────────────────────────

  const fetchPayslips = useCallback(async (periodId?: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = periodId ? `?payroll_period_id=${periodId}` : "";
      const res = await authFetch(`/api/payslips${params}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to fetch payslips");
      setPayslips(body.data?.data ?? body.data ?? []);
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchPayslip = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authFetch(`/api/payslips/${id}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to fetch payslip");
      setSelectedPayslip(body.data);
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const computeSingle = useCallback(async (employeeId: number, periodId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/payslips/compute", {
        method: "POST",
        body: JSON.stringify({ employee_id: employeeId, payroll_period_id: periodId }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to compute payslip");
      const newPayslip = body.data;
      setPayslips((prev) => [newPayslip, ...prev]);
      return newPayslip;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const computeAll = useCallback(async (periodId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/payslips/compute-all", {
        method: "POST",
        body: JSON.stringify({ payroll_period_id: periodId }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to compute all payslips");
      await fetchPayslips(periodId);
      return body.data as ComputeAllResult;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchPayslips]);

  const addAdjustment = useCallback(async (
    payslipId: number,
    category: "earning" | "deduction",
    label: string,
    amount: number,
    note: string
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authFetch(`/api/payslips/${payslipId}/adjust`, {
        method: "POST",
        body: JSON.stringify({ category, label, amount, note }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to add adjustment");
      const updatedPayslip = body.data;
      setPayslips((prev) => prev.map((p) => p.id === payslipId ? updatedPayslip : p));
      if (selectedPayslip?.id === payslipId) setSelectedPayslip(updatedPayslip);
      return updatedPayslip;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [selectedPayslip]);

  const approvePayslip = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authFetch(`/api/payslips/${id}/approve`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to approve payslip");
      const updatedPayslip = body.data;
      setPayslips((prev) => prev.map((p) => p.id === id ? updatedPayslip : p));
      if (selectedPayslip?.id === id) setSelectedPayslip(updatedPayslip);
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [selectedPayslip]);

  const markAsPaid = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authFetch(`/api/payslips/${id}/pay`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to mark payslip as paid");
      const updatedPayslip = body.data;
      setPayslips((prev) => prev.map((p) => p.id === id ? updatedPayslip : p));
      if (selectedPayslip?.id === id) setSelectedPayslip(updatedPayslip);
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [selectedPayslip]);

  const approveAll = useCallback(async (periodId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authFetch(`/api/payslips/approve-all/${periodId}`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to approve all payslips");
      await fetchPayslips(periodId);
      return body.data;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchPayslips]);

  // ─── Summary & Audit ────────────────────────────────────────────────────────

  const fetchSummary = useCallback(async (periodId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authFetch(`/api/payslips/summary?payroll_period_id=${periodId}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to fetch summary");
      setSummary(body.data);
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAuditLogs = useCallback(async (periodId?: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = periodId ? `?payroll_period_id=${periodId}` : "";
      const res = await authFetch(`/api/payslips/audit-trail${params}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to fetch audit logs");
      setAuditLogs(body.data?.data ?? body.data ?? []);
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ─── Email & PDF ────────────────────────────────────────────────────────────

  const sendEmail = useCallback(async (payslipId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authFetch(`/api/payslips/${payslipId}/send-email`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to send email");
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const bulkSendEmail = useCallback(async (periodId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/payslips/bulk-send-email", {
        method: "POST",
        body: JSON.stringify({ payroll_period_id: periodId }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to send bulk emails");
      return body.data;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearSelected = useCallback(() => setSelectedPayslip(null), []);
  const clearError = useCallback(() => setError(null), []);

  return {
    periods,
    payslips,
    selectedPayslip,
    summary,
    auditLogs,
    isLoading,
    error,
    fetchPeriods,
    createPeriod,
    generateNextPeriod,
    fetchPayslips,
    fetchPayslip,
    computeSingle,
    computeAll,
    addAdjustment,
    approvePayslip,
    markAsPaid,
    approveAll,
    fetchSummary,
    fetchAuditLogs,
    sendEmail,
    bulkSendEmail,
    clearSelected,
    clearError,
  };
}
