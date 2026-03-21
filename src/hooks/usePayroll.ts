// src/hooks/usePayroll.ts
// Fix: import Payroll from @/types/payroll (single source of truth)
// Previously had a local Payroll interface causing type conflicts with PayrollTable/PayrollDrawer
import { useState, useCallback } from "react";
import { authFetch } from "./api";
import type { Payroll, PayrollSummary } from "@/types/payroll";

export type { Payroll, PayrollSummary };

export type PayrollStatus =
  | "draft" | "pending_approval" | "approved"
  | "processed" | "paid" | "failed";

export interface PayrollFilters {
  status?: PayrollStatus;
  month?: number;
  year?: number;
  employee_id?: number;
  search?: string;
  page?: number;
}

interface UsePayrollReturn {
  payrolls: Payroll[];
  selectedPayroll: Payroll | null;
  summary: PayrollSummary | null;
  isLoading: boolean;
  error: string | null;
  fetchPayrolls: (filters?: PayrollFilters) => Promise<void>;
  fetchPayroll: (id: number) => Promise<void>;
  fetchSummary: (year?: number, month?: number) => Promise<void>;
  calculatePayroll: (employeeId: number, periodStart: string, periodEnd: string) => Promise<Payroll>;
  updatePayroll: (id: number, data: Partial<Pick<Payroll, "overtime_pay" | "bonuses" | "allowances" | "other_deductions" | "notes">>) => Promise<void>;
  submitForApproval: (id: number) => Promise<void>;
  approvePayroll: (id: number) => Promise<void>;
  rejectPayroll: (id: number, reason: string) => Promise<void>;
  processPayroll: (id: number) => Promise<void>;
  markAsPaid: (id: number) => Promise<void>;
  deletePayroll: (id: number) => Promise<void>;
  clearSelectedPayroll: () => void;
  clearError: () => void;
}

export function usePayroll(): UsePayrollReturn {
  const [payrolls, setPayrolls]               = useState<Payroll[]>([]);
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
  const [summary, setSummary]                 = useState<PayrollSummary | null>(null);
  const [isLoading, setIsLoading]             = useState(false);
  const [error, setError]                     = useState<string | null>(null);

  const handleError = (err: unknown) => {
    const message = err instanceof Error ? err.message : "An error occurred";
    setError(message);
    console.error("Payroll error:", err);
  };

  // ─── Fetch ─────────────────────────────────────────────────────────────────

  const fetchPayrolls = useCallback(async (filters?: PayrollFilters) => {
    setIsLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      if (filters?.status)      params.append("status", filters.status);
      if (filters?.month)       params.append("month", String(filters.month));
      if (filters?.year)        params.append("year", String(filters.year));
      if (filters?.employee_id) params.append("employee_id", String(filters.employee_id));
      if (filters?.search)      params.append("search", filters.search);
      if (filters?.page)        params.append("page", String(filters.page));

      const res  = await authFetch(`/api/payrolls?${params.toString()}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to fetch payrolls");
      setPayrolls(body.data?.data ?? body.data ?? []);
    } catch (err) { handleError(err); }
    finally { setIsLoading(false); }
  }, []);

  const fetchPayroll = useCallback(async (id: number) => {
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch(`/api/payrolls/${id}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to fetch payroll");
      setSelectedPayroll(body.data);
    } catch (err) { handleError(err); }
    finally { setIsLoading(false); }
  }, []);

  const fetchSummary = useCallback(async (year?: number, month?: number) => {
    setIsLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      if (year)  params.append("year", String(year));
      if (month) params.append("month", String(month));
      const res  = await authFetch(`/api/payrolls/summary?${params.toString()}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to fetch summary");
      setSummary(body.data);
    } catch (err) { handleError(err); }
    finally { setIsLoading(false); }
  }, []);

  // ─── Create ────────────────────────────────────────────────────────────────

  const calculatePayroll = useCallback(async (
    employeeId: number,
    periodStart: string,
    periodEnd: string
  ): Promise<Payroll> => {
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch("/api/payrolls/calculate", {
        method: "POST",
        body: JSON.stringify({ employee_id: employeeId, pay_period_start: periodStart, pay_period_end: periodEnd }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to calculate payroll");
      setPayrolls((prev) => [body.data, ...prev]);
      return body.data as Payroll;
    } catch (err) { handleError(err); throw err; }
    finally { setIsLoading(false); }
  }, []);

  // ─── Update ────────────────────────────────────────────────────────────────

  const updatePayroll = useCallback(async (
    id: number,
    data: Partial<Pick<Payroll, "overtime_pay" | "bonuses" | "allowances" | "other_deductions" | "notes">>
  ) => {
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch(`/api/payrolls/${id}`, { method: "PATCH", body: JSON.stringify(data) });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to update payroll");
      setPayrolls((prev) => prev.map((p) => (p.id === id ? body.data : p)));
      if (selectedPayroll?.id === id) setSelectedPayroll(body.data);
    } catch (err) { handleError(err); throw err; }
    finally { setIsLoading(false); }
  }, [selectedPayroll]);

  // ─── Workflow ──────────────────────────────────────────────────────────────

  const workflowAction = useCallback(async (
    id: number,
    endpoint: string,
    body?: Record<string, string>
  ) => {
    setIsLoading(true); setError(null);
    try {
      const res     = await authFetch(`/api/payrolls/${id}/${endpoint}`, {
        method: "POST",
        body: body ? JSON.stringify(body) : undefined,
      });
      const resBody = await res.json();
      if (!res.ok) throw new Error(resBody.message ?? `Action '${endpoint}' failed`);
      setPayrolls((prev) => prev.map((p) => (p.id === id ? resBody.data : p)));
      if (selectedPayroll?.id === id) setSelectedPayroll(resBody.data);
    } catch (err) { handleError(err); throw err; }
    finally { setIsLoading(false); }
  }, [selectedPayroll]);

  const submitForApproval = useCallback((id: number) => workflowAction(id, "submit"),                    [workflowAction]);
  const approvePayroll    = useCallback((id: number) => workflowAction(id, "approve"),                   [workflowAction]);
  const rejectPayroll     = useCallback((id: number, reason: string) => workflowAction(id, "reject", { reason }), [workflowAction]);
  const processPayroll    = useCallback((id: number) => workflowAction(id, "process"),                   [workflowAction]);
  const markAsPaid        = useCallback((id: number) => workflowAction(id, "mark-paid"),                 [workflowAction]);

  // ─── Delete ────────────────────────────────────────────────────────────────

  const deletePayroll = useCallback(async (id: number) => {
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch(`/api/payrolls/${id}`, { method: "DELETE" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to delete payroll");
      setPayrolls((prev) => prev.filter((p) => p.id !== id));
      if (selectedPayroll?.id === id) setSelectedPayroll(null);
    } catch (err) { handleError(err); throw err; }
    finally { setIsLoading(false); }
  }, [selectedPayroll]);

  const clearSelectedPayroll = useCallback(() => setSelectedPayroll(null), []);
  const clearError           = useCallback(() => setError(null), []);

  return {
    payrolls, selectedPayroll, summary, isLoading, error,
    fetchPayrolls, fetchPayroll, fetchSummary,
    calculatePayroll, updatePayroll,
    submitForApproval, approvePayroll, rejectPayroll, processPayroll, markAsPaid,
    deletePayroll, clearSelectedPayroll, clearError,
  };
}