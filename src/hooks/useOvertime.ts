import { useState, useCallback } from "react";
import { authFetch } from "./api";
import type { OvertimeRequest, OvertimeStats, OvertimeStatus } from "@/types/overtime";

export function useOvertime() {
  const [requests, setRequests] = useState<OvertimeRequest[]>([]);
  const [stats,    setStats]    = useState<OvertimeStats | null>(null);
  const [isLoading, setLoading] = useState(false);

  const fetchRequests = useCallback(async (filters?: {
    employee_id?: number;
    status?: OvertimeStatus;
    month?: string; // YYYY-MM
  }) => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (filters?.employee_id) p.set("employee_id", String(filters.employee_id));
      if (filters?.status)      p.set("status", filters.status);
      if (filters?.month)       p.set("month", filters.month);
      const res  = await authFetch(`/api/overtime-requests?${p}`);
      setRequests(await res.json());
    } finally { setLoading(false); }
  }, []);

  const fetchStats = useCallback(async () => {
    const res = await authFetch("/api/overtime-requests/stats");
    setStats(await res.json());
  }, []);

  const submitRequest = useCallback(async (payload: {
    date: string;
    overtime_type: string;
    hours_requested: number;
    reason: string;
  }) => {
    const res = await authFetch("/api/overtime-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to submit");
    return res.json();
  }, []);

  const approve = useCallback(async (id: number, hoursApproved: number) => {
    const res = await authFetch(`/api/overtime-requests/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hours_approved: hoursApproved }),
    });
    if (!res.ok) throw new Error("Failed to approve");
    return res.json();
  }, []);

  const reject = useCallback(async (id: number, reason: string) => {
    const res = await authFetch(`/api/overtime-requests/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) throw new Error("Failed to reject");
    return res.json();
  }, []);

  return {
    requests, stats, isLoading,
    fetchRequests, fetchStats, submitRequest, approve, reject,
  };
}