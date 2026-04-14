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
  notes?: string;
  approved_by?: number;
  approved_at?: string;
  processed_by?: number;
  processed_at?: string;
  payslips_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Payslip {
  id: number;
  payroll_period_id: number;
  employee_id: number;
  employee?: {
    id: number;
    first_name: string;
    last_name: string;
    full_name?: string;
    department: string;
    job_category: string;
    basic_salary: number;
    email?: string;
  };
  period?: PayrollPeriod;
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
  adjustments_note?: string;
  pdf_path?: string;
  email_sent: boolean;
  email_sent_at?: string;
  computed_by?: number;
  computed_at?: string;
  approved_by?: number;
  approved_at?: string;
  created_at: string;
  updated_at: string;
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
  performer?: { id: number; name: string; email: string };
  before_values?: Record<string, unknown>;
  after_values?: Record<string, unknown>;
  description?: string;
  created_at: string;
}

export interface ComputeResult {
  success: { employee_id: number; name: string; net_pay: number }[];
  failed:  { employee_id?: number; name: string; error: string }[];
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAccounting() {
  const [periods,         setPeriods]         = useState<PayrollPeriod[]>([]);
  const [payslips,        setPayslips]        = useState<Payslip[]>([]);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [summary,         setSummary]         = useState<PayrollSummary | null>(null);
  const [auditLogs,       setAuditLogs]       = useState<AuditLog[]>([]);
  const [isLoading,       setIsLoading]       = useState(false);
  const [error,           setError]           = useState<string | null>(null);

  // ─── Generic fetch wrapper ────────────────────────────────────────────────

  const call = useCallback(async <T>(fn: () => Promise<Response>): Promise<T> => {
    setIsLoading(true);
    setError(null);
    try {
      const res  = await fn();
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? `HTTP ${res.status}`);
      return (body.data ?? body) as T;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Request failed";
      setError(msg);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ─── Periods ──────────────────────────────────────────────────────────────

  const fetchPeriods = useCallback(async () => {
    const data = await call<{ data: PayrollPeriod[] } | PayrollPeriod[]>(
      () => authFetch("/api/payroll-periods")
    );
    const list = Array.isArray(data) ? data : ((data as { data?: PayrollPeriod[] }).data ?? []);
    setPeriods(list);
  }, [call]);

  const createPeriod = useCallback(async (payload: {
    type: string; period_start: string; period_end: string; label: string;
  }) => {
    const p = await call<PayrollPeriod>(() =>
      authFetch("/api/payroll-periods", { method: "POST", body: JSON.stringify(payload) })
    );
    setPeriods(prev => [p, ...prev]);
    return p;
  }, [call]);

  const generateNextPeriod = useCallback(async (type = "semi_monthly") => {
    const p = await call<PayrollPeriod>(() =>
      authFetch(`/api/payroll-periods/generate-next?type=${type}`, { method: "POST" })
    );
    setPeriods(prev => [p, ...prev]);
    return p;
  }, [call]);

  // ─── Payslips ─────────────────────────────────────────────────────────────

  const fetchPayslips = useCallback(async (periodId?: number) => {
    const params = periodId ? `?payroll_period_id=${periodId}&per_page=100` : "?per_page=100";
    const data   = await call<{ data: Payslip[] } | Payslip[]>(() =>
      authFetch(`/api/payslips${params}`)
    );
    setPayslips(Array.isArray(data) ? data : ((data as { data?: Payslip[] }).data ?? []));
  }, [call]);

  const fetchPayslip = useCallback(async (id: number) => {
    const p = await call<Payslip>(() => authFetch(`/api/payslips/${id}`));
    setSelectedPayslip(p);
    return p;
  }, [call]);

  const computeSingle = useCallback(async (employeeId: number, periodId: number) => {
    return call<Payslip>(() =>
      authFetch("/api/payslips/compute", {
        method: "POST",
        body: JSON.stringify({ employee_id: employeeId, payroll_period_id: periodId }),
      })
    );
  }, [call]);

  const computeAll = useCallback(async (periodId: number) => {
    const result = await call<ComputeResult>(() =>
      authFetch("/api/payslips/compute-all", {
        method: "POST",
        body: JSON.stringify({ payroll_period_id: periodId }),
      })
    );
    await fetchPayslips(periodId);
    return result;
  }, [call, fetchPayslips]);

  const addAdjustment = useCallback(async (
    payslipId: number,
    category: "earning" | "deduction",
    label: string,
    amount: number,
    note: string,
  ) => {
    const updated = await call<Payslip>(() =>
      authFetch(`/api/payslips/${payslipId}/adjust`, {
        method: "POST",
        body: JSON.stringify({ category, label, amount, note }),
      })
    );
    setPayslips(prev => prev.map(p => (p.id === payslipId ? updated : p)));
    if (selectedPayslip?.id === payslipId) setSelectedPayslip(updated);
    return updated;
  }, [call, selectedPayslip]);

  const approvePayslip = useCallback(async (id: number) => {
    const updated = await call<Payslip>(() =>
      authFetch(`/api/payslips/${id}/approve`, { method: "POST" })
    );
    setPayslips(prev => prev.map(p => (p.id === id ? updated : p)));
    if (selectedPayslip?.id === id) setSelectedPayslip(updated);
  }, [call, selectedPayslip]);

  const markAsPaid = useCallback(async (id: number) => {
    const updated = await call<Payslip>(() =>
      authFetch(`/api/payslips/${id}/pay`, { method: "POST" })
    );
    setPayslips(prev => prev.map(p => (p.id === id ? updated : p)));
    if (selectedPayslip?.id === id) setSelectedPayslip(updated);
  }, [call, selectedPayslip]);

  const approveAll = useCallback(async (periodId: number) => {
    const result = await call<{ count: number }>(() =>
      authFetch(`/api/payslips/approve-all/${periodId}`, { method: "POST" })
    );
    await fetchPayslips(periodId);
    return result;
  }, [call, fetchPayslips]);

  // ─── Summary & Audit ──────────────────────────────────────────────────────

  const fetchSummary = useCallback(async (periodId: number) => {
    const data = await call<PayrollSummary>(() =>
      authFetch(`/api/payslips/summary?payroll_period_id=${periodId}`)
    );
    setSummary(data);
  }, [call]);

  const fetchAuditLogs = useCallback(async (periodId?: number) => {
    const params = periodId ? `?payroll_period_id=${periodId}` : "";
    const data   = await call<{ data: AuditLog[] } | AuditLog[]>(() =>
      authFetch(`/api/payslips/audit-trail${params}`)
    );
    setAuditLogs(Array.isArray(data) ? data : ((data as { data?: AuditLog[] }).data ?? []));
  }, [call]);

  // ─── Email ────────────────────────────────────────────────────────────────

  const sendEmail = useCallback(async (payslipId: number) => {
    await call(() => authFetch(`/api/payslips/${payslipId}/send-email`, { method: "POST" }));
    setPayslips(prev => prev.map(p => (p.id === payslipId ? { ...p, email_sent: true } : p)));
  }, [call]);

  const bulkSendEmail = useCallback(async (periodId: number) => {
    return call<{ sent_count: number; failed_count: number }>(() =>
      authFetch("/api/payslips/bulk-send-email", {
        method: "POST",
        body: JSON.stringify({ payroll_period_id: periodId }),
      })
    );
  }, [call]);

  // ─── PDF downloads ────────────────────────────────────────────────────────

  /**
   * Download a single payslip PDF.
   * Uses authFetch so Sanctum auth headers are included automatically.
   */
  const downloadPdf = useCallback(async (payslipId: number) => {
    try {
      const res = await authFetch(`/api/payslips/${payslipId}/pdf`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob     = await res.blob();
      const url      = URL.createObjectURL(blob);
      const a        = document.createElement("a");
      a.href         = url;
      a.download     = `payslip_${payslipId}.pdf`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      setError(e instanceof Error ? e.message : "PDF download failed");
    }
  }, []);

  /**
   * Download the payroll summary PDF / HTML report for a period.
   * ✅ FIXED: uses authFetch (not window.open / localStorage token)
   *    so Sanctum cookie/bearer auth works correctly.
   *    The route is now inside auth:sanctum on the backend.
   */
  const downloadSummaryPdf = useCallback(async (periodId: number, periodLabel?: string) => {
    try {
      const res = await authFetch(`/api/payroll-periods/${periodId}/summary-pdf`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { message?: string }).message ?? `HTTP ${res.status}`);
      }
      const blob        = await res.blob();
      const url         = URL.createObjectURL(blob);
      const a           = document.createElement("a");
      a.href            = url;
      const safeName    = (periodLabel ?? String(periodId)).replace(/[^a-zA-Z0-9_\- ]/g, "_");
      // Content-Disposition header tells us .pdf or .html depending on whether DomPDF is installed
      const disposition = res.headers.get("content-disposition") ?? "";
      const ext         = disposition.includes(".html") ? "html" : "pdf";
      a.download        = `payroll_summary_${safeName}.${ext}`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      setError(e instanceof Error ? e.message : "PDF download failed");
      throw e;
    }
  }, []);

  return {
    // State
    periods, payslips, selectedPayslip, summary, auditLogs, isLoading, error,
    // Periods
    fetchPeriods, createPeriod, generateNextPeriod,
    // Payslips
    fetchPayslips, fetchPayslip, computeSingle, computeAll,
    addAdjustment, approvePayslip, markAsPaid, approveAll,
    // Summary & Audit
    fetchSummary, fetchAuditLogs,
    // Email
    sendEmail, bulkSendEmail,
    // PDF
    downloadPdf,
    downloadSummaryPdf,
    // Utils
    clearSelected: () => setSelectedPayslip(null),
    clearError:    () => setError(null),
  };
}