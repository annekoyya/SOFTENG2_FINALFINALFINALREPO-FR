// src/hooks/useAccounting.ts
import { useState, useCallback } from "react";
import { authFetch } from "./api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PayrollPeriod {
  id: number;
  type: "semi_monthly" | "monthly";
  period_start: string;
  period_end: string;
  label: string;
  status: "open" | "processing" | "computed" | "approved" | "paid";
  approved_by: number | null;
  approved_at: string | null;
  processed_by: number | null;
  processed_at: string | null;
  notes: string | null;
  payslips_count?: number;
  created_at: string;
}

export interface PayslipLineItem {
  id: number;
  payslip_id: number;
  category: "earning" | "deduction";
  label: string;
  amount: number;
  description: string | null;
  order: number;
  is_manual: boolean;
}

export interface Payslip {
  id: number;
  payroll_period_id: number;
  employee_id: number;
  working_days_in_period: number;
  days_worked: number;
  days_absent: number;
  days_on_leave: number;
  days_unpaid_leave: number;
  minutes_late: number;
  overtime_hours: number;
  basic_pay: number;
  overtime_pay: number;
  transport_allowance: number;
  meal_allowance: number;
  other_allowances: number;
  bonuses: number;
  thirteenth_month_pay: number;
  gross_pay: number;
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
  sss_employer: number;
  philhealth_employer: number;
  pagibig_employer: number;
  net_pay: number;
  status: "draft" | "computed" | "approved" | "paid" | "cancelled";
  adjustments_note: string | null;
  email_sent: boolean;
  email_sent_at: string | null;
  computed_at: string | null;
  approved_at: string | null;
  employee?: {
    id: number;
    first_name: string;
    last_name: string;
    full_name: string;
    department: string;
    job_category: string;
    basic_salary: string;
    email: string;
  };
  period?: PayrollPeriod;
  earnings?: PayslipLineItem[];
  deductions?: PayslipLineItem[];
}

export interface PayrollSummary {
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
  performed_by: number;
  before_values: Record<string, unknown> | null;
  after_values: Record<string, unknown> | null;
  description: string | null;
  ip_address: string | null;
  created_at: string;
  performer?: { id: number; name: string };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAccounting() {
  const [periods, setPeriods]       = useState<PayrollPeriod[]>([]);
  const [payslips, setPayslips]     = useState<Payslip[]>([]);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [summary, setSummary]       = useState<PayrollSummary | null>(null);
  const [auditLogs, setAuditLogs]   = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading]   = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const handleError = (err: unknown) => {
    setError(err instanceof Error ? err.message : "An error occurred");
  };

  // ─── Periods ───────────────────────────────────────────────────────────────

  const fetchPeriods = useCallback(async () => {
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch("/api/payroll-periods");
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed");
      setPeriods(body.data?.data ?? body.data ?? []);
    } catch (err) { handleError(err); }
    finally { setIsLoading(false); }
  }, []);

  const generateNextPeriod = useCallback(async (type: "semi_monthly" | "monthly") => {
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch("/api/payroll-periods/generate-next", {
        method: "POST", body: JSON.stringify({ type }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed");
      setPeriods(prev => [body.data, ...prev]);
      return body.data as PayrollPeriod;
    } catch (err) { handleError(err); throw err; }
    finally { setIsLoading(false); }
  }, []);

  // ─── Payslips ──────────────────────────────────────────────────────────────

  const fetchPayslips = useCallback(async (periodId: number) => {
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch(`/api/payslips?payroll_period_id=${periodId}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed");
      setPayslips(body.data?.data ?? body.data ?? []);
    } catch (err) { handleError(err); }
    finally { setIsLoading(false); }
  }, []);

  const fetchPayslip = useCallback(async (id: number) => {
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch(`/api/payslips/${id}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed");
      setSelectedPayslip(body.data);
    } catch (err) { handleError(err); }
    finally { setIsLoading(false); }
  }, []);

  const computeSingle = useCallback(async (employeeId: number, periodId: number) => {
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch("/api/payslips/compute", {
        method: "POST",
        body: JSON.stringify({ employee_id: employeeId, payroll_period_id: periodId }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to compute");
      const ps = body.data as Payslip;
      setPayslips(prev => {
        const exists = prev.find(p => p.id === ps.id);
        return exists ? prev.map(p => p.id === ps.id ? ps : p) : [ps, ...prev];
      });
      return ps;
    } catch (err) { handleError(err); throw err; }
    finally { setIsLoading(false); }
  }, []);

  const computeAll = useCallback(async (periodId: number) => {
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch("/api/payslips/compute-all", {
        method: "POST",
        body: JSON.stringify({ payroll_period_id: periodId }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed");
      await fetchPayslips(periodId);
      return body.data;
    } catch (err) { handleError(err); throw err; }
    finally { setIsLoading(false); }
  }, [fetchPayslips]);

  const approvePayslip = useCallback(async (id: number) => {
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch(`/api/payslips/${id}/approve`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed");
      setPayslips(prev => prev.map(p => p.id === id ? body.data : p));
    } catch (err) { handleError(err); throw err; }
    finally { setIsLoading(false); }
  }, []);

  const markPaid = useCallback(async (id: number) => {
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch(`/api/payslips/${id}/pay`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed");
      setPayslips(prev => prev.map(p => p.id === id ? body.data : p));
    } catch (err) { handleError(err); throw err; }
    finally { setIsLoading(false); }
  }, []);

  const addAdjustment = useCallback(async (
    id: number,
    data: { category: string; label: string; amount: number; note: string }
  ) => {
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch(`/api/payslips/${id}/adjust`, {
        method: "POST", body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed");
      setPayslips(prev => prev.map(p => p.id === id ? body.data : p));
      setSelectedPayslip(body.data);
    } catch (err) { handleError(err); throw err; }
    finally { setIsLoading(false); }
  }, []);

  const sendEmail = useCallback(async (id: number) => {
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch(`/api/payslips/${id}/send-email`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to send email");
      setPayslips(prev => prev.map(p => p.id === id ? { ...p, email_sent: true } : p));
      return body.message as string;
    } catch (err) { handleError(err); throw err; }
    finally { setIsLoading(false); }
  }, []);

  const bulkSendEmail = useCallback(async (periodId: number) => {
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch("/api/payslips/bulk-send-email", {
        method: "POST", body: JSON.stringify({ payroll_period_id: periodId }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed");
      return body.data;
    } catch (err) { handleError(err); throw err; }
    finally { setIsLoading(false); }
  }, []);

  // ─── Summary + Audit ───────────────────────────────────────────────────────

  const fetchSummary = useCallback(async (periodId: number) => {
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch(`/api/payslips/summary?payroll_period_id=${periodId}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed");
      setSummary(body.data);
    } catch (err) { handleError(err); }
    finally { setIsLoading(false); }
  }, []);

  const fetchAuditLogs = useCallback(async (periodId?: number) => {
    setIsLoading(true); setError(null);
    try {
      const params = periodId ? `?payroll_period_id=${periodId}` : "";
      const res  = await authFetch(`/api/payslips/audit-trail${params}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed");
      setAuditLogs(body.data?.data ?? body.data ?? []);
    } catch (err) { handleError(err); }
    finally { setIsLoading(false); }
  }, []);

  return {
    periods, payslips, selectedPayslip, summary, auditLogs, isLoading, error,
    fetchPeriods, generateNextPeriod,
    fetchPayslips, fetchPayslip, computeSingle, computeAll,
    approvePayslip, markPaid, addAdjustment,
    sendEmail, bulkSendEmail,
    fetchSummary, fetchAuditLogs,
    setSelectedPayslip, clearError: () => setError(null),
  };
}