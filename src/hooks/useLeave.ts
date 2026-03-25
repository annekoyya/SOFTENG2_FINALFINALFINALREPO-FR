import { useState, useCallback } from "react";
import { authFetch } from "./api";
import type { LeaveBalance, LeaveRequest, LeaveStatus, LeaveType } from "@/types/leave";

const BASE = "/api";

export function useLeave() {
  const [balances, setBalances]     = useState<LeaveBalance[]>([]);
  const [requests, setRequests]     = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading]   = useState(false);
  const [error, setError]           = useState<string | null>(null);

  // ── Balances ────────────────────────────────────────────────────────────────

  const fetchBalances = useCallback(async (employeeId?: number, year?: number) => {
    setIsLoading(true);
    try {
      const p = new URLSearchParams();
      if (employeeId) p.set("employee_id", String(employeeId));
      if (year)       p.set("year", String(year));
      const res  = await authFetch(`${BASE}/leave-balances?${p}`);
      const data = await res.json();
      setBalances(data);
    } catch (e: any) { setError(e.message); }
    finally { setIsLoading(false); }
  }, []);

  const adjustBalance = useCallback(async (
    employeeId: number,
    leaveType: LeaveType,
    adjustment: number,
    reason: string
  ) => {
    const res = await authFetch(`${BASE}/leave-balances/adjust`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employee_id: employeeId, leave_type: leaveType, adjustment, reason }),
    });
    if (!res.ok) throw new Error("Failed to adjust balance");
    return res.json();
  }, []);

  const runAccrual = useCallback(async () => {
    const res = await authFetch(`${BASE}/leave-balances/accrue`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to run accrual");
    return res.json();
  }, []);

  const runCarryOver = useCallback(async () => {
    const res = await authFetch(`${BASE}/leave-balances/carry-over`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to run carry-over");
    return res.json();
  }, []);

  // ── Requests ────────────────────────────────────────────────────────────────

  const fetchRequests = useCallback(async (filters?: {
    employee_id?: number;
    status?: LeaveStatus;
    leave_type?: LeaveType;
  }) => {
    setIsLoading(true);
    try {
      const p = new URLSearchParams();
      if (filters?.employee_id) p.set("employee_id", String(filters.employee_id));
      if (filters?.status)      p.set("status", filters.status);
      if (filters?.leave_type)  p.set("leave_type", filters.leave_type);
      const res  = await authFetch(`${BASE}/leave-requests?${p}`);
      const data = await res.json();
      setRequests(data);
    } catch (e: any) { setError(e.message); }
    finally { setIsLoading(false); }
  }, []);

  const submitRequest = useCallback(async (payload: {
    leave_type: LeaveType;
    start_date: string;
    end_date: string;
    reason: string;
  }) => {
    const res = await authFetch(`${BASE}/leave-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to submit leave request");
    return res.json();
  }, []);

  const approveRequest = useCallback(async (id: number) => {
    const res = await authFetch(`${BASE}/leave-requests/${id}/approve`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to approve");
    return res.json();
  }, []);

  const rejectRequest = useCallback(async (id: number, reason: string) => {
    const res = await authFetch(`${BASE}/leave-requests/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) throw new Error("Failed to reject");
    return res.json();
  }, []);

  const cancelRequest = useCallback(async (id: number) => {
    const res = await authFetch(`${BASE}/leave-requests/${id}/cancel`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to cancel");
    return res.json();
  }, []);

  return {
    balances, requests, isLoading, error,
    fetchBalances, adjustBalance, runAccrual, runCarryOver,
    fetchRequests, submitRequest, approveRequest, rejectRequest, cancelRequest,
  };
}