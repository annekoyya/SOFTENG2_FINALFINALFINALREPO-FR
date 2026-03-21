import { useState, useCallback } from "react";
import {
  Attendance,
  LeaveRequest,
  LiveWorkforceStatus,
  AttendanceSummary,
  MonthlyStatistics,
} from "@/types/attendance";

interface UseAttendanceReturn {
  liveStatus: LiveWorkforceStatus | null;
  attendances: Attendance[];
  leaveRequests: LeaveRequest[];
  summary: AttendanceSummary | null;
  monthlyStats: MonthlyStatistics | null;
  isLoading: boolean;
  error: string | null;
  fetchLiveStatus: () => Promise<void>;
  fetchAttendance: (startDate?: string, endDate?: string, filters?: Record<string, string>) => Promise<void>;
  clockIn: (employeeId?: string) => Promise<void>;
  clockOut: (employeeId?: string) => Promise<void>;
  fetchLeaveRequests: () => Promise<void>;
  createLeaveRequest: (data: Partial<LeaveRequest>) => Promise<void>;
  approveLeaveRequest: (id: string, reason?: string) => Promise<void>;
  rejectLeaveRequest: (id: string, reason?: string) => Promise<void>;
  getSummary: (month?: string, year?: string) => Promise<void>;
  getMonthlyStats: (month: number, year: number) => Promise<void>;
}

export function useAttendance(): UseAttendanceReturn {
  const [liveStatus, setLiveStatus] = useState<LiveWorkforceStatus | null>(null);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = (err: unknown) => {
    const message = err instanceof Error ? err.message : "An error occurred";
    setError(message);
    console.error("Attendance error:", err);
  };

  const fetchLiveStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/attendance/live-status");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setLiveStatus(data.data ?? data);
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAttendance = useCallback(
    async (startDate?: string, endDate?: string, filters?: Record<string, string>) => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (startDate) params.append("start_date", startDate);
        if (endDate) params.append("end_date", endDate);
        if (filters?.status) params.append("status", filters.status);
        if (filters?.employee_id) params.append("employee_id", filters.employee_id);
        if (filters?.page) params.append("page", filters.page);
        if (filters?.per_page) params.append("per_page", filters.per_page);

        const response = await fetch(`/api/attendance?${params.toString()}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        setAttendances(data.data?.data ?? data.data ?? data);
      } catch (err) {
        handleError(err);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const clockIn = useCallback(
    async (employeeId?: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/attendance/clock-in", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employee_id: employeeId ?? localStorage.getItem("currentEmployeeId") ?? "",
            device_info: navigator.userAgent,
          }),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        await fetchLiveStatus();
      } catch (err) {
        handleError(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchLiveStatus]
  );

  const clockOut = useCallback(
    async (employeeId?: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/attendance/clock-out", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employee_id: employeeId ?? localStorage.getItem("currentEmployeeId") ?? "",
            device_info: navigator.userAgent,
          }),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        await fetchLiveStatus();
      } catch (err) {
        handleError(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchLiveStatus]
  );

  // ─── FIX: fetchLeaveRequests declared BEFORE createLeaveRequest ──────────
  // Original bug: createLeaveRequest's useCallback dep array referenced
  // fetchLeaveRequests on line 147, but it was only declared on line 149.
  // JS `const` is not hoisted — using it before declaration = ReferenceError.

  const fetchLeaveRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/leave-requests");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setLeaveRequests(Array.isArray(data) ? data : (data.data ?? []));
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createLeaveRequest = useCallback(
    async (data: Partial<LeaveRequest>) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/leave-requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        await fetchLeaveRequests();
      } catch (err) {
        handleError(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchLeaveRequests]
  );

  const approveLeaveRequest = useCallback(
    async (id: string, reason?: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/leave-requests/${id}/approve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason }),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        await fetchLeaveRequests();
      } catch (err) {
        handleError(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchLeaveRequests]
  );

  const rejectLeaveRequest = useCallback(
    async (id: string, reason?: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/leave-requests/${id}/reject`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason }),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        await fetchLeaveRequests();
      } catch (err) {
        handleError(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchLeaveRequests]
  );

  const getSummary = useCallback(async (month?: string, year?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (month) params.append("month", month);
      if (year) params.append("year", year);
      const response = await fetch(`/api/attendance/summary?${params.toString()}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setSummary(data.data ?? data);
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getMonthlyStats = useCallback(async (month: number, year: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/attendance/monthly-stats?month=${month}&year=${year}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setMonthlyStats(data.data ?? data);
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    liveStatus,
    attendances,
    leaveRequests,
    summary,
    monthlyStats,
    isLoading,
    error,
    fetchLiveStatus,
    fetchAttendance,
    clockIn,
    clockOut,
    fetchLeaveRequests,
    createLeaveRequest,
    approveLeaveRequest,
    rejectLeaveRequest,
    getSummary,
    getMonthlyStats,
  };
}